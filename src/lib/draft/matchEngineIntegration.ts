import { Club, Player, ClubTactics, TacticalSettings, Formation } from '@/types/game';
import { MatchEngine } from '../match-engine/engine';
import { MatchEngineEvent } from '../match-engine/types';
import {
  DraftClub,
  DraftFixture,
  DraftStanding,
  LeagueAwards,
  PlayerSeasonStats,
  SeasonLeaderboards,
  PastSeasonHistory,
} from './types';
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
 * Reliably derives the integer season number for any fixture.
 * Resolves strictly in order:
 * 1. Explicit fixture.seasonNumber (> 0)
 * 2. Database column fixture.season_number (> 0)
 * 3. Fixture ID format: fix-{roomId}-s{seasonNumber}-r{round}-{idx}
 * 4. Fallback: 1 (legacy un-versioned fixtures)
 */
export function extractFixtureSeasonNumber(f: { id?: string; seasonNumber?: number; season_number?: number }): number {
  if (typeof f?.seasonNumber === 'number' && f.seasonNumber > 0) return f.seasonNumber;
  if (typeof f?.season_number === 'number' && f.season_number > 0) return f.season_number;
  if (typeof f?.id === 'string') {
    const sMatch = f.id.match(/-s(\d+)-/);
    if (sMatch) {
      const parsed = parseInt(sMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return 1;
}

/**
 * Recomputes Draft League Standings from scratch from all completed fixtures.
 * Idempotent, robust, and immune to stale database rows or multiple simulation triggers.
 */
export function computeStandingsFromFixtures(
  clubs: DraftClub[],
  fixtures: DraftFixture[],
  seasonNumber?: number
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
    if (!f || !f.id) continue;
    const fSeason = extractFixtureSeasonNumber(f);
    if (seasonNumber && fSeason !== seasonNumber) continue;

    if (!uniqueFixtureMap.has(f.id)) {
      uniqueFixtureMap.set(f.id, { ...f, seasonNumber: fSeason });
    } else {
      const existing = uniqueFixtureMap.get(f.id)!;
      const isFCompleted = (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') && f.homeScore !== undefined && f.awayScore !== undefined;
      const isExistingCompleted = (existing.status === 'COMPLETED' || (existing.status as string) === 'FINISHED') && existing.homeScore !== undefined && existing.awayScore !== undefined;
      if (isFCompleted && !isExistingCompleted) {
        uniqueFixtureMap.set(f.id, { ...f, seasonNumber: fSeason });
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
 * Computes individual player statistics aggregated across all completed fixtures for a given season.
 * Real, verified match engine statistics (goals, assists, minutes, ratings, cards, saves, clean sheets).
 */
export function computeSeasonPlayerStats(
  fixtures: DraftFixture[],
  clubs: DraftClub[],
  playerPool: Player[],
  seasonNumber?: number
): {
  playerStats: Record<string, PlayerSeasonStats>;
  topScorers: PlayerSeasonStats[];
  topAssists: PlayerSeasonStats[];
  bestRatings: PlayerSeasonStats[];
} {
  // Deduplicate completed fixtures
  const uniqueFixtureMap = new Map<string, DraftFixture>();
  for (const f of fixtures) {
    if (!f || !f.id) continue;
    const fSeason = extractFixtureSeasonNumber(f);
    if (seasonNumber && fSeason !== seasonNumber) continue;

    if (!uniqueFixtureMap.has(f.id)) {
      uniqueFixtureMap.set(f.id, { ...f, seasonNumber: fSeason });
    } else {
      const existing = uniqueFixtureMap.get(f.id)!;
      const isFCompleted =
        (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') &&
        f.homeScore !== undefined &&
        f.awayScore !== undefined;
      const isExistingCompleted =
        (existing.status === 'COMPLETED' || (existing.status as string) === 'FINISHED') &&
        existing.homeScore !== undefined &&
        existing.awayScore !== undefined;
      if (isFCompleted && !isExistingCompleted) {
        uniqueFixtureMap.set(f.id, { ...f, seasonNumber: fSeason });
      }
    }
  }

  const completed = Array.from(uniqueFixtureMap.values()).filter(
    (f) =>
      (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') &&
      f.homeScore !== undefined &&
      f.awayScore !== undefined
  );

  const playerPoolMap = new Map<string, Player>();
  playerPool.forEach((p) => playerPoolMap.set(p.id, p));

  const clubMap = new Map<string, DraftClub>();
  clubs.forEach((c) => clubMap.set(c.id, c));

  // Intermediate accumulator
  const statsAcc: Record<
    string,
    {
      playerId: string;
      playerName: string;
      clubId: string;
      clubName: string;
      position: string;
      appearances: number;
      totalMinutes: number;
      goals: number;
      assists: number;
      totalRatingSum: number;
      yellowCards: number;
      redCards: number;
      shots: number;
      shotsOnTarget: number;
      saves: number;
      cleanSheets: number;
    }
  > = {};

  const getOrCreateAcc = (playerId: string, clubId: string): typeof statsAcc[string] => {
    if (!statsAcc[playerId]) {
      const pl = playerPoolMap.get(playerId);
      const cl = clubMap.get(clubId);
      const fullName = pl ? `${pl.firstName} ${pl.lastName}`.trim() : playerId;
      statsAcc[playerId] = {
        playerId,
        playerName: fullName,
        clubId,
        clubName: cl?.name || 'Kulüp',
        position: pl?.position || 'MC',
        appearances: 0,
        totalMinutes: 0,
        goals: 0,
        assists: 0,
        totalRatingSum: 0,
        yellowCards: 0,
        redCards: 0,
        shots: 0,
        shotsOnTarget: 0,
        saves: 0,
        cleanSheets: 0,
      };
    }
    return statsAcc[playerId];
  };

  for (const f of completed) {
    const homeScore = f.homeScore ?? 0;
    const awayScore = f.awayScore ?? 0;
    const fixtureParticipated = new Set<string>();

    if (f.matchResult) {
      // 1. Process home team player stats from matchResult
      if (f.matchResult.home?.players) {
        Object.values(f.matchResult.home.players as Record<string, any>).forEach((pim: any) => {
          const pId = pim.player?.id || pim.id;
          if (!pId) return;
          const mins = typeof pim.minutesPlayed === 'number' && pim.minutesPlayed > 0 ? pim.minutesPlayed : (pim.isStartingXI ? 90 : 0);
          if (mins <= 0 && !pim.isStartingXI && !pim.isOnPitch) return;

          fixtureParticipated.add(pId);
          const acc = getOrCreateAcc(pId, f.homeClubId);
          acc.appearances += 1;
          acc.totalMinutes += mins;
          acc.goals += pim.goals || 0;
          acc.assists += pim.assists || 0;
          acc.totalRatingSum += typeof pim.matchRating === 'number' ? pim.matchRating : 6.5;
          acc.yellowCards += pim.yellowCards || 0;
          acc.redCards += pim.redCards || 0;
          acc.shots += pim.shots || 0;
          acc.shotsOnTarget += pim.shotsOnTarget || 0;
          acc.saves += pim.saves || 0;

          if (awayScore === 0 && mins >= 60 && ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(acc.position)) {
            acc.cleanSheets += 1;
          }
        });
      }

      // 2. Process away team player stats from matchResult
      if (f.matchResult.away?.players) {
        Object.values(f.matchResult.away.players as Record<string, any>).forEach((pim: any) => {
          const pId = pim.player?.id || pim.id;
          if (!pId) return;
          const mins = typeof pim.minutesPlayed === 'number' && pim.minutesPlayed > 0 ? pim.minutesPlayed : (pim.isStartingXI ? 90 : 0);
          if (mins <= 0 && !pim.isStartingXI && !pim.isOnPitch) return;

          fixtureParticipated.add(pId);
          const acc = getOrCreateAcc(pId, f.awayClubId);
          acc.appearances += 1;
          acc.totalMinutes += mins;
          acc.goals += pim.goals || 0;
          acc.assists += pim.assists || 0;
          acc.totalRatingSum += typeof pim.matchRating === 'number' ? pim.matchRating : 6.5;
          acc.yellowCards += pim.yellowCards || 0;
          acc.redCards += pim.redCards || 0;
          acc.shots += pim.shots || 0;
          acc.shotsOnTarget += pim.shotsOnTarget || 0;
          acc.saves += pim.saves || 0;

          if (homeScore === 0 && mins >= 60 && ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(acc.position)) {
            acc.cleanSheets += 1;
          }
        });
      }

      // 3. Reconcile with match events
      const matchEventGoals: Record<string, number> = {};
      const matchEventAssists: Record<string, number> = {};
      (f.matchResult.events || []).forEach((ev: any) => {
        if (ev.type === 'GOAL') {
          if (ev.playerId) {
            matchEventGoals[ev.playerId] = (matchEventGoals[ev.playerId] || 0) + 1;
          }
          const assistId = ev.secondaryPlayerId || ev.assistPlayerId;
          if (assistId) {
            matchEventAssists[assistId] = (matchEventAssists[assistId] || 0) + 1;
          }
        }
      });

      Object.entries(matchEventGoals).forEach(([pId, eventCount]) => {
        const teamId = f.matchResult?.events?.find((e: any) => e.type === 'GOAL' && e.playerId === pId)?.teamId || f.homeClubId;
        const acc = getOrCreateAcc(pId, teamId);
        if (!fixtureParticipated.has(pId)) {
          fixtureParticipated.add(pId);
          acc.appearances += 1;
          acc.totalMinutes += 90;
          acc.totalRatingSum += 7.0;
          acc.goals += eventCount;
        } else if (acc.goals < eventCount) {
          acc.goals = eventCount;
        }
      });

      Object.entries(matchEventAssists).forEach(([pId, eventCount]) => {
        const teamId = f.matchResult?.events?.find((e: any) => e.type === 'GOAL' && (e.secondaryPlayerId === pId || e.assistPlayerId === pId))?.teamId || f.homeClubId;
        const acc = getOrCreateAcc(pId, teamId);
        if (!fixtureParticipated.has(pId)) {
          fixtureParticipated.add(pId);
          acc.appearances += 1;
          acc.totalMinutes += 90;
          acc.totalRatingSum += 6.8;
          acc.assists += eventCount;
        } else if (acc.assists < eventCount) {
          acc.assists = eventCount;
        }
      });
    } else {
      // Fallback if matchResult is missing: credit starters
      const homeClub = clubMap.get(f.homeClubId);
      const awayClub = clubMap.get(f.awayClubId);
      const homeStarters = (f.homeTactics?.lineup?.map((s) => s.playerId).filter((id): id is string => Boolean(id))) || homeClub?.squadPlayerIds.slice(0, 11) || [];
      const awayStarters = (f.awayTactics?.lineup?.map((s) => s.playerId).filter((id): id is string => Boolean(id))) || awayClub?.squadPlayerIds.slice(0, 11) || [];

      for (const pId of homeStarters) {
        if (!pId) continue;
        const acc = getOrCreateAcc(pId, f.homeClubId);
        acc.appearances += 1;
        acc.totalMinutes += 90;
        acc.totalRatingSum += 6.5;
        if (awayScore === 0) acc.cleanSheets += 1;
      }
      for (const pId of awayStarters) {
        if (!pId) continue;
        const acc = getOrCreateAcc(pId, f.awayClubId);
        acc.appearances += 1;
        acc.totalMinutes += 90;
        acc.totalRatingSum += 6.5;
        if (homeScore === 0) acc.cleanSheets += 1;
      }
    }
  }

  // Format into final PlayerSeasonStats map
  const playerStats: Record<string, PlayerSeasonStats> = {};
  for (const [pId, acc] of Object.entries(statsAcc)) {
    const avgRating = acc.appearances > 0 ? Number((acc.totalRatingSum / acc.appearances).toFixed(2)) : 0;
    playerStats[pId] = {
      playerId: acc.playerId,
      playerName: acc.playerName,
      clubId: acc.clubId,
      clubName: acc.clubName,
      position: acc.position,
      appearances: acc.appearances,
      totalMinutes: acc.totalMinutes,
      goals: acc.goals,
      assists: acc.assists,
      averageRating: avgRating,
      totalCards: acc.yellowCards + acc.redCards,
      yellowCards: acc.yellowCards,
      redCards: acc.redCards,
      shots: acc.shots,
      shotsOnTarget: acc.shotsOnTarget,
      saves: acc.saves,
      cleanSheets: acc.cleanSheets,
    };
  }

  const activePlayers = Object.values(playerStats).filter((p) => p.appearances > 0);

  // 1. GOL KRALLIĞI (Top Scorers): Sort goals DESC, fewer appearances, higher rating
  const topScorers = [...activePlayers].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    if (a.appearances !== b.appearances) return a.appearances - b.appearances;
    return b.averageRating - a.averageRating;
  });

  // 2. ASİST LİDERLİĞİ (Top Assists): Sort assists DESC, fewer appearances, higher rating
  const topAssists = [...activePlayers].sort((a, b) => {
    if (b.assists !== a.assists) return b.assists - a.assists;
    if (a.appearances !== b.appearances) return a.appearances - b.appearances;
    return b.averageRating - a.averageRating;
  });

  // 3. EN YÜKSEK REYTİNGLER (Best Ratings): Minimum 1 appearance, averageRating DESC, more appearances
  const bestRatings = [...activePlayers]
    .filter((p) => p.appearances >= 1)
    .sort((a, b) => {
      if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      if (b.appearances !== a.appearances) return b.appearances - a.appearances;
      return b.goals - a.goals;
    });

  return { playerStats, topScorers, topAssists, bestRatings };
}

/**
 * Computes end of season individual and team awards for the completed draft league.
 */
export function computeLeagueAwards(
  standings: DraftStanding[],
  fixtures: DraftFixture[],
  clubs: DraftClub[],
  playerPool: Player[],
  seasonNumber?: number
): LeagueAwards {
  const champion = standings[0];
  const { topScorers: scorersList, topAssists: assistsList, bestRatings: ratingsList } = computeSeasonPlayerStats(
    fixtures,
    clubs,
    playerPool,
    seasonNumber
  );

  let highestScoringMatch: LeagueAwards['highestScoringMatch'];
  let maxTotalGoals = -1;

  let biggestWin: LeagueAwards['biggestWin'];
  let maxGoalDiff = -1;

  fixtures.forEach((f) => {
    if (f.status === 'COMPLETED' && f.homeScore !== undefined && f.awayScore !== undefined) {
      const fSeason = extractFixtureSeasonNumber(f);
      if (seasonNumber && fSeason !== seasonNumber) return;

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
    }
  });

  const topScorerPlayer = scorersList.find((p) => p.goals > 0) || scorersList[0];
  const topAssistPlayer = assistsList.find((p) => p.assists > 0) || assistsList[0];
  const bestRatingPlayer = ratingsList.find((p) => p.appearances >= 1) || ratingsList[0];

  let topScorer: LeagueAwards['topScorer'];
  if (topScorerPlayer && topScorerPlayer.goals > 0) {
    topScorer = {
      playerId: topScorerPlayer.playerId,
      playerName: topScorerPlayer.playerName,
      clubName: topScorerPlayer.clubName,
      goals: topScorerPlayer.goals,
      assists: topScorerPlayer.assists,
      matches: topScorerPlayer.appearances,
    };
  }

  let topAssists: LeagueAwards['topAssists'];
  if (topAssistPlayer && topAssistPlayer.assists > 0) {
    topAssists = {
      playerId: topAssistPlayer.playerId,
      playerName: topAssistPlayer.playerName,
      clubName: topAssistPlayer.clubName,
      assists: topAssistPlayer.assists,
      matches: topAssistPlayer.appearances,
    };
  }

  let bestRating: LeagueAwards['bestRating'];
  if (bestRatingPlayer && bestRatingPlayer.appearances >= 1) {
    bestRating = {
      playerId: bestRatingPlayer.playerId,
      playerName: bestRatingPlayer.playerName,
      clubName: bestRatingPlayer.clubName,
      rating: bestRatingPlayer.averageRating,
      matches: bestRatingPlayer.appearances,
    };
  }

  // Goalkeepers sorted by clean sheets then saves
  const allPlayerStats = Object.values(
    computeSeasonPlayerStats(fixtures, clubs, playerPool, seasonNumber).playerStats
  );
  const goalkeepers = allPlayerStats.filter((p) => p.position === 'GK');
  goalkeepers.sort((a, b) => {
    const csDiff = (b.cleanSheets || 0) - (a.cleanSheets || 0);
    if (csDiff !== 0) return csDiff;
    return (b.saves || 0) - (a.saves || 0);
  });
  const bestGk = goalkeepers[0];
  let bestGoalkeeper: LeagueAwards['bestGoalkeeper'];
  if (bestGk) {
    bestGoalkeeper = {
      playerId: bestGk.playerId,
      playerName: bestGk.playerName,
      clubName: bestGk.clubName,
      cleanSheets: bestGk.cleanSheets || 0,
    };
  }

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
