# Wildbound Runtime Test Matrix

Last updated: 2026-10-02  
Current target build: `Wildbound_v1.28.3_REMAKE_ALPHA4.mcaddon`

Legend: NOT_RUN / PASS / FAIL / PARTIAL

## Recorded runtime evidence

### ALPHA2
- custom JSON UI routing: PASS
- overall UI/UX: FAIL
- reasons: cramped 3-column layout, poor hierarchy, mixed native/custom flow.

### ALPHA3
- world/add-on reached runtime: PASS
- custom Wildbound elements attempted to render: PASS
- coherent UI window: **FAIL**
- small-window layout: **HARD FAIL**
- observed: black vertical strips, floating/detached icons and text over the player/world.
- cause recorded: fixed logical-pixel content exceeded the available logical viewport.

## ALPHA4 — first gate

Use the same small window.

| Test | Status |
| --- | --- |
| Beast Seal opens one coherent Wildbound screen | NOT_RUN |
| no black strips/floating controls | NOT_RUN |
| header/frame intact | NOT_RUN |
| body scrolls vertically when needed | NOT_RUN |
| card widths remain readable | NOT_RUN |
| Korean text readable | NOT_RUN |
| scrollbar/mouse wheel reaches all controls | NOT_RUN |

If any of the first six fail, stop deeper testing.

## Deck

| Test | Status |
| --- | --- |
| selected summary visible | NOT_RUN |
| party 2x2 readable | NOT_RUN |
| storage 2x3 readable | NOT_RUN |
| navigation reachable through scroll | NOT_RUN |
| selection/page state persists | NOT_RUN |
| full-party replacement stays in deck flow | NOT_RUN |
| no UV-sheet portraits | NOT_RUN |

## Other core screens

Hub / Companion / Growth / Compass / Ranch / Bestiary / Presets / Settings / Guide: all NOT_RUN.

Requirement: same custom shell and safe vertical scrolling where necessary.

## Performance

Idle / four companions / mob-dense / boss / ranch / ranch+combat / multiplayer: NOT_RUN.

## External models

Thornback and abyss/crab geometry/texture/scale/orientation/animations: NOT_RUN regression.

## Bosses

Telegraph-before-hit, dodge window, matching visual hit zone, cleanup: NOT_RUN.

## Ranch

Custom screen, storage priority, duplication/loss, unload/reload, multiplayer ownership: NOT_RUN.

## Save migration

Storage, active party, levels/evolution, ranch, duplication, repeated save/rejoin: NOT_RUN.

Static validation never changes NOT_RUN to PASS.
