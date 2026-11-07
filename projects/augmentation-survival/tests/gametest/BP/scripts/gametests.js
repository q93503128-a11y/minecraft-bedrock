import { BlockPermutation, EnchantmentTypes, EntityComponentTypes, EntityDamageCause, EquipmentSlot, GameMode, InputButton, ItemStack, Player, system, world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { AUGMENTS } from "./augment-data.js";
import { synthesizeCore } from "./cores.js";
import { armorCareChance, armorCareRollSucceeds } from "./armor-care-rules.js";
import { applyCropHarvestBonuses, applyDexterityGatheringBonus, applyExtraPieceBonus, bumperCropBonusChance, dexterityBonusChance, extraPieceBonusChance, isDexterityGatheringBlock, isEligibleDexterityDrop, seedSaverBonusChance } from "./harvest.js";
import { listAvailableCandidates } from "./offers.js";
import { tryMantle } from "./movement.js";
import { pickupHandRadius } from "./pickup-hand.js";
import { LEVELS_KEY } from "./progression.js";
import { toolCareChance, toolCareRollSucceeds, tryPreventBlockToolDamage } from "./tool-care.js";
import { isAugmentCore, lootScoopChance, lootScoopRollSucceeds, processLootScoopDeath } from "./loot-scoop.js";

const TAG = "augmentation_survival";
const STRUCTURE = "gametests:glass_cells";
const CORE = "augmentation_survival:common_augment_core";
const NEXT_CORE = "augmentation_survival:uncommon_augment_core";
const ENABLED_CANDIDATE_IDS = [
  "augmentation_survival:keen_edge",
  "augmentation_survival:precise_aim",
  "augmentation_survival:tough_skin",
  "augmentation_survival:light_landing",
  "augmentation_survival:strong_lungs",
  "augmentation_survival:bumper_crop",
  "augmentation_survival:seed_saver",
  "augmentation_survival:hearty_meal",
  "augmentation_survival:webbed_feet",
  "augmentation_survival:quick_feet",
];

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function inventoryOf(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  ensure(inventory, "Simulated player inventory was unavailable.");
  return inventory;
}

function countItem(inventory, typeId) {
  let count = 0;
  for (let slot = 0; slot < inventory.size; slot += 1) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId === typeId) count += stack.amount;
  }
  return count;
}

function countDroppedItem(dimension, location, typeId) {
  return dimension.getEntities({
    type: "minecraft:item",
    location,
    maxDistance: 4,
  }).reduce((count, entity) => {
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    return count + (stack?.typeId === typeId ? stack.amount : 0);
  }, 0);
}

world.afterEvents.playerBreakBlock.subscribe(event => {
  const { player } = event;
  try {
    if (player.name === "ASExtraPieceBreak") player.addTag("as_test_extra_piece_break_event");
    if (player.name === "ASToolCareLive") player.addTag("as_test_tool_care_break_event");
    if (player.name === "ASDexterityBreak" && event.brokenBlockPermutation.type.id === "minecraft:dandelion") {
      player.addTag("as_test_dexterity_break_event");
    }
  } catch { /* A stale simulated-player event must not escape the test observer. */ }
});

