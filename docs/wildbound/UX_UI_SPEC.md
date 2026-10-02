# Wildbound UI / UX Specification

Last updated: 2026-10-02

## 1. Primary UX objective

Creature management must be one coherent workspace with readable decisions, not a chain of modal menus and not a dense dashboard that becomes unreadable when the game window shrinks.

## 2. Runtime lesson from ALPHA2

ALPHA2's fixed `party | storage | detail` three-column layout is **rejected**.

The concept was reasonable at large width, but real Bedrock screenshots at a smaller window showed:
- three narrow columns;
- tiny text;
- excessive information per card;
- weak selected-state hierarchy;
- poor visual balance;
- mixed custom/native screen language.

Therefore, “show everything side by side” is no longer a binding requirement. Readability takes priority.

## 3. ALPHA3 deck layout

The core deck is ordered vertically:

**selected creature summary -> party 2x2 -> storage 2x3 -> fixed bottom toolbar**

Reasons:
- each interactive card keeps roughly half-screen width even in a narrow window;
- party remains visible;
- selection context remains visible;
- storage remains directly accessible;
- navigation controls never require scrolling.

Storage page size is 6.

## 4. Input budgets

Targets:
- inspect creature: 1 selection
- deploy into empty party slot: <= 2 inputs
- replace when party is full: creature -> deploy -> one of four visible party slots
- ability/evolution/detail: <= 2 inputs after selection
- return to deck without losing page/selection where possible

Do not restore long chains such as:
`storage -> creature -> card -> quick manage -> detail -> ability`.

## 5. Information hierarchy

Storage cards:
1. selected/party/injury marker
2. name
3. level
4. role
5. at most one compact growth marker

Selected summary:
- name/grade/status
- level/role/trait
- attack and unlocked ability count
- next growth state or replacement-mode instruction

Advanced statistics stay in secondary views.

## 6. Navigation

- bottom navigation/action positions are fixed;
- back/hub behavior is predictable;
- selection/page/filter state persists where practical;
- dangerous actions are kept out of the default deck toolbar;
- controller focus must follow visual order;
- touch targets must remain usable at mobile scale.

## 7. Portrait/icon policy

Never display a Minecraft entity skin/UV sheet directly as a portrait.

Until a real dedicated portrait pipeline exists, a stable role/item emblem or text-first card is preferable to a broken or misleading pseudo-portrait.

## 8. Visual language

Current target:
- dark slate base
- muted gold accent
- red only for destructive/danger state
- one consistent panel family
- high-contrast Korean text
- minimal simultaneous accent colors

External Kenney CC0 panel shapes remain the source basis, but ALPHA3 palette-adjusts them into a consistent Wildbound theme.

## 9. Core custom-routed screens

ALPHA3 routes these through the Wildbound visual system:
- main hub
- deck/storage
- companion management
- ranch
- guide / guide pages
- growth
- exploration compass
- settings
- party presets / preset slot
- bestiary

Native Bedrock dialogs may still be used for small confirmations, text fields and destructive confirmation steps.

## 10. Device/runtime requirements

Must test:
- same small desktop window that exposed ALPHA2
- 1920x1080
- 1280x720
- 768x1024
- 412x915
- 390x844
- 360x640
- controller
- touch
- GUI scale variations

## 11. Failure conditions

Reject the checkpoint if:
- core flow falls back to the old gray vertical menu;
- the small window recreates ALPHA2-level text/card crowding;
- labels overlap/clip;
- party is hidden during replacement;
- page/filter/selection state is lost unnecessarily;
- controller focus is inconsistent;
- mobile touch targets become too small;
- UV-sheet portraits return;
- visual polish increases input count.

## 12. Status

ALPHA2: **runtime FAIL** for UI/UX.

ALPHA3: **static implementation complete, runtime NOT_RUN**.
