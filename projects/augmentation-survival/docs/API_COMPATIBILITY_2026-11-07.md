# API compatibility investigation — 2026-11-07

Java source revision: `023e0ca8169da0669faa04a249eedae7169f4f51`
Bedrock target observed: Minecraft Bedrock/BDS 1.26.62.1; stable Script API `@minecraft/server` 2.11.0.

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
