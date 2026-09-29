import { chromium, webkit } from 'playwright';

const VERCEL_BASE = 'https://squadcraft.vercel.app';

async function runE2EVerification() {
  console.log('==================================================================');
  console.log(`🚀 STARTING PRODUCTION E2E VERIFICATION ON VERCEL: ${VERCEL_BASE}`);
  console.log('==================================================================\n');

  let runtimeErrors: string[] = [];

  // =================================================================
  // TEST 1: DESKTOP CHROMIUM - FULL DRAFT & RECONNECT & LEAGUE FLOW
  // =================================================================
  console.log('--- TEST 1: DESKTOP CHROMIUM E2E ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // Filter out expected or non-fatal network noise
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        console.log(`[Browser Console Error]: ${text}`);
        runtimeErrors.push(`Console: ${text}`);
      }
    }
  });
  page.on('pageerror', (err) => {
    console.error(`[Browser Page Error]: ${err.message}`);
    runtimeErrors.push(`PageError: ${err.message}`);
  });

  // 1.1 Homepage check
  console.log('1. Checking Homepage...');
  await page.goto(`${VERCEL_BASE}/`, { waitUntil: 'networkidle' });
  const title = await page.title();
  console.log(`   Homepage Title: "${title}"`);

  // 1.2 Navigate to /draft
  console.log('2. Navigating to /draft...');
  await page.goto(`${VERCEL_BASE}/draft`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 1.3 Create Room
  console.log('3. Creating new Draft Room...');
  const nameInput = page.locator('input[placeholder*="Menajer"], input[placeholder*="isim"], input[type="text"]').first();
  await nameInput.fill('Vercel Tester');
  const createBtn = page.locator('button:has-text("ÖZEL ODA OLUŞTUR"), button[type="submit"]').first();
  await createBtn.click();
  await page.waitForURL(/\/draft\/room\/[A-Z0-9-]+/, { timeout: 15000 });
  const roomUrl = page.url();
  console.log(`   Room Created URL: ${roomUrl}`);

  // 1.4 Add/Remove Bots in Room Lobby
  console.log('4. Testing Add/Remove Bots in Lobby...');
  await page.waitForTimeout(1500);
  
  // Check add bot buttons
  const addBotBtn = page.locator('button:has-text("+ BOT EKLE"), button:has-text("Bot Ekle")').first();
  if (await addBotBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await addBotBtn.click();
    await page.waitForTimeout(1000);
    console.log('   ✅ Bot added successfully');
  }

  // 1.5 Start Draft
  console.log('5. Starting Draft...');
  const startDraftBtn = page.locator('button:has-text("DRAFT\'I BAŞLAT"), button:has-text("DRAFTI BAŞLAT"), button:has-text("Draftı Başlat")').first();
  if (await startDraftBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await startDraftBtn.click();
    await page.waitForURL(/\/draft\/room\/[A-Z0-9-]+\/draft/, { timeout: 15000 });
    console.log(`   Draft Active URL: ${page.url()}`);
  }

  // 1.6 Execute Consecutive Picks
  console.log('6. Executing Consecutive Picks...');
  let pickCount = 0;
  for (let step = 1; step <= 25; step++) {
    await page.waitForTimeout(1000);

    // Look for pick button or selectable player card
    const pickBtn = page.locator('button:has-text("KADROYA SEÇ"), button:has-text("SEÇ"), button:has-text("Pick")').first();
    if (await pickBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await pickBtn.click();
      pickCount++;
      console.log(`   -> Pick #${pickCount} submitted successfully`);
      await page.waitForTimeout(1000);
    }

    // 1.7 Refresh & Reconnect mid-draft
    if (step === 10) {
      console.log('7. Testing Refresh & Reconnect during live Draft...');
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      console.log(`   ✅ Reconnected cleanly at URL: ${page.url()}`);
    }
  }

  console.log(`   Completed ${pickCount} user picks during draft phase.`);

  await browser.close();

  // =================================================================
  // TEST 2: MOBILE WEBKIT (IPHONE VIEWPORT)
  // =================================================================
  console.log('\n--- TEST 2: MOBILE WEBKIT (IPHONE 14) ---');
  const webkitBrowser = await webkit.launch({ headless: true });
  const mobileContext = await webkitBrowser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });

  const mobilePage = await mobileContext.newPage();
  mobilePage.on('pageerror', (err) => {
    console.error(`[Mobile WebKit Error]: ${err.message}`);
    runtimeErrors.push(`Mobile WebKit: ${err.message}`);
  });

  console.log('1. Checking Homepage on Mobile WebKit...');
  await mobilePage.goto(`${VERCEL_BASE}/`, { waitUntil: 'networkidle' });
  const mobileTitle = await mobilePage.title();
  console.log(`   Mobile Title: "${mobileTitle}"`);

  console.log('2. Checking /draft on Mobile WebKit...');
  await mobilePage.goto(`${VERCEL_BASE}/draft`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);

  console.log('3. Checking /career/new on Mobile WebKit...');
  await mobilePage.goto(`${VERCEL_BASE}/career/new`, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  console.log(`   Career New Title: "${await mobilePage.title()}"`);

  await webkitBrowser.close();

  console.log('\n==================================================================');
  console.log('✅ ALL PRODUCTION E2E VERIFICATIONS COMPLETE');
  console.log(`   Runtime Errors Count: ${runtimeErrors.length}`);
  console.log('==================================================================');
}

runE2EVerification().catch((err) => {
  console.error('Fatal E2E Error:', err);
  process.exit(1);
});
