# RPG Survival Remake Canon

Last updated: 2026-10-01  
Project: Minecraft Bedrock RPG Survival remake  
Current runtime baseline at start of this canon: `RPGSurvival_v0.23.1_REMAKE_ALPHA1_FIX1.mcaddon`

> This repository stores planning, design canon, audits, and provenance for the Bedrock projects. The playable addon is built and tested separately. Do not treat repository source state as the runtime addon canon unless explicitly recorded.

## 1. Remake goal

RPG Survival must feel like a large-scale action RPG that happens inside Minecraft, not vanilla Minecraft with percentage bonuses.

The remake must grow all of these together:

- numerical power,
- equipment identity,
- player combat actions,
- enemy and boss presentation,
- world progression,
- dungeon and raid structure,
- resource and crafting progression,
- UI/UX readability.

Large numbers alone are not sufficient. A boss with huge HP but vanilla movement, weak silhouette, no telegraph, and no arena is not an acceptable endgame boss.

## 2. Non-negotiable progression rule

**Endgame enemies and endgame equipment must not appear during early progression.**

This must be enforced structurally, not only with low probabilities.

Every high-tier reward/enemy must pass multiple gates where appropriate:

1. World Tier / world age.
2. World progression milestone.
3. Dimension progression.
4. Boss-clear progression.
5. Dungeon challenge/rank.
6. Player/equipment requirement when needed.

A 0.01% endgame drop at Level 1 is still considered a design failure.

## 3. World progression

World Tier remains useful for ambient scaling, but it is not the sole progression key.

The remake introduces progression milestones such as:

- early overworld progression,
- Nether reached,
- midgame boss progress,
- End reached,
- Ender Dragon defeated,
- post-Dragon endgame,
- advanced boss/raid clears.

World Tier and milestone progression are combined into an effective progression stage.

High-end field bosses, dungeons, materials, and equipment are locked until their stage is reached.

### Initial stage intent

| Stage | Broad phase | Typical unlocks |
| --- | --- | --- |
| 0 | Starting survival | common vanilla resources, basic RPG gear |
| 1 | Early RPG | first elites/field boss, rare gear |
| 2 | Nether-era | stronger elites, epic gear, advanced forging |
| 3 | Midgame | harder dungeons, specialized materials |
| 4 | End-era | legendary rewards begin, high-rank bosses |
| 5 | Post-Dragon | true endgame systems, raids, +15 ceiling |
| 6 | Advanced endgame | high raids, +18 ceiling |
| 7 | Pinnacle | future mythic/transcendent systems, +20 ceiling |

Exact progression conditions may be rebalanced, but later stages must never collapse into day count alone.

## 4. Vanilla Minecraft policy

Do **not** remove vanilla progression wholesale.

Vanilla resources become the foundation layer of the RPG economy:

- iron: early forging/alloy base,
- gold: magic/rune/catalyst base,
- diamond: high-quality equipment component,
- netherite: endgame alloy foundation,
- Nether/End materials: dimensional crafting components.

Later resources extend this system rather than replacing it with colored copies.

New ores/materials must have gameplay identity. Examples:

- physical/forging material,
- arcane material,
- abyss/corruption material,
- celestial material,
- boss-core material,
- raid-only catalyst.

Adding many ores that only differ by numerical tier is rejected.

## 5. Equipment direction

Vanilla swords/armor are temporary early progression, not the final equipment identity.

Long-term weapon families include:

- sword,
- greatsword,
- rapier,
- dual blades,
- dagger,
- katana,
- spear,
- halberd,
- axe,
- greataxe,
- hammer,
- warhammer,
- scythe,
- gauntlet,
- bow,
- greatbow,
- crossbow,
- staff,
- wand,
- grimoire.

Weapon families must differ by actions and rhythm, not only damage numbers.

Examples:

- greatsword: charge / heavy stagger / super armor,
- rapier: thrust / evade counter,
- gauntlet: combo chain,
- scythe: broad cleave / sustain,
- spear: reach / spacing,
- grimoire: spell-oriented kit.

## 6. Equipment rarity and acquisition

Current legacy rarities can remain during migration, but reward sources must have hard rarity ceilings.

Early regular mobs may not roll endgame rarity.

Bosses/dungeons can exceed regular-mob rarity, but only inside the current progression-stage ceiling.

Future top rarities such as Mythic/Transcendent must not be added until they have:

- distinctive visuals,
- unique mechanics,
- appropriate acquisition content,
- dedicated progression gates.

Do not create top rarity as merely a recolored vanilla item with larger stats.

## 7. Enhancement redesign

Enhancement must become increasingly difficult and increasingly rewarding.

Target maximum: **+20**.

The initial target stat curve is intentionally steep:

| Enhance | Relative stat multiplier |
| ---: | ---: |
| +0 | 1.00x |
| +3 | ~1.40x |
| +5 | ~1.80x |
| +8 | ~2.85x |
| +10 | ~4.10x |
| +12 | ~6.20x |
| +15 | ~12.8x |
| +18 | ~30.5x |
| +20 | ~60x |

This curve applies to scalable base stats, not every percentage modifier.

Enhancement access is progression-gated. Initial ceilings:

- Stage 0: +3
- Stage 1: +5
- Stage 2: +8
- Stage 3: +10
- Stage 4: +12
- Stage 5: +15
- Stage 6: +18
- Stage 7: +20

