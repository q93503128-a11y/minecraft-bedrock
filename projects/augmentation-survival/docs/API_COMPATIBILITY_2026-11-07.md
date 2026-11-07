# API compatibility investigation — 2026-11-07

Java source revision: `70a1e548086aef395113bb732a815dbfbbf35053`
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

