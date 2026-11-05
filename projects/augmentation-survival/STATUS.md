# Status

Date: 2026-11-05 (Asia/Seoul)

## Current checkpoint

The source roster and repeatable `.mcaddon` build are present. This is an early playable foundation, not a complete port.

- Canonical roster inventoried from the read-only Java checkout at `5962141975b1fea600b0bdb2ae9b697dc7de9cb5`: **149 / 149** (20/27/31/41/20/10 across six tiers).
- Runtime gameplay fully implemented and verified: **0 / 149**.
- Partial behavior with direct BDS verification: **6 / 149** (`강건함`: `health_boost` adds +4 HP/level, but Java specifies +2; `날 선 감각`: production before-event scales a synthetic root melee event by 20% at level 5; `정확한 조준`: production before-event scales a 1-damage owner-attributed synthetic projectile source to 1.04/1.08/1.12/1.16/1.20 at levels 1–5, while ownerless and unaugmented sources stay at 1; `질긴 피부`: all-damage reduction at levels 1–5; `가벼운 착지`: fall-damage reduction at levels 1–5; `튼튼한 폐`: drowning reduction at levels 1–3. Physical projectile collision, client actions, acquisition, vanilla mitigation order, and delayed-damage provenance remain unverified.)
- Source implementation awaiting engine verification: **0 / 149**.
- Unported: **143 / 149**.
- API compatibility classes in the roster: **A 1, B 4, C 0, D 0, unassessed 144**. Classifies the available route, not full gameplay completion; platform alternatives remain unassessed where evidence is incomplete.
- Core offer/device/synthesis loop: source implemented. The candidate filter currently enables only five common augment effects with direct BDS evidence (`날 선 감각`, `정확한 조준`, `질긴 피부`, `가벼운 착지`, and `튼튼한 폐`); it excludes the known `강건함` numeric mismatch and all unported entries, and preserves cores used at tiers with no enabled candidates. BDS verifies this filter and the selection transaction, including one-core consumption, level storage, max-level rejection and core retention; it also verifies the shared 3:1 synthesis transaction, insufficient-input rejection and full-inventory rollback. Visible UI selection/synthesis and reconnect persistence are not verified.
- Canonical name/max-level differences between `AUGMENTS.md` and the Java catalog: **3**, recorded per entry.
- Entries without a Java source file containing the stable catalog ID: **7**; absence of a literal ID is not treated as proof of no implementation.

## Verification results

- Client package observed locally: Minecraft Bedrock **1.26.6201.0** (1.26.62 family). No client import or visual play test was performed.
- Stable production Script API declarations: `@minecraft/server` 2.11.0 and `@minecraft/server-ui` 2.3.0. Production script type-check: **PASS**.
- Roster import: **PASS**, 149 entries and expected tier counts.
- Static checks: **PASS**, 7 tests.
- JSON, manifests, item/icon/recipe references and recipe unlocks: **PASS**.
- `.mcaddon` build: **PASS**, `build/AugmentationSurvival-0.1.0.mcaddon` (36,103 bytes).
- Official BDS **1.26.62.1**, isolated world: **PASS**, 12 passed / 0 failed in 7.044 seconds, with no script or infrastructure errors. Coverage includes core candidate gating and transactions, all five `질긴 피부` and `가벼운 착지` levels, all three `튼튼한 폐` levels, their tested multiplicative combinations, `날 선 감각` level 5, `정확한 조준` levels 1–5 through synthetic projectile damage sources, hurt-event payload, and the documented `강건함` mismatch. A separate physical-arrow experiment failed to hit its target and was removed from the passing suite. Damage tests use synthetic sources on unarmored simulated players; client and natural-event behavior remain unverified. Results: `docs/BDS_TEST_REPORT_2026-11-05.md` and `docs/BDS_TEST_RESULTS_2026-11-05.json`.
- Not run: client import and real UI review, mobile/controller navigation, real-player core selection and level award, saved state after reconnect/server restart, death/dimension changes, multiplayer races.

## Known source and platform gaps

- Java canon definitions, tier, maximum levels, canonical effect text, source-file hits and interaction-contract references are present in the generated roster and CSV matrix. Detailed Bedrock mapping and API evidence is recorded for `강건함`, `날 선 감각`, `정확한 조준`, `질긴 피부`, `가벼운 착지`, `튼튼한 폐`, `빠른 발` and `물갈퀴`; the other 141 entries remain unassessed or unported. Do not interpret roster registration as implementation.
- The three catalog discrepancies are kept explicit. Names, levels and effect descriptions follow `AUGMENTS.md`; stable catalog IDs follow the Java catalog.
- No Java-mod assets, external mobs or structures were copied. Vanilla resources are used.
- BDS exposed invalid assumptions in the first runtime attempt: flattened custom item components are experimental on this target and recipes need unlock data. Production input now uses stable `world.afterEvents.itemUse`; recipes explicitly use `AlwaysUnlocked`. The corrected build and core transaction/effect tests pass.
- Delayed UI responses are token-checked and player-leave cleanup releases the form lock. Static coverage verifies stale responses cannot clear a later lock; BDS pack load and GameTests pass with this code.
- An exploratory `EntityAttributeComponent.setCurrentValue` route for `빠른 발` and `물갈퀴` could set exact movement multipliers transiently, but BDS reset the player movement component after a later tick. The experiment is removed from production and the passing suite; both augments remain `NOT_PORTED`. See `docs/API_COMPATIBILITY_2026-11-05.md`.
- Core synthesis now uses a shared server-authoritative slot transaction. A BDS test confirms 3:1 conversion, duplicate and insufficient-input rejection, and exact inventory preservation when a full inventory cannot accept the result. Java's bulk synthesis control is not implemented yet.
- The isolated BDS runner now executes test hooks inside a copied production BP because entity dynamic properties are pack-scoped. It verifies the production selection transaction and production damage handlers without adding test hooks to the shipped add-on. The three defense tests use synthetic damage on unarmored simulated players; augment multipliers stack correctly in tested combinations, while natural landing/drowning and ordering against vanilla mitigation remain untested.

## Resume point

Import the `.mcaddon` into a disposable 1.26.62 client world and inspect candidate, owned-augment, and synthesis screens with touch and controller navigation. Test real-player choice, physical melee, an actual player-fired arrow for `정확한 조준`, natural landing and drowning damage, armor/effect stacking, and reconnect persistence; then implement and verify Java's one/all bulk synthesis control. Evaluate exact player movement alternatives for `빠른 발` and `물갈퀴`, and resolve exact `강건함` parity if a supported route exists. Continue the compatibility/interaction assessment and effect runtime in Java source order. Keep all remaining entries unported until their game behavior and interactions are verified.
