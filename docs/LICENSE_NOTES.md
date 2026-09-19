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


## Active Inhabitants Arsenal port — 0.29.0
- Source: Team-Synapse-MC/Inhabitants, reviewed commit `2da25600eb052862d34818b4a2a458afea83e868`, MIT.
- Javelin direct material: source Java behavior references, both original geometry JSON files, original animation JSON, original item/entity textures and six original sounds.
- Spike Drill direct material: source Java item/mining logic references, original base item texture and six original sounds.
- Javelin Bedrock Script API entity/raycast implementation, Lucky 8-18 damage profile, exact participant state handling and Rift Arsenal objective are project-side adaptations.
- Spike Drill block-form salvage, deny-list and actionbar state display are project-side adaptations. The source's temperature-specific model override art is not claimed active in the current Bedrock port.
- Rift Arsenal structure/staging/rewards are Lucky-owned and only reuse already-cleared Inhabitants/Slayers-Beasts production entities plus the newly-cleared arsenal gear.


## Active Loy's accessory/status ports — 0.30.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Wizard Hat and Sunglasses use source Blockbench element/UV data and directly decoded embedded production PNGs.
- Fortune Tonic uses the single embedded production texture from the Blue Pop Can source model.
- Arcane Focus, Threat Lens and tonic status effects are project-side gameplay behaviors; no upstream gameplay behavior is claimed.
- The inspected Zongzi source is not shipped because a complete representation would require both of its textures.

## Active BOMD Gauntlet port — 0.30.0
- Source: barribob/bosses-of-mass-destruction, reviewed commit `2fbd0dc79bea498bcad755c4ad9969055dc452c7`, LGPL-3.0.
- Direct material: Gauntlet geometry, all ten animation tracks, entity texture, Gauntlet Blackstone texture and seven original sound files.
- Geometry/animation port changes are namespace/identifier remaps only; source binary texture/sound payloads are vendored byte-identically.
- Java/Kotlin combat implementation is not copied as Bedrock code. Its documented behavior is re-expressed through `@minecraft/server 2.9.0` mechanics: telegraphed punch, delayed laser, swirl pulses, blindness, immunity and counterable shield phases.
- Source-availability compliance continues under the existing BOMD entry and `THIRD_PARTY_LICENSES/BOMD_LGPL-3.0.txt`.


## Active BOMD Void Blossom port — 0.31.0
- Source: barribob/bosses-of-mass-destruction, reviewed commit `2fbd0dc79bea498bcad755c4ad9969055dc452c7`, LGPL-3.0.
- Direct reused material: complete Void Blossom geometry, all eight animation tracks, entity texture, and five original OGG combat sounds.
- Geometry/animation changes are identifier/namespace remaps only; PNG/OGG payloads are byte-identical.
- Java/Kotlin combat code is not copied as Bedrock code. Spike, spike-wave, spore, petal-blade and milestone-blossom identities are re-expressed with `@minecraft/server 2.9.0`; life-root guard/exposure rules and Void Garden are project-owned.
- Existing LGPL notice/source-availability treatment remains in force.

## Active Loy's Archive Codex port — 0.31.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Selected file: `models/java-model/furniture & decoration/books/220407_book_0.bbmodel`.
- All seven source elements and per-face UVs are converted directly; its single embedded texture is decoded directly.
- Fortune Archive structure/puzzle behavior is project-owned and does not claim an upstream gameplay mechanic.


## Active Loy's Fortune Bomb port — 0.32.0
- Source: SL0ANE/Loy-s-Goodies, reviewed commit `afbb7695b09de0ed8ee3aa97732ff7c3d367520c`, CC0-1.0.
- Selected file: `models/java-model/tools & weapons/firearms/230426_bomb.bbmodel`.
- All 8 source elements, rotations and per-face UVs are converted directly; the single embedded production texture is decoded directly.
- Fortune Minefield gameplay is project-owned and does not claim an upstream trap mechanic.

## Active Slayers-Beasts Rift Spitter port — 0.32.0
- Source: InvictusSlayer/Slayers-Beasts, reviewed commit `ffc1f6480a60598797c63150c0d0fe66b65697ff`, MIT.
- Direct reused material is the Ant Soldier visual/animation reference and exact Leafcutter Soldier texture.
- Shared War Ant geometry/animation targets remain owned by the existing Ant Soldier/War Ant registry record; the Rift Spitter registry record does not duplicate target ownership.
- Upstream Ant Soldier has no ranged spit. Corrosive salvos, retreat AI, post-dragon spawn policy, balance, drops and Rift Arsenal integration are project-owned.

## 0.33.0 reuse note — Rift Charger / Reliquary

- Rift Charger adds no new license family. It uses the already-cleared Slayers-Beasts MIT source pinned at `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Newly vendored binary: exact upstream `common/src/main/resources/assets/slayersbeasts/textures/entity/ant/meadow_soldier.png`.
- The Ant Soldier geometry/animation conversion is shared from existing audited targets; it is not duplicated under a second asset owner.
- Rift Reliquary reuses already-cleared Loy's Goodies CC0 Archive Codex/Fortune Bomb assets and the existing BOMD LGPL Obsidilith Rune asset. No new third-party license family is introduced by the dungeon layout.
- Source-original behavior and Lucky-owned gameplay remain explicitly separated in THIRD_PARTY_NOTICES and the vendor registry.
