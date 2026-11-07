from __future__ import annotations

import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BP = ROOT / "BP"
RP = ROOT / "RP"
BUILD = ROOT / "build"
OUTPUT = BUILD / "DuskveilStatusWindow-0.1.0.mcaddon"


def load_json(path: Path):
    with path.open(encoding="utf-8") as source:
        return json.load(source)


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def main() -> int:
    json_files = sorted([*BP.rglob("*.json"), *RP.rglob("*.json")])
    for path in json_files:
        load_json(path)

    bp = load_json(BP / "manifest.json")
    rp = load_json(RP / "manifest.json")
    bp_ids = [bp["header"]["uuid"], *(module["uuid"] for module in bp["modules"])]
    rp_ids = [rp["header"]["uuid"], *(module["uuid"] for module in rp["modules"])]
    all_ids = bp_ids + rp_ids
    require(len(all_ids) == len(set(all_ids)), "Pack and module UUIDs must be unique.")
    require(bp["header"]["min_engine_version"] == [1, 26, 0], "Unexpected behavior pack engine baseline.")
    require(rp["header"]["min_engine_version"] == [1, 26, 0], "Unexpected resource pack engine baseline.")

    dependencies = bp["dependencies"]
    require(any(item.get("uuid") == rp["header"]["uuid"] for item in dependencies), "Behavior pack must depend on the matching resource pack.")
    api_versions = {item.get("module_name"): item.get("version") for item in dependencies if "module_name" in item}
    require(api_versions.get("@minecraft/server") == "2.11.0", "Unexpected stable @minecraft/server version.")
    require(api_versions.get("@minecraft/server-ui") == "2.3.0", "Unexpected stable @minecraft/server-ui version.")

    script = BP / "scripts" / "main.js"
    subprocess.run(["node", "--check", str(script)], check=True, cwd=ROOT)
    source = script.read_text(encoding="utf-8")
    texture_base_match = re.search(r'const UI_TEXTURE = "([^"]+)"', source)
    require(texture_base_match is not None, "Missing UI texture base path.")
    texture_base = texture_base_match.group(1)
    require(texture_base == "textures/ui/status-window/", f"Unexpected UI texture base: {texture_base}")
    texture_names = set(re.findall(r'\$\{UI_TEXTURE\}([a-z0-9-]+)', source))
    texture_names.update(re.findall(r'imageDetails\("([a-z0-9-]+)"', source))
    texture_refs = sorted(texture_names)
    require(bool(texture_refs), "No UI textures are referenced by the script.")
    for texture_ref in texture_refs:
        texture = RP / f"{texture_base}{texture_ref}.png"
        require(texture.is_file(), f"Missing UI texture: {texture_ref}.png")
        require(texture.stat().st_size > 128, f"UI texture is unexpectedly small: {texture_ref}.png")

    if OUTPUT.exists():
        with zipfile.ZipFile(OUTPUT) as addon:
            require(addon.testzip() is None, "MCAddon outer archive failed CRC integrity check.")
            require(set(addon.namelist()) == {"DuskveilStatusWindow_BP.mcpack", "DuskveilStatusWindow_RP.mcpack"}, "Unexpected files in MCAddon.")
            for pack_name in addon.namelist():
                from io import BytesIO

                with zipfile.ZipFile(BytesIO(addon.read(pack_name))) as pack:
                    require(pack.testzip() is None, f"{pack_name} failed CRC integrity check.")

    print(f"PASS: {len(json_files)} JSON files parse; manifests, UUIDs, stable API versions, {len(texture_refs)} UI textures and JavaScript syntax are consistent.")
    if OUTPUT.exists():
        print("PASS: built MCAddon and embedded MCPack archives pass CRC integrity checks.")
    else:
        print("NOTE: package CRC check skipped because the MCAddon has not been built yet.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        raise
