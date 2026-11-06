# API compatibility investigation — 2026-11-06

## `회복력` (Recovery)

### Java contract and combined behavior

`AUGMENTS.md` specifies a natural-regeneration interval reduction of 10% / 20% / 30% at levels 1–3. The implementation is in `SurvivalAugmentService.consumeExtraNaturalRegenTimerTicks`, called by `FoodDataAugmentMixin` immediately before vanilla advances its natural-regeneration timer. It only accumulates credit while food is at least 18 and health is below maximum. Each eligible tick adds `1 / (1 - reduction) - 1` extra timer ticks, carrying fractional credit forward; it clears that credit when the player is ineligible. It changes when vanilla healing ticks occur, not the amount healed. `햇빛 체질` adds a further 5% / 10% / 15% interval reduction during daytime through the same timer path. The reductions combine additively and are capped by the Java service at 90%.

### Stable Bedrock API surface

The pinned stable API is `@minecraft/server` 2.11.0. `EntityHealBeforeEvent` exposes the entity, upcoming healing amount and source, and allows the script to cancel the heal or change its amount. `EntityHealCause.SelfHeal` identifies healing caused when hunger is full. The stable health, hunger, and saturation components expose attribute values, but none exposes or mutates the engine's pending natural-regeneration timer. The `naturalRegeneration` game rule controls natural healing at world scope, so it cannot disable native healing for one augmented player while retaining it for others.

Changing the `SelfHeal` amount would preserve the vanilla event cadence and change the amount per event, so it would not preserve the Java interval effect. Canceling native healing and scheduling replacement heals per player would also take over Bedrock's native eligibility and hunger/saturation costs. That route has not been shown to preserve those rules across full health, hunger changes, disabled natural regeneration, and multiplayer. No approximation is shipped.

### Classification and test state

Class **D** for the exact interval effect on the currently pinned stable API. This is based on the native timer being absent from the stable declaration surface, not on Java compilation. `recovery` remains `NOT_PORTED` and disabled as a core candidate. The roster records the `FoodDataAugmentMixin`, `SurvivalAugmentService`, `SurvivalTuning`, and `survival_modifier_contract.json` sources. No Recovery-specific BDS or client gameplay test was run, so none is reported as passing. When implemented, the Bedrock mapping must cover the daytime additive interaction with `햇빛 체질` and preserve the two saved levels independently.

References: [EntityHealBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhealbeforeevent?view=minecraft-bedrock-stable), [EntityHealCause](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhealcause?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable), [GameRule](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/gamerule?view=minecraft-bedrock-stable).

## `숨 고르기` (Catch Breath)

### Java contract and movement interactions

The canonical effect gives +10% / +20% / +30% movement speed after the player has not sprinted for 3 seconds. `MovementAugmentService` resets `nonSprintingTicks` to zero while sprinting and increments it to 60 otherwise; its shared `ADD_MULTIPLIED_BASE` conditional movement modifier adds 0.10 per saved level at that threshold. The Java shared bonus also includes daytime `햇빛 체질`, nighttime `야행성`, in-water `물갈퀴`, and timed `관성 전환`; `빠른 발` is a separate generic movement stat modifier. `AugmentMovementBonusService` exposes the shared modifier to the later `속도 전환` interaction. Bedrock now routes Catch Breath, Quick Feet, Nocturnal, Sun Affinity, and Webbed Feet through one per-tick movement reconciler. Momentum Shift and Speed Conversion remain pending.

### Stable Bedrock route and BDS evidence

Stable `Player.isSprinting` supplies the server-side input state. Stable `EntityMovementComponent` wraps `minecraft:movement`, and its base `EntityAttributeComponent.setCurrentValue` writes the current attribute. A one-time write to this player component reverts by the next tick on BDS, so the production handler counts non-sprinting ticks per online player and reconciles the level-based value once per tick. The counter is runtime-only and clears on sprint and player leave, matching Java's nonpersistent movement timer. While the player is in water, the handler holds the general component at default and maps the combined movement bonus to the separate underwater attribute. Catch Breath and Webbed Feet level-1 swim stacking remains separately verified. Quick Feet plus the active Nocturnal or Sun Affinity bonus is verified at the component level; Quick Feet's behavior with every other movement augment remains untested.

BDS 1.26.62.1 ran the production pack. After 35 idle ticks, the level 1–3 movement component values remained at default. By 70 idle ticks, they were exactly 1.10 / 1.20 / 1.30 of the 0.10 default. In water, measured swim-velocity ratios were 1.10 for level 1 Catch Breath alone, 1.10 for level 1 Webbed Feet alone, and 1.20 with both. The general movement value remained at its default in water. A separate ground `SimulatedPlayer.moveRelative` velocity probe returned zero for both control and level 1 in this fixture, so it was removed and is not counted as passing. The stable component value and water movement interaction are verified; direct client ground-speed visibility, mobile/controller behavior, and an actual sprint-reset transition remain untested.

### Classification

Class **B**: the stable attribute setter plus a server-side per-tick state machine reproduce the saved-level effect and the tested additive water interaction. `catch_breath` is `PARTIAL_BDS_VERIFIED` and enabled for uncommon core offers. The remaining Java movement-group interactions must be added to this shared aggregator as their augments are ported.

References: [EntityMovementComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable), [Player](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable).

## `빠른 발` (Quick Feet)

### Java contract and source mapping

The canonical effect is +3% / +6% / +9% / +12% / +15% movement speed at levels 1–5. Java declares it in `stat_modifier_contract.json` and applies generic stat modifiers through `StatAugmentCatalog` and `PlayerStatAugmentService`; the source files do not contain a literal `quick_feet` ID. The generated roster maps those generic runtime files and the data contract explicitly.

### Stable Bedrock route and evidence

Stable `minecraft:movement` is writable through `EntityAttributeComponent.setCurrentValue`, but a one-time player write was observed returning to the default on the next tick in BDS 1.26.62.1. The shared production reconciler now applies the saved Quick Feet level each tick and composes it additively with the active day/night bonus and Catch Breath. In water, its shared bonus is mapped onto Bedrock's separate underwater-movement component because the general movement component is held at default there.