Enhancement should become expensive through materials/catalysts and later progression. Item destruction is not a required mechanic. If failure chance is introduced later, protection/pity must be considered before shipping it.

Milestone enhancements (+10/+15/+20) should eventually gain presentation and/or mechanic changes, not only numbers.

## 8. Large-number architecture

RPG combat must not be limited by Minecraft's visible 20-HP shell.

The existing virtual HP architecture remains the basis for large numerical growth.

Long-term target scale may reach:

- early game: tens to hundreds,
- midgame: thousands to hundreds of thousands,
- late game: millions+,
- pinnacle content: potentially billions/trillions if progression length justifies it.

The scale must remain internally coherent. Do not inflate values merely to display large numbers.

UI must compact large values (for Korean localization, e.g. 만/억/조 where appropriate) instead of rendering unreadable long integers.

## 9. Boss quality bar

A high-tier boss requires all of the following:

- recognizable silhouette,
- dedicated model,
- dedicated animation set,
- deliberate scale,
- spawn/intro presentation,
- readable telegraphs,
- multiple attacks,
- phase changes,
- reaction/counter windows,
- arena or encounter-space identity,
- unique reward identity,
- audio/VFX appropriate to its tier.

Enemy threat must rise visually as progression rises.

Late-game bosses cannot reuse low-tier presentation with only higher HP.

Boss and enemy reference research may include Minecraft Java/Bedrock mods and non-Minecraft RPGs. External assets may only be imported when licensing/provenance allows it.

## 10. Dungeon / raid / side-content direction

The RPG should not depend on one repeated combat room.

Planned content families:

- field bosses,
- elite variants,
- multi-room dungeons,
- dungeon modifiers,
- minibosses,
- raids,
- world events,
- bounty board / contracts,
- relics/artifacts,
- runes,
- accessories,
- weapon mastery,
- set effects,
- rare ore veins,
- hidden rooms,
- boss-exclusive crafting,
- risk/reward dungeon choices,
- endgame repeatable progression.

Systems should cross-feed one another rather than becoming isolated menus.

## 11. UI/UX

UI quality is not secondary to combat quality.

Target standard is modern Bedrock presentation, not legacy gray-button form chains.

Important principles:

- clear visual hierarchy,
- large readable cards/slots,
- strong selected/disabled states,
- mobile-first readability,
- comparison information at the decision point,
- fewer menu-to-menu hops,
- use world interactions where appropriate.

Examples:

- blacksmith -> forge/enhancement UI,
- guild/bounty board -> quests,
- class trainer -> job/skills,
- dungeon altar/gate -> dungeon setup,
- compendium item/NPC -> bestiary.

## 12. External 3D model integration policy

The failed War Scythe experiment established a hard rule: **an external model is not accepted merely because the JSON loads.**

Preferred source package:

1. original `.bbmodel` if licensed,
2. otherwise complete `geo.json + texture + attachable + animation` set,
3. texture-only / incomplete geometry packs are not acceptable final equipment sources.

Each imported held model must pass:

1. license/provenance audit,
2. item registration,
3. inventory icon,
4. attachable item mapping,
5. geometry format compatible with binding,
6. neutral bound root using `q.item_slot_to_bone_name(context.item_slot)`,
7. separate presentation/action bones,
8. first-person pose,
9. third-person pose,
10. swing/action animation,
11. enchant/glint behavior if applicable,
12. real runtime test in current stable Bedrock.

Static JSON validation is not sufficient.

### War Scythe status

The current external War Scythe is **REJECTED as a final asset**.

Runtime test showed:

- initial build: missing inventory icon and held render,
- fix build: held geometry appeared incorrectly and did not read as a scythe,
- source model quality was too low for the remake target.

It must be removed from the normal reward pool. Do not propagate this asset into additional weapons.

## 13. Licensing

- Marketplace / All Rights Reserved content: reference only.
- MIT / Apache-2.0: reuse candidate with required notices.
- LGPL/GPL/mixed provenance: inspect exact file scope before reuse.
- Code license does not automatically grant rights to separately sourced models, textures, sounds, or animations.
- Every imported asset must have source, license, file scope, and modifications recorded.

## 14. Immediate implementation order

Current order after v0.23.1 runtime feedback:

1. Remove rejected War Scythe from normal loot.
2. Add structural progression gates so early play cannot receive late gear.
3. Replace linear +10 enhancement with gated +20 large-growth enhancement.
4. Add large-number formatting infrastructure.
5. Establish a repeatable external 3D-item import/validation pipeline.
6. Integrate 2-3 genuinely high-quality external weapon models and runtime-test them before mass expansion.
7. Expand ores/materials with distinct crafting roles.
8. Expand dungeons/field content.
9. Upgrade bosses with new models/animations/arenas.
10. Continue UI/UX remake.

## 15. Quality rejection rules

Reject or defer a feature if any of the following is true:

- placeholder-quality visuals,
- copied asset with unclear license,
- high rarity available in early progression,
- weapon family differs only by damage,
- boss differs only by HP,
- new ore differs only by color/stat tier,
- mobile UI becomes harder to read,
- external 3D model has not passed real first/third-person runtime test,
- quantity increases while presentation/identity decreases.

This file is the current remake design canon. Later implementation notes may refine numeric values, but the progression, quality, licensing, and runtime-validation principles above are binding unless deliberately revised.
