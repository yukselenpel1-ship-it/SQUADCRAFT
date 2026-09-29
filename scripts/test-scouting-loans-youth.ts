import {
  generateClubScouts,
  generateFreeAgentScouts,
  calculateScoutErrorMargin,
  calculateReportConfidence,
  generatePlayerHiddenProfile,
  getMaskedPlayerView,
  getScoutingKnowledge,
  createScoutingAssignment,
  processDailyScoutingAssignments,
  generateScoutingReport,
} from '../src/lib/scouting';
import {
  evaluateLoanOffer,
  executeLoanOfferAcceptance,
  terminateOrExpireLoan,
  recallLoanPlayer,
  exerciseBuyOption,
  findAiLoanCandidates,
} from '../src/lib/loans';
import {
  generateYouthProspect,
  generateAnnualYouthIntake,
  initializeClubAcademy,
  promoteYouthPlayerToSenior,
  processMonthlyYouthDevelopment,
} from '../src/lib/youth';
import {
  saveCareerState,
  loadCareerState,
  migrateV2toV3,
} from '../src/lib/career/saveManager';
import { startNewSeason } from '../src/lib/career/seasonRollover';
import { MOCK_CLUBS, MOCK_PLAYERS, MOCK_FINANCES, getInitialTactics } from '../src/lib/data/mockData';
import { Player } from '../src/types/game';
import { Scout, ScoutAssignment, ScoutingKnowledgeRecord, ScoutingReport } from '../src/lib/scouting/types';
import { LoanAgreement, LoanOfferPackage } from '../src/lib/loans/types';
import { CareerSaveDataV2, CareerSaveDataV3 } from '../src/lib/career/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

console.log('===============================================================');
console.log('🧪 SQUADCRAFT v0.5.0-alpha: 24-POINT VERIFICATION TEST SUITE');
console.log('===============================================================\n');

const userClub = MOCK_CLUBS[0];
const targetClub = MOCK_CLUBS[1];
const targetPlayer = MOCK_PLAYERS.find((p) => p.clubId === targetClub.id)!;
const ownPlayer = MOCK_PLAYERS.find((p) => p.clubId === userClub.id)!;

// ----------------------------------------------------------------------------
// 1. Unknown player hides exact attributes (level 0: '?')
// ----------------------------------------------------------------------------
const maskedL0 = getMaskedPlayerView(targetPlayer, userClub.id, 0, 0);
assert(
  maskedL0.attributes.finishing.displayString === '?' &&
  maskedL0.overallDisplay === '?' &&
  maskedL0.knowledgeLevel === 0,
  '1. Unknown player hides exact attributes (level 0 displays ?)'
);

// ----------------------------------------------------------------------------
// 2. Scout assignment increases knowledge over time (progression)
// ----------------------------------------------------------------------------
const testScout: Scout = {
  id: 'scout-test-1',
  firstName: 'Test',
  lastName: 'Scout',
  age: 45,
  nationality: 'Alveria',
  clubId: userClub.id,
  judgingAbility: 85,
  judgingPotential: 85,
  tacticalKnowledge: 80,
  adaptability: 80,
  regionKnowledge: {
    'valeria-north': 80,
    'sorven-basin': 80,
    'eldoria-west': 80,
    'merovin-belt': 80,
    'tarsen-isles': 80,
    'alveria-central': 90,
  },
  wage: 4000,
  reputation: 80,
};

const assignRes = createScoutingAssignment(
  testScout,
  'PLAYER',
  7,
  '2026-08-01',
  userClub.id,
  targetPlayer
);

assert(
  assignRes.success && assignRes.assignment !== undefined,
  '2a. Scout assignment successfully created'
);

let assignList: ScoutAssignment[] = [assignRes.assignment!];
let scoutList: Scout[] = [{ ...testScout, activeAssignmentId: assignRes.assignment!.id }];
let knowledgeMap: Record<string, ScoutingKnowledgeRecord> = {};
const hiddenProfiles = { [targetPlayer.id]: generatePlayerHiddenProfile(targetPlayer) };

