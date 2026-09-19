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
| Slayers-Beasts | InvictusSlayer / MIT | Mantis, Tyrachnid, Irk, medium Ent, Ant Soldier and Ant Queen model/animation sources + original textures; Mantis OGG audio | post-dragon predators/elites + pre-dragon companion/guardian/mount/miniboss content | both | High (Java model/animation -> Bedrock) | MANTIS + TYRACHNID + IRK + ENT + ANT SOLDIER + ANT QUEEN ACTIVE |
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


## Bosses of Mass Destruction — Obsidilith — 0.7.0

Status: active vendored Mythic boss.
License: LGPL-3.0.
Pinned upstream: `2fbd0dc79bea498bcad755c4ad9969055dc452c7`.

Direct external visuals/audio:
- original 6-bone / 8-cube Obsidilith geometry;
- original `placeholder`, `death`, `summon` animation set;
- original Obsidilith texture;
- original Obsidilith Rune cube-all concept + texture;
- original wave-indicator, split and soul-flame particle art frames;
- original prepare/burst/spike/wave indicator sound files.

Lucky role:
- Mythic post-dragon boss only;
- 9000 HP;
- rune shield milestones at 75%, 50%, 25%;
- four destructible rune blocks per shield milestone;
- 12% incoming damage while shielded;
- 135% incoming damage during the 4-second exposed window;
- three telegraphed attack families derived from upstream Burst/Spike/Wave roles;
- kill reward: 1–2 Legendary Lucky Blocks, 4–7 Mythic Fragments, 28% Mythic Lucky Block.


## Slasher Sword Addon — 0.8.0

Status: active vendored Legendary held weapon.
License: CC0-1.0.
Pinned upstream: `24887c71758cf11bba1f419ecdd70b651d2d7d94`.

Why this source is important:
- it is already a native Bedrock add-on rather than a Java model being approximated as an item;
- it provides its own inventory icons, 3D first/third-person geometry, attachable, animation controllers, combat animations, projectile-beam entities, particles, sounds and Script API combat state machine;
- therefore no new temporary weapon art is needed.

Lucky role:
- post-dragon Legendary weapon;
- 32 base item damage;
- 2200 durability;
- fast chained attack and beam;
- charge/release attack with dash support;
- sneak lock-on chainsaw behavior;
- airborne plunge attack;
- original beam visuals and original combat audio;
- repair resource: `lb:slasher_blade`, sourced from Bogre/Obsidilith kills.

Porting boundary:
- visual/animation/audio design remains upstream;
- namespace is remapped to `lb:`;
- API compatibility and Lucky balance are project-side modifications.


## Tomemancy — Mythic Archmage set — 0.9.0

Status: active vendored Mythic content package.  
License: MIT.  
Pinned upstream: `b5a76921e98c06aae9942c705af605e2abcac44c`.

This batch is intentionally bound to the canon rule that a Mythic outcome should be a **content package**, not one oversized stat stick. One reward roll grants a coordinated four-piece spell set:

- **Tomemancer Diamond Staff** — original Tomemancy staff art; 38 melee damage; 2400 durability; can be carried in the offhand as a 1.20x spell focus.
- **Meteor Tome** — original Advanced Meteor role plus original Meteor model/texture and flame-summoning particle art; falling targeted meteor; 12 s cooldown; 460 outer / 650 inner base damage.
- **Gigavolt Tome** — original Advanced Gigavolt role rebuilt as aimed chain lightning; 8 s cooldown; 420 -> 300 -> 220 -> 160 base chain damage across unique targets.
- **Dragon Fireball Tome** — preserves Tomemancy's original use of Minecraft's Dragon Fireball; 9 s cooldown; 360 direct plus 250 nearby Lucky impact damage.

All four pieces remain a post-Ender-Dragon Mythic reward. The original Tomemancy level/knowledge-scoreboard gate is replaced by this project's persistent dragon progression contract. The source's 1.16.x data-driven item events are ported to `@minecraft/server 2.9.0`; external visual assets remain the source artwork.


## Mythic world events — 0.10.0

This milestone deliberately extends P7 away from single-drop stat inflation. It adds two post-Ender-Dragon world-event outcomes while reusing already-cleared external production assets rather than adding temporary art.

### Rift Siege
- Wave 1: three Inhabitants Impalers + two Slayers-Beasts Mantis.
- Wave 2: two Impalers + two Ender Warped Clams + two Mantis.
- Wave 3: two Impalers + two Warped Clams + two Mantis + one Tyrachnid elite.
- Objective: four original Obsidilith Rune blocks placed around the event center must be destroyed.
- Final wave: one late-game Bogre + two Impalers.
- Completion: one Legendary Lucky Block, 6–9 Mythic Fragments and one Slasher Blade.
- Presentation uses the already-vendored BOMD rune/particle/audio family and Inhabitants models/animations/sounds.

### Lucky Rain
- Twenty timed aerial drop pulses.
- Each pulse drops 2–3 stacks from a weighted non-vanilla-heavy pool: Epic/Legendary/Mythic fragments, selected licensed external utility rewards, Epic/Rare Lucky Blocks and Slasher Blades.
- Every fifth pulse introduces an Impaler; pulses 10 and 20 additionally introduce a Warped Clam.
- Final rewards do not appear until event-tagged enemies are cleared.
- Event state is stored at world level so a normal script reload does not simply forget an active event.


## Slayers-Beasts Mantis — 0.11.0

Status: active vendored post-dragon normal enemy. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

The source's Mantis identity is a fast approach/scuttle, leap, melee strike and poison predator. The Bedrock port keeps that role while scaling to the Lucky late game: 320 HP, 24 melee, 32-block tracking, long-range lunge cadence, 50% poison on successful hits, vegetation-biased post-dragon spawning with a three-nearby cap, and source-derived WALK/SCUTTLE/STRIKE/FLAP animation keyframes. The original texture and audio are vendored unchanged; no vanilla recolor or temporary model is used.


