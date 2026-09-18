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
