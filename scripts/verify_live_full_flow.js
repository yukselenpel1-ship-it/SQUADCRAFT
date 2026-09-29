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
  await page.goto('https://squadcraft.vercel.app/draft/room', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(1500);

  // Name
  const nameInput = page.locator('input[placeholder*="menajer"], input[placeholder*="İsminiz"], input[type="text"]').first();
  await nameInput.fill('Fırtına Menajer');

  // Click create room
  const createBtn = page.locator('button:has-text("ÖZEL ODA OLUŞTUR & LOBİYE GİR")').first();
  await createBtn.click();
  await page.waitForTimeout(3500);

  const lobbyUrl = page.url();
  console.log('Lobby URL:', lobbyUrl);

  // Add 5 bots using the "KOLAY" button
  for (let i = 0; i < 5; i++) {
    const kolayBtn = page.locator('button:has-text("KOLAY")').first();
    if (await kolayBtn.isVisible()) {
      await kolayBtn.click();
      await page.waitForTimeout(800);
    }
  }

  await page.screenshot({ path: path.join(artifactDir, 'snap_live_6man_lobby_ready.png') });
  console.log('Saved snap_live_6man_lobby_ready.png');

  // Start Draft
  const startDraftBtn = page.locator('button:has-text("DRAFT\'I BAŞLAT")').first();
  if (await startDraftBtn.isVisible()) {
    await startDraftBtn.click();
    await page.waitForTimeout(4000);
  }

  console.log('Draft URL:', page.url());
  await page.screenshot({ path: path.join(artifactDir, 'snap_live_6man_drafting.png') });

  // Let's do draft picks until completion or toggle Auto Pick
  // In draft screen, click Auto Pick if available or pick first player
  console.log('Completing draft picks...');
  let maxPicks = 110;
  while (maxPicks > 0) {
    if (page.url().includes('/league')) {
      console.log('Reached league screen directly!');
      break;
    }

    // Check if draft completed banner or button to league is visible
    const goToLeagueBtn = page.locator('button:has-text("LİG MERKEZİNE GİT"), a:has-text("LİG MERKEZİNE GİT"), button:has-text("Lige Başla")').first();
    if (await goToLeagueBtn.isVisible()) {
      await goToLeagueBtn.click();
      await page.waitForTimeout(3000);
      break;
    }

    // Check if player pick button is available
    const pickBtn = page.locator('button:has-text("KADROYA KAT"), button:has-text("DRAFT ET"), button:has-text("SEÇ")').first();
    if (await pickBtn.isVisible()) {
      await pickBtn.click();
      await page.waitForTimeout(500);
    } else {
      // Wait for bots
      await page.waitForTimeout(1000);
    }
    maxPicks--;
  }

  // Ensure we are in League
  const leagueUrl = page.url();
  console.log('Final League URL:', leagueUrl);

  if (leagueUrl.includes('/league')) {
    await page.waitForTimeout(2000);

    // Tab 1: Overview
    await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab1_overview.png') });
    console.log('Saved snap_live_league_tab1_overview.png');

    // Tab 2: Kadrom
    const squadTab = page.locator('button:has-text("Kadrom")').first();
    if (await squadTab.isVisible()) {
      await squadTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab2_squad.png') });
      console.log('Saved snap_live_league_tab2_squad.png');
    }

    // Tab 3: Taktik & Diziliş
    const tacticsTab = page.locator('button:has-text("Taktik & Diziliş")').first();
    if (await tacticsTab.isVisible()) {
      await tacticsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab3_tactics.png') });
      console.log('Saved snap_live_league_tab3_tactics.png');
    }

    // Tab 4: Fikstür & Maçlar
    const fixturesTab = page.locator('button:has-text("Fikstür & Maçlar")').first();
    if (await fixturesTab.isVisible()) {
      await fixturesTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab4_fixtures.png') });
      console.log('Saved snap_live_league_tab4_fixtures.png');
    }

    // Tab 5: Puan Durumu
    const standingsTab = page.locator('button:has-text("Puan Durumu")').first();
    if (await standingsTab.isVisible()) {
      await standingsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab5_standings.png') });
      console.log('Saved snap_live_league_tab5_standings.png');
    }

    // Tab 6: İstatistikler
    const statsTab = page.locator('button:has-text("İstatistikler")').first();
    if (await statsTab.isVisible()) {
      await statsTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab6_stats.png') });
      console.log('Saved snap_live_league_tab6_stats.png');
    }

    // Tab 7: Draft Geçmişi
    const historyTab = page.locator('button:has-text("Draft Geçmişi")').first();
    if (await historyTab.isVisible()) {
      await historyTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(artifactDir, 'snap_live_league_tab7_history.png') });
      console.log('Saved snap_live_league_tab7_history.png');
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error('Error during full test:', err);
  process.exit(1);
});
