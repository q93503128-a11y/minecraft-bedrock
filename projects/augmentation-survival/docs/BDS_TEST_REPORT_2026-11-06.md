# BDS test report — 2026-11-06

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Harness: `@bedrock-core/bds-runner` 0.2.1; isolated BP/RP/GameTest packs; GameTest experiment active only in the disposable test world.
- Commands: `npm run verify` and `npm run test:engine`.
- Static checks: **8/8 PASS**.
- Stable production API type-check: **PASS** (`@minecraft/server` 2.11.0).
- Add-on package: **PASS**, `build/AugmentationSurvival-0.1.0.mcaddon` (41,391 bytes).
- BDS: **17 passed / 0 failed**, 23.2 seconds, no script or infrastructure errors; runner exit code **0**. Machine-readable output is `BDS_TEST_RESULTS_2026-11-06.json`.

The sixteen tests from the preceding run also passed in this regression run. Their coverage and limits are detailed in [the 2026-11-05 report](BDS_TEST_REPORT_2026-11-05.md), the Hearty Meal result below, and the Water Movement result below. The fishing probe is diagnostic only:

| GameTest | Result | What it establishes |
| --- | --- | --- |
| `hearty_meal_matches_java_levels_and_food_cap` | PASS (partial port) | Four simulated players consume cooked beef through the production BP handler. Starting at hunger 10/saturation 0, levels 1–3 finish at saturation 13.824 / 14.848 / 15.872. A level-3 player starting at hunger 12/saturation 10 reaches the saturation cap of 20. Each player consumes one item from a two-beef stack. The expected values are Java's 8/16/24% of cooked beef's 12.8 vanilla saturation gain. |
| `webbed_feet_scales_server_swim_speed_by_level` | PASS (partial port) | Four simulated players (control and levels 1–3) swim in a filled pool through the production BP handler. Their measured forward-velocity ratios match 1.10 / 1.20 / 1.30 within 0.015, and the component reads 0.022 / 0.024 / 0.026 from the 0.020 default. After teleporting out of water, all three levels restore the default component value. |
| `fishing_hook_stable_api_surface_probe` | PASS (diagnostic only) | BDS 1.26.62.1 SimulatedPlayer cast a vanilla fishing rod (`useResult=true`); the probe observed `entitySpawn`, `itemUse`, `itemStartUse`, and `itemStopUse` for the cast and found one owned `minecraft:fishing_hook`. Of the tested component IDs, only `minecraft:projectile` was present; `minecraft:fishing_hook` and `minecraft:timer` were absent. This probe does not wait for a natural bite or test Fishing Sense gameplay. |

The test-only production wrapper seeds the saved augment level in the production BP's dynamic-property namespace; the production handler owns the effect. An exploratory probe established that BDS 1.26.62.1 emits `itemCompleteUse` for cooked beef after the vanilla food update, although stable API documentation describes this event for chargeable items. Vanilla cooked beef did not expose `minecraft:food`, so the production handler inferred the gain from adjacent server-tick saturation samples. This test does not establish event behavior for all food items or engine builds, nor exclude unrelated same-tick saturation changes.

The earlier cooked-beef test initially expected hunger 20 after eating steak from hunger 10. The correct vanilla result is 18; the assertion was fixed and its 15-test run passed. The latest 17-test run also passed the water-movement coverage and the fishing API-surface probe. Earlier failed attempts are not counted as passing results.

Client import and visual UI review, mobile/controller navigation, reconnect persistence, real multiplayer, real block-break delivery, natural melee/fall/drowning, and real player projectile collision remain untested. See `STATUS.md` for the exact continuation point.
