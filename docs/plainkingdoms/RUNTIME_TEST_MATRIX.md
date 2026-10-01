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

## Diplomacy / treaties Alpha 9

Relationship:
- Alliance request / accept / decline;
- War declaration from Neutral;
- accepted peace request -> Truce;
- War declaration blocked during active Truce;
- Truce expires to Neutral;
- legacy saved relation `ally` reads as Alliance;
- relationship persists across save/reload.

Treaties:
- request/accept each of MilitaryAccess, ResourceAid, SharedVision, Reinforcement, SharedCommand;
- OFF -> ON cannot happen without receiver acceptance;
- either side can revoke ON -> OFF immediately;
- leaving Alliance clears active treaty flags;
- revoking SharedCommand immediately invalidates active shared-control context.

MilitaryAccess:
- physical army cannot enter Neutral foreign territory;
- virtual army cannot cross the same border;
- Alliance without MilitaryAccess still blocks entry;
- Alliance + MilitaryAccess permits entry;
- War permits invasion of enemy territory;
- army already inside territory after permission revoke is allowed to move outward but not deeper inward;
- third-party territory can stop a long reinforcement route.

ResourceAid:
- online allied recipient receives 25-unit resource support;
- offline allied recipient receives pending reward on next login;
- aid denied without ResourceAid treaty;
- treaty revoked while form is open prevents final transfer.

SharedVision:
- allied army coordinates/composition/HP/order/encounter are visible;
- SharedVision does not teleport the player;
- SharedVision does not permit Army Banner control.

SharedCommand:
- command one allied army;
- command all allied armies;
- ground Move;
- ground Attack Move;
- Hold;
- gather to controlling player's current position;
- no undeclared-context ReferenceError on gather;
- owner offline still permits world-state command;
- command respects controlled army owner's MilitaryAccess;
- treaty revoke while control is active returns control to own nation.

Strategic Reinforcement:
- requires Alliance + Reinforcement + MilitaryAccess;
- selected one army and all-army modes;
- no teleport at order issue;
- 500 / 1000 / 2000 block march without owner following;
- owner disconnect while march is active;
- supportForSlot persists through virtualize/materialize;
- arrival notifies ally and switches to Hold;
- ordinary new command clears supportForSlot;
- route blocked by third-party neutral territory without access;
- reinforce army can enter target ally territory only with MilitaryAccess.

Multiplayer:
- simultaneous treaty requests;
- simultaneous revoke/request race;
- three-nation MilitaryAccess combinations;
- alliance breakup while support army is inside former ally territory;
- save/reload with active treaties and reinforcement march.

## Campaign / siege / projectiles Alpha 10

Siege command:
- select one army and order enemy capital siege;
- select all armies and order building siege;
- 1 / 4 / 8 / 16 armies all receive unique assembly targets within siege-start radius;
- physical army reaches target then creates siege;
- virtual army reaches target then creates siege;
- owner disconnect does not stop siege march;
- peace/truce/alliance transition cancels bilateral active siege;
- player issues normal Move/Attack/Hold/Retreat and army leaves siege cleanly.

Siege resolution:
- fortification HP reflects capital/watchtower state;
- disabled watchtower no longer contributes defense;
- fortification breaks before target HP;
- non-capital victory disables target building temporarily without deleting structure blocks;
- disabled barracks cannot accept normal recruitment production;
- disabled production/support building stops contributing to building-level totals;
- disabled watchtower stops automated defense;
- disable expiry restores operation;
- capital breach weakens strategic fortification/defense for the configured duration;
- capital breach expiry restores normal defense;
- siege attacker losses update authoritative StrategicArmyState and cannot be overwritten by a healthier physical copy;
- observed siege writes strategic HP loss back to physical actor health.

Campaign logistics:
- supply increases in own territory;
- supply increases more slowly in allied ResourceAid+MilitaryAccess territory;
- supply falls in neutral field;
- supply falls faster in enemy territory;
- low supply slows virtual march;
- low supply/morale slows physical march;
- low supply/morale lowers strategic and local damage;
- battle damage lowers morale;
- strategic victory and siege victory recover some morale;
- supply/morale survive virtualize/materialize and save/reload.

Campaign result:
- siege victory changes war score;
- attacker receives loot/resource reward;
- defender siege-loss counters update;
- campaign log only exposes records involving that nation.

Visible projectile:
- archer shot visibly spawns arrow;
- crossbow shot visibly spawns bolt;
- siege-heavy ranged shot visibly spawns siege projectile;
- observed strategic siege produces visible volleys;
- projectile disappears after impact/timeout;
- cosmetic projectile itself deals zero impact damage;
- server-authoritative hit-frame applies damage exactly once;
- target leaving range before hit frame still cancels authoritative damage;
- many projectiles do not accumulate permanently.

Performance:
- active siege count appears in performance diagnostic;
- observed siege count appears separately;
- low-supply army count appears;
- multiple unobserved sieges do not require loaded chunks.

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
