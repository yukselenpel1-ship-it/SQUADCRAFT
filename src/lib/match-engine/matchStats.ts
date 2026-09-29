import { PlayerInMatch, TeamMatchStats } from './types';

export function createEmptyTeamStats(): TeamMatchStats {
  return {
    shots: 0,
    shotsOnTarget: 0,
    xG: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
    passes: 0,
    completedPasses: 0,
    saves: 0,
    offsides: 0,
  };
}

export function updatePlayerMatchRatings(
  players: Record<string, PlayerInMatch>,
  goalsConceded: number
): void {
  Object.values(players).forEach((pim) => {
    if (!pim.isStartingXI && pim.minutesPlayed === 0) return;

    let rating = 6.5;

    // Goals & Assists
    rating += pim.goals * 0.85;
    rating += pim.assists * 0.50;

    // Saves
    rating += pim.saves * 0.25;

    // Shots on target & attempts
    rating += pim.shotsOnTarget * 0.08;

    // Tackles & Interceptions
    rating += (pim.tacklesWon || 0) * 0.12;
    rating += (pim.interceptions || 0) * 0.10;

    // Passing
    if (pim.passesAttempted > 8) {
      const accuracy = pim.passesCompleted / pim.passesAttempted;
      if (accuracy > 0.88) rating += 0.25;
      else if (accuracy < 0.65) rating -= 0.20;
    }

    // Defensive penalties
    const isDefensive = ['GK', 'DR', 'DC', 'DL', 'DMC'].includes(pim.currentPosition);
    if (isDefensive) {
      rating -= goalsConceded * 0.15;
    }

    // Discipline penalties
    if (pim.yellowCards > 0) rating -= 0.30;
    if (pim.redCards > 0) rating -= 1.40;

    // Clamp rating between 4.0 and 10.0
    pim.matchRating = Number(Math.max(4.0, Math.min(10.0, rating)).toFixed(1));
  });
}

export function findManOfTheMatch(
  homePlayers: Record<string, PlayerInMatch>,
  awayPlayers: Record<string, PlayerInMatch>
): PlayerInMatch {
  const allInMatch = [...Object.values(homePlayers), ...Object.values(awayPlayers)].filter(
    (p) => p.minutesPlayed > 15
  );

  if (allInMatch.length === 0) {
    return Object.values(homePlayers)[0];
  }

  return allInMatch.reduce((best, current) => {
    if (current.matchRating > best.matchRating) return current;
    if (current.matchRating === best.matchRating && current.goals > best.goals) return current;
    return best;
  }, allInMatch[0]);
}
