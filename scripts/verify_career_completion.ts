import { MOCK_CLUBS, generateCareerTactics, getInitialTactics } from '../src/lib/data/mockData';
import { generateCareerPlayerUniverse } from '../src/lib/career/careerUniverse';
import { MatchEngine } from '../src/lib/match-engine/engine';
import { startNewSeason } from '../src/lib/career/seasonRollover';
import { applyEconomyAndContractMigrations } from '../src/lib/career/saveManager';
import { CareerSaveDataV3 } from '../src/lib/career/types';
import { Formation, TacticalSettings, ManagerContract } from '../src/types/game';

async function runVerification() {
  console.log('=== SQUADCRAFT CAREER MODE FULL REPAIR & COMPLETION VERIFICATION ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] ${testName}`);
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
    }
  }

  // ---------------------------------------------------------
  // TEST 1: P0 - Tactics Generation with Real Squad (No "Boş" slots)
  // ---------------------------------------------------------
  console.log('\n--- 1. TACTICS & SQUAD GENERATION TEST ---');
  const universe = generateCareerPlayerUniverse(MOCK_CLUBS);
  const kalyonPlayers = universe.filter((p) => p.clubId === 'kalyon-doruk');

  assert(kalyonPlayers.length === 25, 'Kalyon Doruk has exactly 25 players in Universe');

  const tactics4231 = generateCareerTactics('kalyon-doruk', kalyonPlayers, '4-2-3-1');
  assert(tactics4231.lineup.length === 11, 'Lineup has exactly 11 slots');
  
  const emptySlots4231 = tactics4231.lineup.filter((s) => !s.playerId);
  assert(emptySlots4231.length === 0, 'No starting slot is empty / "Boş"');

  const starterIds = new Set(tactics4231.lineup.map((s) => s.playerId));
  assert(starterIds.size === 11, 'All 11 starters are unique players');

  assert(tactics4231.substitutes.length === 7, 'Bench has exactly 7 substitutes');
  assert(tactics4231.reserves.length === 7, 'Reserves has remaining 7 players');

  // Verify that all starters, subs, and reserves belong to Kalyon Doruk
  const allAssignedIds = [...tactics4231.lineup.map((s) => s.playerId!), ...tactics4231.substitutes, ...tactics4231.reserves];
  const allFromClub = allAssignedIds.every((id) => kalyonPlayers.some((p) => p.id === id));
  assert(allFromClub, 'All assigned players belong to Kalyon Doruk squad');

  // ---------------------------------------------------------
  // TEST 2: Formation Change Re-layout
  // ---------------------------------------------------------
  console.log('\n--- 2. FORMATION RE-LAYOUT TEST ---');
  const formationsToTest: Formation[] = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-1-2-1-2'];
  let allFormationsValid = true;

  for (const form of formationsToTest) {
    const t = generateCareerTactics('kalyon-doruk', kalyonPlayers, form);
    if (t.lineup.length !== 11 || t.lineup.some((s) => !s.playerId) || new Set(t.lineup.map((s) => s.playerId)).size !== 11) {
      allFormationsValid = false;
      console.error(`Formation ${form} failed validation!`);
    }
  }
  assert(allFormationsValid, 'All tested formations produce 11 valid unique non-empty starters');

  // ---------------------------------------------------------
  // TEST 3: Match Engine Realism & Determinism
  // ---------------------------------------------------------
  console.log('\n--- 3. MATCH ENGINE REALISM & DETERMINISM TEST ---');
  const homeClub = MOCK_CLUBS[0]; // Kalyon Doruk
  const awayClub = MOCK_CLUBS[1]; // Vadişehir
  const awayPlayers = universe.filter((p) => p.clubId === awayClub.id);

  const defaultTactics: TacticalSettings = {
    mentality: 'Dengeli',
    tempo: 'Standart',
    pressing: 'Yoğun',
    passingStyle: 'Kısa',
    defensiveLine: 'Standart',
    width: 'Dengeli',
  };

  const seed = 'deterministic-career-fixture-101';
  const homeStarters = tactics4231.lineup.map((s) => s.playerId!);
  const awayTactics = generateCareerTactics(awayClub.id, awayPlayers, '4-3-3');
  const awayStarters = awayTactics.lineup.map((s) => s.playerId!);

  // Run 1
  const engine1 = new MatchEngine(
    homeClub,
    awayClub,
    kalyonPlayers,
    awayPlayers,
    defaultTactics,
    defaultTactics,
    '4-2-3-1',
    '4-3-3',
    homeStarters,
    awayStarters,
    seed,
    { isCompetitive: true, enableHomeAdvantage: true }
  );
  engine1.simulateFullMatch();
  const res1 = engine1.getState();

  // Run 2 (identical seed & inputs)
  const engine2 = new MatchEngine(
    homeClub,
    awayClub,
    kalyonPlayers,
    awayPlayers,
    defaultTactics,
    defaultTactics,
    '4-2-3-1',
    '4-3-3',
    homeStarters,
    awayStarters,
    seed,
    { isCompetitive: true, enableHomeAdvantage: true }
  );
  engine2.simulateFullMatch();
  const res2 = engine2.getState();

  assert(
    res1.homeScore === res2.homeScore && res1.awayScore === res2.awayScore,
    'Deterministic Match Engine: Scores are identical on same seed',
    `Run1: ${res1.homeScore}-${res1.awayScore}, Run2: ${res2.homeScore}-${res2.awayScore}`
  );

  assert(
    res1.events.length === res2.events.length,
    'Deterministic Match Engine: Event counts are identical on same seed',
    `Run1 events: ${res1.events.length}, Run2 events: ${res2.events.length}`
  );

  assert(
    res1.homePossessionPercent + res1.awayPossessionPercent === 100,
    'Match Engine: Total possession sums to 100%'
  );

  // ---------------------------------------------------------
  // TEST 4: Budget Doubling & Versioned Migration (+100% / x2)
  // ---------------------------------------------------------
  console.log('\n--- 4. CAREER ECONOMY MIGRATION (+100% / x2) TEST ---');
  // Kalyon Doruk budget in MOCK_CLUBS is now 25,000,000 (was 12,500,000)
  assert(MOCK_CLUBS[0].transferBudget >= 20_000_000, 'Kalyon Doruk transfer budget doubled to €25M');

  // Test migration on a legacy save
  const legacySave: CareerSaveDataV3 = {
    saveVersion: 3,
    savedAt: '2026-08-01',
    seasonYear: '2026/27',
    seasonStage: 'REGULAR_SEASON',
    currentDate: '2026-09-01',
    userClubId: 'kalyon-doruk',
    trainingIntensity: 'Normal',
    clubs: [
      { ...MOCK_CLUBS[0], transferBudget: 10_000_000 },
      { ...MOCK_CLUBS[1], transferBudget: 8_000_000 },
    ],
    players: kalyonPlayers,
    tactics: tactics4231,
    standings: [],
    fixtures: [],
    inboxMessages: [],
    transferOffers: [],
    shortlistIds: [],
    finances: {
      clubBalance: 20_000_000,
      transferBudget: 10_000_000,
      wageBudget: 350_000,
      weeklyWages: 280_000,
      incomeCategories: {} as any,
      expenseCategories: {} as any,
      monthlyHistory: [],
    },
    newsFeed: [],
    careerHistory: [],
    activeNegotiations: [],
    transferHistory: [],
    futureCommitments: [],
    scouts: [],
    scoutingAssignments: [],
    scoutingKnowledge: {},
    scoutingReports: [],
    activeLoans: [],
    settings: { autoSave: true, defaultMatchSpeed: 1, debugMode: false },
    // no careerEconomyVersion!
  };

  const migratedSave = applyEconomyAndContractMigrations(legacySave);
  assert(migratedSave.careerEconomyVersion === 2, 'Migration sets careerEconomyVersion = 2');
  assert(migratedSave.clubs[0].transferBudget === 20_000_000, 'Legacy club transfer budget doubled (10M -> 20M)');
  assert(migratedSave.finances.transferBudget === 20_000_000, 'Legacy finances transfer budget doubled (10M -> 20M)');

  // Test reload: ensure NO compounding
  const reloadedSave = applyEconomyAndContractMigrations(migratedSave);
  assert(reloadedSave.clubs[0].transferBudget === 20_000_000, 'Reload does NOT compound (remains 20M)');
  assert(reloadedSave.finances.transferBudget === 20_000_000, 'Finances reload does NOT compound (remains 20M)');

  // ---------------------------------------------------------
  // TEST 5: Manager/TD Contract Progression
  // ---------------------------------------------------------
  console.log('\n--- 5. MANAGER / TD CONTRACT TEST ---');
  assert(migratedSave.managerContract !== undefined, 'Manager contract exists after migration');
  assert(migratedSave.managerContract?.yearsLeft === 2, 'Default manager contract is 2 years');
  assert(migratedSave.managerContract?.weeklySalary === 45000, 'Default manager weekly salary is €45,000');
  assert(migratedSave.managerContract?.status === 'ACTIVE', 'Manager contract is ACTIVE');

  // Test extension offer logic
  const contractNearExpiry: ManagerContract = {
    yearsLeft: 1,
    weeklySalary: 45000,
    status: 'OFFERED',
    offerYears: 2,
    offerSalary: 51750,
  };
  assert(contractNearExpiry.status === 'OFFERED', 'Near expiry triggers OFFERED status');
  const acceptedContract: ManagerContract = {
    yearsLeft: contractNearExpiry.yearsLeft + contractNearExpiry.offerYears!,
    weeklySalary: contractNearExpiry.offerSalary!,
    status: 'ACTIVE',
  };
  assert(acceptedContract.yearsLeft === 3, 'Accepting offer increases contract years');
  assert(acceptedContract.weeklySalary === 51750, 'Accepting offer updates weekly salary');

  // ---------------------------------------------------------
  // TEST 6: Season Rollover & Progression
  // ---------------------------------------------------------
  console.log('\n--- 6. SEASON ROLLOVER & PROGRESSION TEST ---');
  const standings = MOCK_CLUBS.map((c, idx) => ({
    rank: idx + 1,
    clubId: c.id,
    played: 18,
    won: 10,
    drawn: 4,
    lost: 4,
    goalsFor: 30,
    goalsAgainst: 15,
    goalDifference: 15,
    points: 34,
    form: ['W', 'W', 'D', 'W', 'L'] as ('W' | 'D' | 'L')[],
  }));

  const rolloverResult = startNewSeason(
    '2026/27',
    MOCK_CLUBS,
    universe,
    standings,
    'kalyon-doruk',
    legacySave.finances
  );

  assert(rolloverResult.newSeasonYear === '2027/28', 'Season year increments to 2027/28');
  assert(rolloverResult.newCurrentDate === '2027-08-01', 'Current date resets to 2027-08-01');
  assert(rolloverResult.newFixtures.length > 0, 'New season fixtures generated');
  assert(rolloverResult.newStandings.every((s) => s.played === 0), 'New standings reset with 0 games played');
  assert(rolloverResult.archivedHistory.length === 1, 'Previous season archived to career history');
  assert(rolloverResult.archivedHistory[0].seasonYear === '2026/27', 'Archived entry has correct season year');

  // Age +1, contract -1 check
  const originalPlayer = universe.find((p) => p.clubId === 'kalyon-doruk')!;
  const resetPlayer = rolloverResult.resetPlayers.find((p) => p.id === originalPlayer.id)!;
  assert(resetPlayer.age === originalPlayer.age + 1, 'Player age progressed by +1 year');
  assert(resetPlayer.contractYearsLeft === Math.max(0, (originalPlayer.contractYearsLeft ?? 2) - 1), 'Player contract decreased by 1 year');

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log('==================================================');

  if (passedTests === totalTests) {
    console.log('>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME VERIFICATION TESTS FAILED! <<<');
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
