# API compatibility investigation — 2026-11-07

Java source revision: `5269a32109255b2d583081e775619087bed0507c`
Bedrock target observed: Minecraft Bedrock/BDS 1.26.62.1; stable Script API `@minecraft/server` 2.11.0.

## `주머니` (Pockets)

### Java rule and source

Java's rare Pockets augment has maximum level 3. It unlocks 3 / 6 / 9 additional player inventory slots and hooks `Inventory.add` after vanilla insertion; any remainder accepted by Java's insertion flow goes into the player's persistent pocket container. `StorageAugmentService` keeps a separate 9-slot container per player, `InventoryPocketAugmentMixin` handles overflow, and `AugmentStorageMenu` / `StorageInputClient` / `StorageNetworking` open retrieval UI. Pocket items drop on death unless `keepInventory` or `Keep Inventory` applies. The Java interaction contract has no Pockets-specific row; interactions with other item-transfer effects therefore remain explicitly reviewable.

### Stable Bedrock route and BDS evidence

Stable Script API exposes a fixed player `minecraft:inventory` container and no API to extend its 36 slots or hook every `Inventory.add` call. Stable `entityItemPickup` before-events are restricted. On BDS 1.26.62.1, changing a cloned `ItemStack.amount` in that callback throws `Native property setter ... cannot be used in restricted execution`; the add-on therefore computes capacity read-only, cancels eligible partial world pickups, and commits inventory/container changes on the next server callback. BDS does not emit the event when the player inventory cannot accept the stack at all, so a second server sweep checks item entities only within 1.25 blocks of the player's hitbox center, and only when the vanilla inventory has no capacity for that stack.

The replacement container is a private 9-slot inventory on a persistent, invisible custom entity owner-bound by server dynamic properties. Level 1 / 2 / 3 capacity is applied as 3 / 6 / 9 slots. The basic augmentation device opens a short ActionForm with unlocked slots; choosing a stack moves only the amount that fits and keeps the remainder stored. Pickup Hand + Pockets is covered in BDS: Pickup Hand moves a beyond-native-reach overflow stack to its owner's hitbox, and Pockets stores that stack without duplication. This only covers world-item pickup; crafting, command/give, item-use outputs, and other Java `Inventory.add` call sites do not use this Bedrock route.

The isolated production test on BDS 1.26.62.1 passed 1/1 (5.8 s). It verifies vanilla-first partial insertion, level-1's three unlocked slots, full-inventory overflow, partial 2-item retrieval with a 4-item remainder and count conservation, a fourth stack remaining in-world, separate storage anchors for two nearby owners, one shared 8-item drop stored once, and the Pickup Hand interaction. This is simulated-player evidence, not online multiplayer. Reconnect, actual BDS world restart, death-drop handling, device/form navigation, mobile/controller legibility, metadata-heavy stacks, and Replant/seed fallback interaction remain untested.

**Classification: C / `PARTIAL_BDS_VERIFIED`, rare candidate enabled.** Bedrock keeps the canonical slot counts and server-owned items, but side storage accessed by a form is not equivalent to extra player slots and it only captures world pickups. Future interaction work should test Pockets with Replant, harvest bonuses, and any feature that consumes nearby drops.

Official stable references: [WorldBeforeEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldbeforeevents?view=minecraft-bedrock-stable), [EntityInventoryComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityinventorycomponent?view=minecraft-bedrock-stable), [ItemStack](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable), [ActionFormData](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/actionformdata?view=minecraft-bedrock-stable), and [minecraft:inventory](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_inventory?view=minecraft-bedrock-stable).

## `발 안 묶이기` (Terrain Resistance)

### Java contract and implementation

The canonical uncommon augment has maximum level 3 and reduces terrain slowdown by 15% / 30% / 45%. `stat_modifier_contract.json` maps it to `movement_efficiency`, adding 0.15 per saved level. Java's `TerrainResistanceService` clamps that attribute to `[0, 1]` and moves each cobweb stuck-multiplier component toward 1 with `adjusted = vanilla + (1 - vanilla) × efficiency`. `WebBlockTerrainResistanceMixin` applies the same transform to horizontal movement and vertical descent.

Java's GameTest verifies level 3 reads `0.45`. For the vanilla cobweb vector `(0.25, 0.05, 0.25)`, the result is `(0.5875, 0.4775, 0.5875)`. It also checks a second cobweb vector `(0.50, 0.25, 0.50)`, associated in that test with Weaving, and expects `(0.725, 0.5875, 0.725)`. The interaction contract has no direct Terrain Resistance rule; the test verifies that the transform composes with that alternate vector. The Java sources and GameTest are listed on this augment's roster row.

### Stable Bedrock surface and diagnostic

Stable `EntityMovementComponent` exposes the general `minecraft:movement` value and inherits `setCurrentValue`; it is not a movement-efficiency attribute or a surface-specific slowdown setter. The stable Player API exposes movement input information, but no API that changes Java's `movement_efficiency` attribute or directly changes a cobweb/soul-sand/honey slowdown vector. A conditional speed or velocity adjustment could be explored, but it would need to identify the affected surface and preserve normal movement and vertical cobweb motion.

The isolated BDS 1.26.62.1 diagnostic set `minecraft:movement` to 1.45× its default, then issued a 20-tick `SimulatedPlayer.moveRelative` command on each surface. Recorded displacement was unchanged at the two scales on stone (`x=0.8202, z=0.2000`), soul sand (`x=0.1000, y=-0.0466, z=0.2000`), and honey (`x=0.8342, z=0.2000`). In cobweb, the measured horizontal `z` displacement changed from `0.4901` to `0.7104`. The command-driven test does not represent real keyboard, touch, or controller input; it did not test the vertical cobweb multiplier or compare Bedrock movement against Java's exact vector formula. These numbers are diagnostic observations only.

### Classification

Class **C**, `NOT_PORTED`, and disabled as a core candidate. The stable API has a general movement-speed writer, so a conditional movement/velocity route can be investigated. The available surface does not directly reproduce Java's per-surface efficiency attribute and all-axis cobweb vector transform; the BDS simulation is not evidence that an approximation preserves player movement. No gameplay effect is shipped or counted complete. No external Java-mod assets or entities are required or copied.

### References

- [Stable `EntityMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityAttributeComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityattributecomponent?view=minecraft-bedrock-stable)
- [Stable `Player` API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)

## `쌍둥이` (Twins)

### Java contract and implementation

The canonical uncommon augment has maximum level 3 and rolls one extra baby at 10% / 20% / 30% on a successful animal breeding. `consumption_fishing_contract.json` holds the exact chance curve. `AnimalBreedingAugmentMixin` captures the breeder before vanilla finalizes the normal offspring, then runs the extra-offspring attempt after vanilla breeding has completed. `ConsumptionAugmentService.breedingActor` reads `getLoveCause()` from both parents, uses the parent with the higher saved Twins level, and resolves a tie in favor of the first parent. A missing actor or vanilla offspring produces no extra baby. A successful roll calls the parent's `getBreedOffspring`, marks that entity as a baby, positions it at the parent, and adds it to the server world. The Java interaction contract contains no direct Twins-specific rule; its cross-system dependencies are the parent's breeder attribution and native offspring creation.

### Stable Bedrock surface and BDS probe

Stable `world.afterEvents.entitySpawn` reports the spawn cause and the spawned entity. The stable `Born` cause can identify a vanilla breeding result, but the event has no parent or player field ([`EntitySpawnAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityspawnafterevent?view=minecraft-bedrock-stable), [`EntityInitializationCause`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityinitializationcause?view=minecraft-bedrock-stable)). `minecraft:is_baby` identifies a baby when that component is present ([`EntityIsBabyComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityisbabycomponent?view=minecraft-bedrock-stable)). `playerInteractWithEntity` exposes the interacting player, target, and before/after held items ([`PlayerInteractWithEntityAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinteractwithentityafterevent?view=minecraft-bedrock-stable)), but the stable declarations do not expose the parent's LoveCause, a breedable component, or the current love state.

