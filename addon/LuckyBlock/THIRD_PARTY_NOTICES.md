# Third-party notices

This source snapshot contains directly reused or adapted assets from permissively licensed upstream projects.

## Microsoft minecraft-samples
- Source: https://github.com/microsoft/minecraft-samples
- License: MIT
- Imported/adapted:
  - Lucky Block custom geometry as the Common block base.
  - Lucky Block texture as the Common block surface asset.
- Required MIT copyright/license notice remains applicable to the reused sample material.

## minecraft_botania_pylon_crystal — CorvaeOboro
- Source: https://github.com/CorvaeOboro/minecraft_botania_pylon_crystal
- License: CC0-1.0
- Imported/adapted:
  - mana, natura and gaia animated crystal textures;
  - natura and gaia ring textures;
  - short, short-tall, tall-short and tall bipyramid geometry families;
  - Natura ring geometry;
  - Gaia ring geometry.
- Java-format block models were converted into Bedrock geometry without temporary stand-ins.

## Loy's Goodies — SL0ANE
- Source: https://github.com/SL0ANE/Loy-s-Goodies
- License: CC0-1.0
- Directly imported/adapted in the first external reward batch:
  - 220909 burger model + embedded texture;
  - 220211 plunger model + embedded texture;
  - 230516 backpack model + embedded texture;
  - 220130 snow globe model + embedded texture;
  - 230924 vending machine model + embedded texture.
- Original Blockbench/Java-block geometry is converted to Bedrock geometry; original embedded PNG textures are retained.

No placeholder image, model, icon or sound is intentionally included.


### Additional Loy's Goodies CC0 reward assets integrated in 0.4.0
- `230423_noodles.bbmodel`
- `230617_moai.bbmodel`
- `220523_pc.bbmodel`
- `230502_cctv_camera.bbmodel`
- `220420_wrench.bbmodel`
- `230501_chainsaw.bbmodel`
- `230511_camera.bbmodel`
- `230512_golden_hammer.bbmodel`
- `230217_vase.bbmodel`
- `230627_easel.bbmodel`

Each selected model had a directly embedded PNG texture in its Blockbench source. The original CC0 model geometry and PNG were converted/imported directly; no placeholder texture was substituted.


## FrenchKrab mc-blockbench-models
- Source: https://github.com/FrenchKrab/mc-blockbench-models
- Creator: FrenchKrab
- License: CC BY 4.0
- Reviewed source commit: 3a568ceda77434a17e2722459e8becf48a1f6920
- Integrated assets:
  - `tools/cardboard_sword.bbmodel`
  - `tools/cardboard_axe.bbmodel`
  - `tools/cardboard_shield.bbmodel`
- Modifications:
  - Java Blockbench geometry converted to Bedrock geometry;
  - original embedded texture retained;
  - identifiers remapped into the `lb:` namespace;
  - original Lucky Block interaction behavior added by this project.
- Attribution is retained here because CC BY 4.0 requires credit.


## Inhabitants
- Source: https://github.com/Team-Synapse-MC/Inhabitants
- License: MIT
- Copyright notice in reviewed source: Copyright (c) 2025 Team Obsidian
- Reviewed commit: `2da25600eb052862d34818b4a2a458afea83e868`
- Integrated content:
  - Impaler geometry, animation, default texture, scream/spike sounds;
  - Warped Clam geometry, animation, Ender texture, open/hit sounds.
- Java-side entity/AI code is not assumed to run on Bedrock. Its gameplay intent was studied, while Bedrock entity JSON and Script API behavior were written for this project.
- Runtime identifiers are remapped to `lb:impaler` and `lb:warped_clam`.
- The MIT notice must remain with redistributed substantial portions.


### Bogre miniboss
- Source: Team-Synapse-MC/Inhabitants, reviewed commit `2da25600eb052862d34818b4a2a458afea83e868`
- License: MIT
- Directly reused/adapted:
  - `geo/bogre.geo.json`
  - `animations/bogre.animation.json`
  - `textures/entity/bogre.png`
  - selected Bogre roar/attack/shockwave/hurt/death OGG files
- The original Java AI is not bundled as executable Bedrock code. Its combat intent and constants were reviewed, then a Bedrock-specific phased encounter was implemented with Entity JSON and Script API.


## Bosses of Mass Destruction — Obsidilith
- Source: https://github.com/barribob/bosses-of-mass-destruction
- Reviewed commit: `2fbd0dc79bea498bcad755c4ad9969055dc452c7`
- License: GNU Lesser General Public License v3.0
- Full reviewed license text is included at `THIRD_PARTY_LICENSES/BOMD_LGPL-3.0.txt`.
- Directly reused/adapted:
  - Obsidilith geometry and animation data;
  - original Obsidilith entity texture;
  - original Obsidilith rune texture and cube-all design;
  - original wave-indicator / split / soul-flame particle art frames;
  - original prepare/burst/spike/wave indicator audio.
