# PlainKingdoms Marketplace Remake Canon

Status: canonical remake plan
Date: 2026-09-30
Source baseline: PlainKingdoms v1.1.5 Bedrock Add-On
Target: commercial-quality Minecraft Bedrock kingdom/RTS experience
Repository role: planning and design only. Runtime source/build artifacts are not stored here unless explicitly decided later.

## 1. Product identity

PlainKingdoms is not being rebuilt as a pure top-down RTS and not as a generic village automation add-on.

The target identity is:

> A Minecraft kingdom game where the player lives in the world directly, but can switch naturally into tactical and strategic command when governing armies, construction, diplomacy, and distant campaigns.

The player fantasy is:
1. survive and establish a capital;
2. grow population and economy;
3. construct a readable settlement;
4. recruit armies through military infrastructure;
5. command nearby armies directly in the world;
6. command distant armies without chunk-loading babysitting;
7. form alliances, negotiate, reinforce allies, or wage wars;
8. expand through exploration, neutral factions, raids, and strategic campaigns.

Minecraft remains the physical world. Strategic state is the authoritative game state.

## 2. Why the remake exists

PlainKingdoms v1.1.5 already contains a broad amount of content, but the experience is currently held back by the interaction layer.

Observed 1.1.5 issues:
- too many system tools occupy hotbar space;
- major functions are hidden behind deep ActionForm chains;
- army recruitment ends by requiring the player to look at a valid nearby block;
- long-range ground commands fail when the view ray hits air;
- loaded-vs-virtual army logic assumes disappearing from entity queries is equivalent to leaving simulation;
- in real gameplay an army may remain query-visible while its AI is no longer ticking outside simulation distance;
- the result is an army that appears to accept a command but only starts moving again when a player walks close enough to reactivate its chunk;
- combat is mostly proximity targeting plus direct damage numbers;
- mixed compositions are represented visually by one dominant unit model;
- combat animations are extremely limited;
- one compressed army actor is good for performance but currently poor at communicating composition, formation, attacks, losses, and tactical state;
- diplomacy exists but is shallow and reinforcement movement is too teleport-oriented;
- accessibility/readability is below Marketplace target quality;
- mobile is technically supported by Bedrock but the current UX was not designed around touch ergonomics.

This remake prioritizes reliability of command first, then presentation.

## 3. Non-negotiable design rules

### 3.1 Strategic state is authoritative

Never define an army's existence by whether a Minecraft Entity happens to be ticking.

The authoritative object is StrategicArmyState.

A PhysicalArmyActor is a presentation and local simulation proxy created only when useful.

### 3.2 Never require the player to babysit chunks

If the player sends an army 500, 1000, or 2000 blocks away, it must continue to make strategic progress while the player stays behind.

Simulation distance is not a gameplay requirement.

Do not solve this by requiring high simulation distance or permanent ticking areas.

### 3.3 Mobile is first-class

Every essential flow must work with touch:
- no hover-only information;
- no tiny required targets;
- no mandatory right click;
- no precision drag as the only way to perform a command;
- primary actions should require few taps;
- repeated actions should not require returning through deep menus;
- long lists are categorized and shortened;
- two-tap alternatives exist for drag-like operations.

Keyboard/mouse and gamepad may expose shortcuts, but no core function may depend on them.

### 3.4 World interaction remains valuable

Ground targeting is not removed. It is improved.

Looking at terrain should remain the fastest way to move a nearby army or place a building. Missing the exact block must not turn a valid intent into a failed command.

### 3.5 Keep the compressed-army performance model

Do not replace a 30-person army with 30 constantly simulated Minecraft mobs.

One strategic army remains one simulation object at the highest level. When physically rendered, the actor may visually contain multiple representative soldiers.

### 3.6 No fake complexity

Do not add dozens of formations, diplomacy states, resources, or commands merely because other RTS games have them.

Expose only commands that create a materially different player decision.

