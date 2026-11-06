import { system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const WEBBED_FEET_ID = "augmentation_survival:webbed_feet";
const SWIM_SPEED_PER_LEVEL = 0.10;
const MAX_LEVEL = 3;
const VALUE_EPSILON = 0.000001;

/** @param {import("@minecraft/server").Player} player */
function applyWebbedFeet(player) {
  const level = getStoredAugmentLevel(player, WEBBED_FEET_ID, MAX_LEVEL);
  if (level <= 0) return;

  try {
    const movement = player.getComponent("minecraft:underwater_movement");
    if (!movement) return;

    const multiplier = player.isInWater ? 1 + SWIM_SPEED_PER_LEVEL * level : 1;
    const targetValue = movement.defaultValue * multiplier;
    if (Math.abs(movement.currentValue - targetValue) > VALUE_EPSILON) {
      movement.setCurrentValue(targetValue);
    }
  } catch { /* A player can leave the world between the scan and component access. */ }
}

function applyWebbedFeetToOnlinePlayers() {
  for (const player of world.getPlayers()) applyWebbedFeet(player);
}

// Reconcile the native water movement attribute each tick. Bedrock uses this
// value in its normal movement simulation, so touch/controller/keyboard input
// and the vanilla swimming state keep their existing behavior.
system.runInterval(applyWebbedFeetToOnlinePlayers, 1);
