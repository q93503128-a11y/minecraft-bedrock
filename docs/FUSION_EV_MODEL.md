# Lucky Block Fusion EV / Catalyst Model — 0.19.0

Status: implemented balance contract.

## Why this EV model is narrow

Lucky rewards are intentionally heterogeneous: pets, armor, mounts, structures, bosses and world events do not have one honest scalar "coin value". Assigning fake numeric utility to those outcomes would make the EV model look precise while actually being subjective.

The fusion check therefore measures the part that *is* directly comparable: **next-tier progression currency**. It asks how many next-tier fragments the source blocks would be expected to produce if opened instead, then compares that with the catalyst cost of deterministic fusion. Fusion also sacrifices every unique reward roll from the consumed blocks.

## Implemented upward fusion

| Fusion | Source blocks | Next-tier catalyst | Crafting slots | Result |
|---|---:|---:|---:|---|
| Common → Rare | 4 Common Lucky Blocks | 2 Rare Fragments | 6 | 1 Rare Lucky Block |
| Rare → Epic | 4 Rare Lucky Blocks | 2 Epic Fragments | 6 | 1 Epic Lucky Block |
| Epic → Legendary | 5 Epic Lucky Blocks | 3 Legendary Fragments | 8 | 1 Legendary Lucky Block |
| Legendary → Mythic | 5 Legendary Lucky Blocks | 4 Mythic Fragments | 9 | 1 Mythic Lucky Block |

The existing six-fragments-to-same-tier-block recipes remain unchanged.

## Progression EV check

The current opening pools directly emit next-tier fragments at these rates:

| Source tier | Direct next-tier fragment weight | Pool weight used | Expected next-tier fragments per opened block | Blocks sacrificed by fusion | Expected next-tier fragments forgone | Fusion catalyst | Catalyst / forgone-EV |
|---|---:|---:|---:|---:|---:|---:|---:|
| Common | 5 | 96 | 0.052 | 4 | 0.208 | 2 | 9.60× |
| Rare | 5 | 100 | 0.050 | 4 | 0.200 | 2 | 10.00× |
| Epic | 6 | 100 | 0.060 | 5 | 0.300 | 3 | 10.00× |
| Legendary | 12 | 122 | 0.098 | 5 | 0.492 | 4 | 8.13× |

Interpretation:
- fusion cannot economically bootstrap itself just by repeatedly opening the exact blocks it consumes;
- next-tier catalysts are expected to come mainly from harder acquisition sources, elite/boss rewards and lucky outliers;
- opening remains attractive because it preserves 4 / 4 / 5 / 5 materially different reward rolls;
- fusion is the safer progression route, but deliberately pays a deterministic-progression premium;
- the premium steepens in absolute catalyst count at Legendary/Mythic.

For Legendary → Mythic, the ordinary pre-dragon Legendary pool contributes **0 Mythic Fragments** because that reward is post-dragon gated. The table uses the post-dragon Legendary pool (12 / 122) for the late-game EV calculation. In normal play, Mythic Fragment catalyst supply therefore naturally follows the first Ender Dragon transition and post-dragon content.

## Rebalance rule

Do not change these ratios merely because one opening feels lucky or unlucky. Revisit them only after real Bedrock playtest telemetry can compare:
- blocks opened per tier;
- fragments acquired by source;
- fusion frequency;
- time-to-first Legendary/Mythic;
- percentage of players who choose opening vs fusion.

The target is not 50/50 usage at every tier. The target is a visible tradeoff: **open for unique-content EV and variance, fuse for deterministic tier progression at a premium**.
