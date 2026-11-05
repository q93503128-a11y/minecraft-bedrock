# PlainKingdoms RTS Reference and UX Research

Date: 2026-09-30
Purpose: Map external RTS lessons to specific PlainKingdoms remake problems. This is a design reference, not permission to copy protected code/assets.

## Research method

References are chosen for one of four reasons:
1. they solve controller/touch accessibility problems;
2. they solve army-scale command problems;
3. they solve strategic-vs-local simulation problems;
4. they solve Minecraft-specific pathfinding/building constraints.

The remake should not imitate one title wholesale.

## 1. Age of Empires IV console

Useful observations:
- selection differs by context;
- command menu changes based on selected villagers, military units, or buildings;
- advanced military commands include Patrol, Attack Move, and Formations;
- quick selection reduces repeated camera/menu navigation;
- console UI was designed specifically for controller use.

PlainKingdoms use:
- Army Banner becomes context-sensitive;
- common commands appear immediately;
- building production does not require navigating back to one giant kingdom form;
- touch/gamepad shortcuts can select nearby military, capital, or production categories quickly.

Do not copy:
- exact radial layout;
- icons;
- button assignments.

## 2. Company of Heroes 3 console

Useful observations:
- PC command-card assumptions were removed for console;
- radial menu exposes selected-unit-relevant commands;
- quick unit switching and global unit command are central.

PlainKingdoms use:
- reduce always-visible options;
- army selected -> army commands;
- barracks selected -> queue/rally/upgrade;
- capital selected -> governance/diplomacy/strategic map;
- provide "all armies" and "nearby armies" controls.

## 3. Anno 1800 console

Useful observations:
- long list navigation was treated as tiring;
- radial menus shorten access paths;
- hold actions can be configured as tap-start/tap-end;
- drag construction can use two taps.

PlainKingdoms use:
- categories before building lists;
- road/wall placement: tap start, tap end;
- formation facing/width: optional two-point input;
- no essential precision dragging on touch.

## 4. Total War

Useful observations:
- multiple units can be grouped;
- groups can maintain fixed formation and spacing;
- right-click drag communicates destination width/orientation;
- multiple selected units can move together while preserving formation.

PlainKingdoms use:
- formation is separate from composition;
- multiple armies can preserve relative placement;
- precise deployment uses center + facing/width rather than microscopic individual movement;
- default AI chooses suitable formation so manual micromanagement is optional.

## 5. StarCraft II

Useful observations:
- rally points prevent production from becoming repetitive;
- control groups reduce selection friction;
- waypoint queues support long/planned movement;
- production buildings can be controlled without visually babysitting each one.

PlainKingdoms use:
- persistent military-building RallyPoint;
- global recruitment queue;
- saved army groups;
- strategic waypoints.

## 6. Rusted Warfare

Useful observations:
- explicitly supports phones/tablets;
- commands can be issued through minimap;
- multi-touch, unit groups, rally points, strategic zoom;
- interface scales across screen sizes.

PlainKingdoms use:
- mobile is a full command platform;
- strategic map can issue commands;
- large army-selection targets;
- avoid UI assumptions based on mouse hover.

## 7. Tooth and Tail

Useful observation:
- chores and high-APM micro were deliberately simplified;
- interaction is tied to an on-screen commander rather than a detached RTS cursor for everything.

PlainKingdoms use:
- keep Minecraft player as the normal commander avatar;
- direct world command should stay faster than opening a tactical map for simple actions;
- do not turn every task into a separate management panel.

## 8. Supreme Commander

Useful observation:
- strategic zoom solves huge differences in battle scale;
- large-scale strategy needs a different information level than close combat.

PlainKingdoms use:
- Direct / Tactical / Strategic layers;
- strategic map shows symbols/status, not full local detail;
- local actors materialize only when relevant.

## 9. Reign of Nether

Public GPL project.

Observed architecture:
- RTS-specific pathfinding;
- pathfinder worker/budget architecture;
- formation placement;
- drag formation;
- building placement;
- production queue;
- minimap;
- alliance state and optional ally control;
- screen-to-world cursor refinement.

PlainKingdoms use:
- reference pathfinding budgets/caches;
- separate formation planner;
- distinguish alliance from allied-control permission;
- improve cursor/ground target resolution.

License rule:
- reference-only by default because PlainKingdoms Marketplace licensing/distribution must remain clean.

## 10. MineFortress

Public MIT project.

Useful areas:
- selection abstractions;
- two-point selections;
- wall selections;
- task/blueprint layers;
- RTS settlement workflow.

PlainKingdoms use:
- study selection/build abstractions;
- possible code adaptation only after exact license/provenance recording and Bedrock rewrite review.

## 11. Colonies at War

Useful strategic model:
- campaigning guards leave ordinary local simulation;
- march time is handled strategically;
- if somebody is present, battle can become a real in-world fight;
- if nobody is present, resolve by strategic numbers;
- war objectives, truce, alliance, supply and consequences are explicit.

PlainKingdoms use:
- strategic armies are authoritative;
- physical army is conditional presentation;
- distant battles continue without a loaded chunk;
- reinforcement should march rather than normally teleport;
- war can have meaningful objectives later without requiring every encounter to be physically simulated.

## 12. Current PlainKingdoms 1.1.5 mapping

### Problem: ground click misses air

Current:
getBlockFromViewDirection(maxDistance 96) or fail.

Target:
direct hit -> projected X/Z -> topmost terrain -> nearby valid point.

### Problem: army stops outside simulation distance

Current:
physical entity remains authoritative until absent from actor queries.

Failure:
an entity can be query-visible/persistent while no longer receiving normal simulation.

Target:
proactive distance-based virtualization before simulation dependency matters.

### Problem: recruitment ends with ground aiming

Current:
choose composition -> pay -> targetGround -> spawn immediately.

Target:
choose composition -> queue -> production building -> stored rally point.

### Problem: mixed army looks like one type

Current:
dominantUnitType picks a single actor/model.

Target:
one compressed actor renders multiple representative troop roles.

### Problem: combat looks like HP subtraction

Current:
nearest target + range + cooldown + applyDamage.

Target:
squad state + role decisions + windup + hit frame + recovery + readable animations.

### Problem: menus are deep/long

Current:
many ActionForms, many hotbar tools, duplicated hubs.

Target:
three primary surfaces + context actions + category menus.

### Problem: alliance support teleports

Current:
selected loaded army actors teleport to online ally.

Target:
strategic Reinforce order with ETA; emergency teleport remains recovery-only.

## 13. UX budget

Common action target counts:

Move selected army:
- direct world: 1 ground action.
- tactical mode: select if needed + 1 destination action.

Recruit common army:
- open military production + choose composition + confirm/queue.
- no ground targeting if RallyPoint already exists.

Build common structure:
- builder tool + category/building if not preselected + place/confirm.

Change formation:
- army context + formation.
- automatic formation means many players never need to touch this.

Diplomacy:
- ledger -> diplomacy -> nation -> action.
- incoming request should be surfaced directly.

## 14. Research conclusions

PlainKingdoms should not become a high-APM competitive RTS.

Its advantage is combining:
- Minecraft embodiment;
- low-friction kingdom building;
- persistent strategy;
- readable squad combat;
- multiplayer diplomacy.

The design goal is "command depth without command friction."
