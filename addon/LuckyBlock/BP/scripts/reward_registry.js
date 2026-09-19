export const weightedPools = {
  common: [
    { weight: 24, kind: "fragments", id: "lb:common_fragment", min: 2, max: 5, source: "core" },
    { weight: 4, kind: "item", id: "lb:lucky_guitar", source: "loys_goodies" },
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
    { weight: 2, kind: "fragments", id: "lb:rare_fragment", min: 2, max: 4, source: "core" },
    { weight: 4, kind: "item", id: "lb:smoke_grenade", count: 2, source: "loys_goodies" },
    { weight: 4, kind: "item", id: "lb:reward_vending_machine", source: "loys_goodies" },
    { weight: 4, kind: "item", id: "lb:reward_pc", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:reward_cctv", source: "loys_goodies" },
    { weight: 6, kind: "item", id: "lb:reward_wrench", source: "loys_goodies" },
    { weight: 6, kind: "item", id: "lb:reward_easel", source: "loys_goodies" },
    { weight: 3, kind: "item", id: "lb:reward_backpack", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:reward_golden_hammer", source: "loys_goodies" },
    { weight: 6, kind: "item", id: "lb:reward_cardboard_shield", source: "frenchkrab" },
    { weight: 6, kind: "item", id: "lb:reward_turret", source: "loys_goodies" },
    { weight: 6, kind: "bundle", id: "inhabitants_javelin_bundle", source: "inhabitants", items: [{ id: "lb:javelin", count: 6 }] },
    { weight: 6, kind: "item", id: "lb:threat_sunglasses", source: "loys_goodies" },
    { weight: 5, kind: "item", id: "lb:fortune_tonic", count: 2, source: "loys_goodies" },
    { weight: 3, kind: "item", id: "lb:common_lucky_block", count: 2, source: "core" },
    { weight: 3, kind: "fragments", id: "lb:epic_fragment", min: 1, max: 1, source: "core" },
    { weight: 5, kind: "entity", id: "lb:irk_companion", nameTag: "Irk Companion", source: "slayers_beasts", tameToOpener: true },
    { weight: 8, kind: "event", id: "fortune_relay", source: "core+licensed_external_fx", fallback: { id: "lb:rare_fragment", min: 3, max: 4 } },
    { weight: 7, kind: "event", id: "fortune_archive", source: "core+loys_goodies", fallback: { id: "lb:rare_fragment", min: 3, max: 4 } },
    { weight: 6, kind: "event", id: "fortune_minefield", source: "core+loys_goodies", fallback: { id: "lb:rare_fragment", min: 3, max: 4 } }
  ],
  epic: [
    { weight: 2, kind: "fragments", id: "lb:epic_fragment", min: 2, max: 4, source: "core" },
    { weight: 2, kind: "item", id: "lb:reward_chainsaw", source: "loys_goodies" },
    { weight: 1, kind: "item", id: "lb:reward_golden_hammer", source: "loys_goodies" },
    { weight: 1, kind: "item", id: "lb:reward_pc", source: "loys_goodies" },
    { weight: 1, kind: "item", id: "lb:rare_lucky_block", count: 2, source: "core" },
    { weight: 5, kind: "fragments", id: "lb:legendary_fragment", min: 1, max: 1, source: "core" },
    { weight: 2, kind: "item", id: "lb:epic_lucky_block", source: "core" },
    { weight: 9, kind: "event", id: "awakened_grove", source: "core+inhabitants+slayers_beasts", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 7, kind: "event", id: "royal_anthill", source: "core+slayers_beasts", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 6, kind: "event", id: "fortune_bulwark", source: "core+loys_goodies+licensed_encounters", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 6, kind: "event", id: "fortune_gallery", source: "core+loys_goodies", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 5, kind: "event", id: "butterfly_sanctuary", source: "core+slayers_beasts", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 8, kind: "event", id: "void_garden", source: "core+bosses_of_mass_destruction", fallback: { id: "lb:epic_fragment", min: 3, max: 4 } },
    { weight: 6, kind: "item", id: "lb:spike_drill", source: "inhabitants" },
    { weight: 5, kind: "entity", id: "lb:war_ant_mount", nameTag: "War Ant Mount", source: "slayers_beasts", tameToOpener: true, tameEvent: "lb:on_tame" },
    { weight: 4, kind: "item", id: "lb:flashbang", count: 2, source: "loys_goodies" },
    { weight: 7, kind: "bundle", id: "amethyst_repeater_kit", source: "tomemancy", items: [{ id: "lb:amethyst_repeater", count: 1 }, { id: "lb:amethyst_charge", count: 48 }] },
    { weight: 6, kind: "bundle", id: "storm_longbow_kit", source: "loys_goodies", items: [{ id: "lb:storm_longbow", count: 1 }, { id: "minecraft:arrow", count: 32 }] },
    { weight: 4, kind: "bundle", id: "explorer_field_kit", source: "loys_goodies", items: [{ id: "lb:explorer_hat", count: 1 }, { id: "lb:explorer_pack", count: 1 }, { id: "minecraft:compass", count: 1 }] },
    { weight: 7, kind: "entity", id: "lb:wither_spider", nameTag: "Wither Spider Artillery", source: "slayers_beasts" },
    {
      weight: 6,
      kind: "bundle",
      id: "tomemancy_mystical_aegis_set",
      source: "tomemancy",
      items: [
        { id: "lb:tomemancy_mystical_helmet", count: 1 },
        { id: "lb:tomemancy_mystical_chestplate", count: 1 },
        { id: "lb:tomemancy_mystical_leggings", count: 1 },
        { id: "lb:tomemancy_mystical_boots", count: 1 }
      ]
    }
  ]
};

weightedPools.legendary = [
  { weight: 10, kind: "fragments", id: "lb:legendary_fragment", min: 2, max: 4, source: "core" },
  { weight: 8, kind: "entity", id: "lb:wudu_binder", nameTag: "Wudu Binder", source: "slayers_beasts", requiresPostDragon: true },
  { weight: 12, kind: "entity", id: "lb:tyrachnid", nameTag: "Tyrachnid Elite", source: "slayers_beasts", requiresPostDragon: true },
  { weight: 12, kind: "entity", id: "lb:bogre", nameTag: "Bogre", source: "inhabitants", requiresPostDragon: true },
  { weight: 8, kind: "entity", id: "lb:cave_dweller", nameTag: "Cave Dweller", source: "cave_dweller_fabric", requiresPostDragon: true },
  { weight: 8, kind: "entity", id: "lb:rift_charger_ant", nameTag: "Rift Charger Ant", source: "slayers_beasts", requiresPostDragon: true },
  { weight: 16, kind: "item", id: "lb:slasher", source: "slasher_v1", requiresPostDragon: true },
  { weight: 14, kind: "item", id: "lb:epic_lucky_block", count: 2, source: "core" },
  { weight: 12, kind: "fragments", id: "lb:mythic_fragment", min: 1, max: 1, source: "core", requiresPostDragon: true },
  { weight: 10, kind: "item", id: "lb:legendary_lucky_block", source: "core" },
  { weight: 6, kind: "entity", id: "lb:sky_damselfly_mount", nameTag: "Sky Damselfly Mount", source: "slayers_beasts", requiresPostDragon: true, tameToOpener: true, tameEvent: "lb:on_tame" },
  { weight: 6, kind: "item", id: "lb:wizard_hat", source: "loys_goodies", requiresPostDragon: true }
];

weightedPools.mythic = [
  { weight: 4, kind: "fragments", id: "lb:mythic_fragment", min: 3, max: 6, source: "core" },
  { weight: 3, kind: "item", id: "lb:legendary_lucky_block", count: 2, source: "core" },
  { weight: 12, kind: "entity", id: "lb:obsidilith", nameTag: "Obsidilith", source: "bosses_of_mass_destruction", requiresPostDragon: true },
  { weight: 10, kind: "entity", id: "lb:gauntlet", nameTag: "Gauntlet", source: "bosses_of_mass_destruction", requiresPostDragon: true },
  {
    weight: 11,
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
  { weight: 11, kind: "event", id: "rift_siege", source: "core+inhabitants+bomd+slayers_beasts", requiresPostDragon: true, fallback: { id: "lb:mythic_fragment", min: 4, max: 4 } },
  { weight: 9, kind: "event", id: "lucky_rain", source: "core+licensed_external_rewards", requiresPostDragon: true, fallback: { id: "lb:mythic_fragment", min: 4, max: 4 } },
  { weight: 14, kind: "event", id: "rift_vault", source: "core+licensed_external_encounters", requiresPostDragon: true, fallback: { id: "lb:mythic_fragment", min: 4, max: 4 } },
  { weight: 10, kind: "event", id: "rift_arsenal", source: "core+inhabitants+slayers_beasts", requiresPostDragon: true, fallback: { id: "lb:mythic_fragment", min: 4, max: 4 } },
  { weight: 10, kind: "event", id: "rift_reliquary", source: "core+loys_goodies+bomd+slayers_beasts", requiresPostDragon: true, fallback: { id: "lb:mythic_fragment", min: 4, max: 4 } },
  { weight: 1, kind: "entity", id: "lb:bogre", nameTag: "Bogre", source: "inhabitants", requiresPostDragon: true },
  { weight: 2, kind: "fragments", id: "lb:legendary_fragment", min: 6, max: 10, source: "core" },
  { weight: 3, kind: "item", id: "lb:mythic_lucky_block", source: "core" }
]

export const tierFallbacks = {};

export const activeTiers = ["common", "rare", "epic", "legendary", "mythic"];
