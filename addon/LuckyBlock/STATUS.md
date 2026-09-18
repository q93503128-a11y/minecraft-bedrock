# Lucky Block Add-On source status

Milestone: 0.4.0 acquisition + functional external reward expansion

Implemented:
- Five Lucky Block tiers and five Lucky Fragment tiers with distinct real licensed visual assets.
- 15 CC0 Loy's Goodies 3D rewards are now integrated as actual model + texture content.
- All 15 current external rewards have distinct gameplay behavior or utility rather than being texture-only duplicates.
- Current external reward set:
  - burger: consumable saturation/regeneration;
  - noodles: stronger food/buff consumable;
  - plunger: reusable launch device;
  - backpack: one-time fragment cache;
  - snow globe: nearby slow field + snowballs;
  - vending machine: finite 3-use food dispenser using block state;
  - moai: one-use stone-skin blessing;
  - PC: one-use overclock buffs;
  - CCTV: reusable hostile scan;
  - wrench: one-use high haste tuning;
  - chainsaw: reusable nearby-log cutting utility;
  - camera: reusable coordinate snapshot storage;
  - golden hammer: one-use strength/resistance blessing;
  - vase: one-use randomized fragment cache;
  - easel: one-use exploration/focus buffs.
- Common, Rare and Epic weighted opening pools contain materially different external rewards.
- Mining, bulk mining, logging, mature farming, hostile/elite/boss kill acquisition hooks.
- First Ender Dragon death persists `lb:post_dragon_unlocked` and activates late-game reward modifiers.
- Natural-container exploration rewards:
  - chest / trapped chest / barrel first-open rolls;
  - player-placed containers are marked and excluded;
  - already-opened natural containers cannot be farmed repeatedly.
- No repeat-action probability decay.
- Script syntax audit passes for main.js, acquisition.js and reward_behaviors.js.

Still not complete:
1. robust fishing acquisition;
2. much larger reward library, especially true held weapons, ranged weapons, armor, pets and mounts;
3. structures, traps, chained Lucky events, raids, wave defense and minigames;
4. post-dragon custom normal mobs/elites/minibosses/bosses;
5. boss mechanics/phases/telegraphs and late-game stat rebalance;
6. Mythic content-package outcomes;
7. full in-game Bedrock import/content-log/render/balance QA;
8. refreshed packaged .mcaddon after the next packaging checkpoint.

No project-completion claim is made and no placeholder assets are intentionally included.


Static audit after 0.4.0 source commit:
- BP/RP manifest versions both resolve to 0.4.0.
- main.js, acquisition.js and reward_behaviors.js all pass JavaScript syntax parsing after module-import stripping.
- All 15 reward IDs referenced by weighted pools resolve to committed block JSON, Bedrock geometry, PNG texture and terrain-atlas entries.
- First-open exploration hook exists and includes both player-placed exclusion and already-opened persistence.
- Current stable API choices were checked against @minecraft/server 2.9.0 documentation.


0.4.1 external-integration architecture hardening:
- Studied current Bedrock multi-addon/build patterns and Microsoft Cooperative Add-On guidance.
- External integration is now split into explicit vendored / sidecar / reference-only modes.
- Production default is vendored merge into one BP + one RP; required outside-pack dependencies are disallowed by project policy.
- RP now declares pack_scope=world.
- reward selection data moved to reward_registry.js.
- source-specific gameplay behavior moved to BP/scripts/integrations/loys_goodies.js.
- reward_behaviors.js is now an integration bootstrap rather than a monolithic external-content file.
- vendor/ASSET_REGISTRY.json pins reviewed upstream commit SHAs and exact source->target mappings.
- tools/audit_integrations.mjs checks source metadata, duplicate IDs/targets, target existence and lb: namespace ownership.


Multi-source integration validation:
- Added a second active external source, FrenchKrab mc-blockbench-models (CC BY 4.0), through its own integration module.
- Added Cardboard Sword, Cardboard Axe and Cardboard Shield as real model+texture rewards with distinct one-use behaviors.
- FrenchKrab source is pinned to reviewed commit 3a568ceda77434a17e2722459e8becf48a1f6920.
- Attribution is included in THIRD_PARTY_NOTICES.md and the machine-readable vendor registry.
- The reward registry now records source ownership per external reward entry.