### 3.7 Save compatibility

Existing 1.1.5 worlds should be migrated rather than discarded whenever technically possible.

Legacy player properties remain readable through the migration window.

## 4. Three-layer world model

PlainKingdoms is redesigned around three layers.

### Direct layer

Normal Minecraft first/third-person play.

Used for:
- walking through the settlement;
- interacting with buildings;
- fast nearby building placement;
- quick army orders;
- local exploration and combat observation.

### Tactical layer

Optional command mode for nearby battle management.

Used for:
- selecting army groups;
- movement;
- attack move;
- defend area;
- retreat;
- patrol;
- formation;
- facing/orientation;
- multi-army destination placement.

This may use a raised camera, but normal Minecraft play remains the default.

### Strategic layer

Persistent kingdom simulation independent of rendered chunks.

Used for:
- distant army position;
- destination;
- waypoints;
- ETA;
- campaign status;
- strategic encounters;
- abstract combat while nobody is present;
- alliance reinforcements;
- distant raids;
- return marches.

## 5. StrategicArmyState

Minimum canonical schema:

- id
- nation/owner identity
- generation/version
- composition
- current strength
- max strength
- morale
- strategic x/y/z
- destination x/y/z
- order
- formation preference
- facing
- movement speed
- march state
- waypoint list
- tactical doctrine
- last strategic update time
- physical actor state
- current encounter id
- current campaign id
- return destination
- status effects
- persistence metadata

The exact serialized representation can change, but the conceptual split may not.

### 5.1 Physical actor lifecycle

Use hysteresis rather than chunk-unload detection.

Example initial thresholds:
- materialize within approximately 64 blocks of any relevant player;
- remain physical while within approximately 80 blocks;
- virtualize beyond the outer threshold when safe.

The final values are performance-tested on mobile.

The outer threshold being larger than the inner threshold prevents spawn/remove oscillation.

### 5.2 Proactive virtualization

When no player is close enough:
1. copy authoritative position/health/order from the physical actor into StrategicArmyState;
2. increment authoritative generation if required;
3. remove the physical actor intentionally;
4. continue strategic simulation immediately.

Do not wait for the engine to stop returning the entity.

### 5.3 Materialization

When a player approaches:
1. confirm target chunk is script-accessible;
2. find a safe terrain landing position near the strategic coordinate;
3. create the appropriate physical army actor;
4. hydrate composition, health, order, facing, generation, animation state;
5. resume local tactical simulation.

### 5.4 Offline ownership

Strategic armies must ultimately be stored at world/nation scope, not only on the currently connected Player object.

The v1.1.5 player army roster becomes a migration source and compatibility mirror.

This allows marches and campaigns to remain coherent even when owners disconnect.

## 6. Ground command resolver

The current 1.1.5 hard failure path based only on getBlockFromViewDirection is replaced by a resolver pipeline.

Priority:
1. direct block ray hit;
2. projected world target from view direction;
3. topmost terrain lookup at projected X/Z;
4. nearby walkable-point correction;
5. fallback to the nearest valid position along the intended ray;
6. only then reject the command.

The purpose is not auto-aim. The purpose is to preserve obvious player intent.

### 6.1 Distance behavior

Near targets:
- prioritize exact block hit.

Medium targets:
- direct hit if available;
- otherwise project to terrain.

Far targets:
- project a configurable horizontal distance;
- surface-resolve the X/Z;
- show a visible destination marker before/after confirmation as appropriate.

### 6.2 Invalid locations

Reject or correct:
- unloaded script-inaccessible destinations when local terrain inspection is mandatory;
- deep water for normal land armies unless amphibious support exists;
- lava;
- enclosed positions;
- severe cliff cells with no walkable approach;
- protected/forbidden zones.

### Alpha 6 SquadBrain implementation

The local physical squad now has a role-weighted tactical state machine.

