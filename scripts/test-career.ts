/**
 * SQUADCRAFT v0.3.0-alpha — Comprehensive Career Flow & Season Engine Test Suite
 * 
 * Verifies all 16 core career requirements:
 * 1. Initial date and Turkish date formatting
 * 2. Double round-robin 18-round fixture schedule generation (90 matches)
 * 3. Smart advance stopping at matchday
 * 4. Single day progression
 * 5. Daily fitness recovery & training intensity modifiers
 * 6. Match sharpness progression
 * 7. Injury countdown & recovery notification
 * 8. Match suspension countdown & clearance
 * 9. Weekly wage deductions on Mondays
 * 10. Monthly sponsor & broadcast revenue processing
 * 11. Matchday attendance calculation & gate receipts
 * 12. Transfer window open/closed calendar checks
 * 13. AI transfer market bid processing
 * 14. Player birthday aging & youth development
 * 15. Contract expiry tracking & milestone warnings
 * 16. Season completion, standings archive, new season rollover & save persistence
 */

import {
  formatDateTurkish,
  formatShortDate,
  addDaysToDate,
  daysBetween,
  getTransferWindowStatus,
  getSeasonStage,
  generateSeasonFixtures,
  processDailyPlayerRecovery,
  processMonthlyPlayerDevelopment,
  processPlayerBirthday,
  processDailyPlayerInjury,
  processMatchSuspension,
  getContractExpiryStatus,
  getContractStatusLabel,
  checkContractWarnings,
  processDailyFinances,
  calculateFixtureAttendance,
  processDailyAITransfers,
  generateDailyNews,
  evaluateSeasonEnd,
  startNewSeason,
  processSingleDay,
  processMultipleDays,
  DailyProcessorState,
  saveCareerState,
  loadCareerState,
} from '../src/lib/career';

import {
  MOCK_CLUBS,
  MOCK_PLAYERS,
  MOCK_STANDINGS,
  MOCK_INBOX_MESSAGES,
  MOCK_TRANSFER_OFFERS,
  MOCK_SHORTLIST_IDS,
  MOCK_FINANCES,
  getInitialTactics,
} from '../src/lib/data/mockData';

