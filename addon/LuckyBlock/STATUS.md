# Lucky Block Add-On source status

Milestone: 0.22.0 Royal Anthill pre-dragon miniboss/exploration package

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
1. much larger reward library, especially true held/ranged weapons, armor and mounts;
2. more structures, traps, chained Lucky events, dungeons and additional minigames;
3. more pre-dragon encounter breadth, especially miniboss families and exploration structures;
4. more post-dragon normal-mob/elite role variety and additional miniboss/boss families;
5. more Mythic dungeon variants and chained event families beyond the implemented boss/set/invasion/Lucky Rain/Rift Vault outcomes;
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


Static audit after 0.14.0 fishing integration:
- BP/RP manifests and mutual dependencies resolve to 0.14.0.
- Repository tree scan completed without truncation.
- Fishing adapter and acquisition scripts pass JavaScript syntax parsing after module-import stripping.
- The fishing adapter contains hook-spawn, rod-use, water-entry, hook-remove and actual item-spawn confirmation paths; deprecated `isValid()` calls are absent.
- Empty rod use without a spawned/water-entered hook cannot award Lucky rewards through this adapter.
- Integration registry resolves 10 external sources / 32 asset records / 30 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- The full MinecraftCustomEvents MIT license and code provenance mapping are present.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- This is source/static validation. Fishing behavior still needs an actual current-Bedrock multiplayer/runtime pass before release.


0.15.0 pre-dragon wilderness milestone:
- Added two materially different pre-dragon outcomes from the already-pinned Slayers-Beasts MIT source.
- `lb:irk_companion`: original 18-part / 44-cube Irk model, original 16-channel / 80-keyframe WALK animation and original texture converted into a real companion. Lucky balance is 48 HP / 8 attack / 0.30 movement.
- Rare Lucky Blocks now have a 6% Irk Companion result. The generic entity reward dispatcher uses `EntityTameableComponent.tame(player)` to bind it to the opener; the entity then uses sit, follow-owner, teleport-to-owner and owner-defense behaviors.
- `lb:ent_guardian`: original 23-part / 42-cube medium Ent model, original 10-channel / 42-keyframe WALK animation and original oak texture. Lucky balance is 160 HP / 14 melee / 65% knockback resistance.
- Added persistent `awakened_grove` Epic event: a finished 13×13 moss/mossy-cobblestone/rooted-dirt grove with four real oak/leaf corner trees, glowstone waypoints and a central shrine.
- Grove flow: 2 Impalers -> neutral-retaliatory Ent Guardian -> completion. The source Ent's hurt-response identity is preserved rather than replaced by permanent player aggro.
- Completion rewards: 4–6 Epic Fragments + 1 Rare Lucky Block + 25% Easel. If no safe site exists, the event dispatcher falls back to 3–4 Epic Fragments.
- Rare and Epic weighted pools now each sum to exactly 100.
- Generic event handling now supports tier-specific fallback rewards instead of assuming every event is Mythic.
- No placeholder model, texture, sound or temporary structure was introduced.


Static audit after 0.15.0 pre-dragon wilderness integration:
- BP/RP manifests and mutual dependencies resolve to 0.15.0.
- Rare and Epic reward pools each sum to exactly 100.
- `main.js`, `reward_registry.js`, `acquisition.js` and `events/pre_dragon_events.js` pass JavaScript syntax parsing after module-import stripping.
- Irk behavior/client identifiers match; converted geometry contains 18 bones / 44 cubes and every WALK animation bone target resolves. The tameable component is present in base components so Script API can tame the companion immediately after spawn.
- Ent behavior/client identifiers match; converted geometry contains 23 bones / 42 cubes and every WALK animation bone target resolves.
- Awakened Grove structure builder, Impaler guard stage, Ent guardian stage, completion rewards and tier-specific failure fallback are all present.
- Vendor registry resolves 10 external sources / 34 asset records / 32 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan returns zero.
- This is source/static validation only; current stable Bedrock import, companion ownership behavior, structure placement, persistence and multiplayer runtime QA remain untested.


