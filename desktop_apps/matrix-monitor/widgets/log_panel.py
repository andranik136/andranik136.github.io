"""Non-scrolling live streaming system log panel styled as a Matrix terminal."""

from __future__ import annotations

import time
from typing import Sequence
from PySide6.QtCore import QRectF, Qt, QTimer
from PySide6.QtGui import QColor, QFontMetricsF, QPainter
from PySide6.QtWidgets import QSizePolicy, QWidget

from log_stream import LogEntry
from theme import MatrixPalette, draw_matrix_panel, make_mono_font


class LogStreamPanel(QWidget):
    """Displays live system logs sized dynamically to fit with zero scrollbars."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self._entries: Sequence[LogEntry] = ()
        self.paused = False
        self.source_label = "LIVE"
        self._blink_on = True

        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setMinimumSize(220, 120)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

        self._blink_timer = QTimer(self)
        self._blink_timer.setInterval(550)
        self._blink_timer.timeout.connect(self._on_blink)
        self._blink_timer.start()

    def set_entries(self, entries: Sequence[LogEntry], paused: bool, source_label: str) -> None:
        """Update displayed log buffer reference and trigger repaint."""
        self._entries = entries
        self.paused = paused
        self.source_label = source_label
        self.update()

    def _on_blink(self) -> None:
        self._blink_on = not self._blink_on
        self.update()

    def paintEvent(self, _event) -> None:
        painter = QPainter(self)
        w = float(self.width())
        h = float(self.height())
        if w < 60 or h < 60:
            return

        header_h = max(18.0, min(26.0, h * 0.065))
        status = "PAUSED [SPACE]" if self.paused else f"{self.source_label} • {len(self._entries)}"
        inner = draw_matrix_panel(
            painter,
            QRectF(0.0, 0.0, w, h),
            "[ SYS_LOG // STREAM ]",
            right_tag=status,
            header_height=header_h,
        )

        pad_x = max(8.0, min(14.0, inner.width() * 0.02))
        pad_y = max(6.0, min(10.0, inner.height() * 0.02))
        log_rect = inner.adjusted(pad_x, pad_y, -pad_x, -pad_y)

        # Dynamic monospace font scaling so logs stay readable without overflowing
        font_pt = max(7.5, min(10.5, min(log_rect.width() / 62.0, log_rect.height() / 22.0) * 1.15))
        font = make_mono_font(font_pt, bold=False)
        bold_font = make_mono_font(font_pt, bold=True)
        painter.setFont(font)

        fm = QFontMetricsF(font)
        line_h = max(12.0, fm.height() + 2.5)
        # Reserve 1 bottom row for the Matrix cursor prompt
        max_rows = max(1, int(log_rect.height() // line_h) - 1)

        visible = list(self._entries)[-max_rows:] if self._entries else []
        now_mono = time.monotonic()

        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)
        ts_w = fm.horizontalAdvance("00:00:00 ")
        unit_chars = 12 if log_rect.width() > 380 else 9
        unit_sample = "[" + ("M" * unit_chars) + "] "
        unit_w = fm.horizontalAdvance(unit_sample)
        msg_x = log_rect.left() + ts_w + unit_w
        msg_w = max(20.0, log_rect.right() - msg_x)

        y = log_rect.top()
        for entry in visible:
            row_rect = QRectF(log_rect.left(), y, log_rect.width(), line_h)
            age = max(0.0, now_mono - entry.received_at)

            # Subtle pulse background for freshly received lines
            if age < 2.2:
                pulse_color = QColor(MatrixPalette.PRIMARY)
                pulse_color.setAlpha(int(38 * (1.0 - age / 2.2)))
                painter.fillRect(row_rect, pulse_color)

            # Timestamp
            painter.setFont(font)
            painter.setPen(MatrixPalette.TEXT_DIM)
            painter.drawText(
                QRectF(log_rect.left(), y, ts_w, line_h),
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft,
                entry.timestamp,
            )

            # Unit tag
            unit_txt = entry.unit[:unit_chars].ljust(unit_chars)
            if entry.priority <= 3:
                unit_color = MatrixPalette.ERR_TEXT
                msg_color = MatrixPalette.ERR_TEXT
            elif entry.priority == 4:
                unit_color = MatrixPalette.WARN_TEXT
                msg_color = MatrixPalette.WARN_TEXT
            elif age < 2.0:
                unit_color = MatrixPalette.PRIMARY
                msg_color = MatrixPalette.CORE
            else:
                unit_color = MatrixPalette.PRIMARY
                msg_color = MatrixPalette.TEXT_PRIMARY

            painter.setFont(bold_font)
            painter.setPen(unit_color)
            painter.drawText(
                QRectF(log_rect.left() + ts_w, y, unit_w, line_h),
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft,
                f"[{unit_txt}]",
            )

            # Message elided cleanly to fit width without horizontal overflow
            painter.setFont(font)
            painter.setPen(msg_color)
            elided = fm.elidedText(entry.message, Qt.TextElideMode.ElideRight, msg_w)
            painter.drawText(
                QRectF(msg_x, y, msg_w, line_h),
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft,
                elided,
            )

            y += line_h

        # Bottom Matrix terminal cursor prompt
        prompt_y = log_rect.top() + len(visible) * line_h
        if prompt_y + line_h <= log_rect.bottom() + 2:
            cursor_char = "█" if (self._blink_on and not self.paused) else " "
            prompt_text = f"root@bazzite:~# journalctl -f {cursor_char}"
            painter.setFont(font)
            painter.setPen(MatrixPalette.PRIMARY)
            painter.drawText(
                QRectF(log_rect.left(), prompt_y, log_rect.width(), line_h),
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft,
                prompt_text,
            )
