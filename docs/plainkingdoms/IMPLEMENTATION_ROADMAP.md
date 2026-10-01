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
- R11.5 pre-polish combat/NPC bridge: completed in 1.13.0 Remake Alpha 12 — chunk-independent NPC faction-site combat with physical/abstract garrison continuity and role-specific bow/crossbow/siege/charge animations.\n- R12+ remain active work.

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
