# Status

Date: 2026-11-05 (Asia/Seoul)

## Current checkpoint

The source roster and repeatable `.mcaddon` build are present. This is an early playable foundation, not a complete port.

- Canonical roster inventoried from the read-only Java checkout at `d0b7c8af21146964620a48ff60a68325ef34a181`: **149 / 149** (20/27/31/41/20/10 across six tiers).
- Runtime gameplay fully implemented and verified: **0 / 149**.
- Partial behavior with direct BDS verification: **5 / 149** (`강건함`: `health_boost` adds +4 HP/level, but Java specifies +2; `날 선 감각`: production before-event scales a simulated-player root melee event by the exact level 5 multiplier; `질긴 피부`: all-damage reduction at levels 1–5; `가벼운 착지`: fall-damage reduction at levels 1–5; `튼튼한 폐`: drowning reduction at levels 1–3. Client actions, acquisition, vanilla mitigation order, and delayed-damage provenance remain unverified.)
- Source implementation awaiting engine verification: **0 / 149**.
- Unported: **144 / 149**.
- API compatibility classes in the roster: **A 1, B 3, C 0, D 0, unassessed 145**. Classifies the available route, not full gameplay completion; platform alternatives remain unassessed where evidence is incomplete.
- Core offer/device/synthesis loop: source implemented. BDS verifies the selection transaction, including one-core consumption, level storage, max-level rejection and core retention; it also verifies the shared 3:1 synthesis transaction, insufficient-input rejection and full-inventory rollback. Visible UI selection/synthesis and reconnect persistence are not verified.
- Canonical name/max-level differences between `AUGMENTS.md` and the Java catalog: **3**, recorded per entry.
- Entries without a Java source file containing the stable catalog ID: **7**; absence of a literal ID is not treated as proof of no implementation.

## Verification results

- Client package observed locally: Minecraft Bedrock **1.26.6201.0** (1.26.62 family). No client import or visual play test was performed.
- Stable production Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. Production script type-check: **PASS**.
- Roster import: **PASS**, 149 entries and expected tier counts.
- Static checks: **PASS**, 7 tests.
- JSON, manifests, item/icon/recipe references and recipe unlocks: **PASS**.
- `.mcaddon` build: **PASS**, `build/AugmentationSurvival-0.1.0.mcaddon` (35,181 bytes).
- Official BDS **1.26.62.1**, isolated world: **PASS**, 10 passed / 0 failed in 3.6 seconds, with no script or infrastructure errors. Coverage includes core transactions, all five `질긴 피부` and `가벼운 착지` levels, all three `튼튼한 폐` levels, their tested multiplicative combinations, `날 선 감각` level 5, hurt-event payload, and the documented `강건함` mismatch. Damage tests use synthetic causes on unarmored simulated players; client and natural-event behavior remain unverified. Results: `docs/BDS_TEST_REPORT_2026-11-05.md` and `docs/BDS_TEST_RESULTS_2026-11-05.json`.
- Not run: client import and real UI review, mobile/controller navigation, real-player core selection and level award, saved state after reconnect/server restart, death/dimension changes, multiplayer races.

## Known source and platform gaps

- Java canon definitions, tier, maximum levels, canonical effect text, source-file hits and interaction-contract references are present in the generated roster and CSV matrix. Detailed Bedrock mapping and API evidence is recorded for `강건함`, `날 선 감각`, `질긴 피부`, `가벼운 착지`, `튼튼한 폐`, `빠른 발` and `물갈퀴`; the other 142 entries remain unassessed or unported. Do not interpret roster registration as implementation.
- The three catalog discrepancies are kept explicit. Names, levels and effect descriptions follow `AUGMENTS.md`; stable catalog IDs follow the Java catalog.
- No Java-mod assets, external mobs or structures were copied. Vanilla resources are used.
- BDS exposed invalid assumptions in the first runtime attempt: flattened custom item components are experimental on this target and recipes need unlock data. Production input now uses stable `world.afterEvents.itemUse`; recipes explicitly use `AlwaysUnlocked`. The corrected build and core transaction/effect tests pass.
- Delayed UI responses are token-checked and player-leave cleanup releases the form lock. Static coverage verifies stale responses cannot clear a later lock; BDS pack load and GameTests pass with this code.
- An exploratory `EntityAttributeComponent.setCurrentValue` route for `빠른 발` and `물갈퀴` could set exact movement multipliers transiently, but BDS reset the player movement component after a later tick. The experiment is removed from production and the passing suite; both augments remain `NOT_PORTED`. See `docs/API_COMPATIBILITY_2026-11-05.md`.
- Core synthesis now uses a shared server-authoritative slot transaction. A BDS test confirms 3:1 conversion, duplicate and insufficient-input rejection, and exact inventory preservation when a full inventory cannot accept the result. Java's bulk synthesis control is not implemented yet.
- The isolated BDS runner now executes test hooks inside a copied production BP because entity dynamic properties are pack-scoped. It verifies the production selection transaction and production damage handlers without adding test hooks to the shipped add-on. The three defense tests use synthetic damage on unarmored simulated players; augment multipliers stack correctly in tested combinations, while natural landing/drowning and ordering against vanilla mitigation remain untested.

## Resume point

Import the `.mcaddon` into a disposable 1.26.62 client world and inspect candidate, owned-augment, and synthesis screens with touch and controller navigation. Test real-player choice, physical melee, natural landing and drowning damage, armor/effect stacking, and reconnect persistence; then implement and verify Java's one/all bulk synthesis control. Evaluate exact player movement alternatives for `빠른 발` and `물갈퀴`, and resolve exact `강건함` parity if a supported route exists. Continue the compatibility/interaction assessment and effect runtime in Java source order. Keep all remaining entries unported until their game behavior and interactions are verified.
