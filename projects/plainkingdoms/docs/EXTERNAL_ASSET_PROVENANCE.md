# PlainKingdoms External Asset Provenance

Date: 2026-09-30  
Policy: GitHub stores planning/provenance. Runtime package contains only assets or derivatives whose use has been reviewed for the target distribution.

## Status vocabulary

- **integrated-original**: original third-party bytes are shipped.
- **integrated-derived**: the original is not shipped, but a transformed/retargeted derivative is shipped.
- **researched**: inspected as a candidate/reference but not integrated.
- **reference-only**: code/design reference; no source copied into commercial Bedrock output.

## Integrated-derived — Kenney Blocky Characters

Official source: https://kenney.nl/assets/blocky-characters  
Author: Kenney  
License shown by official source: Creative Commons CC0  
OpenGameArt mirror also identifies the pack as CC0 and describes 18 skins and 27 animations.

### Exact inspected source

Retrieval mirror:
https://github.com/Hidencod/tge-assets/blob/main/packs/blocky-characters/character-a.glb

Path:
`packs/blocky-characters/character-a.glb`

Git blob SHA:
`1929813eb7229d3440f4e517b7e0055c3dfd0078`

Inspected byte size:
`131728`

The retrieval mirror is recorded for reproducibility. The license claim comes from the original Kenney distribution, not from assuming a GitHub mirror grants new rights.

### Source facts inspected

The GLB was parsed before adaptation.

Observed:
- 8 nodes
- 6 meshes
- embedded PNG texture
- rigid/blocky humanoid pieces
- animation clips including:
  - static
  - idle
  - walk
  - sprint
  - sit
  - drive
  - die
  - pick-up
  - emote yes/no
  - holding right/left/both
  - holding shoot variants
  - attack-melee-right/left
  - kick variants
  - interact variants

Relevant measured timings:
- idle ~1.3333 s
- walk ~0.6667 s
- sprint 0.5 s
- attack-melee-right ~0.4167 s
- die ~0.3333 s

### PlainKingdoms transformation

Status: **integrated-derived**

The original GLB is not included in the Add-On.

Alpha 5 transforms/retargets:
- blocky body proportions and source node hierarchy into Bedrock cuboid bones;
- selected idle/walk/sprint/melee/death movement curves into Bedrock animation JSON;
- one external-source character rig concept into a six-representative-soldier compressed army presentation.

PlainKingdoms-authored/adapted elements:
- six-soldier formation layout;
- role equipment silhouettes;
- sword/shield/spear/bow/crossbow/lance/hammer/siege-pack cubes;
- role visibility logic;
- HP-based representative visibility;
- composition-to-role allocation;
- combat state bridge;
- existing PlainKingdoms unit textures.

Runtime files carrying this derivative:
- RP `models/entity/squad_v2.geo.json`
- RP `animations/squad_v2.animation.json`
- RP `provenance/external_assets.json`
- RP `THIRD_PARTY_ASSETS.md`

## Researched — Quaternius Animated Knight Pack

Official:
https://quaternius.com/packs/knightcharacter.html

Current page identifies the pack as CC0 and states it includes an animated Knight plus swords/helmets and may be used in personal/commercial projects.

Status: **researched, not integrated in Alpha 5**.

Potential future use:
- richer medieval equipment silhouette reference;
- role-specific knight motion;
- sword/helmet accessory structure.

Do not mark this as shipped until exact source bytes/version are pinned and the final transformed files are recorded.

## Researched — Quaternius Universal Animation Library 2

Official:
https://quaternius.com/packs/universalanimationlibrary2.html

Current page describes 130+ animations, humanoid retargeting and CC0 use, including melee/armed combo coverage.

Status: **researched, not integrated in Alpha 5**.

Potential future use:
- spear brace;
- cavalry/charge;
- bow/crossbow;
- reload;
- hit/stagger;
- recovery;
- formation-ready locomotion.

Important: Quaternius also published a newer Quaternius Asset License page in August 2026. Before importing a newly downloaded current file, re-check the exact pack/download terms at acquisition time rather than assuming historical CC0 labeling automatically governs every future download.

## Reference-only code/mod sources

Unless separately reviewed and documented:
- Reign of Nether: GPL reference only.
- Colonies at War: GPL reference only.
- Steve's Army: architecture/reference unless a separate compatible route is documented.
- MineFortress: MIT; possible code adaptation candidate, but exact copied/derived code must still be tracked.

## Required rule for every future import

Record:
1. original author;
2. original title;
3. official source URL;
4. exact downloaded file/revision/hash;
5. license at acquisition;
6. whether original bytes are shipped;
7. transformation performed;
8. exact PlainKingdoms output files;
9. attribution/notice requirements;
10. Marketplace/commercial distribution review status.
