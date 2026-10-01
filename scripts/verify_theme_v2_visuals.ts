import { chromium } from 'playwright';
import path from 'path';
import { MOCK_CLUBS, MOCK_PLAYERS } from '../src/lib/data/mockData';

const ARTIFACT_DIR = 'C:\\Users\\oguzh\\.gemini\\antigravity\\brain\\ec81c01c-7802-440e-952b-e81285fd2bf5';

async function verifyThemeV2() {
  console.log('--- STARTING THEME V2 VISUAL & FUNCTIONAL AUDIT ---');
  const browser = await chromium.launch({ headless: true });

  const initialSave = {
    saveVersion: 3,
    savedAt: new Date().toISOString(),
    seasonYear: '2026/27',
    seasonStage: 'REGULAR_SEASON',
    currentDate: '2026-08-15',
    userClubId: 'solvanya-gucu',
    trainingIntensity: 'Normal',
    careerEconomyVersion: 2,
    seasonNumber: 1,
    clubs: MOCK_CLUBS,
    players: MOCK_PLAYERS,
    tactics: {
      clubId: 'solvanya-gucu',
      formation: '4-3-3',
      settings: {
        mentality: 'Dengeli',
        tempo: 'Standart',
        pressing: 'Orta',
        passingStyle: 'Kısa',
        defensiveLine: 'Standart',
        width: 'Dengeli',
      },
      lineup: [],
      substitutes: [],
      reserves: [],
    },
    standings: MOCK_CLUBS.map((c, i) => ({
      rank: i + 1,
      clubId: c.id,
      played: 5,
      won: 4 - (i % 3),
      drawn: i % 2,
      lost: Math.floor(i / 3),
      goalsFor: 12 - i,
      goalsAgainst: 4 + i,
      goalDifference: 8 - 2 * i,
      points: 12 - i * 2,
      form: ['W', 'W', 'D', 'W', 'L'],
    })),
    fixtures: [
      {
        id: 'fix-1',
        round: 6,
        date: '2026-08-22',
        homeClubId: 'solvanya-gucu',
        awayClubId: 'vadisehir',
        status: 'SCHEDULED',
      },
    ],
    inboxMessages: [
      {
        id: 'msg-1',
        clubId: 'solvanya-gucu',
        senderName: 'Ahmet Yılmaz',
        senderRole: 'Yönetim Kurulu Başkanı',
        subject: 'Yeni Sezon Hedefleri ve Bütçe Bildirimi',
        preview: 'Yeni sezon hazırlıklarımız tamamlandı...',
        body: 'Yeni sezon hazırlıklarımız tamamlandı. Yönetim kurulu olarak bu sezon şampiyonluk yarışında olmanızı bekliyoruz.',
        date: '15 Ağu 2026',
        category: 'BOARD',
        isRead: false,
        priority: 'HIGH',
      },
    ],
    transferOffers: [],
    shortlistIds: [MOCK_PLAYERS[0]?.id || 'p1'],
    finances: {
      clubBalance: 45000000,
      transferBudget: 35000000,
      wageBudget: 450000,
      weeklyWages: 320000,
      weeklyWageBill: 320000,
      incomeCategories: { matchdayTickets: 1200000, sponsorships: 3500000, broadcasting: 5000000, merchandising: 800000, playerSales: 0 },
      expenseCategories: { playerWages: 320000, staffWages: 50000, scoutingNetwork: 40000, stadiumMaintenance: 60000, academyYouth: 30000, playerSignings: 0 },
      monthlyHistory: [
        { month: 'Haz', income: 4200000, expense: 2100000, net: 2100000 },
        { month: 'Tem', income: 4500000, expense: 2200000, net: 2300000 },
        { month: 'Ağu', income: 5200000, expense: 2300000, net: 2900000 },
      ],
    },
    newsFeed: [
      {
        id: 'news-1',
        date: '2026-08-15',
        headline: 'Solvanya Gücü Sezon Açılışını Taraftarıyla Yaptı',
        content: 'Solvanya Arena tıklım tıklım doldu. Yeni transferler taraftara tanıtıldı.',
        category: 'CLUB_NEWS',
        importance: 'HIGH',
      },
    ],
    careerHistory: [],
    activeNegotiations: [],
    transferHistory: [],
    futureCommitments: [],
    scouts: [
      {
        id: 'scout-1',
        firstName: 'Emre',
        lastName: 'Kaya',
        age: 44,
        nationality: 'Solaria',
        clubId: 'solvanya-gucu',
        judgingAbility: 85,
        judgingPotential: 88,
        tacticalKnowledge: 80,
        adaptability: 75,
        regionKnowledge: { ALVERIA: 90, NORDIA: 70 },
        wage: 4500,
        reputation: 82,
      },
    ],
    academyState: {
      facilitiesLevel: 3,
      youthScoutingBudget: 500000,
      youthIntakeDate: '2027-03-01',
      prospects: [],
    },
    settings: {
      autoSave: true,
      defaultMatchSpeed: 2,
      debugMode: false,
    },
  };

  // Helper to inject career into IndexedDB
  async function injectCareerState(p: any) {
    await p.evaluate(async (saveData: any) => {
      // 1. IndexedDB
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('SquadCraftDB', 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('careerSaves')) {
            db.createObjectStore('careerSaves');
          }
        };
        req.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('careerSaves', 'readwrite');
          const store = tx.objectStore('careerSaves');
          store.put(saveData, 'mainCareer');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });

      // 2. Fast Meta
      localStorage.setItem('SquadCraftCareerMeta', JSON.stringify({
        saveVersion: 3,
        exists: true,
        userClubId: saveData.userClubId,
        clubName: 'Solvanya Gücü',
        seasonYear: '2026/27',
        currentDate: '2026-08-15',
        updatedAt: new Date().toISOString(),
        playerCount: saveData.players.length,
      }));
    }, initialSave);
  }

  // 1. DESKTOP RUN (1920x1080)
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  console.log('Navigating to origin to inject IndexedDB career state...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await injectCareerState(page);

  // Reload homepage to see resume state
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_home.png'), fullPage: false });
  console.log('Homepage (Desktop) captured.');

  // Navigate to Dashboard
  console.log('Visiting Dashboard (Desktop)...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Measure Budget before refresh
  const budgetTextBefore = await page.$eval('text=Kulüp Bütçesi', (el) => {
    const parent = el.closest('div');
    return parent ? parent.innerText.replace(/\s+/g, ' ') : '';
  }).catch(() => 'NOT_FOUND');
  console.log('Budget block before refresh:', budgetTextBefore);

  // Reload page to verify budget persistence and no multiplication
  console.log('Reloading Dashboard to verify budget stability...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const budgetTextAfter = await page.$eval('text=Kulüp Bütçesi', (el) => {
    const parent = el.closest('div');
    return parent ? parent.innerText.replace(/\s+/g, ' ') : '';
  }).catch(() => 'NOT_FOUND');
  console.log('Budget block after refresh:', budgetTextAfter);

  if (budgetTextBefore !== 'NOT_FOUND' && budgetTextBefore === budgetTextAfter) {
    console.log('✅ BUDGET PERSISTENCE CONFIRMED: Exact match before and after refresh!');
  } else {
    console.warn('⚠️ Budget comparison check:', { before: budgetTextBefore, after: budgetTextAfter });
  }

  // Check horizontal overflow on desktop
  const desktopOverflow = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });
  console.log('Desktop body horizontal overflow:', desktopOverflow);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_dashboard.png'), fullPage: false });
  console.log('Dashboard (Desktop) captured.');

  // Check Squad page
  console.log('Visiting Squad...');
  await page.goto('http://localhost:3000/squad', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_squad.png'), fullPage: false });
  console.log('Squad (Desktop) captured.');

  // Check Tactics page
  console.log('Visiting Tactics...');
  await page.goto('http://localhost:3000/tactics', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_tactics.png'), fullPage: false });
  console.log('Tactics (Desktop) captured.');

  // Check Transfers page
  console.log('Visiting Transfers...');
  await page.goto('http://localhost:3000/transfers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_transfers.png'), fullPage: false });
  console.log('Transfers (Desktop) captured.');

  // Check Scouting page
  console.log('Visiting Scouting...');
  await page.goto('http://localhost:3000/scouting', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_scouting.png'), fullPage: false });
  console.log('Scouting (Desktop) captured.');

  // Check League page
  console.log('Visiting League...');
  await page.goto('http://localhost:3000/league', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_league.png'), fullPage: false });
  console.log('League (Desktop) captured.');

  // Check Finances page
  console.log('Visiting Finances...');
  await page.goto('http://localhost:3000/finances', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_finances.png'), fullPage: false });
  console.log('Finances (Desktop) captured.');

  // Check Draft Lobby
  console.log('Visiting Draft Lobby...');
  await page.goto('http://localhost:3000/draft', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_desktop_draft.png'), fullPage: false });
  console.log('Draft Lobby (Desktop) captured.');

  await desktopContext.close();

  // 2. MOBILE RUN (iPhone 14 / 390x844)
  console.log('Starting Mobile Audit (390x844)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  });
  const mobilePage = await mobileContext.newPage();

  console.log('Navigating mobile page to inject career state...');
  await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await injectCareerState(mobilePage);

  // Mobile Dashboard
  console.log('Mobile Dashboard...');
  await mobilePage.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);

  const mobileOverflow = await mobilePage.evaluate(() => {
    return {
      scrollWidth: document.body.scrollWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.body.scrollWidth > window.innerWidth,
    };
  });
  console.log('Mobile Dashboard overflow metrics:', mobileOverflow);

  // Check if desktop shortcut footer tags are hidden on mobile
  const shortcutTagsHidden = await mobilePage.evaluate(() => {
    const kbd = document.querySelector('kbd');
    if (!kbd) return true;
    const parentContainer = kbd.closest('.md\\:flex');
    if (parentContainer) {
      const style = window.getComputedStyle(parentContainer);
      return style.display === 'none';
    }
    return false;
  });
  console.log('Desktop shortcut footer hidden on mobile:', shortcutTagsHidden);

  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_mobile_dashboard.png'), fullPage: false });
  console.log('Dashboard (Mobile) captured.');

  // Mobile Squad
  console.log('Mobile Squad...');
  await mobilePage.goto('http://localhost:3000/squad', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  const mobileSquadOverflow = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log('Mobile Squad overflow:', mobileSquadOverflow);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_mobile_squad.png'), fullPage: false });
  console.log('Squad (Mobile) captured.');

  // Mobile Finances
  console.log('Mobile Finances...');
  await mobilePage.goto('http://localhost:3000/finances', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  const mobileFinancesOverflow = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log('Mobile Finances overflow:', mobileFinancesOverflow);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_mobile_finances.png'), fullPage: false });
  console.log('Finances (Mobile) captured.');

  // Mobile Draft
  console.log('Mobile Draft...');
  await mobilePage.goto('http://localhost:3000/draft', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1000);
  const mobileDraftOverflow = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log('Mobile Draft overflow:', mobileDraftOverflow);
  await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'snap_v2_mobile_draft.png'), fullPage: false });
  console.log('Draft Lobby (Mobile) captured.');

  await mobileContext.close();
  await browser.close();

  console.log('--- ALL THEME V2 SCREENSHOTS & AUDIT LOGS COMPLETED ---');
}

verifyThemeV2().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
