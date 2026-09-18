import * as mc from "@minecraft/server";

const EVENT_STATE_KEY = "lb:mythic_event_states_v1";
const EVENT_COUNTER_KEY = "lb:mythic_event_counter_v1";
const MAX_ACTIVE_EVENTS = 4;
const TICK_STEP = 10;
const EVENT_RADIUS = 96;

const RAIN_DROPS = [
  { weight: 28, id: "lb:epic_fragment", min: 1, max: 3 },
  { weight: 22, id: "lb:legendary_fragment", min: 1, max: 2 },
  { weight: 10, id: "lb:mythic_fragment", min: 1, max: 1 },
  { weight: 9, id: "lb:reward_chainsaw", min: 1, max: 1 },
  { weight: 8, id: "lb:reward_golden_hammer", min: 1, max: 1 },
  { weight: 7, id: "lb:reward_cardboard_shield", min: 1, max: 1 },
  { weight: 7, id: "lb:epic_lucky_block", min: 1, max: 1 },
  { weight: 5, id: "lb:slasher_blade", min: 1, max: 1 },
  { weight: 4, id: "lb:rare_lucky_block", min: 2, max: 2 }
];

function dimKey(id) {
  if (id.includes("nether")) return "nether";
  if (id.includes("end")) return "the_end";
  return "overworld";
}

function loadStates() {
  const raw = mc.world.getDynamicProperty(EVENT_STATE_KEY);
  if (typeof raw !== "string" || !raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStates(states) {
  mc.world.setDynamicProperty(EVENT_STATE_KEY, JSON.stringify(states));
}

function nextEventId() {
  const current = Number(mc.world.getDynamicProperty(EVENT_COUNTER_KEY) ?? 0);
  const next = Number.isFinite(current) ? current + 1 : 1;
  mc.world.setDynamicProperty(EVENT_COUNTER_KEY, next);
  return next;
}

function tagFor(id) {
  return "lb_mythic_event_" + id;
}

function distSq(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function playersNear(dimension, center, radius = EVENT_RADIUS) {
  const r2 = radius * radius;
  return mc.world.getAllPlayers().filter(
    p => p.dimension.id === dimension.id && distSq(p.location, center) <= r2
  );
}

function messageNear(dimension, center, text) {
  for (const player of playersNear(dimension, center)) {
    try { player.sendMessage(text); } catch {}
  }
}

function particle(dimension, id, location) {
  try { dimension.spawnParticle(id, location); } catch {}
}

function sound(dimension, id, location, opts) {
  try { dimension.playSound(id, location, opts); } catch {}
}

function groundAt(dimension, x, startY, z) {
  const bx = Math.floor(x), bz = Math.floor(z);
  const top = Math.min(250, Math.floor(startY) + 10);
  const bottom = Math.max(-60, Math.floor(startY) - 18);
  for (let y = top; y >= bottom; y--) {
    const block = dimension.getBlock({ x: bx, y, z: bz });
    const above = dimension.getBlock({ x: bx, y: y + 1, z: bz });
    if (!block || !above) continue;
    if (block.typeId !== "minecraft:air" && above.typeId === "minecraft:air") {
      return { x: bx, y: y + 1, z: bz };
    }
  }
  return undefined;
}

function randomGround(dimension, center, minRadius = 5, maxRadius = 11) {
  for (let tries = 0; tries < 8; tries++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const pos = groundAt(
      dimension,
      center.x + Math.cos(angle) * radius,
      center.y,
      center.z + Math.sin(angle) * radius
    );
    if (pos) return { x: pos.x + 0.5, y: pos.y, z: pos.z + 0.5 };
  }
  return { x: center.x, y: center.y + 1, z: center.z };
}

function spawnEventMob(state, dimension, typeId, count) {
  const tag = tagFor(state.id);
  let spawned = 0;
  for (let i = 0; i < count; i++) {
    try {
      const entity = dimension.spawnEntity(typeId, randomGround(dimension, state.center));
      entity.addTag(tag);
      entity.setDynamicProperty("lb:mythic_event_id", state.id);
      spawned++;
    } catch {}
  }
  return spawned;
}

function eventEnemies(state, dimension) {
  const tag = tagFor(state.id);
  try {
    return dimension.getEntities({
      location: state.center,
      maxDistance: EVENT_RADIUS,
      excludeTypes: ["minecraft:item", "minecraft:xp_orb"]
    }).filter(entity => {
      try { return entity.hasTag(tag); } catch { return false; }
    });
  } catch {
    return [];
  }
}

function cleanupEnemies(state, dimension) {
  for (const entity of eventEnemies(state, dimension)) {
    try { entity.remove(); } catch {}
  }
}

function placeRiftRunes(state, dimension) {
  const positions = [];
  const radius = 8;
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI * 2 * i) / 4 + 0.25;
    const base = groundAt(
      dimension,
      state.center.x + Math.cos(a) * radius,
      state.center.y,
      state.center.z + Math.sin(a) * radius
    );
    if (!base) continue;
    const block = dimension.getBlock(base);
    if (!block || block.typeId !== "minecraft:air") continue;
    try {
      block.setPermutation(mc.BlockPermutation.resolve("lb:obsidilith_rune"));
      positions.push(base);
      particle(dimension, "lb:obsidilith_indicator", {
        x: base.x + 0.5, y: base.y + 1.1, z: base.z + 0.5
      });
    } catch {}
  }
  state.runes = positions;
}

function liveRunes(state, dimension) {
  let alive = 0;
  for (const pos of state.runes ?? []) {
    try {
      if (dimension.getBlock(pos)?.typeId === "lb:obsidilith_rune") alive++;
    } catch {}
  }
  return alive;
}

function clearRunes(state, dimension) {
  for (const pos of state.runes ?? []) {
    try {
      const block = dimension.getBlock(pos);
      if (block?.typeId === "lb:obsidilith_rune") {
        block.setPermutation(mc.BlockPermutation.resolve("minecraft:air"));
      }
    } catch {}
  }
  state.runes = [];
}

function spawnItem(dimension, center, id, count = 1, high = false) {
  const pos = high
    ? {
        x: center.x + (Math.random() - 0.5) * 18,
        y: center.y + 13 + Math.random() * 4,
        z: center.z + (Math.random() - 0.5) * 18
      }
    : { x: center.x, y: center.y + 1.0, z: center.z };
  try {
    dimension.spawnItem(new mc.ItemStack(id, count), pos);
    if (high) particle(dimension, "lb:tomemancy_flame_summoning", pos);
  } catch {}
}

function weightedRainDrop() {
  const total = RAIN_DROPS.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of RAIN_DROPS) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return RAIN_DROPS[RAIN_DROPS.length - 1];
}

