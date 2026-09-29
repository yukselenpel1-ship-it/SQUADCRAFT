import { PlayerInMatch } from './types';

export function updatePlayerFatigue(
  pim: PlayerInMatch,
  fatigueBurnRateMult: number
): void {
  if (!pim.isOnPitch) return;

  const player = pim.player;
  const stamina = player.attributes.stamina || 70;

  // Base burn per minute ~0.38
  const baseDrain = 0.38;

  // Stamina modifier: stamina 90 -> 0.70x drain, stamina 50 -> 1.25x drain
  const staminaFactor = 1.45 - (stamina / 100) * 0.75;

  // Age factor
  let ageFactor = 1.0;
  if (player.age >= 32) {
    ageFactor += (player.age - 31) * 0.05;
  }

  const totalDrain = baseDrain * staminaFactor * ageFactor * fatigueBurnRateMult;

  pim.currentFitness = Math.max(25, Number((pim.currentFitness - totalDrain).toFixed(2)));
  pim.minutesPlayed += 1;
}

export function applyFatigueToTeam(
  players: Record<string, PlayerInMatch>,
  activePlayerIds: string[],
  fatigueBurnRateMult: number
): void {
  activePlayerIds.forEach((id) => {
    const pim = players[id];
    if (pim && pim.isOnPitch) {
      updatePlayerFatigue(pim, fatigueBurnRateMult);
    }
  });
}