The BDS 1.26.62.1 GameTest forced two cows to adult state, gave a survival SimulatedPlayer eight wheat, and accepted two direct interactions; exactly two wheat were consumed. After 80 ticks, the production engine observed a vanilla cow spawn with cause `Born` and `minecraft:is_baby`. A direct spawn with `{ spawnEvent: "minecraft:entity_born" }` also produced a baby. The `playerInteractWithEntity` callback remained empty during the successful simulated-player breeding, so this test cannot establish breeder attribution. It did not run a Twins chance, add-on bonus, player-level lookup, or persistence test. The successful BDS result is therefore an event-surface diagnostic, not an augment gameplay test.

### Classification

Class **C**, `NOT_PORTED`, and disabled as a core candidate. A production route could keep a server-side ledger of successful food interactions and match a uniquely attributable nearby parent pair to each `Born` child, then apply the exact saved-level chance and spawn an additional baby. The stable birth event does not expose the Java parent references or LoveCause players, and the feed event was not delivered by the pinned BDS SimulatedPlayer path. A proximity ledger can be ambiguous in crowded farms or when multiple players feed animals; independently creating a baby also cannot guarantee Java's parent-derived offspring variant for every species. No effect is shipped until breeder ownership, deduplication, multiplayer attribution, and vanilla offspring parity can be demonstrated without awarding twins for unrelated births.

The add-on uses only vanilla Bedrock entities; no external Java-mod animal, asset, or structure is copied. Twins is passive and needs no key binding or mobile/controller-specific input.

### References

- [Stable `EntitySpawnAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityspawnafterevent?view=minecraft-bedrock-stable)
- [Stable `EntityInitializationCause`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityinitializationcause?view=minecraft-bedrock-stable)
- [Stable `PlayerInteractWithEntityAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinteractwithentityafterevent?view=minecraft-bedrock-stable)
- [Stable `EntityIsBabyComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityisbabycomponent?view=minecraft-bedrock-stable)
- [Built-in `minecraft:entity_born` event](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entityevents/minecraftevents_entity_born?view=minecraft-bedrock-stable)

## `멀리뛰기` (Long Jump)

### Java contract and implementation

The canonical uncommon augment has maximum level 3 and multiplies horizontal X/Z velocity on a sprinting ground jump by ×1.08 / ×1.16 / ×1.24; vertical Y is unchanged. `movement_modifier_contract.json` sets `horizontal_bonus_per_level` to `0.08`. `MovementAugmentMixin` injects at the tail of `LivingEntity.jumpFromGround` for server players, where `MovementAugmentService.afterGroundJump` skips action-locked players, then scales X/Z only when the saved level is positive and the player is sprinting. `FinalAugmentRuntimeService.afterGroundJump` runs next and may add the separate vertical `탄성 저장` bonus. The Java GameTest checks unowned and non-sprinting controls, maximum-level X/Z scaling, and unchanged Y. The canonical interaction contract contains no direct Long Jump rule; the ground-jump velocity adjustment and Elastic Storage's later Y-only adjustment are orthogonal. The separate air-jump path does not pass through the vanilla ground-jump hook.

### Stable Bedrock surface and BDS probe

Stable `InputButton.Jump` and `world.afterEvents.playerButtonInput` expose a jump-button state change. Microsoft documents that Jump is mapped to keyboard, controller, and touch interfaces ([`InputButton`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputbutton?view=minecraft-bedrock-stable), [`WorldAfterEvents`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable)). Stable Player/Entity APIs also expose `isOnGround`, `isSprinting`, `isJumping`, `getVelocity()`, and `applyImpulse()` ([`Player`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable), [`Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)). The event is an input-state change, not a native post-`jumpFromGround` hook, and World after-event callbacks are deferred. The stable API does not expose the Java jump method boundary.

The BDS 1.26.62.1 `long_jump_input_event_surface_probe` called `SimulatedPlayer.jump()` from a sprinting grounded state. The jump was accepted and one tick later the player was airborne with vertical velocity `0.2000007629`; no Jump `playerButtonInput` event was emitted. The test's zero input-event count is scoped to the GameTest SimulatedPlayer route; Microsoft documents that SimulatedPlayer does not necessarily fire world events in the same capacity as a real player ([`SimulatedPlayer`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer?view=minecraft-bedrock-experimental)). The probe does not validate real keyboard/touch/controller delivery, sprint-jump horizontal velocity, an impulse correction, or parity with Java's ground-jump callback.

### Classification

Class **C**, `NOT_PORTED`, and disabled as a core candidate. A possible server route would observe the shared Jump input, use the saved level and sprint/ground state, then adjust X/Z velocity with `applyImpulse`. The pinned BDS SimulatedPlayer jump did not deliver the input event, and the stable callback is not tied to the vanilla ground-jump velocity update. A correction could miss the first airborne movement tick or respond to a jump input that is not a ground jump. No effect is shipped until actual client event delivery, exact timing, mobile/controller behavior, and stacking with the later Y-only Elastic Storage jump are demonstrated.

Long Jump is passive, needs no extra control binding, and uses no external Java-mod entities or assets.

### References

