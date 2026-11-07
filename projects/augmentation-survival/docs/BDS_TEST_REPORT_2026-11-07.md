# BDS test report — 2026-11-07

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Stable Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0.
- `npm run verify`: **PASS** — 33 static tests, stable API type-check, and `.mcaddon` package build (78,162 bytes).
- Command: `npm run test:engine`.
- Latest standard GameTests: **54 passed / 2 failed** of 56 in 30,468 ms; Rider level 1 and 2 fixtures failed to expose `minecraft:rideable`, leaving two uncaught script errors. This run is not clean.
- Ore Sense production test: **1/1 passed** in 5,526 ms on BDS 1.26.62.1; it also passed within the 56-test suite.
- Chest Finder production test: **1/1 passed** in 4,545 ms on BDS 1.26.62.1.
- Machine-readable results: [`BDS_TEST_RESULTS_2026-11-07.json`](BDS_TEST_RESULTS_2026-11-07.json), plus separate [`ORE_SENSE_PRODUCTION_TEST_2026-11-07.json`](ORE_SENSE_PRODUCTION_TEST_2026-11-07.json) and [`CHEST_FINDER_PRODUCTION_TEST_2026-11-07.json`](CHEST_FINDER_PRODUCTION_TEST_2026-11-07.json) reports.

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

Four Rider production tests plus two Armor Care production tests brought the suite to 52 before Momentum Shift was added. Separate Rider levels 1–3 tests verify exact +10% / +20% / +30% horse movement values and restoration after dismount; the unowned control leaves movement unchanged. The Rider-only API probe confirms the stable mount route and missing jump-strength writer. `기수` remains partial and disabled as a candidate; see [`RIDER_IMPLEMENTATION_2026-11-07.md`](RIDER_IMPLEMENTATION_2026-11-07.md).

The latest run also asserts that BDS can generate the cow's beef from a dead entity. Loot Scoop's production helper is tested against a real player-attributed death event with an injected deterministic bundle, including exclusion of an augment core. A prior isolated call to the native generator returned an empty bundle even though a separate dead-cow probe returned beef and leather. This keeps the duplicate-spawning test deterministic while recording that native re-roll output may be empty or differ; it does not claim a guaranteed production bonus or native-drop parity.

## Taming Knack API surface

The separate `taming_component_and_event_surface_probe` passed 1/1 on BDS 1.26.62.1 with stable Script API 2.11.0. The test attempted one native interaction on each species and recorded tame items, probability, food count, interaction events, tame events, and component method behavior. Wolf, cat, and parrot returned probability `0.33000001311302185`; nautilus returned a tame-component property error (`seatCount`) and its tame-state / owner getters also failed. The test observed a native nautilus `entityTamed` event and confirmed direct `EntityTameableComponent.tame(player)` returns true and emits before/after events for a wolf. The tamed wolf's owner/state getters then threw.

