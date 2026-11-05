import { ItemStack, Player } from "@minecraft/server";

/** @typedef {{ok:true}|{ok:false,reason:"no_inventory"|"invalid_recipe"|"insufficient_input"|"no_output_space"|"transaction_failed"}} CoreSynthesisResult */

/**
 * Server-authoritative 3:1 core upgrade. The inventory is planned in memory
 * first, then committed as one synchronous slot update with rollback on error.
 * @param {Player} player
 * @param {string} fromCoreId
 * @param {string} toCoreId
 * @returns {CoreSynthesisResult}
 */
export function synthesizeCore(player, fromCoreId, toCoreId) {
  if (!(player instanceof Player)) return { ok: false, reason: "no_inventory" };
  if (!fromCoreId || !toCoreId || fromCoreId === toCoreId) return { ok: false, reason: "invalid_recipe" };

  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return { ok: false, reason: "no_inventory" };

  let output;
  let original;
  try {
    output = new ItemStack(toCoreId, 1);
    original = Array.from({ length: inventory.size }, (_, slot) => inventory.getItem(slot)?.clone());
  } catch {
    return { ok: false, reason: "invalid_recipe" };
  }

  const working = original.map(item => item?.clone());
  let remaining = 3;
  for (let slot = 0; slot < working.length && remaining > 0; slot += 1) {
    const stack = working[slot];
    if (stack?.typeId !== fromCoreId) continue;
    const removed = Math.min(stack.amount, remaining);
    remaining -= removed;
    if (removed === stack.amount) working[slot] = undefined;
    else stack.amount -= removed;
  }
  if (remaining > 0) return { ok: false, reason: "insufficient_input" };

  for (let slot = 0; slot < working.length && output; slot += 1) {
    const stack = working[slot];
    if (!stack) {
      working[slot] = output;
      output = undefined;
      break;
    }
    if (stack.typeId !== toCoreId || !stack.isStackable || !output.isStackable) continue;
    const space = stack.maxAmount - stack.amount;
    if (space <= 0) continue;
    const moved = Math.min(space, output.amount);
    stack.amount += moved;
    if (moved === output.amount) output = undefined;
    else output.amount -= moved;
  }
  if (output) return { ok: false, reason: "no_output_space" };

  try {
    for (let slot = 0; slot < working.length; slot += 1) {
      inventory.setItem(slot, working[slot]?.clone());
    }
    return { ok: true };
  } catch {
    try {
      for (let slot = 0; slot < original.length; slot += 1) {
        inventory.setItem(slot, original[slot]?.clone());
      }
    } catch { /* Preserve the transaction failure result if the inventory became invalid. */ }
    return { ok: false, reason: "transaction_failed" };
  }
}