The new production-handler GameTests read the movement component at all five levels and verify the Quick Feet + Nocturnal and Quick Feet + Sun Affinity stacks at night and day. They also leave a Quick Feet-only player idle before granting Catch Breath, confirm Catch Breath is still inactive after 35 newly-owned idle ticks, and verify its exact additive bonus after 60 ticks. This prevents Quick Feet alone from precharging the Catch Breath timer, matching Java runtime creation. These tests establish exact component multipliers, not actual ground walking velocity. A direct ground `SimulatedPlayer.moveRelative` experiment returned zero for both its control and level 1 and is excluded from passing evidence. Quick Feet remains partial and candidate-enabled; real client movement, mobile/controller feel, reconnect persistence, and stacking with all other movement augments have not been tested.

### Classification

Class **B** for the stable API route. The five exact component multipliers and day/night stacking pass BDS GameTests. `quick_feet` is `PARTIAL_BDS_VERIFIED` and enabled for common core offers; player-visible walking behavior and full movement-group interaction testing remain open.

References: [EntityMovementComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable).

## `야행성` (Nocturnal)

### Java contract and interaction

At levels 1–3, Java grants +5% movement speed and +5% mining speed per level at night. `MovementAugmentService.applyConditionalMovement` adds the movement portion to the shared conditional modifier only when the normalized Overworld clock is at or past tick 13,000; `ClientMiningAugmentMixin` separately adds the mining-speed portion while not daytime. During daytime, the movement bonus is inactive and the night mining bonus is inactive.

### Stable Bedrock route and BDS evidence

Stable `World.getTimeOfDay()` supplies world time; normalizing it modulo 24,000 and testing `< 13,000` mirrors Java's day boundary. The production movement reconciler checks this each server tick. Its BDS GameTest verifies exact +5% / +10% / +15% movement-component values at night, zero Nocturnal bonus during daytime, and additive stacking with Quick Feet at levels 1–5. These are server component measurements, not client walking-speed measurements.

Stable player block-break events report the block and tool but expose no vanilla mining-progress or break-speed setter. A custom hold-to-break loop would need to preserve touch and controller input and is not implemented. The mining half therefore remains unported.

### Classification

Class **C**, partial. Stable time and movement APIs reproduce the nighttime movement half exactly, but the separate mining-speed effect has no reviewed stable mutation route. `nocturnal` is `PARTIAL_BDS_VERIFIED` and enabled for uncommon core offers; it is not a complete port.

References: [World](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable), [EntityMovementComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable), [PlayerBreakBlockBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockbeforeevent?view=minecraft-bedrock-stable), [PlayerBreakBlockAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable).

## `햇빛 체질` (Sun Affinity)

### Java contract and interaction

At levels 1–3, Java grants +4% movement speed and reduces the natural-regeneration interval by 5% / 10% / 15% per level during daytime. `MovementAugmentService` applies the movement portion to the shared conditional modifier before normalized Overworld time tick 13,000. `SurvivalAugmentService.consumeExtraNaturalRegenTimerTicks`, called before vanilla advances the regeneration timer, adds fractional timer credit for this reduction only while the player meets Java's food and health eligibility rules. At night, both Sun Affinity portions are inactive.

### Stable Bedrock route and BDS evidence

The production movement reconciler uses normalized `World.getTimeOfDay()` and Java's `< 13,000` day boundary. Its BDS GameTest verifies exact +4% / +8% / +12% daytime movement-component values, zero Sun Affinity bonus at night, and additive stacking with Quick Feet at levels 1–5. These are server component measurements, not client walking-speed measurements.

Stable heal events expose healing source and amount, but no native natural-regeneration interval or pending timer that a script can adjust. Replacing vanilla healing with a per-player scheduler would need to reproduce native hunger, saturation, gamerule, and health eligibility; no equivalent has been validated, so no substitute is shipped. Recovery has the same underlying timer limitation and its own separate Java reduction.

### Classification

Class **C**, partial. Stable time and movement APIs reproduce the daytime movement half exactly; the natural-regeneration interval half remains unimplemented because the pinned stable API exposes no native timer control. `sun_affinity` is `PARTIAL_BDS_VERIFIED` and enabled for uncommon core offers; it is not a complete port.

References: [World](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable), [EntityMovementComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable), [EntityHealBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhealbeforeevent?view=minecraft-bedrock-stable), [EntityHealCause](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhealcause?view=minecraft-bedrock-stable).

## `한 조각 더` (Extra Piece)

### Java contract and interactions

The canonical effect adds one item to a mined ore's drops at 5% / 10% / 15% for levels 1–3. `ResourceHarvestService.afterBlockBreak` checks the Java conventional `ORES` block tag, rolls `ResourceHarvestTuning.extra_piece.bonus_chance_per_level` (0.05), recalculates drops with the captured block state and tool, skips augment cores, and clones one item from the first ordinary drop. This preserves the item's identity under tool-specific loot such as Silk Touch and Fortune. The Java hook also applies this roll to ore breaks made by its derived-break flow before returning to the derived-break caller; Bedrock must route future `굴파기` derived breaks through the shared harvest handler to preserve that interaction.

### Stable Bedrock route and BDS evidence

Stable `PlayerBreakBlockAfterEvent` exposes `brokenBlockPermutation` from before the break and `itemStackBeforeBreak`; stable `World.getLootTableManager().generateLootFromBlockPermutation` recalculates drops for the supplied permutation and tool. The handler recognizes vanilla ore IDs plus exposed `ore` / `ores` tags, reads the saved player level server-side, applies the exact 5/10/15% roll, excludes all six augment-core items, clones one item from the first ordinary generated drop, and spawns it at the broken block position. It does not replace the native break/drop transaction.

BDS 1.26.62.1 deterministically verified each exact chance boundary, one-item output, the Silk Touch ore-block result, Fortune's ordinary drop, non-ore rejection without a roll, and rejection when the held pickaxe cannot mine diamond ore. A separate live SimulatedPlayer break confirmed the stable `playerBreakBlock` event is delivered. That live event test did not assert its random proc or the output of an ordinary survival-mining session. Vanilla ore families are covered by explicit IDs even if the engine's built-in tag exposure differs; external/add-on ore tag parity, arbitrary loot-table side effects, live client output, multiplayer and derived mining are still open. No external Java-mod ores or assets were copied.

### Classification