## Slayers-Beasts Tyrachnid — 0.12.0

Status: active vendored post-dragon **elite**, not a boss. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct external visual payload:
- original Tyrachnid texture;
- 43 source model parts / 90 cubes converted from `TyrachnidModel.java`;
- 40 animation channels / 200 keyframes converted from the original WALK animation.

Lucky role:
- 900 HP / 34 melee / 0.30 movement / 55% knockback resistance;
- rare cave-only post-dragon ecology spawn, maximum one within 96 blocks;
- also a post-dragon Legendary Lucky Block encounter;
- source-faithful large, fast, high-knockback melee identity;
- **Lucky-owned Silk Snare**: 1-second five-point telegraph, then 42 damage + Slowness III for players who remain within 4.5 blocks;
- stage-3 Rift Siege elite reinforcement.

The upstream `performRangedAttack` method is empty. Therefore Silk Snare is documented as a Lucky mechanic, not misattributed to Slayers-Beasts. Its telegraph reuses already-cleared BOMD particle assets instead of introducing temporary art.


## Rift Vault structure/dungeon — 0.13.0

Status: active post-dragon Mythic content package.

This closes the roadmap's first true structure/dungeon gap without introducing temporary art. The structure itself is a finished 17×17 encounter arena built from deepslate tiles, polished blackstone bricks, obsidian, crying obsidian and gilded blackstone, while its unique objective uses the already-vendored BOMD Obsidilith Rune block and particle/audio family.

Flow:
- the event searches a bounded set of nearby flat, clear sites instead of blindly overwriting the Lucky Block location;
- four entrances, corner towers, crying-obsidian ribs, a central boss dais and four rune pedestals create the permanent structure silhouette;
- guard wave: 3 Impalers + 2 Mantis;
- deep wave: 1 Tyrachnid + 2 Warped Clams + 2 Mantis;
- only after both combat waves are cleared do four Obsidilith Runes materialize;
- breaking all four runes opens the core and releases Obsidilith + 2 Impalers;
- completion drops 2 Legendary Lucky Blocks, 8–12 Mythic Fragments and 2 Slasher Blades;
- the cleared vault remains in the world as a trophy/late-game landmark rather than disappearing as a temporary greybox.

The event uses the same persisted Mythic event state system and pauses while unattended.


## Pre-dragon wilderness batch — 0.15.0

### Irk Companion
- Slayers-Beasts MIT source; original model, WALK animation and texture.
- Rare Lucky Block pet outcome.
- 48 HP / 8 attack / 0.30 movement.
- Uses native Bedrock tameable ownership, sit, follow-owner, teleport-to-owner and owner-defense behaviors.
- The reward dispatcher attempts to tame the spawned Irk directly to the Lucky Block opener; manual spawn remains tameable with glow berries.

### Awakened Grove + Ent Guardian
- Epic Lucky Block persistent structure/event outcome.
- Finished 13×13 moss/mossy-cobblestone/rooted-dirt shrine with four oak-log/leaf corner trees, glowstone waypoints and a central pedestal. The cleared shrine remains as an exploration landmark.
- Stage 1: two Inhabitants Impalers.
- Stage 2: one Slayers-Beasts medium Ent guardian using its original oak texture/model/WALK animation.
- The source Ent only acquires combat through retaliation; the Lucky guardian preserves that identity instead of becoming an always-hostile reskin.
- Lucky balance: 160 HP / 14 melee / 65% knockback resistance.
- Completion: 4–6 Epic Fragments + one Rare Lucky Block + 25% Easel reward.
- If no safe structure site exists, the generic event fallback gives 3–4 Epic Fragments instead of silently consuming the Lucky Block.


## Slayers-Beasts War Ant Mount — 0.16.0

Status: active Epic pre-dragon mount reward. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct source payload:
- Ant Soldier model converted to Bedrock geometry with the original renderer's 1.5× visual scale baked in;
- original WALK and AMBIENT antenna animation data;
- original wood-soldier texture.

Lucky role:
- `lb:war_ant_mount`;
- 90 HP / 12 melee / 0.38 movement / 60% knockback resistance;
- Epic Lucky Block 9% outcome;
- spawned reward is tamed to the opener and its data-driven tame group is explicitly activated;
- one-player seat with `minecraft:input_ground_controlled` and `minecraft:behavior.player_ride_tamed`;
- follows/teleports to its owner while unmounted and defends its owner;
- sugar can tame a manually spawned specimen; sugar/honey bottle heal it.

This fills the first real mount-reward family without introducing a vanilla horse recolor or temporary model.


## Ranged combat batch — 0.17.0

### Tomemancy Amethyst Repeater
- MIT Tomemancy source at `b5a76921e98c06aae9942c705af605e2abcac44c`; original Amethyst Staff icon and amethyst-orb icon.
- Epic pre-dragon ranged weapon kit: one `lb:amethyst_repeater` + 48 `lb:amethyst_charge`.
- Three-shot burst, 4 ticks between shots, 12 damage per hit, 32-block maximum block-aware raycast range, 24-tick trigger cooldown.
- Uses stable Script API entity/block raycasts rather than introducing an experimental custom projectile.
- Each shot consumes one charge outside Creative. Charges are renewable: one amethyst shard + one glowstone dust -> eight charges.
- 720 weapon durability; repairs from amethyst shards or Epic Fragments.
- Reuses already-cleared Obsidilith indicator/burst particles as shot trail/impact presentation; no temporary beam art.

