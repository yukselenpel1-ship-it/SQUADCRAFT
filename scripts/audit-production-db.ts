import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function auditDatabase() {
  console.log('🔍 Auditing Supabase schema and columns across all 8 multiplayer tables...');
  const supabase = createClient(url, anonKey);

  const tables = [
    'multiplayer_rooms',
    'multiplayer_members',
    'draft_clubs',
    'draft_picks',
    'draft_fixtures',
    'draft_standings',
    'multiplayer_feedback',
    'multiplayer_telemetry',
  ];

  // Test inserting and selecting a full mock workflow across all tables
  const testRoomId = `audit-room-${Date.now()}`;
  const testRoomCode = `AUD${Math.floor(100 + Math.random() * 900)}`;
  const testMemberId = `audit-mem-${Date.now()}`;
  const testSessionId = `audit-sess-${Date.now()}`;
  const testClubId = `audit-club-${Date.now()}`;

  console.log(`\n--- Testing multiplayer_rooms ---`);
  const { data: roomData, error: roomErr } = await supabase
    .from('multiplayer_rooms')
    .insert({
      id: testRoomId,
      room_code: testRoomCode,
      name: 'Audit Test Room',
      host_member_id: testMemberId,
      status: 'LOBBY',
      rules: {
        maxManagers: 4,
        format: 'DOUBLE_ROUND',
        squadSize: 18,
        pickTimerSeconds: 60,
        injuries: true,
        suspensions: true,
        fitness: 'SIMPLIFIED',
        transferWindow: 'CLOSED',
        matchType: 'FAST_SIM',
        autoPickMode: 'AUTO_PICK',
      },
    })
    .select()
    .single();

  if (roomErr) {
    console.error('❌ multiplayer_rooms insert error:', roomErr);
  } else {
    console.log('✅ multiplayer_rooms row inserted:', Object.keys(roomData));
  }

  console.log(`\n--- Testing multiplayer_members ---`);
  const { data: memData, error: memErr } = await supabase
    .from('multiplayer_members')
    .insert({
      id: testMemberId,
      room_id: testRoomId,
      session_id: testSessionId,
      username: 'AuditManager',
      is_host: true,
      is_spectator: false,
      is_ready: true,
      club_id: testClubId,
      is_connected: true,
    })
    .select()
    .single();

  if (memErr) {
    console.error('❌ multiplayer_members insert error:', memErr);
  } else {
    console.log('✅ multiplayer_members row inserted:', Object.keys(memData));
  }

  console.log(`\n--- Testing draft_clubs ---`);
  const { data: clubData, error: clubErr } = await supabase
    .from('draft_clubs')
    .insert({
      id: testClubId,
      room_id: testRoomId,
      member_id: testMemberId,
      name: 'Audit Spor Kulübü',
      code: 'ASK',
      manager_name: 'AuditManager',
      primary_color: '#10b981',
      secondary_color: '#0f172a',
      badge: {
        shape: 'shield',
        pattern: 'solid',
        emblem: 'star',
        primaryColor: '#10b981',
        secondaryColor: '#0f172a',
      },
      squad_player_ids: ['p-1', 'p-2'],
    })
    .select()
    .single();

  if (clubErr) {
    console.error('❌ draft_clubs insert error:', clubErr);
  } else {
    console.log('✅ draft_clubs row inserted:', Object.keys(clubData));
  }

  console.log(`\n--- Testing draft_picks ---`);
  const { data: pickData, error: pickErr } = await supabase
    .from('draft_picks')
    .insert({
      id: `pick-${Date.now()}`,
      room_id: testRoomId,
      round: 1,
      pick_index_in_round: 0,
      global_pick_number: 1,
      member_id: testMemberId,
      club_id: testClubId,
      player_id: 'p-1',
      is_auto_pick: false,
      time_taken_seconds: 12,
    })
    .select()
    .single();

  if (pickErr) {
    console.error('❌ draft_picks insert error:', pickErr);
  } else {
    console.log('✅ draft_picks row inserted:', Object.keys(pickData));
  }

  console.log(`\n--- Testing draft_fixtures ---`);
  const { data: fixData, error: fixErr } = await supabase
    .from('draft_fixtures')
    .insert({
      id: `fix-${Date.now()}`,
      room_id: testRoomId,
      round: 1,
      home_club_id: testClubId,
      away_club_id: testClubId,
      status: 'AWAITING_TACTICS',
      home_tactics: { formation: '4-3-3' },
      away_tactics: { formation: '4-4-2' },
      home_score: 2,
      away_score: 1,
      match_result: { summary: 'Great match' },
      seed: '12345',
      simulated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (fixErr) {
    console.error('❌ draft_fixtures insert error:', fixErr);
  } else {
    console.log('✅ draft_fixtures row inserted:', Object.keys(fixData));
  }

  console.log(`\n--- Testing draft_standings ---`);
  const { data: standData, error: standErr } = await supabase
    .from('draft_standings')
    .insert({
      room_id: testRoomId,
      club_id: testClubId,
      rank: 1,
      played: 1,
      won: 1,
      drawn: 0,
      lost: 0,
      goals_for: 2,
      goals_against: 1,
      goal_difference: 1,
      points: 3,
      form: ['W'],
    })
    .select()
    .single();

  if (standErr) {
    console.error('❌ draft_standings insert error:', standErr);
  } else {
    console.log('✅ draft_standings row inserted:', Object.keys(standData));
  }

  console.log(`\n--- Testing multiplayer_feedback ---`);
  const { data: fbData, error: fbErr } = await supabase
    .from('multiplayer_feedback')
    .insert({
      id: `fb-${Date.now()}`,
      room_id: testRoomId,
      session_id: testSessionId,
      route: '/draft',
      category: 'GENERAL',
      comment: 'Schema audit test feedback',
    })
    .select()
    .single();

  if (fbErr) {
    console.error('❌ multiplayer_feedback insert error:', fbErr);
  } else {
    console.log('✅ multiplayer_feedback row inserted:', Object.keys(fbData));
  }

  console.log(`\n--- Testing multiplayer_telemetry ---`);
  const { data: telData, error: telErr } = await supabase
    .from('multiplayer_telemetry')
    .insert({
      id: `tel-${Date.now()}`,
      room_id: testRoomId,
      event_type: 'AUDIT_TEST',
      data: { test: true },
    })
    .select()
    .single();

  if (telErr) {
    console.error('❌ multiplayer_telemetry insert error:', telErr);
  } else {
    console.log('✅ multiplayer_telemetry row inserted:', Object.keys(telData));
  }

  // Querying room by room_code directly (like joinRoom / getRoom)
  console.log(`\n--- Querying by room_code: ${testRoomCode} ---`);
  const { data: queriedRoom, error: queryErr } = await supabase
    .from('multiplayer_rooms')
    .select(`
      *,
      multiplayer_members (*),
      draft_clubs (*),
      draft_fixtures (*),
      draft_standings (*)
    `)
    .eq('room_code', testRoomCode)
    .single();

  if (queryErr) {
    console.error('❌ Deep query error:', queryErr);
  } else {
    console.log('✅ Deep query success!');
    console.log('Room Code:', queriedRoom.room_code);
    console.log('Members count:', queriedRoom.multiplayer_members?.length);
    console.log('Clubs count:', queriedRoom.draft_clubs?.length);
    console.log('Fixtures count:', queriedRoom.draft_fixtures?.length);
    console.log('Standings count:', queriedRoom.draft_standings?.length);
  }

  // Cleanup test room
  console.log('\n--- Cleaning up test room ---');
  await supabase.from('multiplayer_rooms').delete().eq('id', testRoomId);
  console.log('✅ Cleanup finished.');
}

auditDatabase().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});
