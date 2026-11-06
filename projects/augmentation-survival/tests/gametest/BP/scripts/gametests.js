import { BlockPermutation, EntityDamageCause, GameMode, ItemStack, Player, world } from "@minecraft/server";
import * as GameTest from "@minecraft/server-gametest";
import { AUGMENTS } from "./augment-data.js";
import { synthesizeCore } from "./cores.js";
import { applyCropHarvestBonuses, bumperCropBonusChance, seedSaverBonusChance } from "./harvest.js";
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
  "augmentation_survival:seed_saver",
  "augmentation_survival:hearty_meal",
  "augmentation_survival:webbed_feet",
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
  await test.idle(12);
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

