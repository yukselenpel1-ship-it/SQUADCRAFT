import { Club, Player, Fixture, LeagueStanding } from '@/types/game';

/**
 * Simulates a realistic competitive league match between two AI clubs.
 */
export function simulateAIFixture(
  fixture: Fixture,
  allClubs: Club[],
  allPlayers: Player[]
): Fixture {
  if (fixture.status === 'FINISHED') return fixture;

  const homeClub = allClubs.find((c) => c.id === fixture.homeClubId);
  const awayClub = allClubs.find((c) => c.id === fixture.awayClubId);

  const homePlayers = allPlayers.filter((p) => p.clubId === fixture.homeClubId);
  const awayPlayers = allPlayers.filter((p) => p.clubId === fixture.awayClubId);

  // Compute team ratings (overall average + reputation)
  const homeAvgOvr = homePlayers.length > 0
    ? homePlayers.slice(0, 15).reduce((acc, p) => acc + p.overall, 0) / Math.min(15, homePlayers.length)
    : 75;
  const awayAvgOvr = awayPlayers.length > 0
    ? awayPlayers.slice(0, 15).reduce((acc, p) => acc + p.overall, 0) / Math.min(15, awayPlayers.length)
    : 75;

  const homeRep = homeClub?.reputation || 75;
  const awayRep = awayClub?.reputation || 75;

  // Home advantage factor (+3-4 points)
  const homePower = homeAvgOvr * 0.6 + homeRep * 0.4 + 3.5;
  const awayPower = awayAvgOvr * 0.6 + awayRep * 0.4;
  const powerDiff = (homePower - awayPower) / 10; // e.g. +0.5 to -0.5

  // Expected goals (xG) calibrated for authentic league distribution:
  // Target: ~2.55-2.65 avg goals per match, 46-48% Over 2.5, 52-54% Under 2.5
  const homeExpected = Math.max(0.4, Math.min(3.2, 1.42 + powerDiff * 0.72 + (Math.random() * 0.36 - 0.18)));
  const awayExpected = Math.max(0.3, Math.min(2.8, 1.14 - powerDiff * 0.65 + (Math.random() * 0.36 - 0.18)));

  // Poisson-like sample
  const sampleGoals = (lambda: number) => {
    let l = Math.exp(-lambda);
    let k = 0;
    let p = 1.0;
    do {
      k++;
      p *= Math.random();
    } while (p > l);
    return Math.min(6, k - 1);
  };

  const homeScore = sampleGoals(homeExpected);
  const awayScore = sampleGoals(awayExpected);

  // Pick goal scorers
  const pickScorer = (players: Player[]): Player | undefined => {
    if (players.length === 0) return undefined;
    const forwards = players.filter((p) => ['ST', 'AML', 'AMR', 'AMC'].includes(p.position));
    const pool = forwards.length > 0 && Math.random() < 0.85 ? forwards : players;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const events: any[] = [];

  // Home Goals
  for (let g = 0; g < homeScore; g++) {
    const minute = Math.floor(Math.random() * 88) + 2;
    const scorer = pickScorer(homePlayers);
    events.push({
      id: `ev-h-${fixture.id}-${g}-${minute}`,
      minute,
      type: 'GOAL',
      teamId: fixture.homeClubId,
      playerId: scorer?.id || '',
      playerName: scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : 'Gol',
      description: `GOL! ${scorer ? `${scorer.firstName} ${scorer.lastName}` : 'Oyuncu'} takımını öne geçiren golü kaydetti.`,
    });
  }

  // Away Goals
  for (let g = 0; g < awayScore; g++) {
    const minute = Math.floor(Math.random() * 88) + 2;
    const scorer = pickScorer(awayPlayers);
    events.push({
      id: `ev-a-${fixture.id}-${g}-${minute}`,
      minute,
      type: 'GOAL',
      teamId: fixture.awayClubId,
      playerId: scorer?.id || '',
      playerName: scorer ? `${scorer.firstName[0]}. ${scorer.lastName}` : 'Gol',
      description: `GOL! ${scorer ? `${scorer.firstName} ${scorer.lastName}` : 'Oyuncu'} fileleri havalandırdı.`,
    });
  }

  // Sort events by minute
  events.sort((a, b) => a.minute - b.minute);

  // Generate realistic stats
  const homeShots = Math.max(homeScore + 2, Math.round(homeExpected * 4 + Math.random() * 6));
  const awayShots = Math.max(awayScore + 2, Math.round(awayExpected * 4 + Math.random() * 6));
  const homeShotsOnTarget = Math.min(homeShots, Math.max(homeScore, Math.round(homeShots * 0.45 + Math.random() * 2)));
  const awayShotsOnTarget = Math.min(awayShots, Math.max(awayScore, Math.round(awayShots * 0.45 + Math.random() * 2)));

  const basePoss = 50 + Math.round(powerDiff * 8 + (Math.random() * 8 - 4));
  const homePoss = Math.max(35, Math.min(65, basePoss));
  const awayPoss = 100 - homePoss;

  return {
    ...fixture,
    status: 'FINISHED',
    homeScore,
    awayScore,
    events,
    stats: {
      possession: [homePoss, awayPoss],
      shots: [homeShots, awayShots],
      shotsOnTarget: [homeShotsOnTarget, awayShotsOnTarget],
      corners: [Math.floor(Math.random() * 7) + 2, Math.floor(Math.random() * 6) + 2],
      fouls: [Math.floor(Math.random() * 10) + 6, Math.floor(Math.random() * 10) + 6],
      yellowCards: [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)],
      redCards: [Math.random() < 0.04 ? 1 : 0, Math.random() < 0.04 ? 1 : 0],
      passAccuracy: [Math.floor(Math.random() * 12) + 78, Math.floor(Math.random() * 12) + 76],
      xg: [Number(homeExpected.toFixed(2)), Number(awayExpected.toFixed(2))],
    },
  };
}