### Slayers-Beasts Wither Spider
- MIT source at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Original 33-bone / 70-cube converted model, 8-channel / 40-keyframe WALK animation and original texture; the source renderer's 1.2× scale is baked into Bedrock geometry.
- Source contact identity retained: melee attacks apply Wither.
- Lucky balance: 96 HP / 10 melee / 0.26 movement / 25% knockback resistance.
- Pre-dragon Nether ecology spawn, maximum two within 64 blocks, plus an Epic Lucky Block encounter.
- Lucky-owned ranged/control role: 0.8-second five-point ground telegraph, then 14 damage + 5 seconds Wither I in a 3.2-block impact circle, approximately every 5–8 seconds while the player stays at mid-range.
- The ranged volley is explicitly not source-original.


## Tomemancy Mystical Aegis armor — 0.18.0

Status: active Epic pre-dragon armor-set reward. License: MIT. Pinned upstream: `b5a76921e98c06aae9942c705af605e2abcac44c`.

Direct source payload:
- all four original Mystical Armor inventory icons;
- original `textures/models/armor/magic.png` wearable texture;
- original helmet/chestplate/leggings/boots attachable contracts using the vanilla humanoid armor geometries;
- original source protection profile 1 / 4 / 3 / 2.

Lucky role:
- one Epic Lucky Block bundle grants all four pieces together rather than four filler rolls;
- source protection values are preserved, keeping raw armor below diamond/Netherite instead of creating another stat-stick set;
- durability is scaled to 360 / 520 / 480 / 420 for persistent progression and each piece can be repaired with amethyst shards or Epic Fragments;
- full-set **Aegis Ward**: after six seconds without taking damage, the set recharges Absorption II for eight seconds; the ward can recharge once per ten-second cycle;
- ward presentation reuses already-cleared amethyst sound and Obsidilith indicator particle rather than introducing temporary FX.

The Aegis Ward is a Lucky-owned gameplay adaptation inspired by the source Aegis spell. It is not attributed to upstream armor behavior.


## Slayers-Beasts Wudu Binder — 0.21.0

Status: active post-dragon control/support enemy. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct source payload:
- original Wudu body/arm/finger geometry converted to Bedrock;
- original CRAWL animation converted from Java keyframes;
- original oak Wudu texture.

Source fidelity boundary:
- upstream attributes are 50 HP, 1 attack and 0.12 movement;
- upstream defines a `WuduGrabGoal`, but that goal's `canUse()` is hardcoded false;
- therefore no working source-original grab behavior is claimed.

Lucky late-game role:
- 520 HP / 20 melee / 0.18 movement / 78% knockback resistance;
- post-dragon low-density wooded Overworld spawn, cap 1 within 96 blocks;
- Legendary Lucky Block post-dragon encounter at 8 weight;
- **Binding Grasp**: five-point 0.9-second telegraph, then 18 damage + Slowness II + pull if the player remains within the marked 3.25-block zone;
- **Bark Ward**: every two seconds nearby Impaler/Mantis/Tyrachnid allies receive short Resistance I, making the Wudu a priority support target rather than another HP sponge;
- modest Epic/Legendary/Mythic fragment kill rolls.

The grasp and support aura are Lucky-owned mechanics and are intentionally documented as such.


## Slayers-Beasts Royal Anthill / Ant Queen — 0.22.0

Status: active Epic pre-dragon exploration/miniboss package. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct source payload:
- original `AntQueenModel.java` silhouette converted into Bedrock geometry;
- original 3-second six-leg WALK animation converted from `AntQueenAnimation.java`;
- original `wood_queen.png` texture retained unchanged;
- upstream renderer's 1.5x display scale baked into the converted geometry;
- already-vendored Ant Soldier visual/animation family reused for encounter guards.

Source fidelity boundary:
- upstream Ant Queen is neutral and uses persistent anger;
- upstream attributes are 25 HP / 2 attack / 0.22 movement / 70% knockback resistance;
- upstream entity loot is empty and no special summon/telegraph boss mechanic is implemented.

Lucky package:
- permanent 19x19 Royal Anthill arena/warren;
- entrance guard objective followed by three spatial brood-seal activations;
- 260 HP Ant Queen miniboss with a 0.8-second five-point Mandible Crush telegraph and two reinforcement thresholds;
- completion grants 4-6 Epic Fragments and a War Ant that attempts to bond to the nearest participating player;
- structure remains as a world landmark after completion.

Mandible Crush, staged brood seals, reinforcement phases and the completion reward are Lucky-owned mechanics, not source-original features.


## Loy's Goodies Auto-Turret + Fortune Bulwark — 0.23.0

Status: active Rare deployable reward + Epic pre-dragon defense-event family. License: CC0-1.0. Pinned upstream: `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

Direct source payload:
- `models/java-model/tools & weapons/220420_turret.bbmodel`;
- all 16 original model cubes converted to Bedrock geometry;
- the model's embedded 64x64 PNG extracted unchanged; no generated or temporary icon/texture substitutes it.

Auto-Turret reward:
- Rare pool weight 6;
- place the real turret model as `lb:reward_turret`, then interact to deploy `lb:lucky_turret`;
- 72 HP stationary support unit;
- 96 finite shots;
- 20-block acquisition radius;
- block-aware line-of-sight check via stable `Dimension.getBlockFromRay`;
- rotates to the selected target using stable `TeleportOptions.facingLocation`;
- 9 damage every 15 ticks while a valid hostile remains visible;
- projectile-like spark tracer reuses already-vendored production FX;
- damage is attributed to the turret entity so normal hurt-by-target retaliation can treat it as an attacker.

Fortune Bulwark:
- Epic pool weight 6;
- permanent 15x15 polished-tuff/copper training arena;
- two event-only turrets start with 128 shots each;
- wave 1: 4 Ant Soldier guards;
- wave 2: 2 Impalers + 2 Ant Soldier guards;
- wave 3: 4 Impalers + 2 Ant Soldier guards;
- if both trial turrets are destroyed, the event fails with a defined Epic-fragment recovery reward;
- completion removes the trial units and grants 1 deployable Auto-Turret + 3-5 Epic Fragments + 35% chance of one Rare Lucky Block.

The upstream model provides visual art only. Targeting, ammunition, damage, line-of-sight logic, deployment and Fortune Bulwark are Lucky-owned gameplay.


## Loy's Goodies Storm Longbow — 0.24.0

Status: active Epic pre-dragon precision-ranged reward. License: CC0-1.0. Pinned upstream: `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

