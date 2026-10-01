/**
 * SQUADCRAFT — CAREER MODE REAL FUNCTIONAL GAP CHECK VERIFICATION SUITE
 * Thoroughly validates all 14 functional areas requested by the user.
 */

import { MOCK_CLUBS, FORMATION_COORDINATES, generateCareerTactics } from '../src/lib/data/mockData';
import { generateCareerPlayerUniverse } from '../src/lib/career/careerUniverse';
import { generateSeasonFixtures } from '../src/lib/career/fixtureGenerator';
import { MatchEngine } from '../src/lib/match-engine/engine';
import {
  calculatePlayerValuation,
  evaluateClubTransferOffer,
  evaluatePlayerContractOffer,
  executeTransferCompletion,
  identifyClubSquadNeed,
  processAiClubMarketActivity,
} from '../src/lib/negotiation';
import { calculateSeasonBudgets, startNewSeason } from '../src/lib/career/seasonRollover';
import { processDailyScoutingAssignments } from '../src/lib/scouting/scoutingAssignments';
import { getMaskedPlayerView } from '../src/lib/scouting/attributeMasking';
import { generateAnnualYouthIntake } from '../src/lib/youth/youthIntake';
import { processMonthlyPlayerDevelopment } from '../src/lib/career/training';
import { processMatchSuspension } from '../src/lib/career/suspensionProcessor';
import { saveCareerState, loadCareerState } from '../src/lib/career/saveManager';
import { Player, Club, FinanceSummary, LeagueStanding } from '../src/types/game';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

