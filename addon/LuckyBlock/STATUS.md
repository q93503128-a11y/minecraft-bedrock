# Lucky Block Add-On source status

Milestone: 0.14.0 robust fishing acquisition

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
1. much larger reward library, especially true held weapons, ranged weapons, armor, pets and mounts;
2. more structures, traps, chained Lucky events, dungeons and minigames;
3. more pre-dragon encounter/event/structure breadth;
4. more post-dragon normal-mob/elite role variety and additional miniboss/boss families;
5. tier-specific opening presentation plus fusion expected-value/catalyst tuning;
6. more Mythic dungeon variants and chained event families beyond the implemented boss/set/invasion/Lucky Rain/Rift Vault outcomes;
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


0.8.0 held-weapon milestone:
- Added Slasher Sword Addon (CC0) as the first true held 3D Legendary Lucky weapon.
- No assistant-designed or placeholder model/texture/icon/sound is used for Slasher.
- Original external payload includes item icons, first/third-person geometry, attachable, animation controller, FP/TP/misc animations, beam models/entities, particles, particle textures and eleven original OGG combat sounds.
- Original combat state machine is vendored and ported from @minecraft/server 1.18.0 to the project 2.9.0 target rather than replaced with a simplified fake weapon.
- Deprecated worldInitialize, isValid() and lowercase GameMode usage were removed/ported.
- Removed dataDrivenEntityTrigger timeout dependency and replaced it with Script API timeouts while keeping original beam visuals/projectile hits.
- Lucky balance: base item damage 32, durability 2200, fast extra swing damage 24, charged slash 150, fast beam direct 10, charged beam direct 70, lock-on chainsaw tick 8, plunge scaling capped at 320.
- Slasher is a post-Ender-Dragon Legendary reward only.
- Bogre drops 1–2 Slasher Blades; Obsidilith drops 3–5, establishing a real repair loop.
- Static compatibility search finds no remaining lc:, worldInitialize, deprecated isValid(), lowercase GameMode or dataDrivenEntityTrigger references inside the vendored Slasher integration.


Static audit after 0.8.0 Slasher integration:
- Slasher vendor source is pinned to commit 24887c71758cf11bba1f419ecdd70b651d2d7d94 under CC0-1.0.
- Vendor registry records 61 Slasher target files; missing target count = 0.
- All 10 vendored Slasher JavaScript modules parse successfully after module import/export stripping.
- Item / attachable identifiers both resolve to lb:slasher.
- FP geometry geometry.slasher.fp and TP geometry geometry.slasher.tp both resolve to imported geometry files.
- Beam behavior/client entity pairs, beam geometry, render controller and all five Slasher particle definitions are present.
- All 13 required Slasher sound-definition IDs resolve to imported original OGG files.
- Original Slasher and Slasher Blade icons are registered in atlas.items.
- Post-dragon Legendary reward gating for lb:slasher is active.
- Bogre drops 1–2 Slasher Blades and Obsidilith drops 3–5.
- No placeholder/dummy/test-texture filename is present in the Lucky Block source tree.


0.9.0 Mythic content-package milestone:
- Re-read and followed `docs/LUCKY_BLOCK_CANON.md` and `docs/IMPLEMENTATION_ROADMAP.md`; this batch targets P7's “content package, not one huge-stat item” requirement.
- Added Tomemancy (Sharded-Alex, MIT), pinned to `b5a76921e98c06aae9942c705af605e2abcac44c`, as an eighth active external source.
- Added a post-Ender-Dragon Tomemancer Archmage Set Mythic bundle: Diamond Staff + Meteor Tome + Gigavolt Tome + Dragon Fireball Tome.
- No assistant-drawn or placeholder model, texture, icon or particle art was added. Staff, spellbook, meteor and flame-summoning visuals are original vendored Tomemancy assets.
- Added reusable `kind: "bundle"` reward dispatch for future Mythic sets/content drops.
- Meteor: 460 outer / 650 inner base AoE, 12 s cooldown.
- Gigavolt: unique-target chain 420 / 300 / 220 / 160 base damage, 8 s cooldown.
- Dragon Fireball: source-faithful vanilla dragon-fireball concept, 360 direct + 250 nearby Lucky damage, 9 s cooldown.
- Offhand Diamond Staff gives 1.20x damage to all three Tome spells, making the set mechanically connected.
- Spell use stays locked until `lb:post_dragon_unlocked`; the source's obsolete 1.16.x data-driven runtime is ported to @minecraft/server 2.9.0.
- Full MIT notice and exact source-to-target provenance are included.


