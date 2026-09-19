import { BlockPermutation, system } from "@minecraft/server";

function consumeBlock(event) {
  event.block.setPermutation(BlockPermutation.resolve("minecraft:air"));
}

const interactionLocks=new Set();
function claimInteraction(event){
  const b=event.block,key=event.dimension.id+"|"+b.location.x+"|"+b.location.y+"|"+b.location.z;
  if(interactionLocks.has(key))return false;
  interactionLocks.add(key);
  system.run(()=>interactionLocks.delete(key));
  return true;
}

function register(registry, id, handlers) {
  registry.registerCustomComponent(id, handlers);
}

export function registerFrenchKrabIntegration(registry) {
  register(registry, "lb:cardboard_sword", {
    onPlayerInteract(event) {
      if (!claimInteraction(event)) return;
      event.player.addEffect("strength", 160, { amplifier: 0 });
      event.player.addEffect("speed", 120, { amplifier: 0 });
      event.player.addEffect("weakness", 40, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:cardboard_axe", {
    onPlayerInteract(event) {
      if (!claimInteraction(event)) return;
      event.player.addEffect("haste", 260, { amplifier: 1 });
      event.player.addEffect("speed", 100, { amplifier: 0 });
      consumeBlock(event);
    }
  });

  register(registry, "lb:cardboard_shield", {
    onPlayerInteract(event) {
      if (!claimInteraction(event)) return;
      event.player.addEffect("resistance", 240, { amplifier: 1 });
      event.player.addEffect("absorption", 240, { amplifier: 1 });
      consumeBlock(event);
    }
  });
}
