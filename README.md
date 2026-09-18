# Minecraft Bedrock Projects

Canonical planning/documentation repository for Minecraft Bedrock projects.

## Lucky Block Add-On

Active project: a five-tier Lucky Block Add-On with externally licensed real assets, varied rewards/events and a first-Ender-Dragon late-game gate.

Current development package:
- `build/LuckyBlock_0.2.0.mcaddon`

Current 0.2.0 slice contains:
- all five Lucky Block tiers: Common, Rare, Epic, Legendary and Mythic;
- all five Lucky Fragment tiers;
- a Microsoft MIT Lucky Block sample geometry/texture base for Common;
- CC0 short / short-tall / tall-short / tall crystal geometry families for higher-tier crystal silhouettes;
- a 141-element CC0 Natura ring geometry for Legendary;
- a 196-element CC0 Gaia ring geometry for Mythic;
- actual mana / natura / gaia crystal textures and natura / gaia ring textures;
- animated crystal flipbooks;
- tier-specific opening custom components;
- six same-tier fragments -> one same-tier Lucky Block recipes;
- Korean and English display names;
- BP + RP packaged as one `.mcaddon`.

Important:
- 0.2.0 is a development milestone, not the completed add-on.
- No placeholder image/model/icon/sound is allowed or intentionally included.
- Runtime import / Content Log / in-game render validation in Minecraft Bedrock is still required.
- The full external reward library, acquisition hooks, structures/events, Ender Dragon unlock and post-dragon enemies/bosses are still under development.

Project documents:
- `docs/LUCKY_BLOCK_CANON.md`
- `docs/EXTERNAL_ASSET_CATALOG.md`
- `docs/LICENSE_NOTES.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `addon/LuckyBlock/STATUS.md`
- `addon/LuckyBlock/THIRD_PARTY_NOTICES.md`