0.10.0 persistent Mythic world-event milestone:
- P7 is no longer represented only by a boss and a gear set: Mythic blocks can now start persistent world events.
- Added `BP/scripts/events/mythic_events.js` with world-persisted event state, a four-event global cap, 64-block overlap prevention and pause-when-unattended behavior.
- Added **Rift Siege / 균열 공성전**:
  - four combat stages using the already vendored Inhabitants Impaler / Warped Clam / Bogre production assets;
  - four already-vendored Obsidilith rune blocks become an explicit objective before the final stage;
  - the final Bogre stage is not released until the runes are destroyed;
  - completion awards a Legendary Lucky Block, 6–9 Mythic Fragments and a Slasher Blade.
- Added **Lucky Rain / 럭키 레인**:
  - twenty timed aerial reward pulses using existing real Lucky/external reward items, not vanilla filler;
  - 2–3 falling reward stacks per pulse with Epic/Legendary/Mythic fragments and selected licensed external rewards;
  - Impaler pressure every fifth pulse and Warped Clam pressure at pulse 10/20;
  - after the rain, players must clear surviving event enemies before the final reward.
- Mythic pool is now content-first: Obsidilith boss, Tomemancer Archmage Set, Rift Siege and Lucky Rain together take the majority of the post-dragon Mythic outcome weight.
- Event overlap failure is handled safely by a four-Mythic-Fragment fallback instead of silently consuming the block.
- No new assistant-drawn model, icon, texture or placeholder was added; the event presentation reuses already-licensed production assets and existing imported particle/audio resources.


0.11.0 Slayers-Beasts Mantis milestone:
- Activated Slayers-Beasts (InvictusSlayer / MIT), pinned to `ffc1f6480a60598797c63150c0d0fe66b65697ff`.
- Added `lb:mantis` as a post-Ender-Dragon normal hostile, not another boss.
- Original Mantis texture and ambient/hurt/death OGG files are vendored unchanged; no assistant-drawn/recolored stand-in exists.
- All 25 model parts parsed from `MantisModel.java` are represented in the Bedrock geometry conversion.
- WALK, SCUTTLE, STRIKE and FLAP keyframes are converted from `MantisAnimation.java`.
- Lucky rebalance: 320 HP, 24 melee, 32-block tracking, leap/lunge pressure and 50% poison on successful hits.
- Habitat spawning prefers vegetation-heavy grass/mud/moss/podzol surfaces after the Dragon gate and caps nearby Mantis density at 3.
- Rift Siege now uses Mantis reinforcements in the first three waves.
- Kill rewards: 45% Epic Fragment (1–2), 8% Legendary Fragment, 0.2% Mythic Fragment.


Static audit after 0.11.0 Mantis integration:
- BP/RP manifests and mutual pack dependencies all resolve to 0.11.0.
- Full repository tree scan completed with no truncated tree result.
- Integration registry resolves 9 external sources / 30 asset records / 29 unique content IDs with no duplicate explicit target ownership or missing explicit target files.
- `main.js`, `acquisition.js`, `events/mythic_events.js` and `integrations/slayers_beasts_mantis.js` pass JavaScript syntax parsing after module-import stripping.
- `lb:mantis` behavior/client identifiers match; client geometry, all four animation identifiers and the locomotion controller resolve.
- Converted Mantis geometry contains all 25 parsed upstream source parts; every animation bone target resolves to an existing converted bone.
- Original Mantis PNG plus ambient/hurt/death OGG target files and the full Slayers-Beasts MIT license are present.
- Runtime import, post-dragon gate, vegetation habitat selection, acquisition drops and three Rift Siege Mantis bindings are present.
- No placeholder/dummy/temp/test-texture filename is present under the Lucky Block source tree.
- This is source/static validation only; current stable Bedrock import, content-log, render, combat-balance and multiplayer runtime QA remain release-stage work.


0.12.0 Slayers-Beasts Tyrachnid milestone:
- Added `lb:tyrachnid` from the already-verified Slayers-Beasts MIT source as a post-dragon **elite**, not another boss.
- No assistant-drawn/recolored stand-in: the original Tyrachnid texture is vendored unchanged.
- All 43 parsed model parts / 90 cubes from `TyrachnidModel.java` are converted to Bedrock geometry.
- All 40 source WALK channels / 200 keyframes are converted to Bedrock animation.
- Lucky balance: 900 HP, 34 melee, 0.30 movement, 55% knockback resistance and strong scripted hit knockback.
- Natural ecology spawn is post-dragon only, restricted to underground stone/deepslate/tuff/dripstone/moss surfaces with a nearby cave ceiling and a one-within-96-block cap.
- Added a post-dragon Legendary Lucky Block Tyrachnid encounter.
- Added a project-owned Silk Snare: five-point BOMD indicator telegraph, 1-second dodge window, then 42 damage + Slowness III inside 4.5 blocks.
- The source's `RangedAttackMob` hook is empty upstream; Silk Snare is explicitly not misrepresented as original source behavior.
- Rift Siege stage 3 now includes one Tyrachnid while reducing the raw number of other mobs to keep the wave role-based rather than merely denser.
- Kill rewards: guaranteed 1–2 Legendary Fragments, 25% Epic Lucky Block and 8% Mythic Fragment.