0.16.0 War Ant mount milestone:
- Added `lb:war_ant_mount`, the first dedicated mount reward family.
- Uses the pinned Slayers-Beasts MIT Ant Soldier model, original WALK/AMBIENT animation data and original wood-soldier texture; no horse recolor or temporary model.
- Converted geometry contains 21 source parts; the source renderer's 1.5× visual scale is baked into the Bedrock geometry.
- Lucky mount balance: 90 HP / 12 melee / 0.38 movement / 60% knockback resistance.
- Epic pool now includes the mount at 10% and still sums to exactly 100.
- Lucky reward dispatcher now optionally fires an explicit tame event after Script API taming. This hardens Irk/War Ant auto-tame so ownership and data-driven tamed behavior groups agree immediately.
- War Ant tamed behavior includes direct player ground control, one-player rideable seat, owner follow/teleport and owner-defense.
- No placeholder model, texture, sound or temporary structure was introduced.


Static audit after 0.16.0 War Ant mount integration:
- BP/RP manifests and mutual dependencies resolve to 0.16.0.
- Epic reward weights sum to exactly 100 and include the War Ant Mount at 10%.
- `main.js` and `reward_registry.js` pass JavaScript syntax parsing after module-import stripping.
- War Ant behavior/client identifiers match; converted geometry contains 21 bones / 29 cubes.
- WALK + AMBIENT animation bone targets all resolve against the converted geometry.
- Tamed mount group contains rideable, ground input, player-ridden control, owner follow/teleport and owner-defense components.
- Reward auto-taming now explicitly triggers the configured data-driven tame event after Script API taming.
- Vendor registry resolves 10 external sources / 35 asset records / 33 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Original wood-soldier texture target is present and placeholder/dummy/temp/test-texture filename scan remains zero.
- This is source/static validation only; current Bedrock riding controls, seat placement, tame ownership, animation scale and multiplayer runtime QA remain untested.


0.17.0 ranged combat milestone:
- Added `lb:amethyst_repeater` + renewable `lb:amethyst_charge`, using original Tomemancy MIT Amethyst Staff/orb artwork.
- Repeater is an Epic pre-dragon held ranged weapon: 3-shot burst, 4-tick shot spacing, 12 damage per hit, 32-block block-aware raycast range, 24-tick cooldown, finite ammo and 720 durability.
- The stable Script API raycast design intentionally avoids requiring the Custom Projectiles experimental toggle.
- Added `lb:wither_spider` from Slayers-Beasts MIT: original 33-bone / 70-cube converted model, 8-channel / 40-keyframe WALK animation and original texture, with the source renderer's 1.2× scale baked into geometry.
- Source Wither-on-melee identity is retained. Lucky adds a documented 0.8-second telegraphed ranged Wither zone for the missing pre-dragon control role.
- Wither Spider has low-density Nether ecology spawning (cap 2/64 blocks), an 8% Epic encounter result, and modest Rare/Epic fragment drops.
- Epic reward pool still sums to exactly 100.
- No placeholder model, texture, sound, beam or temporary projectile asset was introduced.


Static audit after 0.17.0 ranged combat integration:
- BP/RP manifests and mutual dependencies resolve to 0.17.0.
- Epic reward weights sum to exactly 100 and include the Amethyst Repeater kit plus Wither Spider encounter.
- `main.js`, `reward_registry.js`, `acquisition.js`, the Amethyst Repeater adapter and the Wither Spider adapter pass JavaScript syntax parsing after module-import stripping.
- Amethyst Repeater and Charge item JSON, renewable 8-charge recipe and item-atlas bindings parse and resolve; original Tomemancy staff/orb texture targets are present.
- The Repeater uses stable `Dimension.getEntitiesFromRay` + `Dimension.getBlockFromRay` paths and contains no custom `minecraft:projectile` runtime dependency.
- Wither Spider behavior/client identifiers match; converted geometry contains 33 bones / 70 cubes, and all 8 WALK animation bone targets resolve.
- Source-faithful melee Wither is present; the Lucky-owned Nether spawn and telegraphed ranged Wither-zone paths are bound.
- Vendor registry resolves 10 external sources / 38 asset records / 36 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- This is source/static validation only. Current stable Bedrock still needs real firing/ammo/raycast, Nether spawn, Wither telegraph, multiplayer, rendering and balance QA.


