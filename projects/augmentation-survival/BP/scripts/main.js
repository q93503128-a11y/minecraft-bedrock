import { ItemStack, Player, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { AUGMENTS } from "./augment-data.js";
import { applySturdinessEffect } from "./passives.js";
import { commitCoreSelection, LEVELS_KEY } from "./progression.js";

const NS = "augmentation_survival";
/** @typedef {{id:string, name_ko:string, tier:string, tier_ko:string, max_level:number, canonical_effect_ko:string}} Augment */
const COMMON_CORE = `${NS}:common_augment_core`;
const TIERS = ["common", "uncommon", "rare", "epic", "legendary", "mythic"];
/** @type {Record<string, string>} */
const TIER_KO = { common: "일반", uncommon: "고급", rare: "희귀", epic: "영웅", legendary: "전설", mythic: "신화" };
const CORE_FOR_TIER = Object.fromEntries(TIERS.map(tier => [tier, `${NS}:${tier}_augment_core`]));
const CORE_TIER = Object.fromEntries(TIERS.map(tier => [CORE_FOR_TIER[tier], tier]));
const OPEN_FORMS = new Set();
const PENDING_OFFERS = new Map();
const SYNTHESIS = TIERS.slice(0, -1).map((tier, index) => ({ from: tier, to: TIERS[index + 1] }));
/** @type {Augment[]} */
const AUGMENT_LIST = AUGMENTS;
/** @type {Map<string, Augment>} */
const AUGMENT_BY_ID = new Map(AUGMENT_LIST.map(augment => [augment.id, augment]));

/** @param {Player} player */
function playerLevels(player) {
  try {
    const raw = player.getDynamicProperty(LEVELS_KEY);
    if (typeof raw !== "string") return {};
    const value = JSON.parse(raw);
    if (value && typeof value === "object" && !Array.isArray(value)) return value;
  } catch { /* Corrupt state is ignored rather than crashing player join. */ }
  return {};
}

/** @param {Player} player @param {Augment} augment */
function levelOf(player, augment) {
  const levels = playerLevels(player);
  const level = Number(levels[augment.id]);
  return Number.isInteger(level) && level > 0 ? Math.min(level, augment.max_level) : 0;
}

/** @param {Player} player */
function inventoryOf(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

/** @param {Player} player @param {string} typeId */
function countItem(player, typeId) {
  const inventory = inventoryOf(player);
  if (!inventory) return 0;
  let count = 0;
  for (let slot = 0; slot < inventory.size; slot++) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId === typeId) count += stack.amount;
  }
  return count;
}

/** @param {Player} player @param {string} typeId @param {number} quantity */
function removeItems(player, typeId, quantity) {
  const inventory = inventoryOf(player);
  if (!inventory || countItem(player, typeId) < quantity) return false;
  let remaining = quantity;
  for (let slot = 0; slot < inventory.size && remaining > 0; slot++) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId !== typeId) continue;
    const take = Math.min(stack.amount, remaining);
    if (take === stack.amount) inventory.setItem(slot, undefined);
    else {
      stack.amount -= take;
      inventory.setItem(slot, stack);
    }
    remaining -= take;
  }
  return remaining === 0;
}

/** @param {Player} player @param {string} typeId @param {number} [quantity] */
function giveItem(player, typeId, quantity = 1) {
  const inventory = inventoryOf(player);
  if (!inventory) return false;
  const remainder = inventory.addItem(new ItemStack(typeId, quantity));
  if (!remainder) return true;
  // The transaction is already committed only after an output slot is available.
  return false;
}

/** @param {string} tier @param {Player} player @returns {Augment[]} */
function availableOffers(tier, player) {
  const levels = playerLevels(player);
  const pool = AUGMENT_LIST.filter(augment => augment.tier === tier && (Number(levels[augment.id]) || 0) < augment.max_level);
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, 3);
}

