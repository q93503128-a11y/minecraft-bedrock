import {
  CommandPermissionLevel,
  EntityDamageCause,
  ItemStack,
  system,
  world,
} from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";
import {
  addExperience,
  bladeItemId,
  CLASS_DATA,
  createProfile,
  rarityForRoll,
  xpToNextLevel,
} from "./core/progression.js";

const BOSS_ID = "gtrpg:ashen_scorpion_queen";
const SEAL_ID = "gtrpg:rift_seal";
const FRAGMENT_ID = "gtrpg:ember_fragment";
const PROFILE_PROPERTY = "gtrpg:profile";
const WORLD_STATE_PROPERTY = "gtrpg:encounter_state";
const REWARD_ID_PROPERTY = "gtrpg:reward_id";
const SKILL_COOLDOWN_TICKS = 400;
const MAX_ACTIVE_BOSSES_NEARBY = 2;
const HOSTILE_XP = Object.freeze({
  "minecraft:zombie": 16,
  "minecraft:husk": 18,
  "minecraft:drowned": 18,
  "minecraft:skeleton": 18,
  "minecraft:stray": 20,
  "minecraft:spider": 14,
  "minecraft:cave_spider": 18,
  "minecraft:creeper": 22,
  "minecraft:enderman": 30,
  "minecraft:witch": 28,
  "minecraft:pillager": 22,
  "minecraft:vindicator": 30,
  "minecraft:phantom": 24,
  "minecraft:blaze": 26,
  "minecraft:ghast": 34,
  "minecraft:slime": 10,
  "minecraft:magma_cube": 14,
  "minecraft:guardian": 30,
  "minecraft:elder_guardian": 70,
  "minecraft:warden": 120,
});

const openForms = new Set();
const activeBosses = new Map();

function readProfile(player) {
  const raw = player.getDynamicProperty(PROFILE_PROPERTY);
  if (typeof raw !== "string") return { profile: createProfile(), isNew: true };
  try {
    const loaded = JSON.parse(raw);
    if (loaded?.schema !== 1 || !Number.isInteger(loaded.level) || !Array.isArray(loaded.pendingRewards)) {
      return { profile: createProfile(), isNew: true };
    }
    return {
      profile: {
        ...createProfile(),
        ...loaded,
        level: Math.max(1, Math.min(50, loaded.level)),
        xp: Math.max(0, Number(loaded.xp) || 0),
        pendingRewards: loaded.pendingRewards.filter((reward) => reward && typeof reward.id === "string" && typeof reward.itemId === "string"),
        processedEvents: Array.isArray(loaded.processedEvents) ? loaded.processedEvents : [],
      },
      isNew: false,
    };
  } catch {
    return { profile: createProfile(), isNew: true };
  }
}

function saveProfile(player, profile) {
  player.setDynamicProperty(PROFILE_PROPERTY, JSON.stringify(profile));
}

function readEncounterState() {
  const raw = world.getDynamicProperty(WORLD_STATE_PROPERTY);
  if (typeof raw !== "string") return { contributors: {}, pending: [], resolved: [] };
  try {
    const state = JSON.parse(raw);
    return {
      contributors: state && typeof state.contributors === "object" ? state.contributors : {},
      pending: Array.isArray(state?.pending) ? state.pending : [],
      resolved: Array.isArray(state?.resolved) ? state.resolved : [],
    };
  } catch {
    return { contributors: {}, pending: [], resolved: [] };
  }
}

function saveEncounterState(state) {
  world.setDynamicProperty(WORLD_STATE_PROPERTY, JSON.stringify(state));
}

function grantExperience(player, amount) {
  const { profile } = readProfile(player);
  const gained = addExperience(profile, amount);
  saveProfile(player, profile);
  if (gained > 0) {
    player.sendMessage(`§6모험 레벨 ${profile.level} 달성!`);
    player.playSound("random.levelup", { volume: 0.8, pitch: 1.0 });
    applyLevelPassive(player, profile.level);
  }
}

