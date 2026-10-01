import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { computeStandingsFromFixtures, simulateDraftFixture } from '../src/lib/draft/matchEngineIntegration';
import { DraftFixture, DraftClub, RoomMember, DraftStanding } from '../src/lib/draft/types';
import { Player } from '../src/types/game';

async function runDraftLeagueLoopVerification() {
  console.log('================================================================');
  console.log('SQUADCRAFT — P0 DRAFT LEAGUE FULL GAME LOOP REPAIR VERIFICATION');
  console.log('================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;
  function assert(desc: string, condition: boolean, detail?: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  [PASS] ${desc}`);
    } else {
      console.error(`  [FAIL] ${desc} -> ${detail || 'Assertion failed'}`);
    }
  }

  // -------------------------------------------------------------
  // TEST 1: Room Creation with 4 Teams (Host, Guest, Bot Easy, Bot Hard)
  // -------------------------------------------------------------
  console.log('--- TEST 1: Room Setup & 4-Team Roster ---');
  const hostSessionId = `host-session-${Date.now()}`;
  const guestSessionId = `guest-session-${Date.now()}`;

  const roomState = DraftMultiplayerStore.createRoom(
    'Ahmet Manager',
    hostSessionId,
    {
      draftType: 'SNAKE',
      teamCount: 4,
      totalRounds: 3,
      roundTimerSeconds: 30,
      turnTimeLimitSeconds: 30,
      pickTimerSeconds: 30,
      draftBudget: 250_000_000,
      matchSpeed: 2,
    },
    'Super Lig Draft Arena'
  );

  assert('Host created draft room', !!roomState && !!roomState.room);
  const room = roomState.room;
  const hostMember = roomState.members[0];

  // Guest joins
  const guestJoin = DraftMultiplayerStore.joinRoom(room.roomCode, 'Mehmet Coach', guestSessionId);
  assert('Guest manager joined room', guestJoin.success && !!guestJoin.currentMember);
  const guestMember = guestJoin.currentMember!;

  // Add 2 bots: Easy & Hard
  const bot1 = DraftMultiplayerStore.addBot(room.id, hostMember.id, 'EASY');
  const bot2 = DraftMultiplayerStore.addBot(room.id, hostMember.id, 'HARD');
  assert('Added Easy Bot & Hard Bot', bot1.success && bot2.success);

  let state = DraftMultiplayerStore.getRoom(room.id)!;
  assert('Room has exactly 4 active members and 4 clubs', state.members.length === 4 && state.clubs.length === 4);

  // -------------------------------------------------------------
  // TEST 2: Match Speed Configuration (Point 14)
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Match Speed Configuration (1x, 2x, 3x, 4x) ---');
  // Non-host attempt should be rejected
  const nonHostAttempt = DraftMultiplayerStore.updateMatchSpeed(room.id, guestMember.id, 4);
  assert('Non-host cannot change match speed', !nonHostAttempt.success);

  // Host sets 4x speed
  const hostSet4x = DraftMultiplayerStore.updateMatchSpeed(room.id, hostMember.id, 4);
  assert('Host set match speed to 4x (200ms pace)', hostSet4x.success && hostSet4x.state?.room.rules.matchSpeed === 4 && hostSet4x.state?.room.liveMatchweek?.paceMs === 200);

  // Host sets 2x speed
  const hostSet2x = DraftMultiplayerStore.updateMatchSpeed(room.id, hostMember.id, 2);
  assert('Host set match speed to 2x (400ms pace)', hostSet2x.success && hostSet2x.state?.room.rules.matchSpeed === 2 && hostSet2x.state?.room.liveMatchweek?.paceMs === 400);

  // -------------------------------------------------------------
  // TEST 3: Populate Draft Squads & Advance to League (Fixtures Generation)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Draft Progression -> Fixtures Generation ---');
  // Populate each club with distinct drafted players from pool
  const pool = state.playerPool;
  state.clubs.forEach((club, idx) => {
    club.squadPlayerIds = pool.slice(idx * 11, (idx + 1) * 11).map((p) => p.id);
  });

  // Start league phase
  const startLeagueRes = DraftMultiplayerStore.finalizeDraftLeague(room.id);
  assert('Advanced room to LEAGUE_ACTIVE', startLeagueRes.success && startLeagueRes.state?.room.status === 'LEAGUE_ACTIVE');

  state = DraftMultiplayerStore.getRoom(room.id)!;
  assert('Fixtures generated (at least 3 matchweeks, 6 matches for 4 clubs)', state.fixtures.length >= 6);
  assert('Initial standings initialized with 4 clubs at 0 points', state.standings.length === 4 && state.standings.every((s) => s.played === 0 && s.points === 0));

  // -------------------------------------------------------------
  // TEST 4: Ready System (Point 6)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Ready System & Match Start Authority ---');
  // Guest gives ready
  const guestReady = DraftMultiplayerStore.setMatchweekReady(room.id, guestMember.id, true);
  assert('Guest marked HAZIR', guestReady.success && guestReady.state?.room.liveMatchweek?.readyMemberIds.includes(guestMember.id));

  // Host gives ready -> All humans ready triggers countdown
  const hostReady = DraftMultiplayerStore.setMatchweekReady(room.id, hostMember.id, true);
  assert('Host marked HAZIR -> Countdown triggered', hostReady.success && hostReady.state?.room.liveMatchweek?.status === 'COUNTDOWN');

  // Launch live matchweek
  const launchRes = DraftMultiplayerStore.launchLiveMatchweek(room.id, hostMember.id);
  assert('Live matchweek launched (status: LIVE)', launchRes.success && launchRes.state?.room.liveMatchweek?.status === 'LIVE');

  // -------------------------------------------------------------
  // TEST 5: Week 1 Match Simulation & Standings Update (Points 1, 2, 3, 11)
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Week 1 Match Completion & Standings Update ---');
  const week1Fixtures = state.fixtures.filter((f) => f.round === 1);
  assert('Week 1 has 2 fixtures for 4 clubs', week1Fixtures.length === 2);

  // Simulate human fixture using MatchEngine
  const userFix = week1Fixtures[0];
  const homeClub = state.clubs.find((c) => c.id === userFix.homeClubId)!;
  const awayClub = state.clubs.find((c) => c.id === userFix.awayClubId)!;
  const sim1 = simulateDraftFixture(userFix, homeClub, awayClub, homeClub.tactics, awayClub.tactics, state.playerPool);

  assert('Match Engine simulated realistic match', sim1.updatedFixture.homeScore !== undefined && sim1.updatedFixture.awayScore !== undefined && !!sim1.updatedFixture.matchResult);
  console.log(`    Score: ${homeClub.name} ${sim1.updatedFixture.homeScore} - ${sim1.updatedFixture.awayScore} ${awayClub.name}`);

  // Call finishLiveMatchweek with the completed fixture
  const finishMwRes = DraftMultiplayerStore.finishLiveMatchweek(room.id, hostMember.id, sim1.updatedFixture);
  assert('finishLiveMatchweek executed successfully', finishMwRes.success && !!finishMwRes.state);

  const afterWeek1State = finishMwRes.state!;
  const afterWeek1Fixtures = afterWeek1State.fixtures.filter((f) => f.round === 1);

  // Verify all week 1 fixtures are COMPLETED and have scores
  const allWeek1Done = afterWeek1Fixtures.every((f) => f.status === 'COMPLETED' && f.homeScore !== undefined && f.awayScore !== undefined);
  assert('All Week 1 matches (including bot match) completed with real scores', allWeek1Done);

  // Verify Standings Updated!
  const std1 = afterWeek1State.standings;
  assert('Standings count is 4', std1.length === 4);
  const totalPlayed = std1.reduce((sum, s) => sum + s.played, 0);
  assert('All 4 clubs have played = 1 (total played = 4)', totalPlayed === 4);

  const totalPoints = std1.reduce((sum, s) => sum + s.points, 0);
  // In football, 2 matches result in either (3+0)+(3+0)=6 pts, (3+0)+(1+1)=5 pts, or (1+1)+(1+1)=4 pts
  assert('Total points distributed matches math (4, 5, or 6 points)', [4, 5, 6].includes(totalPoints), `Total pts: ${totalPoints}`);

  // Verify standings sorting: PTS desc, GD desc, GF desc
  for (let i = 0; i < std1.length - 1; i++) {
    const a = std1[i];
    const b = std1[i + 1];
    const properlyOrdered =
      a.points > b.points ||
      (a.points === b.points && a.goalDifference > b.goalDifference) ||
      (a.points === b.points && a.goalDifference === b.goalDifference && a.goalsFor >= b.goalsFor);
    assert(`Standings rank #${i + 1} (${a.clubName}: ${a.points}p) >= rank #${i + 2} (${b.clubName}: ${b.points}p)`, properlyOrdered);
  }

  // -------------------------------------------------------------
  // TEST 6: Cold Fetch & State Persistence Check (Point 1, 3)
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Persistence & Cold Fetch Verification ---');
  const coldState = await DraftMultiplayerStore.fetchRoom(room.id);
  assert('Cold fetchRoom returned valid state', !!coldState);
  const coldStandings = coldState!.standings;
  const coldPlayed = coldStandings.reduce((sum, s) => sum + s.played, 0);
  assert('Cold-fetched standings preserved played = 1 for all clubs', coldPlayed === 4);
  assert('Cold-fetched points match week 1 standings exactly', JSON.stringify(coldStandings.map((s) => s.points)) === JSON.stringify(std1.map((s) => s.points)));

  // -------------------------------------------------------------
  // TEST 7: Idempotency Verification (Point 2, 3)
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Idempotency & Aggregation Verification ---');
  const recalculatedStandings = computeStandingsFromFixtures(afterWeek1State.clubs, afterWeek1State.fixtures);
  assert(
    'Recalculating standings produces identical result (no double counting)',
    JSON.stringify(recalculatedStandings.map((s) => ({ id: s.clubId, pts: s.points, gd: s.goalDifference }))) ===
      JSON.stringify(std1.map((s) => ({ id: s.clubId, pts: s.points, gd: s.goalDifference })))
  );

  // -------------------------------------------------------------
  // TEST 8: Week 2 Progression & Cumulative Standings (Point 8, 9)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Week 2 Progression & Cumulative Standings ---');
  assert('Room advanced to Matchweek 2', afterWeek1State.room.currentMatchweek === 2);

  // Simulate Week 2 fixtures
  const week2Fixtures = afterWeek1State.fixtures.filter((f) => f.round === 2);
  for (const f of week2Fixtures) {
    const simRes = DraftMultiplayerStore.simulateFixture(room.id, f.id);
    assert(`Simulated Week 2 fixture ${f.id}`, simRes.success);
  }

  const afterWeek2State = DraftMultiplayerStore.getRoom(room.id)!;
  const std2 = afterWeek2State.standings;
  const totalPlayedW2 = std2.reduce((sum, s) => sum + s.played, 0);
  assert('All 4 clubs have played = 2 (cumulative total played = 8)', totalPlayedW2 === 8);
  assert('Every club has played === 2', std2.every((s) => s.played === 2));

  // -------------------------------------------------------------
  // TEST 9: Advance Through All Remaining Weeks -> Season Complete (Point 10)
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Full Season Progression & Season Complete Banner ---');
  const remainingFixtures = afterWeek2State.fixtures.filter((f) => f.status !== 'COMPLETED');
  for (const f of remainingFixtures) {
    DraftMultiplayerStore.simulateFixture(room.id, f.id);
  }

  const finalState = DraftMultiplayerStore.getRoom(room.id)!;
  assert('All league fixtures COMPLETED', finalState.fixtures.every((f) => f.status === 'COMPLETED'));
  assert('Room status is LEAGUE_COMPLETED', finalState.room.status === 'LEAGUE_COMPLETED');
  assert('Room leaguePhase is SEASON_COMPLETE', finalState.room.leaguePhase === 'SEASON_COMPLETE');
  assert('League awards computed with Champion Club Name', !!finalState.awards && !!finalState.awards.championClubName);

  console.log(`\n🏆 CHAMPION: ${finalState.awards?.championClubName}`);
  console.log(`⚽ TOP SCORER: ${finalState.awards?.topScorer?.playerName} (${finalState.awards?.topScorer?.goals} goals)`);
  console.log(`⭐ MVP: ${finalState.awards?.bestRating?.playerName} (${finalState.awards?.bestRating?.rating}/10)`);

  console.log('\nFINAL STANDINGS TABLE:');
  console.table(
    finalState.standings.map((s) => ({
      Rank: s.rank,
      Club: s.clubName,
      O: s.played,
      G: s.won,
      B: s.drawn,
      M: s.lost,
      AG: s.goalsFor,
      YG: s.goalsAgainst,
      AV: s.goalDifference,
      PTS: s.points,
      Form: s.form.join('-'),
    }))
  );

  console.log('\n================================================================');
  console.log(`VERIFICATION RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  console.log('================================================================');

  if (passedChecks === totalChecks) {
    console.log('STATUS: FULL PASS');
  } else {
    console.error('STATUS: FAIL');
    process.exit(1);
  }
}

runDraftLeagueLoopVerification().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
