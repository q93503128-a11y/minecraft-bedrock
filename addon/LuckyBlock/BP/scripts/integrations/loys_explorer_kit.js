import * as mc from "@minecraft/server";

const HAT = "lb:explorer_hat";
const PACK = "lb:explorer_pack";
const STEP = 20;
const LINK_RANGE_SQ = 12 * 12;

function equipped(player, slot) {
  try { return player.getComponent("equippable")?.getEquipmentSlot(slot)?.getItem(); }
  catch { return undefined; }
}
function fullKit(player) {
  return equipped(player, mc.EquipmentSlot.Head)?.typeId === HAT &&
         equipped(player, mc.EquipmentSlot.Chest)?.typeId === PACK;
}
function sameDimension(a,b) {
  try { return a.dimension.id === b.dimension.id; } catch { return false; }
}
function distSq(a,b) {
  const dx=a.location.x-b.location.x, dy=a.location.y-b.location.y, dz=a.location.z-b.location.z;
  return dx*dx+dy*dy+dz*dz;
}
function refresh(player, linked) {
  try {
    player.addEffect("minecraft:night_vision", 120, { amplifier: 0, showParticles: false });
    player.addEffect("minecraft:speed", 60, { amplifier: 0, showParticles: false });
    if (linked) player.addEffect("minecraft:haste", 60, { amplifier: 0, showParticles: false });
  } catch {}
}

mc.system.runInterval(() => {
  const wearers = mc.world.getAllPlayers().filter(fullKit);
  for (const player of wearers) {
    let linked = false;
    for (const other of wearers) {
      if (other.id === player.id || !sameDimension(player, other)) continue;
      if (distSq(player, other) <= LINK_RANGE_SQ) { linked = true; break; }
    }
    refresh(player, linked);
  }
}, STEP);
