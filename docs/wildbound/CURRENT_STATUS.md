# Wildbound Current Status

Last updated: 2026-10-02

## Current documented build

`Wildbound_v1.28.2_REMAKE_ALPHA3.mcaddon`

Data version: `1282`

Foundation:
- clean `v1.27.7` remains the remake origin
- ALPHA2 gameplay/model/performance changes are retained
- ALPHA2 UI layer is not the accepted UX baseline

## ALPHA2 real-runtime result

**UI/UX: FAIL**

Real Bedrock screenshots showed:
- custom JSON UI routing itself worked;
- the deck/ranch custom screens rendered;
- the fixed three-column deck became too cramped in a small Minecraft window;
- Korean text and card information were too dense/small;
- visual hierarchy was weak;
- the palette mixed too many competing card colors;
- several core paths still exposed native gray ActionForm screens;
- removing broken UV-sheet icons did not by itself create good creature identification or good UX.

This failure is recorded as a design/implementation failure, not a cosmetic preference issue.

## ALPHA3 UI/UX changes

- normal Beast Seal use now opens the custom Wildbound hub;
- sneak-use is retained as a direct deck shortcut;
- deck layout changed from fixed side-by-side 3-panel design to:
  1. selected creature summary
  2. party 2x2
  3. storage 2x3
  4. fixed bottom navigation/actions
- storage page size reduced from 12 to 6;
- creature cards prioritize name, level and role instead of dumping secondary stats;
- Growth, Compass, Settings, Bestiary, Presets and Guide are routed into the same custom UI family;
- slate + muted-gold UI palette replaces the ALPHA2 mixed cyan/red/gold presentation;
- entity UV-sheet portraits remain prohibited;
- selected creature/page/replacement state continues to be preserved where possible.

## Gameplay/system foundation retained from ALPHA2

### Performance
- expensive combat/target decisions remain on the reduced 20-tick cadence;
- locomotion/follow/flying/swimming correction remains separate where higher frequency is needed;
- `system.runInterval` count remains 14;
- no ALPHA1-style living-preview loop proliferation was reintroduced.

### Bosses
- 22 boss profiles continue to use the telegraph -> dodge window -> hit-resolution foundation.

### Models
- Thornback late evolutions retain the external-model silhouette remaster.
- Abyss/crab external model conversion pipeline remains present.

### Ranch
- production continues to prefer real ranch barrel/storage before player fallback.

## ALPHA3 static/package verification

- JSON files parsed: 1,076
- BP entity IDs: 511
- RP client entity IDs: 511
- BP/RP entity ID sets: exact match
- JavaScript syntax: PASS
- custom geometry/animation/render-controller reference checks: PASS
- custom UI route/reference checks: PASS
- ZIP CRC checks: PASS
- runInterval calls: 14

## Current runtime status

**ALPHA3: NOT_RUN**

Highest-priority runtime questions:
1. Does the stacked deck remain readable in the same small window that broke ALPHA2?
2. Do all newly routed core screens render rather than falling back to native gray forms?
3. Does Korean text clip at common GUI scales?
4. Does controller/touch focus follow the new visual order?
5. Is performance at least no worse than ALPHA2/v1.27.7?
6. Do imported model, boss telegraph, ranch and save-compatibility systems still work after the UI rebuild?
