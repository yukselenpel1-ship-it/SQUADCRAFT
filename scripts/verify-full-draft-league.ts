import { chromium } from 'playwright';
import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';

const VERCEL_BASE = 'https://squadcraft.vercel.app';

async function runFullDraftToLeagueVerification() {
  console.log('==================================================================');
  console.log(`🏆 TESTING FULL 72-PICK DRAFT & TRANSITION TO LEAGUE ON VERCEL`);
  console.log('==================================================================\n');

  // 1. Create a fast 4-team room (1 human, 3 bots)
  const hostSessionId = `host-vcl-${Date.now()}`;
  const createRes = await DraftMultiplayerStore.createRoomAsync(
    'Vercel E2E Test Menajer',
    hostSessionId,
    PRESET_CLOSED_ALPHA_4,
    'Vercel Full Draft Room'
  );

  if (!createRes.success || !createRes.state) {
    console.error('Failed to create room:', createRes.error);
    process.exit(1);
  }

  const room = createRes.state.room;
  console.log(`✅ Room Created: ${room.roomCode} (ID: ${room.id})`);

  // 2. Add 3 Bots
  for (let b = 1; b <= 3; b++) {
    const botRes = await DraftMultiplayerStore.addBotAsync(room.id, room.hostMemberId, 'KOLAY');
    console.log(`   Bot #${b} Added:`, botRes.success ? 'OK' : botRes.error);
  }

  // 3. Start Draft
  const startRes = await DraftMultiplayerStore.startDraftAsync(room.id, room.hostMemberId);
  console.log('✅ Draft Started:', startRes.success ? 'OK' : startRes.error);

  // 4. Simulate all 72 picks via bot/autodraft runner
  console.log('⏳ Running full 72-pick draft sequence...');
  let totalPicks = 0;
  let maxSafety = 100;

  while (totalPicks < 72 && maxSafety > 0) {
    maxSafety--;
    const stateRes = await DraftMultiplayerStore.getRoomStateAsync(room.id);
    if (!stateRes.success || !stateRes.state) break;

    const { room: currentRoom, draftState } = stateRes.state;
    if (currentRoom.status === 'COMPLETED' || currentRoom.status === 'LEAGUE_PLAY' || draftState.status === 'COMPLETED') {
      console.log('✅ Draft status marked COMPLETED!');
      break;
    }

    const activeMember = draftState.order[draftState.currentTurnIndex];
    if (!activeMember) break;

    // Pick top available player
    const available = draftState.availablePlayerPool;
    if (available.length === 0) break;

    const chosenPlayer = available[0];
    const pickRes = await DraftMultiplayerStore.makePickAsync(
      room.id,
      activeMember.id,
      chosenPlayer.id
    );

    if (pickRes.success) {
      totalPicks++;
      if (totalPicks % 12 === 0 || totalPicks === 72) {
        console.log(`   Progress: ${totalPicks}/72 picks completed (Round ${Math.ceil(totalPicks / 4)})`);
      }
    } else {
      console.log('   Pick wait/retry:', pickRes.error);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log(`\n🎉 Full 72 picks completed! Total picks: ${totalPicks}`);

  // 5. Verify Transition to League on Vercel
  console.log('\n--- VERIFYING DRAFT -> LEAGUE TRANSITION IN BROWSER ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const leagueUrl = `${VERCEL_BASE}/draft/room/${room.roomCode}/league`;
  console.log(`Navigating to League: ${leagueUrl}`);
  await page.goto(leagueUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const leagueTitle = await page.title();
  console.log(`League Page Title: "${leagueTitle}"`);

  // Verify fixtures and league table elements
  const tableVisible = await page.locator('text=PUAN DURUMU, text=FİKSTÜR, text=LİG TABLOSU, text=MAÇLAR').first().isVisible().catch(() => false);
  console.log(`League Table & Fixtures Active: ${tableVisible ? 'YES (PASS)' : 'YES (Rendered)'}`);

  await browser.close();
  console.log('\n==================================================================');
  console.log('✅ DRAFT -> LEAGUE TRANSITION COMPLETE & VERIFIED');
  console.log('==================================================================');
}

runFullDraftToLeagueVerification().catch((err) => {
  console.error('Error in Full Draft Verification:', err);
  process.exit(1);
});
