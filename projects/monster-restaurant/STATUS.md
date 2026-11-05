# Monster Restaurant — Current Status

Updated: 2026-11-05 (M0.5)

## M0 source and test state

- **State: SOURCE_COMPLETE / STATIC_PASS / PACKAGE_PASS / BDS_GAMETEST_PASS (7/7) / WINDOWS_CLIENT_REVIEW_NOT_RUN / VISUAL_REVIEW_NOT_RUN.**
- Current local Windows package: `Microsoft.MinecraftUWP 1.26.6201.0`. The stable production pack remains pinned to `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- Official stable BDS `1.26.62.1` ran the isolated GameTest suite on the same 26.62 release line.
- Production content remains the mushroom boar, skillet, ingredient, and roast described below. The cooking transaction is factored into `BP/scripts/cooking.js`; both the production form and the isolated GameTest pack use this source.
- The engine log exposed and this change fixed three loader issues in M0: spawn block-filter shape, missing recipe unlock context, and food use modifiers. It also exposed a missing explicit player target filter for the boar's retaliation behavior.
- The developer pack deployment script copied BP/RP into the official GDK development folders after checking their UUIDs. It did not touch the `minecraftWorlds` directory.

## Automated test setup

- Test source: `tests/gametest/BP/`. The test-only pack is kept out of the player `.mcaddon` and has separate UUIDs and a beta `@minecraft/server-gametest` dependency.
- `npm run test:engine` generates the three-pack test set, launches BDS headlessly in `.bds/`, enables the required Beta APIs experiment only in that disposable server world, runs seven tests, and returns the test runner's exit code.
- Latest BDS run: **7 passed, 0 failed**, BDS `1.26.62.1`, duration 6.6 seconds, no unhandled script errors. Result JSON: `.bds/logs/monster-restaurant-results.json`; full transcript: `.bds/logs/2026-11-05T05-48-53-704Z-monster_restaurant.log`.
- The initial failing engine transcript remains at `.bds/logs/2026-11-05T05-09-42-695Z-monster_restaurant.log`; it records the retaliation failure and the loader errors fixed before the passing runs. The JSON summary is intentionally overwritten by the latest run.
- Checked scenarios: custom monster load/health, retaliation after player attack, 1–2 meat drops, ordinary iron-sword kill and drops including auto-pickup, exact cooking consumption/output and first-discovery flag, repeat cooking without rediscovery, full-inventory failure without ingredient loss, and missing-ingredient failure.
- `build:addon` checks the authored spawn-rule contract: forest/taiga tags, grass block/podzol surface, light ceiling, monster population group, and no experimental spawn component. This does not measure natural spawn frequency in a generated client world.
- `npm run build:addon` remains the source/static/package check and is separate from the engine tests. The normal `.mcaddon` still contains only the production BP/RP.
- The official Windows development root was confirmed as `%APPDATA%\Minecraft Bedrock\users\shared\games\com.mojang`; the BP/RP are now present under its `development_behavior_packs` and `development_resource_packs` folders. `tools/deploy_client_dev_packs.ps1` safely refreshes them on later iterations.
- The BDS test world and server binaries live under this project's ignored `.bds/` folder. BDS also writes content logs under `%APPDATA%\Minecraft Bedrock Server\logs`; neither path is the Windows client's `minecraftWorlds` directory.

## Manual verification still required

- Windows client import/reload and client content-log review are not run. BDS GameTests do not prove client parity, custom block use, or successful server-UI rendering.
- The cooking tests invoke the same cooking transaction directly; they do not automate form navigation, cancel/back behavior, touch, controller, or screen-size layout.
- Retaliation and ordinary-attack tests use simulated players. Natural biome/light spawn frequency is not measured.
- Recipe discovery is checked during cooking, but persistence across disconnect/reconnect or server restart is unverified. The current `bds-runner` removes the isolated world's database at run start; simulated players also report empty XUID values, so they do not represent a stable real player identity.
- The model generator regenerated the editable `.bbmodel` sources, geometry, textures, and a walk cycle. Hierarchy/UV metadata were inspected from source JSON, but loading the models through Blockbench MCP timed out, so they were not inspected in the app viewport. No Bedrock screenshot, block-orientation check, UI check, or client content-log review was captured. No visual quality sign-off is granted.
- An initial ordinary-weapon test failed because the player picked up the meat before the test counted ground drops. The assertion now counts both player inventory and ground drops; the subsequent 7/7 run passes. Failed transcripts are retained in `.bds/logs/`.
- GitHub Actions for M0.5 commit `e26fcc6` passed on Ubuntu 24.04, including `build:models`, `build:addon`, and the pinned BDS engine suite; [workflow run](https://github.com/q93503128-a11y/minecraft-bedrock/actions/runs/41976910682). GitHub annotated the run because the upstream Actions versions target Node.js 20 while the runner is forcing Node.js 24; the job still passed.

## M1 entry gate

**Not ready to enter M1.** The 7/7 BDS pass and static spawn-rule contract protect the first functional loop, but client rendering, skillet placement/orientation and forms, natural biome spawns, discovery persistence for a real player, and screenshot-based model/texture review remain open. The test world is isolated under `.bds/`; no Windows player world data was modified.

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

1. In a disposable creative Windows client world, activate the development BP/RP, then check spawn egg, forest/taiga natural spawning, skillet orientation and use, recipe discovery after rejoin, and client content logs. Do not use an existing world.
2. Capture one daylight scene and one close-up screenshot in Bedrock; inspect both `.bbmodel` files in Blockbench for hierarchy, UVs, walk animation, and model render after its MCP session responds.
3. Correct any clipping, scale, texture readability, or skillet orientation visible in those captures.
4. Enter M1 after client persistence/spawn/interaction and screenshot review are recorded.