function applyLevelPassive(player, level) {
  if (level >= 5) {
    const amplifier = Math.min(4, Math.floor((level - 1) / 5));
    try {
      player.addEffect("health_boost", 24000, { amplifier, showParticles: false });
    } catch {
      // The next spawn reapplies the passive if the player is in a restricted state.
    }
  }
}

function mergePendingBossRewards(player) {
  const state = readEncounterState();
  const { profile } = readProfile(player);
  const queued = state.pending.filter((entry) => entry.playerId === player.id);
  if (queued.length === 0) {
    deliverPendingRewards(player, profile);
    return;
  }

  for (const entry of queued) {
    if (!profile.processedEvents.includes(entry.eventId)) {
      const levelsGained = addExperience(profile, entry.xp);
      for (const reward of entry.rewards) {
        if (!profile.pendingRewards.some((existing) => existing.id === reward.id)) {
          profile.pendingRewards.push(reward);
        }
      }
      profile.processedEvents.push(entry.eventId);
      if (levelsGained > 0) {
        player.sendMessage(`§6모험 레벨 ${profile.level} 달성!`);
        applyLevelPassive(player, profile.level);
      }
    }
  }

  state.pending = state.pending.filter((entry) => entry.playerId !== player.id);
  saveProfile(player, profile);
  saveEncounterState(state);
  deliverPendingRewards(player, profile);
}

