import { Player } from '@/types/game';

export function processMatchSuspension(player: Player, matchesPassed: number = 1): Player {
  if (!player.isSuspended || !player.suspensionDetails) {
    return player;
  }

  const remaining = player.suspensionDetails.matchesRemaining - matchesPassed;

  if (remaining <= 0) {
    return {
      ...player,
      isSuspended: false,
      suspensionDetails: undefined,
    };
  }

  return {
    ...player,
    suspensionDetails: {
      ...player.suspensionDetails,
      matchesRemaining: remaining,
    },
  };
}
