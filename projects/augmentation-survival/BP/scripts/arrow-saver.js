import { GameMode, Player, system, world } from "@minecraft/server";
import { getStoredAugmentLevel } from "./progression.js";
import { ARROW_SAVER_ID, ARROW_SAVER_MAX_LEVEL, consumedExactlyOneArrow, arrowSaverRollSucceeds } from "./arrow-saver-rules.js";

const PROJECTILE_WEAPONS = new Set(["minecraft:bow", "minecraft:crossbow"]);
const STOP_TO_AMMO_TICK_WINDOW = 0;
const pendingShotStops = new Map();
let nextActionToken = 0;
/** @type {(player: Player) => number} */
let randomRollForPlayer = () => Math.random();

/** @param {(player: Player) => number} source */
export function setArrowSaverRandomProvider(source) {
  randomRollForPlayer = source;
}

/** @param {import("@minecraft/server").ItemStopUseAfterEvent} event */
function trackShotAction(event) {
  const { source, itemStack } = event;
  if (!(source instanceof Player) || !itemStack || !PROJECTILE_WEAPONS.has(itemStack.typeId)) return;
  try {
    if (source.getGameMode() === GameMode.Creative) return;
    const action = {
      tick: system.currentTick,
      weaponId: itemStack.typeId,
      selectedSlot: source.selectedSlotIndex,
      token: ++nextActionToken,
    };
    pendingShotStops.set(source.id, action);
    system.runTimeout(() => {
      if (pendingShotStops.get(source.id)?.token === action.token) pendingShotStops.delete(source.id);
    }, STOP_TO_AMMO_TICK_WINDOW + 1);
  } catch { /* Stale players cannot create an ammo-preservation action. */ }
}

/** @param {import("@minecraft/server").PlayerInventoryItemChangeAfterEvent} event */
function preserveConsumedArrow(event) {
  const { player, beforeItemStack, itemStack } = event;
  const action = pendingShotStops.get(player.id);
  if (!action || action.tick !== system.currentTick || !consumedExactlyOneArrow(beforeItemStack, itemStack)) return;
  if (!beforeItemStack) return;

  try {
    const inventory = player.getComponent("minecraft:inventory")?.container;
    const heldWeapon = inventory?.getItem(action.selectedSlot)?.typeId;
    if (!inventory || heldWeapon !== action.weaponId) return;
    pendingShotStops.delete(player.id);

    const level = getStoredAugmentLevel(player, ARROW_SAVER_ID, ARROW_SAVER_MAX_LEVEL);
    const roll = randomRollForPlayer(player);
    if (!arrowSaverRollSucceeds(level, roll)) return;

    const saved = beforeItemStack.clone();
    saved.amount = 1;
    const remainder = inventory.addItem(saved);
    if (remainder) player.dimension.spawnItem(remainder, player.location);
  } catch { /* A stale inventory never receives a second or unowned arrow. */ }
}

world.afterEvents.itemStopUse.subscribe(trackShotAction);
world.afterEvents.playerInventoryItemChange.subscribe(preserveConsumedArrow);
world.afterEvents.playerLeave.subscribe(({ playerId }) => pendingShotStops.delete(playerId));
