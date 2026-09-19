import { system, world, BlockPermutation, ItemStack } from "@minecraft/server";
import "./acquisition.js";
import "./reward_behaviors.js";
import "./integrations/inhabitants.js";
import "./integrations/inhabitants_bogre.js";
import "./integrations/inhabitants_arsenal.js";
import "./integrations/bomd_obsidilith.js";
import "./integrations/bomd_gauntlet.js";
import "./integrations/bomd_void_blossom.js";
import "./integrations/slayers_beasts_rift_spitter.js";
import "./integrations/slasher/index.js";
import "./integrations/tomemancy.js";
import "./integrations/tomemancy_amethyst_repeater.js";
import "./integrations/loys_storm_longbow.js";
import "./integrations/loys_explorer_kit.js";
import "./integrations/loys_accessories.js";
import "./integrations/tomemancy_mystical_aegis.js";
import "./integrations/slayers_beasts_mantis.js";
import "./integrations/slayers_beasts_tyrachnid.js";
import "./integrations/slayers_beasts_wither_spider.js";
import "./integrations/slayers_beasts_wudu.js";
import "./integrations/slayers_beasts_damselfly.js";
import "./integrations/slayers_beasts_ant_queen.js";
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

const OPEN_PRESENTATION = {
  common: { sound: "random.pop", volume: 0.55, pitch: 1.22 },
  rare: { sound: "break.amethyst_cluster", volume: 0.62, pitch: 1.08 },
  epic: { sound: "slasher.critical", volume: 0.72, pitch: 1.0 },
  legendary: { sound: "lb.obsidilith.spike_indicator", volume: 0.82, pitch: 0.94 },
  mythic: { sound: "lb.obsidilith.prepare", volume: 0.95, pitch: 0.88 }
};

function particle(dimension, id, pos) {
  try { dimension.spawnParticle(id, pos); } catch {}
}

function ring(dimension, id, pos, radius, count, yOffset = 0) {
  for (let i = 0; i < count; i++) {
    const a = Math.PI * 2 * i / count;
    particle(dimension, id, {
      x: pos.x + Math.cos(a) * radius,
      y: pos.y + yOffset,
      z: pos.z + Math.sin(a) * radius
    });
  }
}

function presentOpening(dimension, pos, tier) {
  const cfg = OPEN_PRESENTATION[tier];
  if (!cfg) return;
  try { dimension.playSound(cfg.sound, pos, { volume: cfg.volume, pitch: cfg.pitch }); } catch {}

  if (tier === "common") {
    particle(dimension, "lb:slasher_spark_particle", pos);
    ring(dimension, "lb:slasher_spark_particle", pos, 0.45, 3, 0.1);
    return;
  }

  if (tier === "rare") {
    ring(dimension, "lb:slasher_spark_particle", pos, 0.65, 4, 0.12);
    particle(dimension, "lb:obsidilith_indicator", { x: pos.x, y: pos.y + 0.12, z: pos.z });
    return;
  }

  if (tier === "epic") {
    particle(dimension, "lb:tomemancy_flame_summoning", { x: pos.x, y: pos.y + 0.05, z: pos.z });
    ring(dimension, "lb:obsidilith_indicator", pos, 0.85, 4, 0.1);
    return;
  }

  if (tier === "legendary") {
    particle(dimension, "lb:obsidilith_burst", { x: pos.x, y: pos.y + 0.2, z: pos.z });
    ring(dimension, "lb:obsidilith_indicator", pos, 1.05, 6, 0.08);
    system.runTimeout(() => {
      particle(dimension, "lb:obsidilith_wave", { x: pos.x, y: pos.y + 0.1, z: pos.z });
      try { dimension.playSound("lb.obsidilith.burst", pos, { volume: 0.62, pitch: 1.04 }); } catch {}
    }, 4);
    return;
  }

  particle(dimension, "lb:obsidilith_wave", { x: pos.x, y: pos.y + 0.08, z: pos.z });
  ring(dimension, "lb:obsidilith_indicator", pos, 1.25, 8, 0.08);
  system.runTimeout(() => {
    particle(dimension, "lb:obsidilith_burst", { x: pos.x, y: pos.y + 0.3, z: pos.z });
    ring(dimension, "lb:slasher_spark_particle", pos, 1.0, 8, 0.2);
    try { dimension.playSound("lb.obsidilith.burst", pos, { volume: 0.85, pitch: 0.92 }); } catch {}
  }, 4);
  system.runTimeout(() => {
    particle(dimension, "lb:obsidilith_wave", { x: pos.x, y: pos.y + 0.12, z: pos.z });
  }, 8);
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
  presentOpening(dimension, pos, tier);
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
