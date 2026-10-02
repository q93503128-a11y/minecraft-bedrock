# Wildbound / 야수각인 Documentation

Last updated: 2026-10-02  
Project: Minecraft Bedrock Wildbound / 야수각인  
Repository role: planning, design canon, implementation status, provenance, and runtime test records.

> Runtime addon source/builds are produced separately unless explicitly promoted into this repository. Static validation never counts as Bedrock runtime validation.

## Canonical documents

- `REMAKE_CANON.md` — binding remake direction and quality bar
- `CURRENT_STATUS.md` — latest build/status and open risks
- `UX_UI_SPEC.md` — UI/UX architecture and acceptance criteria
- `EXTERNAL_ASSET_PROVENANCE.md` — external sources/licenses/integration rules
- `IMPLEMENTATION_ROADMAP.md` — implementation order
- `RUNTIME_TEST_MATRIX.md` — real Bedrock test matrix

## Current runtime baseline

- Current build: `Wildbound_v1.28.2_REMAKE_ALPHA3.mcaddon`
- Data version: `1282`
- ALPHA2 runtime UI/UX verdict: **FAIL**
- ALPHA3 static/package validation: **PASS**
- ALPHA3 actual Bedrock runtime validation: **NOT_RUN**

ALPHA1 was rejected for retaining too much native form UI, broken entity-UV portraits, and excessive periodic work.

ALPHA2 successfully proved custom JSON UI routing worked in-engine, but its UI/UX was also rejected after real screenshots: the fixed 3-panel deck was too cramped, text/card density was too high, the visual hierarchy was poor, and some core paths still used native gray forms.

ALPHA3 is the next runtime checkpoint and specifically targets those failures.

## Documentation rule

Every substantial Wildbound implementation batch must update:
1. `CURRENT_STATUS.md`
2. relevant design/spec docs
3. `EXTERNAL_ASSET_PROVENANCE.md` for third-party changes
4. `RUNTIME_TEST_MATRIX.md` for runtime evidence
5. `IMPLEMENTATION_ROADMAP.md` when milestones move
