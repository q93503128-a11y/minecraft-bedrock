# Monster Restaurant — Current Status

Updated: 2026-11-05

## M0 source and test state

- **State: SOURCE_COMPLETE / STATIC_PASS / PACKAGE_PASS / BDS_GAMETEST_PASS / WINDOWS_CLIENT_REVIEW_NOT_RUN.**
- Current local Windows package: `Microsoft.MinecraftUWP 1.26.6201.0`. The stable production pack remains pinned to `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- Official stable BDS `1.26.62.1` ran the isolated GameTest suite on the same 26.62 release line.
- Production content remains the mushroom boar, skillet, ingredient, and roast described below. The cooking transaction is factored into `BP/scripts/cooking.js`; both the production form and the isolated GameTest pack use this source.
- The engine log exposed and this change fixed three loader issues in M0: spawn block-filter shape, missing recipe unlock context, and food use modifiers. It also exposed a missing explicit player target filter for the boar's retaliation behavior.
- The developer pack deployment script copied BP/RP into the official GDK development folders after checking their UUIDs. It did not touch the `minecraftWorlds` directory.

## Automated test setup

- Test source: `tests/gametest/BP/`. The test-only pack is kept out of the player `.mcaddon` and has separate UUIDs and a beta `@minecraft/server-gametest` dependency.
- `npm run test:engine` generates the three-pack test set, launches BDS headlessly in `.bds/`, enables the required Beta APIs experiment only in that disposable server world, runs six tests, and returns the test runner's exit code.
- Latest BDS run: **6 passed, 0 failed**, BDS `1.26.62.1`, duration 19.1 seconds, no unhandled script errors. Result JSON: `.bds/logs/monster-restaurant-results.json`; full transcript: `.bds/logs/2026-11-05T05-21-35-229Z-monster_restaurant.log`.
- The initial failing engine transcript remains at `.bds/logs/2026-11-05T05-09-42-695Z-monster_restaurant.log`; it records the retaliation failure and the loader errors fixed before the passing runs. The JSON summary is intentionally overwritten by the latest run.
- Checked scenarios: custom monster load/health, retaliation after player attack, 1–2 meat drops, exact cooking consumption/output and discovery flag, full-inventory failure without ingredient loss, and missing-ingredient failure.
- `npm run build:addon` remains the source/static/package check and is separate from the engine tests. The normal `.mcaddon` still contains only the production BP/RP.
- The official Windows development root was confirmed as `%APPDATA%\Minecraft Bedrock\users\shared\games\com.mojang`; the BP/RP are now present under its `development_behavior_packs` and `development_resource_packs` folders. `tools/deploy_client_dev_packs.ps1` safely refreshes them on later iterations.
- The BDS test world and server binaries live under this project's ignored `.bds/` folder. BDS also writes content logs under `%APPDATA%\Minecraft Bedrock Server\logs`; neither path is the Windows client's `minecraftWorlds` directory.

## Manual verification still required

- Windows client import/reload and content-log review are not run. BDS GameTests do not prove client parity, custom block use, or successful server-UI rendering.
- The cooking tests invoke the same cooking transaction directly; they do not automate form navigation, cancel/back behavior, touch, controller, or screen-size layout.
- The attack test uses a simulated player. Natural biome/light spawn frequency is not measured.
- The recipe-discovery property is verified in memory after cooking, but persistence across player disconnect/reconnect or server restart is not tested.
- Models, texture mapping, animation, block appearance, icons, and UI have no visual quality sign-off. Blockbench MCP is connected and reports v5.2.1, but it has no active project; no Minecraft client MCP tool was available.
- The GitHub Actions workflow exists but has not yet been run on GitHub.

## Repeatable commands

Run from `projects/monster-restaurant/`:

```powershell
npm ci
npm run build:models
npm run build:addon
npm run test:engine
./tools/deploy_client_dev_packs.ps1
```

The first BDS test run downloads the official server and needs network access. See [tests/gametest/README.md](tests/gametest/README.md) for test boundaries and log locations.

## Next development order

1. Launch the already-deployed development BP/RP in the Windows client, confirm the cooking form and all pack/render logs, and capture a visual inspection.
2. Manually verify natural spawning in forest/taiga and recipe-discovery persistence after disconnect/reconnect; keep client results distinct from BDS results.
3. Inspect `.bbmodel` hierarchy/UVs and model/texture appearance in Blockbench and Bedrock; revise before granting art quality sign-off.
4. Expand toward M1 only after these client gates are recorded.
