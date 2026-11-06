import { EntityComponentTypes, GameMode, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const PICKUP_HAND = "augmentation_survival:pickup_hand";
const PICKUP_HAND_MAX_LEVEL = 3;
const PICKUP_HAND_RADII = [0, 1.5, 3.0, 4.5];

/** @param {number} level */
export function pickupHandRadius(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return PICKUP_HAND_RADII[Math.min(level, PICKUP_HAND_MAX_LEVEL)];
}

/**
 * Pull one nearby vanilla item or XP orb into the nearest eligible player's
 * hitbox. Native Bedrock pickup then performs inventory checks and awards the
 * orb's original XP value; this code never removes, clones, or re-creates loot.
 */
function reconcilePickupHand() {
  /** @type {Map<string, {entity: import("@minecraft/server").Entity, destination: import("@minecraft/server").Vector3, distanceSquared: number}>} */
  const targets = new Map();

  for (const player of world.getPlayers()) {
    if (!player.isValid || player.getGameMode() === GameMode.Spectator) continue;
    const health = player.getComponent("minecraft:health");
    if (health && health.currentValue <= 0) continue;
    const level = getStoredAugmentLevel(player, PICKUP_HAND, PICKUP_HAND_MAX_LEVEL);
    const radius = pickupHandRadius(level);
    if (radius <= 0) continue;

    const playerBounds = player.getAABB();
    const queryDistance = Math.hypot(
      playerBounds.extent.x + radius + 1,
      playerBounds.extent.y + radius + 1,
      playerBounds.extent.z + radius + 1,
    );
    const entities = player.dimension.getEntities({
      location: playerBounds.center,
      maxDistance: queryDistance,
    });

    for (const entity of entities) {
      if (entity.id === player.id) continue;
      const isXpOrb = entity.typeId === "minecraft:xp_orb";
      const isItem = entity.getComponent(EntityComponentTypes.Item) !== undefined;
      if (!isXpOrb && !isItem) continue;

      const entityBounds = entity.getAABB();
      const dx = Math.abs(entityBounds.center.x - playerBounds.center.x);
      const dy = Math.abs(entityBounds.center.y - playerBounds.center.y);
      const dz = Math.abs(entityBounds.center.z - playerBounds.center.z);
      const reachX = playerBounds.extent.x + entityBounds.extent.x + radius;
      const reachY = playerBounds.extent.y + entityBounds.extent.y + radius;
      const reachZ = playerBounds.extent.z + entityBounds.extent.z + radius;
      if (dx > reachX || dy > reachY || dz > reachZ) continue;
      // Leave entities already inside the player's hitbox to vanilla pickup.
      if (dx <= playerBounds.extent.x + entityBounds.extent.x
        && dy <= playerBounds.extent.y + entityBounds.extent.y
        && dz <= playerBounds.extent.z + entityBounds.extent.z) continue;

      const distanceSquared = dx * dx + dy * dy + dz * dz;
      const current = targets.get(entity.id);
      if (!current || distanceSquared < current.distanceSquared) {
        targets.set(entity.id, { entity, destination: playerBounds.center, distanceSquared });
      }
    }
  }

  for (const { entity, destination } of targets.values()) {
    try {
      if (entity.isValid) entity.teleport(destination, { checkForBlocks: false, keepVelocity: false });
    } catch {
      // Another player or the engine may pick up/remove the entity before teleport.
    }
  }
}

system.runInterval(reconcilePickupHand, 1);
