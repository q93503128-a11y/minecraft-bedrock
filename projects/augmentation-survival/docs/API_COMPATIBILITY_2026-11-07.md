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

