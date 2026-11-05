# PlainKingdoms Remake Runtime Test Matrix

Date: 2026-10-01

This file records mandatory runtime checks for the remake. Static checks never substitute for these.

## Alpha 15 execution status

Current package: `1.16.0 Remake Alpha 15` / runtime `1.16.0-remake.15`.
SOURCE ZIP and mcaddon SHA-256: `5af1a01af738dc2d4f12193a861c6d93c6bd940065bb9595f09aaae63da61ba0`.

**NOT_RUN**: actual Add-On import, world launch and play. Windows Bedrock installation was confirmed, but screen automation was stopped and the remaining work used source files only. This is not evidence that Bedrock is absent.

**BLOCKED_RUNTIME**: real touch/controller, phone layout, camera/animation/pathfinding, multiplayer host/client, engine save/reload/migration, Simulation Distance and FPS/TPS measurements. No PASS_RUNTIME rows or game evidence were obtained. The 71 mocked Script API and 37 static/package PASS results cover source behavior only.

Test on a new world and copies of v1.1.5/Alpha14 worlds. Keep the previous pack and world backup together: Alpha15 introduces `pk_economy_v1`, recovery receipts and alternate-bank JSON pages; downgrade reading by Alpha14 is not supported. Record engine version, device, input, simulation distance, pack hash, players, steps, before/after state, content log and video/screenshot evidence for each result.

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

## Tactical camera / strategic command Alpha 11

Tactical camera:
- toggle ON from Army menu;
- toggle OFF and return to ordinary camera;
- reconnect/player init never leaves camera stuck;
- death/respawn camera recovery;
- keyboard/mouse orbit and camera-relative movement;
- controller orbit and camera-relative movement;
- touch orbit and camera-relative movement;
- movement direction remains understandable relative to elevated view;
- Army Banner ground Move/Attack Move still works while tactical camera is active;
- tactical actionbar reports correct selected/all scope, moving count, encounter count and siege count;
- rapidly toggling camera does not create camera errors or duplicated UI state.

Strategic army map:
- one/4/16 armies list without losing items across pagination;
- HP/order/physical/virtual/encounter/siege state correct;
- current and target coordinates correct;
- ETA decreases during virtual march and stops when no moving target exists;
- select individual army from strategic map;
- formation change persists;
- return-to-capital order works.

Direct coordinates:
- valid positive and negative X/Z;
- decimal input handled consistently;
- blank/invalid numeric input rejected without corrupting army target;
- Move command;
- Attack Move command;
- loaded destination;
- unloaded destination;
- MilitaryAccess validation still applies.

Conflict map:
- active Encounter appears;
- active Siege appears;
- selected army dispatches to encounter area;
- attacker can reissue existing Siege target;
- observer teleport occurs only when explicitly selected.

Nation/site context:
- own capital rally;
- War nation capital Attack Move;
- War nation capital Siege;
- Alliance + access normal movement;
- Alliance + Reinforcement + access strategic reinforcement;
- Neutral/Alliance without MilitaryAccess cannot receive invalid military entry;
- world-site Move;
- world-site Attack Move.

Army Banner direct entity context:
- own army tap opens own context;
- select/hold/attack-mode/formation actions apply to the tapped army;
- SharedCommand ally opens shared-control context;
- SharedVision-only ally exposes information but not command;
- SharedVision-only interaction never teleports player;
- War enemy context dispatches currently selected own army rather than taking control of enemy;
- unrelated/non-army entities retain normal behavior.

Menu/UX:
- common army command reachable without reopening deep Realm menu;
- strategic map observer teleport clearly separated from actual command;
- touch targets remain large enough on phone layout;
- no hover-dependent information.

## NPC strategic sites / role animation Alpha 12

NPC strategic site:
- send army 500+ blocks to Raider Camp while player remains at capital;
- send army to Goblin Camp and Undead Crypt under same conditions;
- strategic garrison HP decreases while site chunk is not loaded;
- attacker HP/morale losses persist in StrategicArmyState;
- attacker casualty is removed through normal generation/world-shard path;
- walk into a partially damaged site and verify physical defenders spawn at matching remaining-strength fraction;
- leave during physical site combat and verify live defender HP becomes strategic garrison HP before defender removal;
- re-enter and confirm no full-health reset;
- abstract victory marks site defeated and no defenders respawn;
- abstract victory pays existing site rewards including offline pending reward;
- generic new Move/Attack Move clears siteTargetId;
- completed physical site combat clears stale site attack orders;
- neutral clan abstract combat occurs only for nation slots that explicitly made that clan hostile;
- world boss and dungeon waves do not accidentally enter faction-site abstract resolver.

