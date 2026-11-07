import { EntityComponentTypes, ItemStack, Player, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { getStoredAugmentLevel } from "./progression.js";

export const POCKETS_ID = "augmentation_survival:pockets";
export const POCKET_STORAGE_TYPE = "augmentation_survival:pocket_storage";
const KEEP_INVENTORY_ID = "augmentation_survival:keep_inventory";
const STORAGE_ENTITY_KEY = "augmentation_survival:pocket_entity_id_v1";
const STORAGE_OWNER_KEY = "augmentation_survival:pocket_owner_v1";
const MAX_LEVEL = 3;
const POCKET_SLOTS = 9;
const ANCHOR_SEARCH_RADIUS = 32;

/** @type {Map<string, import("@minecraft/server").Entity>} */
const anchorsByPlayer = new Map();
/** @type {Set<string>} */
const anchorCreationWarnings = new Set();
/** @type {Map<string, {player:Player, item:import("@minecraft/server").Entity, typeId:string, amount:number}>} */
const pendingPickups = new Map();
/** @type {Set<string>} */
const openForms = new Set();

/** @param {Player} player */
export function pocketLevel(player) {
  try {
    if (!player.isValid) return 0;
    return getStoredAugmentLevel(player, POCKETS_ID, MAX_LEVEL);
  } catch {
    return 0;
  }
}

/** @param {Player} player */
export function unlockedPocketSlots(player) {
  return pocketLevel(player) * 3;
}

/** @param {import("@minecraft/server").Entity} entity @param {Player} player */
function isOwnedAnchor(entity, player) {
  try {
    return entity.isValid
      && entity.typeId === POCKET_STORAGE_TYPE
      && entity.getDynamicProperty(STORAGE_OWNER_KEY) === player.id;
  } catch {
    return false;
  }
}

/**
 * Resolve only an already existing anchor. This function is also called from
 * the restricted item-pickup before-event, so it must not create or mutate data.
 * @param {Player} player
 */
function findAnchor(player) {
  let playerId;
  try {
    if (!player.isValid) return undefined;
    playerId = player.id;
  } catch { return undefined; }

  const cached = anchorsByPlayer.get(playerId);
  if (cached && isOwnedAnchor(cached, player)) return cached;
  anchorsByPlayer.delete(playerId);

  let storedId;
  try { storedId = player.getDynamicProperty(STORAGE_ENTITY_KEY); } catch { return undefined; }
  if (typeof storedId === "string" && storedId.length > 0) {
    try {
      const stored = world.getEntity(storedId);
      if (stored && isOwnedAnchor(stored, player)) {
        anchorsByPlayer.set(playerId, stored);
        return stored;
      }
    } catch { /* An unloaded anchor may still be found around the saved player location. */ }
  }

  try {
    const nearby = player.dimension.getEntities({
      type: POCKET_STORAGE_TYPE,
      location: player.location,
      maxDistance: ANCHOR_SEARCH_RADIUS,
    });
    const anchor = nearby.find(entity => isOwnedAnchor(entity, player));
    if (anchor) {
      anchorsByPlayer.set(playerId, anchor);
      return anchor;
    }
  } catch { /* Chunk boundaries and concurrent dimension changes are transient. */ }
  return undefined;
}

/**
 * Create the persistent server-owned inventory anchor on first use. If a saved
 * entity ID exists but the entity is unavailable, fail closed instead of making
 * an empty replacement that could hide an unloaded pocket inventory.
 * @param {Player} player
 */
function ensureAnchor(player) {
  try {
    if (!player.isValid) return undefined;
  } catch { return undefined; }
  const existing = findAnchor(player);
  if (existing) {
    try {
      player.setDynamicProperty(STORAGE_ENTITY_KEY, existing.id);
    } catch { /* A nearby owner-tagged anchor remains usable this tick. */ }
    return existing;
  }
  let previousId;
  try { previousId = player.getDynamicProperty(STORAGE_ENTITY_KEY); } catch { return undefined; }
  if (typeof previousId === "string" && previousId.length > 0) return undefined;

  try {
    const anchor = player.dimension.spawnEntity(POCKET_STORAGE_TYPE, player.location);
    try {
      anchor.setDynamicProperty(STORAGE_OWNER_KEY, player.id);
      player.setDynamicProperty(STORAGE_ENTITY_KEY, anchor.id);
    } catch (error) {
      try { anchor.remove(); } catch { /* Do not leave an unowned duplicate anchor behind. */ }
      throw error;
    }
    anchorsByPlayer.set(player.id, anchor);
    anchorCreationWarnings.delete(player.id);
    return anchor;
  } catch (error) {
    if (!anchorCreationWarnings.has(player.id)) {
      console.warn(`[Augmentation Survival] Could not create Pockets storage anchor: ${String(error)}`);
      anchorCreationWarnings.add(player.id);
    }
    return undefined;
  }
}

/** @param {import("@minecraft/server").Entity} anchor */
function anchorInventory(anchor) {
  return anchor.getComponent(EntityComponentTypes.Inventory)?.container;
}

/** @param {import("@minecraft/server").Container} container */
function snapshotContainer(container) {
  return Array.from({ length: container.size }, (_, slot) => container.getItem(slot)?.clone());
}

/**
 * Read-only capacity estimate for restricted callbacks. It intentionally does
 * not clone or change ItemStack.amount, which BDS disallows in before-events.
 * @param {import("@minecraft/server").Container} container
 * @param {ItemStack} input
 * @param {number} amount
 * @param {number} slotLimit
 */
function insertionRemainderAmount(container, input, amount, slotLimit) {
  let remainder = Math.max(0, amount);
  const limit = Math.max(0, Math.min(slotLimit, container.size));
  for (let slot = 0; slot < limit && remainder > 0; slot += 1) {
    const existing = container.getItem(slot);
    if (!existing || !existing.isStackableWith(input)) continue;
    remainder -= Math.min(Math.max(0, existing.maxAmount - existing.amount), remainder);
  }
  for (let slot = 0; slot < limit && remainder > 0; slot += 1) {
    if (container.getItem(slot)) continue;
    remainder -= Math.min(input.maxAmount, remainder);
  }
  return remainder;
}

/**
 * Plan vanilla-like merge-first inventory insertion without mutating the live
 * container. The caller commits the resulting slot writes transactionally.
 * @param {Array<ItemStack|undefined>} initial
 * @param {ItemStack} input
 * @param {number} slotLimit
 */
function planInsertion(initial, input, slotLimit) {
  const slots = initial.map(stack => stack?.clone());
  /** @type {Set<number>} */
  const changed = new Set();
  /** @type {ItemStack|undefined} */
  let remainder = input.clone();
  const limit = Math.max(0, Math.min(slotLimit, slots.length));

  for (let slot = 0; slot < limit && remainder; slot += 1) {
    const existing = slots[slot];
    if (!existing || !existing.isStackableWith(remainder)) continue;
    const room = Math.max(0, existing.maxAmount - existing.amount);
    if (room <= 0) continue;
    const moved = Math.min(room, remainder.amount);
    existing.amount += moved;
    changed.add(slot);
    if (moved === remainder.amount) remainder = undefined;
    else remainder.amount -= moved;
  }

  for (let slot = 0; slot < limit && remainder; slot += 1) {
    if (slots[slot]) continue;
    const moved = Math.min(remainder.maxAmount, remainder.amount);
    const placed = remainder.clone();
    placed.amount = moved;
    slots[slot] = placed;
    changed.add(slot);
    if (moved === remainder.amount) remainder = undefined;
    else remainder.amount -= moved;
  }

  return { slots, changed, remainder };
}

/** @param {import("@minecraft/server").Container} container @param {ReturnType<typeof planInsertion>} plan */
function applyPlan(container, plan) {
  for (const slot of plan.changed) container.setItem(slot, plan.slots[slot]?.clone());
}

/** @param {import("@minecraft/server").Container} container @param {Array<ItemStack|undefined>} snapshot */
function restoreContainer(container, snapshot) {
  for (let slot = 0; slot < snapshot.length; slot += 1) container.setItem(slot, snapshot[slot]?.clone());
}

/**
 * Apply container slot plans as one server callback with rollback on API errors.
 * @param {Array<{container:import("@minecraft/server").Container, plan:ReturnType<typeof planInsertion>}>} entries
 */
function commitPlans(entries) {
  const snapshots = entries.map(entry => snapshotContainer(entry.container));
  try {
    for (const entry of entries) applyPlan(entry.container, entry.plan);
    return true;
  } catch {
    for (let index = 0; index < entries.length; index += 1) {
      try { restoreContainer(entries[index].container, snapshots[index]); } catch { /* Keep the original failure result. */ }
    }
    return false;
  }
}

/**
 * @param {Player} player
 * @param {number} slot
 * @returns {{ok:true,moved:number,remaining:number}|{ok:false,reason:"locked"|"unavailable"|"empty"|"inventory_full"|"transaction_failed"}}
 */
export function withdrawPocketSlot(player, slot) {
  const unlocked = unlockedPocketSlots(player);
  if (!Number.isInteger(slot) || slot < 0 || slot >= unlocked) return { ok: false, reason: "locked" };
  const anchor = findAnchor(player);
  const pocket = anchor ? anchorInventory(anchor) : undefined;
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (!pocket || !inventory) return { ok: false, reason: "unavailable" };

  try {
    const stored = pocket.getItem(slot);
    if (!stored) return { ok: false, reason: "empty" };
    const inventoryPlan = planInsertion(snapshotContainer(inventory), stored, inventory.size);
    const moved = stored.amount - (inventoryPlan.remainder?.amount ?? 0);
    if (moved <= 0) return { ok: false, reason: "inventory_full" };

    const pocketSnapshot = snapshotContainer(pocket);
    /** @type {ReturnType<typeof planInsertion>} */
    const pocketPlan = {
      slots: pocketSnapshot.map(item => item?.clone()),
      changed: new Set([slot]),
      remainder: undefined,
    };
    pocketPlan.slots[slot] = inventoryPlan.remainder?.clone();
    if (!commitPlans([
      { container: inventory, plan: inventoryPlan },
      { container: pocket, plan: pocketPlan },
    ])) return { ok: false, reason: "transaction_failed" };

    return { ok: true, moved, remaining: inventoryPlan.remainder?.amount ?? 0 };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Handle a pickup in two phases because stable before-events are read-only:
 * cancel the native attempt, then move the exact stack in the deferred write
 * phase. The anchor is owner-bound by dynamic property and the pending map
 * prevents two nearby players from transacting the same item twice.
 * @param {import("@minecraft/server").Entity} itemEntity
 */
function finishPendingPickup(itemEntity) {
  const pending = pendingPickups.get(itemEntity.id);
  if (!pending) return;
  try {
    const { player } = pending;
    if (!player.isValid || !itemEntity.isValid || player.id !== pending.player.id) return;
    const component = itemEntity.getComponent(EntityComponentTypes.Item);
    const current = component?.itemStack;
    // A restricted pickup callback can expose an item entity after vanilla has
    // already removed the portion accepted by its partial inventory insertion.
    // Trust the still-valid source entity's current amount and transfer exactly
    // its remainder instead of discarding the pending overflow.
    if (!current || current.typeId !== pending.typeId || current.amount <= 0) return;

    const anchor = findAnchor(player);
    const pocket = anchor ? anchorInventory(anchor) : undefined;
    const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!pocket || !inventory) return;

    const inventoryBefore = snapshotContainer(inventory);
    const pocketBefore = snapshotContainer(pocket);
    const inventoryPlan = planInsertion(inventoryBefore, current, inventory.size);
    // When the player inventory accepts the whole stack, let vanilla finish it
    // so ordinary pickup feedback and advancement behavior stay native.
    if (!inventoryPlan.remainder) return;
    const pocketPlan = planInsertion(
      pocketBefore,
      inventoryPlan.remainder,
      unlockedPocketSlots(player)
    );
    const storedRemainder = inventoryPlan.remainder;
    const totalMovedToPocket = storedRemainder.amount - (pocketPlan.remainder?.amount ?? 0);
    const totalMoved = current.amount - (pocketPlan.remainder?.amount ?? 0);
    if (totalMoved <= 0) return;

    let replacement;
    if (pocketPlan.remainder) {
      try {
        replacement = itemEntity.dimension.spawnItem(pocketPlan.remainder.clone(), itemEntity.location);
        try { replacement.applyImpulse(itemEntity.getVelocity()); } catch { /* The stack count remains authoritative. */ }
      } catch {
        return;
      }
    }

    if (!commitPlans([
      { container: inventory, plan: inventoryPlan },
      { container: pocket, plan: pocketPlan },
    ])) {
      try { replacement?.remove(); } catch { /* The source entity remains untouched. */ }
      return;
    }

    try {
      itemEntity.remove();
    } catch {
      try { restoreContainer(inventory, inventoryBefore); } catch { /* Keep the item source as the recovery target. */ }
      try { restoreContainer(pocket, pocketBefore); } catch { /* Keep the item source as the recovery target. */ }
      try { replacement?.remove(); } catch { /* The replacement is best-effort cleanup. */ }
      return;
    }

    if (totalMovedToPocket > 0) {
      try { player.onScreenDisplay.setActionBar(`주머니에 ${totalMovedToPocket}개 보관`); } catch { /* UI feedback is optional. */ }
    }
  } catch { /* Stale entity/container handles cancel only this pickup attempt. */ }
  finally {
    pendingPickups.delete(itemEntity.id);
  }
}

world.beforeEvents.entityItemPickup.subscribe(event => {
  const player = event.entity;
  if (!(player instanceof Player) || !player.isValid || unlockedPocketSlots(player) <= 0) return;
  const itemEntity = event.item;
  if (pendingPickups.has(itemEntity.id)) {
    event.cancel = true;
    return;
  }

  const anchor = findAnchor(player);
  const pocket = anchor ? anchorInventory(anchor) : undefined;
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
  const item = itemEntity.getComponent(EntityComponentTypes.Item)?.itemStack;
  if (!pocket || !inventory || !item) return;

  try {
    const inventoryRemainder = insertionRemainderAmount(inventory, item, item.amount, inventory.size);
    if (inventoryRemainder <= 0) return;
    const pocketRemainder = insertionRemainderAmount(pocket, item, inventoryRemainder, unlockedPocketSlots(player));
    if (inventoryRemainder === pocketRemainder) return;

    event.cancel = true;
    pendingPickups.set(itemEntity.id, {
      player,
      item: itemEntity,
      typeId: item.typeId,
      amount: item.amount,
    });
    system.run(() => finishPendingPickup(itemEntity));
  } catch { /* If read-only capacity checks are unavailable, let vanilla handle this attempt. */ }
});

/**
 * BDS does not emit entityItemPickup for a completely full player inventory.
 * Sweep only the native touch-scale radius and only claim a stack the player
 * inventory cannot accept at all; partial native pickups are left to the
 * cancellable before-event above, then the remaining stack is picked on a later tick.
 */
function collectFullInventoryOverflow() {
  for (const player of world.getPlayers()) {
    try { if (!player.isValid) continue; } catch { continue; }
    const unlocked = unlockedPocketSlots(player);
    if (unlocked <= 0) continue;
    let nearbyItems;
    try {
      const center = player.getAABB().center;
      nearbyItems = player.dimension.getEntities({
        type: "minecraft:item",
        location: center,
        maxDistance: 1.25,
      });
    } catch { continue; }

    for (const itemEntity of nearbyItems) {
      if (pendingPickups.has(itemEntity.id)) continue;
      try {
        const item = itemEntity.getComponent(EntityComponentTypes.Item)?.itemStack;
        const anchor = findAnchor(player);
        const pocket = anchor ? anchorInventory(anchor) : undefined;
        const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!item || !pocket || !inventory) continue;
        const inventoryRemainder = insertionRemainderAmount(inventory, item, item.amount, inventory.size);
        if (inventoryRemainder !== item.amount) continue;
        const pocketRemainder = insertionRemainderAmount(pocket, item, inventoryRemainder, unlocked);
        if (pocketRemainder === inventoryRemainder) continue;

        pendingPickups.set(itemEntity.id, {
          player,
          item: itemEntity,
          typeId: item.typeId,
          amount: item.amount,
        });
        system.run(() => finishPendingPickup(itemEntity));
      } catch { /* Keep nearby item stacks untouched when a handle is stale. */ }
    }
  }
}

system.runInterval(collectFullInventoryOverflow, 1);

/** @param {Player} player */
export async function openPocketStorage(player) {
  const level = pocketLevel(player);
  const unlocked = level * 3;
  if (unlocked <= 0) {
    player.sendMessage("주머니 증강을 보유하지 않았어요.");
    return;
  }
  if (openForms.has(player.id)) return;
  const anchor = ensureAnchor(player);
  const pocket = anchor ? anchorInventory(anchor) : undefined;
  if (!pocket) {
    player.sendMessage("주머니 저장 공간을 불러오지 못했어요. 기존 저장 데이터 보호를 위해 새 저장 공간을 만들지 않았습니다.");
    return;
  }

  const form = new ActionFormData()
    .title(`주머니 · Lv.${level} · ${unlocked}칸`)
    .body("수거하지 못한 아이템은 주머니에 자동 보관됩니다. 칸을 누르면 인벤토리로 이동 가능한 수량을 꺼냅니다.");
  for (let slot = 0; slot < unlocked; slot += 1) {
    const stack = pocket.getItem(slot);
    form.button(stack ? `${slot + 1}. ${stack.typeId} ×${stack.amount}` : `${slot + 1}. 비어 있음`);
  }
  form.button("닫기");

  openForms.add(player.id);
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection === undefined || response.selection >= unlocked) return;
    const result = withdrawPocketSlot(player, response.selection);
    if (result.ok === false) {
      player.sendMessage(result.reason === "inventory_full"
        ? "인벤토리에 공간이 없어 주머니 아이템을 꺼내지 않았어요."
        : result.reason === "empty"
          ? "선택한 주머니 칸은 비어 있어요."
          : "주머니 이동을 완료하지 못했어요. 아이템은 보관 상태로 남아 있습니다.");
      return;
    }
    player.sendMessage(result.remaining > 0
      ? `${result.moved}개를 꺼냈어요. ${result.remaining}개는 주머니에 남아 있습니다.`
      : `${result.moved}개를 주머니에서 꺼냈어요.`);
  } catch {
    // A busy/closed form leaves both inventories unchanged.
  } finally {
    openForms.delete(player.id);
  }
}

