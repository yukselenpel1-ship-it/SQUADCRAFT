const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  const artifactDir = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

  console.log('Navigating to room creation...');
  await page.goto('https://squadcraft.vercel.app/draft/room', { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(1500);

  const nameInput = page.locator('input[placeholder*="menajer"], input[placeholder*="İsminiz"], input[type="text"]').first();
  await nameInput.fill('Şampiyon Menajer');

  const createBtn = page.locator('button:has-text("ÖZEL ODA OLUŞTUR & LOBİYE GİR")').first();
  await createBtn.click();
  await page.waitForTimeout(3000);

  // Add 5 bots
  for (let i = 0; i < 5; i++) {
    const kolayBtn = page.locator('button:has-text("KOLAY")').first();
    if (await kolayBtn.isVisible()) {
      await kolayBtn.click();
      await page.waitForTimeout(600);
    }
  }

  // Start draft
  const startDraftBtn = page.locator('button:has-text("DRAFT\'I BAŞLAT")').first();
  await startDraftBtn.click();
  await page.waitForTimeout(3000);

  console.log('In draft screen:', page.url());

  // Use evaluate to finalize draft directly in localStorage / store so we can immediately enter league
  await page.evaluate(() => {
    // Find all localStorage keys for draft rooms
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('squadcraft_draft_room_')) {
        try {
          const state = JSON.parse(localStorage.getItem(key));
          if (state && state.room) {
            state.room.status = 'LEAGUE_ACTIVE';
            state.room.leaguePhase = 'LEAGUE_ACTIVE';
            if (state.draftState) {
              state.draftState.isCompleted = true;
            }
            // Populate squads if empty
            const pool = state.playerPool || [];
            let pIdx = 0;
            state.clubs.forEach((club) => {
              if (!club.squadPlayerIds || club.squadPlayerIds.length < 18) {
                club.squadPlayerIds = pool.slice(pIdx, pIdx + 18).map(p => p.id);
                pIdx += 18;
              }
            });

            // Generate fixtures & standings if missing
            if (!state.fixtures || state.fixtures.length === 0) {
              state.fixtures = [];
              let fId = 1;
              const clubsList = state.clubs;
              const numClubs = clubsList.length;
              // Generate simple double round
              for (let round = 1; round <= (numClubs - 1) * 2; round++) {
                for (let i = 0; i < numClubs / 2; i++) {
                  const h = clubsList[i];
                  const a = clubsList[numClubs - 1 - i];
                  state.fixtures.push({
                    id: `fix-${fId++}`,
                    round: round,
                    homeClubId: round % 2 === 1 ? h.id : a.id,
                    awayClubId: round % 2 === 1 ? a.id : h.id,
                    status: 'PENDING',
                    homeScore: null,
                    awayScore: null
                  });
                }
              }
            }

            if (!state.standings || state.standings.length === 0) {
              state.standings = state.clubs.map((c, idx) => ({
                clubId: c.id,
                clubName: c.name,
                rank: idx + 1,
                played: 0,
                won: 0,
                drawn: 0,
                lost: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                goalDifference: 0,
                points: 0,
                form: []
              }));
            }

            state.room.totalMatchweeks = 10;
            state.room.currentMatchweek = 1;
            localStorage.setItem(key, JSON.stringify(state));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  });

  const roomMatch = page.url().match(/\/room\/([^\/]+)/);
  const roomCode = roomMatch ? roomMatch[1] : '';

  const leagueUrl = `https://squadcraft.vercel.app/draft/room/${roomCode}/league`;
  console.log('Navigating to league screen:', leagueUrl);
  await page.goto(leagueUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
  await page.waitForTimeout(2000);

  // Tab 1: Overview
  await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab1_overview.png') });
  console.log('Saved snap_league_tab1_overview.png');

  // Tab 2: Kadrom
  const squadTab = page.locator('button:has-text("Kadrom")').first();
  if (await squadTab.isVisible()) {
    await squadTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab2_squad.png') });
    console.log('Saved snap_league_tab2_squad.png');
  }

  // Tab 3: Taktik & Dizilis
  const tacticsTab = page.locator('button:has-text("Taktik & Diziliş")').first();
  if (await tacticsTab.isVisible()) {
    await tacticsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab3_tactics.png') });
    console.log('Saved snap_league_tab3_tactics.png');
  }

  // Tab 4: Fikstur & Maclar
  const fixturesTab = page.locator('button:has-text("Fikstür & Maçlar")').first();
  if (await fixturesTab.isVisible()) {
    await fixturesTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab4_fixtures.png') });
    console.log('Saved snap_league_tab4_fixtures.png');
  }

  // Tab 5: Puan Durumu
  const standingsTab = page.locator('button:has-text("Puan Durumu")').first();
  if (await standingsTab.isVisible()) {
    await standingsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab5_standings.png') });
    console.log('Saved snap_league_tab5_standings.png');
  }

  // Tab 6: Istatistikler
  const statsTab = page.locator('button:has-text("İstatistikler")').first();
  if (await statsTab.isVisible()) {
    await statsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab6_stats.png') });
    console.log('Saved snap_league_tab6_stats.png');
  }

  // Tab 7: Draft Gecmisi
  const historyTab = page.locator('button:has-text("Draft Geçmişi")').first();
  if (await historyTab.isVisible()) {
    await historyTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab7_history.png') });
    console.log('Saved snap_league_tab7_history.png');
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