GameTest.registerAsync("AugmentationSurvival", "tool_care_matches_java_chance_and_restores_only_the_spent_durability", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASToolCareDeterministic", GameMode.survival);
  const inventory = inventoryOf(player);

  ensure(toolCareChance(-1) === 0 && toolCareChance(0) === 0, "Tool Care must be inactive below level 1.");
  for (let level = 1; level <= 5; level += 1) {
    const chance = level * 0.05;
    ensure(toolCareChance(level) === chance, `Level ${level} chance should be ${chance}.`);
    ensure(toolCareRollSucceeds(level, chance - 1e-9), `Level ${level} must succeed below its exclusive chance boundary.`);
    ensure(!toolCareRollSucceeds(level, chance), `Level ${level} must fail at its exclusive chance boundary.`);
  }
  ensure(toolCareChance(6) === 0.25, "Tool Care must cap at its five-level maximum.");

  const before = new ItemStack("minecraft:iron_pickaxe");
  const beforeDurability = before.getComponent("minecraft:durability");
  ensure(beforeDurability, "Iron pickaxe durability component was unavailable.");
  beforeDurability.damage = 2;
  const after = before.clone();
  const afterDurability = after.getComponent("minecraft:durability");
  ensure(afterDurability, "The post-break durability component was unavailable.");
  afterDurability.damage = 3;
  inventory.setItem(0, after.clone());

  const event = { player, itemStackBeforeBreak: before, itemStackAfterBreak: after };
  ensure(tryPreventBlockToolDamage(event, 0, 5, () => 0), "A successful level-5 roll did not prevent the observed durability loss.");
  ensure(inventory.getItem(0)?.typeId === before.typeId, "Tool Care lost the live item while restoring its durability.");
  ensure(inventory.getItem(0)?.hasComponent("minecraft:durability"), "Tool Care restored an item without its durability component.");

  inventory.setItem(0, after.clone());
  ensure(!tryPreventBlockToolDamage(event, 0, 5, () => 0.25), "The exact level-5 boundary incorrectly saved durability.");
  ensure(inventory.getItem(0)?.typeId === after.typeId, "A failed Tool Care roll removed the damaged item.");

  const breaking = new ItemStack("minecraft:iron_pickaxe");
  const breakingDurability = breaking.getComponent("minecraft:durability");
  ensure(breakingDurability, "Breaking pickaxe durability component was unavailable.");
  breakingDurability.damage = breakingDurability.maxDurability - 1;
  inventory.setItem(0, undefined);
  ensure(tryPreventBlockToolDamage({ player, itemStackBeforeBreak: breaking }, 0, 5, () => 0), "A successful last-point roll did not restore the broken tool.");
  const restored = inventory.getItem(0);
  ensure(restored?.typeId === breaking.typeId, "The broken tool was not returned to its captured slot.");
  ensure(restored.hasComponent("minecraft:durability"), "The restored tool lost its durability component.");

  inventory.setItem(0, new ItemStack("minecraft:dirt"));
  ensure(!tryPreventBlockToolDamage({ player, itemStackBeforeBreak: breaking }, 0, 5, () => 0), "Tool Care overwrote an occupied hotbar slot.");
  ensure(inventory.getItem(0)?.typeId === "minecraft:dirt", "Tool Care changed an occupied hotbar slot.");
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "tool_care_uses_production_block_break_events", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASToolCareLive", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack("minecraft:iron_pickaxe"));
  player.addEffect("haste", 100, { amplifier: 15, showParticles: false });
  await test.idle(2);
  ensure(player.hasTag("as_tool_care_seeded"), "The production test profile did not seed level-5 Tool Care.");

  const target = { x: 5, y: 3, z: 3 };
  const worldTarget = test.worldBlockLocation(target);
  let savedDurability = 0;
  let spentDurability = 0;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const toolBefore = inventory.getItem(0);
    const beforeDamage = toolBefore?.getComponent("minecraft:durability")?.damage;
    ensure(typeof beforeDamage === "number", "The live test pickaxe left the captured hotbar slot.");
    const block = player.dimension.getBlock(worldTarget);
    ensure(block, "The live Tool Care block location was not loaded.");
    block.setType("minecraft:stone");
    ensure(player.breakBlock(target), `Simulated player could not start Tool Care break ${attempt + 1}.`);
    await test.idle(2);
    const brokenBlock = test.getBlock(target);
    ensure(brokenBlock && brokenBlock.typeId !== "minecraft:stone", `Simulated player did not finish Tool Care break ${attempt + 1}.`);
    const toolAfter = inventory.getItem(0);
    const afterDamage = toolAfter?.getComponent("minecraft:durability")?.damage;
    ensure(toolAfter?.typeId === "minecraft:iron_pickaxe", "The production handler lost the live pickaxe.");
    ensure(afterDamage === beforeDamage || afterDamage === beforeDamage + 1,
      `Tool Care produced an unexpected live durability transition ${beforeDamage} -> ${afterDamage}.`);
    if (afterDamage === beforeDamage) savedDurability += 1;
    else spentDurability += 1;
  }

  ensure(player.hasTag("as_test_tool_care_break_event"), "The live playerBreakBlock after-event did not reach the observer.");
  ensure(savedDurability > 0, `The production Tool Care handler never restored durability across 40 level-5 trials (${spentDurability} losses).`);
  console.warn(`AS_TOOL_CARE_LIVE ${JSON.stringify({ savedDurability, spentDurability })}`);
  test.succeed();
}).maxTicks(180).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "core_offers_only_bds_verified_effects_and_preserves_locked_tiers", async (test) => {
  const common = listAvailableCandidates("common", AUGMENTS, {});
  ensure(common.length === ENABLED_CANDIDATE_IDS.length, `Expected ${ENABLED_CANDIDATE_IDS.length} enabled common candidates; got ${common.length}.`);
  ensure(ENABLED_CANDIDATE_IDS.every(id => common.some(augment => augment.id === id)), "The enabled common candidate set diverged from its BDS-verified allowlist.");
  ensure(!common.some(augment => augment.id === "augmentation_survival:sturdiness"), "The known +4 vs +2 max-health mismatch was exposed as a core candidate.");

  for (const tier of ["uncommon", "rare", "epic", "legendary", "mythic"]) {
    const candidates = listAvailableCandidates(tier, AUGMENTS, {});
    const expected = tier === "uncommon"
      ? [
        "augmentation_survival:extra_piece",
        "augmentation_survival:catch_breath",
        "augmentation_survival:loot_scoop",
        "augmentation_survival:tool_care",
        "augmentation_survival:last_strength",
        "augmentation_survival:nocturnal",
        "augmentation_survival:sun_affinity",
        "augmentation_survival:dexterity",
        "augmentation_survival:pickup_hand",
        "augmentation_survival:ride_current",
        "augmentation_survival:urgent_steps",
        "augmentation_survival:armor_care",
        "augmentation_survival:momentum_shift",
      "augmentation_survival:mantle",
      ]
      : [];
    ensure(candidates.length === expected.length, `${tier} exposed an unexpected candidate count.`);
    ensure(expected.every(id => candidates.some(augment => augment.id === id)), `${tier} candidate set diverged from its BDS-tested allowlist.`);
  }
  const maxedLevels = Object.fromEntries(common.map(augment => [augment.id, augment.max_level]));
  ensure(listAvailableCandidates("common", AUGMENTS, maxedLevels).length === 0, "Maxed BDS-verified candidates remained eligible.");

  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASLockedTierCore", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack(NEXT_CORE, 1));
  ensure(player.useItemInSlot(0), "Simulated player could not use an uncommon core with no enabled candidates.");
  await test.idle(2);
  ensure(countItem(inventory, NEXT_CORE) === 1, "Using a locked-tier core consumed it despite there being no enabled candidates.");
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "crop_bonus_augments_match_maturity_levels_products_and_independent_rolls", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASBumperCrop", GameMode.survival);
  const cropBlock = player.dimension.getBlock({
    x: Math.floor(player.location.x),
    y: Math.floor(player.location.y) + 2,
    z: Math.floor(player.location.z),
  });
  ensure(cropBlock, "The crop bonus spawn location was not loaded.");
  const event = {
    brokenBlockPermutation: BlockPermutation.resolve("minecraft:wheat", { growth: 7 }),
    block: cropBlock,
    dimension: player.dimension,
    player,
  };
  const spawnLocation = cropBlock.location;
  const wheatCount = () => player.dimension.getEntities({
    type: "minecraft:item",
    location: spawnLocation,
    maxDistance: 4,
  }).reduce((count, entity) => {
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    return count + (stack?.typeId === "minecraft:wheat" ? stack.amount : 0);
  }, 0);
  const productCount = (product) => player.dimension.getEntities({
    type: "minecraft:item",
    location: spawnLocation,
    maxDistance: 4,
  }).reduce((count, entity) => {
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    return count + (stack?.typeId === product ? stack.amount : 0);
  }, 0);

  for (let level = 1; level <= 5; level += 1) {
    const chance = bumperCropBonusChance(level);
    ensure(Math.abs(chance - 0.08 * level) < 1e-12, `Level ${level} chance should be ${0.08 * level}; got ${chance}.`);
    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:bumper_crop": level }));
    const before = wheatCount();
    ensure(applyCropHarvestBonuses(event, () => chance - 1e-9), `Level ${level} did not grant below its exact chance boundary.`);
    ensure(wheatCount() === before + 1, `Level ${level} did not spawn exactly one extra wheat item.`);
    ensure(!applyCropHarvestBonuses(event, () => chance), `Level ${level} granted at its exclusive chance boundary.`);
    ensure(wheatCount() === before + 1, `Level ${level} spawned an item at its exclusive chance boundary.`);
  }

  for (const [blockId, growth, product] of [
    ["minecraft:wheat", 7, "minecraft:wheat"],
    ["minecraft:carrots", 7, "minecraft:carrot"],
    ["minecraft:potatoes", 7, "minecraft:potato"],
    ["minecraft:beetroot", 3, "minecraft:beetroot"],
  ]) {
    const cropEvent = {
      ...event,
      brokenBlockPermutation: BlockPermutation.resolve(blockId, { growth }),
    };
    const before = productCount(product);
    ensure(applyCropHarvestBonuses(cropEvent, () => 0), `${blockId} did not receive its canonical extra product when the roll succeeded.`);
    ensure(productCount(product) === before + 1, `${blockId} did not spawn exactly one ${product}.`);
  }

  for (let level = 1; level <= 3; level += 1) {
    const chance = seedSaverBonusChance(level);
    ensure(Math.abs(chance - 0.15 * level) < 1e-12, `Seed Saver level ${level} chance should be ${0.15 * level}; got ${chance}.`);
    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:seed_saver": level }));
    const before = productCount("minecraft:wheat_seeds");
    ensure(applyCropHarvestBonuses(event, () => chance - 1e-9), `Seed Saver level ${level} did not grant below its chance boundary.`);
    ensure(productCount("minecraft:wheat_seeds") === before + 1, `Seed Saver level ${level} did not add one planting item.`);
    ensure(!applyCropHarvestBonuses(event, () => chance), `Seed Saver level ${level} granted at its exclusive boundary.`);
    ensure(productCount("minecraft:wheat_seeds") === before + 1, `Seed Saver level ${level} spawned at its exclusive boundary.`);
  }

  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:seed_saver": 3 }));
  for (const [blockId, growth, plantingItem] of [
    ["minecraft:wheat", 7, "minecraft:wheat_seeds"],
    ["minecraft:carrots", 7, "minecraft:carrot"],
    ["minecraft:potatoes", 7, "minecraft:potato"],
    ["minecraft:beetroot", 3, "minecraft:beetroot_seeds"],
  ]) {
    const cropEvent = {
      ...event,
      brokenBlockPermutation: BlockPermutation.resolve(blockId, { growth }),
    };
    const before = productCount(plantingItem);
    ensure(applyCropHarvestBonuses(cropEvent, () => 0), `${blockId} did not receive its planting item bonus.`);
    ensure(productCount(plantingItem) === before + 1, `${blockId} did not spawn exactly one ${plantingItem}.`);
  }

  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
    "augmentation_survival:bumper_crop": 5,
    "augmentation_survival:seed_saver": 3,
  }));
  const bothBeforeProduct = productCount("minecraft:wheat");
  const bothBeforeSeed = productCount("minecraft:wheat_seeds");
  const sequence = [0.39, 0.44];
  let sequenceIndex = 0;
  ensure(applyCropHarvestBonuses(event, () => sequence[sequenceIndex++]), "The two successful crop bonuses were not both applied.");
  ensure(sequenceIndex === 2, "Bumper Crop and Seed Saver did not roll independently in source order.");
  ensure(productCount("minecraft:wheat") === bothBeforeProduct + 1, "Bumper Crop did not add its product alongside Seed Saver.");
  ensure(productCount("minecraft:wheat_seeds") === bothBeforeSeed + 1, "Seed Saver did not add its planting item alongside Bumper Crop.");

  const seedOnlyBeforeProduct = productCount("minecraft:wheat");
  const seedOnlyBeforeSeed = productCount("minecraft:wheat_seeds");
  const seedOnlyRolls = [0.40, 0.44];
  sequenceIndex = 0;
  ensure(applyCropHarvestBonuses(event, () => seedOnlyRolls[sequenceIndex++]), "Seed Saver should proc when Bumper Crop misses.");
  ensure(productCount("minecraft:wheat") === seedOnlyBeforeProduct, "A missed Bumper Crop roll spawned a crop product.");
  ensure(productCount("minecraft:wheat_seeds") === seedOnlyBeforeSeed + 1, "Seed Saver failed its independent successful roll.");

  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:bumper_crop": 5 }));
  let rolls = 0;
  const immature = {
    ...event,
    brokenBlockPermutation: BlockPermutation.resolve("minecraft:wheat", { growth: 6 }),
  };
  ensure(!applyCropHarvestBonuses(immature, () => { rolls += 1; return 0; }), "An immature wheat crop received a bonus.");
  ensure(rolls === 0, "An immature crop consumed a bonus roll.");
  const unsupported = {
    ...event,
    brokenBlockPermutation: BlockPermutation.resolve("minecraft:short_grass"),
  };
  ensure(!applyCropHarvestBonuses(unsupported, () => { rolls += 1; return 0; }), "A non-crop block received a bonus.");
  ensure(rolls === 0, "An unsupported block consumed a bonus roll.");
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({}));
  ensure(!applyCropHarvestBonuses(event, () => { rolls += 1; return 0; }), "An unowned augment granted a crop bonus.");
  ensure(rolls === 0, "An unowned augment consumed a bonus roll.");
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "extra_piece_matches_ore_loot_chances_and_tool_enchants", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASExtraPieceLoot", GameMode.survival);
  const block = player.dimension.getBlock({ x: 4, y: 5, z: 3 });
  ensure(block, "The ore loot spawn location was not loaded.");
  const ore = BlockPermutation.resolve("minecraft:diamond_ore");
  const plainPickaxe = new ItemStack("minecraft:iron_pickaxe");
  const event = {
    brokenBlockPermutation: ore,
    itemStackBeforeBreak: plainPickaxe,
    block,
    dimension: player.dimension,
    player,
  };

  for (let level = 1; level <= 3; level += 1) {
    const chance = extraPieceBonusChance(level);
    ensure(Math.abs(chance - 0.05 * level) < 1e-12, `Level ${level} chance should be ${0.05 * level}; got ${chance}.`);
    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:extra_piece": level }));
    const before = countDroppedItem(player.dimension, block.location, "minecraft:diamond");
    ensure(applyExtraPieceBonus(event, () => chance - 1e-9), `Level ${level} did not award below its exact chance boundary.`);
    ensure(countDroppedItem(player.dimension, block.location, "minecraft:diamond") === before + 1, `Level ${level} did not add exactly one diamond.`);
    ensure(!applyExtraPieceBonus(event, () => chance), `Level ${level} awarded at its exclusive chance boundary.`);
    ensure(countDroppedItem(player.dimension, block.location, "minecraft:diamond") === before + 1, `Level ${level} added an item at its exclusive boundary.`);
  }

  const silkTouch = new ItemStack("minecraft:diamond_pickaxe");
  const silkType = EnchantmentTypes.get("silk_touch");
  ensure(silkType, "The stable Silk Touch enchantment type was unavailable.");
  silkTouch.getComponent("minecraft:enchantable")?.addEnchantment({ type: silkType, level: 1 });
  const silkEvent = { ...event, itemStackBeforeBreak: silkTouch };
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:extra_piece": 3 }));
  const beforeOreBlock = countDroppedItem(player.dimension, block.location, "minecraft:diamond_ore");
  ensure(applyExtraPieceBonus(silkEvent, () => 0), "Silk Touch did not produce an eligible extra ore drop.");
  ensure(countDroppedItem(player.dimension, block.location, "minecraft:diamond_ore") === beforeOreBlock + 1, "Silk Touch bonus did not preserve the ore block item.");

  const fortune = new ItemStack("minecraft:diamond_pickaxe");
  const fortuneType = EnchantmentTypes.get("fortune");
  ensure(fortuneType, "The stable Fortune enchantment type was unavailable.");
  fortune.getComponent("minecraft:enchantable")?.addEnchantment({ type: fortuneType, level: 3 });
  const fortuneEvent = { ...event, itemStackBeforeBreak: fortune };
  const beforeFortune = countDroppedItem(player.dimension, block.location, "minecraft:diamond");
  ensure(applyExtraPieceBonus(fortuneEvent, () => 0), "Fortune did not produce an eligible extra ore drop.");
  ensure(countDroppedItem(player.dimension, block.location, "minecraft:diamond") === beforeFortune + 1, "Fortune bonus did not add exactly one ordinary drop.");

  let rolls = 0;
  const nonOre = { ...event, brokenBlockPermutation: BlockPermutation.resolve("minecraft:stone") };
  ensure(!applyExtraPieceBonus(nonOre, () => { rolls += 1; return 0; }), "A non-ore block received an extra drop.");
  ensure(rolls === 0, "A non-ore block consumed an Extra Piece roll.");
  const unmineable = { ...event, itemStackBeforeBreak: new ItemStack("minecraft:wooden_pickaxe") };
  ensure(!applyExtraPieceBonus(unmineable, () => 0), "An under-tier pickaxe received an extra diamond drop.");
  test.succeed();
}).maxTicks(80).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "extra_piece_receives_live_player_block_break_event", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASExtraPieceBreak", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack("minecraft:iron_pickaxe"));
  player.addEffect("haste", 100, { amplifier: 15, showParticles: false });
  const target = { x: 5, y: 3, z: 3 };
  const worldTarget = test.worldBlockLocation(target);
  const block = player.dimension.getBlock(worldTarget);
  ensure(block, "The live ore block location was not loaded.");
  block.setType("minecraft:iron_ore");
  ensure(player.breakBlock(target), "Simulated player could not start breaking the iron ore.");
  await test.idle(60);
  ensure(player.hasTag("as_test_extra_piece_break_event"), "The live playerBreakBlock after-event did not reach the GameTest observer.");
  const brokenBlock = test.getBlock(target);
  ensure(brokenBlock && brokenBlock.typeId !== "minecraft:iron_ore", "Simulated player did not finish breaking the iron ore block.");
  test.succeed();
}).maxTicks(80).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "dexterity_matches_java_chances_whitelist_and_drop_eligibility", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASDexterityDeterministic", GameMode.survival);
  const block = player.dimension.getBlock({ x: 4, y: 5, z: 3 });
  ensure(block, "The Dexterity loot spawn location was not loaded.");
  const flower = BlockPermutation.resolve("minecraft:dandelion");
  const event = {
    brokenBlockPermutation: flower,
    itemStackBeforeBreak: new ItemStack("minecraft:shears"),
    block,
    dimension: player.dimension,
    player,
  };

  ensure(dexterityBonusChance(-1) === 0 && dexterityBonusChance(0) === 0, "Dexterity must be inactive below level 1.");
  ensure(Math.abs(dexterityBonusChance(6) - 0.30) < 1e-12, "Dexterity must cap at 30% after its three levels.");
  ensure(isDexterityGatheringBlock(flower), "The Java flower whitelist did not map to the vanilla dandelion.");
  ensure(isDexterityGatheringBlock(BlockPermutation.resolve("minecraft:oak_leaves")), "The Java leaves whitelist did not map to vanilla oak leaves.");
  ensure(isDexterityGatheringBlock(BlockPermutation.resolve("minecraft:bamboo")), "The explicit Java gathering whitelist did not map to bamboo.");
  ensure(!isDexterityGatheringBlock(BlockPermutation.resolve("minecraft:stone")), "An unlisted block was accepted by the gathering whitelist.");
  for (let level = 1; level <= 3; level += 1) {
    const chance = level * 0.10;
    ensure(Math.abs(dexterityBonusChance(level) - chance) < 1e-12, `Level ${level} chance should be ${chance}.`);

    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:dexterity": level }));
    const before = countDroppedItem(player.dimension, block.location, "minecraft:dandelion");
    ensure(applyDexterityGatheringBonus(event, () => chance - 1e-9), `Level ${level} did not award below its exact chance boundary.`);
    ensure(countDroppedItem(player.dimension, block.location, "minecraft:dandelion") === before + 1, `Level ${level} did not add exactly one eligible flower drop.`);
    ensure(!applyDexterityGatheringBonus(event, () => chance), `Level ${level} awarded at its exclusive chance boundary.`);
    ensure(countDroppedItem(player.dimension, block.location, "minecraft:dandelion") === before + 1, `Level ${level} added an item at its exclusive boundary.`);
  }

  ensure(isEligibleDexterityDrop(new ItemStack("minecraft:dandelion")), "An ordinary stackable flower should be eligible.");
  ensure(!isEligibleDexterityDrop(undefined), "An absent stack must not be eligible.");
  ensure(!isEligibleDexterityDrop(new ItemStack("minecraft:diamond_sword")), "A damageable, non-stackable item must not be eligible.");
  const named = new ItemStack("minecraft:dandelion");
  named.nameTag = "Named flower";
  ensure(!isEligibleDexterityDrop(named), "A custom-named item must not be eligible.");
  const authoredLore = new ItemStack("minecraft:dandelion");
  authoredLore.setLore(["Authored lore"]);
  ensure(!isEligibleDexterityDrop(authoredLore), "An item with authored lore must not be eligible.");
  ensure(!isEligibleDexterityDrop(new ItemStack(CORE)), "An augment core must not be eligible.");

  let rolls = 0;
  const notWhitelisted = { ...event, brokenBlockPermutation: BlockPermutation.resolve("minecraft:stone") };
  ensure(!applyDexterityGatheringBonus(notWhitelisted, () => { rolls += 1; return 0; }), "A non-whitelisted block received a Dexterity bonus.");
  ensure(rolls === 0, "A non-whitelisted block consumed a Dexterity roll.");
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({}));
  ensure(!applyDexterityGatheringBonus(event, () => { rolls += 1; return 0; }), "An unowned Dexterity augment granted a bonus.");
  ensure(rolls === 0, "An unowned Dexterity augment consumed a roll.");
  test.succeed();
}).maxTicks(60).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "dexterity_receives_live_player_block_break_event", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASDexterityBreak", GameMode.survival);
  const inventory = inventoryOf(player);
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:dexterity": 3 }));
  const target = { x: 5, y: 3, z: 3 };
  const worldTarget = test.worldBlockLocation(target);
  const attempts = 50;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const block = player.dimension.getBlock(worldTarget);
    ensure(block, "The live Dexterity block location was not loaded.");
    block.setType("minecraft:dandelion");
    ensure(player.breakBlock(target), `Simulated player could not break dandelion ${attempt + 1}.`);
    await test.idle(1);
  }
  ensure(player.hasTag("as_test_dexterity_break_event"), "The live playerBreakBlock after-event did not reach the Dexterity observer.");
  const ordinaryAndBonusDrops = countItem(inventory, "minecraft:dandelion")
    + countDroppedItem(player.dimension, worldTarget, "minecraft:dandelion");
  ensure(ordinaryAndBonusDrops > attempts, "The production Dexterity handler did not add a bonus during 50 level-3 player flower breaks.");
  test.succeed();
}).maxTicks(120).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "exhaustion_component_write_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASExhaustionProbe", GameMode.survival);
  const exhaustion = player.getComponent("minecraft:player.exhaustion");
  const hunger = player.getComponent("minecraft:player.hunger");
  const saturation = player.getComponent("minecraft:player.saturation");
  ensure(exhaustion && hunger && saturation, "A player food attribute component was unavailable.");

  const initial = {
    exhaustion: exhaustion.currentValue,
    hunger: hunger.currentValue,
    saturation: saturation.currentValue,
  };
  const accepted = exhaustion.setCurrentValue(1.25);
  await test.idle(2);
  const afterIdle = {
    exhaustion: exhaustion.currentValue,
    hunger: hunger.currentValue,
    saturation: saturation.currentValue,
  };
  player.applyDamage(1, { cause: EntityDamageCause.magic });
  await test.idle(2);
  const afterDamage = {
    exhaustion: exhaustion.currentValue,
    hunger: hunger.currentValue,
    saturation: saturation.currentValue,
  };
  console.warn(`AS_EXHAUSTION_PROBE ${JSON.stringify({ accepted, initial, afterIdle, afterDamage })}`);
  ensure(accepted, "The exhaustion component rejected a value in its documented range.");
  ensure(afterIdle.exhaustion === 1.25, `Expected exhaustion to remain writable across ticks; got ${afterIdle.exhaustion}.`);
  ensure(afterIdle.hunger === initial.hunger && afterIdle.saturation === initial.saturation, "Changing exhaustion immediately changed hunger or saturation.");
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "hearty_meal_matches_java_levels_and_food_cap", async (test) => {
  const cases = [
    { level: 1, name: "ASHeartyLevel1", position: { x: 2, y: 3, z: 3 }, expected: 13.824, expectedHunger: 18 },
    { level: 2, name: "ASHeartyLevel2", position: { x: 4, y: 3, z: 3 }, expected: 14.848, expectedHunger: 18 },
    { level: 3, name: "ASHeartyLevel3", position: { x: 6, y: 3, z: 3 }, expected: 15.872, expectedHunger: 18 },
    { level: 3, name: "ASHeartyCap", position: { x: 4, y: 3, z: 6 }, expected: 20, expectedHunger: 20, capped: true },
  ];
  const players = cases.map(entry => {
    const player = test.spawnSimulatedPlayer(entry.position, entry.name, GameMode.survival);
    const inventory = inventoryOf(player);
    const hunger = player.getComponent("minecraft:player.hunger");
    const saturation = player.getComponent("minecraft:player.saturation");
    ensure(hunger && saturation, `${entry.name}: hunger components were unavailable.`);
    inventory.setItem(0, new ItemStack("minecraft:cooked_beef", 2));
    hunger.setCurrentValue(entry.capped ? 12 : 10);
    saturation.setCurrentValue(entry.capped ? 10 : 0);
    return { ...entry, player, inventory, hunger, saturation };
  });

  // Let the production food handler record a clean pre-consumption sample.
  await test.idle(3);
  const usesStarted = players.map(entry => entry.player.useItemInSlot(0));
  await test.idle(42);
  ensure(usesStarted.every(Boolean), "At least one simulated player did not start eating cooked beef.");

  for (const entry of players) {
    const difference = Math.abs(entry.saturation.currentValue - entry.expected);
    ensure(difference < 0.04,
      `${entry.name}: expected saturation ${entry.expected}, got ${entry.saturation.currentValue}.`);
    ensure(entry.hunger.currentValue === entry.expectedHunger,
      `${entry.name}: expected hunger ${entry.expectedHunger}, got ${entry.hunger.currentValue}.`);
    const remaining = entry.inventory.getItem(0)?.amount ?? 0;
    ensure(remaining === 1, `${entry.name}: expected one cooked beef consumed, found ${remaining}.`);
  }
  test.succeed();
}).maxTicks(90).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "webbed_feet_scales_server_swim_speed_by_level", async (test) => {
  for (let x = 1; x <= 5; x += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:water", { x, y, z });
    }
  }
  const players = [
    { level: 0, name: "ASWebbedFeetControl", x: 1 },
    { level: 1, name: "ASWebbedFeetLevel1", x: 2 },
    { level: 2, name: "ASWebbedFeetLevel2", x: 3 },
    { level: 3, name: "ASWebbedFeetLevel3", x: 4 },
  ].map(entry => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: entry.x, y: 3, z: 2 }, entry.name, GameMode.survival),
  }));
  await test.idle(3);
  const movement = players.map(entry => ({
    ...entry,
    component: entry.player.getComponent("minecraft:underwater_movement"),
    start: entry.player.location,
  }));
  ensure(movement.every(entry => entry.component), "Simulated players did not expose underwater movement components.");
  for (const entry of movement) {
    entry.player.swim();
    entry.player.moveRelative(0, 1, 0.2);
  }
  await test.idle(20);
  const result = movement.map(entry => {
    entry.player.stopMoving();
    const end = entry.player.location;
    const delta = { x: end.x - entry.start.x, y: end.y - entry.start.y, z: end.z - entry.start.z };
    return {
      level: entry.level,
      name: entry.name,
      inWater: entry.player.isInWater,
      swimming: entry.player.isSwimming,
      delta,
      horizontalDistance: Math.hypot(delta.x, delta.z),
      velocity: entry.player.getVelocity(),
      underwaterMovement: { current: entry.component.currentValue, defaultValue: entry.component.defaultValue },
    };
  });
  console.warn(`AS_WEBBED_FEET_RUNTIME_TEST ${JSON.stringify(result)}`);
  ensure(result.every(entry => entry.inWater && entry.swimming), "Simulated players did not remain swimming in the test water.");
  const controlSpeed = result[0].velocity.z;
  for (const entry of result.slice(1)) {
    const expectedMultiplier = 1 + entry.level * 0.10;
    const measuredMultiplier = entry.velocity.z / controlSpeed;
    ensure(Math.abs(measuredMultiplier - expectedMultiplier) < 0.015,
      `${entry.name}: expected swim-speed multiplier ${expectedMultiplier}, got ${measuredMultiplier}.`);
    ensure(Math.abs(entry.underwaterMovement.current - entry.underwaterMovement.defaultValue * expectedMultiplier) < 0.00001,
      `${entry.name}: the production handler did not preserve its underwater movement multiplier.`);
  }

  for (const entry of movement) {
    entry.player.teleport({ x: entry.start.x, y: entry.start.y + 6, z: entry.start.z });
  }
  await test.idle(3);
  for (const entry of movement.slice(1)) {
    const current = entry.component.currentValue;
    ensure(Math.abs(current - entry.component.defaultValue) < 0.00001,
      `${entry.name}: expected the default movement value out of water, got ${current}.`);
  }
  test.succeed();
}).maxTicks(60).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "catch_breath_waits_then_sets_ground_movement_multiplier", async (test) => {
  const players = [
    { level: 0, name: "ASCatchBreathControl", x: 1 },
    { level: 1, name: "ASCatchBreathLevel1", x: 3 },
    { level: 2, name: "ASCatchBreathLevel2", x: 5 },
    { level: 3, name: "ASCatchBreathLevel3", x: 7 },
  ].map(entry => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: entry.x, y: 3, z: 3 }, entry.name, GameMode.survival),
  }));
  await test.idle(35);
  const movement = players.map(entry => ({
    ...entry,
    component: entry.player.getComponent("minecraft:movement"),
  }));
  ensure(movement.every(entry => entry.component), "Simulated players did not expose general movement components.");
  for (const entry of movement.slice(1)) {
    ensure(Math.abs(entry.component.currentValue - entry.component.defaultValue) < 0.000001,
      `${entry.name}: Catch Breath activated before 60 idle ticks.`);
  }

  await test.idle(35);
  const values = movement.map(entry => ({
    level: entry.level,
    name: entry.name,
    current: entry.component.currentValue,
    defaultValue: entry.component.defaultValue,
  }));
  console.warn(`AS_CATCH_BREATH_GROUND_TEST ${JSON.stringify(values)}`);
  for (const entry of movement.slice(1)) {
    const expected = entry.component.defaultValue * (1 + 0.10 * entry.level);
    ensure(Math.abs(entry.component.currentValue - expected) < 0.000001,
      `${entry.name}: expected movement component ${expected}, got ${entry.component.currentValue}.`);
    ensure(!entry.player.isSprinting, `${entry.name}: idle movement probe unexpectedly sprinted.`);
  }
  ensure(Math.abs(movement[0].component.currentValue - movement[0].component.defaultValue) < 0.000001,
    "Control player movement changed without Catch Breath.");
  test.succeed();
}).maxTicks(120).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "catch_breath_stacks_additively_with_webbed_feet_while_swimming", async (test) => {
  for (let x = 1; x <= 5; x += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:water", { x, y, z });
    }
  }
  const players = [
    { level: 0, webbed: false, name: "ASBreathWaterControl", x: 1 },
    { level: 1, webbed: false, name: "ASCatchBreathWater", x: 2 },
    { level: 0, webbed: true, name: "ASWebbedWater", x: 3 },
    { level: 1, webbed: true, name: "ASCatchBreathWebbedWater", x: 4 },
  ].map(entry => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: entry.x, y: 3, z: 2 }, entry.name, GameMode.survival),
  }));
  await test.idle(65);
  const movement = players.map(entry => ({
    ...entry,
    general: entry.player.getComponent("minecraft:movement"),
    underwater: entry.player.getComponent("minecraft:underwater_movement"),
  }));
  ensure(movement.every(entry => entry.general && entry.underwater), "Water movement attributes were unavailable.");
  for (const entry of movement) {
    ensure(entry.player.isInWater, `${entry.name} did not spawn in the test water.`);
    entry.player.swim();
    entry.player.setRotation({ x: 0, y: 0 });
    entry.player.moveRelative(0, 1, 0.2);
  }
  await test.idle(20);
  const speeds = movement.map(entry => ({
    level: entry.level,
    webbed: entry.webbed,
    name: entry.name,
    general: { current: entry.general.currentValue, defaultValue: entry.general.defaultValue },
    underwater: { current: entry.underwater.currentValue, defaultValue: entry.underwater.defaultValue },
    velocity: entry.player.getVelocity(),
  }));
  console.warn(`AS_CATCH_BREATH_WATER_SPEED ${JSON.stringify(speeds)}`);
  const controlSpeed = Math.hypot(speeds[0].velocity.x, speeds[0].velocity.z);
  ensure(controlSpeed > 0.001, "Control simulated player did not swim.");
  for (const entry of speeds.slice(1)) {
    const speed = Math.hypot(entry.velocity.x, entry.velocity.z);
    const ratio = speed / controlSpeed;
    const expected = 1 + 0.10 * (entry.level + (entry.webbed ? 1 : 0));
    ensure(Math.abs(ratio - expected) < 0.015,
      `${entry.name}: expected additive swim-speed ratio ${expected}, got ${ratio}.`);
    ensure(Math.abs(entry.general.current - entry.general.defaultValue) < 0.000001,
      `${entry.name}: general movement should not multiply the separate underwater modifier.`);
  }
  test.succeed();
}).maxTicks(110).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "quick_feet_scales_server_movement_by_level", async (test) => {
  const players = Array.from({ length: 5 }, (_, index) => {
    const level = index + 1;
    const name = `ASQuickFeetLevel${level}`;
    return {
      level,
      name,
      player: test.spawnSimulatedPlayer({ x: 1 + index * 2, y: 3, z: 3 }, name, GameMode.survival),
    };
  });
  await test.idle(3);
  for (const entry of players) {
    const movement = entry.player.getComponent("minecraft:movement");
    ensure(movement, `${entry.name}: general movement component was unavailable.`);
    const expected = movement.defaultValue * (1 + 0.03 * entry.level);
    ensure(Math.abs(movement.currentValue - expected) < 0.000001,
      `${entry.name}: expected exact +${entry.level * 3}% movement component ${expected}, got ${movement.currentValue}.`);
  }
  const delayedCatchBreath = test.spawnSimulatedPlayer(
    { x: 9, y: 3, z: 5 }, "ASQuickFeetCatchBreathDelayed", GameMode.survival,
  );
  await test.idle(65);
  let delayedMovement = delayedCatchBreath.getComponent("minecraft:movement");
  ensure(delayedMovement, "Quick Feet idle-gate movement component was unavailable.");
  let delayedExpected = delayedMovement.defaultValue * 1.03;
  ensure(Math.abs(delayedMovement.currentValue - delayedExpected) < 0.000001,
    `Quick Feet alone must not add a Catch Breath bonus before it is granted; expected ${delayedExpected}, got ${delayedMovement.currentValue}.`);
  await test.idle(35);
  delayedMovement = delayedCatchBreath.getComponent("minecraft:movement");
  ensure(delayedMovement, "Quick Feet idle-gate movement component was unavailable.");
  delayedExpected = delayedMovement.defaultValue * 1.03;
  ensure(Math.abs(delayedMovement.currentValue - delayedExpected) < 0.000001,
    `Catch Breath must remain inactive after 35 ticks from acquisition; expected ${delayedExpected}, got ${delayedMovement.currentValue}.`);
  await test.idle(30);
  delayedMovement = delayedCatchBreath.getComponent("minecraft:movement");
  ensure(delayedMovement, "Quick Feet/Catch Breath movement component was unavailable.");
  delayedExpected = delayedMovement.defaultValue * (1 + 0.03 + 0.10 * 3);
  ensure(Math.abs(delayedMovement.currentValue - delayedExpected) < 0.000001,
    `Catch Breath must activate after 60 ticks while Quick Feet remains additive; expected ${delayedExpected}, got ${delayedMovement.currentValue}.`);
  test.succeed();
}).maxTicks(150).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "taming_component_and_event_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASTamingProbe", GameMode.survival);
  const inventory = inventoryOf(player);
  const interactionsBefore = [];
  const interactionsAfter = [];
  const tamesBefore = [];
  const tamesAfter = [];
  const readApi = getter => {
    try { return getter(); }
    catch (error) { return `error:${error?.name ?? "Error"}:${error?.message ?? "unknown"}`; }
  };
  const beforeInteraction = event => {
    if (event.player.id === player.id) interactionsBefore.push({ target: event.target.typeId, item: event.itemStack?.typeId });
  };
  const afterInteraction = event => {
    if (event.player.id === player.id) interactionsAfter.push({ target: event.target.typeId, item: event.beforeItemStack?.typeId });
  };
  const beforeTame = event => tamesBefore.push({ entityId: event.entity.id, target: event.entity.typeId, actorId: event.tamingEntity.id, actor: event.tamingEntity.typeId });
  const afterTame = event => tamesAfter.push({ entityId: event.entity.id, target: event.entity.typeId, actorId: event.tamingEntity.id, actor: event.tamingEntity.typeId });
  world.beforeEvents.playerInteractWithEntity.subscribe(beforeInteraction);
  world.afterEvents.playerInteractWithEntity.subscribe(afterInteraction);
  world.beforeEvents.entityTamed.subscribe(beforeTame);
  world.afterEvents.entityTamed.subscribe(afterTame);

  const species = ["minecraft:wolf", "minecraft:cat", "minecraft:parrot", "minecraft:nautilus"];
  const nativeResults = [];
  const tameEntities = [];
  try {
    await test.idle(2);
    for (let index = 0; index < species.length; index += 1) {
      const typeId = species[index];
      let entity;
      try {
        entity = player.dimension.spawnEntity(typeId, test.worldLocation({ x: 6 + index * 2, y: 3, z: 5 }));
      } catch (error) {
        nativeResults.push({ typeId, spawnError: `${error?.name ?? "Error"}:${error?.message ?? "unknown"}` });
        continue;
      }
      tameEntities.push(entity);
      const component = entity.getComponent("minecraft:tameable");
      if (!component) {
        nativeResults.push({ typeId, missingTameable: true, components: entity.getComponents().map(value => value.typeId) });
        continue;
      }
      const tameItems = readApi(() => component.getTameItems.map(item => item.typeId));
      const food = Array.isArray(tameItems) ? tameItems[0] : undefined;
      let interactionsAccepted = 0;
      let initialFood = 0;
      if (food) {
        inventory.setItem(0, new ItemStack(food, 64));
        initialFood = inventory.getItem(0)?.amount ?? 0;
        player.selectedSlotIndex = 0;
        if (player.interactWithEntity(entity)) interactionsAccepted += 1;
        await test.idle(2);
      }
      nativeResults.push({
        typeId,
        tameItems,
        probability: readApi(() => component.probability),
        attemptedFood: food,
        interactionsAccepted,
        initialFood,
        remainingFood: inventory.getItem(0)?.amount ?? 0,
        remainingFoodType: inventory.getItem(0)?.typeId,
        isTamed: readApi(() => component.isTamed),
        ownerId: readApi(() => component.tamedToPlayerId),
      });
    }

    const directWolf = player.dimension.spawnEntity("minecraft:wolf", test.worldLocation({ x: 6, y: 3, z: 8 }));
    const directWolfTameable = directWolf.getComponent("minecraft:tameable");
    ensure(directWolfTameable, "Wolf did not expose minecraft:tameable.");
    const directTameResult = readApi(() => directWolfTameable.tame(player));
    await test.idle(2);
    const horse = player.dimension.spawnEntity("minecraft:horse", test.worldLocation({ x: 9, y: 3, z: 8 }));
    const horseTameMount = horse.getComponent("minecraft:tamemount");
    const horseTameResult = horseTameMount ? readApi(() => horseTameMount.tameToPlayer(true, player)) : "component_unavailable";
    if (horseTameMount) await test.idle(2);
    console.warn("AS_TAMING_API_SURFACE_PROBE " + JSON.stringify({
      nativeResults,
      interactionsBefore,
      interactionsAfter,
      tamesBefore,
      tamesAfter,
      directTame: {
        entityId: directWolf.id,
        result: directTameResult,
        isTamed: readApi(() => directWolfTameable.isTamed),
        ownerId: readApi(() => directWolfTameable.tamedToPlayerId),
      },
      horseDirectTame: {
        entityType: horse.typeId,
        result: horseTameResult,
        isTamed: horseTameMount ? readApi(() => horseTameMount.isTamed) : "component_unavailable",
        isTamedToPlayer: horseTameMount ? readApi(() => horseTameMount.isTamedToPlayer) : "component_unavailable",
        ownerId: horseTameMount ? readApi(() => horseTameMount.tamedToPlayerId) : "component_unavailable",
        components: horse.getComponents().map(value => value.typeId),
        hasTameable: horse.hasComponent("minecraft:tameable"),
        hasTameMount: horse.hasComponent("minecraft:tamemount"),
      },
    }));
    ensure(directTameResult === true, "EntityTameableComponent.tame did not return true for an untamed wolf.");
    ensure(tamesBefore.some(event => event.entityId === directWolf.id && event.actorId === player.id), "Direct component.tame did not emit entityTamed before-event with the owner.");
    ensure(tamesAfter.some(event => event.entityId === directWolf.id && event.actorId === player.id), "Direct component.tame did not emit entityTamed after-event with the owner.");
  } finally {
    world.beforeEvents.playerInteractWithEntity.unsubscribe(beforeInteraction);
    world.afterEvents.playerInteractWithEntity.unsubscribe(afterInteraction);
    world.beforeEvents.entityTamed.unsubscribe(beforeTame);
    world.afterEvents.entityTamed.unsubscribe(afterTame);
    for (const entity of tameEntities) {
      try { entity.remove(); } catch { /* Test cleanup after an already-despawned entity. */ }
    }
    player.disconnect();
  }
  test.succeed();
}).maxTicks(240).structureName(STRUCTURE).tag("augmentation_survival_taming_probe");

