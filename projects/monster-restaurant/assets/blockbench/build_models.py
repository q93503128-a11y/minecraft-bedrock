"""Build editable Blockbench sources and Bedrock geometry/texture exports."""

from __future__ import annotations

import base64
import json
import math
import random
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ATLAS = ROOT / "RP" / "textures"
ENTITY_MODELS = ROOT / "RP" / "models" / "entity"
BLOCK_MODELS = ROOT / "RP" / "models" / "blocks"
SOURCE = Path(__file__).resolve().parent


def box(name, origin, size, color, bone="body"):
    return {"name": name, "from": origin, "size": size, "color": color, "bone": bone}


BOAR = [
    box("body", [-5, 4, -6], [10, 6, 12], "hide", "body"),
    box("shoulder", [-4, 6, -8], [8, 4, 6], "hide", "body"),
    box("head", [-4, 4, -12], [8, 6, 7], "hide", "head"),
    box("muzzle", [-3, 5, -14], [6, 3, 3], "muzzle", "head"),
    box("nose", [-1, 6, -14.25], [2, 1, 0.25], "nose", "head"),
    box("left_ear", [-4, 9, -10], [2, 2, 2], "hide", "head"),
    box("right_ear", [2, 9, -10], [2, 2, 2], "hide", "head"),
    box("mushroom_stem", [-2, 9, -2], [4, 3, 4], "stem", "cap"),
    box("cap_underside", [-8, 11, -6], [16, 1, 12], "cap_shadow", "cap"),
    box("mushroom_cap", [-7, 12, -5], [14, 2, 10], "cap", "cap"),
    box("cap_crown", [-5, 14, -3], [10, 1, 6], "cap", "cap"),
    box("spot_front_left", [-5, 14, -3], [2, 1, 2], "spot", "cap"),
    box("spot_front_right", [2, 14, -3], [2, 1, 2], "spot", "cap"),
    box("spot_back", [-1, 14, 2], [2, 1, 2], "spot", "cap"),
    box("front_left_leg", [-4, 0, -4], [2, 4, 2], "hide", "front_left_leg"),
    box("front_left_hoof", [-4, 0, -4], [2, 1, 2], "hoof", "front_left_leg"),
    box("front_right_leg", [2, 0, -4], [2, 4, 2], "hide", "front_right_leg"),
    box("front_right_hoof", [2, 0, -4], [2, 1, 2], "hoof", "front_right_leg"),
    box("back_left_leg", [-4, 0, 3], [2, 4, 2], "hide", "back_left_leg"),
    box("back_left_hoof", [-4, 0, 3], [2, 1, 2], "hoof", "back_left_leg"),
    box("back_right_leg", [2, 0, 3], [2, 4, 2], "hide", "back_right_leg"),
    box("back_right_hoof", [2, 0, 3], [2, 1, 2], "hoof", "back_right_leg"),
    box("left_tusk", [-3, 4, -12], [1, 2, 2], "ivory", "head"),
    box("right_tusk", [2, 4, -12], [1, 2, 2], "ivory", "head"),
    box("left_eye", [-4, 7, -10], [1, 1, 1], "eye", "head"),
    box("right_eye", [3, 7, -10], [1, 1, 1], "eye", "head"),
    box("tail_root", [-1, 6, 6], [2, 2, 2], "hide", "body"),
    box("tail_tip", [-1, 7, 7], [2, 1, 2], "hoof", "body"),
]

SKILLET = [
    box("base", [-6, 5, -6], [12, 1, 12], "seasoned_iron"),
    box("front_wall", [-6, 6, -6], [12, 2, 1], "iron"),
    box("back_wall", [-6, 6, 5], [12, 2, 1], "iron"),
    box("left_wall", [-6, 6, -5], [1, 2, 10], "iron"),
    box("right_wall", [5, 6, -5], [1, 2, 10], "iron"),
    box("cooking_surface", [-5, 6, -5], [10, 1, 10], "seasoned_iron"),
    box("front_lip", [-6, 8, -6], [12, 1, 2], "rim"),
    box("back_lip", [-6, 8, 4], [12, 1, 2], "rim"),
    box("left_lip", [-6, 8, -4], [2, 1, 8], "rim"),
    box("right_lip", [4, 8, -4], [2, 1, 8], "rim"),
    box("handle_neck", [-1, 6, 6], [2, 2, 3], "iron"),
    box("wood_handle", [-1, 6, 9], [2, 2, 5], "wood"),
    box("handle_cap", [-1.5, 6, 14], [3, 2, 1], "brass"),
    box("left_rest", [-6, 3, -4], [2, 2, 2], "iron"),
    box("right_rest", [4, 3, -4], [2, 2, 2], "iron"),
    box("back_rest", [-1, 3, 3], [2, 2, 2], "iron"),
]

