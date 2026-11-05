# Monster Restaurant (working title) — Minecraft Bedrock

- Project slug: `monster-restaurant`
- Edition: Minecraft Bedrock Edition
- Status: **M0 SOURCE + STATIC PACKAGE COMPLETE / ENGINE NOT RUN**
- Canonical design: [GAME_DESIGN.md](GAME_DESIGN.md)
- External gameplay/UX references: [docs/EXTERNAL_REFERENCES.md](docs/EXTERNAL_REFERENCES.md)
- Gameplay/content index: [docs/CONTENT_CATALOG.md](docs/CONTENT_CATALOG.md)
- Player-facing language & UX: [docs/UX_COPY.md](docs/UX_COPY.md)
- Delivery milestones: [docs/ROADMAP.md](docs/ROADMAP.md)
- Current reality and test state: [STATUS.md](STATUS.md)

## M0 technical baseline

- Namespace: `monster_restaurant`.
- Installed Minecraft Bedrock: `1.26.6005.0` (Microsoft Store package; identified from Appx metadata on 2026-11-05).
- Target engine baseline: Bedrock `26.60` / manifest `min_engine_version` `[1, 26, 0]`.
- Stable Script API: `@minecraft/server` `2.11.0`; `@minecraft/server-ui` `2.3.0`.
- Behavior Pack header UUID: `5c9831a9-a01f-4d62-94dc-4678bb512a38`; data module UUID `b9512485-b8ba-4b8b-9d71-f052fca18e4f`; script module UUID `2bca6332-0800-4dcb-a573-cc82bb143a6d`.
- Resource Pack header UUID: `a39f9b7e-b5d8-48bb-9567-7ac26de9bd8e`; resource module UUID `734ccf31-3122-4cb5-9a0e-e90ca47c1f9e`.
- Current source: `BP/`, `RP/`, editable Blockbench models in `assets/blockbench/`.
- Repeatable package: `build/MonsterRestaurant-0.1.0.mcaddon`.
- Static verification: PASS. Minecraft import/gameplay/render verification: NOT_RUN.

## Production specification (v0.2 proposal)

- [M1 gameplay & acceptance contract](docs/M1_PLAYABLE_SLICE.md)
- [Economy prototype and meaningful earnings](docs/ECONOMY_EXPERIMENT.md)
- [Technical implementation risks and API gate](docs/TECHNICAL_GATE.md)
- [Visual/gameplay references](docs/EXTERNAL_REFERENCES.md)

These remain design proposals except for the narrow M0 prototype described in `STATUS.md`. No numerical balance or runtime compatibility claim is final before in-game verification.

## Source layout when implementation starts

`BP/` for behavior pack and scripts; `RP/` for models/textures/sound; `assets/blockbench/` for editable models; `tools/` for repeatable validation and packaging. Do not add empty placeholder packs merely to suggest completion.

Scope: survival exploration, accessible monster hunting, food preparation, optional restaurant operation near villages or player-built settlements, a few meaningful staff roles, useful earnings and a single compact in-game guide.

Production rules: repo `../../AGENTS.md` and Bedrock build/quality standards. External game research before new UX or mechanics design, no developer log/TMI/internal implementation text in player-facing content.
