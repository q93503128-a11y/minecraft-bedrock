# BDS test report — 2026-11-05

- Server: official Bedrock Dedicated Server 1.26.62.1, pinned by `bds-runner.json`.
- Harness: `@bedrock-core/bds-runner` 0.2.1; generated isolated behavior/resource/test packs; GameTest experiment enabled only in the runner-owned disposable world.
- Command: `npm run test:engine`.
- Result: **PASS — 2 passed, 0 failed**, runtime 6.3 seconds; no script errors or infrastructure error in the machine summary.

| GameTest | Result | What it establishes |
| --- | --- | --- |
| `core_item_use_keeps_core_until_choice` | PASS | Simulated player can use a common core and its inventory still contains it after five ticks, before a selection can be returned. Does not test the visible form or commit path. |
| `sturdiness_effect_scales_max_health` | PASS | Production passive implementation raises `effectiveMax` by 4 at level 1 and 20 at level 5. Does not test acquiring the level or restoring it from persistent player data. |

The test pack uses the beta GameTest module and is not part of the player add-on. BDS did not load the Windows client world or render UI. Client import, touch/controller legibility, multiplayer, and reconnect persistence remain untested.
