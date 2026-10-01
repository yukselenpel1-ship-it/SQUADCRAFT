import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import {
  computeStandingsFromFixtures,
  computeSeasonPlayerStats,
  extractFixtureSeasonNumber,
} from '../src/lib/draft/matchEngineIntegration';
import { DraftClub, DraftFixture, Player } from '../src/lib/draft/types';

async function runSeasonIsolationVerification() {
  console.log('=== STARTING QUICK SEASON ISOLATION VERIFICATION ===\n');

  const roomId = 'room-iso-' + Date.now();
  const roomCode = 'ISO' + Math.floor(100 + Math.random() * 900);

  const mockClubs: DraftClub[] = [
    {
      id: 'club-1',
      roomId,
      memberId: 'host-mem',
      name: 'Alpha FC',
      code: 'ALP',
      managerName: 'Manager A',
      primaryColor: '#00F5A0',
      secondaryColor: '#000000',
      squadPlayerIds: ['p-a1', 'p-a2'],
      budget: 200,
      spentBudget: 50,
    },
    {
      id: 'club-2',
      roomId,
      memberId: 'bot-mem',
      name: 'Beta FC',
      code: 'BET',
      managerName: 'Manager B',
      primaryColor: '#00D4FF',
      secondaryColor: '#FFFFFF',
      squadPlayerIds: ['p-b1', 'p-b2'],
      budget: 200,
      spentBudget: 50,
    },
  ];

  const mockPool: Player[] = [
    { id: 'p-a1', firstName: 'Scorer', lastName: 'S1', name: 'Scorer S1', position: 'ST', overall: 85, pace: 85, shooting: 85, passing: 75, dribbling: 80, defending: 40, physical: 75, draftValue: 20, club: 'Alpha', league: 'League', nationality: 'TR', age: 25 } as any,
    { id: 'p-a2', firstName: 'Mid', lastName: 'S1', name: 'Mid S1', position: 'CM', overall: 82, pace: 75, shooting: 70, passing: 85, dribbling: 80, defending: 70, physical: 75, draftValue: 15, club: 'Alpha', league: 'League', nationality: 'TR', age: 24 } as any,
    { id: 'p-b1', firstName: 'Scorer', lastName: 'S2', name: 'Scorer S2', position: 'ST', overall: 84, pace: 84, shooting: 84, passing: 75, dribbling: 80, defending: 40, physical: 75, draftValue: 20, club: 'Beta', league: 'League', nationality: 'TR', age: 26 } as any,
    { id: 'p-b2', firstName: 'Defender', lastName: 'S2', name: 'Defender S2', position: 'CB', overall: 81, pace: 70, shooting: 40, passing: 70, dribbling: 65, defending: 85, physical: 82, draftValue: 15, club: 'Beta', league: 'League', nationality: 'TR', age: 27 } as any,
  ];

  // 1. Season 1 Completed with 2 matches
  console.log('--- STEP 1: SEASON 1 COMPLETED ---');
  const s1Fixture1: DraftFixture = {
    id: `fix-${roomId}-r1-1`, // legacy style ID without -s1-
    roomId,
    round: 1,
    homeClubId: 'club-1',
    awayClubId: 'club-2',
    status: 'COMPLETED',
    homeScore: 3,
    awayScore: 0,
    matchResult: {
      home: {
        score: 3,
        players: {
          'p-a1': { id: 'p-a1', minutesPlayed: 90, goals: 3, assists: 0, matchRating: 9.0, isStartingXI: true, isOnPitch: true },
          'p-a2': { id: 'p-a2', minutesPlayed: 90, goals: 0, assists: 1, matchRating: 7.5, isStartingXI: true, isOnPitch: true },
        },
      },
      away: {
        score: 0,
        players: {
          'p-b1': { id: 'p-b1', minutesPlayed: 90, goals: 0, assists: 0, matchRating: 6.0, isStartingXI: true, isOnPitch: true },
          'p-b2': { id: 'p-b2', minutesPlayed: 90, goals: 0, assists: 0, matchRating: 6.2, isStartingXI: true, isOnPitch: true },
        },
      },
    } as any,
  };

  const s1Fixture2: DraftFixture = {
    id: `fix-${roomId}-s1-r2-2`, // s1 style ID
    roomId,
    seasonNumber: 1,
    round: 2,
    homeClubId: 'club-2',
    awayClubId: 'club-1',
    status: 'COMPLETED',
    homeScore: 1,
    awayScore: 1,
    matchResult: {
      home: {
        score: 1,
        players: {
          'p-b1': { id: 'p-b1', minutesPlayed: 90, goals: 1, assists: 0, matchRating: 7.5, isStartingXI: true, isOnPitch: true },
          'p-b2': { id: 'p-b2', minutesPlayed: 90, goals: 0, assists: 0, matchRating: 7.0, isStartingXI: true, isOnPitch: true },
        },
      },
      away: {
        score: 1,
        players: {
          'p-a1': { id: 'p-a1', minutesPlayed: 90, goals: 1, assists: 0, matchRating: 7.5, isStartingXI: true, isOnPitch: true },
          'p-a2': { id: 'p-a2', minutesPlayed: 90, goals: 0, assists: 0, matchRating: 7.0, isStartingXI: true, isOnPitch: true },
        },
      },
    } as any,
  };

  // Check extractFixtureSeasonNumber
  const extractedS1_1 = extractFixtureSeasonNumber(s1Fixture1);
  const extractedS1_2 = extractFixtureSeasonNumber(s1Fixture2);
  console.log(`- Fixture 1 without -s- extracted season: ${extractedS1_1} (expected 1)`);
  console.log(`- Fixture 2 with -s1- extracted season: ${extractedS1_2} (expected 1)`);
  if (extractedS1_1 !== 1 || extractedS1_2 !== 1) {
    throw new Error('Season 1 extraction failed!');
  }

  const s1Standings = computeStandingsFromFixtures(mockClubs, [s1Fixture1, s1Fixture2], 1);
  const s1Stats = computeSeasonPlayerStats([s1Fixture1, s1Fixture2], mockClubs, mockPool, 1);
  console.log(`- Season 1 Leader: ${s1Standings[0].clubName} with ${s1Standings[0].points} pts (P: ${s1Standings[0].played})`);
  console.log(`- Season 1 Top Scorer: ${s1Stats.topScorers[0].playerName} (${s1Stats.topScorers[0].goals} goals)`);

  // 2. Rematch Season 2 Rollover
  console.log('\n--- STEP 2: REMATCH SEASON 2 ROLLOVER ---');
  const initialFullState = {
    room: {
      id: roomId,
      roomCode,
      hostMemberId: 'host-mem',
      status: 'LEAGUE_COMPLETED' as const,
      seasonNumber: 1,
      currentMatchweek: 2,
      totalMatchweeks: 2,
      rules: {
        draftBudget: 250,
        pickTimeSeconds: 60,
        formation: '4-3-3',
        format: 'DOUBLE_ROUND' as const,
        matchSpeed: 2 as const,
        fixtures: [s1Fixture1, s1Fixture2],
      },
    } as any,
    members: [
      { id: 'host-mem', roomId, sessionId: 'host-sess', username: 'Host', isHost: true, isReady: true, isBot: false },
      { id: 'bot-mem', roomId, sessionId: 'bot-sess', username: 'Bot Beta', isHost: false, isReady: true, isBot: true, botDifficulty: 'ORTA' },
    ] as any,
    clubs: mockClubs,
    fixtures: [s1Fixture1, s1Fixture2],
    standings: s1Standings,
    playerPool: mockPool,
  };

  // Inject into DraftMultiplayerStore
  (DraftMultiplayerStore as any).getRoom = (id: string) => initialFullState;
  const rematchRes = DraftMultiplayerStore.rematch(roomId, 'host-mem', true);
  if (!rematchRes.success || !rematchRes.state) {
    throw new Error(`Rematch failed: ${rematchRes.error}`);
  }

  const s2State = rematchRes.state;
  console.log(`- Rematch created Season ${s2State.room.seasonNumber}`);
  console.log(`- Standings reset: Club 1 P: ${s2State.standings[0].played}, PTS: ${s2State.standings[0].points}`);
  console.log(`- New Season 2 Fixtures Count: ${s2State.fixtures.length}`);
  console.log(`- First S2 Fixture ID: ${s2State.fixtures[0].id}`);
  console.log(`- Archived Past Seasons in History: ${s2State.seasonHistory?.length || 0}`);

  if (s2State.room.seasonNumber !== 2) throw new Error('Season number not incremented');
  if (s2State.standings[0].points !== 0 || s2State.standings[0].played !== 0) throw new Error('Standings not reset');
  if (!s2State.fixtures[0].id.includes('-s2-')) throw new Error('Fixture ID lacks -s2-');

  // 3. Play ONE Season 2 Match
  console.log('\n--- STEP 3: PLAY ONE SEASON 2 MATCH ---');
  const s2FixtureToPlay = { ...s2State.fixtures[0] };
  s2FixtureToPlay.status = 'COMPLETED';
  s2FixtureToPlay.homeScore = 2;
  s2FixtureToPlay.awayScore = 1;
  s2FixtureToPlay.matchResult = {
    home: {
      score: 2,
      players: {
        'p-b1': { id: 'p-b1', minutesPlayed: 90, goals: 2, assists: 0, matchRating: 8.5, isStartingXI: true, isOnPitch: true },
        'p-b2': { id: 'p-b2', minutesPlayed: 90, goals: 0, assists: 1, matchRating: 7.2, isStartingXI: true, isOnPitch: true },
      },
    },
    away: {
      score: 1,
      players: {
        'p-a1': { id: 'p-a1', minutesPlayed: 90, goals: 1, assists: 0, matchRating: 7.2, isStartingXI: true, isOnPitch: true },
        'p-a2': { id: 'p-a2', minutesPlayed: 90, goals: 0, assists: 0, matchRating: 6.8, isStartingXI: true, isOnPitch: true },
      },
    },
  } as any;

  // Save the result through multiplayerStore
  DraftMultiplayerStore.saveLiveMatchResult(roomId, s2FixtureToPlay);

  // 4. Test fetchRoom / Refresh Simulation with Combined DB Pool
  console.log('\n--- STEP 4: REFRESH & FETCHROOM SIMULATION ---');
  // In a real database, draft_fixtures contains BOTH Season 1 fixtures and Season 2 fixtures!
  const allMixedFixtures = [
    s1Fixture1, // S1 (un-versioned or S1)
    s1Fixture2, // S1
    s2FixtureToPlay, // S2 completed
    ...s2State.fixtures.slice(1), // S2 remaining
  ];

  // Test strict standings calculation on mixed fixtures
  const s2StandingsFromMixed = computeStandingsFromFixtures(mockClubs, allMixedFixtures, 2);
  console.log('Season 2 Standings from mixed pool:');
  s2StandingsFromMixed.forEach((s) => {
    console.log(`  ${s.clubName}: Played ${s.played}, Points ${s.points}, GF ${s.goalsFor}, GA ${s.goalsAgainst}`);
  });

  // Verify only 1 match was counted in Season 2 standings
  const totalPlayedS2 = s2StandingsFromMixed.reduce((acc, s) => acc + s.played, 0);
  console.log(`- Total Games Played in S2 Standings: ${totalPlayedS2 / 2} (expected 1)`);
  if (totalPlayedS2 !== 2) {
    throw new Error(`Contamination detected! Expected 2 club-match appearances (1 game), got ${totalPlayedS2}`);
  }

  // Test strict player stats calculation on mixed fixtures
  const s2StatsFromMixed = computeSeasonPlayerStats(allMixedFixtures, mockClubs, mockPool, 2);
  console.log(`- Season 2 Top Scorer: ${s2StatsFromMixed.topScorers[0]?.playerName} (${s2StatsFromMixed.topScorers[0]?.goals} goals)`);
  if (s2StatsFromMixed.topScorers[0]?.playerName !== 'Scorer S2' || s2StatsFromMixed.topScorers[0]?.goals !== 2) {
    throw new Error(`Contamination in stats! Player A from S1 leaked into S2 stats!`);
  }

  // Verify Season 1 remains only in seasonHistory
  console.log(`- Past season archived history entries: ${s2State.seasonHistory?.length}`);
  const archivedS1 = s2State.seasonHistory?.[0];
  console.log(`- Archived Season ${archivedS1?.seasonNumber} Champion: ${archivedS1?.championClubId}`);
  console.log(`- Archived Season 1 Top Scorer: ${archivedS1?.topScorer?.name} with ${archivedS1?.topScorer?.goals} goals`);
  if (!archivedS1 || archivedS1.seasonNumber !== 1) {
    throw new Error('Season 1 was not archived in seasonHistory');
  }

  console.log('\n==================================================');
  console.log('ALL SEASON ISOLATION CHECKS PASSED');
  console.log('==================================================');
}

runSeasonIsolationVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
