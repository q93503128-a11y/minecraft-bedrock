# Lucky Block Add-On source status

Milestone: 0.34.0 Gallery Slug + Cave Dweller stalker batch

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
1. larger reward library, now mainly sheer outcome count plus a smaller set of additional consumable/status, structure and specialist utility roles;
2. more dungeon/chained-event variants and sheer structure count; the dedicated trap category now has a production implementation;
3. remaining pre-dragon breadth is now mainly a smaller tail of special structures/alternate encounters; dedicated miniboss, non-combat exploration and trap roles are all represented;
4. more post-dragon normal-mob/elite count and encounter combinations; a dedicated ranged-pressure normal family now exists alongside predator/control/support roles;
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


0.23.0 deployable Auto-Turret / Fortune Bulwark:
- Added `lb:reward_turret` as a Rare deployable combat-tool reward using Loy's Goodies CC0 `220420_turret.bbmodel`; no temporary model or icon is used.
- Original model conversion preserves all 16 source cubes; the embedded 64x64 PNG is imported unchanged.
- Interacting with the placed reward converts it into `lb:lucky_turret`, a stationary 72 HP support entity with 96 shots.
- Turret runtime: 20-block target range, block-aware line-of-sight raycast, target-facing rotation, 9 damage per hit and 15-tick shot cadence. Damage is attributed to the turret entity so hostile hurt-by-target behavior can retaliate where supported.
- Added Epic `fortune_bulwark`: a permanent 15x15 polished-tuff/copper defense arena with two 128-shot trial turrets and three staged waves using licensed Ant Guard / Impaler encounter assets.
- Bulwark completion removes trial units and awards one real deployable Auto-Turret, 3-5 Epic Fragments and a 35% Rare Lucky Block bonus. Space failure/time-out uses explicit fragment fallback.
- Rare and Epic total pool weights remain 100 each; the new outcomes replace weight from existing repeated utility slices rather than inflating total probability.
- Stable Bedrock runtime/import/render/collision/AI-retaliation/multiplayer behavior is not claimed tested by this source commit.

Static audit after 0.23.0 turret batch:
- BP/RP manifests and mutual dependencies resolve to 0.23.0; @minecraft/server remains 2.9.0.
- Seven changed/runtime-critical JSON files and three changed JavaScript files parse successfully.
- Reward block, turret behavior entity, turret client entity and geometry identifiers resolve consistently.
- Source `220420_turret.bbmodel` contains 16 cubes and the Bedrock geometry contains the same 16 converted cubes.
- Recreating the embedded source PNG as a Git blob yields `7e86eab6a64febf0111bb4c5197019addfa6d762`, exactly matching the vendored texture blob.
- Rare/Epic pool totals are 100/100 after the correction pass; Common/Legendary/Mythic remain 96/122/100.
- Fortune Bulwark is accepted, site-routed and tick-dispatched by the persisted pre-dragon event system.
- Canonical vendor audit target after registry update: 10 sources / 42 asset records / 40 unique content IDs with no duplicate explicit target ownership or missing explicit targets.
- This remains source/static validation only; in-game Bedrock QA is still pending.


0.24.0 Storm Longbow:
- Added `lb:storm_longbow` as a mechanically distinct Epic ranged weapon instead of another burst/raycast repeater clone.
- Visual source is Loy's Goodies CC0 bow set `230419_bow_1_0..3.bbmodel`; no temporary model/icon/texture is used.
- All four source draw states are represented in one attachable and switch by stable `query.item_in_use_duration`.
- Source cube counts are preserved exactly per stage: 16 / 19 / 19 / 19.
- The four source files share one embedded 32x32 texture; the vendored `storm_longbow.png` matches the reconstructed source Git blob `afd67cad7857871d648fcdb5c2fbb56e15e2c8de`.
- Gameplay: release before 5 ticks does not fire; 5-11 ticks = 8 damage / 24 blocks; 12-21 = 14 / 36; 22-29 = 20 / 48 with one extra pierced target; 30+ = Perfect Draw, 26 / 56 with two extra pierced targets.
- Each successful shot consumes one vanilla arrow outside Creative and one durability point. The Epic reward grants the bow plus 32 arrows.
- Block-aware and entity raycasts prevent normal through-wall hits; full-draw rewards timing rather than raw rapid-fire DPS.
- Epic pool remains exactly 100 by reducing repeated utility/core slices rather than increasing total probability.
- Current stable Creator documentation confirms `itemStartUse`, `itemReleaseUse`, `itemStopUse` and the Molang item-use duration query are stable surfaces.
- Stable Bedrock import/first-person/third-person render alignment and multiplayer combat are not claimed runtime-tested.

