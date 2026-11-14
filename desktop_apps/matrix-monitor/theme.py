"""Retro phosphor theme palette, vibrant color presets, typography, and panel helpers."""

from __future__ import annotations

from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontDatabase, QLinearGradient, QPainter, QPen


COLOR_PRESETS: list[tuple[str, str]] = [
    ("Matrix Green", "#00ff41"),
    ("Cyber Cyan", "#00f0ff"),
    ("Amber Gold", "#ffb000"),
    ("Crimson Red", "#ff2a4b"),
    ("Electric Blue", "#3b82ff"),
    ("Neon Purple", "#c84bff"),
    ("Hot Magenta", "#ff2ec4"),
    ("Phosphor White", "#e8fff0"),
]


def _mix_color(a: QColor, b: QColor, t: float, alpha: int = 255) -> QColor:
    """Linearly interpolate between two QColors."""
    t = max(0.0, min(1.0, t))
    return QColor(
        int(a.red() + (b.red() - a.red()) * t),
        int(a.green() + (b.green() - a.green()) * t),
        int(a.blue() + (b.blue() - a.blue()) * t),
        alpha,
    )


class MatrixPalette:
    """Dynamic black & vibrant phosphor color palette."""

    PRESET_NAME: str = "Matrix Green"

    BG_VOID = QColor("#000000")
    BG_PANEL = QColor(3, 9, 4, 242)
    BG_HEADER_TOP = QColor(4, 14, 6, 245)
    BG_HEADER_LEFT = QColor(8, 32, 12, 240)
    BG_HEADER_MID = QColor(4, 15, 6, 230)
    BG_HEADER_RIGHT = QColor(2, 8, 3, 220)
    BG_PLOT = QColor(1, 5, 2, 220)

    BORDER_DIM = QColor("#0d3b15")
    BORDER_GLOW = QColor("#1b6e28")
    BORDER_BRIGHT = QColor("#00ff41")

    GRID_MAJOR = QColor(14, 62, 22, 175)
    GRID_MINOR = QColor(9, 36, 13, 130)

    PRIMARY = QColor("#00ff41")
    BRIGHT = QColor("#7dff9e")
    CORE = QColor("#c8ffd8")
    SECONDARY = QColor("#2ee66b")
    MUTED = QColor("#2c7a42")
    DIM = QColor("#144d22")

    WARN_TEXT = QColor("#ffd84d")
    ERR_TEXT = QColor("#ffffff")

    TEXT_PRIMARY = QColor("#8bffaa")
    TEXT_DIM = QColor("#2d7a40")

    @classmethod
    def apply_preset(cls, name: str) -> None:
        """Recompute all theme colors from the selected vibrant preset."""
        hex_val = dict(COLOR_PRESETS).get(name)
        if hex_val is None:
            name, hex_val = COLOR_PRESETS[0]

        cls.PRESET_NAME = name
        accent = QColor(hex_val)
        black = QColor(0, 0, 0)
        white = QColor(255, 255, 255)

        cls.BG_VOID = QColor("#000000")
        cls.BG_PANEL = _mix_color(black, accent, 0.035, alpha=244)
        cls.BG_HEADER_TOP = _mix_color(black, accent, 0.055, alpha=245)
        cls.BG_HEADER_LEFT = _mix_color(black, accent, 0.13, alpha=240)
        cls.BG_HEADER_MID = _mix_color(black, accent, 0.06, alpha=230)
        cls.BG_HEADER_RIGHT = _mix_color(black, accent, 0.025, alpha=220)
        cls.BG_PLOT = _mix_color(black, accent, 0.02, alpha=225)

        cls.BORDER_DIM = _mix_color(black, accent, 0.26)
        cls.BORDER_GLOW = _mix_color(black, accent, 0.48)
        cls.BORDER_BRIGHT = accent

        cls.GRID_MAJOR = _mix_color(black, accent, 0.25, alpha=175)
        cls.GRID_MINOR = _mix_color(black, accent, 0.14, alpha=130)

        cls.PRIMARY = accent
        cls.BRIGHT = _mix_color(accent, white, 0.45)
        cls.CORE = _mix_color(accent, white, 0.78)
        cls.SECONDARY = _mix_color(accent, white, 0.28)
        cls.MUTED = _mix_color(black, accent, 0.50)
        cls.DIM = _mix_color(black, accent, 0.30)

        cls.TEXT_PRIMARY = _mix_color(accent, white, 0.55)
        cls.TEXT_DIM = _mix_color(black, accent, 0.52)

        # Keep warnings/errors distinctly legible across any base accent
        cls.WARN_TEXT = QColor("#ffe066") if name != "Amber Gold" else QColor("#ffffff")
        cls.ERR_TEXT = QColor("#ffffff")


# Initialize default preset
MatrixPalette.apply_preset("Matrix Green")


_CACHED_FONT_FAMILY: str | None = None


