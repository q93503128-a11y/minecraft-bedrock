# External Asset Catalog — Lucky Block Add-On

Reviewed: 2026-09-18
Bedrock baseline for active implementation: current stable 26.51, with compatibility re-check before release.

| Source | Creator / License | Exact candidate assets or systems | Planned Lucky use | Dragon gate | Bedrock port effort | Status |
|---|---|---|---|---|---|---|
| minecraft-samples / lucky_block | Microsoft / MIT | `lucky_block/version_1/behavior_packs/.../luckyblock.json`, `resource_packs/.../models/blocks/luckyblock.geo.json`, `textures/blocks/luckyblock.png`, sample custom-component script | official Bedrock block/opening architecture; Common visual base may be structurally adapted rather than copied unchanged | pre | Low | VERIFIED |
| minecraft-samples | Microsoft / MIT | custom_items, custom_projectiles, custom_sounds, particles, structures samples | implementation foundation for reward families | both | Low | VERIFIED |
| minecraft_botania_pylon_crystal | CorvaeOboro / CC0-1.0 | `pylon_crystal_bipyramid_short.json`, `shorttall.json`, `tall.json`, `tallshort.json`; mana/gaia/natura crystal PNGs; ring models/textures | Lucky Fragment geometry language; crystal cores/frames for high-tier Lucky Blocks | both | Medium (Java block-model -> Bedrock geometry conversion) | VERIFIED |
| Loy-s-Goodies | Loy / CC0-1.0 | `220909_burger.bbmodel`, `230423_noodles.bbmodel`, `230516_backpack.bbmodel`, `220130_snow_globe.bbmodel`, `230924_vending_machine.bbmodel`, plunger, turret, chainsaw, multiple axes/bows/hammers/shields/swords/wands | Common/Rare joke and utility rewards; Epic weapon/utility pool after behavior work | mainly pre | Medium | VERIFIED |
| mc-blockbench-models | FrenchKrab / CC BY 4.0 | cardboard axe/shield/sword, drill breaker, warhammer-pickaxe, mineral greatsword; selected original-looking mob models after provenance screen | odd Common rewards through Epic equipment; selected encounter models | both | Medium | VERIFIED WITH ATTRIBUTION |
| Inhabitants | Team Synapse / MIT | `geo/bogre.geo.json`, `geo/impaler.geo.json`, `geo/warped_clam.geo.json`; matching animations, textures, glow masks, spike projectile; Bogre recipes and lair loot concepts | Bogre encounter/event, Impaler elite, Warped Clam utility/End encounter; projectile/effect patterns | Impaler pre/late candidate; Warped Clam post; Bogre either | Medium-High | VERIFIED |
| Slayers-Beasts | InvictusSlayer / MIT | repo default branch `1.21.4`; creature/boss extraction pending | fantasy mobs, minibosses and bosses | mostly post | High | LICENSE VERIFIED, ASSET REVIEW PENDING |
| forgero | SigmundGranaas / MIT | repo default branch `1.20`; modular weapon/tool implementation and assets pending per-file review | modular special tool/weapon reward family | both | High | LICENSE VERIFIED, ASSET REVIEW PENDING |
| visuality | PinkGoosik / MIT | crystal sparkle/hit/environmental visual-effect patterns | acquisition/opening/combat presentation reference and selective reusable assets | both | Medium-High | VERIFIED; JAVA LOGIC REBUILD REQUIRED |
| bosses-of-mass-destruction | Barribob / LGPL-3.0 | boss models/mechanics and encounter flow | high-tier boss encounter reference; direct reuse only under explicit LGPL compliance path | post | High | CONDITIONAL |
| Stellarity | Prismatic Shards / custom restrictive license | End overhaul, post-dragon altar, late-game encounter pacing | design reference only | post | N/A | NO REDISTRIBUTION |
| Fantasy Knights & Factions | project MIT; some third-party skin provenance varies | random battles, guards, skirmishes, faction encounters | encounter/event design reference; only individually cleared assets can be imported | both | High | CONDITIONAL PER ASSET |
| Themonsterguns | UCCHI0813 / CC0-1.0 (Modrinth and CurseForge list public-domain/CC0) | guns, swords, tools, foods, backpacks, biomes, dimensions, mobs, bosses, structures; examples include Titan Knight, Spirit of Armor, Nightmare Sniper Rifle, Eagle Eye, Annihilation Greatsword, Enhouji Temple, Desert Spire, Terra Lizard, EndriumDragon | large reward pool and major post-dragon enemy/boss/structure source | both, especially post | High (Forge/GeckoLib -> Bedrock) | LICENSE VERIFIED; BINARY EXTRACTION BLOCKED IN CURRENT TOOL SESSION |