Static audit after 0.24.0:
- BP/RP manifests and mutual dependencies resolve to 0.24.0; @minecraft/server remains 2.9.0.
- Seven changed/runtime-critical JSON files and three changed JavaScript files parse successfully.
- Item/attachable/geometry/atlas IDs resolve consistently and `main.js` imports the Longbow integration.
- All four upstream source models were re-read at the pinned commit; target stage cube counts exactly match 16 / 19 / 19 / 19.
- Source texture reconstruction and vendored texture Git blob are identical: `afd67cad7857871d648fcdb5c2fbb56e15e2c8de`.
- Reward totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- Runtime-static checks confirm charge start/release/stop wiring, vanilla-arrow consumption, block/entity raycasts, durability use, 30-tick full draw, 26-damage max profile, 56-block max range and two additional pierced targets.
- This remains source/static validation only; in-game Bedrock QA is still pending.


0.25.0 Sky Damselfly flight mount:
- Added `lb:sky_damselfly_mount` as the second real mount family and the first player-controlled flight mount.
- Direct visual source is Slayers-Beasts MIT Damselfly: original 10-cube body/wing model, four-wing FLY/PERCH animation family and original blue texture. No temporary/model-generated stand-in is used.
- The source renderer displays Damselfly at 0.8x; Lucky deliberately scales the source geometry to mount size while keeping the original silhouette and texture.
- Source identity preserved: flying/perching behavior family and fall-damage immunity.
- Lucky late-game role: 84 HP / 0.46 movement, one-player seat, post-Ender-Dragon Legendary-only reward and direct tame-to-opener binding.
- Uses stable `minecraft:input_air_controlled` + `minecraft:movement.hover` for rider-controlled 3D movement. Ground/exhausted state falls back to `minecraft:input_ground_controlled`.
- Flight energy is 600 ticks = 30 seconds. While ridden it drains at real tick rate; at zero, air control is removed and the mount must descend. Dismounted recharge is 20 energy every 10 ticks, restoring full energy in about 15 seconds.
- Legendary weight 6 replaces the old duplicate Legendary Chainsaw slice, keeping total Legendary weight 122 while increasing reward breadth.
- Runtime import, actual air-control feel, camera radius, collision, multiplayer riding and exhaustion landing are not claimed tested.

Static audit after 0.25.0:
- BP/RP manifests and mutual dependencies resolve to 0.25.0; @minecraft/server remains 2.9.0.
- Seven changed/runtime-critical JSON files and three changed JavaScript files parse successfully.
- Behavior/client/geometry IDs resolve consistently to the Sky Damselfly.
- Converted geometry contains exactly 10 cubes; FLY animation targets exactly the four source wing bones.
- Original `blue.png` and vendored texture share the exact Git blob SHA `6863770f5b36ea4736b18c4db907e294b921f5fb`.
- Stable Creator references confirm `minecraft:input_air_controlled`, `minecraft:movement.hover`, `minecraft:rideable`, `minecraft:navigation.fly`, `minecraft:behavior.random_fly` and Script API `EntityRideableComponent.getRiders()`.
- Source fall-immunity behavior is retained with a fall-only damage sensor.
- Reward totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- This remains source/static validation only; stable Bedrock runtime QA is still pending.