def get_mono_font_family() -> str:
    """Return the best available monospace font family on the system."""
    global _CACHED_FONT_FAMILY
    if _CACHED_FONT_FAMILY is not None:
        return _CACHED_FONT_FAMILY

    preferred = [
        "Fira Code",
        "Hack",
        "JetBrains Mono",
        "Adwaita Mono",
        "Liberation Mono",
        "DejaVu Sans Mono",
        "Noto Sans Mono",
    ]
    available = set(QFontDatabase.families())
    for name in preferred:
        if name in available:
            _CACHED_FONT_FAMILY = name
            return name

    fixed = QFontDatabase.systemFont(QFontDatabase.SystemFont.FixedFont)
    _CACHED_FONT_FAMILY = fixed.family()
    return _CACHED_FONT_FAMILY


def make_mono_font(point_size: float, bold: bool = False) -> QFont:
    """Create a monospace QFont with fractional point size clamped safely."""
    font = QFont(get_mono_font_family())
    font.setPointSizeF(max(6.5, point_size))
    font.setBold(bold)
    font.setStyleHint(QFont.StyleHint.Monospace)
    return font


def draw_matrix_panel(
    painter: QPainter,
    rect: QRectF,
    title: str,
    right_tag: str = "",
    header_height: float = 24.0,
) -> QRectF:
    """Draw a retro panel frame with corner brackets and return its inner content rect."""
    painter.save()
    painter.setRenderHint(QPainter.RenderHint.Antialiasing, False)

    # Panel background
    painter.fillRect(rect, MatrixPalette.BG_PANEL)

    # Subtle top header bar
    header_rect = QRectF(rect.left(), rect.top(), rect.width(), header_height)
    header_grad = QLinearGradient(header_rect.topLeft(), header_rect.topRight())
    header_grad.setColorAt(0.0, MatrixPalette.BG_HEADER_LEFT)
    header_grad.setColorAt(0.6, MatrixPalette.BG_HEADER_MID)
    header_grad.setColorAt(1.0, MatrixPalette.BG_HEADER_RIGHT)
    painter.fillRect(header_rect, header_grad)

    # Outer hairline border
    painter.setPen(QPen(MatrixPalette.BORDER_DIM, 1.0))
    painter.drawRect(rect.adjusted(0.5, 0.5, -0.5, -0.5))

    # Header divider line
    painter.setPen(QPen(MatrixPalette.BORDER_GLOW, 1.0))
    painter.drawLine(
        int(rect.left()),
        int(rect.top() + header_height),
        int(rect.right()),
        int(rect.top() + header_height),
    )

    # Glowing corner brackets
    bracket = min(10.0, rect.width() * 0.08, rect.height() * 0.08)
    painter.setPen(QPen(MatrixPalette.PRIMARY, 1.5))
    x0, y0, x1, y1 = rect.left() + 0.5, rect.top() + 0.5, rect.right() - 0.5, rect.bottom() - 0.5
    # Top-left
    painter.drawLine(int(x0), int(y0), int(x0 + bracket), int(y0))
    painter.drawLine(int(x0), int(y0), int(x0), int(y0 + bracket))
    # Top-right
    painter.drawLine(int(x1 - bracket), int(y0), int(x1), int(y0))
    painter.drawLine(int(x1), int(y0), int(x1), int(y0 + bracket))
    # Bottom-left
    painter.drawLine(int(x0), int(y1), int(x0 + bracket), int(y1))
    painter.drawLine(int(x0), int(y1 - bracket), int(x0), int(y1))
    # Bottom-right
    painter.drawLine(int(x1 - bracket), int(y1), int(x1), int(y1))
    painter.drawLine(int(x1), int(y1 - bracket), int(x1), int(y1))

    # Title & right status tag
    font_px = max(8.0, min(11.5, header_height * 0.46))
    title_font = make_mono_font(font_px, bold=True)
    painter.setFont(title_font)
    painter.setPen(MatrixPalette.PRIMARY)
    pad_x = max(8.0, header_height * 0.4)
    title_rect = QRectF(rect.left() + pad_x, rect.top(), max(10.0, rect.width() - pad_x * 2), header_height)
    title_w = painter.fontMetrics().horizontalAdvance(title)
    painter.drawText(title_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft, title)

    if right_tag:
        avail_right = max(0.0, title_rect.width() - title_w - 10.0)
        if avail_right > 24.0:
            tag_font = make_mono_font(max(7.0, font_px - 0.8), bold=False)
            painter.setFont(tag_font)
            painter.setPen(MatrixPalette.BRIGHT)
            elided_tag = painter.fontMetrics().elidedText(right_tag, Qt.TextElideMode.ElideRight, int(avail_right))
            painter.drawText(title_rect, Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight, elided_tag)

    painter.restore()
    return QRectF(
        rect.left() + 1.0,
        rect.top() + header_height + 1.0,
        max(1.0, rect.width() - 2.0),
        max(1.0, rect.height() - header_height - 2.0),
    )