Class **B** for the vanilla ore effect: the stable after-event and loot manager provide an equivalent server-side route through Bedrock's API shape. The feature is `PARTIAL_BDS_VERIFIED`, not complete, because real-client proc visibility, ordinary survival proc distribution, multiplayer and future derived-break interaction remain unverified. It is enabled as the first uncommon core candidate because its deterministic effect path and live break-event delivery passed on the pinned BDS build.

References: [PlayerBreakBlockAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable), [LootTableManager](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/loottablemanager?view=minecraft-bedrock-stable), [World](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/world?view=minecraft-bedrock-stable), [BlockPermutation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation?view=minecraft-bedrock-stable).

## `든든한 한 끼` (Hearty Meal)

### Java contract

The Java `ConsumptionAugmentService.afterFoodConsumed` reads the food's vanilla saturation gain as `nutrition × saturation × 2`, applies the level multiplier 0.08 / 0.16 / 0.24, adds that amount after food consumption, and caps saturation at the player's current food level. The tuning is in `ConsumptionAugmentTuning`; the roster values remain sourced from `AUGMENTS.md`.

### Stable Bedrock surface and runtime findings

- The pinned stable declarations are `@minecraft/server` 2.11.0.
- `world.afterEvents.itemCompleteUse` has a stable type, but its official event description focuses on chargeable-item completion. `ItemFoodComponent` exposes nutrition and saturation for data-driven items, but the vanilla cooked-beef `ItemStack.getComponent("minecraft:food")` returned `undefined` on BDS 1.26.62.1.
- An isolated BDS probe confirmed that cooked-beef consumption does emit `itemCompleteUse`. The event observes vanilla hunger/saturation after the food update and before the inventory count drops. This is tested runtime behavior for BDS 1.26.62.1; the stable documentation does not guarantee that behavior for every engine build or food.
- The production handler uses the food component formula if the engine exposes it. Otherwise, it samples player saturation once per server tick and derives the vanilla food gain from the adjacent pre-consumption and post-consumption states. It then applies the Java percentage and caps at current hunger. The handler and per-player saved level run server-side.
- If vanilla itself reaches the food-level cap, the event observes saturation already at the cap, so the handler adds no further saturation. If another add-on changes saturation during the same tick as food consumption, the inferred delta can include that change; this has not been tested.

### BDS result

The production behavior pack, not a test-only effect implementation, was exercised on official BDS 1.26.62.1. A test-only wrapper seeds each simulated player's production-pack dynamic property. Four players consumed cooked beef:

| Starting state | Level | Expected Java result | BDS result |
| --- | ---: | ---: | ---: |
| Hunger 10, saturation 0 | 1 | 13.824 | 13.824 |
| Hunger 10, saturation 0 | 2 | 14.848 | 14.848 |
| Hunger 10, saturation 0 | 3 | 15.872 | 15.872 |
| Hunger 12, saturation 10 | 3 | 20 (capped) | 20 |

Each case consumed one cooked beef from a two-item stack. The BDS GameTest passed. The values use cooked beef's vanilla gain 8 × 0.8 × 2 = 12.8. This establishes a partial gameplay route for this BDS build and food, not full food-family parity.

### Classification

Class **B**: the same Java effect is reproduced through stable item-completion plus state sampling, with an undocumented runtime extension to vanilla foods and a fallback inference. `hearty_meal` is `PARTIAL_BDS_VERIFIED` and enabled as a common-core candidate, limited to the evidence above. Verify item event delivery and saturation sampling for other food items and supported engine versions before claiming full parity.

