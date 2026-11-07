import { BlockVolume, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

export const CHEST_FINDER_ID = "augmentation_survival:chest_finder";
export const CHEST_FINDER_PARTICLE_ID = "augmentation_survival:chest_finder_marker";
const CHEST_FINDER_MAX_LEVEL = 3;
const CHEST_FINDER_RADIUS = [0, 12, 18, 24];
const SCAN_INTERVAL_TICKS = 10;
const MAX_CONTAINER_MARKERS = 512;
const MARKER_PROPERTY_PREFIX = "augmentation_survival:chest_finder:v1";
const GOLD_OUTLINE_MARGIN = 0.06;
const LOOT_CONTAINER_TYPES = [
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
];
const LOOT_CONTAINER_TYPE_SET = new Set(LOOT_CONTAINER_TYPES);

/** @param {number} level */
export function chestFinderRadius(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return CHEST_FINDER_RADIUS[Math.min(level, CHEST_FINDER_MAX_LEVEL)];
}

/** @param {{x:number,y:number,z:number}} center */
function floorCenter(center) {
  return { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} location */
function markerPropertyId(dimension, location) {
  const position = floorCenter(location);
  return `${MARKER_PROPERTY_PREFIX}:${dimension.id}:${position.x}:${position.y}:${position.z}`;
}

/**
 * Exclude a container after a player places it or the server observes it being
 * opened. World dynamic properties persist this per-block state across player
 * reconnects and world saves.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {{x:number,y:number,z:number}} location
 */
export function markChestFinderContainerExcluded(dimension, location) {
  try {
    world.setDynamicProperty(markerPropertyId(dimension, location), true);
    return true;
  } catch {
    // Fail closed: the scanner will treat an unreadable marker as excluded.
    return false;
  }
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} location */
function clearChestFinderContainerMarker(dimension, location) {
  try { world.setDynamicProperty(markerPropertyId(dimension, location), undefined); } catch { /* A stale location is harmless. */ }
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} location */
export function isChestFinderContainerExcluded(dimension, location) {
  try { return world.getDynamicProperty(markerPropertyId(dimension, location)) === true; } catch { return true; }
}

/**
 * Bedrock's stable BlockInventoryComponent does not expose a loot-table ID or
 * whether vanilla structure loot has already been generated. Empty inventory
 * plus persisted placement/open tracking is the closest stable-API proxy.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {{x:number,y:number,z:number}} blockCenter
 * @param {number} radius
 */
export function findUnconsumedLootContainers(dimension, blockCenter, radius) {
  const safeRadius = Number.isInteger(radius) ? Math.min(24, Math.max(0, radius)) : 0;
  if (safeRadius <= 0) return [];

  const center = floorCenter(blockCenter);
  const height = dimension.heightRange;
  const minY = Math.max(center.y - safeRadius, height.min);
  const maxY = Math.min(center.y + safeRadius, height.max - 1);
  if (minY > maxY) return [];

  const queryVolume = new BlockVolume(
    { x: center.x - safeRadius, y: minY, z: center.z - safeRadius },
    { x: center.x + safeRadius, y: maxY, z: center.z + safeRadius },
  );
  let locations;
  try {
    // allowUnloadedChunks=true suppresses unloaded-chunk errors and only
    // queries positions in chunks that are already loaded; this never loads a chunk.
    locations = dimension.getBlocks(queryVolume, { includeTypes: LOOT_CONTAINER_TYPES }, true);
  } catch {
    return [];
  }

  const radiusSquared = safeRadius * safeRadius;
  const found = [];
  for (const location of locations.getBlockLocationIterator()) {
    const dx = location.x - center.x;
    const dy = location.y - center.y;
    const dz = location.z - center.z;
    if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
    if (isChestFinderContainerExcluded(dimension, location)) continue;

    try {
      const block = dimension.getBlock(location);
      if (!block || !LOOT_CONTAINER_TYPE_SET.has(block.typeId)) continue;
      const container = block.getComponent("minecraft:inventory")?.container;
      if (!container || container.emptySlotsCount !== container.size) continue;
      found.push({ x: location.x, y: location.y, z: location.z });
      if (found.length >= MAX_CONTAINER_MARKERS) break;
    } catch {
      // Ignore a block that becomes stale or inaccessible during this scan.
    }
  }
  return found;
}

/** @param {{x:number,y:number,z:number}} container */
function outlineMarkerLocations(container) {
  const low = GOLD_OUTLINE_MARGIN;
  const high = 1 - GOLD_OUTLINE_MARGIN;
  const points = [];
  for (const x of [low, high]) {
    for (const y of [low, high]) {
      for (const z of [low, high]) points.push({ x: container.x + x, y: container.y + y, z: container.z + z });
    }
  }
  for (const x of [low, high]) {
    for (const y of [low, high]) points.push({ x: container.x + x, y: container.y + y, z: container.z + 0.5 });
  }
  for (const x of [low, high]) {
    for (const z of [low, high]) points.push({ x: container.x + x, y: container.y + 0.5, z: container.z + z });
  }
  for (const y of [low, high]) {
    for (const z of [low, high]) points.push({ x: container.x + 0.5, y: container.y + y, z: container.z + z });
  }
  return points;
}

/** @param {{x:number,y:number,z:number}} point */
function markerKey(point) {
  return `${point.x.toFixed(3)},${point.y.toFixed(3)},${point.z.toFixed(3)}`;
}

/** @param {import("@minecraft/server").Player} player @param {(player:import("@minecraft/server").Player, location:{x:number,y:number,z:number})=>void} [onMarker] */
export function refreshChestFinderPlayer(player, onMarker) {
  const level = getStoredAugmentLevel(player, CHEST_FINDER_ID, CHEST_FINDER_MAX_LEVEL);
  const radius = chestFinderRadius(level);
  if (radius <= 0) return { level, radius, containers: [], markerCount: 0 };

  const containers = findUnconsumedLootContainers(player.dimension, floorCenter(player.location), radius);
  const sent = new Set();
  let markerCount = 0;
  for (const container of containers) {
    for (const marker of outlineMarkerLocations(container)) {
      const key = markerKey(marker);
      if (sent.has(key)) continue;
      sent.add(key);
      try {
        // Player.spawnParticle targets only this owner, keeping scans private in multiplayer.
        player.spawnParticle(CHEST_FINDER_PARTICLE_ID, marker);
        markerCount += 1;
        onMarker?.(player, marker);
      } catch {
        // The next bounded refresh retries transient client/chunk failures.
      }
    }
  }
  return { level, radius, containers, markerCount };
}

world.afterEvents.playerPlaceBlock.subscribe(event => {
  try {
    if (LOOT_CONTAINER_TYPE_SET.has(event.block.typeId)) {
      markChestFinderContainerExcluded(event.dimension, event.block.location);
    }
  } catch { /* A block can be replaced before the deferred callback is handled. */ }
});

world.afterEvents.blockContainerOpened.subscribe(event => {
  try {
    if (LOOT_CONTAINER_TYPE_SET.has(event.block.typeId)) {
      markChestFinderContainerExcluded(event.dimension, event.block.location);
    }
  } catch { /* A block can be removed while its container is opening. */ }
});

world.afterEvents.playerBreakBlock.subscribe(event => {
  try { clearChestFinderContainerMarker(event.dimension, event.block.location); } catch { /* A stale position is harmless. */ }
});

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try { refreshChestFinderPlayer(player); } catch { /* A player can leave during the bounded scan. */ }
  }
}, SCAN_INTERVAL_TICKS);