0.18.0 Mystical Aegis armor milestone:
- Added a complete Epic pre-dragon Tomemancy Mystical Aegis armor bundle rather than splitting four armor pieces into duplicate reward-table filler.
- Direct external visuals: four original Tomemancy armor icons + original `magic.png` wearable texture + original humanoid armor attachable layout.
- Source protection profile is preserved exactly: head 1 / chest 4 / legs 3 / feet 2.
- Lucky durability scaling: 360 / 520 / 480 / 420; amethyst shards and Epic Fragments repair the set.
- Full-set Aegis Ward is Lucky-owned: after 6 seconds without taking damage, Absorption II recharges for 8 seconds on a 10-second cycle.
- Epic reward pool remains exactly 100 weight after adding the 8-weight full-set bundle.
- No temporary armor texture, placeholder model or recolored vanilla stand-in was introduced.


Static audit after 0.18.0 Mystical Aegis integration:
- BP/RP manifests and mutual dependencies resolve to 0.18.0.
- Epic reward weights still sum to exactly 100 and the Mystical Aegis full-set bundle is present.
- All four armor item JSON files use the current `minecraft:wearable.protection` contract rather than the removed legacy `minecraft:armor` component.
- Item protection profile resolves to 1 / 4 / 3 / 2 and durability resolves to 360 / 520 / 480 / 420.
- All four attachable identifiers match their BP item identifiers and resolve the original Tomemancy `magic.png` wearable texture.
- Original Tomemancy icon/wearable texture blob SHAs match upstream exactly.
- Aegis script, main dispatcher and reward registry pass JavaScript syntax parsing after import/export stripping.
- Full-set ward constants resolve to 6 seconds out of combat, Absorption II for 8 seconds and a 10-second recharge cycle.
- Vendor registry resolves 10 external sources / 39 asset records / 37 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- This remains source/static validation only; current stable Bedrock still needs actual equip rendering, armor protection, ward timing, multiplayer and balance QA.


0.19.0 opening presentation + fusion milestone:
- Closed the two remaining designed P2 feature gaps: tier-specific opening presentation and deterministic upward fusion.
- Opening presentation now scales structurally by tier rather than recolor-only: Common spark pop; Rare spark + indicator; Epic summoning flame + indicator ring; Legendary burst + six-point ring + delayed wave; Mythic wave + eight-point ring + delayed burst/spark/wave sequence.
- No opening FX asset was drawn or stubbed for this milestone. Presentation recombines already-vendored Slasher, Tomemancy and BOMD production particles/audio plus stable vanilla sounds.
- Added four upward fusion recipes: 4 Common + 2 Rare Fragments -> Rare; 4 Rare + 2 Epic Fragments -> Epic; 5 Epic + 3 Legendary Fragments -> Legendary; 5 Legendary + 4 Mythic Fragments -> Mythic.
- Added `docs/FUSION_EV_MODEL.md`. Because pets/events/bosses cannot be honestly scalarized, the simulation uses next-tier progression-currency EV and explicitly counts the unique reward rolls sacrificed by fusion.
- Current catalyst cost is 8.1–10× the next-tier-fragment EV expected from opening the consumed source blocks, preserving opening as the content/variance route while fusion remains deterministic but expensive.
- No new catalyst item or visual asset was introduced; destination-tier fragments are the catalysts.


Static audit after 0.19.0 opening/fusion integration:
- BP/RP manifests and mutual dependencies resolve to 0.19.0.
- `main.js` passes JavaScript syntax parsing after import stripping.
- All five tier presentation configs are bound to `openTier`; every referenced custom particle ID resolves to a committed production particle definition.
- Referenced custom opening sounds (`slasher.critical`, Obsidilith indicator/prepare/burst) resolve in the committed sound definitions; Common/Rare also use stable vanilla sounds.
- Four upward fusion recipes parse with exact 4+2 / 4+2 / 5+3 / 5+4 source+catalyst counts and never exceed the 3×3 crafting-table limit.
- `docs/FUSION_EV_MODEL.md` records the progression-currency EV check: catalyst cost is approximately 9.60× / 10.00× / 10.00× / 8.13× the next-tier fragments expected from opening the consumed source blocks.
- Vendor registry remains 10 external sources / 39 asset records / 37 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- P2 source implementation is now treated as 96% complete; only real Bedrock runtime/balance QA remains for this phase.


