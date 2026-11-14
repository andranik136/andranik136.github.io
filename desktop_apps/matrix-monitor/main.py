#!/usr/bin/env python3
"""Matrix System Monitor — Retro black & vibrant phosphor telemetry app for Linux."""

from __future__ import annotations

import argparse
from pathlib import Path
import signal
import sys

from PySide6.QtCore import QRectF, QSize, Qt, QTimer
from PySide6.QtGui import QAction, QColor, QGuiApplication, QIcon, QKeySequence, QPainter, QPen, QPixmap, QShortcut
from PySide6.QtWidgets import (
    QApplication,
    QComboBox,
    QGridLayout,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMenu,
    QSizePolicy,
    QVBoxLayout,
    QWidget,
)

from log_stream import JournalLogStreamer
from metrics import TelemetryCollector, format_bytes_rate, format_gib
from settings import APP_ID, AppSettings, load_settings, save_settings
from theme import COLOR_PRESETS, MatrixPalette, get_mono_font_family, make_mono_font
from widgets.clock_calendar import ClockCalendarWidget
from widgets.history_graph import GraphSeries, HistoryGraphWidget
from widgets.log_panel import LogStreamPanel


def _make_swatch_icon(hex_color: str) -> QIcon:
    pm = QPixmap(10, 10)
    pm.fill(QColor(hex_color))
    return QIcon(pm)


def _find_screen_index_by_name(output_name: str) -> int | None:
    if not output_name:
        return None
    target = output_name.strip().lower()
    for idx, scr in enumerate(QGuiApplication.screens()):
        if scr.name().strip().lower() == target:
            return idx
    return None


class MatrixHeaderBar(QWidget):
    """Thin top command bar with system identity, hints, and color theme dropdown."""

    def __init__(self, on_theme_selected, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.left_text = "MATRIX_SYS_MON // LINUX"
        self.hint_text = "[F11] FULL  [M] MON  [T] 12/24H  [G] GPU/DISK  [SPACE] LOGS  [Q] QUIT"
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Fixed)
        self.setFixedHeight(28)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 2, 8, 3)
        layout.setSpacing(10)

        self._status_lbl = QLabel(self.left_text, self)
        self._status_lbl.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Preferred)
        layout.addWidget(self._status_lbl, stretch=1)

        self._hint_lbl = QLabel(self.hint_text, self)
        self._hint_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        layout.addWidget(self._hint_lbl)

        self._theme_lbl = QLabel("COLOR:", self)
        layout.addWidget(self._theme_lbl)

        self.theme_combo = QComboBox(self)
        self.theme_combo.setFocusPolicy(Qt.FocusPolicy.NoFocus)
        self.theme_combo.setIconSize(QSize(10, 10))
        self.theme_combo.setCursor(Qt.CursorShape.PointingHandCursor)
        for name, hex_val in COLOR_PRESETS:
            self.theme_combo.addItem(_make_swatch_icon(hex_val), name, name)
        self.theme_combo.currentIndexChanged.connect(
            lambda idx: on_theme_selected(self.theme_combo.itemData(idx))
        )
        layout.addWidget(self.theme_combo)

        self.refresh_theme()

    def set_status(
        self,
        os_name: str,
        kernel: str,
        screen_idx: int,
        screen_count: int,
        output_name: str = "",
    ) -> None:
        mon_tag = f"MON {screen_idx + 1}/{max(1, screen_count)}"
        if output_name:
            mon_tag = f"{mon_tag} ({output_name})"
        self.left_text = f"◆ MATRIX_MON // {os_name.upper()} // KERNEL {kernel} // {mon_tag}"
        self._status_lbl.setText(self.left_text)

    def resizeEvent(self, event) -> None:
        super().resizeEvent(event)
        w = self.width()
        if w > 1060:
            self._hint_lbl.setText(self.hint_text)
            self._hint_lbl.show()
        elif w > 720:
            self._hint_lbl.setText("[F11] FULL  [M] MON  [Q] QUIT")
            self._hint_lbl.show()
        else:
            self._hint_lbl.hide()

        font_pt = max(7.0, min(9.5, w / 145.0))
        self._status_lbl.setFont(make_mono_font(font_pt, bold=True))
        self._hint_lbl.setFont(make_mono_font(max(6.8, font_pt - 0.6), bold=False))
        self._theme_lbl.setFont(make_mono_font(max(7.0, font_pt - 0.3), bold=True))
        self.theme_combo.setFont(make_mono_font(max(7.0, font_pt - 0.3), bold=True))

    def refresh_theme(self) -> None:
        """Apply current MatrixPalette colors to header labels and dropdown."""
        primary = MatrixPalette.PRIMARY.name()
        bright = MatrixPalette.BRIGHT.name()
        dim_text = MatrixPalette.TEXT_DIM.name()
        border = MatrixPalette.BORDER_GLOW.name()
        panel_bg = MatrixPalette.BG_PANEL.name()
        sel_bg = MatrixPalette.BORDER_DIM.name()
        font_family = get_mono_font_family()

        self._status_lbl.setStyleSheet(f"color: {primary}; background: transparent;")
        self._hint_lbl.setStyleSheet(f"color: {dim_text}; background: transparent;")
        self._theme_lbl.setStyleSheet(f"color: {bright}; background: transparent;")
        self.theme_combo.setStyleSheet(
            f"""
            QComboBox {{
                background-color: #020402;
                color: {bright};
                border: 1px solid {border};
                padding: 1px 8px 1px 6px;
                min-width: 122px;
                font-family: "{font_family}";
            }}
            QComboBox:hover {{
                border: 1px solid {primary};
                color: {primary};
            }}
            QComboBox::drop-down {{
                border: none;
                width: 18px;
            }}
            QComboBox QAbstractItemView {{
                background-color: {panel_bg};
                color: {bright};
                border: 1px solid {primary};
                selection-background-color: {sel_bg};
                selection-color: {primary};
                outline: 0;
            }}
            """
        )
        self.update()

    def paintEvent(self, _event) -> None:
        painter = QPainter(self)
        w = float(self.width())
        h = float(self.height())
        painter.fillRect(QRectF(0.0, 0.0, w, h), MatrixPalette.BG_HEADER_TOP)
        painter.setPen(QPen(MatrixPalette.BORDER_GLOW, 1.0))
        painter.drawLine(0, int(h - 1), int(w), int(h - 1))


