import { ItemStack, system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const IDS = {
  ingredient: "monster_restaurant:boar_meat",
  meal: "monster_restaurant:roast_boar",
};
const DISCOVERED_ROAST = "monster_restaurant:cooked_roast_boar";
const openForms = new Set();

function countItem(container, typeId) {
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

async function openSkillet(player) {
  if (openForms.has(player.id)) return;
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;

  const hasMeat = countItem(inventory, IDS.ingredient) > 0;
  const form = new ActionFormData()
    .title("요리 팬")
    .body(hasMeat ? "멧돼지 고기를 구워 든든한 한 끼를 만드세요." : "멧돼지 고기가 필요합니다.")
    .button(hasMeat ? "멧돼지 구이 만들기" : "멧돼지 구이 · 고기 필요");

  openForms.add(player.id);
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection !== 0) return;

    const currentInventory = player.getComponent("minecraft:inventory")?.container;
    if (!currentInventory || countItem(currentInventory, IDS.ingredient) < 1) {
      player.sendMessage("멧돼지 고기가 없어요.");
      return;
    }
    if (!canFitOne(currentInventory, IDS.meal)) {
      player.sendMessage("음식을 받을 자리를 비워 주세요.");
      return;
    }

    if (!removeOne(currentInventory, IDS.ingredient)) return;
    const remainder = currentInventory.addItem(new ItemStack(IDS.meal, 1));
    if (remainder) {
      // The slot check and synchronous inventory mutation make this unreachable in ordinary play.
      // Restore the ingredient if another inventory mutation filled the last slot first.
      currentInventory.addItem(new ItemStack(IDS.ingredient, 1));
      player.sendMessage("음식을 받을 자리를 비워 주세요.");
      return;
    }
    const isNewRecipe = player.getDynamicProperty(DISCOVERED_ROAST) !== true;
    player.setDynamicProperty(DISCOVERED_ROAST, true);
    player.sendMessage(isNewRecipe ? "새 요리, 멧돼지 구이를 만들었어요." : "멧돼지 구이를 만들었어요.");
  } catch {
    // A form can become unavailable when another screen is open; inventory stays untouched.
  } finally {
    openForms.delete(player.id);
  }
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("monster_restaurant:skillet_interaction", {
    onPlayerInteract(event) {
      const player = event.player;
      if (player) system.run(() => void openSkillet(player));
    },
  });
});
