from __future__ import annotations

import json
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
OUTPUT = BUILD / "DuskveilStatusWindow-0.1.0.mcaddon"
FIXED_TIME = (1980, 1, 1, 0, 0, 0)


def deterministic_zip_entry(name: str, data: bytes) -> zipfile.ZipInfo:
    info = zipfile.ZipInfo(name, FIXED_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.external_attr = 0o100644 << 16
    return info


def package_folder(folder: Path, archive_name: str) -> bytes:
    archive_path = BUILD / archive_name
    archive_path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(folder.rglob("*")):
            if not path.is_file():
                continue
            if "__pycache__" in path.parts:
                continue
            relative = path.relative_to(folder).as_posix()
            archive.writestr(deterministic_zip_entry(relative, path.read_bytes()), path.read_bytes())
    return archive_path.read_bytes()


def main() -> int:
    BUILD.mkdir(parents=True, exist_ok=True)
    behavior = package_folder(ROOT / "BP", "DuskveilStatusWindow_BP.mcpack")
    resources = package_folder(ROOT / "RP", "DuskveilStatusWindow_RP.mcpack")

    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as addon:
        addon.writestr(deterministic_zip_entry("DuskveilStatusWindow_BP.mcpack", behavior), behavior)
        addon.writestr(deterministic_zip_entry("DuskveilStatusWindow_RP.mcpack", resources), resources)

    with zipfile.ZipFile(OUTPUT) as addon:
        bad_outer_entry = addon.testzip()
        if bad_outer_entry:
            raise RuntimeError(f"Corrupt MCAddon entry: {bad_outer_entry}")
        for name in addon.namelist():
            payload = addon.read(name)
            from io import BytesIO

            with zipfile.ZipFile(BytesIO(payload)) as pack:
                bad_pack_entry = pack.testzip()
                if bad_pack_entry:
                    raise RuntimeError(f"Corrupt entry in {name}: {bad_pack_entry}")

    print(f"Built {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Build failed: {error}", file=sys.stderr)
        raise