function dropRainPulse(state, dimension) {
  state.pulse = (state.pulse ?? 0) + 1;
  const rolls = state.pulse % 4 === 0 ? 3 : 2;
  for (let i = 0; i < rolls; i++) {
    const entry = weightedRainDrop();
    const count = entry.min + Math.floor(Math.random() * (entry.max - entry.min + 1));
    spawnItem(dimension, state.center, entry.id, count, true);
  }

  if (state.pulse % 5 === 0) spawnEventMob(state, dimension, "lb:impaler", 1);
  if (state.pulse === 10 || state.pulse === 20) {
    spawnEventMob(state, dimension, "lb:warped_clam", 1);
  }

  sound(dimension, "random.orb", state.center, {
    volume: 0.9,
    pitch: 0.85 + Math.random() * 0.35
  });
}

function completeSiege(state, dimension) {
  clearRunes(state, dimension);
  spawnItem(dimension, state.center, "lb:legendary_lucky_block", 1);
  spawnItem(dimension, state.center, "lb:mythic_fragment", 6 + Math.floor(Math.random() * 4));
  spawnItem(dimension, state.center, "lb:slasher_blade", 1);
  particle(dimension, "lb:obsidilith_burst", {
    x: state.center.x, y: state.center.y + 1.5, z: state.center.z
  });
  sound(dimension, "lb.obsidilith.burst", state.center, { volume: 1.2, pitch: 1.15 });
  messageNear(dimension, state.center, "§d[신화 럭키] 균열 공성전 완료! 균열 핵이 무너졌습니다.");
}

function completeRain(state, dimension) {
  spawnItem(dimension, state.center, "lb:mythic_fragment", 4 + Math.floor(Math.random() * 4));
  spawnItem(dimension, state.center, "lb:epic_lucky_block", 2);
  particle(dimension, "lb:tomemancy_flame_summoning", {
    x: state.center.x, y: state.center.y + 1.5, z: state.center.z
  });
  messageNear(dimension, state.center, "§d[신화 럭키] 럭키 레인 종료! 마지막 보상이 떨어졌습니다.");
}

