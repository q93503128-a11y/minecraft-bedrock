# Wildbound / 야수각인 Remake Canon

Last updated: 2026-10-02  
Current documented build: `Wildbound_v1.28.2_REMAKE_ALPHA3.mcaddon`  
Clean remake baseline: `v1.27.7`

> This file is binding unless deliberately revised.

## 1. Core identity

Wildbound must remain a creature-capture/growth/evolution/combat/ranch system inside Minecraft survival, not a separate grind that replaces Minecraft.

Target loop:

**Minecraft survival/exploration -> natural beast encounter -> capture/grow/evolve -> beast improves survival/base/exploration -> back to Minecraft progression.**

## 2. Preserve

- unlimited storage
- maximum 4 active companions
- no feeding/hunger chores
- conditional automatic abilities
- one evolution lineage per family
- no friendly fire
- save compatibility where possible
- low-maintenance pet ownership

## 3. Quality over quantity

Hundreds of forms already exist. New count is frozen unless it adds real value.

A remastered family needs meaningful identity through silhouette, movement, combat, signature ability, ecology, ranch utility and/or real evolution transformation. Recolor/stat/overlay-only change is insufficient.

## 4. Evolution

Evolution should change body plan/proportion/posture/limbs/horns/wings/tail/motion/attack/VFX where appropriate. Final/Zenith forms may not simply be larger glowing base forms.

External models are allowed only with compatible licensing and lineage fit.

## 5. Combat

Important attacks should read:

**telegraph -> animation -> projectile/hit zone -> impact -> recovery**

Invisible instant damage should not define creature or boss combat.

## 6. Bosses

Major bosses require readable telegraphs, multiple patterns, punish/recovery windows, distinctive mechanic, encounter-space identity, and appropriate model/animation/VFX/audio/reward identity.

## 7. Ranch

Ranch value should come from visible/useful creature life and work: farming, collection, defense, scouting, processing, recovery/training and collection display.

No hunger/cleaning/constant manual feeding. Avoid expensive decorative ticking.

## 8. Survival integration

Use vanilla resources, dimensions, structures, biomes and progression milestones. Companions should assist Minecraft rather than fully automate it.

## 9. UI/UX

UI/UX is a first-class system.

Hard goals:
- party visible during storage/replacement
- selected/page/filter state persists where practical
- common actions use few inputs
- destructive actions separated
- fixed navigation
- readable Korean
- mobile/controller support
- no entity UV-sheet portraits

### ALPHA2 lesson

A fixed three-column “party | storage | detail” layout is **not** mandatory and is rejected when width becomes cramped.

Real ALPHA2 screenshots proved that technically custom JSON UI can still have poor UX. Readability and information hierarchy outrank dashboard density.

ALPHA3 therefore uses a narrow-safe stacked deck:
**selected summary -> party 2x2 -> storage 2x3 -> fixed toolbar.**

Legacy gray vertical forms are not acceptable for core navigation.

## 10. Performance

- avoid high-frequency global scans
- separate locomotion from expensive targeting
- filter by distance/state
- cache where safe
- prefer events over polling
- bound ranch helpers
- clean up telegraphs/helpers
- test unload/multiplayer

Visual polish does not excuse severe tick/frame cost.

## 11. External assets

Every imported asset requires source/license/file-scope/provenance, commercial-use compatibility when relevant, attribution when required, dependency wiring, and actual runtime validation.

Never rip Marketplace/ARR/unclear assets.

## 12. Rejected checkpoints

### ALPHA1
Rejected for native-form-heavy UI, UV-sheet portraits, excessive periodic work, and overstated remaster scope.

### ALPHA2 UI/UX
Rejected after real runtime screenshots for cramped fixed three-column layout, low text/card readability, weak hierarchy, inconsistent custom/native screen language and unfocused color use.

Gameplay/model/performance work from ALPHA2 may remain when independently valid.

## 13. Acceptance

A checkpoint is accepted only after actual Bedrock runtime validation. Static JSON/JS/reference checks are necessary but insufficient.
