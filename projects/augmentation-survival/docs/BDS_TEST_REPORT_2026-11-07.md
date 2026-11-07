# BDS test report — 2026-11-07

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Stable Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- `npm run verify`: **PASS** — 28 static tests, stable API type-check, and `.mcaddon` package build (59,473 bytes).
- Command: `npm run test:engine`.
- Latest GameTests: **45 passed / 0 failed**, 23,599 ms; no regressions, script errors, or infrastructure errors.
- Machine-readable results: [`BDS_TEST_RESULTS_2026-11-07.json`](BDS_TEST_RESULTS_2026-11-07.json).

The previous 43 registered tests all passed in this run. They retain the coverage and limits recorded in the [2026-11-06 report](BDS_TEST_REPORT_2026-11-06.md). The `terrain_resistance_vanilla_surface_probe` remains diagnostic only:

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

## Twins event surface

`twins_breeding_event_surface_probe` adds a 43rd engine test. It forced both cows to adult state, confirmed two accepted SimulatedPlayer interactions consumed exactly two wheat, and observed a native breeding child with `cause: "Born"` and the `minecraft:is_baby` component. Passing `{ spawnEvent: "minecraft:entity_born" }` to `Dimension.spawnEntity` also created a baby cow. The `playerInteractWithEntity` after-event callback stayed empty during the successful SimulatedPlayer interactions. This verifies only that the pinned BDS can expose a baby birth and create a baby; it does not verify the Twins 10% / 20% / 30% rolls, identify the breeder or parents, save a level, or spawn an augment bonus. `쌍둥이` stays class C / `NOT_PORTED` and disabled from core offers; see [`API_COMPATIBILITY_2026-11-07.md`](API_COMPATIBILITY_2026-11-07.md#쌍둥이-twins).

`long_jump_input_event_surface_probe` adds a 44th engine test. A sprinting grounded SimulatedPlayer accepted `.jump()`; one tick later it was airborne with vertical velocity `0.2000007629`, but no `playerButtonInput` Jump event was delivered. The SimulatedPlayer probe does not test real-client input delivery, horizontal sprint-jump velocity, or any Long Jump correction. `멀리뛰기` stays class C / `NOT_PORTED` and disabled from core offers; see [`API_COMPATIBILITY_2026-11-07.md`](API_COMPATIBILITY_2026-11-07.md#멀리뛰기-long-jump).

`ride_current_liquid_state_probe` adds a 45th engine test and exercises the production BP runtime. In an eastward stream, the observed `liquid_depth` row was 0, 9, 10, 11, 12, 13, 14, 15. At levels 1–3 the underwater movement value matched 0.023 / 0.026 / 0.029 from a 0.02 baseline. The test also verified no bonus at negative X velocity (−0.5196), no bonus in flat source water, and additive level-1 Webbed Feet stacking to 0.025. It does not test real-client/mobile movement, reconnect, multiplayer, complex drop geometry, or Speed Conversion. `물살 타기` is class B / `PARTIAL_BDS_VERIFIED` and is enabled for uncommon offers; see [`API_COMPATIBILITY_2026-11-07.md`](API_COMPATIBILITY_2026-11-07.md#물살-타기-ride-current).

One intermediate full-suite rerun had a single unrelated failure in the shared 4-point XP pickup test; the following full rerun passed all 45 tests. The cause was not established, so the pickup timing/race surface remains a test-stability watch item.