PALETTES = {
    "hide": ((105, 60, 39), (136, 82, 52), (82, 47, 34), (178, 113, 67)),
    "cap_shadow": ((94, 42, 36), (120, 51, 41), (71, 35, 32), (151, 66, 49)),
    "muzzle": ((209, 163, 118), (230, 192, 150), (173, 126, 89), (238, 210, 174)),
    "nose": ((67, 44, 38), (89, 54, 45), (52, 37, 34), (120, 75, 59)),
    "stem": ((221, 198, 151), (237, 218, 178), (184, 158, 113), (247, 229, 192)),
    "cap": ((137, 61, 47), (171, 76, 55), (106, 48, 41), (193, 94, 65)),
    "spot": ((238, 224, 182), (250, 239, 206), (213, 198, 159), (255, 246, 218)),
    "hoof": ((66, 52, 42), (87, 66, 50), (50, 42, 36), (108, 82, 58)),
    "ivory": ((224, 207, 163), (242, 229, 194), (193, 173, 131), (252, 243, 216)),
    "eye": ((39, 31, 27), (69, 45, 37), (24, 21, 20), (119, 76, 55)),
    "iron": ((74, 81, 83), (102, 111, 111), (55, 62, 65), (129, 136, 133)),
    "seasoned_iron": ((38, 43, 43), (51, 57, 56), (32, 36, 36), (69, 73, 69)),
    "rim": ((127, 136, 132), (154, 160, 151), (98, 109, 108), (184, 181, 163)),
    "wood": ((117, 72, 42), (147, 92, 52), (91, 55, 37), (175, 112, 62)),
    "brass": ((177, 128, 57), (207, 158, 71), (137, 98, 49), (224, 184, 90)),
}


def png_bytes(width, height, pixels):
    def chunk(tag, data):
        payload = tag + data
        return struct.pack(">I", len(data)) + payload + struct.pack(">I", zlib.crc32(payload) & 0xFFFFFFFF)

    raw = bytearray()
    for y in range(height):
        raw.append(0)
        for x in range(width):
            raw.extend((*pixels[y][x], 255))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">2I5B", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")


def make_icon(kind):
    size = 32
    image = [[(0, 0, 0) for _ in range(size)] for _ in range(size)]

    def rect(x0, y0, x1, y1, color):
        for y in range(max(0, y0), min(size, y1)):
            for x in range(max(0, x0), min(size, x1)):
                image[y][x] = color

    if kind == "boar_meat":
        rect(7, 5, 24, 27, (76, 45, 37))
        rect(8, 7, 23, 25, (153, 79, 67))
        rect(11, 8, 21, 22, (193, 115, 91))
        rect(12, 10, 19, 12, (229, 166, 132))
        rect(5, 11, 9, 18, (219, 201, 165))
        rect(4, 10, 8, 13, (240, 228, 196))
        rect(4, 17, 8, 20, (240, 228, 196))
        rect(23, 11, 27, 18, (219, 201, 165))
        rect(24, 10, 28, 13, (240, 228, 196))
        rect(24, 17, 28, 20, (240, 228, 196))
    elif kind == "roast_boar":
        rect(5, 7, 27, 26, (59, 39, 31))
        rect(7, 6, 25, 24, (121, 64, 39))
        rect(9, 7, 23, 21, (178, 94, 48))
        rect(11, 9, 21, 19, (211, 132, 69))
        rect(10, 11, 12, 18, (89, 49, 34))
        rect(16, 10, 18, 19, (89, 49, 34))
        rect(8, 5, 12, 7, (227, 180, 111))
        rect(21, 21, 25, 25, (78, 117, 63))
        rect(23, 19, 27, 22, (107, 145, 76))
    else:
        rect(6, 10, 25, 24, (41, 45, 45))
        rect(8, 11, 23, 21, (84, 92, 91))
        rect(9, 12, 22, 19, (46, 52, 52))
        rect(11, 10, 20, 12, (150, 153, 143))
        rect(21, 14, 29, 18, (83, 62, 42))
        rect(27, 14, 30, 18, (180, 130, 58))
        rect(8, 22, 12, 25, (96, 69, 47))
        rect(20, 22, 24, 25, (96, 69, 47))
    return png_bytes(size, size, image)


