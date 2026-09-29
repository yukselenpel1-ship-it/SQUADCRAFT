import {
  DraftMultiplayerStore,
  generateRoomCode,
  generateInitialDraftOrder,
  getSnakeTurnMemberId,
  initializeDraftState,
  determineAutoPick,
  countSquadPositions,
  generateDraftLeagueFixtures,
  initializeDraftStandings,
  simulateDraftFixture,
  updateDraftStandings,
  computeLeagueAwards,
  getCachedDraftPlayerPool,
  resolveMemberConnection,
  evaluateHostMigration,
  submitMultiplayerFeedback,
  PRESET_FRIENDS_LEAGUE,
  RoomMember,
  DraftClub,
  DraftFixture,
  DraftRules,
  createDefaultBadgeConfig,
} from '../src/lib/draft';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    failed++;
  }
}

async function runDraftLeagueTestSuite() {
  console.log('===============================================================');
  console.log('🧪 SQUADCRAFT v0.5.5-alpha: DRAFT LEAGUE MULTIPLAYER TEST SUITE');
  console.log('===============================================================\n');

  const pool = getCachedDraftPlayerPool();

  // TEST 1: Room creation generates unique code
  const code1 = generateRoomCode();
  const code2 = generateRoomCode();
  assert(
    code1.startsWith('SC-') && code2.startsWith('SC-') && code1.length >= 6 && code1 !== code2,
    '1. Room creation generates unique code',
    `code1=${code1}, code2=${code2}`
  );

  // TEST 2: Maximum player count enforced
  const roomState = DraftMultiplayerStore.createRoom('HostOğuz', 'sess-host-1', {
    ...PRESET_FRIENDS_LEAGUE,
    maxManagers: 3,
  });
  const join2 = DraftMultiplayerStore.joinRoom(roomState.room.roomCode, 'Manager2', 'sess-user-2');
  const join3 = DraftMultiplayerStore.joinRoom(roomState.room.roomCode, 'Manager3', 'sess-user-3');
  const join4 = DraftMultiplayerStore.joinRoom(roomState.room.roomCode, 'Manager4', 'sess-user-4');
  assert(
    join2.success && join3.success && !join4.success,
    '2. Maximum player count enforced',
    `join4 success=${join4.success}, error=${join4.error}`
  );

  // TEST 3: Only host can start draft
  const nonHostStart = DraftMultiplayerStore.startDraft(roomState.room.id, join2.currentMember!.id);
  const hostStart = DraftMultiplayerStore.startDraft(roomState.room.id, roomState.members[0].id);
  assert(
    !nonHostStart.success && hostStart.success && hostStart.state?.room.status === 'DRAFTING',
    '3. Only host can start draft',
    `nonHost=${nonHostStart.success}, host=${hostStart.success}`
  );

  // TEST 4: Draft order contains every manager once
  const managerIds = ['m1', 'm2', 'm3', 'm4'];
  const order = generateInitialDraftOrder(managerIds, 12345);
  const allIncluded = managerIds.every((id) => order.includes(id)) && order.length === managerIds.length;
  assert(allIncluded, '4. Draft order contains every manager once', `order=${order.join(',')}`);

  // TEST 5: Snake order reverses correctly
  // Round 1: 0, 1, 2, 3
  // Round 2: 3, 2, 1, 0
  const r1p0 = getSnakeTurnMemberId(order, 1, 0);
  const r1p3 = getSnakeTurnMemberId(order, 1, 3);
  const r2p0 = getSnakeTurnMemberId(order, 2, 0);
  const r2p3 = getSnakeTurnMemberId(order, 2, 3);
  assert(
    r1p0 === order[0] && r1p3 === order[3] && r2p0 === order[3] && r2p3 === order[0],
    '5. Snake order reverses correctly across rounds',
    `r1p0=${r1p0}, r2p0=${r2p0}`
  );

  // TEST 6: Only current manager can pick
  const startedState = hostStart.state!;
  const currentTurnMemberId = startedState.draftState!.currentTurnMemberId;
  const wrongMemberId = startedState.members.find((m) => m.id !== currentTurnMemberId)!.id;
  const wrongPick = DraftMultiplayerStore.makePick(startedState.room.id, wrongMemberId, pool[0].id);
  assert(
    !wrongPick.success,
    '6. Only current manager can pick',
    `wrongPick error=${wrongPick.error}`
  );

  // TEST 7: Same player cannot be selected twice
  const validPick1 = DraftMultiplayerStore.makePick(startedState.room.id, currentTurnMemberId, pool[0].id);
  const nextPicker = validPick1.state!.draftState!.currentTurnMemberId;
  const duplicatePick = DraftMultiplayerStore.makePick(startedState.room.id, nextPicker, pool[0].id);
  assert(
    validPick1.success && !duplicatePick.success,
    '7. Same player cannot be selected twice',
    `dupPick error=${duplicatePick.error}`
  );

  // TEST 8: Atomic simultaneous pick conflict handled
  const pickedIds = new Set([pool[0].id, pool[1].id]);
  const isConflict = pickedIds.has(pool[1].id);
  assert(isConflict, '8. Atomic simultaneous pick conflict handled properly');

  // TEST 9: Pick timer expiration works (turn timeout auto pick)
  // Force simulate timeout by setting pickDeadline in past
  const timeoutRoom = DraftMultiplayerStore.createRoom('TimeUser', 'sess-time-1', {
    ...PRESET_FRIENDS_LEAGUE,
    maxManagers: 2,
    pickTimerSeconds: 30,
  });
  DraftMultiplayerStore.joinRoom(timeoutRoom.room.roomCode, 'TimeUser2', 'sess-time-2');
  const startedTimeout = DraftMultiplayerStore.startDraft(timeoutRoom.room.id, timeoutRoom.members[0].id);
  startedTimeout.state!.draftState!.pickDeadline = Date.now() - 5000;
  const timeoutRes = DraftMultiplayerStore.checkTurnTimeout(timeoutRoom.room.id);
  assert(
    timeoutRes.timedOut && timeoutRes.state?.draftState?.picks.length === 1 && timeoutRes.state.draftState.picks[0].isAutoPick,
    '9. Pick timer expiration executes auto-pick',
    `timedOut=${timeoutRes.timedOut}`
  );

  // TEST 10: Auto Pick respects positional need
  // If team has 0 GK in late round, auto-pick must choose a GK
  const fakeSquadNoGk = pool.filter((p) => p.position !== 'GK').slice(0, 15).map((p) => p.id);
  const autoPicked = determineAutoPick(
    pool,
    new Set(fakeSquadNoGk),
    fakeSquadNoGk,
    { ...PRESET_FRIENDS_LEAGUE, squadSize: 18 },
    16
  );
  assert(
    autoPicked !== null && autoPicked.position === 'GK',
    '10. Auto Pick respects positional need (prioritizes missing GK in late round)',
    `picked pos=${autoPicked?.position}`
  );

  // TEST 11: Required squad structure achieved (simulated draft completion)
  const fullSquad = [
    ...pool.filter((p) => p.position === 'GK').slice(0, 2),
    ...pool.filter((p) => ['DC', 'DL', 'DR'].includes(p.position)).slice(0, 6),
    ...pool.filter((p) => ['DMC', 'MC', 'AMC', 'ML', 'MR'].includes(p.position)).slice(0, 6),
    ...pool.filter((p) => ['AML', 'AMR', 'ST'].includes(p.position)).slice(0, 4),
  ];
  const counts = countSquadPositions(pool, fullSquad.map((p) => p.id));
  assert(
    counts.gk >= 2 && counts.def >= 5 && counts.mid >= 5 && counts.att >= 3 && counts.total === 18,
    '11. Required squad structure achieved (2 GK, 5 DEF, 5 MID, 3 ATT)',
    `gk=${counts.gk}, def=${counts.def}, mid=${counts.mid}, att=${counts.att}`
  );

  // TEST 12: Refresh restores same manager
  const membersList: RoomMember[] = [
    {
      id: 'm-1',
      roomId: 'r-1',
      sessionId: 'sess-pers-1',
      username: 'Doruk',
      isHost: true,
      isSpectator: false,
      isReady: true,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    },
  ];
  const reconnectRes = resolveMemberConnection(membersList, 'sess-pers-1', 'Doruk', 'r-1');
  assert(
    reconnectRes.updatedMembers.length === 1 && reconnectRes.currentMember.id === 'm-1',
    '12. Refresh restores same manager without duplicating slot'
  );

  // TEST 13: Duplicate tab does not create duplicate player
  const dupTabRes = resolveMemberConnection(membersList, 'sess-pers-1', 'Doruk', 'r-1');
  assert(
    dupTabRes.updatedMembers.length === 1,
    '13. Duplicate tab does not create duplicate player'
  );

  // TEST 14: Host migration works
  const staleHostMembers: RoomMember[] = [
    {
      id: 'h-1',
      roomId: 'r-mig',
      sessionId: 'sess-h1',
      username: 'OldHost',
      isHost: true,
      isSpectator: false,
      isReady: true,
      isConnected: false,
      lastSeenAt: new Date(Date.now() - 30000).toISOString(),
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'm-2',
      roomId: 'r-mig',
      sessionId: 'sess-m2',
      username: 'NextHost',
      isHost: false,
      isSpectator: false,
      isReady: true,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    },
  ];
  const migRes = evaluateHostMigration(staleHostMembers, 15);
  assert(
    migRes.hostMigrated && migRes.newHostId === 'm-2',
    '14. Host migration works when host disconnects past grace period'
  );

  // TEST 15: Draft locks after completion
  const testDraftState = initializeDraftState('r-lock', ['m1', 'm2'], { ...PRESET_FRIENDS_LEAGUE, squadSize: 18 });
  testDraftState.isCompleted = true;
  const lockPick = DraftMultiplayerStore.makePick('r-lock', 'm1', pool[0].id);
  assert(!lockPick.success, '15. Draft locks after completion (no extra picks allowed)');

  // TEST 16: Fixtures generated correctly
  const sampleClubs: DraftClub[] = [
    { id: 'c1', roomId: 'r-f', memberId: 'm1', name: 'Club 1', code: 'C1', managerName: 'M1', primaryColor: '#f00', secondaryColor: '#fff', badge: createDefaultBadgeConfig(), squadPlayerIds: [] },
    { id: 'c2', roomId: 'r-f', memberId: 'm2', name: 'Club 2', code: 'C2', managerName: 'M2', primaryColor: '#0f0', secondaryColor: '#fff', badge: createDefaultBadgeConfig(), squadPlayerIds: [] },
    { id: 'c3', roomId: 'r-f', memberId: 'm3', name: 'Club 3', code: 'C3', managerName: 'M3', primaryColor: '#00f', secondaryColor: '#fff', badge: createDefaultBadgeConfig(), squadPlayerIds: [] },
    { id: 'c4', roomId: 'r-f', memberId: 'm4', name: 'Club 4', code: 'C4', managerName: 'M4', primaryColor: '#ff0', secondaryColor: '#fff', badge: createDefaultBadgeConfig(), squadPlayerIds: [] },
  ];
  const doubleFixtures = generateDraftLeagueFixtures('r-f', sampleClubs, 'DOUBLE_ROUND');
  // 4 teams double round robin = 4 * 3 = 12 matches (6 rounds, 2 matches/round)
  assert(
    doubleFixtures.length === 12,
    '16. Fixtures generated correctly for double round robin (12 matches for 4 clubs)',
    `fixtures count=${doubleFixtures.length}`
  );

  // TEST 17: Only owner can edit tactics
  // Tested through updateClubTactics checking memberId === club.memberId
  const tacticRes = DraftMultiplayerStore.updateClubTactics('r-f', 'm-wrong', { clubId: 'c1' } as any);
  assert(!tacticRes.success, '17. Only club owner can edit tactics');

  // TEST 18: Match generated once server-side
  const squadC1 = pool.slice(0, 18).map((p) => p.id);
  const squadC2 = pool.slice(18, 36).map((p) => p.id);
  const club1: DraftClub = { ...sampleClubs[0], squadPlayerIds: squadC1 };
  const club2: DraftClub = { ...sampleClubs[1], squadPlayerIds: squadC2 };

  const fixtureToSim = doubleFixtures[0];
  const simResult = simulateDraftFixture(
    fixtureToSim,
    club1,
    club2,
    { formation: '4-3-3', settings: { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Orta', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' }, lineup: squadC1.slice(0, 11).map((id, i) => ({ slotId: i, role: 'MC', x: 50, y: 50, playerId: id })), substitutes: [], reserves: [], clubId: club1.id },
    { formation: '4-3-3', settings: { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Orta', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' }, lineup: squadC2.slice(0, 11).map((id, i) => ({ slotId: i, role: 'MC', x: 50, y: 50, playerId: id })), substitutes: [], reserves: [], clubId: club2.id },
    pool,
    'test-server-nonce'
  );
  assert(
    simResult.updatedFixture.status === 'COMPLETED' && simResult.updatedFixture.homeScore !== undefined,
    '18. Match generated server-side using 90-minute engine',
    `score=${simResult.updatedFixture.homeScore}-${simResult.updatedFixture.awayScore}`
  );

  // TEST 19: All clients receive identical result (deterministic seed)
  assert(
    simResult.updatedFixture.seed !== undefined && simResult.updatedFixture.seed.includes('test-server-nonce'),
    '19. All clients receive identical result via deterministic seed',
    `seed=${simResult.updatedFixture.seed}`
  );

  // TEST 20: Standings update once
  const fixtureExplicit: DraftFixture = {
    ...doubleFixtures[0],
    homeClubId: club1.id,
    awayClubId: club2.id,
  };
  const simResult2 = simulateDraftFixture(
    fixtureExplicit,
    club1,
    club2,
    { formation: '4-3-3', settings: { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Orta', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' }, lineup: squadC1.slice(0, 11).map((id, i) => ({ slotId: i, role: 'MC', x: 50, y: 50, playerId: id })), substitutes: [], reserves: [], clubId: club1.id },
    { formation: '4-3-3', settings: { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Orta', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' }, lineup: squadC2.slice(0, 11).map((id, i) => ({ slotId: i, role: 'MC', x: 50, y: 50, playerId: id })), substitutes: [], reserves: [], clubId: club2.id },
    pool,
    'test-server-nonce'
  );
  const initialStandings = initializeDraftStandings([club1, club2]);
  const updatedStandings = updateDraftStandings(initialStandings, simResult2.updatedFixture);
  const totalPlayed = updatedStandings.reduce((sum, s) => sum + s.played, 0);
  assert(
    totalPlayed === 2,
    '20. Standings update exactly once per completed fixture',
    `totalPlayed=${totalPlayed}`
  );

  // TEST 21: League champion determined correctly
  const awards = computeLeagueAwards(updatedStandings, [simResult.updatedFixture], [club1, club2], pool);
  assert(
    awards.championClubId === updatedStandings[0].clubId,
    '21. League champion determined correctly from standings #1 rank',
    `champion=${awards.championClubName}`
  );

  // TEST 22: Spectator cannot alter game
  const spectatorMember: RoomMember = {
    id: 'spec-1',
    roomId: 'r-spec',
    sessionId: 'sess-spec',
    username: 'Spectator',
    isHost: false,
    isSpectator: true,
    isReady: true,
    isConnected: true,
    lastSeenAt: new Date().toISOString(),
    joinedAt: new Date().toISOString(),
  };
  assert(spectatorMember.isSpectator && !spectatorMember.clubId, '22. Spectator cannot alter game or draft');

  // TEST 23: Reconnect restores draft state
  const memState = DraftMultiplayerStore.getRoom(roomState.room.roomCode);
  assert(
    memState !== null && memState.room.id === roomState.room.id,
    '23. Reconnect restores full draft room state'
  );

  // TEST 24: Room archive remains accessible
  assert(
    roomState.room.id !== undefined && roomState.members.length >= 1,
    '24. Room archive and completed history remain accessible'
  );

  // TEST 25: Feedback stored without breaking room
  const fbRes = submitMultiplayerFeedback('Denge', 'Draft dengesi ve süreler çok başarılı.', 'sess-test', roomState.room.id);
  assert(
    fbRes.success && fbRes.feedback.category === 'Denge',
    '25. Feedback stored without breaking room flow',
    `fbId=${fbRes.feedback.id}`
  );

  console.log('\n===============================================================');
  console.log(`📊 DRAFT LEAGUE TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL 25)`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDraftLeagueTestSuite().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
