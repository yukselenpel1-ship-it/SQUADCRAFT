const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const artifactDir = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';
  const browser = await chromium.launch({ headless: true });

  console.log('1. Launching Desktop 1920x1080...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  console.log('Navigating to http://localhost:3000/...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(3000);

  // 1. Hero fold screenshot (1920x1080)
  const heroPath = path.join(artifactDir, 'squadcraft_3d_hero_desktop_1920x1080.png');
  await page.screenshot({ path: heroPath });
  console.log('Saved Hero Fold Desktop:', heroPath);

  // 2. Mode Selector (Career & Draft League)
  await page.evaluate(() => {
    const el = document.getElementById('career-preview');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const modePath = path.join(artifactDir, 'squadcraft_mode_selector_desktop.png');
  await page.screenshot({ path: modePath });
  console.log('Saved Mode Selector:', modePath);

  // 3. Gameplay Features & Tactical Pitch
  await page.evaluate(() => {
    const el = document.getElementById('tactics');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const tacticsPath = path.join(artifactDir, 'squadcraft_tactics_features_desktop.png');
  await page.screenshot({ path: tacticsPath });
  console.log('Saved Tactics Features:', tacticsPath);

  // 4. Live Match Simulation & Tactical Radar
  await page.evaluate(() => {
    const el = document.getElementById('transfers');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const matchPath = path.join(artifactDir, 'squadcraft_live_match_desktop.png');
  await page.screenshot({ path: matchPath });
  console.log('Saved Live Match Simulation:', matchPath);

  // 5. Full page desktop screenshot
  const fullDesktopPath = path.join(artifactDir, 'squadcraft_fullpage_desktop_1920.png');
  await page.screenshot({ path: fullDesktopPath, fullPage: true });
  console.log('Saved Full Page Desktop:', fullDesktopPath);

  await desktopContext.close();

  // Mobile viewport (390x844)
  console.log('2. Launching Mobile 390x844...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 35000 });
  await mobilePage.waitForTimeout(2000);

  const mobileHeroPath = path.join(artifactDir, 'squadcraft_mobile_hero_390x844.png');
  await mobilePage.screenshot({ path: mobileHeroPath });
  console.log('Saved Mobile Hero:', mobileHeroPath);

  await mobileContext.close();
  await browser.close();
  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Error running capture:', err);
  process.exit(1);
});
