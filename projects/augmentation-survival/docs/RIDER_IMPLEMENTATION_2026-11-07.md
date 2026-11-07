# `기수` (Rider) — 2026-11-07

## Java contract

The uncommon augment has maximum level 3. Its exact effect is +10% / +20% / +30% movement speed **and** jump strength for the animal the player directly controls while riding it. `mobility_utility_contract.json` stores the two curves as `[0.10, 0.20, 0.30]`.

`MobilityUtilityAugmentService.applyRider` accepts an `Animal` only when `getControllingPassenger()` is the augmented player and the mount is not in water. It adds transient multiplied-base modifiers to `MOVEMENT_SPEED` and `JUMP_STRENGTH`, then removes both on dismount, zero level, leave, death, or respawn. The Java interaction contract has no Rider-specific cross-augment rule.

## Bedrock implementation

`BP/scripts/rider.js` reads the saved level from the existing player progression property. It supports the vanilla horse, donkey, mule, skeleton-horse, zombie-horse, camel, pig, strider, llama, and trader-llama IDs. A mount qualifies only when the riding relation points to it, it exposes `rideable` and `movement`, the control seat is index 0, the player is its sole rider, and it is not in water. This intentionally avoids guessing which player occupies a control seat when a multi-seat mount has multiple passengers.

For qualifying mounts, the production server loop sets `minecraft:movement` to `defaultValue × (1 + 0.10 × level)`. When the mount is no longer eligible, the loop restores `defaultValue` and removes its runtime tag. The tag scan also clears stranded speed values after a script restart if the mount no longer has an eligible online owner. Player leave, spawn/respawn, and death clear the in-memory owner reference. No player growth or custom key binding was added. Riders use Bedrock's normal mount controls, including touch and controller interfaces.

This is only the speed half of the Java effect. The pinned stable API does not expose a writable numeric horse jump-strength component. `minecraft:can_power_jump` is only a marker, and `minecraft:horse.jump_strength` is documented as static entity JSON rather than a script-writable component. BDS also showed `SimulatedPlayer.jump()` returns false while mounted and emits no Jump input event. The add-on does not change horse jump behavior or overwrite vanilla entity definitions to imitate the missing attribute.

## Compatibility and status

Class **B**, `PARTIAL_BDS_VERIFIED`; disabled as a core candidate because the canonical jump-strength half is absent. The speed curve matches the Java contract at the mount component level; visible client motion, exact horse/donkey/camel steering feel, stable multi-seat rider-to-seat mapping, water-edge timing, reconnect recovery, server restart behavior, online multiplayer, and interactions with other add-ons that write the same mount movement value remain unverified. Do not count `기수` as a complete port.

## BDS evidence

- `rider_speed_level_1_applies_and_restores`, `_2_`, and `_3_` run the production BP. Each confirms the rider relation and sole controlling seat, checks exact +10% / +20% / +30% `movement` values on a horse with its randomized per-entity base, then dismounts and checks exact restoration and runtime-tag removal.
- `rider_speed_does_not_change_unowned_mount` confirms a player without Rider leaves the mount value at its default.
- Isolated `rider_mount_api_surface_probe` and `rider_mount_family_probe` passed 2/2 on BDS 1.26.62.1. A directly mounted horse exposes a readable riding relation, control seat, riders, and writable movement; queried numeric jump components are absent. The family-match probe returned false for `families: ["animal"]` across its tested vanilla mounts, so production uses an explicit vanilla allowlist instead of that filter.
- The full `augmentation_survival` suite passed 50/50 after adding the four Rider production checks. These tests verify server component values, not on-screen speed or jumping.

## Sources

- Java: `src/main/java/dev/moonseungjun/augmentationsurvival/augment/movement/MobilityUtilityAugmentService.java`
- Java tuning: `src/main/java/dev/moonseungjun/augmentationsurvival/augment/movement/MobilityUtilityTuning.java`
- Java contract: `src/main/resources/data/augmentation_survival/augmentation/mobility_utility_contract.json`
- [Stable `EntityRidingComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityridingcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityRideableComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entityrideablecomponent?view=minecraft-bedrock-stable)
- [Stable `EntityMovementComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitymovementcomponent?view=minecraft-bedrock-stable)
- [Stable `EntityCanPowerJumpComponent`](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/entitycanpowerjumpcomponent?view=minecraft-bedrock-stable)
- [Horse jump-strength entity component reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/entityreference/examples/entitycomponents/minecraftcomponent_horse.jump_strength?view=minecraft-bedrock-stable)