Direct source payload:
- `230419_bow_1_0.bbmodel`: 16 cubes;
- `230419_bow_1_1.bbmodel`: 19 cubes;
- `230419_bow_1_2.bbmodel`: 19 cubes;
- `230419_bow_1_3.bbmodel`: 19 cubes;
- all four files share the same embedded 32x32 `bow_1.png`, imported unchanged.

Bedrock visual binding:
- one attachable contains four source-faithful stage bones;
- `query.item_in_use_duration` switches stage 0 -> 1 -> 2 -> 3 while the use button is held;
- item-use events are used only for gameplay timing; draw-state art is not replaced by generated animation art.

Lucky combat role:
- Epic bundle includes one Storm Longbow + 32 vanilla arrows;
- minimum 5-tick draw;
- 5-11 ticks: 8 damage / 24-block range;
- 12-21 ticks: 14 damage / 36-block range;
- 22-29 ticks: 20 damage / 48-block range / pierces one additional target;
- 30+ ticks: 26 damage / 56-block range / pierces two additional targets;
- one arrow and one durability are consumed per successful release outside Creative;
- block-aware raycast caps the entity ray at terrain, preventing ordinary wall penetration;
- 640 durability, repairable with string or Epic Fragments.

This is intentionally separated from the Amethyst Repeater: Repeater is fast three-shot pressure with dedicated charges; Storm Longbow is slow timing/precision with vanilla-arrow economy and reward for deep draw.


## Slayers-Beasts Sky Damselfly Mount — 0.25.0

Status: active post-Ender-Dragon Legendary mobility reward. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct source payload:
- `DamselflyModel.java`: 10 total cubes across body + four wings;
- `DamselflyAnimation.java`: FLY and PERCH states, with four animated wing bones;
- `DamselflyRenderer.java`: blue/green/yellow texture mapping and source 0.8x render scale reference;
- original `textures/entity/damselfly/blue.png`, vendored unchanged;
- `Damselfly.java`: source behavior/attribute reference.

Source fidelity boundary:
- source Damselfly has 8 HP, 0.25 movement and 0.4 flying speed;
- source identity is free flight, hover/wander and periodic perching;
- source explicitly ignores fall damage;
- source has no rider/tame/stamina gameplay.

Lucky role:
- source geometry is enlarged to mount scale without redesigning the silhouette;
- 84 HP / 0.46 movement;
- one-player tamed seat;
- Legendary weight 6 and `requiresPostDragon=true`;
- reward spawn is tamed to the Lucky Block opener;
- rider movement uses the stable Bedrock air-input component for camera-directed 3D control;
- 30 seconds of flight energy, then forced transition to non-air-controlled ground/exhausted movement;
- energy recharges only while dismounted, taking about 15 seconds from empty to full;
- source fall immunity is preserved so stamina exhaustion means forced landing rather than arbitrary fall-death.

This deliberately replaces the duplicate Legendary Chainsaw reward slice at equal weight. It expands the mount family from one ground combat mount to a separate post-dragon aerial exploration/mobility archetype.


## Loy's Goodies Explorer Field Kit — 0.26.0

