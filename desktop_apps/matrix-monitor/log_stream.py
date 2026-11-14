"""Asynchronous live Linux system log streamer backed by systemd journalctl."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass
from datetime import datetime
import json
import time

from PySide6.QtCore import QObject, QProcess, QTimer, Signal


@dataclass(frozen=True)
class LogEntry:
    """Single parsed system log line."""

    timestamp: str
    unit: str
    message: str
    priority: int  # 0..7 syslog priority (<=3 error, 4 warn, >=5 info)
    received_at: float


def _decode_message(raw: object) -> str:
    if isinstance(raw, str):
        return " ".join(raw.splitlines()).strip()
    if isinstance(raw, list):
        try:
            text = bytes(int(b) & 0xFF for b in raw).decode("utf-8", errors="replace")
            return " ".join(text.splitlines()).strip()
        except Exception:
            return str(raw)
    return str(raw or "").strip()


class JournalLogStreamer(QObject):
    """Streams live journalctl JSON lines in the background via QProcess."""

    logs_updated = Signal()

    def __init__(self, max_entries: int = 240, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self.entries: deque[LogEntry] = deque(maxlen=max_entries)
        self.paused = False
        self.source_label = "JOURNALCTL // LIVE"
        self._stopping = False
        self._restart_scheduled = False
        self._buffer = bytearray()
        self._process = QProcess(self)
        self._process.setProcessChannelMode(QProcess.ProcessChannelMode.MergedChannels)
        self._process.readyReadStandardOutput.connect(self._on_ready_read)
        self._process.errorOccurred.connect(self._on_process_error)
        self._process.finished.connect(self._on_process_finished)

    def start(self) -> None:
        """Start streaming systemd journal entries."""
        self._stopping = False
        self._restart_scheduled = False
        if not self.entries:
            self.entries.append(
                LogEntry(
                    timestamp=datetime.now().strftime("%H:%M:%S"),
                    unit="matrix-mon",
                    message="Attaching live systemd journal stream...",
                    priority=6,
                    received_at=time.monotonic(),
                )
            )
        if self._process.state() == QProcess.ProcessState.NotRunning:
            self._process.start(
                "journalctl",
                ["-f", "-n", "120", "-o", "json", "--no-pager"],
            )

    def stop(self) -> None:
        """Terminate the background journalctl process cleanly."""
        self._stopping = True
        if self._process.state() != QProcess.ProcessState.NotRunning:
            self._process.terminate()
            if not self._process.waitForFinished(1200):
                self._process.kill()
                self._process.waitForFinished(500)

    def toggle_pause(self) -> bool:
        """Toggle pause state for incoming log updates."""
        self.paused = not self.paused
        return self.paused

    def _on_ready_read(self) -> None:
        chunk = bytes(self._process.readAllStandardOutput())
        if not chunk:
            return
        self._buffer.extend(chunk)
        updated = False
        while True:
            nl = self._buffer.find(b"\n")
            if nl < 0:
                break
            raw_line = bytes(self._buffer[:nl]).strip()
            del self._buffer[: nl + 1]
            if not raw_line or self.paused:
                continue
            entry = self._parse_line(raw_line)
            if entry is not None:
                self.entries.append(entry)
                updated = True

        if updated:
            self.logs_updated.emit()

    def _parse_line(self, raw_line: bytes) -> LogEntry | None:
        text = raw_line.decode("utf-8", errors="replace")
        try:
            obj = json.loads(text)
        except json.JSONDecodeError:
            return LogEntry(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                unit="journal",
                message=text,
                priority=6,
                received_at=time.monotonic(),
            )

        us_raw = obj.get("__REALTIME_TIMESTAMP")
        if us_raw:
            try:
                dt = datetime.fromtimestamp(int(us_raw) / 1_000_000.0)
                ts = dt.strftime("%H:%M:%S")
            except ValueError, OSError:
                ts = datetime.now().strftime("%H:%M:%S")
        else:
            ts = datetime.now().strftime("%H:%M:%S")

        unit = (
            obj.get("SYSLOG_IDENTIFIER")
            or obj.get("_COMM")
            or obj.get("_SYSTEMD_UNIT")
            or obj.get("_TRANSPORT")
            or "system"
        )
        unit = str(unit).removesuffix(".service")

        msg = _decode_message(obj.get("MESSAGE"))
        if not msg:
            return None

        try:
            prio = int(obj.get("PRIORITY", 6))
        except ValueError, TypeError:
            prio = 6

        return LogEntry(
            timestamp=ts,
            unit=unit,
            message=msg,
            priority=prio,
            received_at=time.monotonic(),
        )

    def _on_process_error(self, _error: QProcess.ProcessError) -> None:
        if self._stopping:
            return
        self.source_label = "JOURNALCTL // RETRY"
        self.entries.append(
            LogEntry(
                timestamp=datetime.now().strftime("%H:%M:%S"),
                unit="matrix-mon",
                message="journalctl unavailable; check systemd-journal permissions.",
                priority=4,
                received_at=time.monotonic(),
            )
        )
        self.logs_updated.emit()

    def _on_process_finished(self, exit_code: int, _status: QProcess.ExitStatus) -> None:
        if self._stopping:
            return
        if exit_code != 0:
            self.entries.append(
                LogEntry(
                    timestamp=datetime.now().strftime("%H:%M:%S"),
                    unit="matrix-mon",
                    message=f"journal stream exited (code {exit_code}); reconnecting...",
                    priority=4,
                    received_at=time.monotonic(),
                )
            )
            self.logs_updated.emit()
        if not self._restart_scheduled:
            self._restart_scheduled = True
            QTimer.singleShot(2500, self._reconnect)

    def _reconnect(self) -> None:
        self._restart_scheduled = False
        if not self._stopping:
            self.source_label = "JOURNALCTL // LIVE"
            self.start()
