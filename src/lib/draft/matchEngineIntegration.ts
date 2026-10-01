import { Club, Player, ClubTactics, TacticalSettings, Formation } from '@/types/game';
import { MatchEngine } from '../match-engine/engine';
import { MatchEngineEvent } from '../match-engine/types';
import { DraftClub, DraftFixture, DraftStanding, LeagueAwards } from './types';
import { generateDefaultDraftTactics } from './draftEngine';

/**
 * Converts a DraftClub into a Club model compatible with MatchEngine.
 */
export function draftClubToClub(draftClub: DraftClub): Club {
  return {
    id: draftClub.id,
    name: draftClub.name,
    shortName: draftClub.name,
    code: draftClub.code,
    city: 'Draft Şehri',
    stadium: `${draftClub.name} Park`,
    stadiumCapacity: 35000,
    reputation: 75,
    balance: 10000000,
    transferBudget: 5000000,
    wageBudget: 150000,
    weeklyWageExpense: 100000,
    primaryColor: draftClub.primaryColor,
    secondaryColor: draftClub.secondaryColor,
    managerName: draftClub.managerName,
    foundedYear: 2026,
  };
}

/**
 * Extracts tactical settings from ClubTactics.
 */
function extractTacticalSettings(tactics?: ClubTactics): TacticalSettings {
  return tactics?.settings || {
    mentality: 'Dengeli',
    tempo: 'Standart',
    pressing: 'Orta',
    passingStyle: 'Kısa',
    defensiveLine: 'Standart',
    width: 'Dengeli',
  };
}

/**
 * Simulates a Draft League fixture server-side using the Match Engine.
 */
export function simulateDraftFixture(
  fixture: DraftFixture,
  homeClub: DraftClub,
  awayClub: DraftClub,
  homeTactics?: ClubTactics,
  awayTactics?: ClubTactics,
  playerPool: Player[] = [],
  serverNonce: string = 'server-v055'
): { updatedFixture: DraftFixture; matchResult: any } {
  const seed = `${fixture.roomId}-${fixture.id}-${serverNonce}`;

  const homeClubModel = draftClubToClub(homeClub);
  const awayClubModel = draftClubToClub(awayClub);

  const homePlayers = playerPool.filter((p) => homeClub.squadPlayerIds.includes(p.id));
  const awayPlayers = playerPool.filter((p) => awayClub.squadPlayerIds.includes(p.id));

  const resolvedHomeTactics =
    homeTactics ||
    fixture.homeTactics ||
    homeClub.tactics ||
    generateDefaultDraftTactics(homeClub.id, homeClub.squadPlayerIds, playerPool);
  const resolvedAwayTactics =
    awayTactics ||
    fixture.awayTactics ||
    awayClub.tactics ||
    generateDefaultDraftTactics(awayClub.id, awayClub.squadPlayerIds, playerPool);

  const homeStartingIds = (resolvedHomeTactics?.lineup || [])
    .map((slot) => slot.playerId)
    .filter(Boolean) as string[];
  const awayStartingIds = (resolvedAwayTactics?.lineup || [])
    .map((slot) => slot.playerId)
    .filter(Boolean) as string[];

  const engine = new MatchEngine(
    homeClubModel,
    awayClubModel,
    homePlayers,
    awayPlayers,
    extractTacticalSettings(resolvedHomeTactics),
    extractTacticalSettings(resolvedAwayTactics),
    (resolvedHomeTactics?.formation as Formation) || '4-3-3',
    (resolvedAwayTactics?.formation as Formation) || '4-3-3',
    homeStartingIds.length >= 7 ? homeStartingIds : undefined,
    awayStartingIds.length >= 7 ? awayStartingIds : undefined,
    fixture.id,
    { isCompetitive: true, enableHomeAdvantage: true, homeAdvantageMultiplier: 1.05 }
  );

  const matchState = engine.simulateFullMatch();

  const updatedFixture: DraftFixture = {
    ...fixture,
    status: 'COMPLETED',
    homeTactics: resolvedHomeTactics,
    awayTactics: resolvedAwayTactics,
    homeScore: matchState.homeScore,
    awayScore: matchState.awayScore,
    matchResult: matchState,
    seed,
    simulatedAt: new Date().toISOString(),
  };

  return { updatedFixture, matchResult: matchState };
}

/**
 * Recomputes Draft League Standings from scratch from all completed fixtures.
 * Idempotent, robust, and immune to stale database rows or multiple simulation triggers.
 */
