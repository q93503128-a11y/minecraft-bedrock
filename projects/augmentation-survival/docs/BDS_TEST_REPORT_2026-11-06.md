# BDS test report — 2026-11-06

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Harness: `@bedrock-core/bds-runner` 0.2.1; isolated BP/RP/GameTest packs; GameTest experiment active only in the disposable test world.
- Commands: `npm run verify` and `npm run test:engine`.
- Static checks: **7/7 PASS**.
- Stable production API type-check: **PASS** (`@minecraft/server` 2.11.0).
- Add-on package: **PASS**, `build/AugmentationSurvival-0.1.0.mcaddon` (39,953 bytes).
- BDS: **15 passed / 0 failed**, 8.2 seconds, no script or infrastructure errors; runner exit code **0**. Machine-readable output is `BDS_TEST_RESULTS_2026-11-06.json`.

The fourteen pre-existing GameTests also passed in this regression run. Their coverage and limits are detailed in [the 2026-11-05 report](BDS_TEST_REPORT_2026-11-05.md). The added test is:

| GameTest | Result | What it establishes |
| --- | --- | --- |
| `hearty_meal_matches_java_levels_and_food_cap` | PASS (partial port) | Four simulated players consume cooked beef through the production BP handler. Starting at hunger 10/saturation 0, levels 1–3 finish at saturation 13.824 / 14.848 / 15.872. A level-3 player starting at hunger 12/saturation 10 reaches the saturation cap of 20. Each player consumes one item from a two-beef stack. The expected values are Java's 8/16/24% of cooked beef's 12.8 vanilla saturation gain. |

The test-only production wrapper seeds the saved augment level in the production BP's dynamic-property namespace; the production handler owns the effect. An exploratory probe established that BDS 1.26.62.1 emits `itemCompleteUse` for cooked beef after the vanilla food update, although stable API documentation describes this event for chargeable items. Vanilla cooked beef did not expose `minecraft:food`, so the production handler inferred the gain from adjacent server-tick saturation samples. This test does not establish event behavior for all food items or engine builds, nor exclude unrelated same-tick saturation changes.

An initial attempt failed only because the test expected hunger 20 after eating steak from hunger 10. The correct vanilla result is 18; the assertion was fixed and the full 15-test run then passed. The earlier failed attempt is not counted as a passing result.

Client import and visual UI review, mobile/controller navigation, reconnect persistence, real multiplayer, real block-break delivery, natural melee/fall/drowning, and real player projectile collision remain untested. See `STATUS.md` for the exact continuation point.
