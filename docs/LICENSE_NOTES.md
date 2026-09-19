# External Asset License Notes

Last reviewed: 2026-09-18

This file records licensing decisions that affect Lucky Block production. It is not legal advice; it is the project's compliance checklist.

## Verified direct-use candidates

- Microsoft minecraft-samples — MIT. Use as official Bedrock implementation reference and reusable sample code where applicable; preserve the MIT notice when required.
- Loy's Goodies (SL0ANE/Loy-s-Goodies) — CC0-1.0. Strong direct-use source for Blockbench props, foods, tools, weapons and accessories.
- CorvaeOboro minecraft_botania_pylon_crystal — CC0-1.0. Direct-use candidate for crystal geometry/texture language and Lucky Fragment production.
- FrenchKrab mc-blockbench-models — CC BY 4.0. Direct use requires attribution; individual models still need IP/provenance screening before selection.
- Team-Synapse-MC Inhabitants — MIT. Source contains model geometry, animations, textures, glow masks and gameplay logic for Bogre, Impaler and Warped Clam.
- InvictusSlayer Slayers-Beasts — MIT. Active direct-use source after per-asset review for Mantis, Tyrachnid, Irk, Ent, Ant Soldier/War Ant, Wither Spider, Wudu, Ant Queen and Damselfly assets; Java AI is still reimplemented or explicitly separated when Lucky adds mechanics.
- SigmundGranaas forgero — MIT. Candidate primarily for modular tool/weapon-system ideas and usable assets after per-file review.
- PinkGoosik visuality — MIT. Useful for visual-effect implementation patterns; Java-specific logic must be recreated for Bedrock.

## Conditional / special handling

- Bosses of Mass Destruction — LGPL-3.0. Direct reuse or modified derivatives require LGPL compliance. Keep license/source obligations isolated and documented; do not casually fold assets/code into unrelated proprietary material.
- Fantasy Knights & Factions — project is MIT, but project-level licensing does not automatically clear separately sourced skins or other third-party content. Use only individually verified assets; event/encounter structure can be studied independently.

## Reference-only unless permission changes

- Stellarity / Prismatic-Shards/Stellarity — current v6 license is not MIT. It permits personal use and modification but forbids reupload/republish/redistribution without explicit permission. Do not bundle its original or modified assets in a distributed .mcaddon. It may remain a late-game design reference.
- WorldAnimals / shaiku/WorldAnimals — public Bedrock source currently has no repository license metadata/file verified. Do not reuse assets until permission provenance is established.

## General rule

A source's top-level license does not override restrictions attached to embedded third-party assets. Every selected external file must retain a source record that is specific enough to reconstruct where it came from and why it is safe to redistribute.


## Active conditional source: Bosses of Mass Destruction
- Repository: `barribob/bosses-of-mass-destruction`
- Reviewed commit: `2fbd0dc79bea498bcad755c4ad9969055dc452c7`
- License: LGPL-3.0.
- Obsidilith assets are now actively vendored.
- Keep the full LGPL text with distributions and keep the corresponding modified integration source available.
- Do not silently relicense copied BOMD material as project-original content.


## Active Slayers-Beasts Queen Ant port — 0.22.0
- Source remains InvictusSlayer/Slayers-Beasts, pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`, under the verified MIT license.
- Direct reused/adapted material in this milestone is limited to the Queen Ant model/animation/renderer reference and original `wood_queen.png` texture; the existing Ant Soldier art is reused from the already-cleared War Ant integration.
- Royal Anthill layout, staged seals, Queen combat telegraph/reinforcement logic and completion reward are Lucky-owned additions and are documented separately from upstream behavior.


## Active Loy's Goodies turret port — 0.23.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Selected file: `models/java-model/tools & weapons/220420_turret.bbmodel`.
- Direct reuse is limited to the source model geometry and its embedded PNG; both are tracked in the vendor registry.
- Auto-targeting, finite ammunition, damage balance, block-to-entity deployment and Fortune Bulwark event logic are project-owned additions rather than source-original behavior.


## Active Loy's Goodies Storm Longbow port — 0.24.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Selected direct-use files: `230419_bow_1_0.bbmodel` through `230419_bow_1_3.bbmodel`.
- The four original draw-state geometries and their single shared embedded texture are the external payload.
- Charge thresholds, ammunition/durability handling, raycast combat, damage/range scaling and piercing are Lucky-owned additions.


## Active Slayers-Beasts Sky Damselfly port — 0.25.0
- Source: InvictusSlayer/Slayers-Beasts, reviewed commit `ffc1f6480a60598797c63150c0d0fe66b65697ff`, MIT.
- Direct reused/adapted material is the Damselfly model, FLY/PERCH animation definitions, renderer scale/texture mapping reference and original blue texture.
- The source is a non-rideable ambient flying/perching creature. Mount sizing, taming, rider controls, flight-energy limits, recharge and Legendary reward placement are Lucky-owned additions.
- Source fall-damage immunity is preserved rather than reinterpreted as a Lucky ability.


## Active Loy's Goodies Explorer Field Kit port — 0.26.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Selected files: `230726_explorer_hat.bbmodel` and `230516_backpack.bbmodel`.
- Direct reused material is the source geometry and each model's embedded texture.
- The backpack source's three inverted duplicate/backface elements are not treated as independent physical cuboids in Bedrock entity geometry; the seven physical cuboids are ported and the conversion boundary is documented.
- Wearable slots, protection/durability, set effects, multiplayer link logic and Lucky reward weights are project-owned additions.


## Fortune Gallery composition note — 0.27.0
- No new third-party asset license enters the project in this milestone.
- Physical targets reuse the already-cleared Loy's Goodies CC0 Vase asset at the pinned `afbb7695b09de0ed8ee3aa97732ff7c3d367520c` source.
- The optional Sharpshooter reward reuses the already-cleared Loy's Goodies CC0 Storm Longbow.
- Arena materials are vanilla Minecraft content and projectile-hit handling is implemented against the documented stable `@minecraft/server` API.
- Fortune Gallery structure layout, scoring, target reset, trial-ammo rules, multiplayer contribution tracking and reward thresholds are Lucky-owned gameplay.


## Active Slayers-Beasts Butterfly port — 0.28.0
- Source: InvictusSlayer/Slayers-Beasts, reviewed commit `ffc1f6480a60598797c63150c0d0fe66b65697ff`, MIT.
- Direct reused/adapted material: Butterfly entity behavior reference, model, IDLE_CLOSED/FLYING animations, renderer scale/texture mapping and original tortoiseshell texture.
- Lucky-owned material: sanctuary structure, event population stabilization/soft tether, observation-station rules, cooperative event state and rewards.
- Sporetrap was explicitly not selected in this milestone because the renderer's referenced `sporetrap.png` is absent from the pinned source tree. The presence of a differently named `venus_flytrap.png` is insufficient provenance to substitute it automatically.
