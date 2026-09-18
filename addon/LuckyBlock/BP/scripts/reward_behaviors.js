import { system } from "@minecraft/server";
import { registerLoysGoodiesIntegration } from "./integrations/loys_goodies.js";
import { registerFrenchKrabIntegration } from "./integrations/frenchkrab.js";

const integrations = [
  registerLoysGoodiesIntegration,
  registerFrenchKrabIntegration
];

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const registerIntegration of integrations) {
    registerIntegration(initEvent.blockComponentRegistry);
  }
});
