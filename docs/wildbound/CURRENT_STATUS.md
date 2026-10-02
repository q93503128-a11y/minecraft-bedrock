# Wildbound Current Status

Last updated: 2026-10-02

## Current documented build

`Wildbound_v1.28.1_REMAKE_ALPHA2.mcaddon`

Base:
- clean `v1.27.7`
- ALPHA1 changes were not used as the source baseline

Data version:
- `1281`

## Runtime validation state

**ALPHA2 actual Bedrock runtime test: NOT_RUN at documentation time.**

Do not mark the build complete based only on static checks.

## Why ALPHA2 was rebuilt from v1.27.7

ALPHA1 was rejected after runtime screenshots/feedback because:

- UI remained close to default ActionForm presentation
- UX still required too much scrolling/menu hopping
- vanilla entity texture UV sheets were used as UI icons and appeared disassembled
- performance became significantly worse
- the claimed scope of the remake exceeded the actual visible change

ALPHA2 therefore restarted from the last clean stable baseline.

## ALPHA2 implemented work

### UI / UX

- custom JSON UI routing for Wildbound-specific server forms
- custom main dashboard
- custom creature deck/storage screen
- custom ranch screen
- party panel visible alongside storage
- selected creature detail/actions retained in the same management context
- party-full replacement moved into same deck flow
- broken entity-skin icon approach removed
- external Kenney panel/frame assets used as actual UI primitives

### Performance

- expensive global combat/target decision loop reduced from 10-tick to 20-tick cadence
- locomotion/follow/flying/swimming correction kept separately at a higher cadence where needed
- goal is to reduce target-search cost without making companions visibly sluggish
- ALPHA1-style proliferation of new high-frequency intervals avoided

### Boss combat

- legacy instant-damage boss skill path is being replaced/overridden by telegraphed pattern logic
- profiles include patterns such as:
  - leap
  - line
  - radial
  - lightning marker
  - pull
  - root/hold
  - meteor
  - cross-pattern attack
- intended flow: telegraph -> dodge window -> damage resolution

Runtime feel is not yet verified.

### Creature/evolution presentation

Thornback family:
- late evolution silhouettes remastered with external CC BY 4.0 model basis

Abyss/crab family:
- `krab.bbmodel` conversion pipeline implemented/used as another external-model integration case
- original source includes idle/walk/jump animation data

Mass conversion of all hundreds of forms is intentionally not done yet.

### Ranch

- production flow targets actual ranch storage/barrel first where available
- fallback remains when no valid storage is available
- ranch presentation/work should stay bounded to avoid reintroducing ALPHA1 performance issues

## Static validation recorded for ALPHA2

Latest packaged ALPHA2 was reported with:

- 1,071 JSON files parsed successfully
- BP entity IDs: 511
- RP client entity IDs: 511
- BP/RP entity ID correspondence: complete
- JavaScript syntax check: pass
- manifest BP/RP dependency relationship: pass
- custom geometry/animation/render-controller reference checks: pass
- ZIP CRC: pass

These checks do not prove JSON UI runtime behavior or performance.

## Highest-priority open risks

1. Custom `server_form.json` routing may fail or render differently on the current Bedrock stable runtime.
2. Desktop layout may not scale cleanly to mobile/controller.
3. Controller focus order may need explicit fixes.
4. External converted model orientation, scale, UV, and animation may differ in-engine.
5. 20-tick combat decision cadence may improve performance but still requires profiling with many companions/entities.
6. Boss telegraph timing and damage zones require gameplay tuning.
7. Ranch storage lookup and multiplayer ownership require real-world testing.
8. Save migration/old-world compatibility still requires fresh + upgraded-world validation.

## Next required milestone

Run ALPHA2 in actual Bedrock and collect:

- screenshots of main/deck/ranch UI
- input behavior
- frame/tick feel
- content log errors/warnings
- external model screenshots
- boss behavior
- ranch behavior

Then produce ALPHA3 based on observed failures, not assumptions.
