import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { cookOne, countItem, COOKING_IDS } from "./cooking.js";
const openForms = new Set();

async function openSkillet(player) {
  if (openForms.has(player.id)) return;
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return;

  const hasMeat = countItem(inventory, COOKING_IDS.ingredient) > 0;
  const form = new ActionFormData()
    .title("요리 팬")
    .body(hasMeat ? "멧돼지 고기를 구워 든든한 한 끼를 만드세요." : "멧돼지 고기가 필요합니다.")
    .button(hasMeat ? "멧돼지 구이 만들기" : "멧돼지 구이 · 고기 필요");

  openForms.add(player.id);
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection !== 0) return;

    const result = cookOne(player);
    if (result.status === "missing_ingredient") {
      player.sendMessage("멧돼지 고기가 없어요.");
      return;
    }
    if (result.status === "inventory_full") {
      player.sendMessage("음식을 받을 자리를 비워 주세요.");
      return;
    }
    if (result.status !== "cooked") return;
    player.sendMessage(result.isNewRecipe ? "새 요리, 멧돼지 구이를 만들었어요." : "멧돼지 구이를 만들었어요.");
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
