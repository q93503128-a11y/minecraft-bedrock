import { EquipmentSlot, Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";
import { armorCareRollSucceeds } from "./armor-care-rules.js";

const ARMOR_CARE_ID = "augmentation_survival:armor_care";
const ARMOR_CARE_MAX_LEVEL = 5;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const PENDING_ARMOR_DAMAGE = new Map();

/** @typedef {{slot: import("@minecraft/server").EquipmentSlot, typeId: string, damage: number}} ArmorSnapshot */
/** @typedef {{tick: number, level: number, armor: ArmorSnapshot[]}} PendingArmorDamage */

/** @param {Player} player @returns {ArmorSnapshot[]} */
function snapshotEquippedArmor(player) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return [];

  const snapshots = [];
  for (const slot of ARMOR_SLOTS) {
    const itemStack = equippable.getEquipment(slot);
    const durability = itemStack?.getComponent("minecraft:durability");
    if (!itemStack || !durability || durability.unbreakable) continue;
    snapshots.push({ slot, typeId: itemStack.typeId, damage: durability.damage });
  }
  return snapshots;
}

/** @param {import("@minecraft/server").EntityHurtBeforeEvent} event */
function captureBeforeDamage(event) {
  const player = event.hurtEntity;
  if (!(player instanceof Player)) return;

  try {
    if (event.cancel) {
      PENDING_ARMOR_DAMAGE.delete(player.id);
      return;
    }
    const level = getStoredAugmentLevel(player, ARMOR_CARE_ID, ARMOR_CARE_MAX_LEVEL);
    if (level <= 0) {
      PENDING_ARMOR_DAMAGE.delete(player.id);
      return;
    }

    const armor = snapshotEquippedArmor(player);
    if (armor.length === 0) {
      PENDING_ARMOR_DAMAGE.delete(player.id);
      return;
    }
    PENDING_ARMOR_DAMAGE.set(player.id, { tick: system.currentTick, level, armor });
  } catch {
    PENDING_ARMOR_DAMAGE.delete(player.id);
  }
}

/** @param {Player} player @param {PendingArmorDamage} pending @param {() => number} random */
export function restoreArmorDurabilityForHit(player, pending, random = Math.random) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return 0;

  let savedPieces = 0;
  for (const before of pending.armor) {
    const current = equippable.getEquipment(before.slot);
    if (!current || current.typeId !== before.typeId) continue;

    const currentDurability = current?.getComponent("minecraft:durability");
    if (!currentDurability || currentDurability.damage <= before.damage || !armorCareRollSucceeds(pending.level, random())) continue;

    const restored = current.clone();
    const restoredDurability = restored.getComponent("minecraft:durability");
    if (!restoredDurability) continue;
    restoredDurability.damage = before.damage;
    if (equippable.setEquipment(before.slot, restored)) savedPieces += 1;
  }
  return savedPieces;
}

/** @param {import("@minecraft/server").EntityHurtAfterEvent} event */
function restoreAfterDamage(event) {
  const player = event.hurtEntity;
  if (!(player instanceof Player)) return;

  const pending = PENDING_ARMOR_DAMAGE.get(player.id);
  if (!pending) return;
  PENDING_ARMOR_DAMAGE.delete(player.id);
  if (pending.tick !== system.currentTick) return;

  try {
    restoreArmorDurabilityForHit(player, pending);
  } catch { /* A disconnected or invalid player should not interrupt damage processing. */ }
}

system.runInterval(() => {
  const tick = system.currentTick;
  for (const [playerId, pending] of PENDING_ARMOR_DAMAGE) {
    if (pending.tick < tick) PENDING_ARMOR_DAMAGE.delete(playerId);
  }
}, 1);

world.beforeEvents.entityHurt.subscribe(captureBeforeDamage);
world.afterEvents.entityHurt.subscribe(restoreAfterDamage);
world.afterEvents.playerLeave.subscribe(({ playerId }) => PENDING_ARMOR_DAMAGE.delete(playerId));
