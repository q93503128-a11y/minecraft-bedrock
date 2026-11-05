import "./main.js";
import { ItemStack, system, world } from "@minecraft/server";
import { commitCoreSelection, getStoredAugmentLevel, LEVELS_KEY } from "./progression.js";

// This entry is installed only in the generated BDS test copy of the
// production behavior pack. Dynamic properties are pack-scoped, so seed the
// production pack's namespace here instead of from the separate GameTest pack.
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  try {
    if (player.name === "ASKeenEdge") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:keen_edge": 5,
      }));
      return;
    }
    if (player.name === "ASSturdinessLevel1" || player.name === "ASSturdinessLevel5") {
      const level = player.name === "ASSturdinessLevel1" ? 1 : 5;
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:sturdiness": level,
      }));
      return;
    }
    const strongLungsLevels = {
      ASStrongLungsLevel1: 1,
      ASStrongLungsLevel2: 2,
      ASStrongLungsLevel3: 3,
    };
    const strongLungsLevel = strongLungsLevels[player.name];
    if (strongLungsLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:strong_lungs": strongLungsLevel,
      }));
      return;
    }
    const toughSkinLevels = {
      ASToughSkinLevel1: 1,
      ASToughSkinLevel2: 2,
      ASToughSkinLevel3: 3,
      ASToughSkinLevel4: 4,
      ASToughSkinLevel5: 5,
    };
    const toughSkinLevel = toughSkinLevels[player.name];
    if (toughSkinLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:tough_skin": toughSkinLevel,
      }));
      return;
    }
    const lightLandingLevels = {
      ASLightLandingLevel1: 1,
      ASLightLandingLevel2: 2,
      ASLightLandingLevel3: 3,
      ASLightLandingLevel4: 4,
      ASLightLandingLevel5: 5,
    };
    const lightLandingLevel = lightLandingLevels[player.name];
    if (lightLandingLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:light_landing": lightLandingLevel,
      }));
      return;
    }
    if (player.name === "ASDefenseStackFall") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:tough_skin": 5,
        "augmentation_survival:light_landing": 5,
      }));
      return;
    }
    if (player.name === "ASDefenseStackDrowning") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:tough_skin": 5,
        "augmentation_survival:strong_lungs": 3,
      }));
      return;
    }
    if (player.name !== "ASCoreCommitProduction") return;

    const coreId = "augmentation_survival:common_augment_core";
    const augment = { id: "augmentation_survival:sturdiness", max_level: 5 };
    const inventory = player.getComponent("minecraft:inventory")?.container;
    if (!inventory) {
      player.addTag("as_test_core_no_inventory");
      return;
    }

    inventory.setItem(0, new ItemStack(coreId, 2));
    const granted = commitCoreSelection(player, coreId, augment);
    if (granted.ok && granted.level === 1) player.addTag("as_test_core_level_one");
    else player.addTag("as_test_core_grant_failed");

    system.runTimeout(() => {
      try {
        if (getStoredAugmentLevel(player, augment.id, augment.max_level) === 1) player.addTag("as_test_core_level_stored");
        else player.addTag("as_test_core_level_missing");
        player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ [augment.id]: augment.max_level }));
        const rejected = commitCoreSelection(player, coreId, augment);
        if (!rejected.ok && rejected.reason === "max_level") player.addTag("as_test_core_max_rejected");
        else player.addTag("as_test_core_max_rejection_failed");
      } catch { /* The simulated player can leave before the delayed assertion. */ }
    }, 1);
  } catch { /* Simulated players may despawn before their spawn callback is processed. */ }
});
