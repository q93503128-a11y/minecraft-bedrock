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

Implemented reward-family slices now include utility/decor, Slasher melee, Tomemancy Mythic magic, Irk pet, War Ant ground mount, the post-dragon Sky Damselfly 3D flight mount, the Tomemancy Amethyst Repeater burst/finite-ammo ranged weapon, the self-defense Mystical Aegis full armor set, the two-piece Explorer Field Kit utility/support wearable archetype, a Loy's Goodies Auto-Turret deployable combat-tool family, and the four-state Storm Longbow precision/charge/pierce ranged archetype. Fortune Bulwark binds the deployable into a real defense outcome. Two distinct minigame roles are now present: Fortune Relay timed traversal and Fortune Gallery projectile accuracy/co-op scoring. Ground/flight mount and defense/exploration wearable roles are represented; additional minigame variants, wearable/accessory roles and sheer outcome count remain thin.

## P4 — Pre-dragon encounter layer
Introduce selected custom mobs, pets, structures, minibosses and world events that fit vanilla progression plus Lucky growth.

Implemented P4 slices: Inhabitants Impaler elite, Slayers-Beasts Irk companion, persistent Awakened Grove/Ent-guardian event, Slayers-Beasts War Ant player-controlled mount, pre-dragon Nether Wither Spider ranged/control encounter, the permanent Fortune Relay Vault timed maze/minigame, Fortune Gallery cooperative projectile-accuracy arena, Royal Anthill/Ant Queen, and Fortune Bulwark as a deployable-assisted three-wave defense structure/event. Still thin: additional independent miniboss/exploration families and more non-combat/event variants.

## P5 — First Ender Dragon gate
Persist a world-level first-kill unlock. After that point, late-game spawn tables, event tables, rewards and encounter pools become eligible.

## P6 — Late game
Port/rebuild verified high-quality enemies and bosses. Every major boss receives encounter mechanics: telegraphs, phases, vulnerability windows, mobility, area denial and/or adds. Raw HP inflation cannot be the primary difficulty mechanism.

Implemented P6 slices: Bogre late-game miniboss, Obsidilith Mythic boss, End Warped Clam, Slayers-Beasts Mantis post-dragon predator, Tyrachnid rare cave elite, and Wudu Binder control/support enemy with a dodgeable pull plus ally ward. Continue expanding ranged/support/control and encounter-family variety rather than adding raw boss HP.

## P7 — Mythic outcomes
Mythic Lucky Blocks award content packages: boss/event/dungeon/set/invasion/Lucky Rain-style experiences rather than merely one huge-stat item.

Implemented P7 slices: Obsidilith boss encounter, Tomemancer Archmage Set, persistent Rift Siege invasion/wave event, persistent Lucky Rain event and the persistent Rift Vault structure/dungeon package. Still missing: additional chained event families, more dungeon variants and broader reward-family coverage.

## P8 — Packaging and release validation
- Package BP + RP as one .mcaddon.
- Import into current stable Bedrock and test new world + existing world.
- Verify no missing texture/model/sound, no content-log errors, no developer text, and no dangling experimental dependencies unless explicitly justified.
- Verify attribution/license bundle.
- Balance-test acquisition rate, fusion choice and pre/post-dragon scaling.

## Current production note

As of 2026-09-18 the current stable Bedrock release line is 26.51. Script/module dependencies must be rechecked against stable creator documentation immediately before each distributable build. The current stable creator docs expose @minecraft/server 2.x, with 2.9.0 listed on the stable module page.
