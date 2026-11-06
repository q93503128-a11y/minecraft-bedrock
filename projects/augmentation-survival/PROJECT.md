# Augmentation Survival for Bedrock

## Source of truth

This is a Bedrock port of `projects/augmentation-survival/` in `q93503128-a11y/minecraft-java-mod-builds`. It does not invent an additional growth track. The Java repository is read-only. Canon priority is preserved: `AUGMENTS.md` → `AUGMENT_PROPOSAL_HISTORY.md` → `GAME_DESIGN.md` → `PROJECT.md` → `MODPACK_BASELINE.md` → implementation. The original canon files copied to `docs/java-canon/` are byte-for-byte snapshots from Java revision `5962141975b1fea600b0bdb2ae9b697dc7de9cb5`; the project subtree was rechecked against current `main` revision `7f578f6acbbe6ed5f12e4665fbe28dfde65f294f` and is unchanged.

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
- Using a core presents up to three eligible, unmaxed augments of that core's tier. The current server filter enables nine common augments with BDS evidence (`날 선 감각`, `정확한 조준`, `질긴 피부`, `가벼운 착지`, `튼튼한 폐`, `풍작`, `씨앗 챙기기`, `든든한 한 끼`, and `물갈퀴`); `강건함` is withheld because the current effect is +4 HP/level against Java's +2, and the other 139 are not yet offerable. Higher-tier cores with no verified candidates are preserved with a clear message. The selection remains pending until the server confirms the player still has a core; only then is one core removed and the selected level saved.
- Form locks and pending choices carry session tokens. Player leave clears their UI state, and an older delayed form response cannot clear or commit over a later session.
- The basic device opens a paged, read-only inventory of owned augments.
- The advanced device offers the canonical five 3:1 adjacent-tier synthesis transactions. Inputs are checked and consumed on the server; output failure triggers an input rollback.
- Player augment levels are stored in a versioned dynamic property, intended to survive relog/restart through Bedrock entity persistence; persistence across actual reconnects has not yet been tested.
- `강건함` currently uses the stable `health_boost` effect, refreshed after spawn and every 200 ticks from the saved level. BDS measures +4 health points per level, while Java canon specifies +2; this is a known numeric mismatch, not a completed port. The stable health component exposes a read-only effective maximum, so exact parity needs a different supported mechanism.
- The shared server damage handler partially ports `날 선 감각`, `정확한 조준`, `질긴 피부`, `가벼운 착지`, and `튼튼한 폐`. BDS verifies Keen Edge's level 5 synthetic root melee event and Precise Aim's exact owner-attributed projectile curve at levels 1–5 (4% per level). The API route multiplies the latter by 20%, while owner attribution alone cannot distinguish every `ROOT_PROJECTILE` from a player-owned `DERIVED_PROJECTILE`; an actual arrow collision test did not reach its target. Natural fall/drowning, Java's post-mitigation order, delayed-damage provenance, and client acquisition remain unverified, so each effect remains partial.
- `풍작` uses the stable player-break after-event and applies Java's 8% per-level chance (up to 40%) to mature wheat, carrots, potatoes, and beetroot, spawning one ordinary crop product. `씨앗 챙기기` independently rolls 15% per level (up to 45%) and adds the crop's mapped planting item. Java performs the Bumper Crop roll before the Seed Saver roll; BDS verifies both exact curves, their separate roll order, simultaneous success, maturity checks, and all four product/planting-item mappings with synthetic event data. Live block-breaking, Silk Touch/tool-specific drops, and Java external crops remain unverified. Both compatibility rows are partial, not complete.
- `든든한 한 끼` adds Java's 8% / 16% / 24% of the food's vanilla saturation gain. The production handler subscribes to stable `itemCompleteUse`, reads exact data-driven food values where exposed, and measures vanilla food's saturation change from adjacent server ticks. BDS 1.26.62.1 verifies actual cooked-beef consumption at all three levels and the food saturation cap. The stable API reference describes this event as chargeable-item completion, and only cooked beef has been tested for this route; see [the compatibility report](docs/API_COMPATIBILITY_2026-11-06.md) before treating other food/engine combinations as proven.
- `물갈퀴` adds Java's 10% / 20% / 30% swim-speed bonus only while in water. The production handler applies the stable `minecraft:underwater_movement` attribute from the saved level and restores its default value out of water. BDS 1.26.62.1 verifies the production handler's actual swimming velocity at all three levels and the reset; coexistence with other add-ons modifying the same attribute and real-client feel remain untested. See [the compatibility report](docs/API_COMPATIBILITY_2026-11-06.md).
- `낚시 감각` remains disabled and unported. Java scales the private vanilla hook timer by 10% / 20% / 30%; the current stable API exposes rod-use events and the hook entity but no bite event or timer setter. The BDS probe confirmed that the spawned hook exposes only its generic projectile component among the queried components. A Lure or custom-rod replacement would change vanilla timing/item behavior and would not preserve Java's percentage rule. See [the compatibility report](docs/API_COMPATIBILITY_2026-11-06.md).
- `숨 오래 참기` remains disabled and unported. Java's oxygen attribute yields 10% / 20% / 30% longer underwater breath duration. Stable `minecraft:breathable.totalSupply` is read-only; `airSupply` is marked pre-release in the official reference, omitted from stable API declarations, and absent from the tested BDS player component. Water Breathing would not preserve the percentage reduction. See [the compatibility report](docs/API_COMPATIBILITY_2026-11-06.md).

## Isolated BDS checks

```powershell
npm run build:engine-tests
npm run test:engine
```

The tests use a separate GameTest pack with the Beta APIs experiment in a runner-owned disposable world. It does not modify client worlds and is excluded from the player `.mcaddon`. See [the test notes](tests/gametest/README.md).

Remaining acquisition sources, device block UI, second-choice transactions, all other gameplay effects, active management/use, threat, interactions, and full multiplayer behavior remain in the port matrix as unported or unassessed.
