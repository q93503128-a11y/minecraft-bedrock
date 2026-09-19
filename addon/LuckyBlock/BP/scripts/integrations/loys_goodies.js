import { BlockPermutation, ItemStack, EntityDamageCause, system, world } from "@minecraft/server";

const HOSTILES = new Set([
  "minecraft:zombie","minecraft:husk","minecraft:drowned","minecraft:skeleton","minecraft:stray",
  "minecraft:wither_skeleton","minecraft:bogged","minecraft:creeper","minecraft:spider",
  "minecraft:cave_spider","minecraft:enderman","minecraft:witch","minecraft:slime",
  "minecraft:magma_cube","minecraft:blaze","minecraft:ghast","minecraft:guardian",
  "minecraft:shulker","minecraft:phantom","minecraft:pillager","minecraft:vindicator",
  "minecraft:evocation_illager","minecraft:ravager","minecraft:breeze","minecraft:warden",
  "lb:impaler","lb:wither_spider","lb:ant_soldier_guard","lb:ant_queen",
  "lb:mantis","lb:tyrachnid","lb:wudu_binder","lb:bogre","lb:warped_clam","lb:obsidilith","lb:gauntlet",
  "lb:rift_spitter_ant","lb:rift_charger_ant","lb:rift_burrower_ant",
  "lb:cave_dweller","lb:lich","lb:void_blossom"
]);

function center(block) {
  return { x: block.location.x + 0.5, y: block.location.y + 0.6, z: block.location.z + 0.5 };
}

function consumeBlock(event) {
  event.block.setPermutation(BlockPermutation.resolve("minecraft:air"));
}

function spawn(event, id, count = 1) {
  event.dimension.spawnItem(new ItemStack(id, count), center(event.block));
}

function register(registry, id, handlers) {
  registry.registerCustomComponent(id, handlers);
}


const TURRET_STEP = 5;
const TURRET_RANGE = 20;
const TURRET_DAMAGE = 9;
const TURRET_COOLDOWN = 15;
const TURRET_DEFAULT_AMMO = 96;
let turretTick = 0;

function turretTarget(turret) {
  let best;
  let bestSq = TURRET_RANGE * TURRET_RANGE;
  for (const entity of turret.dimension.getEntities({ location: turret.location, maxDistance: TURRET_RANGE })) {
    if (!HOSTILES.has(entity.typeId)) continue;
    const dx = entity.location.x - turret.location.x;
    const dy = entity.location.y - turret.location.y;
    const dz = entity.location.z - turret.location.z;
    const d = dx * dx + dy * dy + dz * dz;
    if (d >= bestSq) continue;

    const origin = { x: turret.location.x, y: turret.location.y + 0.95, z: turret.location.z };
    const aim = { x: entity.location.x, y: entity.location.y + 0.65, z: entity.location.z };
    const vx = aim.x - origin.x, vy = aim.y - origin.y, vz = aim.z - origin.z;
    const len = Math.max(0.001, Math.hypot(vx, vy, vz));
    let blocked = false;
    try {
      blocked = !!turret.dimension.getBlockFromRay(
        origin,
        { x: vx / len, y: vy / len, z: vz / len },
        { maxDistance: Math.max(0.1, len - 0.55), includeLiquidBlocks: false, includePassableBlocks: false }
      );
    } catch {}
    if (blocked) continue;
    best = entity;
    bestSq = d;
  }
  return best;
}

function turretTracer(turret, target) {
  const a = { x: turret.location.x, y: turret.location.y + 1.0, z: turret.location.z };
  const b = { x: target.location.x, y: target.location.y + 0.7, z: target.location.z };
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    try {
      turret.dimension.spawnParticle("lb:slasher_spark_particle", {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
      });
    } catch {}
  }
}

function fireTurret(turret, target) {
  try { turret.teleport(turret.location, { facingLocation: target.location }); } catch {}
  turretTracer(turret, target);
  try { turret.dimension.playSound("random.bow", turret.location, { volume: 0.35, pitch: 1.55 }); } catch {}
  try { target.applyDamage(TURRET_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity: turret }); }
  catch { try { target.applyDamage(TURRET_DAMAGE); } catch {} }
}