def pack_boxes(boxes, atlas_width):
    cursor_x, cursor_y, row_height = 1, 1, 0
    packed = []
    for item in boxes:
        x, y, z = [max(1, math.ceil(v)) for v in item["size"]]
        width, height = 2 * (x + z), y + z
        if cursor_x + width + 1 > atlas_width:
            cursor_x = 1
            cursor_y += row_height + 1
            row_height = 0
        packed.append((cursor_x, cursor_y, width, height))
        cursor_x += width + 1
        row_height = max(row_height, height)
    atlas_height = max(64, 2 ** math.ceil(math.log2(cursor_y + row_height + 1)))
    return packed, atlas_height


def make_texture(boxes, width):
    placements, height = pack_boxes(boxes, width)
    pixels = [[(40, 40, 40) for _ in range(width)] for _ in range(height)]
    for item, (u, v, w, h) in zip(boxes, placements):
        colors = PALETTES[item["color"]]
        seed = sum(ord(ch) for ch in item["name"])
        rng = random.Random(seed)
        x, y = item["size"][0], item["size"][1]
        z = item["size"][2]
        region_w = 2 * (math.ceil(x) + math.ceil(z))
        region_h = math.ceil(y) + math.ceil(z)
        for py in range(region_h):
            for px in range(region_w):
                c = colors[1] if rng.random() < 0.12 else colors[0]
                if py == 0 or py == region_h - 1 or px == 0 or px == region_w - 1:
                    c = colors[2]
                if item["color"] == "cap" and rng.random() < 0.12:
                    c = colors[3]
                pixels[v + py][u + px] = c
        # Thin highlight and shadow bands give the hand-painted pixel blocks volume.
        for px in range(1, max(1, region_w - 1)):
            pixels[v + 1][u + px] = colors[3]
            pixels[v + region_h - 2][u + px] = colors[2]
        if item["color"] in ("hide", "cap", "wood"):
            for _ in range(max(1, region_w // 7)):
                px = rng.randrange(1, max(2, region_w - 1))
                py = rng.randrange(2, max(3, region_h - 2))
                pixels[v + py][u + px] = colors[3]
    return png_bytes(width, height, pixels), placements, height


def bedrock_geometry(identifier, texture_width, texture_height, boxes, placements, bones):
    bone_map = {name: [] for name, _, _ in bones}
    for item, (u, v, _, _) in zip(boxes, placements):
        bone_map[item["bone"]].append({
            "origin": item["from"],
            "size": item["size"],
            "uv": [u, v],
        })
    return {
        "format_version": "1.12.0",
        "minecraft:geometry": [{
            "description": {
                "identifier": identifier,
                "texture_width": texture_width,
                "texture_height": texture_height,
                "visible_bounds_width": 2.4,
                "visible_bounds_height": 1.7,
                "visible_bounds_offset": [0, 0.4, 0],
            },
            "bones": [{"name": name, **({"parent": parent} if parent else {}), "pivot": pivot, "cubes": bone_map[name]} for name, parent, pivot in bones],
        }],
    }


def bbmodel(name, geometry_id, boxes, placements, width, height, texture_path, texture_data, bones, animations=None):
    elements = []
    group_map = {}
    child_map = {bone_name: [] for bone_name, _, _ in bones}
    for bone_name, _, _ in bones:
        group_map[bone_name] = f"a0000000-1111-4111-8111-{len(group_map):012x}"
        for item, (u, v, _, _) in zip(boxes, placements):
            if item["bone"] != bone_name:
                continue
            idx = len(elements)
            dims = [math.ceil(n) for n in item["size"]]
            x, y, z = dims
            uv_faces = {
                "north": [u + z, v + z, u + z + x, v + z + y],
                "east": [u, v + z, u + z, v + z + y],
                "south": [u + z + x + z, v + z, u + z + x + z + x, v + z + y],
                "west": [u + z + x, v + z, u + z + x + z, v + z + y],
                "up": [u + z, v, u + z + x, v + z],
                "down": [u + z + x, v, u + z + x + z, v + z],
            }
            element_uuid = f"{idx:08x}-1111-4111-8111-{idx:012x}"
            elements.append({
                "name": item["name"],
                "from": [-item["from"][0] - item["size"][0], item["from"][1], item["from"][2]],
                "to": [-item["from"][0], item["from"][1] + item["size"][1], item["from"][2] + item["size"][2]],
                "autouv": 0,
                "color": 0,
                "origin": [0, 0, 0],
                "faces": {
                    face: {"uv": rect, "texture": 0}
                    for face, rect in uv_faces.items()
                },
                "type": "cube",
                "uuid": element_uuid,
            })
            child_map[bone_name].append(element_uuid)
    outliner = []
    groups_by_name = {}
    for bone_name, parent, pivot in bones:
        group = {
            "name": bone_name,
            "origin": [-pivot[0], pivot[1], pivot[2]],
            "rotation": [0, 0, 0],
            "color": 0,
            "export": True,
            "visibility": True,
            "locked": False,
            "uuid": group_map[bone_name],
        }
        groups_by_name[bone_name] = group
        if not parent:
            outliner.append({"uuid": group_map[bone_name], "isOpen": True, "children": child_map[bone_name]})
    for bone_name, parent, _ in bones:
        if parent:
            parent_children = next(item["children"] for item in outliner if item["uuid"] == group_map[parent]) if parent == "root" else None
            if parent != "root":
                parent_children = find_outliner_children(outliner, group_map[parent])
            parent_children.append({"uuid": group_map[bone_name], "isOpen": True, "children": child_map[bone_name]})
    model = {
        "meta": {"format_version": "5.0", "model_format": "bedrock", "box_uv": True},
        "name": name,
        "model_identifier": geometry_id,
        "visible_box": [2.4, 1.7, [0, 0.4, 0]],
        "resolution": {"width": width, "height": height},
        "elements": elements,
        "groups": list(groups_by_name.values()),
        "outliner": outliner,
        "textures": [{
            "path": texture_path,
            "name": Path(texture_path).name,
            "folder": "",
            "namespace": "",
            "id": "texture0",
            "width": width,
            "height": height,
            "uv_width": width,
            "uv_height": height,
            "particle": True,
            "render_mode": "normal",
            "visible": True,
            "mode": "bitmap",
            "source": "data:image/png;base64," + base64.b64encode(texture_data).decode("ascii"),
        }],
        "animations": animations or [],
        "display": {},
        "overrides": [],
        "variable_placeholders": "",
    }
    return model


def boar_animations(bone_uuids):
    def animator(bone, channels):
        return {
            bone_uuids[bone]: {
                "name": bone,
                "type": "bone",
                "keyframes": [
                    {
                        "channel": channel,
                        "time": time,
                        "interpolation": "linear",
                        "data_points": [{axis: str(value) for axis, value in zip(("x", "y", "z"), values)}],
                    }
                    for channel, keys in channels.items()
                    for time, values in keys
                ],
            }
        }

    idle_animators = {}
    idle_animators.update(animator("body", {
        "position": [(0, (0, 0, 0)), (1, (0, 0.15, 0)), (2, (0, 0, 0))],
        "rotation": [(0, (0, 0, -1)), (1, (0, 0, 1)), (2, (0, 0, -1))],
    }))
    idle_animators.update(animator("cap", {
        "rotation": [(0, (0, 0, -1)), (1, (0, 0, 1)), (2, (0, 0, -1))],
    }))
    walk_animators = {}
    for bone, swing in (("front_left_leg", -22), ("back_right_leg", -22), ("front_right_leg", 22), ("back_left_leg", 22)):
        walk_animators.update(animator(bone, {
            "rotation": [(0, (swing, 0, 0)), (0.25, (0, 0, 0)), (0.5, (-swing, 0, 0)), (0.75, (0, 0, 0)), (1, (swing, 0, 0))],
        }))
    return [
        {"name": "animation.monster_restaurant.mushroom_boar.idle", "uuid": "10000000-1111-4111-8111-000000000001", "loop": "loop", "length": 2, "animators": idle_animators},
        {"name": "animation.monster_restaurant.mushroom_boar.walk", "uuid": "10000000-1111-4111-8111-000000000002", "loop": "loop", "length": 1, "animators": walk_animators},
    ]


def find_outliner_children(outliner, target_uuid):
    for node in outliner:
        if node.get("uuid") == target_uuid:
            return node["children"]
        found = find_outliner_children(node.get("children", []), target_uuid)
        if found is not None:
            return found
    return None


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    boar_bones = [
        ("root", None, [0, 0, 0]),
        ("body", "root", [0, 7, 0]),
        ("head", "body", [0, 7, -6]),
        ("cap", "body", [0, 10, 0]),
        ("front_left_leg", "body", [-3, 4, -3]),
        ("front_right_leg", "body", [3, 4, -3]),
        ("back_left_leg", "body", [-3, 4, 4]),
        ("back_right_leg", "body", [3, 4, 4]),
    ]
    boar_texture, boar_uv, boar_h = make_texture(BOAR, 128)
    (ATLAS / "entity").mkdir(parents=True, exist_ok=True)
    (ATLAS / "entity" / "mushroom_boar.png").write_bytes(boar_texture)
    write_json(ENTITY_MODELS / "mushroom_boar.geo.json", bedrock_geometry("geometry.monster_restaurant.mushroom_boar", 128, boar_h, BOAR, boar_uv, boar_bones))
    write_json(SOURCE / "mushroom_boar.bbmodel", bbmodel(
        "Mushroom Boar", "geometry.monster_restaurant.mushroom_boar", BOAR, boar_uv, 128, boar_h,
        "../../RP/textures/entity/mushroom_boar.png", boar_texture, boar_bones,
        boar_animations({name: f"a0000000-1111-4111-8111-{index:012x}" for index, (name, _, _) in enumerate(boar_bones)}),
    ))
    write_json(ENTITY_MODELS.parent / ".." / "animations" / "mushroom_boar.animation.json", {
        "format_version": "1.8.0",
        "animations": {
            "animation.monster_restaurant.mushroom_boar.idle": {
                "loop": True,
                "animation_length": 2.0,
                "bones": {
                    "body": {
                        "position": {"0.0": [0, 0, 0], "1.0": [0, 0.15, 0], "2.0": [0, 0, 0]},
                        "rotation": {"0.0": [0, 0, -1], "1.0": [0, 0, 1], "2.0": [0, 0, -1]},
                    },
                    "cap": {"rotation": {"0.0": [0, 0, -1], "1.0": [0, 0, 1], "2.0": [0, 0, -1]}},
                },
            },
            "animation.monster_restaurant.mushroom_boar.walk": {
                "loop": True,
                "animation_length": 1.0,
                "bones": {
                    name: {"rotation": {"0.0": [swing, 0, 0], "0.25": [0, 0, 0], "0.5": [-swing, 0, 0], "0.75": [0, 0, 0], "1.0": [swing, 0, 0]}}
                    for name, swing in (("front_left_leg", -22), ("back_right_leg", -22), ("front_right_leg", 22), ("back_left_leg", 22))
                },
            },
        },
    })

    skillet_bones = [("root", None, [0, 0, 0]), ("body", "root", [0, 0, 0])]
    skillet_texture, skillet_uv, skillet_h = make_texture(SKILLET, 64)
    (ATLAS / "blocks").mkdir(parents=True, exist_ok=True)
    (ATLAS / "blocks" / "skillet.png").write_bytes(skillet_texture)
    (ATLAS / "items").mkdir(parents=True, exist_ok=True)
    for icon_name in ("skillet", "boar_meat", "roast_boar"):
        (ATLAS / "items" / f"{icon_name}.png").write_bytes(make_icon(icon_name))
    write_json(BLOCK_MODELS / "skillet.geo.json", bedrock_geometry("geometry.monster_restaurant.skillet", 64, skillet_h, SKILLET, skillet_uv, skillet_bones))
    write_json(SOURCE / "skillet.bbmodel", bbmodel(
        "Skillet", "geometry.monster_restaurant.skillet", SKILLET, skillet_uv, 64, skillet_h,
        "../../RP/textures/blocks/skillet.png", skillet_texture, skillet_bones,
    ))
    print(f"Built two editable models, two Bedrock geometries, and PNG textures under {ROOT}")


if __name__ == "__main__":
    main()
