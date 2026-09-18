import { system, BlockPermutation, ItemStack } from "@minecraft/server";

const tiers = {
  common: { fragment: "lb:common_fragment", min: 2, span: 4, bonus: [] },
  rare: { fragment: "lb:rare_fragment", min: 2, span: 3, bonus: [{ id: "lb:common_lucky_block", chance: 0.35 }] },
  epic: { fragment: "lb:epic_fragment", min: 2, span: 3, bonus: [{ id: "lb:rare_lucky_block", chance: 0.50 }] },
  legendary: { fragment: "lb:legendary_fragment", min: 3, span: 3, bonus: [{ id: "lb:epic_lucky_block", chance: 1.0 }] },
  mythic: { fragment: "lb:mythic_fragment", min: 4, span: 3, bonus: [{ id: "lb:legendary_lucky_block", chance: 1.0 }, { id: "lb:epic_lucky_block", chance: 0.50 }] }
};

function openTier(event, tier) {
  const cfg = tiers[tier];
  const block = event.block;
  const dimension = event.dimension;
  const pos = { x: block.location.x + 0.5, y: block.location.y + 0.65, z: block.location.z + 0.5 };

  block.setPermutation(BlockPermutation.resolve("minecraft:air"));
  const count = cfg.min + Math.floor(Math.random() * cfg.span);
  dimension.spawnItem(new ItemStack(cfg.fragment, count), pos);

  for (const reward of cfg.bonus) {
    if (Math.random() <= reward.chance) {
      dimension.spawnItem(new ItemStack(reward.id, 1), pos);
    }
  }
}

system.beforeEvents.startup.subscribe((initEvent) => {
  for (const tier of Object.keys(tiers)) {
    initEvent.blockComponentRegistry.registerCustomComponent(`lb:open_${tier}`, {
      onPlayerInteract(event) {
        openTier(event, tier);
      }
    });
  }
});
