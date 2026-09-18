import * as mc from "@minecraft/server";

const WEAPON = "lb:storm_longbow";
const AMMO = "minecraft:arrow";
const MIN_DRAW = 5;
const FULL_DRAW = 30;
const MAX_DRAW = 40;
const starts = new Map();
let tick = 0;

mc.system.runInterval(() => { tick++; }, 1);

function actionbar(player, text) { try { player.onScreenDisplay.setActionBar(text); } catch {} }
function inventory(player) { try { return player.getComponent("minecraft:inventory")?.container; } catch { return undefined; } }
function held(player) {
  try { return player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand)?.getItem(); }
  catch { return undefined; }
}
function hasAmmo(player) {
  try { if (player.getGameMode() === mc.GameMode.Creative) return true; } catch {}
  const inv = inventory(player); if (!inv) return false;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === AMMO) return true;
  return false;
}
function consumeAmmo(player) {
  try { if (player.getGameMode() === mc.GameMode.Creative) return true; } catch {}
  const inv = inventory(player); if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i); if (item?.typeId !== AMMO) continue;
    if (item.amount <= 1) inv.setItem(i, undefined);
    else { item.amount -= 1; inv.setItem(i, item); }
    return true;
  }
  return false;
}
function damageWeapon(player) {
  try {
    const slot = player.getComponent("equippable")?.getEquipmentSlot(mc.EquipmentSlot.Mainhand);
    const item = slot?.getItem(); if (!slot || item?.typeId !== WEAPON) return;
    const d = item.getComponent("durability"); if (!d) return;
    d.damage = Math.min(d.maxDurability, d.damage + 1);
    if (d.damage >= d.maxDurability) {
      slot.setItem(undefined);
      player.playSound("random.break", { volume: 0.8, pitch: 1.0 });
    } else slot.setItem(item);
  } catch {}
}
function canDamage(source, entity) {
  if (!entity?.isValid || entity === source) return false;
  if (entity.typeId === "minecraft:item" || entity.typeId === "minecraft:xp_orb") return false;
  if (entity instanceof mc.Player) {
    if (!mc.world.gameRules.pvp) return false;
    try {
      const mode = entity.getGameMode();
      if (mode === mc.GameMode.Creative || mode === mc.GameMode.Spectator) return false;
    } catch {}
  }
  return true;
}
function blockDistance(player, origin, dir, range) {
  try {
    const hit = player.dimension.getBlockFromRay(origin, dir, {
      maxDistance: range,
      includePassableBlocks: false,
      includeLiquidBlocks: false
    });
    if (!hit) return range;
    const p = {
      x: hit.block.location.x + hit.faceLocation.x,
      y: hit.block.location.y + hit.faceLocation.y,
      z: hit.block.location.z + hit.faceLocation.z
    };
    const dx=p.x-origin.x,dy=p.y-origin.y,dz=p.z-origin.z;
    return Math.min(range, Math.sqrt(dx*dx+dy*dy+dz*dz));
  } catch { return range; }
}
function profile(draw) {
  if (draw < 12) return { damage:8, range:24, pierce:0, name:"Snap" };
  if (draw < 22) return { damage:14, range:36, pierce:0, name:"Draw" };
  if (draw < FULL_DRAW) return { damage:20, range:48, pierce:1, name:"Deep Draw" };
  return { damage:26, range:56, pierce:2, name:"Perfect Draw" };
}
function trail(dimension, origin, dir, distance, perfect) {
  const step = perfect ? 2.5 : 4;
  for (let d = 2; d < distance; d += step) {
    try {
      dimension.spawnParticle("lb:slasher_spark_particle", {
        x:origin.x+dir.x*d, y:origin.y+dir.y*d, z:origin.z+dir.z*d
      });
    } catch {}
  }
}
function shoot(player, draw) {
  if (!hasAmmo(player)) { actionbar(player, "§bStorm Longbow §8— §cNo arrows"); return; }
  if (!consumeAmmo(player)) return;
  const cfg = profile(draw);
  const origin = player.getHeadLocation();
  const dir = player.getViewDirection();
  const wall = blockDistance(player, origin, dir, cfg.range);
  let hits = [];
  try {
    hits = player.dimension.getEntitiesFromRay(origin, dir, {
      maxDistance: wall + 0.05,
      ignoreBlockCollision: false,
      includePassableBlocks: false,
      includeLiquidBlocks: false
    }).sort((a,b)=>a.distance-b.distance);
  } catch {}
  const targets = [];
  for (const hit of hits) {
    if (!canDamage(player, hit.entity)) continue;
    if (targets.some(e=>e.id===hit.entity.id)) continue;
    targets.push(hit.entity);
    if (targets.length >= cfg.pierce + 1) break;
  }
  const distance = hits.length ? Math.min(wall, hits[0]?.distance ?? wall) : wall;
  trail(player.dimension, origin, dir, Math.max(2,distance), draw >= FULL_DRAW);
  for (const target of targets) {
    try { target.applyDamage(cfg.damage, { cause: mc.EntityDamageCause.projectile, damagingEntity: player }); }
    catch { try { target.applyDamage(cfg.damage); } catch {} }
    try { player.dimension.spawnParticle("lb:obsidilith_burst", target.location); } catch {}
  }
  try {
    player.dimension.playSound(draw >= FULL_DRAW ? "slasher.critical" : "random.bow", player.location, {
      volume: draw >= FULL_DRAW ? 0.62 : 0.55,
      pitch: draw >= FULL_DRAW ? 1.08 : 0.92 + Math.min(draw,MAX_DRAW) / 100
    });
  } catch {}
  damageWeapon(player);
  actionbar(player, `§bStorm Longbow §8— §f${cfg.name} §7(${cfg.damage} dmg${cfg.pierce ? `, pierce ${cfg.pierce}` : ""})`);
}

mc.world.afterEvents.itemStartUse.subscribe(event => {
  if (event.itemStack.typeId !== WEAPON) return;
  const player = event.source;
  if (!(player instanceof mc.Player)) return;
  if (!hasAmmo(player)) {
    actionbar(player, "§bStorm Longbow §8— §cCarry arrows");
    return;
  }
  starts.set(player.id, tick);
});

mc.world.afterEvents.itemReleaseUse.subscribe(event => {
  const player = event.source;
  const start = starts.get(player.id);
  starts.delete(player.id);
  if (start === undefined) return;
  if (event.itemStack?.typeId !== WEAPON && held(player)?.typeId !== WEAPON) return;
  const draw = Math.min(MAX_DRAW, Math.max(0, tick - start));
  if (draw < MIN_DRAW) {
    actionbar(player, "§bStorm Longbow §8— §7Draw longer");
    return;
  }
  shoot(player, draw);
});

mc.world.afterEvents.itemStopUse.subscribe(event => {
  if (event.source instanceof mc.Player) starts.delete(event.source.id);
});
