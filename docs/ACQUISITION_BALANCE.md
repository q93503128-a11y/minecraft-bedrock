# Acquisition Balance — 0.3 source milestone

The acquisition system intentionally does not reduce probability because an action is repeated.

## Block breaking

- Bulk stone/deepslate/netherrack/blackstone/end stone: Common Fragment 0.08%.
- Logs/wood/stems/hyphae: Common Fragment 0.8%.
- Mature crops and farm produce: Common Fragment 1.2%.
- Common ores: Common Fragment 3.0%, Rare Fragment 0.25%.
- Diamond/emerald/ancient debris class: Common Fragment 7.0%, Rare Fragment 1.5%, Epic Fragment 0.15%.

## Combat

- Standard hostile mobs: Common Fragment 2.5%, Rare Fragment 0.18%.
- Elite vanilla mobs (Ravager, Elder Guardian, Evoker, Piglin Brute, Warden): Rare Fragment 30%, Epic Fragment 8%.
- Wither: guaranteed Epic Lucky Block; Legendary Fragment 15% before the Dragon gate and 30% after.
- Post-dragon standard hostile mobs also gain a very small Epic Fragment roll.
- Post-dragon elite mobs gain a small Legendary Fragment roll.

## First Ender Dragon kill

World dynamic property `lb:post_dragon_unlocked` is set permanently on the first Ender Dragon death.

First-kill grant:
- 1 Legendary Lucky Block
- 2 Mythic Lucky Fragments

This is the transition from part one into the late-game content pool.

## Deferred acquisition channels

Fishing and block-container chest discovery are not faked through unreliable heuristics. They remain required work and will be attached using a robust implementation rather than temporary detection.
