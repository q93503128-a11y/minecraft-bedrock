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

function vaultSiteIsClear(dimension, center) {
  const bx = Math.floor(center.x), by = Math.floor(center.y), bz = Math.floor(center.z);
  try {
    const baseId = dimension.getBlock({ x: bx, y: by - 1, z: bz })?.typeId ?? "";
    if (baseId === "minecraft:water" || baseId === "minecraft:lava" || baseId.endsWith("_leaves")) return false;
  } catch {
    return false;
  }

  for (const dx of [-7, 0, 7]) {
    for (const dz of [-7, 0, 7]) {
      const ground = groundAt(dimension, bx + dx, by, bz + dz);
      if (!ground || Math.abs(ground.y - by) > 1) return false;
    }
  }

  for (let dx = -8; dx <= 8; dx += 2) {
    for (let dz = -8; dz <= 8; dz += 2) {
      for (let dy = 0; dy <= 5; dy++) {
        try {
          if (dimension.getBlock({ x: bx + dx, y: by + dy, z: bz + dz })?.typeId !== "minecraft:air") {
            return false;
          }
        } catch {
          return false;
        }
      }
    }
  }
  return true;
}

function findVaultSite(dimension, center) {
  const offsets = [
    [0, 0], [20, 0], [-20, 0], [0, 20], [0, -20],
    [20, 20], [20, -20], [-20, 20], [-20, -20],
    [28, 0], [-28, 0], [0, 28], [0, -28]
  ];
  for (const [dx, dz] of offsets) {
    const ground = groundAt(dimension, center.x + dx, center.y, center.z + dz);
    if (!ground) continue;
    const candidate = { x: ground.x + 0.5, y: ground.y, z: ground.z + 0.5 };
    if (vaultSiteIsClear(dimension, candidate)) return candidate;
  }
  return undefined;
}

function buildRiftVault(state, dimension) {
  const bx = Math.floor(state.center.x), by = Math.floor(state.center.y), bz = Math.floor(state.center.z);
  const p = {
    floorA: mc.BlockPermutation.resolve("minecraft:deepslate_tiles"),
    floorB: mc.BlockPermutation.resolve("minecraft:polished_blackstone_bricks"),
    wall: mc.BlockPermutation.resolve("minecraft:polished_blackstone_bricks"),
    obsidian: mc.BlockPermutation.resolve("minecraft:obsidian"),
    crying: mc.BlockPermutation.resolve("minecraft:crying_obsidian"),
    gilded: mc.BlockPermutation.resolve("minecraft:gilded_blackstone")
  };
  let placed = 0;

  function put(dx, dy, dz, permutation) {
    try {
      const block = dimension.getBlock({ x: bx + dx, y: by + dy, z: bz + dz });
      if (!block) return;
      block.setPermutation(permutation);
      placed++;
    } catch {}
  }

  // Seventeen-by-seventeen finished arena floor. The palette deliberately
  // uses final vanilla materials plus the already-vendored Obsidilith rune
  // objective; this is not a greybox/placeholder structure.
  for (let dx = -8; dx <= 8; dx++) {
    for (let dz = -8; dz <= 8; dz++) {
      let material = ((dx + dz) & 1) === 0 ? p.floorA : p.floorB;
      if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) material = p.obsidian;
      else if (dx === 0 || dz === 0) material = p.floorB;
      put(dx, -1, dz, material);
    }
  }

  // Perimeter walls with four real entrances and solid top lintels.
  for (let y = 0; y <= 4; y++) {
    for (let i = -8; i <= 8; i++) {
      const northGate = Math.abs(i) <= 1 && y < 4;
      if (!northGate) {
        put(i, y, -8, y === 4 ? p.obsidian : p.wall);
        put(i, y, 8, y === 4 ? p.obsidian : p.wall);
        put(-8, y, i, y === 4 ? p.obsidian : p.wall);
        put(8, y, i, y === 4 ? p.obsidian : p.wall);
      }
    }
  }

  // Corner towers and crying-obsidian ribs make the silhouette visibly
  // different from a plain square room.
  for (const [dx, dz] of [[-8,-8],[-8,8],[8,-8],[8,8]]) {
    for (let y = 0; y <= 6; y++) put(dx, y, dz, y % 2 === 0 ? p.crying : p.obsidian);
    put(dx > 0 ? dx - 1 : dx + 1, 5, dz, p.gilded);
    put(dx, 5, dz > 0 ? dz - 1 : dz + 1, p.gilded);
  }

  // Rune pedestals. Actual rune blocks appear only after both guard waves
  // are defeated, so the objective cannot be skipped early.
  for (const [dx, dz] of [[-5,-5],[-5,5],[5,-5],[5,5]]) {
    put(dx, 0, dz, p.gilded);
    put(dx - Math.sign(dx), 0, dz, p.obsidian);
    put(dx, 0, dz - Math.sign(dz), p.obsidian);
  }

  // Central boss dais and four ribs.
  for (const [dx, dz] of [[3,0],[-3,0],[0,3],[0,-3]]) {
    put(dx, 0, dz, p.crying);
    put(dx, 1, dz, p.obsidian);
  }

  state.structureBuilt = placed >= 450;
  return state.structureBuilt;
}

