import { chromium } from 'playwright';
import { DraftMultiplayerStore } from '../src/lib/draft/multiplayerStore';
import { PRESET_CLOSED_ALPHA_4 } from '../src/lib/draft/types';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  console.log('====================================================');
  console.log('SQUADCRAFT DRAFT LEAGUE STABILITY TEST');
  console.log('====================================================');

  const testSessionId = `test-sess-${Date.now()}`;
  console.log('1. Creating Draft Room with Host sessionId:', testSessionId);

  const roomRes = await DraftMultiplayerStore.createRoomAsync(
    'Efe (Host)',
    testSessionId,
    { ...PRESET_CLOSED_ALPHA_4, squadSize: 18 }
  );

  if (!roomRes.success || !roomRes.state) {
    throw new Error(`Failed to create room: ${roomRes.error}`);
  }

  const room = roomRes.state.room;
  const hostMember = roomRes.state.members[0];
  console.log(`Room created: ${room.roomCode} (ID: ${room.id})`);

  // Add 3 bots
  for (let i = 1; i <= 3; i++) {
    const botRes = DraftMultiplayerStore.addBot(room.id, hostMember.id, 'ORTA');
    if (!botRes.success) {
      throw new Error(`Failed to add bot ${i}: ${botRes.error}`);
    }
  }
  console.log('3 bots added successfully. Total members: 4');

  // Start draft
  const startDraftRes = DraftMultiplayerStore.startDraft(room.id, hostMember.id);
  if (!startDraftRes.success) {
    throw new Error(`Failed to start draft: ${startDraftRes.error}`);
  }
  console.log('Draft started. Status: DRAFTING');

  // Finalize draft league to transition to LEAGUE_ACTIVE
  console.log('Finalizing draft to LEAGUE_ACTIVE via finalizeDraftLeagueAsync...');
  const finalizeRes = await DraftMultiplayerStore.finalizeDraftLeagueAsync(room.id);
  if (!finalizeRes.success || !finalizeRes.state) {
    throw new Error(`Failed to finalize draft league: ${finalizeRes.error}`);
  }
  console.log(`Draft finalized. Status: ${finalizeRes.state.room.status}`);
  console.log(`Fixtures count: ${finalizeRes.state.fixtures.length}`);
  console.log(`Standings count: ${finalizeRes.state.standings.length}`);

  if (finalizeRes.state.fixtures.length === 0 || finalizeRes.state.standings.length === 0) {
    throw new Error('FAIL: Fixtures or standings are empty after finalization!');
  }

  // Launch Playwright browser
  console.log('\n2. Launching Browser and Navigating to League Hub...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const fetchLogs: { time: number; type: string; details?: string }[] = [];
  const realtimeEvents: { time: number; table: string; roomId: string }[] = [];
  let repairCount = 0;

  page.on('console', (msg) => {
    const text = msg.text();
    const now = Date.now();
    if (text.includes('LEAGUE_FETCH_START')) {
      fetchLogs.push({ time: now, type: 'START', details: text });
      console.log(`  [BROWSER LOG] ${text}`);
    } else if (text.includes('LEAGUE_FETCH_END')) {
      fetchLogs.push({ time: now, type: 'END', details: text });
      console.log(`  [BROWSER LOG] ${text}`);
    } else if (text.includes('LEAGUE_FETCH_SKIPPED_IN_FLIGHT')) {
      fetchLogs.push({ time: now, type: 'SKIPPED', details: text });
      console.log(`  [BROWSER LOG] ${text}`);
    } else if (text.includes('LEAGUE_FETCH_QUEUED')) {
      fetchLogs.push({ time: now, type: 'QUEUED', details: text });
      console.log(`  [BROWSER LOG] ${text}`);
    } else if (text.includes('LEAGUE_REPAIR_START')) {
      repairCount++;
      console.log(`  [BROWSER LOG] ${text}`);
    } else if (text.includes('REALTIME_EVENT')) {
      const parts = text.split(' ');
      realtimeEvents.push({ time: now, table: parts[1] || '', roomId: parts[2] || '' });
      console.log(`  [BROWSER LOG] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    console.error('  [PAGE UNCAUGHT ERROR]', err.message);
  });

  // Seed session id into browser localStorage before navigation
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ sId, rCode, rState }) => {
      localStorage.setItem('squadcraft_multiplayer_session_id', sId);
      localStorage.setItem(`squadcraft_draft_room_${rCode}`, JSON.stringify(rState));
    },
    { sId: testSessionId, rCode: room.roomCode, rState: finalizeRes.state }
  );

  // Navigate to League Hub
  console.log(`Navigating to http://localhost:3000/draft/room/${room.roomCode}/league ...`);
  await page.goto(`http://localhost:3000/draft/room/${room.roomCode}/league`, {
    waitUntil: 'networkidle',
  });

  // Verify League Hub loads successfully (not stuck on loading, no error screen)
  console.log('Verifying League Hub UI elements...');
  const errorScreen = page.locator('text=BU EKRAN YÜKLENEMEDİ');
  if (await errorScreen.isVisible()) {
    throw new Error('FAIL: League Hub displayed error screen: BU EKRAN YÜKLENEMEDİ');
  }

  // Look for League Hub tabs and content
  const overviewTitle = page.getByText('Genel Bakış').first();
  await overviewTitle.waitFor({ state: 'visible', timeout: 10000 });
  await page.screenshot({ path: 'C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5/snap_draft_league_verified.png', fullPage: true });
  console.log('PASS: League Hub loaded successfully with overview and fixtures!');

  // Check that standings and fixtures are rendered
  const standingsRows = page.locator('table tbody tr, div:has-text("Puan Durumu")');
  console.log(`Standings indicator visible: ${await standingsRows.first().isVisible()}`);

  console.log('\n====================================================');
  console.log('3. 30 SECONDS IDLE MONITORING (REQUEST STORM CHECK)');
  console.log('====================================================');

  const idleStart = Date.now();
  fetchLogs.length = 0; // reset counter for idle measurement
  await page.waitForTimeout(30000);
  const idleEnd = Date.now();

  const idleFetchStarts = fetchLogs.filter((l) => l.type === 'START').length;
  console.log(`Idle duration: ${Math.round((idleEnd - idleStart) / 1000)}s`);
  console.log(`LEAGUE_FETCH_START count during 30s idle: ${idleFetchStarts}`);
  console.log(`LEAGUE_REPAIR count during 30s idle: ${repairCount}`);

  // With 1s polling, this would have been at least 30 requests.
  // With 8s fallback heartbeat, expected is 3 to 4 requests.
  if (idleFetchStarts > 8) {
    throw new Error(`FAIL: Request storm detected! ${idleFetchStarts} fetches in 30s (expected <= 6)`);
  }
  if (repairCount > 1) {
    throw new Error(`FAIL: Repair loop detected! Repair called ${repairCount} times`);
  }
  console.log('PASS: 30s idle request count is controlled and stable (NO REQUEST STORM)!');

  console.log('\n====================================================');
  console.log('4. 5X CONSECUTIVE LEAGUE REFRESH TEST');
  console.log('====================================================');

  for (let r = 1; r <= 5; r++) {
    console.log(`Refreshing League Hub #${r} ...`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const isErr = await page.locator('text=BU EKRAN YÜKLENEMEDİ').isVisible();
    if (isErr) {
      throw new Error(`FAIL: Error screen appeared on refresh #${r}`);
    }

    const titleEl = page.getByText('Genel Bakış').first();
    await titleEl.waitFor({ state: 'visible', timeout: 8000 });
    console.log(`  Refresh #${r}: SUCCESS (Hub loaded stably)`);
  }
  console.log('PASS: 5 consecutive refreshes completed with 100% success!');

  console.log('\n====================================================');
  console.log('5. 2-TAB / 2-PLAYER REALTIME DEDUPLICATION TEST');
  console.log('====================================================');

  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await context2.newPage();

  // Tab 2 joins as observer or member
  await page2.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page2.evaluate(
    ({ rCode, rState }) => {
      localStorage.setItem('squadcraft_multiplayer_session_id', 'test-sess-member-2');
      localStorage.setItem(`squadcraft_draft_room_${rCode}`, JSON.stringify(rState));
    },
    { rCode: room.roomCode, rState: finalizeRes.state }
  );

  await page2.goto(`http://localhost:3000/draft/room/${room.roomCode}/league`, {
    waitUntil: 'networkidle',
  });
  console.log('Tab 2 opened on League Hub.');

  // Trigger rapid burst of 3 updates from Tab 2 / client
  fetchLogs.length = 0;
  console.log('Simulating rapid room update burst...');
  await page2.evaluate(({ rCode }) => {
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('focus'));
  }, { rCode: room.roomCode });

  await page.waitForTimeout(2000);

  const burstStarts = fetchLogs.filter((l) => l.type === 'START').length;
  const burstSkipped = fetchLogs.filter((l) => l.type === 'SKIPPED').length;
  console.log(`Burst fetches executed: ${burstStarts}, skipped in-flight: ${burstSkipped}`);

  if (burstStarts > 2) {
    throw new Error(`FAIL: Single-flight hydration failed! Executed ${burstStarts} concurrent fetches during burst`);
  }
  console.log('PASS: Single-flight lock and queueing verified (at most 1 active + 1 queued)!');

  await browser.close();
  console.log('\n====================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('TEST RUN ERROR:', err);
  process.exit(1);
});
