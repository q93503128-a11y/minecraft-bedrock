# BDS test report — 2026-11-07

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Stable Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- `npm run verify`: **PASS** — 28 static checks, stable API type-check, and `.mcaddon` package build (**57,253 bytes**).
- Command: `npm run test:engine`.
- GameTests: **42 passed / 0 failed**, 22,455 ms; no regressions, script errors, or infrastructure errors.
- Machine-readable results: [`BDS_TEST_RESULTS_2026-11-07.json`](BDS_TEST_RESULTS_2026-11-07.json).

The previous 41 registered tests all passed in this run. They retain the coverage and limits recorded in the [2026-11-06 report](BDS_TEST_REPORT_2026-11-06.md). The additional `terrain_resistance_vanilla_surface_probe` is a diagnostic only:

| Surface | `minecraft:movement` scale | 20-tick displacement (`x`, `y`, `z`) |
| --- | ---: | --- |
| Stone | 1.00× | `(0.8202, 0, 0.2000)` |
| Stone | 1.45× | `(0.8202, 0, 0.2000)` |
| Soul sand | 1.00× | `(0.1000, -0.0466, 0.2000)` |
| Soul sand | 1.45× | `(0.1000, -0.0466, 0.2000)` |
| Honey block | 1.00× | `(0.8342, 0, 0.2000)` |
| Honey block | 1.45× | `(0.8342, 0, 0.2000)` |
| Cobweb | 1.00× | `(0, 0, 0.4901)` |
| Cobweb | 1.45× | `(0, 0, 0.7104)` |

The simulated-player command produced the same displacement at both general-movement scales on stone, soul sand, and honey, while the cobweb horizontal sample changed. It does not test live player controls, vertical web movement, or the Java `movement_efficiency` formula, so it does not verify the augment. `발 안 묶이기` remains class C / `NOT_PORTED` and is not offered by the core filter.

Client import, mobile/controller input, visual UI review, reconnect, online multiplayer, and actual player movement were not run in this BDS diagnostic.
