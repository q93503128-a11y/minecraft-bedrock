"""Validate and package the Monster Restaurant source packs."""

from __future__ import annotations

import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
BP = PROJECT / "BP"
RP = PROJECT / "RP"
ASSETS = PROJECT / "assets" / "blockbench"
OUTPUT_DIR = PROJECT / "build"
OUTPUT = OUTPUT_DIR / "MonsterRestaurant-0.1.0.mcaddon"
NAMESPACE = "monster_restaurant"
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def fail(message: str):
    raise ValueError(message)


def validate_json():
    files = sorted([*BP.rglob("*.json"), *RP.rglob("*.json"), *ASSETS.glob("*.bbmodel")])
    if not files:
        fail("No source JSON found")
    for path in files:
        try:
            read_json(path)
        except Exception as exc:
            fail(f"Invalid JSON in {path.relative_to(PROJECT)}: {exc}")
    return files


def validate_manifests():
    bp = read_json(BP / "manifest.json")
    rp = read_json(RP / "manifest.json")
    uuids = []
    for manifest in (bp, rp):
        if manifest.get("format_version") != 2:
            fail("Pack manifest format_version must be 2")
        uuids.append(manifest["header"]["uuid"])
        uuids.extend(module["uuid"] for module in manifest["modules"])
    if len(set(uuids)) != len(uuids) or any(not UUID_RE.match(value) for value in uuids):
        fail("Pack UUIDs are malformed or duplicated")
    bp_deps = bp.get("dependencies", [])
    if not any(dep.get("uuid") == rp["header"]["uuid"] and dep.get("version") == rp["header"]["version"] for dep in bp_deps):
        fail("Behavior pack must depend on the matching resource pack")
    if not any(dep.get("module_name") == "@minecraft/server" and dep.get("version") == "2.11.0" for dep in bp_deps):
        fail("Expected stable @minecraft/server 2.11.0 dependency")
    if not any(dep.get("module_name") == "@minecraft/server-ui" and dep.get("version") == "2.3.0" for dep in bp_deps):
        fail("Expected stable @minecraft/server-ui 2.3.0 dependency")
    return bp, rp


def validate_references():
    block = read_json(BP / "blocks" / "skillet.json")["minecraft:block"]
    entity = read_json(BP / "entities" / "mushroom_boar.json")["minecraft:entity"]
    items = {read_json(path)["minecraft:item"]["description"]["identifier"] for path in (BP / "items").glob("*.json")}
    if block["description"]["identifier"] != f"{NAMESPACE}:skillet":
        fail("Skillet block identifier is inconsistent")
    if entity["description"]["identifier"] != f"{NAMESPACE}:mushroom_boar":
        fail("Mushroom boar identifier is inconsistent")
    if f"{NAMESPACE}:skillet" not in items or f"{NAMESPACE}:boar_meat" not in items or f"{NAMESPACE}:roast_boar" not in items:
        fail("A referenced custom item definition is missing")

    geometry_paths = [* (RP / "models" / "entity").glob("*.geo.json"), *(RP / "models" / "blocks").glob("*.geo.json")]
    geometry_ids = {
        geometry["description"]["identifier"]
        for path in geometry_paths
        for geometry in read_json(path)["minecraft:geometry"]
    }
    block_geometry = block["components"]["minecraft:geometry"]["identifier"]
    entity_geometry = read_json(RP / "entity" / "mushroom_boar.entity.json")["minecraft:client_entity"]["description"]["geometry"]["default"]
    if block_geometry not in geometry_ids or entity_geometry not in geometry_ids:
        fail("A block or entity geometry reference is unresolved")

    loot = entity["components"]["minecraft:loot"]["table"]
    if not (BP / loot).is_file():
        fail("Entity loot table reference is unresolved")
    loot_items = read_json(BP / loot)["pools"][0]["entries"][0]["name"]
    if loot_items not in items:
        fail("Entity loot table refers to an undefined item")
    block_loot = block["components"]["minecraft:loot"]
    if not (BP / block_loot).is_file():
        fail("Block loot table reference is unresolved")
    recipe_result = read_json(BP / "recipes" / "skillet.json")["minecraft:recipe_shaped"]["result"]["item"]
    if recipe_result not in items:
        fail("Skillet recipe refers to an undefined item")

    script = (BP / "scripts" / "main.js").read_text(encoding="utf-8")
    cooking = (BP / "scripts" / "cooking.js").read_text(encoding="utf-8")
    if f'{NAMESPACE}:skillet_interaction' not in script or f'{NAMESPACE}:boar_meat' not in cooking or f'{NAMESPACE}:roast_boar' not in cooking or f'{NAMESPACE}:cooked_roast_boar' not in cooking:
        fail("Cooking script identifiers do not match pack content")
    block_components = block["components"]
    if f'{NAMESPACE}:skillet_interaction' not in block_components:
        fail("Skillet is missing the registered interaction component")

    terrain = read_json(RP / "textures" / "terrain_texture.json")["texture_data"]
    item_textures = read_json(RP / "textures" / "item_texture.json")["texture_data"]
    for key, entry in {**terrain, **item_textures}.items():
        texture_path = entry["textures"]
        if isinstance(texture_path, dict):
            texture_path = texture_path.get("path")
        if not texture_path or not (RP / f"{texture_path}.png").is_file():
            fail(f"Texture atlas entry '{key}' points to a missing PNG")

    client = read_json(RP / "entity" / "mushroom_boar.entity.json")["minecraft:client_entity"]["description"]
    client_texture = RP / f"{client['textures']['default']}.png"
    if not client_texture.is_file():
        fail("Mushroom boar client texture is missing")
    if not (RP / "animations" / "mushroom_boar.animation.json").is_file():
        fail("Mushroom boar idle animation is missing")
    return len(items), len(geometry_ids)


