# Headless Bedrock engine tests

These tests use the pre-release `@minecraft/server-gametest` module in a separate test behavior pack. They are intentionally excluded from the player `.mcaddon` and do not change the stable API dependencies or experiments required by the production BP/RP.

The test pack is combined with copies of the production BP/RP in a disposable BDS test instance. The BDS runner keeps its server files, generated test world, console transcripts, and JSON result under `.bds/`; it does not read or write the Windows client's `minecraftWorlds` directory. Each run clears the database for the runner-owned `bc-test` world and uses a dedicated port with LAN visibility disabled by default. BDS itself also writes engine content logs to `%APPDATA%\Minecraft Bedrock Server\logs` on Windows.

## Run

From `projects/monster-restaurant/`:

```powershell
npm ci
npm run build:engine-tests
npm run test:engine
```

The first engine run downloads the official BDS build selected by `bds-runner.json`, so it needs network access and can take several minutes. `npm run test:engine` regenerates the test pack, runs seven GameTests, and writes a machine-readable summary to `.bds/logs/monster-restaurant-results.json`; the full BDS console transcript is in `.bds/logs/`. Exit code 1 means a GameTest failed; exit code 2 means the harness could not prove a trustworthy run.

`npm run deploy:client-dev-packs` copies the production BP/RP into the official Windows development-pack folders. It never touches `minecraftWorlds`. Existing destinations are updated only when their manifest UUID matches this project; a conflicting folder causes the script to stop. Restart Bedrock or reload the development packs to see changes.

## What is covered

- Engine loads the custom boar and reports its configured health.
- The boar retaliates against a simulated player after being attacked.
- Killing the boar produces 1–2 of the configured meat item.
- Defeating the boar with ordinary iron-sword attacks produces 1–2 meat, including when the simulated player picks it up.
- The production cooking function consumes exactly one meat, grants one roast, and marks the player's recipe-discovery property.
- A second cook consumes one more ingredient and grants one more meal without rediscovering the recipe.
- Missing ingredients and a full inventory do not grant food or consume an ingredient.
- `build:addon` checks the production spawn-rule contract (forest/taiga, grass block/podzol, surface, light ceiling, monster population, and no experimental spawn component).

The cooking tests call the same `BP/scripts/cooking.js` source copied into the test pack. They do not automate the ActionForm UI itself. GameTest's simulated player cannot provide meaningful visual UI review or Windows-client input coverage. Natural biome/light spawn rates and player-property persistence across disconnect/server restart remain unverified. The current `bds-runner` resets the isolated world's database before each run, and simulated players report an empty XUID in BDS logs, so neither can prove a real player's recipe property across restarts. Models, textures, animation rendering, and UI visual quality are not assessed by BDS tests.

## Version and stability notes

The production pack remains pinned to stable `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. The test pack separately pins the documented `@minecraft/server-gametest` beta alias `1.0.0-beta`; a BDS GameTest world must enable the Beta APIs experiment. GameTest APIs are experimental and can change between engine builds. `bds-runner.json` pins the official server at `1.26.62.1`, records that exact server build in each result, and the runner fails closed if the engine no longer reports test registration or verdicts in the expected format. The launcher dependency `@bedrock-core/bds-runner` is third-party beta software pinned to 0.2.1 in `package-lock.json`; review its release notes before upgrading.

The included `glass_cells.mcstructure` file is from Microsoft's [`minecraft-scripting-samples`](https://github.com/microsoft/minecraft-scripting-samples) repository. That repository uses the [MIT License](https://github.com/microsoft/minecraft-scripting-samples/blob/main/LICENSE); the structure is included unchanged.
