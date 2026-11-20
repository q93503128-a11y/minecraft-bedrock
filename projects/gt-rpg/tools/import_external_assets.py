"""Rebuild GT RPG's namespaced copies from the unmodified, licensed sources."""

from __future__ import annotations

import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_NEO = ROOT / "assets" / "source" / "neo-more-mobs"
SOURCE_UNREALM = ROOT / "assets" / "source" / "unrealm"
RP = ROOT / "RP"


def load_json(path: Path) -> object:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def replace_text(value: object, old: str, new: str) -> object:
    if isinstance(value, str):
        return value.replace(old, new)
    if isinstance(value, list):
        return [replace_text(item, old, new) for item in value]
    if isinstance(value, dict):
        return {
            key.replace(old, new) if isinstance(key, str) else key: replace_text(item, old, new)
            for key, item in value.items()
        }
    return value


def import_scorpion() -> None:
    geometry = load_json(SOURCE_NEO / "scorpion.geo.json")
    geometry = replace_text(geometry, "geometry.neosmoremobs.scorpion", "geometry.gtrpg.ashen_scorpion_queen")
    write_json(RP / "models" / "entity" / "ashen_scorpion_queen.geo.json", geometry)
    shutil.copyfile(SOURCE_NEO / "scorpion.png", RP / "textures" / "entity" / "ashen_scorpion_queen.png")

    animations = load_json(SOURCE_NEO / "scorpion.animation.json")
    animations = replace_text(animations, "animation.neosmoremobs.scorpion", "animation.gtrpg.ashen_scorpion_queen")
    write_json(RP / "animations" / "ashen_scorpion_queen.animation.json", animations)

    controllers = load_json(SOURCE_NEO / "neosmoremobs.animation_controllers.json")
    controllers = replace_text(controllers, "controller.animation.neosmoremobs.locomotion", "controller.animation.gtrpg.ashen_scorpion_queen.locomotion")
    controllers = replace_text(controllers, "controller.animation.neosmoremobs.attack", "controller.animation.gtrpg.ashen_scorpion_queen.attack")
    write_json(RP / "animation_controllers" / "ashen_scorpion_queen.animation_controllers.json", controllers)

    render_controller = load_json(SOURCE_NEO / "scorpion.render_controllers.json")
    render_controller = replace_text(render_controller, "controller.render.neosmoremobs.scorpion", "controller.render.gtrpg.ashen_scorpion_queen")
    write_json(RP / "render_controllers" / "ashen_scorpion_queen.render_controllers.json", render_controller)

    client_entity = {
        "format_version": "1.10.0",
        "minecraft:client_entity": {
            "description": {
                "identifier": "gtrpg:ashen_scorpion_queen",
                "materials": {"default": "entity_alphatest"},
                "textures": {"default": "textures/entity/ashen_scorpion_queen"},
                "geometry": {"default": "geometry.gtrpg.ashen_scorpion_queen"},
                "animations": {
                    "idle": "animation.gtrpg.ashen_scorpion_queen.idle",
                    "walk": "animation.gtrpg.ashen_scorpion_queen.walk",
                    "run": "animation.gtrpg.ashen_scorpion_queen.run",
                    "look_at_target": "animation.common.look_at_target",
                    "attack": "animation.gtrpg.ashen_scorpion_queen.attack",
                    "move": "controller.animation.gtrpg.ashen_scorpion_queen.locomotion",
                    "attack_controller": "controller.animation.gtrpg.ashen_scorpion_queen.attack",
                },
                "scripts": {
                    "animate": ["look_at_target", "move", "attack_controller"],
                    "scale": "1.1",
                },
                "render_controllers": ["controller.render.gtrpg.ashen_scorpion_queen"],
            }
        },
    }
    write_json(RP / "entity" / "ashen_scorpion_queen.entity.json", client_entity)


def import_blade() -> None:
    geometry = load_json(SOURCE_UNREALM / "kyles.geo.json")
    geometry = replace_text(geometry, "geometry.kyles", "geometry.gtrpg.ember_blade")
    write_json(RP / "models" / "entity" / "ember_blade.geo.json", geometry)
    shutil.copyfile(SOURCE_UNREALM / "kyle-entity.png", RP / "textures" / "entity" / "ember_blade.png")
    shutil.copyfile(SOURCE_UNREALM / "kyle-item-icon.png", RP / "textures" / "items" / "weapon" / "ember_blade.png")

    animations = load_json(SOURCE_UNREALM / "kyles.animation.json")
    animations = replace_text(animations, "animation.kyle.", "animation.gtrpg.ember_blade.")
    write_json(RP / "animations" / "ember_blade.animation.json", animations)

    for rarity in ("common", "uncommon", "rare", "epic", "legendary"):
        attachable = {
            "format_version": "1.19.0",
            "minecraft:attachable": {
                "description": {
                    "identifier": f"gtrpg:ember_blade_{rarity}",
                    "materials": {
                        "default": "entity_alphatest",
                        "enchanted": "entity_alphatest_glint",
                    },
                    "textures": {
                        "default": "textures/entity/ember_blade",
                        "enchanted": "textures/misc/enchanted_item_glint",
                    },
                    "geometry": {"default": "geometry.gtrpg.ember_blade"},
                    "animations": {
                        "normal": "animation.gtrpg.ember_blade.grab",
                        "first_person": "animation.gtrpg.ember_blade.first_person",
                    },
                    "scripts": {
                        "animate": [
                            {"normal": "!c.is_first_person"},
                            {"first_person": "c.is_first_person"},
                        ]
                    },
                    "render_controllers": ["controller.render.item_default"],
                }
            },
        }
        write_json(RP / "attachables" / f"ember_blade_{rarity}.json", attachable)

    item_textures = {
        "resource_pack_name": "gt_rpg",
        "texture_name": "atlas.items",
        "texture_data": {
            "gtrpg_ember_blade": {"textures": "textures/items/weapon/ember_blade"}
        },
    }
    write_json(RP / "textures" / "item_texture.json", item_textures)


def import_credits() -> None:
    credits = RP / "credits"
    credits.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE_NEO / "LICENSE.txt", credits / "neo-more-mobs-license-and-attribution.txt")
    shutil.copyfile(SOURCE_NEO / "CREDITS.txt", credits / "neo-more-mobs-source-credits.txt")
    shutil.copyfile(SOURCE_UNREALM / "LICENSE", credits / "unrealm-mit-license.txt")


if __name__ == "__main__":
    import_scorpion()
    import_blade()
    import_credits()
    print("Imported and namespaced the licensed Scorpion Girl and kyles weapon assets.")
