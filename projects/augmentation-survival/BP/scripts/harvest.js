import { ItemStack, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";
import { REPLANT_CROPS } from "./crop-catalog.js";

const BUMPER_CROP = "augmentation_survival:bumper_crop";
const BUMPER_CROP_MAX_LEVEL = 5;
const BUMPER_CROP_CHANCE_PER_LEVEL = 0.08;
const SEED_SAVER = "augmentation_survival:seed_saver";
const SEED_SAVER_MAX_LEVEL = 3;
const SEED_SAVER_CHANCE_PER_LEVEL = 0.15;
const EXTRA_PIECE = "augmentation_survival:extra_piece";
const EXTRA_PIECE_MAX_LEVEL = 3;
const EXTRA_PIECE_CHANCE_PER_LEVEL = 0.05;
const DEXTERITY = "augmentation_survival:dexterity";
const DEXTERITY_MAX_LEVEL = 3;
const DEXTERITY_CHANCE_PER_LEVEL = 0.10;
const ABUNDANCE_EXCLUDED_TAG = "augmentation_survival:abundance_excluded";
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

// Java's block tags are queried natively there. Bedrock exposes engine tags
// through BlockPermutation.hasTag, with explicit vanilla fallbacks to cover
// stable builds whose tag names differ or are not surfaced to scripts.
const VANILLA_DEXTERITY_BLOCKS = new Set([
  "minecraft:bamboo", "minecraft:sugar_cane", "minecraft:cactus",
  "minecraft:brown_mushroom", "minecraft:red_mushroom", "minecraft:vine",
  "minecraft:glow_lichen", "minecraft:kelp", "minecraft:kelp_plant",
  "minecraft:seagrass", "minecraft:tall_seagrass", "minecraft:sweet_berry_bush",
  "minecraft:cocoa",
  "minecraft:oak_leaves", "minecraft:spruce_leaves", "minecraft:birch_leaves",
  "minecraft:jungle_leaves", "minecraft:acacia_leaves", "minecraft:dark_oak_leaves",
  "minecraft:mangrove_leaves", "minecraft:cherry_leaves", "minecraft:azalea_leaves",
  "minecraft:flowering_azalea_leaves", "minecraft:pale_oak_leaves",
  "minecraft:dandelion", "minecraft:poppy", "minecraft:blue_orchid", "minecraft:allium",
  "minecraft:azure_bluet", "minecraft:red_tulip", "minecraft:orange_tulip",
  "minecraft:white_tulip", "minecraft:pink_tulip", "minecraft:oxeye_daisy",
  "minecraft:cornflower", "minecraft:lily_of_the_valley", "minecraft:sunflower",
  "minecraft:lilac", "minecraft:rose_bush", "minecraft:peony", "minecraft:torchflower",
  "minecraft:pink_petals", "minecraft:wildflowers", "minecraft:closed_eyeblossom",
  "minecraft:open_eyeblossom",
]);

// Bonus drops have been verified for these four ordinary crops. Torchflower
// participates in Replant, but its non-food CropBlock drop needs separate
// bonus-yield parity evidence before joining this established map.
const VANILLA_CROPS = new Map([...REPLANT_CROPS]
  .filter(([, crop]) => crop.harvestBonuses)
  .map(([blockId, crop]) => [blockId, {
    maxAge: crop.maxAge,
    product: crop.product,
    plantingItem: crop.plantingItem,
  }]));

/** @type {(player: import("@minecraft/server").Player) => number} */
let cropHarvestRandomProvider = () => Math.random();

/** Test-pack seam; normal play always keeps the Math.random provider. @param {(player: import("@minecraft/server").Player) => number} provider */
export function setCropHarvestRandomProvider(provider) {
  cropHarvestRandomProvider = typeof provider === "function" ? provider : () => Math.random();
}

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

/** @param {number} level */
export function dexterityBonusChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, DEXTERITY_MAX_LEVEL) * DEXTERITY_CHANCE_PER_LEVEL;
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
export function isOreBlock(permutation) {
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
  if (!isOreBlock(event.brokenBlockPermutation)) return false;
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

/** @param {import("@minecraft/server").BlockPermutation} permutation */
export function isDexterityGatheringBlock(permutation) {
  if (VANILLA_DEXTERITY_BLOCKS.has(permutation.type.id)) return true;
  try {
    return permutation.hasTag("leaves")
      || permutation.hasTag("flowers")
      || permutation.hasTag("flower");
  } catch {
    return false;
  }
}

/** @param {import("@minecraft/server").ItemStack | undefined} stack */
export function isEligibleDexterityDrop(stack) {
  if (!stack || !stack.typeId || stack.maxAmount <= 1 || CORE_ITEM_IDS.has(stack.typeId)) return false;
  try {
    if (!stack.isStackable || stack.hasComponent("minecraft:durability")) return false;
    if (stack.nameTag || stack.getLore().length > 0) return false;
    if (stack.hasTag(ABUNDANCE_EXCLUDED_TAG)) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * Java rolls once for a whitelisted player break and copies one eligible stack
 * that actually reaches Block.popResource. Stable Bedrock only exposes the
 * pre-break block/tool in its after-event, so this partial route re-runs that
 * block's loot table and copies the first eligible generated stack.
 * @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event
 * @param {() => number} [random]
 * @returns {boolean} whether one item was spawned
 */
export function applyDexterityGatheringBonus(event, random = Math.random) {
  if (!isDexterityGatheringBlock(event.brokenBlockPermutation)) return false;

  const level = getStoredAugmentLevel(event.player, DEXTERITY, DEXTERITY_MAX_LEVEL);
  const chance = dexterityBonusChance(level);
  if (chance <= 0 || !passesChance(chance, random)) return false;

  const drops = world.getLootTableManager().generateLootFromBlockPermutation(
    event.brokenBlockPermutation,
    event.itemStackBeforeBreak,
  );
  const primary = drops?.find(isEligibleDexterityDrop);
  if (!primary) return false;

  const one = primary.clone();
  one.amount = 1;
  event.dimension.spawnItem(one, event.block.location);
  return true;
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  applyCropHarvestBonuses(event, () => cropHarvestRandomProvider(event.player));
  applyExtraPieceBonus(event);
  applyDexterityGatheringBonus(event);
});
