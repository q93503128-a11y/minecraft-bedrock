import { Player, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

export const NIGHT_VISION_ID = "augmentation_survival:night_vision";
export const NIGHT_VISION_REFRESH_DURATION_TICKS = 600;
export const NIGHT_VISION_REFRESH_THRESHOLD_TICKS = 220;

/** @param {number|undefined} currentDurationTicks */
export function shouldRefreshNightVision(currentDurationTicks) {
  return currentDurationTicks === undefined
    || !Number.isFinite(currentDurationTicks)
    || currentDurationTicks <= NIGHT_VISION_REFRESH_THRESHOLD_TICKS;
}

/**
 * Reconcile the owned passive with the native Bedrock effect. This only writes
 * a status effect; it does not modify block light, sky light, or spawn rules.
 * @param {Player} player
 */
export function reconcileNightVision(player) {
  try {
    if (!player.isValid || getStoredAugmentLevel(player, NIGHT_VISION_ID, 1) <= 0) return false;
    const current = player.getEffect("night_vision");
    if (!shouldRefreshNightVision(current?.duration)) return false;
    player.addEffect("night_vision", NIGHT_VISION_REFRESH_DURATION_TICKS, {
      amplifier: 0,
      showParticles: false,
    });
    return true;
  } catch {
    // A player can disconnect between a world scan and this effect write.
    return false;
  }
}

export function reconcileOnlineNightVision() {
  for (const player of world.getPlayers()) reconcileNightVision(player);
}
