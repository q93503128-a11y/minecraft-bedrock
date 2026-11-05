# Status

Date: 2026-11-05 (Asia/Seoul)

## Current checkpoint

The source roster and repeatable `.mcaddon` build are present. This is an early playable foundation, not a complete port.

- Canonical roster inventoried from the read-only Java checkout: **149 / 149** (20/27/31/41/20/10 across six tiers).
- Runtime gameplay fully implemented and verified: **0 / 149**.
- Partial behavior with direct BDS verification: **1 / 149** (`강건함`: `health_boost` adds +4 HP/level, but Java specifies +2; acquisition and persistence restoration also remain untested).
- Source implementation awaiting engine verification: **1 / 149** (`날 선 감각`: root melee modifier uses the stable before-event; BDS simulated-player event routing did not provide an event payload).
- Unported: **147 / 149**.
- Core offer/device/synthesis loop: source implemented. BDS verifies the shared server transaction consumes one core and stores a level, rejects max-level choices without consumption, and retains the core before a form result; actual UI selection and reconnect persistence are not verified.
- Canonical name/max-level differences between `AUGMENTS.md` and the Java catalog: **3**, recorded per entry.
- Entries without a Java source file containing the stable catalog ID: **7**; absence of a literal ID is not treated as proof of no implementation.

## Verification results

- Client package observed locally: Minecraft Bedrock **1.26.6201.0** (1.26.62 family). No client import or visual play test was performed.
- Stable production Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. Production script type-check: **PASS**.
- Roster import: **PASS**, 149 entries and expected tier counts.
- Static checks: **PASS**, 4 tests.
- JSON, manifests, item/icon/recipe references and recipe unlocks: **PASS**.
- `.mcaddon` build: **PASS**, `build/AugmentationSurvival-0.1.0.mcaddon` (32,816 bytes).
- Official BDS **1.26.62.1**, isolated world: **PASS**, 3 passed / 0 failed. Results: `docs/BDS_TEST_REPORT_2026-11-05.md` and `docs/BDS_TEST_RESULTS_2026-11-05.json`.
- Not run: client import and real UI review, mobile/controller navigation, real-player core selection and level award, saved state after reconnect/server restart, death/dimension changes, multiplayer races.

## Known source and platform gaps

- Java canon definitions, tier, maximum levels, canonical effect text, source-file hits and interaction-contract references are present in the generated roster and CSV matrix. The per-augment Bedrock mapping, API constraints and tests remain unassessed for 148 entries; do not interpret roster registration as implementation.
- The three catalog discrepancies are kept explicit. Names, levels and effect descriptions follow `AUGMENTS.md`; stable catalog IDs follow the Java catalog.
- No Java-mod assets, external mobs or structures were copied. Vanilla resources are used.
- BDS exposed invalid assumptions in the first runtime attempt: flattened custom item components are experimental on this target and recipes need unlock data. Production input now uses stable `world.afterEvents.itemUse`; recipes explicitly use `AlwaysUnlocked`. The corrected build and core transaction/effect tests pass.

## Resume point

Import the `.mcaddon` into a disposable 1.26.62 client world and inspect the candidate/owned/synthesis screens using touch and controller navigation. Then add an engine-verifiable selection path and reconnect persistence test for a real player where possible. Next, finish the evidence-backed compatibility and interaction assessment by feature family, then extend shared execution services and port effects in source order without marking data-only entries complete.
