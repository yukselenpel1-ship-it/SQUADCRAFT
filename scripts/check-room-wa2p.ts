import { getSupabaseClient } from '../src/lib/supabase/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const sb = getSupabaseClient();
  if (!sb) return;
  const res = await sb
    .from('multiplayer_rooms')
    .select('*, multiplayer_members(*), draft_clubs(*), draft_fixtures(*), draft_standings(*), draft_picks(*)')
    .eq('room_code', 'SC-WA2P')
    .maybeSingle();

  console.log('SC-WA2P room data:');
  console.log('Error:', res.error);
  console.log('Data:', JSON.stringify(res.data, null, 2));

  // Also query recent rooms
  const recent = await sb.from('multiplayer_rooms').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent rooms:', recent.data?.map(r => ({ code: r.room_code, status: r.status, name: r.name, created_at: r.created_at })));
}

main();