0.20.0 Fortune Relay Vault milestone:
- Added `fortune_relay` as the first dedicated non-combat Lucky minigame outcome.
- Rare Lucky Blocks now have an 8-weight chance to create a permanent 19×19 roofless vault maze rather than only items/fragments/pets.
- The vault is built from final vanilla materials (polished andesite, deepslate tiles/bricks, copper, sea lanterns and five distinct mineral checkpoint pads); no graybox or temporary texture exists.
- Maze topology is deterministic and 2-block internal walls prevent normal jump-skipping. The south entrance opens onto a white start pad.
- Cooperative timed objective: activate five pads in order within 50 seconds. Any nearby player can advance the shared route; timeout resets the run immediately without deleting the structure or consuming another Lucky Block.
- Checkpoint guidance reuses already-vendored Obsidilith indicator/burst and Slasher spark production effects.
- Completion awards 3–5 Rare Fragments + 1 Common Lucky Block, with 35% Epic Fragment and 25% Camera bonus rolls. The finished vault remains as a world landmark.
- If no safe 19×19 site exists, the generic Rare event fallback grants 3–4 Rare Fragments.
- Rare reward pool still sums to exactly 100.


Static audit after 0.20.0 Fortune Relay integration:
- BP/RP manifests and mutual dependencies resolve to 0.20.0.
- `pre_dragon_events.js` and `reward_registry.js` pass JavaScript syntax parsing after import/export stripping.
- Rare reward weights still sum to exactly 100 and include the 8-weight `fortune_relay` event plus a Rare-fragment fallback.
- The permanent relay structure contract resolves to a 19×19 vault with 118 wall cells, 5 ordered checkpoints and a 50-second run timer.
- Independent BFS verification confirms every route leg (start -> gold -> lapis -> emerald -> amethyst -> center) is connected while the 2-block internal walls prevent normal jump-over shortcuts.
- All referenced production FX IDs (Obsidilith indicator/burst and Slasher spark) resolve to committed particle definitions.
- Structure materials are stable vanilla production blocks; no temporary texture/model or assistant-drawn graybox asset is introduced.
- Vendor registry remains 10 external sources / 39 asset records / 37 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- Runtime QA is still required for real-world terrain site selection, checkpoint detection height tolerances, cooperative multiplayer timing and Bedrock persistence.


0.21.0 Wudu Binder milestone:
- Added `lb:wudu_binder` as the first dedicated post-dragon support/control normal-enemy role.
- Direct visual source is the pinned Slayers-Beasts MIT Wudu: original 32-bone / 31-cube geometry, 30-channel / 148-keyframe CRAWL animation and original oak texture.
- Source audit found the upstream `WuduGrabGoal.canUse()` hardcoded to false; the project explicitly does not mislabel Lucky's grasp as upstream behavior.
- Lucky balance: 520 HP / 20 melee / 0.18 movement / 78% knockback resistance.
- Binding Grasp marks a five-point target zone for 18 ticks, then deals 18 damage, Slowness II and a pull only if the player failed to dodge the marked area.
- Bark Ward refreshes short Resistance I on nearby Impaler/Mantis/Tyrachnid allies, making target priority matter in mixed encounters.
- Natural spawn is post-dragon only, low-density, wooded Overworld only, capped at one Wudu within 96 blocks.
- Legendary pool adds Wudu at 8 weight while reducing the generic fragment slice by the same 8, so the full post-dragon Legendary weight total stays unchanged.
- No placeholder asset or source-invented behavior claim was introduced.


