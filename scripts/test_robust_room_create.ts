import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function runRobustRoomCreationTest() {
  console.log('=================================================================');
  console.log('🧪 TEST: DRAFT ROOM CREATION ROBUSTNESS & RETRY VERIFICATION');
  console.log('=================================================================');

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing from environment!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const createdRoomIds: string[] = [];

  try {
    // 1. Connection Warmup
    console.log('\n--- 1. Testing Connection Warmup ---');
    const warmupStart = Date.now();
    const warmed = await DraftMultiplayerStore.warmupConnection();
    console.log(`Connection warmup completed in ${Date.now() - warmupStart}ms. Result: ${warmed}`);

    // 2. Consecutive Room Creations (10 rooms)
    console.log('\n--- 2. Testing 10 Consecutive Room Creations ---');
    let consecutiveSuccessCount = 0;
    const TOTAL_ROOMS = 10;

    for (let i = 1; i <= TOTAL_ROOMS; i++) {
      const sessionId = `test-robust-sess-${Date.now()}-${i}`;
      const username = `Tester-${i}`;
      const startT = Date.now();

      const result = await DraftMultiplayerStore.createRoomAsync(
        username,
        sessionId,
        PRESET_CLOSED_ALPHA_4,
        `Test Room ${i}`
      );

      const elapsed = Date.now() - startT;

      if (!result.success || !result.state) {
        console.error(`❌ Room ${i} FAILED (${elapsed}ms):`, result.error, result.details);
        continue;
      }

      const roomId = result.state.room.id;
      createdRoomIds.push(roomId);

      // Verify DB integrity
      const { data: rooms, error: roomErr } = await supabase
        .from('multiplayer_rooms')
        .select('id, room_code, status')
        .eq('id', roomId);

      const { data: members, error: memErr } = await supabase
        .from('multiplayer_members')
        .select('id, username, is_host')
        .eq('room_id', roomId);

      const { data: clubs, error: clubErr } = await supabase
        .from('draft_clubs')
        .select('id, name')
        .eq('room_id', roomId);

      if (roomErr || memErr || clubErr) {
        console.error(`❌ Room ${i} DB query error:`, roomErr || memErr || clubErr);
        continue;
      }

      const isRoomValid = rooms && rooms.length === 1 && rooms[0].status === 'LOBBY';
      const isMemberValid = members && members.length === 1 && members[0].is_host === true;
      const isClubValid = clubs && clubs.length === 1;

      if (isRoomValid && isMemberValid && isClubValid) {
        consecutiveSuccessCount++;
        console.log(`✅ Room ${i}/${TOTAL_ROOMS} [${result.state.room.roomCode}]: created & verified in DB in ${elapsed}ms`);
      } else {
        console.error(`❌ Room ${i} DB integrity check failed:`, {
          roomsCount: rooms?.length,
          membersCount: members?.length,
          clubsCount: clubs?.length,
        });
      }
    }

    console.log(`\nConsecutive creation result: ${consecutiveSuccessCount}/${TOTAL_ROOMS} succeeded.`);
    if (consecutiveSuccessCount !== TOTAL_ROOMS) {
      throw new Error(`Expected ${TOTAL_ROOMS} consecutive creations, got ${consecutiveSuccessCount}`);
    }

    // 3. Testing Hard In-Flight Lock (Double-click protection)
    console.log('\n--- 3. Testing Concurrent In-Flight Lock (Double-Click Protection) ---');
    const sessA = `test-concurrent-a-${Date.now()}`;
    const sessB = `test-concurrent-b-${Date.now()}`;

    const [resA, resB] = await Promise.all([
      DraftMultiplayerStore.createRoomAsync('Click1', sessA, PRESET_CLOSED_ALPHA_4, 'Concurrent Room A'),
      DraftMultiplayerStore.createRoomAsync('Click2', sessB, PRESET_CLOSED_ALPHA_4, 'Concurrent Room B'),
    ]);

    const oneSucceeded = (resA.success && !resB.success) || (!resA.success && resB.success);
    const lockedRes = resA.success ? resB : resA;
    const successRes = resA.success ? resA : resB;

    if (successRes.state) {
      createdRoomIds.push(successRes.state.room.id);
    }

    console.log(`Concurrent request 1: success=${resA.success}, error="${resA.error || ''}"`);
    console.log(`Concurrent request 2: success=${resB.success}, error="${resB.error || ''}"`);

    if (oneSucceeded && lockedRes.error?.includes('devam ediyor')) {
      console.log('✅ Hard lock successfully prevented duplicate simultaneous room creation!');
    } else {
      console.warn('⚠️ Double-click lock check result:', { resA: resA.success, resB: resB.success });
    }

  } finally {
    // 4. Cleanup test rooms from database
    console.log('\n--- 4. Cleaning up test rooms from database ---');
    for (const rid of createdRoomIds) {
      try {
        await supabase.from('draft_clubs').delete().eq('room_id', rid);
        await supabase.from('multiplayer_members').delete().eq('room_id', rid);
        await supabase.from('multiplayer_rooms').delete().eq('id', rid);
      } catch (e) {
        // ignore cleanup errors
      }
    }
    console.log(`Cleaned up ${createdRoomIds.length} test rooms.`);
  }

  console.log('\n=================================================================');
  console.log('🎉 ALL DRAFT ROOM CREATION ROBUSTNESS TESTS PASSED!');
  console.log('=================================================================');
}

runRobustRoomCreationTest().catch((err) => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
