"""System telemetry collector for Linux (CPU, Memory/Swap, Network, GPU, Disk)."""

from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from pathlib import Path
import os
import platform
import shutil
import subprocess
import time
import psutil


def format_bytes_rate(bps: float) -> str:
    """Format a bytes-per-second throughput rate into compact human units."""
    if bps < 1024:
        return f"{bps:5.0f} B/s"
    kib = bps / 1024.0
    if kib < 1024:
        return f"{kib:5.1f} KiB/s"
    mib = kib / 1024.0
    if mib < 1024:
        return f"{mib:5.2f} MiB/s"
    gib = mib / 1024.0
    return f"{gib:5.2f} GiB/s"


def format_gib(num_bytes: float) -> str:
    """Format byte count as GiB."""
    return f"{num_bytes / (1024 ** 3):.1f} GiB"


def format_uptime(seconds: float) -> str:
    """Format uptime seconds into DDd HH:MM:SS or HH:MM:SS."""
    total = max(0, int(seconds))
    days, rem = divmod(total, 86400)
    hours, rem = divmod(rem, 3600)
    mins, secs = divmod(rem, 60)
    if days > 0:
        return f"{days}d {hours:02d}:{mins:02d}:{secs:02d}"
    return f"{hours:02d}:{mins:02d}:{secs:02d}"


def _read_int(path: Path) -> int | None:
    try:
        return int(path.read_text().strip())
    except OSError, ValueError:
        return None


def _detect_amd_gpu_dir() -> Path | None:
    """Find first DRM device exposing amdgpu sysfs telemetry."""
    drm_root = Path("/sys/class/drm")
    if not drm_root.exists():
        return None
    for card in sorted(drm_root.glob("card[0-9]*")):
        dev = card / "device"
        if (dev / "gpu_busy_percent").exists():
            return dev
    return None


def _read_os_pretty_name() -> str:
    os_release = Path("/etc/os-release")
    if os_release.exists():
        try:
            for line in os_release.read_text().splitlines():
                if line.startswith("PRETTY_NAME="):
                    return line.split("=", 1)[1].strip().strip('"')
        except OSError:
            pass
    return f"{platform.system()} {platform.release()}"


@dataclass
class TelemetrySnapshot:
    """Current telemetry state and rolling history series."""

    history_len: int = 90
    hostname: str = field(default_factory=platform.node)
    os_name: str = field(default_factory=_read_os_pretty_name)
    kernel: str = field(default_factory=platform.release)
    uptime_str: str = "00:00:00"

    # CPU
    cpu_total: float = 0.0
    cpu_cores: list[float] = field(default_factory=list)
    cpu_freq_ghz: float = 0.0
    cpu_temp_c: float | None = None
    load_avg: tuple[float, float, float] = (0.0, 0.0, 0.0)
    proc_count: int = 0
    cpu_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))

    # Memory & Swap
    ram_pct: float = 0.0
    ram_used_bytes: int = 0
    ram_total_bytes: int = 0
    swap_pct: float = 0.0
    swap_used_bytes: int = 0
    swap_total_bytes: int = 0
    ram_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))
    swap_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))

    # Network
    net_iface: str = "auto"
    net_rx_bps: float = 0.0
    net_tx_bps: float = 0.0
    net_rx_total: int = 0
    net_tx_total: int = 0
    net_rx_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))
    net_tx_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))

    # GPU & Disk I/O
    has_gpu: bool = False
    gpu_busy_pct: float = 0.0
    gpu_vram_pct: float = 0.0
    gpu_vram_used: int = 0
    gpu_vram_total: int = 0
    gpu_temp_c: float | None = None
    gpu_power_w: float | None = None
    disk_read_bps: float = 0.0
    disk_write_bps: float = 0.0
    gpu_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))
    vram_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))
    disk_read_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))
    disk_write_history: deque[float] = field(default_factory=lambda: deque([0.0] * 90, maxlen=90))


