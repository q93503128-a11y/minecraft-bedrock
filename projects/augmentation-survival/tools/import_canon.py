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
    project_diff = subprocess.run(
        ["git", "-C", str(source), "diff", "--quiet", "origin/main", "--", "projects/augmentation-survival"],
        check=False,
    )
    if project_diff.returncode != 0:
        raise RuntimeError("The Java checkout's augmentation-survival files differ from fetched origin/main; refresh the read-only source before importing.")
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
        if slug == "treasure_fishing":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/FishingHookAugmentMixin.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/resource/ConsumptionAugmentService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/resource/ConsumptionAugmentTuning.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/resource/TreasureFishingService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/resource/AbundanceService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/core/FishingCoreRewardService.java",
                "src/main/resources/data/augmentation_survival/augmentation/consumption_fishing_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "fishing_sense":
            fishing_mixin = "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/FishingHookAugmentMixin.java"
            if fishing_mixin not in source_paths:
                source_paths.append(fishing_mixin)
        if slug == "fast_eating":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/ItemStackConsumptionAugmentMixin.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/active/AdvancedActiveAugmentService.java",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "fuel_saver":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/AbstractFurnaceUtilityMixin.java",
                "src/main/resources/data/augmentation_survival/augmentation/utility_runtime_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "extra_piece":
            relative = "src/main/resources/data/augmentation_survival/augmentation/resource_harvest_contract.json"
            if relative not in source_paths:
                source_paths.append(relative)
        if slug == "tool_care":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/ItemStackDurabilityAugmentMixin.java",
                "src/main/resources/data/augmentation_survival/augmentation/survival_modifier_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "dexterity":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/resource/AbundanceService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/BlockAbundanceMixin.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/ServerPlayerGameModeEnchantmentResonanceMixin.java",
                "src/main/resources/data/augmentation_survival/tags/block/dexterity_gathering.json",
                "src/main/resources/data/augmentation_survival/tags/item/abundance_excluded.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "recovery":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/mixin/FoodDataAugmentMixin.java",
                "src/main/resources/data/augmentation_survival/augmentation/survival_modifier_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "catch_breath":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/combat/AugmentMovementBonusService.java",
                "src/main/resources/data/augmentation_survival/augmentation/movement_modifier_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "quick_feet":
            # This entry is declared by the generic stat-modifier contract rather than
            # a Java source literal containing its catalog ID.
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/StatAugmentCatalog.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/PlayerStatAugmentService.java",
                "src/main/resources/data/augmentation_survival/augmentation/stat_modifier_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "long_reach":
            # The generic Java attribute reconciler consumes this contract entry;
            # player presentation is data-driven in the uncommon presentation file.
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/StatAugmentCatalog.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/PlayerStatAugmentService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/AugmentPresentationCatalog.java",
                "src/main/resources/data/augmentation_survival/augmentation/stat_modifier_contract.json",
                "src/main/resources/data/augmentation_survival/augmentation/presentations/uncommon.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "underwater_work":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/StatAugmentCatalog.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/PlayerStatAugmentService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/AugmentPresentationCatalog.java",
                "src/main/resources/data/augmentation_survival/augmentation/stat_modifier_contract.json",
                "src/main/resources/data/augmentation_survival/augmentation/presentations/uncommon.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        if slug == "rapid_strikes":
            for relative in (
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/StatAugmentCatalog.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/stat/PlayerStatAugmentService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/combat/CombatAugmentService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/active/ActiveAbilityService.java",
                "src/main/java/dev/moonseungjun/augmentationsurvival/augment/active/AdvancedActiveAugmentService.java",
                "src/main/resources/data/augmentation_survival/augmentation/stat_modifier_contract.json",
                "src/main/resources/data/augmentation_survival/augmentation/combat_modifier_contract.json",
                "src/main/resources/data/augmentation_survival/augmentation/expansion_contract.json",
                "src/main/resources/data/augmentation_survival/augmentation/advanced_active_contract.json",
            ):
                if relative not in source_paths:
                    source_paths.append(relative)
        interaction_refs = [
            {"line": line_number, "text": line.strip()}
            for line_number, line in enumerate(interaction_lines, start=1)
            if slug in line or name in line or entry["canonical_name_ko"] in line
        ]
        if slug == "treasure_fishing":
            interaction_refs.extend(
                {"line": line_number, "text": line.strip()}
                for line_number, line in enumerate(interaction_lines, start=1)
                if line.strip().startswith("드롭 순서:")
                or line.strip().startswith("- `풍요`는 최종 일반 스택")
                or line.strip().startswith("- 코어/고유 보스 보상")
            )
            core_design = (project / "CORE_ACQUISITION_DESIGN_2026-10-24.md").read_text(encoding="utf-8").splitlines()
            interaction_refs.extend(
                {"line": line_number, "text": f"CORE_ACQUISITION_DESIGN_2026-10-24.md: {line.strip()}"}
                for line_number, line in enumerate(core_design, start=1)
                if "보물 범주 낚시" in line or "보물 낚시`처럼 보물 판정" in line or "코어 자체는 `풍요`" in line
            )
        if slug == "fuel_saver":
            for line_number, line in enumerate(canon.splitlines(), start=1):
                if any(term in line for term in ("공유 기계/오라 효과", "호퍼 등 자동화", "연료가 실제 소모되는 순간", "MULTIPLAYER TESTED: NO")):
                    interaction_refs.append({"line": line_number, "text": f"AUGMENTS.md: {line.strip()}"})
        if slug == "tool_care":
            interaction_refs.extend(
                {"line": line_number, "text": line.strip()}
                for line_number, line in enumerate(interaction_lines, start=1)
                if "자동 채굴/수확된 블록은" in line and "내구도 규칙" in line
            )
        if slug == "dexterity":
            interaction_refs.extend(
                {"line": line_number, "text": line.strip()}
                for line_number, line in enumerate(interaction_lines, start=1)
                if line.strip().startswith("`기본 바닐라/모드 드롭")
                or line.strip().startswith("- `풍요`는 최종 일반 스택")
                or line.strip().startswith("- 자동 채굴/수확된 블록은")
            )
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
            "interaction_mapping_status": "REVIEW_REQUIRED" if interaction_refs or slug in {"webbed_feet", "fishing_sense", "treasure_fishing", "long_reach", "fast_eating", "fuel_saver", "extra_piece", "loot_scoop", "last_strength", "tool_care", "dexterity"} else "NO_DIRECT_MENTION_FOUND",
            "compatibility_class": (
                "A" if slug in {"keen_edge", "webbed_feet"} else
                "B" if slug == "precise_aim" else
                "B" if slug in {"tough_skin", "light_landing", "strong_lungs"} else
                "B" if slug in {"bumper_crop", "seed_saver", "extra_piece"} else
                "B" if slug == "hearty_meal" else
                "B" if slug == "loot_scoop" else
                "B" if slug == "dexterity" else
                "B" if slug == "last_strength" else
                "B" if slug in {"catch_breath", "quick_feet"} else
                "C" if slug in {"miners_hand", "logging_knack", "nocturnal", "sun_affinity", "tool_care", "underwater_work"} else
                "D" if slug in {"fishing_sense", "treasure_fishing", "long_reach", "long_breath", "cold_adaptation", "fast_eating", "fuel_saver", "rapid_strikes", "recovery"} else
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
                "On stable playerBreakBlock after-event, recognize vanilla ore IDs and ore-tagged blocks, recalculate the Java-shaped first ordinary drop from the captured pre-break permutation and tool, and spawn one cloned item at the exact 5% per-level chance; max level 3" if slug == "extra_piece" else
                "Capture a player's selected slot before a stable block-break event; after a successful break, compare the before/after durability snapshots and restore the pre-break value on a 5% per-level Tool Care roll, returning a tool only if that same slot is empty; max level 5" if slug == "tool_care" else
                "On stable playerBreakBlock after-event, accept the Java gathering whitelist and roll exact 10% / 20% / 30% chance; re-run the captured block permutation's loot with the captured tool and spawn one copy of the first Java-eligible ordinary stack; max level 3" if slug == "dexterity" else
                "On stable entityDie, roll once at 5% per saved level for player-attributed non-player mob kills, regenerate the victim's loot table with the killer's held tool, and spawn the generated bonus bundle while excluding all six augment-core IDs" if slug == "loot_scoop" else
                "On stable entityHurt before-event, add 10% per saved level to player root melee or owned-projectile damage when current health is at or below 30% of effective maximum health; max level 3" if slug == "last_strength" else
                "In the shared per-tick movement reconciler, add 5% per level at night using the Java-matched 13000-tick day boundary; the separate mining-speed bonus is not implemented" if slug == "nocturnal" else
                "In the shared per-tick movement reconciler, add 4% per level during daytime; the separate natural-regeneration interval reduction is not implemented" if slug == "sun_affinity" else
                "No stable API exposes or changes a player's vanilla natural-regeneration timer. The stable heal event reports the healing event and amount/source; replacing native healing with a per-player scheduler would also need to reproduce vanilla eligibility and hunger/saturation costs" if slug == "recovery" else
                "Reconcile stable minecraft:movement to defaultValue × (1 + 0.03 × saved level) every server tick; coordinate this writer with other movement augments" if slug == "quick_feet" else
                "No exact stable route: Bedrock's native player block_interaction_range has no stable Script API getter/setter; raycast queries do not extend vanilla placement or block-use range" if slug == "long_reach" else
                "Use the stable minecraft:movement attribute and Player.isSprinting; count 60 consecutive non-sprinting server ticks, then reconcile defaultValue × (1 + 0.10 × saved level) each tick. In water, combine Catch Breath and Webbed Feet into the underwater movement multiplier to preserve Java's shared additive movement bonus" if slug == "catch_breath" else
                "On stable itemCompleteUse after-event, apply the Java food saturation bonus; read exact custom food properties when exposed and infer vanilla food saturation gain from adjacent server-tick samples" if slug == "hearty_meal" else
                "No stable API changes a vanilla furnace's per-fuel burn duration. The stable block inventory surface can observe slots, but does not expose the furnace burn timer or the vanilla item's fuel duration" if slug == "fuel_saver" else
                "No stable Script API component or player attribute setter changes vanilla player attack speed; after-hit damage events cannot change attack cooldown recharge or attack input" if slug == "rapid_strikes" else
                "No direct stable event exposes a fishing retrieval together with its selected vanilla category, LootParams, open-water state, or final result list. Correlating hook IDs with later inventory/entity changes could infer some cases, but cannot guarantee exact server-authoritative replacement or preserve player/rod luck, core-roll and Abundance ordering" if slug == "treasure_fishing" else
                "No stable API exposes or changes the vanilla FishingHook timeUntilLured timer. Stable entitySpawn and generic item-use events can observe casts, but do not provide the proportional wait-timer adjustment; Java mixes this timing change separately from its Treasure Fishing and final-result Abundance logic" if slug == "fishing_sense" else
                "No stable API exposes or changes the player's current air supply or oxygen depletion interval; the only documented airSupply setter is pre-release and is absent from stable @minecraft/server 2.11.0 declarations and the tested BDS runtime" if slug == "long_breath" else
                "No stable API exposes or changes a player's vanilla freeze-buildup counter; freezing is available only as a damage cause" if slug == "cold_adaptation" else
                "No stable Script API changes a player's active vanilla food-use duration. ItemStartUse/ItemCompleteUse expose read-only durations after use starts/completes; minecraft:use_modifiers is a fixed item-definition value, not per-player saved state" if slug == "fast_eating" else
                "No stable API changes vanilla block-breaking speed; start/break events expose no progress value" if slug in {"miners_hand", "logging_knack"} else
                "Stable player exhaustion component can be read and written; exact per-action reduction route not yet verified" if slug == "efficient_metabolism" else
                "While player.isInWater, set the stable minecraft:underwater_movement attribute to defaultValue × (1 + 0.10 × saved level); restore defaultValue out of water" if slug == "webbed_feet" else
                "Candidate only: while the player's head is submerged, apply an integer Haste effect near the Java submerged-mining multiplier; no gameplay route is shipped because stable API has no submerged-mining-speed setter and Haste cannot express the exact fractional curve" if slug == "underwater_work" else
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
                "Stable playerBreakBlock exposes the captured block permutation and itemStackBeforeBreak; LootTableManager can recalculate a drop list from that permutation and tool but does not expose the already-spawned vanilla drop list. Vanilla ore IDs and exposed ore tags are covered. External ores, add-on tag parity, real-client behavior and multiplayer remain unverified; Java also applies this roll during derived breaks, so Bedrock derived-break routing must be added with Tunneling" if slug == "extra_piece" else
                "Stable Script API has no global pre-durability event for vanilla tools. This route only restores durability lost on player block-break events; melee/use durability and automatically derived mining/harvest breaks are not covered. The stable item component surface does not expose Java's DataComponents.TOOL marker for exact item classification; reconnect, client play and multiplayer remain unverified" if slug == "tool_care" else
                "Stable block-break events expose no mining-speed/progress setter. Haste is a whole-effect substitute, not Java's submerged_mining_speed modifier: integer amplifiers only approximate the 1.8×/2.6×/3.4× curve, and applying/removing Haste can conflict with potion or other add-on effects. The Java interaction contract has no Underwater Work-specific cross-augment rule; no substitute is shipped" if slug == "underwater_work" else
                "Class B partial: stable playerBreakBlock exposes the pre-break permutation and tool after native drops have already been calculated, so Bedrock re-rolls the loot table instead of copying the actual first Block.popResource stack. Item eligibility mirrors Java stack-size, durability, name, lore, core, and exclusion-tag checks; isStackable is only a proxy for Java custom-data rejection. The Java leaves/flowers tags are queried through Bedrock hasTag with explicit vanilla fallbacks; external Java mod blocks are not copied. This event route covers direct player block breaks, not derived harvesting. The extra item spawns after the event, so Java's pre-Abundance Dexterity → Abundance ×2 order is not reproduced" if slug == "dexterity" else
                "Class B partial route: stable entityDie exposes the dead entity and damage source, and LootTableManager can generate loot for that entity. The event does not expose Java's final post-looting stack consumer; Bedrock re-rolls a second table with the killer's current main-hand tool, so the bonus bundle can differ from the original. Vanilla Wither/Ender Dragon and opt-in boss/dominated-companion tags are excluded; Java's dynamic external boss profiles and companion attachment are unavailable" if slug == "loot_scoop" else
                "Stable EntityHealthComponent exposes currentValue and read-only effectiveMax, and entityHurt before-event permits server-side damage scaling; exact health ratio and the inclusive 30% boundary are BDS-tested. Stable projectile ownership cannot distinguish Java ROOT_PROJECTILE from every add-on-derived projectile; Focused Aim and Clone interactions are not yet ported" if slug == "last_strength" else
                "The stable World.getTimeOfDay route matches Java's overworld-clock day/night boundary; movement is verified, but stable block-break events expose no progress or speed setter, so the mining half remains unimplemented" if slug == "nocturnal" else
                "The stable World.getTimeOfDay route implements daytime movement; stable heal events expose no vanilla natural-regeneration interval/timer, so the natural-regeneration half remains unimplemented" if slug == "sun_affinity" else
                "Class D for the exact natural-regeneration interval effect on stable @minecraft/server 2.11.0: EntityHealBeforeEvent exposes cancel, healing amount, and heal source (SelfHeal identifies hunger-caused healing), but no native timer, interval, or scheduling control. The naturalRegeneration gamerule is world-wide. A per-player replacement would have to recreate Bedrock's natural-heal eligibility and hunger/saturation costs; no equivalent has been validated, so no approximation is shipped" if slug == "recovery" else
                "Class B: stable EntityMovementComponent is writable through setCurrentValue; BDS 1.26.62.1 verifies the shared server reconciler at exact +3% per level for Quick Feet levels 1–5 and additive stacks with Catch Breath, Nocturnal, and Sun Affinity. Stacking with every other movement augment and external attribute writers remains untested" if slug == "quick_feet" else
                "Class D: stable @minecraft/server 2.11.0 has no player block-interaction-range attribute or generic attribute modifier API. getBlockFromViewDirection and BlockRaycastOptions.maxDistance configure script ray queries, not the range enforced for native block placement/use; stable InputButton exposes only Jump and Sneak. A custom item/UI interaction route would replace vanilla block/item semantics and would not preserve touch/controller placement behavior" if slug == "long_reach" else
                "Class B: stable EntityMovementComponent is writable through setCurrentValue, and Player.isSprinting is stable. The previous BDS probe showed a one-time movement write reverting by the next tick, so the production handler reconciles it every tick. Bedrock separates underwater movement from general movement; the shared bonus is mapped to the active environment. BDS gameplay verification is required for all levels, the 60-tick threshold, sprint reset, and additive Webbed Feet stacking" if slug == "catch_breath" else
                "Stable declarations describe itemCompleteUse as chargeable-item completion and vanilla ItemFoodComponent is not exposed for cooked beef. BDS 1.26.62.1 confirms the event fires for cooked beef; vanilla gain is measured as a saturation delta. Verify on each targeted Bedrock/BDS build; other same-tick saturation changes could affect the inferred gain" if slug == "hearty_meal" else
                "Class D for the exact vanilla-timer effect: stable @minecraft/server 2.11.0 has no fishing-bite event, FishingHook timer property, or timer setter. BDS 1.26.62.1 confirmed casts emit generic itemUse/itemStartUse/itemStopUse and spawn an owned minecraft:fishing_hook with only minecraft:projectile among tested components. The Java FishingHookAugmentMixin separately applies Treasure Fishing on retrieve and Abundance to the final result; these loot interactions remain outside this timing probe. Lure enchantment or custom-rod alternatives change the vanilla item/timing contract and do not reproduce a percentage reduction of each randomized wait" if slug == "fishing_sense" else
                "Class D for exact oxygen-consumption reduction on the currently pinned stable API: EntityBreathableComponent.airSupply is marked pre-release in the official reference, omitted from stable @minecraft/server 2.11.0 types, and not exposed by the breathable component on BDS 1.26.62.1. totalSupply is read-only; water_breathing would prevent oxygen loss rather than reduce it by Java's 10/20/30% curve" if slug == "long_breath" else
                "Class D for the exact freeze-buildup effect: Java reads and adjusts Player.ticksFrozen; stable @minecraft/server 2.11.0 exposes no frozen-tick getter, setter, component, or buildup event. The stable hurt event exposes freezing damage only, so multiplying damage would replace buildup reduction with a different effect. The BDS 1.26.62.1 player probe found no freeze component or matching player property" if slug == "cold_adaptation" else
                "Class D for the exact player-specific food-duration effect. Stable @minecraft/server 2.11.0 has no active-item duration setter; itemStartUse/itemCompleteUse carry read-only durations and run after timing starts. minecraft:use_modifiers.use_duration is static JSON, so overriding vanilla food changes all players and cannot follow saved augment levels; custom replacement foods would alter item identity and omit unsupported external foods. Player.eatItem is marked pre-release and does not adjust an in-progress held use" if slug == "fast_eating" else
                "Class D for Java's per-fuel burn-duration effect on stable @minecraft/server 2.11.0. Stable block components expose inventory and recipe processing but no vanilla furnace burn-time component; ItemStack exposes script components, not minecraft:fuel duration. BDS 1.26.62.1 probe: a lit furnace exposed inventory without a furnace timer, while coal had no minecraft:fuel script component. Static minecraft:fuel JSON belongs to an item definition, not nearby players' saved levels. Polling and injecting bonus fuel would alter per-item rounding, misattribute hopper/manual slot changes or mixed fuel, and cannot snapshot the highest nearby level at the exact burn-start boundary. No exact substitute is shipped" if slug == "fuel_saver" else
                "Class D for the exact player attack-speed effect on stable @minecraft/server 2.11.0. The stable EntityComponentTypes enum and player component surface have no attack-speed component or generic player attribute-modifier setter. BDS 1.26.62.1 diagnostic checks for minecraft:attack_speed, minecraft:attack and minecraft:attack_cooldown found no player components. The Bedrock minecraft:attack_cooldown entity JSON component controls an entity's target-acquisition cooldown, while minecraft:cooldown is static item JSON; neither changes a player's saved per-level attack-speed attribute. Scaling hit damage would change the effect, and no stable API observes/cancels player attack input early enough to reproduce faster recharge" if slug == "rapid_strikes" else
                "Class D for the exact treasure-category probability change on stable @minecraft/server 2.11.0. Rod-use events report item use, entity removal reports only removedEntityId/typeId, and playerInventoryItemChange is after the slot has changed; no shared event transaction exposes the fishing result/category. LootTableManager.generateLootFromTable accepts only a table and optional tool, not Java's LootParams (open-water state plus rod/player luck), and cannot return/replace the hook's original resolved list. Hook/inventory correlation could infer some simple catches but has no shared catch ID and cannot guarantee atomic exact replacement; a vanilla-table override or custom rod replaces vanilla behavior. These alternatives risk changed catches, duplicated rewards, and broken 12% core / Abundance ordering; no approximation is shipped" if slug == "treasure_fishing" else
                "Class C: stable start/break events can observe block interactions but expose no vanilla break-progress/speed control; reconstructing hold, tool, hardness, and cancellation behavior would differ, especially across touch/controller input" if slug in {"miners_hand", "logging_knack"} else
                "Class B route uses a stable writable movement attribute; BDS 1.26.62.1 showed a direct write returning to default on the next tick. The per-tick Catch Breath route demonstrates persistence, but exact Quick Feet levels and coexisting movement modifiers remain unverified" if slug == "quick_feet" else
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
                "BDS GameTest deterministically verifies 5/10/15% roll boundaries and one block/tool-derived drop, including Silk Touch and Fortune; a separate SimulatedPlayer break verifies live playerBreakBlock event delivery" if slug == "extra_piece" else
                "BDS 1.26.62.1 GameTests verify exact 5/10/15/20/25% chance boundaries and level cap, successful restoration, occupied-slot safety, and near-break tool return. A production-handler SimulatedPlayer mines vanilla stone 40 times at level 5 and observes repeated durability restoration through real before/after events; this does not verify the probability distribution" if slug == "tool_care" else
                "BDS 1.26.62.1 GameTests verify exact 10/20/30% chance boundaries, level cap, vanilla leaf/flower and explicit whitelist matching, first eligible dandelion duplication, and rejection of unlisted blocks, damageable/custom-named/lore-bearing items, cores, and unowned levels. A production-handler SimulatedPlayer performs 50 level-3 dandelion breaks and checks for at least one additional item beyond native yields; this only samples the live effect path and does not establish probability distribution or actual-drop equivalence. Derived breaks, reconnect, client and multiplayer remain untested" if slug == "dexterity" else
                "BDS 1.26.62.1 GameTest: exact 5/10/15% exclusive roll boundaries, all six augment-core exclusions, and a guaranteed level-3 bonus generated during a real player-attributed cow entityDie event; vanilla random original-vs-reroll bundle equality, looting variants, boss profiles and multiplayer are untested" if slug == "loot_scoop" else
                "BDS 1.26.62.1 production-handler GameTests verify exact +10% / +20% / +30% damage at levels 1–3 for synthetic root melee and player-owned projectile sources; exact 30% is inclusive, 29% activates, and 31% does not. Tests also verify additive Keen Edge and Precise Aim stacking. Physical client attacks, derived-projectile provenance, Focused Aim, Clone, reconnect and multiplayer remain untested" if slug == "last_strength" else
                "BDS 1.26.62.1 production-handler GameTest verifies exact +5% / +10% / +15% night movement at levels 1–3 and daytime deactivation; Java's +5% / level mining-speed half is not implemented" if slug == "nocturnal" else
                "BDS 1.26.62.1 production-handler GameTest verifies exact +4% / +8% / +12% daytime movement and night deactivation; Java's natural-regeneration interval half is not implemented" if slug == "sun_affinity" else
                "Static stable @minecraft/server 2.11.0 declaration review and official stable API reference review: heal events expose cause/amount/cancellation but no natural-regeneration timer; no recovery behavior or BDS runtime test implemented" if slug == "recovery" else
                "BDS GameTest uses the production pack: no bonus after 35 idle ticks, exact 10/20/30% general movement component values by 70 ticks at levels 1–3; separate production-path test measures 1.10/1.10/1.20 swim ratios for Catch Breath, Webbed Feet, and both together. The direct ground-velocity SimulatedPlayer probe yielded no valid control/level-1 ratio and is not counted" if slug == "catch_breath" else
                "BDS 1.26.62.1 end-to-end GameTest consumes cooked beef through the production handler and checks exact saturation at levels 1–3 plus the food saturation cap" if slug == "hearty_meal" else
                "BDS 1.26.62.1 diagnostic GameTest consumes coal in a vanilla furnace and observes the lit furnace and inventory slots; it found no furnace burn-duration component and coal exposed no minecraft:fuel script component. Diagnostic only; no Fuel Saver behavior implemented" if slug == "fuel_saver" else
                "BDS 1.26.62.1 diagnostic GameTest enumerates a simulated player's stable component IDs, checks attack-speed/damage/cooldown component IDs, and inspects the stable EntityComponentTypes enum. Diagnostic only; no Rapid Strikes gameplay implemented" if slug == "rapid_strikes" else
                "BDS 1.26.62.1 diagnostic GameTest enumerates simulated-player components and stable range-like component IDs, checks candidate range properties and generic attribute methods, and records InputButton values. It found no player range API and only Jump/Sneak inputs; diagnostic only, no Long Reach gameplay implemented" if slug == "long_reach" else
                "Static stable API 2.11.0 review of WorldAfterEvents, EntityRemoveAfterEvent, PlayerInventoryItemChangeAfterEvent and LootTableManager; existing BDS fishing-hook probe confirms cast events and an owned projectile hook only. No catch/category/loot-context runtime event is available; no Treasure Fishing behavior is implemented or counted" if slug == "treasure_fishing" else
                "BDS 1.26.62.1 GameTest diagnostic casts a vanilla fishing rod, observes generic cast events and the owned fishing-hook entity, and queries projectile/fishing-hook/timer components. It found only minecraft:projectile; it does not test or implement bite timing" if slug == "fishing_sense" else
                "Official stable API declaration review plus BDS 1.26.62.1 GameTest submerged-player probe: minecraft:breathable exists but exposes no airSupply property at runtime; probe only, no oxygen behavior implemented" if slug == "long_breath" else
                "Stable @minecraft/server type review plus BDS 1.26.62.1 GameTest diagnostic in powder snow: no freeze component, frozen-tick member, or buildup event was available; probe only, no cold effect implemented" if slug == "cold_adaptation" else
                "Stable @minecraft/server 2.11.0 declaration review: ItemStartUseAfterEvent and ItemCompleteUseAfterEvent expose readonly useDuration; stable Player has no current-use duration setter, item JSON use_modifiers is static, and Player.eatItem is pre-release. Existing BDS cooked-beef completion evidence belongs to Hearty Meal and does not test or implement faster eating" if slug == "fast_eating" else
                "Static stable API declaration review: start and after-break events expose no break-progress or vanilla mining-speed mutation; alternate custom hold/mining route not implemented" if slug in {"miners_hand", "logging_knack"} else
                "BDS 1.26.62.1 production-handler GameTest verifies exact +3% / +6% / +9% / +12% / +15% general movement-component values at Quick Feet levels 1–5; a Quick Feet-only idle player does not precharge Catch Breath, which activates after 60 newly-owned idle ticks" if slug == "quick_feet" else
                "BDS GameTest: set exhaustion to 1.25 and read the same value after two ticks; hunger 20 and saturation 5 are unchanged; natural exhaustion deltas are not tested" if slug == "efficient_metabolism" else
                "Production-handler BDS GameTest: simulated players swim in water at levels 1–3 and match 1.10/1.20/1.30 velocity ratios; out-of-water movement attribute restores to default. Java shared-bonus stacking with other movement augments is pending because those effects are not ported" if slug == "webbed_feet" else
                "BDS 1.26.62.1 diagnostic only: simulated players broke vanilla stone underwater at 30 ticks without Haste and 21/15/12/9/7 ticks with Haste amplifiers 0–4 (1.43×/2×/2.5×/3.33×/4.29× in this run); compares against Java 1.8×/2.6×/3.4×, but does not implement or enable the effect" if slug == "underwater_work" else
                "Not implemented; see tests/ and docs/PORT_MATRIX.csv"
            ),
            "port_status": "PARTIAL_BDS_VERIFIED" if slug in {"sturdiness", "keen_edge", "precise_aim", "tough_skin", "light_landing", "strong_lungs", "bumper_crop", "seed_saver", "extra_piece", "hearty_meal", "webbed_feet", "catch_breath", "loot_scoop", "last_strength", "quick_feet", "nocturnal", "sun_affinity", "tool_care", "dexterity"} else "NOT_PORTED",
            "candidate_enabled": slug in {"keen_edge", "precise_aim", "tough_skin", "light_landing", "strong_lungs", "bumper_crop", "seed_saver", "extra_piece", "hearty_meal", "webbed_feet", "catch_breath", "loot_scoop", "last_strength", "quick_feet", "nocturnal", "sun_affinity", "tool_care", "dexterity"},
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
