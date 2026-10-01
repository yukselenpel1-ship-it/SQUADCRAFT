import { chromium } from 'playwright';
import { MOCK_CLUBS, MOCK_PLAYERS, MOCK_FINANCES, generateCareerTactics } from '../src/lib/data/mockData';
import { repairCorruptedEconomy, applyEconomyAndContractMigrations } from '../src/lib/career/saveManager';
import { CareerSaveDataV3 } from '../src/lib/career/types';

async function runTests() {
  console.log('====================================================');
  console.log('TEST 1: UNIT / INTEGRATION LEVEL VERIFICATION');
  console.log('====================================================');

  const kalyonPlayers = MOCK_PLAYERS.filter(p => p.clubId === 'kalyon-doruk');

  // Test 1.1: Idempotency of applyEconomyAndContractMigrations
  const mockCareer: CareerSaveDataV3 = {
    saveVersion: 3,
    userClubId: 'kalyon-doruk',
    seasonYear: '2026/27',
    seasonStage: 'PRE_SEASON',
    currentDate: '2026-08-01',
    trainingIntensity: 'Normal',
    clubs: JSON.parse(JSON.stringify(MOCK_CLUBS)).map((c: any) => ({ ...c, transferBudget: c.transferBudget * 2 })),
    players: MOCK_PLAYERS,
    tactics: generateCareerTactics('kalyon-doruk', kalyonPlayers, '4-2-3-1'),
    standings: MOCK_CLUBS.map((c, i) => ({
      rank: i + 1,
      clubId: c.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    })),
    fixtures: [
      {
        id: 'fix-1',
        homeClubId: 'kalyon-doruk',
        awayClubId: 'solvanya-gucu',
        date: '2026-08-15',
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        round: 1,
        seasonYear: '2026/27',
      } as any,
    ],
    inboxMessages: [],
    transferOffers: [],
    shortlistIds: [],
    finances: {
      ...MOCK_FINANCES,
      transferBudget: 50000000,
    },
    newsFeed: [],
    careerHistory: [],
    careerEconomyVersion: 2,
    seasonNumber: 1,
    managerContract: { yearsLeft: 2, weeklySalary: 45000, status: 'ACTIVE' },
  };

  const initialBudget = mockCareer.finances.transferBudget;
  const initialKalyonClubBudget = mockCareer.clubs.find(c => c.id === 'kalyon-doruk')!.transferBudget;

  console.log(`Initial Finances Transfer Budget: €${initialBudget}`);
  console.log(`Initial Kalyon Club Budget: €${initialKalyonClubBudget}`);

  // Run migration 5 times in a row
  for (let i = 1; i <= 5; i++) {
    applyEconomyAndContractMigrations(mockCareer);
    if (mockCareer.finances.transferBudget !== initialBudget) {
      throw new Error(`FAIL: Finances budget changed on iteration ${i} to ${mockCareer.finances.transferBudget}`);
    }
    const currentClubBudget = mockCareer.clubs.find(c => c.id === 'kalyon-doruk')!.transferBudget;
    if (currentClubBudget !== initialKalyonClubBudget) {
      throw new Error(`FAIL: Club budget changed on iteration ${i} to ${currentClubBudget}`);
    }
  }
  console.log('PASS: Migration is 100% idempotent when careerEconomyVersion >= 2 (5 iterations executed)');

  // Test 1.2: Corrupted Save Detection and Repair
  console.log('\nTesting Corrupted Save Repair...');
  const corruptedCareer: CareerSaveDataV3 = JSON.parse(JSON.stringify(mockCareer));
  // Set the exact corrupted value observed by user: €1,638,400,000,000 (€1,638,400.0M)
  corruptedCareer.finances.transferBudget = 1638400000000;
  const corruptedClub = corruptedCareer.clubs.find(c => c.id === 'kalyon-doruk')!;
  corruptedClub.transferBudget = 1638400000000;

  console.log(`BEFORE REPAIR BUDGET: €${(corruptedCareer.finances.transferBudget / 1000000).toLocaleString('en-US')}M`);
  
  const wasRepaired = repairCorruptedEconomy(corruptedCareer);
  console.log(`Repair function returned: ${wasRepaired}`);
  console.log(`AFTER REPAIR BUDGET: €${(corruptedCareer.finances.transferBudget / 1000000).toLocaleString('en-US')}M`);

  const repairedClub = corruptedCareer.clubs.find(c => c.id === 'kalyon-doruk')!;
  if (!wasRepaired || corruptedCareer.finances.transferBudget !== 50000000 || repairedClub.transferBudget !== 50000000) {
    throw new Error(`FAIL: Corrupted save was not properly restored to 50M. Current finances: ${corruptedCareer.finances.transferBudget}, club: ${repairedClub?.transferBudget}`);
  }
  console.log('PASS: Corrupted save successfully restored to legitimate 50M pre-corruption budget.');

  // Test 1.3: Legitimate Save Untouched
  const legitimateCareer: CareerSaveDataV3 = JSON.parse(JSON.stringify(mockCareer));
  legitimateCareer.finances.transferBudget = 45000000; // e.g. user spent 5M on transfers
  legitimateCareer.clubs.find(c => c.id === 'kalyon-doruk')!.transferBudget = 45000000;
  const legitimateRepaired = repairCorruptedEconomy(legitimateCareer);
  if (legitimateRepaired || legitimateCareer.finances.transferBudget !== 45000000) {
    throw new Error('FAIL: Legitimate save was incorrectly modified by repair function');
  }
  console.log('PASS: Legitimate save with legitimate budget is safely preserved without modifications.');

  console.log('\n====================================================');
  console.log('TEST 2: REAL-BROWSER PERSISTENCE & 5X REFRESH TEST');
  console.log('====================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.text().includes('EconomyRepair') || msg.text().includes('SquadCraftDB') || msg.type() === 'error') {
      console.log('PAGE LOG:', msg.text());
    }
  });

  page.on('pageerror', err => {
    console.error('PAGE UNCAUGHT ERROR:', err.message);
  });

  console.log('Navigating to http://localhost:3000 to seed IndexedDB...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Seed IndexedDB with canonical mockCareer
  await page.evaluate(async (careerData) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('SquadCraftDB', 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('careerSaves')) {
          db.createObjectStore('careerSaves');
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('careerSaves', 'readwrite');
        const store = tx.objectStore('careerSaves');
        store.put(careerData, 'mainCareer');
        tx.oncomplete = () => {
          // Set metadata in localStorage for instant detection
          const meta = {
            saveVersion: 3,
            exists: true,
            userClubId: careerData.userClubId,
            clubName: 'Kalyon Doruk SK',
            seasonYear: careerData.seasonYear,
            currentDate: careerData.currentDate,
            managerName: 'Oğuzhan Kaya',
            updatedAt: new Date().toISOString(),
            playerCount: careerData.players?.length || 22,
          };
          localStorage.setItem('SquadCraftCareerMeta', JSON.stringify(meta));
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }, mockCareer);

  console.log('Career seeded successfully into IndexedDB.');

  // Navigate to Dashboard
  console.log('Navigating to http://localhost:3000/dashboard ...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Read budget specifically from Dashboard Transfer Bütçesi indicator
  const readBudget = async (): Promise<string> => {
    const el = page.locator('div:has-text("Transfer Bütçesi") span.text-emerald-400').first();
    await el.waitFor({ state: 'visible', timeout: 7000 });
    return (await el.innerText()).trim();
  };

  const initialDashboardBudget = await readBudget();
  console.log(`BASELINE TRANSFER BUDGET BEFORE REFRESH: ${initialDashboardBudget}`);

  if (!initialDashboardBudget.includes('€50.0M')) {
    throw new Error(`Expected initial budget to be €50.0M, but got ${initialDashboardBudget}`);
  }

  // Perform 5 consecutive browser refreshes
  for (let r = 1; r <= 5; r++) {
    console.log(`Performing Browser Refresh #${r} ...`);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const currentBudget = await readBudget();
    console.log(`  After Refresh #${r}: ${currentBudget}`);

    if (currentBudget !== initialDashboardBudget) {
      throw new Error(`FAIL: Budget changed after refresh #${r}! Expected ${initialDashboardBudget}, got ${currentBudget}`);
    }
  }
  console.log('PASS: 5X REFRESH TEST SUCCEEDED WITH 100% BUDGET STABILITY (€50.0M on every refresh)!');

  // Test lifecycle events: pagehide & visibilitychange
  console.log('\nTesting simulated pagehide and visibilitychange events...');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('beforeunload'));
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(1000);

  // Reload and verify budget didn't change
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const afterLifecycleBudget = await readBudget();
  console.log(`After simulated pagehide/visibilitychange: ${afterLifecycleBudget}`);
  if (afterLifecycleBudget !== initialDashboardBudget) {
    throw new Error(`FAIL: Budget changed after lifecycle events! Expected ${initialDashboardBudget}, got ${afterLifecycleBudget}`);
  }
  console.log('PASS: Lifecycle saves (pagehide, beforeunload, visibilitychange) DO NOT mutate budget.');

  // Test Route navigation: Dashboard -> Finances -> Dashboard
  console.log('\nTesting Route navigation stability...');
  await page.goto('http://localhost:3000/finances', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('Finances Page URL:', page.url());

  const financesEl = page.locator('span:text-is("TRANSFER BÜTÇESİ")').locator('xpath=../..').locator('.text-2xl');
  await financesEl.waitFor({ state: 'visible', timeout: 7000 });
  const financesBudget = (await financesEl.innerText()).trim();
  console.log(`Finances Page Budget: ${financesBudget}`);
  if (!financesBudget.includes('50.000.000')) {
    throw new Error(`Expected finances budget to contain 50.000.000, got: ${financesBudget}`);
  }

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const finalDashboardBudget = await readBudget();
  console.log(`Back on Dashboard: ${finalDashboardBudget}`);
  if (finalDashboardBudget !== initialDashboardBudget) {
    throw new Error(`FAIL: Budget changed after navigation!`);
  }
  console.log('PASS: Route changes maintain exact budget stability.');

  // Test in-browser recovery of an artificially inflated save in IndexedDB
  console.log('\nTesting in-browser recovery of corrupted IndexedDB save...');
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('SquadCraftDB', 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('careerSaves', 'readwrite');
        const store = tx.objectStore('careerSaves');
        const getReq = store.get('mainCareer');
        getReq.onsuccess = () => {
          const data = getReq.result;
          if (data) {
            // Artificially corrupt to €1,638,400.0M
            data.finances.transferBudget = 1638400000000;
            const club = data.clubs.find((c: any) => c.id === data.userClubId) || data.clubs[0];
            club.transferBudget = 1638400000000;
            store.put(data, 'mainCareer');
          }
        };
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  });

  console.log('Artificially injected €1,638,400.0M into IndexedDB.');
  console.log('Reloading page to trigger automatic repair on load...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const repairedDashboardBudget = await readBudget();
  console.log(`Dashboard Budget after automatic repair on load: ${repairedDashboardBudget}`);
  if (!repairedDashboardBudget.includes('€50.0M')) {
    throw new Error(`FAIL: Corrupted save was not repaired on load. Budget is: ${repairedDashboardBudget}`);
  }
  console.log('PASS: Real-browser corrupted save was automatically detected and repaired to €50.0M!');

  await browser.close();
  console.log('\n====================================================');
  console.log('ALL TESTS PASSED WITH 100% SUCCESS');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
