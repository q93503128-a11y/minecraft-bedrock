# Monster Restaurant — Current Status

Updated: 2026-11-05

## M0 source slice

- **State: SOURCE_COMPLETE / STATIC_PASS / PACKAGE_PASS / ENGINE_NOT_RUN.**
- Installed Bedrock package: `Microsoft.MinecraftUWP 1.26.6005.0`; official 26.60 release notes identify stable `@minecraft/server` `2.11.0`. Pack pins stable `@minecraft/server-ui` `2.3.0`.
- Namespace: `monster_restaurant`. BP/RP manifests use five distinct UUIDs and depend on each other by UUID/version.
- New creature: **버섯 멧돼지**, with a custom bone model, pixel palette texture, looping idle animation, forest/taiga spawn rule, retaliatory melee behavior, and guaranteed 1–2 meat drops.
- New cooking station: **요리 팬**, craftable from iron, a stick, and oak planks. Its custom block interaction opens a short recipe form, consumes one boar meat and gives one edible roast. The player recipe discovery flag is saved on the player for future cookbook integration.
- Source assets: two `.bbmodel` files; two Bedrock geometry files; five PNG textures (mob, block surface, three inventory icons). The geometry/texture build script is deterministic and local.
- External design basis: Cuisineer’s customer-side order cues and Dave the Diver’s resource-to-meal-to-restaurant loop remain references for later UX; the M0 form is a one-recipe functional prototype, not a finished UI.
- Reproducible package: `build/MonsterRestaurant-0.1.0.mcaddon`.

## Verification record

- `python projects/monster-restaurant/assets/blockbench/build_models.py`: PASS; regenerates model JSON and textures.
- `python projects/monster-restaurant/tools/build_addon.py`: PASS; validates JSON, manifest UUID/dependency integrity, core IDs/references, texture files, and JavaScript syntax, then packages both packs.
- Package contents checked for exactly two pack manifests: PASS.
- Minecraft import, script/module loading, custom block placement/use, creature spawning/combat/drops, recipe persistence after relog, texture/animation appearance: **NOT_RUN**.
- Model/texture/UI quality: source art exists and pixel icons were inspected, but the `.bbmodel` files have not been opened/exported in the Blockbench GUI and assets have not been viewed in Bedrock. **No visual quality sign-off.**
- Local Blockbench `5.2.1` is installed. No connected Blockbench MCP tool is available in this session; the current model exporter is deterministic source generation, not a verified GUI export.
- No existing project directories were edited.

## Next development order

1. Import the package into Bedrock 26.60 and inspect Content Log for manifest, schema, API, geometry, texture, and animation errors.
2. Summon and observe the boar, wait for natural spawning, defeat it, and confirm drops; interact with the skillet, cancel and craft, eat the meal, and reconnect to verify recipe discovery persists.
3. Open the `.bbmodel` sources in Blockbench, verify hierarchy/UVs/texture mapping, refine silhouette and pixel texture from in-game captures, then record actual screenshots and revise the model-quality verdict.
4. Only after that runtime gate, expand toward M1 customer service and restaurant operation. Do not treat the current prototype as M1 completion.