GameTest.registerAsync("AugmentationSurvival", "momentum_shift_fall_state_surface_probe", async (test) => {
  const floor = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:stone", floor);
  const player = test.spawnSimulatedPlayer({ x: 5, y: 12, z: 5 }, "ASMomentumFallProbe", GameMode.survival);
  const startY = player.location.y;
  let peakY = startY;
  const samples = [];
  const fallHurtEvents = [];
  const onHurt = event => {
    if (event.hurtEntity.id === player.id) fallHurtEvents.push({ damage: event.damage, cause: event.damageSource.cause });
  };
  let firstFallingY;
  let observedAirborne = false;
  let landed = false;
  world.afterEvents.entityHurt.subscribe(onHurt);
  try {
    for (let tick = 0; tick < 120; tick += 1) {
      const location = player.location;
      const onGround = player.isOnGround;
      const falling = player.isFalling;
      const velocityY = player.getVelocity().y;
      if (!onGround) peakY = Math.max(peakY, location.y);
      if (falling && firstFallingY === undefined) firstFallingY = location.y;
      if (!onGround || falling || velocityY < -0.001) observedAirborne = true;
      samples.push({ tick, y: location.y, onGround, falling, velocityY });
      if (tick >= 2 && observedAirborne && onGround && !falling) {
        landed = true;
        break;
      }
      await test.idle(1);
    }
  } finally {
    world.afterEvents.entityHurt.unsubscribe(onHurt);
  }
  const finalY = player.location.y;
  const observedFallFromFirstFallingSample = firstFallingY === undefined ? undefined : firstFallingY - finalY;
  const observedFallFromPeak = peakY - finalY;
  const transitions = samples.filter((sample, index) => index === 0
    || sample.onGround !== samples[index - 1].onGround
    || sample.falling !== samples[index - 1].falling
    || sample.tick % 5 === 0);
  console.warn("AS_MOMENTUM_FALL_STATE_PROBE " + JSON.stringify({
    startY,
    finalY,
    netDrop: startY - finalY,
    peakY,
    firstFallingY,
    observedFallFromFirstFallingSample,
    observedFallFromPeak,
    observedAirborne,
    landed,
    fallHurtEvents,
    transitions,
  }));
  ensure(landed && observedAirborne, "Simulated player did not expose a complete airborne-to-ground transition.");
  ensure(startY - finalY >= 4, `Test player dropped fewer than four blocks: ${startY - finalY}.`);
  ensure(firstFallingY !== undefined && observedFallFromPeak >= 4,
    `Stable position samples from the airborne peak did not cover the four-block threshold: ${observedFallFromPeak}.`);
  player.disconnect();
  test.succeed();
}).maxTicks(150).structureName(STRUCTURE).tag("augmentation_survival_momentum_probe");

GameTest.registerAsync("AugmentationSurvival", "momentum_shift_applies_landing_bonus_and_expires", async (test) => {
  const floor = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:stone", floor);
  const players = [];
  const fallDamageEvents = [];
  let cancelledFallDamage = 0;
  const onHurtBefore = event => {
    if (players.some(player => player.id === event.hurtEntity.id)
        && event.damageSource.cause === EntityDamageCause.fall) {
      event.cancel = true;
      cancelledFallDamage += 1;
    }
  };
  const onHurt = event => {
    if (players.some(player => player.id === event.hurtEntity.id)) {
      fallDamageEvents.push({ id: event.hurtEntity.id, cause: event.damageSource.cause, damage: event.damage });
    }
  };
  world.beforeEvents.entityHurt.subscribe(onHurtBefore);
  world.afterEvents.entityHurt.subscribe(onHurt);

  async function spawnAndLand(name, startY, expectedDrop) {
    const player = test.spawnSimulatedPlayer({ x: 5, y: startY, z: 5 }, name, GameMode.survival);
    players.push(player);
    const start = player.location.y;
    const seedLevel = name === "ASMomentumShiftStack" ? 1
      : name === "ASMomentumShiftBelowThreshold" ? 3
        : Number(name.slice(-1));
    let seeded = false;
    for (let tick = 0; tick < 10; tick += 1) {
      if (player.hasTag(`as_momentum_shift_seeded_${seedLevel}`)) {
        seeded = true;
        break;
      }
      await test.idle(1);
    }
    ensure(seeded, `${name}: production test profile did not seed its saved augment level.`);
    let airborne = false;
    let landed = false;
    for (let tick = 0; tick < 120; tick += 1) {
      const velocityY = player.getVelocity().y;
      if (!player.isOnGround || player.isFalling || velocityY < -0.001) airborne = true;
      if (airborne && player.isOnGround && !player.isFalling) {
        landed = true;
        break;
      }
      await test.idle(1);
    }
    ensure(landed, `${name}: did not complete a fall and landing.`);
    const drop = start - player.location.y;
    ensure(Math.abs(drop - expectedDrop) < 0.05, `${name}: expected a ${expectedDrop}-block fall, observed ${drop}.`);
    return player;
  }

  function movementOf(player) {
    const movement = player.getComponent("minecraft:movement");
    ensure(movement, `${player.name}: native movement component was unavailable.`);
    return movement;
  }

  try {
    for (let level = 1; level <= 3; level += 1) {
      const player = await spawnAndLand(`ASMomentumShiftLevel${level}`, 12, 4);
      const movement = movementOf(player);
      const expected = movement.defaultValue * (1 + 0.10 * level);
      let activated = false;
      for (let tick = 0; tick < 5; tick += 1) {
        await test.idle(1);
        if (Math.abs(movement.currentValue - expected) < 0.00001) {
          activated = true;
          break;
        }
      }
      ensure(activated, `Level ${level} landing did not set movement to its exact +${10 * level}% value.`);

      if (level === 3) {
        for (let tick = 0; tick < 54; tick += 1) {
          await test.idle(1);
          ensure(Math.abs(movement.currentValue - expected) < 0.00001,
            "Momentum Shift expired before its 60-tick Java window elapsed.");
        }
        let expired = false;
        for (let tick = 0; tick < 12; tick += 1) {
          await test.idle(1);
          if (Math.abs(movement.currentValue - movement.defaultValue) < 0.00001) {
            expired = true;
            break;
          }
        }
        ensure(expired, "Momentum Shift did not restore its base movement after the 60-tick window.");
      }
      player.disconnect();
    }

    const stacked = await spawnAndLand("ASMomentumShiftStack", 12, 4);
    const stackedMovement = movementOf(stacked);
    await test.idle(1);
    ensure(Math.abs(stackedMovement.currentValue - stackedMovement.defaultValue * 1.19) < 0.00001,
      "Level-1 Momentum Shift did not add +10% to level-3 Quick Feet's +9% shared movement bonus.");
    stacked.disconnect();

    const shortFall = await spawnAndLand("ASMomentumShiftBelowThreshold", 11, 3);
    const shortMovement = movementOf(shortFall);
    await test.idle(3);
    ensure(Math.abs(shortMovement.currentValue - shortMovement.defaultValue) < 0.00001,
      "A three-block fall incorrectly activated Momentum Shift.");
    shortFall.disconnect();

    ensure(cancelledFallDamage > 0,
      "No fall before-event was observed to verify Momentum Shift when landing damage is cancelled.");
    ensure(fallDamageEvents.length === 0,
      "A cancelled fall before-event still emitted an after-event; Momentum Shift's test should be independent of damage.");
  } finally {
    world.beforeEvents.entityHurt.unsubscribe(onHurtBefore);
    world.afterEvents.entityHurt.unsubscribe(onHurt);
    for (const player of players) {
      try { player.disconnect(); } catch { /* Clean up a simulated player after a failed assertion. */ }
    }
  }
  test.succeed();
}).maxTicks(400).structureName(STRUCTURE).tag(TAG).tag("augmentation_survival_momentum_production");

GameTest.registerAsync("AugmentationSurvival", "mantle_reconstructs_collision_and_resets_momentum_fall_phase", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 15, z: 4.5 }, "ASMantleProduction", GameMode.survival);
  try {
    player.setRotation({ x: 0, y: -90 });
    const view = player.getViewDirection();
    const horizontalLength = Math.hypot(view.x, view.z);
    ensure(horizontalLength > 0.9, "The test player did not receive a horizontal view direction.");
    const forward = { x: view.x / horizontalLength, z: view.z / horizontalLength };
    const alongX = Math.abs(forward.x) >= Math.abs(forward.z);
    const positive = alongX ? forward.x > 0 : forward.z > 0;
    const wall = alongX
      ? { x: positive ? 5 : 3, z: 4, y: 11 }
      : { x: 4, z: positive ? 5 : 3, y: 11 };
    const start = alongX
      ? { x: positive ? wall.x - 0.31 : wall.x + 1.31, y: 15, z: 4.5 }
      : { x: 4.5, y: 15, z: positive ? wall.z - 0.31 : wall.z + 1.31 };
    const toWorld = location => {
      const block = test.worldBlockLocation({ x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) });
      return { x: block.x + location.x - Math.floor(location.x), y: block.y + location.y - Math.floor(location.y), z: block.z + location.z - Math.floor(location.z) };
    };
    const ledgeWorldY = toWorld({ x: 0, y: 11.5, z: 0 }).y;
    const hole = { x: Math.floor(start.x), z: Math.floor(start.z) };
    const setBlock = (typeId, location) => {
      const block = player.dimension.getBlock(test.worldBlockLocation(location));
      ensure(block, `The mantle fixture block ${JSON.stringify(location)} was not loaded.`);
      block.setType(typeId);
    };

    for (let x = 1; x <= 8; x += 1) {
      for (let y = 9; y <= 14; y += 1) {
        for (let z = 1; z <= 8; z += 1) setBlock("minecraft:air", { x, y, z });
      }
    }
    for (let x = 1; x <= 8; x += 1) {
      for (let z = 1; z <= 8; z += 1) setBlock("minecraft:stone", { x, y: 9, z });
    }
    setBlock("minecraft:air", { x: hole.x, y: 9, z: hole.z });
    for (let y = 9; y <= wall.y; y += 1) setBlock("minecraft:stone", { x: wall.x, y, z: wall.z });

    player.teleport(toWorld(start), { checkForBlocks: false, keepVelocity: false });
    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:momentum_shift": 3 }));
    let reachedLedgeHeight = false;
    for (let tick = 0; tick < 80; tick += 1) {
      if (player.location.y <= ledgeWorldY) {
        reachedLedgeHeight = true;
        break;
      }
      await test.idle(1);
    }
    ensure(reachedLedgeHeight, "The player did not fall to the ledge test height.");
    player.teleport(toWorld({ x: start.x, y: 11.25, z: start.z }), { checkForBlocks: false, keepVelocity: false });
    await test.idle(1);
    player.teleport(toWorld({ x: start.x, y: 11.25, z: start.z }), { checkForBlocks: false, keepVelocity: false });

    ensure(!tryMantle(player, { x: 0, y: 1 }), "An unowned player mantled the ledge.");
    player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
      "augmentation_survival:momentum_shift": 3,
      "augmentation_survival:mantle": 1,
    }));
    ensure(!tryMantle(player, { x: 0, y: 0 }), "Mantle activated without movement input.");

    setBlock("minecraft:stone", { x: wall.x, y: wall.y + 1, z: wall.z });
    ensure(!tryMantle(player, { x: 0, y: 1 }), "Mantle entered a blocked block destination.");
    setBlock("minecraft:air", { x: wall.x, y: wall.y + 1, z: wall.z });

    const blockedTarget = {
      x: start.x + forward.x * 0.35,
      y: 12.25,
      z: start.z + forward.z * 0.35,
    };
    const blocker = test.spawn("minecraft:cow", blockedTarget);
    ensure(!tryMantle(player, { x: 0, y: 1 }), "Mantle entered a living entity's collision bounds.");
    blocker.remove();

    setBlock("minecraft:air", { x: wall.x, y: wall.y, z: wall.z });
    ensure(!tryMantle(player, { x: 0, y: 1 }), "Mantle activated without a horizontal block collision.");
    setBlock("minecraft:stone", { x: wall.x, y: wall.y, z: wall.z });

    const before = player.location;
    const bounds = player.getAABB();
    ensure(tryMantle(player, { x: 0, y: 1 }), "Owned player could not mantle a clear ledge.");
    const after = player.location;
    const forwardDisplacement = (after.x - before.x) * forward.x + (after.z - before.z) * forward.z;
    ensure(Math.abs(after.y - before.y - 1) < 0.02, `Mantle did not raise the player exactly one block: ${after.y - before.y}.`);
    ensure(Math.abs(forwardDisplacement - 0.35) < 0.03, `Mantle forward displacement should be 0.35, got ${forwardDisplacement}.`);
    ensure(player.getVelocity().y >= -0.001, "Mantle retained downward vertical velocity.");

    const exit = {
      x: alongX ? (positive ? 7.5 : 1.5) : 4.5,
      y: 12.25,
      z: alongX ? 4.5 : (positive ? 7.5 : 1.5),
    };
    player.teleport(toWorld(exit), { checkForBlocks: false, keepVelocity: false });
    player.applyImpulse({ x: 0, y: -0.05, z: 0 });
    let landed = false;
    for (let tick = 0; tick < 100; tick += 1) {
      await test.idle(1);
      if (player.isOnGround) {
        landed = true;
        break;
      }
    }
    ensure(landed, "The post-mantle fall did not land on the lower floor.");
    await test.idle(2);
    const movement = player.getComponent("minecraft:movement");
    ensure(movement, "The test player had no movement component.");
    ensure(Math.abs(movement.currentValue - movement.defaultValue) < 0.00001,
      "The pre-mantle fall was incorrectly included in Momentum Shift after the ledge reset.");
  } finally {
    try { player.disconnect(); } catch { /* Clean up after an assertion failure. */ }
  }
  test.succeed();
}).maxTicks(260).structureName(STRUCTURE).tag(TAG).tag("augmentation_survival_mantle_production");

