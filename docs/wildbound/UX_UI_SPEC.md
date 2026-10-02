# Wildbound UI / UX Specification

Last updated: 2026-10-02

## 1. Primary UX objective

Creature management must feel like one coherent workspace rather than a chain of modal menus.

The user should be able to understand:

- current party
- stored creatures
- selected creature
- available actions

without repeatedly closing and reopening forms.

## 2. Target desktop/tablet layout

Primary creature deck:

- **left panel:** active party, 4 fixed slots
- **center panel:** storage grid/list
- **right panel:** selected creature summary and actions

Selected creature details should update without losing the storage context.

Initial ALPHA2 implementation target uses a 2-column x 6-row storage presentation for readability rather than forcing a dense 3-column layout.

## 3. Primary actions and input budgets

Target input counts from the deck:

- inspect creature: 1 selection
- deploy into empty party slot: <= 2 inputs
- replace party member when full: creature -> deploy -> target party slot, without opening a separate replacement dialog
- inspect abilities: <= 2 inputs after creature selection
- inspect evolution: <= 2 inputs after creature selection
- return to deck after an action: selected creature and page should remain when possible

Do not force:
`storage -> creature -> card -> quick manage -> detail -> ability`

for a common inspection task.

## 4. Persistent state

While the management session remains active, preserve where practical:

- selected creature
- storage page
- active search/filter
- party replacement mode
- previously viewed management context

Closing and reopening should not unnecessarily reset to page 1 when a better state can be preserved safely.

## 5. Navigation rules

- Back/close position must be predictable.
- Page controls must not require scrolling to the bottom of a long list.
- Search/filter controls should remain near the storage header.
- Main management actions must not be mixed with destructive actions.
- Controller focus order must follow the visual layout.
- Touch targets must be large enough for mobile use.

## 6. Information hierarchy

Default creature card/summary should prioritize:

1. name
2. level
3. role/type
4. HP/status
5. evolution-ready / awakening/rare state
6. party assignment

Advanced numeric detail belongs in secondary detail views:

- exact multipliers
- mastery XP
- cooldown efficiency
- hidden/advanced training values
- detailed trait modifiers

Do not dump all stats into the first screen.

## 7. Portrait/icon policy

Never use a Minecraft entity skin/UV sheet directly as a UI portrait.

Valid options:

- dedicated portrait texture
- purpose-made icon
- approved rendered thumbnail pipeline
- role/class icon as a safe fallback

Fallback icons must be visually stable and must not show disassembled body texture pieces.

## 8. Visual implementation direction

Current remake uses JSON UI routing rather than trying to style the default ActionForm stack.

Target implementation principles:

- Wildbound-specific namespace
- minimal override of vanilla `server_form.json`
- separate Wildbound UI definition files
- actual panel/frame assets, not decorative button-icon misuse
- selected/hover/disabled states
- readable contrast
- restrained use of color

External UI art may be used only with compatible licensing/provenance.

## 9. Device requirements

Must be checked on:

- 16:9 desktop
- 16:10 / taller desktop
- 360x640-class mobile
- 390x844-class mobile
- 412x915-class mobile
- tablet
- controller navigation
- UI scaling where practical

Desktop success does not imply mobile success.

## 10. Failure conditions

Reject the UI/UX checkpoint if:

- it still visually behaves like the legacy gray vertical form chain
- storage requires excessive scrolling for basic navigation
- party state is hidden while choosing replacements
- creature selection is lost after ordinary actions
- dangerous actions are adjacent to routine actions without separation
- icons are broken/UV-sliced
- labels clip at common Korean text lengths
- controller focus is unpredictable
- mobile targets are too small
- substantial input count is added to common operations

## 11. ALPHA2 status

Implemented statically in `v1.28.1 REMAKE ALPHA2`:

- custom server-form routing
- custom main/deck/ranch screens
- party + storage + selected creature layout
- same-screen party replacement mode
- broken entity-skin portrait usage removed
- Kenney-derived UI panel assets integrated

Runtime status: **NOT_RUN**. Real Bedrock rendering/focus/scaling must be validated before this spec is considered satisfied.