Status: active Epic pre-dragon utility/support wearable package. License: CC0-1.0. Pinned upstream: `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

Direct source payload:
- `armor & costumes/hats/230726_explorer_hat.bbmodel`: 7 cubes, embedded 32x32 texture;
- `armor & costumes/packs/230516_backpack.bbmodel`: 10 cube elements, consisting of 7 physical forward cuboids plus 3 inverted duplicate/backface elements, embedded 32x32 texture;
- both embedded textures are vendored unchanged.

Bedrock visual binding:
- Explorer Hat is converted to a custom head attachable using the documented item-slot-to-bone binding pattern;
- Field Pack is converted to a body-bound chest attachable using the documented custom-chestplate body binding pattern;
- no temporary icon/model/texture is created. The external source texture is also the item-atlas texture;
- the three Java-block inverted backpack backfaces are documented as a format boundary instead of being falsely reported as physical missing cubes.

Lucky role:
- Epic bundle: Explorer Hat + Explorer Field Pack + vanilla compass;
- protection profile 1 + 3, deliberately weak compared with top vanilla armor;
- durability 320 + 480, repairable by leather or Epic Fragments;
- full two-piece set grants refreshed Night Vision and Speed I;
- multiplayer Expedition Link: full-kit wearers within 12 blocks in the same dimension each receive Haste I;
- link evaluation is per player and per current equipment state; self is excluded and no global/shared cooldown owns player state.

Integration architecture:
- source assets remain vendored under the existing `lb` namespace;
- runtime lives in its own `loys_explorer_kit.js` module;
- the final pack remains one BP + one RP with mutual dependencies and no external add-on dependency;
- this follows the project's established multi-add-on merge pattern: isolate provenance and logic by source while merging licensed content into a single distributable namespace.


## Fortune Gallery — 0.27.0

Status: active Epic pre-dragon cooperative projectile minigame.

External production assets reused:
- twelve targets use the existing Loy's Goodies CC0 `230217_vase.bbmodel` port as `lb:reward_vase`;
- the precision-completion reward can grant the existing Loy's Goodies CC0 Storm Longbow;
- existing imported Obsidilith/Slasher production FX and stable vanilla sounds provide hit/finish feedback;
- no new temporary target art or project-drawn target model is introduced.

Arena/gameplay:
- permanent 19x21 final-material shooting gallery;
- 12 Vase targets in three rows of increasing distance/elevation;
- bounded south firing line starts a 45-second attempt;
- every starting participant receives 24 trial snowballs; later entrants receive 16 once;
- stable `ProjectileHitBlockAfterEvent` data supplies the projectile, optional source player, hit dimension and block hit information;
- only snowball hits on an unhit target score;
- a shared 12-bit target mask prevents duplicate scoring while `scoreByPlayer` keeps participant contribution separate;
- unhit Vase targets are restored if manually broken or otherwise removed;
- timeout restores all targets and permits immediate retry while the persistent event remains active;
- completion: 4-5 Epic Fragments + one Rare Lucky Block;
- precision: <=3 misses adds 32 arrows;
- Sharpshooter: <=25 seconds and <=1 miss adds one Storm Longbow.

Multiplayer boundary:
- target progress is intentionally shared because the arena is cooperative;
- contribution counts are player-keyed;
- start/join ammunition is granted per player;
- state is stored in the existing persisted event record rather than process-global player variables;
- simultaneous hits cannot award the same Vase twice because the bit is set before state is persisted after each accepted hit.

This expands the minigame category without cloning Fortune Relay's route/checkpoint mechanic and without creating a new visual design internally.


## Slayers-Beasts Tortoiseshell Butterfly / Butterfly Sanctuary — 0.28.0

Status: active Epic pre-dragon ecological exploration package. License: MIT. Pinned upstream: `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct source payload:
- `Butterfly.java`: 6 HP, 0.25 ground movement, 0.2 flying speed, free-flight/hover/perch lifecycle and no fall damage;
- `ButterflyModel.java`: 7 total cubes across body, four wings and two antennae;
- `ButterflyAnimation.java`: source IDLE_CLOSED and FLYING animation channels;
- `ButterflyRenderer.java`: exact tortoiseshell texture mapping and 0.8× render scale;
- `textures/entity/butterfly/tortoiseshell.png`: original 32×32 texture retained unchanged.

Bedrock conversion:
- 7 source cubes -> 7 target cubes;
- source renderer's 0.8× scale baked into geometry rather than silently changing silhouette;
- IDLE_CLOSED preserves six child-bone channels;
- FLYING preserves body bob/rotation plus six wing/antenna channels;
- original texture Git blob `ff5317e9a5ab611360777fd666c76921e0ef85ae` is the target texture blob.

Lucky event role:
- permanent 17x17 sanctuary made from final vanilla materials;
- eight source-faithful butterflies begin the survey;
- event runtime keeps at least six active and applies a 13-block soft boundary so random flight cannot make the objective impossible;
- four order-free observation stations;
- a station requires a player to remain for 2 seconds while a butterfly is within 5.5 blocks;
- shared station mask makes the survey cooperative without assigning a single event owner;
- completion leaves four butterflies living in the sanctuary and awards 4-6 Epic Fragments + Camera, with Rare Lucky Block / Explorer Field Kit bonus rolls.

Source fidelity boundary:
- the source has no Lucky sanctuary, survey stations, multiplayer scoring, tethering or rewards;
- those are project-owned event mechanics;
- the Butterfly's appearance, animation identity and base ecological behavior are external source material.

Rejected adjacent candidate:
- Slayers-Beasts Sporetrap was reviewed but not integrated because its pinned renderer references `textures/entity/sporetrap.png` while that file is absent from the pinned tree. A differently named `venus_flytrap.png` exists, but the project will not infer that it is the intended production texture without explicit source linkage.


## Inhabitants Arsenal — Javelin + Spike Drill + Rift Arsenal — 0.29.0

Status: active Rare/Epic gear package plus post-dragon Mythic chained event. License: MIT. Pinned upstream: `2da25600eb052862d34818b4a2a458afea83e868`.

### Javelin direct source payload
- `JavelinItem.java` and `JavelinEntity.java`;
- source held geometry: 5 cubes;
- source thrown geometry: 5 cubes;
- source `bounce` and `in_air` animations;
- exact original item and thrown-entity PNGs;
- exact original aiming, bounce, two launch, block-hit and entity-hit OGG files.

Source behavior contract:
- stack size 16;
- minimum throw charge 10 ticks;
- full charge at 60 ticks;
- source Java launch speed formula: 0.75 + charge * 4.5;
- block sticking;
- crouch-to-recover;
- stuck Javelin acts as a bounce launcher.

Bedrock/Lucky adaptation:
- no Custom Projectiles experimental toggle;
- normal entity + stable `Entity.applyImpulse`, `clearVelocity`, block ray and entity ray;
- Bedrock impulse scale is deliberately adapted to the different engine trajectory;
- Lucky pre-dragon hit profile is 8-18 damage with charge-dependent knockback;
- owner stored per thrown entity, PvP obeys world gamerule and player state is keyed by player ID;
- support-block deletion returns the Javelin item rather than orphaning an invisible projectile.

### Spike Drill direct source payload
- `SpikeDrillItem.java` and `DrillDamagePacketC2S.java`;
- exact source base item PNG;
- exact original start, loop, stop and three dig OGG files.

Source behavior contract retained:
- durability 2342;
- heat cap 120;
- 300-tick full momentum ramp;
- overheat lockout 40 ticks and 2 damage;
- passive cooling after an initial delay;
- snowball cooling by 30.