function inventoryFor(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function deliverPendingRewards(player, profile = readProfile(player).profile) {
  const container = inventoryFor(player);
  if (!container || profile.pendingRewards.length === 0) return;
  let changed = false;
  while (profile.pendingRewards.length > 0) {
    const reward = profile.pendingRewards[0];
    let alreadyDelivered = false;
    for (let slot = 0; slot < container.size; slot += 1) {
      const stack = container.getItem(slot);
      if (!stack || stack.typeId !== reward.itemId) continue;
      if (stack.getDynamicProperty(REWARD_ID_PROPERTY) === reward.id) {
        alreadyDelivered = true;
        break;
      }
    }
    if (alreadyDelivered) {
      profile.pendingRewards.shift();
      changed = true;
      continue;
    }

    const stack = new ItemStack(reward.itemId, 1);
    stack.setDynamicProperty(REWARD_ID_PROPERTY, reward.id);
    const leftover = container.addItem(stack);
    if (leftover) break;
    profile.pendingRewards.shift();
    changed = true;
  }
  if (changed) saveProfile(player, profile);
  if (profile.pendingRewards.length > 0) {
    player.sendMessage("§e가방에 빈칸을 만든 뒤 길잡이에서 전리품을 받아 주세요.");
  }
}

function playerFromDamageSource(source) {
  const direct = source?.damagingEntity;
  if (direct?.typeId === "minecraft:player") return direct;
  const projectile = source?.damagingProjectile;
  if (projectile) {
    try {
      const owner = projectile.getComponent("minecraft:projectile")?.owner;
      if (owner?.typeId === "minecraft:player") return owner;
    } catch {
      // Projectiles without a live owner do not award personal credit.
    }
  }
  return undefined;
}

function recordBossContribution(boss, player) {
  const state = readEncounterState();
  const participants = Array.isArray(state.contributors[boss.id]) ? state.contributors[boss.id] : [];
  if (!participants.includes(player.id)) {
    participants.push(player.id);
    state.contributors[boss.id] = participants;
    saveEncounterState(state);
  }
}

function deterministicRewardId(eventId, playerId, label) {
  return `${eventId}:${playerId}:${label}`;
}

function processBossDeath(deadBoss) {
  const state = readEncounterState();
  const eventId = deadBoss.id;
  if (state.resolved.includes(eventId)) return;
  const participants = [...new Set(state.contributors[eventId] ?? [])];
  delete state.contributors[eventId];

  for (const playerId of participants) {
    const rarity = rarityForRoll(Math.random() * 100);
    state.pending.push({
      playerId,
      eventId,
      xp: 140,
      rewards: [
        { id: deterministicRewardId(eventId, playerId, "fragment"), itemId: FRAGMENT_ID },
        { id: deterministicRewardId(eventId, playerId, "blade"), itemId: bladeItemId(rarity) },
      ],
    });
  }
  state.resolved.push(eventId);
  if (state.resolved.length > 96) state.resolved.splice(0, state.resolved.length - 96);
  saveEncounterState(state);

  for (const player of world.getPlayers()) {
    if (participants.includes(player.id)) {
      mergePendingBossRewards(player);
      player.sendMessage("§6잿빛 전갈 여왕을 쓰러뜨렸습니다. 각자의 전리품을 확인하세요.");
      player.playSound("random.levelup", { volume: 1.0, pitch: 0.8 });
    }
  }
}

function nearestPlayer(boss, range) {
  const players = boss.dimension.getPlayers({ location: boss.location, maxDistance: range });
  let nearest;
  let nearestDistance = Infinity;
  for (const player of players) {
    const dx = player.location.x - boss.location.x;
    const dy = player.location.y - boss.location.y;
    const dz = player.location.z - boss.location.z;
    const distance = dx * dx + dy * dy + dz * dz;
    if (distance < nearestDistance) {
      nearest = player;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function bossPlayers(boss, range = 18) {
  return boss.dimension.getPlayers({ location: boss.location, maxDistance: range });
}

function notifyBossTelegraph(boss, pattern) {
  const message = pattern === "line"
    ? "§c⚠ 여왕이 꼬리를 겨눕니다. 붉은 선에서 벗어나세요!"
    : "§c⚠ 여왕이 독침을 휘두릅니다. 넓게 물러나세요!";
  for (const player of bossPlayers(boss, 20)) player.sendMessage(message);
  try {
    boss.dimension.playSound("mob.spider.say", boss.location, { volume: 0.85, pitch: 0.65 });
    boss.playAnimation("animation.gtrpg.ashen_scorpion_queen.attack");
  } catch {
    // The vanilla AI attack remains available if an animation cannot be played.
  }
}

function warningParticles(boss, state) {
  const origin = { x: boss.location.x, y: boss.location.y + 0.18, z: boss.location.z };
  if (state.pattern === "line") {
    for (let step = 1; step <= 8; step += 1) {
      boss.dimension.spawnParticle("minecraft:basic_flame_particle", {
        x: origin.x + state.direction.x * step,
        y: origin.y + 0.1,
        z: origin.z + state.direction.z * step,
      });
    }
    return;
  }
  for (let index = 0; index < 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12;
    boss.dimension.spawnParticle("minecraft:basic_flame_particle", {
      x: origin.x + Math.cos(angle) * 3.4,
      y: origin.y + 0.1,
      z: origin.z + Math.sin(angle) * 3.4,
    });
  }
}

function hitBossPattern(boss, state) {
  const players = bossPlayers(boss, 12);
  for (const player of players) {
    const dx = player.location.x - boss.location.x;
    const dy = player.location.y - boss.location.y;
    const dz = player.location.z - boss.location.z;
    let hit = false;
    if (state.pattern === "line") {
      const along = dx * state.direction.x + dz * state.direction.z;
      const side = Math.abs(dx * state.direction.z - dz * state.direction.x);
      hit = along >= 0.4 && along <= 8 && side <= 1.15 && Math.abs(dy) <= 2.8;
    } else {
      hit = dx * dx + dz * dz <= 3.4 * 3.4 && Math.abs(dy) <= 2.8;
    }
    if (!hit) continue;

    try {
      const phaseTwo = state.phaseTwo;
      player.applyDamage(phaseTwo ? 12 : 10, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: boss,
      });
      player.addEffect("poison", state.pattern === "line" ? 70 : 45, { amplifier: 0, showParticles: true });
      boss.dimension.spawnParticle("minecraft:basic_flame_particle", {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z,
      });
    } catch {
      // Players who leave during an attack are skipped safely.
    }
  }
}

function trackBoss(entity) {
  if (entity?.typeId !== BOSS_ID || !entity.isValid) return;
  if (!activeBosses.has(entity.id)) {
    activeBosses.set(entity.id, {
      entity,
      stage: "idle",
      nextAttackAt: system.currentTick + 80,
      strikeAt: 0,
      nextWarningAt: 0,
      patternIndex: Number(entity.getDynamicProperty("gtrpg:pattern_index") ?? 0),
      phaseTwo: false,
      pattern: "line",
      direction: { x: 0, z: 1 },
    });
  }
}

function beginBossAttack(boss, state, tick) {
  const health = boss.getComponent("minecraft:health")?.currentValue ?? 280;
  if (!state.phaseTwo && health <= 140) {
    state.phaseTwo = true;
    for (const player of bossPlayers(boss, 24)) player.sendMessage("§4잿빛 여왕이 격노합니다!");
    try {
      boss.dimension.playSound("mob.spider.say", boss.location, { volume: 1.0, pitch: 0.45 });
    } catch {
      // Sound is cosmetic.
    }
  }

  state.patternIndex += 1;
  state.pattern = state.patternIndex % 2 === 1 ? "line" : "sweep";
  boss.setDynamicProperty("gtrpg:pattern_index", state.patternIndex);
  const facing = boss.getViewDirection();
  const horizontalLength = Math.hypot(facing.x, facing.z) || 1;
  state.direction = { x: facing.x / horizontalLength, z: facing.z / horizontalLength };
  state.stage = "windup";
  state.strikeAt = tick + 20;
  state.nextWarningAt = tick;
  notifyBossTelegraph(boss, state.pattern);
}

system.runInterval(() => {
  const tick = system.currentTick;
  for (const [id, state] of activeBosses) {
    const boss = state.entity;
    if (!boss?.isValid) {
      activeBosses.delete(id);
      continue;
    }

    if (state.stage === "idle") {
      if (tick >= state.nextAttackAt) beginBossAttack(boss, state, tick);
      continue;
    }

    if (tick >= state.strikeAt) {
      hitBossPattern(boss, state);
      state.stage = "idle";
      state.nextAttackAt = tick + (state.phaseTwo ? 100 : 125);
      continue;
    }
    if (tick >= state.nextWarningAt) {
      warningParticles(boss, state);
      state.nextWarningAt = tick + 5;
    }
  }
}, 5);

function scanExistingBosses() {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const boss of dimension.getEntities({ type: BOSS_ID })) trackBoss(boss);
    } catch {
      // Unavailable dimensions are checked again when a boss is spawned or loaded.
    }
  }
}

