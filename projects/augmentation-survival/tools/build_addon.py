#!/usr/bin/env python3
"""Validate and package the Behavior/Resource Pack sources reproducibly."""
from __future__ import annotations

import json
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BP, RP = ROOT / "BP", ROOT / "RP"
BUILD = ROOT / "build"


def json_files(folder: Path):
    return sorted(folder.rglob("*.json"))


def validate() -> None:
    for folder in (BP, RP):
        for file in json_files(folder):
            with file.open(encoding="utf-8") as stream:
                json.load(stream)
    bp = json.loads((BP / "manifest.json").read_text(encoding="utf-8"))
    rp = json.loads((RP / "manifest.json").read_text(encoding="utf-8"))
    assert bp["header"]["min_engine_version"] == [1, 26, 0]
    assert len({bp["header"]["uuid"], rp["header"]["uuid"], *(m["uuid"] for m in bp["modules"]), *(m["uuid"] for m in rp["modules"])}) == 5
    assert any(dep.get("uuid") == rp["header"]["uuid"] for dep in bp["dependencies"])
    roster = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
    assert len(roster["augments"]) == 149
    assert {tier: sum(a["tier"] == tier for a in roster["augments"]) for tier in roster["expected_counts"]} == roster["expected_counts"]
    ids = {f"augmentation_survival:{tier}_augment_core" for tier in ("common", "uncommon", "rare", "epic", "legendary", "mythic")}
    item_ids = {json.loads(file.read_text(encoding="utf-8"))["minecraft:item"]["description"]["identifier"] for file in (BP / "items").glob("*.json")}
    assert ids.issubset(item_ids)
    script = (BP / "scripts/main.js").read_text(encoding="utf-8")
    atlas_files = list((RP / "textures").glob("*_texture.json"))
    atlas = {}
    for atlas_file in atlas_files:
        atlas.update(json.loads(atlas_file.read_text(encoding="utf-8"))["texture_data"])
    for name, definition in atlas.items():
        texture = definition["textures"]
        texture_path = RP / f"{texture}.png"
        assert texture_path.is_file() and texture_path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"), texture_path
    pocket_texture = RP / "textures/entity/pocket_storage.png"
    assert pocket_texture.is_file() and pocket_texture.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"), pocket_texture
    for file in (BP / "items").glob("*.json"):
        components = json.loads(file.read_text(encoding="utf-8"))["minecraft:item"]["components"]
        icon = components["minecraft:icon"]["textures"]["default"]
        assert icon in atlas, (file, icon)
    assert "world.afterEvents.itemUse.subscribe" in script
    for recipe in (BP / "recipes").glob("*.json"):
        result = json.loads(recipe.read_text(encoding="utf-8"))["minecraft:recipe_shaped"]["result"]["item"]
        assert result in item_ids
        assert json.loads(recipe.read_text(encoding="utf-8"))["minecraft:recipe_shaped"].get("unlock") == {"context": "AlwaysUnlocked"}
    passive_script = (BP / "scripts/passives.js").read_text(encoding="utf-8")
    assert 'addEffect("health_boost"' in passive_script


def pack(folder: Path, destination: Path) -> None:
    with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(folder.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(folder).as_posix())


def build() -> Path:
    validate()
    BUILD.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="augmentation-survival-") as temp:
        temp_root = Path(temp)
        bp_pack, rp_pack = temp_root / "AugmentationSurvival_BP.mcpack", temp_root / "AugmentationSurvival_RP.mcpack"
        pack(BP, bp_pack)
        pack(RP, rp_pack)
        output = BUILD / "AugmentationSurvival-0.1.0.mcaddon"
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
            archive.write(bp_pack, bp_pack.name)
            archive.write(rp_pack, rp_pack.name)
    return output


if __name__ == "__main__":
    result = build()
    print(f"Built {result.relative_to(ROOT)} ({result.stat().st_size} bytes)")
