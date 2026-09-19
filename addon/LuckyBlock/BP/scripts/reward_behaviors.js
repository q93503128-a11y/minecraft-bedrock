import { system } from "@minecraft/server";
import { registerLoysGoodiesIntegration } from "./integrations/loys_goodies.js";
import { registerFrenchKrabIntegration } from "./integrations/frenchkrab.js";
import { registerLoysOdditiesIntegration } from "./integrations/loys_oddities.js";

const integrations = [
  registerLoysGoodiesIntegration,
  registerFrenchKrabIntegration,
  registerLoysOdditiesIntegration
];

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const registerIntegration of integrations) {
    registerIntegration(initEvent.blockComponentRegistry);
  }
});
