# Wildbound External Asset Provenance

Last updated: 2026-10-02

## Policy

For every imported asset record source, license, author/project, modifications, target files, and runtime validation. Repository/code license does not automatically cover art/model/audio assets. Marketplace, ARR, and unclear-license content is reference-only.

## Kenney — UI Pack: Pixel Adventure

Purpose:
- Wildbound custom UI frame/panel primitives

License:
- CC0 as published by Kenney

Development source family:
- Kenney Pixel Adventure UI assets
- development mirror inspected: `shorepine/kenney`

Source-derived files retained:
- `textures/ui/wildbound_external/kenney_panel_blue.png`
- `textures/ui/wildbound_external/kenney_panel_gold.png`
- `textures/ui/wildbound_external/kenney_panel_bronze.png`
- `textures/ui/wildbound_external/kenney_panel_red.png`
- `textures/ui/wildbound_external/kenney_frame.png`

ALPHA3 Wildbound derivatives:
- `wb_frame.png`
- `wb_panel.png`
- `wb_panel_focus.png`
- `wb_panel_accent.png`
- `wb_panel_danger.png`

ALPHA3 modification:
- source panel pixels/shapes remain Kenney-derived;
- palette normalized to dark slate + muted gold + danger red;
- ALPHA2 mixed cyan/red/gold presentation rejected after runtime review.

Runtime status:
- ALPHA2 custom UI source integration rendered in Bedrock;
- ALPHA3 derivative palette/layout: NOT_RUN.

## FrenchKrab — mc-blockbench-models

Repository:
- `FrenchKrab/mc-blockbench-models`

License used for integration:
- CC BY 4.0

Attribution must remain with distributed derivatives.

### Tree monster basis

Used for Thornback late-evolution remaster:
- Briar Titan
- Grove Oracle
- Zenith Thornback

Modification:
- converted/adapted to Bedrock geometry;
- stage-specific silhouette variants added.

### krab.bbmodel

Used as a basis for abyss/crab lineage work.

Original source contained:
- geometry
- embedded texture
- idle
- walk
- jump animation data

Modification:
- parsed/converted to Bedrock geometry/animation representation;
- stage-specific Wildbound adaptation may add silhouette/armor/claw differences.

Runtime status:
- static/reference validation complete;
- detailed in-engine model regression remains pending.

## Candidate sources

Additional FrenchKrab models and other open assets may be researched but require file-level license review before import.

## Reference-only examples

Do not copy assets without explicit permission/license:
- Cobblemon noncommercial/restricted asset sets
- SERP Pokédrock / ARR packs
- Marketplace content
- ARR CurseForge packs
- proprietary Pokémon art/logos/icons
- Java mod artwork merely because its code is open source

## Import pipeline

1. verify license
2. obtain original bbmodel or complete Bedrock asset set
3. inspect texture references
4. preserve/convert bones
5. convert geometry
6. convert animations
7. wire client entity/geometry/texture/animations/controllers/render controller
8. static/reference validation
9. actual Bedrock spawn/render/animation/multiplayer test
10. only then scale the pipeline

## Attribution

For CC BY derivatives include project/author, source, license, and modification notice. CC0 attribution is optional but provenance remains recorded internally.
