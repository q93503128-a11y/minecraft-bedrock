"""Assemble a disposable BDS test set without altering the release packs."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / "build" / "gametest-packs"
TEST_BP = PROJECT / "tests" / "gametest" / "BP"


def copy_pack(source: Path, destination: Path) -> None:
    shutil.copytree(source, destination, dirs_exist_ok=True)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    copy_pack(PROJECT / "BP", OUTPUT / "MonsterRestaurant_BP")
    copy_pack(PROJECT / "RP", OUTPUT / "MonsterRestaurant_RP")
    copy_pack(TEST_BP, OUTPUT / "MonsterRestaurant_GameTests")
    shutil.copy2(PROJECT / "BP" / "scripts" / "cooking.js", OUTPUT / "MonsterRestaurant_GameTests" / "scripts" / "cooking.js")

    manifests = [json.loads((pack / "manifest.json").read_text(encoding="utf-8")) for pack in OUTPUT.iterdir() if (pack / "manifest.json").is_file()]
    headers = [manifest["header"]["uuid"] for manifest in manifests]
    module_uuids = [module["uuid"] for manifest in manifests for module in manifest.get("modules", [])]
    all_uuids = headers + module_uuids
    if len(all_uuids) != len(set(all_uuids)):
        raise SystemExit("Engine test packs contain duplicate header/module UUIDs.")

    test_manifest = json.loads((OUTPUT / "MonsterRestaurant_GameTests" / "manifest.json").read_text(encoding="utf-8"))
    dependencies = test_manifest.get("dependencies", [])
    if not any(dep.get("module_name") == "@minecraft/server-gametest" for dep in dependencies):
        raise SystemExit("GameTest module dependency is missing from the isolated test pack.")
    print(f"ENGINE_TEST_PACKS_READY: {OUTPUT.relative_to(PROJECT)} ({len(manifests)} separate packs)")


if __name__ == "__main__":
    main()