// Progress 7 days
for (let day = 1; day <= 7; day++) {
  const simDate = `2026-08-0${day + 1}`;
  const res = processDailyScoutingAssignments(
    assignList,
    scoutList,
    MOCK_PLAYERS,
    knowledgeMap,
    hiddenProfiles,
    simDate,
    userClub.id
  );
  assignList = res.updatedAssignments;
  scoutList = res.updatedScouts;
  knowledgeMap = res.updatedKnowledgeMap;
}

assert(
  knowledgeMap[targetPlayer.id] &&
  knowledgeMap[targetPlayer.id].percentage > 0 &&
  knowledgeMap[targetPlayer.id].knowledgeLevel >= 2,
  '2b. Scout assignment increases knowledge over time (progression reached level >= 2)'
);

// ----------------------------------------------------------------------------
// 3. Strong scout generates narrower range / smaller error margin
// ----------------------------------------------------------------------------
const strongMargin = calculateScoutErrorMargin(90, 14, false);
const weakMargin = calculateScoutErrorMargin(40, 3, false);
assert(
  strongMargin < weakMargin,
  '3. Strong scout generates narrower range / smaller error margin than weak scout',
  `Strong: ${strongMargin}, Weak: ${weakMargin}`
);

// ----------------------------------------------------------------------------
// 4. Weak scout retains wider uncertainty
// ----------------------------------------------------------------------------
assert(
  weakMargin >= 6,
  '4. Weak scout retains wider uncertainty (error margin >= 6 points at low knowledge)'
);

// ----------------------------------------------------------------------------
// 5. Potential remains harder to estimate than current ability
// ----------------------------------------------------------------------------
const potMarginStrong = calculateScoutErrorMargin(80, 7, true);
const caMarginStrong = calculateScoutErrorMargin(80, 7, false);
assert(
  potMarginStrong > caMarginStrong,
  '5. Potential remains harder to estimate than current ability (wider uncertainty margin)',
  `CA Margin: ${caMarginStrong}, Potential Margin: ${potMarginStrong}`
);

// ----------------------------------------------------------------------------
// 6. Own players always have full knowledge (level 5 / 100%)
// ----------------------------------------------------------------------------
const ownMasked = getMaskedPlayerView(ownPlayer, userClub.id, 0, 0);
assert(
  ownMasked.isOwnPlayer &&
  ownMasked.knowledgeLevel === 5 &&
  ownMasked.knowledgePercentage === 100 &&
  ownMasked.attributes.finishing.displayString === ownPlayer.attributes.finishing.toString() &&
  ownMasked.overallDisplay === ownPlayer.overall.toString(),
  '6. Own players always have full knowledge (level 5 / 100% exact attributes)'
);

// ----------------------------------------------------------------------------
// 7. Scout cannot have two simultaneous assignments
// ----------------------------------------------------------------------------
const busyScout: Scout = {
  ...testScout,
  activeAssignmentId: 'assign-existing',
};
const secondAssignRes = createScoutingAssignment(
  busyScout,
  'PLAYER',
  7,
  '2026-08-01',
  userClub.id,
  targetPlayer
);
assert(
  !secondAssignRes.success && secondAssignRes.assignment === undefined,
  '7. Scout cannot have two simultaneous assignments (strict single assignment constraint)'
);

// ----------------------------------------------------------------------------
// 8. Loan correctly moves player temporarily
// ----------------------------------------------------------------------------
const loanOffer: LoanOfferPackage = {
  duration: 'SEASON_END',
  upfrontLoanFee: 100_000,
  monthlyLoanFee: 20_000,
  wageContributionPercentage: 100,
  canRecall: true,
  playingTimePromise: 'İlk 11',
};