class TelemetryCollector:
    """Polls system metrics on a timer without blocking the GUI."""

    def __init__(self, history_len: int = 90) -> None:
        self.history_len = history_len
        self.snapshot = TelemetrySnapshot(history_len=history_len)
        for q_name in (
            "cpu_history",
            "ram_history",
            "swap_history",
            "net_rx_history",
            "net_tx_history",
            "gpu_history",
            "vram_history",
            "disk_read_history",
            "disk_write_history",
        ):
            setattr(self.snapshot, q_name, deque(maxlen=history_len))

        self._amd_gpu_dir = _detect_amd_gpu_dir()
        self._nvidia_smi = shutil.which("nvidia-smi") if self._amd_gpu_dir is None else None
        self.snapshot.has_gpu = (self._amd_gpu_dir is not None) or (self._nvidia_smi is not None)

        # Prime psutil CPU percent baseline
        psutil.cpu_percent(interval=None, percpu=True)
        self._last_time = time.monotonic()
        self._last_net = self._read_net_totals()
        self._last_disk = psutil.disk_io_counters()
        self._boot_time = psutil.boot_time()

    def _read_net_totals(self) -> tuple[str, int, int]:
        per_nic = psutil.net_io_counters(pernic=True) or {}
        non_lo = {k: v for k, v in per_nic.items() if k != "lo" and not k.startswith("veth")}
        selected = non_lo if non_lo else per_nic
        if not selected:
            return ("none", 0, 0)
        rx = sum(v.bytes_recv for v in selected.values())
        tx = sum(v.bytes_sent for v in selected.values())
        # Pick the most active interface name for display
        top_iface = max(selected.items(), key=lambda item: item[1].bytes_recv + item[1].bytes_sent)[0]
        if len(selected) > 1:
            label = f"{top_iface} (+{len(selected) - 1})"
        else:
            label = top_iface
        return (label, rx, tx)

    def _read_temperatures(self) -> tuple[float | None, float | None]:
        cpu_temp: float | None = None
        gpu_temp: float | None = None
        try:
            temps = psutil.sensors_temperatures() or {}
        except Exception:
            temps = {}

        for key in ("k10temp", "coretemp", "zenpower", "cpu_thermal"):
            entries = temps.get(key)
            if entries:
                # Prefer Tctl / Package id 0 if present
                preferred = next(
                    (e.current for e in entries if e.label in ("Tctl", "Tdie", "Package id 0")),
                    entries[0].current,
                )
                cpu_temp = float(preferred)
                break

        if "amdgpu" in temps and temps["amdgpu"]:
            entries = temps["amdgpu"]
            preferred = next((e.current for e in entries if e.label == "edge"), entries[0].current)
            gpu_temp = float(preferred)

        return cpu_temp, gpu_temp

    def _read_amd_gpu(self) -> tuple[float, int, int, float | None]:
        dev = self._amd_gpu_dir
        if dev is None:
            return (0.0, 0, 0, None)
        busy = _read_int(dev / "gpu_busy_percent") or 0
        vram_used = _read_int(dev / "mem_info_vram_used") or 0
        vram_total = _read_int(dev / "mem_info_vram_total") or 0
        power_w: float | None = None
        hwmon_dir = dev / "hwmon"
        if hwmon_dir.exists():
            for pwr_file in hwmon_dir.glob("hwmon*/power1_average"):
                raw = _read_int(pwr_file)
                if raw is not None:
                    power_w = raw / 1_000_000.0
                    break
        return (float(busy), vram_used, vram_total, power_w)

    def _read_nvidia_gpu(self) -> tuple[float, int, int, float | None, float | None]:
        """Fallback telemetry query for NVIDIA GPUs when nvidia-smi is installed."""
        if not self._nvidia_smi:
            return (0.0, 0, 0, None, None)
        try:
            proc = subprocess.run(
                [
                    self._nvidia_smi,
                    "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw",
                    "--format=csv,noheader,nounits",
                ],
                capture_output=True,
                text=True,
                timeout=0.5,
                check=False,
            )
            if proc.returncode != 0 or not proc.stdout.strip():
                return (0.0, 0, 0, None, None)
            parts = [p.strip() for p in proc.stdout.strip().splitlines()[0].split(",")]
            if len(parts) < 5:
                return (0.0, 0, 0, None, None)
            busy = float(parts[0])
            vram_used = int(float(parts[1]) * 1024 * 1024)
            vram_total = int(float(parts[2]) * 1024 * 1024)
            temp_c = float(parts[3]) if parts[3] not in ("N/A", "[N/A]", "") else None
            power_w = float(parts[4]) if parts[4] not in ("N/A", "[N/A]", "") else None
            return (busy, vram_used, vram_total, temp_c, power_w)
        except OSError, subprocess.SubprocessError, ValueError:
            return (0.0, 0, 0, None, None)

    def sample(self) -> TelemetrySnapshot:
        """Collect a new telemetry sample and advance all rolling history buffers."""
        now = time.monotonic()
        dt = max(0.05, now - self._last_time)
        self._last_time = now

        s = self.snapshot
        s.uptime_str = format_uptime(time.time() - self._boot_time)

        # CPU
        cores = psutil.cpu_percent(interval=None, percpu=True)
        s.cpu_cores = cores
        s.cpu_total = (sum(cores) / len(cores)) if cores else 0.0
        s.cpu_history.append(s.cpu_total)

        freq = psutil.cpu_freq()
        s.cpu_freq_ghz = (freq.current / 1000.0) if freq and freq.current else 0.0
        try:
            s.load_avg = os.getloadavg()
        except OSError:
            s.load_avg = (0.0, 0.0, 0.0)
        s.proc_count = len(psutil.pids())

        cpu_temp, gpu_temp = self._read_temperatures()
        s.cpu_temp_c = cpu_temp
        s.gpu_temp_c = gpu_temp

        # Memory & Swap
        vm = psutil.virtual_memory()
        sm = psutil.swap_memory()
        s.ram_pct = float(vm.percent)
        s.ram_used_bytes = int(vm.used)
        s.ram_total_bytes = int(vm.total)
        s.swap_pct = float(sm.percent)
        s.swap_used_bytes = int(sm.used)
        s.swap_total_bytes = int(sm.total)
        s.ram_history.append(s.ram_pct)
        s.swap_history.append(s.swap_pct)

        # Network
        iface, rx_total, tx_total = self._read_net_totals()
        _, prev_rx, prev_tx = self._last_net
        s.net_iface = iface
        s.net_rx_total = rx_total
        s.net_tx_total = tx_total
        s.net_rx_bps = max(0.0, (rx_total - prev_rx) / dt)
        s.net_tx_bps = max(0.0, (tx_total - prev_tx) / dt)
        s.net_rx_history.append(s.net_rx_bps)
        s.net_tx_history.append(s.net_tx_bps)
        self._last_net = (iface, rx_total, tx_total)

        # Disk I/O
        disk = psutil.disk_io_counters()
        if disk is not None and self._last_disk is not None:
            s.disk_read_bps = max(0.0, (disk.read_bytes - self._last_disk.read_bytes) / dt)
            s.disk_write_bps = max(0.0, (disk.write_bytes - self._last_disk.write_bytes) / dt)
        else:
            s.disk_read_bps = 0.0
            s.disk_write_bps = 0.0
        self._last_disk = disk
        s.disk_read_history.append(s.disk_read_bps)
        s.disk_write_history.append(s.disk_write_bps)

        # GPU
        if s.has_gpu:
            if self._amd_gpu_dir is not None:
                busy, vram_used, vram_total, power_w = self._read_amd_gpu()
            else:
                busy, vram_used, vram_total, nv_temp, power_w = self._read_nvidia_gpu()
                if nv_temp is not None:
                    s.gpu_temp_c = nv_temp
            s.gpu_busy_pct = busy
            s.gpu_vram_used = vram_used
            s.gpu_vram_total = vram_total
            s.gpu_vram_pct = (vram_used / vram_total * 100.0) if vram_total > 0 else 0.0
            s.gpu_power_w = power_w
            s.gpu_history.append(s.gpu_busy_pct)
            s.vram_history.append(s.gpu_vram_pct)

        return s
