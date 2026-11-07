export const ARROW_SAVER_ID = "augmentation_survival:arrow_saver";
export const ARROW_SAVER_MAX_LEVEL = 3;
export const ARROW_SAVER_CHANCE_PER_LEVEL = 0.10;

const ARROW_TYPE_IDS = new Set([
  "minecraft:arrow",
]);

/** @param {number} level */
export function arrowSaverChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, ARROW_SAVER_MAX_LEVEL) * ARROW_SAVER_CHANCE_PER_LEVEL;
}

/** @param {number} level @param {number} roll */
export function arrowSaverRollSucceeds(level, roll) {
  const chance = arrowSaverChance(level);
  return chance > 0 && Number.isFinite(roll) && roll >= 0 && roll < chance;
}

/** @param {string | undefined} typeId */
export function isVanillaArrow(typeId) {
  return typeof typeId === "string" && ARROW_TYPE_IDS.has(typeId);
}

/** @param {import("@minecraft/server").ItemStack | undefined} before @param {import("@minecraft/server").ItemStack | undefined} after */
export function consumedExactlyOneArrow(before, after) {
  if (!before || !isVanillaArrow(before.typeId)) return false;
  const afterAmount = after?.typeId === before.typeId ? after.amount : 0;
  return before.amount - afterAmount === 1;
}
