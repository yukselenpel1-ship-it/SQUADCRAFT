import { config } from 'dotenv';
config({ path: '.env.local' });

import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';

async function testFullDraftFlow() {
  console.log('--- STARTING 4-MANAGER FULL DRAFT PLAYTHROUGH TEST ---');

  // 1. Host creates room
  const hostSession = `host-full-${Date.now()}`;
  const hostRes = await DraftMultiplayerStore.createRoomAsync('AlphaHost', hostSession, {
    ...PRESET_CLOSED_ALPHA_4,
    squadSize: 18,
  }, 'Full Flow Liga');

  if (!hostRes.success || !hostRes.state) {
    console.error('Failed to create room:', hostRes.error);
    process.exit(1);
  }

  const roomCode = hostRes.state.room.roomCode;
  const roomId = hostRes.state.room.id;
  const hostMemId = hostRes.state.members[0].id;
  console.log(`✓ Room created: ${roomCode}`);

  // 2. Three guests join and ready up
  const guestSessions = ['Guest1', 'Guest2', 'Guest3'].map((name, i) => ({
    name,
    sessionId: `g-full-${i}-${Date.now()}`,
    memberId: '',
  }));

  for (const g of guestSessions) {
    const jRes = await DraftMultiplayerStore.joinRoomAsync(roomCode, g.name, g.sessionId, false);
    g.memberId = jRes.currentMember!.id;
    await DraftMultiplayerStore.toggleMemberReadyAsync(roomId, g.memberId);
  }
  console.log(`✓ All 3 guests joined & readied up`);

  // 3. Host starts draft
  const startRes = await DraftMultiplayerStore.startDraftAsync(roomId, hostMemId);
  if (!startRes.success || !startRes.state) {
    console.error('Failed to start draft:', startRes.error);
    process.exit(1);
  }
  console.log(`✓ Draft started successfully! Status=${startRes.state.room.status}`);

  // 4. Complete all 72 picks (18 rounds x 4 players)
  let currentState = startRes.state;
  const totalPicks = 18 * 4;
  console.log(`\n4. Simulating all ${totalPicks} draft picks...`);

  for (let pickNum = 1; pickNum <= totalPicks; pickNum++) {
    const draftState = currentState.draftState!;
    const turnMemberId = draftState.currentTurnMemberId;
    const pickedIds = new Set(draftState.picks.map((p) => p.playerId));
    const availablePlayer = currentState.playerPool.find((p) => !pickedIds.has(p.id));

    if (!availablePlayer) {
      console.error(`No player available for pick #${pickNum}`);
      process.exit(1);
    }

    const pickRes = DraftMultiplayerStore.makePick(roomId, turnMemberId, availablePlayer.id, false);
    if (!pickRes.success || !pickRes.state) {
      console.error(`Failed pick #${pickNum}:`, pickRes.error);
      process.exit(1);
    }

    currentState = pickRes.state;
  }

  console.log(`✓ All 72 picks completed! Final Status=${currentState.room.status}`);

  // 5. Verify all 4 clients observe LEAGUE_ACTIVE and exactly 18 players per squad
  console.log(`\n5. Verifying all client perspectives...`);
  const hostHyd = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, hostSession);
  console.log(`Host sees room.status = ${hostHyd.state?.room.status}, fixtures = ${hostHyd.state?.fixtures.length}, standings = ${hostHyd.state?.standings.length}`);

  if (hostHyd.state?.room.status !== 'LEAGUE_ACTIVE') {
    console.error('FAILED: Host does not see LEAGUE_ACTIVE!');
    process.exit(1);
  }

  for (const g of guestSessions) {
    const gHyd = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, g.sessionId);
    console.log(`${g.name} sees room.status = ${gHyd.state?.room.status}, fixtures = ${gHyd.state?.fixtures.length}`);
    if (gHyd.state?.room.status !== 'LEAGUE_ACTIVE') {
      console.error(`FAILED: ${g.name} does not see LEAGUE_ACTIVE!`);
      process.exit(1);
    }
  }

  // 6. Verify squads
  for (const club of hostHyd.state!.clubs) {
    console.log(`Club ${club.name} (${club.code}): squad count = ${club.squadPlayerIds.length}/18`);
    if (club.squadPlayerIds.length !== 18) {
      console.error(`FAILED: Club ${club.name} squad count is ${club.squadPlayerIds.length}, expected 18`);
      process.exit(1);
    }
  }

  // 7. Advance Matchweeks 1 to 6
  console.log(`\n6. Playing matchweeks 1 to 6...`);
  for (let mw = 1; mw <= 6; mw++) {
    const mwRes = DraftMultiplayerStore.advanceMatchweek(roomId, hostMemId);
    if (!mwRes.success || !mwRes.state) {
      console.error(`Failed matchweek ${mw}:`, mwRes.error);
      process.exit(1);
    }
    console.log(`✓ Matchweek ${mw} played. Next MW=${mwRes.state.room.currentMatchweek}, Status=${mwRes.state.room.status}`);
    currentState = mwRes.state;
  }

  console.log(`✓ Final league status: ${currentState.room.status}`);
  console.log(`✓ Champion: ${currentState.awards?.championClubName}`);

  console.log('\n======================================================');
  console.log('✅ COMPLETE MULTIPLAYER 4-PLAYER DRAFT & LEAGUE TEST PASSED!');
  console.log('======================================================');
  process.exit(0);
}

testFullDraftFlow().catch((e) => {
  console.error('FATAL FULL FLOW ERROR:', e);
  process.exit(1);
});
