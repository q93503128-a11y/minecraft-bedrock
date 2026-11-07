import { system, world } from "@minecraft/server";
import { isOreBlock } from "./harvest.js";
import { getStoredAugmentLevel } from "./progression.js";
import { blockOutlineBounds, outlineMarkerLocations, perceptionMarkerKey } from "./perception-outline.js";

export const ORE_SENSE_ID = "augmentation_survival:ore_sense";
export const ORE_SENSE_MAX_LEVEL = 3;
export const ORE_SENSE_PARTICLE_ID = "augmentation_survival:ore_sense_marker";
const ORE_SENSE_RADIUS = [0, 6, 8, 10];
const SCAN_INTERVAL_TICKS = 10;

// Stable Script API does not expose a block collision shape. These vanilla
// blocks have empty collision and therefore reveal adjacent Java ore shapes.
// Other solid/partial blocks remain opaque; custom collisionless blocks need
// an explicit vanilla mapping or a future Bedrock tag contract.
const EMPTY_COLLISION_NEIGHBOR_IDS = new Set([
  "minecraft:activator_rail", "minecraft:detector_rail", "minecraft:rail", "minecraft:golden_rail",
  "minecraft:fire", "minecraft:soul_fire", "minecraft:cobweb", "minecraft:redstone_wire", "minecraft:tripwire",
  "minecraft:ladder", "minecraft:vine", "minecraft:glow_lichen", "minecraft:spore_blossom",
  "minecraft:short_grass", "minecraft:tall_grass", "minecraft:fern", "minecraft:large_fern", "minecraft:deadbush",
  "minecraft:brown_mushroom", "minecraft:red_mushroom", "minecraft:crimson_fungus", "minecraft:warped_fungus",
  "minecraft:crimson_roots", "minecraft:warped_roots", "minecraft:nether_sprouts",
  "minecraft:dandelion", "minecraft:poppy", "minecraft:blue_orchid", "minecraft:allium", "minecraft:azure_bluet",
  "minecraft:red_tulip", "minecraft:orange_tulip", "minecraft:white_tulip", "minecraft:pink_tulip",
  "minecraft:oxeye_daisy", "minecraft:cornflower", "minecraft:lily_of_the_valley", "minecraft:torchflower",
  "minecraft:pink_petals", "minecraft:wildflowers", "minecraft:closed_eyeblossom", "minecraft:open_eyeblossom",
  "minecraft:sunflower", "minecraft:lilac", "minecraft:rose_bush", "minecraft:peony",
  "minecraft:torch", "minecraft:wall_torch", "minecraft:redstone_torch", "minecraft:wall_redstone_torch",
  "minecraft:soul_torch", "minecraft:soul_wall_torch",
  "minecraft:oak_sign", "minecraft:spruce_sign", "minecraft:birch_sign", "minecraft:jungle_sign",
  "minecraft:acacia_sign", "minecraft:dark_oak_sign", "minecraft:mangrove_sign", "minecraft:cherry_sign",
  "minecraft:pale_oak_sign", "minecraft:bamboo_sign", "minecraft:crimson_sign", "minecraft:warped_sign",
  "minecraft:oak_hanging_sign", "minecraft:spruce_hanging_sign", "minecraft:birch_hanging_sign",
  "minecraft:jungle_hanging_sign", "minecraft:acacia_hanging_sign", "minecraft:dark_oak_hanging_sign",
  "minecraft:mangrove_hanging_sign", "minecraft:cherry_hanging_sign", "minecraft:pale_oak_hanging_sign",
  "minecraft:bamboo_hanging_sign", "minecraft:crimson_hanging_sign", "minecraft:warped_hanging_sign",
  "minecraft:sugar_cane", "minecraft:reeds", "minecraft:seagrass", "minecraft:tall_seagrass",
  "minecraft:kelp", "minecraft:kelp_plant", "minecraft:sea_pickle", "minecraft:lily_pad",
  "minecraft:wheat", "minecraft:carrots", "minecraft:potatoes", "minecraft:beetroot", "minecraft:nether_wart",
  "minecraft:melon_stem", "minecraft:pumpkin_stem", "minecraft:attached_melon_stem", "minecraft:attached_pumpkin_stem",
  "minecraft:torchflower_crop", "minecraft:weeping_vines", "minecraft:twisting_vines", "minecraft:cave_vines",
  "minecraft:cave_vines_body_with_berries", "minecraft:hanging_roots",
]);