GameTest.registerAsync("AugmentationSurvival", "nocturnal_and_sun_affinity_share_the_day_night_movement_axis", async (test) => {
  const previousTime = world.getTimeOfDay();
  try {
    const nocturnal = [1, 2, 3].map((level, index) => ({
      level,
      player: test.spawnSimulatedPlayer({ x: 1 + index * 2, y: 3, z: 2 }, `ASNocturnalLevel${level}`, GameMode.survival),
    }));
    const sunAffinity = [1, 2, 3].map((level, index) => ({
      level,
      player: test.spawnSimulatedPlayer({ x: 1 + index * 2, y: 3, z: 5 }, `ASSunAffinityLevel${level}`, GameMode.survival),
    }));
    const stacked = test.spawnSimulatedPlayer({ x: 8, y: 3, z: 3 }, "ASDayNightMovementStack", GameMode.survival);
    const movementOf = (player) => {
      const movement = player.getComponent("minecraft:movement");
      ensure(movement, `${player.name}: general movement component was unavailable.`);
      return movement;
    };

    world.setTimeOfDay(14_000);
    await test.idle(3);
    for (const entry of nocturnal) {
      const movement = movementOf(entry.player);
      const expected = movement.defaultValue * (1 + 0.05 * entry.level);
      ensure(Math.abs(movement.currentValue - expected) < 0.000001,
        `${entry.player.name}: expected night movement ${expected}, got ${movement.currentValue}.`);
    }
    for (const entry of sunAffinity) {
      const movement = movementOf(entry.player);
      ensure(Math.abs(movement.currentValue - movement.defaultValue) < 0.000001,
        `${entry.player.name}: Sun Affinity must not increase movement at night.`);
    }
    let stackedMovement = movementOf(stacked);
    let expectedStack = stackedMovement.defaultValue * (1 + 0.03 * 5 + 0.05 * 2);
    ensure(Math.abs(stackedMovement.currentValue - expectedStack) < 0.000001,
      `Night stack expected Quick Feet + Nocturnal = ${expectedStack}, got ${stackedMovement.currentValue}.`);

    world.setTimeOfDay(12_000);
    await test.idle(3);
    for (const entry of nocturnal) {
      const movement = movementOf(entry.player);
      ensure(Math.abs(movement.currentValue - movement.defaultValue) < 0.000001,
        `${entry.player.name}: Nocturnal must not increase movement during daytime.`);
    }
    for (const entry of sunAffinity) {
      const movement = movementOf(entry.player);
      const expected = movement.defaultValue * (1 + 0.04 * entry.level);
      ensure(Math.abs(movement.currentValue - expected) < 0.000001,
        `${entry.player.name}: expected daytime movement ${expected}, got ${movement.currentValue}.`);
    }
    stackedMovement = movementOf(stacked);
    expectedStack = stackedMovement.defaultValue * (1 + 0.03 * 5 + 0.04 * 3);
    ensure(Math.abs(stackedMovement.currentValue - expectedStack) < 0.000001,
      `Day stack expected Quick Feet + Sun Affinity = ${expectedStack}, got ${stackedMovement.currentValue}.`);

    console.warn(`AS_DAY_NIGHT_MOVEMENT_STACK ${JSON.stringify({ timeOfDay: world.getTimeOfDay(), nightMultiplier: 1.25, dayMultiplier: 1.27 })}`);
  } finally {
    world.setTimeOfDay(previousTime);
  }
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: observe the stable event/component surface available around
// a vanilla fishing-rod use. This does not implement or count Fishing Sense.
GameTest.registerAsync("AugmentationSurvival", "fishing_hook_stable_api_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 4 }, "ASFishingSurfaceProbe", GameMode.survival);
  const inventory = player.getComponent("minecraft:inventory")?.container;
  ensure(inventory, "Fishing surface probe player inventory was unavailable.");
  inventory.setItem(0, new ItemStack("minecraft:fishing_rod"));
  player.selectedSlotIndex = 0;
  player.setRotation({ x: 20, y: 0 });

  const observations = [];
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId !== "minecraft:fishing_hook") return;
    const projectile = entity.getComponent("minecraft:projectile");
    const componentIds = ["minecraft:projectile", "minecraft:fishing_hook", "minecraft:timer"];
    observations.push({
      event: "entitySpawn",
      componentIds: componentIds.filter(componentId => {
        try { return entity.getComponent(componentId) !== undefined; } catch { return false; }
      }),
      hasProjectileOwner: projectile?.owner?.id === player.id,
    });
  });
  for (const [name, signal] of [
    ["itemUse", world.afterEvents.itemUse],
    ["itemStartUse", world.afterEvents.itemStartUse],
    ["itemStopUse", world.afterEvents.itemStopUse],
  ]) {
    signal.subscribe(event => {
      if (event.source?.id === player.id && event.itemStack?.typeId === "minecraft:fishing_rod") {
        observations.push({ event: name, itemId: event.itemStack.typeId });
      }
    });
  }

  const useResult = player.useItemInSlot(0);
  // Level-3 XP pickup can take 14 ticks after the native orb is moved into range.
  await test.idle(20);
  const hooks = player.dimension.getEntities({ type: "minecraft:fishing_hook", location: player.location, maxDistance: 32 });
  const ownedHook = hooks.find(hook => hook.getComponent("minecraft:projectile")?.owner?.id === player.id);
  const hookComponents = ownedHook ? ["minecraft:projectile", "minecraft:fishing_hook", "minecraft:timer"].filter(componentId => {
    try { return ownedHook.getComponent(componentId) !== undefined; } catch { return false; }
  }) : [];
  console.warn(`AS_FISHING_SURFACE_PROBE ${JSON.stringify({ useResult, observations, nearbyHookCount: hooks.length, ownedHook: Boolean(ownedHook), hookComponents })}`);
  test.succeed();
}).maxTicks(60).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: the official stable declarations do not expose the
// pre-release breathable.airSupply property. Check whether the installed BDS
// runtime nevertheless exposes it on a submerged player; this is not shipped.
GameTest.registerAsync("AugmentationSurvival", "breathable_air_supply_api_surface_probe", async (test) => {
  for (let x = 1; x <= 5; x += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:water", { x, y, z });
    }
  }
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASBreathableSurfaceProbe", GameMode.survival);
  await test.idle(3);
  const component = player.getComponent("minecraft:breathable");
  const initial = component && "airSupply" in component ? component.airSupply : undefined;
  let setValue;
  let afterSet;
  let afterTicks;
  let error;
  if (component && typeof initial === "number") {
    try {
      setValue = Math.max(component.suffocateTime, initial - 40);
      component.airSupply = setValue;
      afterSet = component.airSupply;
      await test.idle(4);
      afterTicks = component.airSupply;
    } catch (caught) {
      error = String(caught);
    }
  }
  console.warn(`AS_BREATHABLE_SURFACE_PROBE ${JSON.stringify({
    submerged: player.isInWater,
    componentAvailable: Boolean(component),
    airSupplyExposed: Boolean(component && "airSupply" in component),
    initial,
    setValue,
    afterSet,
    afterTicks,
    error,
  })}`);
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect the stable scripting surface while a player is in
// powder snow. This does not alter or count as Cold Adaptation gameplay.
GameTest.registerAsync("AugmentationSurvival", "freeze_buildup_api_surface_probe", async (test) => {
  for (let x = 1; x <= 5; x += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:powder_snow", { x, y, z });
    }
  }
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASFreezeSurfaceProbe", GameMode.survival);
  await test.idle(3);
  const componentIds = player.getComponents().map(component => component.typeId).sort();
  const componentChecks = [
    "minecraft:freezing",
    "minecraft:freezing_immune",
    "minecraft:freezing_vulnerable",
  ].map(id => ({ id, available: Boolean(player.getComponent(id)) }));
  const propertyChecks = ["isFreezing", "isFrozen", "ticksFrozen", "getTicksFrozen", "setTicksFrozen"]
    .map(name => ({ name, valueType: typeof player[name] }));
  console.warn("AS_FREEZE_SURFACE_PROBE " + JSON.stringify({
    damageCause: EntityDamageCause.freezing,
    componentIds,
    componentChecks,
    propertyChecks,
    location: player.location,
  }));
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect player attack-speed components and stable component IDs.
// This does not alter or count as Rapid Strikes gameplay.
GameTest.registerAsync("AugmentationSurvival", "attack_speed_api_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASAttackSpeedSurfaceProbe", GameMode.survival);
  await test.idle(2);
  const componentIds = player.getComponents().map(component => component.typeId).sort();
  const attackComponentChecks = [
    "minecraft:attack_speed",
    "minecraft:attack",
    "minecraft:attack_cooldown",
    "minecraft:attack_damage",
    "minecraft:attack_knockback",
  ].map(id => {
    try {
      const component = player.getComponent(id);
      return {
        id,
        available: Boolean(component),
        currentValue: component?.currentValue,
        defaultValue: component?.defaultValue,
      };
    } catch (error) {
      return { id, available: false, error: String(error) };
    }
  });
  const stableAttackTypeIds = Object.entries(EntityComponentTypes)
    .filter(([name, id]) => /attack/i.test(`${name} ${id}`));
  const playerProperties = ["attackSpeed", "attack_speed", "attackCooldown", "getAttribute"]
    .map(name => ({ name, valueType: typeof player[name] }));
  console.warn("AS_ATTACK_SPEED_SURFACE_PROBE " + JSON.stringify({
    componentIds,
    stableAttackTypeIds,
    attackComponentChecks,
    playerProperties,
  }));
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect stable player range attributes and supported input buttons.
// This does not alter or count as Long Reach gameplay.
GameTest.registerAsync("AugmentationSurvival", "long_reach_api_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASLongReachSurfaceProbe", GameMode.survival);
  await test.idle(2);
  const componentIds = player.getComponents().map(component => component.typeId).sort();
  const rangeComponentChecks = [
    "minecraft:block_interaction_range",
    "minecraft:entity_interaction_range",
    "minecraft:interaction_range",
  ].map(id => {
    try {
      const component = player.getComponent(id);
      return { id, available: Boolean(component), currentValue: component?.currentValue };
    } catch (error) {
      return { id, available: false, error: String(error) };
    }
  });
  const stableRangeTypeIds = Object.entries(EntityComponentTypes)
    .filter(([name, id]) => /interaction.?range|block.?reach|reach/i.test(`${name} ${id}`));
  const rangeProperties = [
    "blockInteractionRange",
    "block_interaction_range",
    "interactionRange",
    "getAttribute",
    "getAttributeValue",
  ].map(name => ({ name, valueType: typeof player[name] }));
  const supportedInputButtons = Object.values(InputButton).sort();
  const raycastMethods = {
    playerViewRay: typeof player.getBlockFromViewDirection,
    dimensionRay: typeof player.dimension.getBlockFromRay,
  };
  console.warn("AS_LONG_REACH_SURFACE_PROBE " + JSON.stringify({
    componentIds,
    rangeComponentChecks,
    stableRangeTypeIds,
    rangeProperties,
    supportedInputButtons,
    inputInfo: {
      valueType: typeof player.inputInfo,
      getButtonState: typeof player.inputInfo?.getButtonState,
    },
    raycastMethods,
  }));
  ensure(supportedInputButtons.join(",") === "Jump,Sneak", "Stable input button surface changed; re-assess Long Reach.");
  ensure(stableRangeTypeIds.length === 0, "A stable range component appeared; re-assess Long Reach.");
  ensure(rangeComponentChecks.every(check => !check.available), "A player range component appeared; re-assess Long Reach.");
  ensure(rangeProperties.every(property => property.valueType === "undefined"), "A player range attribute API appeared; re-assess Long Reach.");
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect the stable player knockback surface and event timing.
// This does not alter or count as Brace gameplay.
GameTest.registerAsync("AugmentationSurvival", "brace_knockback_resistance_api_probe", async (test) => {
  const attacker = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASBraceProbeAttacker", GameMode.survival);
  const target = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASBraceProbeTarget", GameMode.survival);
  await test.idle(2);
  attacker.isSprinting = true;
  const startingMotion = { location: target.location, velocity: target.getVelocity() };

  /** @type {Array<Record<string, unknown>>} */
  const eventSnapshots = [];
  const beforeCallback = (event) => {
    if (event?.hurtEntity?.id !== target.id) return;
    eventSnapshots.push({
      stage: "before",
      cause: event.damageSource.cause,
      damage: event.damage,
      velocity: target.getVelocity(),
    });
  };
  const afterCallback = (event) => {
    if (event?.hurtEntity?.id !== target.id) return;
    eventSnapshots.push({
      stage: "after-callback",
      cause: event.damageSource.cause,
      damage: event.damage,
      velocity: target.getVelocity(),
    });
    system.run(() => {
      try {
        eventSnapshots.push({ stage: "next-script-tick", velocity: target.getVelocity() });
      } catch (error) {
        eventSnapshots.push({ stage: "next-script-tick", error: String(error) });
      }
    });
  };
  world.beforeEvents.entityHurt.subscribe(beforeCallback);
  world.afterEvents.entityHurt.subscribe(afterCallback);
  const attackPerformed = attacker.attackEntity(target);
  /** @type {Array<Record<string, unknown>>} */
  const tickMotion = [];
  for (let tick = 1; tick <= 4; tick += 1) {
    await test.idle(1);
    tickMotion.push({ tick, location: target.location, velocity: target.getVelocity() });
  }
  world.beforeEvents.entityHurt.unsubscribe(beforeCallback);
  world.afterEvents.entityHurt.unsubscribe(afterCallback);

  const componentIds = target.getComponents().map(component => component.typeId).sort();
  const resistanceChecks = ["minecraft:knockback_resistance", "knockback_resistance"].map(id => {
    try {
      const component = target.getComponent(id);
      return {
        id,
        available: Boolean(component),
        keys: component ? Object.keys(component) : [],
        value: component?.value,
        currentValue: component?.currentValue,
        defaultValue: component?.defaultValue,
      };
    } catch (error) {
      return { id, available: false, error: String(error) };
    }
  });
  const stableResistanceTypes = Object.entries(EntityComponentTypes)
    .filter(([name, id]) => /knockback/i.test(`${name} ${id}`));
  const result = {
    attackPerformed,
    componentIds,
    resistanceChecks,
    stableResistanceTypes,
    eventSnapshots,
    startingMotion,
    tickMotion,
    finalVelocity: target.getVelocity(),
  };
  console.warn("AS_BRACE_KNOCKBACK_SURFACE_PROBE " + JSON.stringify(result));
  ensure(attackPerformed, "The simulated attacker could not perform an attack against the probe target.");
  ensure(eventSnapshots.some(event => event.stage === "before"), "The melee probe did not produce a before-hurt event.");
  ensure(eventSnapshots.some(event => event.stage === "after-callback"), "The melee probe did not produce an after-hurt event.");
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect the vanilla shield-disable boundary and the stable
// Script API surface available to Shield Grip. This does not alter gameplay.
GameTest.registerAsync("AugmentationSurvival", "shield_grip_shield_disable_api_probe", async (test) => {
  const attacker = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASShieldGripProbeAttacker", GameMode.survival);
  const defender = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASShieldGripProbeDefender", GameMode.survival);
  test.setBlockType("minecraft:stone", { x: 3, y: 2, z: 3 });
  test.setBlockType("minecraft:stone", { x: 5, y: 2, z: 3 });
  await test.idle(2);

  const equippable = defender.getComponent(EntityComponentTypes.Equippable);
  ensure(equippable, "The simulated defender did not expose the stable equippable component.");
  const shieldEquipped = equippable.setEquipment("Offhand", new ItemStack("minecraft:shield"));
  ensure(shieldEquipped, "The simulated defender could not equip a vanilla shield in the offhand.");
  defender.isSneaking = true;
  defender.lookAtEntity(attacker);
  inventoryOf(attacker).setItem(0, new ItemStack("minecraft:iron_axe"));
  await test.idle(5);

  /** @type {Array<Record<string, unknown>>} */
  const observations = [];
  const beforeCallback = (event) => {
    if (event?.hurtEntity?.id !== defender.id) return;
    observations.push({
      event: "entityHurtBefore",
      cause: event.damageSource.cause,
      damage: event.damage,
      canceled: event.cancel,
    });
  };
  const afterCallback = (event) => {
    if (event?.hurtEntity?.id !== defender.id) return;
    observations.push({
      event: "entityHurtAfter",
      cause: event.damageSource.cause,
      damage: event.damage,
    });
  };
  world.beforeEvents.entityHurt.subscribe(beforeCallback);
  world.afterEvents.entityHurt.subscribe(afterCallback);
  const useCallbacks = [];
  for (const [name, signal] of [
    ["itemStartUse", world.afterEvents.itemStartUse],
    ["itemStopUse", world.afterEvents.itemStopUse],
    ["itemReleaseUse", world.afterEvents.itemReleaseUse],
  ]) {
    if (!signal) continue;
    const callback = (event) => {
      if (event.source?.id === defender.id) {
        observations.push({ event: name, itemTypeId: event.itemStack?.typeId });
      }
    };
    signal.subscribe(callback);
    useCallbacks.push([signal, callback]);
  }

  const health = defender.getComponent(EntityComponentTypes.Health);
  const attacks = [];
  let disabledCooldown;
  let shieldSwapAttack;
  let nativeRecoveryAttack;
  for (let index = 0; index < 4 && disabledCooldown === undefined; index += 1) {
    if (index > 0) await test.idle(20);
    let cooldownBefore;
    let cooldownAfter;
    try { cooldownBefore = defender.getItemCooldown("shield"); } catch (error) { cooldownBefore = String(error); }
    const healthBefore = health?.currentValue;
    const performed = attacker.attackEntity(defender);
    await test.idle(2);
    try { cooldownAfter = defender.getItemCooldown("shield"); } catch (error) { cooldownAfter = String(error); }
    attacks.push({
      index,
      performed,
      healthBefore,
      healthAfter: health?.currentValue,
      shieldCooldownBefore: cooldownBefore,
      shieldCooldownAfter: cooldownAfter,
      sneaking: defender.isSneaking,
      offhand: equippable.getEquipment("Offhand")?.typeId,
    });
    if (typeof cooldownAfter === "number" && cooldownAfter > 0) disabledCooldown = cooldownAfter;
  }

  let cooldownAfterOverride;
  let cooldownAfterExpiry;
  if (typeof disabledCooldown === "number") {
    defender.startItemCooldown("shield", 55);
    try { cooldownAfterOverride = defender.getItemCooldown("shield"); } catch (error) { cooldownAfterOverride = String(error); }
    await test.idle(60);
    try { cooldownAfterExpiry = defender.getItemCooldown("shield"); } catch (error) { cooldownAfterExpiry = String(error); }
    const replacementShield = equippable.getEquipment("Offhand")?.clone();
    ensure(replacementShield?.typeId === "minecraft:shield", "The probe shield was unavailable for a replacement check.");
    ensure(equippable.setEquipment("Offhand", undefined), "The probe shield could not be removed for the replacement check.");
    ensure(equippable.setEquipment("Offhand", replacementShield), "The cloned probe shield could not be re-equipped.");
    const hurtCountBeforeShieldSwapAttack = observations.filter(event => event.event === "entityHurtBefore").length;
    const shieldSwapPerformed = attacker.attackEntity(defender);
    await test.idle(2);
    shieldSwapAttack = {
      performed: shieldSwapPerformed,
      healthAfter: health?.currentValue,
      shieldCooldown: defender.getItemCooldown("shield"),
      hurtEventObserved: observations.filter(event => event.event === "entityHurtBefore").length > hurtCountBeforeShieldSwapAttack,
      offhand: equippable.getEquipment("Offhand")?.typeId,
      sneaking: defender.isSneaking,
    };
    await test.idle(40);
    const hurtCountBeforeNativeRecoveryAttack = observations.filter(event => event.event === "entityHurtBefore").length;
    const recoveryPerformed = attacker.attackEntity(defender);
    await test.idle(2);
    nativeRecoveryAttack = {
      performed: recoveryPerformed,
      healthAfter: health?.currentValue,
      shieldCooldown: defender.getItemCooldown("shield"),
      hurtEventObserved: observations.filter(event => event.event === "entityHurtBefore").length > hurtCountBeforeNativeRecoveryAttack,
      offhand: equippable.getEquipment("Offhand")?.typeId,
      sneaking: defender.isSneaking,
    };
  }
  world.beforeEvents.entityHurt.unsubscribe(beforeCallback);
  world.afterEvents.entityHurt.unsubscribe(afterCallback);
  for (const [signal, callback] of useCallbacks) signal.unsubscribe(callback);

  const stableShieldTypes = Object.entries(EntityComponentTypes)
    .filter(([name, typeId]) => /shield|block.?attack/i.test(`${name} ${typeId}`));
  const result = {
    attacks,
    cooldownAfterOverride,
    cooldownAfterExpiry,
    shieldSwapAttack,
    nativeRecoveryAttack,
    observations,
    defenderComponents: defender.getComponents().map(component => component.typeId).sort(),
    stableShieldTypes,
    supportedInputButtons: Object.values(InputButton).sort(),
    playerApiSurface: {
      isSneaking: typeof defender.isSneaking,
      isBlocking: typeof defender.isBlocking,
      getItemCooldown: typeof defender.getItemCooldown,
      startItemCooldown: typeof defender.startItemCooldown,
    },
  };
  console.warn(`AS_SHIELD_GRIP_DISABLE_SURFACE_PROBE ${JSON.stringify(result)}`);
  ensure(attacks[0]?.performed, "The simulated attacker could not perform its first attack against the shield probe.");
  ensure(typeof disabledCooldown === "number", "The shield probe did not observe a native shield cooldown.");
  ensure(typeof cooldownAfterOverride === "number" && cooldownAfterOverride <= 55, "The stable cooldown API did not reduce the shield cooldown to 55 ticks.");
  ensure(cooldownAfterExpiry === 0, "The shortened shield cooldown did not expire within 60 ticks.");
  ensure(shieldSwapAttack?.performed, "The shield replacement bypass check could not execute its simulated attack.");
  ensure(nativeRecoveryAttack?.performed && !nativeRecoveryAttack.hurtEventObserved, "The shield did not block again after the native disable interval elapsed.");
  test.succeed();
}).maxTicks(180).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: measure whether Haste can approximate Java's underwater mining multiplier.
// This does not alter or count as Water Work gameplay.
GameTest.registerAsync("AugmentationSurvival", "underwater_work_haste_route_probe", async (test) => {
  const cases = [
    { hasteAmplifier: undefined, name: "ASUnderwaterWorkControl", x: 1, targetMultiplier: 1 },
    { hasteAmplifier: 0, name: "ASUnderwaterWorkHasteI", x: 3, targetMultiplier: 1.8 },
    { hasteAmplifier: 1, name: "ASUnderwaterWorkHasteII", x: 5 },
    { hasteAmplifier: 2, name: "ASUnderwaterWorkHasteIII", x: 7, targetMultiplier: 2.6 },
    { hasteAmplifier: 3, name: "ASUnderwaterWorkHasteIV", x: 9, targetMultiplier: 3.4 },
    { hasteAmplifier: 4, name: "ASUnderwaterWorkHasteV", x: 11 },
  ];
  for (let x = 1; x <= 12; x += 1) {
    for (let y = 3; y <= 5; y += 1) {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:water", { x, y, z });
    }
  }
  for (let x = 1; x <= 13; x += 1) {
    for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const players = cases.map(entry => {
    const player = test.spawnSimulatedPlayer({ x: entry.x, y: 3, z: 2 }, entry.name, GameMode.survival);
    inventoryOf(player).setItem(0, new ItemStack("minecraft:diamond_pickaxe"));
    if (entry.hasteAmplifier !== undefined) {
      player.addEffect("haste", 400, { amplifier: entry.hasteAmplifier, showParticles: false });
    }
    const target = { x: entry.x + 1, y: 3, z: 2 };
    test.setBlockType("minecraft:stone", target);
    return { ...entry, player, target };
  });
  await test.idle(3);

  for (const entry of players) {
    ensure(entry.player.isInWater, `${entry.name}: simulated player did not enter water.`);
    const head = entry.player.getHeadLocation();
    const headBlock = entry.player.dimension.getBlock({ x: Math.floor(head.x), y: Math.floor(head.y), z: Math.floor(head.z) });
    ensure(headBlock?.typeId === "minecraft:water", `${entry.name}: head was not submerged in vanilla water.`);
    ensure(entry.player.breakBlock(entry.target), `${entry.name}: SimulatedPlayer could not start breaking stone.`);
    entry.startedAt = system.currentTick;
  }

  for (let tick = 0; tick < 80 && players.some(entry => entry.breakTicks === undefined); tick += 1) {
    await test.idle(1);
    for (const entry of players) {
      if (entry.breakTicks !== undefined) continue;
      const block = test.getBlock(entry.target);
      if (block && block.typeId !== "minecraft:stone") entry.breakTicks = system.currentTick - entry.startedAt;
    }
  }
  const result = players.map(entry => ({
    name: entry.name,
    hasteAmplifier: entry.hasteAmplifier,
    underwater: entry.player.isInWater,
    breakTicks: entry.breakTicks,
    multiplierVsControl: players[0].breakTicks / entry.breakTicks,
    canonicalComparisonTarget: entry.targetMultiplier,
  }));
  console.warn("AS_UNDERWATER_WORK_HASTE_ROUTE_PROBE " + JSON.stringify(result));
  ensure(result.every(entry => Number.isFinite(entry.breakTicks)), "A simulated player did not finish breaking stone within 80 ticks.");
  test.succeed();
}).maxTicks(110).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect the vanilla furnace and fuel-item scripting surface.
// This does not alter or count as Fuel Saver gameplay.
GameTest.registerAsync("AugmentationSurvival", "furnace_fuel_api_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASFurnaceSurfaceProbe", GameMode.survival);
  const location = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:furnace", location);
  await test.idle(2);

  const origin = {
    x: Math.floor(player.location.x) - 4,
    y: Math.round(player.location.y - 3),
    z: Math.floor(player.location.z) - 3,
  };
  const worldLocation = {
    x: origin.x + location.x,
    y: origin.y + location.y,
    z: origin.z + location.z,
  };
  const furnace = player.dimension.getBlock(worldLocation);
  ensure(furnace?.typeId === "minecraft:furnace",
    `Expected a furnace at ${JSON.stringify(worldLocation)}, found ${furnace?.typeId ?? "unloaded"}.`);
  const blockComponents = furnace.getComponents().map(component => component.typeId).sort();
  let inventory;
  let inventoryError;
  try {
    inventory = furnace.getComponent("minecraft:inventory")?.container;
  } catch (error) {
    inventoryError = String(error);
  }

  const coal = new ItemStack("minecraft:coal", 1);
  const coalComponentIds = coal.getComponents().map(component => component.typeId).sort();
  let fuelComponent;
  let fuelComponentError;
  try {
    fuelComponent = coal.getComponent("minecraft:fuel");
  } catch (error) {
    fuelComponentError = String(error);
  }
  const fuelComponentProperties = fuelComponent
    ? Object.fromEntries(["duration", "burnDuration", "burnTime"].map(key => [key, fuelComponent[key]]))
    : undefined;

  let beforeSlots;
  let afterSlots;
  if (inventory && inventory.size >= 3) {
    inventory.setItem(0, new ItemStack("minecraft:raw_iron", 1));
    inventory.setItem(1, coal);
    beforeSlots = [0, 1, 2].map(slot => inventory.getItem(slot)?.typeId ?? null);
    await test.idle(220);
    afterSlots = [0, 1, 2].map(slot => {
      const stack = inventory.getItem(slot);
      return stack ? { typeId: stack.typeId, amount: stack.amount } : null;
    });
  }

  const observations = {
    blockTypeId: furnace.typeId,
    blockComponents,
    inventoryAvailable: Boolean(inventory),
    inventorySize: inventory?.size,
    inventoryError,
    beforeSlots,
    afterSlots,
    coalComponentIds,
    fuelComponentAvailable: Boolean(fuelComponent),
    fuelComponentProperties,
    fuelComponentError,
  };
  console.warn(`AS_FURNACE_FUEL_SURFACE_PROBE ${JSON.stringify(observations)}`);
  test.succeed();
}).maxTicks(260).structureName(STRUCTURE).tag(TAG);

// Diagnostic only: inspect the vanilla brewing-stand API surface. No augment
// state or gameplay hook is installed.
GameTest.registerAsync("AugmentationSurvival", "fast_brewing_api_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASFastBrewingSurfaceProbe", GameMode.survival);
  const location = { x: 5, y: 2, z: 5 };
  test.setBlockType("minecraft:brewing_stand", location);
  await test.idle(2);

  const origin = {
    x: Math.floor(player.location.x) - 4,
    y: Math.round(player.location.y - 3),
    z: Math.floor(player.location.z) - 3,
  };
  const worldLocation = {
    x: origin.x + location.x,
    y: origin.y + location.y,
    z: origin.z + location.z,
  };
  const stand = player.dimension.getBlock(worldLocation);
  ensure(stand?.typeId === "minecraft:brewing_stand",
    `Expected a brewing stand at ${JSON.stringify(worldLocation)}, found ${stand?.typeId ?? "unloaded"}.`);

  const blockComponents = stand.getComponents().map(component => component.typeId).sort();
  const componentChecks = ["minecraft:inventory", "minecraft:recipe_processing", "minecraft:brewing", "minecraft:brewing_stand"]
    .map(componentId => {
      try {
        const component = stand.getComponent(componentId);
        return { componentId, available: Boolean(component), keys: component ? Object.keys(component) : [] };
      } catch (error) {
        return { componentId, available: false, error: String(error) };
      }
    });

  let inventory;
  let inventoryError;
  try {
    inventory = stand.getComponent("minecraft:inventory")?.container;
  } catch (error) {
    inventoryError = String(error);
  }
  ensure(inventory && inventory.size >= 5,
    `Brewing-stand block inventory was unavailable or too small (${inventory?.size ?? "none"}); ${inventoryError ?? ""}`);

  const states = stand.permutation.getAllStates();
  const stateNames = Object.keys(states).sort();
  const exposedComponentIds = new Set(blockComponents);
  const timerComponents = ["minecraft:recipe_processing", "minecraft:brewing", "minecraft:brewing_stand"];
  ensure(exposedComponentIds.has("minecraft:inventory"), "The brewing stand did not expose its five-slot inventory.");
  ensure(timerComponents.every(componentId => !exposedComponentIds.has(componentId)),
    `Unexpected brewing timer component exposed by BDS: ${blockComponents.filter(componentId => timerComponents.includes(componentId))}.`);
  ensure(JSON.stringify(stateNames) === JSON.stringify([
    "brewing_stand_slot_a_bit",
    "brewing_stand_slot_b_bit",
    "brewing_stand_slot_c_bit",
  ]), `Unexpected brewing-stand state surface: ${JSON.stringify(states)}.`);

  const observations = {
    blockTypeId: stand.typeId,
    blockComponents,
    states,
    componentChecks,
    inventoryAvailable: Boolean(inventory),
    inventorySize: inventory.size,
    inventoryError,
    timerComponents,
  };
  console.warn(`AS_FAST_BREWING_API_SURFACE_PROBE ${JSON.stringify(observations)}`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag("augmentation_survival_brewing_probe");

GameTest.registerAsync("AugmentationSurvival", "core_item_use_keeps_core_until_choice", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASCoreUse", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack(CORE, 1));
  ensure(player.useItemInSlot(0), "Simulated player could not use the common core.");
  await test.idle(5);
  ensure(countItem(inventory, CORE) === 1, "The core was consumed before the selection transaction.");
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "damage_event_exposes_simulated_player_damage", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASDamageEvent", GameMode.survival);
  const health = player.getComponent("minecraft:health");
  ensure(health, "Simulated player health component was unavailable.");
  await test.idle(1);

  /** @type {{damage:number,cause:string,hurtEntityId:string}|undefined} */
  let beforeDamage;
  /** @type {{damage:number,cause:string,hurtEntityId:string}|undefined} */
  let afterDamage;
  const beforeCallback = (event) => {
    if (!event?.hurtEntity || event.hurtEntity.id !== player.id) return;
    beforeDamage = { damage: event.damage, cause: event.damageSource.cause, hurtEntityId: event.hurtEntity.id };
  };
  const afterCallback = (event) => {
    if (!event?.hurtEntity || event.hurtEntity.id !== player.id) return;
    afterDamage = { damage: event.damage, cause: event.damageSource.cause, hurtEntityId: event.hurtEntity.id };
  };
  world.beforeEvents.entityHurt.subscribe(beforeCallback);
  world.afterEvents.entityHurt.subscribe(afterCallback);
  const applied = player.applyDamage(10, { cause: EntityDamageCause.magic });
  await test.idle(1);
  world.beforeEvents.entityHurt.unsubscribe(beforeCallback);
  world.afterEvents.entityHurt.unsubscribe(afterCallback);

  ensure(applied, "Simulated player rejected direct test damage.");
  ensure(beforeDamage?.hurtEntityId === player.id, `Before-event payload missing for simulated player; captured ${JSON.stringify(beforeDamage)}.`);
  ensure(afterDamage?.hurtEntityId === player.id, `After-event payload missing for simulated player; captured ${JSON.stringify(afterDamage)}.`);
  ensure(beforeDamage.cause === EntityDamageCause.magic && afterDamage.cause === EntityDamageCause.magic, "Damage event cause did not match the applied magic damage.");
  ensure(Math.abs(health.defaultValue - health.currentValue - 10) < 1e-6, `Unarmored magic damage expected 10 health loss; got ${health.defaultValue - health.currentValue}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "stable_mob_death_and_loot_event_probe", async (test) => {
  const attacker = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASLootEventProbe", GameMode.survival);
  const victim = attacker.dimension.spawnEntity("minecraft:cow", { x: 5, y: 3, z: 3 });
  console.warn(`AS_LOOT_EVENT_TARGET ${JSON.stringify({ id: victim.id, typeId: victim.typeId, isValid: victim.isValid })}`);
  ensure(victim.isValid, "The cow was invalid immediately after being spawned for the loot-event probe.");

  /** @type {Array<Record<string, unknown>>} */
  const events = [];
  const onDie = (event) => {
    if (event?.deadEntity?.id !== victim.id) return;
    let generated;
    let generationError;
    try {
      generated = world.getLootTableManager().generateLootFromEntity(event.deadEntity)?.map(stack => ({
        typeId: stack.typeId,
        amount: stack.amount,
      }));
    } catch (error) {
      generationError = String(error);
    }
    events.push({
      type: "entityDie",
      entityId: event.deadEntity.id,
      entityType: event.deadEntity.typeId,
      entityValid: event.deadEntity.isValid,
      damagingEntityId: event.damageSource.damagingEntity?.id,
      damagingEntityType: event.damageSource.damagingEntity?.typeId,
      cause: event.damageSource.cause,
      generated,
      generationError,
    });
  };
  const onItemDrop = (event) => {
    if (event?.entity?.id !== victim.id) return;
    events.push({
      type: "entityItemDrop",
      entityId: event.entity.id,
      items: event.items.map(item => {
        const stack = item.getComponent("minecraft:item")?.itemStack;
        return { id: item.id, typeId: stack?.typeId, amount: stack?.amount };
      }),
    });
  };
  world.afterEvents.entityDie.subscribe(onDie);
  world.afterEvents.entityItemDrop.subscribe(onItemDrop);
  const applied = victim.applyDamage(100, {
    cause: EntityDamageCause.entityAttack,
    damagingEntity: attacker,
  });
  await test.idle(2);
  world.afterEvents.entityDie.unsubscribe(onDie);
  world.afterEvents.entityItemDrop.unsubscribe(onItemDrop);
  console.warn(`AS_LOOT_EVENT_SURFACE ${JSON.stringify({ applied, events })}`);
  ensure(applied, "The simulated attacker could not kill the vanilla cow in the loot-event probe.");
  ensure(events.some(event => event.type === "entityDie"), `Stable entityDie did not report the victim death: ${JSON.stringify(events)}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "loot_scoop_matches_chance_levels_and_duplicates_a_player_kill_bundle", async (test) => {
  for (let level = 1; level <= 3; level += 1) {
    const chance = lootScoopChance(level);
    ensure(Math.abs(chance - level * 0.05) < 1e-12, `Loot Scoop level ${level} chance should be ${level * 0.05}; got ${chance}.`);
    ensure(lootScoopRollSucceeds(level, chance - 1e-9), `Loot Scoop level ${level} did not pass just below its chance boundary.`);
    ensure(!lootScoopRollSucceeds(level, chance), `Loot Scoop level ${level} passed its exclusive chance boundary.`);
  }
  ensure(Math.abs(lootScoopChance(4) - 0.15) < 1e-12, "Loot Scoop level must be capped at its Java maximum level 3.");
  ensure(lootScoopChance(0) === 0 && lootScoopChance(-1) === 0, "A missing or negative level must not roll for bonus loot.");
  for (const tier of ["common", "uncommon", "rare", "epic", "legendary", "mythic"]) {
    ensure(isAugmentCore(`augmentation_survival:${tier}_augment_core`), `${tier} core was not excluded from loot copying.`);
  }
  ensure(!isAugmentCore("minecraft:beef"), "Ordinary vanilla mob loot was incorrectly excluded as a core.");

  const attacker = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASLootScoopLevel3", GameMode.survival);
  attacker.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:loot_scoop": 3 }));
  const victim = attacker.dimension.spawnEntity("minecraft:cow", { x: 5, y: 3, z: 3 });
  ensure(victim.isValid, "The cow was invalid immediately after being spawned for Loot Scoop.");
  const lootLocation = { ...victim.location };
  /** @type {ReturnType<typeof processLootScoopDeath>|undefined} */
  let result;
  const callback = (event) => {
    if (event?.deadEntity?.id !== victim.id) return;
    ensure(event.damageSource.damagingEntity?.id === attacker.id, "The death event did not preserve direct player attribution.");
    result = processLootScoopDeath(event, () => 0, (generatedVictim, tool) => {
      ensure(generatedVictim.id === victim.id, "Loot Scoop generated a bonus bundle for a different victim.");
      ensure(tool === undefined, "Loot Scoop unexpectedly received a test-held tool.");
      return [new ItemStack("minecraft:beef", 2), new ItemStack(CORE, 1)];
    });
  };
  world.afterEvents.entityDie.subscribe(callback);
  const applied = victim.applyDamage(100, {
    cause: EntityDamageCause.entityAttack,
    damagingEntity: attacker,
  });
  await test.idle(2);
  world.afterEvents.entityDie.unsubscribe(callback);
  ensure(applied, "The simulated player could not kill the cow for Loot Scoop.");
  ensure(result?.status === "duplicated", `Loot Scoop did not generate a bonus bundle on a guaranteed level-3 roll: ${JSON.stringify(result)}.`);
  ensure(result.spawnedStacks?.length === 1 && result.spawnedStacks[0].typeId === "minecraft:beef" && result.spawnedStacks[0].amount === 2,
    `Loot Scoop did not preserve the eligible bonus stack while excluding augment cores: ${JSON.stringify(result.spawnedStacks)}.`);
  for (const stack of result.spawnedStacks ?? []) {
    ensure(!isAugmentCore(stack.typeId), `Loot Scoop copied a core: ${stack.typeId}.`);
    ensure(countDroppedItem(attacker.dimension, lootLocation, stack.typeId) >= stack.amount, `The bonus ${stack.typeId} stack was not present in the world after entityDie.`);
  }
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "keen_edge_scales_server_root_melee_damage", async (test) => {
  const attacker = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASKeenEdge", GameMode.survival);
  const target = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASKeenTarget", GameMode.survival);
  const health = target.getComponent("minecraft:health");
  ensure(health, "Target player health component was unavailable.");
  await test.idle(1);
  ensure(attacker.name === "ASKeenEdge", "The production-pack test hook did not recognize the simulated attacker.");

  /** @type {{damage:number,cause:string,attackerId?:string,attackerType?:string,attackerIsPlayer?:boolean}|undefined} */
  let observed;
  const callback = (event) => {
    if (!event?.hurtEntity || event.hurtEntity.id !== target.id) return;
    observed = {
      damage: event.damage,
      cause: event.damageSource.cause,
      attackerId: event.damageSource.damagingEntity?.id,
      attackerType: event.damageSource.damagingEntity?.typeId,
      attackerIsPlayer: event.damageSource.damagingEntity instanceof Player,
    };
  };
  world.beforeEvents.entityHurt.subscribe(callback);
  const initialHealth = health.currentValue;
  const applied = target.applyDamage(10, {
    cause: EntityDamageCause.entityAttack,
    damagingEntity: attacker,
  });
  await test.idle(1);
  world.beforeEvents.entityHurt.unsubscribe(callback);
  const damageTaken = initialHealth - health.currentValue;
  ensure(applied, "The simulated player target rejected root melee test damage.");
  ensure(Math.abs(damageTaken - 12) < 1e-6, `Keen Edge level 5 expected 12 damage from a 10-damage root melee event; got ${damageTaken}; observed=${JSON.stringify(observed)}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "precise_aim_scales_server_projectile_damage_source", async (test) => {
  const control = test.spawnSimulatedPlayer({ x: 2, y: 3, z: 2 }, "ASPreciseAimControl", GameMode.survival);
  const attackers = [1, 2, 3, 4, 5].map((level, index) => ({
    level,
    player: test.spawnSimulatedPlayer({ x: 2, y: 3, z: 2 + index }, `ASPreciseAimLevel${level}`, GameMode.survival),
  }));
  const ownerlessAttacker = test.spawnSimulatedPlayer({ x: 2, y: 3, z: 6 }, "ASPreciseAimOwnerless", GameMode.survival);
  const target = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 4 }, "ASPreciseAimTarget", GameMode.survival);
  await test.idle(2);

  /** @type {Array<{damage:number,cause:string,projectileId?:string,ownerId?:string,attackerId?:string}>} */
  const hits = [];
  const callback = (event) => {
    if (!event?.hurtEntity || event.hurtEntity.id !== target.id) return;
    const projectile = event.damageSource.damagingProjectile;
    hits.push({
      damage: event.damage,
      cause: event.damageSource.cause,
      projectileId: projectile?.id,
      ownerId: projectile?.getComponent("minecraft:projectile")?.owner?.id,
      attackerId: event.damageSource.damagingEntity?.id,
    });
  };
  world.beforeEvents.entityHurt.subscribe(callback);

  const controlArrow = control.dimension.spawnEntity("minecraft:arrow", { x: 2, y: 4, z: 2 });
  const ownerlessArrow = ownerlessAttacker.dimension.spawnEntity("minecraft:arrow", { x: 2, y: 4, z: 6 });
  const controlProjectile = controlArrow.getComponent("minecraft:projectile");
  const ownerlessProjectile = ownerlessArrow.getComponent("minecraft:projectile");
  const projectiles = attackers.map(({ player }, index) => ({
    player,
    arrow: player.dimension.spawnEntity("minecraft:arrow", { x: 2, y: 4, z: 2 + index }),
  })).map(entry => ({ ...entry, component: entry.arrow.getComponent("minecraft:projectile") }));
  ensure(controlProjectile && ownerlessProjectile && projectiles.every(entry => entry.component), "A spawned arrow did not expose minecraft:projectile.");
  controlProjectile.owner = control;
  for (const entry of projectiles) entry.component.owner = entry.player;
  ensure(projectiles.every(entry => entry.component.owner?.id === entry.player.id), "A spawned arrow did not retain its simulated player owner.");
  const controlApplied = target.applyDamage(1, { damagingEntity: control, damagingProjectile: controlArrow });
  await test.idle(12);
  const augmentedApplied = [];
  for (const entry of projectiles) {
    augmentedApplied.push(target.applyDamage(1, { damagingEntity: entry.player, damagingProjectile: entry.arrow }));
    await test.idle(12);
  }
  const ownerlessApplied = target.applyDamage(1, { damagingEntity: ownerlessAttacker, damagingProjectile: ownerlessArrow });
  await test.idle(1);
  world.beforeEvents.entityHurt.unsubscribe(callback);
  ensure(controlApplied && augmentedApplied.every(Boolean) && ownerlessApplied, "BDS rejected one of the synthetic projectile-attributed damage events.");
  ensure(hits.length === 7, `Expected seven projectile damage events; captured=${JSON.stringify(hits)}.`);
  ensure(hits.every(hit => hit.cause === EntityDamageCause.projectile), "Damage inputs did not produce projectile damage events.");
  ensure(hits[0].projectileId === controlArrow.id && hits[0].ownerId === control.id && hits[0].attackerId === control.id, "The unaugmented control source lost its projectile attribution.");
  ensure(Math.abs(hits[0].damage - 1) < 1e-5, `Unaugmented projectile damage expected 1; got ${hits[0].damage}.`);
  for (const [index, entry] of attackers.entries()) {
    const hit = hits[index + 1];
    const expected = 1 + 0.04 * entry.level;
    ensure(hit.projectileId === projectiles[index].arrow.id && hit.ownerId === entry.player.id && hit.attackerId === entry.player.id, `Level ${entry.level} source attribution did not match its owner.`);
    ensure(Math.abs(hit.damage - expected) < 1e-5, `Precise Aim level ${entry.level} expected ${expected} damage from 1; got ${hit.damage}.`);
  }
  const ownerlessHit = hits.at(-1);
  ensure(ownerlessHit.projectileId === ownerlessArrow.id && !ownerlessHit.ownerId && ownerlessHit.attackerId === ownerlessAttacker.id, "The ownerless projectile source lost its expected attribution.");
  ensure(Math.abs(ownerlessHit.damage - 1) < 1e-5, `An ownerless projectile should retain 1 damage; got ${ownerlessHit.damage}.`);
  test.succeed();
}).maxTicks(100).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "last_strength_scales_server_root_melee_damage_at_and_below_threshold", async (test) => {
  const cases = [
    { level: 1, name: "ASLastStrengthLevel1", healthRatio: 0.30, expected: 11 },
    { level: 2, name: "ASLastStrengthLevel2", healthRatio: 0.30, expected: 12 },
    { level: 3, name: "ASLastStrengthLevel3", healthRatio: 0.30, expected: 13 },
    { level: 3, name: "ASLastStrengthAboveThreshold", healthRatio: 0.31, expected: 10 },
    { level: 3, name: "ASLastStrengthBelowThreshold", healthRatio: 0.29, expected: 13 },
    { level: 3, name: "ASLastStrengthKeenStack", healthRatio: 0.30, expected: 15 },
  ];
  const players = cases.map((entry, index) => ({
    ...entry,
    attacker: test.spawnSimulatedPlayer({ x: 2, y: 3, z: 2 + index }, entry.name, GameMode.survival),
    target: test.spawnSimulatedPlayer({ x: 6, y: 3, z: 2 + index }, `ASLastMeleeTarget${index}`, GameMode.survival),
  }));
  await test.idle(2);

  for (const entry of players) {
    const health = entry.attacker.getComponent("minecraft:health");
    const targetHealth = entry.target.getComponent("minecraft:health");
    ensure(health && targetHealth, `Health component unavailable for ${entry.name}.`);
    const set = health.setCurrentValue(health.effectiveMax * entry.healthRatio);
    ensure(set, `BDS could not set ${entry.name} health for the threshold case.`);
    const ratio = health.currentValue / health.effectiveMax;
    ensure(Math.abs(ratio - entry.healthRatio) < 1e-6, `${entry.name} health ratio expected ${entry.healthRatio}; got ${ratio}.`);
    const before = targetHealth.currentValue;
    const applied = entry.target.applyDamage(10, {
      cause: EntityDamageCause.entityAttack,
      damagingEntity: entry.attacker,
    });
    await test.idle(1);
    const damageTaken = before - targetHealth.currentValue;
    ensure(applied, `BDS rejected root melee damage for ${entry.name}.`);
    ensure(Math.abs(damageTaken - entry.expected) < 1e-5,
      `${entry.name} expected ${entry.expected} damage at health ratio ${ratio}; got ${damageTaken}.`);
  }
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "last_strength_scales_server_root_projectile_damage_and_stacks_with_precise_aim", async (test) => {
  const cases = [
    { level: 1, name: "ASLastStrengthProjectileLevel1", healthRatio: 0.30, expected: 11 },
    { level: 2, name: "ASLastStrengthProjectileLevel2", healthRatio: 0.30, expected: 12 },
    { level: 3, name: "ASLastStrengthProjectileLevel3", healthRatio: 0.30, expected: 13 },
    { level: 3, name: "ASLastStrengthProjectileAboveThreshold", healthRatio: 0.31, expected: 10 },
    { level: 3, name: "ASPreciseLastStrengthStack", healthRatio: 0.30, expected: 15 },
  ];
  const players = cases.map((entry, index) => ({
    ...entry,
    attacker: test.spawnSimulatedPlayer({ x: 2, y: 3, z: 2 + index }, entry.name, GameMode.survival),
    target: test.spawnSimulatedPlayer({ x: 6, y: 3, z: 2 + index }, `ASLastProjectileTarget${index}`, GameMode.survival),
  }));
  await test.idle(2);

  for (const entry of players) {
    const health = entry.attacker.getComponent("minecraft:health");
    const targetHealth = entry.target.getComponent("minecraft:health");
    ensure(health && targetHealth, `Health component unavailable for ${entry.name}.`);
    ensure(health.setCurrentValue(health.effectiveMax * entry.healthRatio), `BDS could not set ${entry.name} health for the projectile threshold case.`);
    const arrow = entry.attacker.dimension.spawnEntity("minecraft:arrow", { x: 2, y: 4, z: 2 });
    const projectile = arrow.getComponent("minecraft:projectile");
    ensure(projectile, `Spawned arrow had no projectile component for ${entry.name}.`);
    projectile.owner = entry.attacker;
    ensure(projectile.owner?.id === entry.attacker.id, `Arrow owner was not retained for ${entry.name}.`);
    const before = targetHealth.currentValue;
    const applied = entry.target.applyDamage(10, {
      damagingEntity: entry.attacker,
      damagingProjectile: arrow,
    });
    await test.idle(1);
    const damageTaken = before - targetHealth.currentValue;
    ensure(applied, `BDS rejected root projectile damage for ${entry.name}.`);
    ensure(Math.abs(damageTaken - entry.expected) < 1e-5,
      `${entry.name} expected ${entry.expected} projectile damage; got ${damageTaken}.`);
  }
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "strong_lungs_reduces_drowning_damage_by_level", async (test) => {
  const cases = [
    { level: 1, name: "ASStrongLungsLevel1", expected: 8.5 },
    { level: 2, name: "ASStrongLungsLevel2", expected: 7 },
    { level: 3, name: "ASStrongLungsLevel3", expected: 5.5 },
  ];
  const players = cases.map((entry, index) => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: 2 + index * 2, y: 3, z: 3 }, entry.name, GameMode.survival),
  }));
  await test.idle(2);

  for (const entry of players) {
    const health = entry.player.getComponent("minecraft:health");
    ensure(health, `Health component was unavailable for Strong Lungs level ${entry.level}.`);
    const before = health.currentValue;
    const applied = entry.player.applyDamage(10, { cause: EntityDamageCause.drowning });
    await test.idle(1);
    const damageTaken = before - health.currentValue;
    ensure(applied, `BDS rejected simulated drowning damage at Strong Lungs level ${entry.level}.`);
    ensure(Math.abs(damageTaken - entry.expected) < 1e-6, `Strong Lungs level ${entry.level} expected ${entry.expected} from 10 drowning damage; got ${damageTaken}.`);
  }
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "tough_skin_reduces_incoming_damage_by_level", async (test) => {
  const cases = [
    { level: 1, name: "ASToughSkinLevel1", expected: 9.8 },
    { level: 2, name: "ASToughSkinLevel2", expected: 9.6 },
    { level: 3, name: "ASToughSkinLevel3", expected: 9.4 },
    { level: 4, name: "ASToughSkinLevel4", expected: 9.2 },
    { level: 5, name: "ASToughSkinLevel5", expected: 9 },
  ];
  const players = cases.map((entry, index) => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: 2 + index * 2, y: 3, z: 3 }, entry.name, GameMode.survival),
  }));
  await test.idle(2);

  for (const entry of players) {
    const health = entry.player.getComponent("minecraft:health");
    ensure(health, `Health component was unavailable for Tough Skin level ${entry.level}.`);
    const before = health.currentValue;
    const applied = entry.player.applyDamage(10, { cause: EntityDamageCause.magic });
    await test.idle(1);
    const damageTaken = before - health.currentValue;
    ensure(applied, `BDS rejected simulated damage at Tough Skin level ${entry.level}.`);
    ensure(Math.abs(damageTaken - entry.expected) < 1e-5, `Tough Skin level ${entry.level} expected ${entry.expected} from 10 damage; got ${damageTaken}.`);
  }
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "light_landing_reduces_fall_damage_by_level", async (test) => {
  const cases = [
    { level: 1, name: "ASLightLandingLevel1", expected: 8.8 },
    { level: 2, name: "ASLightLandingLevel2", expected: 7.6 },
    { level: 3, name: "ASLightLandingLevel3", expected: 6.4 },
    { level: 4, name: "ASLightLandingLevel4", expected: 5.2 },
    { level: 5, name: "ASLightLandingLevel5", expected: 4 },
  ];
  const players = cases.map((entry, index) => ({
    ...entry,
    player: test.spawnSimulatedPlayer({ x: 2 + index * 2, y: 3, z: 3 }, entry.name, GameMode.survival),
  }));
  await test.idle(2);

  for (const entry of players) {
    const health = entry.player.getComponent("minecraft:health");
    ensure(health, `Health component was unavailable for Light Landing level ${entry.level}.`);
    const before = health.currentValue;
    const applied = entry.player.applyDamage(10, { cause: EntityDamageCause.fall });
    await test.idle(1);
    const damageTaken = before - health.currentValue;
    ensure(applied, `BDS rejected simulated fall damage at Light Landing level ${entry.level}.`);
    ensure(Math.abs(damageTaken - entry.expected) < 1e-5, `Light Landing level ${entry.level} expected ${entry.expected} from 10 fall damage; got ${damageTaken}.`);
  }
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "defense_reductions_stack_multiplicatively", async (test) => {
  const fallPlayer = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASDefenseStackFall", GameMode.survival);
  const drowningPlayer = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASDefenseStackDrowning", GameMode.survival);
  const fallHealth = fallPlayer.getComponent("minecraft:health");
  const drowningHealth = drowningPlayer.getComponent("minecraft:health");
  ensure(fallHealth && drowningHealth, "A stacked-defense player health component was unavailable.");
  await test.idle(2);

  const fallBefore = fallHealth.currentValue;
  const fallApplied = fallPlayer.applyDamage(10, { cause: EntityDamageCause.fall });
  await test.idle(1);
  const fallDamage = fallBefore - fallHealth.currentValue;
  const drowningBefore = drowningHealth.currentValue;
  const drowningApplied = drowningPlayer.applyDamage(10, { cause: EntityDamageCause.drowning });
  await test.idle(1);
  const drowningDamage = drowningBefore - drowningHealth.currentValue;

  ensure(fallApplied && Math.abs(fallDamage - 3.6) < 1e-5, `Tough Skin × Light Landing expected 3.6 damage; got ${fallDamage}.`);
  ensure(drowningApplied && Math.abs(drowningDamage - 4.95) < 1e-5, `Tough Skin × Strong Lungs expected 4.95 damage; got ${drowningDamage}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "core_synthesis_is_atomic_and_conserves_items", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASCoreSynthesis", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack(CORE, 3));
  const success = synthesizeCore(player, CORE, NEXT_CORE);
  ensure(success.ok, "Three common cores did not synthesize into an uncommon core.");
  ensure(countItem(inventory, CORE) === 0 && countItem(inventory, NEXT_CORE) === 1, "Successful synthesis did not conserve the exact 3:1 item counts.");

  const duplicate = synthesizeCore(player, CORE, NEXT_CORE);
  ensure(!duplicate.ok && duplicate.reason === "insufficient_input", "A duplicate synthesis request upgraded a core without new inputs.");
  ensure(countItem(inventory, CORE) === 0 && countItem(inventory, NEXT_CORE) === 1, "Duplicate synthesis changed the inventory.");

  inventory.setItem(1, new ItemStack(CORE, 2));
  const insufficient = synthesizeCore(player, CORE, NEXT_CORE);
  ensure(!insufficient.ok && insufficient.reason === "insufficient_input", "Synthesis accepted fewer than three input cores.");
  ensure(countItem(inventory, CORE) === 2 && countItem(inventory, NEXT_CORE) === 1, "Insufficient-input rejection changed the inventory.");

  for (let slot = 0; slot < inventory.size; slot += 1) inventory.setItem(slot, new ItemStack("minecraft:dirt", 64));
  inventory.setItem(0, new ItemStack(CORE, 64));
  const full = synthesizeCore(player, CORE, NEXT_CORE);
  ensure(!full.ok && full.reason === "no_output_space", "A full inventory accepted a synthesized core without output space.");
  ensure(countItem(inventory, CORE) === 64 && countItem(inventory, NEXT_CORE) === 0, "Full-inventory rejection consumed inputs or duplicated output.");
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "sturdiness_effect_scales_max_health", async (test) => {
  const level1 = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASSturdinessLevel1", GameMode.survival);
  const level5 = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASSturdinessLevel5", GameMode.survival);
  const health1 = level1.getComponent("minecraft:health");
  const health5 = level5.getComponent("minecraft:health");
  ensure(health1 && health5, "Simulated player health component was unavailable.");
  const baseMax1 = health1.effectiveMax;
  const baseMax5 = health5.effectiveMax;
  await test.idle(2);
  ensure(health1.effectiveMax === baseMax1 + 4, `Expected production +4 max health at level 1; got ${health1.effectiveMax - baseMax1}.`);
  ensure(health5.effectiveMax === baseMax5 + 20, `Expected production +20 max health at level 5; got ${health5.effectiveMax - baseMax5}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "core_selection_commits_level_and_preserves_core_on_rejection", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASCoreCommitProduction", GameMode.survival);
  const inventory = inventoryOf(player);
  const health = player.getComponent("minecraft:health");
  ensure(health, "Simulated player health component was unavailable.");
  const baseMax = health.effectiveMax;
  await test.idle(2);

  const tags = player.getTags();
  ensure(tags.includes("as_test_core_level_one"), "Production pack did not commit level 1.");
  ensure(tags.includes("as_test_core_level_stored"), "Production pack did not read back the committed level from its own dynamic-property namespace.");
  ensure(tags.includes("as_test_core_max_rejected"), "Production pack did not reject the max-level selection.");
  ensure(countItem(inventory, CORE) === 1, "Production transaction did not consume exactly one core across commit and rejection.");
  ensure(health.effectiveMax === baseMax + 4, `Production pack did not restore the committed level 1 into Sturdiness; expected +4 HP, got ${health.effectiveMax - baseMax}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

async function verifyPickupHandProductionRadius(test, player, level) {
  const inventory = inventoryOf(player);
  const radius = pickupHandRadius(level);
  ensure(player.hasTag(`as_pickup_hand_level_${level}`), `Production pack did not seed Pickup Hand level ${level}.`);
  player.stopMoving();
  player.clearVelocity();
  await test.idle(1);
  player.clearVelocity();
  const startingLocation = player.location;
  const playerBounds = player.getAABB();
  const pickupLocation = { x: playerBounds.center.x + radius + 0.15, y: playerBounds.center.y, z: playerBounds.center.z };
  const xpLocation = { x: pickupLocation.x, y: playerBounds.center.y, z: playerBounds.center.z + 0.25 };
  const xpOrbValue = 1;
  // Leave enough margin for the spawned item entity's initial horizontal drift before the radius scan stabilizes.
  const beyondLocation = { x: playerBounds.center.x + radius + 4.0, y: playerBounds.center.y, z: playerBounds.center.z };
  const diamondBefore = countItem(inventory, "minecraft:diamond");
  const emeraldBefore = countItem(inventory, "minecraft:emerald");
  const startingXp = player.getTotalXp();
  const worldXpBefore = new Map(world.getPlayers().map(candidate => [candidate.id, candidate.getTotalXp()]));
  const worldEmeraldBefore = new Map(world.getPlayers().map(candidate => [
    candidate.id,
    countItem(inventoryOf(candidate), "minecraft:emerald"),
  ]));
  player.dimension.spawnItem(new ItemStack("minecraft:diamond", 1), pickupLocation);
  player.dimension.spawnXp(xpLocation, xpOrbValue);
  const farItem = player.dimension.spawnItem(new ItemStack("minecraft:emerald", 1), beyondLocation);
  const xpTrace = [];
  for (let tick = 0; tick < 30; tick += 1) {
    await test.idle(1);
    player.clearVelocity();
    xpTrace.push({
      tick: tick + 1,
      playerXp: player.getTotalXp(),
      orbsNearPlayer: player.dimension.getEntities({
        type: "minecraft:xp_orb",
        location: player.location,
        maxDistance: 12,
      }).map(orb => ({ id: orb.id, location: orb.location, velocity: orb.getVelocity() })),
    });
  }

  const result = {
    level,
    radius,
    xpOrbValue,
    startingLocation,
    location: player.location,
    diamondCount: countItem(inventory, "minecraft:diamond") - diamondBefore,
    emeraldCount: countItem(inventory, "minecraft:emerald") - emeraldBefore,
    xpAwarded: player.getTotalXp() - startingXp,
    worldXpAwarded: world.getPlayers().reduce((total, candidate) => {
      const before = worldXpBefore.get(candidate.id);
      return total + (before === undefined ? 0 : candidate.getTotalXp() - before);
    }, 0),
    worldEmeraldAwarded: world.getPlayers().reduce((total, candidate) => {
      const before = worldEmeraldBefore.get(candidate.id);
      return total + (before === undefined ? 0 : countItem(inventoryOf(candidate), "minecraft:emerald") - before);
    }, 0),
    nearbyPlayers: world.getPlayers().map(candidate => {
      const location = candidate.location;
      const dx = location.x - playerBounds.center.x;
      const dy = location.y - playerBounds.center.y;
      const dz = location.z - playerBounds.center.z;
      return { name: candidate.name, distance: Math.sqrt(dx * dx + dy * dy + dz * dz) };
    }).filter(candidate => candidate.distance <= radius + 8),
    beyondRadiusItemRemains: farItem.isValid,
    farItemLocation: farItem.isValid ? farItem.location : undefined,
    distanceToFarItem: Math.hypot(
      beyondLocation.x - startingLocation.x,
      beyondLocation.y - startingLocation.y,
      beyondLocation.z - startingLocation.z,
    ),
    xpTrace,
    nearbyXpOrbCount: player.dimension.getEntities({
      type: "minecraft:xp_orb",
      location: xpLocation,
      maxDistance: 1,
    }).length,
  };
  const loggedResult = result.worldXpAwarded === xpOrbValue ? { ...result, xpTrace: undefined } : result;
  console.warn("AS_PICKUP_HAND_PRODUCTION_RESULT " + JSON.stringify(loggedResult));
  ensure(result.diamondCount === 1, `Level ${level} did not use vanilla pickup for the item beyond ordinary reach.`);
  ensure(result.worldXpAwarded === xpOrbValue, `Level ${level} did not award exactly the XP orb value across nearby players; got ${result.worldXpAwarded}.`);
  ensure(result.emeraldCount === 0 && result.beyondRadiusItemRemains,
    `Level ${level} picked up an item outside its ${radius}-block radius.`);
  farItem.remove();
}

GameTest.registerAsync("AugmentationSurvival", "pickup_hand_extends_item_and_xp_radius_at_all_levels", async (test) => {
  for (const level of [1, 2, 3]) {
    const player = test.spawnSimulatedPlayer(
      { x: 4, y: 3, z: 3 },
      `ASPickupHandLevel${level}`,
      GameMode.survival,
    );
    await test.idle(2);
    await verifyPickupHandProductionRadius(test, player, level);
    player.disconnect();
    await test.idle(1);
  }

  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASPickupHandProduction", GameMode.survival);
  const competitor = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 3 }, "ASPickupHandCompeting", GameMode.survival);
  await test.idle(3);
  ensure(player.hasTag("as_pickup_hand_level_3"), "Production pack did not seed the shared-pickup player's Pickup Hand level.");
  ensure(competitor.hasTag("as_pickup_hand_level_3"), "Production pack did not seed the competing player's Pickup Hand level.");
  const playerInventory = inventoryOf(player);
  const competitorInventory = inventoryOf(competitor);
  const playerCenter = player.getAABB().center;
  const competitorCenter = competitor.getAABB().center;
  const sharedLocation = {
    x: (playerCenter.x + competitorCenter.x) / 2,
    y: (playerCenter.y + competitorCenter.y) / 2,
    z: (playerCenter.z + competitorCenter.z) / 2,
  };
  const diamondsBefore = countItem(playerInventory, "minecraft:diamond")
    + countItem(competitorInventory, "minecraft:diamond");
  const xpBefore = player.getTotalXp() + competitor.getTotalXp();
  player.dimension.spawnItem(new ItemStack("minecraft:diamond", 1), sharedLocation);
  player.dimension.spawnXp(sharedLocation, 4);
  await test.idle(12);
  const multiplayerResult = {
    diamondDelta: countItem(playerInventory, "minecraft:diamond")
      + countItem(competitorInventory, "minecraft:diamond") - diamondsBefore,
    xpDelta: player.getTotalXp() + competitor.getTotalXp() - xpBefore,
  };
  console.warn("AS_PICKUP_HAND_MULTIPLAYER_RESULT " + JSON.stringify(multiplayerResult));
  ensure(multiplayerResult.diamondDelta === 1, "Two nearby players duplicated or lost a shared item pickup.");
  ensure(multiplayerResult.xpDelta === 4, `Two nearby players duplicated or lost the 4-point XP orb; got ${multiplayerResult.xpDelta}.`);
  test.succeed();
}).maxTicks(140).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "step_up_stable_player_api_surface_probe", async (test) => {
  for (let x = 2; x <= 8; x += 1) {
    for (let z = 2; z <= 4; z += 1) test.getBlock({ x, y: 2, z }).setType("minecraft:stone");
  }
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASStepUpSurfaceProbe", GameMode.survival);
  await test.idle(2);
  const before = player.location;
  player.move(1, 0, 1);
  const inputAfterMoveCommand = player.inputInfo.getMovementVector();
  await test.idle(1);
  const inputAfterOneTick = player.inputInfo.getMovementVector();
  await test.idle(6);
  const movementInput = player.inputInfo.getMovementVector();
  const after = player.location;
  const componentAvailable = (componentId) => {
    try { return player.getComponent(componentId) !== undefined; }
    catch (error) { return `throws:${error?.name ?? "Error"}`; }
  };
  const result = {
    inputAfterMoveCommand,
    inputAfterOneTick,
    movementInput,
    displacement: { x: after.x - before.x, y: after.y - before.y, z: after.z - before.z },
    stepHeightComponent: componentAvailable("minecraft:step_height"),
    variableMaxAutoStepComponent: componentAvailable("minecraft:variable_max_auto_step"),
    movementComponent: componentAvailable("minecraft:movement"),
  };
  console.warn("AS_STEP_UP_API_SURFACE " + JSON.stringify(result));
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "terrain_resistance_vanilla_surface_probe", async (test) => {
  const results = [];
  for (let x = 1; x <= 5; x += 1) {
    for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  for (const surface of ["stone", "soul_sand", "honey_block", "web"]) {
    if (surface === "soul_sand" || surface === "honey_block") {
      for (let z = 1; z <= 5; z += 1) test.setBlockType(`minecraft:${surface}`, { x: 3, y: 2, z });
    }
    if (surface === "web") {
      for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:stone", { x: 3, y: 2, z });
      for (let z = 2; z <= 4; z += 1) {
        test.setBlockType("minecraft:web", { x: 3, y: 3, z });
        test.setBlockType("minecraft:web", { x: 3, y: 4, z });
      }
    }
    for (const scale of [1, 1.45]) {
      const player = test.spawnSimulatedPlayer(
        { x: 3, y: 3, z: 3 },
        `AS_TERRAIN_${surface}_${scale}`,
        GameMode.survival,
      );
      await test.idle(2);
      const component = player.getComponent("minecraft:movement");
      ensure(component, "Terrain probe player lacked minecraft:movement.");
      const defaultValue = component.defaultValue;
      component.setCurrentValue(defaultValue * scale);
      const start = player.location;
      player.setRotation({ x: 0, y: 0 });
      player.moveRelative(0, 1, 0.2);
      await test.idle(20);
      const end = player.location;
      results.push({
        surface,
        movementScale: scale,
        displacement: { x: end.x - start.x, y: end.y - start.y, z: end.z - start.z },
        velocityBeforeStop: player.getVelocity(),
        onGround: player.isOnGround,
        movement: { current: component.currentValue, defaultValue },
      });
      player.stopMoving();
      player.disconnect();
      await test.idle(1);
    }
  }
  console.warn("AS_TERRAIN_SURFACE_PROBE " + JSON.stringify(results));
  ensure(Math.abs(results[0].displacement.z) > 0.1, "Terrain probe stone control player did not move.");
  test.succeed();
}).maxTicks(240).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "twins_breeding_event_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 5 }, "ASTwinsBreedingProbe", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack("minecraft:wheat", 8));
  player.selectedSlotIndex = 0;
  const first = player.dimension.spawnEntity("minecraft:cow", test.worldLocation({ x: 7, y: 3, z: 5 }), { spawnEvent: "minecraft:spawn_adult" });
  const second = player.dimension.spawnEntity("minecraft:cow", test.worldLocation({ x: 9, y: 3, z: 5 }), { spawnEvent: "minecraft:spawn_adult" });
  const firstWasBaby = first.hasComponent("minecraft:is_baby");
  const secondWasBaby = second.hasComponent("minecraft:is_baby");
  const interactions = [];
  const spawns = [];
  const interactionCallback = (event) => {
    if (event.target.id !== first.id && event.target.id !== second.id) return;
    interactions.push({
      playerId: event.player.id,
      targetId: event.target.id,
      before: event.beforeItemStack && { typeId: event.beforeItemStack.typeId, amount: event.beforeItemStack.amount },
      after: event.itemStack && { typeId: event.itemStack.typeId, amount: event.itemStack.amount },
    });
  };
  const spawnCallback = (event) => {
    if (event.entity.typeId !== "minecraft:cow") return;
    const spawned = event.entity;
    const entry = { id: spawned.id, cause: event.cause, location: undefined, isBabyComponent: false, entityStateError: undefined };
    try {
      entry.location = spawned.location;
      entry.isBabyComponent = spawned.hasComponent("minecraft:is_baby");
    } catch (error) {
      entry.entityStateError = error?.name ?? "Error";
    }
    spawns.push(entry);
  };
  world.afterEvents.playerInteractWithEntity.subscribe(interactionCallback);
  world.afterEvents.entitySpawn.subscribe(spawnCallback);
  let firstInteraction = false;
  let secondInteraction = false;
  let manualBornEvent = "not_attempted";
  let manualBornBaby = false;
  try {
    await test.idle(2);
    firstInteraction = player.interactWithEntity(first);
    await test.idle(1);
    secondInteraction = player.interactWithEntity(second);
    await test.idle(80);
    try {
      const manual = player.dimension.spawnEntity("minecraft:cow", test.worldLocation({ x: 12, y: 3, z: 5 }), { spawnEvent: "minecraft:entity_born" });
      manualBornEvent = "spawned:" + manual.id;
      manualBornBaby = manual.hasComponent("minecraft:is_baby");
    } catch (error) {
      manualBornEvent = `error:${error?.name ?? "Error"}:${error?.message ?? "unknown"}`;
    }
    await test.idle(2);
  } finally {
    world.afterEvents.playerInteractWithEntity.unsubscribe(interactionCallback);
    world.afterEvents.entitySpawn.unsubscribe(spawnCallback);
  }
  const result = {
    firstInteraction,
    secondInteraction,
    playerId: player.id,
    firstId: first.id,
    secondId: second.id,
    firstWasBaby,
    secondWasBaby,
    remainingWheat: inventory.getItem(0)?.amount ?? 0,
    interactions,
    spawns,
    manualBornEvent,
    manualBornBaby,
    runtimeComponents: first.getComponents().map((component) => component.typeId),
  };
  console.warn("AS_TWINS_BREEDING_SURFACE_PROBE " + JSON.stringify(result));
  ensure(firstInteraction && secondInteraction, "SimulatedPlayer could not interact with both cows.");
  ensure(!firstWasBaby && !secondWasBaby, "Adult-cow setup did not stay adult before breeding.");
  ensure((inventory.getItem(0)?.amount ?? 0) === 6, "The two accepted cow feeds did not consume exactly two wheat.");
  ensure(spawns.some((entry) => entry.cause === "Born" && entry.isBabyComponent), "No vanilla-born cow with the baby marker was observed.");
  ensure(manualBornBaby, "spawnEvent minecraft:entity_born did not create a baby cow.");
  test.succeed();
}).maxTicks(180).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "long_jump_input_event_surface_probe", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 5, y: 3, z: 5 }, "ASLongJumpInputProbe", GameMode.survival);
  player.setRotation({ x: 0, y: 0 });
  player.isSprinting = true;
  player.moveRelative(0, 1, 0.2);
  const inputs = [];
  const inputCallback = (event) => {
    if (event.player.id !== player.id || event.button !== InputButton.Jump) return;
    inputs.push({
      button: event.button,
      state: event.newButtonState,
      isOnGround: event.player.isOnGround,
      isSprinting: event.player.isSprinting,
      isJumping: event.player.isJumping,
      velocity: event.player.getVelocity(),
      location: event.player.location,
    });
  };
  world.afterEvents.playerButtonInput.subscribe(inputCallback);
  let jumpAccepted = false;
  let before = undefined;
  let afterOneTick = undefined;
  let afterFiveTicks = undefined;
  try {
    await test.idle(4);
    before = {
      isOnGround: player.isOnGround,
      isSprinting: player.isSprinting,
      isJumping: player.isJumping,
      velocity: player.getVelocity(),
      location: player.location,
    };
    jumpAccepted = player.jump();
    await test.idle(1);
    afterOneTick = {
      isOnGround: player.isOnGround,
      isJumping: player.isJumping,
      velocity: player.getVelocity(),
      location: player.location,
    };
    await test.idle(4);
    afterFiveTicks = {
      isOnGround: player.isOnGround,
      isJumping: player.isJumping,
      velocity: player.getVelocity(),
      location: player.location,
    };
  } finally {
    world.afterEvents.playerButtonInput.unsubscribe(inputCallback);
  }
  console.warn("AS_LONG_JUMP_INPUT_SURFACE_PROBE " + JSON.stringify({ jumpAccepted, before, inputs, afterOneTick, afterFiveTicks }));
  ensure(jumpAccepted, "SimulatedPlayer could not perform a ground jump.");
  test.succeed();
}).maxTicks(120).structureName(STRUCTURE).tag(TAG);

async function verifyRiderSpeedLevel(test, level) {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, `ASRiderLevel${level}`, GameMode.survival);
  await test.idle(2);
  ensure(player.hasTag(`as_rider_seeded_${level}`), `Production behavior pack did not seed Rider level ${level}.`);
  const mount = test.spawn("minecraft:horse", { x: 5, y: 3, z: 3 });
  await test.idle(1);
  let rideable = mount.getComponent("minecraft:rideable");
  for (let retry = 0; !rideable && retry < 14; retry += 1) {
    await test.idle(1);
    rideable = mount.getComponent("minecraft:rideable");
  }
  ensure(rideable, `Rider level ${level} test horse did not expose the rideable component.`);
  ensure(rideable.addRider(player), `Rider level ${level} player could not mount its test horse.`);
  await test.idle(4);
  ensure(player.getComponent("minecraft:riding")?.entityRidingOn.id === mount.id,
    `Rider level ${level} player did not stay on the expected mount.`);
  ensure(rideable.getRiders().length === 1 && rideable.getRiders()[0].id === player.id && rideable.controllingSeat === 0,
    `Rider level ${level} player was not the sole controller of its horse.`);
  const movement = mount.getComponent("minecraft:movement");
  ensure(movement, `Rider level ${level} horse did not expose movement.`);
  const expected = movement.defaultValue * (1 + level * 0.10);
  ensure(Math.abs(movement.currentValue - expected) < 0.000001,
    `Rider level ${level} should set the mount movement component to +${level * 10}%; expected ${expected}, got ${movement.currentValue}.`);
  const applied = { level, current: movement.currentValue, defaultValue: movement.defaultValue, expected };

  rideable.ejectRiders();
  await test.idle(3);
  const restoredMovement = mount.getComponent("minecraft:movement");
  const restoration = {
    level,
    current: restoredMovement?.currentValue,
    defaultValue: restoredMovement?.defaultValue,
    hasRuntimeTag: mount.hasTag("augmentation_survival:rider_speed_runtime"),
  };
  ensure(restoration.current !== undefined && Math.abs(restoration.current - restoration.defaultValue) < 0.000001 && !restoration.hasRuntimeTag,
    `Rider level ${level} speed was not removed after dismount: ${JSON.stringify(restoration)}.`);
  console.warn("AS_RIDER_SPEED_LEVEL_TEST " + JSON.stringify({ applied, restoration }));
  player.disconnect();
  mount.remove();
  test.succeed();
}

for (let level = 1; level <= 3; level += 1) {
  GameTest.registerAsync("AugmentationSurvival", `rider_speed_level_${level}_applies_and_restores`, test => verifyRiderSpeedLevel(test, level))
    .maxTicks(40).structureName(STRUCTURE).tag(TAG);
}

GameTest.registerAsync("AugmentationSurvival", "rider_speed_does_not_change_unowned_mount", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 5; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASRiderControl", GameMode.survival);
  const mount = test.spawn("minecraft:horse", { x: 5, y: 3, z: 3 });
  await test.idle(1);
  let rideable = mount.getComponent("minecraft:rideable");
  for (let retry = 0; !rideable && retry < 14; retry += 1) {
    await test.idle(1);
    rideable = mount.getComponent("minecraft:rideable");
  }
  let mounted = rideable?.addRider(player) ?? false;
  for (let retry = 0; !mounted && retry < 14; retry += 1) {
    await test.idle(1);
    rideable = mount.getComponent("minecraft:rideable");
    mounted = rideable?.addRider(player) ?? false;
  }
  ensure(mounted, "Unaugmented rider control could not mount its horse.");
  await test.idle(5);
  const movement = mount.getComponent("minecraft:movement");
  ensure(movement && Math.abs(movement.currentValue - movement.defaultValue) < 0.000001,
    "A player without Rider must not change a mount's movement value.");
  console.warn("AS_RIDER_SPEED_UNOWNED_CONTROL " + JSON.stringify({ current: movement.currentValue, defaultValue: movement.defaultValue }));
  rideable.ejectRiders();
  player.disconnect();
  test.succeed();
}).maxTicks(45).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "rider_mount_api_surface_probe", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 8; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASRiderApiProbe", GameMode.survival);
  const mount = player.dimension.spawnEntity("minecraft:horse", test.worldLocation({ x: 5, y: 3, z: 3 }));
  const rideable = mount.getComponent("minecraft:rideable");
  const movement = mount.getComponent("minecraft:movement");
  ensure(rideable && movement, "The vanilla horse did not expose rideable and movement components.");
  const jumpStrengthComponent = mount.getComponent("minecraft:horse.jump_strength");
  const canPowerJumpComponent = mount.getComponent("minecraft:can_power_jump");
  const addRiderSucceeded = rideable.addRider(player);
  await test.idle(4);
  const ridingComponent = player.getComponent("minecraft:riding");
  const riders = rideable.getRiders();
  const riderRelation = {
    addRiderSucceeded,
    playerRidingMountId: ridingComponent?.entityRidingOn.id,
    mountId: mount.id,
    riders: riders.map(rider => ({ id: rider.id, typeId: rider.typeId, name: rider instanceof Player ? rider.name : undefined })),
    seatCount: rideable.seatCount,
    controllingSeat: rideable.controllingSeat,
    seats: rideable.getSeats().map(seat => ({ position: seat.position, minRiderCount: seat.minRiderCount, maxRiderCount: seat.maxRiderCount })),
    isInWater: mount.isInWater,
    playerIsOnGround: player.isOnGround,
    mountIsOnGround: mount.isOnGround,
    playerLocation: player.location,
    mountLocation: mount.location,
    riderInputInfoAvailable: Boolean(player.inputInfo),
    rideControl: player.inputInfo?.getButtonState(InputButton.Jump),
  };

  const movementBefore = movement.currentValue;
  const movementSetSucceeded = movement.setCurrentValue(movement.defaultValue * 1.20);
  await test.idle(1);
  const movementAfter = movement.currentValue;
  movement.setCurrentValue(movementBefore);

  const inputs = [];
  const inputCallback = event => {
    if (event.player.id === player.id) inputs.push({ button: event.button, state: event.newButtonState });
  };
  world.afterEvents.playerButtonInput.subscribe(inputCallback);
  let jumpAcceptedWithoutEffect = false;
  let afterJumpWithoutEffect;
  try {
    jumpAcceptedWithoutEffect = player.jump();
    await test.idle(5);
    afterJumpWithoutEffect = { player: player.location, mount: mount.location, velocity: mount.getVelocity() };
    mount.addEffect("jump_boost", 100, { amplifier: 0, showParticles: false });
    await test.idle(2);
    const jumpBoost = mount.getEffect("jump_boost");
    const jumpStrengthAfterEffect = mount.getComponent("minecraft:horse.jump_strength");
    const canPowerJumpAfterEffect = mount.getComponent("minecraft:can_power_jump");
    const jumpBoostSurface = {
      effectPresent: Boolean(jumpBoost),
      effectAmplifier: jumpBoost?.amplifier,
      effectDuration: jumpBoost?.duration,
      jumpStrengthComponentPresent: Boolean(jumpStrengthAfterEffect),
      jumpStrengthValue: jumpStrengthAfterEffect?.value,
      canPowerJumpComponentPresent: Boolean(canPowerJumpAfterEffect),
      canPowerJumpValue: canPowerJumpAfterEffect?.value,
    };
    let jumpAcceptedWithEffect = false;
    let afterJumpWithEffect;
    if (jumpAcceptedWithoutEffect) {
      await test.idle(35);
      jumpAcceptedWithEffect = player.jump();
      await test.idle(5);
      afterJumpWithEffect = { player: player.location, mount: mount.location, velocity: mount.getVelocity() };
    }
    console.warn("AS_RIDER_MOUNT_SURFACE_PROBE " + JSON.stringify({
      riderRelation,
      jumpStrengthComponentPresent: Boolean(jumpStrengthComponent),
      canPowerJumpComponentPresent: Boolean(canPowerJumpComponent),
      movementBefore,
      movementDefault: movement.defaultValue,
      movementSetSucceeded,
      movementAfter,
      jumpAcceptedWithoutEffect,
      afterJumpWithoutEffect,
      jumpBoostSurface,
      jumpAcceptedWithEffect,
      afterJumpWithEffect,
      inputs,
    }));
  } finally {
    world.afterEvents.playerButtonInput.unsubscribe(inputCallback);
  }

  ensure(addRiderSucceeded && ridingComponent?.entityRidingOn.id === mount.id,
    `Stable riding relationship was not readable after addRider: ${JSON.stringify(riderRelation)}.`);
  ensure(movementSetSucceeded && Math.abs(movementAfter - movement.defaultValue * 1.20) < 0.000001,
    `The horse movement component did not accept an exact 20% test multiplier: ${JSON.stringify({ movementBefore, movementDefault: movement.defaultValue, movementSetSucceeded, movementAfter })}.`);
  test.succeed();
}).maxTicks(120).structureName(STRUCTURE).tag("rider_probe");

