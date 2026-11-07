# Install and test

## Build

From `projects/status-window-lab/`:

```powershell
npm run verify
```

This uses only the Python standard library and the Node runtime for JavaScript syntax checking. The output is `build/DuskveilStatusWindow-0.1.0.mcaddon`.

## Import and open

1. Open the `.mcaddon` with Minecraft Bedrock and wait for both packs to import.
2. Create a new Creative test world. Enable `Duskveil Status Window BP` and `Duskveil Status Window RP` in the world resource settings.
3. Join the world and run `/give @s minecraft:compass` once.
4. Hold the compass and use it to open the status form. Use the `장비 기록 보기` and `개요로 돌아가기` buttons to switch pages. Use the close control or the platform back button to close it.

Use a new test world; this experiment does not require changes to an existing world.

## Preflight results (2026-11-07)

| Check | Result | Evidence |
| --- | --- | --- |
| Source consistency | PASS | `npm run verify`: JSON, manifest UUIDs, stable API versions, all 7 referenced UI textures, and JavaScript syntax checked. |
| Reproducible package | PASS | `.mcaddon` built at 250,605 bytes; embedded pack archive CRCs pass. SHA-256: `B1D3096FE2D6B63BECB7F12B07AEE37C001F788E48FC04C8B0324591E95DCD81`. |
| Installed client package | OBSERVED | Windows package metadata reports `Microsoft.MinecraftUWP 1.26.6301.0`; this does not prove import or in-game compatibility. |
| In-game behavior and appearance | NOT_RUN | Requires manual game operation and screenshots. |

## Planned visual matrix

Record actual display results in the table below. Keep screenshots in `docs/screenshots/` and name them with client resolution, UI scale, and page.

| Case | Resolution / window | UI scale | Page | Result | Screenshot |
| --- | --- | --- | --- | --- | --- |
| Normal PC | NOT_RUN | NOT_RUN | Overview + Equipment | NOT_RUN | NOT_RUN |
| Small PC window | NOT_RUN | NOT_RUN | Overview + Equipment | NOT_RUN | NOT_RUN |
| Large UI scale | NOT_RUN | NOT_RUN | Overview + Equipment | NOT_RUN | NOT_RUN |
| Mobile | NOT_RUN | NOT_RUN | Both | NOT_RUN | NOT_RUN |
| Controller | NOT_RUN | NOT_RUN | Both | NOT_RUN | NOT_RUN |

Computer-use automation was stopped at the user's request. The runtime matrix remains open until a person imports the add-on and records direct observations. Save screenshots under `docs/screenshots/`; avoid including account identifiers in any screenshot committed to the public repository.

## Known limits before runtime review

- The app's native form renderer sets panel layout; the image-based banner and equipment art are composed inside that form.
- Only player name, vanilla level, health, and XP are read from the live player. RPG class, attack, defense, movement, and equipment are examples.
- Mobile and controller navigation depend on the installed client and input hardware and remain unverified until tested there.