Role animation:
- Archer representative slot uses bow animation;
- Crossbow representative slot uses crossbow animation;
- Siege representative slot uses siege_fire animation;
- Knight charge uses charge posture;
- retreat/kite/recover use sprint, not charge;
- switching charge -> recover returns from charge state without getting stuck;
- mixed army does not force sword/spear representatives into bow/crossbow-only arm poses;
- attack state returns to ordinary locomotion after lock expiry;
- cosmetic projectile remains zero-damage presentation;
- one authoritative hit-frame damage event per attack;
- anim_state 0..11 stays valid on all friendly entity variants.


## Alpha 13 R12 onboarding / recruitment regression

Onboarding:
- fresh player sees Capital as first next action;
- capital completion advances to first production building;
- farm/lumber/mine completion advances to Barracks;
- Barracks advances to recruitment;
- a queued or existing authoritative StrategicArmyState satisfies first recruitment;
- RallyPoint set/default action advances the RallyPoint step;
- a real accepted army ground Move/Attack Move advances movement;
- a real friendly hit advances combat;
- diplomacy request or valid war declaration advances diplomacy;
- single-player world with no other nation does not get permanently blocked by diplomacy;
- skip onboarding hides progress without disabling gameplay;
- re-enable onboarding restores state-derived progress rather than resetting world state.

Recruitment Queue:
- one Barracks, 3 jobs: jobs train strictly sequentially;
- two or more Barracks: scheduler assigns jobs by earliest predicted completion and separate Barracks run in parallel;
- required Barracks level filters locked compositions correctly;
- Queue max 12 enforced;
- army cap includes queued commitments;
- available population subtracts queued 10-man commitments;
- resource payment occurs once at enqueue;
- cancel before start returns the full reserved cost;
- cancel during training returns the full reserved cost and reschedules following jobs;
- deleted Barracks pauses the job without completing it;
- downgraded/insufficient Barracks pauses the job;
- Strategic Siege temporary disable pauses the job;
- restore Barracks resumes with readyAt shifted by full paused duration;
- save/reload while paused preserves pausedAt and cannot cause early completion;
- owner disconnect while the world remains active does not stop Queue processing;
- completion while owner offline writes one authoritative world army row;
- owner reconnect mirrors authoritative row without duplicate actor;
- existing armyId in world shard removes stale completion job instead of duplicating the army;
- failed world-shard save leaves job retryable and does not silently lose the army;
- completed army appears at the selected Barracks RallyPoint;
- default RallyPoint is the Barracks entrance;
- current-position RallyPoint requires Overworld and own territory.

Army reformation:
- army farther than 36 blocks from capital is blocked with recovery guidance;
- Encounter participant is blocked;
- Siege participant is blocked;
- eligible army can switch to every unlocked preset;
- locked preset remains blocked;
- positive resource delta is charged once;
- cheaper preset produces no refund;
- current HP percentage is preserved against the new HP max;
- generation increases;
- old loaded actor is removed before rematerialization;
- encounter/siege/site/support state is cleared;
- authoritative world row remains the source of truth after reconnect.

Menu/accessibility:
- Army root exposes common command/recruitment in one step;
- strategy/war and maintenance actions are grouped one level deeper;
- Realm root does not require legacy Settings/Atlas/Locator hotbar items;
- only Ledger/Builder/Army Banner are force-restored to hotbar slots;
- compact HUD is default for a fresh player;
- compact/detailed HUD toggle persists;
- compact HUD stays readable on phone portrait/landscape;
- no onboarding step requires hover or precision drag;
- controller can traverse every new ActionForm without pointer-only affordances;
- failed ground target, recruitment, RallyPoint and reformation paths include both reason and recovery text.



## Alpha 14 R12 concurrency / input regression

Recruitment / RallyPoint stale forms:
- open recruitment cancel form, let the selected job finish in the 1-second Queue loop, then press cancel; no refund and no completed army resurrection/removal;
- open recruitment form, let another player/loop modify a different Queue entry, then cancel one job; unrelated latest entries remain unchanged;
- open RallyPoint form while recruitment progresses; changing RallyPoint preserves every current Queue entry and timing;
- cancel save failure does not refund resources before authoritative state removal succeeds.