States used in Alpha 6 include:
- approach
- engage
- brace
- charge
- recover
- kite
- fireline
- siege_reposition
- anchor
- desperate
- move / retreat / hold

Behavior rules:
- spear-heavy squads brace against cavalry at close approach;
- cavalry-heavy squads charge suitable targets but suppress charge into spear walls;
- a successful cavalry hit enters a disengage/recover window before the next charge;
- ranged-heavy squads maintain a stand-off band and kite if compressed;
- siege-heavy squads maintain a longer rear band;
- heavy/royal-guard-heavy squads anchor at close range;
- explicit Move/Rally/Retreat overrides autonomous combat movement;
- Hold does not chase.

This is squad-level intent for the compressed one-entity army. R7 adds actual representative-soldier formation slot positioning.

## 7. Army control model

Default exposed orders:
- Move
- Attack Move
- Defend Area
- Patrol
- Retreat

Context commands:
- attack selected enemy;
- reinforce ally;
- defend selected building;
- escort/follow;
- stop/hold.

Avoid exposing implementation-level AI modes.

### 7.1 Selection

Fast selection layers:
- all armies;
- nearby armies;
- current selected army;
- saved command groups;
- army from locator/strategic map.

Touch users need large targets and a minimal number of list steps.

## 8. Composition versus formation

v1.1.5 calls composition presets "formations." This terminology is replaced.

Composition = which troop types are inside the army.

Formation = where representative soldiers stand during local tactical simulation.

Initial formations:
- Block: robust default;
- Line: ranged fire and wide frontage;
- Column: roads, bridges, gates, narrow terrain;
- Wedge: charge/breakthrough;
- Loose: projectile/AOE spacing.

Automatic formation is ON by default.

Manual selection remains available.

Terrain and tactical doctrine may temporarily adapt formation without destroying the player's preferred formation.

### Alpha 7 formation implementation

Formation preference is now part of the authoritative army row:
- auto
- block
- line
- column
- wedge
- loose

Legacy rows default to auto.

The physical actor mirrors the preference and exposes a client-synced 0..4 active formation property.

The six representative soldier roots move to distinct local coordinates for Block, Line, Column, Wedge, and Loose. Representative roles are reordered so frontline roles tend toward front slots and archer/crossbow/siege roles tend toward rear slots; Wedge prioritizes cavalry toward the lead.

Auto rules in Alpha 7:
- Move / Rally / Retreat -> Column;
- spear Brace -> Line;
- cavalry Charge -> Wedge;
- ranged Fireline -> Line;
- Recover / Kite / Siege Reposition -> Loose;
- heavy Anchor / normal melee -> Block.

Manual formation preference overrides automatic switching.

For multi-army commands, the destination point is expanded into a formation-specific set of unique target coordinates. The local layout is rotated using the vector from the selected-army centroid toward the destination, so Line/Column/Wedge orientation follows travel direction rather than fixed world axes.

A lightweight same-nation separation vector is applied only in local steering, while the A* destination and route cache remain stable. This reduces actor stacking without continuously invalidating path plans.

The compressed-army rule remains unchanged: representative soldiers are visual/tactical slots inside one army entity, not independent pathfinding mobs.

## 9. Combat architecture

Replace nearest-target plus periodic direct-damage combat with a squad-level state machine.

High-level states:
- HOLD
- MOVE
- APPROACH
- ENGAGE
- REPOSITION
- RETREAT
- ROUT
- RECOVER

Combat decision pipeline:
1. perception;
2. threat evaluation;
3. squad intent;
4. formation choice;
5. role assignment;
6. movement;
7. animation windup;
8. authoritative hit frame;
9. recovery/reposition.

### 9.1 Role examples

Swordsmen:
- stable general frontline;
- exploit openings;
- protect ranged troops when no heavy infantry exists.

Spearmen:
- anti-charge/frontline brace;
- prioritize cavalry and large targets.

Heavy infantry:
- anchor formation;
- reduce displacement;
- protect weaker backline units.

