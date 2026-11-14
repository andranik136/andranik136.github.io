"""Retro Matrix digital clock, date readout, and side-by-side full month calendar widget."""

from __future__ import annotations

import calendar
from datetime import datetime
from PySide6.QtCore import QRectF, Qt, QTimer
from PySide6.QtGui import QColor, QFont, QFontMetricsF, QPainter, QPen
from PySide6.QtWidgets import QSizePolicy, QWidget

from theme import MatrixPalette, draw_matrix_panel, make_mono_font


class ClockCalendarWidget(QWidget):
    """Displays large digital time & date on the left with a full-month calendar beside it."""

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.use_24h = True
        self.hostname = ""
        self.os_name = ""
        self.uptime_str = "00:00:00"
        self._cal = calendar.Calendar(firstweekday=6)  # Sunday first

        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self.setMinimumSize(260, 120)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)

        self._timer = QTimer(self)
        self._timer.setInterval(250)
        self._timer.timeout.connect(self.update)
        self._timer.start()

    def set_system_meta(self, hostname: str, os_name: str, uptime_str: str) -> None:
        """Update compact system metadata displayed under the date."""
        self.hostname = hostname
        self.os_name = os_name
        self.uptime_str = uptime_str

    def toggle_24h(self) -> bool:
        """Toggle 24-hour vs 12-hour AM/PM clock display."""
        self.use_24h = not self.use_24h
        self.update()
        return self.use_24h

    def paintEvent(self, _event) -> None:
        painter = QPainter(self)
        w = float(self.width())
        h = float(self.height())
        if w < 60 or h < 60:
            return

        now = datetime.now()
        header_h = max(18.0, min(26.0, h * 0.13))
        inner = draw_matrix_panel(
            painter,
            QRectF(0.0, 0.0, w, h),
            "[ CHRONO // SYSTEM_TIME ]",
            right_tag=f"TZ {now.astimezone().tzname() or 'LOCAL'}",
            header_height=header_h,
        )

        pad_x = max(8.0, min(18.0, inner.width() * 0.025))
        pad_y = max(6.0, min(14.0, inner.height() * 0.05))
        content = inner.adjusted(pad_x, pad_y, -pad_x, -pad_y)

        # Split horizontally: Time & Date on left, small full-month calendar on right
        gap = max(10.0, content.width() * 0.03)
        left_w = content.width() * 0.53 - gap * 0.5
        right_w = content.width() * 0.47 - gap * 0.5

        clock_rect = QRectF(content.left(), content.top(), max(40.0, left_w), content.height())
        cal_rect = QRectF(clock_rect.right() + gap, content.top(), max(40.0, right_w), content.height())

        # Vertical divider between clock/date and calendar
        painter.save()
        painter.setPen(QPen(MatrixPalette.BORDER_DIM, 1.0))
        div_x = int(clock_rect.right() + gap * 0.5)
        painter.drawLine(div_x, int(content.top() + 4), div_x, int(content.bottom() - 4))
        painter.restore()

        self._draw_clock_and_date(painter, clock_rect, now)
        self._draw_month_calendar(painter, cal_rect, now)

    def _draw_clock_and_date(self, painter: QPainter, rect: QRectF, now: datetime) -> None:
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)

        if self.use_24h:
            time_str = now.strftime("%H:%M:%S")
            ampm = ""
        else:
            time_str = now.strftime("%I:%M:%S")
            ampm = now.strftime("%p")

        # Scale time font cleanly to fit both width and height
        max_pt_by_h = rect.height() * 0.34
        max_pt_by_w = rect.width() / (len(time_str) * 0.84)
        time_pt = max(12.0, min(46.0, max_pt_by_h, max_pt_by_w))

        time_h = rect.height() * 0.46
        time_rect = QRectF(rect.left(), rect.top(), rect.width(), time_h)

        # Subtle phosphor glow behind digits
        glow_color = QColor(MatrixPalette.PRIMARY)
        glow_color.setAlpha(60)
        painter.setFont(make_mono_font(time_pt, bold=True))
        painter.setPen(glow_color)
        painter.drawText(time_rect.adjusted(1.5, 1.5, 1.5, 1.5), Qt.AlignmentFlag.AlignCenter, time_str)
        painter.setPen(MatrixPalette.CORE)
        painter.drawText(time_rect, Qt.AlignmentFlag.AlignCenter, time_str)

        if ampm:
            ampm_font = make_mono_font(max(7.5, time_pt * 0.28), bold=True)
            painter.setFont(ampm_font)
            painter.setPen(MatrixPalette.PRIMARY)
            painter.drawText(
                time_rect.adjusted(0, 0, -4, -4),
                Qt.AlignmentFlag.AlignBottom | Qt.AlignmentFlag.AlignRight,
                ampm,
            )

        # Day & Date block
        day_name = now.strftime("%A").upper()
        date_str = now.strftime("%b %d, %Y").upper()
        iso_str = now.strftime("%Y-%m-%d")
        full_date_line = f"{date_str}  //  {iso_str}"

        date_y = time_rect.bottom() + 2.0
        rem_h = max(20.0, rect.bottom() - date_y)

        def _fit_font(text: str, start_pt: float, bold: bool) -> QFont:
            pt = start_pt
            while pt > 6.5:
                f = make_mono_font(pt, bold=bold)
                if QFontMetricsF(f).horizontalAdvance(text) <= rect.width() - 4.0:
                    return f
                pt -= 0.5
            return make_mono_font(6.5, bold=bold)

        day_pt = max(7.5, min(15.0, rem_h * 0.24))
        day_font = _fit_font(day_name, day_pt, bold=True)
        date_font = _fit_font(full_date_line, max(7.0, day_pt * 0.88), bold=False)

        day_rect = QRectF(rect.left(), date_y, rect.width(), rem_h * 0.34)
        painter.setFont(day_font)
        painter.setPen(MatrixPalette.PRIMARY)
        painter.drawText(day_rect, Qt.AlignmentFlag.AlignCenter, day_name)

        date_rect = QRectF(rect.left(), day_rect.bottom(), rect.width(), rem_h * 0.30)
        painter.setFont(date_font)
        painter.setPen(MatrixPalette.BRIGHT)
        painter.drawText(date_rect, Qt.AlignmentFlag.AlignCenter, full_date_line)

        # Compact system info strip at bottom if room
        if rem_h > 40:
            meta_rect = QRectF(rect.left(), date_rect.bottom() + 2.0, rect.width(), rect.bottom() - date_rect.bottom() - 2.0)
            host = self.hostname or "linux"
            up = self.uptime_str or "00:00:00"
            meta_text = f"{host}  •  UP {up}"
            meta_font = _fit_font(meta_text, max(6.8, min(11.0, rem_h * 0.17)), bold=False)
            painter.setFont(meta_font)
            painter.setPen(MatrixPalette.TEXT_DIM)
            elided_meta = QFontMetricsF(meta_font).elidedText(meta_text, Qt.TextElideMode.ElideMiddle, int(rect.width() - 4))
            painter.drawText(meta_rect, Qt.AlignmentFlag.AlignCenter, elided_meta)

        painter.restore()

    def _draw_month_calendar(self, painter: QPainter, rect: QRectF, now: datetime) -> None:
        painter.save()
        painter.setRenderHint(QPainter.RenderHint.TextAntialiasing, True)

        # Keep calendar cleanly framed inside rect
        title_h = max(14.0, min(22.0, rect.height() * 0.15))
        dow_h = max(12.0, min(18.0, rect.height() * 0.12))
        grid_rect = QRectF(
            rect.left(),
            rect.top() + title_h + dow_h + 4.0,
            rect.width(),
            max(30.0, rect.height() - title_h - dow_h - 4.0),
        )

        # Month & Year Header
        month_title = now.strftime("%B %Y").upper()
        if rect.width() < 165:
            month_title = now.strftime("%b %Y").upper()
        title_pt = max(7.5, min(12.0, title_h * 0.58, rect.width() / 14.0))
        painter.setFont(make_mono_font(title_pt, bold=True))
        painter.setPen(MatrixPalette.PRIMARY)
        painter.drawText(
            QRectF(rect.left(), rect.top(), rect.width(), title_h),
            Qt.AlignmentFlag.AlignCenter,
            month_title,
        )

        # Weekday header row
        cols = 7
        col_w = grid_rect.width() / cols
        dow_labels = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
        cell_pt = max(6.5, min(10.5, min(col_w * 0.42, (grid_rect.height() / 6.0) * 0.48)))

        painter.setFont(make_mono_font(max(6.0, cell_pt * 0.9), bold=True))
        painter.setPen(MatrixPalette.MUTED)
        for c, lbl in enumerate(dow_labels):
            cx = grid_rect.left() + c * col_w
            painter.drawText(
                QRectF(cx, rect.top() + title_h + 2.0, col_w, dow_h),
                Qt.AlignmentFlag.AlignCenter,
                lbl,
            )

        # Separator line below weekday header
        painter.setPen(QPen(MatrixPalette.BORDER_DIM, 1.0))
        painter.drawLine(
            int(grid_rect.left() + 2),
            int(grid_rect.top() - 2),
            int(grid_rect.right() - 2),
            int(grid_rect.top() - 2),
        )

        # Always render 6 weeks so calendar height stays rock-solid across months
        weeks = self._cal.monthdatescalendar(now.year, now.month)
        while len(weeks) < 6:
            # Pad with next week if month spans 4 or 5 rows
            last_day = weeks[-1][-1]
            from datetime import timedelta

            weeks.append([last_day + timedelta(days=i + 1) for i in range(7)])

        row_h = grid_rect.height() / len(weeks)
        today = now.date()

        for r, week in enumerate(weeks):
            for c, day_date in enumerate(week):
                cell = QRectF(
                    grid_rect.left() + c * col_w,
                    grid_rect.top() + r * row_h,
                    col_w,
                    row_h,
                )
                is_current_month = day_date.month == now.month
                is_today = day_date == today

                if is_today:
                    box = cell.adjusted(2.0, 1.5, -2.0, -1.5)
                    painter.fillRect(box, MatrixPalette.PRIMARY)
                    painter.setFont(make_mono_font(cell_pt, bold=True))
                    painter.setPen(MatrixPalette.BG_VOID)
                    painter.drawText(box, Qt.AlignmentFlag.AlignCenter, str(day_date.day))
                else:
                    painter.setFont(make_mono_font(cell_pt, bold=False))
                    if is_current_month:
                        painter.setPen(MatrixPalette.BRIGHT)
                    else:
                        painter.setPen(MatrixPalette.DIM)
                    painter.drawText(cell, Qt.AlignmentFlag.AlignCenter, str(day_date.day))

        painter.restore()