0.26.0 Explorer Field Kit:
- Added a second wearable-gear archetype: `lb:explorer_hat` + `lb:explorer_pack`, rewarded together with a compass from Epic Lucky Blocks.
- Visuals are direct CC0 Loy's Goodies production assets, not project-drawn placeholders.
- Explorer Hat source is `230726_explorer_hat.bbmodel`: all 7 source cubes are converted into a head-bound attachable; the original 32x32 embedded PNG is unchanged.
- Field Pack source is `230516_backpack.bbmodel`: 7 physical cuboids are ported from the 10 source elements; the other 3 source elements are inverted duplicate/backface geometry and are explicitly treated as a format-conversion boundary rather than counted as missing art. Original 32x32 PNG is unchanged.
- Bedrock wearable geometry follows Microsoft's documented custom crown/chestplate attachable pattern rather than inventing a pack-specific rendering hack.
- Balance is utility-first: Hat protection 1 / durability 320, Pack protection 3 / durability 480. The two pieces total only 4 protection, intentionally trading raw defense for exploration utility instead of replacing diamond/Netherite.
- Full two-piece wearer receives refreshed Night Vision and Speed I.
- Multiplayer link: if another full-kit wearer is in the same dimension within 12 blocks, each linked wearer also receives Haste I. The script evaluates every player's equipment independently, excludes self, checks dimension identity and uses no shared global player cooldown/state.
- Epic weight 7 is funded by reducing repeated generic/utility slices; Epic total remains exactly 100.
- Current production architecture remains the 0.4.1 multi-addon merge policy: licensed external assets are vendored into one namespace/BP/RP, source-specific runtime logic stays in separate integration modules, and no required external runtime pack dependency is introduced.
- Stable Bedrock import, actual attachable alignment, multiplayer effect behavior and balance still require real runtime QA.

Static audit after 0.26.0:
- BP/RP manifests resolve to 0.26.0 and @minecraft/server remains 2.9.0.
- Changed/runtime-critical JSON and JavaScript parse successfully.
- Hat item/attachable/geometry and Pack item/attachable/geometry identifiers resolve consistently.
- Explorer Hat source/target cube count is 7/7.
- Backpack source classification is 10 total elements = 7 physical cuboids + 3 inverted backface duplicates; target geometry contains the 7 physical cuboids.
- Explorer Hat source/target texture Git blob SHA is `05dd0344f26e25b8a4b746932f96bda73d8e341c`.
- Field Pack source/target texture Git blob SHA is `210a555c2b69cd0cc432d8d17c4b4044755837e2`.
- Multiplayer-static checks confirm per-player full-kit detection, same-dimension filtering, self-exclusion, 12-block link range and linked Haste path.
- Reward totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- This remains source/static validation only; stable Bedrock runtime QA is still pending.


0.27.0 Fortune Gallery:
- Added a second dedicated Lucky minigame family, mechanically separate from Fortune Relay's timed traversal/maze play.
- Epic Lucky Blocks can now create a permanent 19x21 projectile gallery with a final smooth-stone/andesite/copper/deepslate arena and twelve real `lb:reward_vase` targets.
- The target visual is the already-vendored Loy's Goodies CC0 Vase model/texture; no temporary target mesh or project-drawn target texture was introduced.
- Three target rows increase both distance and elevation: four near, four middle and four far/high targets.
- Start condition is a bounded south firing line rather than a broad arena-radius trigger.
- Each attempt lasts 45 seconds and resets the twelve targets on timeout; the persistent structure remains available for immediate retry until the event expires.
- Every player on the start line receives 24 snowballs. Players joining an active attempt receive 16 snowballs once, so multiplayer participation does not depend on one player's inventory.
- Stable `world.afterEvents.projectileHitBlock` detection counts only snowballs that actually hit an unbroken gallery Vase.
- A global 12-target hit mask prevents two simultaneous projectiles from scoring the same target twice.
- `scoreByPlayer` records each participant independently. Dimension compatibility and start-line bounds are checked explicitly; no single global player owner/cooldown controls the event.
- Manually broken/unexpectedly missing unhit targets are restored by the event tick, so block-breaking does not bypass projectile scoring.
- Completion gives 4-5 Epic Fragments + one Rare Lucky Block. Three or fewer misses also gives 32 arrows. Clearing in 25 seconds or less with at most one miss grants the already-cleared Storm Longbow as a Sharpshooter bonus.
- Epic weight 6 is funded by reducing repeated generic/utility slices; total Epic weight remains exactly 100.
- No new external runtime dependency is added. The existing vendored-merge architecture remains one BP + one RP under the `lb` namespace.
- Actual Bedrock projectile timing, simultaneous-hit ordering, block restoration, multiplayer joins and balance remain P8 runtime QA items.

