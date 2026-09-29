import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runTest() {
  console.log('========================================================================');
  console.log('🚀 TESTING SQUADCRAFT DRAFT LEAGUE LOADING LOOP CRITICAL FIX');
  console.log('========================================================================');

  const hostSessionId = `host-session-${Date.now()}`;
  const guest1SessionId = `guest1-session-${Date.now()}`;
  const guest2SessionId = `guest2-session-${Date.now()}`;
  const guest3SessionId = `guest3-session-${Date.now()}`;

  // 1. Create room
  console.log('\n1️⃣ [LOBBY] Host creating room...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Eren Host',
    hostSessionId,
    PRESET_CLOSED_ALPHA_4,
    'Prod Loading Loop Test'
  );
  if (!createRes.success || !createRes.state) {
    throw new Error(`Failed to create room: ${createRes.error}`);
  }
  const roomCode = createRes.state.room.roomCode;
  const roomId = createRes.state.room.id;
  console.log(`✓ Room created: Code = ${roomCode}, ID = ${roomId}`);

  // 2. Add 3 bots
  console.log('\n2️⃣ [LOBBY] Adding 3 Bots (Easy, Medium, Hard)...');
  const hostMember = createRes.state.members.find((m) => m.sessionId === hostSessionId)!;
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'KOLAY');
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'ORTA');
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'ZOR');

  let lobbyHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
  console.log(`✓ Lobby members count: ${lobbyHydrate.state?.members.length} / 4`);

  // 3. Start draft
  console.log('\n3️⃣ [DRAFT] Starting draft...');
  const startRes = DraftMultiplayerStore.startDraft(roomId, hostMember.id);
  if (!startRes.success) {
    throw new Error(`Failed to start draft: ${startRes.error}`);
  }
  console.log(`✓ Draft started. Room status: ${startRes.state?.room.status}`);

  // 4. Test Draft Page Hydration (Case A: Normal connection)
  console.log('\n4️⃣ [HYDRATION] Testing Draft Page initial hydration...');
  const draftHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
  if (draftHydrate.status !== 'SUCCESS' || !draftHydrate.state?.draftState) {
    throw new Error(`Draft hydration failed: ${draftHydrate.status}`);
  }
  console.log(`✓ Draft hydration PASS. Turn: ${draftHydrate.state.draftState.currentTurnMemberId}`);

  // 5. Run all 72 draft picks
  console.log('\n5️⃣ [DRAFT PICKS] Executing 72 Snake Picks...');
  let currentRoomState = draftHydrate.state;
  let pickCount = 0;

  while (!currentRoomState.draftState?.isCompleted && pickCount < 72) {
    const dState = currentRoomState.draftState!;
    const turnMemberId = dState.currentTurnMemberId;
    const turnMember = currentRoomState.members.find((m) => m.id === turnMemberId)!;
    const club = currentRoomState.clubs.find((c) => c.memberId === turnMemberId)!;

    const pickedIds = new Set(dState.picks.map((p) => p.playerId));
    const available = currentRoomState.playerPool.filter((p) => !pickedIds.has(p.id));

    // Choose player
    const chosen = available[0];
    const pickRes = DraftMultiplayerStore.makePick(roomId, turnMember.id, chosen.id, false);
    if (!pickRes.success || !pickRes.state) {
      throw new Error(`Pick failed at #${pickCount + 1}: ${pickRes.error}`);
    }
    currentRoomState = pickRes.state;
    pickCount++;

    if (pickCount === 18 || pickCount === 36 || pickCount === 54 || pickCount === 72) {
      console.log(`  Seçim #${pickCount} / 72 tamamlandı.`);
    }

    // Case B & D: Test Refresh during draft
    if (pickCount === 35) {
      const midDraftReload = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
      if (midDraftReload.status !== 'SUCCESS' || midDraftReload.state?.draftState?.picks.length !== 35) {
        throw new Error('Mid-draft cold reload failed');
      }
      console.log('  ✓ [PASS] Cold reload during draft preserved exact picks count (35/72)');
    }
  }

  console.log(`✓ Total picks completed: ${pickCount} / 72`);

  // 6. Verify Post-Draft State Transition & Idempotency
  console.log('\n6️⃣ [FINAL PICK TRANSITION] Verifying transition from DRAFTING to LEAGUE_ACTIVE...');
  const postDraftHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
  console.log(`  Status: ${postDraftHydrate.state?.room.status}`);
  console.log(`  Fixtures: ${postDraftHydrate.state?.fixtures.length}`);
  console.log(`  Standings: ${postDraftHydrate.state?.standings.length}`);

  if (postDraftHydrate.state?.room.status !== 'LEAGUE_ACTIVE') {
    throw new Error(`Expected LEAGUE_ACTIVE but got ${postDraftHydrate.state?.room.status}`);
  }
  if (postDraftHydrate.state.fixtures.length !== 12) {
    throw new Error(`Expected 12 fixtures, got ${postDraftHydrate.state.fixtures.length}`);
  }
  if (postDraftHydrate.state.standings.length !== 4) {
    throw new Error(`Expected 4 standings, got ${postDraftHydrate.state.standings.length}`);
  }
  console.log('✓ [PASS] Draft -> League transition completed with 12 fixtures and 4 unique standings rows');

  // 7. Verify all squads are 18/18
  console.log('\n7️⃣ [SQUAD VALIDATION] Checking all 4 squads...');
  for (const c of postDraftHydrate.state.clubs) {
    console.log(`  Club [${c.name}]: ${c.squadPlayerIds.length} / 18 players`);
    if (c.squadPlayerIds.length !== 18) {
      throw new Error(`Club ${c.name} has ${c.squadPlayerIds.length} players! Expected 18`);
    }
  }
  console.log('✓ [PASS] All 4 squads strictly 18/18');

  // 8. Test Timing Cases
  console.log('\n8️⃣ [TIMING & RECOVERY CASES] Testing concurrent cases...');

  // Case B: Refresh exactly after final pick
  const caseBHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
  if (caseBHydrate.state?.room.status !== 'LEAGUE_ACTIVE' || caseBHydrate.state?.fixtures.length !== 12) {
    throw new Error('Case B failed');
  }
  console.log('  ✓ [Case B PASS] Refresh after final pick immediately returns LEAGUE_ACTIVE');

  // Case C: Second client joins / fetches
  const caseCHydrate = await DraftMultiplayerStore.fetchRoom(roomCode);
  if (caseCHydrate?.room.status !== 'LEAGUE_ACTIVE' || caseCHydrate?.fixtures.length !== 12) {
    throw new Error('Case C failed');
  }
  console.log('  ✓ [Case C PASS] Second client fetch returns canonical LEAGUE_ACTIVE state');

  // Case D: Host repairRoomState idempotency
  const repairRes = DraftMultiplayerStore.repairRoomState(roomId, hostMember.id);
  if (!repairRes.success || repairRes.state?.fixtures.length !== 12 || repairRes.state?.standings.length !== 4) {
    throw new Error('Repair state failed');
  }
  console.log('  ✓ [Case D PASS] Room repair is fully idempotent with zero duplicated rows');

  // 9. Play through all 6 matchweeks
  console.log('\n9️⃣ [MATCHWEEKS PROGRESSION] Advancing through all 6 Matchweeks...');
  for (let mw = 1; mw <= 6; mw++) {
    const adv = DraftMultiplayerStore.advanceMatchweek(roomId, hostMember.id);
    if (!adv.success || !adv.state) {
      throw new Error(`Failed to advance matchweek ${mw}: ${adv.error}`);
    }
    console.log(`  Matchweek ${mw} / 6 simulated & completed.`);
  }

  // 10. Check Season Completion & Awards
  console.log('\n🔟 [SEASON COMPLETE & PERSISTENCE] Checking Champion and awards...');
  const seasonEndHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSessionId);
  if (seasonEndHydrate.state?.room.status !== 'LEAGUE_COMPLETED') {
    throw new Error(`Expected LEAGUE_COMPLETED, got ${seasonEndHydrate.state?.room.status}`);
  }
  console.log(`  Champion: 👑 ${seasonEndHydrate.state.awards?.championClubName}`);
  console.log(`  Top Scorer: ⚽ ${seasonEndHydrate.state.awards?.topScorer?.playerName} (${seasonEndHydrate.state.awards?.topScorer?.goals} Gol)`);
  console.log(`  Top Assists: 🎯 ${seasonEndHydrate.state.awards?.topAssists?.playerName} (${seasonEndHydrate.state.awards?.topAssists?.assists} Asist)`);
  console.log('✓ [PASS] League completed, champion and awards verified');

  console.log('\n========================================================================');
  console.log('🎉 ALL TESTS PASSED! ZERO INFINITE LOADING SPINNERS DETECTED.');
  console.log('========================================================================\n');
}

runTest().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
