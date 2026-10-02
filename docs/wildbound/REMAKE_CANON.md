# Wildbound / 야수각인 Remake Canon

Last updated: 2026-10-02  
Current documented build: `Wildbound_v1.28.1_REMAKE_ALPHA2.mcaddon`  
Clean remake baseline: `v1.27.7`

> This file is the binding design canon for the Wildbound remake unless deliberately revised.

## 1. Core identity

Wildbound is a creature capture, growth, evolution, combat, exploration, and ranch system that must remain part of Minecraft survival rather than replace Minecraft survival.

Target loop:

**Minecraft survival/exploration -> naturally encounter beasts -> capture/grow/evolve -> beasts improve survival/base/exploration -> player returns to Minecraft progression.**

A separate grind loop where the player mostly ignores mining, building, dimensions, structures, and vanilla progression is considered a design failure.

## 2. Existing strengths that must be preserved

Unless intentionally redesigned with migration:

- unlimited storage
- maximum 4 active companions
- no feeding/hunger maintenance chores
- conditional automatic abilities
- one evolution lineage per creature family
- no friendly fire
- existing worlds and stored creature data should remain compatible
- capture and management should not require tedious repetitive maintenance

## 3. Quality-over-quantity rule

Wildbound already has hundreds of forms. New creature count is frozen unless a new creature adds real gameplay value.

Do not solve quality problems by adding more forms.

Each remastered family should gain meaningful identity through some combination of:

- silhouette/body-plan difference
- movement language
- attack language
- signature skill
- habitat/ecology
- ranch utility
- evolution transformation
- audio/VFX identity

A recolor, armor overlay, stat increase, or renamed duplicate does not count as a meaningful evolution.

## 4. Evolution quality bar

Evolution must visibly transform the creature.

Preferred changes:

- body proportions
- head/limb/tail/wing/horn structure
- posture
- locomotion
- attack animation
- signature effect
- combat role where appropriate

Final/Zenith forms must not look like the base form with only a glow, helmet, or larger scale.

External models may be used when the license permits it, but lineage fit is mandatory. A random cool model is not acceptable if it breaks the family identity.

## 5. Combat presentation

Important attacks should follow:

**anticipation / telegraph -> animation -> projectile or visible hit zone -> impact -> recovery**

Instant invisible damage should be minimized.

Creatures should use family/archetype combat languages, for example:

- canine: pursuit, leap, bite, flank
- bird: lift, dive, ranged feather/wind
- crab/tank: guard, claw sweep, armor break
- caster: charge, projectile, zone control
- serpent: coil, lunge, breath, area denial

The ability catalog must create visible gameplay diversity, not only many names and numeric variants.

## 6. Boss quality bar

A Wildbound boss must feel like a boss encounter, not a high-HP creature.

Required for major bosses:

- recognizable silhouette
- dedicated encounter identity
- readable telegraphs
- multiple attacks
- recovery/punish windows
- at least one distinctive mechanic
- phase or pressure change when justified
- visible projectiles/hit zones
- appropriate VFX/audio
- arena/lair/world-space identity
- meaningful reward/progression connection

Shared generic patterns may exist as secondary filler, but cannot define the entire fight.

## 7. Ranch direction

The ranch must be worth building because captured creatures visibly live and work there.

Preferred functions:

- crop tending
- drop collection
- patrol/defense
- scouting/marking
- resource processing
- recovery/training
- collection display / creature life

Avoid:

- hunger bars
- cleaning chores
- constant manual feeding
- repetitive pet micromanagement
- excessive ticking entities solely for decoration

Ranch production should connect to physical storage/world behavior where practical.

## 8. Minecraft survival integration

Wildbound progression should use Minecraft progression and exploration.

Examples:

- vanilla resources as evolution/crafting inputs
- biome and structure-linked encounters
- Nether/ocean/ancient-city/End milestones
- survival actions contributing to creature growth or discovery
- companions supporting mining, traversal, farming, exploration, and defense

Companions should assist rather than fully automate Minecraft.

## 9. UI/UX is a first-class system

A visually attractive UI with bad navigation is still rejected.

Main management goals:

- party visible while browsing storage
- storage and selected-creature details visible together
- selected creature state persists
- common actions require minimal inputs
- dangerous actions isolated
- fixed/consistent navigation controls
- clear information hierarchy
- mobile/controller readability
- no broken entity UV sheets used as portraits

Legacy gray vertical ActionForm chains are not the target presentation.

See `UX_UI_SPEC.md`.

## 10. Performance budget

Do not add presentation systems without a runtime budget.

Rules:

- avoid full-world/global scans on high-frequency timers
- separate locomotion updates from expensive combat target searches
- use distance/state filtering
- cache nearby targets when safe
- prefer event-driven work over polling
- keep ranch decorative entities bounded
- clean up spawned helpers/telegraphs
- test multiplayer ownership and chunk unload behavior

A feature that creates severe frame/tick degradation is not accepted because it is visually impressive.

## 11. External assets

External UI/model/animation assets are allowed and encouraged when they materially raise quality.

Hard requirements:

- known source
- known license
- commercial-use compatibility if the project may be monetized
- attribution where required
- asset-level provenance, not only repository-level assumptions
- dependency chain imported correctly
- runtime validation after conversion

Never rip Marketplace, All Rights Reserved, or unclear-license assets.

## 12. Rejected ALPHA1 lesson

`v1.28.0 REMAKE ALPHA1` is not a quality baseline.

Reasons:

- retained default ActionForm structure
- external UI art was used mostly as button icons rather than a real layout
- vanilla entity UV textures were displayed as portraits, causing broken/disassembled icons
- excessive periodic systems worsened performance
- scope of creature/model remaster was smaller than claimed

Future build descriptions must match the actual implementation scope.

## 13. Acceptance principle

A remake checkpoint is accepted only when actual Bedrock runtime testing confirms the intended behavior.

Static JSON/JS checks are necessary but insufficient.
