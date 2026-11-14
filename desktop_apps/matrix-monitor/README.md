# Matrix System Monitor

A retro black-and-vibrant-phosphor Linux desktop application designed to run full screen on a secondary monitor as informational ambiance.

## Features

- **System Monitor History Graphs** (90-second rolling time series):
  - **CPU**: Overall utilization, per-core live bar strip, temperature, frequency, load average, and process count
  - **Memory & Swap**: RAM & Swap utilization curves and GiB readouts
  - **Network**: Auto-scaled Down/Up throughput across active interfaces
  - **GPU & Disk I/O**: AMD (`amdgpu` sysfs) or NVIDIA (`nvidia-smi`) GPU % + VRAM %, temperature/power, and block I/O read/write rates (press `G` to switch the 4th chart between GPU/VRAM and Disk I/O)
- **Live System Log Stream**: Non-scrolling `journalctl -f` stream dynamically sized to fit the panel cleanly, with automatic reconnect on stream exit
- **Clock, Date & Full-Month Calendar**: Large phosphor digital clock, day/date, uptime, and side-by-side full-month calendar with today highlighted
- **Dynamic No-Scroll Layout**: Panels, fonts, and axes scale automatically to any window size, including landscape and portrait secondary monitors
- **Vibrant Color Theme Selector & XDG Persistence**: Top-bar dropdown (and right-click menu) to switch between Matrix Green, Cyber Cyan, Amber Gold, Crimson Red, Electric Blue, Neon Purple, Hot Magenta, and Phosphor White; color theme, 12h/24h mode, GPU/Disk mode, fullscreen state, and preferred monitor connector persist in `${XDG_CONFIG_HOME:-~/.config}/io.github.andranik136.MatrixMonitor/settings.json`

## Running

```bash
# Windowed mode (uses saved preferences unless overridden)
./run.sh --windowed

# Fullscreen on secondary monitor by index or connector name
./run.sh --fullscreen --screen 1
./run.sh --fullscreen --output DP-2
```

## Keyboard Shortcuts & Context Menu

Right-click anywhere for a menu, or use keyboard shortcuts:

- `F11` or `F`: Toggle fullscreen
- `M`: Cycle across connected monitors (preserving fullscreen and saving preferred output)
- `T`: Toggle 24-hour / 12-hour clock
- `G`: Toggle 4th graph between GPU/VRAM and Disk I/O
- `Space`: Pause / resume live log stream
- `Esc`: Exit fullscreen
- `Q` / `Ctrl+Q`: Quit

## Desktop Launcher (Linux / KDE / GNOME)

Run `./install-desktop.sh` to install the SVG icon and `io.github.andranik136.MatrixMonitor.desktop` launcher into `~/.local/share/`.

## Testing

```bash
python3 -m unittest discover -s tests -v
```
