import { BlockPermutation, EntityDamageCause, GameMode, ItemStack, Player, world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { AUGMENTS } from "./augment-data.js";
import { synthesizeCore } from "./cores.js";
import { applyBumperCropHarvest, bumperCropBonusChance } from "./harvest.js";
import { listAvailableCandidates } from "./offers.js";
import { LEVELS_KEY } from "./progression.js";

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

GameTest.registerAsync("AugmentationSurvival", "core_offers_only_bds_verified_effects_and_preserves_locked_tiers", async (test) => {
  const common = listAvailableCandidates("common", AUGMENTS, {});
  ensure(common.length === ENABLED_CANDIDATE_IDS.length, `Expected ${ENABLED_CANDIDATE_IDS.length} enabled common candidates; got ${common.length}.`);
  ensure(ENABLED_CANDIDATE_IDS.every(id => common.some(augment => augment.id === id)), "The enabled common candidate set diverged from its BDS-verified allowlist.");
  ensure(!common.some(augment => augment.id === "augmentation_survival:sturdiness"), "The known +4 vs +2 max-health mismatch was exposed as a core candidate.");

  for (const tier of ["uncommon", "rare", "epic", "legendary", "mythic"]) {
    ensure(listAvailableCandidates(tier, AUGMENTS, {}).length === 0, `${tier} exposed unported candidates.`);
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

GameTest.registerAsync("AugmentationSurvival", "bumper_crop_matches_maturity_and_all_five_exact_chance_thresholds", async (test) => {
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
    ensure(applyBumperCropHarvest(event, () => chance - 1e-9), `Level ${level} did not grant below its exact chance boundary.`);
    ensure(wheatCount() === before + 1, `Level ${level} did not spawn exactly one extra wheat item.`);
    ensure(!applyBumperCropHarvest(event, () => chance), `Level ${level} granted at its exclusive chance boundary.`);
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
    ensure(applyBumperCropHarvest(cropEvent, () => 0), `${blockId} did not receive its canonical extra product when the roll succeeded.`);
    ensure(productCount(product) === before + 1, `${blockId} did not spawn exactly one ${product}.`);
  }

  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:bumper_crop": 5 }));
  let rolls = 0;
  const immature = {
    ...event,
    brokenBlockPermutation: BlockPermutation.resolve("minecraft:wheat", { growth: 6 }),
  };
  ensure(!applyBumperCropHarvest(immature, () => { rolls += 1; return 0; }), "An immature wheat crop received a bonus.");
  ensure(rolls === 0, "An immature crop consumed a bonus roll.");
  const unsupported = {
    ...event,
    brokenBlockPermutation: BlockPermutation.resolve("minecraft:short_grass"),
  };
  ensure(!applyBumperCropHarvest(unsupported, () => { rolls += 1; return 0; }), "A non-crop block received a bonus.");
  ensure(rolls === 0, "An unsupported block consumed a bonus roll.");
  player.setDynamicProperty(LEVELS_KEY, JSON.stringify({}));
  ensure(!applyBumperCropHarvest(event, () => { rolls += 1; return 0; }), "An unowned augment granted a crop bonus.");
  ensure(rolls === 0, "An unowned augment consumed a bonus roll.");
  test.succeed();
}).maxTicks(40).structureName(STRUCTURE).tag(TAG);

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

