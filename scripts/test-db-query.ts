import { getSupabaseClient } from '../src/lib/supabase/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const sb = getSupabaseClient();
  if (!sb) {
    console.log('No supabase client');
    return;
  }
  console.log('Testing select on multiplayer_rooms with joins:');
  const res = await sb
    .from('multiplayer_rooms')
    .select('*, multiplayer_members(*), draft_clubs(*), draft_fixtures(*), draft_standings(*)')
    .limit(1);
  console.log('Res error:', res.error);
  console.log('Res data:', JSON.stringify(res.data, null, 2));
}

main();
