import { system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const CATCH_BREATH_ID = "augmentation_survival:catch_breath";
const WEBBED_FEET_ID = "augmentation_survival:webbed_feet";
const CATCH_BREATH_PER_LEVEL = 0.10;
const SWIM_SPEED_PER_LEVEL = 0.10;
const MAX_LEVEL = 3;
const CATCH_BREATH_IDLE_TICKS = 60;
const VALUE_EPSILON = 0.000001;
const MOVEMENT_STATE = new Map();

/** @param {import("@minecraft/server").Player} player */
function reconcileMovement(player) {
  const catchBreathLevel = getStoredAugmentLevel(player, CATCH_BREATH_ID, MAX_LEVEL);
  const webbedFeetLevel = getStoredAugmentLevel(player, WEBBED_FEET_ID, MAX_LEVEL);
  if (catchBreathLevel <= 0 && webbedFeetLevel <= 0 && !MOVEMENT_STATE.has(player.id)) return;
  try {
    let state = MOVEMENT_STATE.get(player.id);
    if (!state) {
      state = { nonSprintingTicks: 0, lastMovementValue: undefined, lastUnderwaterValue: undefined };
      MOVEMENT_STATE.set(player.id, state);
    }

    if (catchBreathLevel > 0 && !player.isSprinting) {
      state.nonSprintingTicks = Math.min(CATCH_BREATH_IDLE_TICKS, state.nonSprintingTicks + 1);
    } else {
      state.nonSprintingTicks = 0;
    }

    const catchBreathBonus = catchBreathLevel > 0 && state.nonSprintingTicks >= CATCH_BREATH_IDLE_TICKS
      ? CATCH_BREATH_PER_LEVEL * catchBreathLevel
      : 0;
    const isInWater = player.isInWater;
    const webbedFeetBonus = isInWater ? SWIM_SPEED_PER_LEVEL * webbedFeetLevel : 0;

    const movement = player.getComponent("minecraft:movement");
    if (movement) {
      const targetValue = movement.defaultValue * (isInWater ? 1 : 1 + catchBreathBonus);
      const shouldRestoreOrApply = catchBreathLevel > 0 || state.lastMovementValue !== undefined;
      if (shouldRestoreOrApply && Math.abs(movement.currentValue - targetValue) > VALUE_EPSILON) {
        movement.setCurrentValue(targetValue);
      }
      state.lastMovementValue = catchBreathLevel > 0 ? targetValue : undefined;
    }

    const underwaterMovement = player.getComponent("minecraft:underwater_movement");
    if (underwaterMovement) {
      const targetValue = underwaterMovement.defaultValue * (isInWater ? 1 + catchBreathBonus + webbedFeetBonus : 1);
      const shouldRestoreOrApply = isInWater && (catchBreathLevel > 0 || webbedFeetLevel > 0)
        || state.lastUnderwaterValue !== undefined;
      if (shouldRestoreOrApply && Math.abs(underwaterMovement.currentValue - targetValue) > VALUE_EPSILON) {
        underwaterMovement.setCurrentValue(targetValue);
      }
      state.lastUnderwaterValue = isInWater && (catchBreathLevel > 0 || webbedFeetLevel > 0) ? targetValue : undefined;
    }

    if (catchBreathLevel <= 0 && webbedFeetLevel <= 0) {
      MOVEMENT_STATE.delete(player.id);
    }
  } catch { /* A player can leave the world between the scan and component access. */ }
}

function reconcileOnlinePlayers() {
  for (const player of world.getPlayers()) reconcileMovement(player);
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => MOVEMENT_STATE.delete(playerId));

// Reconcile native movement attributes each tick. The per-player idle counter
// and multiplier stay server-authoritative while vanilla input and swimming
// continue to drive movement on keyboard, touch, and controller.
system.runInterval(reconcileOnlinePlayers, 1);