Army reformation:
- open reformation form inside capital range, walk farther than 36 blocks, then confirm; commit is rejected;
- open reformation form, enter Encounter before confirming; commit is rejected;
- open reformation form, enter Siege before confirming; commit is rejected;
- remove/destroy authoritative army while form is open; stale selection is rejected;
- force world-army save failure; resources are refunded and loaded actor is not removed.

Construction:
- open building management, complete the same upgrade through another player/path, then confirm stale upgrade; stale requested level is rejected/recomputed rather than double-charged;
- change capital requirements while upgrade form is open; final capital upgrade uses current requirements;
- open refresh, upgrade building before confirming; refresh uses current level/rotation and cannot redraw the old level.

Diplomacy / treaty / SharedCommand:
- relation changes after diplomacy confirmation form opens; stale acceptance/request cannot restore an old relation;
- alliance ends while treaty permission form is open; permission mutation is rejected;
- treaty flag changes while form is open; final action uses current flag rather than old displayed state;
- SharedCommand is revoked while allied army selection is open; no shared control context is created;
- SharedCommand is revoked while Army Banner ally context is open; command is rejected;
- enemy relation changes from War before context action; no old attack order is issued;
- enemy physical actor disappears/moves while context is open; action uses latest authoritative position when valid and never throws on stale entity.

Strategic nation/site:
- War -> Truce/Neutral while capital attack/siege form is open; stale attack/siege is rejected;
- Alliance or MilitaryAccess/Reinforcement revoked while allied capital action is open; move/reinforcement is rejected according to current permissions;
- neutral clan is hostile to nation A but not nation B; A sees/uses hostile action while B keeps neutral interaction and is not treated as a combat enemy;
- neutral-clan hostileSlots change while site form is open; final action follows current nation-scoped hostility;
- faction site is defeated while strategic site form is open; stale move/attack action is rejected.

Dungeon start:
- two players open the same available dungeon start form;
- player A starts expedition;
- player B confirms from stale form;
- only one active run exists, wave/participants/state are not reset or clobbered by B.

Pending reward / ResourceAid:
- simulate pending-claim state-save failure on login; no reward is granted yet and the pending record remains retryable;
- successful claim removes pending record before grant and reconnect cannot duplicate the reward;
- simulate offline ResourceAid pending-save failure; sender resources are not deducted;
- successful offline ResourceAid stores pending reward before sender deduction;
- online ResourceAid still transfers exactly once under current treaty permissions.

Input interception:
- director with empty hand opens doors/chests and interacts with ordinary world blocks normally;
- director with ordinary non-system item keeps ordinary block interaction;
- director interacts with ordinary NPC/entity without Army Banner and vanilla/add-on interaction remains available;
- Army Banner on friendly/SharedCommand-valid army still opens the intended army context;
- Builder/other PlainKingdoms system tools still intercept only their own intended block actions;
- keyboard/mouse, controller and touch each complete the same basic command path without pointer-only assumptions.


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


## Alpha 15 targeted runtime checklist

## 20개 사용자 흐름

모든 폼에서 닫기/취소/뒤로와 controller focus도 각각 확인한다. button label 잘림·body scroll·폰 세로/가로·HUD 겹침을 기록한다.