Bedrock/Lucky adaptation:
- continuous held-use mining with a 5.25-block stable raycast;
- momentum maps to a break cadence improving from ~14 to ~3 ticks;
- one heat + one durability per successful break;
- block-form salvage uses stable `Block.getItemStack`;
- destructive safety deny-list protects containers, Lucky content, unbreakables and progression-critical blocks;
- source Java temperature sprite/model overrides are not falsely claimed as rendered; exact base art + production sound + actionbar heat/momentum is used until a stable production item-state visual binding is selected.

### Rift Arsenal
- fourth Mythic event family;
- permanent 17x17 final-material arsenal;
- each participant receives six Javelins once;
- three seals require real stuck Javelin entities, not button presses or simulated score;
- cooperative shared target mask prevents double credit;
- wave composition intentionally tests existing enemy role interaction;
- stage 2: Wudu Binder + 2 Mantis + Tyrachnid;
- final: Bogre + Wudu Binder + 2 Tyrachnids;
- completion package: Spike Drill + 12 Javelins + 7-10 Mythic Fragments + Legendary Lucky Block.

This batch follows the established vendored merge architecture: one BP + one RP, `lb:` namespace, source-specific integration module, exact provenance, no outside runtime pack dependency, and no placeholder art.


## Loy's accessory/status suite — 0.30.0

Source: `SL0ANE/Loy-s-Goodies`, CC0-1.0, pinned commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

### Wizard Hat
- upstream `models/java-model/armor & costumes/hats/230418_wizard_hat.bbmodel`;
- 10 source elements, one embedded 64x64 production texture;
- source head display scale 2.0x; converted to `geometry.lb.wizard_hat` head attachable;
- Lucky role: post-dragon Legendary Arcane Focus, +15% Tomemancy damage multiplier and 15% cooldown reduction.

### Threat Sunglasses
- upstream `models/java-model/armor & costumes/glasses/230516_sunglasses.bbmodel`;
- 3 source elements, one embedded production texture, source head scale 1.625x;
- Lucky role: Rare Threat Lens, persistent Night Vision, Blindness/Darkness removal and per-wearer 24-block `monster` family count/nearest-distance scan.

### Fortune Tonic
- upstream `models/java-model/foods & drinks/230923_pop_can_blue.bbmodel`;
- source model has 2 elements but uses one embedded texture for all faces, so the original production texture is complete as a flat portable icon;
- Rare reward gives two cans; drink completion applies Absorption I 60 s, Resistance I 8 s and Regeneration I 4 s.
- Zongzi was investigated and rejected because its source five-element model references two distinct textures. No one-texture shortcut or generated composite entered the pack.

## BOMD Gauntlet boss family — 0.30.0

Source: `barribob/bosses-of-mass-destruction`, LGPL-3.0, pinned commit `2fbd0dc79bea498bcad755c4ad9969055dc452c7`.

Direct production payload:
- `geo/gauntlet.geo.json`: 26 bones / 42 cubes;
- `animations/gauntlet.animation.json`: 10 source animations;
- exact `textures/entity/gauntlet.png`;
- exact `textures/block/gauntlet_blackstone.png`;
- exact source OGG: cast, idle, hurt, death, laser charge, spin punch and energy shield.

Source behavior references:
- `GauntletEntity.kt`;
- `GauntletAttacks.kt`;
- `LaserAction.kt`;
- `PunchAction.kt`;
- `GauntletConfig.kt`.

Bedrock/Lucky adaptation:
- post-dragon Mythic boss, 6000 HP;
- punch: 16-tick telegraph/acceleration, dodge miss opens a 42-tick 1.5x vulnerability;
- laser: source-style charge plus six pulses with an 8-tick target-history lag, so lateral movement is the counterplay;
- swirl punch: three separated radius pulses rather than unavoidable contact DPS;
- cast: Blindness pressure; Threat Sunglasses explicitly counter the visual-control effect;
- source poison/wither immunity retained through stable effect clearing;
- at 65% and 30% HP, boss enters an 0.18x incoming-damage shield and creates three Gauntlet Blackstone anchors;
- destroying all three source-textured anchors removes the shield and opens a 55-tick 1.5x vulnerability;
- Gauntlet death produces a content reward package rather than only XP/stat inflation.

The external model/animation data are not simplified copies: geometry is data-identical after identifier remapping and animation tracks are data-identical after namespace key remapping.


## BOMD Void Blossom / Void Garden — 0.31.0

Source: `barribob/bosses-of-mass-destruction`, LGPL-3.0, pinned commit `2fbd0dc79bea498bcad755c4ad9969055dc452c7`.

Direct production payload:
- `geo/void_blossom.geo.json`: 67 bones / 91 cubes;
- `animations/void_blossom.animation.json`: 8 source animations: idle, spike, leaf_blade, blossom, spike_wave, spore, death, spawn;
- exact `textures/entity/void_blossom.png`;
- exact OGG: void_blossom_burrow, void_blossom_spike, spore_prepare, spore_impact, petal_blade.

Source behavior references:
- stationary boss; default 350 HP / 4 armor / 12 attack;
- direct spike burst, expanding spike wave, spore projectile role, line-style petal blades and milestone blossom placement;
- HP milestones at 75% / 50% / 25%.

Lucky Bedrock adaptation:
- 420 HP pre-dragon Epic miniboss, not a post-dragon stat wall;
- spike burst: three target-area telegraphs followed by avoidable hits;
- spike wave: three outward annular telegraphs;
- spore: delayed 3.5-block poison/slow cloud;
- petal blade: three telegraphed lines through target space;
- 75/50/25% phases place four Flowering Azalea life roots; while present, boss receives 0.65x incoming damage and heals 2 HP/s;
- clearing roots creates a 50-tick 1.35x vulnerability window;
- persistent Void Garden uses only final vanilla arena materials plus the real boss asset.

