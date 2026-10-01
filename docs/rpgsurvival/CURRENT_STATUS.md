# RPG Survival Current Status

Last updated: 2026-10-01

## Runtime baseline

Current development release: **v0.23.2 REMAKE ALPHA2**

Playable addon remains an external build artifact. This repository stores planning, status, audit, and provenance only.

MCADDON SHA-256:
`652a846f59d465b1015b4b22f42f84c18c35569931674655b70983698a1bf46d`

## Implemented in v0.23.2

### Sequential RPG progression gate

A new progression-stage system is implemented on top of World Tier.

- S0: 개척 — enhance cap +3
- S1: 초기 RPG — +5
- S2: 네더 시대 — +8
- S3: 중반 정복 — +10
- S4: 엔드 진입 — +12
- S5: 엔드게임 — +15
- S6: 심화 엔드게임 — +18
- S7: 정점 — +20

Stages are sequential. A later milestone cannot bypass an unfinished earlier stage.

Current milestone requirements include World Tier, Nether/End reach, field-boss clears, Ender Dragon clear, and Wither clear.

### Anti-early-endgame loot rules

Generated equipment is now capped by current RPG stage.

Reward source rarity ceilings are separate for:

- regular mobs,
- field bosses,
- dungeons,
- world events.

Regular mobs cannot become the primary source of top current-stage loot.

Dungeon themes and difficulty also have progression-stage gates in addition to World Tier.

Field bosses have minimum RPG stages. The Void Hunter does not enter the normal rotation until post-Dragon stage.

Ambient mob rank scaling now uses the gated effective progression level rather than unrestricted world age alone.

### Enhancement remake foundation

Maximum enhancement changed from +10 to **+20**.

Scalable base stats now use a milestone multiplier curve:

- +0 = 1.00x
- +5 = 1.80x
- +10 = 4.10x
- +15 = 12.80x
- +18 = 30.50x
- +20 = 60.00x

Enhancement fragment cost rises nonlinearly toward the upper levels.

Attempting to enhance beyond the current RPG-stage cap is rejected.

This is the numerical foundation only; full late-game enemy/equipment balance will be expanded as later content is added.

### Large-number presentation

A reusable RPG number formatter now supports Korean large-number units from 만/억/조 upward.

HUD, equipment power, boss HP, comparison values, and several UI stat surfaces have been moved to compact formatting.

### Progression UX

The main/world UI now displays RPG Stage alongside World Tier.

The Adventure screen shows the next progression stage and its outstanding requirements, such as:

- required World Tier,
- Nether/End reach,
- field-boss clear count,
- Ender Dragon clear,
- Wither clear.

### Rejected external War Scythe

The previous external War Scythe is no longer part of generated equipment pools.

Its ID remains only for compatibility with old test items/worlds and is labeled as a deprecated asset.

Reason for rejection:

- runtime model did not read visually as a scythe,
- source geometry/texture quality is below remake target,
- successful JSON loading is not sufficient for model acceptance.

## Static validation for v0.23.2

Passed:

- 24 JavaScript files: syntax check,
- 61 JSON files: strict parse,
- 113 relative JavaScript imports: all resolved,
- BP/RP v0.23.2 manifest dependency check,
- rejected scythe absent from generated weapon bases,
- sequential stage guards present,
- +0..+20 stat/cost curve shape smoke test,
- Korean large-number formatter smoke test,
- 11 geometry references: 0 missing,
- 23 animation references: 0 missing,
- 27 client texture references: 0 missing,
- 6 custom item-icon references: 0 missing,
- BP/RP mcpack ZIP CRC,
- mcaddon ZIP CRC,
- source ZIP CRC.

Minecraft runtime testing is still required for actual gameplay behavior.

## Next implementation batch

1. Build the repeatable held-model import pipeline around current Bedrock attachable conventions.
2. Select 2–3 genuinely high-quality, legally reusable weapon assets.
3. Calibrate each asset separately in first person, third person, swing/action, inventory icon, and glint.
4. Only after runtime success, expand weapon families in quantity.
5. Begin material/ore expansion with distinct roles rather than color-only tiers.
6. Add more RPG content loops: elites, field events, dungeon room variants, rare veins, boss-exclusive crafting, relic/rune/accessory paths.
7. Continue replacing legacy boss presentation with dedicated models, animations, arenas, and phase mechanics.

See `REMAKE_CANON.md` for binding design rules.
