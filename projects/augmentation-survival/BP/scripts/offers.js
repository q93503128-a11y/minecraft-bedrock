/**
 * @template {{id:string,tier:string,max_level:number,candidate_enabled:boolean}} T
 * @param {string} tier
 * @param {T[]} augments
 * @param {Record<string,number>} levels
 * @returns {T[]}
 */
export function listAvailableCandidates(tier, augments, levels) {
  return augments.filter(augment => augment.tier === tier
    && augment.candidate_enabled
    && (Number(levels[augment.id]) || 0) < augment.max_level);
}
