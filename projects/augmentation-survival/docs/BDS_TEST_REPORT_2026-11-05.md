# BDS test report — 2026-11-05

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Harness: `@bedrock-core/bds-runner` 0.2.1; isolated behavior/resource/test packs; the GameTest experiment is enabled only in the runner-owned disposable world.
- Command: `npm run test:engine`.
- Latest result: **PASS — 4 passed, 0 failed**, 3.6 seconds; no script errors or infrastructure error. Machine-readable results are in `BDS_TEST_RESULTS_2026-11-05.json`.

| GameTest | Result | What it establishes |
| --- | --- | --- |
| `core_item_use_keeps_core_until_choice` | PASS | A simulated player can use a common core; the core remains in inventory before a selection result. Does not test the visible form. |
| `core_selection_commits_level_and_preserves_core_on_rejection` | PASS | The production server transaction consumes exactly one core for a valid level, persists level 1 on the player, rejects max level, and preserves the remaining core. Does not automate the visible selection form or restart persistence. |
| `core_synthesis_is_atomic_and_conserves_items` | PASS | The production 3:1 helper upgrades three common cores to one uncommon core; a duplicate request without new inputs and a request with fewer than three leave inventory unchanged; a full inventory rejects output and leaves the original input stack intact. Does not automate the visible synthesis form or bulk synthesis. |
| `sturdiness_effect_scales_max_health` | PASS (platform mismatch recorded) | Production passive raises `effectiveMax` by 4 at level 1 and 20 at level 5; Java canon specifies +2 and +10. This documents the mismatch, not parity. It does not test award flow or restored state. |

The test pack uses the beta GameTest module and is not part of the player add-on. BDS did not load the Windows client world or render UI. Client import, touch/controller legibility, real-player interactions, reconnect persistence, death/dimension changes, and multiplayer remain untested.

Exploratory movement tests are documented in `API_COMPATIBILITY_2026-11-05.md`. Although the stable attribute setter accepted the requested movement values, BDS 1.26.62.1 returned the player movement component to its default on a later tick after changing Quick Feet from level 5 to level 1. No movement augment is counted implemented. An earlier exploratory melee test also found that the simulated-player hurt callback did not provide an event payload; `날 선 감각` remains `IMPLEMENTED_UNVERIFIED` and is excluded from the passing suite.
