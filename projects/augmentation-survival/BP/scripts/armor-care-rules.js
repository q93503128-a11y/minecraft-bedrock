const ARMOR_CARE_MAX_LEVEL = 5;
const ARMOR_CARE_CHANCE_PER_LEVEL = 0.05;

/** @param {number} level */
export function armorCareChance(level) {
  const boundedLevel = Number.isInteger(level) ? Math.max(0, Math.min(ARMOR_CARE_MAX_LEVEL, level)) : 0;
  return ARMOR_CARE_CHANCE_PER_LEVEL * boundedLevel;
}

/** @param {number} level @param {number} randomValue */
export function armorCareRollSucceeds(level, randomValue) {
  const chance = armorCareChance(level);
  return chance > 0 && Number.isFinite(randomValue) && randomValue >= 0 && randomValue < chance;
}