import { Player, Fixture, LeagueStanding } from '../src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('===============================================================');
  console.log('⚽ SQUADCRAFT v0.3.0-alpha CAREER & SEASON ENGINE TEST RUNNER');
  console.log('===============================================================\n');

  let passedTests = 0;
  const totalTests = 16;
  const userClubId = MOCK_CLUBS[0].id; // Kalyon Doruk SK

  // -------------------------------------------------------------
  // TEST 1: Initial Date & Turkish Calendar Formatting
  // -------------------------------------------------------------
  console.log('TEST 1: Initial Date & Turkish Calendar Formatting');
  const initialDate = '2026-08-01';
  const formatted = formatDateTurkish(initialDate, true);
  assert(formatted.includes('1 Ağustos 2026'), 'Date formats day, month in Turkish');
  assert(formatted.includes('Cumartesi'), 'Date formats day of week correctly');
  assert(formatShortDate(initialDate) === '1 Ağu', 'Short date formats correctly');
  assert(addDaysToDate(initialDate, 7) === '2026-08-08', 'addDaysToDate adds 7 days');
  assert(daysBetween('2026-08-01', '2026-08-15') === 14, 'daysBetween calculates 14 days');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 2: Double Round-Robin Fixture Generation (18 Rounds, 90 Matches)
  // -------------------------------------------------------------
  console.log('TEST 2: Fixture Schedule Generation for 10 Clubs');
  const generatedFixtures = generateSeasonFixtures(MOCK_CLUBS, '2026/27', '2026-08-15');
  assert(generatedFixtures.length === 90, 'Total fixtures equals 90 matches (10 teams * 9 * 2 / 2)');
  const rounds = new Set(generatedFixtures.map((f) => f.round));
  assert(rounds.size === 18, 'Exactly 18 distinct rounds generated');
  
  // Verify each round has 5 matches
  for (let r = 1; r <= 18; r++) {
    const roundMatches = generatedFixtures.filter((f) => f.round === r);
    assert(roundMatches.length === 5, `Round ${r} has exactly 5 matches`);
  }
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 3: Smart Advance & Stop on Matchday
  // -------------------------------------------------------------
  console.log('TEST 3: Smart Advance & Matchday Halting');
  const userFirstMatch = generatedFixtures.find(
    (f) => f.homeClubId === userClubId || f.awayClubId === userClubId
  );
  assert(!!userFirstMatch, 'User first match found in fixtures');
  
  const initialState: DailyProcessorState = {
    currentDate: '2026-08-01',
    seasonYear: '2026/27',
    userClubId,
    trainingIntensity: 'Normal',
    clubs: MOCK_CLUBS,
    players: MOCK_PLAYERS,
    tactics: getInitialTactics(userClubId),
    standings: MOCK_STANDINGS,
    fixtures: generatedFixtures,
    inboxMessages: MOCK_INBOX_MESSAGES,
    transferOffers: MOCK_TRANSFER_OFFERS,
    shortlistIds: MOCK_SHORTLIST_IDS,
    finances: MOCK_FINANCES,
    newsFeed: [],
  };

  const advanceResult = processMultipleDays(initialState, 30);

  assert(advanceResult.result.stoppedReason === 'MATCH_DAY', 'Smart advance halts on MATCH_DAY');
  assert(advanceResult.result.currentDate === userFirstMatch!.date, `Advanced exactly to match date (${userFirstMatch!.date})`);
  assert(advanceResult.result.daysProcessed > 0, `Processed ${advanceResult.result.daysProcessed} days`);
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 4: Single Day Advance & Daily Processing
  // -------------------------------------------------------------
  console.log('TEST 4: Single Day Advance');
  const singleDayResult = processSingleDay(initialState);
  assert(singleDayResult.updatedState.currentDate === '2026-08-02', 'Single day advance moves from 2026-08-01 to 2026-08-02');
  assert(singleDayResult.updatedState.players.length === MOCK_PLAYERS.length, 'Player count preserved');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 5: Daily Fitness Recovery & Training Intensity
  // -------------------------------------------------------------
  console.log('TEST 5: Daily Fitness Recovery & Training Intensity');
  const tiredPlayer: Player = {
    ...MOCK_PLAYERS[0],
    fitness: 60,
    isInjured: false,
    attributes: { ...MOCK_PLAYERS[0].attributes, stamina: 85 },
  };

  // Test Normal Recovery
  const recoveredNormal = processDailyPlayerRecovery(tiredPlayer, 'Normal');
  assert(recoveredNormal.fitness > 60, `Fitness recovered on Normal (was 60, now ${recoveredNormal.fitness})`);

  // Test Hafif Recovery (higher fitness gain)
  const recoveredHafif = processDailyPlayerRecovery(tiredPlayer, 'Hafif');
  assert(recoveredHafif.fitness >= recoveredNormal.fitness, 'Hafif training yields equal or higher fitness recovery');

  // Test Max Clamp
  const fullFitnessPlayer: Player = { ...MOCK_PLAYERS[0], fitness: 99, isInjured: false };
  const maxFitness = processDailyPlayerRecovery(fullFitnessPlayer, 'Normal');
  assert(maxFitness.fitness <= 100, 'Fitness does not exceed 100');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 6: Match Sharpness Progression
  // -------------------------------------------------------------
  console.log('TEST 6: Match Sharpness Progression');
  const sharpPlayer: Player = { ...MOCK_PLAYERS[0], matchSharpness: 90 };
  const decayingSharpness = processDailyPlayerRecovery(sharpPlayer, 'Hafif');
  assert(
    decayingSharpness.matchSharpness! <= 90,
    `Sharpness decays gradually when not playing matches on Hafif (now ${decayingSharpness.matchSharpness})`
  );

  const intenseSharpness = processDailyPlayerRecovery(sharpPlayer, 'Yoğun');
  assert(
    intenseSharpness.matchSharpness! >= sharpPlayer.matchSharpness!,
    `Sharpness maintained or improved on Yoğun training (now ${intenseSharpness.matchSharpness})`
  );
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 7: Injury Countdown & Medical Clearance
  // -------------------------------------------------------------
  console.log('TEST 7: Injury Countdown & Medical Clearance');
  const injuredPlayer: Player = {
    ...MOCK_PLAYERS[0],
    id: 'test_inj_1',
    isInjured: true,
    clubId: userClubId,
    injuryDetails: {
      type: 'Hamstring Gerilmesi',
      daysRemaining: 1,
    },
  };

  const injuryResult = processDailyPlayerInjury(
    injuredPlayer,
    '2026-08-05',
    userClubId
  );
  assert(!injuryResult.updatedPlayer.isInjured, 'Player is healed when daysRemaining reaches 0');
  assert(injuryResult.updatedPlayer.injuryDetails === undefined, 'Injury details cleared');
  assert(!!injuryResult.recoveredMessage, 'Medical recovery inbox message generated');
  assert(injuryResult.recoveredMessage!.subject.includes('Sakatlık İyileşti'), 'Inbox message has proper subject');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 8: Suspension Processing After Match
  // -------------------------------------------------------------
  console.log('TEST 8: Match-based Suspension Clearance');
  const suspendedPlayer: Player = {
    ...MOCK_PLAYERS[0],
    id: 'test_susp_1',
    isSuspended: true,
    suspensionDetails: {
      matchesRemaining: 1,
      reason: 'Kırmızı Kart Cezası',
    },
  };

  const clearedAfterMatch = processMatchSuspension(suspendedPlayer, 1);
  assert(!clearedAfterMatch.isSuspended, 'Suspension cleared after 1 match served');
  assert(clearedAfterMatch.suspensionDetails === undefined, 'Suspension details cleared');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 9: Weekly Wage Deductions (Every Monday)
  // -------------------------------------------------------------
  console.log('TEST 9: Weekly Wage Deduction on Mondays');
  // 2026-08-03 is a Monday
  const mondayResult = processDailyFinances('2026-08-03', MOCK_FINANCES, MOCK_CLUBS[0]);
  assert(mondayResult.weeklyWagesDeducted, 'Wages deducted on Monday (2026-08-03)');
  assert(mondayResult.updatedFinances.clubBalance < MOCK_FINANCES.clubBalance, 'Club balance decreased by wages');

  // 2026-08-04 is a Tuesday
  const tuesdayResult = processDailyFinances('2026-08-04', mondayResult.updatedFinances, MOCK_CLUBS[0]);
  assert(!tuesdayResult.weeklyWagesDeducted, 'Wages not deducted on Tuesday');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 10: Monthly Sponsor & Broadcast Revenue (1st of the month)
  // -------------------------------------------------------------
  console.log('TEST 10: Monthly Sponsor & Broadcast Revenue');
  // 2026-09-01 is 1st of September
  const monthFirstResult = processDailyFinances('2026-09-01', MOCK_FINANCES, MOCK_CLUBS[0]);
  assert(monthFirstResult.monthlyCashflowProcessed, 'Sponsor & broadcast revenue credited on 1st of month');
  assert(monthFirstResult.updatedFinances.monthlyHistory.length > 0, 'Monthly financial history updated');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 11: Matchday Ticket & Gate Receipts Calculation
  // -------------------------------------------------------------
  console.log('TEST 11: Matchday Ticket & Gate Receipts');
  const homeClub = MOCK_CLUBS[0];
  const awayClub = MOCK_CLUBS[1];
  const attendance = calculateFixtureAttendance(homeClub, awayClub, 1);
  assert(attendance > 0, `Calculated attendance: ${attendance}`);
  assert(attendance <= homeClub.stadiumCapacity, 'Attendance does not exceed stadium capacity');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 12: Transfer Window Calendar Check
  // -------------------------------------------------------------
  console.log('TEST 12: Transfer Window Calendar Status');
  assert(getTransferWindowStatus('2026-08-10') === 'OPEN', 'Summer window open in August');
  assert(getTransferWindowStatus('2026-09-01') === 'OPEN', 'Summer window open on Sept 1 deadline');
  assert(getTransferWindowStatus('2026-09-02') === 'CLOSED', 'Transfer window closed on Sept 2');
  assert(getTransferWindowStatus('2026-10-15') === 'CLOSED', 'Transfer window closed in October');
  assert(getTransferWindowStatus('2027-01-15') === 'OPEN', 'Winter window open in January');
  assert(getTransferWindowStatus('2027-02-01') === 'CLOSED', 'Winter window closed in February');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 13: AI Transfer Market Activity
  // -------------------------------------------------------------
  console.log('TEST 13: AI Transfer Window Activity');
  const aiTransferRes = processDailyAITransfers(
    '2026-08-15',
    MOCK_CLUBS,
    MOCK_PLAYERS,
    userClubId,
    []
  );
  assert(Array.isArray(aiTransferRes.newOffers), 'AI transfer bids evaluated without errors');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 14: Birthday Aging & Youth Progression
  // -------------------------------------------------------------
  console.log('TEST 14: Birthday Aging & Potential Progression');
  const youngTalent: Player = {
    ...MOCK_PLAYERS[0],
    id: 'talent_1',
    age: 18,
    birthDate: '2008-08-05',
    overall: 68,
    potential: 88,
  };
  const bdayResult = processPlayerBirthday(youngTalent, '2026-08-05');
  assert(bdayResult.isBirthday, 'Birthday detected for matching date');
  assert(bdayResult.updatedPlayer.age === 18, 'Age computed accurately from birth year');

  const devResult = processMonthlyPlayerDevelopment(youngTalent, 'Yoğun');
  assert(devResult.overall >= youngTalent.overall, 'Youth development increases or maintains overall');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 15: Contract Status Tracking & Milestone Warnings
  // -------------------------------------------------------------
  console.log('TEST 15: Contract Expiry Tracking & Milestone Warnings');
  assert(getContractExpiryStatus('2026-08-01', '2028-06-30') === 'SAFE', 'Long contract is SAFE');
  assert(getContractExpiryStatus('2026-08-01', '2027-01-01') === '6_MONTHS', 'Contract ending in 5 months is 6_MONTHS');
  assert(getContractExpiryStatus('2026-08-01', '2026-09-01') === 'EXPIRING', 'Contract ending in 1 month is EXPIRING');
  assert(getContractStatusLabel('6_MONTHS') === '6 Ay Kaldı', 'Contract label localized in Turkish');

  const expiringPlayer: Player = {
    ...MOCK_PLAYERS[0],
    contractEnd: '2026-08-31',
    clubId: userClubId,
  };
  const contractWarning = checkContractWarnings(expiringPlayer, '2026-08-01', userClubId);
  assert(contractWarning !== undefined, 'Contract milestone warning generated');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  // -------------------------------------------------------------
  // TEST 16: Season Completion, Standings Archive & Save Persistence
  // -------------------------------------------------------------
  console.log('TEST 16: Season End Evaluation, Rollover & Save Persistence');
  // Create mock standings with 18 played matches
  const finishedStandings: LeagueStanding[] = MOCK_STANDINGS.map((s, idx) => ({
    ...s,
    played: 18,
    won: 18 - idx * 2,
    drawn: 0,
    lost: idx * 2,
    points: (18 - idx * 2) * 3,
    goalsFor: 40 - idx * 2,
    goalsAgainst: 10 + idx * 2,
    goalDifference: 30 - idx * 4,
    rank: idx + 1,
  }));

  const seasonSummary = evaluateSeasonEnd(
    '2026/27',
    finishedStandings,
    MOCK_CLUBS,
    MOCK_PLAYERS,
    userClubId
  );

  assert(seasonSummary.championClubName.length > 0, 'Champion determined correctly');
  assert(seasonSummary.relegatedClubs.length === 2, '2 clubs marked for relegation in 10-team league');

  // Test startNewSeason rollover
  const rollover = startNewSeason(
    '2026/27',
    MOCK_CLUBS,
    MOCK_PLAYERS,
    finishedStandings,
    userClubId
  );

  assert(rollover.newSeasonYear === '2027/28', 'Season year advanced from 2026/27 to 2027/28');
  assert(rollover.newCurrentDate === '2027-08-01', 'New season starts on 2027-08-01');
  assert(rollover.newStandings.every((s) => s.played === 0 && s.points === 0), 'Standings reset for new season');
  assert(rollover.newFixtures.length === 90, 'New 18-round fixture schedule generated');
  assert(rollover.archivedHistory.length === 1, 'Past season archived in career history');

  // Test Save State Persistence
  const mockStorage: Record<string, string> = {};
  (global as any).window = {};
  (global as any).localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
  };

  const savePayload = {
    saveVersion: 2 as const,
    savedAt: new Date().toISOString(),
    currentDate: '2026-09-15',
    seasonYear: '2026/27',
    seasonStage: 'REGULAR_SEASON' as const,
    userClubId,
    clubs: MOCK_CLUBS,
    players: MOCK_PLAYERS,
    tactics: getInitialTactics(userClubId),
    standings: finishedStandings,
    fixtures: generatedFixtures,
    inboxMessages: MOCK_INBOX_MESSAGES,
    transferOffers: MOCK_TRANSFER_OFFERS,
    shortlistIds: MOCK_SHORTLIST_IDS,
    finances: MOCK_FINANCES,
    trainingIntensity: 'Yoğun' as const,
    newsFeed: [],
    careerHistory: rollover.archivedHistory,
    activeNegotiations: [],
    transferHistory: [],
    futureCommitments: [],
    settings: {
      autoSave: true,
      defaultMatchSpeed: 1,
      debugMode: false,
    },
  };

  const saveOk = saveCareerState(savePayload);
  assert(saveOk, 'Career save state saved successfully to localStorage');

  const loadedState = loadCareerState();
  assert(loadedState !== null, 'Loaded save state is not null');
  assert(Number(loadedState?.saveVersion) === 2 || Number(loadedState?.saveVersion) === 3, 'Save version matches 2 or 3');
  assert(loadedState?.currentDate === '2026-09-15', 'Saved date restored correctly');
  assert(loadedState?.trainingIntensity === 'Yoğun', 'Saved training intensity restored');
  assert(loadedState?.careerHistory.length === 1, 'Career history restored accurately');
  passedTests++;
  console.log('---------------------------------------------------------------\n');

  console.log('===============================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} CAREER ENGINE TESTS PASSED SUCCESSFULLY!`);
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