world.afterEvents.entitySpawn.subscribe(({ entity }) => trackBoss(entity));
world.afterEvents.entityLoad.subscribe(({ entity }) => trackBoss(entity));

world.afterEvents.entityHurt.subscribe((event) => {
  if (event.hurtEntity.typeId !== BOSS_ID) return;
  const player = playerFromDamageSource(event.damageSource);
  if (player) recordBossContribution(event.hurtEntity, player);
});

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead.typeId === BOSS_ID) {
    processBossDeath(dead);
    activeBosses.delete(dead.id);
    return;
  }

  const amount = HOSTILE_XP[dead.typeId];
  if (!amount) return;
  const killer = playerFromDamageSource(event.damageSource);
  if (killer) grantExperience(killer, amount);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  const { profile, isNew } = readProfile(player);
  if (isNew) {
    profile.pendingRewards.push({ id: `starter-seal:${player.id}`, itemId: SEAL_ID });
    saveProfile(player, profile);
  }
  mergePendingBossRewards(player);
  applyLevelPassive(player, profile.level);
  if (isNew) {
    player.sendMessage("§6GT RPG에 오신 것을 환영합니다.");
    player.sendMessage("§e/gtrpg:menu에서 직업을 고르고, 몬스터를 사냥해 모험 레벨을 올리세요.");
    player.sendMessage("§e길잡이의 보스 도전 메뉴에서 균열 봉인을 사용하면 협동 보스가 나타납니다.");
  }
});

function showForm(player, form, onSelection) {
  if (openForms.has(player.id)) return;
  openForms.add(player.id);
  form.show(player).then((response) => {
    openForms.delete(player.id);
    if (!response.canceled && typeof response.selection === "number") onSelection(response.selection);
  }).catch(() => {
    openForms.delete(player.id);
  });
}