- [Stable `InputButton`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputbutton?view=minecraft-bedrock-stable)
- [Stable `WorldAfterEvents`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable)
- [Stable `Player`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)
- [Stable `Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)
- [Experimental GameTest `SimulatedPlayer`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-gametest/simulatedplayer?view=minecraft-bedrock-experimental)

## `물살 타기` (Ride Current)

### Java contract and implementation

The canonical uncommon augment has maximum level 3 and adds +15% / +30% / +45% movement speed while swimming in the same horizontal direction as flowing water. `mobility_utility_contract.json` stores the exact additive-base amounts. `MobilityUtilityAugmentService` runs on the server tick, reads the player's current `FluidState.getFlow(...)` and horizontal delta movement, and applies the transient movement modifier only while the player is swimming and the flow/motion dot product is positive. The modifier is removed when the player stops swimming, loses the level, disconnects, dies, or respawns. The interaction contract contains no direct Ride Current clause, but source review found that `AugmentMovementBonusService` includes this modifier in the positive movement bonus consumed by `CombatExpansionService`'s `속도 전환` damage calculation. Java also composes independently authored movement bonuses additively on that attribute axis.

### Stable Bedrock route and BDS verification

Stable Script API exposes whether a block is liquid or waterlogged, the block permutation's `liquid_depth` state, the player's swimming state and velocity, and a writable `minecraft:underwater_movement` attribute ([`Block`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable), [`BlockPermutation`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation?view=minecraft-bedrock-stable), [default block states](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockstateandtraitlistings?view=minecraft-bedrock-stable), [`Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable), [`EntityUnderwaterMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityunderwatermovementcomponent?view=minecraft-bedrock-stable)). It does not expose the native water-flow vector. The Bedrock runtime reconstructs a horizontal local vector from the differences between the player's water block and its four horizontal water neighbors, then requires `flow.x * velocity.x + flow.z * velocity.z > 0` before adding the saved-level bonus to the shared underwater movement calculation.

The BDS 1.26.62.1 production-handler GameTest built an eastward channel whose observed `liquid_depth` values were 0, 9, 10, 11, 12, 13, 14, and 15. A swimming control had positive X motion and retained the default 0.02 underwater movement value. Levels 1–3 set it to 0.023, 0.026, and 0.029, matching +15% / +30% / +45%. The same test confirmed that a player moving west at −0.5196 X speed retained 0.02, flat source water at depth 0 retained 0.02 while swimming, and level-1 Webbed Feet plus level-1 Ride Current stacked additively to 0.025 (+25%). This is a production BP runtime test; it is separate from the diagnostic-only simulation results elsewhere in the report.

### Classification and interaction limits

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon core candidate. The implementation preserves Java's three level values and direction test for established horizontal gradients, uses vanilla swim controls on keyboard, touch, and controller, and does not add a key binding. Bedrock does not provide the current vector directly; same-height depth differences can miss current vectors around newly open edges, drops, or complex waterlogged layouts. The `속도 전환` cross-augment remains open until that Java augment is ported and tested against this movement bonus. Real-client mobile/controller movement, reconnect, and multiplayer were not run; therefore this is a verified partial port, not 149-feature completion.

### References

- [Stable `Block`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable)
- [Stable `BlockPermutation`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation?view=minecraft-bedrock-stable)
- [Default Bedrock block states](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/blockreference/examples/blockstateandtraitlistings?view=minecraft-bedrock-stable)
- [Stable `Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)
- [Stable `EntityUnderwaterMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityunderwatermovementcomponent?view=minecraft-bedrock-stable)

## `다급한 발걸음` (Urgent Steps)

### Java contract and implementation

The canonical uncommon augment has maximum level 3 and grants +10% / +20% / +30% movement speed for 60 ticks after taking positive final damage. `combat_modifier_contract.json` defines `movement_per_level: 0.10` and `duration_ticks: 60`. Java `CombatAugmentService.afterDamage` ignores blocked or non-positive damage, extends the timer with `max(previousUntil, now + 60)`, and combines the transient bonus additively with other positive movement-speed modifiers. Its combat runtime is cleared on join, death, and respawn; the passive proc presentation triggers once at activation and does not repeat on refreshed hits. The interaction contract places this augment on the shared movement-speed axis with Quick Feet, Catch Breath, day/night movement, Kill Streak, Momentum Shift, and Time Acceleration. The speed bonus is also an input to Java's `속도 전환` calculation. The augment is passive and requires no additional control input on touch, controller, or keyboard.

### Stable Bedrock route and BDS verification

Stable `WorldAfterEvents.entityHurt` reports an `EntityHurtAfterEvent` with the hurt entity and damage after the hurt operation; `System.currentTick` provides the server's current world tick. The Bedrock runtime stores an in-memory expiry keyed by player ID, starts or extends it by 60 ticks only after a positive player hurt after-event, and adds +10% per saved level through the shared movement reconciler. It clears the temporary window when a player leaves, dies, or spawns/respawns. The saved augment level remains in the existing player dynamic-property store. No custom key or mobile-only input is needed; the effect uses normal vanilla movement controls.

The BDS 1.26.62.1 production-handler GameTest applies positive synthetic magic damage to players seeded at levels 1–3 and verifies exact `minecraft:movement` component ratios of 1.10× / 1.20× / 1.30×. A level-2 Urgent Steps player with level-5 Quick Feet verifies additive +35% total movement. A combined swimming test verifies +20% Urgent Steps, +15% Ride Current, and +10% Webbed Feet stack to +45% underwater movement; leaving the flowing pool restores the underwater baseline while the timed Urgent Steps bonus remains on land. A second hit after 40 ticks extends the timer without adding another stack; the bonus remains through the original expiry, then expires after the refreshed 60-tick period. A separate before-event-cancelled hit produces no hurt after-event and no Urgent Steps bonus. These checks measure server component values, not visible player displacement.

### Classification and interaction limits

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon core candidate. The positive-damage gate, three level values, 60-tick duration, refresh rule, cancellation exclusion, and additive Quick Feet stacking are verified against the production BP handler. Bedrock's writable `minecraft:movement` component is the existing server route for movement augments, but exact visible client-motion parity has not been established; the Java proc particles/sound are not yet reproduced. Damage provenance for any future Bedrock delayed-damage augment, the `속도 전환` interaction, real-client mobile/controller movement, reconnect timing, and online multiplayer remain open. The runtime window is intentionally transient and is not saved, matching Java's cleared runtime state; permanent augment level persistence uses the existing store.

### References

- [Stable `WorldAfterEvents`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable)
- [Stable `EntityHurtAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtafterevent?view=minecraft-bedrock-stable)
- [Stable `EntityMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable)
- [Stable `System`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/system?view=minecraft-bedrock-stable)

## `기수` (Rider)

### Java contract

The uncommon augment has maximum level 3 and grants a directly controlled terrestrial animal +10% / +20% / +30% movement speed and jump strength. `mobility_utility_contract.json` defines both curves. `MobilityUtilityAugmentService.applyRider` checks `Animal`, the controlling passenger, and `!isInWater`, then installs transient multiplied-base movement and jump modifiers. It removes them on dismount, level loss, player leave, death, or respawn. No direct Rider rule appears in the interaction contract.

### Stable Bedrock route and BDS verification

Stable `EntityRidingComponent.entityRidingOn` identifies the mount; `EntityRideableComponent` exposes the control-seat index and current riders; `EntityMovementComponent` can write the mount movement value. The server checks an explicit vanilla animal-mount ID allowlist, control seat 0, exactly one rider matching the player, and a mount outside water. It applies the exact Java speed percentages against the mount's per-entity `defaultValue`. The speed value is restored after dismount or loss of an eligible online controller. A runtime tag lets the next server tick clear a stranded value after script reload if no qualified controller is online. Java's player level remains in the existing progression store.

The production BDS tests at levels 1–3 verify exact +10% / +20% / +30% horse movement component values with randomized base values, then verify each mount returns to its default after ejection. A separate production control confirms an unowned player cannot alter horse movement. The isolated riding probe verifies mount/player identity, control seat 0, one rider, and successful movement writes. The separate mount-family probe found that Script API's `families: ["animal"]` query did not match the vanilla mount types it spawned; the implementation therefore uses an explicit vanilla allowlist. That diagnostic and the full 52-test suite passed on BDS 1.26.62.1.

### Classification and interaction limits

Class **B**, `PARTIAL_BDS_VERIFIED`, but disabled as a core candidate: the canonical jump-strength half is not implemented. Stable `minecraft:can_power_jump` is an empty marker, while `minecraft:horse.jump_strength` is static entity JSON and is not a script-writable component ([`EntityCanPowerJumpComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycanpowerjumpcomponent?view=minecraft-bedrock-stable), [horse jump-strength reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_horse.jump_strength?view=minecraft-bedrock-stable)). In the pinned BDS, mounted `SimulatedPlayer.jump()` returned false and no Jump input event was emitted. We do not claim the jump effect, visible speed, exact real-client steering, reconnect/server-restart behavior, multi-seat rider mapping, online multiplayer, or compatibility with other add-ons that write a mount's `minecraft:movement` value. No new key binding is used; mobile and controller riders keep vanilla mount input.

