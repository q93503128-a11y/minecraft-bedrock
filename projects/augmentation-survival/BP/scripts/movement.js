import { Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const CATCH_BREATH_ID = "augmentation_survival:catch_breath";
const WEBBED_FEET_ID = "augmentation_survival:webbed_feet";
const RIDE_CURRENT_ID = "augmentation_survival:ride_current";
const QUICK_FEET_ID = "augmentation_survival:quick_feet";
const NOCTURNAL_ID = "augmentation_survival:nocturnal";
const SUN_AFFINITY_ID = "augmentation_survival:sun_affinity";
const URGENT_STEPS_ID = "augmentation_survival:urgent_steps";
const MOMENTUM_SHIFT_ID = "augmentation_survival:momentum_shift";
const CATCH_BREATH_PER_LEVEL = 0.10;
const SWIM_SPEED_PER_LEVEL = 0.10;
const QUICK_FEET_PER_LEVEL = 0.03;
const NOCTURNAL_MOVEMENT_PER_LEVEL = 0.05;
const SUN_AFFINITY_MOVEMENT_PER_LEVEL = 0.04;
const URGENT_STEPS_MOVEMENT_PER_LEVEL = 0.10;
const MOMENTUM_SHIFT_MOVEMENT_PER_LEVEL = 0.10;
const CATCH_BREATH_MAX_LEVEL = 3;
const WEBBED_FEET_MAX_LEVEL = 3;
const RIDE_CURRENT_MAX_LEVEL = 3;
const URGENT_STEPS_MAX_LEVEL = 3;
const URGENT_STEPS_DURATION_TICKS = 60;
const MOMENTUM_SHIFT_MAX_LEVEL = 3;
const MOMENTUM_SHIFT_MINIMUM_FALL_DISTANCE = 4;
const MOMENTUM_SHIFT_DURATION_TICKS = 60;
const QUICK_FEET_MAX_LEVEL = 5;
const DAY_TICKS = 24_000;
const DAYTIME_END_TICK = 13_000;
const CATCH_BREATH_IDLE_TICKS = 60;
const VALUE_EPSILON = 0.000001;
const CURRENT_DOT_EPSILON = 0.0000001;
const RIDE_CURRENT_BONUSES = [0, 0.15, 0.30, 0.45];
const MOVEMENT_STATE = new Map();
const URGENT_STEPS_UNTIL = new Map();
const MOMENTUM_SHIFT_STATE = new Map();

/** @param {import("@minecraft/server").EntityHurtAfterEvent} event */
function onEntityHurt({ hurtEntity, damage }) {
  if (!(hurtEntity instanceof Player) || !(damage > 0) || !Number.isFinite(damage)) return;
  const level = getStoredAugmentLevel(hurtEntity, URGENT_STEPS_ID, URGENT_STEPS_MAX_LEVEL);
  if (level <= 0) return;

  const now = system.currentTick;
  const nextUntil = Math.max(URGENT_STEPS_UNTIL.get(hurtEntity.id) ?? 0, now + URGENT_STEPS_DURATION_TICKS);
  URGENT_STEPS_UNTIL.set(hurtEntity.id, nextUntil);
}

/** @param {string} playerId */
function clearUrgentSteps(playerId) {
  URGENT_STEPS_UNTIL.delete(playerId);
}

/** @param {string} playerId */
function clearMomentumShift(playerId) {
  MOMENTUM_SHIFT_STATE.delete(playerId);
}

/** @param {import("@minecraft/server").Player} player */
function isMovementResetContact(player) {
  if (player.isOnGround || player.isClimbing) return true;
  try {
    const location = player.location;
    const feet = player.dimension.getBlock({
      x: Math.floor(location.x),
      y: Math.floor(location.y),
      z: Math.floor(location.z),
    });
    return waterDepth(feet) !== undefined;
  } catch { /* A player may cross an unloaded chunk between the scan and block read. */ }
  return false;
}

/** @param {import("@minecraft/server").Player} player @param {number} level */
function updateMomentumShift(player, level) {
  if (level <= 0) {
    clearMomentumShift(player.id);
    return 0;
  }

  const location = player.location;
  const grounded = player.isOnGround;
  const resetContact = isMovementResetContact(player);
  let state = MOMENTUM_SHIFT_STATE.get(player.id);
  if (!state) {
    state = {
      momentumUntilTick: 0,
      maxObservedFallDistance: 0,
      fallPeakY: resetContact ? undefined : location.y,
      wasGrounded: grounded,
    };
    MOMENTUM_SHIFT_STATE.set(player.id, state);
  }

  if (!resetContact) {
    state.fallPeakY = state.fallPeakY === undefined ? location.y : Math.max(state.fallPeakY, location.y);
    state.maxObservedFallDistance = Math.max(state.maxObservedFallDistance, state.fallPeakY - location.y);
  } else {
    const landingFallDistance = state.fallPeakY === undefined
      ? state.maxObservedFallDistance
      : Math.max(state.maxObservedFallDistance, state.fallPeakY - location.y);
    if (grounded && !state.wasGrounded
        && landingFallDistance >= MOMENTUM_SHIFT_MINIMUM_FALL_DISTANCE) {
      state.momentumUntilTick = system.currentTick + MOMENTUM_SHIFT_DURATION_TICKS;
    }
    state.maxObservedFallDistance = 0;
    state.fallPeakY = undefined;
  }

  state.wasGrounded = grounded;
  return state.momentumUntilTick > system.currentTick
    ? MOMENTUM_SHIFT_MOVEMENT_PER_LEVEL * level
    : 0;
}

/** @param {import("@minecraft/server").Block | undefined} block */
function waterDepth(block) {
  if (!block || (!block.isLiquid && !block.isWaterlogged)) return undefined;
  if (!block.isWaterlogged && block.typeId !== "minecraft:water" && block.typeId !== "minecraft:flowing_water") return undefined;
  const depth = block.permutation.getState("liquid_depth");
  return typeof depth === "number" ? depth : 0;
}

/**
 * Reconstruct the local horizontal water-flow direction from Bedrock's stable
 * liquid_depth state. Higher depth values represent lower fluid surfaces.
 * @param {import("@minecraft/server").Player} player
 */
function localWaterFlow(player) {
  const location = player.location;
  const x = Math.floor(location.x);
  const y = Math.floor(location.y);
  const z = Math.floor(location.z);
  const depth = waterDepth(player.dimension.getBlock({ x, y, z }));
  if (depth === undefined) return undefined;

  let flowX = 0;
  let flowZ = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const neighborDepth = waterDepth(player.dimension.getBlock({ x: x + dx, y, z: z + dz }));
    if (neighborDepth === undefined) continue;
    const depthDifference = neighborDepth - depth;
    flowX += dx * depthDifference;
    flowZ += dz * depthDifference;
  }
  return { x: flowX, z: flowZ };
}