/**
 * Updates a standings array with the outcome of a finished match.
 */
export function applyMatchToStandings(
  standings: LeagueStanding[],
  homeClubId: string,
  awayClubId: string,
  homeScore: number,
  awayScore: number
): LeagueStanding[] {
  const isHomeWin = homeScore > awayScore;
  const isDraw = homeScore === awayScore;
  const isAwayWin = awayScore > homeScore;

  const updated = standings.map((st) => {
    if (st.clubId === homeClubId) {
      const pts = isHomeWin ? 3 : isDraw ? 1 : 0;
      const formChar: 'W' | 'D' | 'L' = isHomeWin ? 'W' : isDraw ? 'D' : 'L';
      return {
        ...st,
        played: st.played + 1,
        won: st.won + (isHomeWin ? 1 : 0),
        drawn: st.drawn + (isDraw ? 1 : 0),
        lost: st.lost + (isAwayWin ? 1 : 0),
        goalsFor: st.goalsFor + homeScore,
        goalsAgainst: st.goalsAgainst + awayScore,
        goalDifference: st.goalDifference + (homeScore - awayScore),
        points: st.points + pts,
        form: [...st.form.slice(-4), formChar],
      };
    }
    if (st.clubId === awayClubId) {
      const pts = isAwayWin ? 3 : isDraw ? 1 : 0;
      const formChar: 'W' | 'D' | 'L' = isAwayWin ? 'W' : isDraw ? 'D' : 'L';
      return {
        ...st,
        played: st.played + 1,
        won: st.won + (isAwayWin ? 1 : 0),
        drawn: st.drawn + (isDraw ? 1 : 0),
        lost: st.lost + (isHomeWin ? 1 : 0),
        goalsFor: st.goalsFor + awayScore,
        goalsAgainst: st.goalsAgainst + homeScore,
        goalDifference: st.goalDifference + (awayScore - homeScore),
        points: st.points + pts,
        form: [...st.form.slice(-4), formChar],
      };
    }
    return st;
  });

  // Re-sort: points -> goalDifference -> goalsFor
  updated.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return updated.map((st, i) => ({ ...st, rank: i + 1 }));
}

/**
 * Simulates all pending AI matches up to a specific date or within a round.
 */
export function simulatePendingAIMatches(
  fixtures: Fixture[],
  standings: LeagueStanding[],
  allClubs: Club[],
  allPlayers: Player[],
  userClubId: string,
  options: { maxDate?: string; roundNumber?: number }
): {
  updatedFixtures: Fixture[];
  updatedStandings: LeagueStanding[];
  simulatedFixtures: Fixture[];
} {
  let currentStandings = [...standings];
  const simulatedFixtures: Fixture[] = [];

  const updatedFixtures = fixtures.map((f) => {
    // Only simulate scheduled AI-vs-AI matches
    if (f.status !== 'SCHEDULED') return f;
    if (f.homeClubId === userClubId || f.awayClubId === userClubId) return f;

    let shouldSimulate = false;
    if (options.roundNumber !== undefined && f.round === options.roundNumber) {
      shouldSimulate = true;
    } else if (options.maxDate && f.date <= options.maxDate) {
      shouldSimulate = true;
    }

    if (shouldSimulate) {
      const simulated = simulateAIFixture(f, allClubs, allPlayers);
      simulatedFixtures.push(simulated);
      currentStandings = applyMatchToStandings(
        currentStandings,
        simulated.homeClubId,
        simulated.awayClubId,
        simulated.homeScore || 0,
        simulated.awayScore || 0
      );
      return simulated;
    }

    return f;
  });

  return {
    updatedFixtures,
    updatedStandings: currentStandings,
    simulatedFixtures,
  };
}
