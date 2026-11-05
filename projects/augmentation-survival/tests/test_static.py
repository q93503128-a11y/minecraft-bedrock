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
        self.assertEqual({"강건함"}, {item["name_ko"] for item in data["augments"] if item["port_status"] == "PARTIAL_BDS_VERIFIED"})
        self.assertEqual("IMPLEMENTED_UNVERIFIED", next(item["port_status"] for item in data["augments"] if item["name_ko"] == "날 선 감각"))

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
        self.assertIn("world.afterEvents.playerSpawn", script)


if __name__ == "__main__":
    unittest.main()
