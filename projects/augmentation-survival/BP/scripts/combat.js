import { EntityDamageCause, Player, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const KEEN_EDGE = "augmentation_survival:keen_edge";
const PRECISE_AIM = "augmentation_survival:precise_aim";
const MAX_DAMAGE_SCALE = 2;

/**
 * Match Java's root melee/projectile outgoing modifier order. Script-created
 * derived projectiles must opt out before this runtime expands to those effects.
 * @param {import("@minecraft/server").EntityHurtBeforeEvent} event
 */
export function applyRootDamageModifier(event) {
  if (!event?.damageSource || !(event.damage > 0) || !Number.isFinite(event.damage)) return;

  const { cause, damagingEntity, damagingProjectile } = event.damageSource;
  let attacker;
  let augmentId;
  if (cause === EntityDamageCause.entityAttack && damagingEntity instanceof Player) {
    attacker = damagingEntity;
    augmentId = KEEN_EDGE;
  } else if (cause === EntityDamageCause.projectile && damagingProjectile) {
    const owner = damagingProjectile.getComponent("minecraft:projectile")?.owner;
    if (owner instanceof Player) {
      attacker = owner;
      augmentId = PRECISE_AIM;
    }
  }
  if (!attacker || !augmentId) return;

  const level = getStoredAugmentLevel(attacker, augmentId, 5);
  if (level === 0) return;
  const scaled = event.damage * (1 + 0.04 * level);
  if (Number.isFinite(scaled) && scaled > 0 && scaled <= event.damage * MAX_DAMAGE_SCALE) event.damage = scaled;
}

world.beforeEvents.entityHurt.subscribe(applyRootDamageModifier);