class MatrixMonitorWindow(QMainWindow):
    """Main fullscreen-ready, non-scrolling, dynamically resizing telemetry window."""

    def __init__(
        self,
        settings: AppSettings,
        initial_screen: int = 0,
        start_fullscreen: bool = False,
        persist_changes: bool = True,
    ) -> None:
        super().__init__()
        self.setWindowTitle("Matrix System Monitor")
        self._settings = settings
        self._persist_changes = persist_changes
        MatrixPalette.apply_preset(settings.theme)
        self.setStyleSheet("QMainWindow { background-color: #000000; }")

        self._screen_index = initial_screen
        self._is_portrait: bool | None = None
        self._gpu_chart_mode = settings.gpu_chart_mode if settings.gpu_chart_mode in ("gpu", "disk") else "gpu"

        self._root = QWidget(self)
        self._root.setStyleSheet("background-color: #000000;")
        self.setCentralWidget(self._root)

        fg_vbox = QVBoxLayout(self._root)
        fg_vbox.setContentsMargins(8, 6, 8, 8)
        fg_vbox.setSpacing(6)

        self._header = MatrixHeaderBar(self._on_theme_selected, self._root)
        idx = self._header.theme_combo.findData(MatrixPalette.PRESET_NAME)
        if idx >= 0:
            self._header.theme_combo.blockSignals(True)
            self._header.theme_combo.setCurrentIndex(idx)
            self._header.theme_combo.blockSignals(False)
        fg_vbox.addWidget(self._header)

        self._grid_host = QWidget(self._root)
        self._grid = QGridLayout(self._grid_host)
        self._grid.setContentsMargins(0, 0, 0, 0)
        self._grid.setSpacing(8)
        fg_vbox.addWidget(self._grid_host, stretch=1)

        # Telemetry panels (System Monitor History tab equivalent)
        self._cpu_graph = HistoryGraphWidget("[ CPU // HISTORY ]", y_unit="%", parent=self._grid_host)
        self._mem_graph = HistoryGraphWidget("[ MEM & SWAP // HISTORY ]", y_unit="%", parent=self._grid_host)
        self._net_graph = HistoryGraphWidget(
            "[ NET // HISTORY ]",
            y_unit="B/s",
            auto_scale=True,
            min_scale=64 * 1024.0,
            parent=self._grid_host,
        )
        self._gpu_disk_graph = HistoryGraphWidget(
            "[ GPU & DISK // HISTORY ]",
            y_unit="%",
            parent=self._grid_host,
        )

        # Right-hand panels: Time/Date + Calendar, and Streaming System Logs
        self._clock_cal = ClockCalendarWidget(parent=self._grid_host)
        self._clock_cal.use_24h = settings.use_24h
        self._log_panel = LogStreamPanel(parent=self._grid_host)

        # Data collectors
        self._collector = TelemetryCollector(history_len=90)
        self._logs = JournalLogStreamer(max_entries=240, parent=self)
        self._logs.logs_updated.connect(self._sync_logs)
        self._logs.start()

        # Sampling timer (1 Hz smooth telemetry)
        self._sample_timer = QTimer(self)
        self._sample_timer.setInterval(1000)
        self._sample_timer.timeout.connect(self._update_telemetry)
        self._sample_timer.start()

        # Initial layout & telemetry sample
        self._apply_responsive_layout(force=True)
        self._update_telemetry()
        self._sync_logs()
        self._setup_shortcuts()

        self.resize(1360, 820)
        self._move_to_screen(self._screen_index, fullscreen=start_fullscreen, save=False)

    def _save_preferences(self) -> None:
        if not self._persist_changes:
            return
        save_settings(self._settings)

    def _setup_shortcuts(self) -> None:
        bindings = [
            ("F11", self.toggle_fullscreen),
            ("F", self.toggle_fullscreen),
            ("M", self.cycle_screen),
            ("T", self._toggle_24h),
            ("G", self._toggle_gpu_disk_mode),
            ("Space", self._toggle_logs_pause),
            ("Escape", self._exit_fullscreen),
            ("Q", self.close),
            ("Ctrl+Q", self.close),
        ]
        for key, fn in bindings:
            sc = QShortcut(QKeySequence(key), self)
            sc.activated.connect(fn)

    def _on_theme_selected(self, preset_name: str) -> None:
        if not preset_name:
            return
        MatrixPalette.apply_preset(preset_name)
        self._settings.theme = MatrixPalette.PRESET_NAME
        self._save_preferences()
        self._header.refresh_theme()
        self._update_telemetry()
        for w in (
            self._cpu_graph,
            self._mem_graph,
            self._net_graph,
            self._gpu_disk_graph,
            self._clock_cal,
            self._log_panel,
            self,
        ):
            w.update()

    def _toggle_24h(self) -> None:
        self._settings.use_24h = self._clock_cal.toggle_24h()
        self._save_preferences()

    def _toggle_gpu_disk_mode(self) -> None:
        self._gpu_chart_mode = "disk" if self._gpu_chart_mode == "gpu" else "gpu"
        self._settings.gpu_chart_mode = self._gpu_chart_mode
        self._save_preferences()
        self._update_telemetry()

    def _toggle_logs_pause(self) -> None:
        self._logs.toggle_pause()
        self._sync_logs()

    def _exit_fullscreen(self) -> None:
        if self.isFullScreen():
            self.showNormal()
            self._settings.fullscreen = False
            self._save_preferences()

    def toggle_fullscreen(self) -> None:
        """Toggle between fullscreen and normal windowed mode."""
        if self.isFullScreen():
            self.showNormal()
            self._settings.fullscreen = False
            self._save_preferences()
        else:
            self._move_to_screen(self._screen_index, fullscreen=True, save=True)

    def cycle_screen(self) -> None:
        """Move window to the next available monitor (preserving fullscreen if active)."""
        screens = QGuiApplication.screens()
        if not screens:
            return
        self._screen_index = (self._screen_index + 1) % len(screens)
        self._move_to_screen(self._screen_index, fullscreen=self.isFullScreen(), save=True)

    def _move_to_screen(self, index: int, fullscreen: bool = False, save: bool = True) -> None:
        screens = QGuiApplication.screens()
        if not screens:
            if fullscreen:
                self.showFullScreen()
            return
        index = max(0, min(index, len(screens) - 1))
        self._screen_index = index
        target = screens[index]
        geom = target.availableGeometry() if not fullscreen else target.geometry()

        was_fs = self.isFullScreen()
        if was_fs:
            self.showNormal()

        if self.windowHandle() is not None:
            self.windowHandle().setScreen(target)

        if fullscreen:
            self.setGeometry(target.geometry())
            self.showFullScreen()
        else:
            w = min(self.width(), int(geom.width() * 0.92))
            h = min(self.height(), int(geom.height() * 0.92))
            x = geom.x() + (geom.width() - w) // 2
            y = geom.y() + (geom.height() - h) // 2
            self.setGeometry(x, y, w, h)

        if save:
            self._settings.preferred_output = target.name()
            self._settings.fullscreen = fullscreen
            self._save_preferences()

        self._update_header_meta()

    def _update_header_meta(self) -> None:
        s = self._collector.snapshot
        screens = QGuiApplication.screens()
        out_name = ""
        if 0 <= self._screen_index < len(screens):
            out_name = screens[self._screen_index].name()
        self._header.set_status(s.os_name, s.kernel.split("-")[0], self._screen_index, len(screens), out_name)

    def _apply_responsive_layout(self, force: bool = False) -> None:
        """Reflow panels between landscape (side-by-side) and portrait (stacked) without scrolling."""
        portrait = self.height() > self.width() * 1.05
        if not force and portrait == self._is_portrait:
            return
        self._is_portrait = portrait

        while self._grid.count():
            item = self._grid.takeAt(0)
            if item.widget() is not None:
                item.widget().setParent(self._grid_host)

        for i in range(6):
            self._grid.setRowStretch(i, 0)
            self._grid.setColumnStretch(i, 0)

        if not portrait:
            left_graphs = QWidget(self._grid_host)
            left_vbox = QVBoxLayout(left_graphs)
            left_vbox.setContentsMargins(0, 0, 0, 0)
            left_vbox.setSpacing(8)
            for graph in (self._cpu_graph, self._mem_graph, self._net_graph, self._gpu_disk_graph):
                left_vbox.addWidget(graph, stretch=1)

            right_pane = QWidget(self._grid_host)
            right_vbox = QVBoxLayout(right_pane)
            right_vbox.setContentsMargins(0, 0, 0, 0)
            right_vbox.setSpacing(8)
            right_vbox.addWidget(self._clock_cal, stretch=28)
            right_vbox.addWidget(self._log_panel, stretch=72)

            self._grid.addWidget(left_graphs, 0, 0)
            self._grid.addWidget(right_pane, 0, 1)
            self._grid.setColumnStretch(0, 56)
            self._grid.setColumnStretch(1, 44)
            self._grid.setRowStretch(0, 1)
        else:
            self._grid.addWidget(self._clock_cal, 0, 0, 1, 2)
            self._grid.addWidget(self._cpu_graph, 1, 0)
            self._grid.addWidget(self._mem_graph, 1, 1)
            self._grid.addWidget(self._net_graph, 2, 0)
            self._grid.addWidget(self._gpu_disk_graph, 2, 1)
            self._grid.addWidget(self._log_panel, 3, 0, 1, 2)

            self._grid.setColumnStretch(0, 1)
            self._grid.setColumnStretch(1, 1)
            self._grid.setRowStretch(0, 21)
            self._grid.setRowStretch(1, 24)
            self._grid.setRowStretch(2, 23)
            self._grid.setRowStretch(3, 32)

    def resizeEvent(self, event) -> None:
        super().resizeEvent(event)
        min_dim = min(self.width(), self.height())
        self._header.setFixedHeight(max(24, min(32, int(min_dim * 0.036))))
        spacing = max(4, min(10, int(min_dim * 0.01)))
        self._grid.setSpacing(spacing)
        self._apply_responsive_layout(force=False)

    def contextMenuEvent(self, event) -> None:
        menu = QMenu(self)
        primary = MatrixPalette.PRIMARY.name()
        bright = MatrixPalette.BRIGHT.name()
        border = MatrixPalette.BORDER_GLOW.name()
        sel = MatrixPalette.BORDER_DIM.name()
        menu.setStyleSheet(
            f"QMenu {{ background-color: #020502; color: {bright}; border: 1px solid {border}; "
            f"font-family: monospace; }} "
            f"QMenu::item:selected {{ background-color: {sel}; color: {primary}; }}"
        )

        act_fs = QAction("Exit Fullscreen" if self.isFullScreen() else "Enter Fullscreen (F11)", self)
        act_fs.triggered.connect(self.toggle_fullscreen)
        menu.addAction(act_fs)

        screens = QGuiApplication.screens()
        if len(screens) > 1:
            mon_menu = menu.addMenu("Move to Monitor")
            for idx, scr in enumerate(screens):
                g = scr.geometry()
                lbl = f"Monitor {idx + 1}: {scr.name()} ({g.width()}x{g.height()})"
                act = QAction(lbl, self)
                act.setCheckable(True)
                act.setChecked(idx == self._screen_index)
                act.triggered.connect(
                    lambda _chk=False, i=idx: self._move_to_screen(i, self.isFullScreen(), save=True)
                )
                mon_menu.addAction(act)

        color_menu = menu.addMenu("Color Theme")
        for name, hex_val in COLOR_PRESETS:
            act = QAction(_make_swatch_icon(hex_val), name, self)
            act.setCheckable(True)
            act.setChecked(name == MatrixPalette.PRESET_NAME)
            act.triggered.connect(lambda _chk=False, n=name: self._select_theme_from_menu(n))
            color_menu.addAction(act)

        menu.addSeparator()

        act_24h = QAction("Toggle 12h / 24h Clock (T)", self)
        act_24h.triggered.connect(self._toggle_24h)
        menu.addAction(act_24h)

        act_gpu = QAction("Switch GPU / Disk Chart (G)", self)
        act_gpu.triggered.connect(self._toggle_gpu_disk_mode)
        menu.addAction(act_gpu)

        act_logs = QAction("Resume Logs (Space)" if self._logs.paused else "Pause Logs (Space)", self)
        act_logs.triggered.connect(self._toggle_logs_pause)
        menu.addAction(act_logs)

        menu.addSeparator()
        act_quit = QAction("Quit (Q)", self)
        act_quit.triggered.connect(self.close)
        menu.addAction(act_quit)

        menu.exec(event.globalPos())

    def _select_theme_from_menu(self, name: str) -> None:
        idx = self._header.theme_combo.findData(name)
        if idx >= 0:
            self._header.theme_combo.setCurrentIndex(idx)
        else:
            self._on_theme_selected(name)

    def _update_telemetry(self) -> None:
        s = self._collector.sample()
        self._update_header_meta()

        # 1. CPU History
        temp_str = f"{s.cpu_temp_c:.0f}°C" if s.cpu_temp_c is not None else "--°C"
        freq_str = f"{s.cpu_freq_ghz:.2f}GHz" if s.cpu_freq_ghz > 0 else ""
        cpu_tag = " • ".join(p for p in (temp_str, freq_str, f"{len(s.cpu_cores)}C") if p)
        self._cpu_graph.set_data(
            series_list=[
                GraphSeries("CPU%", s.cpu_history, MatrixPalette.PRIMARY, fill=True, dashed=False),
            ],
            primary_readout=f"CPU {s.cpu_total:5.1f}%",
            secondary_readout=f"LOAD {s.load_avg[0]:.2f} {s.load_avg[1]:.2f}  •  PROCS {s.proc_count}",
            right_tag=cpu_tag,
            per_core_bars=s.cpu_cores,
        )

        # 2. Memory & Swap History
        mem_tag = f"RAM {format_gib(s.ram_used_bytes)}/{format_gib(s.ram_total_bytes)}"
        swap_sec = f"SWAP {s.swap_pct:.1f}% ({format_gib(s.swap_used_bytes)}/{format_gib(s.swap_total_bytes)})"
        self._mem_graph.set_data(
            series_list=[
                GraphSeries("RAM", s.ram_history, MatrixPalette.PRIMARY, fill=True, dashed=False),
                GraphSeries("SWAP", s.swap_history, MatrixPalette.BRIGHT, fill=False, dashed=True),
            ],
            primary_readout=f"MEM {s.ram_pct:5.1f}%",
            secondary_readout=swap_sec,
            right_tag=mem_tag,
        )

        # 3. Network Down/Up History
        self._net_graph.set_data(
            series_list=[
                GraphSeries("DOWN", s.net_rx_history, MatrixPalette.PRIMARY, fill=True, dashed=False),
                GraphSeries("UP", s.net_tx_history, MatrixPalette.BRIGHT, fill=False, dashed=True),
            ],
            primary_readout=f"DOWN {format_bytes_rate(s.net_rx_bps).strip()}",
            secondary_readout=f"UP {format_bytes_rate(s.net_tx_bps).strip()}",
            right_tag=f"NIC {s.net_iface}",
            y_formatter=lambda v: format_bytes_rate(v).strip(),
        )

        # 4. GPU & Disk I/O History
        disk_str = f"DISK R {format_bytes_rate(s.disk_read_bps).strip()} / W {format_bytes_rate(s.disk_write_bps).strip()}"
        if s.has_gpu and self._gpu_chart_mode == "gpu":
            self._gpu_disk_graph.title = "[ GPU & VRAM // HISTORY ]"
            self._gpu_disk_graph.auto_scale = False
            gpu_parts = []
            if s.gpu_temp_c is not None:
                gpu_parts.append(f"{s.gpu_temp_c:.0f}°C")
            if s.gpu_power_w is not None:
                gpu_parts.append(f"{s.gpu_power_w:.0f}W")
            gpu_parts.append(f"VRAM {format_gib(s.gpu_vram_used)}/{format_gib(s.gpu_vram_total)}")
            self._gpu_disk_graph.set_data(
                series_list=[
                    GraphSeries("GPU%", s.gpu_history, MatrixPalette.PRIMARY, fill=True, dashed=False),
                    GraphSeries("VRAM%", s.vram_history, MatrixPalette.BRIGHT, fill=False, dashed=True),
                ],
                primary_readout=f"GPU {s.gpu_busy_pct:5.1f}%",
                secondary_readout=f"VRAM {s.gpu_vram_pct:.1f}%  •  {disk_str}",
                right_tag=" • ".join(gpu_parts),
            )
        else:
            self._gpu_disk_graph.title = "[ DISK I/O // HISTORY ]"
            self._gpu_disk_graph.auto_scale = True
            self._gpu_disk_graph.min_scale = 512 * 1024.0
            self._gpu_disk_graph.set_data(
                series_list=[
                    GraphSeries("READ", s.disk_read_history, MatrixPalette.PRIMARY, fill=True, dashed=False),
                    GraphSeries("WRITE", s.disk_write_history, MatrixPalette.BRIGHT, fill=False, dashed=True),
                ],
                primary_readout=f"READ {format_bytes_rate(s.disk_read_bps).strip()}",
                secondary_readout=f"WRITE {format_bytes_rate(s.disk_write_bps).strip()}",
                right_tag="BLOCK I/O",
                y_formatter=lambda v: format_bytes_rate(v).strip(),
            )

        self._clock_cal.set_system_meta(s.hostname, s.os_name, s.uptime_str)

    def _sync_logs(self) -> None:
        self._log_panel.set_entries(
            self._logs.entries,
            paused=self._logs.paused,
            source_label=self._logs.source_label,
        )

    def closeEvent(self, event) -> None:
        self._logs.stop()
        super().closeEvent(event)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Retro Matrix Linux System Monitor")
    fs_group = parser.add_mutually_exclusive_group()
    fs_group.add_argument(
        "-f",
        "--fullscreen",
        action="store_true",
        help="Start in fullscreen mode (ideal for a secondary ambiance monitor)",
    )
    fs_group.add_argument(
        "-w",
        "--windowed",
        action="store_true",
        help="Start in windowed mode (overrides saved fullscreen setting)",
    )
    parser.add_argument(
        "-s",
        "--screen",
        type=int,
        default=None,
        help="0-based monitor index to display on (e.g. 1 for secondary monitor)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default="",
        help="Target monitor connector name (e.g. DP-2, HDMI-A-1)",
    )
    parser.add_argument(
        "--theme",
        type=str,
        default="",
        help="Initial vibrant color theme name (overrides saved theme)",
    )
    parser.add_argument(
        "--screenshot",
        type=str,
        default="",
        help="Render a verification screenshot to PATH after warm-up and exit",
    )
    parser.add_argument(
        "--size",
        type=str,
        default="",
        help="Optional initial window geometry WxH (e.g. 1920x1080)",
    )
    return parser.parse_args(argv)