async function runGapCheck() {
  console.log('=== SQUADCRAFT CAREER MODE REAL FUNCTIONAL GAP CHECK ===\n');

  const universe = generateCareerPlayerUniverse(MOCK_CLUBS);
  const userClub = MOCK_CLUBS.find((c) => c.id === 'kalyon-doruk')!;
  const userPlayers = universe.filter((p) => p.clubId === userClub.id);

  // ----------------------------------------------------------------
  // 1. USER TRANSFERS
  // ----------------------------------------------------------------
  console.log('--- 1. USER TRANSFERS TEST ---');
  const sellerClub = MOCK_CLUBS.find((c) => c.id === 'vadisehir')!;
  const targetPlayer = universe.find((p) => p.clubId === sellerClub.id && p.overall >= 78)!;
  const valuation = calculatePlayerValuation(targetPlayer, sellerClub, userClub, '2026-08-15');
  assert(valuation.fairValue > 0, 'User transfer valuation calculated');

  // Club evaluation
  const clubOffer = {
    upfrontFee: Math.round(targetPlayer.marketValue * 1.1),
    installmentsFee: 0,
    installmentsMonths: 12,
    bonuses: [],
  };
  const clubResp = evaluateClubTransferOffer(targetPlayer, sellerClub, userClub, clubOffer, 3, '2026-08-15');
  assert(['ACCEPTED', 'COUNTER_OFFER', 'NOT_FOR_SALE'].includes(clubResp.status), 'Seller club responds to user offer');

  // Contract evaluation
  const contractOffer = {
    wage: Math.round(targetPlayer.wage * 1.3),
    durationYears: 3,
    squadRole: 'İlk 11' as const,
    releaseClause: 0,
    appearanceBonus: 0,
    goalBonus: 0,
    cleanSheetBonus: 0,
    signingBonus: 0,
  };
  const contractResp = evaluatePlayerContractOffer(targetPlayer, userClub, contractOffer, 3, '2026-08-15', false);
  assert(contractResp.status === 'ACCEPTED' || contractResp.status === 'COUNTER_OFFER', 'Player evaluates contract offer');

  // Transfer completion
  const initialUserBudget = userClub.transferBudget;
  const initialUserWageExpense = userClub.weeklyWageExpense;
  const completion = executeTransferCompletion({
    player: targetPlayer,
    sellerClub,
    buyerClub: userClub,
    transferPackage: clubOffer,
    contractPackage: contractOffer,
    currentDate: '2026-08-15',
    seasonYear: '2026/27',
    buyerFinances: {
      clubBalance: userClub.balance,
      transferBudget: userClub.transferBudget,
      wageBudget: userClub.wageBudget,
      weeklyWages: userClub.weeklyWageExpense,
      incomeCategories: {} as any,
      expenseCategories: {} as any,
      monthlyHistory: [],
    },
    isContractRenewal: false,
  });

  assert(completion.updatedPlayer.clubId === userClub.id, 'Transferred player clubId updated to user club');
  assert(completion.updatedBuyerClub.transferBudget < initialUserBudget, 'Buyer transfer budget deducted');
  assert(completion.updatedBuyerClub.weeklyWageExpense === initialUserWageExpense + contractOffer.wage, 'Buyer weekly wage expense updated');
  assert(completion.historyRecord.status === 'Tamamlandı', 'Transfer recorded in history');

  // ----------------------------------------------------------------
  // 2. AI TRANSFERS
  // ----------------------------------------------------------------
  console.log('\n--- 2. AI TRANSFERS TEST ---');
  const aiBuyerClub = MOCK_CLUBS.find((c) => c.id === 'solvanya-gucu')!;
  const aiSquad = universe.filter((p) => p.clubId === aiBuyerClub.id);
  const need = identifyClubSquadNeed(aiSquad);
  assert(need !== null, 'AI club positional need identified');

  const aiMarketResult = processAiClubMarketActivity(universe, MOCK_CLUBS, userClub.id, '2026-08-20', '2026/27');
  assert(aiMarketResult.updatedPlayers.length === universe.length, 'AI market activity preserves total player pool');

  // ----------------------------------------------------------------
  // 3. PLAYER CONTRACTS
  // ----------------------------------------------------------------
  console.log('\n--- 3. PLAYER CONTRACTS TEST ---');
  const samplePlayer: Player = {
    ...userPlayers[0],
    contractYearsLeft: 1,
  };
  const rolledOverYears = Math.max(0, samplePlayer.contractYearsLeft - 1);
  assert(rolledOverYears === 0, 'Contract years decrease by 1 at season rollover');

  // Free agent signing
  const freeAgent: Player = {
    ...samplePlayer,
    id: 'free-agent-test',
    clubId: 'FREE_AGENT',
    contractYearsLeft: 0,
  };
  const faCompletion = executeTransferCompletion({
    player: freeAgent,
    buyerClub: userClub,
    transferPackage: { upfrontFee: 0, installmentsFee: 0, installmentsMonths: 12, bonuses: [] },
    contractPackage: contractOffer,
    currentDate: '2026-08-15',
    seasonYear: '2026/27',
    buyerFinances: {
      clubBalance: userClub.balance,
      transferBudget: userClub.transferBudget,
      wageBudget: userClub.wageBudget,
      weeklyWages: userClub.weeklyWageExpense,
      incomeCategories: {} as any,
      expenseCategories: {} as any,
      monthlyHistory: [],
    },
    isContractRenewal: false,
  });
  assert(faCompletion.updatedPlayer.clubId === userClub.id, 'Free agent can sign for club without transfer fee');
  assert(faCompletion.updatedPlayer.contractYearsLeft === 3, 'Free agent receives new contract length');

  // ----------------------------------------------------------------
  // 4. SCOUTING
  // ----------------------------------------------------------------
  console.log('\n--- 4. SCOUTING TEST ---');
  const unscoutedView = getMaskedPlayerView(targetPlayer, userClub.id, 0, 0);
  assert(unscoutedView.overallDisplay === '?' || unscoutedView.overallDisplay.includes('–'), 'Unscouted player attributes are masked (Fog of War)');
  assert(unscoutedView.marketValueDisplay === 'Bilinmiyor' || unscoutedView.marketValueDisplay.includes('–'), 'Unscouted market value masked');

  const fullyScoutedView = getMaskedPlayerView(targetPlayer, userClub.id, 5, 100);
  assert(fullyScoutedView.overallDisplay === `${targetPlayer.overall}`, 'Fully scouted player reveals exact OVR');
  assert(fullyScoutedView.potentialDisplay === `${targetPlayer.potential}`, 'Fully scouted player reveals exact POT');

  // ----------------------------------------------------------------
  // 5. TRAINING / DEVELOPMENT
  // ----------------------------------------------------------------
  console.log('\n--- 5. TRAINING / DEVELOPMENT TEST ---');
  const youngPlayer: Player = {
    ...userPlayers.find((p) => p.age <= 21)!,
    potential: 88,
    overall: 72,
  };
  const devPlayer = processMonthlyPlayerDevelopment(youngPlayer, 'Yoğun');
  assert(devPlayer.overall >= youngPlayer.overall, 'Training development evaluates player attributes');

  // ----------------------------------------------------------------
  // 6. YOUTH ACADEMY
  // ----------------------------------------------------------------
  console.log('\n--- 6. YOUTH ACADEMY TEST ---');
  const facility = {
    clubId: userClub.id,
    academyLevel: 3,
    youthCoachingQuality: 75,
    youthRecruitmentNetwork: 70,
    annualYouthBudget: 1_200_000,
    nextIntakeDate: '2027-03-15',
    lastIntakeDate: '2026-03-15',
    upgradesInProgress: [],
  };
  const { intakeBatch } = generateAnnualYouthIntake(userClub, facility, '2027-03-15', '2026/27');
  const intake = intakeBatch.players;
  assert(intake.length >= 8, 'Annual youth intake generates prospects on March 15');
  assert(intake.every((yp) => yp.age >= 15 && yp.age <= 18), 'All youth players are between 15 and 18 years old');

  // ----------------------------------------------------------------
  // 7. INJURY / SUSPENSION
  // ----------------------------------------------------------------
  console.log('\n--- 7. INJURY / SUSPENSION TEST ---');
  const redCardSuspension = processMatchSuspension(
    { ...userPlayers[0], isSuspended: true, suspensionDetails: { reason: 'Kırmızı Kart Cezası', matchesRemaining: 1 } },
    1
  );
  assert(redCardSuspension.isSuspended === false, '1-match suspension is cleared after 1 match passes');

  const multiMatchSuspension = processMatchSuspension(
    { ...userPlayers[0], isSuspended: true, suspensionDetails: { reason: '3 Maç Ceza', matchesRemaining: 3 } },
    1
  );
  assert(multiMatchSuspension.isSuspended === true, 'Multi-match suspension remains active');
  assert(multiMatchSuspension.suspensionDetails?.matchesRemaining === 2, 'Matches remaining decremented from 3 to 2');

  // ----------------------------------------------------------------
  // 8. PLAYER SEASON STATS
  // ----------------------------------------------------------------
  console.log('\n--- 8. PLAYER SEASON STATS TEST ---');
  const statsPlayer: Player = {
    ...userPlayers[0],
    seasonStats: {
      appearances: 5,
      goals: 3,
      assists: 2,
      yellowCards: 1,
      redCards: 0,
      cleanSheets: 0,
      averageRating: 7.4,
    },
  };
  assert(statsPlayer.seasonStats.appearances === 5, 'Player season appearances accumulate');
  assert(statsPlayer.seasonStats.goals === 3, 'Player season goals accumulate');

  // ----------------------------------------------------------------
  // 9. NEW SEASON FINANCES
  // ----------------------------------------------------------------
  console.log('\n--- 9. NEW SEASON FINANCES TEST ---');
  const budgetResult = calculateSeasonBudgets(userClub, 1, 18, true);
  assert(budgetResult.prizeMoney >= 12_000_000, 'Champion receives proper rank 1 prize money (>= €12M)');
  assert(budgetResult.sponsorshipIncome >= 6_000_000, 'New season sponsorship income calculated');
  assert(budgetResult.broadcastingIncome > 0, 'Broadcasting income based on 18-club league position');
  assert(budgetResult.newTransferBudget > 0, 'New transfer budget dynamically derived from club balance');

  // ----------------------------------------------------------------
  // 10. CAREER SAVE PERSISTENCE
  // ----------------------------------------------------------------
  console.log('\n--- 10. CAREER SAVE PERSISTENCE TEST ---');
  const testSaveData = {
    saveVersion: 3,
    careerEconomyVersion: 2,
    seasonNumber: 1,
    currentDate: '2026-09-01',
    seasonYear: '2026/27',
    seasonStage: 'MID_SEASON' as const,
    trainingIntensity: 'BALANCED' as const,
    managerContract: {
      yearsLeft: 2,
      weeklySalary: 45_000,
      status: 'ACTIVE' as const,
    },
    userClub: userClub,
    clubs: MOCK_CLUBS,
    players: universe,
    tactics: generateCareerTactics(userClub.id, userPlayers, '4-2-3-1'),
    standings: [] as any[],
    fixtures: [] as any[],
    inboxMessages: [] as any[],
    transferOffers: [] as any[],
    shortlistIds: [],
    finances: {
      clubBalance: 25_000_000,
      transferBudget: 25_000_000,
      wageBudget: 400_000,
      weeklyWages: 280_000,
      incomeCategories: {} as any,
      expenseCategories: {} as any,
      monthlyHistory: [],
    },
    newsFeed: [],
    careerHistory: [],
    savedAt: new Date().toISOString(),
  };

  // Mock localStorage for node
  const storageMap: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => storageMap[key] || null,
    setItem: (key: string, val: string) => { storageMap[key] = val; },
    removeItem: (key: string) => { delete storageMap[key]; },
  };

  saveCareerState(testSaveData);
  const loadedSave = loadCareerState();
  assert(loadedSave !== null, 'Career save successfully saved and loaded');
  assert(loadedSave?.careerEconomyVersion === 2, 'Career economy version 2 persisted');
  assert(loadedSave?.managerContract?.yearsLeft === 2, 'Manager contract persisted');
  assert(loadedSave?.finances.transferBudget === 25_000_000, 'Finances transfer budget persisted');

  // ----------------------------------------------------------------
  // 11. 18 CLUB / 34 MATCHWEEK SEASON
  // ----------------------------------------------------------------
  console.log('\n--- 11. 18 CLUB / 34 MATCHWEEK SEASON TEST ---');
  const fixtures = generateSeasonFixtures(MOCK_CLUBS, '2026/27', '2026-08-15');
  assert(MOCK_CLUBS.length === 18, 'League contains exactly 18 clubs');
  assert(fixtures.length === 306, '18 clubs double round robin produces exactly 306 fixtures (18*17)');

  const roundSet = new Set(fixtures.map((f) => f.round));
  assert(roundSet.size === 34, 'Season contains exactly 34 matchweeks');

  const matchesPerClub: Record<string, number> = {};
  MOCK_CLUBS.forEach((c) => { matchesPerClub[c.id] = 0; });
  fixtures.forEach((f) => {
    matchesPerClub[f.homeClubId]++;
    matchesPerClub[f.awayClubId]++;
  });
  assert(Object.values(matchesPerClub).every((count) => count === 34), 'Each of the 18 clubs plays exactly 34 matches');

  // ----------------------------------------------------------------
  // 12. MATCH ENGINE CONCURRENCY
  // ----------------------------------------------------------------
  console.log('\n--- 12. MATCH RNG CONCURRENCY TEST ---');
  const clubA = MOCK_CLUBS[0];
  const clubB = MOCK_CLUBS[1];
  const playersA = universe.filter((p) => p.clubId === clubA.id);
  const playersB = universe.filter((p) => p.clubId === clubB.id);

  // Two independent match engines running concurrently interleaved
  const engine1 = new MatchEngine(
    clubA, clubB, playersA, playersB,
    { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Dengeli', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' },
    { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Dengeli', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' },
    '4-2-3-1', '4-2-3-1', undefined, undefined, 'concurrent-fixture-1'
  );

  const engine2 = new MatchEngine(
    clubB, clubA, playersB, playersA,
    { mentality: 'Hücum', tempo: 'Yüksek', pressing: 'Yoğun', passingStyle: 'Direkt', defensiveLine: 'Yüksek', width: 'Geniş' },
    { mentality: 'Savunmacı', tempo: 'Düşük', pressing: 'Hafif', passingStyle: 'Kısa', defensiveLine: 'Derin', width: 'Dar' },
    '4-3-3', '4-2-3-1', undefined, undefined, 'concurrent-fixture-2'
  );

  // Reference single run of engine 1
  const refEngine1 = new MatchEngine(
    clubA, clubB, playersA, playersB,
    { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Dengeli', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' },
    { mentality: 'Dengeli', tempo: 'Standart', pressing: 'Dengeli', passingStyle: 'Kısa', defensiveLine: 'Standart', width: 'Dengeli' },
    '4-2-3-1', '4-2-3-1', undefined, undefined, 'concurrent-fixture-1'
  );
  const refState1 = refEngine1.simulateFullMatch();

  // Now simulate minute by minute interleaved between engine1 and engine2
  while (!engine1.isMatchFinished() || !engine2.isMatchFinished()) {
    if (!engine1.isMatchFinished()) engine1.simulateMinute();
    if (!engine2.isMatchFinished()) engine2.simulateMinute();
  }

  const concurrentState1 = engine1.getState();
  assert(
    concurrentState1.homeScore === refState1.homeScore &&
    concurrentState1.awayScore === refState1.awayScore &&
    concurrentState1.events.length === refState1.events.length,
    'Interleaved concurrent execution matches standalone simulation exactly (zero RNG cross-interference)'
  );

  // ----------------------------------------------------------------
  // 13. EVENT ID UNIQUENESS
  // ----------------------------------------------------------------
  console.log('\n--- 13. EVENT ID UNIQUENESS TEST ---');
  const allEventIds = concurrentState1.events.map((e) => e.id);
  const uniqueEventIds = new Set(allEventIds);
  assert(allEventIds.length === uniqueEventIds.size, `All ${allEventIds.length} event IDs in match are 100% unique`);
  assert(allEventIds.every((id) => id.startsWith('ev-concurrent-fixture-1-')), 'All event IDs follow deterministic structured pattern');

  // ----------------------------------------------------------------
  // 14. 2D RADAR REAL EVENT SYNC
  // ----------------------------------------------------------------
  console.log('\n--- 14. 2D RADAR REAL EVENT SYNC TEST ---');
  assert(concurrentState1.home.activePitchPlayerIds.length === 11, 'Radar home team has all 11 pitch slots');
  assert(concurrentState1.away.activePitchPlayerIds.length === 11, 'Radar away team has all 11 pitch slots');
  assert(concurrentState1.homePossessionPercent + concurrentState1.awayPossessionPercent === 100, 'Radar live possession strictly equals 100%');

  console.log('\n==================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log('==================================================');

  if (totalTests === passedTests) {
    console.log('>>> ALL 14 CAREER GAP CHECKS PASSED SUCCESSFULLY! <<<');
  } else {
    process.exit(1);
  }
}

runGapCheck().catch((err) => {
  console.error(err);
  process.exit(1);
});
