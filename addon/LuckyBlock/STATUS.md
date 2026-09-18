# Lucky Block Add-On source status

Milestone: 0.2.0 five-tier real-asset visual slice

Implemented:
- Behavior Pack and Resource Pack manifests, bumped to 0.2.0.
- All five Lucky Block tiers now exist as distinct blocks.
- All five Lucky Fragment tiers now exist as distinct blocks.
- Common keeps the Microsoft MIT Lucky Block sample geometry/texture base.
- Rare and Epic use distinct CC0 bipyramid crystal geometries.
- Legendary uses the 141-element CC0 Natura ring geometry.
- Mythic uses the 196-element CC0 Gaia ring geometry.
- Higher tiers use increasing light emission: Rare 4, Epic 7, Legendary 11, Mythic 15.
- CC0 mana/natura/gaia crystal textures and natura/gaia ring textures are integrated as actual binary assets.
- Crystal textures retain animated flipbooks.
- Current geometry conversions use the 1.21.0 visual schema so per-face uv_rotation from the source models is preserved.
- All five tiers have opening component registrations.
- Tier cascade opening outcomes are implemented as real progression outcomes while the large reward pool is still being built.
- Six same-tier fragments craft one same-tier Lucky Block.
- Korean and English names exist for every current tier.
- Built:
  - build/LuckyBlock_BP_0.2.0.mcpack
  - build/LuckyBlock_RP_0.2.0.mcpack
  - build/LuckyBlock_0.2.0.mcaddon

Important:
- 0.2.0 is not the finished project.
- Runtime import/Content Log testing in Minecraft Bedrock is still required.
- The reward system is intentionally not being called complete until external custom items/events/mobs/structures are integrated.

Remaining major work:
1. normal-play acquisition hooks and tuned drop tables;
2. large Common-to-Mythic external reward library;
3. custom weapons/tools/food/pets/mounts/mob encounters;
4. structures, traps, chained events and world events;
5. first-Ender-Dragon persistent unlock;
6. post-dragon normal mobs, elites, minibosses and bosses;
7. boss mechanics and late-game stat rebalance;
8. Mythic content-package outcomes;
9. repeated balance/compatibility/runtime QA and final release packaging.

There are intentionally no placeholder images, dummy sounds, colored stand-in mobs or vanilla filler reward tables.
