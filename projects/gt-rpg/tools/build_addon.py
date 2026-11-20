"""Build reproducible .mcpack files and a single importable .mcaddon."""

from __future__ import annotations

import hashlib
import io
import json
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "build"
STAMP = (2026, 11, 20, 0, 0, 0)


def zip_directory(folder: Path) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in sorted(folder.rglob("*")):
            if not path.is_file():
                continue
            info = zipfile.ZipInfo(path.relative_to(folder).as_posix(), date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return buffer.getvalue()


def main() -> None:
    bp_manifest = json.loads((ROOT / "BP" / "manifest.json").read_text(encoding="utf-8"))
    rp_manifest = json.loads((ROOT / "RP" / "manifest.json").read_text(encoding="utf-8"))
    version = ".".join(str(part) for part in bp_manifest["header"]["version"])
    if bp_manifest["dependencies"][0]["uuid"] != rp_manifest["header"]["uuid"]:
        raise SystemExit("Behavior Pack does not depend on this Resource Pack")
    for pack in (ROOT / "BP", ROOT / "RP"):
        if not (pack / "manifest.json").is_file():
            raise SystemExit(f"Missing manifest: {pack}")
        if any(path.stat().st_size == 0 for path in pack.rglob("*.*") if path.is_file()):
            raise SystemExit(f"Empty pack file found under {pack}")

    BUILD.mkdir(exist_ok=True)
    bp_name = f"GT-RPG-BP-{version}.mcpack"
    rp_name = f"GT-RPG-RP-{version}.mcpack"
    bp_bytes = zip_directory(ROOT / "BP")
    rp_bytes = zip_directory(ROOT / "RP")
    (BUILD / bp_name).write_bytes(bp_bytes)
    (BUILD / rp_name).write_bytes(rp_bytes)

    addon_buffer = io.BytesIO()
    with zipfile.ZipFile(addon_buffer, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as addon:
        for name, content in ((bp_name, bp_bytes), (rp_name, rp_bytes)):
            info = zipfile.ZipInfo(name, date_time=STAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            addon.writestr(info, content, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)

    addon_path = BUILD / f"GT-RPG_{version}.mcaddon"
    addon_path.write_bytes(addon_buffer.getvalue())
    digest = hashlib.sha256(addon_path.read_bytes()).hexdigest()
    (BUILD / f"GT-RPG_{version}.mcaddon.sha256").write_text(f"{digest}  {addon_path.name}\n", encoding="ascii")
    print(f"Built {addon_path.relative_to(ROOT)} ({addon_path.stat().st_size} bytes)")
    print(f"SHA-256 {digest}")


if __name__ == "__main__":
    main()
