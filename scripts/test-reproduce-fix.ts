import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { getSupabaseClient } from '../src/lib/supabase/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('--- TESTING SC-WA2P HYDRATION & AUTO-REPAIR ---');
  const res = await DraftMultiplayerStore.hydrateDraftRoom('SC-WA2P', 'test-session');
  console.log('Hydration status:', res.status);
  console.log('Room status:', res.state?.room.status);
  console.log('Draft state completed:', res.state?.draftState?.isCompleted);
  console.log('Clubs count:', res.state?.clubs.length);
  console.log('Fixtures count:', res.state?.fixtures.length);
  console.log('Standings count:', res.state?.standings.length);
  console.log('Club squads:');
  res.state?.clubs.forEach((c) => {
    console.log(`  - ${c.name}: ${c.squadPlayerIds.length} players`);
  });
  console.log('Diagnostics:', res.diagnostics);
}

main();
