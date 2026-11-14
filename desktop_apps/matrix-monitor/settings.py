"""XDG user configuration persistence for Matrix System Monitor."""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path

APP_ID = "io.github.andranik136.MatrixMonitor"


def get_config_path() -> Path:
    """Return the XDG-compliant settings JSON path."""
    xdg_config = os.environ.get("XDG_CONFIG_HOME")
    base = Path(xdg_config) if xdg_config else (Path.home() / ".config")
    return base / APP_ID / "settings.json"


@dataclass
class AppSettings:
    """Persisted user preferences."""

    theme: str = "Matrix Green"
    use_24h: bool = True
    gpu_chart_mode: str = "gpu"
    preferred_output: str = ""
    fullscreen: bool = False


def load_settings(config_path: Path | None = None) -> AppSettings:
    """Load persisted settings from XDG config, falling back to defaults safely."""
    path = config_path or get_config_path()
    defaults = AppSettings()
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except OSError, json.JSONDecodeError, ValueError:
        return defaults

    if not isinstance(raw, dict):
        return defaults

    return AppSettings(
        theme=str(raw.get("theme", defaults.theme)),
        use_24h=bool(raw.get("use_24h", defaults.use_24h)),
        gpu_chart_mode=str(raw.get("gpu_chart_mode", defaults.gpu_chart_mode)),
        preferred_output=str(raw.get("preferred_output", defaults.preferred_output)),
        fullscreen=bool(raw.get("fullscreen", defaults.fullscreen)),
    )


def save_settings(settings: AppSettings, config_path: Path | None = None) -> bool:
    """Persist settings atomically to XDG config. Returns True on success."""
    path = config_path or get_config_path()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(asdict(settings), indent=2) + "\n", encoding="utf-8")
        tmp.replace(path)
        return True
    except OSError:
        return False
