import { EntityDamageCause, GameMode, ItemStack } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { cookOne, countItem, COOKING_IDS } from "./cooking.js";

const TAG = "monster_restaurant";
const STRUCTURE = "gametests:glass_cells";
const BOAR = "monster_restaurant:mushroom_boar";
const MEAT = COOKING_IDS.ingredient;
const ROAST = COOKING_IDS.meal;

function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

function inventoryOf(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  ensure(inventory, "Simulated player inventory was unavailable.");
  return inventory;
}

GameTest.register("MonsterRestaurant", "monster_spawns", (test) => {
  const boar = test.spawn(BOAR, { x: 4, y: 3, z: 3 });
  ensure(boar.typeId === BOAR, `Unexpected entity type: ${boar.typeId}`);
  const health = boar.getComponent("minecraft:health");
  ensure(health?.currentValue === 16, `Expected 16 health; got ${health?.currentValue}`);
  test.succeedOnTick(1);
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("MonsterRestaurant", "monster_retaliates", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "MRAttackTest", GameMode.survival);
  const boar = test.spawn(BOAR, { x: 4, y: 3, z: 3 });
  const health = player.getComponent("minecraft:health");
  ensure(health, "Simulated player health component was unavailable.");
  const initialHealth = health.currentValue;
  ensure(player.attackEntity(boar), "Simulated player could not trigger the boar's hurt response.");
  for (let tick = 0; tick < 200; tick += 1) {
    if (health.currentValue < initialHealth) {
      test.succeed();
      return;
    }
    await test.idle(1);
  }
  test.fail("Boar did not damage its attacker within 200 ticks.");
}).maxTicks(500).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("MonsterRestaurant", "monster_drops_meat", async (test) => {
  const boar = test.spawn(BOAR, { x: 4, y: 3, z: 3 });
  const dropLocation = { ...boar.location };
  boar.applyDamage(100, { cause: EntityDamageCause.magic });
  const dimension = test.getDimension();
  for (let tick = 0; tick < 40; tick += 1) {
    const drops = dimension.getEntities({
      type: "minecraft:item",
      location: dropLocation,
      maxDistance: 5,
    });
    const meatCount = drops.reduce((total, itemEntity) => {
      const stack = itemEntity.getComponent("minecraft:item")?.itemStack;
      return total + (stack?.typeId === MEAT ? stack.amount : 0);
    }, 0);
    if (meatCount >= 1 && meatCount <= 2) {
      test.succeed();
      return;
    }
    await test.idle(1);
  }
  test.fail("Killing the boar did not produce 1-2 meat within 40 ticks.");
}).maxTicks(60).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("MonsterRestaurant", "ordinary_weapon_attack_drops_meat", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "MROrdinaryAttack", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack("minecraft:iron_sword", 1));
  player.selectedSlotIndex = 0;
  const boar = test.spawn(BOAR, { x: 4, y: 3, z: 3 });
  const startHealth = boar.getComponent("minecraft:health")?.currentValue;
  ensure(startHealth === 16, `Expected a fresh boar at 16 health; got ${startHealth}.`);

  for (let swing = 0; swing < 8 && boar.isValid; swing += 1) {
    player.attackEntity(boar);
    await test.idle(12);
  }
  ensure(!boar.isValid, "Ordinary sword attacks did not defeat the boar.");

  const dimension = test.getDimension();
  for (let tick = 0; tick < 40; tick += 1) {
    const drops = dimension.getEntities({ type: "minecraft:item", location: { x: 4, y: 3, z: 3 }, maxDistance: 5 });
    const meatCount = drops.reduce((total, itemEntity) => {
      const stack = itemEntity.getComponent("minecraft:item")?.itemStack;
      return total + (stack?.typeId === MEAT ? stack.amount : 0);
    }, 0);
    const totalMeat = meatCount + countItem(inventory, MEAT);
    if (totalMeat >= 1 && totalMeat <= 2) {
      test.succeed();
      return;
    }
    await test.idle(1);
  }
  test.fail("Ordinary sword kills did not produce 1-2 meat within 40 ticks.");
}).maxTicks(500).structureName(STRUCTURE).tag(TAG);

GameTest.register("MonsterRestaurant", "cook_consumes_meat_and_grants_roast", (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "MRCookTest", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.addItem(new ItemStack(MEAT, 2));

  const result = cookOne(player);
  ensure(result.status === "cooked", `Expected cooking success; got ${result.status}.`);
  ensure(result.isNewRecipe, "First successful cook did not mark a new recipe.");
  ensure(countItem(inventory, MEAT) === 1, "Cooking did not consume exactly one ingredient.");
  ensure(countItem(inventory, ROAST) === 1, "Cooking did not grant exactly one roast.");
  ensure(player.getDynamicProperty(COOKING_IDS.discovery) === true, "Recipe discovery property was not set.");
  const repeat = cookOne(player);
  ensure(repeat.status === "cooked" && repeat.isNewRecipe === false, "Cooking a known recipe marked it as new again.");
  ensure(countItem(inventory, MEAT) === 0, "Repeated cooking did not consume one additional ingredient.");
  ensure(countItem(inventory, ROAST) === 2, "Repeated cooking did not grant exactly one additional meal.");
  test.succeedOnTick(1);
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.register("MonsterRestaurant", "cook_preserves_meat_when_inventory_is_full", (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "MRFullTest", GameMode.survival);
  const inventory = inventoryOf(player);
  for (let slot = 0; slot < inventory.size; slot += 1) {
    inventory.setItem(slot, new ItemStack("minecraft:diamond_sword", 1));
  }
  inventory.setItem(0, new ItemStack(MEAT, 1));

  const result = cookOne(player);
  ensure(result.status === "inventory_full", `Expected full inventory; got ${result.status}.`);
  ensure(countItem(inventory, MEAT) === 1, "Failed cooking consumed the ingredient.");
  ensure(countItem(inventory, ROAST) === 0, "Failed cooking granted a meal.");
  test.succeedOnTick(1);
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.register("MonsterRestaurant", "cook_requires_ingredient", (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "MRNoMeatTest", GameMode.survival);
  const inventory = inventoryOf(player);
  const result = cookOne(player);
  ensure(result.status === "missing_ingredient", `Expected missing ingredient; got ${result.status}.`);
  ensure(countItem(inventory, ROAST) === 0, "Cooking without ingredients granted a meal.");
  test.succeedOnTick(1);
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);
