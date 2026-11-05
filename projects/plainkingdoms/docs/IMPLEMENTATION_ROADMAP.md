# PlainKingdoms Marketplace Remake Implementation Roadmap

Date: 2026-10-01
Baseline: PlainKingdoms v1.1.5

## Implementation progress

- R0: complete for current baseline audit/repackaging.
- R1.1 proactive physical/strategic handoff: implemented in 1.2.0 Remake Alpha 1.
- R1.2 world/nation strategic army authority and offline-owner march: implemented in 1.3.0 Remake Alpha 2.
- R1.3 GroundTargetResolver: implemented in Alpha 1 and retained.
- R2 input/navigation UX: first pass implemented in 1.4.0 Remake Alpha 3; construction navigation substantially improved in Alpha 4. Army/context UI still remains.
- R3 recruitment / RallyPoint: first functional implementation completed in 1.4.0 Remake Alpha 3.
- R4 building experience: first functional implementation completed in 1.5.0 Remake Alpha 4 — categories, 90° rotation, entrance marker, repeat placement, road/wall two-point construction.
- R5 army representation/animation: first functional implementation completed in 1.6.0 Remake Alpha 5 — Kenney CC0-derived six-soldier squad rig, mixed-composition role visibility, HP depletion visuals, animation-state bridge, and delayed hit frames.
- R6 SquadBrain: first functional tactical brain implemented in 1.7.0 Remake Alpha 6 — target stability, spear brace, knight charge/recover, ranged kite/fireline, siege reposition, heavy/guard anchor, and explicit-order priority.
- R7 formation and group movement: first functional implementation completed in 1.8.0 Remake Alpha 7 — Block/Line/Column/Wedge/Loose representative layouts, role-aware front/rear slots, Auto/manual preference persisted in StrategicArmyState, formation-aware multi-army destinations, and same-nation local separation.
- R8 strategic encounters: first functional implementation completed in 1.9.0 Remake Alpha 8 — war-only virtual-army encounter detection, nearby reinforcement merge, time-based deterministic abstract combat, HP continuity into materialized battles, physical-to-abstract resume, battle log, and pre-encounter order restoration.
- R9 diplomacy and campaigns: first functional diplomacy/treaty layer implemented in 1.10.0 Remake Alpha 9 — War/Truce/Neutral/Alliance, five treaty permissions, physical/strategic MilitaryAccess enforcement, offline-capable ResourceAid, SharedVision, SharedCommand, and non-teleport Strategic Reinforcement march.
- R10 campaign/siege/projectile layer: first functional implementation completed in 1.11.0 Remake Alpha 10 — Strategic Siege, temporary building disable/capital breach, supply/morale logistics, war score/loot, and cosmetic arrow/bolt/siege projectile presentation.
- R11 tactical camera and strategic map: first functional implementation completed in 1.12.0 Remake Alpha 11 — follow-orbit camera-relative command view, tactical actionbar, army/conflict/nation/site/coordinate strategic command surfaces, and direct Army Banner entity context controls.
- R11.5 pre-polish combat/NPC bridge: completed in 1.13.0 Remake Alpha 12 — chunk-independent NPC faction-site combat with physical/abstract garrison continuity and role-specific bow/crossbow/siege/charge animations.
- R12 Marketplace polish: second implementation batch completed in 1.15.0 Remake Alpha 14 — stale-form/latest-state guards across recruitment, RallyPoint, reformation, construction, diplomacy, SharedCommand and dungeon start; normal Minecraft block/entity interaction passthrough outside system-tool contexts; per-nation neutral-clan hostility; safer pending-reward/offline-aid transaction ordering. Real touch/controller/host-client runtime tests, localization, presentation polish, performance and final release audit remain active.

Runtime verification remains pending until the later integrated test phase.

## R0 — Safety, audit, compatibility

Goals:
- unpack and inventory BP/RP;
- preserve v1.1.5 identifiers and save keys during migration;
- record manifest/module versions;
- establish static validation;
- record external-asset provenance before replacing visuals.

Exit:
- source can be repackaged;
- JSON parses;
- JS syntax passes;
- manifest dependencies remain valid;
- save-migration plan documented.

## R1 — Army command reliability

### R1.1 Proactive physical/strategic handoff

