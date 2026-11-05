# Monster Restaurant — Design Canon v0.1 (2026-11-05)

**Status: initial proposal; detailed balance and numerical targets are NOT locked.** This is a large Minecraft Bedrock survival add-on, not a separate tycoon game.

## Fantasy and three optional loops

1. **Hunt / explore:** Encounter new monsters naturally while playing ordinary survival. Defeat them using normal combat and get useful ingredients. Mining and farming remain relevant.
2. **Cook / collect:** Prepare food at readable cooking stations. Enjoy the food's hunger/buff benefit and discover recipes, independent of any restaurant.
3. **Run a restaurant (opt-in):** Build a real restaurant in an existing or player-made village, serve customers, use income to grow facilities/staff and make survival expeditions easier.

Players may ignore the restaurant and still access survival food. Restaurant management must not gate basic hunting, recipes or combat progression.

## Combat and ingredients

- Ordinary attack should suffice for **every normal monster's baseline ingredients**.
- Some selected species may show obvious behavior (e.g., charge recovery, exposed shell) offering a modest **optional** bonus on successful timing. No obscured mandatory ritual or weapon requirement.
- Harder monsters may have interesting telegraphs/attacks; not every new creature needs a unique weakness or special kill condition.
- A fight must be readable without consulting the codex. A short codex note supplements observation, not replaces it.
- Maintain vanilla Minecraft power curve; add some food-related adventure gear and effects without requiring a full RPG leveling system.

## Cooking

- Recognizable stations such as cutting board, pan, pot, oven; new stations must justify their distinct gameplay.
- Most dishes should take a few understandable interactions; no factory-like processing chains, mandatory multi-day waits or ingredient micro-currencies.
- Dishes distinguish their purpose through hunger/saturation, utility in exploration, temporary combat benefits, or sale value, not dozens of stacking numerical modifiers.
- A meal looks and sounds good while being made. In-world visual representation of pan/pot food and clear completion feedback matter.
- Recipe discovery is driven by obtaining ingredients and cooking, rather than grinding mastery/research XP.

## Restaurant, village, staff

- Build restaurant in normal world; existing village offers convenience and nearby clients, but **a village location is not mandatory**.
- Core service: open → customer order → cooking → serve → payment/response; accessible with minimal menu layers.
- Small initial role set: cook, server, manager. Employees reduce repetitive chores but not erase meaningful player choices.
- Functional furniture should be few and unmistakable; avoid secretly grading aesthetic building preferences.
- Village additions should give restaurants believable context (visitors, traders, a few small commercial structures) without replacing vanilla villager professions.
- Income: **one main restaurant currency**, useful for facilities, staffing, menu supplies and limited expedition preparation. Do not let restaurant income trivially bypass Minecraft's diamond/netherite progression.
- No idle-time wage debt while player is offline. Transaction idempotence, ownership and persistence must be explicit.

## Mining and farming

- Use vanilla iron, copper, redstone and stone in practical kitchen/furniture tools.
- Only add new ores if unique gameplay warrants them; e.g. rock salt is a candidate, not a locked requirement.
- Existing mining and farming should already feed equipment and ingredient loop.

## One unified in-game guide

A single guide/field cookbook with four simple pages: **monsters / recipes / ingredients / restaurant**.
- Encounter monster → record basics; defeat/obtain ingredient → show drops and practical source.
- Acquire ingredient → show discoverable recipe hints; successfully cook → record recipe.
- Monster entry: where found, what drops, useful tips, matching recipes. Avoid lore/TMI unless it serves a concrete player need.
- Unlocks happen through actual play, not extra collection levels, research points or dozens of checklist chores.
- On-screen text is player language only: immediate meaning and action, not changelogs, debug IDs, implementation notes or creator commentary.

## Complexity guardrails

1. If a task is repeated without new decisions, consider staff automation or remove the redundant step.
2. Do not add a new currency/progression bar just to make the system seem large.
3. Prefer rich interaction among a manageable number of systems over many thin systems.
4. No full-time restaurant attendance required; player may close it to explore.
5. Multiplayer: prevent duplicate orders/payments, handle owners, offline staff, item loss/rejoin safely.
6. No unsupported claim that a custom UI or advanced NPC AI works until Bedrock runtime checks.

## Art and experience quality

- Use verified in-game references and scene observations before design, not 'generic RPG card UI' by default.
- Minecraft-compatible low-complexity silhouettes, clear character behavior, consistent cuisine color/texture language.
- Visual feedback for cooking, pouring, serving, eating and restaurant ambience.
- Blockbench model source belongs in repository alongside exported assets; high-quality sound and animation matter.
- Actual Bedrock capture, small-window, controller/touch, GUI scaling and mobile performance gates.

## Not locked

Exact name, item counts, mobs, boss list, user economy units, staff salaries, restaurants/region dimensions, target Bedrock version, design assets, gameplay timings, narrative are open for later evidence-based design. No invented final numbers.
