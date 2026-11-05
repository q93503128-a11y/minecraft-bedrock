import { EntityDamageCause, GameMode, ItemStack, Player, world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { synthesizeCore } from "./cores.js";

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

