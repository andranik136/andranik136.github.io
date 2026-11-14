#!/usr/bin/env bash
set -euo pipefail

APP_ID="io.github.andranik136.MatrixMonitor"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}"
DESKTOP_DIR="$DATA_DIR/applications"
ICON_DIR="$DATA_DIR/icons/hicolor/scalable/apps"

mkdir -p "$DESKTOP_DIR" "$ICON_DIR"

cp "$APP_DIR/assets/$APP_ID.svg" "$ICON_DIR/$APP_ID.svg"

cat > "$DESKTOP_DIR/$APP_ID.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Matrix System Monitor
Comment=Retro vibrant phosphor system telemetry, logs, clock, and calendar
Exec="$APP_DIR/run.sh" --fullscreen --screen 1
Icon=$APP_ID
Terminal=false
Categories=System;Monitor;Utility;
Keywords=system;monitor;matrix;logs;telemetry;
StartupWMClass=$APP_ID
EOF

chmod +x "$APP_DIR/run.sh" "$DESKTOP_DIR/$APP_ID.desktop"
echo "Installed icon to: $ICON_DIR/$APP_ID.svg"
echo "Installed desktop launcher to: $DESKTOP_DIR/$APP_ID.desktop"
