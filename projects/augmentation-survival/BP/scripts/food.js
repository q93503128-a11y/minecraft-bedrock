import { ItemStack, Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";

const HEARTY_MEAL_ID = "augmentation_survival:hearty_meal";
const HEARTY_MEAL_BONUS = [0.08, 0.16, 0.24];

/** @type {Map<string, {current:{tick:number,saturation:number},previous?:{tick:number,saturation:number}}>} */
const FOOD_SAMPLES = new Map();

/** @param {Player} player */
function samplePlayerFood(player) {
  try {
    const saturation = player.getComponent("minecraft:player.saturation")?.currentValue;
    if (typeof saturation !== "number" || !Number.isFinite(saturation)) {
      FOOD_SAMPLES.delete(player.id);
      return;
    }
    const samples = FOOD_SAMPLES.get(player.id);
    const current = { tick: system.currentTick, saturation };
    FOOD_SAMPLES.set(player.id, {
      current,
      previous: samples?.current,
    });
  } catch {
    FOOD_SAMPLES.delete(player.id);
  }
}

/**
 * Returns the vanilla saturation added by this food. Data-driven foods expose
 * the exact food component; vanilla foods are measured from the prior tick.
 * If vanilla clamped saturation to the new food level, the truncated delta is
 * still safe: both the vanilla result and the bonus result remain at that cap.
 * @param {Player} player
 * @param {ItemStack} itemStack
 * @param {number} currentSaturation
 */
function vanillaSaturationGain(player, itemStack, currentSaturation) {
  try {
    const food = itemStack.getComponent("minecraft:food");
    if (food && Number.isFinite(food.nutrition) && Number.isFinite(food.saturationModifier)) {
      return Math.max(0, food.nutrition * food.saturationModifier * 2);
    }
  } catch { /* Vanilla food components are not exposed on every item stack. */ }

  const samples = FOOD_SAMPLES.get(player.id);
  if (!samples) return 0;
  const previous = samples.current.tick === system.currentTick
    ? samples.previous
    : samples.current;
  if (!previous) return 0;
  return Math.max(0, currentSaturation - previous.saturation);
}

/** @param {Player} player @param {ItemStack} itemStack @returns {number} */
export function applyHeartyMealBonus(player, itemStack) {
  const level = getStoredAugmentLevel(player, HEARTY_MEAL_ID, HEARTY_MEAL_BONUS.length);
  if (level <= 0) return 0;

  const hunger = player.getComponent("minecraft:player.hunger");
  const saturation = player.getComponent("minecraft:player.saturation");
  if (!hunger || !saturation) return 0;

  const currentSaturation = saturation.currentValue;
  const vanillaGain = vanillaSaturationGain(player, itemStack, currentSaturation);
  if (!(vanillaGain > 0) || !Number.isFinite(vanillaGain)) return 0;

  const cap = Math.max(0, Math.min(20, hunger.currentValue));
  const nextSaturation = Math.min(cap, currentSaturation + vanillaGain * HEARTY_MEAL_BONUS[level - 1]);
  if (!(nextSaturation > currentSaturation)) return 0;
  saturation.setCurrentValue(nextSaturation);
  return nextSaturation - currentSaturation;
}

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  if (!(source instanceof Player)) return;
  try { applyHeartyMealBonus(source, itemStack); } catch { /* The player can leave before the event callback finishes. */ }
});

world.afterEvents.playerSpawn.subscribe(({ player }) => samplePlayerFood(player));
world.afterEvents.playerLeave.subscribe(({ playerId }) => FOOD_SAMPLES.delete(playerId));
system.runInterval(() => {
  for (const player of world.getPlayers()) samplePlayerFood(player);
}, 1);
