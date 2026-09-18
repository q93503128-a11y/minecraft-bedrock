import { system, BlockPermutation, ItemStack } from "@minecraft/server";
import "./acquisition.js";
import "./reward_behaviors.js";

const weightedPools = {
  common: [
    { weight: 28, kind: "fragments", id: "lb:common_fragment", min: 2, max: 5 },
    { weight: 8, kind: "item", id: "lb:reward_burger" },
    { weight: 8, kind: "item", id: "lb:reward_noodles" },
    { weight: 7, kind: "item", id: "lb:reward_plunger" },
    { weight: 6, kind: "item", id: "lb:reward_snow_globe" },
    { weight: 6, kind: "item", id: "lb:reward_vase" },
    { weight: 5, kind: "item", id: "lb:reward_camera" },
    { weight: 5, kind: "item", id: "lb:reward_moai" },
    { weight: 5, kind: "item", id: "lb:reward_backpack" },
    { weight: 5, kind: "item", id: "lb:common_lucky_block" },
    { weight: 5, kind: "fragments", id: "lb:rare_fragment", min: 1, max: 1 }
  ],
  rare: [
    { weight: 25, kind: "fragments", id: "lb:rare_fragment", min: 2, max: 4 },
    { weight: 10, kind: "item", id: "lb:reward_vending_machine" },
    { weight: 10, kind: "item", id: "lb:reward_pc" },
    { weight: 9, kind: "item", id: "lb:reward_cctv" },
    { weight: 9, kind: "item", id: "lb:reward_wrench" },
    { weight: 8, kind: "item", id: "lb:reward_easel" },
    { weight: 8, kind: "item", id: "lb:reward_backpack" },
    { weight: 8, kind: "item", id: "lb:reward_golden_hammer" },
    { weight: 7, kind: "item", id: "lb:common_lucky_block", count: 2 },
    { weight: 6, kind: "fragments", id: "lb:epic_fragment", min: 1, max: 1 }
  ],
  epic: [
    { weight: 32, kind: "fragments", id: "lb:epic_fragment", min: 2, max: 4 },
    { weight: 24, kind: "item", id: "lb:reward_chainsaw" },
    { weight: 12, kind: "item", id: "lb:reward_golden_hammer" },
    { weight: 10, kind: "item", id: "lb:reward_pc" },
    { weight: 10, kind: "item", id: "lb:rare_lucky_block", count: 2 },
    { weight: 8, kind: "fragments", id: "lb:legendary_fragment", min: 1, max: 1 },
    { weight: 4, kind: "item", id: "lb:epic_lucky_block" }
  ]
};

const tierFallbacks = {
  legendary: { fragment: "lb:legendary_fragment", min: 3, max: 5, bonus: "lb:epic_lucky_block", bonusChance: 1.0 },
  mythic: { fragment: "lb:mythic_fragment", min: 4, max: 6, bonus: "lb:legendary_lucky_block", bonusChance: 1.0 }
};

function chooseWeighted(pool) {
  const total = pool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return pool[pool.length - 1];
}

function spawnAt(dimension, pos, id, count = 1) {
  dimension.spawnItem(new ItemStack(id, count), pos);
}

function openWeighted(dimension, pos, tier) {
  const reward = chooseWeighted(weightedPools[tier]);
  if (reward.kind === "fragments") {
    const count = reward.min + Math.floor(Math.random() * (reward.max - reward.min + 1));
    spawnAt(dimension, pos, reward.id, count);
  } else {
    spawnAt(dimension, pos, reward.id, reward.count ?? 1);
  }
}

function openFallback(dimension, pos, tier) {
  const cfg = tierFallbacks[tier];
  const count = cfg.min + Math.floor(Math.random() * (cfg.max - cfg.min + 1));
  spawnAt(dimension, pos, cfg.fragment, count);
  if (Math.random() <= cfg.bonusChance) spawnAt(dimension, pos, cfg.bonus, 1);
}

function openTier(event, tier) {
  const block = event.block;
  const dimension = event.dimension;
  const pos = { x: block.location.x + 0.5, y: block.location.y + 0.65, z: block.location.z + 0.5 };
  block.setPermutation(BlockPermutation.resolve("minecraft:air"));
  if (weightedPools[tier]) openWeighted(dimension, pos, tier);
  else openFallback(dimension, pos, tier);
}

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const tier of ["common", "rare", "epic", "legendary", "mythic"]) {
    initEvent.blockComponentRegistry.registerCustomComponent(`lb:open_${tier}`, {
      onPlayerInteract(event) { openTier(event, tier); }
    });
  }
});
