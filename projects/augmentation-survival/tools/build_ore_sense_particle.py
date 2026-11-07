#!/usr/bin/env python3
"""Generate the shared 16x16 white spark textures tinted by perception particles."""
from __future__ import annotations

import binascii
import struct
import zlib
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
OUTPUTS = (
    PROJECT / "RP/textures/particles/ore_sense_marker.png",
    PROJECT / "RP/textures/particles/chest_finder_marker.png",
)
SIZE = 16


def chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", binascii.crc32(kind + data) & 0xFFFFFFFF)


def build_png() -> bytes:
    scanlines = bytearray()
    for y in range(SIZE):
        scanlines.append(0)  # PNG filter: None
        for x in range(SIZE):
            distance = abs(x - 7.5) + abs(y - 7.5)
            if distance <= 2:
                alpha = 255
            elif distance <= 4:
                alpha = 196
            elif distance <= 6:
                alpha = 72
            else:
                alpha = 0
            scanlines.extend((255, 255, 255, alpha))

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(bytes(scanlines), level=9))
        + chunk(b"IEND", b"")
    )


def main() -> None:
    texture = build_png()
    for output in OUTPUTS:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(texture)
        print(f"PERCEPTION_PARTICLE_TEXTURE_READY: {output.relative_to(PROJECT)} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    main()
