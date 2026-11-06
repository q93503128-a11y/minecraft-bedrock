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
    source_revision = subprocess.check_output(["git", "-C", str(source), "rev-parse", "origin/main"], text=True).strip()
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
        if slug == "fishing_sense":
            fishing_mixin = "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/FishingHookAugmentMixin.java"
            if fishing_mixin not in source_paths:
                source_paths.append(fishing_mixin)
        interaction_refs = [
            {"line": line_number, "text": line.strip()}
            for line_number, line in enumerate(interaction_lines, start=1)
            if slug in line or name in line or entry["canonical_name_ko"] in line
        ]
        if slug == "precise_aim":
            interaction_refs.extend(
                {"line": line_number, "text": line.strip()}
                for line_number, line in enumerate(interaction_lines, start=1)
                if line.strip().startswith("- `ROOT_PROJECTILE`:")
                or line.strip().startswith("- `DERIVED_PROJECTILE`:")
                or line.strip().startswith("- **ROOT 직접 적중/직접 처치**")
                or line.strip().startswith("`분산 사격` 보조탄은")
            )
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
            "interaction_mapping_status": "REVIEW_REQUIRED" if interaction_refs or slug in {"webbed_feet", "fishing_sense"} else "NO_DIRECT_MENTION_FOUND",
            "compatibility_class": (
                "A" if slug in {"keen_edge", "webbed_feet"} else
                "B" if slug == "precise_aim" else
                "B" if slug in {"tough_skin", "light_landing", "strong_lungs"} else
                "B" if slug in {"bumper_crop", "seed_saver"} else
                "B" if slug == "hearty_meal" else
                "C" if slug in {"miners_hand", "logging_knack"} else
                "D" if slug in {"fishing_sense", "long_breath", "cold_adaptation"} else
                "UNASSESSED"
            ),
            "bedrock_method": (
                "health_boost effect refreshed from saved level" if slug == "sturdiness" else
                "Scale root melee damage in the stable entityHurt before-event; BDS verifies level 5 via production handler" if slug == "keen_edge" else
                "Scale player-owned projectile damage in the stable entityHurt before-event by 4% per level; max level 5" if slug == "precise_aim" else
                "Scale all incoming player damage in the stable entityHurt before-event by 2% per level; max level 5" if slug == "tough_skin" else
                "Scale player fall damage in the stable entityHurt before-event by 12% per level; max level 5" if slug == "light_landing" else
                "Scale player drowning damage in the stable entityHurt before-event by 15% per level; max level 3" if slug == "strong_lungs" else
                "On stable playerBreakBlock after-event, inspect the saved mature vanilla crop permutation and independently spawn its ordinary product with exact 8% per-level chance; max level 5" if slug == "bumper_crop" else
                "On stable playerBreakBlock after-event, independently spawn a mapped vanilla crop planting item with exact 15% per-level chance; max level 3" if slug == "seed_saver" else
                "On stable itemCompleteUse after-event, apply the Java food saturation bonus; read exact custom food properties when exposed and infer vanilla food saturation gain from adjacent server-tick samples" if slug == "hearty_meal" else
                "No stable API exposes or changes the vanilla FishingHook timeUntilLured timer. Stable entitySpawn and generic item-use events can observe casts, but do not provide the proportional wait-timer adjustment; Java mixes this timing change separately from its Treasure Fishing and final-result Abundance logic" if slug == "fishing_sense" else
                "No stable API exposes or changes the player's current air supply or oxygen depletion interval; the only documented airSupply setter is pre-release and is absent from stable @minecraft/server 2.11.0 declarations and the tested BDS runtime" if slug == "long_breath" else
                "No stable API exposes or changes a player's vanilla freeze-buildup counter; freezing is available only as a damage cause" if slug == "cold_adaptation" else
                "No stable API changes vanilla block-breaking speed; start/break events expose no progress value" if slug in {"miners_hand", "logging_knack"} else
                "Attempt player minecraft:movement currentValue multiplier" if slug == "quick_feet" else
                "Stable player exhaustion component can be read and written; exact per-action reduction route not yet verified" if slug == "efficient_metabolism" else
                "While player.isInWater, set the stable minecraft:underwater_movement attribute to defaultValue × (1 + 0.10 × saved level); restore defaultValue out of water" if slug == "webbed_feet" else
                "Not assessed"
            ),
            "api_constraints": (
                "health_boost route is +4 HP/level vs Java +2; effectiveMax is read-only; exact alternative not assessed" if slug == "sturdiness" else
                "Stable before-event; BDS simulated-player entityAttack event is verified; physical client melee and acquisition path remain untested" if slug == "keen_edge" else
                "Stable damage source exposes damagingProjectile and projectile owner. Current owner attribution cannot distinguish every ROOT_PROJECTILE from a player-owned DERIVED_PROJECTILE; physical arrow collision and acquisition remain untested" if slug == "precise_aim" else
                "B partial: Java applies after vanilla mitigation and skips delayed-damage context; Bedrock modifies before remaining mitigation and has no delayed-damage provenance mapping yet; armor/effect stacking parity unverified" if slug == "tough_skin" else
                "B partial: Bedrock cause fall maps the tested damage path, but its before-event runs before remaining mitigation while Java applies after mitigation; natural landing and Feather Falling stacking unverified" if slug == "light_landing" else
                "Stable before-event BDS verified; Bedrock applies the reduction before its remaining mitigation while Java applies it post-mitigation; armor/effect stacking parity is not yet verified" if slug == "strong_lungs" else
                "Partial mapping supports vanilla wheat, carrots, potatoes, and beetroot only. Stable after-event provides the pre-break permutation and player, but not the calculated ordinary drop list; Java modded crops and tool-specific crop drops are unresolved" if slug == "bumper_crop" else
                "Partial mapping supports vanilla wheat, carrots, potatoes, and beetroot planting items only. Java runs this 15% per-level roll independently after Bumper Crop; actual block-break delivery and external/modded crops remain unresolved" if slug == "seed_saver" else
                "Stable declarations describe itemCompleteUse as chargeable-item completion and vanilla ItemFoodComponent is not exposed for cooked beef. BDS 1.26.62.1 confirms the event fires for cooked beef; vanilla gain is measured as a saturation delta. Verify on each targeted Bedrock/BDS build; other same-tick saturation changes could affect the inferred gain" if slug == "hearty_meal" else
                "Class D for the exact vanilla-timer effect: stable @minecraft/server 2.11.0 has no fishing-bite event, FishingHook timer property, or timer setter. BDS 1.26.62.1 confirmed casts emit generic itemUse/itemStartUse/itemStopUse and spawn an owned minecraft:fishing_hook with only minecraft:projectile among tested components. The Java FishingHookAugmentMixin separately applies Treasure Fishing on retrieve and Abundance to the final result; these loot interactions remain outside this timing probe. Lure enchantment or custom-rod alternatives change the vanilla item/timing contract and do not reproduce a percentage reduction of each randomized wait" if slug == "fishing_sense" else
                "Class D for exact oxygen-consumption reduction on the currently pinned stable API: EntityBreathableComponent.airSupply is marked pre-release in the official reference, omitted from stable @minecraft/server 2.11.0 types, and not exposed by the breathable component on BDS 1.26.62.1. totalSupply is read-only; water_breathing would prevent oxygen loss rather than reduce it by Java's 10/20/30% curve" if slug == "long_breath" else
                "Class D for the exact freeze-buildup effect: Java reads and adjusts Player.ticksFrozen; stable @minecraft/server 2.11.0 exposes no frozen-tick getter, setter, component, or buildup event. The stable hurt event exposes freezing damage only, so multiplying damage would replace buildup reduction with a different effect. The BDS 1.26.62.1 player probe found no freeze component or matching player property" if slug == "cold_adaptation" else
                "Class C: stable start/break events can observe block interactions but expose no vanilla break-progress/speed control; reconstructing hold, tool, hardness, and cancellation behavior would differ, especially across touch/controller input" if slug in {"miners_hand", "logging_knack"} else
                "BDS 1.26.62.1: after level 5→1, movement currentValue returned to default on the next tick; persistent alternative not assessed" if slug == "quick_feet" else
                "BDS setter probe retained 1.25 for two ticks without changing hunger/saturation; stable API 2.11.0 exposes the current attribute but no per-player hook for each action-exhaustion addition; ordering relative to hunger processing remains unverified" if slug == "efficient_metabolism" else
                "Java adds Webbed Feet to a shared conditional movement modifier with Catch Breath, Nocturnal, Sun Affinity, and Momentum Shift; Bedrock currently uses the stable underwater_movement attribute. Standalone parity is verified on BDS 1.26.62.1, but stacking with those not-yet-ported augments and other attribute writers is untested" if slug == "webbed_feet" else
                "Not assessed"
            ),
            "test_method": (
                "BDS GameTest: max health at levels 1 and 5; core retained before selection result" if slug == "sturdiness" else
                "BDS GameTest: production before-event handler scales 10 simulated-player entityAttack damage to 12 at level 5; test-only production-pack entry seeds the pack-scoped property" if slug == "keen_edge" else
                "BDS GameTest: production before-event handler scales 1-damage owner-attributed projectile sources to 1.04/1.08/1.12/1.16/1.20 at levels 1–5; unaugmented and ownerless sources stay at 1; a physical arrow-hit experiment did not hit and is not counted as passing" if slug == "precise_aim" else
                "BDS GameTest: production before-event handler reduces 10 magic damage to 9.8/9.6/9.4/9.2/9.0 at levels 1–5; composition with typed reductions also tested" if slug == "tough_skin" else
                "BDS GameTest: production before-event handler reduces 10 simulated fall damage to 8.8/7.6/6.4/5.2/4.0 at levels 1–5; composition with Tough Skin also tested" if slug == "light_landing" else
                "BDS GameTest: production before-event handler reduces 10 simulated-player drowning damage to 8.5/7/5.5 at levels 1/2/3; test-only production-pack entry seeds the pack-scoped property" if slug == "strong_lungs" else
                "BDS GameTest calls the shared handler with synthetic break-event payloads: mature wheat at each exact level threshold, immature and unsupported blocks, and one ordinary product for each mapped vanilla crop; real block-break event delivery remains untested" if slug == "bumper_crop" else
                "BDS GameTest calls the shared crop handler with synthetic events: exact 15/30/45% boundaries, mapped planting items, and independent rolls alongside Bumper Crop; real player block-break delivery remains untested" if slug == "seed_saver" else
                "BDS 1.26.62.1 end-to-end GameTest consumes cooked beef through the production handler and checks exact saturation at levels 1–3 plus the food saturation cap" if slug == "hearty_meal" else
                "BDS 1.26.62.1 GameTest diagnostic casts a vanilla fishing rod, observes generic cast events and the owned fishing-hook entity, and queries projectile/fishing-hook/timer components. It found only minecraft:projectile; it does not test or implement bite timing" if slug == "fishing_sense" else
                "Official stable API declaration review plus BDS 1.26.62.1 GameTest submerged-player probe: minecraft:breathable exists but exposes no airSupply property at runtime; probe only, no oxygen behavior implemented" if slug == "long_breath" else
                "Stable @minecraft/server type review plus BDS 1.26.62.1 GameTest diagnostic in powder snow: no freeze component, frozen-tick member, or buildup event was available; probe only, no cold effect implemented" if slug == "cold_adaptation" else
                "Static stable API declaration review: start and after-break events expose no break-progress or vanilla mining-speed mutation; alternate custom hold/mining route not implemented" if slug in {"miners_hand", "logging_knack"} else
                "Exploratory BDS GameTest: immediate exact level 1 multiplier accepted, then default observed on next tick; excluded from passing suite" if slug == "quick_feet" else
                "BDS GameTest: set exhaustion to 1.25 and read the same value after two ticks; hunger 20 and saturation 5 are unchanged; natural exhaustion deltas are not tested" if slug == "efficient_metabolism" else
                "Production-handler BDS GameTest: simulated players swim in water at levels 1–3 and match 1.10/1.20/1.30 velocity ratios; out-of-water movement attribute restores to default. Java shared-bonus stacking with other movement augments is pending because those effects are not ported" if slug == "webbed_feet" else
                "Not implemented; see tests/ and docs/PORT_MATRIX.csv"
            ),
            "port_status": "PARTIAL_BDS_VERIFIED" if slug in {"sturdiness", "keen_edge", "precise_aim", "tough_skin", "light_landing", "strong_lungs", "bumper_crop", "seed_saver", "hearty_meal", "webbed_feet"} else "NOT_PORTED",
            "candidate_enabled": slug in {"keen_edge", "precise_aim", "tough_skin", "light_landing", "strong_lungs", "bumper_crop", "seed_saver", "hearty_meal", "webbed_feet"},
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
    fields = ["id", "name_ko", "tier", "tier_ko", "max_level", "canonical_effect_ko", "catalog_discrepancy", "java_source_paths", "interaction_contract_refs", "interaction_mapping_status", "compatibility_class", "bedrock_method", "api_constraints", "test_method", "port_status", "candidate_enabled"]
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