Static audit after 0.27.0:
- BP/RP manifests and mutual dependencies resolve to 0.27.0; @minecraft/server remains 2.9.0.
- `pre_dragon_events.js` and `reward_registry.js` parse successfully after ESM import/export stripping.
- Fortune Gallery is registered in start routing, site routing, persisted tick dispatch and the Epic reward registry.
- Static checks resolve twelve target offsets, 900-tick / 45-second attempts, timeout reset, target restoration, mid-run ammo grants, per-player scoring, duplicate-hit masking and the precision bonus path.
- Stable Creator documentation confirms `ProjectileHitBlockAfterEvent` exposes projectile, optional source, dimension and `getBlockHit()`, and that `world.afterEvents.projectileHitBlock` is the stable signal used here.
- Reward totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- Vendor inventory remains unchanged at 10 sources / 46 asset records / 44 unique content IDs because this milestone recombines already-cleared production assets rather than importing a new source.
- Placeholder/dummy/temp target assets added by this milestone: zero.
- This remains source/static validation only; stable Bedrock runtime QA is still pending.


0.28.0 Butterfly Sanctuary:
- Added a new Epic pre-dragon ecological exploration event centered on a real Slayers-Beasts MIT Butterfly port rather than another combat wave or maze.
- Direct external payload is complete and pinned: Butterfly entity source, 7-cube model, IDLE_CLOSED/FLYING animation definitions, renderer scale reference and original `tortoiseshell.png`.
- Source model -> Bedrock model cube count is exactly 7 -> 7; source renderer's 0.8x visual scale is baked into geometry.
- Source and vendored texture Git blob SHA are both `ff5317e9a5ab611360777fd666c76921e0ef85ae`.
- Lucky Butterfly behavior keeps the source 6 HP / 0.25 movement / free-flight identity and fall immunity. No combat role was invented for it.
- The permanent 17x17 sanctuary uses final vanilla moss/stone/log/leaves/light materials; no temporary structure texture or custom placeholder art is introduced.
- Eight event butterflies begin the survey. Event logic maintains at least six and softly returns butterflies that drift more than 13 blocks from the center, preventing a random-flight softlock.
- Four observation stations are order-free. A station completes only when a player remains on it for 2 seconds while an event butterfly is within 5.5 blocks.
- Multiplayer state is intentionally cooperative: the four-station mask is shared, while any nearby player may satisfy any unfinished station and separate players can progress different stations in the same tick.
- Completion leaves four source butterflies living in the permanent sanctuary, grants 4-6 Epic Fragments + one Camera, with 30% Rare Lucky Block and 25% full Explorer Field Kit bonus rolls.
- Epic event weight 5 is funded by reducing repeated/general-purpose slices; Epic total remains exactly 100.
- The earlier Sporetrap candidate was not used because the pinned renderer references `sporetrap.png` while that file is absent and the repository instead contains `venus_flytrap.png`. The project does not guess or manufacture the missing production texture.
- Stable Bedrock import, real random-flight/perch feel, event soft-boundary teleport, simultaneous multiplayer observation and long-session entity behavior remain P8 runtime QA items.

Static audit after 0.28.0:
- BP/RP manifests and mutual dependencies resolve to 0.28.0; @minecraft/server remains 2.9.0.
- Changed/runtime-critical JSON and JavaScript parse successfully.
- Butterfly behavior/client/geometry identifiers resolve consistently.
- Source model `.addBox` count is 7 and target geometry cube count is 7.
- Source IDLE_CLOSED targets 6 child bones; converted idle animation targets 6. Source FLYING covers body + 6 child bones; converted flying animation targets 7.
- Original renderer references the exact vendored tortoiseshell texture path and its source/target Git blob SHA is identical.
- Event start routing, site routing, persisted tick dispatch, eight-spawn path, four stations, 40-tick observation hold, minimum-six population recovery, 13-block soft tether and completion release-to-four paths all resolve.
- Stable Creator documentation confirms `Entity.teleport(location, teleportOptions?)` is a supported Script API method used for the event-only soft boundary.
- Reward totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- Runtime QA is still required; no Bedrock playtest claim is made.