function tickSiege(state, dimension) {
  state.elapsed = (state.elapsed ?? 0) + TICK_STEP;
  if (state.elapsed > 24000) {
    clearRunes(state, dimension);
    cleanupEnemies(state, dimension);
    messageNear(dimension, state.center, "§8[신화 럭키] 균열 공성전이 소멸했습니다.");
    return true;
  }

  if ((state.stage ?? 0) === 0) {
    placeRiftRunes(state, dimension);
    spawnEventMob(state, dimension, "lb:impaler", 3);
    spawnEventMob(state, dimension, "lb:mantis", 2);
    state.stage = 1;
    messageNear(dimension, state.center, "§5[신화 럭키] 균열 공성전 1단계 — 임페일러 습격");
    return false;
  }

  if (eventEnemies(state, dimension).length > 0) return false;

  if (state.stage === 1) {
    spawnEventMob(state, dimension, "lb:impaler", 2);
    spawnEventMob(state, dimension, "lb:warped_clam", 2);
    spawnEventMob(state, dimension, "lb:mantis", 2);
    state.stage = 2;
    messageNear(dimension, state.center, "§5[신화 럭키] 2단계 — 뒤틀린 조개가 균열을 고정합니다.");
    return false;
  }

  if (state.stage === 2) {
    spawnEventMob(state, dimension, "lb:impaler", 3);
    spawnEventMob(state, dimension, "lb:warped_clam", 3);
    spawnEventMob(state, dimension, "lb:mantis", 3);
    state.stage = 3;
    messageNear(dimension, state.center, "§5[신화 럭키] 3단계 — 균열 방어대가 쏟아집니다.");
    return false;
  }

  if (state.stage === 3) {
    const runes = liveRunes(state, dimension);
    if (runes > 0) {
      state.reminder = (state.reminder ?? 0) + TICK_STEP;
      if (state.reminder >= 80) {
        state.reminder = 0;
        messageNear(
          dimension,
          state.center,
          "§d[신화 럭키] 최종 균열을 열려면 주변 옵시딜리스 룬 " + runes + "개를 파괴하세요."
        );
      }
      return false;
    }
    spawnEventMob(state, dimension, "lb:bogre", 1);
    spawnEventMob(state, dimension, "lb:impaler", 2);
    state.stage = 4;
    messageNear(dimension, state.center, "§c[신화 럭키] 최종 단계 — 보그르가 균열에서 등장했습니다!");
    sound(dimension, "lb.bogre.roar", state.center, { volume: 1.25, pitch: 0.9 });
    return false;
  }

  if (state.stage === 4) {
    completeSiege(state, dimension);
    return true;
  }
  return false;
}

function tickRain(state, dimension) {
  state.elapsed = (state.elapsed ?? 0) + TICK_STEP;

  if (state.elapsed > 24000) {
    cleanupEnemies(state, dimension);
    messageNear(dimension, state.center, "§8[신화 럭키] 럭키 레인이 소멸했습니다.");
    return true;
  }

  if ((state.stage ?? 0) === 0) {
    state.stage = 1;
    state.nextPulse = 0;
    state.pulse = 0;
    messageNear(dimension, state.center, "§e[신화 럭키] 럭키 레인 시작 — 하늘에서 보상이 쏟아집니다!");
  }

  if (state.stage === 1) {
    state.nextPulse = (state.nextPulse ?? 0) - TICK_STEP;
    if (state.nextPulse <= 0 && state.pulse < 20) {
      dropRainPulse(state, dimension);
      state.nextPulse = 20;
    }
    if (state.pulse >= 20) {
      state.stage = 2;
      messageNear(dimension, state.center, "§6[신화 럭키] 마지막 낙하 완료. 남은 균열 생물을 정리하세요.");
    }
    return false;
  }

  if (state.stage === 2) {
    if (eventEnemies(state, dimension).length > 0) return false;
    completeRain(state, dimension);
    return true;
  }

  return false;
}

export function startMythicEvent(dimension, center, type) {
  if (type !== "rift_siege" && type !== "lucky_rain") return false;
  if (mc.world.getDynamicProperty("lb:post_dragon_unlocked") !== true) return false;

  const states = loadStates();
  if (states.length >= MAX_ACTIVE_EVENTS) return false;

  const normalizedCenter = {
    x: Math.floor(center.x) + 0.5,
    y: Math.floor(center.y),
    z: Math.floor(center.z) + 0.5
  };
  const key = dimKey(dimension.id);

  for (const state of states) {
    if (state.dimension !== key) continue;
    if (distSq(state.center, normalizedCenter) < 64 * 64) return false;
  }

  const state = {
    id: nextEventId(),
    type,
    dimension: key,
    center: normalizedCenter,
    stage: 0,
    elapsed: 0,
    pulse: 0,
    runes: []
  };
  states.push(state);
  saveStates(states);
  return true;
}

mc.system.runInterval(() => {
  const states = loadStates();
  if (!states.length) return;

  let changed = false;
  const next = [];

  for (const state of states) {
    let dimension;
    try { dimension = mc.world.getDimension(state.dimension); }
    catch { changed = true; continue; }

    // Pause world events while no player is close. This prevents unattended
    // rain from dumping items and avoids advancing a siege with nobody present.
    if (playersNear(dimension, state.center, 80).length === 0) {
      next.push(state);
      continue;
    }

    let done = false;
    try {
      if (state.type === "rift_siege") done = tickSiege(state, dimension);
      else if (state.type === "lucky_rain") done = tickRain(state, dimension);
      else done = true;
    } catch {
      done = false;
    }

    changed = true;
    if (!done) next.push(state);
  }

  if (changed) saveStates(next);
}, TICK_STEP);
