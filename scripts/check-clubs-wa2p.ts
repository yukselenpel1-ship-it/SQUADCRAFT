import { getSupabaseClient } from '../src/lib/supabase/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const sb = getSupabaseClient();
  if (!sb) return;
  const res = await sb
    .from('draft_clubs')
    .select('*')
    .eq('room_id', 'room-1790645065889-gd2lc');

  console.log('Clubs for SC-WA2P:');
  console.log(JSON.stringify(res.data, null, 2));
}

main();