const NEIGHBOR_OFFSETS = [
  { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
];

/** @param {number} level */
export function oreSenseRadius(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return ORE_SENSE_RADIUS[Math.min(level, ORE_SENSE_MAX_LEVEL)];
}

/** @param {{x:number,y:number,z:number}} center */
function floorCenter(center) {
  return { x: Math.floor(center.x), y: Math.floor(center.y), z: Math.floor(center.z) };
}

/** @param {number} chunkX @param {number} chunkZ */
function chunkKey(chunkX, chunkZ) {
  return `${chunkX},${chunkZ}`;
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} center @param {number} radius */
function loadedChunkKeys(dimension, center, radius) {
  const chunks = new Set();
  const minChunkX = Math.floor((center.x - radius) / 16);
  const maxChunkX = Math.floor((center.x + radius) / 16);
  const minChunkZ = Math.floor((center.z - radius) / 16);
  const maxChunkZ = Math.floor((center.z + radius) / 16);
  for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
    for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ += 1) {
      const sample = { x: chunkX * 16 + 8, y: center.y, z: chunkZ * 16 + 8 };
      try {
        if (dimension.isChunkLoaded(sample)) chunks.add(chunkKey(chunkX, chunkZ));
      } catch {
        // A chunk probe must never cause the scanner to request a chunk load.
      }
    }
  }
  return chunks;
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} location @param {Set<string>} loadedChunks */
function getLoadedBlock(dimension, location, loadedChunks) {
  const key = chunkKey(Math.floor(location.x / 16), Math.floor(location.z / 16));
  let isLoaded = loadedChunks.has(key);
  if (!isLoaded) {
    try { isLoaded = dimension.isChunkLoaded(location); } catch { return undefined; }
  }
  if (!isLoaded) return undefined;
  try { return dimension.getBlock(location); } catch { return undefined; }
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} position @param {Set<string>} loadedChunks */
function isExposedOre(dimension, position, loadedChunks) {
  for (const offset of NEIGHBOR_OFFSETS) {
    const neighborPosition = { x: position.x + offset.x, y: position.y + offset.y, z: position.z + offset.z };
    const neighbor = getLoadedBlock(dimension, neighborPosition, loadedChunks);
    if (!neighbor) continue;
    try {
      if (neighbor.isAir || neighbor.isLiquid || EMPTY_COLLISION_NEIGHBOR_IDS.has(neighbor.typeId)) return true;
    } catch {
      // Stale/unloaded block references are opaque for this sample.
    }
  }
  return false;
}

/**
 * Scan only the player's loaded local chunks, matching the Java's spherical
 * block-position radius and requiring at least one collisionless face.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {{x:number,y:number,z:number}} blockCenter
 * @param {number} radius
 */
export function findExposedOreBlocks(dimension, blockCenter, radius) {
  const safeRadius = Number.isInteger(radius) ? Math.min(10, Math.max(0, radius)) : 0;
  if (safeRadius <= 0) return [];
  const center = floorCenter(blockCenter);
  const centerRadiusSquared = safeRadius * safeRadius;
  const chunks = loadedChunkKeys(dimension, center, safeRadius);
  if (chunks.size === 0) return [];

  const height = dimension.heightRange;
  const minY = Math.max(center.y - safeRadius, height.min);
  const maxY = Math.min(center.y + safeRadius, height.max - 1);
  const found = [];
  for (let x = center.x - safeRadius; x <= center.x + safeRadius; x += 1) {
    const chunkX = Math.floor(x / 16);
    for (let z = center.z - safeRadius; z <= center.z + safeRadius; z += 1) {
      if (!chunks.has(chunkKey(chunkX, Math.floor(z / 16)))) continue;
      const dz = z - center.z;
      for (let y = minY; y <= maxY; y += 1) {
        const dx = x - center.x;
        const dy = y - center.y;
        if (dx * dx + dy * dy + dz * dz > centerRadiusSquared) continue;
        const position = { x, y, z };
        const block = getLoadedBlock(dimension, position, chunks);
        if (!block) continue;
        try {
          if (isOreBlock(block.permutation) && isExposedOre(dimension, position, chunks)) found.push(position);
        } catch {
          // A block that becomes invalid during a scan is skipped until next refresh.
        }
      }
    }
  }
  return found;
}

/** @param {import("@minecraft/server").Player} player @param {(player:import("@minecraft/server").Player, location:{x:number,y:number,z:number})=>void} [onMarker] */
export function refreshOreSensePlayer(player, onMarker) {
  const level = getStoredAugmentLevel(player, ORE_SENSE_ID, ORE_SENSE_MAX_LEVEL);
  const radius = oreSenseRadius(level);
  if (radius <= 0) return { level, radius, oreBlocks: [], markerCount: 0 };

  const center = floorCenter(player.location);
  const oreBlocks = findExposedOreBlocks(player.dimension, center, radius);
  const sent = new Set();
  let markerCount = 0;
  for (const ore of oreBlocks) {
    for (const marker of outlineMarkerLocations(blockOutlineBounds(ore, 0.018))) {
      const key = perceptionMarkerKey(marker);
      if (sent.has(key)) continue;
      sent.add(key);
      try {
        // Player.spawnParticle is owner-only; nearby players do not receive this marker.
        player.spawnParticle(ORE_SENSE_PARTICLE_ID, marker);
        markerCount += 1;
        onMarker?.(player, marker);
      } catch {
        // The next bounded refresh retries transient client/chunk failures.
      }
    }
  }
  return { level, radius, oreBlocks, markerCount };
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try { refreshOreSensePlayer(player); } catch { /* A player can leave during the bounded scan. */ }
  }
}, SCAN_INTERVAL_TICKS);
