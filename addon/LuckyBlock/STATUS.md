# Lucky Block Add-On source status

Milestone: 0.3.0 acquisition + first external reward batch (source milestone)

Implemented:
- Five Lucky Block tiers and five Lucky Fragment tiers with distinct real licensed visual assets.
- Five CC0 Loy's Goodies 3D reward props: burger, plunger, backpack, snow globe and vending machine.
- Common/Rare weighted opening pools now include actual external 3D rewards rather than only fragment cascades.
- Normal-play acquisition hooks for mining, bulk mining, logging, farming and hostile/elite/boss kills.
- No repeat-action probability decay.
- Risk/rarity scaling: ordinary actions feed Common; richer ores/elites/bosses can reach higher fragments/blocks.
- First Ender Dragon death sets a persistent world dynamic property and grants the transition reward.
- Post-dragon status already affects selected vanilla combat rolls and is ready to gate future custom enemies/events.
- Exact acquisition probabilities are documented in docs/ACQUISITION_BALANCE.md.
- External reward provenance is recorded in THIRD_PARTY_NOTICES.md.

Still not complete:
1. robust fishing acquisition;
2. chest/structure exploration acquisition;
3. many more materially distinct external reward items, weapons, foods, pets, mounts and tools;
4. functional behavior for equipment-class rewards such as firearms/chainsaws/magic weapons;
5. structures, traps, chained Lucky events, raids and minigames;
6. post-dragon custom normal mobs/elites/minibosses/bosses;
7. boss mechanics/phases;
8. Mythic content-package outcomes;
9. full in-game Bedrock import/content-log/render/balance QA;
10. refreshed packaged mcaddon after the 0.3 source set is sufficiently complete.

No project-completion claim is made.
