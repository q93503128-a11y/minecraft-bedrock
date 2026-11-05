/** @param {import("@minecraft/server").Player} player @param {number} level */
export function applySturdinessEffect(player, level) {
  if (!Number.isInteger(level) || level <= 0) return;
  player.addEffect("health_boost", 260, { amplifier: level - 1, showParticles: false });
}