| # | 테스트 | 실행 절차 | 기대 결과 | 실제 결과/증거 |
|---|---|---|---|---|
| 1 | 첫 왕국/온보딩 | 새 월드에서 장부 → 온보딩을 연다. 다음 행동을 누르고, 조작 안내/건너뛰기/재활성화도 각각 사용한다. | 실제 완료 상태와 단계가 맞고, 건너뛰어도 기능이 유지된다. | NOT_RUN |
| 2 | 수도 창설 | 평평한 넓은 공터에서 장부 → 수도 창설. 가까운 다른 수도, 가려진 부지, 정상 부지로 각각 시도한다. | 이유+복구 안내, 국가 슬롯 중복 없음, 완공 뒤 생산 시작. | NOT_RUN |
| 3 | 첫 생산 건물 | 건설도구 → 추천 → 농장/제재소. 첫 터치 후 같은 곳 재터치. 웅크리기 회전·배치 취소·반복 배치도 확인한다. | preview가 블록을 망가뜨리지 않고 확정 때만 비용1회. 완공 뒤20초 생산. | NOT_RUN |
| 4 | 첫 병영 | 건설 → 군사 → 병영. 자원 부족/인구 부족/해금 부족/겹치는 부지와 정상 배치를 각각 시도한다. | 병영·비용·공사 상태가 일치하고 막힌 이유와 다음 행동이 보인다. | NOT_RUN |
| 5 | 모집·취소·병렬 | 군단 → 군사 생산 → 새 군단 모집. 동일 병영2개 job, 별도 병영 job을 만든다. 취소 화면을 열고 완료를 기다린 뒤 취소한다. | 동일 병영 순차/다른 병영 병렬. 정상취소만1회 환불. 완료된 job 환불/재생성 없음. | NOT_RUN |
| 6 | 병영 집결지 | 군사 생산 → 병영 집결지 → 현재 위치 사용. 영토 밖/다른 차원/정상 위치·기본값 복원을 테스트한다. 모집 중에도 바꾼다. | 모집 Queue 진행이 뒤로 가지 않고 실제 완성 군단이 최신 집결지에 나타난다. | NOT_RUN |
| 7 | 이동/공격 이동 | 깃발로 근거리/완만한 아래 시선/거의 수평/96블록 경계 목표를 지정한다. 이동과 공격 이동 각각 사용한다. | 명령 의도대로 가며 작은 pixel 조준이 필수 아님. 동일 tap 중복 명령·메뉴 중복 없음. | NOT_RUN |
| 8 | Army Banner 컨텍스트 | 내 군단, 권한 없는 중립/동맹, SharedVision-only 동맹, SharedCommand 동맹, 전쟁 군단을 각각 깃발로 터치한다. | 관계별 정보/명령 범위가 맞고 일반 item으로 entity를 터치하면 일반 상호작용이 유지된다. | NOT_RUN |
| 9 | 대형 | 빠른 군단 지휘 → 대형에서 자동/방진/횡대/종대/쐐기/산개를 각각 고른다. 군단 이동 후 저장·재접속한다. | 선호 유지, 역할 전열·간격이 맞고 다른 군단의 설정이 바뀌지 않는다. | NOT_RUN |
| 10 | 전술 카메라 | 카메라 ON/OFF, 다른 메뉴 왕복, 사망/재접속/차원 이동을 테스트한다. | 일반1/3인칭으로 돌아올 수 있고 menu만 열어도 강제 reset되지 않는다. HUD 깜박임 없음. | NOT_RUN |
| 11 | 전략 지도 | 군단 → 전략/전쟁 → 전략 지도 → 내 군단. 모든 페이지·빈 목록·사라진 군단·뒤로를 확인한다. | 좌표/목표/HP/예상 시간이 정상이며 stale row로 명령/복제를 만들지 않는다. | NOT_RUN |
| 12 | X/Z 명령 | 전략 지도 → 좌표 직접 지휘에서 빈칸, 문자, 음수,0, 정상 좌표, world 경계 밖을 입력한다. 확인에서 이동/공격/취소를 고른다. | 빈칸이0으로 취급되지 않으며 취소 때 명령 없음. 허용된 목적지만 저장된다. | NOT_RUN |
| 13 | 외교 요청 | A가 B에게 동맹/휴전 요청. B가 확인 화면을 열고 A가 같은 요청을 교체한다. B가 오래된 요청을 수락한다. | 새 요청을 대신 수락하지 않는다. 정상 요청만 current 관계와 함께 저장·종료된다. | NOT_RUN |
| 14 | 조약 enable/revoke | 동맹에서5개 권한을 각각 요청/승인/철회한다. 켜는 화면을 열어 둔 채 다른 쪽에서 먼저 승인/철회한다. | 표시 상태가 바뀌면 refresh 요구. current 관계가 alliance일 때만 권한 유효. | NOT_RUN |
| 15 | SharedCommand | A가 B군단 공동 지휘 선택. B가 권한을 철회/관계를 종료한 직후 A가 열린 폼/깃발로 명령한다. | B군단 order/target/generation 불변. SharedVision만으로 지휘 불가. own선택 뒤 공동지휘 잔류 없음. | NOT_RUN |
| 16 | 지원군 | 지원군+통행 권한 두 개를 각각 켜고 끄며 파견한다. 명령 도중 통행 권한을 철회한다. | 정상 파견은 전략 행군이며 teleport가 아니다. 목적지/경유 정책·거절 사유 확인. | NOT_RUN |
| 17 | 공성 | 전쟁 국가를 고르고 목표 페이지를 모두 넘긴다. 선택 중 휴전/건물 변경을 시도한다. 실제 공성을 끝내고 접근/이탈한다. | 기존 블록 삭제 없음. fort/target/army HP 연속성, disable/breach, loot1회, 관계 변경 시 종료. | NOT_RUN |
| 18 | 건물 upgrade/refresh | 건물 목록 → 관리 화면을 연 채 레벨/자원/다른 공사를 바꾼 뒤 업그레이드/재시공한다. | currentLevel+1·current비용만 적용. current rotation/외형·최대 부지 유지, 진행99% 저장 재시도 가능. | NOT_RUN |
| 19 | site/던전/보스 | 두 사람이 같은 던전 시작 폼을 열고 동시에 확정. 각 wave와 마지막 적 처치. faction를 멀리서 반쯤 공격한 뒤 접근/이탈한다. | 중복 wave/보상 없음. 남은 garrison HP 유지. 중립 부족 적대는 해당 국가만 적용. | NOT_RUN |
| 20 | 설정/복구/기본 플레이 | HUD 간결/상세, 성능3모드, 도구 복구를 사용한다. 일반 아이템·가득 찬 인벤토리·문/상자/채굴/설치/vanilla combat도 테스트한다. | ordinary item 유실 없음, 일반 플레이 유지. pk_admin 없는 사용자는 global 삭제불가. 관리자 확인 취소는 삭제0. | NOT_RUN |

