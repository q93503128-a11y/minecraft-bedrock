# Headless Bedrock engine tests

These tests run in a separate GameTest behavior pack and are excluded from the player `.mcaddon`. `@minecraft/server-gametest` is beta and the runner enables the required GameTest experiment only in its disposable test world. No Windows client worlds are read or changed.

## Run

```powershell
npm ci
npm run verify
npm run build:engine-tests
npm run test:engine
```

The first engine run downloads the official BDS selected in `bds-runner.json`. Results and server files live under `.bds/`; the checked-in command expects exactly two registered tests and writes its JSON summary there. `test:engine` currently covers the saved production `강건함` effect's max-health scaling at levels 1 and 5, and confirms a simulated player's common core remains in inventory before any selection transaction returns.

The simulated-player test cannot provide trustworthy visual UI or a real form selection. Awarding a level, consuming a core after selection, reconnect persistence, client import, mobile/controller navigation, multiplayer, and world restart are not verified by this suite. The runner resets only its own generated world on each run.

`tests/gametest/BP/structures/gametests/glass_cells.mcstructure` is included unchanged from Microsoft's [`minecraft-scripting-samples`](https://github.com/microsoft/minecraft-scripting-samples) under its [MIT License](https://github.com/microsoft/minecraft-scripting-samples/blob/main/LICENSE).