function runTurrets() {
  turretTick = world.getAbsoluteTime();
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    let dimension;
    try { dimension = world.getDimension(dimensionId); } catch { continue; }
    for (const turret of dimension.getEntities({ type: "lb:lucky_turret" })) {
      let ammo = Number(turret.getDynamicProperty("lb:turret_ammo"));
      if (!Number.isFinite(ammo)) {
        ammo = TURRET_DEFAULT_AMMO;
        turret.setDynamicProperty("lb:turret_ammo", ammo);
      }
      if (ammo <= 0) {
        try { dimension.spawnParticle("lb:slasher_spark_particle", { x: turret.location.x, y: turret.location.y + 0.8, z: turret.location.z }); } catch {}
        try { turret.remove(); } catch {}
        continue;
      }
      const next = Number(turret.getDynamicProperty("lb:turret_next_shot") ?? 0);
      if (turretTick < next) continue;
      const target = turretTarget(turret);
      if (!target) continue;
      fireTurret(turret, target);
      turret.setDynamicProperty("lb:turret_ammo", ammo - 1);
      turret.setDynamicProperty("lb:turret_next_shot", turretTick + TURRET_COOLDOWN);
    }
  }
}
system.runInterval(runTurrets, TURRET_STEP);

export function registerLoysGoodiesIntegration(registry) {
  register(registry, "lb:consume_burger", {
    onPlayerInteract(event) {
      event.player.addEffect("saturation", 80, { amplifier: 0 });
      event.player.addEffect("regeneration", 80, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:consume_noodles", {
    onPlayerInteract(event) {
      event.player.addEffect("saturation", 100, { amplifier: 0 });
      event.player.addEffect("regeneration", 120, { amplifier: 0 });
      event.player.addEffect("speed", 120, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:plunger_launch", {
    onPlayerInteract(event) {
      const dir = event.player.getViewDirection();
      event.player.applyImpulse({ x: dir.x * 0.65, y: 0.9, z: dir.z * 0.65 });
    }
  });

  register(registry, "lb:open_backpack", {
    onPlayerInteract(event) {
      spawn(event, "lb:common_fragment", 4 + Math.floor(Math.random() * 5));
      if (Math.random() < 0.55) spawn(event, "lb:rare_fragment", 1 + Math.floor(Math.random() * 2));
      if (Math.random() < 0.10) spawn(event, "lb:epic_fragment", 1);
      consumeBlock(event);
    }
  });

  register(registry, "lb:snow_globe", {
    onPlayerInteract(event) {
      const p = center(event.block);
      for (const entity of event.dimension.getEntities({ location: p, maxDistance: 8 })) {
        if (entity.id === event.player.id) continue;
        if (entity.typeId === "minecraft:player" && world.gameRules.pvp !== true) continue;
        try { entity.addEffect("slowness", 120, { amplifier: 1 }); } catch {}
      }
      spawn(event, "minecraft:snowball", 8);
    }
  });

  register(registry, "lb:vending_machine", {
    onPlayerInteract(event) {
      const uses = Number(event.block.permutation.getState("lb:uses_left") ?? 3);
      const reward = Math.random() < 0.58 ? "lb:reward_burger" : "lb:reward_noodles";
      spawn(event, reward, 1);
      if (uses <= 1) consumeBlock(event);
      else event.block.setPermutation(event.block.permutation.withState("lb:uses_left", uses - 1));
    }
  });

  register(registry, "lb:moai_blessing", {
    onPlayerInteract(event) {
      event.player.addEffect("resistance", 300, { amplifier: 1 });
      event.player.addEffect("slowness", 80, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:pc_overclock", {
    onPlayerInteract(event) {
      event.player.addEffect("haste", 500, { amplifier: 1 });
      event.player.addEffect("speed", 240, { amplifier: 0 });
      event.player.addEffect("night_vision", 500, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:cctv_scan", {
    onPlayerInteract(event) {
      const p = center(event.block);
      let nearest;
      let nearestSq = Infinity;
      let count = 0;
      for (const entity of event.dimension.getEntities({ location: p, maxDistance: 24 })) {
        if (!HOSTILES.has(entity.typeId)) continue;
        count++;
        const dx = entity.location.x - p.x;
        const dy = entity.location.y - p.y;
        const dz = entity.location.z - p.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < nearestSq) { nearestSq = d; nearest = entity; }
      }
      if (!nearest) event.player.sendMessage("§a[CCTV] 반경 24블럭에 적대 개체가 없습니다.");
      else event.player.sendMessage(`§e[CCTV] 적대 개체 ${count}마리 감지. 가장 가까움: ${nearest.typeId} / 약 ${Math.round(Math.sqrt(nearestSq))}블럭`);
    }
  });

  register(registry, "lb:wrench_tune", {
    onPlayerInteract(event) {
      event.player.addEffect("haste", 600, { amplifier: 2 });
      event.player.addEffect("resistance", 160, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:chainsaw_cut", {
    onPlayerInteract(event) {
      const origin = event.block.location;
      let cut = 0;
      for (let dx = -3; dx <= 3 && cut < 28; dx++) {
        for (let dy = -2; dy <= 4 && cut < 28; dy++) {
          for (let dz = -3; dz <= 3 && cut < 28; dz++) {
            const target = event.dimension.getBlock({ x: origin.x + dx, y: origin.y + dy, z: origin.z + dz });
            if (!target) continue;
            const id = target.typeId;
            if (!(id.endsWith("_log") || id.endsWith("_wood") || id.endsWith("_stem") || id.endsWith("_hyphae"))) continue;
            target.setPermutation(BlockPermutation.resolve("minecraft:air"));
            event.dimension.spawnItem(new ItemStack(id, 1), { x: target.location.x + 0.5, y: target.location.y + 0.5, z: target.location.z + 0.5 });
            cut++;
          }
        }
      }
      event.player.sendMessage(`§6[전기톱] 주변 원목 ${cut}개를 절단했습니다.`);
    }
  });

  register(registry, "lb:camera_snapshot", {
    onPlayerInteract(event) {
      const pos = event.player.location;
      const snap = `${event.player.dimension.id}|${Math.floor(pos.x)}|${Math.floor(pos.y)}|${Math.floor(pos.z)}`;
      const old = event.player.getDynamicProperty("lb:last_snapshot");
      event.player.setDynamicProperty("lb:last_snapshot", snap);
      event.player.sendMessage(`§b[럭키 카메라] 현재 위치 저장: ${snap}`);
      if (typeof old === "string") event.player.sendMessage(`§7이전 촬영 위치: ${old}`);
    }
  });

  register(registry, "lb:hammer_blessing", {
    onPlayerInteract(event) {
      event.player.addEffect("strength", 240, { amplifier: 1 });
      event.player.addEffect("resistance", 240, { amplifier: 1 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:vase_cache", {
    onPlayerInteract(event) {
      const roll = Math.random();
      if (roll < 0.65) spawn(event, "lb:common_fragment", 3 + Math.floor(Math.random() * 5));
      else if (roll < 0.94) spawn(event, "lb:rare_fragment", 1 + Math.floor(Math.random() * 2));
      else spawn(event, "lb:epic_fragment", 1);
      consumeBlock(event);
    }
  });

  register(registry, "lb:easel_focus", {
    onPlayerInteract(event) {
      event.player.addEffect("night_vision", 900, { amplifier: 0 });
      event.player.addEffect("slow_falling", 300, { amplifier: 0 });
      event.player.addEffect("speed", 200, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:deploy_turret", {
    onPlayerInteract(event) {
      const p = center(event.block);
      try {
        const turret = event.dimension.spawnEntity("lb:lucky_turret", { x: p.x, y: event.block.location.y + 0.05, z: p.z });
        turret.nameTag = "Lucky Auto-Turret";
        turret.setDynamicProperty("lb:turret_ammo", TURRET_DEFAULT_AMMO);
        turret.setDynamicProperty("lb:turret_next_shot", turretTick + 8);
        consumeBlock(event);
        try { event.dimension.playSound("random.click", p, { volume: 0.65, pitch: 1.15 }); } catch {}
      } catch {
        event.player.sendMessage("§c[럭키 터렛] 배치 공간을 확보한 뒤 다시 시도하세요.");
      }
    }
  });
}