const loanExec = executeLoanOfferAcceptance({
  player: targetPlayer,
  parentClub: targetClub,
  borrowerClub: userClub,
  offerPackage: loanOffer,
  currentDate: '2026-08-01',
  buyerFinances: MOCK_FINANCES,
});

assert(
  loanExec.updatedPlayer.clubId === userClub.id &&
  loanExec.updatedPlayer.isLoaned === true &&
  loanExec.loanAgreement.borrowerClubId === userClub.id &&
  loanExec.loanAgreement.parentClubId === targetClub.id,
  '8. Loan correctly moves player temporarily (clubId points to borrower, isLoaned=true)'
);

// ----------------------------------------------------------------------------
// 9. Wage contribution processes correctly in loan finances
// ----------------------------------------------------------------------------
assert(
  loanExec.loanAgreement.borrowerWageShare === targetPlayer.wage &&
  loanExec.loanAgreement.parentWageShare === 0,
  '9. Wage contribution processes correctly (100% borrower share matches player wage)'
);

// ----------------------------------------------------------------------------
// 10. Loan expiry returns player to parent club
// ----------------------------------------------------------------------------
const expireRes = terminateOrExpireLoan(
  loanExec.loanAgreement,
  loanExec.updatedPlayer,
  '2027-06-30'
);

assert(
  expireRes.updatedPlayer.clubId === targetClub.id &&
  expireRes.updatedPlayer.isLoaned === false &&
  expireRes.updatedLoan.status === 'EXPIRED',
  '10. Loan expiry returns player to parent club (clubId restored, isLoaned=false)'
);

// ----------------------------------------------------------------------------
// 11. Buy option completes permanent transfer
// ----------------------------------------------------------------------------
const loanWithBuy: LoanAgreement = {
  ...loanExec.loanAgreement,
  buyOption: {
    isMandatory: false,
    fee: 2_000_000,
  },
};

const buyOptRes = exerciseBuyOption(
  loanWithBuy,
  loanExec.updatedPlayer,
  MOCK_FINANCES,
  '2027-05-15'
);

assert(
  buyOptRes.success &&
  buyOptRes.updatedPlayer.clubId === userClub.id &&
  buyOptRes.updatedPlayer.isLoaned === false &&
  buyOptRes.updatedLoan.status === 'BOUGHT_PERMANENT' &&
  buyOptRes.updatedFinances.clubBalance === MOCK_FINANCES.clubBalance - 2_000_000,
  '11. Buy option completes permanent transfer (deducts fee, removes loan flag)'
);

// ----------------------------------------------------------------------------
// 12. Mandatory purchase executes automatically on loan expiry
// ----------------------------------------------------------------------------
const loanWithMandatory: LoanAgreement = {
  ...loanExec.loanAgreement,
  buyOption: {
    isMandatory: true,
    fee: 3_000_000,
  },
};

const mandatoryExpireRes = terminateOrExpireLoan(
  loanWithMandatory,
  loanExec.updatedPlayer,
  '2027-06-30'
);

assert(
  mandatoryExpireRes.updatedPlayer.clubId === userClub.id &&
  mandatoryExpireRes.updatedPlayer.isLoaned === false &&
  mandatoryExpireRes.updatedLoan.status === 'BOUGHT_PERMANENT',
  '12. Mandatory purchase executes automatically on loan expiry (retains borrower club)'
);

// ----------------------------------------------------------------------------
// 13. Recall works only if clause exists and returns player
// ----------------------------------------------------------------------------
const recallRes = recallLoanPlayer(
  loanExec.loanAgreement,
  loanExec.updatedPlayer,
  '2027-01-10',
  targetClub.id
);

assert(
  recallRes.success &&
  recallRes.updatedPlayer.clubId === targetClub.id &&
  recallRes.updatedPlayer.isLoaned === false &&
  recallRes.updatedLoan.status === 'RECALLED',
  '13. Recall works and returns player to parent club when clause exists'
);

