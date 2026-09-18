export const weightedPools = {
  common: [
    { weight: 28, kind: "fragments", id: "lb:common_fragment", min: 2, max: 5, source: "core" },
    { weight: 8, kind: "item", id: "lb:reward_burger", source: "loys_goodies" },
    { weight: 8, kind: "item", id: "lb:reward_noodles", source: "loys_goodies" },
    { weight: 7, kind: "item", id: "lb:reward_plunger", source: "loys_goodies" },
    { weight: 6, kind: "item", id: "lb:reward_snow_globe", source: "loys_goodies" },
    { weight: 6, kind: "item", id: "lb:reward_vase", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:reward_camera", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:reward_moai", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:reward_backpack", source: "loys_goodies" },
    { weight: 4, kind: "item", id: "lb:reward_cardboard_sword", source: "frenchkrab" },
    { weight: 4, kind: "item", id: "lb:reward_cardboard_axe", source: "frenchkrab" },
    { weight: 5, kind: "item", id: "lb:common_lucky_block", source: "core" },
    { weight: 5, kind: "fragments", id: "lb:rare_fragment", min: 1, max: 1, source: "core" }
  ],
  rare: [
    { weight: 25, kind: "fragments", id: "lb:rare_fragment", min: 2, max: 4, source: "core" },
    { weight: 10, kind: "item", id: "lb:reward_vending_machine", source: "loys_goodies" },
    { weight: 10, kind: "item", id: "lb:reward_pc", source: "loys_goodies" },
    { weight: 9, kind: "item", id: "lb:reward_cctv", source: "loys_goodies" },
    { weight: 9, kind: "item", id: "lb:reward_wrench", source: "loys_goodies" },
    { weight: 8, kind: "item", id: "lb:reward_easel", source: "loys_goodies" },
    { weight: 8, kind: "item", id: "lb:reward_backpack", source: "loys_goodies" },
    { weight: 8, kind: "item", id: "lb:reward_golden_hammer", source: "loys_goodies" },
    { weight: 7, kind: "item", id: "lb:reward_cardboard_shield", source: "frenchkrab" },
    { weight: 7, kind: "item", id: "lb:common_lucky_block", count: 2, source: "core" },
    { weight: 6, kind: "fragments", id: "lb:epic_fragment", min: 1, max: 1, source: "core" }
  ],
  epic: [
    { weight: 32, kind: "fragments", id: "lb:epic_fragment", min: 2, max: 4, source: "core" },
    { weight: 24, kind: "item", id: "lb:reward_chainsaw", source: "loys_goodies" },
    { weight: 12, kind: "item", id: "lb:reward_golden_hammer", source: "loys_goodies" },
    { weight: 10, kind: "item", id: "lb:reward_pc", source: "loys_goodies" },
    { weight: 10, kind: "item", id: "lb:rare_lucky_block", count: 2, source: "core" },
    { weight: 8, kind: "fragments", id: "lb:legendary_fragment", min: 1, max: 1, source: "core" },
    { weight: 4, kind: "item", id: "lb:epic_lucky_block", source: "core" }
  ]
};

export const tierFallbacks = {
  legendary: { fragment: "lb:legendary_fragment", min: 3, max: 5, bonus: "lb:epic_lucky_block", bonusChance: 1.0 },
  mythic: { fragment: "lb:mythic_fragment", min: 4, max: 6, bonus: "lb:legendary_lucky_block", bonusChance: 1.0 }
};

export const activeTiers = ["common", "rare", "epic", "legendary", "mythic"];
