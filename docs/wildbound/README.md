# Wildbound / 야수각인 Documentation

Last updated: 2026-10-02  
Project: Minecraft Bedrock Wildbound / 야수각인  
Repository role: planning, design canon, implementation status, provenance, and runtime test records.

> Runtime addon source/builds are produced separately unless explicitly promoted into this repository. A document saying a feature is implemented means it exists in the referenced build; it does not mean Bedrock runtime validation has passed.

## Canonical documents

- `REMAKE_CANON.md` — binding remake direction and quality bar
- `CURRENT_STATUS.md` — latest known build/status and open risks
- `UX_UI_SPEC.md` — UI/UX architecture and acceptance criteria
- `EXTERNAL_ASSET_PROVENANCE.md` — external model/UI sources, licenses, and integration rules
- `IMPLEMENTATION_ROADMAP.md` — staged implementation order
- `RUNTIME_TEST_MATRIX.md` — real Bedrock test matrix

## Current runtime baseline

Current local build at the time this documentation was created:

- `Wildbound_v1.28.1_REMAKE_ALPHA2.mcaddon`
- data version: `1281`
- source baseline: clean `v1.27.7`, not ALPHA1
- static validation: passed
- real Bedrock runtime validation: **NOT_RUN after ALPHA2 rebuild**

ALPHA1 is rejected as a remake-quality baseline. It retained too much ActionForm UI, misused entity skin textures as icons, and added excessive periodic runtime work.

## Documentation rule

Every substantial Wildbound implementation batch must update at least:

1. `CURRENT_STATUS.md`
2. the relevant design/spec document if behavior changed
3. `EXTERNAL_ASSET_PROVENANCE.md` when any third-party asset/source changes
4. `RUNTIME_TEST_MATRIX.md` when a runtime result is observed
5. `IMPLEMENTATION_ROADMAP.md` when milestones move

Do not allow runtime work and planning docs to drift apart.
