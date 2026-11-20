import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def json_files():
    return sorted([*ROOT.joinpath("BP").rglob("*.json"), *ROOT.joinpath("RP").rglob("*.json")])


class ProjectStaticTests(unittest.TestCase):
    def test_all_pack_json_parses(self):
        self.assertGreater(len(json_files()), 10)
        for path in json_files():
            with self.subTest(path=path.relative_to(ROOT)):
                json.loads(path.read_text(encoding="utf-8"))

    def test_manifest_uuids_and_dependencies_are_coherent(self):
        bp = json.loads((ROOT / "BP" / "manifest.json").read_text(encoding="utf-8"))
        rp = json.loads((ROOT / "RP" / "manifest.json").read_text(encoding="utf-8"))
        uuids = [bp["header"]["uuid"], rp["header"]["uuid"]]
        uuids += [module["uuid"] for manifest in (bp, rp) for module in manifest["modules"]]
        self.assertEqual(len(uuids), len(set(uuids)))
        self.assertIn(rp["header"]["uuid"], {dependency.get("uuid") for dependency in bp["dependencies"]})
        modules = {
            dependency["module_name"]: dependency["version"]
            for dependency in bp["dependencies"]
            if "module_name" in dependency
        }
        self.assertEqual(modules, {"@minecraft/server": "2.11.0", "@minecraft/server-ui": "2.3.0"})
        self.assertEqual(bp["header"]["min_engine_version"], [1, 26, 60])
        self.assertFalse(any("beta" in str(dependency).lower() or "preview" in str(dependency).lower() for dependency in bp["dependencies"]))

    def test_custom_item_icons_and_attachables_match(self):
        atlas = json.loads((ROOT / "RP" / "textures" / "item_texture.json").read_text(encoding="utf-8"))
        identifiers = set()
        attachables = set()
        for path in (ROOT / "BP" / "items").glob("*.json"):
            item = json.loads(path.read_text(encoding="utf-8"))["minecraft:item"]
            identifier = item["description"]["identifier"]
            self.assertNotIn(identifier, identifiers)
            identifiers.add(identifier)
            icon = item["components"].get("minecraft:icon")
            if isinstance(icon, dict) and "textures" in icon:
                texture_key = icon["textures"]["default"]
                self.assertIn(texture_key, atlas["texture_data"])
        for path in (ROOT / "RP" / "attachables").glob("*.json"):
            attachables.add(json.loads(path.read_text(encoding="utf-8"))["minecraft:attachable"]["description"]["identifier"])
        weapons = {item for item in identifiers if item.startswith("gtrpg:ember_blade_")}
        self.assertEqual(weapons, attachables)
        self.assertTrue((ROOT / "RP" / "textures" / "items" / "weapon" / "ember_blade.png").is_file())

    def test_recipes_define_unlock_data(self):
        recipes = list((ROOT / "BP" / "recipes").glob("*.json"))
        self.assertTrue(recipes)
        for path in recipes:
            recipe = json.loads(path.read_text(encoding="utf-8"))
            body = next(value for key, value in recipe.items() if key.startswith("minecraft:recipe_"))
            self.assertTrue(body.get("unlock"), path.name)

    def test_boss_entity_model_and_animation_references_resolve(self):
        client = json.loads((ROOT / "RP" / "entity" / "ashen_scorpion_queen.entity.json").read_text(encoding="utf-8"))["minecraft:client_entity"]["description"]
        geometry_id = client["geometry"]["default"]
        geometry_path = ROOT / "RP" / "models" / "entity" / "ashen_scorpion_queen.geo.json"
        geometry = json.loads(geometry_path.read_text(encoding="utf-8"))["minecraft:geometry"][0]["description"]["identifier"]
        self.assertEqual(geometry_id, geometry)
        texture = ROOT / "RP" / (client["textures"]["default"] + ".png")
        self.assertTrue(texture.is_file())
        animations = json.loads((ROOT / "RP" / "animations" / "ashen_scorpion_queen.animation.json").read_text(encoding="utf-8"))["animations"]
        controllers = json.loads((ROOT / "RP" / "animation_controllers" / "ashen_scorpion_queen.animation_controllers.json").read_text(encoding="utf-8"))["animation_controllers"]
        for reference in client["animations"].values():
            if reference.startswith("animation.gtrpg."):
                self.assertIn(reference, animations)
            elif reference.startswith("controller.animation."):
                self.assertIn(reference, controllers)
        render_file = json.loads((ROOT / "RP" / "render_controllers" / "ashen_scorpion_queen.render_controllers.json").read_text(encoding="utf-8"))["render_controllers"]
        self.assertIn(client["render_controllers"][0], render_file)
        self.assertTrue((ROOT / "BP" / "entities" / "ashen_scorpion_queen.json").is_file())

    def test_localization_keys_are_complete_and_developer_text_is_absent(self):
        languages = {}
        for language in ("ko_KR", "en_US"):
            lines = (ROOT / "BP" / "texts" / f"{language}.lang").read_text(encoding="utf-8").splitlines()
            languages[language] = {line.split("=", 1)[0]: line.split("=", 1)[1] for line in lines if line.strip() and "=" in line}
        self.assertEqual(set(languages["ko_KR"]), set(languages["en_US"]))
        for path in (ROOT / "BP" / "items").glob("*.json"):
            item = json.loads(path.read_text(encoding="utf-8"))["minecraft:item"]
            key = item["components"]["minecraft:display_name"]["value"]
            self.assertIn(key, languages["ko_KR"])
        boss_name = "entity.gtrpg:ashen_scorpion_queen.name"
        self.assertIn(boss_name, languages["ko_KR"])
        for text in [*languages["ko_KR"].values(), *languages["en_US"].values()]:
            self.assertIsNone(re.search(r"(?i)debug|TODO|developer|test state|internal api", text))

    def test_external_licenses_and_original_art_are_present(self):
        files = [
            ROOT / "assets" / "source" / "neo-more-mobs" / "LICENSE.txt",
            ROOT / "assets" / "source" / "neo-more-mobs" / "CREDITS.txt",
            ROOT / "assets" / "source" / "neo-more-mobs" / "scorpion.geo.json",
            ROOT / "assets" / "source" / "neo-more-mobs" / "scorpion.png",
            ROOT / "assets" / "source" / "unrealm" / "LICENSE",
            ROOT / "assets" / "source" / "unrealm" / "kyles.geo.json",
            ROOT / "assets" / "source" / "unrealm" / "kyle-entity.png",
        ]
        self.assertTrue(all(path.is_file() and path.stat().st_size > 0 for path in files))
        self.assertTrue((ROOT / "RP" / "credits" / "neo-more-mobs-license-and-attribution.txt").is_file())
        self.assertTrue((ROOT / "RP" / "credits" / "unrealm-mit-license.txt").is_file())
        self.assertIn("CC BY 4.0", (ROOT / "docs" / "ASSET_PROVENANCE.md").read_text(encoding="utf-8"))
        self.assertIn("Neo's Art License", (ROOT / "docs" / "ASSET_PROVENANCE.md").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
