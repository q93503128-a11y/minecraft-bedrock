# API compatibility investigation — 2026-11-07

Java source revision: `2c82b0a7e62f3b6844735890ec4de8ffae55fecc`  
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