0.29.0 completion-jump batch — Inhabitants Arsenal + Rift Arsenal:
- This batch intentionally combines three substantial content additions rather than one narrow feature: Javelin, Spike Drill, and a new post-dragon Mythic chained event.
- Added `lb:javelin` as a Rare six-pack reward using the original Inhabitants 5-cube held model, 5-cube thrown model, item/entity textures, bounce/in-air animations and six original sounds.
- Javelin keeps the source 10-tick minimum draw / 60-tick full charge / stack-16 / block-stick / crouch-recovery / bounce-platform identity.
- Javelin runtime does **not** enable the experimental Custom Projectiles toggle. A normal `lb:javelin_thrown` entity is launched with stable Script API impulse and uses block/entity raycasts for impact.
- Lucky Javelin damage is 8-18 by charge. It is consumed on throw outside Creative, lost on entity hit like the source projectile, recoverable by crouching when stuck in a block, and returns as an item if its supporting block disappears.
- Stuck Javelins function as short-cooldown bounce platforms; repeated bounces within 40 ticks increase upward launch up to a capped impulse.
- Javelin owner state is stored on each thrown entity and charge-start/cooldown maps are keyed by player ID, so simultaneous players do not share one weapon state.
- Added `lb:spike_drill` as an Epic specialized mining tool using the original Inhabitants base icon and six original drill sounds.
- Drill keeps exact source durability 2342, heat cap 120, 15-second/300-tick momentum ramp, 2-second/40-tick overheat lockout, 2 overheat damage, delayed passive cooling and snowball -30 quench identity.
- Continuous drilling accelerates from roughly one break every 14 ticks toward one every 3 ticks as momentum ramps. Each successful break adds one heat and one durability damage.
- Stable Bedrock block-form salvage replaces Java loot-table mining. Containers, all Lucky custom blocks, bedrock/barrier/command/structure blocks, portal infrastructure, reinforced deepslate, obsidian/crying obsidian, ancient debris, netherite blocks and respawn anchors are excluded from Drill destruction.
- Sneak + offhand snowball performs the source-inspired quench without needing a Java inventory-click hook.
- The original Java Drill has temperature-specific sprite overrides; this port does not claim those state sprites are rendered. It uses the real original base asset plus actionbar heat/momentum instead of generated temporary art.
- Added **Rift Arsenal** as a fourth Mythic event family and a real chained objective/combat package.
- Rift Arsenal creates a permanent 17x17 tuff/copper/blackstone armory. Each participating player receives six Javelins once.
- Stage 1 requires actual stuck `lb:javelin_thrown` entities to hit three spatial target seals; a shared three-bit mask prevents duplicate seal credit and supports cooperative players.
- Stage 2 is Wudu Binder + two Mantis + one Tyrachnid, intentionally exercising support/control/predator interaction.
- Final stage is Bogre + Wudu Binder + two Tyrachnids, making the difficulty come from role combination as well as stats.
- Completion awards one Spike Drill, 12 Javelins, 7-10 Mythic Fragments and one Legendary Lucky Block.
- New reward weights are funded entirely by reductions to existing generic/repeated slices: Rare/Epic/Mythic totals remain 100.
- BP/RP version is now 0.29.0; @minecraft/server remains 2.9.0.
- This is still source/static implementation. Stable Bedrock import, held alignment, thrown-entity physics, actual drilling feel, multiplayer and long-session event behavior remain P8 runtime QA.


