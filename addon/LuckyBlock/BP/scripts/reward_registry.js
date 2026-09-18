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
    { weight: 20, kind: "item", id: "lb:reward_chainsaw", source: "loys_goodies" },
    { weight: 12, kind: "item", id: "lb:reward_golden_hammer", source: "loys_goodies" },
    { weight: 10, kind: "item", id: "lb:reward_pc", source: "loys_goodies" },
    { weight: 10, kind: "item", id: "lb:rare_lucky_block", count: 2, source: "core" },
    { weight: 8, kind: "fragments", id: "lb:legendary_fragment", min: 1, max: 1, source: "core" },
    { weight: 4, kind: "item", id: "lb:epic_lucky_block", source: "core" }
  ]
};

weightedPools.legendary = [
  { weight: 34, kind: "fragments", id: "lb:legendary_fragment", min: 2, max: 4, source: "core" },
  { weight: 20, kind: "entity", id: "lb:bogre", nameTag: "Bogre", source: "inhabitants", requiresPostDragon: true },
  { weight: 16, kind: "item", id: "lb:slasher", source: "slasher_v1", requiresPostDragon: true },
  { weight: 18, kind: "item", id: "lb:epic_lucky_block", count: 2, source: "core" },
  { weight: 12, kind: "fragments", id: "lb:mythic_fragment", min: 1, max: 1, source: "core", requiresPostDragon: true },
  { weight: 10, kind: "item", id: "lb:legendary_lucky_block", source: "core" },
  { weight: 6, kind: "item", id: "lb:reward_chainsaw", source: "loys_goodies" }
];

weightedPools.mythic = [
  { weight: 18, kind: "fragments", id: "lb:mythic_fragment", min: 3, max: 6, source: "core" },
  { weight: 12, kind: "item", id: "lb:legendary_lucky_block", count: 2, source: "core" },
  { weight: 22, kind: "entity", id: "lb:obsidilith", nameTag: "Obsidilith", source: "bosses_of_mass_destruction", requiresPostDragon: true },
  {
    weight: 22,
    kind: "bundle",
    id: "tomemancer_archmage_set",
    source: "tomemancy",
    requiresPostDragon: true,
    items: [
      { id: "lb:tomemancy_diamond_staff", count: 1 },
      { id: "lb:tomemancy_meteor_tome", count: 1 },
      { id: "lb:tomemancy_gigavolt_tome", count: 1 },
      { id: "lb:tomemancy_dragon_fireball_tome", count: 1 }
    ]
  },
  { weight: 8, kind: "entity", id: "lb:bogre", nameTag: "Bogre", source: "inhabitants", requiresPostDragon: true },
  { weight: 8, kind: "fragments", id: "lb:legendary_fragment", min: 6, max: 10, source: "core" },
  { weight: 10, kind: "item", id: "lb:mythic_lucky_block", source: "core" }
];

export const tierFallbacks = {};

export const activeTiers = ["common", "rare", "epic", "legendary", "mythic"];
