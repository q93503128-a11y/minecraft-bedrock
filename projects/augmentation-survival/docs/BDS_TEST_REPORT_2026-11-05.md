# BDS test report — 2026-11-05

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Harness: `@bedrock-core/bds-runner` 0.2.1; isolated behavior/resource/test packs; the GameTest experiment is enabled only in the runner-owned disposable world.
- Command: `npm run test:engine`.
- Latest result: **PASS — 6 passed, 0 failed**, 3.8 seconds; no script errors or infrastructure error. Machine-readable results are in `BDS_TEST_RESULTS_2026-11-05.json`.

| GameTest | Result | What it establishes |
| --- | --- | --- |
| `core_item_use_keeps_core_until_choice` | PASS | A simulated player can use a common core; the core remains in inventory before a selection result. Does not test the visible form. |
| `core_selection_commits_level_and_preserves_core_on_rejection` | PASS | A test-only entry in the isolated production BP copy executes the same transaction used by the UI. After a tick, it reads the committed level 1 back from the production BP namespace; max-level rejection preserves the second core, and the production spawn handler applies the level 1 `강건함` effect. Does not automate the visible selection form or restart persistence. |
| `core_synthesis_is_atomic_and_conserves_items` | PASS | The production 3:1 helper upgrades three common cores to one uncommon core; a duplicate request without new inputs and a request with fewer than three leave inventory unchanged; a full inventory rejects output and leaves the original input stack intact. Does not automate the visible synthesis form or bulk synthesis. |
| `damage_event_exposes_simulated_player_damage` | PASS | BDS 1.26.62.1 provides the documented before/after hurt-event payload for direct simulated-player damage. |
| `keen_edge_scales_server_root_melee_damage` | PASS (partial port) | The production BP's before-event handler changes 10 `entityAttack` damage to 12 at level 5. A test-only entry seeds the level in the production pack's dynamic-property namespace. Does not exercise a physical client melee swing or the acquisition UI. |
| `sturdiness_effect_scales_max_health` | PASS (platform mismatch recorded) | A test-only production-pack entry seeds levels 1 and 5, then the production spawn handler applies `health_boost`: `effectiveMax` rises by 4 and 20. Java canon specifies +2 and +10. This documents the mismatch, not parity. It does not test award flow or restart persistence. |

The test pack uses the beta GameTest module and is not part of the player add-on. The runner copies the production BP, changes only the copied manifest entry to a test wrapper, and uses that wrapper to seed dynamic properties in the production BP namespace. The wrapper is never packaged in the player's add-on. BDS did not load the Windows client world or render UI. Client import, touch/controller legibility, physical player melee, reconnect persistence, death/dimension changes, and multiplayer remain untested.

Exploratory movement tests are documented in `API_COMPATIBILITY_2026-11-05.md`. Although the stable attribute setter accepted the requested movement values, BDS 1.26.62.1 returned the player movement component to its default on a later tick after changing Quick Feet from level 5 to level 1. No movement augment is counted implemented.
