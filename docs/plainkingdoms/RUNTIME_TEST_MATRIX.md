# PlainKingdoms Remake Runtime Test Matrix

Date: 2026-10-01

This file records mandatory runtime checks for the remake. Static checks never substitute for these.

## Army persistence / chunk independence

For one army and multiple armies:
- order 100 blocks;
- order 500 blocks;
- order 1000 blocks;
- order 2000 blocks;
- player does not follow;
- verify army strategic position progresses;
- verify no duplicate actor appears at old location;
- verify approach materializes at new authoritative location;
- repeat with simulation distance set low;
- repeat after dimension travel;
- repeat after player disconnect/reconnect once world-registry migration exists.

## Ground targeting

Test:
- exact near block;
- shallow downward view;
- almost horizontal view;
- high cliff;
- valley;
- forest canopy;
- water shoreline;
- invalid deep water;
- 96-block boundary;
- target beyond direct ray hit;
- touch input repeated taps;
- duplicate command suppression.

Expected:
- obvious intent resolves to useful terrain;
- invalid target explains why;
- no silent menu opening when a ground command was intended.

## Recruitment

- recruit each unlocked troop type;
- recruit mixed composition;
- queue multiple armies;
- two production buildings;
- insufficient resources;
- insufficient population;
- army cap;
- cancel queue;
- destroyed production building;
- rally point unloaded;
- rally point moved during production;
- multiplayer simultaneous recruitment.

## SquadBrain Alpha 6

- spear-heavy vs knight-heavy: brace triggers at close approach;
- braced spear wall reduces charge effectiveness;
- knight-heavy vs ranged-heavy: charge begins only in the intended distance band;
- charge into spear wall is suppressed;
- successful charge enters recover/disengage and does not immediately spam another charge;
- ranged-heavy squad kites when an enemy compresses its minimum range;
- ranged-heavy squad returns toward its preferred fireline when too far away;
- siege-heavy squad preserves a longer rear distance;
- heavy/royal-guard-heavy squad anchors instead of over-pursuing at close range;
- balanced 10 sword / 10 spear / 10 archer does not stop at maximum archer range;
- target does not thrash every decision tick while the current target remains valid;
- target focus saturation causes some multi-squad spreading without preventing focus fire on an important target;
- Move/Rally/Retreat overrides SquadBrain and does not opportunistically attack;
- Hold does not chase but attacks when already in range;
- Attack/Defend uses tactical movement;
- brace animation state is visible and exits correctly;
- cavalry recover movement does not path into unsafe blocks.

## Formations

For Block/Line/Column/Wedge/Loose:
- flat land;
- slope;
- narrow road;
- bridge;
- gate;
- trees;
- collision around building;
- rotate/facing;
- automatic formation switch;
- manual preference restoration.

## Combat

Matchups:
- sword vs sword;
- spear vs knight;
- knight vs ranged;
- heavy vs general melee;
- ranged vs ranged;
- siege vs structure/large target;
- mixed vs mixed.

Observe:
- target stability;
- no whole-army dogpile jitter;
- formation recovery;
- attack animation sync;
- hit-frame sync;
- retreat behavior;
- no attacking through impossible geometry;
- losses reflected visually and strategically.

## Strategic encounters Alpha 8

Detection:
- two virtual armies from nations at War enter <=12 blocks -> one Encounter;
- Neutral/Alliance armies do not create an Encounter;
- multiple nearby armies from the same two nations merge into the same local battle where possible rather than spawning many 1v1 encounters;
- same-side army entering <=18 blocks joins as reinforcement;
- max-new-encounter pass budget is respected.

Abstract battle:
- no player nearby -> HP changes over time, not instant winner selection;
- sword vs sword lasts a meaningful duration;
- spear-heavy force has a real advantage against knight-heavy force;
- knight-heavy force has a real advantage against ranged-heavy force;
- heavy/guard composition receives defensive value;
- formation modifiers remain secondary to composition;
- deterministic resolution does not change simply because a chunk reloads;
- destroyed army disappears from authoritative world shard and cannot revive from a stale actor.

Observed transition:
- player approaches active Encounter -> abstract HP loss stops;
- survivors materialize with the same HP they had strategically;
- physical deaths update the same authoritative rows;
- player leaves -> actors virtualize -> the same Encounter returns to abstract mode;
- no duplicate physical and virtual copies exist.

Command/diplomacy:
- new player Move/Attack/Retreat/Hold command can remove that army from encounter membership;
- emergency recall removes encounter membership;
- War -> peace/neutral/alliance cancels the bilateral encounter;
- surviving armies restore their pre-battle order/target after normal battle completion or peace;
- a victorious marching army resumes its original long-distance route.

Logging/UI:
- encounter appears in strategic battle log;
- support join / army loss / materialize / abstract resume / final result are logged;
- army locator marks an army as strategic-battle or physical-battle participant;
- selecting an active encounter can navigate the commander to the battle area.

Performance:
- no active/new encounter pass does not rewrite every army shard;
- spatial grid prevents all-world full pair scan;
- strategic encounter loop time appears in performance diagnostics.

## Strategic combat

- two virtual armies meet with nobody present;
- player approaches before fight;
- player approaches during fight;
- player approaches after fight;
- simultaneous encounters;
- reinforcement joins encounter;
- owner disconnect;
- server reload/restart if supported by environment.

## Building UX

- all categories;
- selection from each category returns the correct build mode;
- rotation at 0°/90°/180°/270°;
- rectangular barracks/mine/warehouse preview dimensions rotate correctly;
- entrance/front marker follows rotation;
- actual generated blocks match rotated preview;
- invalid collision uses rotated Lv.5 reserved footprint;
- upgrade/refresh retains rotation;
- Alpha 3/v2 building shard loads as north-facing and upgrades to v3 safely;
- repeat placement ON/OFF;
- road two-point flat/slope/diagonal;
- wall two-point flat/slope/diagonal;
- road/wall maximum length rejection;
- road/wall territory-boundary rejection;
- road/wall building-footprint intersection rejection;
- infrastructure first-point reset;
- cancel;
- touch accidental double tap;
- placement near water/terrain edge;
- rotated barracks default RallyPoint;
- rotated resident workplace apron.

## Diplomacy

- alliance request/accept/decline;
- truce;
- war;
- treaty permissions;
- allied military access;
- reinforcement;
- shared command denied/allowed;
- relationship persistence;
- disconnect/reconnect;
- three-nation interactions.

## Accessibility/mobile

- no required hover;
- readable button labels;
- large touch targets;
- no common action deeper than intended;
- no hotbar overcrowding;
- color status also has text/symbol;
- command accepted feedback;
- command failure recovery instruction.

## Performance

Measure:
- idle settlement;
- 5 armies physical;
- 10+ strategic armies;
- dense combat;
- projectile-heavy combat;
- many buildings;
- multiple players.

Watch:
- tick stalls;
- repeated full entity scans;
- pathfinding spikes;
- actor materialize/remove thrashing;
- particle spam;
- memory/state growth.

## Release blocker

Any of the following blocks Marketplace candidate status:
- army stops unless followed;
- duplicated/lost strategic army;
- save migration corrupts v1.1.5 state;
- touch cannot perform a core action;
- unlicensed external asset;
- combat state diverges between strategic and physical layers;
- common UI loop traps or loses navigation;
- multiplayer player A can unintentionally command player B's army.