Static audit after 0.21.0 Wudu Binder integration:
- BP/RP manifests and mutual dependencies resolve to 0.21.0.
- `main.js`, `reward_registry.js`, `acquisition.js` and the Wudu integration script pass JavaScript syntax parsing after import/export stripping.
- Wudu behavior/client identifiers match; converted geometry contains 32 bones / 31 cubes and all 30 CRAWL animation bone targets resolve.
- Original oak Wudu texture blob SHA matches upstream exactly.
- Post-dragon gate, low-density wooded Overworld spawn, 18-tick dodge telegraph, Slowness/pull control and Resistance support-aura paths are all present.
- Legendary pool adds Wudu at 8 weight while preserving the previous full post-dragon Legendary total of 122.
- Vendor registry resolves 10 external sources / 40 asset records / 38 unique content IDs with no missing explicit targets or duplicate explicit target ownership.
- Placeholder/dummy/temp/test-texture filename scan remains zero.
- Source audit explicitly records that upstream `WuduGrabGoal.canUse()` returns false; Lucky's functional grasp and support aura are project-owned mechanics, not misattributed upstream behavior.
- This remains source/static validation only; stable-Bedrock collision size, spawn ecology, pull impulse, support aura, rendering and multiplayer behavior still require runtime QA.


0.22.0 Royal Anthill implementation:
- Added an Epic pre-dragon Royal Anthill event as a permanent 19x19 exploration/encounter structure.
- Event flow is staged: entrance guards -> three spatial brood seals -> Royal Ant Queen miniboss -> Royal Brood War Ant reward.
- Slayers-Beasts MIT Queen Ant model, WALK animation and original wood-queen texture are ported with the source renderer's 1.5x visual scale baked into Bedrock geometry.
- The source Queen Ant is only neutral/anger-based melee. Lucky's always-hostile event role, telegraphed Mandible Crush, two reinforcement thresholds and Royal Anthill objective are explicitly project-owned.
- Queen balance is 260 HP / 12 melee / 0.24 movement / 70% knockback resistance; difficulty comes from dodge telegraphs and adds rather than raw HP alone.
- Added lb:ant_soldier_guard by reusing the already-vendored Ant Soldier production model/texture/animation family; no temporary enemy art is introduced.
- Epic pool gives Royal Anthill 8 weight while reducing the generic Epic-fragment slice by 8, preserving the pre-existing total Epic weight of 100.
- Fixed the pre-dragon event dispatcher regression that caused Fortune Relay states to complete without calling tickFortuneRelay().
- Stable Bedrock runtime/import/render/collision/multiplayer behavior is not claimed tested by this source commit.


Static audit after 0.22.0 Royal Anthill integration:
- BP/RP manifests and mutual dependencies resolve to 0.22.0; @minecraft/server remains pinned to 2.9.0.
- 10 changed/runtime-critical JSON files parse successfully.
- main.js, reward_registry.js, pre_dragon_events.js and slayers_beasts_ant_queen.js pass JavaScript syntax parsing after ESM import/export stripping.
- Queen behavior/client identifiers both resolve to lb:ant_queen; guard behavior/client identifiers both resolve to lb:ant_soldier_guard.
- Converted Queen geometry contains 17 bones / 33 cubes; all 6 WALK animation bone targets resolve to geometry bones.
- Original Slayers-Beasts wood_queen.png and the vendored Bedrock texture share the exact Git blob SHA 732ed3242e6c864365811e42c0e33b9f893d0d70.
- The canonical integration audit passes: 10 external sources / 41 asset records / 39 unique content IDs, with no duplicate content IDs, duplicate explicit target ownership or missing explicit targets.
- Reward-pool totals are unchanged from 0.21.0: Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100. Royal Anthill takes 8 Epic weight from the generic Epic-fragment slice.
- Pre-dragon dispatch now explicitly calls tickFortuneRelay() for fortune_relay and tickRoyalAnthill() for royal_anthill.
- Runtime BP/RP path scan and changed-runtime-text scan find no placeholder/dummy/temporary-asset markers.
- This is source/static validation only. Stable Bedrock import/content-log/render, collision, combat timing, mount bonding and multiplayer behavior still require runtime QA.
