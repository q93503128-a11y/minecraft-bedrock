import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StaticAddonTests(unittest.TestCase):
    def test_canonical_roster_counts_and_unique_ids(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        roster = data["augments"]
        self.assertEqual(149, len(roster))
        self.assertEqual(149, len({item["id"] for item in roster}))
        self.assertEqual(data["expected_counts"], {tier: sum(item["tier"] == tier for item in roster) for tier in data["expected_counts"]})

    def test_only_verified_gameplay_is_counted_complete(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        self.assertEqual({"강건함", "날 선 감각", "정확한 조준", "질긴 피부", "가벼운 착지", "튼튼한 폐", "풍작", "씨앗 챙기기", "든든한 한 끼", "물갈퀴"}, {item["name_ko"] for item in data["augments"] if item["port_status"] == "PARTIAL_BDS_VERIFIED"})
        self.assertEqual({"keen_edge", "precise_aim", "tough_skin", "light_landing", "strong_lungs", "bumper_crop", "seed_saver", "hearty_meal", "webbed_feet"}, {item["id"].split(":", 1)[1] for item in data["augments"] if item["candidate_enabled"]})
        self.assertFalse(any(item["candidate_enabled"] and item["port_status"] == "NOT_PORTED" for item in data["augments"]))
        self.assertFalse(any(item["port_status"] == "IMPLEMENTED_UNVERIFIED" for item in data["augments"]))

    def test_api_compatibility_classes_are_evidence_scoped(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        by_id = {item["id"].split(":", 1)[1]: item for item in data["augments"]}
        self.assertEqual("A", by_id["keen_edge"]["compatibility_class"])
        self.assertEqual("A", by_id["webbed_feet"]["compatibility_class"])
        self.assertEqual("B", by_id["precise_aim"]["compatibility_class"])
        self.assertEqual("B", by_id["strong_lungs"]["compatibility_class"])
        self.assertEqual("B", by_id["tough_skin"]["compatibility_class"])
        self.assertEqual("B", by_id["light_landing"]["compatibility_class"])
        self.assertEqual("UNASSESSED", by_id["sturdiness"]["compatibility_class"])
        self.assertNotIn("D exact parity", by_id["sturdiness"]["api_constraints"])
        self.assertEqual("B", by_id["bumper_crop"]["compatibility_class"])
        self.assertEqual("B", by_id["seed_saver"]["compatibility_class"])
        self.assertEqual("C", by_id["miners_hand"]["compatibility_class"])
        self.assertEqual("C", by_id["logging_knack"]["compatibility_class"])
        self.assertIn("no vanilla break-progress/speed control", by_id["miners_hand"]["api_constraints"])

    def test_only_bds_verified_movement_effect_is_offered(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        movement = {item["name_ko"]: item for item in data["augments"] if item["name_ko"] in {"빠른 발", "물갈퀴"}}
        self.assertEqual({"빠른 발", "물갈퀴"}, set(movement))
        self.assertEqual("NOT_PORTED", movement["빠른 발"]["port_status"])
        self.assertEqual("PARTIAL_BDS_VERIFIED", movement["물갈퀴"]["port_status"])
        self.assertTrue(movement["물갈퀴"]["candidate_enabled"])
        for item in movement.values():
            self.assertIn("BDS 1.26.62.1", item["api_constraints"])

    def test_fishing_sense_remains_unoffered_without_a_hook_timer_api(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        fishing_sense = next(item for item in data["augments"] if item["id"].endswith(":fishing_sense"))
        self.assertEqual("D", fishing_sense["compatibility_class"])
        self.assertEqual("NOT_PORTED", fishing_sense["port_status"])
        self.assertFalse(fishing_sense["candidate_enabled"])
        self.assertIn("FishingHookAugmentMixin.java", " ".join(fishing_sense["java_source_paths"]))

    def test_canonical_source_discrepancies_are_visible(self):
        data = json.loads((ROOT / "docs/augment-roster.json").read_text(encoding="utf-8"))
        self.assertEqual(3, sum(bool(item["catalog_discrepancy"]) for item in data["augments"]))

    def test_script_has_server_side_inventory_and_persistent_state(self):
        script = (ROOT / "BP/scripts/main.js").read_text(encoding="utf-8")
        progression = (ROOT / "BP/scripts/progression.js").read_text(encoding="utf-8")
        self.assertIn("setDynamicProperty(LEVELS_KEY", progression)
        self.assertIn("commitCoreSelection(player, coreId, selected)", script)
        self.assertIn("world.afterEvents.itemUse.subscribe", script)
        self.assertIn("world.beforeEvents.entityHurt.subscribe", (ROOT / "BP/scripts/combat.js").read_text(encoding="utf-8"))
        self.assertIn("EntityDamageCause.drowning", (ROOT / "BP/scripts/combat.js").read_text(encoding="utf-8"))
        self.assertIn("world.afterEvents.playerBreakBlock.subscribe", (ROOT / "BP/scripts/harvest.js").read_text(encoding="utf-8"))
        self.assertIn("world.afterEvents.playerSpawn", script)

    def test_disconnect_clears_ui_state_and_stale_form_tokens_cannot_unlock_new_session(self):
        script = (ROOT / "BP/scripts/main.js").read_text(encoding="utf-8")
        self.assertIn("world.afterEvents.playerLeave.subscribe", script)
        self.assertIn("if (OPEN_FORMS.get(player.id) === token) OPEN_FORMS.delete(player.id)", script)
        self.assertIn("pending.offerToken !== offerToken", script)


if __name__ == "__main__":
    unittest.main()