GameTest.registerAsync("AugmentationSurvival", "rider_mount_family_probe", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 8; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASRiderFamilyProbe", GameMode.survival);
  const results = [];
  for (const typeId of [
    "minecraft:horse", "minecraft:donkey", "minecraft:mule", "minecraft:skeleton_horse",
    "minecraft:zombie_horse", "minecraft:camel", "minecraft:pig", "minecraft:strider",
    "minecraft:llama", "minecraft:trader_llama",
  ]) {
    let mount;
    try {
      mount = player.dimension.spawnEntity(typeId, test.worldLocation({ x: 5, y: 3, z: 3 }));
      const rideable = mount.getComponent("minecraft:rideable");
      const addRiderSucceeded = rideable?.addRider(player) ?? false;
      await test.idle(2);
      results.push({
        typeId,
        isAnimalFamily: mount.matches({ families: ["animal"] }),
        addRiderSucceeded,
        riderRelationMatches: player.getComponent("minecraft:riding")?.entityRidingOn.id === mount.id,
        riderIds: rideable?.getRiders().map(rider => rider.id),
        seatCount: rideable?.seatCount,
        controllingSeat: rideable?.controllingSeat,
        isInWater: mount.isInWater,
        mountIsOnGround: mount.isOnGround,
      });
      rideable?.ejectRiders();
      mount.remove();
      await test.idle(1);
    } catch (error) {
      results.push({ typeId, error: String(error) });
      try { mount?.remove(); } catch { /* Invalid entity or failed spawn. */ }
    }
  }
  console.warn("AS_RIDER_MOUNT_FAMILY_PROBE " + JSON.stringify(results));
  test.succeed();
}).maxTicks(100).structureName(STRUCTURE).tag("rider_probe");