## First-pass tier visual binding

- Common Lucky Block: use Microsoft's production sample geometry as the technical base, but change the final silhouette/material composition with verified external crystal components; do not ship the untouched sample as the final Common design.
- Rare: reinforced frame plus a small CC0 crystal crown/inset using the short bipyramid language.
- Epic: multi-part crystal core with stronger frame separation and active particles.
- Legendary: ringed/altar-like silhouette using the CC0 pylon ring language plus tall crystal components; no simple cube recolor.
- Mythic: non-cube relic/halo/core silhouette built from ring + crystal geometry and event-driven particles/opening sequence.

## Lucky Fragment binding

Fragments are intended as placeable micro-crystal blocks/items rather than flat placeholder icons where Bedrock constraints permit it. Start from the CC0 pylon bipyramid geometry and produce five materially different silhouettes/sizes/ornament levels, not five recolors.

## Immediate exclusion decisions

- Stellarity original/modified assets: do not bundle.
- WorldAnimals assets: no reuse until a redistribution license is actually verified.
- FrenchKrab models that obviously derive from third-party game/IP designs: exclude unless provenance independently clears them.
- Fantasy Knights third-party skins: exclude unless individually licensed.


## Integrated reward batch — 0.4.0

Direct CC0 imports from Loy's Goodies now include 15 production models in total. The new 0.4.0 batch adds noodles, Moai, PC, CCTV camera, wrench, chainsaw, camera, golden hammer, vase and easel to the earlier burger, plunger, backpack, snow globe and vending machine set.

All 15 are bound to distinct behavior contracts in `BP/scripts/reward_behaviors.js`; they are not counted as distinct merely because their geometry differs.


## Inhabitants implementation — 0.5.0

Inhabitants has moved from candidate status to active vendored content.

### Impaler
- Role: pre-dragon elite hostile.
- Visuals: original 19-bone / 21-cube geometry, original animation set and default texture.
- Audio: original scream and spike sounds.
- Bedrock behavior: 70 HP, 10 melee damage, low-density dark natural spawning, plus periodic mid-range spike/shove special behavior.
- Lucky drops: strong Rare Fragment chance, Epic Fragment chance, small post-dragon Legendary Fragment chance.

### Warped Clam
- Role: post-Ender-Dragon End special enemy.
- Visuals: original 5-bone / 10-cube geometry, original opening/closing/opened/pushing animation set and Ender texture.
- Audio: original opening/impact sounds.
- Bedrock behavior: stationary 130 HP enemy, strong close-range pulse/knockback.
- Spawn gate: never normal-spawned by a spawn rule; Script API only attempts spawns in The End after `lb:post_dragon_unlocked` is true, with a nearby density cap.
- Lucky drops: high Epic Fragment chance, Legendary Fragment chance, low Mythic Fragment jackpot.


## Bogre miniboss implementation — 0.6.0

- Source: Inhabitants / MIT.
- Original visual payload: 31 bones, 40 cubes, 21 named animations, original texture and selected original OGG combat sounds.
- Lucky role: Epic rare encounter / Legendary major encounter.
- Bedrock stats: 220 HP, boss HUD, high knockback resistance, melee pressure.
- Phase thresholds: >62%, 30–62%, <=30%.
- Core mechanic: telegraphed ground shockwave. Players off the ground at impact avoid the shockwave.
- Weak window: after a shockwave, `minecraft:damage_sensor` temporarily raises received damage to 1.6x.
- The boss becomes faster and uses shockwaves more frequently as its HP decreases.
- Reward: guaranteed Epic Lucky Block + 2–4 Legendary Fragments; Mythic Fragment chance is 4% pre-dragon / 10% post-dragon.
- Bogre is not added to ambient natural spawning. It enters gameplay through Lucky Block encounter outcomes.