Implement:
- distance thresholds independent of chunk disappearance;
- physical actor snapshot before removal;
- generation protection;
- strategic march immediately after virtualization;
- materialization near any relevant player.

Required regression:
- send army 500 blocks away and remain stationary;
- send army 1000 blocks away and remain stationary;
- send army 2000 blocks away and remain stationary;
- confirm strategic coordinate continues changing;
- approach destination only after expected arrival and confirm actor appears near authoritative location.

### R1.2 World strategic registry

Move authoritative strategic army data from only-player storage to nation/world storage.

Keep player army_roster as migration/compatibility mirror until stable.

Support owner disconnect.

### R1.3 GroundTargetResolver

Implement:
- direct ray hit;
- projected fallback;
- Dimension.getTopmostBlock where script-accessible;
- walkable correction;
- clear user feedback.

Required:
- shallow downward angle;
- near-horizontal angle;
- short/medium/far target;
- hill;
- cliff;
- water;
- unloaded destination;
- mobile touch.

## R2 — Input and navigation UX

- detect input mode where stable API allows;
- consolidate permanent hotbar tools;
- context command surfaces;
- remove duplicate hub loops;
- categorize long building/unit lists;
- large touch targets;
- confirmation feedback.

## R3 — Recruitment and military infrastructure

- barracks/stable/range/siege production queues;
- RallyPoint storage;
- global recruitment panel;
- auto facility distribution;
- queue progress;
- cancel/refund rules;
- spawn/muster validation;
- multiplayer ownership.

Legacy recruitComposition direct spawning becomes migration/debug fallback only.

## R4 — Building experience

- preserve placement preview;
- add rotation;
- entrance/facing visualization;
- repeat placement;
- two-point road/wall workflow;
- touch two-tap mode;
- clearer invalid reasons.

## R5 — Army representation and animation

- select legally usable external source assets;
- create provenance registry;
- adapt rigs/models to Bedrock;
- representative mixed-composition rendering;
- animation state controller;
- hit-frame timing;
- visible depletion.

No placeholder models.

## R6 — Squad combat brain

Implement:
- perception;
- target scoring;
- order intent;
- formation;
- role assignment;
- approach/reposition/retreat;
- combat state machine.

Replace nearest-target-only behavior.

Add role logic for spear brace, knight charge, ranged spacing, siege setup.

## R7 — Formation and group movement

- Block/Line/Column/Wedge/Loose;
- automatic formation;
- manual preference;
- multi-army relative placement;
- facing/width input;
- terrain-aware relaxation;
- shared path corridor experiments.

## R8 — Strategic encounters

- strategic army-vs-army detection;
- abstract battle when nobody is present;
- materialized battle when players are present;
- deterministic enough to prevent reload abuse;
- encounter duration and result log;
- state reconciliation if player enters midway.

## R9 — Diplomacy and campaigns

- War/Truce/Neutral/Alliance;
- treaty permissions;
- reinforcement march;
- war log;
- optional war objectives;
- ally notifications;
- strategic shared information.

## R10 — Campaign siege and projectile layer

- nation-vs-nation strategic building/capital siege;
- fortification and target HP;
- temporary building disable and capital breach;
- supply/morale logistics;
- war score and loot;
- visible cosmetic arrow/bolt/siege projectiles;
- observed/strategic siege continuity.

## R11 — Tactical camera and strategic map

Implemented in 1.12.0 Remake Alpha 11:
- custom follow-orbit tactical camera preset;
- camera-relative controls;
- session toggle and safe camera clear;
- tactical actionbar status;
- army strategic list with HP/order/current/target/ETA;
- conflict map for active encounters and sieges;
- nation/capital and world-site destination command surfaces;
- direct numeric X/Z Move/Attack Move;
- context-aware war/alliance/reinforcement actions;
- Army Banner direct army-entity context menu;
- observer teleport kept as an explicit separate action.

Further polish remains:
- touch/controller runtime tuning;
- information-density tuning;
- optional richer visual map representation if it can remain Marketplace/cooperative-safe.

## R12 — Marketplace polish

- onboarding;
- tutorial prompts;
- accessibility;
- Korean/English text cleanup;
- visual hierarchy;
- sound feedback;
- model consistency;
- license audit;
- performance profiles;
- multiplayer abuse tests.

### Alpha 13 first R12 batch