/** @param {import("@minecraft/server").Player} player @param {number} level */
function rideCurrentBonus(player, level) {
  if (level <= 0 || !player.isSwimming) return 0;
  const flow = localWaterFlow(player);
  if (!flow || flow.x === 0 && flow.z === 0) return 0;
  const velocity = player.getVelocity();
  return flow.x * velocity.x + flow.z * velocity.z > CURRENT_DOT_EPSILON
    ? RIDE_CURRENT_BONUSES[level]
    : 0;
}

/** @param {import("@minecraft/server").Player} player */
function reconcileMovement(player) {
  const catchBreathLevel = getStoredAugmentLevel(player, CATCH_BREATH_ID, CATCH_BREATH_MAX_LEVEL);
  const webbedFeetLevel = getStoredAugmentLevel(player, WEBBED_FEET_ID, WEBBED_FEET_MAX_LEVEL);
  const rideCurrentLevel = getStoredAugmentLevel(player, RIDE_CURRENT_ID, RIDE_CURRENT_MAX_LEVEL);
  const quickFeetLevel = getStoredAugmentLevel(player, QUICK_FEET_ID, QUICK_FEET_MAX_LEVEL);
  const nocturnalLevel = getStoredAugmentLevel(player, NOCTURNAL_ID, 3);
  const sunAffinityLevel = getStoredAugmentLevel(player, SUN_AFFINITY_ID, 3);
  const urgentStepsLevel = getStoredAugmentLevel(player, URGENT_STEPS_ID, URGENT_STEPS_MAX_LEVEL);
  const momentumShiftLevel = getStoredAugmentLevel(player, MOMENTUM_SHIFT_ID, MOMENTUM_SHIFT_MAX_LEVEL);
  const urgentStepsUntil = URGENT_STEPS_UNTIL.get(player.id) ?? 0;
  if (urgentStepsUntil > 0 && system.currentTick >= urgentStepsUntil) URGENT_STEPS_UNTIL.delete(player.id);
  const urgentStepsBonus = urgentStepsLevel > 0 && system.currentTick < urgentStepsUntil
    ? URGENT_STEPS_MOVEMENT_PER_LEVEL * urgentStepsLevel
    : 0;
  const momentumShiftBonus = updateMomentumShift(player, momentumShiftLevel);
  const hasMovementAugment = catchBreathLevel > 0 || webbedFeetLevel > 0 || rideCurrentLevel > 0 || quickFeetLevel > 0
    || nocturnalLevel > 0 || sunAffinityLevel > 0 || urgentStepsLevel > 0 || momentumShiftLevel > 0;
  const hasConditionalMovementAugment = catchBreathLevel > 0 || webbedFeetLevel > 0
    || nocturnalLevel > 0 || sunAffinityLevel > 0;
  if (!hasMovementAugment && !MOVEMENT_STATE.has(player.id)) return;
  try {
    let state = MOVEMENT_STATE.get(player.id);
    if (!state) {
      state = { nonSprintingTicks: 0, lastMovementValue: undefined, lastUnderwaterValue: undefined };
      MOVEMENT_STATE.set(player.id, state);
    }

    if (hasConditionalMovementAugment && !player.isSprinting) {
      state.nonSprintingTicks = Math.min(CATCH_BREATH_IDLE_TICKS, state.nonSprintingTicks + 1);
    } else {
      state.nonSprintingTicks = 0;
    }
    const catchBreathBonus = catchBreathLevel > 0 && state.nonSprintingTicks >= CATCH_BREATH_IDLE_TICKS
      ? CATCH_BREATH_PER_LEVEL * catchBreathLevel
      : 0;
    const quickFeetBonus = QUICK_FEET_PER_LEVEL * quickFeetLevel;
    const dayTime = ((world.getTimeOfDay() % DAY_TICKS) + DAY_TICKS) % DAY_TICKS;
    const daytimeBonus = dayTime < DAYTIME_END_TICK
      ? SUN_AFFINITY_MOVEMENT_PER_LEVEL * sunAffinityLevel
      : NOCTURNAL_MOVEMENT_PER_LEVEL * nocturnalLevel;
    const sharedMovementBonus = quickFeetBonus + daytimeBonus + catchBreathBonus + urgentStepsBonus + momentumShiftBonus;
    const isInWater = player.isInWater;
    const webbedFeetBonus = isInWater ? SWIM_SPEED_PER_LEVEL * webbedFeetLevel : 0;
    const rideCurrentMovementBonus = isInWater ? rideCurrentBonus(player, rideCurrentLevel) : 0;
    const hasGeneralMovementAugment = catchBreathLevel > 0 || quickFeetLevel > 0
      || nocturnalLevel > 0 || sunAffinityLevel > 0 || urgentStepsBonus > 0 || momentumShiftBonus > 0;

    const movement = player.getComponent("minecraft:movement");
    if (movement) {
      const targetValue = movement.defaultValue * (isInWater ? 1 : 1 + sharedMovementBonus);
      const shouldRestoreOrApply = hasGeneralMovementAugment || state.lastMovementValue !== undefined;
      if (shouldRestoreOrApply && Math.abs(movement.currentValue - targetValue) > VALUE_EPSILON) {
        movement.setCurrentValue(targetValue);
      }
      state.lastMovementValue = hasGeneralMovementAugment ? targetValue : undefined;
    }

    const underwaterMovement = player.getComponent("minecraft:underwater_movement");
    if (underwaterMovement) {
      const targetValue = underwaterMovement.defaultValue * (isInWater ? 1 + sharedMovementBonus + webbedFeetBonus + rideCurrentMovementBonus : 1);
      const shouldRestoreOrApply = isInWater && (hasGeneralMovementAugment || webbedFeetLevel > 0 || rideCurrentLevel > 0)
        || state.lastUnderwaterValue !== undefined;
      if (shouldRestoreOrApply && Math.abs(underwaterMovement.currentValue - targetValue) > VALUE_EPSILON) {
        underwaterMovement.setCurrentValue(targetValue);
      }
      state.lastUnderwaterValue = isInWater && (hasGeneralMovementAugment || webbedFeetLevel > 0 || rideCurrentLevel > 0)
        ? targetValue
        : undefined;
    }

    if (!hasMovementAugment) {
      MOVEMENT_STATE.delete(player.id);
    }
  } catch { /* A player can leave the world between the scan and component access. */ }
}

function reconcileOnlinePlayers() {
  for (const player of world.getPlayers()) reconcileMovement(player);
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  MOVEMENT_STATE.delete(playerId);
  clearUrgentSteps(playerId);
  clearMomentumShift(playerId);
});
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  clearUrgentSteps(player.id);
  clearMomentumShift(player.id);
});
world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (deadEntity instanceof Player) {
    clearUrgentSteps(deadEntity.id);
    clearMomentumShift(deadEntity.id);
  }
});
world.afterEvents.entityHurt.subscribe(onEntityHurt);

// Reconcile native movement attributes each tick. The per-player idle counter
// and multiplier stay server-authoritative while vanilla input and swimming
// continue to drive movement on keyboard, touch, and controller.
system.runInterval(reconcileOnlinePlayers, 1);
