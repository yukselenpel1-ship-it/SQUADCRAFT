import { chromium } from 'playwright';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  page.on('console', (msg) => {
    const text = msg.text();
    if (
      !text.includes('Download the React DevTools') &&
      !text.includes('Fast Refresh') &&
      !text.includes('RECONCILE') &&
      !text.includes('FETCH_ROOM_LOBBY') &&
      !text.includes('HYDRATE_ROOM')
    ) {
      console.log('[BROWSER_CONSOLE]', msg.type(), text);
    }
  });

  page.on('pageerror', (err) => {
    console.error('[BROWSER_ERROR]', err.message);
  });

  console.log('Navigating to http://localhost:3000/draft ...');
  await page.goto('http://localhost:3000/draft', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Fill in manager name
  console.log('Filling manager name...');
  const nameInput = page.locator('input[placeholder*="Doruk"]');
  await nameInput.waitFor({ state: 'visible', timeout: 5000 });
  await nameInput.fill('TestBoss');

  // Click create room button
  console.log('Clicking ODAYI KUR VE LOBİYE GİR...');
  await page.click('button:has-text("ODAYI KUR VE LOBİYE GİR")');

  // Wait for navigation to /draft/room/[code]
  console.log('Waiting for room lobby navigation...');
  await page.waitForURL(/\/draft\/room\/[A-Za-z0-9_-]+$/, { timeout: 15000 });
  const lobbyUrl = page.url();
  console.log('Lobby URL:', lobbyUrl);

  // Wait 1.5s for room hydration
  await page.waitForTimeout(1500);

  // Add 1 bot
  console.log('Adding bot (+ Orta)...');
  const addBotBtn = page.locator('button:has-text("+ Orta")').first();
  await addBotBtn.waitFor({ state: 'visible', timeout: 8000 });
  await addBotBtn.click();
  await page.waitForTimeout(1200);

  // If ready button "MAÇA HAZIRIM!" is visible, click it (host might already be ready)
  const readyBtn = page.locator('button:has-text("MAÇA HAZIRIM!")');
  if (await readyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Clicking MAÇA HAZIRIM! ...');
    await readyBtn.click();
    await page.waitForTimeout(800);
  } else {
    console.log('Manager is already ready.');
  }

  // Click DRAFT'I BAŞLAT
  console.log('Waiting for DRAFT\'I BAŞLAT button to become enabled...');
  const startDraftBtn = page.locator('button:has-text("DRAFT\'I BAŞLAT")');
  await startDraftBtn.waitFor({ state: 'visible', timeout: 10000 });
  // Wait until it doesn't have disabled or cursor-not-allowed
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find((el) => el.textContent?.includes("DRAFT'I BAŞLAT"));
    return b && !b.disabled && !b.className.includes('cursor-not-allowed');
  }, { timeout: 10000 });

  console.log('Clicking DRAFT\'I BAŞLAT...');
  await startDraftBtn.click();

  // Wait for navigation to /draft/room/[code]/draft
  console.log('Waiting for draft screen navigation...');
  await page.waitForURL(/\/draft\/room\/[A-Za-z0-9_-]+\/draft$/, { timeout: 15000 });
  const draftUrl = page.url();
  console.log('Draft URL reached:', draftUrl);

  await page.waitForTimeout(1500);

  // 1. Inspect top-left SQUADCRAFT logo
  const headerLogoLink = page.locator('header a[href="/"]').first();
  const logoVisible = await headerLogoLink.isVisible();
  const logoText = (await headerLogoLink.textContent())?.trim();
  const logoImg = headerLogoLink.locator('img');
  const logoImgSrc = await logoImg.getAttribute('src');
  const logoImgNaturalWidth = await logoImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
  const logoImgNaturalHeight = await logoImg.evaluate((img: HTMLImageElement) => img.naturalHeight);

  console.log('=== LOGO INSPECTION ===');
  console.log('Logo Link Visible:', logoVisible);
  console.log('Logo Text:', logoText);
  console.log('Logo Img Src:', logoImgSrc);
  console.log('Logo Img Dimensions:', `${logoImgNaturalWidth}x${logoImgNaturalHeight}`);

  // Screenshot initial draft screen
  const snapInitialPath = path.join(ARTIFACT_DIR, 'snap_initial_draft_screen.png');
  await page.screenshot({ path: snapInitialPath });
  console.log('Screenshot saved:', snapInitialPath);

  // Helper to extract remaining budget from manager widget
  const getBudgetText = async () => {
    const budgetEl = page.locator('header span:has-text("€")').first();
    if (await budgetEl.isVisible()) {
      return (await budgetEl.textContent())?.trim();
    }
    return 'NOT_FOUND';
  };

  const initialBudgetText = await getBudgetText();
  console.log('=== INITIAL BUDGET WIDGET ===', initialBudgetText);

  // 2. Draft a player
  console.log('Looking for player pick button...');
  const pickBtn = page.locator('button:has-text("KADROYA KAT"), button:has-text("SEÇ")').first();
  await pickBtn.waitFor({ state: 'visible', timeout: 10000 });

  // Get player name and price from card
  const cardText = await pickBtn.locator('xpath=ancestor::div[contains(@class, "border")]').first().innerText();
  console.log('Target player snippet:', cardText.replace(/\n+/g, ' | ').slice(0, 100));

  console.log('Clicking pick button...');
  await pickBtn.click();
  await page.waitForTimeout(500);

  const budgetRightAfterPick = await getBudgetText();
  console.log('=== BUDGET RIGHT AFTER PICK ===', budgetRightAfterPick);

  // 3. Monitor budget over 12 seconds through bot turns, polling ticks (every 3s), etc.
  console.log('Monitoring budget for 12 seconds...');
  const recordedBudgets: string[] = [budgetRightAfterPick];
  for (let s = 1; s <= 12; s++) {
    await page.waitForTimeout(1000);
    const b = await getBudgetText();
    recordedBudgets.push(b);
    console.log(`[T+${s}s] Live Budget: ${b}`);
  }

  // Screenshot after pick
  const snapAfterPickPath = path.join(ARTIFACT_DIR, 'snap_after_pick_draft_screen.png');
  await page.screenshot({ path: snapAfterPickPath });
  console.log('Screenshot saved:', snapAfterPickPath);

  // Verify that budget NEVER reverted to €250.0M
  const reverted = recordedBudgets.some((b) => b === '€250.0M' || b === '€250M');
  console.log('=== VERIFICATION RESULT ===');
  console.log('Reverted to 250M?', reverted ? 'FAIL: Reverted!' : 'PASS: Budget remained deducted!');

  await browser.close();

  if (reverted) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
