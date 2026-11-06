import { system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const TOOL_CARE_ID = "augmentation_survival:tool_care";
const TOOL_CARE_MAX_LEVEL = 5;
const TOOL_CARE_CHANCE_PER_LEVEL = 0.05;
const PENDING_BREAKS = new Map();

/** @param {import("@minecraft/server").Player} player @param {import("@minecraft/server").Block} block */
function breakKey(player, block) {
  const { x, y, z } = block.location;
  return `${player.id}:${player.dimension.id}:${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
}

function removeExpiredBreaks() {
  const now = system.currentTick;
  for (const [key, value] of PENDING_BREAKS) {
    if (value.expiresAt < now) PENDING_BREAKS.delete(key);
  }
}

/** @param {number} level */
export function toolCareChance(level) {
  const boundedLevel = Number.isInteger(level) ? Math.max(0, Math.min(TOOL_CARE_MAX_LEVEL, level)) : 0;
  return TOOL_CARE_CHANCE_PER_LEVEL * boundedLevel;
}

/** @param {number} level @param {number} randomValue */
export function toolCareRollSucceeds(level, randomValue) {
  const chance = toolCareChance(level);
  return chance > 0 && Number.isFinite(randomValue) && randomValue >= 0 && randomValue < chance;
}

/**
 * Restore a tool's durability after a player block break when a Tool Care roll
 * succeeds. This preserves the native block-break, loot, and enchantment path.
 * @param {import("@minecraft/server").PlayerBreakBlockAfterEvent} event
 * @param {number} slotIndex
 * @param {number} level
 * @param {() => number} random
 */
export function tryPreventBlockToolDamage(event, slotIndex, level, random = Math.random) {
  const before = event?.itemStackBeforeBreak;
  const beforeDurability = before?.getComponent("minecraft:durability");
  if (!before || !beforeDurability) return false;

  const after = event.itemStackAfterBreak;
  const afterDurability = after?.getComponent("minecraft:durability");
  const currentDamage = afterDurability?.damage ?? beforeDurability.maxDurability;
  const damageLost = currentDamage - beforeDurability.damage;
  if (!(damageLost > 0) || !Number.isFinite(damageLost)) return false;

  if (!toolCareRollSucceeds(level, random())) return false;
  const inventory = event.player.getComponent("minecraft:inventory")?.container;
  if (!inventory || !Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= inventory.size) return false;

  const current = inventory.getItem(slotIndex);
  if (afterDurability) {
    if (!current || current.typeId !== before.typeId) return false;
    const currentDurability = current.getComponent("minecraft:durability");
    if (!currentDurability || currentDurability.damage !== currentDamage) return false;
    currentDurability.damage = beforeDurability.damage;
    inventory.setItem(slotIndex, current);
    return true;
  }

  // If this block break exhausted the last durability point, restore the exact
  // pre-break stack only while its captured hotbar slot is still empty.
  if (current) return false;
  const restored = before.clone();
  const restoredDurability = restored.getComponent("minecraft:durability");
  if (!restoredDurability) return false;
  restoredDurability.damage = beforeDurability.damage;
  inventory.setItem(slotIndex, restored);
  return true;
}

world.beforeEvents.playerBreakBlock.subscribe(event => {
  try {
    removeExpiredBreaks();
    const stack = event.itemStack;
    if (!stack?.getComponent("minecraft:durability")) return;
    PENDING_BREAKS.set(breakKey(event.player, event.block), {
      slotIndex: event.player.selectedSlotIndex,
      typeId: stack.typeId,
      expiresAt: system.currentTick + 4,
    });
  } catch { /* Ignore a stale block/player snapshot; the vanilla break proceeds. */ }
});

world.afterEvents.playerBreakBlock.subscribe(event => {
  try {
    removeExpiredBreaks();
    const key = breakKey(event.player, event.block);
    const pending = PENDING_BREAKS.get(key);
    PENDING_BREAKS.delete(key);
    if (!pending || pending.typeId !== event.itemStackBeforeBreak?.typeId) return;
    const level = getStoredAugmentLevel(event.player, TOOL_CARE_ID, TOOL_CARE_MAX_LEVEL);
    if (level > 0) tryPreventBlockToolDamage(event, pending.slotIndex, level);
  } catch { /* Never interfere with vanilla block drops when an item snapshot is stale. */ }
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const [key] of PENDING_BREAKS) {
    if (key.startsWith(`${playerId}:`)) PENDING_BREAKS.delete(key);
  }
});
