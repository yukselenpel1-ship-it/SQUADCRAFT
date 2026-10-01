import { MatchTeamRuntime, MatchEngineEvent } from './types';
import { calculateTeamRatings } from './teamStrength';
import { generateCommentary } from './commentary';
import { matchRandom } from './random';

export interface SubstitutionResult {
  success: boolean;
  message: string;
  event?: MatchEngineEvent;
}

export function performSubstitution(
  team: MatchTeamRuntime,
  playerOutId: string,
  playerInId: string,
  minute: number
): SubstitutionResult {
  // Check maximum substitutions
  if (team.substitutionsUsed >= team.maxSubstitutions) {
    return {
      success: false,
      message: `En fazla ${team.maxSubstitutions} oyuncu değişikliği yapılabilir.`,
    };
  }

  const playerOut = team.players[playerOutId];
  const playerIn = team.players[playerInId];

  if (!playerOut || !playerIn) {
    return {
      success: false,
      message: 'Belirtilen oyuncu bulunamadı.',
    };
  }

  if (!playerOut.isOnPitch) {
    return {
      success: false,
      message: `${playerOut.player.firstName} ${playerOut.player.lastName} zaten sahada değil.`,
    };
  }

  if (playerIn.isOnPitch) {
    return {
      success: false,
      message: `${playerIn.player.firstName} ${playerIn.player.lastName} zaten oyunda.`,
    };
  }

  if (playerIn.redCards > 0) {
    return {
      success: false,
      message: 'Kırmızı kart gören oyuncu tekrar oyuna giremez.',
    };
  }

  // Execute substitution
  playerOut.isOnPitch = false;
  playerIn.isOnPitch = true;
  playerIn.currentPosition = playerOut.currentPosition;

  // Update active pitch IDs and bench IDs
  team.activePitchPlayerIds = team.activePitchPlayerIds.filter((id) => id !== playerOutId);
  team.activePitchPlayerIds.push(playerInId);

  team.benchPlayerIds = team.benchPlayerIds.filter((id) => id !== playerInId);

  team.substitutionsUsed += 1;

  // Recalculate team ratings immediately
  const activePlayers = team.activePitchPlayerIds.map((id) => team.players[id]).filter(Boolean);
  team.ratings = calculateTeamRatings(activePlayers);

  const event: MatchEngineEvent = {
    id: `sub-${minute}-${playerInId}`,
    minute,
    second: Math.floor(matchRandom() * 59),
    type: 'SUBSTITUTION',
    teamId: team.club.id,
    playerId: playerIn.player.id,
    playerName: `${playerIn.player.firstName} ${playerIn.player.lastName}`,
    secondaryPlayerId: playerOut.player.id,
    secondaryPlayerName: `${playerOut.player.firstName} ${playerOut.player.lastName}`,
    description: `Oyuncu Değişikliği: ${playerIn.player.firstName} ${playerIn.player.lastName} oyunda, ${playerOut.player.firstName} ${playerOut.player.lastName} kenara geldi.`,
    commentary: generateCommentary('SUBSTITUTION', {
      player: `${playerIn.player.firstName} ${playerIn.player.lastName}`,
      team: team.club.name,
      minute,
    }),
    isImportant: false,
  };

  return {
    success: true,
    message: 'Oyuncu değişikliği başarıyla gerçekleştirildi.',
    event,
  };
}