## 저장·멀티 race·장거리 시나리오

| ID | 실행 절차 | 기대 결과 | 실제 결과/증거 |
|---|---|---|---|
| L1 | 한 군단/여러 군단에100/500/1000/2000블록 명령. 소유자는 움직이지 않고 지도의 좌표를30초마다 기록한다. 충분한 시간이 지난 뒤 다른 플레이어가 목적지에 접근한다. | 전략 좌표가 진전, 출발지 stale actor 없음, 도착지 materialization1회. | NOT_RUN |
| L2 | A가 원거리 행군·모집 예약 후 disconnect. B는 world를 계속 실행. A 재접속. 이어서 저장/닫기/reload. | owneroffline 동안 진행, offline world time를 무한히 누적한 catch-up 없음, army/Queue/HP/권한 연속. | NOT_RUN |
| L3 | 병영 기능정지/파괴로 Queue pause. 저장/reload 후 복구. 취소와 완료를 같은 시간에 시도. | pausedAt 유지, 멈춘 시간만큼 종료 지연, 취소·완료의1회 결과, unrelated Queue 불변. | NOT_RUN |
| L4 | physical군단56블록 밖으로 보내고44블록 안으로 접근. 경계 왕복30회, 다른 플레이어 동시 접근. | hysteresis로 actor thrash 제한, 같은 ID 중복0, formation/supply/morale/site/support/conflict/generation 유지. | NOT_RUN |
| L5 | 낮은 sim distance에서 nation전략전 시작. 절반 HP에서 관측자가 접근/이탈, 한 군단 retreat, 관계war→truce 전환. | abstract/physical HP 연속, stale membership 재편입 없음, 끝난 battle이 되살아나지 않음. | NOT_RUN |
| L6 | 마지막 site 적/wave/보스 죽음 직전과 직후 save/reload; 동일 site UI를 두 사람이 열고 확정. | duplicate reward/wave0, terminalremaining0이 다음 wave/defeat로 복구. | NOT_RUN |
| L7 | A→offlineB 지원25. A reconnect/reload, B 로그인, 양쪽 반복 reconnect. 지원 직후 조약 revoke. | A25차감/B25증가1회. 성립한 예약 전달, 새 지원 차단. | NOT_RUN |
| L8 | Alpha14→Alpha15 복사 world: 기존자원, legacy player army roster, rotation, pausedQueue, sharedflags, site/campaign 값을 전후 비교. v1.1.5도 같은 방식. | 기존식별자/모든의도된값 유지, wallet로 첫 write 후에도값 동일, World army가 mirror보다 우선. | NOT_RUN |
| L9 | 8개 nation·최대16군단·Queue12·건물180의 단계적 stress. 두 사용자가 서로 다른 shard에서 동시에 작업/취소. | nation ownership 침범0, 메모리/serialization/DP크기 안정, watchdog/content error 기록 없음. | NOT_RUN |
| L10 | Server현황과 ArmyBanner/SharedVision 화면에서 neutral/ResourceAid-only/SharedVision/SharedCommand를 비교. 표시 중 권한 revoke 후 상세 클릭. | foreignresources노출0, 권한 없는 추가 정보/명령0. | NOT_RUN |