GameTest.registerAsync("AugmentationSurvival", "armor_care_damage_event_probe", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 8; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASArmorCareProbe", GameMode.survival);
  const equippable = player.getComponent("minecraft:equippable");
  ensure(equippable, "Armor Care probe player did not expose equippable.");
  const armor = [
    [EquipmentSlot.Head, new ItemStack("minecraft:diamond_helmet")],
    [EquipmentSlot.Chest, new ItemStack("minecraft:diamond_chestplate")],
    [EquipmentSlot.Legs, new ItemStack("minecraft:diamond_leggings")],
    [EquipmentSlot.Feet, new ItemStack("minecraft:diamond_boots")],
  ];
  for (const [slot, stack] of armor) ensure(equippable.setEquipment(slot, stack), `Could not equip ${stack.typeId} for Armor Care probe.`);

  const readArmor = () => armor.map(([slot]) => {
    const stack = equippable.getEquipment(slot);
    const durability = stack?.getComponent("minecraft:durability");
    return { slot, typeId: stack?.typeId, damage: durability?.damage, maxDurability: durability?.maxDurability };
  });
  const beforeEvents = [];
  const afterEvents = [];
  const before = event => {
    if (event.hurtEntity.id === player.id) beforeEvents.push({ damage: event.damage, armor: readArmor() });
  };
  const after = event => {
    if (event.hurtEntity.id === player.id) afterEvents.push({ damage: event.damage, armor: readArmor() });
  };
  world.beforeEvents.entityHurt.subscribe(before);
  world.afterEvents.entityHurt.subscribe(after);
  let applied;
  let breakApplied;
  try {
    applied = player.applyDamage(16, { cause: EntityDamageCause.entityAttack });
    await test.idle(12);
    for (const [slot] of armor) {
      const stack = equippable.getEquipment(slot);
      const durability = stack?.getComponent("minecraft:durability");
      ensure(stack && durability, `Armor Care probe lost a piece before the break probe at ${slot}.`);
      durability.damage = durability.maxDurability - 4;
      ensure(equippable.setEquipment(slot, stack), `Could not set ${slot} armor to the break boundary.`);
    }
    breakApplied = player.applyDamage(16, { cause: EntityDamageCause.entityAttack });
    await test.idle(1);
  } finally {
    world.beforeEvents.entityHurt.unsubscribe(before);
    world.afterEvents.entityHurt.unsubscribe(after);
  }
  const result = { applied, breakApplied, beforeEvents, afterEvents, finalArmor: readArmor() };
  console.warn("AS_ARMOR_CARE_DAMAGE_EVENT_PROBE " + JSON.stringify(result));
  ensure(applied, "Armor Care damage-event probe could not apply synthetic attack damage.");
  ensure(breakApplied, "Armor Care damage-event probe could not apply damage at the armor-break boundary.");
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag("armor_probe");

GameTest.registerAsync("AugmentationSurvival", "armor_care_matches_java_chance_and_restores_real_armor_wear", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 8; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  ensure(armorCareChance(0) === 0 && armorCareChance(-1) === 0, "Armor Care must be inactive below level 1.");
  for (let level = 1; level <= 5; level += 1) {
    const chance = level * 0.05;
    ensure(armorCareChance(level) === chance, `Armor Care level ${level} chance should be ${chance}.`);
    ensure(armorCareRollSucceeds(level, chance - 1e-9), `Armor Care level ${level} must save just below its chance boundary.`);
    ensure(!armorCareRollSucceeds(level, chance), `Armor Care level ${level} must fail at its exclusive chance boundary.`);
  }
  ensure(armorCareChance(6) === 0.25, "Armor Care must cap at its five-level maximum.");

  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASArmorCareLevel5", GameMode.survival);
  await test.idle(2);
  ensure(player.hasTag("as_armor_care_seeded"), "Production behavior pack did not seed Armor Care level 5.");
  const equippable = player.getComponent("minecraft:equippable");
  ensure(equippable, "Armor Care production test player did not expose equippable.");
  const armor = [
    [EquipmentSlot.Head, new ItemStack("minecraft:diamond_helmet")],
    [EquipmentSlot.Chest, new ItemStack("minecraft:diamond_chestplate")],
    [EquipmentSlot.Legs, new ItemStack("minecraft:diamond_leggings")],
    [EquipmentSlot.Feet, new ItemStack("minecraft:diamond_boots")],
  ];
  for (const [slot, stack] of armor) ensure(equippable.setEquipment(slot, stack), `Could not equip ${stack.typeId} for Armor Care production test.`);
  const readArmor = () => armor.map(([slot]) => {
    const stack = equippable.getEquipment(slot);
    const durability = stack?.getComponent("minecraft:durability");
    return { slot, typeId: stack?.typeId, damage: durability?.damage, maxDurability: durability?.maxDurability };
  });
  const health = player.getComponent("minecraft:health");
  ensure(health, "Armor Care production test player did not expose health.");
  let savedPieces = 0;
  let spentPieces = 0;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (attempt > 0) await test.idle(12);
    ensure(player.applyDamage(16, { cause: EntityDamageCause.entityAttack }), `BDS rejected Armor Care trial ${attempt + 1}.`);
    await test.idle(1);
    const state = readArmor();
    for (const item of state) {
      if (item.damage === 0) savedPieces += 1;
      else if (item.damage === 4) spentPieces += 1;
      else ensure(false, `Armor Care produced an unexpected ordinary-hit durability state: ${JSON.stringify(item)}.`);
    }
    for (const [slot] of armor) {
      const stack = equippable.getEquipment(slot);
      const durability = stack?.getComponent("minecraft:durability");
      ensure(stack && durability, `Armor Care lost a piece during ordinary-hit trial ${attempt + 1}.`);
      durability.damage = 0;
      ensure(equippable.setEquipment(slot, stack), `Could not reset ${slot} durability for the next ordinary-hit trial.`);
    }
    ensure(health.setCurrentValue(health.effectiveMax), `Could not restore test health after Armor Care trial ${attempt + 1}.`);
  }
  ensure(savedPieces > 0 && spentPieces > 0,
    `Twenty level-5 hits did not produce both saved and native durability outcomes (${savedPieces} saved, ${spentPieces} spent).`);

  let savedBreakPieces = 0;
  let spentBreakPieces = 0;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (attempt > 0) await test.idle(12);
    for (const [slot, template] of armor) {
      const current = equippable.getEquipment(slot);
      const stack = current?.typeId === template.typeId ? current : template.clone();
      const durability = stack.getComponent("minecraft:durability");
      ensure(durability, `Armor Care break trial ${attempt + 1} lacks ${template.typeId} durability.`);
      durability.damage = durability.maxDurability - 4;
      ensure(equippable.setEquipment(slot, stack), `Could not set ${slot} to its break boundary in trial ${attempt + 1}.`);
    }
    ensure(health.setCurrentValue(health.effectiveMax), `Could not restore health before break-boundary trial ${attempt + 1}.`);
    ensure(player.applyDamage(16, { cause: EntityDamageCause.entityAttack }), `BDS rejected Armor Care break trial ${attempt + 1}.`);
    await test.idle(1);
    const state = readArmor();
    for (const item of state) {
      if (item.damage === item.maxDurability - 4) savedBreakPieces += 1;
      else spentBreakPieces += 1;
    }
  }
  ensure(savedBreakPieces > 0 && spentBreakPieces > 0,
    `Twenty level-5 break-boundary hits did not produce both saved and native outcomes (${savedBreakPieces} saved, ${spentBreakPieces} spent).`);
  ensure(armor.every(([, stack]) => countItem(inventoryOf(player), stack.typeId) === 0),
    "Armor Care's break-boundary restoration duplicated armor into the inventory.");
  console.warn("AS_ARMOR_CARE_PRODUCTION_TEST " + JSON.stringify({ savedPieces, spentPieces, savedBreakPieces, spentBreakPieces }));
  player.disconnect();
  test.succeed();
}).maxTicks(520).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "armor_care_does_not_change_unowned_armor", async (test) => {
  for (let x = 1; x <= 8; x += 1) {
    for (let z = 1; z <= 8; z += 1) test.setBlockType("minecraft:stone", { x, y: 2, z });
  }
  const player = test.spawnSimulatedPlayer({ x: 3, y: 3, z: 3 }, "ASArmorCareControl", GameMode.survival);
  const equippable = player.getComponent("minecraft:equippable");
  ensure(equippable, "Unaugmented Armor Care control player did not expose equippable.");
  const armor = [
    [EquipmentSlot.Head, new ItemStack("minecraft:iron_helmet")],
    [EquipmentSlot.Chest, new ItemStack("minecraft:iron_chestplate")],
    [EquipmentSlot.Legs, new ItemStack("minecraft:iron_leggings")],
    [EquipmentSlot.Feet, new ItemStack("minecraft:iron_boots")],
  ];
  for (const [slot, stack] of armor) ensure(equippable.setEquipment(slot, stack), `Could not equip ${stack.typeId} for Armor Care control.`);
  const applied = player.applyDamage(16, { cause: EntityDamageCause.entityAttack });
  ensure(applied, "BDS rejected the unaugmented Armor Care control damage.");
  await test.idle(1);
  const state = armor.map(([slot]) => {
    const stack = equippable.getEquipment(slot);
    return { slot, typeId: stack?.typeId, damage: stack?.getComponent("minecraft:durability")?.damage };
  });
  ensure(state.every(item => item.damage === 4), `A player without Armor Care must retain native armor wear: ${JSON.stringify(state)}.`);
  console.warn("AS_ARMOR_CARE_UNOWNED_CONTROL " + JSON.stringify(state));
  player.disconnect();
  test.succeed();
}).maxTicks(30).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "ride_current_liquid_state_probe", async (test) => {
  const dimension = world.getDimension("overworld");
  for (let x = 0; x <= 9; x += 1) {
    for (let z = 1; z <= 5; z += 1) {
      test.setBlockType("minecraft:stone", { x, y: 1, z });
      test.setBlockType("minecraft:stone", { x, y: 5, z });
    }
  }
  for (let z = 1; z <= 5; z += 1) {
    for (let y = 2; y <= 4; y += 1) {
      test.setBlockType("minecraft:stone", { x: 0, y, z });
      test.setBlockType("minecraft:stone", { x: 9, y, z });
    }
  }
  for (let x = 1; x <= 8; x += 1) {
    for (let y = 2; y <= 4; y += 1) {
      test.setBlockType("minecraft:stone", { x, y, z: 2 });
      test.setBlockType("minecraft:stone", { x, y, z: 4 });
    }
  }
  for (let y = 2; y <= 4; y += 1) {
    for (let x = 1; x <= 8; x += 1) {
      const block = dimension.getBlock(test.worldLocation({ x, y, z: 3 }));
      ensure(block, `No test block at ${x},${y},3.`);
      block.setPermutation(BlockPermutation.resolve("minecraft:flowing_water", { liquid_depth: x - 1 }));
    }
  }
  for (let x = 0; x <= 9; x += 1) {
    for (let z = 6; z <= 8; z += 1) {
      test.setBlockType("minecraft:stone", { x, y: 1, z });
      test.setBlockType("minecraft:stone", { x, y: 5, z });
    }
  }
  for (let z = 6; z <= 8; z += 1) {
    for (let y = 2; y <= 4; y += 1) {
      test.setBlockType("minecraft:stone", { x: 0, y, z });
      test.setBlockType("minecraft:stone", { x: 9, y, z });
    }
  }
  for (let x = 1; x <= 8; x += 1) {
    for (let y = 2; y <= 4; y += 1) {
      test.setBlockType("minecraft:stone", { x, y, z: 6 });
      test.setBlockType("minecraft:stone", { x, y, z: 8 });
      test.setBlockType("minecraft:water", { x, y, z: 7 });
    }
  }

  const waterRow = [];
  for (let x = 1; x <= 8; x += 1) {
    const block = dimension.getBlock(test.worldLocation({ x, y: 3, z: 3 }));
    waterRow.push({
      x,
      typeId: block?.typeId,
      isLiquid: block?.isLiquid,
      depth: block?.permutation.getState("liquid_depth"),
    });
  }
  ensure(waterRow.every(block => block.isLiquid && typeof block.depth === "number"), "The flowing-water state was not readable from stable block permutations.");

  const control = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 3 }, "ASRideCurrentControl", GameMode.survival);
  control.setRotation({ x: 0, y: -90 });
  control.swim();
  control.moveRelative(0, 1, 0.2);
  await test.idle(6);
  const controlMovement = control.getComponent("minecraft:underwater_movement");
  ensure(controlMovement && control.isInWater && control.isSwimming, "Ride Current control did not expose swimming and underwater movement state.");
  const controlVelocity = control.getVelocity();
  ensure(controlVelocity.x > 0.001, "The test flowing-water gradient did not carry the player toward higher liquid_depth values.");
  ensure(Math.abs(controlMovement.currentValue - controlMovement.defaultValue) < 0.000001,
    "An unowned Ride Current level changed the underwater movement component.");
  control.disconnect();
  await test.idle(1);

  const rideCurrentLevels = [];
  for (let level = 1; level <= 3; level += 1) {
    const player = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 3 }, `ASRideCurrentLevel${level}`, GameMode.survival);
    player.setRotation({ x: 0, y: -90 });
    player.swim();
    player.moveRelative(0, 1, 0.2);
    await test.idle(6);
    const underwaterMovement = player.getComponent("minecraft:underwater_movement");
    ensure(underwaterMovement && player.isInWater && player.isSwimming, `Ride Current level ${level} player did not remain swimming.`);
    const expected = underwaterMovement.defaultValue * (1 + level * 0.15);
    rideCurrentLevels.push({ level, current: underwaterMovement.currentValue, expected, velocity: player.getVelocity() });
    ensure(Math.abs(underwaterMovement.currentValue - expected) < 0.000001,
      `Ride Current level ${level} should set the exact +${level * 15}% underwater multiplier; expected ${expected}, got ${underwaterMovement.currentValue}.`);
    ensure(player.getVelocity().x > 0,
      `Ride Current level ${level} should preserve positive motion with the measured current.`);
    player.disconnect();
    await test.idle(1);
  }

  const webbed = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 3 }, "ASRideCurrentWebbedLevel1", GameMode.survival);
  webbed.setRotation({ x: 0, y: -90 });
  webbed.swim();
  webbed.moveRelative(0, 1, 0.2);
  await test.idle(6);
  const webbedMovement = webbed.getComponent("minecraft:underwater_movement");
  ensure(webbedMovement && webbed.isSwimming, "Ride Current + Webbed Feet player did not remain swimming.");
  const expectedWebbedStack = webbedMovement.defaultValue * 1.25;
  ensure(Math.abs(webbedMovement.currentValue - expectedWebbedStack) < 0.000001,
    `Ride Current + Webbed Feet should add +15% and +10%; expected ${expectedWebbedStack}, got ${webbedMovement.currentValue}.`);
  const webbedStackResult = { current: webbedMovement.currentValue, expected: expectedWebbedStack };
  webbed.disconnect();
  await test.idle(1);

  const against = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 3 }, "ASRideCurrentAgainstLevel3", GameMode.survival);
  against.setRotation({ x: 0, y: 90 });
  against.swim();
  against.moveRelative(0, 1, 0.2);
  await test.idle(2);
  against.clearVelocity();
  against.applyImpulse({ x: -0.5, y: 0, z: 0 });
  await test.idle(1);
  const againstMovement = against.getComponent("minecraft:underwater_movement");
  const againstVelocity = against.getVelocity();
  ensure(againstMovement && against.isSwimming, "Against-current control player did not remain swimming.");
  ensure(againstVelocity.x < -0.001, `Against-current control did not achieve negative X motion: ${againstVelocity.x}.`);
  ensure(Math.abs(againstMovement.currentValue - againstMovement.defaultValue) < 0.000001,
    "Ride Current activated while the player moved against the measured current.");
  const againstResult = { velocity: againstVelocity, current: againstMovement.currentValue, defaultValue: againstMovement.defaultValue };
  against.disconnect();
  await test.idle(1);

  const stillPlayer = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 7 }, "ASRideCurrentStillLevel3", GameMode.survival);
  stillPlayer.setRotation({ x: 0, y: -90 });
  stillPlayer.swim();
  stillPlayer.moveRelative(0, 1, 0.2);
  await test.idle(4);
  const stillMovement = stillPlayer.getComponent("minecraft:underwater_movement");
  const stillWater = dimension.getBlock(test.worldLocation({ x: 4, y: 3, z: 7 }));
  const stillWaterDepth = stillWater?.permutation.getState("liquid_depth");
  console.warn("AS_RIDE_CURRENT_RUNTIME_TEST " + JSON.stringify({
    rideCurrentLevels,
    controlVelocity,
    webbedStack: webbedStackResult,
    against: againstResult,
    stillWater: { typeId: stillWater?.typeId, depth: stillWaterDepth },
    playerSwimming: stillPlayer.isSwimming,
    underwaterMovement: stillMovement && { current: stillMovement.currentValue, defaultValue: stillMovement.defaultValue },
  }));
  ensure(stillWater?.typeId === "minecraft:water" && stillWaterDepth === 0, "The control basin did not remain a flat source-water pool.");
  ensure(stillPlayer.isSwimming && stillMovement, "The simulated player left swimming state in the source-water control basin.");
  ensure(Math.abs(stillMovement.currentValue - stillMovement.defaultValue) < 0.000001,
    "Ride Current activated without a horizontal liquid-depth gradient.");
  const urgentInCurrent = test.spawnSimulatedPlayer({ x: 4, y: 2, z: 3 }, "ASRideCurrentUrgent", GameMode.survival);
  urgentInCurrent.setRotation({ x: 0, y: -90 });
  urgentInCurrent.swim();
  urgentInCurrent.moveRelative(0, 1, 0.2);
  await test.idle(6);
  ensure(urgentInCurrent.isInWater && urgentInCurrent.isSwimming,
    "Urgent Steps + Ride Current + Webbed Feet player did not enter flowing-water swim state.");
  const urgentDamageApplied = urgentInCurrent.applyDamage(1, { cause: EntityDamageCause.magic });
  ensure(urgentDamageApplied, "Urgent Steps water-stack damage was rejected.");
  await test.idle(3);
  const urgentUnderwater = urgentInCurrent.getComponent("minecraft:underwater_movement");
  ensure(urgentUnderwater && urgentInCurrent.isInWater && urgentInCurrent.isSwimming,
    "Urgent Steps water-stack player left water after its damage event.");
  const expectedUrgentWaterStack = urgentUnderwater.defaultValue * 1.45;
  ensure(Math.abs(urgentUnderwater.currentValue - expectedUrgentWaterStack) < 0.000001,
    `Urgent Steps + Ride Current + Webbed Feet should add +45% underwater movement; expected ${expectedUrgentWaterStack}, got ${urgentUnderwater.currentValue}.`);
  urgentInCurrent.teleport(test.worldLocation({ x: 4, y: 6, z: 3 }));
  await test.idle(3);
  const urgentGroundMovement = urgentInCurrent.getComponent("minecraft:movement");
  ensure(!urgentInCurrent.isInWater && urgentGroundMovement,
    "Urgent Steps water-stack player did not leave the water basin.");
  ensure(Math.abs(urgentUnderwater.currentValue - urgentUnderwater.defaultValue) < 0.000001,
    "Leaving water should restore the underwater movement value after Ride Current and Urgent Steps.");
  const expectedUrgentGround = urgentGroundMovement.defaultValue * 1.20;
  ensure(Math.abs(urgentGroundMovement.currentValue - expectedUrgentGround) < 0.000001,
    `Urgent Steps should remain active on land after leaving water; expected ${expectedUrgentGround}, got ${urgentGroundMovement.currentValue}.`);
  console.warn("AS_RIDE_CURRENT_URGENT_STACK_TEST " + JSON.stringify({
    underwater: urgentUnderwater.currentValue,
    underwaterDefault: urgentUnderwater.defaultValue,
    ground: urgentGroundMovement.currentValue,
    groundExpected: expectedUrgentGround,
  }));
  urgentInCurrent.disconnect();
  test.succeed();
}).maxTicks(90).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "urgent_steps_triggers_refreshes_and_stacks_on_real_damage", async (test) => {
  const levelResults = [];
  for (let level = 1; level <= 3; level += 1) {
    const player = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 2 }, `ASUrgentStepsLevel${level}`, GameMode.survival);
    await test.idle(3);
    ensure(player.hasTag(`as_urgent_steps_seeded_${level}`), `Production behavior pack did not seed Urgent Steps level ${level}.`);
    const movement = player.getComponent("minecraft:movement");
    ensure(movement, `Urgent Steps level ${level} player has no movement component.`);
    const damageEvents = [];
    const observeDamage = event => {
      if (event.hurtEntity.id === player.id) damageEvents.push({ damage: event.damage, isPlayer: event.hurtEntity instanceof Player });
    };
    world.afterEvents.entityHurt.subscribe(observeDamage);
    try {
      const applied = player.applyDamage(1, { cause: EntityDamageCause.magic });
      ensure(applied, `Urgent Steps level ${level} test damage was rejected.`);
      await test.idle(3);
    } finally {
      world.afterEvents.entityHurt.unsubscribe(observeDamage);
    }
    ensure(damageEvents.length === 1 && damageEvents[0].damage > 0 && damageEvents[0].isPlayer,
      `Urgent Steps level ${level} should receive one positive player hurt after-event; got ${JSON.stringify(damageEvents)}.`);
    const expected = movement.defaultValue * (1 + level * 0.10);
    levelResults.push({ level, damage: damageEvents[0].damage, current: movement.currentValue, expected });
    ensure(Math.abs(movement.currentValue - expected) < 0.000001,
      `Urgent Steps level ${level} should add exactly ${level * 10}% movement; expected ${expected}, got ${movement.currentValue}.`);
    player.disconnect();
    await test.idle(1);
  }

  const stacked = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 2 }, "ASUrgentStepsStack", GameMode.survival);
  await test.idle(3);
  const stackedMovement = stacked.getComponent("minecraft:movement");
  ensure(stackedMovement, "Quick Feet + Urgent Steps player has no movement component.");
  const quickFeetBaseline = stackedMovement.defaultValue * 1.15;
  ensure(Math.abs(stackedMovement.currentValue - quickFeetBaseline) < 0.000001,
    `Level-5 Quick Feet should establish a +15% baseline before damage; expected ${quickFeetBaseline}, got ${stackedMovement.currentValue}.`);
  const firstHit = stacked.applyDamage(1, { cause: EntityDamageCause.magic });
  ensure(firstHit, "Urgent Steps refresh test's first damage was rejected.");
  await test.idle(3);
  const combinedMovement = stackedMovement.defaultValue * 1.35;
  ensure(Math.abs(stackedMovement.currentValue - combinedMovement) < 0.000001,
    `Quick Feet + level-2 Urgent Steps should add to +35%; expected ${combinedMovement}, got ${stackedMovement.currentValue}.`);
  await test.idle(40);
  const refreshHit = stacked.applyDamage(1, { cause: EntityDamageCause.magic });
  ensure(refreshHit, "Urgent Steps refresh test's second damage was rejected.");
  await test.idle(20);
  ensure(Math.abs(stackedMovement.currentValue - combinedMovement) < 0.000001,
    "A second real hit should refresh the 60-tick timer without stacking a duplicate movement bonus.");
  await test.idle(42);
  ensure(Math.abs(stackedMovement.currentValue - quickFeetBaseline) < 0.000001,
    `Urgent Steps should expire after the refreshed 60-tick window and retain Quick Feet; expected ${quickFeetBaseline}, got ${stackedMovement.currentValue}.`);
  stacked.disconnect();
  await test.idle(1);

  const cancelled = test.spawnSimulatedPlayer({ x: 2, y: 2, z: 2 }, "ASUrgentStepsCancelled", GameMode.survival);
  await test.idle(3);
  const cancelledMovement = cancelled.getComponent("minecraft:movement");
  const cancelledHealth = cancelled.getComponent("minecraft:health");
  ensure(cancelledMovement && cancelledHealth, "Cancelled-hit control is missing player components.");
  const healthBefore = cancelledHealth.currentValue;
  let afterEventCount = 0;
  const cancelDamage = event => {
    if (event.hurtEntity.id === cancelled.id) event.cancel = true;
  };
  const observeHurt = event => {
    if (event.hurtEntity.id === cancelled.id) afterEventCount += 1;
  };
  world.beforeEvents.entityHurt.subscribe(cancelDamage);
  world.afterEvents.entityHurt.subscribe(observeHurt);
  try {
    cancelled.applyDamage(1, { cause: EntityDamageCause.magic });
    await test.idle(2);
  } finally {
    world.beforeEvents.entityHurt.unsubscribe(cancelDamage);
    world.afterEvents.entityHurt.unsubscribe(observeHurt);
  }
  ensure(afterEventCount === 0, `A before-event-cancelled hit should not produce entityHurt after-event; observed ${afterEventCount}.`);
  ensure(Math.abs(cancelledHealth.currentValue - healthBefore) < 0.000001,
    "Cancelling the hit should preserve the player's health.");
  ensure(Math.abs(cancelledMovement.currentValue - cancelledMovement.defaultValue) < 0.000001,
    "A cancelled hit must not activate Urgent Steps.");
  console.warn("AS_URGENT_STEPS_RUNTIME_TEST " + JSON.stringify({ levelResults, quickFeetBaseline, combinedMovement, refreshed: true, expired: true, cancelledAfterEvents: afterEventCount }));
  cancelled.disconnect();
  test.succeed();
}).maxTicks(150).structureName(STRUCTURE).tag(TAG);

