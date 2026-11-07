import { GameMode, Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const CATCH_BREATH_ID = "augmentation_survival:catch_breath";
const WEBBED_FEET_ID = "augmentation_survival:webbed_feet";
const RIDE_CURRENT_ID = "augmentation_survival:ride_current";
const QUICK_FEET_ID = "augmentation_survival:quick_feet";
const NOCTURNAL_ID = "augmentation_survival:nocturnal";
const SUN_AFFINITY_ID = "augmentation_survival:sun_affinity";
const URGENT_STEPS_ID = "augmentation_survival:urgent_steps";
const MOMENTUM_SHIFT_ID = "augmentation_survival:momentum_shift";
const MANTLE_ID = "augmentation_survival:mantle";
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
const MANTLE_FORWARD_DISTANCE = 0.35;
const MANTLE_UP_DISTANCE = 1.0;
const MANTLE_WALL_RAY_DISTANCE = 0.05;
const MANTLE_WALL_RAYCAST_MAX_DISTANCE = 1.0;
const MANTLE_PASSABLE_BLOCKS = new Set([
  "minecraft:fire", "minecraft:soul_fire", "minecraft:redstone_wire", "minecraft:tripwire",
  "minecraft:torch", "minecraft:soul_torch", "minecraft:redstone_torch", "minecraft:wall_torch",
  "minecraft:ladder", "minecraft:vine", "minecraft:glow_lichen",
]);
const MANTLE_WALL_RAY_INSET = 0.025;
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

/**
 * Reconstruct Java's horizontal-collision trigger from client movement input
 * and collision-shape raycasts. The optional input is only used by the
 * deterministic GameTest; production always reads the player's current
 * cross-platform movement vector.
 * @param {Player} player
 * @param {{x:number,y:number}} [movementInputOverride]
 */
export function tryMantle(player, movementInputOverride) {
  try {
    const gate = {
      level: getStoredAugmentLevel(player, MANTLE_ID, 1),
      grounded: player.isOnGround,
      water: player.isInWater,
      climbing: player.isClimbing,
      flying: player.isFlying,
      spectator: player.getGameMode() === GameMode.Spectator,
      riding: Boolean(player.getComponent("minecraft:riding")?.entityRidingOn),
      velocityY: player.getVelocity().y,
    };
    if (gate.level <= 0 || gate.grounded || gate.water || gate.climbing || gate.flying || gate.spectator || gate.riding || gate.velocityY > 0.20) {
      return false;
    }

    const input = movementInputOverride ?? player.inputInfo.getMovementVector();
    if (!Number.isFinite(input.x) || !Number.isFinite(input.y) || Math.hypot(input.x, input.y) < 0.05) return false;

    const view = player.getViewDirection();
    const viewLength = Math.hypot(view.x, view.z);
    if (viewLength < 1.0e-6) return false;
    const forward = { x: view.x / viewLength, z: view.z / viewLength };
    const left = { x: forward.z, z: -forward.x };
    const inputLength = Math.hypot(input.x, input.y);
    const move = {
      x: left.x * input.x / inputLength + forward.x * input.y / inputLength,
      z: left.z * input.x / inputLength + forward.z * input.y / inputLength,
    };
    const moveLength = Math.hypot(move.x, move.z);
    if (moveLength < 1.0e-6) return false;
    move.x /= moveLength;
    move.z /= moveLength;

    const bounds = player.getAABB();
    if (!isAgainstHorizontalBlock(player, bounds, move)) return false;

    const location = player.location;
    const offset = {
      x: forward.x * MANTLE_FORWARD_DISTANCE,
      y: MANTLE_UP_DISTANCE,
      z: forward.z * MANTLE_FORWARD_DISTANCE,
    };
    if (overlapsLivingEntityAt(player, bounds, offset) || !isMantleDestinationClear(player, bounds, offset)) {
      return false;
    }

    const destination = {
      x: location.x + offset.x,
      y: location.y + offset.y,
      z: location.z + offset.z,
    };
    const velocityBefore = player.getVelocity();
    if (!player.tryTeleport(destination, { checkForBlocks: true })) {
      return false;
    }
    const velocityAfter = player.getVelocity();
    player.applyImpulse({
      x: velocityBefore.x - velocityAfter.x,
      y: Math.max(0, velocityBefore.y) - velocityAfter.y,
      z: velocityBefore.z - velocityAfter.z,
    });

    // Java calls resetFallDistance() after a mantle. Keep the sampled Bedrock
    // peak in the same phase so the one-block teleport cannot count as a fall.
    const fallState = MOMENTUM_SHIFT_STATE.get(player.id);
    if (fallState) {
      fallState.maxObservedFallDistance = 0;
      fallState.fallPeakY = player.location.y;
      fallState.wasGrounded = false;
    }
    return true;
  } catch {
    /* A stale player or unloaded collision query should not stop movement reconciliation. */
  }
  return false;
}

/** @param {Player} player @param {import("@minecraft/server").AABB} bounds @param {{x:number,z:number}} move */
function isAgainstHorizontalBlock(player, bounds, move) {
  const forwardExtent = bounds.extent.x * Math.abs(move.x) + bounds.extent.z * Math.abs(move.z);
  const side = { x: -move.z, z: move.x };
  const sideExtent = bounds.extent.x * Math.abs(side.x) + bounds.extent.z * Math.abs(side.z);
  const heights = [-0.65, 0, 0.65];
  const lateralOffsets = [-0.75, 0, 0.75];
  for (const height of heights) {
    for (const lateral of lateralOffsets) {
      const origin = {
        x: bounds.center.x + move.x * (forwardExtent - MANTLE_WALL_RAY_INSET) + side.x * sideExtent * lateral,
        y: bounds.center.y + bounds.extent.y * height,
        z: bounds.center.z + move.z * (forwardExtent - MANTLE_WALL_RAY_INSET) + side.z * sideExtent * lateral,
      };
      const hit = player.dimension.getBlockFromRay(origin, { x: move.x, y: 0, z: move.z }, {
        maxDistance: MANTLE_WALL_RAYCAST_MAX_DISTANCE,
        includeLiquidBlocks: false,
        includePassableBlocks: false,
      });
      if (!hit) continue;
      const hitPosition = {
        x: hit.block.location.x + hit.faceLocation.x,
        y: hit.block.location.y + hit.faceLocation.y,
        z: hit.block.location.z + hit.faceLocation.z,
      };
      const hitDistance = Math.hypot(hitPosition.x - origin.x, hitPosition.y - origin.y, hitPosition.z - origin.z);
      if (hitDistance <= MANTLE_WALL_RAY_DISTANCE + VALUE_EPSILON) return true;
    }
  }
  return false;
}

/** @param {Player} player @param {import("@minecraft/server").AABB} bounds @param {{x:number,y:number,z:number}} offset */
function overlapsLivingEntityAt(player, bounds, offset) {
  const destinationCenter = {
    x: bounds.center.x + offset.x,
    y: bounds.center.y + offset.y,
    z: bounds.center.z + offset.z,
  };
  for (const other of player.dimension.getEntities({ location: destinationCenter, maxDistance: 3 })) {
    if (other.id === player.id) continue;
    try {
      if (!other.getComponent("minecraft:health")) continue;
      const otherBounds = other.getAABB();
      if (Math.abs(destinationCenter.x - otherBounds.center.x) < bounds.extent.x + otherBounds.extent.x
          && Math.abs(destinationCenter.y - otherBounds.center.y) < bounds.extent.y + otherBounds.extent.y
          && Math.abs(destinationCenter.z - otherBounds.center.z) < bounds.extent.z + otherBounds.extent.z) {
        return true;
      }
    } catch { /* Ignore an entity removed while querying the destination. */ }
  }
  return false;
}

/** @param {Player} player @param {import("@minecraft/server").AABB} bounds @param {{x:number,y:number,z:number}} offset */
function isMantleDestinationClear(player, bounds, offset) {
  const destinationCenter = {
    x: bounds.center.x + offset.x,
    y: bounds.center.y + offset.y,
    z: bounds.center.z + offset.z,
  };
  const minX = Math.floor(destinationCenter.x - bounds.extent.x + 0.025);
  const maxX = Math.floor(destinationCenter.x + bounds.extent.x - 0.025);
  const minY = Math.floor(destinationCenter.y - bounds.extent.y + 0.025);
  const maxY = Math.floor(destinationCenter.y + bounds.extent.y - 0.025);
  const minZ = Math.floor(destinationCenter.z - bounds.extent.z + 0.025);
  const maxZ = Math.floor(destinationCenter.z + bounds.extent.z - 0.025);
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        const block = player.dimension.getBlock({ x, y, z });
        if (!block || block.isAir || block.isLiquid || block.hasTag("plant") || block.hasTag("minecraft:crop") || block.hasTag("rail") || block.hasTag("text_sign") || MANTLE_PASSABLE_BLOCKS.has(block.typeId)) continue;
        return false;
      }
    }
  }
  return true;
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
  tryMantle(player);
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