function classLabel(classId) {
  return CLASS_DATA[classId]?.name ?? "미선택";
}

function openStatus(player) {
  const { profile } = readProfile(player);
  const needed = xpToNextLevel(profile.level);
  const health = player.getComponent("minecraft:health");
  const healthText = health ? `${Math.ceil(health.currentValue)} / ${Math.ceil(health.effectiveMax)}` : "확인할 수 없음";
  const body = `직업  ${classLabel(profile.classId)}\n모험 레벨  ${profile.level}\n경험치  ${profile.xp} / ${needed}\n체력  ${healthText}\n받지 않은 전리품  ${profile.pendingRewards.length}개\n\n목표  몬스터를 사냥해 성장하고, 동료와 잿빛 전갈 여왕에 도전하세요.`;
  showForm(player, new ActionFormData().title("모험가 기록").body(body).button("돌아가기"), () => openMenu(player));
}

function chooseClass(player) {
  const { profile } = readProfile(player);
  if (profile.classId) {
    player.sendMessage(`§e현재 직업은 ${classLabel(profile.classId)}입니다. 직업은 모험가의 첫 선택으로 유지됩니다.`);
    return;
  }
  const form = new ActionFormData()
    .title("직업 선택")
    .body("세 직업은 서로 다른 협동 전투 기술을 사용합니다. 선택은 이 월드에서 유지됩니다.")
    .button("수호자\n주변 동료를 보호합니다")
    .button("추적자\n정면의 적을 꿰뚫습니다")
    .button("원소술사\n적 무리에 잿불을 터뜨립니다");
  showForm(player, form, (selection) => {
    const classIds = ["guardian", "hunter", "arcanist"];
    const classId = classIds[selection];
    if (!classId) return;
    const current = readProfile(player).profile;
    if (current.classId) return;
    current.classId = classId;
    saveProfile(player, current);
    player.sendMessage(`§a${classLabel(classId)}의 길을 선택했습니다. 스킬은 /gtrpg:skill로 사용할 수 있습니다.`);
  });
}

function hostileCandidates(player, range) {
  try {
    return player.dimension.getEntities({ location: player.location, maxDistance: range })
      .filter((entity) => entity.isValid && (entity.typeId === BOSS_ID || Object.hasOwn(HOSTILE_XP, entity.typeId)));
  } catch {
    return [];
  }
}

function findAimedHostile(player, range) {
  const view = player.getViewDirection();
  const origin = player.getHeadLocation();
  let best;
  let bestDot = 0.93;
  for (const entity of hostileCandidates(player, range)) {
    const target = { x: entity.location.x, y: entity.location.y + 0.85, z: entity.location.z };
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const dz = target.z - origin.z;
    const distance = Math.hypot(dx, dy, dz);
    if (distance <= 0 || distance > range) continue;
    const dot = (dx * view.x + dy * view.y + dz * view.z) / distance;
    if (dot > bestDot) {
      best = entity;
      bestDot = dot;
    }
  }
  return best;
}

