import { system, BlockPermutation, ItemStack } from "@minecraft/server";

const HOSTILES = new Set([
  "minecraft:zombie","minecraft:husk","minecraft:drowned","minecraft:skeleton","minecraft:stray",
  "minecraft:wither_skeleton","minecraft:bogged","minecraft:creeper","minecraft:spider",
  "minecraft:cave_spider","minecraft:enderman","minecraft:witch","minecraft:slime",
  "minecraft:magma_cube","minecraft:blaze","minecraft:ghast","minecraft:guardian",
  "minecraft:shulker","minecraft:phantom","minecraft:pillager","minecraft:vindicator",
  "minecraft:evocation_illager","minecraft:ravager","minecraft:breeze","minecraft:warden"
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

system.beforeEvents.startup.subscribe((initEvent) => {
  const registry = initEvent.blockComponentRegistry;

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
        if (entity.id !== event.player.id) {
          try { entity.addEffect("slowness", 120, { amplifier: 1 }); } catch {}
        }
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
});
