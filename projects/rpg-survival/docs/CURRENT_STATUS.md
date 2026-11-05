# RPG Survival Current Status

Last updated: 2026-10-02

## Runtime baseline

Current development release: **v0.24.0 REMAKE ALPHA3**

Playable addon remains an external build artifact. This repository stores planning, status, audit, and provenance only.

MCADDON SHA-256:
`0f2882921ac2fe186e15b484e0a9d4ea5bb46a83a45c25806990a6a3ed4b2990`

## Carried forward from v0.23.2

- sequential RPG stages S0-S7,
- structural anti-early-endgame loot/enemy gates,
- +20 enhancement with large growth milestones up to 60x,
- Korean large-number formatting,
- World Tier + milestone progression,
- rejected War Scythe absent from generated equipment pools.

## Implemented in v0.24.0

### Persistent RPG HUD architecture

The legacy single-line ActionBar HUD was removed.

A persistent JSON UI HUD now uses an adapted MIT MinUI title-channel/preserved-title transport. The runtime sends only changed values, one value per tick, and the client stores each keyed HUD value independently.

Current layout:

- top-right: Day / World Tier / RPG Stage,
- top-left: active dungeon or field-boss objective,
- top-center: targeted enemy card,
- bottom-left: player HP / level / EXP / passive status,
- near crosshair: floating combat damage,
- bottom-center: short notices.

Combat Power is intentionally absent from the persistent HUD. CP remains a build/equipment/status value.

### Target HUD

Looking at or recently fighting an enemy now shows a separate target card with:

- name,
- RPG level,
- rank,
- threat damage multiplier,
- affixes/status effects,
- HP bar text,
- current/max RPG HP.

Field bosses receive a BOSS presentation.

### Damage feedback

Damage no longer gets appended to the old status line.

The HUD now presents the most recent hit near the crosshair, with:

- compact large-number formatting,
- critical marker,
- combo count,
- merged combo total,
- skill/summon labels.

The damage layer deliberately has no large background card so it reads as combat feedback rather than a debug panel.

### Title-collision protection

The HUD transport uses the title channel internally, so all RPG Survival cinematic titles now go through a shared display helper.

HUD packets pause while these titles are visible:

- level-up,
- Blood Moon,
- field-boss announcement,
- dungeon wave/boss,
- dungeon clear/fail,
- hunt completion.

This prevents the persistent HUD from immediately overwriting encounter presentation.

### Equipment UX pass

The equipment flow now treats CP as an equipment/build metric rather than permanent HUD clutter.

Changes include:

- EQUIPMENT-focused hierarchy,
- CP and RPG fragments at the equipment header,
- explicit five-slot presentation,
- PWR / enhancement / lock state on slot cards,
- upgrade recommendations before detailed stats,
- bag items sorted by upgrade delta,
- ATK / DEF terminology separated from percentage amplification/reduction.

This is still using the current form layer; a later visual pass may route these screens through a fuller custom JSON UI inventory/equipment layout after runtime verification.

### Deprecated War Scythe cleanup

The rejected external War Scythe 3D attachable, geometry, and animation were removed.

The legacy item ID and 2D icon remain only for old test-world compatibility. It no longer participates in normal generated loot.

A new high-quality 3D weapon will not be accepted until it passes the held-model runtime pipeline.

### Licensing/provenance

MinUI title-channel HUD architecture is adapted under MIT. Its full license and attribution are included in the Resource Pack.

The deprecated War Scythe compatibility texture remains under the prior Apache-2.0 notice.

## Static validation for v0.24.0

Passed:

- 26 JavaScript files: syntax check,
- 61 JSON files: strict parse,
- 120 relative JavaScript imports: all resolved,
- BP/RP v0.24.0 manifest dependency check,
- official-style `RP/ui/_ui_defs.json` routing check,
- all 10 HUD transport keys linked to JSON UI controls,
- persistent HUD contains no CP and no legacy ActionBar renderer,
- cinematic title calls routed through collision-protected helper,
- 5 HUD frame textures use 9-slice rendering,
- rejected War Scythe 3D files absent,
- 10 geometry references: 0 missing,
- 21 animation references: 0 missing,
- 26 client texture references: 0 missing,
- 4 custom RPG item-icon references: 0 missing,
- MinUI license/notice present,
- BP/RP mcpack CRC,
- mcaddon CRC,
- source ZIP CRC.

Minecraft 26.52 runtime testing is still required for the JSON UI HUD and final small-window placement.

## Next implementation batch

1. Runtime-test v0.24 HUD at small and normal window sizes; adjust only measured layout issues.
2. Build the reliable external held-model import pipeline and replace the deprecated weapon with 2-3 high-quality licensed weapons.
3. Add enemy visual progression: vanilla early mobs -> upgraded/variant forms -> custom-model late-game enemies.
4. First target family: zombie progression including a visibly stronger muscular/brute zombie rather than HP-only scaling.
5. Research and import legally reusable biome/world-generation assets; each new biome must ship with its own enemy/material/content identity.
6. Connect new biomes to progression stage gates so endgame regions/enemies cannot appear in early play.
7. Continue boss model/animation/arena remake and expand material/ore roles.

See `REMAKE_CANON.md` for binding design rules.