Archers:
- preserve range;
- seek firing lanes;
- avoid unnecessary melee;
- focus exposed/light targets.

Crossbow:
- slower cadence;
- stronger deliberate volleys;
- higher value against armored targets.

Knights:
- flank;
- charge;
- disengage/re-form;
- avoid wasting charge into braced spear fronts.

Royal guard:
- high-value anchor/escort;
- capital and commander protection.

Siege:
- rear deployment;
- structure/large-target priority;
- setup and firing cycle.

## 10. Visual army representation

Keep one physical actor per army for performance, but improve visual representation.

A physical army actor may render approximately 6–9 representative soldiers depending on mobile performance.

The displayed representatives must reflect composition instead of only dominantUnitType.

Example:
- front rank: swords/spears/heavy;
- flanks: knights when present;
- rear: archers/crossbows/siege.

Loss feedback:
- as strategic strength falls, visible representatives reduce or switch to wounded/depleted presentation.

Do not imply that each visual soldier equals exactly one strategic soldier.

### Alpha 5 implementation

The first functional version is now implemented with one physical army entity rendering up to six representative soldiers.

- shared geometry: `geometry.plainkingdoms.squad_v2`;
- body proportions and selected motion curves are retargeted from Kenney Blocky Characters (CC0), with exact provenance tracked separately;
- six visual slots receive role codes derived from the actual 30-person composition;
- visible equipment silhouettes cover militia, sword, spear, heavy infantry, archer, crossbow, knight, royal guard and siege;
- HP depletion reduces visible representatives from six toward one;
- entity type and base texture are still retained for compatibility, so a future role-atlas/texture pass can further differentiate each representative.

This preserves the compressed-army performance model while ending the previous dominant-unit-only equipment presentation.

## 11. Animation target

External commercially usable or permissively licensed models/rigs/animations may be adapted only after license verification and provenance recording.

Required animation families:
- idle;
- walk;
- run;
- charge;
- slash;
- stab;
- brace;
- draw;
- fire;
- reload;
- hit;
- stagger;
- death;
- regroup.

Damage should occur on a deliberate hit frame rather than at the beginning of an attack cycle.

Visual projectiles may be lightweight presentation objects while server script remains authoritative for damage.

### Alpha 5 animation implementation

A client-synced animation state bridge now drives:
- idle;
- walk;
- sprint/retreat;
- melee;
- ranged;
- hit reaction.

The Kenney-derived idle/walk/sprint/melee/death curves were retargeted into Bedrock animation JSON. The death clip exists as a resource but final corpse/death presentation remains unresolved because normal entity removal may occur before a readable death animation finishes.

Combat damage for friendly armies is now scheduled at an animation hit frame rather than applied immediately at attack start. The scheduled hit revalidates entity existence, hostility and distance before authoritative damage.

## 12. Recruitment redesign

v1.1.5 immediate ground-target spawn after selecting a composition is removed as the normal flow.

Military production flow:
1. select composition/unit package;
2. select production source automatically or manually;
3. queue recruitment;
4. show progress;
5. complete at barracks/stable/range/siege infrastructure;
6. send completed army to that facility's rally point.

Each relevant military building stores a RallyPoint.

Global recruitment view can distribute production across eligible facilities.

Recruitment should not require looking at the ground every time.

## 13. Building placement redesign

Preserve the useful parts of v1.1.5 placement preview:
- valid/invalid color feedback;
- footprint preview;
- confirmation protection;
- clear invalid-reason messaging.

Add:
- category-first building selection;
- 90-degree rotation where building data permits;
- entrance/facing visualization;
- repeat placement;
- two-point road/wall placement;
- touch-friendly rotate/confirm/cancel actions;
- nearby obstruction explanation.

Implemented Alpha 4 categories:
- Recommended
- Housing / Economy
- Military
- Civic / Research
- Defense
- Roads / Walls

