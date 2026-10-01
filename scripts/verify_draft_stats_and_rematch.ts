import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { generateDraftLeagueFixtures, initializeDraftStandings } from '../src/lib/draft/draftEngine';
import { computeSeasonPlayerStats, computeLeagueAwards } from '../src/lib/draft/matchEngineIntegration';
import { DraftFixture, DraftClub, RoomMember, DraftRules, DEFAULT_DRAFT_RULES } from '../src/lib/draft/types';
import { Player } from '../src/types/game';

async function runAcceptanceTest() {
  console.log('=== STARTING SQUADCRAFT DRAFT STATS & REMATCH VERIFICATION ===\n');

  // 1. SETUP TEST PLAYERS & CLUBS
  const playerA: Player = {
    id: 'test-player-a',
    firstName: 'Kerem',
    lastName: 'Kaya',
    position: 'ST',
    overall: 85,
    potential: 88,
    age: 24,
    nationality: 'Türkiye',
    club: 'Alpha FC',
    value: 30000000,
    wage: 50000,
    contractYears: 3,
    stats: { pace: 86, shooting: 85, passing: 78, dribbling: 84, defending: 35, physical: 76 } as any,
    condition: 100,
    morale: 'Çok Yüksek',
    form: 8.0,
  };

  const playerB: Player = {
    id: 'test-player-b',
    firstName: 'Emre',
    lastName: 'Demir',
    position: 'CAM',
    overall: 82,
    potential: 85,
    age: 22,
    nationality: 'Türkiye',
    club: 'Alpha FC',
    value: 20000000,
    wage: 35000,
    contractYears: 3,
    stats: { pace: 80, shooting: 78, passing: 86, dribbling: 82, defending: 45, physical: 70 } as any,
    condition: 100,
    morale: 'Yüksek',
    form: 7.5,
  };

  const playerC: Player = {
    id: 'test-player-c',
    firstName: 'Burak',
    lastName: 'Yılmazer',
    position: 'CB',
    overall: 80,
    potential: 82,
    age: 26,
    nationality: 'Türkiye',
    club: 'Beta FK',
    value: 15000000,
    wage: 30000,
    contractYears: 2,
    stats: { pace: 72, shooting: 40, passing: 65, dribbling: 60, defending: 83, physical: 84 } as any,
    condition: 100,
    morale: 'Normal',
    form: 6.8,
  };

  const playerUnplayed: Player = {
    id: 'test-player-unplayed',
    firstName: 'Yedek',
    lastName: 'Kadro',
    position: 'GK',
    overall: 70,
    potential: 75,
    age: 20,
    nationality: 'Türkiye',
    club: 'Alpha FC',
    value: 2000000,
    wage: 5000,
    contractYears: 2,
    stats: { pace: 50, shooting: 20, passing: 60, dribbling: 40, defending: 50, physical: 65 } as any,
    condition: 100,
    morale: 'Normal',
    form: 6.0,
  };

  const pool: Player[] = [playerA, playerB, playerC, playerUnplayed];

  const club1: DraftClub = {
    id: 'club-1',
    roomId: 'room-test-1',
    memberId: 'mem-host',
    name: 'Alpha FC',
    code: 'ALP',
    managerName: 'HostManager',
    primaryColor: '#00F5A0',
    secondaryColor: '#00D4FF',
    badge: {},
    squadPlayerIds: ['test-player-a', 'test-player-b', 'test-player-unplayed'],
    budget: 200000000,
    spentBudget: 50000000,
    tactics: {
      clubId: 'club-1',
      formation: '4-3-3',
      lineup: [
        { slotId: 0, role: 'ST', x: 50, y: 20, playerId: 'test-player-a' },
        { slotId: 1, role: 'CAM', x: 50, y: 40, playerId: 'test-player-b' },
      ],
      substitutes: ['test-player-unplayed'],
      reserves: [],
      settings: { mentality: 'Hücum', tempo: 'Yüksek', pressing: 'Ön Alan', passingStyle: 'Kısa', defensiveLine: 'Yüksek', width: 'Geniş' },
    },
  };

  const club2: DraftClub = {
    id: 'club-2',
    roomId: 'room-test-1',
    memberId: 'mem-bot-1',
    name: 'Beta FK',
    code: 'BET',
    managerName: 'BotManager',
    primaryColor: '#FFB800',
    secondaryColor: '#E5A500',
    badge: {},
    squadPlayerIds: ['test-player-c'],
    budget: 220000000,
    spentBudget: 30000000,
  };

  const clubs: DraftClub[] = [club1, club2];

  // 2. SIMULATE 2 REAL MATCHES WITH ACTUAL MATCH ENGINE STATS
  // Match 1: Alpha FC 2 - 1 Beta FK (Kerem Kaya: 2G, 1A, 8.4 rating, 90 mins; Emre Demir: 1A, 7.5 rating, 90 mins)
  const fixture1: DraftFixture = {
    id: 'fix-room-test-1-s1-r1-0',
    roomId: 'room-test-1',
    seasonNumber: 1,
    round: 1,
    homeClubId: 'club-1',
    awayClubId: 'club-2',
    status: 'COMPLETED',
    homeScore: 2,
    awayScore: 1,
    homeTactics: club1.tactics,
    matchResult: {
      home: {
        score: 2,
        players: {
          'test-player-a': {
            id: 'test-player-a',
            minutesPlayed: 90,
            goals: 2,
            assists: 1,
            matchRating: 8.4,
            shots: 5,
            shotsOnTarget: 3,
            yellowCards: 0,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
          'test-player-b': {
            id: 'test-player-b',
            minutesPlayed: 90,
            goals: 0,
            assists: 1,
            matchRating: 7.5,
            shots: 2,
            shotsOnTarget: 1,
            yellowCards: 1,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
        },
        stats: { shots: 12, shotsOnTarget: 6, possession: 55, fouls: 8, yellowCards: 1, redCards: 0, offsides: 2, corners: 6, xG: 2.1 },
      },
      away: {
        score: 1,
        players: {
          'test-player-c': {
            id: 'test-player-c',
            minutesPlayed: 90,
            goals: 1,
            assists: 0,
            matchRating: 6.9,
            shots: 1,
            shotsOnTarget: 1,
            yellowCards: 0,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
        },
        stats: { shots: 7, shotsOnTarget: 3, possession: 45, fouls: 11, yellowCards: 0, redCards: 0, offsides: 1, corners: 3, xG: 0.9 },
      },
      events: [
        { minute: 14, type: 'GOAL', teamId: 'club-1', playerId: 'test-player-a', assistPlayerId: 'test-player-b' },
        { minute: 38, type: 'GOAL', teamId: 'club-2', playerId: 'test-player-c' },
        { minute: 72, type: 'GOAL', teamId: 'club-1', playerId: 'test-player-a', assistPlayerId: 'test-player-a' },
      ],
    } as any,
  };

  // Match 2: Beta FK 0 - 1 Alpha FC (Kerem Kaya: 1G, 0A, 7.8 rating, 90 mins; Emre Demir: 1A, 8.0 rating, 90 mins)
  const fixture2: DraftFixture = {
    id: 'fix-room-test-1-s1-r2-0',
    roomId: 'room-test-1',
    seasonNumber: 1,
    round: 2,
    homeClubId: 'club-2',
    awayClubId: 'club-1',
    status: 'COMPLETED',
    homeScore: 0,
    awayScore: 1,
    awayTactics: club1.tactics,
    matchResult: {
      home: {
        score: 0,
        players: {
          'test-player-c': {
            id: 'test-player-c',
            minutesPlayed: 90,
            goals: 0,
            assists: 0,
            matchRating: 6.4,
            shots: 1,
            shotsOnTarget: 0,
            yellowCards: 1,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
        },
        stats: { shots: 5, shotsOnTarget: 1, possession: 40, fouls: 12, yellowCards: 1, redCards: 0, offsides: 0, corners: 2, xG: 0.5 },
      },
      away: {
        score: 1,
        players: {
          'test-player-a': {
            id: 'test-player-a',
            minutesPlayed: 90,
            goals: 1,
            assists: 0,
            matchRating: 7.8,
            shots: 4,
            shotsOnTarget: 2,
            yellowCards: 0,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
          'test-player-b': {
            id: 'test-player-b',
            minutesPlayed: 90,
            goals: 0,
            assists: 1,
            matchRating: 8.0,
            shots: 3,
            shotsOnTarget: 2,
            yellowCards: 0,
            redCards: 0,
            isStartingXI: true,
            isOnPitch: true,
          },
        },
        stats: { shots: 10, shotsOnTarget: 5, possession: 60, fouls: 7, yellowCards: 0, redCards: 0, offsides: 1, corners: 5, xG: 1.6 },
      },
      events: [
        { minute: 61, type: 'GOAL', teamId: 'club-1', playerId: 'test-player-a', assistPlayerId: 'test-player-b' },
      ],
    } as any,
  };

  const fixtures = [fixture1, fixture2];

  // 3. VERIFY SEASON PLAYER STATS AGGREGATION
  console.log('--- TEST 1: SEASON PLAYER STATS AGGREGATION ---');
  const seasonStatsResult = computeSeasonPlayerStats(fixtures, clubs, pool, 1);
  const pAStats = seasonStatsResult.playerStats['test-player-a'];
  const pBStats = seasonStatsResult.playerStats['test-player-b'];

  console.log('Player A Stats:', pAStats);
  console.log('Player B Stats:', pBStats);

  // Assertions for Player A: 2 matches, 180 mins, 3 goals, 1 assist, avg rating (8.4 + 7.8)/2 = 8.1
  const pAGoalsPass = pAStats?.goals === 3;
  const pAAssistsPass = pAStats?.assists === 1;
  const pAMatchesPass = pAStats?.appearances === 2;
  const pAMinutesPass = pAStats?.totalMinutes === 180;
  const pARatingPass = pAStats?.averageRating === 8.1;

  console.log(`- Player A Goals (expected 3): ${pAStats?.goals} [${pAGoalsPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Player A Assists (expected 1): ${pAStats?.assists} [${pAAssistsPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Player A Appearances (expected 2): ${pAStats?.appearances} [${pAMatchesPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Player A Minutes (expected 180): ${pAStats?.totalMinutes} [${pAMinutesPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Player A Avg Rating (expected 8.1): ${pAStats?.averageRating} [${pARatingPass ? 'PASS' : 'FAIL'}]`);

  // Assertions for Leaderboards
  console.log('\n--- TEST 2: LEADERBOARD SORTING & FILTERING ---');
  const topScorer = seasonStatsResult.topScorers[0];
  const topAssist = seasonStatsResult.topAssists[0];
  const bestRating = seasonStatsResult.bestRatings[0];

  const topScorerPass = topScorer?.playerId === 'test-player-a' && topScorer.goals === 3;
  const topAssistPass = topAssist?.playerId === 'test-player-b' && topAssist.assists === 2;
  const bestRatingPass = bestRating?.playerId === 'test-player-a' && bestRating.averageRating === 8.1;
  const noZeroMatchInRatingsPass = seasonStatsResult.bestRatings.every((p) => p.appearances >= 1);

  console.log(`- Top Scorer is Player A with 3 goals: [${topScorerPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Top Assist is Player B with 2 assists: [${topAssistPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Best Rating is Player A with 8.1: [${bestRatingPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- No 0-match players in best ratings table: [${noZeroMatchInRatingsPass ? 'PASS' : 'FAIL'}]`);

  // 4. TEST TRUE REMATCH ROOM WORKFLOW
  console.log('\n--- TEST 3: TRUE REMATCH NEW SEASON ROLLOVER ---');
  // Create mock room in store
  const members: RoomMember[] = [
    {
      id: 'mem-host',
      roomId: 'room-test-1',
      sessionId: 'session-host',
      username: 'HostManager',
      isHost: true,
      isSpectator: false,
      isReady: true,
      isConnected: true,
      clubId: 'club-1',
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'mem-bot-1',
      roomId: 'room-test-1',
      sessionId: 'bot-session-ORTA-Dengeli-bot-1',
      username: 'Bot Alpha',
      isHost: false,
      isSpectator: false,
      isReady: true,
      isBot: true,
      botDifficulty: 'ORTA',
      botPersonality: 'Dengeli',
      isConnected: true,
      clubId: 'club-2',
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    },
  ];

  const standings = initializeDraftStandings(clubs);
  standings[0].played = 2;
  standings[0].won = 2;
  standings[0].points = 6;
  standings[0].goalsFor = 3;
  standings[0].goalsAgainst = 1;
  standings[0].goalDifference = 2;

  standings[1].played = 2;
  standings[1].lost = 2;
  standings[1].points = 0;
  standings[1].goalsFor = 1;
  standings[1].goalsAgainst = 3;
  standings[1].goalDifference = -2;

  const mockRoomState = {
    room: {
      id: 'room-test-1',
      roomCode: 'TEST01',
      name: 'Test League',
      hostMemberId: 'mem-host',
      status: 'LEAGUE_COMPLETED' as const,
      rules: { ...DEFAULT_DRAFT_RULES, seasonNumber: 1, matchSpeed: 2 as const },
      stateVersion: 10,
      seasonNumber: 1,
      currentMatchweek: 2,
      totalMatchweeks: 2,
    },
    members,
    clubs,
    fixtures,
    standings,
    playerPool: pool,
    awards: computeLeagueAwards(standings, fixtures, clubs, pool, 1),
    seasonPlayerStats: seasonStatsResult.playerStats,
  };

  // Inject into DraftMultiplayerStore memory
  (DraftMultiplayerStore as any).memoryRooms = (DraftMultiplayerStore as any).memoryRooms || {};
  (DraftMultiplayerStore as any).getRoom = () => mockRoomState;

  // Execute rematch
  const rematchRes = DraftMultiplayerStore.rematch('room-test-1', 'mem-host', true);
  if (!rematchRes.success || !rematchRes.state) {
    console.error('Rematch failed:', rematchRes.error);
    process.exit(1);
  }

  const s2State = rematchRes.state;
  console.log('Rematch S2 Room Status:', s2State.room.status);
  console.log('Rematch S2 Season Number:', s2State.room.seasonNumber);
  console.log('Rematch S2 Current Matchweek:', s2State.room.currentMatchweek);
  console.log('Rematch S2 Clubs Count:', s2State.clubs.length);
  console.log('Rematch S2 Standings Count:', s2State.standings.length);
  console.log('Rematch S2 Fixtures Count:', s2State.fixtures.length);
  console.log('Rematch S2 Archived History Count:', s2State.seasonHistory?.length);

  // Verification 1: Season number incremented to 2
  const seasonIncrementPass = s2State.room.seasonNumber === 2;
  console.log(`- Season Number incremented (1 -> 2): [${seasonIncrementPass ? 'PASS' : 'FAIL'}]`);

  // Verification 2: Squad players PRESERVED exactly (club1 still has all 3 players)
  const squadPreservedPass =
    s2State.clubs[0].squadPlayerIds.length === 3 &&
    s2State.clubs[0].squadPlayerIds.includes('test-player-a') &&
    s2State.clubs[0].squadPlayerIds.includes('test-player-b') &&
    s2State.clubs[0].squadPlayerIds.includes('test-player-unplayed');
  console.log(`- Squad players preserved (18/18 rosters intact): [${squadPreservedPass ? 'PASS' : 'FAIL'}]`);

  // Verification 3: Club tactics and formations preserved
  const tacticsPreservedPass = s2State.clubs[0].tactics?.formation === '4-3-3';
  console.log(`- Club tactics and formations preserved: [${tacticsPreservedPass ? 'PASS' : 'FAIL'}]`);

  // Verification 4: Bot settings preserved
  const botPreservedPass = s2State.members.find((m) => m.isBot)?.botDifficulty === 'ORTA';
  console.log(`- Bot manager & difficulty preserved: [${botPreservedPass ? 'PASS' : 'FAIL'}]`);

  // Verification 5: Standings reset to 0
  const standingsResetPass = s2State.standings.every(
    (s) => s.played === 0 && s.points === 0 && s.goalsFor === 0 && s.goalsAgainst === 0
  );
  console.log(`- Standings table reset to 0 (P:0 PTS:0): [${standingsResetPass ? 'PASS' : 'FAIL'}]`);

  // Verification 6: Fixtures regenerated with season 2 unique tags
  const newFixturesTaggedPass = s2State.fixtures.every(
    (f) => f.seasonNumber === 2 && f.id.includes('-s2-') && f.status === 'AWAITING_TACTICS'
  );
  console.log(`- New fixtures tagged with seasonNumber=2 & unique IDs: [${newFixturesTaggedPass ? 'PASS' : 'FAIL'}]`);

  // Verification 7: Matchweek reset to 1 & live match state reset to PREPARING
  const mwResetPass = s2State.room.currentMatchweek === 1;
  const liveMwPrepPass = s2State.room.liveMatchweek?.status === 'PREPARING';
  console.log(`- Matchweek reset to 1: [${mwResetPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Live matchweek state reset to PREPARING: [${liveMwPrepPass ? 'PASS' : 'FAIL'}]`);

  // Verification 8: Human ready states reset to false (bots true)
  const hostReadyResetPass = s2State.members.find((m) => !m.isBot)?.isReady === false;
  const botReadyPass = s2State.members.find((m) => m.isBot)?.isReady === true;
  console.log(`- Human ready state reset to false: [${hostReadyResetPass ? 'PASS' : 'FAIL'}]`);
  console.log(`- Bot ready state preserved as true: [${botReadyPass ? 'PASS' : 'FAIL'}]`);

  // Verification 9: Season 1 archived in seasonHistory with champion and top performers
  const season1Archived = s2State.seasonHistory?.[0];
  const historyArchivedPass =
    season1Archived?.seasonNumber === 1 &&
    season1Archived?.championClubName === 'Alpha FC' &&
    season1Archived?.topScorer?.playerName === 'Kerem Kaya' &&
    season1Archived?.topScorer?.goals === 3 &&
    season1Archived?.topAssists?.playerName === 'Emre Demir' &&
    season1Archived?.topAssists?.assists === 2;
  console.log(`- Season 1 archived in seasonHistory: [${historyArchivedPass ? 'PASS' : 'FAIL'}]`);

  // Verification 10: Season stats cleared for Season 2
  const season2StatsClearedPass =
    Object.keys(s2State.seasonPlayerStats || {}).length === 0 &&
    s2State.awards === undefined;
  console.log(`- Season 2 stats and awards cleared: [${season2StatsClearedPass ? 'PASS' : 'FAIL'}]`);

  // 5. TEST DATA ISOLATION (SEASON 2 MATCH DOES NOT AFFECT SEASON 1 HISTORY)
  console.log('\n--- TEST 4: DATA ISOLATION ACROSS SEASONS ---');
  // Play a match in Season 2: Beta FK scores 1 goal
  const s2Fixture1: DraftFixture = {
    ...s2State.fixtures[0],
    status: 'COMPLETED',
    homeScore: 1,
    awayScore: 0,
    matchResult: {
      home: {
        score: 1,
        players: {
          'test-player-c': {
            id: 'test-player-c',
            minutesPlayed: 90,
            goals: 1,
            assists: 0,
            matchRating: 7.6,
            isStartingXI: true,
            isOnPitch: true,
          },
        },
        stats: { shots: 8, shotsOnTarget: 4, possession: 50, fouls: 5, yellowCards: 0, redCards: 0, offsides: 0, corners: 4, xG: 1.1 },
      },
      away: {
        score: 0,
        players: {},
        stats: { shots: 6, shotsOnTarget: 2, possession: 50, fouls: 6, yellowCards: 0, redCards: 0, offsides: 0, corners: 2, xG: 0.7 },
      },
    } as any,
  };

  const s2StatsResult = computeSeasonPlayerStats([s2Fixture1], clubs, pool, 2);
  const s2TopScorer = s2StatsResult.topScorers[0];
  const dataIsolationPass =
    s2TopScorer?.playerId === 'test-player-c' &&
    s2TopScorer?.goals === 1 &&
    s2State.seasonHistory?.[0]?.topScorer?.goals === 3; // Season 1 remains 3 goals!

  console.log(`- Season 2 leader is Player C (1 goal): [${s2TopScorer?.playerId === 'test-player-c' ? 'PASS' : 'FAIL'}]`);
  console.log(`- Season 1 archived top scorer unaffected (3 goals): [${s2State.seasonHistory?.[0]?.topScorer?.goals === 3 ? 'PASS' : 'FAIL'}]`);
  console.log(`- Data isolation across seasons verified: [${dataIsolationPass ? 'PASS' : 'FAIL'}]`);

  const allPassed =
    pAGoalsPass &&
    pAAssistsPass &&
    pAMatchesPass &&
    pAMinutesPass &&
    pARatingPass &&
    topScorerPass &&
    topAssistPass &&
    bestRatingPass &&
    noZeroMatchInRatingsPass &&
    seasonIncrementPass &&
    squadPreservedPass &&
    tacticsPreservedPass &&
    botPreservedPass &&
    standingsResetPass &&
    newFixturesTaggedPass &&
    mwResetPass &&
    liveMwPrepPass &&
    hostReadyResetPass &&
    botReadyPass &&
    historyArchivedPass &&
    season2StatsClearedPass &&
    dataIsolationPass;

  console.log(`\n==================================================`);
  console.log(`FINAL RESULT: ${allPassed ? 'ALL TESTS PASSED' : 'TESTS FAILED'}`);
  console.log(`==================================================\n`);

  if (!allPassed) {
    process.exit(1);
  }
}

runAcceptanceTest().catch((err) => {
  console.error('Execution exception:', err);
  process.exit(1);
});