0.30.0 completion-jump batch — Accessory Suite + Gauntlet:
- Added three materially different portable reward roles rather than recolor/stat variants.
- `lb:wizard_hat`: post-dragon Legendary head accessory using Loy's Goodies CC0 10-element Wizard Hat model and embedded production texture. Lucky Arcane Focus multiplies Tomemancy spell power by 1.15 and reduces tome cooldowns to 85% of normal; it stacks multiplicatively with the existing Diamond Staff focus.
- `lb:threat_sunglasses`: Rare head accessory using the source three-element Sunglasses model/texture. Threat Lens refreshes Night Vision, clears Blindness/Darkness and scans the stable entity `monster` family within 24 blocks, reporting count and nearest distance per wearer rather than using one shared global state.
- `lb:fortune_tonic`: Rare two-can reward using the single production texture from Loy's Goodies Blue Pop Can model. It is a portable always-usable drink rather than a placed food block; completion gives 60 s Absorption I, 8 s Resistance I and 4 s Regeneration I.
- The earlier Zongzi candidate was deliberately discarded before commit because its five-element model uses two separate source textures; using only one as a flat icon would have been an incomplete external-asset port.
- Added `lb:gauntlet`, a second full post-dragon BOMD boss family. The 26-bone / 42-cube source geometry and all ten source combat animations are direct namespace-remapped ports; default texture and seven Gauntlet/energy-shield sounds are byte-identical upstream assets.
- Source boss identity retained: punch, delayed laser, swirl punch, blindness/cast role, poison/wither immunity and energy-shield phases. Lucky Bedrock implementation is mechanic-oriented rather than an HP sponge.
- Gauntlet has 6000 HP and uses four telegraphed attacks: dodge-rewarding charge punch, six-pulse laser whose aim is delayed by 8 ticks, three-pulse swirl punch and a blindness cast.
- Missing a charge punch opens a vulnerability window; completing a laser sequence also opens a shorter window.
- At 65% and 30% health, Gauntlet enters 18%-damage shield state and creates three real `lb:gauntlet_blackstone` anchors. Breaking all source-textured anchors collapses the shield and opens a 150%-damage vulnerability window.
- Gauntlet death awards 8-12 Mythic Fragments, 4-7 Legendary Fragments, four Fortune Tonics and one Legendary Lucky Block.
- Mythic direct-boss weight 10 is funded from existing repeated Mythic slices; Rare/Legendary additions are likewise funded without changing tier totals.
- Existing 0.29.0 `main.js` had a literal backslash-n between the Bogre and Arsenal imports. This batch fixes it to a real line break and adds an explicit import-line audit so the previous stripping-based syntax check cannot hide the same defect again.
- Sporetrap was evaluated as a pre-dragon encounter candidate but rejected: its pinned renderer requests `textures/entity/sporetrap.png`, while that texture is absent from both the pinned tree and the path history. No guessed Venus Flytrap texture or temporary replacement was used.
- BP/RP version is 0.30.0; @minecraft/server remains 2.9.0.
- Stable Bedrock import/render, Wizard Hat/Sunglasses head alignment, Gauntlet flight/pathing, attack timing, anchor destruction, multiplayer target selection and balance are still P8 runtime QA and are not claimed tested.


0.31.0 P4 breadth batch — Void Garden + Fortune Archive:
- Added two structurally different pre-dragon outcomes in one batch: a mechanic-driven independent miniboss structure and a zero-combat cooperative spatial-memory structure.
- Added `lb:void_blossom` from Bosses of Mass Destruction (LGPL-3.0), pinned to `2fbd0dc79bea498bcad755c4ad9969055dc452c7`.
- Direct Void Blossom payload is complete: 67-bone / 91-cube source geometry, all eight source animations, exact source entity texture and five exact source sounds.
- Geometry data is identical after changing only the geometry identifier to `geometry.lb.void_blossom`; animation tracks are identical after namespace-key remapping.
- Source behavior reference is a stationary 350 HP / 4 armor / 12 attack boss with spike burst, spike wave, spore, petal blade and milestone blossom actions. Lucky uses 420 HP pre-dragon balance and preserves those five combat identities without copying Java/Kotlin implementation code.
- Void Blossom attack set: three targeted spike bursts, three expanding spike rings, telegraphed poison/slow spore cloud, and three telegraphed petal-blade lanes.
- At 75% / 50% / 25% HP the boss creates four Flowering Azalea life roots. While roots remain, incoming damage is 0.65x and the boss heals 2 HP per second; destroying all roots opens a 50-tick 1.35x vulnerability window.
- Added persistent `Void Garden` Epic event structure. It uses final vanilla moss/rooted-dirt/mossy-cobble/deepslate/amethyst/light materials and the real BOMD boss asset; no temporary arena art exists.
- Void Garden completion awards 5-7 Epic Fragments, one Rare Lucky Block and two Fortune Tonics, with a 30% Threat Sunglasses bonus. It does not hand out dragon-trivializing pre-dragon weapons.
- Added `lb:archive_codex` from Loy's Goodies CC0 Book model. The source is seven elements with one 64x64 embedded production texture; conversion is exactly seven Bedrock cubes using the source per-face UVs.
- Added persistent `Fortune Archive` Rare structure: four identical real Codex blocks sit on Gold/Lapis/Emerald/Amethyst pedestals; the event visually replays a randomized four-position sequence, then nearby players reproduce it by interacting with books.
- Fortune Archive progress is shared/cooperative rather than owned by one player. Wrong input replays the sequence; missing/broken codices are restored by the event tick; stable `world.afterEvents.playerInteractWithBlock` supplies the interaction.
- Fortune Archive completion awards 4-6 Rare Fragments, one Common Lucky Block and two Fortune Tonics, with Camera / Threat Sunglasses bonus rolls.
- Static structure-count audit caught a Void Garden threshold off-by-one before main: the intended build places about 329 counted blocks, so the success threshold was corrected from 330 to 320.
- Also repaired pre-existing literal `\\n` separators in the English/Korean Cardboard localization entries so they are real line breaks.
- Reward weights remain exactly Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- BP/RP version is 0.31.0; @minecraft/server remains 2.9.0.
- Real Bedrock import/render, giant Void Blossom bounds, root-breaking timing, multiplayer target pressure, Archive interaction ordering and balance remain P8 runtime QA. No runtime-playtest claim is made.


