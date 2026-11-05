# Augmentation Survival for Bedrock

## Source of truth

This is a Bedrock port of `projects/augmentation-survival/` in `q93503128-a11y/minecraft-java-mod-builds`. It does not invent an additional growth track. The Java repository is read-only. Canon priority is preserved: `AUGMENTS.md` → `AUGMENT_PROPOSAL_HISTORY.md` → `GAME_DESIGN.md` → `PROJECT.md` → `MODPACK_BASELINE.md` → implementation. The original canon files copied to `docs/java-canon/` are byte-for-byte snapshots from Java revision `e4b2dd41e1564a4b713c722a004f87e76921c0da`, the latest `main` observed for this work.

See [STATUS.md](STATUS.md), the generated [149-entry port matrix](docs/PORT_MATRIX.csv), and [implementation decisions](docs/PORT_DECISIONS.md).

## Bedrock target

- Installed client observed on the development machine: Minecraft Bedrock `1.26.62.01` (Windows package version `1.26.6201.0`).
- Minimum engine manifest: `1.26.0`.
- Script APIs: stable `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. No preview module or experimental toggle is declared.
- Supported interfaces: touch, controller focus/navigation, keyboard/mouse through normal item use and forms. No Java-style key binding is assumed.
- Behavior namespace: `augmentation_survival`.
- BP UUID: `365c78a0-d74a-4f42-8e4b-2c147e1dc447`.
- RP UUID: `e92ec459-cc68-452e-92f3-040ff9e602ae`.
- Script-owned data key: `augmentation_survival:levels_v1` on the player entity.
- World support: new or existing worlds, subject to import of both packs. Existing-world migration has not yet been play-tested.

## Build and local checks

From this folder, install the pinned type-check dependencies once, then verify and build:

```powershell
npm ci
npm run verify
```

The pack is generated at `build/AugmentationSurvival-0.1.0.mcaddon`. The build only packages source under `BP/` and `RP/`; it does not replace those files.

## Implemented gameplay slice

- Exact Java-shaped recipe for a common core and both device tiers.
- Using a core presents up to three eligible, unmaxed augments of that core's tier. The selection remains pending until the server confirms the player still has a core; only then is one core removed and the selected level saved.
- Form locks and pending choices carry session tokens. Player leave clears their UI state, and an older delayed form response cannot clear or commit over a later session.
- The basic device opens a paged, read-only inventory of owned augments.
- The advanced device offers the canonical five 3:1 adjacent-tier synthesis transactions. Inputs are checked and consumed on the server; output failure triggers an input rollback.
- Player augment levels are stored in a versioned dynamic property, intended to survive relog/restart through Bedrock entity persistence; persistence across actual reconnects has not yet been tested.
- `강건함` currently uses the stable `health_boost` effect, refreshed after spawn and every 200 ticks from the saved level. BDS measures +4 health points per level, while Java canon specifies +2; this is a known numeric mismatch, not a completed port. The stable health component exposes a read-only effective maximum, so exact parity needs a different supported mechanism.

## Isolated BDS checks

```powershell
npm run build:engine-tests
npm run test:engine
```

The tests use a separate GameTest pack with the Beta APIs experiment in a runner-owned disposable world. It does not modify client worlds and is excluded from the player `.mcaddon`. See [the test notes](tests/gametest/README.md).

Remaining acquisition sources, device block UI, second-choice transactions, all other gameplay effects, active management/use, threat, interactions, and full multiplayer behavior remain in the port matrix as unported or unassessed.
