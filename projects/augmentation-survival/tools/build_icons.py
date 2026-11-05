#!/usr/bin/env python3
"""Create small original pixel icons for the project's cores and devices."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "RP/textures/items"
COLORS = {
    "common_core": (125, 185, 210), "uncommon_core": (83, 190, 112),
    "rare_core": (74, 125, 227), "epic_core": (174, 91, 216),
    "legendary_core": (240, 171, 48), "mythic_core": (230, 71, 75),
    "device": (130, 140, 151), "advanced_device": (232, 160, 54),
}


def chunk(name: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", zlib.crc32(name + payload) & 0xFFFFFFFF)


def save_png(path: Path, rgb: tuple[int, int, int]) -> None:
    width = height = 16
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            d = abs(x - 7.5) + abs(y - 7.5)
            if 3 <= d <= 8:
                color = rgb if x + y < 15 else tuple(max(0, channel - 55) for channel in rgb)
                alpha = 255
            elif d < 3:
                color, alpha = (235, 244, 250), 255
            else:
                color, alpha = (0, 0, 0), 0
            row.extend((*color, alpha))
        rows.append(bytes(row))
    raw = b"".join(rows)
    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, color in COLORS.items():
        save_png(OUT / f"{name}.png", color)
    print(f"Generated {len(COLORS)} 16x16 icons in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
