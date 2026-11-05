import { ItemStack, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const BUMPER_CROP = "augmentation_survival:bumper_crop";
const BUMPER_CROP_MAX_LEVEL = 5;
const BUMPER_CROP_CHANCE_PER_LEVEL = 0.08;
const SEED_SAVER = "augmentation_survival:seed_saver";
const SEED_SAVER_MAX_LEVEL = 3;
const SEED_SAVER_CHANCE_PER_LEVEL = 0.15;

// These vanilla crops have a stable Bedrock growth state, ordinary product,
// and planting item. Unknown or external crop drops are left untouched.
const VANILLA_CROPS = new Map([
  ["minecraft:wheat", { maxAge: 7, product: "minecraft:wheat", plantingItem: "minecraft:wheat_seeds" }],
  ["minecraft:carrots", { maxAge: 7, product: "minecraft:carrot", plantingItem: "minecraft:carrot" }],
  ["minecraft:potatoes", { maxAge: 7, product: "minecraft:potato", plantingItem: "minecraft:potato" }],
  ["minecraft:beetroot", { maxAge: 3, product: "minecraft:beetroot", plantingItem: "minecraft:beetroot_seeds" }],
]);

/** @param {number} level */
export function bumperCropBonusChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, BUMPER_CROP_MAX_LEVEL) * BUMPER_CROP_CHANCE_PER_LEVEL;
}

/** @param {number} level */
export function seedSaverBonusChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, SEED_SAVER_MAX_LEVEL) * SEED_SAVER_CHANCE_PER_LEVEL;
}

/** @param {number} chance @param {() => number} random */
function passesChance(chance, random) {
  const roll = random();
  return Number.isFinite(roll) && roll >= 0 && roll < 1 && roll < chance;
}

/**
 * Reproduce Java's independent mature-CropBlock rolls for mapped vanilla
 * crops. The optional roll source is only for deterministic engine verification.
 * @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event
 * @param {() => number} [random]
 * @returns {boolean} whether any bonus item was spawned
 */
export function applyCropHarvestBonuses(event, random = Math.random) {
  const crop = VANILLA_CROPS.get(event.brokenBlockPermutation.type.id);
  if (!crop) return false;

  const states = event.brokenBlockPermutation.getAllStates();
  const age = states.growth ?? states.age;
  if (typeof age !== "number" || age < crop.maxAge) return false;

  let spawned = false;
  const bumperLevel = getStoredAugmentLevel(event.player, BUMPER_CROP, BUMPER_CROP_MAX_LEVEL);
  const bumperChance = bumperCropBonusChance(bumperLevel);
  if (bumperChance > 0 && passesChance(bumperChance, random)) {
    event.dimension.spawnItem(new ItemStack(crop.product, 1), event.block.location);
    spawned = true;
  }

  const seedLevel = getStoredAugmentLevel(event.player, SEED_SAVER, SEED_SAVER_MAX_LEVEL);
  const seedChance = seedSaverBonusChance(seedLevel);
  if (crop.plantingItem && seedChance > 0 && passesChance(seedChance, random)) {
    event.dimension.spawnItem(new ItemStack(crop.plantingItem, 1), event.block.location);
    spawned = true;
  }
  return spawned;
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  applyCropHarvestBonuses(event);
});
