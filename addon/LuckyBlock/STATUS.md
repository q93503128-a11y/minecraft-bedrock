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


0.4.2 multi-source merge validation:
- Active vendored sources now include Microsoft minecraft-samples, CorvaeOboro pylon crystal, Loy's Goodies and FrenchKrab.
- FrenchKrab CC BY 4.0 Cardboard Sword/Axe/Shield are integrated as real model+texture rewards through BP/scripts/integrations/frenchkrab.js.
- Current reward registry references 18 external reward IDs and every one resolves to a vendor-owned record and terrain texture entry.
- Vendor audit currently sees 20 asset records / 19 content IDs with no duplicate IDs, duplicate explicit targets or missing explicit target files.
- Integration bootstrap, both source modules and reward_registry.js pass syntax parsing.
- RP pack_scope is world and BP/RP mutual manifest dependencies are intact.


0.5.0 enemy-content milestone:
- Inhabitants (MIT) is now an active pinned vendor source.
- Added lb:impaler as a low-density pre-dragon elite with original Inhabitants model, animation, texture and combat sounds.
- Added lb:warped_clam as a post-Ender-Dragon End special enemy with original model, animation, Ender texture and sounds.
- Impaler keeps natural dark monster spawning but uses Lucky-specific stats and Bedrock Script API special attacks.
- Warped Clam spawn eligibility is explicitly gated by the persistent first-Ender-Dragon world property.
- Both custom enemies have Lucky-specific fragment drop tables.
- No recolored vanilla entity or placeholder enemy model is used.


Static audit after 0.5.0 enemy integration:
- BP/RP versions both resolve to 0.5.0; RP pack_scope remains world.
- Vendor registry: 5 pinned external sources, 22 asset records, 21 unique content IDs.
- No duplicate vendor content IDs, duplicate explicit target ownership or missing explicit target files were found.
- main.js and integrations/inhabitants.js pass JavaScript syntax parsing; inhabitants runtime is imported by main.js.
- lb:impaler behavior/client identifiers match, geometry reference resolves, texture exists, all 7 imported animation identifiers resolve, and a natural spawn rule exists.
- lb:warped_clam behavior/client identifiers match, geometry reference resolves, texture exists and all 4 imported animation identifiers resolve.
- Warped Clam intentionally has no normal spawn rule; its runtime spawn path is guarded by lb:post_dragon_unlocked.
- Inhabitants original combat sound definitions resolve for Impaler scream/spike and Warped Clam open/hit.


0.6.0 miniboss milestone:
- Added Inhabitants Bogre as a real Lucky encounter rather than a natural ambient mob.
- Original 31-bone / 40-cube model, 21-animation set, texture and five original combat sounds are vendored.
- Bogre has a Bedrock boss HUD and 220 HP.
- Three HP phases change action cadence.
- Shockwave is visibly/sound-telegraphed and is avoidable by jumping.
- After each shockwave the Bogre enters a temporary 1.6x incoming-damage weak window.
- Entity.playAnimation is used to play original roar/attack animations during the scripted mechanic.
- Epic Lucky Blocks can rarely produce a Bogre encounter; Legendary Lucky Blocks have a substantial Bogre encounter roll.
- Bogre kill rewards are integrated with the Lucky progression.


0.7.0 post-dragon boss rebalance:
- No placeholder or assistant-drawn visual asset was introduced.
- Bogre is removed from the Epic pool and is now a post-Ender-Dragon Legendary encounter only.
- Bogre health increased 220 -> 1800; melee 14 -> 32; weak-window multiplier 1.6x -> 1.8x; shockwave damage/cadence raised for late-game gear.
- Added Bosses of Mass Destruction Obsidilith as a Mythic post-dragon boss using original LGPL-3.0 geometry, animation, texture, rune texture, particle art and combat audio.
- Obsidilith health is 9000 with 75/50/25% rune-shield phases.
- Each shield phase attempts to place four original-design Obsidilith Rune blocks; while runes survive, incoming damage is multiplied by 0.12.
- Destroying all runes opens a 4-second 1.35x vulnerability window.
- Obsidilith uses Bedrock reimplementations of the upstream Burst, Spike and Wave combat roles.
- Mythic reward pools only permit the Obsidilith encounter after the persistent first-Ender-Dragon gate.
- Original BOMD LGPL-3.0 license text is included in source.


0.7.0 final progression audit:
- Bogre is absent from the Epic pool.
- Bogre Legendary encounter has requiresPostDragon=true.
- Legendary -> Mythic Fragment outcome has requiresPostDragon=true.
- Obsidilith Mythic encounter has requiresPostDragon=true.
- Reward selection filters requiresPostDragon entries against lb:post_dragon_unlocked before rolling.
- Bogre late-game rebalance: 1800 HP / 32 melee / 1.8x weak window.
- Obsidilith Mythic scale: 9000 HP / 46 base attack / 12% incoming damage while rune-shielded / 135% during exposed window.
- Obsidilith uses original BOMD model, texture, rune art, particle art frames and sounds; no temporary visual asset was introduced.
- Repository filename audit found no temporary/dummy/test-texture files in the Lucky Block source tree.
