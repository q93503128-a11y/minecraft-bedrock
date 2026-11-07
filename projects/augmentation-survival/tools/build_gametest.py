#!/usr/bin/env python3
"""Assemble isolated production packs plus a separate BDS GameTest pack."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "build/gametest-packs"
TEST_BP = PROJECT / "tests/gametest/BP"


def main() -> None:
    subprocess.run([sys.executable, str(PROJECT / "tools/build_ore_sense_particle.py")], check=True)
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    production_bp = OUTPUT / "AugmentationSurvival_BP"
    shutil.copytree(PROJECT / "BP", production_bp)
    shutil.copytree(PROJECT / "RP", OUTPUT / "AugmentationSurvival_RP")
    shutil.copytree(TEST_BP, OUTPUT / "AugmentationSurvival_GameTests")
    shutil.copy2(
        PROJECT / "tests/gametest/production-test-entry.js",
        production_bp / "scripts/engine-test-entry.js",
    )
    production_manifest_path = production_bp / "manifest.json"
    production_manifest = json.loads(production_manifest_path.read_text(encoding="utf-8"))
    script_modules = [module for module in production_manifest.get("modules", []) if module.get("type") == "script"]
    if len(script_modules) != 1 or script_modules[0].get("entry") != "scripts/main.js":
        raise SystemExit("Production BP script entry changed; update the isolated GameTest entry wrapper.")
    script_modules[0]["entry"] = "scripts/engine-test-entry.js"
    production_manifest_path.write_text(json.dumps(production_manifest, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(PROJECT / "BP/scripts/cores.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/cores.js")
    shutil.copy2(PROJECT / "BP/scripts/offers.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/offers.js")
    shutil.copy2(PROJECT / "BP/scripts/augment-data.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/augment-data.js")
    shutil.copy2(PROJECT / "BP/scripts/harvest.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/harvest.js")
    shutil.copy2(PROJECT / "BP/scripts/tool-care.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/tool-care.js")
    shutil.copy2(PROJECT / "BP/scripts/loot-scoop.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/loot-scoop.js")
    shutil.copy2(PROJECT / "BP/scripts/progression.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/progression.js")
    shutil.copy2(PROJECT / "BP/scripts/movement.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/movement.js")
    shutil.copy2(PROJECT / "BP/scripts/ore-sense.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/ore-sense.js")
    shutil.copy2(PROJECT / "BP/scripts/chest-finder.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/chest-finder.js")
    shutil.copy2(PROJECT / "BP/scripts/danger-sense.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/danger-sense.js")
    shutil.copy2(PROJECT / "BP/scripts/perception-outline.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/perception-outline.js")
    shutil.copy2(PROJECT / "BP/scripts/pickup-hand.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/pickup-hand.js")
    shutil.copy2(PROJECT / "BP/scripts/armor-care-rules.js", OUTPUT / "AugmentationSurvival_GameTests/scripts/armor-care-rules.js")

    manifests = [json.loads(path.read_text(encoding="utf-8")) for path in OUTPUT.glob("*/manifest.json")]
    uuids = [manifest["header"]["uuid"] for manifest in manifests]
    uuids.extend(module["uuid"] for manifest in manifests for module in manifest.get("modules", []))
    if len(uuids) != len(set(uuids)):
        raise SystemExit("Engine test packs contain duplicate header/module UUIDs.")
    game_tests = json.loads((OUTPUT / "AugmentationSurvival_GameTests/manifest.json").read_text(encoding="utf-8"))
    if not any(dependency.get("module_name") == "@minecraft/server-gametest" for dependency in game_tests.get("dependencies", [])):
        raise SystemExit("GameTest module dependency is missing from the isolated test pack.")
    if not any(dependency.get("uuid") == "365c78a0-d74a-4f42-8e4b-2c147e1dc447" for dependency in game_tests["dependencies"]):
        raise SystemExit("The engine test pack must depend on the production behavior pack.")
    print(f"ENGINE_TEST_PACKS_READY: {OUTPUT.relative_to(PROJECT)} ({len(manifests)} separate packs)")


if __name__ == "__main__":
    main()
