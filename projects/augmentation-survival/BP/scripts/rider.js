import { Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const RIDER_ID = "augmentation_survival:rider";
const RIDER_MAX_LEVEL = 3;
const RIDER_MOVEMENT_PER_LEVEL = 0.10;
const RIDER_RUNTIME_TAG = "augmentation_survival:rider_speed_runtime";
const MOUNT_TYPES = new Set([
  "minecraft:horse",
  "minecraft:donkey",
  "minecraft:mule",
  "minecraft:skeleton_horse",
  "minecraft:zombie_horse",
  "minecraft:camel",
  "minecraft:pig",
  "minecraft:strider",
  "minecraft:llama",
  "minecraft:trader_llama",
]);
const TRACKED_MOUNTS_BY_PLAYER = new Map();
const DIMENSION_IDS = ["overworld", "nether", "the_end"];
const VALUE_EPSILON = 0.000001;

/** @param {import("@minecraft/server").Entity | undefined} mount */
function resetMount(mount) {
  if (!mount) return;
  try {
    const movement = mount.getComponent("minecraft:movement");
    if (movement && Math.abs(movement.currentValue - movement.defaultValue) > VALUE_EPSILON) {
      movement.setCurrentValue(movement.defaultValue);
    }
    if (mount.hasTag(RIDER_RUNTIME_TAG)) mount.removeTag(RIDER_RUNTIME_TAG);
  } catch { /* A mount can despawn while its owner leaves or dismounts. */ }
}

/** @param {Player} player */
function controlledMount(player) {
  try {
    const mount = player.getComponent("minecraft:riding")?.entityRidingOn;
    if (!mount || !MOUNT_TYPES.has(mount.typeId) || mount.isInWater) return undefined;

    const movement = mount.getComponent("minecraft:movement");
    const rideable = mount.getComponent("minecraft:rideable");
    if (!movement || !rideable || !Number.isInteger(rideable.controllingSeat) || rideable.controllingSeat !== 0) return undefined;
    const seats = rideable.getSeats();
    if (!seats[rideable.controllingSeat]) return undefined;

    // A single rider on the controlling seat has an unambiguous owner even on
    // the two-seat camel. Multi-rider seats are deferred until the stable API
    // can map rider IDs to seat indices.
    const riders = rideable.getRiders();
    if (riders.length !== 1 || riders[0].id !== player.id) return undefined;
    return mount;
  } catch { /* Vanilla mount components can disappear while the player dismounts. */ }
  return undefined;
}

/** @param {number} level @param {import("@minecraft/server").Entity} mount */
function applyMovement(level, mount) {
  try {
    const movement = mount.getComponent("minecraft:movement");
    if (!movement || !Number.isFinite(movement.defaultValue) || movement.defaultValue <= 0) return false;
    const targetValue = movement.defaultValue * (1 + RIDER_MOVEMENT_PER_LEVEL * level);
    if (Math.abs(movement.currentValue - targetValue) > VALUE_EPSILON && !movement.setCurrentValue(targetValue)) return false;
    if (!mount.hasTag(RIDER_RUNTIME_TAG)) mount.addTag(RIDER_RUNTIME_TAG);
    return true;
  } catch { /* The mount can be unloaded between rider and component reads. */ }
  return false;
}

function reconcileRiderMovement() {
  const activeMountIds = new Set();
  for (const player of world.getPlayers()) {
    const previousMount = TRACKED_MOUNTS_BY_PLAYER.get(player.id);
    try {
      const level = getStoredAugmentLevel(player, RIDER_ID, RIDER_MAX_LEVEL);
      const mount = level > 0 ? controlledMount(player) : undefined;
      if (!mount || !applyMovement(level, mount)) {
        if (previousMount) resetMount(previousMount);
        TRACKED_MOUNTS_BY_PLAYER.delete(player.id);
        continue;
      }

      if (previousMount && previousMount.id !== mount.id) resetMount(previousMount);
      TRACKED_MOUNTS_BY_PLAYER.set(player.id, mount);
      activeMountIds.add(mount.id);
    } catch { /* A player can leave while the server tick scans online players. */ }
  }

  // Runtime tags make an interrupted script/server restart self-healing: a
  // tagged mount without an online, qualified controller returns to its base.
  for (const dimensionId of DIMENSION_IDS) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const mount of dimension.getEntities({ tags: [RIDER_RUNTIME_TAG] })) {
        if (!activeMountIds.has(mount.id)) resetMount(mount);
      }
    } catch { /* A dimension may be unavailable during world shutdown. */ }
  }
}

/** @param {string} playerId */
function clearPlayerMount(playerId) {
  const mount = TRACKED_MOUNTS_BY_PLAYER.get(playerId);
  if (mount) resetMount(mount);
  TRACKED_MOUNTS_BY_PLAYER.delete(playerId);
}

/** @param {import("@minecraft/server").PlayerLeaveAfterEvent} event */
function onPlayerLeave(event) {
  clearPlayerMount(event.playerId);
}

world.afterEvents.playerLeave.subscribe(onPlayerLeave);
world.afterEvents.playerSpawn.subscribe(({ player }) => clearPlayerMount(player.id));
world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (deadEntity instanceof Player) clearPlayerMount(deadEntity.id);
});
system.runInterval(reconcileRiderMovement, 1);
