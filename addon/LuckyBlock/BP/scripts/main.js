import { system, BlockPermutation, ItemStack } from "@minecraft/server";

system.beforeEvents.startup.subscribe((initEvent) => {
  initEvent.blockComponentRegistry.registerCustomComponent("lb:open_common", {
    onPlayerInteract(event) {
      const block = event.block;
      const dimension = event.dimension;
      const dropLocation = {
        x: block.location.x + 0.5,
        y: block.location.y + 0.65,
        z: block.location.z + 0.5
      };

      // Crystal Burst is an actual Common-tier outcome, not a temporary vanilla test reward.
      const fragmentCount = 2 + Math.floor(Math.random() * 4);

      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
      dimension.spawnItem(new ItemStack("lb:common_fragment", fragmentCount), dropLocation);
    }
  });
});