0.32.0 role-gap batch — Fortune Minefield + Rift Spitter Ant:
- Added `lb:fortune_bomb` from Loy's Goodies CC0 Bomb source `230426_bomb.bbmodel`.
- Bomb source is 8 elements with one embedded 32x32 production texture; all eight elements and per-face UVs convert 1:1 into Bedrock geometry. No generated/temporary bomb art is used.
- Added Rare `fortune_minefield` trap structure: 12 real Bomb blocks on a permanent 15x15 final-material arena.
- Minefield runs four three-bomb arming waves. Only actively flashing bombs can be meaningfully disarmed; inactive missing bombs are restored, preventing trivial pre-clearing and broken-block softlocks.
- Each active bomb has a 30-tick warning window. Players may mine it to disarm, or leave the 3.4-block blast radius before scripted detonation. Detonation deals 16 inner / 10 outer damage plus knockback but deliberately does not destroy terrain.
- Fully disarming a wave now schedules the same 35-tick inter-wave break as surviving a detonation; an initial candidate's immediate-next-wave pacing edge case was caught and fixed before main.
- Completion gives 3-5 Rare Fragments + one Fortune Tonic; 6+ disarms add an Epic Fragment and 9+ disarms add a Rare Lucky Block.
- Added `lb:rift_spitter_ant`, using the already-verified Slayers-Beasts Ant Soldier geometry/WALK+AMBIENT conversion and exact upstream leafcutter_soldier.png texture.
- Source Ant Soldier is a neutral melee mob with 15 HP / 5 attack / 0.22 speed. Lucky explicitly does not claim its new ranged role as upstream behavior.
- Rift Spitter is post-dragon only: 260 HP / 10 melee fallback / 0.32 movement, three-shot telegraphed corrosive salvos at range, Poison II + short Slowness on hits, and a retreat impulse when players close inside 6 blocks.
- Natural overworld spawn checks remain behind `lb:post_dragon_unlocked`, cap two within 72 blocks per player area, and use dirt/grass/mud/podzol/rooted-dirt surfaces.
- Rift Arsenal now uses two Rift Spitters in both combat waves, replacing raw duplicate melee density with explicit ranged pressure while keeping Wudu control/support, Mantis predator, Tyrachnid elite and Bogre roles.
- Rift Spitter death has modest progression drops rather than boss-scale loot: 50% Epic Fragment roll and 12% Legendary Fragment roll.
- Reward weights remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- BP/RP version is 0.32.0; @minecraft/server remains 2.9.0.
- Stable API check confirms `EntityDamageCause.entityExplosion` exists for scripted Minefield blast attribution.
- Actual Bedrock import/render, multiplayer simultaneous bomb mining, natural-spawn feel, ant pathing/retreat, salvo dodge windows and Rift Arsenal balance remain P8 runtime QA and are not claimed tested.