The detailed source-to-runtime comparison is in [`RIDER_IMPLEMENTATION_2026-11-07.md`](RIDER_IMPLEMENTATION_2026-11-07.md).

### References

- [Stable `EntityRidingComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityridingcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityRideableComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityrideablecomponent?view=minecraft-bedrock-stable)
- [Stable `EntityMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityCanPowerJumpComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycanpowerjumpcomponent?view=minecraft-bedrock-stable)
- [Horse jump-strength entity component reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_horse.jump_strength?view=minecraft-bedrock-stable)



## `방어구 관리` (Armor Care)

### Java contract and implementation

The uncommon augment has maximum level 5 and gives each equipped armor piece an independent 5% / 10% / 15% / 20% / 25% chance to avoid durability damage on a hit. `survival_modifier_contract.json` defines `armor_care.durability_avoid_per_level: 0.05`. `SurvivalAugmentService.modifyDurabilityDamage` detects the four equipped armor slots and returns zero damage on a successful roll; `ItemStackDurabilityAugmentMixin.hurtAndBreak` cancels the whole event at HEAD, before vanilla Unbreaking. The Java interaction contract has no direct Armor Care-specific rule. The Java passive readability mixin signals a successful prevention; that cue is not ported.

### Stable Bedrock route and BDS verification

The production BP snapshots each player's damageable head, chest, legs, and feet equipment in `world.beforeEvents.entityHurt`. After `world.afterEvents.entityHurt`, it checks for increased durability in each corresponding slot, rolls the saved Armor Care level independently for the changed pieces, and writes a cloned post-hit stack with its previous durability restored. It skips empty slots and stacks with different item type IDs; identical same-type replacements cannot be distinguished by the stable API. The shared progression property remains the authority for the saved level. Armor Care is passive and introduces no key binding, so its gameplay route does not require platform-specific keyboard, touch, or controller controls.

The isolated production tests ran 20 ordinary and 20 near-break level-5 hits against four diamond armor pieces. The latest full 52-test run saved 24 of 80 ordinary and 26 of 80 near-break outcomes; a separate three-test `armor_probe` run saved 17 and 20. Both runs spent durability on the other outcomes. A level-5-unowned control retained native durability loss on all four iron armor slots. Pure-rule checks cover exact 5% increments, the five-level cap, just-below success, and the exclusive failure boundary. The event-surface diagnostic observed the before event before armor wear and the after event after native damage. The standard suite contains two Armor Care production tests; the separate diagnostic pack also passed all three `armor_probe` tests.

### Classification and interaction limits

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon candidate. The stable `ItemCustomComponent.onBeforeDurabilityDamage` callback concerns durability damage to the custom item hitting an entity, not vanilla armor while the wearer is hurt. The player hurt before/after events and stable equipment/durability writers provide a workable alternate route, but there is no stable event for cancelling the precise armor durability sub-event. Bedrock therefore restores observed wear after native processing instead of cancelling Java's original callback. The route avoids overwriting empty or different-type slots, but cannot prove the same-type stack is the identical armor instance.

The handler skips empty or different-type slots, but stable API does not expose a unique identity for a vanilla armor stack; an identical same-type replacement made during the same event cannot be distinguished. Same-player repeated hurt events within one tick, Unbreaking combinations, concurrent writes from other add-ons, behavior after death/dimension change/reconnect/world restart, and online multiplayer have not been tested. A successful durability restore is verified in BDS, but Java's passive readability presentation and actual client UI have not been.

See [`ARMOR_CARE_IMPLEMENTATION_2026-11-07.md`](ARMOR_CARE_IMPLEMENTATION_2026-11-07.md) for the source-to-runtime decision and exact test counts.

### References

- [Stable `ItemCustomComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcustomcomponent?view=minecraft-bedrock-stable)
- [Stable `ItemComponentBeforeDurabilityDamageEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemcomponentbeforedurabilitydamageevent?view=minecraft-bedrock-stable)
- [Stable `EntityHurtBeforeEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtbeforeevent?view=minecraft-bedrock-stable)
- [Stable `EntityHurtAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityhurtafterevent?view=minecraft-bedrock-stable)
- [Stable `EntityEquippableComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityequippablecomponent?view=minecraft-bedrock-stable)
- [Stable `ItemDurabilityComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemdurabilitycomponent?view=minecraft-bedrock-stable)


## `빠른 양조` (Fast Brewing)

### Java contract and implementation

The uncommon augment has maximum level 3. At the instant a brew begins, Java snapshots the highest saved Fast Brewing level among online players within 8 blocks of the brewing stand. Its 15% / 30% / 45% reductions convert the vanilla 400-tick duration to 340 / 280 / 220 ticks. `BrewingStandUtilityMixin.serverTick` applies the new timer only when the observed timer is exactly 400, leaving the selected duration on the brewing stand after players move away.

The same Java mixin also calls `AreaAccelerationService.extraTicksAt` and re-enters the brewing-stand tick with a recursion guard. While Area Acceleration is active within 24 blocks, level 1 provides 14 extra stand ticks per world tick; level 2 provides 29. This interaction is implemented in Java source but has no explicit Fast Brewing row in the October interaction contract, so it must remain part of the source-derived parity requirements. The Bedrock addon currently implements neither machine tick injection nor Area Acceleration.

### Stable Bedrock API review and BDS probe

Stable `Block.getComponent` is limited to registered vanilla `BlockComponentTypes` and custom components, and `BlockInventoryComponent` provides a container of item stacks. The stable reference documents no vanilla brew-time component, timer, progress value, or brewing-start/completion event. The brewing block's inventory and occupancy states do not report whether a recipe is actively processing. See the official [Block](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable), [BlockComponentTypes](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockcomponenttypes?view=minecraft-bedrock-stable), and [BlockInventoryComponent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockinventorycomponent?view=minecraft-bedrock-stable) references.

The separate BDS 1.26.62.1 `fast_brewing_api_surface_probe` passed (1/1, 7.356 seconds) using `@minecraft/server` 2.11.0. The vanilla brewing stand exposed exactly `minecraft:instrument_sound`, `minecraft:inventory`, `minecraft:movable`, and `minecraft:precipitation_interactions`; its inventory has five slots. `getComponent` returned no `minecraft:recipe_processing`, `minecraft:brewing`, or `minecraft:brewing_stand` component. The only block states were `brewing_stand_slot_a_bit`, `brewing_stand_slot_b_bit`, and `brewing_stand_slot_c_bit`, which report bottle presence. This probe enumerated the API surface only; it did not measure a vanilla brew's completion time or augment effect.

### Classification and limits

Class **D**, `NOT_PORTED`, and disabled as a core candidate. Stable Script API has no way to change the vanilla brew timer or to know its exact start tick. Polling the exposed inventory cannot separate a valid active brew from prepared ingredients, account for existing blaze-powder charge, or robustly observe hopper/manual slot changes. Replacing potion recipes or awarding results on a guessed schedule would change vanilla recipes, fuel use, timing, and container behavior, and could duplicate results in multiplayer. No approximation is shipped.

Fast Brewing is native-vanilla content and has no dependency on external Java mods. Its exact interaction with Area Acceleration remains unported with that separate active augment.

### References

