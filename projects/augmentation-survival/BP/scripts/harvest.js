import { ItemStack, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const BUMPER_CROP = "augmentation_survival:bumper_crop";
const BUMPER_CROP_MAX_LEVEL = 5;
const BUMPER_CROP_CHANCE_PER_LEVEL = 0.08;
const SEED_SAVER = "augmentation_survival:seed_saver";
const SEED_SAVER_MAX_LEVEL = 3;
const SEED_SAVER_CHANCE_PER_LEVEL = 0.15;
const EXTRA_PIECE = "augmentation_survival:extra_piece";
const EXTRA_PIECE_MAX_LEVEL = 3;
const EXTRA_PIECE_CHANCE_PER_LEVEL = 0.05;
const CORE_ITEM_IDS = new Set([
  "augmentation_survival:common_augment_core",
  "augmentation_survival:uncommon_augment_core",
  "augmentation_survival:rare_augment_core",
  "augmentation_survival:epic_augment_core",
  "augmentation_survival:legendary_augment_core",
  "augmentation_survival:mythic_augment_core",
]);

// Bedrock's built-in block tags are used when available. Keep the vanilla
// ore IDs as a fallback because tag exposure differs across engine builds.
const VANILLA_ORES = new Set([
  "minecraft:coal_ore", "minecraft:deepslate_coal_ore",
  "minecraft:copper_ore", "minecraft:deepslate_copper_ore",
  "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
  "minecraft:emerald_ore", "minecraft:deepslate_emerald_ore",
  "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
  "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
  "minecraft:lapis_ore", "minecraft:deepslate_lapis_ore",
  "minecraft:redstone_ore", "minecraft:deepslate_redstone_ore",
  "minecraft:nether_quartz_ore", "minecraft:nether_gold_ore",
  "minecraft:ancient_debris",
]);

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

/** @param {number} level */
export function extraPieceBonusChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, EXTRA_PIECE_MAX_LEVEL) * EXTRA_PIECE_CHANCE_PER_LEVEL;
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

/** @param {import("@minecraft/server").BlockPermutation} permutation */
function isOre(permutation) {
  const blockId = permutation.type.id;
  if (VANILLA_ORES.has(blockId)) return true;
  try {
    return permutation.hasTag("ore") || permutation.hasTag("ores");
  } catch {
    return false;
  }
}

/** @param {ItemStack[]} drops */
function firstOrdinaryDrop(drops) {
  return drops.find(drop => !CORE_ITEM_IDS.has(drop.typeId));
}

/**
 * Mirror Java's post-break ore-tag and first-ordinary-drop roll. The stable
 * after-event keeps the pre-break permutation and tool; the stable loot table
 * manager recalculates the same block/tool drop contract Java queries after
 * the break, including Silk Touch and Fortune.
 * @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event
 * @param {() => number} [random]
 * @returns {boolean} whether one item was spawned
 */
export function applyExtraPieceBonus(event, random = Math.random) {
  if (!isOre(event.brokenBlockPermutation)) return false;
  const level = getStoredAugmentLevel(event.player, EXTRA_PIECE, EXTRA_PIECE_MAX_LEVEL);
  const chance = extraPieceBonusChance(level);
  if (chance <= 0 || !passesChance(chance, random)) return false;

  const drops = world.getLootTableManager().generateLootFromBlockPermutation(
    event.brokenBlockPermutation,
    event.itemStackBeforeBreak,
  );
  const primary = drops && firstOrdinaryDrop(drops);
  if (!primary) return false;

  const one = primary.clone();
  one.amount = 1;
  event.dimension.spawnItem(one, event.block.location);
  return true;
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  applyCropHarvestBonuses(event);
  applyExtraPieceBonus(event);
});