export function computeStandingsFromFixtures(
  clubs: DraftClub[],
  fixtures: DraftFixture[]
): DraftStanding[] {
  let standings: DraftStanding[] = clubs.map((club, idx) => ({
    rank: idx + 1,
    clubId: club.id,
    clubName: club.name,
    clubCode: club.code,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));

  // Deduplicate by fixture ID, keeping the latest completed version
  const uniqueFixtureMap = new Map<string, DraftFixture>();
  for (const f of fixtures) {
    if (!uniqueFixtureMap.has(f.id)) {
      uniqueFixtureMap.set(f.id, f);
    } else {
      const existing = uniqueFixtureMap.get(f.id)!;
      const isFCompleted = (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') && f.homeScore !== undefined && f.awayScore !== undefined;
      const isExistingCompleted = (existing.status === 'COMPLETED' || (existing.status as string) === 'FINISHED') && existing.homeScore !== undefined && existing.awayScore !== undefined;
      if (isFCompleted && !isExistingCompleted) {
        uniqueFixtureMap.set(f.id, f);
      }
    }
  }

  const completed = Array.from(uniqueFixtureMap.values()).filter(
    (f) =>
      (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') &&
      f.homeScore !== undefined &&
      f.awayScore !== undefined
  );

  // Sort completed fixtures by round / date to ensure chronological form
  const sortedCompleted = [...completed].sort((a, b) => a.round - b.round);

  for (const fixture of sortedCompleted) {
    const { homeClubId, awayClubId, homeScore, awayScore } = fixture;
    if (homeScore === undefined || awayScore === undefined) continue;

    standings = standings.map((item) => {
      if (item.clubId === homeClubId) {
        const isWin = homeScore > awayScore;
        const isDraw = homeScore === awayScore;
        const isLoss = homeScore < awayScore;
        return {
          ...item,
          played: item.played + 1,
          won: item.won + (isWin ? 1 : 0),
          drawn: item.drawn + (isDraw ? 1 : 0),
          lost: item.lost + (isLoss ? 1 : 0),
          goalsFor: item.goalsFor + homeScore,
          goalsAgainst: item.goalsAgainst + awayScore,
          goalDifference: item.goalDifference + (homeScore - awayScore),
          points: item.points + (isWin ? 3 : isDraw ? 1 : 0),
          form: [...item.form, isWin ? ('W' as const) : isDraw ? ('D' as const) : ('L' as const)].slice(-5),
        };
      }

      if (item.clubId === awayClubId) {
        const isWin = awayScore > homeScore;
        const isDraw = homeScore === awayScore;
        const isLoss = awayScore < homeScore;
        return {
          ...item,
          played: item.played + 1,
          won: item.won + (isWin ? 1 : 0),
          drawn: item.drawn + (isDraw ? 1 : 0),
          lost: item.lost + (isLoss ? 1 : 0),
          goalsFor: item.goalsFor + awayScore,
          goalsAgainst: item.goalsAgainst + homeScore,
          goalDifference: item.goalDifference + (awayScore - homeScore),
          points: item.points + (isWin ? 3 : isDraw ? 1 : 0),
          form: [...item.form, isWin ? ('W' as const) : isDraw ? ('D' as const) : ('L' as const)].slice(-5),
        };
      }

      return item;
    });
  }

  // Sort standings: Points desc, GD desc, GF desc
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Updates Draft League Standings based on a newly completed fixture.
 */
export function updateDraftStandings(
  standings: DraftStanding[],
  fixture: DraftFixture
): DraftStanding[] {
  if (fixture.status !== 'COMPLETED' || fixture.homeScore === undefined || fixture.awayScore === undefined) {
    return standings;
  }

  const { homeClubId, awayClubId, homeScore, awayScore } = fixture;

  const updated = standings.map((item) => {
    if (item.clubId === homeClubId) {
      const isWin = homeScore > awayScore;
      const isDraw = homeScore === awayScore;
      const isLoss = homeScore < awayScore;
      return {
        ...item,
        played: item.played + 1,
        won: item.won + (isWin ? 1 : 0),
        drawn: item.drawn + (isDraw ? 1 : 0),
        lost: item.lost + (isLoss ? 1 : 0),
        goalsFor: item.goalsFor + homeScore,
        goalsAgainst: item.goalsAgainst + awayScore,
        goalDifference: item.goalDifference + (homeScore - awayScore),
        points: item.points + (isWin ? 3 : isDraw ? 1 : 0),
        form: [...item.form, isWin ? ('W' as const) : isDraw ? ('D' as const) : ('L' as const)].slice(-5),
      };
    }

    if (item.clubId === awayClubId) {
      const isWin = awayScore > homeScore;
      const isDraw = homeScore === awayScore;
      const isLoss = awayScore < homeScore;
      return {
        ...item,
        played: item.played + 1,
        won: item.won + (isWin ? 1 : 0),
        drawn: item.drawn + (isDraw ? 1 : 0),
        lost: item.lost + (isLoss ? 1 : 0),
        goalsFor: item.goalsFor + awayScore,
        goalsAgainst: item.goalsAgainst + homeScore,
        goalDifference: item.goalDifference + (awayScore - homeScore),
        points: item.points + (isWin ? 3 : isDraw ? 1 : 0),
        form: [...item.form, isWin ? ('W' as const) : isDraw ? ('D' as const) : ('L' as const)].slice(-5),
      };
    }

    return item;
  });

  // Sort standings: Points desc, GD desc, GF desc
  updated.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return updated.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * Computes end of season individual and team awards for the completed draft league.
 */
export function computeLeagueAwards(
  standings: DraftStanding[],
  fixtures: DraftFixture[],
  clubs: DraftClub[],
  playerPool: Player[]
): LeagueAwards {
  const champion = standings[0];
  const goalCounts: Record<string, { count: number; clubId: string }> = {};
  const assistCounts: Record<string, { count: number; clubId: string }> = {};
  const ratingsTotal: Record<string, { sum: number; matches: number; clubId: string }> = {};
  const cleanSheets: Record<string, { count: number; clubId: string }> = {};

  let highestScoringMatch: LeagueAwards['highestScoringMatch'];
  let maxTotalGoals = -1;

  let biggestWin: LeagueAwards['biggestWin'];
  let maxGoalDiff = -1;

  fixtures.forEach((f) => {
    if (f.status === 'COMPLETED' && f.homeScore !== undefined && f.awayScore !== undefined) {
      const totalGoals = f.homeScore + f.awayScore;
      const homeClub = clubs.find((c) => c.id === f.homeClubId);
      const awayClub = clubs.find((c) => c.id === f.awayClubId);

      if (totalGoals > maxTotalGoals && homeClub && awayClub) {
        maxTotalGoals = totalGoals;
        highestScoringMatch = {
          homeName: homeClub.name,
          awayName: awayClub.name,
          score: `${f.homeScore} - ${f.awayScore}`,
          totalGoals,
        };
      }

      const diff = Math.abs(f.homeScore - f.awayScore);
      if (diff > maxGoalDiff && homeClub && awayClub) {
        maxGoalDiff = diff;
        const winner = f.homeScore > f.awayScore ? homeClub : awayClub;
        const loser = f.homeScore > f.awayScore ? awayClub : homeClub;
        biggestWin = {
          winnerName: winner.name,
          loserName: loser.name,
          score: `${Math.max(f.homeScore, f.awayScore)} - ${Math.min(f.homeScore, f.awayScore)}`,
          goalDiff: diff,
        };
      }

      // Tally goals, assists, and ratings from events/matchResult
      if (f.matchResult) {
        // Goals and assists from match events
        f.matchResult.events.forEach((ev: MatchEngineEvent) => {
          if (ev.type === 'GOAL') {
            if (ev.playerId) {
              if (!goalCounts[ev.playerId]) goalCounts[ev.playerId] = { count: 0, clubId: ev.teamId || f.homeClubId };
              goalCounts[ev.playerId].count += 1;
            }
            const assistId = ev.secondaryPlayerId || (ev as any).assistPlayerId;
            if (assistId) {
              if (!assistCounts[assistId]) assistCounts[assistId] = { count: 0, clubId: ev.teamId || f.homeClubId };
              assistCounts[assistId].count += 1;
            }
          }
        });

        // Ratings from match players
        if (f.matchResult.home?.players) {
          Object.values(f.matchResult.home.players as Record<string, any>).forEach((p: any) => {
            const pId = p.player?.id || p.id;
            if (pId && p.matchRating) {
              if (!ratingsTotal[pId]) ratingsTotal[pId] = { sum: 0, matches: 0, clubId: f.homeClubId };
              ratingsTotal[pId].sum += p.matchRating;
              ratingsTotal[pId].matches += 1;
            }
          });
        }
        if (f.matchResult.away?.players) {
          Object.values(f.matchResult.away.players as Record<string, any>).forEach((p: any) => {
            const pId = p.player?.id || p.id;
            if (pId && p.matchRating) {
              if (!ratingsTotal[pId]) ratingsTotal[pId] = { sum: 0, matches: 0, clubId: f.awayClubId };
              ratingsTotal[pId].sum += p.matchRating;
              ratingsTotal[pId].matches += 1;
            }
          });
        }

        // Clean sheets for GKs
        if (f.awayScore === 0) {
          const homeGkId = f.homeTactics?.lineup?.[0]?.playerId || 
            (f.matchResult?.home?.players ? Object.values(f.matchResult.home.players as Record<string, any>).find((p: any) => p.currentPosition === 'GK' || p.player?.primaryPosition === 'GK')?.player?.id : undefined);
          if (homeGkId) {
            if (!cleanSheets[homeGkId]) cleanSheets[homeGkId] = { count: 0, clubId: f.homeClubId };
            cleanSheets[homeGkId].count += 1;
          }
        }
        if (f.homeScore === 0) {
          const awayGkId = f.awayTactics?.lineup?.[0]?.playerId || 
            (f.matchResult?.away?.players ? Object.values(f.matchResult.away.players as Record<string, any>).find((p: any) => p.currentPosition === 'GK' || p.player?.primaryPosition === 'GK')?.player?.id : undefined);
          if (awayGkId) {
            if (!cleanSheets[awayGkId]) cleanSheets[awayGkId] = { count: 0, clubId: f.awayClubId };
            cleanSheets[awayGkId].count += 1;
          }
        }
      }
    }
  });

  // Top scorer
  let topScorer: LeagueAwards['topScorer'];
  let maxGoals = 0;
  Object.entries(goalCounts).forEach(([pId, data]) => {
    if (data.count > maxGoals) {
      maxGoals = data.count;
      const player = playerPool.find((p) => p.id === pId);
      const club = clubs.find((c) => c.id === data.clubId) || clubs.find((c) => c.squadPlayerIds.includes(pId));
      if (player) {
        topScorer = {
          playerId: pId,
          playerName: `${player.firstName} ${player.lastName}`,
          clubName: club?.name || 'Kulüp',
          goals: data.count,
          assists: assistCounts[pId]?.count || 0,
        };
      }
    }
  });

  // Top assists
  let topAssists: LeagueAwards['topAssists'];
  let maxAssists = 0;
  Object.entries(assistCounts).forEach(([pId, data]) => {
    if (data.count > maxAssists) {
      maxAssists = data.count;
      const player = playerPool.find((p) => p.id === pId);
      const club = clubs.find((c) => c.id === data.clubId) || clubs.find((c) => c.squadPlayerIds.includes(pId));
      if (player) {
        topAssists = {
          playerId: pId,
          playerName: `${player.firstName} ${player.lastName}`,
          clubName: club?.name || 'Kulüp',
          assists: data.count,
        };
      }
    }
  });

  // Best rating (min 1 match)
  let bestRating: LeagueAwards['bestRating'];
  let maxAvgRating = 0;
  Object.entries(ratingsTotal).forEach(([pId, data]) => {
    if (data.matches >= 1) {
      const avg = Number((data.sum / data.matches).toFixed(2));
      if (avg > maxAvgRating) {
        maxAvgRating = avg;
        const player = playerPool.find((p) => p.id === pId);
        const club = clubs.find((c) => c.id === data.clubId) || clubs.find((c) => c.squadPlayerIds.includes(pId));
        if (player) {
          bestRating = {
            playerId: pId,
            playerName: `${player.firstName} ${player.lastName}`,
            clubName: club?.name || 'Kulüp',
            rating: avg,
          };
        }
      }
    }
  });

  // Best Goalkeeper (clean sheets)
  let bestGoalkeeper: LeagueAwards['bestGoalkeeper'];
  let maxCleanSheets = 0;
  Object.entries(cleanSheets).forEach(([pId, data]) => {
    if (data.count > maxCleanSheets) {
      maxCleanSheets = data.count;
      const player = playerPool.find((p) => p.id === pId);
      const club = clubs.find((c) => c.id === data.clubId) || clubs.find((c) => c.squadPlayerIds.includes(pId));
      if (player) {
        bestGoalkeeper = {
          playerId: pId,
          playerName: `${player.firstName} ${player.lastName}`,
          clubName: club?.name || 'Kulüp',
          cleanSheets: data.count,
        };
      }
    }
  });

  // Best Attack & Defense from standings
  let bestAttack: LeagueAwards['bestAttack'];
  let bestDefense: LeagueAwards['bestDefense'];

  if (standings.length > 0) {
    const sortedByGF = [...standings].sort((a, b) => b.goalsFor - a.goalsFor);
    const sortedByGA = [...standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst);
    bestAttack = { clubName: sortedByGF[0].clubName, goalsFor: sortedByGF[0].goalsFor };
    bestDefense = { clubName: sortedByGA[0].clubName, goalsAgainst: sortedByGA[0].goalsAgainst };
  }

  return {
    championClubId: champion?.clubId || '',
    championClubName: champion?.clubName || 'Bilinmeyen Kulüp',
    topScorer,
    topAssists,
    bestRating,
    bestGoalkeeper,
    highestScoringMatch,
    biggestWin,
    bestAttack,
    bestDefense,
  };
}
