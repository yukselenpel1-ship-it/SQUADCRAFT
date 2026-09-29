import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function runVerification() {
  console.log('===============================================================');
  console.log('🧪 SQUADCRAFT SUPABASE PRODUCTION VERIFICATION SUITE');
  console.log('===============================================================');
  console.log(`URL: ${url ? url : '[MISSING]'}`);
  console.log(`Anon Key: ${anonKey ? `${anonKey.substring(0, 12)}...` : '[MISSING]'}`);

  if (!url || !anonKey) {
    console.error('❌ ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing!');
    process.exit(1);
  }

  const supabase = createClient(url, anonKey);

  // 1. Connection check & table existence
  console.log('\n--- 1. TABLE EXISTENCE & SCHEMA CHECKS ---');
  const requiredTables = [
    'multiplayer_rooms',
    'multiplayer_members',
    'draft_clubs',
    'draft_picks',
    'draft_fixtures',
    'draft_standings',
    'multiplayer_feedback',
    'multiplayer_telemetry',
  ];

  let missingTables: string[] = [];

  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table [${table}]: ERROR - ${error.message} (code: ${error.code})`);
      missingTables.push(table);
    } else {
      console.log(`✅ Table [${table}]: OK (accessible via anon key)`);
    }
  }

  if (missingTables.length > 0) {
    console.log(`\n⚠️  WARNING: ${missingTables.length} tables were not found or failed query.`);
    console.log('Please make sure you have run the migration script in Supabase SQL Editor:');
    console.log('File: supabase/migrations/20260929_draft_league.sql');
  } else {
    console.log('\n✅ All 8 multiplayer Draft League tables exist and are queryable.');
  }

  // 2. RLS INSERT / UPDATE / DELETE Check with temporary room
  console.log('\n--- 2. RLS PERMISSION & CRUD AUDIT ---');
  const testRoomId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const testRoomCode = `TST${Math.floor(100 + Math.random() * 900)}`;

  const { data: insertedRoom, error: insertErr } = await supabase
    .from('multiplayer_rooms')
    .insert({
      id: testRoomId,
      room_code: testRoomCode,
      name: 'Alpha Verification Test Room',
      host_member_id: 'test_host',
      status: 'LOBBY',
      rules: { maxParticipants: 4, roundTimeLimitSeconds: 60 },
    })
    .select()
    .single();

  if (insertErr) {
    console.error(`❌ RLS Insert Room test failed: ${insertErr.message}`);
  } else {
    console.log(`✅ RLS Insert Room test passed: Created room ${insertedRoom.room_code}`);

    // Update test
    const { error: updateErr } = await supabase
      .from('multiplayer_rooms')
      .update({ name: 'Alpha Verification Updated' })
      .eq('id', testRoomId);

    if (updateErr) {
      console.error(`❌ RLS Update Room test failed: ${updateErr.message}`);
    } else {
      console.log('✅ RLS Update Room test passed');
    }

    // Clean up
    const { error: delErr } = await supabase
      .from('multiplayer_rooms')
      .delete()
      .eq('id', testRoomId);

    if (delErr) {
      console.log(`ℹ️ Delete check: ${delErr.message}`);
    } else {
      console.log('✅ Room cleanup completed');
    }
  }

  // 3. Realtime connectivity test
  console.log('\n--- 3. SUPABASE REALTIME CONNECTION AUDIT ---');
  await new Promise<void>((resolve) => {
    const channel = supabase.channel('alpha_test_channel');
    const timeout = setTimeout(() => {
      console.log('⚠️ Realtime subscription timeout (check Supabase Realtime publication settings)');
      supabase.removeChannel(channel);
      resolve();
    }, 5000);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime websocket channel connected successfully (SUBSCRIBED)');
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.log(`⚠️ Realtime status: ${status}`);
        clearTimeout(timeout);
        supabase.removeChannel(channel);
        resolve();
      }
    });
  });

  console.log('\n===============================================================');
  console.log('🏁 SUPABASE VERIFICATION COMPLETE');
  console.log('===============================================================');
}

runVerification().catch((err) => {
  console.error('Verification script failed:', err);
  process.exit(1);
});
