"""Retro Matrix rolling history chart widget (System Monitor History tab style)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence
from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import (
    QColor,
    QFontMetricsF,
    QLinearGradient,
    QPainter,
    QPainterPath,
    QPen,
    QPolygonF,
)
from PySide6.QtWidgets import QSizePolicy, QWidget

from theme import MatrixPalette, draw_matrix_panel, make_mono_font


@dataclass
class GraphSeries:
    """Configuration and data for a single line/area series."""

    label: str
    values: Sequence[float]
    color: QColor
    fill: bool = True
    dashed: bool = False


def _nice_ceiling(peak: float, min_floor: float = 1024.0) -> float:
    """Pick a clean power-of-two/human-friendly ceiling for auto-scaled throughput graphs."""
    target = max(min_floor, peak * 1.2)
    step = 1024.0
    while step < target:
        for mult in (1.0, 2.0, 5.0):
            cand = step * mult
            if cand >= target:
                return cand
        step *= 10.0 if step < 1024.0 * 100 else 1024.0
        # Keep powers of 1024 clean above 1 MiB
        if step >= 1024.0 * 1024.0:
            for mult in (1.0, 2.0, 5.0, 10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0):
                cand = 1024.0 * 1024.0 * mult
                if cand >= target:
                    return cand
            return target
    return step


class HistoryGraphWidget(QWidget):
    """Rolling real-time area/line graph styled like a retro Matrix oscilloscope."""

    def __init__(
        self,
        title: str,
        y_unit: str = "%",
        auto_scale: bool = False,
        min_scale: float = 100.0,
        parent: QWidget | None = None,
    ) -> None:
        super().__init__(parent)
        self.title = title
        self.y_unit = y_unit
        self.auto_scale = auto_scale
        self.min_scale = min_scale
        self.right_tag = ""
        self.primary_readout = ""
        self.secondary_readout = ""
        self.series_list: list[GraphSeries] = []
        self.per_core_bars: list[float] | None = None
        self.y_formatter = None

        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setMinimumSize(180, 90)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

    def set_data(
        self,
        series_list: list[GraphSeries],
        primary_readout: str,
        secondary_readout: str = "",
        right_tag: str = "",
        per_core_bars: list[float] | None = None,
        y_formatter=None,
    ) -> None:
        """Update chart data and trigger repaint."""
        self.series_list = series_list
        self.primary_readout = primary_readout
        self.secondary_readout = secondary_readout
        self.right_tag = right_tag
        self.per_core_bars = per_core_bars
        self.y_formatter = y_formatter
        self.update()

    def _format_y_tick(self, value: float) -> str:
        if self.y_formatter is not None:
            return self.y_formatter(value)
        if self.y_unit == "%":
            return f"{value:.0f}%"
        return f"{value:.0f}{self.y_unit}"

    def paintEvent(self, _event) -> None:
        painter = QPainter(self)
        w = float(self.width())
        h = float(self.height())
        if w < 40 or h < 40:
            return

        header_h = max(18.0, min(26.0, h * 0.14))
        inner = draw_matrix_panel(
            painter,
            QRectF(0.0, 0.0, w, h),
            self.title,
            right_tag=self.right_tag,
            header_height=header_h,
        )

        # Compute dynamic metrics strip + margins
        pad_x = max(8.0, min(14.0, inner.width() * 0.02))
        pad_y = max(4.0, min(8.0, inner.height() * 0.04))
        summary_h = max(18.0, min(28.0, inner.height() * 0.18))

        summary_rect = QRectF(
            inner.left() + pad_x,
            inner.top() + pad_y,
            max(10.0, inner.width() - pad_x * 2),
            summary_h,
        )
        self._draw_summary_strip(painter, summary_rect)

        # Reserve optional right-side per-core bar column on CPU graph when spacious
        show_cores = bool(self.per_core_bars) and inner.width() > 340 and inner.height() > 90
        core_strip_w = min(90.0, max(54.0, inner.width() * 0.14)) if show_cores else 0.0
        core_gap = 8.0 if show_cores else 0.0

        y_max = 100.0
        if self.auto_scale:
            peak = 0.0
            for s in self.series_list:
                if s.values:
                    peak = max(peak, max(s.values))
            y_max = _nice_ceiling(peak, min_floor=self.min_scale)

        # Measure widest Y-axis tick label dynamically so ticks never clip
        est_plot_h = max(20.0, inner.bottom() - (summary_rect.bottom() + pad_y * 0.8) - 16.0)
        tick_font = make_mono_font(max(6.5, min(9.0, est_plot_h * 0.085)), bold=False)
        tick_fm = QFontMetricsF(tick_font)
        sample_labels = [self._format_y_tick(y_max * frac) for frac in (0.0, 0.5, 1.0)]
        y_axis_w = max(34.0, max(tick_fm.horizontalAdvance(lbl) for lbl in sample_labels) + 6.0)
        bottom_axis_h = max(12.0, min(18.0, inner.height() * 0.1))

        plot_rect = QRectF(
            inner.left() + pad_x + y_axis_w,
            summary_rect.bottom() + pad_y * 0.8,
            max(20.0, inner.width() - pad_x * 2 - y_axis_w - core_strip_w - core_gap),
            max(20.0, inner.bottom() - (summary_rect.bottom() + pad_y * 0.8) - bottom_axis_h),
        )

        self._draw_grid_and_axes(painter, plot_rect, y_axis_w, bottom_axis_h, y_max)
        self._draw_series(painter, plot_rect, y_max)

        if show_cores and self.per_core_bars:
            core_rect = QRectF(
                plot_rect.right() + core_gap,
                plot_rect.top(),
                core_strip_w,
                plot_rect.height(),
            )
            self._draw_per_core_strip(painter, core_rect, self.per_core_bars)

    def _draw_summary_strip(self, painter: QPainter, rect: QRectF) -> None:
        painter.save()
        primary_pt = max(8.5, min(14.0, rect.height() * 0.56))
        sec_pt = max(7.0, min(10.5, rect.height() * 0.42))

        primary_font = make_mono_font(primary_pt, bold=True)
        painter.setFont(primary_font)
        painter.setPen(MatrixPalette.CORE)
        prim_w = painter.fontMetrics().horizontalAdvance(self.primary_readout)
        painter.drawText(rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft, self.primary_readout)

        avail_sec = rect.width() - prim_w - 12.0
        if self.secondary_readout and avail_sec > 60.0:
            sec_font = make_mono_font(sec_pt, bold=False)
            painter.setFont(sec_font)
            painter.setPen(MatrixPalette.BRIGHT)
            sec_txt = painter.fontMetrics().elidedText(self.secondary_readout, Qt.TextElideMode.ElideRight, int(avail_sec))
            painter.drawText(
                rect,
                Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight,
                sec_txt,
            )
        painter.restore()

    def _draw_grid_and_axes(
        self,
        painter: QPainter,
        plot_rect: QRectF,
        y_axis_w: float,
        bottom_axis_h: float,
        y_max: float,
    ) -> None:
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, False)

        # Subtle plot background
        painter.fillRect(plot_rect, MatrixPalette.BG_PLOT)

        # Horizontal gridlines (4 divisions)
        tick_font = make_mono_font(max(6.5, min(9.0, plot_rect.height() * 0.085)), bold=False)
        painter.setFont(tick_font)

        rows = 4
        for i in range(rows + 1):
            frac = i / rows
            y = plot_rect.bottom() - frac * plot_rect.height()
            pen = QPen(MatrixPalette.GRID_MAJOR if i in (0, rows) else MatrixPalette.GRID_MINOR, 1.0)
            if i not in (0, rows):
                pen.setStyle(Qt.PenStyle.DotLine)
            painter.setPen(pen)
            painter.drawLine(int(plot_rect.left()), int(y), int(plot_rect.right()), int(y))

            # Y tick label
            if i in (0, 2, 4) or plot_rect.height() > 110:
                val = y_max * frac
                label = self._format_y_tick(val)
                label_rect = QRectF(
                    plot_rect.left() - y_axis_w - 4.0,
                    y - 8.0,
                    y_axis_w,
                    16.0,
                )
                painter.setPen(MatrixPalette.TEXT_DIM)
                painter.drawText(label_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight, label)

        # Vertical time gridlines
        cols = 6
        for j in range(cols + 1):
            frac = j / cols
            x = plot_rect.left() + frac * plot_rect.width()
            pen = QPen(MatrixPalette.GRID_MAJOR if j in (0, cols) else MatrixPalette.GRID_MINOR, 1.0)
            if j not in (0, cols):
                pen.setStyle(Qt.PenStyle.DotLine)
            painter.setPen(pen)
            painter.drawLine(int(x), int(plot_rect.top()), int(x), int(plot_rect.bottom()))

        # Time axis caption
        painter.setPen(MatrixPalette.TEXT_DIM)
        time_rect = QRectF(plot_rect.left(), plot_rect.bottom() + 1.0, plot_rect.width(), bottom_axis_h)
        painter.drawText(time_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft, "-90s")
        painter.drawText(time_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignHCenter, "-45s")
        painter.drawText(time_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight, "NOW")

        # Plot border
        painter.setPen(QPen(MatrixPalette.BORDER_DIM, 1.0))
        painter.drawRect(plot_rect)
        painter.restore()

    def _draw_series(self, painter: QPainter, plot_rect: QRectF, y_max: float) -> None:
        if y_max <= 0:
            y_max = 1.0

        painter.save()
        painter.setClipRect(plot_rect.adjusted(0.5, 0.5, -0.5, -0.5))
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, True)

        # Draw secondary series first so primary sits crisply on top
        for series in reversed(self.series_list):
            vals = list(series.values)
            if not vals:
                continue
            capacity = getattr(series.values, "maxlen", None) or max(len(vals), 90)
            capacity = max(2, capacity)
            dx = plot_rect.width() / (capacity - 1)
            n = len(vals)

            points: list[QPointF] = []
            for idx, v in enumerate(vals):
                clamped = max(0.0, min(y_max, float(v)))
                # Anchor newest sample at right edge (NOW) so history grows leftward naturally
                slot = (capacity - n) + idx
                x = plot_rect.left() + slot * dx
                y = plot_rect.bottom() - (clamped / y_max) * (plot_rect.height() - 2.0) - 1.0
                points.append(QPointF(x, y))

            if len(points) == 1:
                last = points[0]
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(MatrixPalette.CORE)
                painter.drawEllipse(last, 2.5, 2.5)
                continue

            path = QPainterPath()
            path.moveTo(points[0])
            for pt in points[1:]:
                path.lineTo(pt)

            if series.fill:
                poly = QPolygonF(points)
                poly.append(QPointF(points[-1].x(), plot_rect.bottom()))
                poly.append(QPointF(points[0].x(), plot_rect.bottom()))
                fill_grad = QLinearGradient(plot_rect.topLeft(), plot_rect.bottomLeft())
                c_top = QColor(series.color)
                c_top.setAlpha(72 if not series.dashed else 32)
                c_bot = QColor(series.color)
                c_bot.setAlpha(6)
                fill_grad.setColorAt(0.0, c_top)
                fill_grad.setColorAt(1.0, c_bot)
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(fill_grad)
                painter.drawPolygon(poly)

            # Glow aura pass
            if not series.dashed:
                glow = QColor(series.color)
                glow.setAlpha(65)
                painter.setBrush(Qt.BrushStyle.NoBrush)
                painter.setPen(QPen(glow, 4.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))
                painter.drawPath(path)

            # Crisp core stroke
            pen_style = Qt.PenStyle.DashLine if series.dashed else Qt.PenStyle.SolidLine
            painter.setBrush(Qt.BrushStyle.NoBrush)
            painter.setPen(QPen(series.color, 1.7, pen_style, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))
            painter.drawPath(path)

            # Glowing sample dot on rightmost point
            if not series.dashed:
                last = points[-1]
                dot_glow = QColor(series.color)
                dot_glow.setAlpha(95)
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(dot_glow)
                painter.drawEllipse(last, 4.5, 4.5)
                painter.setBrush(MatrixPalette.CORE)
                painter.drawEllipse(last, 2.2, 2.2)

        # Compact inline legend in top-left of plot if >= 2 series
        if len(self.series_list) >= 2 and plot_rect.width() > 140:
            painter.setRenderHint(QPainter.RenderHint.Antialiasing, False)
            legend_font = make_mono_font(max(6.5, min(8.5, plot_rect.height() * 0.08)), bold=False)
            painter.setFont(legend_font)
            lx = plot_rect.left() + 6.0
            ly = plot_rect.top() + 11.0
            for series in self.series_list:
                pen = QPen(series.color, 1.8, Qt.PenStyle.DashLine if series.dashed else Qt.PenStyle.SolidLine)
                painter.setPen(pen)
                painter.drawLine(int(lx), int(ly - 3), int(lx + 14), int(ly - 3))
                painter.setPen(MatrixPalette.BRIGHT)
                painter.drawText(int(lx + 18), int(ly), series.label)
                lx += 18 + painter.fontMetrics().horizontalAdvance(series.label) + 12

        painter.restore()

    def _draw_per_core_strip(
        self,
        painter: QPainter,
        rect: QRectF,
        cores: list[float],
    ) -> None:
        """Draw compact per-core vertical or horizontal bar array next to CPU history."""
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.Antialiasing, False)
        painter.fillRect(rect, MatrixPalette.BG_PLOT)
        painter.setPen(QPen(MatrixPalette.BORDER_DIM, 1.0))
        painter.drawRect(rect)

        n = len(cores)
        if n == 0:
            painter.restore()
            return

        pad = 4.0
        inner = rect.adjusted(pad, pad, -pad, -pad)
        row_h = inner.height() / n
        bar_h = max(2.0, row_h * 0.62)

        track_color = QColor(MatrixPalette.DIM)
        track_color.setAlpha(90)
        for idx, pct in enumerate(cores):
            y = inner.top() + idx * row_h + (row_h - bar_h) * 0.5
            frac = max(0.0, min(1.0, pct / 100.0))
            fill_w = inner.width() * frac
            # Dim track
            painter.fillRect(QRectF(inner.left(), y, inner.width(), bar_h), track_color)
            # Active core phosphor bar
            bar_color = MatrixPalette.CORE if pct > 80.0 else MatrixPalette.PRIMARY
            if fill_w > 0.5:
                painter.fillRect(QRectF(inner.left(), y, fill_w, bar_h), bar_color)

        painter.restore()
