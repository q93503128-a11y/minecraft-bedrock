#!/usr/bin/env python3
"""Build the transparent 1x1 texture for the non-rendering pocket storage anchor."""
from __future__ import annotations

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "RP/textures/entity/pocket_storage.png"


def chunk(name: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", zlib.crc32(name + payload) & 0xFFFFFFFF)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    header = struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0)
    pixel = zlib.compress(b"\x00\x00\x00\x00\x00", 9)
    OUTPUT.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", header)
        + chunk(b"IDAT", pixel)
        + chunk(b"IEND", b"")
    )
    print(f"POCKET_ANCHOR_TEXTURE_READY: {OUTPUT.relative_to(ROOT)} (1x1 transparent)")


if __name__ == "__main__":
    main()
