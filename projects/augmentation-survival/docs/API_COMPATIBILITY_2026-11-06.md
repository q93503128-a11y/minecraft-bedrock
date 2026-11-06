# API compatibility investigation — 2026-11-06

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
