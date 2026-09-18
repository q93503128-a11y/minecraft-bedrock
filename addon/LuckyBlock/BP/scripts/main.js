import { system, BlockPermutation, ItemStack } from "@minecraft/server";
import "./acquisition.js";
import "./reward_behaviors.js";
import "./integrations/inhabitants.js";
import { weightedPools, tierFallbacks, activeTiers } from "./reward_registry.js";

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
  for (const tier of activeTiers) {
    initEvent.blockComponentRegistry.registerCustomComponent(`lb:open_${tier}`, {
      onPlayerInteract(event) { openTier(event, tier); }
    });
  }
});