Neither `world.beforeEvents.playerInteractWithEntity` nor `world.afterEvents.playerInteractWithEntity` fired for any SimulatedPlayer interaction, despite the accepted interactions consuming one bone, cod, and wheat seed each. A pufferfish-bucket stack was clamped to one item and remained in the slot after the interaction; the native tame event did fire. The horse's `EntityTameMountComponent.tameToPlayer(true, player)` call returned true, but the horse did not list `minecraft:tamemount` or `minecraft:tameable` as present and its tamed/owner getters threw. Its runtime component list included `minecraft:rideable` and `minecraft:is_tamed` after the call. This is an API-surface diagnostic only: it did not run the Java multiplier, cancel a real player's item interaction, read horse temper, or verify client-visible horse ownership. The probe is outside the standard suite and does not count as an augment implementation test. See [`API_COMPATIBILITY_2026-11-07.md`](API_COMPATIBILITY_2026-11-07.md#길들이기-요령-taming-knack).

The first 52-test attempt exposed a Rider fixture race: the level-3 test read `minecraft:rideable` one tick before the spawned horse exposed it. The fixture retries the component read for up to four additional ticks. Two intermediate reruns were not clean: one passed 50/52 with Rider initialization/mount assertion failures, and another passed 50/52 with a Pickup Hand 4-point orb timing failure plus a temporary horse tame test setup failure. At that checkpoint the suite passed 52/52 in 36.3 seconds; later Momentum Shift, Mantle, and Ore Sense additions expanded the suite. The latest 56-test run is summarized at the top of this report (54 passed / 2 failed; Rider levels 1 and 2 lacked `minecraft:rideable`). Armor Care observed 25/80 ordinary-piece saves and 22/80 near-break saves in the latest full-suite run. The isolated three-test `armor_probe` run passed 3/3 and observed 17/80 and 20/80 in its production cases. These randomized outcomes exercise the handler; exact 5%–25% boundaries are verified by the pure chance-helper tests. Online multiplayer, reconnect and visible client gameplay remain unverified.

## Armor Care production tests

The standard suite seeds level 5 inside the production BP and runs 20 ordinary hits plus 20 hits with all four diamond armor pieces at `maxDurability - 4`. It verifies saved and native-spent outcomes for every piece, does not find armor duplicated in the inventory, and checks that an unowned player retains native iron-armor wear in all four slots. Chance-helper assertions cover levels 0–6, exact level values, just-below success, and the exclusive boundary. A separate event-surface diagnostic confirms the before/after native armor-damage observation on BDS 1.26.62.1; it is run as the `armor_probe` tag outside the standard GameTest suite.

## Fast Brewing API surface

The separate `fast_brewing_api_surface_probe` passed 1/1 on BDS 1.26.62.1 in 7.356 seconds. The brewing stand exposed a five-slot inventory plus `minecraft:instrument_sound`, `minecraft:movable`, and `minecraft:precipitation_interactions`; queried `minecraft:recipe_processing`, `minecraft:brewing`, and `minecraft:brewing_stand` components were absent. Its block permutation contained only the three bottle-slot occupancy states. This is component/state-surface evidence only: the probe did not test vanilla recipe completion, brewing duration, Fast Brewing, its 8-block level snapshot, or its interaction with Area Acceleration. Machine-readable output is recorded in [`BREWING_API_SURFACE_PROBE_2026-11-07.json`](BREWING_API_SURFACE_PROBE_2026-11-07.json).


## Momentum Shift production path

`momentum_shift_applies_landing_bonus_and_expires` is the 53rd standard GameTest and runs against the production behavior-pack runtime on BDS 1.26.62.1. It verifies +10% / +20% / +30% movement-component values for levels 1–3 after a four-block fall, confirms the buff still activates when the landing fall-damage before-event is cancelled (so no damage after-event is needed), checks expiry around the canonical 60-tick window, verifies additive +9% Quick Feet stacking, and rejects a three-block fall. The separate stable-state probe reports the exact four-block peak-to-landing distance and confirms the `isFalling` flag appears only after downward movement has already begun.

The test measures server movement component values, not visible displacement in a live client. Mobile/controller motion, water/climbing reset edges, teleport edge cases, reconnect timing, online multiplayer, and simultaneous `탄성 저장` / Temporary Platform behavior were not exercised. Those remain open and the augment is counted as partial BDS verified, not fully implemented.

The stable-state measurement is preserved in [`MOMENTUM_FALL_STATE_PROBE_2026-11-07.json`](MOMENTUM_FALL_STATE_PROBE_2026-11-07.json). Bedrock also cannot recover distance from before the augment level is first acquired mid-fall; the local position tracker begins sampling when the level becomes present, whereas Java can read the already accumulated `fallDistance`.

## Mantle production path

`mantle_reconstructs_collision_and_resets_momentum_fall_phase` passed 1/1 on official BDS 1.26.62.1 using stable Script API 2.11.0 (6.037 seconds). The test runs the production `tryMantle` handler with a test-injected forward movement vector because SimulatedPlayer movement leaves `inputInfo.getMovementVector()` at zero. It verifies an unowned player, no-input, and no-wall controls; rejects a solid block and a living entity at the destination; then verifies the owned player moves exactly 1.0 block upward and 0.35 blocks forward with no downward velocity.

The same production test seeds Momentum Shift and confirms a four-block fall segment before Mantle plus a sub-four-block fall afterward does not activate the landing bonus, validating the Java `resetFallDistance()` interaction in the shared tracker. BDS exposed that player teleportation does not support `keepVelocity`; the handler restores the captured X/Z velocity and clamps Y through `applyImpulse`. The tested `tryTeleport` block-check option also allowed the deliberately obstructed player fixture, so the handler guards the destination by scanning block cells overlapped by the player AABB. Blocks tagged plant/crop, rails, signs, and an explicit small vanilla allowlist are excluded from that scan; these tags do not describe collision shape, and other passable/partial/custom block shapes are not generically identifiable in stable Script API.

The test does not validate physical client movement input, PC keyboard, mobile touch, controller, online multiplayer, reconnect, or the Reincarnation action lock. Machine-readable output is preserved in [`MANTLE_PRODUCTION_TEST_2026-11-07.json`](MANTLE_PRODUCTION_TEST_2026-11-07.json).

## Ore Sense production test

The isolated `test:ore-sense-production` GameTest verdict was **1/1 PASS** on official BDS 1.26.62.1 in 5.526 seconds. Its production entry commits Ore Sense level 1 after consuming a rare core; the test then stores levels 1–3 and checks exposed ores at exactly the canonical 6 / 8 / 10-block radii. It also checks a water-exposed ore, excludes an ore surrounded on all six faces by stone, and observes successful `Player.spawnParticle` calls through a test observer to confirm they were issued only for the owner. The measured scan found 2 / 3 / 4 exposed ores and emitted 40 / 60 / 80 unique marker points at levels 1 / 2 / 3. Machine-readable output: [`ORE_SENSE_PRODUCTION_TEST_2026-11-07.json`](ORE_SENSE_PRODUCTION_TEST_2026-11-07.json).

The same GameTest passed in the full standard run. `npm run test:engine` registered all 56 expected tests and ended with **54 passed / 2 failed**: `rider_speed_level_1_applies_and_restores` and `rider_speed_level_2_applies_and_restores` failed because their fixture horses did not expose `minecraft:rideable`. This is recorded as a full-suite failure, not a pass. Ore Sense's targeted test and candidate-list check both passed. The test establishes server scan decisions and particle API call targeting; it does not visually verify the particle texture, mobile readability, or real-client multiplayer rendering.

## Chest Finder production test

The isolated `test:chest-finder-production` verdict was **1/1 PASS** on official BDS 1.26.62.1 in 4.545 seconds. Its production entry commits Chest Finder level 1 after consuming a rare core; the GameTest sets saved levels 1–3 and checks empty vanilla containers at the exact canonical spherical radii of 12 / 18 / 24 blocks. It verifies one, two, and three accepted empty containers and 20, 40, and 60 owner-targeted gold marker calls; an intervening wall did not hide the level-1 chest. A filled barrel and an outside-radius container were excluded. The stable `blockContainerOpened` event was observed and excluded the opened container. The production marker writer stored an exclusion record, but an actual SimulatedPlayer placement was not established at the expected coordinate, so `playerPlaceBlock` event delivery remains unverified. Machine-readable output is in [`CHEST_FINDER_PRODUCTION_TEST_2026-11-07.json`](CHEST_FINDER_PRODUCTION_TEST_2026-11-07.json). Empty inventory is only a proxy for an unconsumed loot table; old placed containers and containers opened before the add-on installed may still be false positives.

The test verifies server detection and particle API calls only; it does not visually verify gold marker rendering, touch/controller readability, or online multiplayer.