function useSkill(player) {
  const { profile } = readProfile(player);
  const classData = CLASS_DATA[profile.classId];
  if (!classData) {
    player.sendMessage("§e먼저 /gtrpg:menu에서 직업을 선택하세요.");
    return;
  }
  const now = world.getAbsoluteTime();
  if (now < profile.nextSkillAt) {
    const seconds = Math.ceil((profile.nextSkillAt - now) / 20);
    player.sendMessage(`§e${classData.skill} 재사용 대기시간 ${seconds}초`);
    return;
  }

  if (profile.classId === "guardian") {
    const nearby = player.dimension.getPlayers({ location: player.location, maxDistance: 6 });
    for (const ally of nearby) {
      ally.addEffect("resistance", 100, { amplifier: 0, showParticles: true });
      ally.addEffect("regeneration", 60, { amplifier: 0, showParticles: false });
    }
    player.sendMessage("§b수호의 외침! 가까운 동료가 잠시 굳건해집니다.");
  } else {
    const target = findAimedHostile(player, 14);
    if (!target) {
      player.sendMessage("§e시야에 적이 없습니다. 적을 바라보고 다시 사용하세요.");
      return;
    }
    const levelBonus = Math.floor((profile.level - 1) / 5);
    if (profile.classId === "hunter") {
      target.applyDamage(9 + levelBonus, { cause: EntityDamageCause.magic, damagingEntity: player });
      target.addEffect("slowness", 50, { amplifier: 0, showParticles: true });
      player.sendMessage("§a약점 사격!");
    } else {
      for (const enemy of hostileCandidates(player, 14)) {
        const dx = enemy.location.x - target.location.x;
        const dy = enemy.location.y - target.location.y;
        const dz = enemy.location.z - target.location.z;
        if (dx * dx + dy * dy + dz * dz > 4.2 * 4.2) continue;
        enemy.applyDamage(7 + levelBonus, { cause: EntityDamageCause.magic, damagingEntity: player });
        enemy.addEffect("slowness", 35, { amplifier: 0, showParticles: true });
      }
      player.sendMessage("§d잿불 폭발!");
    }
  }

  profile.nextSkillAt = now + SKILL_COOLDOWN_TICKS;
  saveProfile(player, profile);
  try {
    player.playSound("random.fizz", { volume: 0.7, pitch: 1.25 });
  } catch {
    // The skill still works if a client sound is unavailable.
  }
}

function sealSlot(player) {
  const container = inventoryFor(player);
  if (!container) return undefined;
  for (let slot = 0; slot < container.size; slot += 1) {
    const stack = container.getItem(slot);
    if (stack?.typeId === SEAL_ID) return { container, slot, stack };
  }
  return undefined;
}

function consumeSeal(player) {
  const found = sealSlot(player);
  if (!found) return undefined;
  const original = found.stack.clone();
  if (found.stack.amount > 1) {
    found.stack.amount -= 1;
    found.container.setItem(found.slot, found.stack);
  } else {
    found.container.setItem(found.slot, undefined);
  }
  return { ...found, original };
}

function restoreSeal(consumed) {
  if (consumed) consumed.container.setItem(consumed.slot, consumed.original);
}

function findBossSpawnLocation(player) {
  const view = player.getViewDirection();
  const forwardLength = Math.hypot(view.x, view.z) || 1;
  const forward = { x: view.x / forwardLength, z: view.z / forwardLength };
  const side = { x: -forward.z, z: forward.x };
  const baseY = Math.floor(player.location.y);
  const offsets = [0, 1.5, -1.5, 3, -3, 4.5, -4.5];
  for (const sideOffset of offsets) {
    const x = Math.floor(player.location.x + forward.x * 6 + side.x * sideOffset);
    const z = Math.floor(player.location.z + forward.z * 6 + side.z * sideOffset);
    try {
      const floor = player.dimension.getBlock({ x, y: baseY - 1, z });
      const feet = player.dimension.getBlock({ x, y: baseY, z });
      const head = player.dimension.getBlock({ x, y: baseY + 1, z });
      if (!floor || !feet || !head) continue;
      if (["minecraft:air", "minecraft:water", "minecraft:lava"].includes(floor.typeId)) continue;
      if (feet.typeId !== "minecraft:air" || head.typeId !== "minecraft:air") continue;
      return { x: x + 0.5, y: baseY, z: z + 0.5 };
    } catch {
      // Try the next nearby ground position.
    }
  }
  return undefined;
}

function nearbyBossCount(player) {
  return player.dimension.getEntities({ type: BOSS_ID, location: player.location, maxDistance: 32 }).length;
}

