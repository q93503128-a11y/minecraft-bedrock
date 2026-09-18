import { BlockPermutation } from "@minecraft/server";

function consumeBlock(event) {
  event.block.setPermutation(BlockPermutation.resolve("minecraft:air"));
}

function register(registry, id, handlers) {
  registry.registerCustomComponent(id, handlers);
}

export function registerFrenchKrabIntegration(registry) {
  register(registry, "lb:cardboard_sword", {
    onPlayerInteract(event) {
      event.player.addEffect("strength", 160, { amplifier: 0 });
      event.player.addEffect("speed", 120, { amplifier: 0 });
      event.player.addEffect("weakness", 40, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:cardboard_axe", {
    onPlayerInteract(event) {
      event.player.addEffect("haste", 260, { amplifier: 1 });
      event.player.addEffect("speed", 100, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:cardboard_shield", {
    onPlayerInteract(event) {
      event.player.addEffect("resistance", 240, { amplifier: 1 });
      event.player.addEffect("absorption", 240, { amplifier: 1 });
      consumeBlock(event);
    }
  });
}