References: [ItemCompleteUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcompleteuseafterevent?view=minecraft-bedrock-stable), [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [ItemFoodComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemfoodcomponent?view=minecraft-bedrock-stable), [PlayerInventoryItemChangeAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinventoryitemchangeafterevent?view=minecraft-bedrock-stable).

## `빨리 먹기` (Fast Eating)

### Java contract and interaction

The canonical roster sets the maximum at level 5 and reduces food-use duration by 5% per level. `ConsumptionAugmentService.modifyUseDuration` applies `ceil(original × max(0.05, 1 − 0.05 × level))`, with a minimum of one tick, only to items with the food component. `ItemStackConsumptionAugmentMixin` applies this rule to the active stack before `AdvancedActiveAugmentService.modifyUseDuration` applies Time Acceleration's 1.40 item-use speed multiplier. The two effects therefore compose sequentially, with Java's ceiling at each stage. `먹으면서 걷기` changes movement slowdown while using consumables; it does not change the consumption duration.

### Stable Bedrock surface and alternatives

The pinned stable module is `@minecraft/server` 2.11.0. `ItemStartUseAfterEvent` and `ItemCompleteUseAfterEvent` expose `useDuration` as read-only event data; they do not provide a way to change the active use duration. The stable `Player` API has no active-stack use-duration setter. The current stable `InputButton` enum exposes Jump and Sneak only, so scripts also cannot reconstruct the held Use action across keyboard, controller, and touch.

The data-driven `minecraft:use_modifiers.use_duration` component assigns a fixed duration in item JSON. It has no player-level condition. Overriding vanilla food timing that way would affect players without the augment and could not reflect saved levels; wrapping foods in custom item IDs would change item identity and would not cover arbitrary external foods. `Player.eatItem` is marked pre-release and directly eating a copied stack would not shorten or cancel the player's current held use. These routes are not shipped.

Existing BDS 1.26.62.1 evidence that cooked beef emits `itemCompleteUse` is from the Hearty Meal test. It establishes an observed completion hook on that build, not control over time-to-consumption. Fast Eating has no BDS gameplay test and remains disabled in the offer pool.

### Classification

Class **D** for the exact player-specific food-duration effect on the pinned stable API. Java changes the active food stack's queried duration per player's saved augment state; Bedrock can observe item-use events but cannot adjust that duration after the use begins. Static item JSON or custom replacement foods do not preserve per-player state and vanilla/modded food behavior. `fast_eating` remains `NOT_PORTED` and is not offered. This classification is from stable API declarations and official item/API contracts, not a Java compilation failure.

References: [ItemStartUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstartuseafterevent?view=minecraft-bedrock-stable), [ItemCompleteUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcompleteuseafterevent?view=minecraft-bedrock-stable), [minecraft:use_modifiers](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_use_modifiers?view=minecraft-bedrock-stable), [Player.eatItem](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable), [InputButton](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputbutton?view=minecraft-bedrock-stable).

## `연료 절약` (Fuel Saver)

### Java contract and machine interaction

The canonical maximum is level 3. `UtilityAugmentTuning` supplies +10% / +20% / +30%; `UtilityAugmentService.modifyFuelBurnDuration` applies `Math.round(originalDuration × (1 + bonus))` to positive burn durations. `AbstractFurnaceUtilityMixin` changes the return of the shared `AbstractFurnaceBlockEntity.getBurnDuration` method on the server, so the hook covers furnaces, smokers, and blast furnaces. At each fuel-consumption/burn-start call, Java checks alive non-spectator players within Euclidean radius 8 of the machine block center and snapshots the highest bounded saved level for that one fuel. The result does not depend on who inserted the fuel; the multiplayer contract says this rule is not yet Java-multiplayer-tested.

### Stable Bedrock surface and alternatives

The production project pins stable `@minecraft/server` 2.11.0. Its `Block` and `BlockInventoryComponent` API can expose a block's inventory, and the stable `ItemStack` API can return registered script components. There is no stable vanilla furnace burn-duration component, fuel-consumption event, current burn-time getter/setter, or `minecraft:fuel` Script API component. The official `minecraft:fuel` contract sets a static duration in an item definition, so it cannot read nearby players' saved levels or vary per consumed item.

An isolated official BDS 1.26.62.1 diagnostic GameTest set up raw iron and one coal, waited 220 ticks, and observed `minecraft:lit_furnace`, an inventory component with three slots, an emptied input/fuel slot, and one iron ingot in output. The lit furnace exposed only `instrument_sound`, `inventory`, `movable`, and `precipitation_interactions` among its script components. The coal stack exposed only `block_actor_dynamic_properties`; `getComponent("minecraft:fuel")` returned no component. This was an API-surface probe, not Fuel Saver gameplay.

Polling the inventory and crediting extra fuel could approximate aggregate fuel consumption for selected vanilla items. It cannot preserve Java's per-item rounded burn duration, exact burn-start level snapshot, mixed or external fuel durations, and inventory changes caused by hoppers or players without maintaining a second fuel accounting system. Static item JSON or replacing vanilla fuels with custom items would also change the item contract and would not cover arbitrary external fuels. Those alternatives are not shipped because they change behavior and ownership in ways the Java implementation does not.

### Classification

Class **D** for the exact burn-duration effect on the pinned stable API. The furnace inventory is observable and mutable, but the value Java modifies is not exposed. `fuel_saver` remains `NOT_PORTED` and disabled as a candidate. This is based on stable declarations, official item/component contracts, the BDS runtime probe, and the alternatives above; it is not inferred from Java compilation failure.

References: [Block](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable), [BlockInventoryComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockinventorycomponent?view=minecraft-bedrock-stable), [ItemStack](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable), [minecraft:fuel](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_fuel?view=minecraft-bedrock-stable), [@minecraft/server module](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable).

## `속공` (Rapid Strikes)

### Java contract and attack-speed interactions

The canonical maximum is level 5 and the roster effect is +4% / +8% / +12% / +16% / +20% general attack speed. Java registers `rapid_strikes` in `stat_modifier_contract.json` as `attack_speed`, `0.04` per level, `ADD_MULTIPLIED_BASE`. `PlayerStatAugmentService` sums every modifier in the same attribute/operation group and applies a transient player attribute modifier on join and respawn. The interaction contract puts `속공`, `연속 처치`, `광폭화`, and `시간 가속` on the same additive attack-speed axis; their bonuses add before applying once. Better Combat is an optional external Java integration using the same axis, not a Bedrock asset or dependency to copy.

### Stable Bedrock surface and alternatives

The project pins stable `@minecraft/server` 2.11.0. Its `EntityComponentTypes` declarations provide particular components such as movement and underwater movement, but no player attack-speed component and no general player attribute modifier API. `EntityHurtBeforeEvent` can modify/cancel a hit after an attack has already connected; the stable `InputButton` enum does not expose a held Attack input to replace the combat timing path.

The official entity `minecraft:attack_cooldown` JSON component is for preventing an entity from acquiring attack targets. The item `minecraft:cooldown` JSON component can define an attack cooldown on an item, but that setting is static item data and would affect every user of that item. Neither route adjusts a saved per-player attack-speed attribute or composes the four Java effects on a shared axis. Changing damage per hit would increase damage rather than attack rate and is not shipped.

An isolated BDS 1.26.62.1 diagnostic GameTest enumerated a simulated player's script components and checked `minecraft:attack_speed`, `minecraft:attack`, `minecraft:attack_cooldown`, `minecraft:attack_damage`, and `minecraft:attack_knockback`. It found no attack component among the player's exposed components or in the stable `EntityComponentTypes` enum. This probe establishes the component surface on that BDS build; it is not a Rapid Strikes gameplay test.

### Classification

Class **D** for the exact player attack-speed effect on the pinned stable API. `rapid_strikes` remains `NOT_PORTED` and disabled as a candidate. Static per-item cooldowns, hit-damage scaling, or reconstructing attacks through item use would replace the canonical effect and player controls. This classification is based on stable type declarations, official component contracts, and the BDS component probe, not on Java compilation failure.

References: [EntityComponentTypes](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycomponenttypes?view=minecraft-bedrock-stable), [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable), [InputButton](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputbutton?view=minecraft-bedrock-stable), [minecraft:attack_cooldown](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_attack_cooldown?view=minecraft-bedrock-stable), [minecraft:cooldown](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/itemreference/examples/itemcomponents/minecraft_cooldown?view=minecraft-bedrock-stable).

## `물갈퀴` (Webbed Feet)

### Java contract

The Java movement service applies a 10% additive movement-speed bonus per level only while `player.isInWater`; the maximum is level 3. It adds this bonus into the shared conditional movement modifier with Catch Breath, Nocturnal, Sun Affinity, and Momentum Shift. The canon roster expresses this as swim speed +10% / +20% / +30%.

### Stable Bedrock route

The stable `Player.isInWater` state and `minecraft:underwater_movement` attribute component provide a native water-only movement route. The production handler reads the saved augment level and sets the component to `defaultValue × (1 + 0.10 × level)` while the player is in water. It writes the default value out of water. This preserves vanilla keyboard, touch, and controller swimming input because the server changes the movement attribute rather than replacing player input.

The handler reconciles the value every server tick because an earlier transient component write did not persist under BDS movement simulation. The current test demonstrates the production handler maintaining the requested value throughout swimming and restoring the baseline outside water. The other Java movement augments that share this bonus axis are not ported yet, so their additive interaction is not implemented or tested. Interference from another add-on that writes the same attribute is also untested; the last writer's value can conflict.

### BDS result

Official BDS 1.26.62.1 passed `webbed_feet_scales_server_swim_speed_by_level`. In a test pool, control and level 1–3 simulated players moved forward for 20 ticks. Their final forward-velocity ratios were 1.10 / 1.20 / 1.30 within a 0.015 tolerance; underwater movement component values were 0.022 / 0.024 / 0.026 from the 0.020 default. After teleporting above the pool and waiting three ticks, all three components returned to 0.020. This checks the production handler, but not a real client, multiplayer attribute coexistence, or world reconnect.

### Classification

Class **A** for the standalone vanilla movement effect: the stable native water-movement attribute reproduced all three Java multipliers and the water-state boundary in BDS. Port status remains `PARTIAL_BDS_VERIFIED` because real-client presentation, Java's shared movement-bonus stacking with other movement augments, and interactions with other attribute writers have not been checked. `webbed_feet` is enabled as a common-core candidate based on the tested standalone route.

References: [Entity](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable), [EntityUnderwaterMovementComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityunderwatermovementcomponent?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable).

## `낚시 감각` (Fishing Sense)

### Java contract and interaction

Java reduces the vanilla fishing hook's waiting timer by 10% / 20% / 30% at levels 1–3. `FishingHookAugmentMixin` captures the timer progress each tick and adds fractional progress `vanillaProgress × reduction / (1 - reduction)`, which produces the requested percentage reduction without replacing the hook or fishing loot. The same mixin separately handles `보물 낚시` when the hook is retrieved and then applies `풍요` to eligible final fishing drops. Fishing Sense changes the wait phase only; it must not change treasure odds, item tables, or final-stack duplication.

### Stable Bedrock surface and runtime probe

The pinned production module is stable `@minecraft/server` 2.11.0. Its `WorldAfterEvents` surface includes general entity spawn/removal, entity-hit, and item-use signals, but no fishing-bite signal. The generic entity/projectile API does not expose a vanilla fishing hook's `timeUntilLured` or a setter for that value. The official vanilla `minecraft:fishing_hook` snippet shows a generic projectile and loot table, not a Script API timer component.

A BDS 1.26.62.1 GameTest diagnostic cast a vanilla rod with a simulated player. It observed one owned `minecraft:fishing_hook` and the generic `entitySpawn`, `itemUse`, `itemStartUse`, and `itemStopUse` events on cast. Queries for `minecraft:projectile`, `minecraft:fishing_hook`, and `minecraft:timer` found only `minecraft:projectile`. The diagnostic did not wait for a natural bite; it is evidence about the cast-time surface, not a gameplay test.

The obvious enchantment workaround would change the player's fishing-rod state and use a separate vanilla timing mechanic rather than the Java percentage formula. Replacing vanilla fishing with a custom rod would also require recreating cast/reel behavior, vanilla loot selection, open-water rules, treasure rolls, and eligible final-drop handling. That would materially replace vanilla fishing rather than port Fishing Sense. Neither alternative is shipped.

### Classification

Class **D** for the exact vanilla wait-time effect on the currently pinned stable API: there is no exposed timer value to read or change and no fishing-bite event on which to apply an equivalent progress adjustment. `fishing_sense` remains `NOT_PORTED` and disabled as a core candidate. This is based on the stable declarations, official event surface, the vanilla entity snippet, the BDS cast probe, and the source behavior above; it is not inferred from Java compilation failure.

References: [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [EntitySpawnAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityspawnafterevent?view=minecraft-bedrock-stable), [ItemUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemuseafterevent?view=minecraft-bedrock-stable), [ItemStartUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstartuseafterevent?view=minecraft-bedrock-stable), [vanilla fishing-hook entity snippet](https://learn.microsoft.com/en-us/minecraft/creator/reference/source/vanillabehaviorpack_snippets/entities/fishing_hook?view=minecraft-bedrock-stable).

## `보물 낚시` (Treasure Fishing)

### Java contract and interactions

The canonical effect adds +2 / +4 / +6 percentage points to the vanilla treasure-category probability at levels 1–3. `TreasureFishingService` preserves the open-water requirement and calculates vanilla category weights from `lootLuck = hook luck + player luck`: junk `max(floor(10 - 2L), 0)`, treasure `max(floor(5 + 2L), 0)`, and fish `max(floor(85 - L), 0)`. It computes `base = treasure / total`, `desired = min(1, base + bonus)`, then uses a pre-roll of `(desired - base) / (1 - base)` so a forced treasure replaces the ordinary root-table result and the total treasure probability is exactly `base + bonus`.

On retrieval, `FishingHookAugmentMixin` generates `minecraft:gameplay/fishing/treasure` with the same Java `LootParams`, then applies `풍요` to eligible final ordinary stacks. The Java core reward service adds a separate 12% core roll to this treasure table, weighted common 70%, uncommon 25%, rare 5%; cores are excluded from `풍요`. These three behaviors share the catch-result boundary and must retain this order and context.

### Stable Bedrock surface and alternative routes

The pinned stable module is `@minecraft/server` 2.11.0 on BDS 1.26.62.1. The stable `WorldAfterEvents` list has generic item-use, entity spawn/removal, and inventory-change events, but no fishing-retrieval event or final fishing-result/category event. The existing BDS fishing probe observes rod-use events and an owned `minecraft:fishing_hook` with a projectile component; it does not observe a caught item or category.

There is no direct one-call catch transaction in the stable events. `ItemUseAfterEvent` carries the used stack and player; `EntityRemoveAfterEvent` carries only the removed entity ID and type ID; `PlayerInventoryItemChangeAfterEvent` fires after a slot has changed and provides that slot's before/after stacks. Inference: a script could correlate tracked hook IDs with a later inventory delta or nearby item, and might recognize some simple vanilla catches. Those separate events provide no shared catch/result transaction ID, so this would be a heuristic under same-tick pickups, concurrent hooks/players, full inventories, and unrelated item changes; it cannot guarantee one-time replacement of the already-applied vanilla result. `LootTableManager.generateLootFromTable(table, tool)` cannot accept Java's full `LootParams`, including open-water state and the combined rod/player luck, and it does not expose or replace the hook's resolved result list.

The alternatives were checked against the contract. Replacing the default rod or vanilla fishing table would take over cast/reel behavior or replace a non-composable loot table; post-hoc item replacement would risk altered catches, duplicate rewards, and wrong core/`풍요` ordering. None is shipped. The 12% fishing-core reward is likewise not injected into the Bedrock treasure table; its other acquisition routes remain separate.

### Classification

Class **D** for the exact treasure-category probability effect on the currently pinned stable API. A custom correlator could infer some catches, but the stable surface does not provide a reliable, attributable result transaction that preserves the original luck/open-water context and permits server-authoritative replacement. `treasure_fishing` remains `NOT_PORTED` and disabled as an uncommon-core candidate. This classification follows the Java algorithm, stable event and loot-table signatures, and the BDS cast probe; it is not based on Java compilation failure. No external Java-mod content is copied.

References: [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [ItemUseAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemuseafterevent?view=minecraft-bedrock-stable), [EntityRemoveAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityremoveafterevent?view=minecraft-bedrock-stable), [PlayerInventoryItemChangeAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinventoryitemchangeafterevent?view=minecraft-bedrock-stable), [LootTableManager](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/loottablemanager?view=minecraft-bedrock-stable).

## `긴 팔` (Long Reach)

### Java contract, implementation and interactions

The canonical effect is block placement and interaction range +0.5 / +1.0 / +1.5 blocks at levels 1–3; entity-combat reach is explicitly excluded. Java declares `long_reach` in `stat_modifier_contract.json` as `block_interaction_range`, `amount_per_level: 0.5`, and `add_value`. `StatAugmentCatalog` maps that identifier to Minecraft's `Attributes.BLOCK_INTERACTION_RANGE`. `PlayerStatAugmentService` clamps saved levels to the catalog maximum, sums values by attribute/operation, applies a transient modifier, and reconciles it on join and respawn. The uncommon presentation marks it passive and repeats the level curve. The 2026-10-24 interaction contract contains no Long Reach-specific cross-augment rule; no other entry in the stat contract shares `block_interaction_range`.

### Stable Bedrock surface and alternatives

This project pins stable `@minecraft/server` 2.11.0 / `@minecraft/server-ui` 2.3.0 and BDS 1.26.62.1. The stable attribute component base exposes current/default values and a setter only for specific components returned by an entity; it does not expose a generic player-attribute lookup or modifier API. The pinned `EntityComponentTypes` declaration has no player block-interaction-range component. The diagnostic BDS test enumerates a SimulatedPlayer's components, checks range-like component IDs/properties and generic attribute methods, and records the input enum. It found no range API and only `Jump` / `Sneak` input buttons.

`Entity.getBlockFromViewDirection` and dimension raycasts answer script queries. A longer query ray does not change the engine's native range validation for arbitrary block placement or block use. The official raycast reference describes a query distance and flags `maxDistance` as pre-release; it is not treated as a stable reach setter. The official Bedrock command list also has no `/attribute` command. Stable input exposes no generic Use/Place button that could initiate replacement interactions at longer reach. A custom menu, item, or block proxy would not make native chests, doors, crafting stations, and arbitrary held-item placement behave normally at the extended range; it would also replace placement-face/orientation and touch/controller action semantics. Those alternatives do not preserve the Java effect.

No external Java-mod entity, structure, or asset is involved. No approximation is shipped, and Long Reach remains disabled as a core candidate.

### Classification

Class **D** for the exact per-player native block placement/interaction range modifier on the pinned stable API. `long_reach` remains `NOT_PORTED`; the BDS result is an API-surface diagnostic, not a gameplay test. This conclusion is based on the Java attribute contract, the pinned stable declarations, official API/command references, and the BDS 1.26.62.1 probe, not on Java compilation failure. Mobile and controller inputs receive the same consideration: the available stable button enum has no generic interaction button, and a raycast/UI replacement would not preserve the platform's native use/place behavior.

References: [EntityComponentTypes](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycomponenttypes?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable), [Entity.getBlockFromViewDirection](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable), [BlockRaycastOptions](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockraycastoptions?view=minecraft-bedrock-stable), [InputButton](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputbutton?view=minecraft-bedrock-stable), [Bedrock command list](https://learn.microsoft.com/en-us/minecraft/creator/commands/commands?view=minecraft-bedrock-stable).

## `숨 오래 참기` (Long Breath)

### Java contract

The canonical roster reduces underwater oxygen consumption by 10% / 20% / 30% at levels 1–3. Java stores the equivalent oxygen attribute bonuses `0.1111111111`, `0.25`, and `0.4285714286` in `survival_modifier_contract.json`; `SurvivalAugmentService` applies that value as an additive `OXYGEN_BONUS` attribute modifier. These values lengthen the breath duration by the requested ratio.

### Stable Bedrock surface and BDS probe

The stable `@minecraft/server` 2.11.0 declarations expose `minecraft:breathable` with read-only `totalSupply`, but do not declare a mutable current-air property or an oxygen-bonus attribute. Microsoft's `EntityBreathableComponent` page includes `airSupply` but explicitly marks that property pre-release. On BDS 1.26.62.1, an underwater simulated-player probe found the breathable component but `"airSupply" in component` was false. This probe is diagnostic only and did not change breath behavior.

`water_breathing` would prevent oxygen depletion instead of reducing it by the Java percentage, and a read-only total breath duration cannot implement a per-player saved level. A polling substitute requires writing current air state, which is not available on this pinned stable API/runtime. No experimental API is used in the shipped add-on.

### Classification

Class **D** for the exact oxygen-consumption effect on the currently pinned stable API. `long_breath` remains `NOT_PORTED` and disabled as a candidate. This finding is based on the Java modifier contract, the stable declarations, the official page's pre-release warning, and the BDS 1.26.62.1 submerged-player probe; it is not inferred from Java compilation failure.

References: [EntityBreathableComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitybreathablecomponent?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable).

## `추위 적응` (Cold Adaptation)

### Java contract and vanilla interaction

The canonical roster reduces freeze buildup by 15% / 30% / 45% at levels 1–3. Java's tick service observes the player's vanilla `ticksFrozen` counter, accumulates fractional reduction credit for each positive increase, removes whole ticks with `setTicksFrozen`, and clears that credit when vanilla thawing lowers the counter. This preserves vanilla buildup sources, the freeze HUD, and the normal damage threshold while delaying accumulation.

### Stable Bedrock surface and BDS probe

The pinned stable `@minecraft/server` 2.11.0 declarations expose `EntityDamageCause.freezing` and a mutable pre-hurt damage amount, but no player frozen-tick getter/setter, freeze component, or freeze-buildup event. On BDS 1.26.62.1, a simulated-player probe in a powder-snow volume listed the player's available Script API component IDs and checked `minecraft:freezing`, `minecraft:freezing_immune`, and `minecraft:freezing_vulnerable`; none were exposed as player components. The player object also had no `isFreezing`, `isFrozen`, `ticksFrozen`, `getTicksFrozen`, or `setTicksFrozen` member. The test is diagnostic only.

Bedrock 1.26.50 entity JSON defines Powder Snow immunity/vulnerability through boolean entity-definition components, not a per-player buildup-rate API. Scaling `EntityHurtBeforeEvent.damage` for freezing would reduce health loss after buildup reaches the damage phase; it would leave buildup, freeze HUD, damage onset, and thaw timing unchanged. That would change the Java effect, so it is not shipped.

### Classification

Class **D** for the exact vanilla freeze-buildup effect on the pinned stable API. `cold_adaptation` remains `NOT_PORTED` and disabled as a core candidate. This classification is based on the Java tick implementation, stable declarations, official entity JSON component contract, and the BDS player-component probe, not on Java compilation failure.

References: [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable), [EntityDamageCause](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydamagecause?view=minecraft-bedrock-stable), [Bedrock 1.26.50 Powder Snow freezing components](https://learn.microsoft.com/en-us/minecraft/creator/documents/update1.26.50?view=minecraft-bedrock-stable#powder-snow-freezing).

## `전리품 챙기기` (Loot Scoop)

### Java contract and interaction order

`LootScoopService.wrapDeathLoot` applies one random roll to a directly player-killed living mob: 5% / 10% / 15% at levels 1–3. On success, it copies every non-core `ItemStack` from the final entity-loot-table consumer. It excludes player deaths, dominated companions, and entities matched by Java's boss compatibility profiles. The mixin wraps Abundance downstream of Loot Scoop. Consequently, when both augments are present and the Loot Scoop roll succeeds, eligible stackable ordinary loot can be passed through Abundance twice (four total copies); otherwise Abundance duplicates the original once. The two systems also exclude all six augment-core items.

### Stable Bedrock route and BDS evidence

Stable `world.afterEvents.entityDie` provides the dead entity and its `EntityDamageSource`; the stable `LootTableManager.generateLootFromEntity` can generate a table result for that entity. In the BDS 1.26.62.1 cow probe, `entityDie` retained a valid dead entity, identified the player killer, and allowed loot generation inside the callback. The probe did not observe `entityItemDrop` for that death, and neither event exposes Java's final drop-stack consumer.

The production handler reads the bounded saved level, resolves a direct player attacker or a player owner on the damaging projectile, and makes one 5% per-level roll. On success it generates the victim's table with the killer's current main-hand item and spawns every non-core stack at the death location. Vanilla Wither and Ender Dragon are excluded; cooperating packs can mark other bosses and dominated companions with `augmentation_survival:boss` and `augmentation_survival:dominated_companion` entity tags. The effect runs entirely server-side and cannot duplicate augment cores.

This is a partial mapping: it generates a new table result rather than cloning the original result. Random amounts, table conditions, killer/tool context, or custom entity loot can therefore differ from Java's exact copied bundle. Looting variants and projectile-attributed kills have not yet been validated on BDS. The future Abundance port must wrap this final ordinary-drop route after Loot Scoop, apply Java's stack-eligibility policy, and preserve the four-copy interaction on a successful Loot Scoop roll.

The BDS GameTest verifies exact exclusive 5% / 10% / 15% roll boundaries, level capping, all six core exclusions, and a guaranteed level-3 cow bonus bundle processed from a real player-attributed `entityDie` event. It does not prove equality with the original loot output, probability distribution over many natural kills, boss-tag behavior, or multiplayer behavior.

### Classification

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled for uncommon core offers. It reproduces the chance, player-kill scope, server-side reward, and core exclusion using a stable route, while the independently generated bundle remains an explicit parity limitation. It is not counted as a complete Java port.

References: [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [EntityDieAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydieafterevent?view=minecraft-bedrock-stable), [LootTableManager](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/loottablemanager?view=minecraft-bedrock-stable).

## `마지막 힘` (Last Strength)

### Java contract and damage interactions

The canonical contract sets the maximum at level 3 and adds 10% outgoing damage per level at or below 30% health. `CombatAugmentService.modifyOutgoingDamage` checks the server player's health ratio for root melee and root projectile damage; it adds Last Strength to the same outgoing bonus as Keen Edge for `ROOT_MELEE` and Precise Aim for `ROOT_PROJECTILE`, then passes the result to the combat expansion service. `FocusedAimAugmentService` applies the same threshold bonus to Focused Aim projectile damage. `CloneCombatSnapshot.meleeDamage` includes Last Strength when it creates the clone's melee snapshot, based on the owner's health at that time. These code paths mean that a full port must preserve the Keen Edge/Precise Aim additive stack and later add the Focused Aim and Clone routes.

### Stable Bedrock route and BDS evidence

Stable `EntityHealthComponent` inherits read-only `currentValue` and `effectiveMax`; `EntityHurtBeforeEvent.damage` is writable. The production handler identifies a player root melee source from `EntityDamageCause.entityAttack` and `damageSource.damagingEntity`, or a player-owned projectile from the projectile component's owner. It then checks `currentValue / effectiveMax <= 0.30` and adds `0.10 × saved level`, capped at level 3, to the current outgoing bonus. The health value uses the effective maximum so other max-health modifiers affect the threshold consistently within Bedrock. No health or damage decision is made by the client.

On official BDS 1.26.62.1, production-handler GameTests verified levels 1–3 for synthetic root melee and projectile-attributed damage, exact inclusion at 30%, activation at 29%, and no Last Strength bonus at 31%. They also verified additive damage with level-5 Keen Edge and level-5 Precise Aim. The projectile test uses an owned arrow in a synthetic `applyDamage` event; physical arrow flight and collision were not tested.

Bedrock's stable projectile owner attribution cannot establish Java's full `ROOT_PROJECTILE` provenance for every add-on-derived player projectile. Last Strength may therefore apply to a player-owned derived projectile whose source Java would classify outside `ROOT_PROJECTILE`. Focused Aim and Clone are not yet implemented in Bedrock, so those interactions are absent. Reconnect persistence, multiplayer races, delayed-damage behavior, armor/effect mitigation order, and real-client melee/projectile events remain unverified.

### Classification

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as the sixth uncommon candidate. The stable event and health component reproduce the standalone damage curve, while projectile provenance and the Java Focused Aim/Clone paths are outstanding. It is not counted as a complete Java port.

References: [EntityHealthComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhealthcomponent?view=minecraft-bedrock-stable), [EntityAttributeComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable), [EntityHurtBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable), [EntityDamageSource](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitydamagesource?view=minecraft-bedrock-stable).

## `도구 관리` (Tool Care)

### Java contract and mining interaction

`AUGMENTS.md` sets Tool Care to 5% / 10% / 15% / 20% / 25% durability-loss cancellation at levels 1–5. `SurvivalAugmentService.modifyDurabilityDamage` is called at the head of `ItemStack.hurtAndBreak`, before vanilla Unbreaking. For positive durability damage, Java applies Armor Care to equipped armor; otherwise it applies Tool Care only when the item has `DataComponents.TOOL`. A successful roll cancels the whole durability event. The Java interaction contract also says automatically mined or harvested blocks inherit compatible durability rules, so derived breaks must join the same route when those mechanics are ported.

### Stable Bedrock route and BDS evidence

Stable `world.beforeEvents.playerBreakBlock` provides the player, captured item stack, and block, but the callback runs with restricted execution and cannot change durability there. The production handler records the selected hotbar slot and break identity before vanilla proceeds. Stable `world.afterEvents.playerBreakBlock` supplies `itemStackBeforeBreak` and `itemStackAfterBreak`; the stable `ItemDurabilityComponent.damage` setter can then restore the observed pre-break value after a 5% per-level server roll. The handler only edits the captured slot if its current stack still matches the observed post-break item and durability. If the break exhausted the tool, it restores the captured pre-break stack only when that slot is still empty. The native block break, loot, and enchantment path remains intact.

BDS 1.26.62.1 GameTests verify exact exclusive 5% / 10% / 15% / 20% / 25% chance boundaries, the five-level cap, successful snapshot restoration, a failed roll, occupied-slot safety, and restoration when the final durability point would have broken the tool. A production-handler SimulatedPlayer then mined vanilla stone 40 times with an unenchanted iron pickaxe at saved level 5. Eight durability events were restored and 32 were spent in the final recorded run. The live test requires at least one restored event; it does not claim to measure or validate the full 25% probability distribution.

### Classification and remaining differences

Class **C**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon candidate. The after-break route reproduces the standalone roll and observed block-break durability change on vanilla stone. The stable Script API exposes no global pre-durability hook for vanilla held tools, so melee hits and other item-use damage remain uncovered. Stable item Script API components also do not expose Java's `DataComponents.TOOL` marker for exact eligibility checks. Player-triggered secondary add-on breaks, Java's automatic-mining/harvest inheritance, Armor Care, multiplayer slot races, reconnect behavior, client gameplay, and interaction with every other durability modifier remain unverified. The candidate should stay marked partial until those shared routes are addressed.

References: [PlayerBreakBlockBeforeEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockbeforeevent?view=minecraft-bedrock-stable), [PlayerBreakBlockAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable), [ItemDurabilityComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemdurabilitycomponent?view=minecraft-bedrock-stable), [ItemComponentTypes](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcomponenttypes?view=minecraft-bedrock-stable).

## `손재주` (Dexterity)

### Java contract and drop interactions

Java uses `dexterity_gathering.json`: the `leaves` and `flowers` block tags, plus bamboo, sugar cane, cactus, mushrooms, vine, glow lichen, kelp, seagrass, berry bush, and cocoa. `DexterityService` rolls once at the start of a direct player block break, then copies one item from the first eligible stack that actually reaches `Block.popResource`. Levels 1–3 add 10% / 20% / 30%. The ordinary-drop filter rejects single-item and damageable stacks, the `abundance_excluded` item tag, custom data/name/lore, and all six cores. The Java interaction contract places this addition before the final `풍요 ×2` pass and expects compatible derived harvesting to inherit the drop rule.

### Stable Bedrock route and BDS evidence

The production handler subscribes to stable `world.afterEvents.playerBreakBlock`, reads the captured pre-break permutation and tool, checks Bedrock's `leaves` / `flowers` / `flower` tags plus explicit vanilla block IDs, and rolls the exact Java chance. It calls stable `LootTableManager.generateLootFromBlockPermutation` with that permutation and tool, chooses the first stack matching Java's ordinary-item filters, and spawns one copy at the broken block. `ItemStack.maxAmount`, `isStackable`, `nameTag`, `getLore`, item components, and `hasTag` supply the eligibility checks. `isStackable` is a proxy for Java custom-data rejection; it can also reject Bedrock custom properties that Java's filter would not reject.

BDS 1.26.62.1 deterministic GameTests verify the three exact chance boundaries, level cap, representative leaf/flower/explicit whitelist entries, ordinary-item duplication, and rejection of unlisted blocks, damageable items, names, lore, cores, and unowned levels. A production-handler simulated player breaks 50 dandelions at level 3 and receives at least one additional item beyond the 50 native yields. This confirms one live bonus path; it does not measure the chance distribution.

### Classification and remaining differences

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon candidate. The stable event arrives after native drops have been calculated and does not expose the actual `Block.popResource` stacks. Re-running the loot table can produce a different random result or omit context-dependent native output. The current event path handles direct player breaks; Java-derived mining and harvesting are not routed. The extra item is also spawned after the event, so its Java ordering before `풍요 ×2` is not reproduced. External Java mod blocks and assets are not copied; add-on blocks may use exposed Bedrock tags when they match the shared names.

References: [WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable), [PlayerBreakBlockAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable), [BlockPermutation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation?view=minecraft-bedrock-stable), [LootTableManager](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/loottablemanager?view=minecraft-bedrock-stable), [ItemStack](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable).
