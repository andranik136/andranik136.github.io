"""Unit tests for Matrix System Monitor core modules."""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys
import tempfile
import unittest

APP_ROOT = Path(__file__).resolve().parent.parent
if str(APP_ROOT) not in sys.path:
    sys.path.insert(0, str(APP_ROOT))

os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

from PySide6.QtWidgets import QApplication

from log_stream import JournalLogStreamer, _decode_message
from metrics import TelemetryCollector, format_bytes_rate, format_gib, format_uptime
from settings import AppSettings, load_settings, save_settings
from theme import COLOR_PRESETS, MatrixPalette


class TestFormattingAndMetrics(unittest.TestCase):
    def test_format_bytes_rate_units(self) -> None:
        self.assertEqual(format_bytes_rate(512).strip(), "512 B/s")
        self.assertEqual(format_bytes_rate(2048).strip(), "2.0 KiB/s")
        self.assertEqual(format_bytes_rate(5 * 1024 * 1024).strip(), "5.00 MiB/s")

    def test_format_gib_and_uptime(self) -> None:
        self.assertEqual(format_gib(2 * (1024**3)), "2.0 GiB")
        self.assertEqual(format_uptime(3661), "01:01:01")
        self.assertEqual(format_uptime(90061), "1d 01:01:01")

    def test_collector_history_bounds(self) -> None:
        collector = TelemetryCollector(history_len=5)
        for _ in range(8):
            snap = collector.sample()
        self.assertEqual(len(snap.cpu_history), 5)
        self.assertEqual(len(snap.ram_history), 5)
        self.assertEqual(len(snap.net_rx_history), 5)
        self.assertGreater(snap.ram_total_bytes, 0)


class TestSettingsPersistence(unittest.TestCase):
    def test_roundtrip_and_corrupt_recovery(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            cfg = Path(tmp) / "sub" / "settings.json"
            original = AppSettings(
                theme="Cyber Cyan",
                use_24h=False,
                gpu_chart_mode="disk",
                preferred_output="DP-2",
                fullscreen=True,
            )
            self.assertTrue(save_settings(original, cfg))
            loaded = load_settings(cfg)
            self.assertEqual(loaded, original)

            # Corrupt file falls back cleanly to defaults
            cfg.write_text("{not valid json", encoding="utf-8")
            fallback = load_settings(cfg)
            self.assertEqual(fallback, AppSettings())


class TestThemePresets(unittest.TestCase):
    def test_all_presets_apply_and_restore(self) -> None:
        for name, hex_val in COLOR_PRESETS:
            MatrixPalette.apply_preset(name)
            self.assertEqual(MatrixPalette.PRESET_NAME, name)
            self.assertEqual(MatrixPalette.PRIMARY.name().lower(), hex_val.lower())
        MatrixPalette.apply_preset("Unknown Preset")
        self.assertEqual(MatrixPalette.PRESET_NAME, COLOR_PRESETS[0][0])


class TestLogParsing(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls._app = QApplication.instance() or QApplication([])

    def test_decode_message_variants(self) -> None:
        self.assertEqual(_decode_message("hello\nworld"), "hello world")
        self.assertEqual(_decode_message([79, 75, 10]), "OK")

    def test_parse_journal_json_line(self) -> None:
        streamer = JournalLogStreamer()
        payload = json.dumps(
            {
                "__REALTIME_TIMESTAMP": "1794687034386010",
                "SYSLOG_IDENTIFIER": "systemd",
                "PRIORITY": "4",
                "MESSAGE": "Test warning event",
            }
        ).encode("utf-8")
        entry = streamer._parse_line(payload)
        self.assertIsNotNone(entry)
        assert entry is not None
        self.assertEqual(entry.unit, "systemd")
        self.assertEqual(entry.priority, 4)
        self.assertEqual(entry.message, "Test warning event")


if __name__ == "__main__":
    unittest.main()