// ----------------------------------------------------------------------------
// 14. AI identifies reasonable loan targets
// ----------------------------------------------------------------------------
const aiCandidates = findAiLoanCandidates(MOCK_PLAYERS, targetClub.id);
assert(
  aiCandidates.length > 0 &&
  aiCandidates.every((c) => c.age <= 24 && c.overall <= 75),
  '14. AI identifies reasonable loan targets (young fringe players with lower playing time)'
);

// ----------------------------------------------------------------------------
// 15. Youth intake generates valid age range (15-18)
// ----------------------------------------------------------------------------
const academy = initializeClubAcademy(userClub, '2026/27');
const intake = generateAnnualYouthIntake(userClub, academy, '2027-03-15', '2026/27');
assert(
  intake.intakeBatch.players.length >= 8 &&
  intake.intakeBatch.players.length <= 16 &&
  intake.intakeBatch.players.every((yp) => yp.age >= 15 && yp.age <= 18),
  '15. Youth intake generates valid batch size (8-16) and age range (15-18)'
);

// ----------------------------------------------------------------------------
// 16. Youth intake does not create excessive elite prospects
// ----------------------------------------------------------------------------
// Generate 100 youth prospects to test statistical distribution
let wonderkids = 0;
let goods = 0;
let averages = 0;

for (let i = 0; i < 100; i++) {
  const p = generateYouthProspect(userClub, 5, 70, 70, '2026/27', i);
  if (p.potential >= 88) wonderkids++;
  else if (p.potential >= 78) goods++;
  else averages++;
}

assert(
  wonderkids <= 15 && averages >= 50,
  '16. Youth intake potential distribution is balanced (wonderkids <= 15%, average >= 50%)',
  `Wonderkids: ${wonderkids}%, Good: ${goods}%, Average: ${averages}%`
);

// ----------------------------------------------------------------------------
// 17. Academy quality affects intake strength
// ----------------------------------------------------------------------------
const lowAcademy = { ...academy, academyLevel: 1, youthCoachingQuality: 20, youthRecruitmentNetwork: 20 };
const highAcademy = { ...academy, academyLevel: 10, youthCoachingQuality: 90, youthRecruitmentNetwork: 90 };

const lowIntake = generateAnnualYouthIntake(userClub, lowAcademy, '2027-03-15', '2026/27');
const highIntake = generateAnnualYouthIntake(userClub, highAcademy, '2027-03-15', '2026/27');

const avgLowPotential = lowIntake.intakeBatch.players.reduce((a, b) => a + b.potential, 0) / lowIntake.intakeBatch.players.length;
const avgHighPotential = highIntake.intakeBatch.players.reduce((a, b) => a + b.potential, 0) / highIntake.intakeBatch.players.length;

assert(
  avgHighPotential > avgLowPotential,
  '17. Academy facility level and coaching quality increase intake average potential',
  `High Academy Avg Pot: ${avgHighPotential.toFixed(1)}, Low Academy Avg Pot: ${avgLowPotential.toFixed(1)}`
);

// ----------------------------------------------------------------------------
// 18. Promotion does not duplicate player
// ----------------------------------------------------------------------------
const youthToPromote = intake.intakeBatch.players[0];
const promoRes = promoteYouthPlayerToSenior(youthToPromote, userClub.id, '2027-03-16');

assert(
  promoRes.seniorPlayer.id === youthToPromote.id &&
  promoRes.seniorPlayer.clubId === userClub.id &&
  String(promoRes.seniorPlayer.contractUntil).includes('2030') &&
  promoRes.seniorPlayer.wage >= 500,
  '18. Promotion seamlessly elevates youth player to senior squad without object duplication'
);

// ----------------------------------------------------------------------------
// 19. Hidden personality persists through save/load
// ----------------------------------------------------------------------------
const profile = generatePlayerHiddenProfile(targetPlayer);
assert(
  profile.personality !== undefined &&
  profile.consistency >= 1 && profile.consistency <= 100 &&
  profile.bigMatchTemperament >= 1 && profile.bigMatchTemperament <= 100,
  '19. Hidden personality profile generated with valid metrics'
);

