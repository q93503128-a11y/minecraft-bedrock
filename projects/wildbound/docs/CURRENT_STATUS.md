# Wildbound Current Status

Last updated: 2026-10-02

## Current build

`Wildbound_v1.28.3_REMAKE_ALPHA4.mcaddon`  
Data version: `1283`

## ALPHA3 runtime verdict

**UI layout: HARD FAIL**

Observed screenshot:
- Wildbound controls did not form a coherent window;
- panel/button elements collapsed into thin black vertical strips;
- icons and text appeared detached/floating over the player/world;
- the form was unusable.

Root cause identified in the ALPHA3 source:
- screen contents used multiple fixed logical-pixel heights/offsets;
- those blocks assumed more logical vertical space than the small Minecraft window provided;
- Bedrock UI scaling reduced the logical viewport, so the layout collapsed/clipped instead of adapting.

This is not recorded as a taste issue. It is a functional layout failure.

## ALPHA4 correction

- core screens use `common.scrolling_panel`;
- the viewport size follows the actual available screen area;
- content keeps normal card dimensions and becomes vertically scrollable;
- deck remains:
  - selected creature summary
  - party 2x2
  - storage 2x3
  - navigation/actions
- no ALPHA3 fixed-total-height stack is required to fit at once;
- main/deck/pet/ranch/guide/growth/compass/settings/presets/bestiary all use the scroll-safe shell;
- gameplay/model/boss/ranch/performance changes from earlier rebuilds are retained.

## ALPHA4 static verification

- JSON files: 1,076 parsed
- BP entities: 511
- RP client entities: 511
- BP/RP identifier sets: exact match
- JavaScript syntax: PASS
- geometry/animation/render-controller references: PASS
- custom UI routes/content references: PASS
- fixed-height ALPHA3 layout tokens: rejected by validator
- runInterval calls: 14
- archive CRC: PASS

## Runtime status

**ALPHA4: NOT_RUN**

First gate: use the same small Minecraft window. The Wildbound screen must appear as one complete framed, vertically scrollable UI. Any black strips/floating controls are an immediate FAIL.