function summonBoss(player) {
  const foundSeal = sealSlot(player);
  if (!foundSeal) {
    player.sendMessage("§e균열 봉인이 없습니다. 잿불 조각 4개, 철괴 4개, 엔더의 눈 1개로 봉인을 만들 수 있습니다.");
    return;
  }
  if (nearbyBossCount(player) >= MAX_ACTIVE_BOSSES_NEARBY) {
    player.sendMessage("§e이 근처에서 진행 중인 균열이 두 곳입니다. 전투가 끝난 뒤 다시 도전하세요.");
    return;
  }
  const spawnLocation = findBossSpawnLocation(player);
  if (!spawnLocation) {
    player.sendMessage("§e평평하고 트인 곳에서 균열 봉인을 사용하세요.");
    return;
  }

  const consumed = consumeSeal(player);
  if (!consumed) return;
  try {
    const boss = player.dimension.spawnEntity(BOSS_ID, spawnLocation);
    boss.nameTag = "잿빛 전갈 여왕";
    trackBoss(boss);
    for (const ally of player.dimension.getPlayers({ location: spawnLocation, maxDistance: 18 })) {
      ally.sendMessage("§6잿빛 전갈 여왕이 나타났습니다. 붉은 흔적을 보고 공격을 피하세요!");
    }
  } catch {
    restoreSeal(consumed);
    player.sendMessage("§e이 장소에는 균열을 열 수 없습니다. 봉인은 돌려드렸습니다.");
  }
}

function openBossChallenge(player) {
  if (!sealSlot(player)) {
    player.sendMessage("§e균열 봉인이 없습니다. 잿불 조각 4개, 철괴 4개, 엔더의 눈 1개로 제작할 수 있습니다.");
    return;
  }
  const form = new MessageFormData()
    .title("잿빛 균열")
    .body("균열 봉인 하나를 사용해 잿빛 전갈 여왕을 부릅니다.\n주변 동료도 전투에 참여할 수 있으며, 실제로 피해를 준 모험가마다 전리품을 받습니다.")
    .button1("균열 열기")
    .button2("돌아가기");
  showForm(player, form, (selection) => {
    if (selection === 0) summonBoss(player);
  });
}

function openMenu(player) {
  const { profile } = readProfile(player);
  const className = classLabel(profile.classId);
  const form = new ActionFormData()
    .title("GT RPG · 모험가 길잡이")
    .body(`모험 레벨 ${profile.level}  ·  ${className}\n몬스터를 사냥하고, 동료와 잿빛 균열에 도전하세요.`)
    .button("모험가 기록")
    .button(profile.classId ? `직업: ${className}` : "직업 선택")
    .button(profile.classId ? `스킬 · ${CLASS_DATA[profile.classId].skill}` : "스킬 · 직업 선택 필요")
    .button("보스 도전")
    .button(`전리품 받기 · ${profile.pendingRewards.length}개`)
    .button("처음 시작하기");
  showForm(player, form, (selection) => {
    if (selection === 0) openStatus(player);
    else if (selection === 1) chooseClass(player);
    else if (selection === 2) useSkill(player);
    else if (selection === 3) openBossChallenge(player);
    else if (selection === 4) {
      mergePendingBossRewards(player);
      player.sendMessage("§a받을 수 있는 전리품을 가방에 넣었습니다.");
    } else if (selection === 5) {
      player.sendMessage("§e1. 직업을 고르세요.  2. 몬스터를 사냥해 레벨을 올리세요.");
      player.sendMessage("§e3. 동료와 보스를 처치하고 잿불 조각과 대검을 받으세요.");
      player.sendMessage("§e길잡이: /gtrpg:menu  ·  직업 스킬: /gtrpg:skill");
    }
  });
}

function registerPlayerCommand(registry, name, description, callback) {
  registry.registerCommand({
    name,
    description,
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
  }, (origin) => {
    const player = origin.sourceEntity;
    if (player?.typeId !== "minecraft:player") return;
    callback(player);
  });
}

system.beforeEvents.startup.subscribe((event) => {
  registerPlayerCommand(event.customCommandRegistry, "gtrpg:menu", "GT RPG 모험가 길잡이", openMenu);
  registerPlayerCommand(event.customCommandRegistry, "gtrpg:skill", "선택한 직업의 전투 기술 사용", useSkill);
});

system.runTimeout(scanExistingBosses, 1);
