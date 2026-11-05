import { ItemStack } from "@minecraft/server";

export const COOKING_IDS = Object.freeze({
  ingredient: "monster_restaurant:boar_meat",
  meal: "monster_restaurant:roast_boar",
  discovery: "monster_restaurant:cooked_roast_boar",
});

export function countItem(container, typeId) {
  let count = 0;
  for (let slot = 0; slot < container.size; slot += 1) {
    const stack = container.getItem(slot);
    if (stack?.typeId === typeId) count += stack.amount;
  }
  return count;
}

function canFitOne(container, typeId) {
  for (let slot = 0; slot < container.size; slot += 1) {
    const stack = container.getItem(slot);
    if (!stack || (stack.typeId === typeId && stack.amount < stack.maxAmount)) return true;
  }
  return false;
}

function removeOne(container, typeId) {
  for (let slot = 0; slot < container.size; slot += 1) {
    const stack = container.getItem(slot);
    if (stack?.typeId !== typeId) continue;
    if (stack.amount === 1) container.setItem(slot, undefined);
    else {
      stack.amount -= 1;
      container.setItem(slot, stack);
    }
    return true;
  }
  return false;
}

export function cookOne(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory || countItem(inventory, COOKING_IDS.ingredient) < 1) {
    return { status: "missing_ingredient" };
  }
  if (!canFitOne(inventory, COOKING_IDS.meal)) {
    return { status: "inventory_full" };
  }
  if (!removeOne(inventory, COOKING_IDS.ingredient)) {
    return { status: "missing_ingredient" };
  }

  const remainder = inventory.addItem(new ItemStack(COOKING_IDS.meal, 1));
  if (remainder) {
    inventory.addItem(new ItemStack(COOKING_IDS.ingredient, 1));
    return { status: "inventory_full" };
  }

  const isNewRecipe = player.getDynamicProperty(COOKING_IDS.discovery) !== true;
  player.setDynamicProperty(COOKING_IDS.discovery, true);
  return { status: "cooked", isNewRecipe };
}
