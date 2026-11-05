# Wildbound / 야수각인 Documentation

Last updated: 2026-10-02  
Project: Minecraft Bedrock Wildbound / 야수각인

## Current runtime baseline

- Current build: `Wildbound_v1.28.3_REMAKE_ALPHA4.mcaddon`
- Data version: `1283`
- ALPHA1: rejected
- ALPHA2 UI/UX: runtime FAIL
- ALPHA3 UI layout: runtime **HARD FAIL**
- ALPHA4 static/package validation: PASS
- ALPHA4 actual Bedrock runtime validation: NOT_RUN

ALPHA3's custom controls rendered as black vertical strips/floating icons in the user's small Minecraft window. The cause is treated as a layout-engine mistake: fixed logical-pixel blocks exceeded the available logical UI viewport.

ALPHA4 replaces those fixed-total-height layouts with viewport-sized scrolling content.

## Canonical documents

- `REMAKE_CANON.md`
- `CURRENT_STATUS.md`
- `UX_UI_SPEC.md`
- `EXTERNAL_ASSET_PROVENANCE.md`
- `IMPLEMENTATION_ROADMAP.md`
- `RUNTIME_TEST_MATRIX.md`

## Documentation rule

Every substantial implementation batch updates status and all affected specifications. Runtime evidence overrides assumptions from static inspection.
