import { system, world, BlockPermutation, ItemStack } from "@minecraft/server";
import "./acquisition.js";
import "./reward_behaviors.js";
import "./integrations/inhabitants.js";
import "./integrations/inhabitants_bogre.js";
import "./integrations/bomd_obsidilith.js";
import "./integrations/slasher/index.js";
import "./integrations/tomemancy.js";
import "./integrations/slayers_beasts_mantis.js";
import "./integrations/slayers_beasts_tyrachnid.js";
import { weightedPools, tierFallbacks, activeTiers } from "./reward_registry.js";
import { startMythicEvent } from "./events/mythic_events.js";
import { startPreDragonEvent } from "./events/pre_dragon_events.js";

function chooseWeighted(pool) {
  const postDragon = world.getDynamicProperty("lb:post_dragon_unlocked") === true;
  const eligible = pool.filter(entry => !entry.requiresPostDragon || postDragon);
  const actualPool = eligible.length ? eligible : pool.filter(entry => !entry.requiresPostDragon);
  const total = actualPool.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of actualPool) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return actualPool[actualPool.length - 1];
}

function spawnAt(dimension, pos, id, count = 1) {
  dimension.spawnItem(new ItemStack(id, count), pos);
}

function openWeighted(dimension, pos, tier, player) {
  const reward = chooseWeighted(weightedPools[tier]);
  if (reward.kind === "fragments") {
    const count = reward.min + Math.floor(Math.random() * (reward.max - reward.min + 1));
    spawnAt(dimension, pos, reward.id, count);
  } else if (reward.kind === "entity") {
    try {
      const spawned = dimension.spawnEntity(reward.id, { x: pos.x, y: pos.y + 0.4, z: pos.z });
      if (reward.nameTag) spawned.nameTag = reward.nameTag;
      if (reward.tameToOpener && player?.typeId === "minecraft:player") {
        try {
          spawned.getComponent("minecraft:tameable")?.tame(player);
          if (reward.tameEvent) spawned.triggerEvent(reward.tameEvent);
        } catch {}
      }
    } catch {}
  } else if (reward.kind === "bundle") {
    for (const entry of reward.items ?? []) {
      const count = entry.count ?? (
        Number.isInteger(entry.min) && Number.isInteger(entry.max)
          ? entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1))
          : 1
      );
      spawnAt(dimension, pos, entry.id, count);
    }
  } else if (reward.kind === "event") {
    const started = startMythicEvent(dimension, pos, reward.id) ||
      startPreDragonEvent(dimension, pos, reward.id);
    if (!started) {
      const fallback = reward.fallback ?? {
        id: tier === "mythic" ? "lb:mythic_fragment" : "lb:" + tier + "_fragment",
        min: tier === "mythic" ? 4 : 3,
        max: tier === "mythic" ? 4 : 4
      };
      const count = fallback.min + Math.floor(Math.random() * ((fallback.max ?? fallback.min) - fallback.min + 1));
      spawnAt(dimension, pos, fallback.id, count);
    }
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
  if (weightedPools[tier]) openWeighted(dimension, pos, tier, event.player);
  else openFallback(dimension, pos, tier);
}

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const tier of activeTiers) {
    initEvent.blockComponentRegistry.registerCustomComponent(`lb:open_${tier}`, {
      onPlayerInteract(event) { openTier(event, tier); }
    });
  }
});
