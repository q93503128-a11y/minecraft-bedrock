# Wildbound Runtime Test Matrix

Last updated: 2026-10-02  
Current target build: `Wildbound_v1.28.2_REMAKE_ALPHA3.mcaddon`

Legend:
- NOT_RUN
- PASS
- FAIL
- PARTIAL

## Recorded ALPHA2 runtime evidence

Observed from real Bedrock screenshots:

| Area | ALPHA2 result | Evidence/notes |
| --- | --- | --- |
| Add-on/world reaches playable UI | PASS | Minecraft world and Wildbound screens were open |
| Custom deck UI routing renders | PASS | custom PARTY + STORAGE screen rendered |
| Custom ranch UI routing renders | PASS | custom ranch screen rendered |
| Core flow fully custom | FAIL | native gray form screen still appeared |
| Small-window deck readability | FAIL | cards/text severely cramped |
| Information hierarchy | FAIL | too many similar-weight cards and text |
| Visual consistency | FAIL | mixed cyan/red/gold panels and native gray forms |
| Creature identification quality | FAIL | no strong creature-specific visual identity in cards |
| Overall ALPHA2 UI/UX checkpoint | **FAIL** | rejected for redesign |

No ALPHA2 performance PASS/FAIL is inferred from these screenshots alone.

## ALPHA3 A. Import / startup

| Test | Status |
| --- | --- |
| mcaddon imports | NOT_RUN |
| BP/RP activate | NOT_RUN |
| world loads | NOT_RUN |
| no fatal content-log error | NOT_RUN |
| existing v1.27.7 world opens safely | NOT_RUN |

## ALPHA3 B. Core UI

| Test | Status | Critical expectation |
| --- | --- | --- |
| Beast Seal opens custom hub normally | NOT_RUN | no old gray system menu |
| custom hub readable | NOT_RUN | |
| deck renders | NOT_RUN | |
| companion screen renders | NOT_RUN | |
| growth renders custom | NOT_RUN | |
| compass renders custom | NOT_RUN | |
| ranch renders custom | NOT_RUN | |
| bestiary renders custom | NOT_RUN | |
| presets/settings/guide render custom | NOT_RUN | |

## ALPHA3 C. Small-window deck

Use the same small game window that exposed ALPHA2.

| Test | Status |
| --- | --- |
| selected summary readable | NOT_RUN |
| party 2x2 readable | NOT_RUN |
| storage 2x3 readable | NOT_RUN |
| bottom toolbar readable | NOT_RUN |
| no overlap/clipping | NOT_RUN |
| selection/page state persists | NOT_RUN |
| full-party replacement stays in deck | NOT_RUN |
| no UV-sheet portraits | NOT_RUN |

## D. Screen/device coverage

| Case | Status |
| --- | --- |
| small desktop window | NOT_RUN |
| 1920x1080 | NOT_RUN |
| 1280x720 | NOT_RUN |
| 768x1024 | NOT_RUN |
| 412x915 | NOT_RUN |
| 390x844 | NOT_RUN |
| 360x640 | NOT_RUN |
| controller | NOT_RUN |
| touch | NOT_RUN |
| GUI scale variants | NOT_RUN |

## E. Performance

| Scenario | Status |
| --- | --- |
| idle/no companions | NOT_RUN |
| four companions | NOT_RUN |
| mob-dense area | NOT_RUN |
| boss fight | NOT_RUN |
| ranch nearby | NOT_RUN |
| ranch + four companions + combat | NOT_RUN |
| multiplayer | NOT_RUN |

## F. External models

Thornback and abyss/crab:
- geometry
- texture
- scale
- orientation
- idle/walk/attack behavior
- evolution silhouette

All: NOT_RUN for ALPHA3 regression.

## G. Bosses

At least early/mid/late:
- telegraph before damage
- real dodge window
- visual hit zone matches damage
- no invisible instant-damage path dominating
- cleanup on death/despawn

All: NOT_RUN.

## H. Ranch

- custom screen
- storage barrel priority
- no item duplication/loss
- unload/reload
- multiplayer ownership

All: NOT_RUN.

## I. Save migration

- stored creatures
- active party
- levels/evolution
- ranch
- no duplication
- repeated save/rejoin

All: NOT_RUN.

## Evidence rule

Record build, Bedrock version, input/device, screenshot/log when relevant, and reproduction steps. Static inspection never changes NOT_RUN to PASS.
