# BDS test report — 2026-11-07

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Stable Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- `npm run verify`: **PASS** — 29 static tests, stable API type-check, and `.mcaddon` package build (62,855 bytes).
- Command: `npm run test:engine`.
- Latest GameTests: **50 passed / 0 failed**, 32,852 ms; no regressions, script errors, or infrastructure errors.
- Machine-readable results: [`BDS_TEST_RESULTS_2026-11-07.json`](BDS_TEST_RESULTS_2026-11-07.json).

The original 43 registered tests also passed in this run. They retain the coverage and limits recorded in the [2026-11-06 report](BDS_TEST_REPORT_2026-11-06.md). The `terrain_resistance_vanilla_surface_probe` remains diagnostic only:

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

`urgent_steps_triggers_refreshes_and_stacks_on_real_damage` adds a 46th engine test and exercises the production BP runtime. Positive synthetic damage at levels 1–3 sets the general movement component to 0.11 / 0.12 / 0.13 from a 0.10 baseline. Level-5 Quick Feet plus level-2 Urgent Steps stacks additively to 0.135 (+35%). A second hit 40 ticks later refreshes the 60-tick window without another stack; the bonus remains active past the original expiry and then expires after the refreshed window. A before-event-cancelled hit produces no hurt after-event and does not activate the augment. The test does not establish visible client displacement, reconnect timing, or online multiplayer. `다급한 발걸음` is class B / `PARTIAL_BDS_VERIFIED` and enabled as an uncommon candidate; see [`API_COMPATIBILITY_2026-11-07.md`](API_COMPATIBILITY_2026-11-07.md#다급한-발걸음-urgent-steps).

Four Rider production tests bring the suite to 50. Separate level-1/2/3 cases use the production BP handler and confirm exact +10% / +20% / +30% horse `minecraft:movement` component values against each horse's own randomized `defaultValue`; after dismount, each returns to its default and drops the runtime tag. An unowned player control confirms Rider does not change the horse. A separate `rider_probe` run passed 2/2 API diagnostics: the sole rider/control-seat relationship and writable movement component are visible, queried numeric jump-strength components are absent, and mounted `SimulatedPlayer.jump()` emits no Jump input. The diagnostic cannot prove real-client jump-input timing or client-visible motion. `기수` is class B / `PARTIAL_BDS_VERIFIED`, but disabled in core offers because jump strength remains missing; see [`RIDER_IMPLEMENTATION_2026-11-07.md`](RIDER_IMPLEMENTATION_2026-11-07.md).

The latest run also asserts that BDS can generate the cow's beef from a dead entity. Loot Scoop's production helper is tested against a real player-attributed death event with an injected deterministic bundle, including exclusion of an augment core. A prior isolated call to the native generator returned an empty bundle even though a separate dead-cow probe returned beef and leather. This keeps the duplicate-spawning test deterministic while recording that native re-roll output may be empty or differ; it does not claim a guaranteed production bonus or native-drop parity.

Earlier full-suite attempts had transient loot-generation, shared XP-pickup, and Rider test-fixture failures; the latest complete 50-test run passed with zero script or infrastructure errors. The XP pickup's native award timing and the Rider production values still measure only the isolated BDS simulated-player route; online multiplayer and visible client movement remain unverified.
