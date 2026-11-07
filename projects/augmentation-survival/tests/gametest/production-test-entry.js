import "./main.js";
import { ItemStack, system, world } from "@minecraft/server";
import { commitCoreSelection, getStoredAugmentLevel, LEVELS_KEY } from "./progression.js";

// This entry is installed only in the generated BDS test copy of the
// production behavior pack. Dynamic properties are pack-scoped, so seed the
// production pack's namespace here instead of from the separate GameTest pack.
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  try {
    if (player.name === "ASToolCareLive") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:tool_care": 5,
      }));
      player.addTag("as_tool_care_seeded");
      return;
    }
    const pickupHandLevel = {
      ASPickupHandLevel1: 1,
      ASPickupHandLevel2: 2,
      ASPickupHandLevel3: 3,
      ASPickupHandProduction: 3,
      ASPickupHandCompeting: 3,
    }[player.name];
    if (pickupHandLevel !== undefined) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:pickup_hand": pickupHandLevel,
      }));
      player.addTag(`as_pickup_hand_level_${pickupHandLevel}`);
      return;
    }
    if (player.name === "ASKeenEdge") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:keen_edge": 5,
      }));
      return;
    }
    const preciseAimLevels = {
      ASPreciseAimLevel1: 1,
      ASPreciseAimLevel2: 2,
      ASPreciseAimLevel3: 3,
      ASPreciseAimLevel4: 4,
      ASPreciseAimLevel5: 5,
    };
    const preciseAimLevel = preciseAimLevels[player.name];
    if (preciseAimLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:precise_aim": preciseAimLevel,
      }));
      return;
    }
    const lastStrengthLevels = {
      ASLastStrengthLevel1: 1,
      ASLastStrengthLevel2: 2,
      ASLastStrengthLevel3: 3,
      ASLastStrengthAboveThreshold: 3,
      ASLastStrengthBelowThreshold: 3,
      ASLastStrengthProjectileAboveThreshold: 3,
      ASLastStrengthKeenStack: 3,
      ASPreciseLastStrengthStack: 3,
      ASLastStrengthProjectileLevel1: 1,
      ASLastStrengthProjectileLevel2: 2,
      ASLastStrengthProjectileLevel3: 3,
    };
    const lastStrengthLevel = lastStrengthLevels[player.name];
    if (lastStrengthLevel) {
      const levels = { "augmentation_survival:last_strength": lastStrengthLevel };
      if (player.name === "ASLastStrengthKeenStack") levels["augmentation_survival:keen_edge"] = 5;
      if (player.name === "ASPreciseLastStrengthStack") levels["augmentation_survival:precise_aim"] = 5;
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
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
    const heartyMealLevels = {
      ASHeartyLevel1: 1,
      ASHeartyLevel2: 2,
      ASHeartyLevel3: 3,
      ASHeartyCap: 3,
    };
    const heartyMealLevel = heartyMealLevels[player.name];
    if (heartyMealLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:hearty_meal": heartyMealLevel,
      }));
      return;
    }
    const webbedFeetLevels = {
      ASWebbedFeetLevel1: 1,
      ASWebbedFeetLevel2: 2,
      ASWebbedFeetLevel3: 3,
    };
    const webbedFeetLevel = webbedFeetLevels[player.name];
    if (webbedFeetLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:webbed_feet": webbedFeetLevel,
      }));
      return;
    }
    const catchBreathLevels = {
      ASCatchBreathLevel1: 1,
      ASCatchBreathLevel2: 2,
      ASCatchBreathLevel3: 3,
      ASCatchBreathWater: 1,
      ASCatchBreathWebbedWater: 1,
      ASCatchBreathWebbed: 1,
    };
    const catchBreathLevel = catchBreathLevels[player.name];
    if (catchBreathLevel) {
      const levels = { "augmentation_survival:catch_breath": catchBreathLevel };
      if (player.name === "ASCatchBreathWebbedWater" || player.name === "ASCatchBreathWebbed") {
        levels["augmentation_survival:webbed_feet"] = 1;
      }
      if (player.name === "ASCatchBreathWebbed") {
        player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
        return;
      }
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
      return;
    }
    if (player.name === "ASWebbedWater") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:webbed_feet": 1 }));
      return;
    }
    const quickFeetLevels = {
      ASQuickFeetLevel1: 1,
      ASQuickFeetLevel2: 2,
      ASQuickFeetLevel3: 3,
      ASQuickFeetLevel4: 4,
      ASQuickFeetLevel5: 5,
    };
    const quickFeetLevel = quickFeetLevels[player.name];
    if (quickFeetLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:quick_feet": quickFeetLevel }));
      return;
    }
    if (player.name === "ASQuickFeetCatchBreathDelayed") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:quick_feet": 1 }));
      system.runTimeout(() => {
        try {
          player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
            "augmentation_survival:quick_feet": 1,
            "augmentation_survival:catch_breath": 3,
          }));
        } catch { /* The simulated player may leave before the delayed test mutation. */ }
      }, 65);
      return;
    }
    const nocturnalLevels = {
      ASNocturnalLevel1: 1,
      ASNocturnalLevel2: 2,
      ASNocturnalLevel3: 3,
    };
    const nocturnalLevel = nocturnalLevels[player.name];
    if (nocturnalLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:nocturnal": nocturnalLevel }));
      return;
    }
    const sunAffinityLevels = {
      ASSunAffinityLevel1: 1,
      ASSunAffinityLevel2: 2,
      ASSunAffinityLevel3: 3,
    };
    const sunAffinityLevel = sunAffinityLevels[player.name];
    if (sunAffinityLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:sun_affinity": sunAffinityLevel }));
      return;
    }
    if (player.name === "ASDayNightMovementStack") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:quick_feet": 5,
        "augmentation_survival:nocturnal": 2,
        "augmentation_survival:sun_affinity": 3,
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
    if (player.name === "ASExtraPieceBreak") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({ "augmentation_survival:extra_piece": 3 }));
      return;
    }
    const rideCurrentLevels = {
      ASRideCurrentLevel1: 1,
      ASRideCurrentLevel2: 2,
      ASRideCurrentLevel3: 3,
      ASRideCurrentWebbedLevel1: 1,
      ASRideCurrentAgainstLevel3: 3,
      ASRideCurrentStillLevel3: 3,
      ASRideCurrentUrgent: 1,
    };
    const rideCurrentLevel = rideCurrentLevels[player.name];
    if (rideCurrentLevel) {
      const levels = { "augmentation_survival:ride_current": rideCurrentLevel };
      if (player.name === "ASRideCurrentWebbedLevel1") levels["augmentation_survival:webbed_feet"] = 1;
      if (player.name === "ASRideCurrentUrgent") {
        levels["augmentation_survival:webbed_feet"] = 1;
        levels["augmentation_survival:urgent_steps"] = 2;
      }
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
      return;
    }
    const riderLevels = {
      ASRiderLevel1: 1,
      ASRiderLevel2: 2,
      ASRiderLevel3: 3,
    };
    const riderLevel = riderLevels[player.name];
    if (riderLevel) {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:rider": riderLevel,
      }));
      player.addTag(`as_rider_seeded_${riderLevel}`);
      return;
    }
    if (player.name === "ASArmorCareLevel5") {
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify({
        "augmentation_survival:armor_care": 5,
      }));
      player.addTag("as_armor_care_seeded");
      return;
    }
    const urgentStepsLevels = {
      ASUrgentStepsLevel1: 1,
      ASUrgentStepsLevel2: 2,
      ASUrgentStepsLevel3: 3,
      ASUrgentStepsStack: 2,
      ASUrgentStepsCancelled: 3,
    };
    const urgentStepsLevel = urgentStepsLevels[player.name];
    if (urgentStepsLevel) {
      const levels = { "augmentation_survival:urgent_steps": urgentStepsLevel };
      if (player.name === "ASUrgentStepsStack") levels["augmentation_survival:quick_feet"] = 5;
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
      player.addTag(`as_urgent_steps_seeded_${urgentStepsLevel}`);
      return;
    }
    const momentumShiftLevels = {
      ASMomentumShiftLevel1: 1,
      ASMomentumShiftLevel2: 2,
      ASMomentumShiftLevel3: 3,
      ASMomentumShiftStack: 1,
      ASMomentumShiftBelowThreshold: 3,
    };
    const momentumShiftLevel = momentumShiftLevels[player.name];
    if (momentumShiftLevel) {
      const levels = { "augmentation_survival:momentum_shift": momentumShiftLevel };
      if (player.name === "ASMomentumShiftStack") levels["augmentation_survival:quick_feet"] = 3;
      player.setDynamicProperty(LEVELS_KEY, JSON.stringify(levels));
      player.addTag(`as_momentum_shift_seeded_${momentumShiftLevel}`);
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
