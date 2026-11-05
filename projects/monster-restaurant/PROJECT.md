# Monster Restaurant (working title) — Minecraft Bedrock

- Project slug: `monster-restaurant`
- Edition: Minecraft Bedrock Edition
- Status: **DESIGN IN PROGRESS / NO BP-RP SOURCE YET**
- Canonical design: [GAME_DESIGN.md](GAME_DESIGN.md)
- External gameplay/UX references: [docs/EXTERNAL_REFERENCES.md](docs/EXTERNAL_REFERENCES.md)
- Gameplay/content index: [docs/CONTENT_CATALOG.md](docs/CONTENT_CATALOG.md)
- Player-facing language & UX: [docs/UX_COPY.md](docs/UX_COPY.md)
- Delivery milestones: [docs/ROADMAP.md](docs/ROADMAP.md)
- Current reality and test state: [STATUS.md](STATUS.md)

## Technical placeholders (not yet decided)

- Pack identifier/namespace: TBD after naming validation.
- Target Bedrock version/Script API: TBD after official version verification.
- Manifest UUIDs: create only alongside real BP/RP.
- Packaged build: NONE.
- Runtime test: NOT_RUN.

## Production specification (v0.2 proposal)

- [M1 gameplay & acceptance contract](docs/M1_PLAYABLE_SLICE.md)
- [Economy prototype and meaningful earnings](docs/ECONOMY_EXPERIMENT.md)
- [Technical implementation risks and API gate](docs/TECHNICAL_GATE.md)
- [Visual/gameplay references](docs/EXTERNAL_REFERENCES.md)

These are design proposals; real Bedrock pack content is **not yet created**. No numerical balance or compatibility claim is final before in-game verification.

## Source layout when implementation starts

`BP/` for behavior pack and scripts; `RP/` for models/textures/sound; `assets/blockbench/` for editable models; `tests/` and `tools/` for repeatable validation. Do not add empty placeholder packs merely to suggest completion.

Scope: survival exploration, accessible monster hunting, food preparation, optional restaurant operation near villages or player-built settlements, a few meaningful staff roles, useful earnings and a single compact in-game guide.

Production rules: repo `../../AGENTS.md` and Bedrock build/quality standards. External game research before new UX or mechanics design, no developer log/TMI/internal implementation text in player-facing content.