Static audit after 0.12.0 Tyrachnid integration:
- BP/RP manifests and mutual dependencies resolve to 0.12.0.
- Repository tree scan completed without truncation.
- Integration registry resolves 9 external sources / 31 asset records / 30 unique content IDs with no duplicate explicit target ownership or missing explicit target files.
- `main.js`, `acquisition.js`, `reward_registry.js`, `events/mythic_events.js` and `integrations/slayers_beasts_tyrachnid.js` pass JavaScript syntax parsing after module-import stripping.
- `lb:tyrachnid` behavior/client identifiers match; client geometry, WALK animation and locomotion controller resolve.
- Converted Tyrachnid geometry contains all 43 parsed source parts / 90 cubes; all 40 WALK animation bone targets resolve.
- Original Tyrachnid PNG is present and tracked by the Slayers-Beasts vendor record.
- Post-dragon cave gate, Legendary encounter entry, acquisition rewards, Silk Snare telegraph and Rift Siege binding are present.
- Placeholder/dummy/temp/test-texture filename scan returns zero.
- This remains source/static validation; Bedrock import/content-log/render/combat/multiplayer runtime QA is still release-stage validation.


0.13.0 Rift Vault Mythic dungeon milestone:
- Re-read the canonical plan and roadmap before implementation; this batch targets the explicit P7 “true dungeon/structure package” gap.
- Added `rift_vault` as a persistent post-dragon Mythic event outcome.
- The dungeon is a finished 17×17 permanent structure, not a temporary greybox: deepslate/polished-blackstone floor language, four real entrances, perimeter walls, four corner towers, crying-obsidian ribs, central boss dais and four rune pedestals.
- Site selection checks a bounded set of nearby locations for flatness and clear build volume instead of blindly replacing terrain at the opened Lucky Block.
- Wave 1: 3 Impalers + 2 Mantis.
- Wave 2: 1 Tyrachnid + 2 Warped Clams + 2 Mantis.
- Objective phase: four already-vendored Obsidilith Rune blocks appear only after both guard waves are cleared.
- Final: Obsidilith + 2 Impalers.
- Completion: 2 Legendary Lucky Blocks + 8–12 Mythic Fragments + 2 Slasher Blades; the cleared vault remains as a world landmark.
- Mythic pool is reweighted to exactly 100 total weight. Content-package outcomes (Obsidilith, Archmage Set, Rift Siege, Lucky Rain, Rift Vault) now occupy 78/100 weight.
- No new placeholder model, texture, icon or sound was created; the dungeon's distinctive non-vanilla objective/presentation reuses already-cleared production external assets.


Static audit after 0.13.0 Rift Vault integration:
- BP/RP manifests and mutual dependencies resolve to 0.13.0.
- Mythic reward weights sum to exactly 100; boss/set/invasion/Lucky Rain/Rift Vault content-package outcomes occupy 78/100 total weight.
- Rift Vault site search, permanent structure builder, delayed rune-objective phase, two guard waves, Obsidilith final wave and persistent event dispatcher all pass JavaScript syntax parsing.
- If site search fails before event creation, the generic Mythic event dispatcher falls back to 4 Mythic Fragments; if structure placement itself fails after event creation, the dungeon now explicitly returns the same 4-fragment compensation instead of consuming the reward silently.
- Integration registry remains at 9 external sources / 31 asset records / 30 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Repository placeholder/dummy/temp/test-texture filename scan returns zero.
- Source/static validation is complete for this milestone; Bedrock import/content-log/render/combat/multiplayer runtime QA has not yet been performed.


0.14.0 fishing acquisition milestone:
- Closed the canonical fishing acquisition gap using an adapted MIT-licensed MinecraftCustomEvents hook-lifecycle implementation pinned to `7321663e75d501adee961d60bc346afc3341b449`.
- Fishing rewards are not granted on rod use alone. The adapter requires a paired fishing hook, observes that hook entering water, and requires a real spawned item at hook removal.
- Same-tick item-use/entity-spawn ordering and simultaneous multiplayer casts are explicitly paired instead of relying on one global hook cache.
- Empty reel-ins do not qualify.
- Normal catch rolls: 10% Common Fragment, 1.2% Rare, 0.10% Epic and post-dragon 0.02% Legendary.
- Vanilla treasure catches receive a higher risk/time reward profile: 25% Common (1–2), 5% Rare, 0.8% Epic and post-dragon 0.12% Legendary.
- No anti-farming decay was added.
- Full upstream MIT license/provenance is bundled and the source-to-target code mapping is registered.
