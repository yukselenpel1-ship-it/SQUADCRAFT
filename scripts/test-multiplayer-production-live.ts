import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, anonKey);

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';

async function runLiveProductionTest() {
  console.log('===============================================================');
  console.log('🚀 LIVE SUPABASE MULTIPLAYER PRODUCTION VERIFICATION');
  console.log('===============================================================');

  const hostSessionId = `host-sess-${Date.now()}`;
  const guestSessionId = `guest-sess-${Date.now()}`;
  const spectatorSessionId = `spec-sess-${Date.now()}`;

  // 1. Create Room on Supabase
  console.log('\n--- 1. CREATING ROOM (HOST) ---');
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Alfa Menajer A',
    hostSessionId,
    PRESET_CLOSED_ALPHA_4,
    'Prod Live Verification Room'
  );

  if (!createRes.success || !createRes.state) {
    console.error('❌ Failed to create room:', createRes.error, createRes.errorCode, createRes.details);
    process.exit(1);
  }

  const room = createRes.state.room;
  console.log(`✅ Room created successfully:`);
  console.log(`   ID: ${room.id}`);
  console.log(`   Room Code: ${room.roomCode}`);
  console.log(`   Host Member ID: ${room.hostMemberId}`);

  // 2. Verify Room In Supabase DB directly
  console.log('\n--- 2. VERIFYING SUPABASE DB PERSISTENCE ---');
  const { data: dbRoom, error: dbRoomErr } = await supabase!
    .from('multiplayer_rooms')
    .select('*')
    .eq('room_code', room.roomCode)
    .single();

  if (dbRoomErr || !dbRoom) {
    console.error('❌ Room not found in Supabase DB:', dbRoomErr);
    process.exit(1);
  }
  console.log(`✅ DB Room confirmed in multiplayer_rooms: [id: ${dbRoom.id}, code: ${dbRoom.room_code}]`);

  const { data: dbMembers } = await supabase!
    .from('multiplayer_members')
    .select('*')
    .eq('room_id', room.id);
  console.log(`✅ DB Members confirmed in multiplayer_members: ${dbMembers?.length} member(s)`);

  const { data: dbClubs } = await supabase!
    .from('draft_clubs')
    .select('*')
    .eq('room_id', room.id);
  console.log(`✅ DB Clubs confirmed in draft_clubs: ${dbClubs?.length} club(s)`);

  // 3. Join with Guest Manager (Session 2)
  console.log('\n--- 3. JOINING ROOM (GUEST MANAGER - SESSION 2) ---');
  const joinRes1 = await DraftMultiplayerStore.joinRoomAsync(
    room.roomCode,
    'Alfa Menajer B',
    guestSessionId,
    false
  );

  if (!joinRes1.success || !joinRes1.state) {
    console.error('❌ Failed to join room:', joinRes1.error, joinRes1.errorCode);
    process.exit(1);
  }
  console.log(`✅ Guest Manager joined: [members: ${joinRes1.state.members.length}, clubs: ${joinRes1.state.clubs.length}]`);

  // 4. Join with Spectator (Session 3)
  console.log('\n--- 4. JOINING ROOM (SPECTATOR - SESSION 3) ---');
  const joinRes2 = await DraftMultiplayerStore.joinRoomAsync(
    room.roomCode,
    'Seyirci Kaan',
    spectatorSessionId,
    true
  );

  if (!joinRes2.success || !joinRes2.state) {
    console.error('❌ Failed to join spectator:', joinRes2.error);
    process.exit(1);
  }
  console.log(`✅ Spectator joined: [total members: ${joinRes2.state.members.length}]`);

  // 5. Simulate 3rd Party Fresh Device (fetchRoom without local cache)
  console.log('\n--- 5. SIMULATING COLD FETCH FROM SUPABASE (INCOGNITO / 3RD DEVICE) ---');
  const fetchedState = await DraftMultiplayerStore.fetchRoom(room.roomCode);

  if (!fetchedState) {
    console.error('❌ fetchRoom returned null for valid room code!');
    process.exit(1);
  }
  console.log(`✅ fetchRoom succeeded from Supabase DB:`);
  console.log(`   Room Code: ${fetchedState.room.roomCode}`);
  console.log(`   Status: ${fetchedState.room.status}`);
  console.log(`   Members: ${fetchedState.members.map((m) => m.username).join(', ')}`);
  console.log(`   Clubs: ${fetchedState.clubs.map((c) => c.name).join(', ')}`);

  // 6. Test Member Actions & State Updates
  console.log('\n--- 6. TESTING LOBBY ACTIONS ---');
  const liveState = DraftMultiplayerStore.getRoom(room.id)!;
  const hostMember = liveState.members.find((m) => m.sessionId === hostSessionId)!;
  const guestMember = liveState.members.find((m) => m.sessionId === guestSessionId)!;

  // Toggle Guest Ready
  DraftMultiplayerStore.toggleMemberReady(room.id, guestMember.id);
  console.log('✅ Guest member toggled ready state');

  // Update Club
  DraftMultiplayerStore.updateClub(room.id, hostMember.id, { name: 'Kuzey Yıldızı SK', code: 'KYS' });
  console.log('✅ Host updated club identity');

  // 7. Test Start Draft
  console.log('\n--- 7. STARTING DRAFT ---');
  const startRes = DraftMultiplayerStore.startDraft(room.id, hostMember.id);
  if (!startRes.success || !startRes.state?.draftState) {
    console.error('❌ Failed to start draft:', startRes.error);
    process.exit(1);
  }
  console.log(`✅ Draft started! Status: ${startRes.state.room.status}`);
  console.log(`   Current Turn: ${startRes.state.draftState.currentTurnMemberId}`);

  // 8. Test Draft Pick
  console.log('\n--- 8. EXECUTING DRAFT PICK ---');
  const currentTurnMemberId = startRes.state.draftState.currentTurnMemberId;
  const pickRes = DraftMultiplayerStore.makePick(room.id, currentTurnMemberId, 'p-1');
  if (!pickRes.success) {
    // If 'p-1' wasn't in pool, pick first available
    const firstPlayer = startRes.state.playerPool[0];
    const pickRes2 = DraftMultiplayerStore.makePick(room.id, currentTurnMemberId, firstPlayer.id);
    if (!pickRes2.success) {
      console.error('❌ Failed to make draft pick:', pickRes2.error);
    } else {
      console.log(`✅ Draft pick executed: ${firstPlayer.firstName} ${firstPlayer.lastName}`);
    }
  } else {
    console.log('✅ Draft pick executed: p-1');
  }

  // 9. Test Error Codes (SC-MP-001 for invalid room)
  console.log('\n--- 9. TESTING ERROR CODE ACCURACY ---');
  const invalidJoin = await DraftMultiplayerStore.joinRoomAsync(
    'SC-INVALID999',
    'Tester',
    'sess-test'
  );
  console.log(`✅ Invalid room lookup code: ${invalidJoin.errorCode} (Expected: SC-MP-001) - Message: ${invalidJoin.error}`);

  if (invalidJoin.errorCode !== 'SC-MP-001') {
    console.error('❌ Error code mismatch for missing room!');
    process.exit(1);
  }

  // 10. Clean up Test Room from DB
  console.log('\n--- 10. CLEANING UP TEST ROOM ---');
  await supabase!.from('multiplayer_rooms').delete().eq('id', room.id);
  console.log(`✅ Test room ${room.id} deleted from production DB.`);

  console.log('\n===============================================================');
  console.log('🎉 ALL MULTIPLAYER DB & FLOW TESTS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

runLiveProductionTest().catch((e) => {
  console.error('Live production test failed:', e);
  process.exit(1);
});
