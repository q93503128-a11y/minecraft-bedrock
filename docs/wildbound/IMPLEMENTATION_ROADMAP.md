# Wildbound Remake Implementation Roadmap

Last updated: 2026-10-02

## Principle

Do not expand quantity until the remake foundations pass real Bedrock runtime validation.

## R0 — Baseline and failure capture

Status: COMPLETE

- establish v1.27.7 clean baseline
- audit forms/entities/models/animations
- identify ability-pattern repetition
- identify instant-damage boss architecture
- identify ranch roles
- record ALPHA1 failure
- record ALPHA2 UI/UX runtime failure

## R1 — UI/UX architecture replacement

Status: **ALPHA3 IMPLEMENTED STATICALLY / RUNTIME PENDING**

ALPHA2 result:
- custom routing worked;
- fixed three-column deck and mixed screen system failed real usability/readability review.

ALPHA3:
- unified custom hub is the normal Beast Seal entry;
- narrow-safe stacked deck;
- 2x2 party;
- 2x3 storage;
- fixed bottom toolbar;
- reduced card information density;
- Growth/Compass/Settings/Bestiary/Presets/Guide added to custom route family;
- consistent slate/gold visual language.

Exit gate:
- same small-window case is readable;
- core screens do not fall back to old gray form layout;
- Korean labels do not clip;
- controller/touch navigation is usable.

## R2 — Performance foundation

Status: PARTIAL / RUNTIME PENDING

- expensive combat decision cadence reduced;
- locomotion separated from heavy target search;
- no extra ALPHA1-style periodic preview systems;
- remaining nearby-entity queries still require profiling.

Exit gate:
- no severe tick/frame degradation in ordinary survival, boss fights, or ranch + four-companion scenarios.

## R3 — External model import pipeline

Status: IN PROGRESS

Current pipeline cases:
- Thornback late evolutions
- abyss/crab family source conversion

Next:
- verify scale/orientation/UV/animation in engine;
- only then expand to additional families;
- keep attribution/provenance current.

## R4 — Companion combat language

Status: PARTIAL FOUNDATIONS

Build reusable archetype motion/attack languages and family-specific signatures. Do not create thousands of nominally unique animations.

## R5 — Boss remaster

Status: TELEGRAPH ENGINE IMPLEMENTED / RUNTIME PENDING

Validate representative early/mid/late bosses before tuning all 22.

## R6 — Ranch / survival integration

Status: PARTIAL

Keep visible utility and physical storage integration while avoiding second-job maintenance or expensive decorative ticking.

## R7 — Family quality pass

Status: NOT STARTED AT SCALE

Prioritize common/iconic families, weak final evolutions, awakenings/Zenith, and boss-linked lines.

## R8 — Full regression / release candidate

Required:
- fresh world
- upgraded old world
- desktop/mobile/controller
- multiplayer
- low simulation distance
- chunk unload/reload
- save/rejoin
- companion summon/recall
- evolution
- ranch
- bosses
- UI navigation
- performance