Alpha 4 implementation details:
- building selection snaps the front direction to the nearest cardinal direction based on player view;
- 90° rotation changes the actual generated procedural structure, not only the preview;
- an entrance/front marker is rendered separately in placement preview;
- rotation is persisted in building shard schema v3 while schema v2 remains readable;
- rotated footprint/reservation/upgrade collision checks use the same orientation;
- barracks default RallyPoint and resident work apron follow building orientation;
- repeat placement is player-toggleable;
- roads and walls use tap-start/tap-end two-point construction with a 72-block initial cap;
- road/wall segments are construction jobs and reject building-footprint intersections.

## 14. UI information architecture

Reduce required hotbar system tools.

Target approximately three primary surfaces:
- Realm Ledger: economy, residents, diplomacy, exploration, kingdom status, settings;
- Builder Tool: build/upgrade/placement;
- Army Banner: army selection, commands, tactical mode, army locator.

World Atlas can become a Ledger tab or a context shortcut rather than a mandatory hotbar slot.
Settings should not need a permanent gameplay item.

### 14.1 Menu depth target

Common actions: 1–2 interaction layers.
Uncommon configuration: maximum approximately 3 layers.

No duplicated "main menu" and "integrated menu" loops.

### 14.2 Context UI

The selected object determines actions.

Army:
- move
- attack move
- defend
- patrol
- retreat
- formation
- details

Barracks:
- queue
- rally point
- upgrade
- production overview

Capital:
- kingdom summary
- policy/progression
- diplomacy
- strategic map

Farm/economy:
- production status
- assigned workers
- upgrade

## 15. Mobile interaction

Touch is not a reduced mode.

Rules:
- buttons sized for thumbs;
- large confirm/cancel areas;
- no hover;
- no mandatory long precision drag;
- support "tap start, tap end" for wall/road/formation-width operations;
- avoid repeated form reopening;
- surface selected-army state persistently when giving commands;
- provide immediate audio/visual confirmation of accepted orders;
- distinguish command accepted / invalid target / no path / delayed strategic movement.

Optional PC/gamepad optimizations:
- command-group shortcuts;
- faster selection;
- drag orientation;
- wheel/radial shortcuts.

## 16. Tactical camera

A tactical camera is optional, not the only way to command.

Purpose:
- multi-army selection;
- formation placement;
- readable battle observation;
- nearby tactical planning.

Normal player controls resume cleanly when leaving command mode.

Camera must be comfortable on touch and controller, not designed only around mouse edge scrolling.

## 17. Strategic map

Strategic map/army locator becomes a real command surface.

Each army card/marker shows:
- composition;
- strength;
- current order;
- coordinates/region;
- destination;
- ETA;
- physical/strategic status;
- current encounter;
- reinforce/recall availability.

Distant movement can be issued directly from this layer.

## 18. Abstract distant combat

When opposing strategic forces meet where no relevant player is present, resolve combat strategically.

Inputs may include:
- remaining strength;
- troop composition;
- matchup advantages;
- morale;
- formation/doctrine;
- fortification strength;
- terrain category when safely known;
- commander modifiers;
- supply/campaign state;
- limited deterministic randomness.

Do not instantly resolve large battles if a duration better communicates war.

When a player approaches during/after an encounter, materialize the authoritative remaining state.

## 19. Diplomacy redesign

Relationship states:
- War
- Truce
- Neutral
- Alliance

Separate relationship from permissions/treaties.

Potential treaty flags:
- MilitaryAccess
- ResourceAid
- SharedVision
- Reinforcement
- SharedCommand

Alliance does not automatically grant every permission.

War remains a deliberate player action.

Peace/truce and alliance require explicit acceptance where relevant.

## 20. Allied reinforcements

Replace normal reinforcement teleporting with strategic movement.

Flow:
1. select ally/target settlement;
2. issue Reinforce order;
3. StrategicArmyState marches;
4. ally sees ETA/status;
5. army materializes near destination when a player is present.