Implemented statically in 1.14.0 Remake Alpha 13:
- state-driven 8-step onboarding with direct next-action routing;
- solo-safe diplomacy onboarding completion;
- Army/Realm/Settings menu hierarchy reduction;
- compact HUD default with detailed HUD toggle;
- reason + recovery text for several high-frequency failure paths;
- missing Recruitment Queue runtime functions restored from existing schema/design intent;
- automatic eligible-barracks scheduling;
- same-barracks sequential / multi-barracks parallel training;
- owner-offline world Queue progression;
- per-barracks RallyPoint controls;
- queue cancel/full refund and pause/resume timing persistence;
- existing-army preset reformation at capital with HP-fraction preservation.

Still required before R12 exit:
- real Bedrock touch/controller path testing;
- phone portrait/landscape density checks;
- host/client multiplayer ownership and race tests;
- simultaneous recruit/build/diplomacy operations;
- Korean/English final copy/localization pass;
- sound/animation/death/siege presentation polish;
- low-end mobile performance profiling;
- final license/provenance audit.

Static validation does not close these runtime requirements.


### Alpha 14 second R12 batch

Implemented statically in 1.15.0 Remake Alpha 14:
- latest-state revalidation before Recruitment Queue cancel/refund;
- latest-state RallyPoint mutation without rewriting stale queue data;
- army reformation commit-time checks for existence, capital distance, combat state, unlocks, HP and resources;
- building upgrade/refresh current-level and current-cost revalidation;
- diplomacy request, alliance breakup, treaty permission and SharedCommand commit-time revalidation;
- strategic nation context revalidation for War/Alliance/MilitaryAccess/Reinforcement changes;
- system-tool-only block interception and Army-Banner-only army entity interception;
- nation-slot-scoped neutral-clan hostility used consistently by strategic site UI;
- current-site revalidation for strategic sites and dungeon start;
- pending reward claim-before-grant ordering;
- offline ResourceAid pending-save-before-sender-debit ordering.

R12 exit still requires real Bedrock verification for:
- controller and touch navigation/targeting;
- host/client simultaneous forms and state races;
- phone portrait/landscape density;
- Korean/English complete copy/localization;
- sound/death/corpse/siege presentation polish;
- low-end mobile performance profiling;
- final external asset/license audit.


### Alpha 15 third R12 batch — source audit checkpoint

Implemented and packaged in 1.16.0 Remake Alpha 15:

- ordinary Minecraft input/game-mode/rule passthrough and inventory-preserving tools;
- recoverable wallet/world transactions, stable reward claims and ResourceAid outbox deduplication;
- bounded alternate-bank JSON/journal pages and corruption-preserving diagnostics;
- army handoff/materialization rollback, recruitment completion/tombstones and command-save-before-actor ordering;
- request identity/permission/privacy revalidation and grouped Encounter/Siege/site reward state;
- UserBusy/disconnect form locks, safe observer movement, camera/HUD behavior and role-gated combat animation.

Validation: 71/71 mocked Script API checks and 37/37 static/package checks. Payload94 files/66 JSON; named functions638/duplicate0. SOURCE and mcaddon bytes match; SHA-256 `5af1a01af738dc2d4f12193a861c6d93c6bd940065bb9595f09aaae63da61ba0`.

R12 remains open. The next work is evidence from real Bedrock:

- all 20 touch/controller UI flows, phone portrait/landscape layout and camera exits;
- host/client forms, permission revoke, recruitment/build/aid/reward races;
- fresh/v1.1.5/Alpha14 backup-world migration, save/reload and new wallet/journal/page recovery;
- low-Simulation-Distance/offline-owner march and abstract/physical HP continuity;
- low-end mobile FPS/TPS and long-lived page/tombstone state size;
- full English script UI, sound/death/corpse presentation and final external provenance review.

No Add-On import/world launch/play was completed in this audit. Runtime rows are NOT_RUN/BLOCKED_RUNTIME; these source results do not close R12 or R13. Large NPC outbound campaign expansion remains lower priority than these gates.


## R13 — Full release validation

Platforms:
- Windows keyboard/mouse;
- Windows controller;
- Android/iOS-class touch behavior where testable;
- lower simulation distance;
- multiplayer host/client;
- fresh world;
- migrated v1.1.5 world.

Release cannot be declared based only on static validation.
