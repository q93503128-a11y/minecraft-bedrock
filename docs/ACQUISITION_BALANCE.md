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

## Fishing — 0.14.0

Fishing now uses an event-based hook-lifecycle adapter derived from MIT-licensed MinecraftCustomEvents rather than granting rewards merely because a fishing rod was clicked.

A catch is eligible only when:
- a fishing-rod use is paired with an actual spawned `minecraft:fishing_hook`;
- that hook is observed in water;
- the hook is removed and an actual newly spawned item entity is observed at the catch point.

Empty reel-ins therefore do not count. Simultaneous player casts are paired by dimension and nearest same-tick hook/cast position.

Normal successful catch rolls:
- Common Fragment: 10%
- Rare Fragment: 1.2%
- Epic Fragment: 0.10%
- Post-dragon Legendary Fragment: 0.02%

Vanilla treasure-category catches (bow, enchanted book, fishing rod, name tag, nautilus shell, saddle):
- Common Fragment: 25%, 1–2
- Rare Fragment: 5%
- Epic Fragment: 0.8%
- Post-dragon Legendary Fragment: 0.12%

There is still no repeat-action probability decay.

## Deferred acquisition channels

No core acquisition channel from the canonical list is intentionally deferred after 0.14.0. Future work may still rebalance probabilities after real-game telemetry.


## Exploration containers — 0.4.0

The stable Script API exposes `blockContainerOpened`; the project now uses it for finite exploration rewards.

Eligible block containers:
- Chest
- Trapped Chest
- Barrel

Anti-abuse rules:
- Player-placed eligible containers are marked on `playerPlaceBlock` and never receive exploration rewards.
- Natural/unmarked containers roll only on their first open.
- Each opened natural container is persisted by a hashed dimension + coordinate world dynamic-property key.

First-open rolls:
- Common Fragment: 22%
- Rare Fragment: 4.5%
- Epic Fragment: 0.6%
- Common Lucky Block: 1.2%
- After the Ender Dragon gate, Legendary Fragment: 0.10%

These rolls do not use repeat-action decay; the finite first-open rule represents exploration scarcity rather than punishment for repetition.


## Upward Lucky Block fusion — 0.19.0

The existing recipe of six same-tier fragments -> one same-tier Lucky Block remains unchanged.

Deterministic upward fusion is now:
- 4 Common Lucky Blocks + 2 Rare Fragments -> 1 Rare Lucky Block;
- 4 Rare Lucky Blocks + 2 Epic Fragments -> 1 Epic Lucky Block;
- 5 Epic Lucky Blocks + 3 Legendary Fragments -> 1 Legendary Lucky Block;
- 5 Legendary Lucky Blocks + 4 Mythic Fragments -> 1 Mythic Lucky Block.

The catalyst is always the destination tier's fragment, so no redundant catalyst item or temporary asset was introduced. The Legendary -> Mythic route is practically late-game-gated because normal Mythic Fragment supply begins at the first Ender Dragon transition and post-dragon rewards.

The full progression-EV rationale lives in `docs/FUSION_EV_MODEL.md`.
