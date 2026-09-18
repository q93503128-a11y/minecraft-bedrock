import { system, world } from "@minecraft/server";

let encounterTick = 0;

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function nearestPlayer(entity, maxDistance) {
  let best;
  let bestSq = maxDistance * maxDistance;
  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== entity.dimension.id) continue;
    const d = distanceSq(entity.location, player.location);
    if (d < bestSq) {
      bestSq = d;
      best = player;
    }
  }
  return best ? { player: best, distanceSq: bestSq } : undefined;
}

function phaseFor(entity) {
  const health = entity.getComponent("minecraft:health");
  if (!health) return 1;
  const ratio = health.currentValue / Math.max(1, health.effectiveMax);
  if (ratio <= 0.30) return 3;
  if (ratio <= 0.62) return 2;
  return 1;
}

function safeAnimation(entity, id) {
  try { entity.playAnimation(id, { blendOutTime: 0.15 }); } catch {}
}

function safeSound(entity, id, volume=1.0, pitch=1.0) {
  try { entity.dimension.playSound(id, entity.location, { volume, pitch }); } catch {}
}

function particleRing(entity, radius, particle) {
  for (let i=0;i<16;i++) {
    const a=(Math.PI*2*i)/16;
    const p={x:entity.location.x+Math.cos(a)*radius,y:entity.location.y+0.15,z:entity.location.z+Math.sin(a)*radius};
    try { entity.dimension.spawnParticle(particle,p); } catch {}
  }
}

function telegraphShockwave(bogre, target, phase) {
  bogre.setDynamicProperty("lb:bogre_busy_until", encounterTick + 18);
  safeAnimation(bogre, "animation.lb.bogre.roar");
  safeSound(bogre, "lb.bogre.roar", 1.2, 0.92 + Math.random()*0.1);
  particleRing(bogre, 2.2, "minecraft:basic_flame_particle");
  try { target.sendMessage("§6[Bogre] 지면 충격파! 점프로 피하세요."); } catch {}

  system.runTimeout(() => {
    if (!bogre.isValid) return;
    safeAnimation(bogre, "animation.lb.bogre.attack");
    safeSound(bogre, "lb.bogre.shockwave", 1.25, 0.9 + Math.random()*0.15);

    const radius = phase === 3 ? 10 : phase === 2 ? 8.5 : 7;
    particleRing(bogre, radius * 0.45, "minecraft:huge_explosion_emitter");
    particleRing(bogre, radius * 0.85, "minecraft:critical_hit_emitter");

    for (const player of world.getAllPlayers()) {
      if (player.dimension.id !== bogre.dimension.id) continue;
      const dx=player.location.x-bogre.location.x;
      const dz=player.location.z-bogre.location.z;
      const horizontal=Math.sqrt(dx*dx+dz*dz);
      if (horizontal > radius) continue;

      if (!player.isOnGround) continue;

      const damage = phase === 3 ? 38 : phase === 2 ? 30 : 22;
      try { player.applyDamage(damage); } catch {}
      const len=Math.max(0.001,horizontal);
      try { player.applyImpulse({x:dx/len*(0.7+phase*0.12),y:0.32+phase*0.06,z:dz/len*(0.7+phase*0.12)}); } catch {}
    }

    try { bogre.triggerEvent("lb:open_weak"); } catch {}
    bogre.setDynamicProperty("lb:bogre_weak_until", encounterTick + (phase === 3 ? 18 : 26));
    try {
      for (const player of world.getAllPlayers()) {
        if (player.dimension.id === bogre.dimension.id && distanceSq(player.location,bogre.location) < 400) {
          player.sendMessage("§e[Bogre] 충격파 후 빈틈! 잠시 받는 피해가 증가합니다.");
        }
      }
    } catch {}
  }, 14);
}

function roarPressure(bogre, phase) {
  safeAnimation(bogre, "animation.lb.bogre.roar");
  safeSound(bogre, "lb.bogre.roar", 1.1, phase===3?0.82:0.92);
  particleRing(bogre, 3.2, "minecraft:critical_hit_emitter");
  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== bogre.dimension.id) continue;
    if (distanceSq(player.location,bogre.location) > 144) continue;
    try { player.addEffect("slowness", phase===3?80:50, {amplifier:phase===3?1:0}); } catch {}
  }
}

function tickBogre(bogre) {
  const phase=phaseFor(bogre);
  const previous=Number(bogre.getDynamicProperty("lb:bogre_phase") ?? 0);
  if (phase !== previous) {
    bogre.setDynamicProperty("lb:bogre_phase", phase);
    roarPressure(bogre, phase);
    if (previous !== 0) {
      for (const player of world.getAllPlayers()) {
        if (player.dimension.id === bogre.dimension.id && distanceSq(player.location,bogre.location) < 900) {
          player.sendMessage(`§c[Bogre] 페이즈 ${phase} 진입!`);
        }
      }
    }
  }

  const weakUntil=Number(bogre.getDynamicProperty("lb:bogre_weak_until") ?? 0);
  if (weakUntil > 0 && encounterTick >= weakUntil) {
    try { bogre.triggerEvent("lb:close_weak"); } catch {}
    bogre.setDynamicProperty("lb:bogre_weak_until", 0);
  }

  const busy=Number(bogre.getDynamicProperty("lb:bogre_busy_until") ?? 0);
  if (encounterTick < busy) return;

  const next=Number(bogre.getDynamicProperty("lb:bogre_next_action") ?? 0);
  if (encounterTick < next) return;

  const target=nearestPlayer(bogre,26);
  if (!target) return;

  const baseCooldown=phase===3?46:phase===2?62:82;
  bogre.setDynamicProperty("lb:bogre_next_action", encounterTick + baseCooldown + Math.floor(Math.random()*25));

  if (target.distanceSq <= 196) telegraphShockwave(bogre,target.player,phase);
  else roarPressure(bogre,phase);
}

system.runInterval(() => {
  encounterTick += 5;
  for (const dimensionId of ["overworld","nether","the_end"]) {
    const dimension=world.getDimension(dimensionId);
    for (const bogre of dimension.getEntities({type:"lb:bogre"})) {
      try { tickBogre(bogre); } catch {}
    }
  }
},5);
