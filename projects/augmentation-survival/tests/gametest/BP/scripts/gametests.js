import { GameMode, ItemStack } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { synthesizeCore } from "./cores.js";
import { applySturdinessEffect } from "./passives.js";
import { commitCoreSelection, LEVELS_KEY } from "./progression.js";

const TAG = "augmentation_survival";
const STRUCTURE = "gametests:glass_cells";
const CORE = "augmentation_survival:common_augment_core";
const NEXT_CORE = "augmentation_survival:uncommon_augment_core";

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

GameTest.registerAsync("AugmentationSurvival", "core_item_use_keeps_core_until_choice", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASCoreUse", GameMode.survival);
  const inventory = inventoryOf(player);
  inventory.setItem(0, new ItemStack(CORE, 1));
  ensure(player.useItemInSlot(0), "Simulated player could not use the common core.");
  await test.idle(5);
  ensure(countItem(inventory, CORE) === 1, "The core was consumed before the selection transaction.");
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
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASSturdiness", GameMode.survival);
  const health = player.getComponent("minecraft:health");
  ensure(health, "Simulated player health component was unavailable.");
  const baseMax = health.effectiveMax;
  applySturdinessEffect(player, 1);
  await test.idle(1);
  ensure(health.effectiveMax === baseMax + 4, `Expected +4 max health at level 1; got ${health.effectiveMax - baseMax}.`);
  applySturdinessEffect(player, 5);
  await test.idle(1);
  ensure(health.effectiveMax === baseMax + 20, `Expected +20 max health at level 5; got ${health.effectiveMax - baseMax}.`);
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

GameTest.registerAsync("AugmentationSurvival", "core_selection_commits_level_and_preserves_core_on_rejection", async (test) => {
  const player = test.spawnSimulatedPlayer({ x: 4, y: 3, z: 3 }, "ASCoreCommit", GameMode.survival);
  const inventory = inventoryOf(player);
  const augment = { id: "augmentation_survival:sturdiness", max_level: 5 };
  inventory.setItem(0, new ItemStack(CORE, 2));

  const first = commitCoreSelection(player, CORE, augment);
  ensure(first.ok && first.level === 1, "A valid selection did not commit level 1.");
  ensure(countItem(inventory, CORE) === 1, "A successful selection did not consume exactly one core.");
  const savedLevels = JSON.parse(player.getDynamicProperty(LEVELS_KEY));
  ensure(savedLevels[augment.id] === 1, "The selected level was not saved on the player.");

  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ [augment.id]: 5 }));
  const rejected = commitCoreSelection(player, CORE, augment);
  ensure(!rejected.ok && rejected.reason === "max_level", "A max-level augment was not rejected.");
  ensure(countItem(inventory, CORE) === 1, "A rejected selection consumed a core.");
  test.succeed();
}).maxTicks(20).structureName(STRUCTURE).tag(TAG);

