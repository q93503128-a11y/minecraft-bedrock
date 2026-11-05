# Wildbound UI / UX Specification

Last updated: 2026-10-02

## Primary rule

Readability and stable interaction outrank information density.

## Rejected layouts

### ALPHA2
Fixed 3-column `party | storage | detail` was too cramped.

### ALPHA3
The stacked layout still used a fixed total of many logical-pixel blocks. In a small Minecraft window, the logical UI viewport became shorter than the designed content height and the controls collapsed into strips/overlays.

Therefore:

**No core Wildbound screen may assume its entire content fits vertically.**

## ALPHA4 layout rule

Every core screen has:
- one bounded outer shell;
- fixed small header/close region;
- one viewport-sized scrolling body;
- content-sized vertical stack inside that scroll body.

If content is taller than the window, it scrolls. It must never compress into unreadable strips.

## Deck information architecture

Order:
1. selected creature summary
2. PARTY
   - 2x2 party slots
3. STORAGE
   - 2x3 stored creature cards per page
4. NAVIGATION / management actions

Cards prioritize:
- name
- level
- role
- selected/party/injury/growth marker

Advanced stats remain secondary.

## UX budgets

- inspect: 1 selection
- deploy: <=2 inputs when an empty slot exists
- full-party replacement: select creature -> deploy -> visible party slot
- ability/evolution/detail: <=2 inputs after selection
- page/selection state persists where practical

## Portrait policy

Never display raw entity UV skins as portraits. A stable role/icon fallback is better than a broken pseudo-portrait until a dedicated portrait pipeline exists.

## Visual language

- dark slate base
- muted gold accent
- danger red only for destructive state
- one consistent custom shell
- high-contrast Korean text
- no mixed native-gray/custom core flow

## Device acceptance

Highest priority:
- the exact small desktop window that broke ALPHA3.

Then:
- 1280x720
- 1920x1080
- tablet/mobile sizes
- controller/touch
- GUI scale variants

## Immediate failure conditions

- black strips or collapsed controls
- detached icons/text over world
- overlapping labels/cards
- unreadable Korean
- core path returning to legacy gray menu
- inability to scroll to controls
- broken controller/touch focus
- UV-sheet icons

ALPHA4 is not accepted until real Bedrock passes the small-window gate.
