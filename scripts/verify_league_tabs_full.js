const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  const artifactDir = path.resolve('C:/Users/oguzh/.gemini/antigravity/brain/ec81c01c-7802-440e-952b-e81285fd2bf5');

  console.log('Navigating to https://squadcraft.vercel.app/draft/room...');
  await page.goto('https://squadcraft.vercel.app/draft/room', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(2000);

  // Take screenshot of updated room hub
  await page.screenshot({ path: path.join(artifactDir, 'snap_league_step1_hub.png') });
  console.log('Saved snap_league_step1_hub.png');

  // Fill manager name & create 6 manager room
  const nameInput = page.locator('input[placeholder*="menajer"], input[placeholder*="İsminiz"], input[type="text"]').first();
  if (await nameInput.isVisible()) {
    await nameInput.fill('Fırtına Menajer');
  }

  // Click 6 MENAJER if not already selected
  const sixBtn = page.locator('button:has-text("6 MENAJER")').first();
  if (await sixBtn.isVisible()) {
    await sixBtn.click();
    await page.waitForTimeout(300);
  }

  const createBtn = page.locator('button:has-text("ÖZEL ODA OLUŞTUR"), button:has-text("YENİ ODA")').first();
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(3000);
  }

  const roomUrl = page.url();
  console.log('Room Lobby URL:', roomUrl);
  await page.screenshot({ path: path.join(artifactDir, 'snap_league_step2_lobby.png') });

  // Add 5 bots to reach 6 managers
  for (let i = 0; i < 5; i++) {
    const addBotBtn = page.locator('button:has-text("Bot Ekle"), button:has-text("+ BOT")').first();
    if (await addBotBtn.isVisible()) {
      await addBotBtn.click();
      await page.waitForTimeout(600);
    }
  }

  await page.screenshot({ path: path.join(artifactDir, 'snap_league_step3_lobby_6bots.png') });

  // Start draft
  const startDraftBtn = page.locator('button:has-text("DRAFT\'I BAŞLAT")').first();
  if (await startDraftBtn.isVisible() && await startDraftBtn.isEnabled()) {
    await startDraftBtn.click();
    await page.waitForTimeout(3000);
  }

  console.log('Draft URL:', page.url());
  const draftUrl = page.url();
  const roomCodeMatch = draftUrl.match(/\/room\/([^\/]+)/);
  const roomCode = roomCodeMatch ? roomCodeMatch[1] : null;

  if (roomCode) {
    const leagueUrl = `https://squadcraft.vercel.app/draft/room/${roomCode}/league`;
    console.log('Directly navigating to League URL:', leagueUrl);
    await page.goto(leagueUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);

    // Tab 1: Overview
    await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab1_overview.png') });
    console.log('Saved snap_league_tab1_overview.png');

    // Tab 2: Kadrom
    const squadTab = page.locator('button:has-text("Kadrom")').first();
    if (await squadTab.isVisible()) {
      await squadTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab2_squad.png') });
      console.log('Saved snap_league_tab2_squad.png');
    }

    // Tab 3: Taktik & Dizilis
    const tacticsTab = page.locator('button:has-text("Taktik & Diziliş")').first();
    if (await tacticsTab.isVisible()) {
      await tacticsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab3_tactics.png') });
      console.log('Saved snap_league_tab3_tactics.png');
    }

    // Tab 4: Fikstür & Maçlar
    const fixturesTab = page.locator('button:has-text("Fikstür & Maçlar")').first();
    if (await fixturesTab.isVisible()) {
      await fixturesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab4_fixtures.png') });
      console.log('Saved snap_league_tab4_fixtures.png');
    }

    // Tab 5: Puan Durumu
    const standingsTab = page.locator('button:has-text("Puan Durumu")').first();
    if (await standingsTab.isVisible()) {
      await standingsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab5_standings.png') });
      console.log('Saved snap_league_tab5_standings.png');
    }

    // Tab 6: İstatistikler
    const statsTab = page.locator('button:has-text("İstatistikler")').first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab6_stats.png') });
      console.log('Saved snap_league_tab6_stats.png');
    }

    // Tab 7: Draft Geçmişi
    const historyTab = page.locator('button:has-text("Draft Geçmişi")').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_league_tab7_history.png') });
      console.log('Saved snap_league_tab7_history.png');
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error in test:', err);
  process.exit(1);
});
