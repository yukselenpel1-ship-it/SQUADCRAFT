const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function run() {
  const artifactDir = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';
  
  const browser = await chromium.launch({ headless: true });

  console.log('1. Launching Desktop 1920x1080...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  console.log('Navigating to http://localhost:3000/vault...');
  await page.goto('http://localhost:3000/vault', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Desktop fold screenshot
  const heroPath = path.join(artifactDir, 'the_vault_hero_desktop_1920x1080.png');
  await page.screenshot({ path: heroPath, fullPage: false });
  console.log('Saved hero fold:', heroPath);

  // Full page screenshot
  const fullPath = path.join(artifactDir, 'the_vault_fullpage_desktop_1920.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log('Saved full page desktop:', fullPath);

  // Scroll to calendar
  await page.evaluate(() => {
    const el = document.getElementById('calendar');
    if (el) el.scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const calendarPath = path.join(artifactDir, 'the_vault_calendar_section.png');
  await page.screenshot({ path: calendarPath });
  console.log('Saved calendar section:', calendarPath);

  // Click on a slot to trigger booking modal
  const availableBtn = page.locator('button:has-text("Available")').first();
  if (await availableBtn.count() > 0) {
    await availableBtn.click();
    await page.waitForTimeout(600);
    const modalPath = path.join(artifactDir, 'the_vault_booking_modal.png');
    await page.screenshot({ path: modalPath });
    console.log('Saved booking modal:', modalPath);

    // Fill form and test submit
    await page.fill('input[placeholder="e.g. Eleanor Vance"]', 'Arthur Conan');
    await page.fill('input[placeholder="you@domain.com"]', 'arthur@conan.co.uk');
    await page.click('button:has-text("Confirm Reservation")');
    await page.waitForTimeout(600);
    const confirmedPath = path.join(artifactDir, 'the_vault_booking_confirmed.png');
    await page.screenshot({ path: confirmedPath });
    console.log('Saved booking confirmation:', confirmedPath);
    await page.click('button:has-text("Close & Return")');
  }

  await desktopContext.close();

  // Mobile screenshot (390x844)
  console.log('2. Launching Mobile 390x844...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/vault', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage.waitForTimeout(1500);

  const mobileHeroPath = path.join(artifactDir, 'the_vault_mobile_hero_390x844.png');
  await mobilePage.screenshot({ path: mobileHeroPath });
  console.log('Saved mobile hero:', mobileHeroPath);

  const mobileFullPath = path.join(artifactDir, 'the_vault_mobile_fullpage.png');
  await mobilePage.screenshot({ path: mobileFullPath, fullPage: true });
  console.log('Saved mobile full page:', mobileFullPath);

  await mobileContext.close();
  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch((err) => {
  console.error('Error running screenshot capture:', err);
  process.exit(1);
});
