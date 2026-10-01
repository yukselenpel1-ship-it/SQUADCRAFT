import { PlayerInMatch, MatchEngineEvent } from './types';
import { matchRandom } from './random';

export interface InjuryCheckResult {
  hasInjury: boolean;
  injuredPlayerId?: string;
  injuredPlayerName?: string;
  isSevere: boolean;
  event?: MatchEngineEvent;
}

export function evaluateInjuries(
  minute: number,
  teamId: string,
  activePlayers: PlayerInMatch[],
  opponentAggressionLevel: number // 1 to 100
): InjuryCheckResult {
  for (const pim of activePlayers) {
    if (!pim.isOnPitch || pim.isInjured) continue;

    // Base minute injury probability ~0.0004
    let prob = 0.0004;

    // Fitness multiplier
    if (pim.currentFitness < 50) {
      prob *= 3.5;
    } else if (pim.currentFitness < 65) {
      prob *= 1.8;
    }

    // Opponent aggression multiplier
    if (opponentAggressionLevel > 75) {
      prob *= 1.4;
    }

    // Age multiplier
    if (pim.player.age >= 32) {
      prob *= 1.3;
    }

    if (matchRandom() < prob) {
      const isSevere = matchRandom() < 0.45;
      pim.isInjured = true;
      pim.injurySeverity = isSevere ? 'SEVERE' : 'LIGHT';

      if (!isSevere) {
        pim.currentFitness = Math.max(30, pim.currentFitness - 20);
      }

      const event: MatchEngineEvent = {
        id: `inj-${minute}-${pim.player.id}`,
        minute,
        second: Math.floor(matchRandom() * 59),
        type: 'INJURY',
        teamId,
        playerId: pim.player.id,
        playerName: `${pim.player.firstName} ${pim.player.lastName}`,
        description: isSevere
          ? `${pim.player.firstName} ${pim.player.lastName} sakatlanarak oyuna devam edemiyor!`
          : `${pim.player.firstName} ${pim.player.lastName} bir darbe aldı ve tedavi görüyor.`,
        commentary: isSevere
          ? `Sağlık görevlileri sahada! ${pim.player.firstName} ${pim.player.lastName} sedyeyle kenara alınıyor, oyuna devam edemeyecek.`
          : `${pim.player.firstName} ${pim.player.lastName} acı içinde yerde kaldı, hafif bir sakatlık geçiriyor ancak oyuna devam edebilir.`,
        isImportant: true,
      };

      return {
        hasInjury: true,
        injuredPlayerId: pim.player.id,
        injuredPlayerName: `${pim.player.firstName} ${pim.player.lastName}`,
        isSevere,
        event,
      };
    }
  }

  return { hasInjury: false, isSevere: false };
}
