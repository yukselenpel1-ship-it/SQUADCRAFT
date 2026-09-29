import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import { getSupabaseClient } from '../src/lib/supabase/client';

async function createLiveTestRoom() {
  console.log('🏟️ Creating a persistent Live Test Room on Production Supabase...');

  const hostSessionId = `host-${Date.now()}`;
  const res = await DraftMultiplayerStore.createRoomAsync(
    'Menajer Can',
    hostSessionId,
    PRESET_CLOSED_ALPHA_4,
    'KAPALI ALFA 4 KİŞİ TEST ODASI'
  );

  if (!res.success || !res.state) {
    console.error('❌ Failed to create live test room:', res.error);
    process.exit(1);
  }

  const room = res.state.room;
  const member = res.state.members[0];
  const club = res.state.clubs[0];

  // Join a 2nd member as a live demo participant
  const guestSessionId = `guest-${Date.now()}`;
  const joinRes = await DraftMultiplayerStore.joinRoomAsync(
    room.roomCode,
    'Menajer Selim',
    guestSessionId,
    false
  );

  console.log('\n===============================================================');
  console.log('✅ LIVE PRODUCTION TEST ROOM READY');
  console.log('===============================================================');
  console.log(`Room ID:       ${room.id}`);
  console.log(`Room Code:     ${room.roomCode}`);
  console.log(`Room Name:     ${room.name}`);
  console.log(`Status:        ${room.status}`);
  console.log(`Host Member:   ${member.username} (${member.id})`);
  console.log(`Host Club:     ${club.name} (${club.code})`);
  console.log(`Members Count: ${joinRes.state?.members.length || 1} / 4`);
  console.log(`URL to join:   https://squadcraft.squadcraft.workers.dev/draft/room/${room.roomCode}`);
  console.log('===============================================================\n');
}

createLiveTestRoom().catch((e) => {
  console.error('Error creating live test room:', e);
  process.exit(1);
});
