import { config } from 'dotenv';
config({ path: '.env.local' });

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import { getSupabaseClient } from '../src/lib/supabase/client';

async function runHostGuestSyncTest() {
  console.log('--- STARTING HOST-GUEST MULTIPLAYER SYNC TEST ---');

  const supabase = getSupabaseClient();
  console.log('Supabase configured:', Boolean(supabase));

  // 1. Host creates room
  const hostSessionId = `host-session-${Date.now()}`;
  const hostUsername = 'KurucuAli';
  console.log(`\n1. Creating room for Host: ${hostUsername} (${hostSessionId})...`);

  const createRes = await DraftMultiplayerStore.createRoomAsync(
    hostUsername,
    hostSessionId,
    PRESET_CLOSED_ALPHA_4,
    'Sync Test Odası'
  );

  if (!createRes.success || !createRes.state) {
    console.error('FAILED to create room:', createRes.error);
    process.exit(1);
  }

  const roomCode = createRes.state.room.roomCode;
  const roomId = createRes.state.room.id;
  const hostMemberId = createRes.state.members[0].id;
  console.log(`✓ Room created: Code=${roomCode}, ID=${roomId}, HostMemberId=${hostMemberId}`);

  // 2. Guest joins room
  const guestSessionId = `guest-session-${Date.now()}`;
  const guestUsername = 'MisafirBora';
  console.log(`\n2. Guest joining: ${guestUsername} (${guestSessionId})...`);

  const joinRes = await DraftMultiplayerStore.joinRoomAsync(
    roomCode,
    guestUsername,
    guestSessionId,
    false
  );

  if (!joinRes.success || !joinRes.currentMember) {
    console.error('FAILED guest join:', joinRes.error);
    process.exit(1);
  }

  const guestMemberId = joinRes.currentMember.id;
  console.log(`✓ Guest joined: MemberId=${guestMemberId}, ClubId=${joinRes.currentMember.clubId}`);

  // 3. Guest toggles ready
  console.log(`\n3. Guest toggling ready state...`);
  const readyRes = await DraftMultiplayerStore.toggleMemberReadyAsync(roomId, guestMemberId);
  const guestInReady = readyRes.state?.members.find((m) => m.id === guestMemberId);
  console.log(`✓ Guest ready status in memory: isReady=${guestInReady?.isReady}`);

  // 4. Verify Lobby state from Guest's perspective before start
  console.log(`\n4. Hydrating room from Guest perspective (before start)...`);
  const guestLobbyHydration = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, guestSessionId);
  console.log(`Guest sees: status=${guestLobbyHydration.state?.room.status}, membersCount=${guestLobbyHydration.state?.members.length}`);

  if (guestLobbyHydration.state?.room.status !== 'LOBBY') {
    console.error('FAILED: expected status LOBBY before start');
    process.exit(1);
  }

  // 5. Setup Realtime subscription on Guest side to measure sync latency
  console.log(`\n5. Setting up Realtime subscription on Guest side...`);
  let realtimeTriggered = false;
  let realtimeReceivedTime = 0;
  const startTime = Date.now();

  const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, (event) => {
    console.log(`[REALTIME GUEST RECEIVE]:`, event);
    realtimeTriggered = true;
    realtimeReceivedTime = Date.now();
  });

  // 6. Host starts the draft via startDraftAsync
  console.log(`\n6. Host starting draft via startDraftAsync...`);
  const startDraftTime = Date.now();
  const startRes = await DraftMultiplayerStore.startDraftAsync(roomId, hostMemberId);

  if (!startRes.success || !startRes.state) {
    console.error('FAILED startDraftAsync:', startRes.error);
    process.exit(1);
  }

  const hostNavigatedState = startRes.state;
  console.log(`✓ Host draft started in DB! Status=${hostNavigatedState.room.status}, StateVersion=${hostNavigatedState.room.stateVersion}`);

  // 7. Verify Guest hydration immediately receives DRAFTING status
  console.log(`\n7. Hydrating room from Guest perspective (immediately after host start)...`);
  const guestDraftHydration = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, guestSessionId);
  const guestStatus = guestDraftHydration.state?.room.status;
  const guestDraftState = guestDraftHydration.state?.draftState;

  console.log(`Guest sees room.status = ${guestStatus}`);
  console.log(`Guest sees draftState defined = ${Boolean(guestDraftState)}`);
  console.log(`Guest sees currentTurnMemberId = ${guestDraftState?.currentTurnMemberId}`);

  if (guestStatus !== 'DRAFTING') {
    console.error(`FAILED: Guest was stuck in ${guestStatus} instead of DRAFTING!`);
    process.exit(1);
  }

  // 8. Test 4 Human Managers (Host + 3 Guests) complete transition test
  console.log(`\n8. Testing 4-Human Manager Room Sync...`);
  const host4Session = `host4-${Date.now()}`;
  const room4Res = await DraftMultiplayerStore.createRoomAsync('Host4', host4Session, PRESET_CLOSED_ALPHA_4, '4-Player Sync');
  const code4 = room4Res.state!.room.roomCode;
  const id4 = room4Res.state!.room.id;
  const host4MemId = room4Res.state!.members[0].id;

  const guestSessions = ['guest1', 'guest2', 'guest3'].map((g) => `${g}-${Date.now()}`);
  for (let i = 0; i < guestSessions.length; i++) {
    const gRes = await DraftMultiplayerStore.joinRoomAsync(code4, `User${i + 1}`, guestSessions[i], false);
    await DraftMultiplayerStore.toggleMemberReadyAsync(id4, gRes.currentMember!.id);
  }

  const start4Res = await DraftMultiplayerStore.startDraftAsync(id4, host4MemId);
  if (!start4Res.success) {
    console.error('FAILED 4-player start draft:', start4Res.error);
    process.exit(1);
  }

  // Check all 4 sessions see DRAFTING
  const hydHost = await DraftMultiplayerStore.hydrateDraftRoom(code4, host4Session);
  console.log(`Host sees status = ${hydHost.state?.room.status}`);
  for (let i = 0; i < guestSessions.length; i++) {
    const hydGuest = await DraftMultiplayerStore.hydrateDraftRoom(code4, guestSessions[i]);
    console.log(`Guest ${i + 1} (${guestSessions[i]}) sees status = ${hydGuest.state?.room.status}`);
    if (hydGuest.state?.room.status !== 'DRAFTING') {
      console.error(`FAILED: Guest ${i + 1} stuck in lobby!`);
      process.exit(1);
    }
  }

  unsubscribe();
  console.log('\n========================================');
  console.log('✅ ALL HOST-GUEST SYNC TESTS PASSED PERFECTLY!');
  console.log('========================================');
  process.exit(0);
}

runHostGuestSyncTest().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
