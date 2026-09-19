import { world, ItemStack } from "@minecraft/server";
import { subscribeFishingCatch } from "./integrations/minecraft_custom_events_fishing.js";

const POST_DRAGON_KEY = "lb:post_dragon_unlocked";

const COMMON_ORES = new Set([
  "minecraft:coal_ore","minecraft:deepslate_coal_ore",
  "minecraft:copper_ore","minecraft:deepslate_copper_ore",
  "minecraft:iron_ore","minecraft:deepslate_iron_ore",
  "minecraft:gold_ore","minecraft:deepslate_gold_ore","minecraft:nether_gold_ore",
  "minecraft:redstone_ore","minecraft:lit_redstone_ore","minecraft:deepslate_redstone_ore","minecraft:lit_deepslate_redstone_ore",
  "minecraft:lapis_ore","minecraft:deepslate_lapis_ore",
  "minecraft:quartz_ore"
]);

const RICH_ORES = new Set([
  "minecraft:diamond_ore","minecraft:deepslate_diamond_ore",
  "minecraft:emerald_ore","minecraft:deepslate_emerald_ore",
  "minecraft:ancient_debris"
]);

const FARM_BLOCKS = new Set([
  "minecraft:wheat","minecraft:carrots","minecraft:potatoes",
  "minecraft:beetroot","minecraft:nether_wart","minecraft:cocoa",
  "minecraft:melon_block","minecraft:pumpkin"
]);

const ELITES = new Set([
  "minecraft:ravager","minecraft:elder_guardian","minecraft:evocation_illager",
  "minecraft:piglin_brute","minecraft:warden"
]);

const HOSTILES = new Set([
  "minecraft:zombie","minecraft:husk","minecraft:drowned","minecraft:zombie_villager",
  "minecraft:skeleton","minecraft:stray","minecraft:wither_skeleton","minecraft:bogged",
  "minecraft:creeper","minecraft:spider","minecraft:cave_spider","minecraft:enderman",
  "minecraft:witch","minecraft:slime","minecraft:magma_cube","minecraft:blaze",
  "minecraft:ghast","minecraft:guardian","minecraft:shulker","minecraft:phantom",
  "minecraft:pillager","minecraft:vindicator","minecraft:breeze","minecraft:silverfish",
  "minecraft:endermite","minecraft:hoglin","minecraft:zoglin","minecraft:piglin"
]);

function spawnReward(dimension, location, itemId, min = 1, max = min) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  dimension.spawnItem(new ItemStack(itemId, count), {
    x: location.x + 0.5,
    y: location.y + 0.35,
    z: location.z + 0.5
  });
}

function rollReward(dimension, location, chance, itemId, min = 1, max = min) {
  if (Math.random() < chance) spawnReward(dimension, location, itemId, min, max);
}

function rollRewardWithPity(player, dimension, location, chance, itemId, pityKey, threshold, min = 1, max = min) {
  if (Math.random() < chance) {
    spawnReward(dimension, location, itemId, min, max);
    try { player.setDynamicProperty(pityKey, 0); } catch {}
    return true;
  }
  let count = 0;
  try { count = Number(player.getDynamicProperty(pityKey) ?? 0); } catch {}
  count++;
  if (count >= threshold) {
    spawnReward(dimension, location, itemId, min, max);
    try { player.setDynamicProperty(pityKey, 0); } catch {}
    return true;
  }
  try { player.setDynamicProperty(pityKey, count); } catch {}
  return false;
}

function isLog(id) {
  return id.endsWith("_log") || id.endsWith("_wood") || id.endsWith("_stem") || id.endsWith("_hyphae");
}

function isBulkStone(id) {
  return id === "minecraft:stone" || id === "minecraft:deepslate" ||
    id === "minecraft:netherrack" || id === "minecraft:blackstone" ||
    id === "minecraft:end_stone";
}