Geometry is data-identical after identifier remapping; animation data is identical after namespace key remapping. Texture and five imported sounds are byte-identical source blobs.

## Loy's Goodies Archive Codex / Fortune Archive — 0.31.0

Source: `SL0ANE/Loy-s-Goodies`, CC0-1.0, pinned commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

Direct production payload:
- `models/java-model/furniture & decoration/books/220407_book_0.bbmodel`;
- 7 elements, one embedded 64x64 production texture;
- source element positions/rotations and per-face UVs convert 1:1 into `geometry.lb.archive_codex`.

Lucky event role:
- permanent 17x17 final-material archive;
- four identical codices on four differently materialed pedestals;
- randomized four-position sequence is replayed with production particles/audio, then players interact with the books in that spatial order;
- progress is shared across players, so one player can observe and another can continue the sequence;
- wrong input restarts the reveal; missing books are restored every event tick;
- stable `world.afterEvents.playerInteractWithBlock` provides the interaction surface.


## Loy's Goodies Fortune Bomb / Fortune Minefield — 0.32.0

Source: `SL0ANE/Loy-s-Goodies`, CC0-1.0, pinned commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`.

Direct production payload:
- `models/java-model/tools & weapons/firearms/230426_bomb.bbmodel`;
- 8 source elements;
- one embedded 32x32 texture used by all source faces;
- 8 source elements -> 8 Bedrock cubes with source rotations and per-face UVs preserved.

Lucky event role:
- permanent 15x15 Rare Minefield arena built only from final vanilla materials plus 12 real Bomb blocks;
- four waves arm three bombs at a time;
- active bombs display existing licensed production particles/audio and allow a 30-tick disarm-or-dodge window;
- inactive missing bombs are restored to prevent pre-clearing/softlock;
- detonation is scripted 16 inner / 10 outer damage + knockback, deliberately without terrain destruction;
- 35-tick spacing applies after both detonation and a fully disarmed wave.

## Slayers-Beasts Rift Spitter Ant — 0.32.0

Source: `InvictusSlayer/Slayers-Beasts`, MIT, pinned commit `ffc1f6480a60598797c63150c0d0fe66b65697ff`.

Direct production payload:
- Ant Soldier model and WALK/AMBIENT source animation references;
- renderer 1.5x source scale already baked into the previously verified War Ant geometry conversion;
- exact `leafcutter_soldier.png` texture blob `9540eaa95c30468b4cf8e932f95879350b7a8c7c`.

Source/Lucky boundary:
- upstream Ant Soldier: neutral melee, 15 HP, 5 attack, 0.22 movement, 0.5 knockback resistance;
- Lucky Rift Spitter: post-dragon normal hostile, 260 HP, 10 melee fallback, 0.32 movement;
- ranged identity is project-owned: three telegraphed 3-block corrosive impacts, Poison II + short Slowness and retreat impulse inside 6 blocks;
- natural spawn remains behind the persistent first-Ender-Dragon gate, with a two-within-72 density cap;
- Rift Arsenal stage 2 and finale each add two Spitters while reducing duplicate melee counts, making the chain role-based rather than merely denser.

## Completion-jump batch — 0.33.0

### Slayers-Beasts Rift Charger Ant
- MIT source pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Exact upstream Meadow Ant Soldier texture is vendored; the already-verified Ant Soldier geometry and WALK/AMBIENT conversion is shared.
- Post-dragon role: 420 HP mobility/charge pressure, not another ranged or simple melee stat body.
- A 24-tick line telegraph precedes the dash. Connecting deals 30 impact damage and knockback; dodging the lane opens a 50-tick 1.35x vulnerability window.
- Natural spawn is post-dragon only, sparse, capped at one within 96 blocks, and biased to rocky/grass/tuff/gravel surfaces.
- Legendary Lucky Blocks can produce a direct Charger encounter without changing the Legendary pool total.

### Rift Reliquary
- New post-dragon Mythic dungeon/chained package.
- Permanent 17×29 structure with separated rooms and real progression gates rather than a single wave arena.
- Room 1: three spatially separated Archive Codex keys; each activation wakes a different licensed-source guard role.
- Room 2: six Fortune Bombs become a timed disarm-or-dodge corridor.
- Room 3: four Obsidilith Runes must be physically destroyed before the final encounter.
- Final role composition: two Rift Chargers + Rift Spitter + Wudu Binder + Tyrachnid.
- Objective blocks are restored while their stage is locked, preventing pre-clear/softlock bypass; closed gates are also repaired until legitimately opened.
- The event pauses while unattended and uses world-persisted shared state, so multiplayer participants progress one cooperative dungeon rather than separate player copies.

## 0.34.0 Gallery / stalker batch

### Gallery Slug
- Loy's Goodies CC0 Shotgun Shell at the existing pinned commit.
- 2 source elements -> 2 Bedrock cubes; embedded 16×16 source PNG is decoded directly.
- Used only inside Fortune Gallery. The old vanilla snowball trial grant/hit path is removed.
- ItemStartUse fires the trial shot; a stable block-view raycast selects the first block in the sightline.
- Reset, completion, timeout and periodic participant cleanup remove the custom trial ID, while legitimate vanilla snowballs are untouched.

### Cave Dweller
- New MIT source: `Thiov/cave_dweller-fabric@fc14dd9a228a332878b9419b77b6125302b5e861`.
- Full source geometry preserved: 18 bones / 83 cubes; geometry identifier only is renamed.
- Full source animation file preserved: 13 tracks; animation keys only are moved into the `animation.lb.cave_dweller.*` namespace.
- Body/eye textures and seven selected combat/state sounds are byte-identical.
- Source behavior identity reviewed from CaveDwellerEntity + Stare/Chase/Flee goals.
- Lucky role is deliberately not another ranged or charge enemy: post-dragon underground stalker that changes state based on player gaze, then commits to chase or flee.
- Direct Legendary encounter weight 8 is funded by reducing generic Legendary fragments and repeated Bogre weight; the Legendary pool remains exactly 122.

## 0.35.0 Tactical / Burrower breadth batch

### Three new materially different portable outcomes
- **Lucky Guitar** — Common weird/non-combat support result. 9-element CC0 Guitar model; reusable Encore buffs nearby players with regeneration/speed on a cooldown.
- **Smoke Grenade** — Rare tactical utility. 9-element CC0 model exists both in hand and as a physical thrown entity. Detonation creates a world-persisted smoke zone; players inside gain short refreshed invisibility while nearby non-player entities receive blindness/slowness.
- **Flashbang** — Epic tactical control. 18-element CC0 model exists both in hand and as a physical thrown entity. Timed detonation controls nearby entities; other players are affected only when PvP is enabled, preventing normal cooperative-world grief.
- The three outcomes are funded from generic/repeated slices rather than increasing tier totals.

### Rift Burrower Ant
- Separate Slayers-Beasts AntWorker source, not an AntSoldier recolor.
- Source model: 12 cubes; WALK drives six leg bones; renderer scale 1.2 is baked into Bedrock geometry; exact Meadow Worker texture is retained.
- Post-dragon phase role: normal melee pressure is interrupted by telegraphed smoke/burrow, temporary invisibility, relocation near the player and a short emergence slow/damage zone.
- Natural spawn remains Dragon-gated and capped at two within 72 blocks.
- Legendary direct result weight 6 is funded by reducing generic Legendary fragments and repeated Epic Lucky Block weight.
- Rift Reliquary final role mix is now Charger + Burrower + Spitter + Wudu + Tyrachnid.

### Cave Dweller parity step
- During chase, a player 1.4–6.5 blocks above and within 7.5 horizontal blocks triggers the already-vendored source crawl animation and a small upward/toward-target impulse.
- This is deliberately described as partial vertical-pursuit parity, not a full Java wall-climb or door-breaking reproduction.

## 0.36.0 Oddity / summoner breadth batch

### Portable / strange outcomes
- **Recall Gravestone (Common)** — 8-element CC0 source model. Player deaths are recorded in bounded world state. Interaction searches for a safe standable position around the most recent death, supports dimension changes, clears the record only after a successful return, and then consumes the block.
- **Lucky Air Conditioner (Rare)** — 11-element CC0 source model. One-use environmental utility removes nearby fire and soul fire, extinguishes burning entities and grants nearby players temporary Fire Resistance.
- **Fortune Mirror (Epic)** — 11-element CC0 source model. It consumes only when at least one supported debuff exists, then converts that status family into a useful positive counterpart instead of being another raw-stat reward.
- Weights are funded by reductions to generic/repeated slices: Common generic fragments -4, Rare Fortune Relay 8→4, Epic Awakened Grove 9→5.

### BOMD Lich
- Existing verified LGPL source, no new repository/license family.
- Visual chain: exact 161-bone / 233-cube geometry after identifier-only remap, 11/11 source animation tracks after namespace-only remap, exact 196×128 entity texture, and eight exact BOMD OGG files.
- Source combat roles reviewed from LichEntity, LichActions, MinionAction, TeleportAction, VolleyAction and CometAction.
- Lucky adaptation: post-dragon Legendary direct encounter, 2800 HP, no natural spawn.
- Role cycle: telegraphed slowing missile volley, owner-tagged Phantom summons with cap/cleanup, safe relocation teleport, telegraphed non-terrain-destroying comet AoE, and a faster rage cycle below 45% HP.
- The source's global eternal-night mutation is intentionally excluded because it would be an unnecessarily global multiplayer side effect.
- Legendary Lich weight 6 is funded by Slasher 16→12 and repeated Epic Lucky Block 10→8; total remains 122.

### Candidate rejection note
- A Wildlife Mod candidate was not imported because its repository README mentioned MIT but the inspected pin did not contain a repository LICENSE file.
- A second MIT candidate was rejected because the repository did not contain the promised production mob model/texture chain.
- The batch therefore stays entirely on already-cleared Loy's Goodies and BOMD sources rather than weakening provenance standards.

## 0.39.0 runtime fidelity correction
Real Bedrock content-log testing showed that several earlier "animation data identical after namespace remap" statements were too strong. The source assets were genuinely vendored from their pinned licensed repositories, but nine animation conversions retained Blockbench/Gecko-style keyframe wrappers that Bedrock actor animation rejects.

The 0.39 compatibility pass keeps numeric keyframe transform values and timing, while converting unsupported `{"vector":[...]}` wrappers and nested `pre/post.vector` into Bedrock array forms. Unsupported `easing/easingArgs` metadata is removed where the actor-animation schema has no equivalent. Affected runtime files: Bogre, Cave Dweller, Gauntlet, Impaler, Javelin, Lich, Obsidilith, Void Blossom and Warped Clam.

This correction changes the compatibility representation, not the visual source license/provenance. Texture/audio binaries and source geometry provenance remain unchanged. Future audits must distinguish "source values preserved" from "byte/data identical" whenever a platform-schema normalization is required.

Slasher likewise keeps its CC0 visual/audio/beam asset chain, but real 2.9.0 testing showed that the old 1.18 state-machine glue was not a reliable runtime authority. 0.39 keeps that source vendored for provenance and uses a small stable Bedrock bridge around the source animations/sounds/beams.
