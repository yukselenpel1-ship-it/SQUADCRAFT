import { chromium } from 'playwright';
import { MOCK_CLUBS, MOCK_PLAYERS } from '../src/lib/data/mockData';
import { SAVE_KEY_V2, SAVE_KEY_V3 } from '../src/lib/career/saveManager';
import { generateSeasonFixtures } from '../src/lib/career/fixtureGenerator';

async function testRadarV2Browser() {
  console.log('========================================================================');
  console.log('🌐 TESTING TACTICAL RADAR V2 IN REAL BROWSER (CAREER + DRAFT + MOBILE)');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });

  // 1. DESKTOP CAREER MATCH TEST
  console.log('--- 1. CAREER MATCH RADAR TEST (DESKTOP) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await desktopContext.newPage();

  // Navigate to root & seed career
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  const userClubId = 'solvanya-gucu';
  const fixtures = generateSeasonFixtures(MOCK_CLUBS, '2026/27', '2026-08-15');

  await page.evaluate(
    ({ saveKeyV3, saveKeyV2, clubs, players, fixtures, userClubId }) => {
      const initialSave: any = {
        saveVersion: 3,
        managerName: 'Radar Test Manager',
        managerNationality: 'Solaria',
        managerAge: 38,
        tacticalStyle: 'Gegenpress',
        difficulty: 'Normal',
        leagueSize: 18,
        startingDate: '2026-08-01',
        currentDate: '2026-08-01',
        seasonYear: '2026/27',
        seasonStage: 'Pre-Season',
        userClubId,
        trainingIntensity: 'Normal',
        clubs,
        players,
        fixtures,
        standings: clubs.map((c: any, i: number) => ({
          clubId: c.id,
          clubName: c.name,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: [],
          rank: i + 1,
        })),
        tactics: {
          formation: '4-3-3',
          mentality: 'Dengeli',
          tempo: 'Standart',
          pressing: 'Orta',
          passingStyle: 'Karışık',
          defensiveLine: 'Standart',
          width: 'Dengeli',
          lineup: players.filter((p: any) => p.clubId === userClubId).slice(0, 11).map((p: any, idx: number) => ({
            slotIndex: idx,
            role: p.position,
            playerId: p.id,
          })),
          substitutes: players.filter((p: any) => p.clubId === userClubId).slice(11, 18).map((p: any) => p.id),
          reserves: players.filter((p: any) => p.clubId === userClubId).slice(18).map((p: any) => p.id),
          settings: {
            mentality: 'Dengeli',
            tempo: 'Standart',
            pressing: 'Orta',
            passingStyle: 'Karışık',
            defensiveLine: 'Standart',
            width: 'Dengeli',
          },
        },
        inboxMessages: [],
        transferOffers: [],
        shortlistIds: [],
        finances: { clubBalance: 25000000, transferBudget: 15000000, wageBudget: 400000, weeklyWages: 210000, incomeCategories: {}, expenseCategories: {}, monthlyHistory: [] },
        newsFeed: [],
        careerHistory: [],
        activeNegotiations: [],
        transferHistory: [],
        futureCommitments: [],
        scouts: [],
        scoutingAssignments: [],
        scoutingKnowledge: {},
        scoutingReports: [],
        playerHiddenProfiles: {},
        activeLoans: [],
        academyFacilities: undefined,
        youthPlayers: [],
        careerEconomyVersion: 2,
        managerContract: { yearsLeft: 2, weeklySalary: 45000, status: 'ACTIVE', clubName: 'Solvanya Gücü', boardConfidence: 80, fanSupport: 80 },
      };
      localStorage.setItem(saveKeyV3, JSON.stringify(initialSave));
      localStorage.setItem(saveKeyV2, JSON.stringify(initialSave));
    },
    { saveKeyV3: SAVE_KEY_V3, saveKeyV2: SAVE_KEY_V2, clubs: MOCK_CLUBS, players: MOCK_PLAYERS, fixtures, userClubId }
  );

  const userMatch = fixtures.find((f) => f.homeClubId === userClubId || f.awayClubId === userClubId);
  const matchUrl = `http://localhost:3000/match/${userMatch?.id}`;
  await page.goto(matchUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const careerRadarCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const hasBall = text.includes('⚽');
    const hasGK = text.includes('GK');
    const hasTimeline = text.includes("90'+") || text.includes("0'");
    const hasSpeedControls = text.includes('1x') && text.includes('4x');
    const hasLiveMatchButton = text.includes('Maçı Başlat') || text.includes('Hızlı Sonuç');
    return { hasBall, hasGK, hasTimeline, hasSpeedControls, hasLiveMatchButton };
  });

  console.log('Career Radar Desktop Check:', careerRadarCheck);

  // Test speed controls 1x -> 2x -> 4x and start live match
  const speed4Btn = page.locator('button:has-text("4x")').first();
  if (await speed4Btn.isVisible()) {
    await speed4Btn.click();
    console.log('[PASS] Clicked 4x speed selector');
  }

  const startBtn = page.locator('button:has-text("Maçı Başlat"), button:has-text("Devam Et")').first();
  if (await startBtn.isVisible()) {
    await startBtn.click();
    console.log('[PASS] Clicked Maçı Başlat - Live Match Running');
    await page.waitForTimeout(3000); // 3 seconds at 4x speed
  }

  const liveTicksCheck = await page.evaluate(() => {
    const text = document.body.innerText;
    const isPlayingOrPaused = text.includes('Durdur (Pause)') || text.includes('Devam Et') || text.includes('HÜCUM EDİYOR') || text.includes('ORTA ALAN');
    return isPlayingOrPaused;
  });
  console.log('Career Live Ticks Active:', liveTicksCheck);

  await desktopContext.close();

  // 2. MOBILE RESPONSIVE TEST
  console.log('\n--- 2. MOBILE RESPONSIVE RADAR TEST (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(matchUrl, { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(2000);

  const mobileCheck = await mobilePage.evaluate(() => {
    return {
      hasBall: document.body.innerText.includes('⚽'),
      hasRadar: document.body.innerText.includes('2D Taktik Radarı') || document.querySelector('svg line') !== null,
    };
  });
  console.log('Mobile Check:', mobileCheck);

  await mobileContext.close();
  await browser.close();

  console.log('\n========================================================================');
  console.log('>>> BROWSER VISUAL VERIFICATION COMPLETE! <<<');
  console.log('========================================================================\n');
}

testRadarV2Browser();