function isMatureEnough(id, permutation) {
  const states = permutation.getAllStates();
  const growth = states.growth;
  const age = states.age;

  if (id === "minecraft:wheat" || id === "minecraft:carrots" || id === "minecraft:potatoes" || id === "minecraft:beetroot") {
    return typeof growth !== "number" || growth >= 7;
  }
  if (id === "minecraft:nether_wart") return typeof age !== "number" || age >= 3;
  if (id === "minecraft:cocoa") return typeof age !== "number" || age >= 2;
  return true;
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const id = event.brokenBlockPermutation.type.id;
  if (id.startsWith("lb:")) return;

  const dimension = event.player.dimension;
  const location = event.block.location;

  if (RICH_ORES.has(id)) {
    rollRewardWithPity(event.player, dimension, location, 0.120, "lb:common_fragment", "lb:pity_mining_common", 5, 1, 2);
    rollReward(dimension, location, 0.015, "lb:rare_fragment", 1, 1);
    rollReward(dimension, location, 0.0015, "lb:epic_fragment", 1, 1);
    return;
  }

  if (COMMON_ORES.has(id)) {
    rollRewardWithPity(event.player, dimension, location, 0.060, "lb:common_fragment", "lb:pity_mining_common", 12, 1, 1);
    rollReward(dimension, location, 0.0025, "lb:rare_fragment", 1, 1);
    return;
  }

  if (isLog(id)) {
    rollRewardWithPity(event.player, dimension, location, 0.020, "lb:common_fragment", "lb:pity_logging_common", 32, 1, 1);
    return;
  }

  if (FARM_BLOCKS.has(id) && isMatureEnough(id, event.brokenBlockPermutation)) {
    rollRewardWithPity(event.player, dimension, location, 0.030, "lb:common_fragment", "lb:pity_farming_common", 24, 1, 1);
    return;
  }

  if (isBulkStone(id)) {
    rollRewardWithPity(event.player, dimension, location, 0.0015, "lb:common_fragment", "lb:pity_quarry_common", 256, 1, 1);
  }
});

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  const typeId = dead.typeId;
  const killer = event.damageSource.damagingEntity;
  const killerIsPlayer = killer?.typeId === "minecraft:player";

  if (typeId === "minecraft:ender_dragon") {
    if (world.getDynamicProperty(POST_DRAGON_KEY) !== true) {
      world.setDynamicProperty(POST_DRAGON_KEY, true);

      const dimension = killerIsPlayer ? killer.dimension : dead.dimension;
      const location = killerIsPlayer ? killer.location : dead.location;

      spawnReward(dimension, location, "lb:legendary_lucky_block", 1, 1);
      spawnReward(dimension, location, "lb:mythic_fragment", 2, 2);
      world.sendMessage("§d[럭키 블럭] 엔더드래곤 최초 처치! 후반부 럭키 콘텐츠가 해금되었습니다.");
    }
    return;
  }

  if (!killerIsPlayer) return;

  const dimension = killer.dimension;
  const location = dead.location;
  const postDragon = world.getDynamicProperty(POST_DRAGON_KEY) === true;

  if (typeId === "lb:obsidilith") {
    spawnReward(dimension, location, "lb:legendary_lucky_block", 1, 2);
    spawnReward(dimension, location, "lb:mythic_fragment", 4, 7);
    spawnReward(dimension, location, "lb:slasher_blade", 3, 5);
    rollReward(dimension, location, 0.28, "lb:mythic_lucky_block", 1, 1);
    return;
  }

  if (typeId === "lb:bogre") {
    spawnReward(dimension, location, "lb:epic_lucky_block", 1, 1);
    spawnReward(dimension, location, "lb:legendary_fragment", 6, 10);
    spawnReward(dimension, location, "lb:slasher_blade", 1, 2);
    rollReward(dimension, location, 0.35, "lb:mythic_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:impaler") {
    rollReward(dimension, location, 0.70, "lb:rare_fragment", 1, 2);
    rollReward(dimension, location, 0.15, "lb:epic_fragment", 1, 1);
    if (postDragon) rollReward(dimension, location, 0.020, "lb:legendary_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:ent_guardian") {
    spawnReward(dimension, location, "lb:rare_fragment", 1, 1);
    rollReward(dimension, location, 0.25, "lb:epic_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:warped_clam") {
    rollReward(dimension, location, 0.75, "lb:epic_fragment", 1, 2);
    rollReward(dimension, location, 0.18, "lb:legendary_fragment", 1, 1);
    rollReward(dimension, location, 0.015, "lb:mythic_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:mantis") {
    rollReward(dimension, location, 0.45, "lb:epic_fragment", 1, 2);
    rollReward(dimension, location, 0.08, "lb:legendary_fragment", 1, 1);
    rollReward(dimension, location, 0.002, "lb:mythic_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:tyrachnid") {
    spawnReward(dimension, location, "lb:legendary_fragment", 1, 2);
    rollReward(dimension, location, 0.25, "lb:epic_lucky_block", 1, 1);
    rollReward(dimension, location, 0.08, "lb:mythic_fragment", 1, 1);
    return;
  }

  if (typeId === "lb:wither_spider") {
    rollReward(dimension, location, 0.40, "lb:rare_fragment", 1, 1);
    rollReward(dimension, location, 0.09, "lb:epic_fragment", 1, 1);
    if (postDragon) rollReward(dimension, location, 0.004, "lb:legendary_fragment", 1, 1);
    return;
  }


  if (typeId === "lb:wudu_binder") {
    rollReward(dimension, location, 0.65, "lb:epic_fragment", 1, 2);
    rollReward(dimension, location, 0.12, "lb:legendary_fragment", 1, 1);
    rollReward(dimension, location, 0.012, "lb:mythic_fragment", 1, 1);
    return;
  }
  if (typeId === "minecraft:wither") {
    spawnReward(dimension, location, "lb:epic_lucky_block", 1, 1);
    rollReward(dimension, location, postDragon ? 0.30 : 0.15, "lb:legendary_fragment", 1, 2);
    return;
  }

  if (ELITES.has(typeId)) {
    rollReward(dimension, location, 0.30, "lb:rare_fragment", 1, 2);
    rollReward(dimension, location, 0.08, "lb:epic_fragment", 1, 1);
    if (postDragon) rollReward(dimension, location, 0.015, "lb:legendary_fragment", 1, 1);
    return;
  }

  if (HOSTILES.has(typeId)) {
    rollRewardWithPity(killer, dimension, location, 0.040, "lb:common_fragment", "lb:pity_combat_common", 20, 1, 1);
    rollReward(dimension, location, 0.0018, "lb:rare_fragment", 1, 1);
    if (postDragon) rollReward(dimension, location, 0.00025, "lb:epic_fragment", 1, 1);
  }
});

export function isPostDragonUnlocked() {
  return world.getDynamicProperty(POST_DRAGON_KEY) === true;
}


const EXPLORATION_CONTAINERS = new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel"
]);

function containerKey(prefix, dimension, block) {
  const raw = `${dimension.id}|${block.location.x}|${block.location.y}|${block.location.z}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `lb:${prefix}_${(hash >>> 0).toString(16)}`;
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  if (!EXPLORATION_CONTAINERS.has(event.block.typeId)) return;
  world.setDynamicProperty(containerKey("placed_container", event.dimension, event.block), true);
});

world.afterEvents.blockContainerOpened.subscribe((event) => {
  if (!EXPLORATION_CONTAINERS.has(event.block.typeId)) return;

  const opener = event.openSource?.entity;
  if (!opener || opener.typeId !== "minecraft:player") return;

  const placedKey = containerKey("placed_container", event.dimension, event.block);
  const openedKey = containerKey("opened_container", event.dimension, event.block);

  if (world.getDynamicProperty(placedKey) === true) return;
  if (world.getDynamicProperty(openedKey) === true) return;

  world.setDynamicProperty(openedKey, true);

  const postDragon = world.getDynamicProperty(POST_DRAGON_KEY) === true;
  const location = event.block.location;

  rollReward(event.dimension, location, 0.35, "lb:common_fragment", 1, 2);
  rollReward(event.dimension, location, 0.045, "lb:rare_fragment", 1, 1);
  rollReward(event.dimension, location, 0.006, "lb:epic_fragment", 1, 1);

  if (postDragon) {
    rollReward(event.dimension, location, 0.0010, "lb:legendary_fragment", 1, 1);
  }

  if (Math.random() < 0.012) {
    spawnReward(event.dimension, location, "lb:common_lucky_block", 1, 1);
  }
});


const FISHING_TREASURE = new Set([
  "minecraft:bow",
  "minecraft:enchanted_book",
  "minecraft:fishing_rod",
  "minecraft:name_tag",
  "minecraft:nautilus_shell",
  "minecraft:saddle"
]);

subscribeFishingCatch(({ player, dimension, location, itemStack }) => {
  if (!player || !itemStack) return;

  const postDragon = world.getDynamicProperty(POST_DRAGON_KEY) === true;
  const treasure = FISHING_TREASURE.has(itemStack.typeId);

  if (treasure) {
    rollRewardWithPity(player, dimension, location, 0.35, "lb:common_fragment", "lb:pity_fishing_common", 4, 1, 2);
    rollReward(dimension, location, 0.050, "lb:rare_fragment", 1, 1);
    rollReward(dimension, location, 0.0080, "lb:epic_fragment", 1, 1);
    if (postDragon) rollReward(dimension, location, 0.0012, "lb:legendary_fragment", 1, 1);
    return;
  }

  rollRewardWithPity(player, dimension, location, 0.15, "lb:common_fragment", "lb:pity_fishing_common", 8, 1, 1);
  rollReward(dimension, location, 0.012, "lb:rare_fragment", 1, 1);
  rollReward(dimension, location, 0.0010, "lb:epic_fragment", 1, 1);
  if (postDragon) rollReward(dimension, location, 0.0002, "lb:legendary_fragment", 1, 1);
});