/** @param {Player} player */
function followPlayer(player) {
  try { if (!player.isValid) return; } catch { return; }
  let anchor = findAnchor(player);
  if (!anchor && pocketLevel(player) > 0) anchor = ensureAnchor(player);
  if (!anchor) return;
  try {
    const current = anchor.location;
    const target = player.location;
    const dx = current.x - target.x;
    const dy = current.y - target.y;
    const dz = current.z - target.z;
    if (anchor.dimension.id !== player.dimension.id || dx * dx + dy * dy + dz * dz > 0.04) {
      anchor.teleport(target, { dimension: player.dimension, checkForBlocks: false });
    }
  } catch { /* A disconnect or dimension transition is retried on the next tick. */ }
}

system.runInterval(() => {
  for (const player of world.getPlayers()) followPlayer(player);
}, 1);

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  system.runTimeout(() => followPlayer(player), 1);
});

world.afterEvents.playerDimensionChange.subscribe(({ player }) => {
  system.run(() => followPlayer(player));
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  anchorsByPlayer.delete(playerId);
  anchorCreationWarnings.delete(playerId);
  openForms.delete(playerId);
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (!(deadEntity instanceof Player) || pocketLevel(deadEntity) <= 0) return;
  const keepPocket = world.gameRules.keepInventory
    || getStoredAugmentLevel(deadEntity, KEEP_INVENTORY_ID, 1) > 0;
  if (keepPocket) return;

  const anchor = findAnchor(deadEntity);
  const pocket = anchor ? anchorInventory(anchor) : undefined;
  if (!pocket) return;
  try {
    const drops = [];
    for (let slot = 0; slot < pocket.size; slot += 1) {
      const stack = pocket.getItem(slot);
      if (!stack) continue;
      drops.push(stack.clone());
      pocket.setItem(slot, undefined);
    }
    for (const stack of drops) deadEntity.dimension.spawnItem(stack, deadEntity.location);
  } catch { /* The entity container remains the source of truth if a drop fails. */ }
});
