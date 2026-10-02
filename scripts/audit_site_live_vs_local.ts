import { chromium } from 'playwright';

async function auditSite() {
  console.log('--- STARTING COMPREHENSIVE SITE AUDIT (LIVE VS LOCAL) ---');
  const browser = await chromium.launch({ headless: true });

  const routes = [
    '/',
    '/career/new',
    '/dashboard',
    '/squad',
    '/tactics',
    '/fixtures',
    '/transfers',
    '/scouting',
    '/academy',
    '/league',
    '/finances',
    '/inbox',
    '/settings',
    '/match',
    '/draft',
  ];

  // Check Local Desktop & Mobile
  console.log('\n--- 1. CHECKING LOCAL ROUTES (DESKTOP 1440x900) ---');
  const localDesktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const localErrors: string[] = [];
  localDesktop.on('pageerror', (err) => localErrors.push(`[PageError] ${err.message}`));
  localDesktop.on('console', (msg) => {
    if (msg.type() === 'error') localErrors.push(`[ConsoleError] ${msg.text()}`);
  });

  for (const r of routes) {
    try {
      const res = await localDesktop.goto(`http://localhost:3000${r}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const overflow = await localDesktop.evaluate(() => document.body.scrollWidth > window.innerWidth);
      console.log(`Local ${r}: status ${res?.status()} | overflow: ${overflow}`);
    } catch (e: any) {
      console.log(`Local ${r}: FAILED -> ${e.message}`);
    }
  }
  await localDesktop.close();

  console.log('\n--- 2. CHECKING LOCAL ROUTES (MOBILE 390x844) ---');
  const localMobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  });

  for (const r of routes) {
    try {
      const res = await localMobile.goto(`http://localhost:3000${r}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const overflow = await localMobile.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        innerWidth: window.innerWidth,
        hasOverflow: document.body.scrollWidth > window.innerWidth,
      }));
      console.log(`Mobile ${r}: status ${res?.status()} | overflow: ${overflow.hasOverflow} (${overflow.scrollWidth}px vs ${overflow.innerWidth}px)`);
    } catch (e: any) {
      console.log(`Mobile ${r}: FAILED -> ${e.message}`);
    }
  }
  await localMobile.close();

  console.log('\n--- 3. CHECKING LIVE SITE (https://squadcraft.vercel.app/) ---');
  const livePage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const liveErrors: string[] = [];
  livePage.on('pageerror', (err) => liveErrors.push(`[Live PageError] ${err.message}`));
  livePage.on('console', (msg) => {
    if (msg.type() === 'error') liveErrors.push(`[Live ConsoleError] ${msg.text()}`);
  });

  for (const r of ['/', '/draft', '/career/new']) {
    try {
      const res = await livePage.goto(`https://squadcraft.vercel.app${r}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      console.log(`Live ${r}: status ${res?.status()}`);
    } catch (e: any) {
      console.log(`Live ${r}: FAILED -> ${e.message}`);
    }
  }
  await livePage.close();

  console.log('\nConsole Errors on Local:', localErrors.slice(0, 10));
  console.log('Console Errors on Live:', liveErrors.slice(0, 10));

  await browser.close();
  console.log('\n--- AUDIT COMPLETE ---');
}

auditSite().catch(console.error);
