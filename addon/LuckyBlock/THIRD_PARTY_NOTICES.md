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