0.33.0 completion-jump batch — Rift Reliquary + Rift Charger:
- Added `lb:rift_charger_ant` using Slayers-Beasts MIT Ant Soldier source references and the exact upstream Meadow Soldier texture; the already-audited Ant Soldier geometry/WALK+AMBIENT conversion is shared instead of duplicated.
- Source Ant Soldier behavior remains documented as neutral 15 HP / 5 attack melee. Lucky's Charger role is explicitly project-owned: 420 HP, 16 melee, sparse post-dragon rocky-surface spawning, 24-tick charge-lane telegraph, dash impact, and a 50-tick 1.35x vulnerability window when players dodge the charge.
- Charger has its own Legendary direct encounter and remains behind the first-Ender-Dragon gate. Legendary pool total remains exactly 122.
- Added **Rift Reliquary**, a new Mythic permanent 17×29 dungeon/chained package rather than another single-room wave arena.
- Reliquary stage 1 uses three physically separated real Archive Codex blocks. Keys are order-free and shared across multiplayer; each first activation spawns a different tagged guard role.
- Stage 2 opens only after all keys are active and guards are cleared, then arms six real Fortune Bomb blocks in a timed disarm-or-dodge corridor.
- Stage 3 opens only after all six bombs are resolved and requires four real Obsidilith Rune blocks to be physically destroyed.
- Final stage combines two Rift Chargers, one Rift Spitter, one Wudu Binder and one Tyrachnid so mobility/ranged/support/control/elite pressure interact in one encounter.
- Objective blocks and closed gates are repaired while locked, preventing pre-clearing and common progression softlocks. The event pauses while unattended and persists shared world state. Existing Mythic events and Rift Reliquary now perform symmetric cross-family distance checks and share a four-event global cap, preventing simultaneous openings from overlapping permanent structures.
- Completion grants 9-12 Mythic Fragments, one Legendary Lucky Block and two Fortune Tonics; 5+ bomb disarms add two Legendary Fragments.
- Mythic weight 10 is fully funded by reducing existing repeated/generic slices; Mythic total remains exactly 100.
- BP/RP version is now 0.33.0; @minecraft/server remains 2.9.0.
- Static lifecycle review also replaced absolute session-tick combat deadlines in both Rift Charger and the existing Rift Spitter with small persisted countdown cooldowns, preventing a world restart from inheriting a very large stale attack deadline.
- Stable Bedrock import/render, charge physics, multiplayer simultaneous Codex interaction/bomb mining, dungeon gate repair, long-session persistence and final encounter balance remain P8 runtime QA. No runtime-playtest claim is made.

0.34.0 Gallery Slug + Cave Dweller stalker batch:
- Fortune Gallery no longer grants or scores vanilla snowballs. The old farmable-ammo path is fully removed.
- Added `lb:gallery_slug` from the Loy's Goodies CC0 Shotgun Shell: exact two source elements -> two Bedrock cubes, with directly decoded embedded 16×16 production texture.
- Gallery Slug is event-only. itemStartUse performs a block-view raycast shot, scoring the first block in the sightline. Trial ammo is reclaimed on reset, completion, timeout and periodically when a player no longer belongs to an active run; legitimate vanilla snowballs are never modified.
- Added `lb:cave_dweller` from `Thiov/cave_dweller-fabric` MIT pin `fc14dd9a228a332878b9419b77b6125302b5e861`.
- Cave Dweller visual fidelity: all 18 bones / 83 cubes retained with geometry-identifier-only remap; all 13 source animations retained with namespace-only key remap.
- Source body/eyes PNG plus spotted/chase×2/flee/disappear/hurt/death OGG subset are byte-identical to the pinned source.
- Source Java defaults are 60 HP / 6 attack / 0.3 movement / 100 follow range. Lucky's post-dragon adaptation is 340 HP with harmless stalk state, watched freeze, repeated-stare threshold, 20-damage chase or flee/disappear response.
- Natural spawning is first-Dragon gated, underground-only around players at Y<=50, sparse, and capped at one within 96 blocks. Legendary Lucky Blocks also gain a direct Cave Dweller outcome.
- Source wall-climb/crawl/door-breaking code is not falsely claimed implemented in this milestone; source crawl animations remain preserved for later parity work.
- Legendary Cave Dweller weight 8 is funded by reducing generic fragment weight by 4 and repeated Bogre weight by 4. Tier totals remain Common 96 / Rare 100 / Epic 100 / Legendary 122 / Mythic 100.
- BP/RP version is 0.34.0 and @minecraft/server remains 2.9.0.
- Stable Bedrock import/render, eye-layer appearance, chargeable Gallery Slug input feel, multiplayer simultaneous gallery shooting, Cave Dweller gaze/chase behavior and balance still require P8 real runtime QA.