- The upstream Kotlin boss implementation is not executed in Bedrock. Its Burst/Spike/Wave/Pillar mechanics were studied and reimplemented in the Bedrock Script API.
- Modified integration source remains available in this repository.


## Slasher Sword Addon
- Source: https://github.com/lc-studios-mc/slasher-v1
- Creator: LC Studios
- Reviewed commit: `24887c71758cf11bba1f419ecdd70b651d2d7d94`
- License: CC0 1.0 Universal.
- Directly vendored:
  - original Slasher and Slasher Blade item definitions/icons;
  - original first-person and third-person Slasher geometry;
  - original animation controller and Slasher animation sets;
  - original beam entities/models/animations/render controllers;
  - original spark/beam particles and particle textures;
  - original Slasher texture and all combat OGG files;
  - original item-extender and Slasher combat state-machine source.
- Compatibility modifications:
  - runtime identifiers remapped from `lc:` to `lb:`;
  - removed deprecated `worldInitialize` startup dependency;
  - updated deprecated `isValid()` and GameMode enum usage for @minecraft/server 2.9.0;
  - beam timeout handling moved away from removed dataDrivenEntityTrigger usage;
  - Lucky late-game damage/durability values increased without replacing the original visual/animation design.


## Tomemancy
- Source: https://github.com/Sharded-Alex/Tomemancy
- Creator: Sharded-Alex
- Reviewed commit: `b5a76921e98c06aae9942c705af605e2abcac44c`
- License: MIT.
- Full reviewed license text is included at `THIRD_PARTY_LICENSES/TOMEMANCY_MIT.txt`.
- Directly reused/adapted:
  - original Diamond Staff inventory texture;
  - original Spellbook inventory texture used by Advanced Tomes;
  - original Meteor entity texture and Meteor geometry;
  - original Flame Summoning particle texture and particle definition;
  - Advanced Meteor, Gigavolt and Dragon Fireball spell roles and pacing as the gameplay reference.
- Compatibility / Lucky modifications:
  - old 1.16.x data-driven item events and scoreboard knowledge gates are replaced by @minecraft/server 2.9.0 Script API behavior;
  - identifiers are remapped from `tome:` to the `lb:` production namespace;
  - the first-Ender-Dragon Lucky gate replaces Tomemancy's original player-level/knowledge progression for this reward;
  - the four pieces are delivered together as a Mythic content set rather than a single high-stat item;
  - damage, cooldown and durability are rebalanced around Bogre / Obsidilith late-game combat.


## Slayers-Beasts — Mantis
- Source: https://github.com/InvictusSlayer/Slayers-Beasts
- Creator: InvictusSlayer
- Reviewed branch / commit: `1.21.4` / `ffc1f6480a60598797c63150c0d0fe66b65697ff`
- License: MIT.
- Full reviewed license text is included at `THIRD_PARTY_LICENSES/SLAYERS_BEASTS_MIT.txt`.
- Directly reused/adapted: original Mantis texture, ambient/hurt/death OGG audio, model dimensions/pivots/base rotations, and WALK/SCUTTLE/STRIKE/FLAP keyframes.
- Java model/animation coordinates are converted into Bedrock JSON rather than visually redesigned.
- Java AI is reimplemented for Bedrock while retaining the source Mantis's fast approach, leap, strike and poison identity.


### Tyrachnid elite
- Same Slayers-Beasts MIT source and pinned commit as the Mantis integration.
- Directly reused/adapted:
  - original `textures/entity/tyrachnid.png`;
  - all 43 model parts / 90 cubes represented by `TyrachnidModel.java`;
  - the original 40-channel / 200-keyframe WALK animation.
- The source entity's actual implemented combat is fast, high-knockback melee. Its `RangedAttackMob` method is empty upstream, so this project does **not** present a ranged projectile as source-original behavior.
- Lucky-specific addition: a telegraphed Silk Snare zone reusing already-vendored BOMD indicator/burst particles; this is a project-side late-game elite mechanic.


## MinecraftCustomEvents — fishing event adapter
- Source: https://github.com/yuki2825624/MinecraftCustomEvents
- Creator: yuki2825624
- Reviewed commit: `7321663e75d501adee961d60bc346afc3341b449`
- License: MIT.
- Full reviewed MIT text is included at `THIRD_PARTY_LICENSES/MINECRAFT_CUSTOM_EVENTS_MIT.txt`.
- Adapted source: `scripts/player/fish.js`.
- Preserved idea: associate a fishing-hook lifecycle with the casting player, require the hook to have entered water, and only emit a catch when a real item entity is produced at the hook's removal.
- Lucky port changes:
  - removes the upstream custom EventSignal dependency;
  - removes deprecated `isValid()` polling;
  - handles either item-use/entity-spawn ordering;
  - matches simultaneous multiplayer casts by dimension and nearest same-tick cast;
  - tracks recent item spawns so reeling an empty hook does not count as a catch.


