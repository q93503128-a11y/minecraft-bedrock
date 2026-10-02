# Wildbound External Asset Provenance

Last updated: 2026-10-02

## Policy

Every external asset integrated into Wildbound must record:

- source project/repository
- original file(s)
- license
- author/maintainer where known
- modifications/conversion
- target Wildbound files/entities
- runtime validation status

Repository code license and artwork/model license must be treated separately.

All Rights Reserved / Marketplace / unclear-license content is reference-only.

## Active / current remake sources

### Kenney — UI Pack: Pixel Adventure

Purpose:
- Wildbound custom UI panels/frames

License:
- CC0 / public-domain dedication as published by Kenney for the asset pack

Source family:
- Kenney Pixel Adventure UI assets
- mirrored/open repository copy used during development: `shorepine/kenney`

Current local Wildbound derivative/integrated files include:

- `textures/ui/wildbound_external/kenney_panel_blue.png`
- `textures/ui/wildbound_external/kenney_panel_gold.png`
- `textures/ui/wildbound_external/kenney_panel_bronze.png`
- `textures/ui/wildbound_external/kenney_panel_red.png`
- `textures/ui/wildbound_external/kenney_frame.png`

Modification:
- selected source tiles used as Wildbound panel/frame primitives
- integrated into Bedrock JSON UI

Status:
- file/static validation complete
- real Bedrock UI runtime validation pending

### FrenchKrab — mc-blockbench-models

Repository:
- `FrenchKrab/mc-blockbench-models`

License:
- CC BY 4.0 according to repository licensing used for integration

Requirement:
- attribution must be retained in distribution notices where these assets ship

Current imported model families:

#### Tree monster source

Used as a basis for the Thornback late-evolution remake.

Wildbound targets include:
- Briar Titan
- Grove Oracle
- Zenith Thornback

Modification:
- converted/adapted to Bedrock geometry
- evolution-stage silhouette variants added rather than using one identical geometry at different scales

Runtime status:
- static/reference validation complete
- real Bedrock rendering/animation validation pending for ALPHA2

#### krab.bbmodel

Used as a basis for the abyss/crab lineage remaster.

Original model contains:
- geometry
- embedded texture
- idle animation
- walk animation
- jump animation

Modification:
- parsed/converted into Bedrock geometry/animation data
- Wildbound-specific stage silhouettes/armor/claw details may be layered or adapted per evolution stage

Runtime status:
- conversion/static inspection performed
- final in-game appearance must be validated before expanding this pipeline to many families

## Candidate sources researched but not automatically approved

Potential sources must still receive file-level license review before integration.

Examples investigated:
- additional FrenchKrab Blockbench models such as goat/reindeer/fish families
- open-source Bedrock UI frameworks and Mojang sample UI patterns

A repository being visible on GitHub does not imply its art is reusable.

## Reference-only sources

The following kinds of projects may inform UX/combat design but their assets must not be copied unless their license explicitly permits it:

- Cobblemon asset sets with noncommercial restrictions
- SERP Pokédrock / ARR Bedrock Pokémon add-ons
- Marketplace content
- ARR CurseForge Bedrock packs
- proprietary Pokémon art/logos/icons
- Java mods whose code license does not cover model/texture/audio assets

## Import pipeline

Preferred model import process:

1. verify license/provenance
2. obtain original `.bbmodel` or complete Bedrock asset package
3. inspect texture resolution and embedded/external texture references
4. preserve or convert bone hierarchy
5. convert geometry to Bedrock-compatible format
6. convert/import animations
7. wire:
   - client entity
   - geometry
   - texture
   - animations
   - animation controller if needed
   - render controller
8. run reference/static checks
9. test in actual Bedrock:
   - spawn
   - scale
   - orientation
   - idle
   - movement
   - attack
   - death/despawn
   - multiplayer visibility
10. only then reuse the pipeline for additional families

## Attribution rule

Where CC BY or similar attribution is required, include:
- original author/project
- source
- license
- modified/adapted notice

CC0 sources do not require attribution, but provenance should still be retained internally.
