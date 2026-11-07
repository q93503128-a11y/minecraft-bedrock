# Duskveil Status Window Lab

- Slug: `status-window-lab`
- Namespace: UI-only. The pack has no combat, progression, equipment, item, or economy systems.
- Target client: Minecraft Bedrock 1.26.6301.0 (installed retail package metadata observed locally; actual add-on import/rendering not yet tested).
- Stable Script API: `@minecraft/server` 2.11.0; `@minecraft/server-ui` 2.3.0.
- Packs: `BP/` and `RP/`; the behavior pack depends on the resource pack for original image assets.
- Open: hold a compass and use it. Close with the form's close control or the platform back button.
- Build: `python tools/build_addon.py` from this folder, or `npm run build`.
- Validation: `npm run verify` checks source consistency and archives. These checks do not replace the in-game checks in `docs/INSTALL_AND_TEST.md`.
- Installation: import the built `.mcaddon`, then enable both packs in a new test world.

## Data contract

Live from the player object: player name, vanilla experience level, current/max health, and current/next-level XP. These values refresh while the screen is open.

Demonstration values: RPG class, attack, defense, movement percentage, item names, and equipment. The screen labels these values as a sample record. No values are written to the world or saved between sessions.

## Scope

This is an independent visual and interaction experiment. It does not change any existing project. No experimental pack capabilities are enabled. It uses the stable `CustomForm` API and custom Resource Pack images rather than HTML custom UI.
