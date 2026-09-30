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

    let rating = 6.4;

    // Minutes played contribution
    if (pim.minutesPlayed >= 60) rating += 0.10;

    const isForward = ['ST', 'AML', 'AMR'].includes(pim.currentPosition);
    const isMidfielder = ['AMC', 'MC', 'DMC', 'ML', 'MR'].includes(pim.currentPosition);
    const isDefender = ['DC', 'DR', 'DL'].includes(pim.currentPosition);
    const isGK = pim.currentPosition === 'GK';

    // Goals & Assists
    rating += pim.goals * (isDefender ? 1.10 : isMidfielder ? 0.95 : 0.80);
    rating += pim.assists * 0.45;

    // Key passes / chances created
    if (pim.keyPasses) {
      rating += pim.keyPasses * 0.15;
    }

    // Shots and efficiency
    rating += pim.shotsOnTarget * 0.08;
    if (pim.shots >= 4 && pim.goals === 0 && pim.shotsOnTarget === 0) {
      rating -= 0.15; // wasteful shooting
    }

    // Goalkeeper Saves & clean sheet
    if (isGK) {
      rating += pim.saves * 0.28;
      if (goalsConceded === 0 && pim.minutesPlayed >= 75) {
        rating += 0.40; // Clean sheet bonus
      }
    }

    // Defensive actions (tackles, interceptions, blocks)
    rating += (pim.tacklesWon || 0) * 0.12;
    rating += (pim.interceptions || 0) * 0.10;
    if (pim.blocks) {
      rating += pim.blocks * 0.12;
    }

    // Passing accuracy
    if (pim.passesAttempted > 8) {
      const accuracy = pim.passesCompleted / pim.passesAttempted;
      if (accuracy > 0.88) rating += 0.25;
      else if (accuracy < 0.65) rating -= 0.22;
    }

    // Defensive unit clean sheet / goals conceded
    if (isDefender) {
      if (goalsConceded === 0 && pim.minutesPlayed >= 75) {
        rating += 0.35; // Clean sheet bonus
      } else {
        rating -= goalsConceded * 0.18;
      }
    } else if (isGK) {
      rating -= goalsConceded * 0.22;
    }

    // Fouls & Discipline penalties
    if (pim.foulsCommitted >= 3) rating -= 0.12;
    if (pim.yellowCards > 0) rating -= 0.30;
    if (pim.redCards > 0) rating -= 1.50;

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