Emergency recall/teleport remains a recovery/admin fallback, not the main fantasy.

## 21. Accessibility and readability

Required:
- concise labels before flavor text;
- icons reinforce but never replace meaning;
- important status uses text plus color;
- colorblind-safe distinction for valid/invalid/allied/hostile states;
- scalable information density;
- avoid huge paragraphs inside ActionForms;
- warning messages state both cause and recovery action;
- combat unit silhouettes remain distinguishable at distance.

## 22. Performance

Primary constraint: mobile Bedrock.

Principles:
- strategic armies do not need physical entities;
- pathfinding is only for physically materialized actors;
- expensive path calculations are budgeted across ticks;
- nearby actors use spatial indexing/caching;
- combat searches avoid full-world scans;
- particles/projectiles have budgets;
- no permanent ticking-area dependency;
- do not require simulation distance 12.

Performance profiles may remain, but core correctness must not change between profiles.

## 23. External-code policy

External code may only be directly reused when the license is compatible with commercial distribution and the reuse obligations are explicitly tracked.

Reference-only sources are used for design/algorithm learning, not copy/paste.

Each imported model, texture, rig, animation, sound, or code component must record:
- source URL;
- author;
- license;
- exact file/revision;
- modifications;
- attribution requirements;
- Marketplace/commercial compatibility review.

## 24. Reference roles

Age of Empires IV console:
- context-sensitive command menu;
- controller-first unit/building selection;
- attack move/patrol/formations;
- console-specific UI rather than merely mapping PC UI.

Company of Heroes 3 console:
- radial command UI that exposes only actions relevant to the selected unit;
- fast global unit management.

Anno 1800 console:
- avoid long exhausting lists;
- radial/category navigation;
- two-tap alternative to hold/drag;
- configurable interaction patterns.

Total War:
- group movement;
- maintained formation;
- destination width/facing;
- unit-role placement.

StarCraft II:
- rally points;
- command groups;
- queued orders/waypoints;
- production accessibility.

Rusted Warfare:
- mobile-first RTS validation;
- minimap commands;
- multi-touch;
- unit groups;
- rally points;
- strategic zoom that scales to phones/tablets.

Tooth and Tail:
- remove chores and excessive micro;
- tie RTS interaction to an in-world commander.

Supreme Commander:
- strategic scale should not force the same camera/detail level as local battle.

Reign of Nether:
- Minecraft-specific RTS pathfinding, formation, cursor, production, and alliance architecture;
- GPL source is reference-only unless a deliberate compliant route is chosen.

MineFortress:
- Minecraft RTS selection/build/task abstractions;
- MIT code may be considered for clean, documented adaptation where technically appropriate.

Colonies at War:
- campaign troops leave local entity simulation;
- real battle when someone is present;
- abstract resolution when nobody is watching;
- march time, diplomacy, war objectives, supply and consequences.

## 25. Marketplace direction

The final packaging model must be selected deliberately.

If sold as a world/template experience, stronger RTS constraints on vanilla behavior are acceptable.

If sold as a cooperative general-purpose Add-On, avoid unnecessarily disabling vanilla play and provide an explicit command/director mode instead.

No placeholder art in Marketplace candidates.

No unlicensed third-party content.

## 26. Definition of a successful remake

The remake is not successful because every planned feature exists.

It is successful when:
- an army obeys a distant order without the player walking beside it;
- a touch player can build, recruit, and command without fighting the UI;
- mixed armies visibly look mixed;
- combat actions are readable and animated;
- building/recruitment flows are obvious;
- diplomacy has understandable consequences;
- local battle and distant campaign state never contradict each other;
- multiplayer ownership is unambiguous;
- performance remains acceptable on realistic mobile hardware;
- a fresh player can understand the first kingdom loop without developer explanation.

This document overrides earlier informal remake discussion when they conflict.
