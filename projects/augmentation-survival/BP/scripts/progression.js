import { Player } from "@minecraft/server";

export const LEVELS_KEY = "augmentation_survival:levels_v1";

/** @param {Player} player */
function levelsOf(player) {
  try {
    const raw = player.getDynamicProperty(LEVELS_KEY);
    if (typeof raw !== "string") return {};
    const levels = JSON.parse(raw);
    if (levels && typeof levels === "object" && !Array.isArray(levels)) return levels;
  } catch { /* Ignore corrupt save data; do not fail item use. */ }
  return {};
}

/** @param {Player} player @param {string} augmentId @param {number} maxLevel */
export function getStoredAugmentLevel(player, augmentId, maxLevel) {
  const level = Number(levelsOf(player)[augmentId]);
  return Number.isInteger(level) && level > 0 ? Math.min(level, maxLevel) : 0;
}

/**
 * Server-authoritative core-to-level transaction. The level is written first and
 * restored if the core cannot be removed, so callers never partially commit.
 * @param {Player} player
 * @param {string} coreId
 * @param {{id:string,max_level:number}} augment
 * @returns {{ok:true,level:number}|{ok:false,reason:"no_inventory"|"no_core"|"max_level"|"consume_failed"}}
 */
export function commitCoreSelection(player, coreId, augment) {
  if (!(player instanceof Player)) return { ok: false, reason: "no_inventory" };
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return { ok: false, reason: "no_inventory" };

  let total = 0;
  for (let slot = 0; slot < inventory.size; slot += 1) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId === coreId) total += stack.amount;
  }
  if (total < 1) return { ok: false, reason: "no_core" };

  const levels = levelsOf(player);
  const current = Number(levels[augment.id]);
  const previousLevel = Number.isInteger(current) && current > 0 ? Math.min(current, augment.max_level) : 0;
  if (previousLevel >= augment.max_level) return { ok: false, reason: "max_level" };

  const previousState = player.getDynamicProperty(LEVELS_KEY);
  const nextLevel = previousLevel + 1;
  levels[augment.id] = nextLevel;
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));

  for (let slot = 0; slot < inventory.size; slot += 1) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId !== coreId) continue;
    if (stack.amount === 1) inventory.setItem(slot, undefined);
    else {
      stack.amount -= 1;
      inventory.setItem(slot, stack);
    }
    return { ok: true, level: nextLevel };
  }

  player.setDynamicProperty(LEVELS_KEY, previousState);
  return { ok: false, reason: "consume_failed" };
}
