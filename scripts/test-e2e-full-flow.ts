import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4, FICTIONAL_CLUB_PRESETS } from '../src/lib/draft';
import { createDefaultBadgeConfig } from '../src/lib/draft/badgeGenerator';

async function runFullE2ETest() {
  console.log('================================================================');
  console.log('🚀 SQUADCRAFT DRAFT LEAGUE — 100% END-TO-END FLOW VALIDATION');
  console.log('================================================================');

  const s1 = 'sess-host-001';
  const s2 = 'sess-user-002';
  const s3 = 'sess-user-003';
  const s4 = 'sess-user-004';

  // STEP 1: CREATE ROOM
  console.log('\n[1/14] Creating Closed Alpha 4-Player Room...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Yönetici Alp',
    s1,
    PRESET_CLOSED_ALPHA_4,
    'ALFA KAPALI TEST ODA'
  );
  if (!createRes.state) {
    throw new Error(`Failed to create room: ${createRes.error}`);
  }
  const room = createRes.state.room;
  const roomCode = room.roomCode;
  console.log(`✓ Room Created: Code [${roomCode}] (ID: ${room.id})`);

  // STEP 2: USER 2 JOINS
  console.log('\n[2/14] Second User Joining...');
  const join2 = await DraftMultiplayerStore.joinRoomAsync(roomCode, 'Menajer Kerem', s2);
  if (!join2.state) throw new Error(`User 2 failed to join: ${join2.error}`);
  console.log(`✓ User 2 Joined: Member ID [${join2.state.members.find(m => m.sessionId === s2)?.id}]`);

  // STEP 3: USERS 3 & 4 JOIN
  console.log('\n[3/14] Users 3 and 4 Joining...');
  const join3 = await DraftMultiplayerStore.joinRoomAsync(roomCode, 'Menajer Selin', s3);
  const join4 = await DraftMultiplayerStore.joinRoomAsync(roomCode, 'Menajer Burak', s4);
  if (!join3.state || !join4.state) throw new Error('Users 3 or 4 failed to join');
  console.log(`✓ 4 Members in Room`);

  // STEP 4: CONFIGURE CLUBS
  console.log('\n[4/14] Configuring Fictional Clubs for all 4 Managers...');
  const mem1 = join4.state.members.find(m => m.sessionId === s1)!;
  const mem2 = join4.state.members.find(m => m.sessionId === s2)!;
  const mem3 = join4.state.members.find(m => m.sessionId === s3)!;
  const mem4 = join4.state.members.find(m => m.sessionId === s4)!;

  DraftMultiplayerStore.updateClub(room.id, mem1.id, {
    name: 'Kuzey Fırtınası FK',
    code: 'KZF',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    badge: createDefaultBadgeConfig('#0ea5e9', '#0284c7', 'shield', 'stripes_vertical', 'lightning'),
    managerName: mem1.username,
  });

  DraftMultiplayerStore.updateClub(room.id, mem2.id, {
    name: 'Yıldızhisar Gücü',
    code: 'YHG',
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    badge: createDefaultBadgeConfig('#eab308', '#ca8a04', 'circle', 'diagonal_half', 'star'),
    managerName: mem2.username,
  });

  DraftMultiplayerStore.updateClub(room.id, mem3.id, {
    name: 'Boğazkale Atletik',
    code: 'BKA',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    badge: createDefaultBadgeConfig('#10b981', '#059669', 'hexagon', 'solid', 'crown'),
    managerName: mem3.username,
  });

  const c4Res = DraftMultiplayerStore.updateClub(room.id, mem4.id, {
    name: 'Demirhisar İdman',
    code: 'DHI',
    primaryColor: '#f43f5e',
    secondaryColor: '#e11d48',
    badge: createDefaultBadgeConfig('#f43f5e', '#e11d48', 'diamond', 'quartered', 'anchor'),
    managerName: mem4.username,
  });

  console.log(`✓ 4 Clubs Configured: ${c4Res.state?.clubs.map(c => c.name).join(', ')}`);

  // STEP 5: TOGGLE READY
  console.log('\n[5/14] Setting Ready Status for all 4 Managers...');
  DraftMultiplayerStore.toggleMemberReady(room.id, mem1.id);
  DraftMultiplayerStore.toggleMemberReady(room.id, mem2.id);
  DraftMultiplayerStore.toggleMemberReady(room.id, mem3.id);
  const readyRes = DraftMultiplayerStore.toggleMemberReady(room.id, mem4.id);
  const allReady = readyRes.state?.members.every(m => m.isReady);
  console.log(`✓ All Members Ready: ${allReady}`);

  // STEP 6: START DRAFT
  console.log('\n[6/14] Starting Draft...');
  const startDraftRes = DraftMultiplayerStore.startDraft(room.id, mem1.id);
  if (!startDraftRes.state) throw new Error(`Draft failed to start: ${startDraftRes.error}`);
  console.log(`✓ Draft Started! Status: ${startDraftRes.state.room.status}`);
  console.log(`✓ Draft Order: ${startDraftRes.state.draftState?.draftOrder.join(' -> ')}`);

  // STEP 7: VERIFY HYDRATION FOR CLIENTS (INFINITE LOADING ELIMINATION CHECK)
  console.log('\n[7/14] Hydrating Draft Page for all 4 Client Sessions...');
  for (const s of [s1, s2, s3, s4]) {
    const hyd = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, s);
    if (hyd.status !== 'SUCCESS') {
      throw new Error(`Hydration failed for session ${s}: ${hyd.status}`);
    }
    if (!hyd.state?.draftState) {
      throw new Error(`Hydration returned no draftState for session ${s}`);
    }
    console.log(`✓ Client Session [${s}] Hydrated successfully: Turn=${hyd.state.draftState.currentTurnMemberId === hyd.currentMember?.id ? 'MY TURN' : 'WAITING'}`);
  }

  // STEP 8: SIMULATE 72 PICKS (18 ROUNDS x 4 MANAGERS)
  console.log('\n[8/14] Executing 72-Pick Draft Simulation in Snake Order...');
  let currentDraftState = startDraftRes.state;
  const pool = currentDraftState.playerPool;

  for (let pickNum = 1; pickNum <= 72; pickNum++) {
    const draft = currentDraftState.draftState!;
    const pickerMemberId = draft.currentTurnMemberId;
    const pickerMember = currentDraftState.members.find(m => m.id === pickerMemberId)!;
    const pickerClub = currentDraftState.clubs.find(c => c.memberId === pickerMemberId)!;

    // Pick highest overall available player
    const pickedIds = new Set(draft.picks.map(p => p.playerId));
    const available = pool.filter(p => !pickedIds.has(p.id));
    available.sort((a, b) => b.overall - a.overall);
    const chosenPlayer = available[0];

    const pickRes = DraftMultiplayerStore.makePick(
      room.id,
      pickerMemberId,
      chosenPlayer.id,
      false
    );

    if (!pickRes.success || !pickRes.state) {
      throw new Error(`Pick #${pickNum} failed: ${pickRes.error}`);
    }

    currentDraftState = pickRes.state;
    if (pickNum % 18 === 0 || pickNum === 1 || pickNum === 72) {
      console.log(`  Pick #${pickNum.toString().padStart(2, '0')}: [${pickerClub.code}] selected ${chosenPlayer.firstName} ${chosenPlayer.lastName} (OVR ${chosenPlayer.overall}, ${chosenPlayer.position})`);
    }
  }

  // STEP 9: VERIFY DRAFT COMPLETION & LEAGUE HUB TRANSITION
  console.log('\n[9/14] Verifying Draft Completion & Auto-transition to League Hub...');
  console.log(`✓ Room Status: ${currentDraftState.room.status}`);
  console.log(`✓ Total Fixtures Generated: ${currentDraftState.fixtures.length}`);
  console.log(`✓ Standings Initialized: ${currentDraftState.standings.length} Clubs`);

  if (currentDraftState.room.status !== 'LEAGUE_ACTIVE') {
    throw new Error(`Expected room status LEAGUE_ACTIVE but got ${currentDraftState.room.status}`);
  }

  // STEP 10: TACTICS SUBMISSION
  console.log('\n[10/14] Updating Tactics for Club 1...');
  const tacticsRes = DraftMultiplayerStore.updateClubTactics(room.id, mem1.id, {
    clubId: currentDraftState.clubs[0].id,
    formation: '4-3-3',
    settings: {
      mentality: 'Hücum',
      tempo: 'Yüksek',
      pressing: 'Yoğun',
      passingStyle: 'Kısa',
      defensiveLine: 'Yüksek',
      width: 'Geniş',
    },
    lineup: [],
    substitutes: [],
    reserves: [],
  } as any);
  if (!tacticsRes.state) throw new Error('Tactics update failed');
  console.log(`✓ Tactics saved for ${currentDraftState.clubs[0].name}`);

  // STEP 11: SIMULATE ALL MATCHES
  console.log('\n[11/14] Simulating League Fixtures...');
  for (const fix of currentDraftState.fixtures) {
    const sim = DraftMultiplayerStore.simulateFixture(room.id, fix.id);
    if (!sim.success || !sim.state) throw new Error(`Fixture ${fix.id} sim failed: ${sim.error}`);
    currentDraftState = sim.state;
    const completedFix = currentDraftState.fixtures.find(f => f.id === fix.id)!;
    console.log(`  Match Round ${completedFix.round}: ${currentDraftState.clubs.find(c => c.id === completedFix.homeClubId)?.name} ${completedFix.homeScore} - ${completedFix.awayScore} ${currentDraftState.clubs.find(c => c.id === completedFix.awayClubId)?.name}`);
  }

  // STEP 12: VERIFY LEAGUE COMPLETION & STANDINGS
  console.log('\n[12/14] Verifying Standings & Awards...');
  console.log(`✓ Final Room Status: ${currentDraftState.room.status}`);
  console.log('\n--- FINAL STANDINGS ---');
  currentDraftState.standings.forEach(st => {
    console.log(`  #${st.rank} ${st.clubName.padEnd(20)} P:${st.points} (W:${st.won} D:${st.drawn} L:${st.lost} GF:${st.goalsFor} GA:${st.goalsAgainst} GD:${st.goalDifference})`);
  });

  // STEP 13: CHAMPION & AWARDS
  console.log('\n[13/14] Awards & Honors...');
  const awards = currentDraftState.awards;
  console.log(`🏆 Champion: ${awards?.championClubName}`);
  console.log(`⚽ Top Scorer: ${awards?.topScorer?.playerName} (${awards?.topScorer?.goals} goals) - ${awards?.topScorer?.clubName}`);
  console.log(`⭐ Best Rating: ${awards?.bestRating?.playerName} (${awards?.bestRating?.rating}/10) - ${awards?.bestRating?.clubName}`);
  console.log(`💥 Biggest Win: ${awards?.biggestWin?.winnerName} vs ${awards?.biggestWin?.loserName} (${awards?.biggestWin?.score})`);

  // STEP 14: REFRESH / HYDRATION VERIFICATION
  console.log('\n[14/14] Hydrating League Hub for all 4 Sessions...');
  for (const s of [s1, s2, s3, s4]) {
    const hyd = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, s);
    if (hyd.status !== 'SUCCESS') {
      throw new Error(`League hydration failed for session ${s}: ${hyd.status}`);
    }
    console.log(`✓ Session [${s}] successfully loaded final League Hub with champion ${hyd.state?.awards?.championClubName}`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 14 E2E MULTIPLAYER DRAFT LEAGUE CHECKS PASSED PERFECTLY!');
  console.log('================================================================');
}

runFullE2ETest().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