def validate_spawn_rules():
    rules = read_json(BP / "spawn_rules" / "mushroom_boar.json")["minecraft:spawn_rules"]
    description = rules["description"]
    if description["identifier"] != f"{NAMESPACE}:mushroom_boar":
        fail("Mushroom boar spawn rule identifier does not match its entity")
    if description.get("population_control") != "monster":
        fail("Mushroom boar must use the monster population group")
    conditions = rules.get("conditions", [])
    if len(conditions) != 1:
        fail("Mushroom boar must have one explicit spawn condition set")
    condition = conditions[0]
    if "minecraft:is_experimental" in condition:
        fail("Production spawn rules must not require the experimental API toggle")
    if "minecraft:spawns_on_surface" not in condition:
        fail("Mushroom boar spawn rule must restrict spawns to the surface")
    if set(condition.get("minecraft:spawns_on_block_filter", [])) != {"minecraft:grass_block", "minecraft:podzol"}:
        fail("Mushroom boar surface blocks must remain grass block and podzol")
    if condition.get("minecraft:brightness_filter", {}).get("max") != 7:
        fail("Mushroom boar spawn brightness ceiling must remain 7")
    biome_tests = condition.get("minecraft:biome_filter", {}).get("any_of", [])
    biome_tags = {entry.get("value") for entry in biome_tests if entry.get("test") == "has_biome_tag"}
    if biome_tags != {"forest", "taiga"}:
        fail("Mushroom boar spawn biomes must remain forest and taiga")


def validate_pngs():
    pngs = sorted(RP.rglob("*.png"))
    if len(pngs) < 5:
        fail("Expected the entity, block, and three item textures")
    for path in pngs:
        data = path.read_bytes()
        if len(data) < 32 or not data.startswith(b"\x89PNG\r\n\x1a\n"):
            fail(f"Invalid PNG file: {path.relative_to(PROJECT)}")
        width = int.from_bytes(data[16:20], "big")
        height = int.from_bytes(data[20:24], "big")
        if width < 16 or height < 16:
            fail(f"Texture is too small: {path.relative_to(PROJECT)}")
    return pngs


def validate_script():
    scripts = sorted((BP / "scripts").rglob("*.js"))
    for script in scripts:
        result = subprocess.run(["node", "--check", str(script)], capture_output=True, text=True)
        if result.returncode:
            fail(result.stderr.strip() or f"JavaScript syntax check failed: {script.relative_to(PROJECT)}")


def package():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for pack_name, pack_root in (("MonsterRestaurant_BP", BP), ("MonsterRestaurant_RP", RP)):
            for path in sorted(p for p in pack_root.rglob("*") if p.is_file()):
                archive.write(path, (Path(pack_name) / path.relative_to(pack_root)).as_posix())
    with zipfile.ZipFile(OUTPUT) as archive:
        manifests = [name for name in archive.namelist() if name.endswith("manifest.json")]
        if len(manifests) != 2:
            fail("Package must contain exactly one manifest for each pack")
    return OUTPUT


def main():
    json_files = validate_json()
    validate_manifests()
    item_count, geometry_count = validate_references()
    validate_spawn_rules()
    pngs = validate_pngs()
    validate_script()
    package_path = package()
    print("STATIC_PASS")
    print(f"JSON sources: {len(json_files)}")
    print(f"Custom item definitions: {item_count}")
    print(f"Bedrock geometries: {geometry_count}")
    print(f"PNG textures: {len(pngs)}")
    print(f"Package: {package_path.relative_to(PROJECT)} ({package_path.stat().st_size:,} bytes)")
    print("ENGINE_TESTS: separate GameTest/BDS suite; run npm run test:engine")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"STATIC_FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
