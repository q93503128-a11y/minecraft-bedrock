import { EntityDamageCause, Player, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const KEEN_EDGE = "augmentation_survival:keen_edge";
const PRECISE_AIM = "augmentation_survival:precise_aim";
const TOUGH_SKIN = "augmentation_survival:tough_skin";
const TOUGH_SKIN_MAX_LEVEL = 5;
const TOUGH_SKIN_REDUCTION_PER_LEVEL = 0.02;
const LIGHT_LANDING = "augmentation_survival:light_landing";
const LIGHT_LANDING_MAX_LEVEL = 5;
const LIGHT_LANDING_REDUCTION_PER_LEVEL = 0.12;
const STRONG_LUNGS = "augmentation_survival:strong_lungs";
const STRONG_LUNGS_MAX_LEVEL = 3;
const STRONG_LUNGS_REDUCTION_PER_LEVEL = 0.15;
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

/**
 * Java applies these reductions after vanilla mitigation. The stable Bedrock
 * before-event is the available server-authoritative hook; its exact interaction
 * with armor/effect mitigation and delayed-damage provenance remains a parity gap.
 * @param {import("@minecraft/server").EntityHurtBeforeEvent} event
 */
export function applyIncomingDamageModifier(event) {
  if (!(event?.hurtEntity instanceof Player) || !event.damageSource || !(event.damage > 0) || !Number.isFinite(event.damage)) return;
  let scaled = event.damage;
  const toughSkinLevel = getStoredAugmentLevel(event.hurtEntity, TOUGH_SKIN, TOUGH_SKIN_MAX_LEVEL);
  if (toughSkinLevel > 0) scaled *= 1 - TOUGH_SKIN_REDUCTION_PER_LEVEL * toughSkinLevel;

  if (event.damageSource.cause === EntityDamageCause.fall) {
    const lightLandingLevel = getStoredAugmentLevel(event.hurtEntity, LIGHT_LANDING, LIGHT_LANDING_MAX_LEVEL);
    if (lightLandingLevel > 0) scaled *= 1 - LIGHT_LANDING_REDUCTION_PER_LEVEL * lightLandingLevel;
  } else if (event.damageSource.cause === EntityDamageCause.drowning) {
    const strongLungsLevel = getStoredAugmentLevel(event.hurtEntity, STRONG_LUNGS, STRONG_LUNGS_MAX_LEVEL);
    if (strongLungsLevel > 0) scaled *= 1 - STRONG_LUNGS_REDUCTION_PER_LEVEL * strongLungsLevel;
  }

  if (Number.isFinite(scaled) && scaled >= 0 && scaled <= event.damage) event.damage = scaled;
}

/** Keep attacker bonuses ahead of defender reductions on the shared damage event. */
/** @param {import("@minecraft/server").EntityHurtBeforeEvent} event */
export function applyAugmentDamageModifiers(event) {
  applyRootDamageModifier(event);
  applyIncomingDamageModifier(event);
}

world.beforeEvents.entityHurt.subscribe(applyAugmentDamageModifiers);