### Irk companion and Ent guardian
- Same Slayers-Beasts MIT source and pinned commit as the Mantis/Tyrachnid integrations.
- Irk: original model dimensions/pivots, WALK keyframes and `textures/entity/irk.png` are ported; Lucky adds the Bedrock companion/taming behavior.
- Ent: original medium-Ent model dimensions/pivots, WALK keyframes and oak texture are ported; Lucky preserves its retaliatory identity and adds the Awakened Grove encounter.
- Awakened Grove layout/rewards are Lucky-owned and use final vanilla building materials rather than temporary art.


### War Ant Mount
- Source: Slayers-Beasts / InvictusSlayer / MIT, pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Directly adapted source files: AntSoldier model, WALK + AMBIENT animation data, renderer scale reference and original wood-soldier texture.
- The upstream 1.5× render scale is baked into the converted Bedrock geometry rather than silently changing the source silhouette.
- Lucky-owned behavior changes the original neutral combat ant into a tameable Epic mount. Taming, rideable seating, ground input, player-ridden control and owner-defense behavior are Bedrock-side adaptations, not upstream Java behavior.


### Amethyst Repeater and Amethyst Charge
- Source: Tomemancy / MIT, pinned at `b5a76921e98c06aae9942c705af605e2abcac44c`.
- Direct reuse: original Amethyst Staff icon and original amethyst-orb icon. The source Amethyst Staff and its Amethyst Blast projectile are provenance references for the ranged-staff role.
- Lucky rebuild: the Repeater uses stable Script API block-aware entity raycasts for a three-shot line-of-sight burst, finite Amethyst Charge ammunition and Lucky-specific durability/cooldown values.
- The source custom projectile is deliberately not required at runtime, avoiding a new Custom Projectiles experimental dependency.

### Wither Spider
- Source: Slayers-Beasts / InvictusSlayer / MIT, pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Direct reuse/adaptation: original Wither Spider model, WALK animation, original texture and the renderer's 1.2× scale.
- Source gameplay is melee and applies Wither on contact. Lucky preserves that contact identity.
- The telegraphed ranged Wither volley is a Lucky-owned mechanic added to fill the pre-dragon ranged/control role. It reuses already-vendored BOMD indicator/burst particles and is not source-original behavior.


### Mystical Aegis Armor
- Source: Tomemancy / MIT, pinned at `b5a76921e98c06aae9942c705af605e2abcac44c`.
- Direct reuse: the four original Mystical Armor item icons, original `magic.png` wearable texture, and the original vanilla-humanoid armor attachable layout.
- Source armor protection profile is retained exactly at helmet/chest/legs/boots = 1/4/3/2.
- Lucky modification: durability and repair values are raised so the set works as persistent Lucky gear rather than disposable spell output.
- The full-set **Aegis Ward** is Lucky-owned behavior inspired by Tomemancy's original Aegis spell: after 6 seconds without taking damage, the equipped full set can recharge Absorption II for 8 seconds on a 10-second ward cycle. This behavior is not claimed to be source-original.


### Wudu Binder
- Source: Slayers-Beasts / InvictusSlayer / MIT, pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Direct reuse/adaptation: original Wudu model, CRAWL animation and original oak Wudu texture.
- Upstream source currently contains `WuduGrabGoal`, but `canUse()` returns false and no functional grab AI is implemented there.
- Lucky therefore does **not** attribute the implemented grasp mechanic to upstream. The 0.9-second telegraphed pull/slow attack and nearby-ally Resistance aura are Lucky-owned post-dragon mechanics added to fill the missing control/support ecosystem role.


### Queen Ant / Royal Anthill
- Source: Slayers-Beasts / InvictusSlayer / MIT, pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Directly reused/adapted: `AntQueenModel.java`, `AntQueenAnimation.java`, `AntQueenRenderer.java`, `AntQueen.java` as behavior/proportion reference, and the original `textures/entity/ant/wood_queen.png`.
- The original renderer's 1.5x visual scale is baked into the Bedrock geometry rather than replacing the source silhouette.
- Upstream Queen Ant behavior is neutral persistent-anger melee with no summon phase or boss telegraph.
- Lucky-owned additions: the permanent Royal Anthill structure, always-hostile event binding, three brood-seal objective, Mandible Crush telegraph, health-threshold reinforcements and War Ant completion reward.
- The Royal Anthill guard reuses the already-vendored Ant Soldier model/animation/wood texture family rather than introducing temporary art.