- [Stable `Block`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable)
- [Stable `BlockComponentTypes`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockcomponenttypes?view=minecraft-bedrock-stable)
- [Stable `BlockInventoryComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockinventorycomponent?view=minecraft-bedrock-stable)

## `길들이기 요령` (Taming Knack)

### Java contract and implementation

The uncommon augment has maximum level 3. It multiplies the animal's original tame-success probability by 1.25 / 1.50 / 2.00, capped at 100%. `TamingAugmentService.boostZeroRoll` preserves the original `nextInt(bound) == 0` success and stochastically adds only the probability needed to reach the multiplier. Java applies that roll in the wolf, cat, parrot, and Abstract Nautilus tame paths. `HorseTamingAugmentMixin` instead scales the horse-family temper threshold for a player passenger, including fractional thresholds in expectation. This probability change does not alter temper accumulation. The interaction contract has no direct Taming Knack rule; these species and mechanics are derived from the Java service and mixins.

### Stable Bedrock API review and BDS probe

Stable Script API provides a cancellable `world.beforeEvents.playerInteractWithEntity` event carrying the player, target, and held item. `EntityTameableComponent` exposes its tame items and read-only probability, plus `tame(player)`; `EntityTameMountComponent` exposes `tameToPlayer(showParticles, player)`. A potential item-taming adapter could cancel only matching vanilla item interactions, defer state changes until after the before-event, reproduce the Java multiplier from the species probability, consume one item, and call `tame(player)` on a successful server roll. The `entityTamed` before/after events fire after a successful tame decision and cannot reveal failed attempts by themselves.

The separate `taming_component_and_event_surface_probe` passed 1/1 on BDS 1.26.62.1 using stable `@minecraft/server` 2.11.0. A SimulatedPlayer successfully performed one native tame-item interaction on each of a wolf, cat, parrot, and nautilus. The wolf, cat, and parrot each exposed probability `0.33000001311302185` in this run; nautilus probability and tame-state/owner getters threw `Failed to get property 'seatCount'` / `isTamed` / `tamedToPlayerId`. A native nautilus tame and a direct wolf tame were observed through `entityTamed` before/after events in this run. The wolf's direct `tame(player)` returned true and emitted both tame events with that player as actor, but its tame-state and owner getters threw after the direct call. The SimulatedPlayer interaction did not emit either `playerInteractWithEntity` before- or after-event for any species. A real client interaction was not tested, so this does not establish whether the event is delivered for an actual PC, mobile, or controller player.

The exact run summary is recorded in [`TAMING_API_SURFACE_PROBE_2026-11-07.json`](TAMING_API_SURFACE_PROBE_2026-11-07.json).

On the horse probe, `EntityTameMountComponent.tameToPlayer(true, player)` returned true, while the horse's `getComponents()` omitted `minecraft:tamemount`, `hasComponent("minecraft:tamemount")` and `hasComponent("minecraft:tameable")` both returned false, and the component's tamed/owner getters threw at runtime. The entity exposed `minecraft:rideable` and `minecraft:is_tamed` after the direct call. Stable components and events do not expose the native horse temper value, max temper, or the buck-off attempt result needed to transform Java's threshold on each attempt. A successful setter is not evidence that its random native attempt probability can be preserved.

The official stable references document [player interaction before-events](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinteractwithentitybeforeevent?view=minecraft-bedrock-stable), [tameable entity components](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytameablecomponent?view=minecraft-bedrock-stable), [tame-mount components](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytamemountcomponent?view=minecraft-bedrock-stable), [tame before-events](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytamedbeforeevent?view=minecraft-bedrock-stable), and [world before-events](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldbeforeevents?view=minecraft-bedrock-stable). State-changing calls must be deferred out of restricted before-event execution.

### Classification and limits

Class **C**, `NOT_PORTED`, and disabled as a core candidate. A stable item-interaction interception route may support the four item-tamed Java families, but its cancellation and item replacement behavior was not exercised because BDS SimulatedPlayer does not deliver the required interaction events; no real-client verification is available in this pass. Runtime getter failures also make the property surface inconsistent for nautilus and wolf. The horse-family probability depends on per-attempt temper state that stable Script API does not expose. No gameplay handler or guessed probability is shipped. This is vanilla content and has no external Java mod dependency.

### References

- [Stable `PlayerInteractWithEntityBeforeEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinteractwithentitybeforeevent?view=minecraft-bedrock-stable)
- [Stable `EntityTameableComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytameablecomponent?view=minecraft-bedrock-stable)
- [Stable `EntityTameMountComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytamemountcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityTamedBeforeEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytamedbeforeevent?view=minecraft-bedrock-stable)
- [Stable `WorldBeforeEvents`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldbeforeevents?view=minecraft-bedrock-stable)

## `관성 전환` (Momentum Shift)

### Java contract

The uncommon augment has maximum level 3. The Java movement service records the maximum `fallDistance` while the player is outside ground, climbable, and feet-water contact. On a grounded transition after at least 4.0 blocks of actual fall distance, it applies +10% movement speed per level for 60 ticks. The check is independent of fall damage. `탄성 저장` can store the same qualifying fall, so both may activate on the landing; a Temporary Platform that prevents fall damage does not suppress either distance-based trigger.

The stable `movement_modifier_contract.json` sets `minimum_fall_distance` to 4.0, `movement_per_level` to 0.10, and `duration_ticks` to 60. Java adds the temporary amount to its shared additive movement modifier, which also composes with the other positive movement bonuses. The exact implementation is in `MovementAugmentService.java` and `MovementTuning.java`; the catalog presentation says the 3-second bonus begins after a fall of at least four blocks.

### Bedrock implementation and BDS verification

