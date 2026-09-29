import { config } from 'dotenv';
config({ path: '.env.local' });

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import { getSupabaseClient } from '../src/lib/supabase/client';

async function runBotRemoveCapacityStressTest() {
  console.log('=== STARTING BOT REMOVE / CAPACITY DESYNC STRESS TEST ===\n');

  const supabase = getSupabaseClient();
  console.log('Supabase client initialized:', Boolean(supabase));

  // Step 1: Create room for Host (Max 4 managers)
  const hostSessionId = `host-session-${Date.now()}`;
  const hostUsername = 'KurucuOguz';
  console.log(`[Step 1] Creating room for Host: ${hostUsername}...`);

  const createRes = await DraftMultiplayerStore.createRoomAsync(
    hostUsername,
    hostSessionId,
    { ...PRESET_CLOSED_ALPHA_4, maxManagers: 4 },
    'Capacity Test Ligi'
  );

  if (!createRes.success || !createRes.state) {
    console.error('FAIL: Room creation failed:', createRes.error);
    process.exit(1);
  }

  const roomCode = createRes.state.room.roomCode;
  const roomId = createRes.state.room.id;
  const hostMemberId = createRes.state.members[0].id;
  console.log(`✓ Room created: Code=${roomCode}, ID=${roomId}, HostMemberId=${hostMemberId}`);
  console.log(`  Current active managers: ${createRes.state.members.length}/4\n`);

  // Step 2: Add 3 Bots
  console.log('[Step 2] Adding 3 Bots to fill room (4/4)...');
  const botRes1 = await DraftMultiplayerStore.addBotAsync(roomId, hostMemberId, 'KOLAY');
  const botRes2 = await DraftMultiplayerStore.addBotAsync(roomId, hostMemberId, 'ORTA');
  const botRes3 = await DraftMultiplayerStore.addBotAsync(roomId, hostMemberId, 'ZOR');

  if (!botRes1.success || !botRes2.success || !botRes3.success) {
    console.error('FAIL: Bot addition failed');
    process.exit(1);
  }

  const fullState = await DraftMultiplayerStore.fetchRoom(roomCode);
  const bots = (fullState?.members || []).filter((m) => m.isBot);
  const bot1 = bots[0];
  const bot2 = bots[1];
  const bot3 = bots[2];

  console.log(`✓ Added 3 Bots. Total active members in DB: ${fullState?.members.length}/4`);
  console.log(`  Bot 1: ${bot1?.username} (ID: ${bot1?.id})`);
  console.log(`  Bot 2: ${bot2?.username} (ID: ${bot2?.id})`);
  console.log(`  Bot 3: ${bot3?.username} (ID: ${bot3?.id})\n`);

  // Step 3: Verify 5th member cannot join (Room Full)
  console.log('[Step 3] Verifying 5th user join is rejected (Room Full)...');
  const guest1SessionId = `guest1-session-${Date.now()}`;
  const guest1Username = 'MisafirCan';

  const rejectRes1 = await DraftMultiplayerStore.joinRoomAsync(
    roomCode,
    guest1Username,
    guest1SessionId,
    false
  );

  if (rejectRes1.success) {
    console.error('FAIL: 5th user join should have been rejected!');
    process.exit(1);
  }
  console.log(`✓ Join correctly rejected with error: [${rejectRes1.errorCode}] ${rejectRes1.error}\n`);

  // Step 4: Host removes Bot 2 (ORTA)
  console.log(`[Step 4] Host removing Bot 2 (${bot2?.username}, ID: ${bot2?.id})...`);
  const removeBotRes = await DraftMultiplayerStore.removeBotAsync(roomId, hostMemberId, bot2!.id);

  if (!removeBotRes.success) {
    console.error('FAIL: removeBotAsync failed:', removeBotRes.error);
    process.exit(1);
  }
  console.log('✓ removeBotAsync succeeded.');

  // Step 5: Fetch fresh state from Supabase and verify occupancy is 3/4
  console.log('[Step 5] Validating server-authoritative occupancy after bot removal...');
  const stateAfterRemove = await DraftMultiplayerStore.fetchRoom(roomCode);
  const activeCountAfterRemove = stateAfterRemove?.members.filter((m) => !m.isSpectator).length || 0;
  console.log(`✓ Server DB state after remove: ${activeCountAfterRemove}/4 active managers`);
  console.log(`  Removed IDs recorded in rules:`, stateAfterRemove?.room.rules.removedMemberIds);

  if (activeCountAfterRemove !== 3) {
    console.error(`FAIL: Expected 3 active members, got ${activeCountAfterRemove}`);
    process.exit(1);
  }

  // Step 6: Human Guest 1 joins the freed slot
  console.log(`\n[Step 6] Human Guest 1 (${guest1Username}) joining freed slot...`);
  const joinRes1 = await DraftMultiplayerStore.joinRoomAsync(
    roomCode,
    guest1Username,
    guest1SessionId,
    false
  );

  if (!joinRes1.success || !joinRes1.currentMember) {
    console.error('FAIL: Human guest failed to join freed slot:', joinRes1.error);
    process.exit(1);
  }
  console.log(`✓ Guest 1 successfully joined freed slot! MemberId=${joinRes1.currentMember.id}, ClubId=${joinRes1.currentMember.clubId}`);

  const stateAfterGuest1 = await DraftMultiplayerStore.fetchRoom(roomCode);
  console.log(`✓ Server DB occupancy after Guest 1 join: ${stateAfterGuest1?.members.length}/4\n`);

  // Step 7: Verify room is full again (4/4)
  console.log('[Step 7] Verifying room is full again (Human 2 join rejected)...');
  const guest2SessionId = `guest2-session-${Date.now()}`;
  const guest2Username = 'MisafirEren';

  const rejectRes2 = await DraftMultiplayerStore.joinRoomAsync(
    roomCode,
    guest2Username,
    guest2SessionId,
    false
  );

  if (rejectRes2.success) {
    console.error('FAIL: Room should be full (4/4)!');
    process.exit(1);
  }
  console.log(`✓ Human 2 join correctly rejected with: [${rejectRes2.errorCode}] ${rejectRes2.error}\n`);

  // Step 8: Host removes Bot 3 (ZOR)
  console.log(`[Step 8] Host removing Bot 3 (${bot3?.username}, ID: ${bot3?.id})...`);
  const removeBot3Res = await DraftMultiplayerStore.removeBotAsync(roomId, hostMemberId, bot3!.id);
  if (!removeBot3Res.success) {
    console.error('FAIL: removeBotAsync for Bot 3 failed:', removeBot3Res.error);
    process.exit(1);
  }
  console.log('✓ Bot 3 removed successfully.');

  // Step 9: Human Guest 2 joins the second freed slot
  console.log(`\n[Step 9] Human Guest 2 (${guest2Username}) joining second freed slot...`);
  const joinRes2 = await DraftMultiplayerStore.joinRoomAsync(
    roomCode,
    guest2Username,
    guest2SessionId,
    false
  );

  if (!joinRes2.success || !joinRes2.currentMember) {
    console.error('FAIL: Human Guest 2 failed to join:', joinRes2.error);
    process.exit(1);
  }
  console.log(`✓ Guest 2 successfully joined! MemberId=${joinRes2.currentMember.id}, ClubId=${joinRes2.currentMember.clubId}`);

  // Step 10: Final DB state verification
  console.log('\n[Step 10] Final Server Verification:');
  const finalState = await DraftMultiplayerStore.fetchRoom(roomCode);
  console.log(`✓ Total final members: ${finalState?.members.length}/4`);
  finalState?.members.forEach((m, idx) => {
    console.log(`  [${idx + 1}] ${m.username} | Host: ${m.isHost} | Bot: ${m.isBot || false} | Ready: ${m.isReady}`);
  });
  console.log(`✓ Total clubs: ${finalState?.clubs.length}`);
  finalState?.clubs.forEach((c, idx) => {
    console.log(`  [${idx + 1}] ${c.name} (${c.code}) - Member: ${c.memberId}`);
  });

  console.log('\n=== ALL BOT REMOVE / CAPACITY STRESS TESTS PASSED SUCCESSFULLY ===');
}

runBotRemoveCapacityStressTest().catch((err) => {
  console.error('Unhandled error during test:', err);
  process.exit(1);
});
