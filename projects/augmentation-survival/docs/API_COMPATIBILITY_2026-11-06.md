# API compatibility investigation — 2026-11-06

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
