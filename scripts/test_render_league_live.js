const { chromium } = require('playwright');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('Starting local Next.js server on port 3005...');
  const nextServer = spawn('npx', ['next', 'start', '-p', '3005'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });

  // Wait for server to start
  await new Promise((resolve) => {
    nextServer.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[Server]', msg.trim());
      if (msg.includes('Ready') || msg.includes('3005') || msg.includes('started')) {
        resolve();
      }
    });
    setTimeout(resolve, 6000);
  });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  const artifactDir = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

  console.log('Navigating to local room creation on http://localhost:3005/draft/room...');
  await page.goto('http://localhost:3005/draft/room', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Set manager name
  const nameInput = page.locator('input[placeholder*="menajer"], input[placeholder*="İsminiz"], input[type="text"]').first();
  await nameInput.fill('Fırtına Menajer');

  // Create room
  const createBtn = page.locator('button:has-text("ÖZEL ODA OLUŞTUR & LOBİYE GİR")').first();
  await createBtn.click();
  await page.waitForTimeout(2000);

  // Add 5 bots
  for (let i = 0; i < 5; i++) {
    const kolayBtn = page.locator('button:has-text("KOLAY")').first();
    if (await kolayBtn.isVisible()) {
      await kolayBtn.click();
      await page.waitForTimeout(400);
    }
  }

  // Finalize state in localStorage directly to enter League
  await page.evaluate(() => {
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
            const pool = state.playerPool || [];
            let pIdx = 0;
            state.clubs.forEach((club) => {
              club.squadPlayerIds = pool.slice(pIdx, pIdx + 18).map(p => p.id);
              pIdx += 18;
            });

            state.fixtures = [];
            let fId = 1;
            const clubsList = state.clubs;
            const numClubs = clubsList.length;
            for (let round = 1; round <= (numClubs - 1) * 2; round++) {
              for (let j = 0; j < numClubs / 2; j++) {
                const h = clubsList[j];
                const a = clubsList[numClubs - 1 - j];
                state.fixtures.push({
                  id: `fix-${fId++}`,
                  round: round,
                  homeClubId: round % 2 === 1 ? h.id : a.id,
                  awayClubId: round % 2 === 1 ? a.id : h.id,
                  status: round === 1 && j === 0 ? 'COMPLETED' : 'PENDING',
                  homeScore: round === 1 && j === 0 ? 3 : null,
                  awayScore: round === 1 && j === 0 ? 1 : null
                });
              }
            }

            state.standings = state.clubs.map((c, idx) => ({
              clubId: c.id,
              clubName: c.name,
              rank: idx + 1,
              played: idx < 2 ? 1 : 0,
              won: idx === 0 ? 1 : 0,
              drawn: 0,
              lost: idx === 1 ? 1 : 0,
              goalsFor: idx === 0 ? 3 : idx === 1 ? 1 : 0,
              goalsAgainst: idx === 0 ? 1 : idx === 1 ? 3 : 0,
              goalDifference: idx === 0 ? 2 : idx === 1 ? -2 : 0,
              points: idx === 0 ? 3 : 0,
              form: idx === 0 ? ['W'] : idx === 1 ? ['L'] : []
            }));

            state.awards = {
              championClubId: state.clubs[0].id,
              championClubName: state.clubs[0].name,
              topScorer: { playerId: 'p1', playerName: 'Rafael Smirnov', clubName: state.clubs[0].name, goals: 3 },
              topAssists: { playerId: 'p2', playerName: 'Doruk Gündoğdu', clubName: state.clubs[0].name, assists: 2 },
              bestRating: { playerId: 'p1', playerName: 'Rafael Smirnov', clubName: state.clubs[0].name, rating: 8.9 },
              bestGoalkeeper: { playerId: 'p3', playerName: 'Selim Medeiros', clubName: state.clubs[0].name, cleanSheets: 1 },
              bestAttack: { clubId: state.clubs[0].id, clubName: state.clubs[0].name, goalsFor: 3 },
              bestDefense: { clubId: state.clubs[0].id, clubName: state.clubs[0].name, goalsAgainst: 1 }
            };

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
  const leagueUrl = `http://localhost:3005/draft/room/${roomCode}/league`;
  console.log('Navigating to league screen:', leagueUrl);
  await page.goto(leagueUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Tab 1: Overview
  await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab1_overview.png') });
  console.log('Saved snap_live_league_tab1_overview.png');

  // Tab 2: Kadrom
  const squadTab = page.locator('button:has-text("Kadrom")').first();
  if (await squadTab.isVisible()) {
    await squadTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab2_squad.png') });
    console.log('Saved snap_live_league_tab2_squad.png');
  }

  // Tab 3: Taktik & Diziliş
  const tacticsTab = page.locator('button:has-text("Taktik & Diziliş")').first();
  if (await tacticsTab.isVisible()) {
    await tacticsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab3_tactics.png') });
    console.log('Saved snap_live_league_tab3_tactics.png');
  }

  // Tab 4: Fikstür & Maçlar
  const fixturesTab = page.locator('button:has-text("Fikstür & Maçlar")').first();
  if (await fixturesTab.isVisible()) {
    await fixturesTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab4_fixtures.png') });
    console.log('Saved snap_live_league_tab4_fixtures.png');
  }

  // Tab 5: Puan Durumu
  const standingsTab = page.locator('button:has-text("Puan Durumu")').first();
  if (await standingsTab.isVisible()) {
    await standingsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab5_standings.png') });
    console.log('Saved snap_live_league_tab5_standings.png');
  }

  // Tab 6: İstatistikler
  const statsTab = page.locator('button:has-text("İstatistikler")').first();
  if (await statsTab.isVisible()) {
    await statsTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab6_stats.png') });
    console.log('Saved snap_live_league_tab6_stats.png');
  }

  // Tab 7: Draft Geçmişi
  const historyTab = page.locator('button:has-text("Draft Geçmişi")').first();
  if (await historyTab.isVisible()) {
    await historyTab.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab7_history.png') });
    console.log('Saved snap_live_league_tab7_history.png');
  }

  await browser.close();
  nextServer.kill();
  console.log('Testing finished cleanly!');
}

main().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});
