import { BlockPermutation, system, world } from "@minecraft/server";
import { matureReplantCrop } from "./crop-catalog.js";
import { getStoredAugmentLevel } from "./progression.js";

export const REPLANT_ID = "augmentation_survival:replant";
const REPLANT_MAX_LEVEL = 1;
const REPLANT_DELAY_TICKS = 1;
const PICKUP_RADIUS = 1.5;
const pending = new Map();
let nextToken = 0;

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} location */
function replantKey(dimension, location) {
  return `${dimension.id}|${location.x},${location.y},${location.z}`;
}

/**
 * Java expands the crop block AABB by 1.5 blocks and checks nearby item
 * entities before falling back to the breaker inventory. Stable Bedrock only
 * offers a spherical entity query, so a broad sphere is followed by an exact
 * expanded-cube coordinate filter.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {{x:number,y:number,z:number}} location
 * @param {string} itemId
 * @returns {boolean}
 */
function consumeNearbyPlantingItem(dimension, location, itemId) {
  const center = { x: location.x + 0.5, y: location.y + 0.5, z: location.z + 0.5 };
  let entities;
  try {
    entities = dimension.getEntities({ type: "minecraft:item", location: center, maxDistance: 3.5 });
  } catch {
    return false;
  }

  for (const entity of entities) {
    const position = entity.location;
    if (position.x < location.x - PICKUP_RADIUS || position.x > location.x + 1 + PICKUP_RADIUS
      || position.y < location.y - PICKUP_RADIUS || position.y > location.y + 1 + PICKUP_RADIUS
      || position.z < location.z - PICKUP_RADIUS || position.z > location.z + 1 + PICKUP_RADIUS) continue;

    let stack;
    try { stack = entity.getComponent("minecraft:item")?.itemStack; }
    catch { continue; }
    if (stack?.typeId !== itemId || stack.amount < 1) continue;

    if (stack.amount === 1) {
      try {
        entity.remove();
        return true;
      } catch {
        continue;
      }
    }

    // Stable Script API returns a read-only snapshot for world item entities.
    // Replace the entity with an exact cloned remainder, then remove the old
    // one in this same server callback. If the old entity cannot be removed,
    // remove the replacement so this path never intentionally duplicates it.
    let replacement;
    let velocity = { x: 0, y: 0, z: 0 };
    try { velocity = entity.getVelocity(); } catch { /* Item count mutation remains valid without velocity metadata. */ }
    try {
      const remainder = stack.clone();
      remainder.amount -= 1;
      replacement = dimension.spawnItem(remainder, position);
      try {
        replacement.clearVelocity();
        replacement.applyImpulse(velocity);
      } catch { /* Preserve the stack count even when velocity cannot be restored. */ }
      entity.remove();
      return true;
    } catch {
      try { replacement?.remove(); } catch { /* The original entity remains the authoritative stack. */ }
    }
  }
  return false;
}

/** @param {import("@minecraft/server").Player} player @param {string} itemId */
function consumeOwnerInventoryItem(player, itemId) {
  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) return false;
    for (let slot = 0; slot < inventory.size; slot += 1) {
      const current = inventory.getItem(slot);
      if (current?.typeId !== itemId || current.amount < 1) continue;
      if (current.amount === 1) inventory.setItem(slot, undefined);
      else {
        const remainder = current.clone();
        remainder.amount -= 1;
        inventory.setItem(slot, remainder);
      }
      return true;
    }
  } catch { /* A player who left or an unavailable inventory cannot supply fallback seed. */ }
  return false;
}

/** @param {string} key @param {number} token */
function processPending(key, token) {
  const record = pending.get(key);
  if (!record || record.token !== token) return;
  pending.delete(key);

  try {
    const block = record.dimension.getBlock(record.location);
    if (!block?.isAir) return;
    block.setPermutation(BlockPermutation.resolve(record.crop.blockId, { [record.crop.ageState]: 0 }));
  } catch {
    return;
  }

  let consumed = consumeNearbyPlantingItem(record.dimension, record.location, record.crop.plantingItem);
  if (!consumed) {
    const player = world.getPlayers().find(candidate => candidate.id === record.playerId);
    if (player) consumed = consumeOwnerInventoryItem(player, record.crop.plantingItem);
  }
  if (consumed) return;

  // No matching seed existed. Roll back only our own age-zero crop placement.
  try {
    const current = record.dimension.getBlock(record.location);
    if (current?.typeId !== record.crop.blockId) return;
    if (current.permutation.getState(record.crop.ageState) === 0) current.setType("minecraft:air");
  } catch { /* A concurrent world change wins over cleanup. */ }
}

/** @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event */
export function scheduleReplant(event) {
  if (getStoredAugmentLevel(event.player, REPLANT_ID, REPLANT_MAX_LEVEL) < 1) return false;
  const crop = matureReplantCrop(event.brokenBlockPermutation);
  if (!crop) return false;

  const location = { x: event.block.location.x, y: event.block.location.y, z: event.block.location.z };
  const key = replantKey(event.dimension, location);
  const token = ++nextToken;
  pending.set(key, { token, dimension: event.dimension, location, crop, playerId: event.player.id });
  system.runTimeout(() => processPending(key, token), REPLANT_DELAY_TICKS);
  return true;
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  scheduleReplant(event);
});
