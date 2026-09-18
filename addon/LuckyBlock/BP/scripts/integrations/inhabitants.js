import { system, world } from "@minecraft/server";

const POST_DRAGON_KEY = "lb:post_dragon_unlocked";

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function nearestPlayer(entity, maxDistance) {
  const maxSq = maxDistance * maxDistance;
  let best;
  let bestSq = maxSq;
  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== entity.dimension.id) continue;
    const d = distanceSq(player.location, entity.location);
    if (d < bestSq) {
      bestSq = d;
      best = player;
    }
  }
  return best ? { player: best, distanceSq: bestSq } : undefined;
}

function shoveFrom(source, target, horizontal, vertical) {
  const dx = target.location.x - source.location.x;
  const dz = target.location.z - source.location.z;
  const len = Math.max(0.001, Math.sqrt(dx * dx + dz * dz));
  try {
    target.applyImpulse({ x: dx / len * horizontal, y: vertical, z: dz / len * horizontal });
  } catch {}
}

function runImpalerSpecials() {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    const dimension = world.getDimension(dimensionId);
    for (const impaler of dimension.getEntities({ type: "lb:impaler" })) {
      const target = nearestPlayer(impaler, 18);
      if (!target) continue;
      if (target.distanceSq <= 25 || target.distanceSq > 324) continue;

      try { impaler.dimension.playSound("lb.impaler.spike", impaler.location, { volume: 1.0, pitch: 0.95 + Math.random() * 0.1 }); } catch {}
      if (Math.random() < 0.22) { try { impaler.dimension.playSound("lb.impaler.scream", impaler.location, { volume: 1.0, pitch: 1.0 }); } catch {} }
      try { target.player.applyDamage(6); } catch {}
      shoveFrom(impaler, target.player, 0.55, 0.22);
    }
  }
}

function runClamPulse() {
  const end = world.getDimension("the_end");
  for (const clam of end.getEntities({ type: "lb:warped_clam" })) {
    const target = nearestPlayer(clam, 8);
    if (!target) continue;
    try { clam.dimension.playSound("lb.warped_clam.hit", clam.location, { volume: 1.1, pitch: 1.0 }); } catch {}
    try { target.player.applyDamage(10); } catch {}
    shoveFrom(clam, target.player, 1.15, 0.48);
  }
}

function findEndGround(dimension, x, startY, z) {
  const minY = Math.max(-60, Math.floor(startY) - 18);
  const maxY = Math.min(250, Math.floor(startY) + 8);
  for (let y = maxY; y >= minY; y--) {
    const ground = dimension.getBlock({ x, y, z });
    const above = dimension.getBlock({ x, y: y + 1, z });
    if (!ground || !above) continue;
    if (ground.typeId !== "minecraft:air" && above.typeId === "minecraft:air") return y + 1;
  }
  return undefined;
}

function trySpawnPostDragonClam() {
  if (world.getDynamicProperty(POST_DRAGON_KEY) !== true) return;
  const end = world.getDimension("the_end");

  for (const player of world.getAllPlayers()) {
    if (player.dimension.id !== end.id) continue;
    const nearby = end.getEntities({ type: "lb:warped_clam", location: player.location, maxDistance: 64 });
    if (nearby.length >= 2 || Math.random() >= 0.18) continue;

    const angle = Math.random() * Math.PI * 2;
    const radius = 14 + Math.random() * 14;
    const x = Math.floor(player.location.x + Math.cos(angle) * radius);
    const z = Math.floor(player.location.z + Math.sin(angle) * radius);
    const y = findEndGround(end, x, player.location.y, z);
    if (y === undefined) continue;

    try {
      const clam = end.spawnEntity("lb:warped_clam", { x: x + 0.5, y, z: z + 0.5 });
      end.playSound("lb.warped_clam.open", clam.location, { volume: 1.0, pitch: 1.0 });
    } catch {}
  }
}

system.runInterval(runImpalerSpecials, 80);
system.runInterval(runClamPulse, 100);
system.runInterval(trySpawnPostDragonClam, 600);
