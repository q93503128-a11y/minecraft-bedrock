# PlainKingdoms Remake Runtime Test Matrix

Date: 2026-09-30

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
