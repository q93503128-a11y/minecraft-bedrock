# Wildbound Runtime Test Matrix

Last updated: 2026-10-02  
Target build: `Wildbound_v1.28.1_REMAKE_ALPHA2.mcaddon`

Legend:
- NOT_RUN — not yet tested in real Bedrock
- PASS — verified
- FAIL — verified failure
- PARTIAL — some cases pass, incomplete coverage

## Current overall status

**NOT_RUN for ALPHA2.**

Static validation is not a substitute for this matrix.

## A. Import / world startup

| Test | Status | Notes |
| --- | --- | --- |
| mcaddon imports without package error | NOT_RUN | |
| BP activates | NOT_RUN | |
| RP activates | NOT_RUN | |
| world loads with scripts enabled | NOT_RUN | |
| no fatal content-log errors | NOT_RUN | |
| fresh world works | NOT_RUN | |
| existing v1.27.7 world opens safely | NOT_RUN | |

## B. Main UI

| Test | Status | Notes |
| --- | --- | --- |
| Wildbound main opens | NOT_RUN | |
| custom dashboard renders instead of gray default form | NOT_RUN | critical |
| close/back works | NOT_RUN | |
| Korean labels do not clip | NOT_RUN | |
| mouse navigation works | NOT_RUN | |
| controller focus order works | NOT_RUN | |
| touch targets usable | NOT_RUN | |

## C. Creature deck / storage

| Test | Status | Notes |
| --- | --- | --- |
| party 4 slots visible | NOT_RUN | |
| storage cards render correctly | NOT_RUN | |
| no UV-sheet/disassembled creature icons | NOT_RUN | critical regression |
| selected creature detail updates | NOT_RUN | |
| selected creature state persists | NOT_RUN | |
| paging works | NOT_RUN | |
| search/filter works | NOT_RUN | |
| empty storage state is readable | NOT_RUN | |
| deploy to empty party slot works | NOT_RUN | |
| full-party replacement stays in same deck flow | NOT_RUN | |
| destructive actions separated | NOT_RUN | |

## D. Screen sizes

| Resolution / device | Status | Notes |
| --- | --- | --- |
| 1920x1080 desktop | NOT_RUN | |
| 1280x720 desktop | NOT_RUN | |
| 768x1024 tablet | NOT_RUN | |
| 412x915 mobile | NOT_RUN | |
| 390x844 mobile | NOT_RUN | |
| 360x640 mobile | NOT_RUN | |
| UI scale variations | NOT_RUN | |

## E. Performance

| Scenario | Status | Notes |
| --- | --- | --- |
| no companions nearby | NOT_RUN | baseline |
| 4 active companions | NOT_RUN | |
| many wild mobs nearby | NOT_RUN | |
| active boss fight | NOT_RUN | |
| ranch nearby | NOT_RUN | |
| ranch + 4 companions + combat | NOT_RUN | |
| multiplayer two players with companions | NOT_RUN | |
| chunk unload/reload | NOT_RUN | |

Record:
- subjective frame drops
- delayed AI decisions
- script watchdog/content-log warnings
- entity buildup/leaks

## F. External model integration

### Thornback lineage

| Test | Status |
| --- | --- |
| geometry visible | NOT_RUN |
| texture correct | NOT_RUN |
| scale acceptable | NOT_RUN |
| orientation correct | NOT_RUN |
| idle/move behavior acceptable | NOT_RUN |
| evolution silhouette clearly changes | NOT_RUN |

### Crab / abyss lineage

| Test | Status |
| --- | --- |
| converted geometry visible | NOT_RUN |
| embedded texture converted correctly | NOT_RUN |
| idle animation | NOT_RUN |
| walk animation | NOT_RUN |
| jump/attack-use animation behavior | NOT_RUN |
| no UV inversion/broken mirrored faces | NOT_RUN |

## G. Bosses

Test at least one early, one middle, and one late boss.

| Test | Status |
| --- | --- |
| telegraph appears before damage | NOT_RUN |
| player can actually dodge | NOT_RUN |
| hit zone matches visuals | NOT_RUN |
| pattern does not spam unfairly | NOT_RUN |
| boss remains threatening | NOT_RUN |
| no invisible instant-damage fallback dominates | NOT_RUN |
| cleanup after death/despawn | NOT_RUN |

## H. Ranch

| Test | Status |
| --- | --- |
| ranch opens | NOT_RUN |
| custom ranch UI renders | NOT_RUN |
| assigned/stored creature logic correct | NOT_RUN |
| production goes to ranch barrel/storage first | NOT_RUN |
| full/missing storage fallback safe | NOT_RUN |
| no duplicate/lost items | NOT_RUN |
| chunk unload/reload safe | NOT_RUN |
| multiplayer ownership safe | NOT_RUN |

## I. Save / migration

| Test | Status |
| --- | --- |
| old stored creatures remain | NOT_RUN |
| active party remains | NOT_RUN |
| levels/evolution state remain | NOT_RUN |
| ranch state remains | NOT_RUN |
| no duplicate companions after upgrade | NOT_RUN |
| save/rejoin multiple times | NOT_RUN |

## Runtime evidence rule

When a runtime test is performed, record:
- build version
- Bedrock version
- device/input method
- result
- screenshot/log reference when relevant
- reproduction steps for failures

Do not convert NOT_RUN to PASS based on code inspection.