Stable `@minecraft/server` 2.11.0 does not declare a `fallDistance` property. It does expose `Entity.isOnGround`, `Entity.isClimbing`, `Entity.isFalling`, player location, stable block `isLiquid` / `isWaterlogged` state, and writable general / underwater movement components ([`Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable), [`Block`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable), [`EntityMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable), [`EntityUnderwaterMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityunderwatermovementcomponent?view=minecraft-bedrock-stable)). The production script samples the highest player Y while outside Java-equivalent reset contact, then compares that peak with the landing position. It grants the timed movement amount only on the server's grounded transition and adds it to the same general/underwater bonus sum used by the other ported movement augments. The timer and fall samples are in-memory runtime state and clear on player leave, death, and spawn; the owned augment level remains in the progression save.

The BDS 1.26.62.1 stable API diagnostic passed. For the exact four-block test fall, `isFalling` first became true at 3.9216 blocks below the peak and the player reached a grounded state four blocks below it on tick 11. The production runtime includes the landing position in the final distance sample because the previous airborne sample in its GameTest run was only 3.346 blocks below the peak. These results rule out using `isFalling` alone as the threshold source. The production-handler test checks levels 1–3, expiry, Quick Feet additive stacking, a three-block negative control, and activation after the fall `entityHurt` before-event is cancelled. It verifies the effect does not require a damage after-event.

The complete event and position measurements are preserved in [`MOMENTUM_FALL_STATE_PROBE_2026-11-07.json`](MOMENTUM_FALL_STATE_PROBE_2026-11-07.json).

### Classification and open checks

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon core candidate. BDS verifies the server movement-component values, reconstructed four-block threshold, and timer behavior. If a player first acquires the level during an ongoing fall, Bedrock begins its local peak-position sample at the current Y and may miss distance from earlier ticks; Java's `fallDistance` retains it. Live displacement, mobile/controller play, water and climbing transitions, teleport edges, reconnect and multiplayer behavior, and coexistence with `탄성 저장` / Temporary Platform in a complete pair are also unverified. The interaction contract is preserved and marked for review while `탄성 저장` remains unported. No Java behavior has been intentionally removed; the current limitations are this mid-fall sampling edge and unverified movement-component parity.

## `매달리기` (Mantle)

### Java contract and implementation

The uncommon augment has maximum level 1. `MantleAugmentService.tryMantle` runs from the tail of every server-player tick and requires the player to be airborne, outside water and climbable blocks, not riding, flying, or spectating, in horizontal collision, and not moving upward faster than `0.20` blocks/tick. It also rejects the action while `CombatAugmentService.isActionLocked` is true. The service normalizes the horizontal look vector, moves the destination `0.35` blocks forward and `1.0` block up, requires `noCollision` for the player's destination AABB, preserves horizontal velocity, clamps vertical velocity to at least zero, and resets Java fall distance. The action lock specifically covers Reincarnation recovery stasis. The interaction contract has no direct Mantle clause; the source shows a shared interaction with Momentum Shift's fall-distance sampling.

### Stable Bedrock route and BDS verification

Stable `@minecraft/server` 2.11.0 exposes cross-platform `Player.inputInfo.getMovementVector()`, `Entity.getAABB()`, `Dimension.getBlockFromRay()`, `Entity.tryTeleport()`, `getVelocity()`, and `applyImpulse()`. The server tick runtime combines the current input vector with the horizontal view direction, raycasts the leading AABB samples, and accepts a wall only when the hit face is within `0.05` blocks. The stable API has no horizontal-collision or fall-distance property. It reads the stored level, airborne/fluid/climbing/flying/game-mode/riding conditions, and rejects upward Y velocity above `0.20`.

The BDS 1.26.62.1 production test showed two player-teleport differences: `keepVelocity` is unsupported for player teleportation, and `tryTeleport(..., {checkForBlocks: true})` did not reject the obstructed destination fixture. The runtime therefore omits `keepVelocity`, snapshots velocity before teleport, and applies the delta needed to preserve X/Z and clamp Y afterward. It separately scans block cells overlapping the destination player AABB before teleport. Air, liquid, blocks tagged `plant`, `minecraft:crop`, `rail`, or `text_sign`, and a small explicit passable-block set are allowed; other non-air blocks are treated as blocking because Script API does not expose a generic collision-shape/no-collision query. These tags do not describe collision geometry, so some tagged plants with collision may be allowed while unlisted passable or partial blocks may be conservatively rejected. Custom collision shapes do not have exact parity. Living entities are checked with AABB overlap.

After a successful mantle, the shared Momentum Shift fall sampler resets its current peak and accumulated distance, reproducing Java's `resetFallDistance()` interaction. The Java Reincarnation action lock has no Bedrock equivalent yet because Reincarnation is unported, so it cannot suppress Mantle in that state.

### Classification and open checks

Class **B**, `PARTIAL_BDS_VERIFIED`, and enabled as an uncommon core candidate. The `mantle_reconstructs_collision_and_resets_momentum_fall_phase` production-script GameTest injects forward input and verifies ownership, no-input and no-wall controls, a blocked block destination, a living-entity destination, exact one-block vertical and `0.35`-block forward displacement, nonnegative Y velocity, and the Momentum Shift fall-phase reset. SimulatedPlayer movement does not populate `inputInfo`, so the test does not demonstrate real keyboard, touch, or controller input delivery. Real-client movement, mobile/controller play, online multiplayer, reconnect, custom block collision shapes, and Reincarnation stasis remain open.

Mantle adds no key binding or custom client UI. It uses the ordinary forward movement input, so keyboard, touch, and controller controls remain the vanilla movement controls.

### References

- [Stable `InputInfo`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/inputinfo?view=minecraft-bedrock-stable)
- [Stable `Entity`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)
- [Stable `Dimension`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable)
- [Stable `Block`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable)

## `광석 눈썰미` (Ore Sense)

### Java contract and implementation

The rare augment has maximum level 3 and displays exposed ores within a full spherical block-position radius of 6 / 8 / 10. Java scans every 10 client ticks. It matches `ConventionalBlockTags.ORES`, then checks the six face-adjacent blocks with `VoxelShape.isEmpty`; an exposed ore is rendered as a thin cyan `0xFF39E6D0` block outline. The saved level reaches the client through `PerceptionAugmentService` and `PerceptionStatePayload`; the render scan and outline are in `ClientPerceptionState`. The current Java interaction contract has no Ore Sense-specific cross-augment rule, and the Java source has no dedicated Ore Sense GameTest.

### Stable Bedrock route

The production BP reads the saved player level, runs every 10 server ticks, scans only already-loaded chunks, and bounds the scan to the player's current dimension and its height range. It uses the shared vanilla ore ID/tag helper (`ore` / `ores` plus explicit vanilla IDs), checks air, liquid, or a maintained list of common collisionless vanilla blocks on the six faces, and emits 20 custom cyan points per ore (eight corners and twelve edge midpoints). The Resource Pack particle has zero initial speed, 0.65-second lifetime, and small 0.09-block billboard size; the half-second refresh interval keeps the points visible between scans. There is no custom key or menu interaction; it is a passive effect and uses the stored level owned by the server.

Stable `Player.spawnParticle` is documented as visible only to the target player, so these visual markers are sent to the owner and not disclosed to other players. The local scan is bounded and checks `Dimension.isChunkLoaded` before block access; it does not request new chunk loads. Bedrock's `Block` / `BlockPermutation` surface does not expose Java's collision shape or an equivalent generic empty-collision query. The explicit vanilla neighbor list can therefore miss custom or unlisted collisionless blocks and can diverge on partial blocks. Ore discovery uses Bedrock tags and vanilla fallbacks; an external add-on block must expose a compatible ore tag for this route to recognize it. The 20 particle points approximate the Java continuous wireframe and are not pixel-identical.

The passive scan introduces no device-specific input, so keyboard, touch, and controller use the same regular gameplay controls. The custom particle's contrast, marker density and legibility have not been inspected in the Windows client, mobile client, or controller play; BDS cannot validate rendered client visuals.

### BDS verification and classification

`ore_sense_marks_exposed_ores_at_the_saved_radius_for_its_owner` passed **1/1** on official BDS 1.26.62.1 with stable Script API 2.11.0. Its production entry first grants Ore Sense by consuming a rare core through `commitCoreSelection` and verifies the saved level; the GameTest then exercises the production refresh at levels 1–3 (6 / 8 / 10 blocks), air- and water-exposed ore detection, omission of a fully stone-enclosed ore, unique outline markers, and that all marker calls use the selected augment owner's `Player.spawnParticle`. The run found 2 / 3 / 4 exposed ores and emitted 40 / 60 / 80 unique markers at the three levels. The same GameTest passed in the latest 57-test run. A previous 56-test run was **not clean** because Rider level 1 and 2 mount fixtures failed to expose `minecraft:rideable` (54 passed / 2 failed). `npm run verify` passed 33 static tests at that earlier checkpoint. See [`ORE_SENSE_PRODUCTION_TEST_2026-11-07.json`](ORE_SENSE_PRODUCTION_TEST_2026-11-07.json).

Class **B**, `PARTIAL_BDS_VERIFIED`, enabled as a rare candidate. The scan/ownership/radius path is verified on BDS; exact collision-shape parity, client visuals on PC/mobile/controller, and live online multiplayer rendering remain unverified.

### References

- [Stable Player API (`spawnParticle`)](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)
- [Stable Dimension API (`isChunkLoaded`, `getBlock`, height range)](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable)
- [Stable Block API](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/block?view=minecraft-bedrock-stable)
- [Particle system overview](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/particlesintroduction?view=minecraft-bedrock-stable)
- [Particle tinting component](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/particlesreference/examples/particlecomponents/particle_appearance_tinting?view=minecraft-bedrock-stable)


## `상자 찾기` (Chest Finder)

### Java contract and implementation

The rare augment has maximum level 3 and marks unconsumed natural loot containers inside spherical radii of 12 / 18 / 24 blocks with a gold outline. Java `PerceptionAugmentService` checks every 10 server ticks for loaded `RandomizableContainerBlockEntity` instances with a non-null loot-table marker, capped at 512 matches. The saved augment state is sent to the client through `PerceptionStatePayload`; the client cache and block outline are implemented in `ClientPerceptionState` and `EntityRendererPerceptionMixin`. The Java interaction contract has no Chest Finder-specific cross-augment rule. Its code includes randomizable containers generally; the Bedrock port does not copy any external mod containers or assets.

### Stable Bedrock route and constraints

Stable `Dimension.getBlocks(volume, options, allowUnloadedChunks)` supports type-filtered queries. With the loaded-only option, the query does not load chunks. `BlockInventoryComponent` exposes a container inventory, but it does not expose a loot-table identifier, whether vanilla loot was already generated, or whether the block was placed by a player. Stable `blockContainerOpened`, `playerPlaceBlock`, and `playerBreakBlock` after-events provide a server-side activity ledger. The production script scans loaded `minecraft:chest`, `minecraft:trapped_chest`, and `minecraft:barrel` blocks every 10 ticks inside the canonical sphere, uses empty inventory as an approximate unopened-state test, and persists observed placement/open markers in world dynamic properties. Breaking a marked block clears that location marker. Gold Resource Pack particles are sent with owner-targeted `Player.spawnParticle`. The scan ignores walls as Java does.

This is class **C**, `PARTIAL_BDS_VERIFIED`, and the rare candidate is enabled. Empty inventory does not prove that a loot table remains unconsumed: already opened and emptied chests can be false positives. A player-placed empty block that predates the add-on or whose placement event was missed can also be highlighted. Only vanilla chest, trapped chest, and barrel block types are scanned. `Dimension.getGeneratedStructures` appears in the Dimension documentation but is marked pre-release, so it is not part of this stable implementation. No safe stable way was found to recover the exact Java loot-table marker and natural-versus-player origin.

### BDS verification

The isolated production GameTest passed **1/1** on BDS 1.26.62.1 in 4.545 seconds. Through the production core transaction it consumed one rare core and stored Chest Finder level 1, then tested each saved level at exactly 12 / 18 / 24 blocks. It verified one, two, and three accepted empty containers and 20, 40, and 60 owner-targeted gold marker calls; an intervening wall did not hide the level-1 chest. A filled barrel and an outside-radius container were excluded. It observed `blockContainerOpened` and verified that the production marker writer persists an exclusion record. A SimulatedPlayer placement fixture did not create the block at its expected coordinate, so actual `playerPlaceBlock` delivery is not claimed as verified.

The test does not verify persistent marker recovery after a server restart, actual client particle rendering, mobile/controller legibility, reconnect, online multiplayer, or false-positive rate in existing worlds.

### References

- [Stable `Dimension.getBlocks`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable)
- [Stable `BlockQueryOptions.includeTypes`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockfilter?view=minecraft-bedrock-stable)
- [Stable `BlockInventoryComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockinventorycomponent?view=minecraft-bedrock-stable)
- [Stable `blockContainerOpened`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable)
- [Stable `PlayerPlaceBlockAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerplaceblockafterevent?view=minecraft-bedrock-stable)
- [Stable `PlayerBreakBlockAfterEvent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable)
- [Stable `Player.spawnParticle`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)
- [Stable-only note for `Dimension.getGeneratedStructures`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable)

## `위험 감지` (Danger Sense)

### Java contract and implementation

The rare augment has maximum level 3 and marks hostile living entities in spherical radii of 8 / 12 / 16 blocks with a red outline that is visible through walls. `PerceptionAugmentService` refreshes its owner-specific perception payload every 10 server ticks, searches an inflated player AABB, applies an exact squared-distance cutoff, and caps the returned entity IDs at 256. Its hostile predicate delegates to `CompanionAugmentService.isHostileTarget`: dead entities, the source itself, dominated entities, allies, and `source.isAlliedTo(candidate)` are excluded; candidates are Java `Enemy` types or entities accepted by `EntityCompatibilityProfileService.isBoss`. The owner receives entity IDs through `PerceptionStatePayload`; `ClientPerceptionState` and `EntityRendererPerceptionMixin` render the local red `0xFFFF4A4A` entity outline. The interaction contract explicitly removes dominated entities from this hostile-target filter. There is no dedicated Java Danger Sense GameTest.

### Stable Bedrock route and constraints

Stable `Dimension.getEntities` accepts family, location, maximum-distance, exclusion-tag, and closest-result filters. `EntityTypeFamilyComponent` supports checking a candidate's family, `EntityHealthComponent` exposes its current health, and `Entity.getAABB()` returns the bounds used by the shared outline-point generator. The production script queries the `monster` and `boss` families separately, rejects invalid/dead/player entities and those tagged `augmentation_survival:dominated`, then applies the exact 8 / 12 / 16 sphere to entity locations. It sorts and caps accepted hostiles at 256. For each target, the BP generates eight AABB corners and twelve edge midpoints, insets them slightly, and calls owner-only `Player.spawnParticle` with a red marker every 10 ticks.

This is class **C**, `PARTIAL_BDS_VERIFIED`, and the rare candidate is enabled. Stable Script API has no Java `Enemy` or dynamic compatibility-profile predicate, generic entity-alliance test, or client-local entity-outline writer. The vanilla `monster`/`boss` family proxy can include or omit Java-equivalent targets; the reserved dominated tag only excludes companions from this add-on or cooperating add-ons. Server selection ignores walls, but the BDS test cannot establish whether a real client draws particles through opaque blocks. PC, mobile, and controller rendering have not been inspected. Java's 256-target cap means up to 5,120 point particles per owner refresh; mobile performance at this bound is unmeasured. Custom Java boss profiles and interaction with external add-ons also remain open.

### BDS verification

`danger_sense_marks_hostile_entities_at_all_saved_radii_for_its_owner` passed **1/1** on official BDS 1.26.62.1 with stable Script API 2.11.0 in 6.0 seconds. Its production entry grants level 1 by consuming one rare core and verifies the production pack stored level. The GameTest then places hostile targets at exactly 8 / 12 / 16 blocks plus a 16.5-block control and checks all three saved levels. It rejects a passive cow and a zombie tagged dominated, selects the target behind a three-block stone obstruction, and compares each target's 20 observed marker calls with the exact points generated from its collision AABB. At levels 1 / 2 / 3 it observed 1 / 2 / 3 hostiles and 20 / 40 / 60 unique marker calls, all directed to the owner. This is server detection and API-call evidence only; it does not verify reconnect, world restart, visible client rendering, or multiplayer.

### References

- [Stable `Dimension.getEntities`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/dimension?view=minecraft-bedrock-stable)
- [Stable `EntityFilter`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityfilter?view=minecraft-bedrock-stable)
- [Stable `EntityTypeFamilyComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitytypefamilycomponent?view=minecraft-bedrock-stable)
- [Stable `Entity.getAABB`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entity?view=minecraft-bedrock-stable)
- [Stable `AABB`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/aabb?view=minecraft-bedrock-stable)
- [Stable `Player.spawnParticle`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/player?view=minecraft-bedrock-stable)


## Arrow Saver (화살 아끼기)

### Java contract and implementation

The rare augment has maximum level 3 and preserves a consumed arrow with probability 10% / 20% / 30%. Java injects at the head of ProjectileWeaponItem.useAmmo and returns one intangible projectile instead of consuming the selected stack when the roll succeeds. It skips force-infinite and infinite-material cases, non-player users, non-Bow/Crossbow items, and stacks outside ItemTags.ARROWS. The interaction contract states that the roll runs exactly once per root shot. Crossbow ammunition is checked while loading; Multishot's three derived projectiles do not get three preservation rolls. Java emits a success-only owner feedback cue with enchantment particles, one End Rod particle, and an amethyst chime. The Java source currently has no Arrow Saver-specific GameTest.

### Stable Bedrock route and constraints

Stable @minecraft/server 2.11.0 exposes itemStopUse and playerInventoryItemChange after-events. On BDS 1.26.62.1, a simulated Bow release emitted itemStopUse and the one-arrow inventory decrement on the same server tick; Crossbow loading emitted its stop and decrement together, while firing the loaded Crossbow consumed no second arrow. The production handler records the stopped weapon and selected slot, then accepts only an exactly-one-arrow decrease for that player and tick while the same Bow/Crossbow remains selected. It rolls once and, on success, clones the consumed stack, sets its amount to one, and adds it back to the inventory; an overflow stack is dropped at the player. Creative-mode actions are ignored. Infinity already avoids an inventory decrease and therefore cannot be duplicated by the handler.

This is class B and PARTIAL_BDS_VERIFIED, with the rare candidate enabled. Stable API does not expose Java ItemTags.ARROWS membership. The target vanilla-data package identifies the available arrow item as minecraft:arrow, which is the only arrow ID the production handler accepts. This does not cover custom Java arrow IDs or establish parity for other Bedrock add-on arrow IDs. ItemStack.clone preserved tested custom name and lore, but effect-bearing or unusual arrow metadata was not exercised. The restore happens after vanilla decrements the stack, so another same-tick inventory listener can observe a transient decrease before refund. Java's success-only particle/sound cue is not yet ported. Crosshair/use controls, animation, mobile and controller play, live multiplayer, reconnect, and world restart remain unverified.

### BDS verification

Run npm run test:arrow-saver-production for the isolated production-handler test. On official BDS 1.26.62.1 the current targeted test passed 1/1 in 11.840 seconds with no script, regression, or infrastructure errors. It verifies the exact 10% / 20% / 30% exclusive roll boundaries, one-arrow consumption recognition, an actual simulated Bow release at level 2 for success and miss, Crossbow load-time success and miss at level 3, a Multishot Crossbow firing three projectiles from one preserved root action, custom name/lore retention, Infinity non-duplication, and the rare offer allowlist. The separate event-boundary probe also passed and records the BDS event ordering; its generated JSON is preserved under .bds/logs and is not counted in the standard suite. This does not verify the Java readability cue or live-client input.

### References

- [Stable WorldAfterEvents](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable)
- [Stable PlayerInventoryItemChangeAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerinventoryitemchangeafterevent?view=minecraft-bedrock-stable)
- [Stable ItemStack.clone](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable)

## Replant (`다시 심기`)

### Java contract

The rare augment has maximum level 1. Java's `ResourceHarvestService` checks the captured mature block with `instanceof CropBlock`, applies crop bonuses first, and schedules replanting for one server tick later. It identifies the planting item by finding a registered `BlockItem` whose placed block is that crop. The delayed operation proceeds only if the crop cell is still air and one matching item can be consumed: first from a ground `ItemEntity` inside the crop block AABB expanded by 1.5 blocks, then from the tracked breaker inventory. It restores the same crop at age 0. The `ResourceHarvestAuditFixMixin` supplies the owner-inventory fallback after the short ground-pickup window. Java's regression tests cover the inventory fallback and the interaction with derived Sweeping Harvest crops.

### Stable Bedrock route

The production BP listens to `world.afterEvents.playerBreakBlock`, checks the captured mature permutation, captures its dimension/position/owner, and schedules one tick. It only writes an age-0 crop permutation into an air cell. It checks matching ground items first and then scans the still-online breaker's inventory, consuming exactly one item. Dynamic-property augment levels remain server-owned and persistent; the one-tick pending operation is transient and naturally clears if the server stops.

The mapped Java `CropBlock` equivalents are wheat, carrots, potatoes, beetroot, and Torchflower Crop. The Java item registry maps Torchflower Seeds to Torchflower Crop, so it is included. Pitcher Crop, Nether Wart, cocoa, sweet berry bushes, stems, and unrecognized add-on crops are excluded because they do not meet the Java `CropBlock` plus matching `BlockItem` rule in the pinned source. No external Java crop content is copied.

Stable `minecraft:item` exposes `itemStack` as a read-only snapshot, not a setter for the world's entity stack. For a one-item entity the handler removes that entity. For larger stacks it clones the item data, decrements the clone by one, spawns the remainder at the same location, restores velocity when available, and removes the old entity in the same synchronous callback. The count path avoids intentionally duplicating items, but replacement resets hidden entity metadata such as pickup age. If the replacement cannot be made safely, the original stack stays and the owner's inventory fallback is tried. Stable block-break events do not expose the vanilla drop list, so Replant uses nearby items rather than Java's direct drop list.

### Classification and BDS evidence

Class **B**, `PARTIAL_BDS_VERIFIED`, rare candidate enabled. The latest isolated production-handler test passed **1/1** in **9,297 ms** on official BDS 1.26.62.1, with zero regressions, script errors, or infrastructure errors. It uses live `SimulatedPlayer` breaks and verifies: Seed Saver ground-drop priority; exactly one owner-inventory fallback consumption when ground seeds are removed; Torchflower replanting; a two-item dropped seed stack becoming one; Bumper Crop product availability; and blocked-cell, immature-crop, no-seed, and non-`CropBlock` controls. The Java `RareTierPlaytestRegressionGameTests` coverage of derived Sweeping Harvest is recorded, but Bedrock has not routed its not-yet-ported derived-harvest path through Replant.

The handler is dimension/position keyed and token guarded for simultaneous break callbacks. BDS tests did not cover online multiplayer, reconnect, server restart, player death/respawn during the one-tick window, other add-ons changing the cell, external crops, or client UI. Replant is passive after a crop break and adds no new input, so mobile/controller interaction is unchanged; visual client verification remains unrun.

### References

- [Stable PlayerBreakBlockAfterEvent](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable)
- [Stable BlockPermutation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/blockpermutation?view=minecraft-bedrock-stable)
- [Stable ItemStack](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/itemstack?view=minecraft-bedrock-stable)