/** @param {Player} player @param {string} coreId */
async function openOffer(player, coreId) {
  if (OPEN_FORMS.has(player.id)) return;
  const tier = CORE_TIER[coreId];
  if (!tier || countItem(player, coreId) < 1) return;
  const offers = availableOffers(tier, player);
  if (offers.length === 0) {
    player.sendMessage("이 등급의 증강은 모두 최대 레벨이에요. 코어를 그대로 돌려받습니다.");
    return;
  }
  if (offers.length < 3) {
    player.sendMessage(`선택 가능한 증강이 ${offers.length}개 남았어요.`);
  }
  PENDING_OFFERS.set(player.id, { coreId, offers });
  const form = new ActionFormData()
    .title(`${TIER_KO[tier]} 증강 코어`)
    .body(offers.map((augment, index) => {
      const nextLevel = levelOf(player, augment) + 1;
      return `${index + 1}. ${augment.name_ko} · Lv.${nextLevel}/${augment.max_level}\n${augment.canonical_effect_ko}`;
    }).join("\n\n"));
  for (const [index, augment] of offers.entries()) {
    form.button(`${index + 1}. ${augment.name_ko} · Lv.${levelOf(player, augment) + 1}/${augment.max_level}`);
  }

  OPEN_FORMS.add(player.id);
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection === undefined || response.selection >= offers.length) return;
    const pending = PENDING_OFFERS.get(player.id);
    if (!pending || pending.coreId !== coreId || pending.offers.length !== offers.length) return;
    const selected = pending.offers[response.selection];
    if (!selected || !AUGMENT_BY_ID.has(selected.id)) return;
    // Final validation and both mutations run in one server callback before any await.
    const result = commitCoreSelection(player, coreId, selected);
    if (!result.ok) {
      player.sendMessage(result.reason === "max_level"
        ? "이 증강은 이미 최대 레벨이에요. 코어를 소모하지 않았습니다."
        : "코어를 찾을 수 없어 선택을 완료하지 못했어요.");
      return;
    }
    const nextLevel = result.level;
    player.sendMessage(`${selected.name_ko} Lv.${nextLevel} 획득!`);
    if (selected.id === `${NS}:sturdiness`) applySturdiness(player);
  } catch {
    // A busy screen, player leaving, or form rejection leaves the core untouched.
  } finally {
    OPEN_FORMS.delete(player.id);
    PENDING_OFFERS.delete(player.id);
  }
}

/** @param {Player} player */
function ownedAugments(player) {
  const levels = playerLevels(player);
  return AUGMENT_LIST.filter(augment => Number(levels[augment.id]) > 0)
    .map(augment => ({ ...augment, level: Math.min(Number(levels[augment.id]), augment.max_level) }));
}

/** @param {Player} player @param {number} [page] */
async function showOwnedPage(player, page = 0) {
  const owned = ownedAugments(player);
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(owned.length / pageSize));
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const current = owned.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const form = new ActionFormData()
    .title(`보유 증강 ${owned.length}/149 · ${safePage + 1}/${pageCount}`)
    .body(current.length ? "증강을 선택하면 효과 설명을 볼 수 있어요." : "아직 보유한 증강이 없어요. 일반 코어를 사용해 첫 증강을 선택하세요.");
  for (const augment of current) form.button(`${augment.name_ko} · Lv.${augment.level}/${augment.max_level}`);
  if (safePage > 0) form.button("이전 페이지");
  if (safePage + 1 < pageCount) form.button("다음 페이지");
  form.button("닫기");
  const prev = safePage > 0;
  let nextPage = -1;
  let selectedAugment;
  OPEN_FORMS.add(player.id);
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection === undefined) return;
    if (response.selection < current.length) selectedAugment = current[response.selection];
    else if (prev && response.selection === current.length) nextPage = safePage - 1;
    else if (safePage + 1 < pageCount && response.selection === current.length + (prev ? 1 : 0)) nextPage = safePage + 1;
  } catch {
    // No state changes occur in this read-only screen.
  } finally {
    OPEN_FORMS.delete(player.id);
  }
  if (selectedAugment) await showAugmentDetail(player, selectedAugment, safePage);
  else if (nextPage >= 0) await showOwnedPage(player, nextPage);
}