def _install_signal_handlers(app: QApplication) -> QTimer:
    """Allow SIGINT/SIGTERM to shut down Qt and background processes cleanly."""
    sig_timer = QTimer(app)
    sig_timer.setInterval(250)
    sig_timer.timeout.connect(lambda: None)
    sig_timer.start()

    def _handle_sig(_signum, _frame) -> None:
        app.quit()

    signal.signal(signal.SIGINT, _handle_sig)
    signal.signal(signal.SIGTERM, _handle_sig)
    return sig_timer


def main() -> int:
    args = parse_args(sys.argv[1:])
    app = QApplication(sys.argv)
    app.setApplicationName("Matrix System Monitor")
    app.setDesktopFileName(APP_ID)

    icon_path = Path(__file__).resolve().parent / "assets" / f"{APP_ID}.svg"
    if icon_path.exists():
        app.setWindowIcon(QIcon(str(icon_path)))

    is_screenshot = bool(args.screenshot)
    settings = AppSettings() if is_screenshot else load_settings()
    if args.theme:
        settings.theme = args.theme

    # Resolve target screen: CLI --output > CLI --screen > saved output > 0
    screen_idx = 0
    if args.output:
        matched = _find_screen_index_by_name(args.output)
        if matched is not None:
            screen_idx = matched
    elif args.screen is not None:
        screen_idx = args.screen
    elif settings.preferred_output:
        matched = _find_screen_index_by_name(settings.preferred_output)
        if matched is not None:
            screen_idx = matched

    start_fullscreen = False
    if not is_screenshot:
        if args.fullscreen:
            start_fullscreen = True
        elif args.windowed:
            start_fullscreen = False
        else:
            start_fullscreen = settings.fullscreen

    window = MatrixMonitorWindow(
        settings=settings,
        initial_screen=screen_idx,
        start_fullscreen=start_fullscreen,
        persist_changes=not is_screenshot,
    )

    if args.size and "x" in args.size.lower():
        w_str, h_str = args.size.lower().split("x", 1)
        window.resize(int(w_str), int(h_str))

    window.show()
    _sig_timer = _install_signal_handlers(app)

    if args.screenshot:
        out_path = Path(args.screenshot)
        out_path.parent.mkdir(parents=True, exist_ok=True)

        def _capture() -> None:
            window._update_telemetry()
            window._sync_logs()
            window.grab().save(str(out_path))
            app.quit()

        QTimer.singleShot(450, window._update_telemetry)
        QTimer.singleShot(950, _capture)

    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
