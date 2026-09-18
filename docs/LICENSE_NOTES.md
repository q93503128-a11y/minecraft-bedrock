# External Asset License Notes

Last reviewed: 2026-09-18

This file records licensing decisions that affect Lucky Block production. It is not legal advice; it is the project's compliance checklist.

## Verified direct-use candidates

- Microsoft minecraft-samples — MIT. Use as official Bedrock implementation reference and reusable sample code where applicable; preserve the MIT notice when required.
- Loy's Goodies (SL0ANE/Loy-s-Goodies) — CC0-1.0. Strong direct-use source for Blockbench props, foods, tools, weapons and accessories.
- CorvaeOboro minecraft_botania_pylon_crystal — CC0-1.0. Direct-use candidate for crystal geometry/texture language and Lucky Fragment production.
- FrenchKrab mc-blockbench-models — CC BY 4.0. Direct use requires attribution; individual models still need IP/provenance screening before selection.
- Team-Synapse-MC Inhabitants — MIT. Source contains model geometry, animations, textures, glow masks and gameplay logic for Bogre, Impaler and Warped Clam.
- InvictusSlayer Slayers-Beasts — MIT. Candidate pending per-asset extraction and Bedrock port review.
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
