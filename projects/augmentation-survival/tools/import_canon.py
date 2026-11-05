#!/usr/bin/env python3
"""Import the read-only Java canon into machine-readable Bedrock project data."""
from __future__ import annotations

import csv
import json
import re
import subprocess
import sys
from pathlib import Path


TIER_KO = {
    "common": "일반", "uncommon": "고급", "rare": "희귀",
    "epic": "영웅", "legendary": "전설", "mythic": "신화",
}


def main(source: Path, target: Path) -> None:
    project = source / "projects" / "augmentation-survival"
    catalog_path = project / "src/main/resources/data/augmentation_survival/augmentation/augment_catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    source_revision = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"], text=True).strip()
    canon = (project / "AUGMENTS.md").read_text(encoding="utf-8")
    roster_tables: dict[str, list[tuple[str, int, str]]] = {tier: [] for tier in TIER_KO.values()}
    tier = ""
    for line in canon.splitlines():
        match = re.match(r"## \d+\. 확정 — ([^ (]+)", line)
        if match:
            tier = match.group(1)
            continue
        if not line.startswith("|") or not tier:
            continue
        # Only the first two separators are structural; a few canon effects contain pipes.
        cells = [cell.strip() for cell in line.strip().strip("|").split("|", 2)]
        if len(cells) == 3 and cells[0] != "이름" and cells[0].strip("-") and cells[1].isdigit():
            roster_tables[tier].append((cells[0], int(cells[1]), cells[2]))

    java_root = project / "src/main/java"
    java_files = list(java_root.rglob("*.java"))
    source_hits: dict[str, list[str]] = {item["id"]: [] for item in catalog["augments"]}
    id_pattern = re.compile(r"\b(?:" + "|".join(re.escape(key) for key in source_hits) + r")\b")
    for file in java_files:
        try:
            source_text = file.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        relative = file.relative_to(project).as_posix()
        for found in set(id_pattern.findall(source_text)):
            source_hits[found].append(relative)
    interaction_path = project / "AUGMENT_INTERACTION_CONTRACT_2026-10-24.md"
    interaction_lines = interaction_path.read_text(encoding="utf-8").splitlines()
    records = []
    canon_index = {tier: 0 for tier in TIER_KO.values()}
    for entry in catalog["augments"]:
        table_tier = TIER_KO[entry["tier"]]
        index = canon_index[table_tier]
        canon_index[table_tier] += 1
        if index >= len(roster_tables[table_tier]):
            raise ValueError(f"Canonical roster table is missing {entry['id']} ({table_tier}: {index} parsed, {len(roster_tables[table_tier])} rows)")
        name, max_level, effect = roster_tables[table_tier][index]
        slug = entry["id"]
        source_paths = source_hits[slug]
        interaction_refs = [
            {"line": line_number, "text": line.strip()}
            for line_number, line in enumerate(interaction_lines, start=1)
            if slug in line or name in line or entry["canonical_name_ko"] in line
        ]
        source_mismatch = []
        if name != entry["canonical_name_ko"]:
            source_mismatch.append(f"catalog name={entry['canonical_name_ko']}")
        if max_level != entry["max_level"]:
            source_mismatch.append(f"catalog max_level={entry['max_level']}")
        records.append({
            "id": f"augmentation_survival:{slug}",
            "name_ko": name,
            "tier": entry["tier"],
            "tier_ko": TIER_KO[entry["tier"]],
            "max_level": max_level,
            "canonical_effect_ko": effect,
            "catalog_discrepancy": "; ".join(source_mismatch),
            "java_source_paths": source_paths,
            "interaction_contract_refs": interaction_refs,
            "interaction_mapping_status": "REVIEW_REQUIRED" if interaction_refs else "NO_DIRECT_MENTION_FOUND",
            "bedrock_method": (
                "health_boost effect refreshed from saved level" if slug == "sturdiness" else
                "Scale root melee damage in the stable entityHurt before-event" if slug == "keen_edge" else
                "Attempt player minecraft:movement currentValue multiplier" if slug == "quick_feet" else
                "Attempt player minecraft:underwater_movement currentValue multiplier" if slug == "webbed_feet" else
                "Not assessed"
            ),
            "api_constraints": (
                "D exact parity: health_boost is +4 HP/level vs Java +2; effectiveMax is read-only" if slug == "sturdiness" else
                "Stable before-event; only root entityAttack is classified; SimulatedPlayer event routing is unverified" if slug == "keen_edge" else
                "BDS 1.26.62.1: after level 5→1, movement currentValue returned to default on the next tick; persistent alternative not assessed" if slug == "quick_feet" else
                "BDS 1.26.62.1: level 3 value persisted for one idle tick; lower-level persistence not reached; alternative not assessed" if slug == "webbed_feet" else
                "Not assessed"
            ),
            "test_method": (
                "BDS GameTest: max health at levels 1 and 5; core retained before selection result" if slug == "sturdiness" else
                "Not yet engine-verified; SimulatedPlayer hurt callback did not provide an event payload" if slug == "keen_edge" else
                "Exploratory BDS GameTest: immediate exact level 1 multiplier accepted, then default observed on next tick; excluded from passing suite" if slug == "quick_feet" else
                "Exploratory BDS GameTest: exact level 3 multiplier verified after one tick; lower-level follow-up assertion not reached; excluded from passing suite" if slug == "webbed_feet" else
                "Not implemented; see tests/ and docs/PORT_MATRIX.csv"
            ),
            "port_status": "PARTIAL_BDS_VERIFIED" if slug == "sturdiness" else "IMPLEMENTED_UNVERIFIED" if slug == "keen_edge" else "NOT_PORTED",
        })

    counts = {tier: sum(1 for x in records if x["tier"] == tier) for tier in TIER_KO}
    if len(records) != 149 or counts != catalog["expected_counts"] or any(canon_index[t] != len(roster_tables[t]) for t in canon_index):
        raise ValueError(f"Canonical roster mismatch: {len(records)} / {counts}")
    (target / "BP/scripts").mkdir(parents=True, exist_ok=True)
    (target / "docs").mkdir(parents=True, exist_ok=True)
    (target / "BP/scripts/augment-data.js").write_text(
        "// Generated from the Java canonical roster and AUGMENTS.md. Do not hand-edit.\n"
        "export const AUGMENTS = " + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    (target / "docs/augment-roster.json").write_text(
        json.dumps({"source_revision": source_revision, "expected_counts": catalog["expected_counts"], "augments": records}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    fields = ["id", "name_ko", "tier", "tier_ko", "max_level", "canonical_effect_ko", "catalog_discrepancy", "java_source_paths", "interaction_contract_refs", "interaction_mapping_status", "bedrock_method", "api_constraints", "test_method", "port_status"]
    with (target / "docs/PORT_MATRIX.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        for record in records:
            row = dict(record)
            row["java_source_paths"] = ";".join(row["java_source_paths"])
            row["interaction_contract_refs"] = ";".join(f"L{x['line']}: {x['text']}" for x in row["interaction_contract_refs"])
            writer.writerow(row)

    # Preserve exactly the source of truth (including historical entries) for future review.
    source_docs = [
        "PROJECT.md", "AUGMENTS.md", "AUGMENT_PROPOSAL_HISTORY.md", "GAME_DESIGN.md",
        "AUGMENT_INTERACTION_CONTRACT_2026-10-24.md",
        "CORE_ACQUISITION_DESIGN_2026-10-24.md", "MODPACK_BASELINE.md",
        "FINAL_AUDIT_2026-10-29.md", "POST_AUDIT_CLOSURE_2026-10-29.md",
        "AUGMENT_CANON_CORRECTION_2026-10-27.md", "CODE_AUDIT_2026-10-29.md",
        "CODE_AUDIT_2026-10-29_INVENTORY.csv", "LIVE_PLAYTEST_FIX_LEDGER_2026-10-31_BUNDLE_J.md",
        "MANUAL_PLAYTEST_BACKLOG.md", "AUTHORITY_THEFT_IMPLEMENTATION_REVIEW_2026-11-05.md",
        "AUTHORITY_THEFT_SIGNATURE_ROADMAP_2026-11-05.md",
        "DOMINATION_SPECIAL_AI_REPAIR_2026-11-05.md", "UI_REDESIGN_DIRECTION_2026-11-05.md",
    ]
    archive = target / "docs/java-canon"
    archive.mkdir(parents=True, exist_ok=True)
    for name in source_docs:
        (archive / name).write_bytes((project / name).read_bytes())
    print(json.dumps({"count": len(records), "counts": counts, "canonical_discrepancies": sum(bool(x["catalog_discrepancy"]) for x in records), "with_java_sources": sum(bool(x["java_source_paths"]) for x in records)}, ensure_ascii=False))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: import_canon.py <java-repo> <bedrock-project>")
    main(Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve())