## 저장 실패의 실제 엔진 검증

정상 플레이에서 의도적으로 world 파일을 손상시키지 않는다. 별도 복사 test world와 개발용 fault-injection harness가 있을 때만 정확한 setter 실패 위치를 기록한다. 제공된 배포팩에는 failure injection switch가 없다. 이 harness가 없으면 아래 행은 NOT_RUN으로 유지한다.

- receipt publish 전 실패: paid작업·지원·refund 모두 primary와 자원 변화0.
- primarywrite 뒤 walletwrite 실패 / journalclear 실패: 전후 자원 합계·job/row를 기록하고 재시도/reload. 정확한1회 결과와 원래 record가 보여지는 lock 확인.
- rewardwalletwrite 실패 / queueclear 실패: pendingpacket 유실0, 재접속 중복0, 뒤에 새 packet을 추가해도 원래 packet1회.
- aidpendingwrite 실패 / outboxclear 실패 / recipientcleanup 실패: escrow유지와 owner watermark dedup, 수신25/송신25 정확히1회.
- physical snapshot저장 실패: actor제거0. materializationrow 저장 실패: 새 proxy제거, virtualrow유지.
- generation/armydeath/site-count 실패: retry가 배우/수비대/보상을 중복시키지 않음. 최초 intent조차 저장되지 않은 순간 강제 종료한 결과는 별도 한계로 기록.
- 큰 Unicode state: primarypage/bank/index/receiptpage 저장 실패 후 기존 state를 그대로 읽을 수 있음. orphanpages 장기 bytecount 확인.

## 전투·표현·성능

- melee/창병 brace/기사 charge→recover/궁 bow/석궁 crossbow/공성 setup-fire-impact를 각각 촬영한다. 혼성10검10창10궁, 원거리 중심, 기사 중심을 비교한다.
- retreat/kite/recover에서 sprintstate4, 실제charge에서state10. 공격 lock 만료 뒤 locomotion 복귀; 퇴각 명령 직후 예약 hit의 취소 확인.
- 목표가 hit delay 동안 거리 밖으로 움직인 경우, 근접병만 있는 군단이 원거리에서 피해를 주지 않는다. 가시 arrow/bolt/siege가 두 번째damage를 주지 않는다.
- arrow/bolt50ticks, siege80ticks 뒤 cosmetic actor가 정리되는지 관측한다. 실제 바닥 충돌/청크unload 뒤에도 영구 누적되지 않아야 한다.
- corpse/death linger는 현재 구현 안 됨. deathanimation의 짧은가시성은 결과를 그대로 기록하고 PASS로 바꾸지 않는다.
- 모바일에서 10분 이상 운영하고 FPS와Scriptms를 따로 기록한다. 3성능모드, 최대 loadedentities, preview/beacon/대형공사/war/siege/site 동시 실행, idleworld도 비교한다.
- cameraON/OFF 실제감각, Survival관찰이동의 safe-ground거절/성공, ordinarymob환경에서 성능 변화를 확인한다.

## 관리자 진단

global vanilla cleanup은 자동 실행하지 않는다. `pk_admin` tag가 있는 사용자만 확인 폼을 사용할 수 있다. testworld의 관리자가 필요한 경우 `/tag @s add pk_admin`을 직접 사용한다. 이 삭제는 loadedoverworld의 vanilla동물/아이템/탈것까지 포함한다. 취소/권한철회 테스트부터 수행하며, 일반 world에서는 사용하지 않는다.

## 결과 기록 양식

각 실패에 재현 단계, 전후자원, armyID/generation, QueueID, siteID/wave, 관계/flag, game log, engine/device/input/시각을 남긴다. 모든행 PASS와 migration·성능·출처 releasegate를 충족하기 전 Marketplace ready로 표시하지 않는다.