/** @param {Player} player @param {Augment & {level:number}} augment @param {number} page */
async function showAugmentDetail(player, augment, page) {
  const form = new ActionFormData()
    .title(`${augment.name_ko} · Lv.${augment.level}/${augment.max_level}`)
    .body(`${TIER_KO[augment.tier]} 증강\n\n${augment.canonical_effect_ko}`)
    .button("보유 증강 목록으로");
  OPEN_FORMS.add(player.id);
  try {
    await form.show(player);
  } catch {
    // The read-only detail form does not mutate player state.
  } finally {
    OPEN_FORMS.delete(player.id);
  }
  await showOwnedPage(player, page);
}

/** @param {Player} player */
async function openBasicDevice(player) {
  if (OPEN_FORMS.has(player.id)) return;
  const form = new ActionFormData()
    .title("증강 장치")
    .body("등급 코어를 사용해 세 후보 중 하나를 선택하세요. 보유 효과는 이 장치에서 확인할 수 있어요.")
    .button(`보유 증강 확인 (${ownedAugments(player).length}/149)`)
    .button("닫기");
  let openInventory = false;
  OPEN_FORMS.add(player.id);
  try {
    const response = await form.show(player);
    openInventory = !response.canceled && response.selection === 0;
  } catch {
    // UI unavailable; no items or state are changed.
  } finally {
    OPEN_FORMS.delete(player.id);
  }
  if (openInventory) await showOwnedPage(player, 0);
}

/** @param {Player} player */
async function openSynthesis(player) {
  if (OPEN_FORMS.has(player.id)) return;
  const form = new ActionFormData()
    .title("증강 코어 합성")
    .body("같은 등급 코어 3개를 바로 위 등급 코어 1개로 합성합니다. 합성은 되돌릴 수 없어요.");
  for (const step of SYNTHESIS) {
    const sourceId = CORE_FOR_TIER[step.from];
    form.button(`${TIER_KO[step.from]} 3개 → ${TIER_KO[step.to]} 1개\n보유 ${countItem(player, sourceId)}`);
  }
  form.button("닫기");
  OPEN_FORMS.add(player.id);
  try {
    const response = await form.show(player);
    const step = response.selection === undefined ? undefined : SYNTHESIS[response.selection];
    if (response.canceled || !step) return;
    const fromId = CORE_FOR_TIER[step.from];
    const toId = CORE_FOR_TIER[step.to];
    if (countItem(player, fromId) < 3) {
      player.sendMessage("합성할 코어가 부족해요.");
      return;
    }
    // Output capacity is guaranteed by the three consumed inputs, but roll back on failure.
    if (!removeItems(player, fromId, 3)) return;
    let outputAdded = false;
    try {
      outputAdded = giveItem(player, toId, 1);
    } catch {
      outputAdded = false;
    }
    if (!outputAdded) {
      try { giveItem(player, fromId, 3); } catch { /* best-effort rollback while the player inventory is valid */ }
      player.sendMessage("인벤토리에 공간이 없어 합성을 취소했어요.");
      return;
    }
    player.sendMessage(`${TIER_KO[step.from]} 코어 3개를 ${TIER_KO[step.to]} 코어 1개로 합성했어요.`);
  } catch {
    // No inputs are consumed if the form does not return a selection.
  } finally {
    OPEN_FORMS.delete(player.id);
  }
}

/** @param {Player} player */
function applySturdiness(player) {
  const definition = AUGMENT_BY_ID.get(`${NS}:sturdiness`);
  const level = definition ? levelOf(player, definition) : 0;
  if (level > 0) applySturdinessEffect(player, level);
}

function applyImplementedPassives() {
  for (const player of world.getPlayers()) applySturdiness(player);
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (!(source instanceof Player)) return;
  const itemId = itemStack.typeId;
  if (CORE_TIER[itemId]) system.run(() => void openOffer(source, itemId));
  else if (itemId === `${NS}:augment_device`) system.run(() => void openBasicDevice(source));
  else if (itemId === `${NS}:advanced_augment_device`) system.run(() => void openSynthesis(source));
});

world.afterEvents.playerSpawn.subscribe(({ player }) => system.runTimeout(() => applySturdiness(player), 1));
system.runInterval(applyImplementedPassives, 200);
