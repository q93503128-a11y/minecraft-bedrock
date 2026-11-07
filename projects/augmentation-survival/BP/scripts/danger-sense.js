import { system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";
import { outlineMarkerLocations, perceptionMarkerKey } from "./perception-outline.js";

export const DANGER_SENSE_ID = "augmentation_survival:danger_sense";
export const DANGER_SENSE_PARTICLE_ID = "augmentation_survival:danger_sense_marker";
export const DOMINATED_HOSTILE_TAG = "augmentation_survival:dominated";
const DANGER_SENSE_MAX_LEVEL = 3;
const DANGER_SENSE_RADIUS = [0, 8, 12, 16];
const SCAN_INTERVAL_TICKS = 10;
const MAX_DANGER_TARGETS = 256;
const QUERY_FAMILIES = ["monster", "boss"];
const OUTLINE_INSET = 0.035;

/** @param {number} level */
export function dangerSenseRadius(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return DANGER_SENSE_RADIUS[Math.min(level, DANGER_SENSE_MAX_LEVEL)];
}

/** @param {import("@minecraft/server").Dimension} dimension @param {{x:number,y:number,z:number}} center @param {number} radius */
export function findDangerSenseHostiles(dimension, center, radius) {
  const safeRadius = Number.isInteger(radius) ? Math.min(16, Math.max(0, radius)) : 0;
  if (safeRadius <= 0) return [];

  const radiusSquared = safeRadius * safeRadius;
  const candidates = new Map();
  for (const family of QUERY_FAMILIES) {
    let queried = [];
    try {
      queried = dimension.getEntities({
        families: [family],
        excludeTags: [DOMINATED_HOSTILE_TAG],
        location: center,
        maxDistance: safeRadius + 0.01,
        closest: MAX_DANGER_TARGETS,
      });
    } catch {
      continue;
    }

    for (const entity of queried) {
      try {
        if (!entity.isValid || entity.typeId === "minecraft:player" || entity.hasTag(DOMINATED_HOSTILE_TAG)) continue;
        const health = entity.getComponent("minecraft:health");
        const families = entity.getComponent("minecraft:type_family");
        if (!health || health.currentValue <= 0 || !families || !families.hasTypeFamily(family)) continue;
        const location = entity.location;
        const dx = location.x - center.x;
        const dy = location.y - center.y;
        const dz = location.z - center.z;
        if (dx * dx + dy * dy + dz * dz > radiusSquared) continue;
        candidates.set(entity.id, { entity, distanceSquared: dx * dx + dy * dy + dz * dz });
      } catch {
        // Invalid or disappearing entities are excluded until the next scan.
      }
    }
  }

  return [...candidates.values()]
    .sort((left, right) => left.distanceSquared - right.distanceSquared)
    .slice(0, MAX_DANGER_TARGETS)
    .map(candidate => candidate.entity);
}

/** @param {import("@minecraft/server").Player} player @param {(player:import("@minecraft/server").Player, entity:import("@minecraft/server").Entity, location:{x:number,y:number,z:number})=>void} [onMarker] */
export function refreshDangerSensePlayer(player, onMarker) {
  const level = getStoredAugmentLevel(player, DANGER_SENSE_ID, DANGER_SENSE_MAX_LEVEL);
  const radius = dangerSenseRadius(level);
  if (radius <= 0) return { level, radius, hostiles: [], markerCount: 0 };

  const center = player.location;
  const hostiles = findDangerSenseHostiles(player.dimension, center, radius);
  const sent = new Set();
  let markerCount = 0;
  for (const entity of hostiles) {
    try {
      for (const marker of outlineMarkerLocations(entity.getAABB(), OUTLINE_INSET)) {
        const key = perceptionMarkerKey(marker);
        if (sent.has(key)) continue;
        sent.add(key);
        try {
          // Stable Player.spawnParticle sends this marker to the owner only.
          player.spawnParticle(DANGER_SENSE_PARTICLE_ID, marker);
          markerCount += 1;
          onMarker?.(player, entity, marker);
        } catch {
          // A later ten-tick refresh retries a transient client/chunk failure.
        }
      }
    } catch {
      // An entity can despawn between the query and its collision-bounds read.
    }
  }
  return { level, radius, hostiles, markerCount };
}

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    try { refreshDangerSensePlayer(player); } catch { /* A player can leave during the query. */ }
  }
}, SCAN_INTERVAL_TICKS);
