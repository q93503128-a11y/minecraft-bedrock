# Lucky Block Add-On Implementation Roadmap

Reviewed: 2026-09-18

## P0 — Canon and legal inventory
Complete. Canon, license notes and initial asset catalog live in this repository.

## P1 — Real visual foundation
- Port a verified CC0 pylon crystal model into Bedrock geometry for the first Lucky Fragment.
- Establish five Lucky Block silhouette contracts using actual verified assets, not temporary boxes.
- Keep source/provenance metadata beside every imported external asset.
- Validate geometry bounds, UV mapping, render method and item/block display.

Exit condition: no placeholder visuals anywhere in the first importable pack.

## P2 — Acquisition and opening core
- Register five Lucky Block tiers and fragment items/blocks.
- Hook acquisition sources: mining, logging, farming, fishing, mob kills, exploration/chests, elites and bosses. (implemented; fishing completed in 0.14.0)
- No probability decay from repeating an activity.
- Implement weighted opening dispatcher by tier.
- Tier-specific opening presentation implemented in 0.19.0 using already-vendored production particles/audio with increasing pulse/ring complexity by tier.
- Upward fusion implemented in 0.19.0 after a progression-currency EV check: 4+2 / 4+2 / 5+3 / 5+4 source-block + next-tier-fragment catalyst recipes. See `docs/FUSION_EV_MODEL.md`.

## P3 — Reward library
Build materially distinct outcomes in batches. Each batch must mix item, encounter and world-event categories instead of inflating count with stat/name variants.

Initial direct-use/rebuild sources: Loy's Goodies, FrenchKrab-cleared models, Themonsterguns, official Bedrock samples.

Implemented reward-family slices now include utility/decor, multiple melee/ranged/magic archetypes, pet and ground/flight mounts, armor, support wearables, specialist tools, deployables, two minigames and ecological exploration. 0.30.0 adds two distinct head-accessory roles (Tomemancy Arcane Focus and monster-family Threat Lens) plus the portable Fortune Tonic defensive consumable, closing most of the previously thin wearable/accessory/status niches. Remaining P3 weakness is now dominated by sheer materially-distinct outcome count, structures/dungeons and a smaller number of specialist consumable/utility roles.

## P4 — Pre-dragon encounter layer
Introduce selected custom mobs, pets, structures, minibosses and world events that fit vanilla progression plus Lucky growth.

Implemented P4 slices: Inhabitants Impaler elite, Slayers-Beasts Irk companion, persistent Awakened Grove/Ent-guardian event, Slayers-Beasts War Ant player-controlled mount, pre-dragon Nether Wither Spider ranged/control encounter, the permanent Fortune Relay Vault timed maze/minigame, Fortune Gallery cooperative projectile-accuracy arena, the Butterfly Sanctuary moving-wildlife observation/exploration event, Royal Anthill/Ant Queen, and Fortune Bulwark as a deployable-assisted three-wave defense structure/event. Still thin: additional independent miniboss families, alternate exploration structures and more non-combat/event variants.

## P5 — First Ender Dragon gate
Persist a world-level first-kill unlock. After that point, late-game spawn tables, event tables, rewards and encounter pools become eligible.

## P6 — Late game
Port/rebuild verified high-quality enemies and bosses. Every major boss receives encounter mechanics: telegraphs, phases, vulnerability windows, mobility, area denial and/or adds. Raw HP inflation cannot be the primary difficulty mechanism.

Implemented P6 slices: Bogre late-game miniboss, Obsidilith Mythic boss, End Warped Clam, Mantis predator, Tyrachnid cave elite, Wudu Binder control/support, mixed-role Rift Arsenal waves, and now BOMD Gauntlet as a second mechanically complete boss family. Gauntlet adds delayed tracking laser, dodge-reward punch, multi-pulse area denial, blindness pressure and two breakable-anchor shield/vulnerability phases. Remaining P6 work is primarily broader normal-mob/ranged-family variety and more encounter combinations, not another raw-HP boss.

## P7 — Mythic outcomes
Mythic Lucky Blocks award content packages: boss/event/dungeon/set/invasion/Lucky Rain-style experiences rather than merely one huge-stat item.

Implemented P7 slices: Obsidilith boss encounter, Tomemancer Archmage Set, Rift Siege, Lucky Rain, Rift Vault, chained Rift Arsenal, and now Gauntlet as a second direct Mythic boss outcome with source-faithful multi-pattern combat and shield counterplay. More dungeon variants and a smaller number of chained-event/package families remain.

## P8 — Packaging and release validation
- Package BP + RP as one .mcaddon.
- Import into current stable Bedrock and test new world + existing world.
- Verify no missing texture/model/sound, no content-log errors, no developer text, and no dangling experimental dependencies unless explicitly justified.
- Verify attribution/license bundle.
- Balance-test acquisition rate, fusion choice and pre/post-dragon scaling.

## Current production note

As of 2026-09-18 the current stable Bedrock release line is 26.51. Script/module dependencies must be rechecked against stable creator documentation immediately before each distributable build. The current stable creator docs expose @minecraft/server 2.x, with 2.9.0 listed on the stable module page.