function placeVaultRunes(state, dimension) {
  const bx = Math.floor(state.center.x), by = Math.floor(state.center.y), bz = Math.floor(state.center.z);
  const positions = [[-5,-5],[-5,5],[5,-5],[5,5]].map(([dx,dz]) => ({
    x: bx + dx, y: by + 1, z: bz + dz
  }));
  state.runes = [];
  for (const pos of positions) {
    try {
      const block = dimension.getBlock(pos);
      if (!block || block.typeId !== "minecraft:air") continue;
      block.setPermutation(mc.BlockPermutation.resolve("lb:obsidilith_rune"));
      state.runes.push(pos);
      particle(dimension, "lb:obsidilith_indicator", { x: pos.x + 0.5, y: pos.y + 1.2, z: pos.z + 0.5 });
    } catch {}
  }
}

function spawnVaultWave(state, dimension, entries) {
  const offsets = [[-5,0],[5,0],[0,-5],[0,5],[-4,-4],[4,4],[-4,4],[4,-4],[0,0]];
  const tag = tagFor(state.id);
  let cursor = 0;
  for (const entry of entries) {
    for (let i = 0; i < entry.count; i++) {
      const [dx, dz] = offsets[cursor % offsets.length];
      cursor++;
      try {
        const entity = dimension.spawnEntity(entry.id, {
          x: state.center.x + dx,
          y: state.center.y + 0.2,
          z: state.center.z + dz
        });
        entity.addTag(tag);
        entity.setDynamicProperty("lb:mythic_event_id", state.id);
      } catch {}
    }
  }
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

function completeVault(state, dimension) {
  clearRunes(state, dimension);
  spawnItem(dimension, state.center, "lb:legendary_lucky_block", 2);
  spawnItem(dimension, state.center, "lb:mythic_fragment", 8 + Math.floor(Math.random() * 5));
  spawnItem(dimension, state.center, "lb:slasher_blade", 2);
  particle(dimension, "lb:obsidilith_burst", {
    x: state.center.x, y: state.center.y + 1.5, z: state.center.z
  });
  sound(dimension, "lb.obsidilith.burst", state.center, { volume: 1.35, pitch: 0.8 });
  messageNear(dimension, state.center, "§d[신화 럭키] 균열 금고 정복! 구조물은 전리품 거점으로 남습니다.");
}

function tickVault(state, dimension) {
  state.elapsed = (state.elapsed ?? 0) + TICK_STEP;
  if (state.elapsed > 30000) {
    clearRunes(state, dimension);
    cleanupEnemies(state, dimension);
    messageNear(dimension, state.center, "§8[신화 럭키] 균열 금고의 전투 균열이 닫혔습니다.");
    return true;
  }

  if ((state.stage ?? 0) === 0) {
    if (!buildRiftVault(state, dimension)) {
      spawnItem(dimension, state.center, "lb:mythic_fragment", 4);
      messageNear(dimension, state.center, "§8[신화 럭키] 균열 금고를 안정적으로 형성하지 못해 신화 조각 4개로 보상했습니다.");
      return true;
    }
    spawnVaultWave(state, dimension, [
      { id: "lb:impaler", count: 3 },
      { id: "lb:mantis", count: 2 }
    ]);
    state.stage = 1;
    messageNear(dimension, state.center, "§5[신화 럭키] 균열 금고 형성 — 외곽 수호대를 돌파하세요.");
    sound(dimension, "lb.obsidilith.prepare", state.center, { volume: 1.1, pitch: 0.85 });
    return false;
  }

  if (eventEnemies(state, dimension).length > 0) return false;

  if (state.stage === 1) {
    spawnVaultWave(state, dimension, [
      { id: "lb:tyrachnid", count: 1 },
      { id: "lb:warped_clam", count: 2 },
      { id: "lb:mantis", count: 2 }
    ]);
    state.stage = 2;
    messageNear(dimension, state.center, "§5[신화 럭키] 금고 심층 수호대 — 타이라크니드가 길을 막습니다.");
    return false;
  }

  if (state.stage === 2) {
    placeVaultRunes(state, dimension);
    state.stage = 3;
    messageNear(dimension, state.center, "§d[신화 럭키] 네 개의 옵시딜리스 룬을 파괴해 금고 핵을 개방하세요.");
    return false;
  }

  if (state.stage === 3) {
    const runes = liveRunes(state, dimension);
    if (runes > 0) {
      state.reminder = (state.reminder ?? 0) + TICK_STEP;
      if (state.reminder >= 100) {
        state.reminder = 0;
        messageNear(dimension, state.center, "§d[신화 럭키] 남은 금고 룬: " + runes + "개");
      }
      return false;
    }
    spawnVaultWave(state, dimension, [
      { id: "lb:obsidilith", count: 1 },
      { id: "lb:impaler", count: 2 }
    ]);
    state.stage = 4;
    messageNear(dimension, state.center, "§c[신화 럭키] 금고 핵 개방 — 옵시딜리스가 내려왔습니다!");
    sound(dimension, "lb.obsidilith.prepare", state.center, { volume: 1.3, pitch: 0.75 });
    return false;
  }

  if (state.stage === 4) {
    completeVault(state, dimension);
    return true;
  }
  return false;
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
    spawnEventMob(state, dimension, "lb:impaler", 2);
    spawnEventMob(state, dimension, "lb:warped_clam", 2);
    spawnEventMob(state, dimension, "lb:mantis", 2);
    spawnEventMob(state, dimension, "lb:tyrachnid", 1);
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
  if (type !== "rift_siege" && type !== "lucky_rain" && type !== "rift_vault") return false;
  if (mc.world.getDynamicProperty("lb:post_dragon_unlocked") !== true) return false;

  const states = loadStates();
  if (states.length >= MAX_ACTIVE_EVENTS) return false;

  let normalizedCenter = {
    x: Math.floor(center.x) + 0.5,
    y: Math.floor(center.y),
    z: Math.floor(center.z) + 0.5
  };
  if (type === "rift_vault") {
    const site = findVaultSite(dimension, normalizedCenter);
    if (!site) return false;
    normalizedCenter = site;
  }
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
      else if (state.type === "rift_vault") done = tickVault(state, dimension);
      else done = true;
    } catch {
      done = false;
    }

    changed = true;
    if (!done) next.push(state);
  }

  if (changed) saveStates(next);
}, TICK_STEP);
