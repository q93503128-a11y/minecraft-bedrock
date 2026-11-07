// Vanilla Java CropBlock equivalents with a stable Bedrock growth state and a
// vanilla item that places the same crop block. Pitcher Crop, Nether Wart,
// cocoa, and berry bushes are intentionally excluded because they are not
// Java CropBlock implementations in the pinned source.
export const REPLANT_CROPS = new Map([
  ["minecraft:wheat", { blockId: "minecraft:wheat", ageState: "growth", maxAge: 7, plantingItem: "minecraft:wheat_seeds", product: "minecraft:wheat", harvestBonuses: true }],
  ["minecraft:carrots", { blockId: "minecraft:carrots", ageState: "growth", maxAge: 7, plantingItem: "minecraft:carrot", product: "minecraft:carrot", harvestBonuses: true }],
  ["minecraft:potatoes", { blockId: "minecraft:potatoes", ageState: "growth", maxAge: 7, plantingItem: "minecraft:potato", product: "minecraft:potato", harvestBonuses: true }],
  ["minecraft:beetroot", { blockId: "minecraft:beetroot", ageState: "growth", maxAge: 3, plantingItem: "minecraft:beetroot_seeds", product: "minecraft:beetroot", harvestBonuses: true }],
  ["minecraft:torchflower_crop", { blockId: "minecraft:torchflower_crop", ageState: "growth", maxAge: 1, plantingItem: "minecraft:torchflower_seeds", product: "minecraft:torchflower", harvestBonuses: false }],
]);

/**
 * @param {import("@minecraft/server").BlockPermutation} permutation
 * @returns {{blockId:string,ageState:string,maxAge:number,plantingItem:string,product:string,harvestBonuses:boolean}|undefined}
 */
export function matureReplantCrop(permutation) {
  const crop = REPLANT_CROPS.get(permutation.type.id);
  if (!crop) return undefined;
  const age = crop.ageState === "growth"
    ? permutation.getState("growth")
    : permutation.getState("age");
  return typeof age === "number" && age >= crop.maxAge ? crop : undefined;
}
