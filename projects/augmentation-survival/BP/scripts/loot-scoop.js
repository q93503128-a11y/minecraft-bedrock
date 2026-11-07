import { EquipmentSlot, Player, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const LOOT_SCOOP_ID = "augmentation_survival:loot_scoop";
const MAX_LEVEL = 3;
const CHANCE_PER_LEVEL = 0.05;
const CORE_IDS = new Set([
  "augmentation_survival:common_augment_core",
  "augmentation_survival:uncommon_augment_core",
  "augmentation_survival:rare_augment_core",
  "augmentation_survival:epic_augment_core",
  "augmentation_survival:legendary_augment_core",
  "augmentation_survival:mythic_augment_core",
]);
const VANILLA_BOSSES = new Set(["minecraft:ender_dragon", "minecraft:wither"]);

/** @param {number} level */
export function lootScoopChance(level) {
  if (!Number.isInteger(level) || level <= 0) return 0;
  return Math.min(level, MAX_LEVEL) * CHANCE_PER_LEVEL;
}

/** @param {number} level @param {number} roll */
export function lootScoopRollSucceeds(level, roll) {
  const chance = lootScoopChance(level);
  return chance > 0 && Number.isFinite(roll) && roll >= 0 && roll < chance;
}

/** @param {string} typeId */
export function isAugmentCore(typeId) {
  return CORE_IDS.has(typeId);
}

/** @param {import("@minecraft/server").EntityDieAfterEvent} event */
function playerKiller(event) {
  const source = event?.damageSource;
  if (source?.damagingEntity instanceof Player) return source.damagingEntity;
  const owner = source?.damagingProjectile?.getComponent("minecraft:projectile")?.owner;
  return owner instanceof Player ? owner : undefined;
}

/**
 * Recreates Loot Scoop after a player-attributed vanilla death. Stable Script API does not expose
 * the final entity-loot stacks, so the bonus bundle is generated independently from the table.
 * @param {import("@minecraft/server").EntityDieAfterEvent} event
 * @param {() => number} [random]
 * @param {(victim: import("@minecraft/server").Entity, tool?: import("@minecraft/server").ItemStack) => import("@minecraft/server").ItemStack[]} [generateLoot]
 * @returns {{status:"ineligible"|"no_level"|"miss"|"empty"|"duplicated"|"generation_failed", level?:number, chance?:number, spawnedStacks?:Array<{typeId:string,amount:number}>}}
 */
export function processLootScoopDeath(
  event,
  random = Math.random,
  generateLoot = (victim, tool) => world.getLootTableManager().generateLootFromEntity(victim, tool) ?? [],
) {
  const victim = event?.deadEntity;
  const player = playerKiller(event);
  if (!victim || !player || victim instanceof Player || VANILLA_BOSSES.has(victim.typeId)) return { status: "ineligible" };
  try {
    if (victim.hasTag("augmentation_survival:boss") || victim.hasTag("augmentation_survival:dominated_companion")) {
      return { status: "ineligible" };
    }
  } catch { return { status: "ineligible" }; }

  const level = getStoredAugmentLevel(player, LOOT_SCOOP_ID, MAX_LEVEL);
  const chance = lootScoopChance(level);
  if (chance <= 0) return { status: "no_level", level, chance };
  if (!lootScoopRollSucceeds(level, random())) return { status: "miss", level, chance };

  try {
    const tool = player.getComponent("minecraft:equippable")?.getEquipment(EquipmentSlot.Mainhand);
    const generated = generateLoot(victim, tool) ?? [];
    const copies = generated.filter(stack => stack && stack.amount > 0 && !isAugmentCore(stack.typeId));
    if (copies.length === 0) return { status: "empty", level, chance, spawnedStacks: [] };

    const spawnedStacks = [];
    for (const stack of copies) {
      victim.dimension.spawnItem(stack.clone(), victim.location);
      spawnedStacks.push({ typeId: stack.typeId, amount: stack.amount });
    }
    return { status: "duplicated", level, chance, spawnedStacks };
  } catch {
    return { status: "generation_failed", level, chance };
  }
}

export function registerLootScoopHandler() {
  world.afterEvents.entityDie.subscribe(event => processLootScoopDeath(event));
}
