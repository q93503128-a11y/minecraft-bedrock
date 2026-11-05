import { ItemStack, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const BUMPER_CROP = "augmentation_survival:bumper_crop";
const BUMPER_CROP_MAX_LEVEL = 5;
const BUMPER_CROP_CHANCE_PER_LEVEL = 0.08;

// These vanilla crops have a stable Bedrock growth state and known ordinary
// product. Unknown or external crop drops are left untouched.
const VANILLA_CROPS = new Map([
  ["minecraft:wheat", { maxAge: 7, product: "minecraft:wheat" }],
  ["minecraft:carrots", { maxAge: 7, product: "minecraft:carrot" }],
  ["minecraft:potatoes", { maxAge: 7, product: "minecraft:potato" }],
  ["minecraft:beetroot", { maxAge: 3, product: "minecraft:beetroot" }],
]);

/** @param {number} level */
export function bumperCropBonusChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, BUMPER_CROP_MAX_LEVEL) * BUMPER_CROP_CHANCE_PER_LEVEL;
}

/**
 * Reproduce Java's mature-CropBlock bonus for mapped vanilla crops. The
 * optional roll source is only for deterministic engine verification.
 * @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event
 * @param {() => number} [random]
 * @returns {boolean} whether the bonus item was spawned
 */
export function applyBumperCropHarvest(event, random = Math.random) {
  const crop = VANILLA_CROPS.get(event.brokenBlockPermutation.type.id);
  if (!crop) return false;

  const states = event.brokenBlockPermutation.getAllStates();
  const age = states.growth ?? states.age;
  if (typeof age !== "number" || age < crop.maxAge) return false;

  const level = getStoredAugmentLevel(event.player, BUMPER_CROP, BUMPER_CROP_MAX_LEVEL);
  const chance = bumperCropBonusChance(level);
  if (chance <= 0) return false;

  const roll = random();
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1 || roll >= chance) return false;

  event.dimension.spawnItem(new ItemStack(crop.product, 1), event.block.location);
  return true;
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  applyBumperCropHarvest(event);
});
