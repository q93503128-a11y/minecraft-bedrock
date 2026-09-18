# Lucky Block Add-On Canon

Status: canonical planning baseline
Platform: Minecraft Bedrock Edition Add-On
Delivery target: one importable .mcaddon containing Behavior Pack + Resource Pack

## Core experience

The add-on is not an old-style random block that only gives vanilla loot. Lucky acquisition itself should feel rewarding. Players obtain Lucky Fragments and Lucky Blocks through normal play: mining, logging, farming, fishing, combat, exploration, chest looting, elite encounters and bosses.

There is no anti-farming probability decay. Easier actions provide lower-tier chances; harder and riskier actions improve drop chance and/or tier.

## Tiers

1. Common
2. Rare
3. Epic
4. Legendary
5. Mythic

Tier identity must be structural, not recolors. Higher tiers increase model complexity, material detail, crystals/gems, frames, emissive or animated elements, particles, acquisition sound and opening presentation. Legendary and Mythic may use different silhouettes. Lucky Fragments also require distinct production-quality appearances.

## Fusion

Lower Lucky Blocks can be combined upward. Exact ratios are balance data, not hard-coded design law. The system must preserve a meaningful choice between opening now for expected value and fusing for a safer higher-tier result. High-tier fusion may require catalysts.

## Reward philosophy

Avoid filler tables consisting mainly of vanilla ingots or duplicated stat sticks. The long-term target is hundreds of materially different results.

Reward families include unusual items, foods, custom melee/ranged/magic gear, armor, pets, mounts, mobility tools, summons, potions, tools, mobs, minibosses, bosses, structures, dungeons, treasure rooms, world events, traps, jokes, raids, wave defense, minigames and chained Lucky events.

Common: frequent, weird, comic, small traps, occasional jackpot.
Rare: practical custom items, useful gear, small structures, pets and events.
Epic: strong gear, special abilities, strong pets, minibosses, dungeons and mobility.
Legendary: top-end gear, unique weapons, rare mounts, major events, bosses, large structures and chained jackpots.
Mythic: a content drop rather than a single high-stat item, such as a dedicated boss encounter, invasion, dungeon, set, Lucky Rain or unique world event.

Duplicate rewards with only names/textures changed do not count as distinct content.

## Ender Dragon gate

The first Ender Dragon kill ends part one and unlocks late-game content. Post-dragon progression activates new normal enemies, elites, minibosses, bosses, events and late-game Lucky rewards.

Late-game enemies are rebalanced around the Lucky Block growth curve rather than preserving source-mod stats. Bosses should use phases, attack patterns, telegraphs, dodging, vulnerability windows, summons, area attacks, movement and encounter mechanics rather than becoming simple HP sponges.

## Asset production rule

No placeholder assets. No temporary textures, temporary models, temporary icons, temporary sounds, colored Steve/Zombie stand-ins, blank boxes or "replace later" content.

When a needed asset does not yet have a qualified source:
1. search more broadly;
2. verify source and license;
3. only if no suitable reusable asset exists, create a finished asset directly.

## External reuse

Prefer CC0, MIT, BSD, ISC, Apache and usable CC BY sources. Track original author, URL, license, exact files/content to import, modifications, intended Lucky tier, pre/post-dragon use and Bedrock port difficulty.

Public availability alone is not permission. Third-party sub-assets need their own provenance checks. Non-redistributable assets are reference-only.

Java assets can be ported when the license permits, but Java code is not treated as Bedrock-compatible code.

## Repository role

This repository stores planning, research, licensing, content catalogs and implementation records. Actual Add-On assets/code may be developed separately when appropriate. CI/GitHub Actions are not a default requirement for this documentation repository.