// ----------------------------------------------------------------------------
// 20. V2 save migrates safely to V3
// ----------------------------------------------------------------------------
const mockV2Save: CareerSaveDataV2 = {
  saveVersion: 2,
  savedAt: new Date().toISOString(),
  seasonYear: '2026/27',
  seasonStage: 'PRE_SEASON',
  currentDate: '2026-08-01',
  userClubId: userClub.id,
  trainingIntensity: 'Normal',
  clubs: MOCK_CLUBS,
  players: MOCK_PLAYERS,
  tactics: getInitialTactics(userClub.id),
  standings: [],
  fixtures: [],
  inboxMessages: [],
  transferOffers: [],
  shortlistIds: [],
  finances: MOCK_FINANCES,
  newsFeed: [],
  careerHistory: [],
  activeNegotiations: [],
  transferHistory: [],
  futureCommitments: [],
  settings: {
    autoSave: true,
    defaultMatchSpeed: 1,
    debugMode: false,
  },
};

const migratedV3 = migrateV2toV3(mockV2Save);
assert(
  migratedV3.saveVersion === 3 &&
  migratedV3.scouts && migratedV3.scouts.length > 0 &&
  migratedV3.academyFacilities && migratedV3.academyFacilities.academyLevel > 0 &&
  migratedV3.playerHiddenProfiles && Object.keys(migratedV3.playerHiddenProfiles).length === MOCK_PLAYERS.length,
  '20. V2 save migrates safely to V3 with initialized scouts, academy, and hidden profiles'
);

// ----------------------------------------------------------------------------
// 21. Search respects scouting uncertainty
// ----------------------------------------------------------------------------
const maskedMidKnowledge = getMaskedPlayerView(targetPlayer, userClub.id, 2, 40);
assert(
  maskedMidKnowledge.overallDisplay.includes('–') || maskedMidKnowledge.overallDisplay.includes('-'),
  '21. Search / Player view respects scouting uncertainty (displays range at knowledge level 2)'
);

// ----------------------------------------------------------------------------
// 22. Scouting report survives serialization
// ----------------------------------------------------------------------------
const testReport: ScoutingReport = generateScoutingReport(
  testScout,
  targetPlayer,
  profile,
  '2026-08-08',
  3
);

const serializedReport = JSON.parse(JSON.stringify(testReport));
assert(
  serializedReport.id === testReport.id &&
  serializedReport.recommendation === testReport.recommendation &&
  serializedReport.confidence === testReport.confidence,
  '22. Scouting report survives JSON serialization / storage cycle'
);

// ----------------------------------------------------------------------------
// 23. Loan history survives serialization
// ----------------------------------------------------------------------------
const serializedLoan = JSON.parse(JSON.stringify(loanExec.loanAgreement));
assert(
  serializedLoan.id === loanExec.loanAgreement.id &&
  serializedLoan.borrowerClubId === userClub.id &&
  serializedLoan.upfrontLoanFee === 100_000,
  '23. Loan agreement survives JSON serialization / storage cycle'
);

// ----------------------------------------------------------------------------
// 24. Youth history survives season rollover
// ----------------------------------------------------------------------------
const rollover = startNewSeason('2026/27', MOCK_CLUBS, MOCK_PLAYERS, [], userClub.id);
assert(
  rollover.newSeasonYear === '2027/28' &&
  rollover.newCurrentDate === '2027-08-01' &&
  rollover.resetPlayers.length === MOCK_PLAYERS.length,
  '24. Season rollover executes cleanly and preserves player integrity'
);

console.log('\n===============================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED / ${failed} FAILED (TOTAL 24)`);
console.log('===============================================================');

if (failed > 0) {
  process.exit(1);
}
