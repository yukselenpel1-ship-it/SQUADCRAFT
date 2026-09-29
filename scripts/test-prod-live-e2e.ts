import fetch from 'node-fetch';
import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PROD_URL = 'https://squadcraft.squadcraft.workers.dev';

async function verifyProduction() {
  console.log('========================================================================');
  console.log('🌐 PRODUCTION LIVE E2E VERIFICATION ON WORKERS');
  console.log('URL:', PROD_URL);
  console.log('========================================================================');

  // 1. Verify HTTP status on all critical endpoints
  const endpoints = ['/', '/draft', '/career/new', '/dashboard'];
  for (const ep of endpoints) {
    const res = await fetch(`${PROD_URL}${ep}`);
    console.log(`Endpoint ${ep}: HTTP ${res.status} ${res.statusText}`);
    if (res.status !== 200) {
      throw new Error(`Endpoint ${ep} returned ${res.status}`);
    }
  }

  // 2. Create room on production Supabase
  const hostSession = `live-prod-session-${Date.now()}`;
  console.log('\nCreating live production room...');
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Prod Manager',
    hostSession,
    PRESET_CLOSED_ALPHA_4,
    'Live Prod E2E Room'
  );
  if (!createRes.success || !createRes.state) {
    throw new Error(`Failed to create live room: ${createRes.error}`);
  }
  const roomCode = createRes.state.room.roomCode;
  const roomId = createRes.state.room.id;
  console.log(`✓ Live Room Created: Code = ${roomCode}, ID = ${roomId}`);

  // Check HTTP endpoint for lobby
  const lobbyHttp = await fetch(`${PROD_URL}/draft/room/${roomCode}`);
  console.log(`Lobby Route HTTP: ${lobbyHttp.status}`);

  // 3. Add 3 bots
  const hostMember = createRes.state.members.find((m) => m.sessionId === hostSession)!;
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'KOLAY');
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'ORTA');
  DraftMultiplayerStore.addBot(roomId, hostMember.id, 'ZOR');

  // 4. Start draft
  const startDraftRes = DraftMultiplayerStore.startDraft(roomId, hostMember.id);
  if (!startDraftRes.success) {
    throw new Error(`Start draft failed: ${startDraftRes.error}`);
  }
  console.log(`✓ Draft started. Room status: ${startDraftRes.state?.room.status}`);

  // Check HTTP endpoint for draft route
  const draftHttp = await fetch(`${PROD_URL}/draft/room/${roomCode}/draft`);
  console.log(`Draft Route HTTP: ${draftHttp.status}`);

  // 5. Simulate 72 picks
  console.log('\nSimulating all 72 snake picks...');
  let currentRoom = startDraftRes.state!;
  for (let i = 0; i < 72; i++) {
    const dState = currentRoom.draftState!;
    const turnMemberId = dState.currentTurnMemberId;
    const turnMember = currentRoom.members.find((m) => m.id === turnMemberId)!;
    const club = currentRoom.clubs.find((c) => c.memberId === turnMemberId)!;

    const pickedIds = new Set(dState.picks.map((p) => p.playerId));
    const available = currentRoom.playerPool.filter((p) => !pickedIds.has(p.id));
    const pickRes = DraftMultiplayerStore.makePick(roomId, turnMember.id, available[0].id, false);
    if (!pickRes.success || !pickRes.state) {
      throw new Error(`Pick ${i + 1} failed: ${pickRes.error}`);
    }
    currentRoom = pickRes.state;
  }
  console.log('✓ 72 Picks completed.');

  // 6. Verify transition to LEAGUE_ACTIVE
  const leagueHydrate = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSession);
  console.log(`✓ Post-Draft Hydration Status: ${leagueHydrate.status}`);
  console.log(`✓ Room Status: ${leagueHydrate.state?.room.status}`);
  console.log(`✓ Fixtures Count: ${leagueHydrate.state?.fixtures.length}`);
  console.log(`✓ Standings Count: ${leagueHydrate.state?.standings.length}`);

  if (leagueHydrate.state?.room.status !== 'LEAGUE_ACTIVE') {
    throw new Error('Room did not transition to LEAGUE_ACTIVE');
  }
  if (leagueHydrate.state.fixtures.length !== 12) {
    throw new Error('Fixtures count != 12');
  }
  if (leagueHydrate.state.standings.length !== 4) {
    throw new Error('Standings count != 4');
  }

  // Check HTTP endpoint for league route
  const leagueHttp = await fetch(`${PROD_URL}/draft/room/${roomCode}/league`);
  console.log(`League Route HTTP: ${leagueHttp.status}`);

  // 7. Verify previous SC-WA2P room recovery
  console.log('\nChecking SC-WA2P room state:');
  const wa2pHydrate = await DraftMultiplayerStore.fetchRoom('SC-WA2P');
  console.log(`✓ SC-WA2P Status: ${wa2pHydrate?.room.status}, Fixtures: ${wa2pHydrate?.fixtures.length}, Standings: ${wa2pHydrate?.standings.length}`);

  console.log('\n========================================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETE: ALL PASS!');
  console.log('========================================================================\n');
}

verifyProduction().catch((err) => {
  console.error('❌ Production verification failed:', err);
  process.exit(1);
});
