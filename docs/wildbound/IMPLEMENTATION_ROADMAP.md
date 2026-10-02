# Wildbound Remake Implementation Roadmap

Last updated: 2026-10-02

## Principle

Do not expand content quantity until the remake foundations pass runtime validation.

## R0 — Baseline and failure capture

Status: COMPLETE

- establish `v1.27.7` as clean baseline
- audit form flow
- audit entity/model/animation counts
- identify ability-pattern repetition
- identify boss instant-damage architecture
- identify ranch/current production roles
- record ALPHA1 failures

## R1 — UI/UX architecture replacement

Status: IMPLEMENTED STATICALLY / RUNTIME PENDING

- replace legacy storage-first ActionForm chain with Wildbound JSON UI
- main dashboard
- creature deck
- party fixed panel
- storage panel
- selected creature detail/actions
- same-screen party replacement
- stable fallback icons
- ranch screen
- external licensed UI panel assets

Exit gate:
- actual Bedrock rendering works
- no legacy gray-form appearance on target screens
- no clipped Korean text
- controller/touch navigation usable

## R2 — Performance foundation

Status: PARTIALLY IMPLEMENTED / RUNTIME PENDING

- separate locomotion from expensive combat decisions
- lower expensive target-search cadence
- bound ranch presentation work
- avoid duplicate interval proliferation
- audit all nearby-entity searches
- add distance/state gating where needed
- profile many-companion and multiplayer scenarios

Exit gate:
- no severe frame/tick degradation in normal survival
- acceptable behavior with multiple nearby companions and wild mobs

## R3 — External model import pipeline

Status: IN PROGRESS

Validated candidates/pipeline cases:
- Thornback late evolution model basis
- crab/abyss model basis

Next:
- verify real in-engine UV/orientation/scale/animations
- select 3-5 additional families whose lineage fits available licensed models
- build repeatable importer/conversion checklist
- keep attribution/provenance current

Exit gate:
- imported model survives full runtime test
- evolution reads as a real transformation
- no invisible/broken geometry or animation

## R4 — Companion combat language

Status: PLANNED / PARTIAL FOUNDATIONS

For representative archetypes:
- anticipation
- attack animation
- physical projectile/hit zone
- impact feedback
- recovery
- visible signature ability

Do not attempt 3,388 bespoke animations. Build reusable archetype language and family-specific signatures.

## R5 — Boss remaster

Status: TELEGRAPH ENGINE IMPLEMENTED STATICALLY / RUNTIME PENDING

- remove instant invisible damage as main attack language
- boss-specific pattern profiles
- telegraphs
- dodge windows
- aftermath/recovery
- arena/lair identity
- phase behavior for major bosses

First runtime quality gate should use a small representative boss set before tuning all 22.

## R6 — Ranch / survival integration

Status: PARTIAL

- visible creature life/work where performance-safe
- physical storage destinations
- farming/collection/guard/scouting utility
- vanilla resource/progression integration
- no feeding/cleaning chores
- no second-job management loop

## R7 — Family-by-family quality pass

Status: NOT STARTED AT SCALE

Prioritize:
1. common/frequently encountered families
2. iconic/original Wildbound families
3. ugly/weak final evolutions
4. awakenings/Zenith
5. boss-linked families

For each family record:
- silhouette
- locomotion
- attack style
- signature ability
- evolution transformation
- habitat
- ranch role

## R8 — Full regression and release candidate

Required:
- fresh world
- upgraded old world
- singleplayer
- multiplayer host/client
- mobile
- controller
- desktop
- low simulation distance
- chunk unload/reload
- save/rejoin
- death/respawn
- companion summon/recall
- ranch
- evolution
- bosses
- UI navigation
- performance

No final release label until runtime matrix is substantially complete.
