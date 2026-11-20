export const MAX_LEVEL = 50;

export const CLASS_DATA = Object.freeze({
  guardian: Object.freeze({ name: "수호자", skill: "수호의 외침" }),
  hunter: Object.freeze({ name: "추적자", skill: "약점 사격" }),
  arcanist: Object.freeze({ name: "원소술사", skill: "잿불 폭발" }),
});

export function createProfile() {
  return {
    schema: 1,
    level: 1,
    xp: 0,
    classId: "",
    nextSkillAt: 0,
    pendingRewards: [],
    processedEvents: [],
  };
}

export function xpToNextLevel(level) {
  return 90 + Math.max(0, level - 1) * 35;
}

export function addExperience(profile, amount) {
  if (!Number.isFinite(amount) || amount <= 0 || profile.level >= MAX_LEVEL) return 0;
  profile.xp += Math.floor(amount);
  let gained = 0;
  while (profile.level < MAX_LEVEL && profile.xp >= xpToNextLevel(profile.level)) {
    profile.xp -= xpToNextLevel(profile.level);
    profile.level += 1;
    gained += 1;
  }
  if (profile.level === MAX_LEVEL) profile.xp = Math.min(profile.xp, xpToNextLevel(MAX_LEVEL) - 1);
  return gained;
}

export function rarityForRoll(roll) {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 100) throw new RangeError("roll must be in [0, 100)");
  if (roll < 40) return "common";
  if (roll < 70) return "uncommon";
  if (roll < 90) return "rare";
  if (roll < 98) return "epic";
  return "legendary";
}

export function bladeItemId(rarity) {
  if (!["common", "uncommon", "rare", "epic", "legendary"].includes(rarity)) {
    throw new RangeError(`unknown blade rarity: ${rarity}`);
  }
  return `gtrpg:ember_blade_${rarity}`;
}
