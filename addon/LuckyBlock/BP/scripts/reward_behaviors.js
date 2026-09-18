import { system } from "@minecraft/server";
import { registerLoysGoodiesIntegration } from "./integrations/loys_goodies.js";

const integrations = [
  registerLoysGoodiesIntegration
];

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const registerIntegration of integrations) {
    registerIntegration(initEvent.blockComponentRegistry);
  }
});
