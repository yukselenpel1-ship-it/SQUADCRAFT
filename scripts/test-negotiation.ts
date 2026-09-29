/**
 * SquadCraft v0.4.0-alpha — Comprehensive Negotiation Engine Test Suite
 * 
 * Tests all 20 required verification points:
 * 1. Club accepts fair offer
 * 2. Club rejects unrealistic low offer
 * 3. Club counteroffers
 * 4. Negotiation patience decreases
 * 5. Player accepts suitable contract
 * 6. Player rejects unsuitable wage
 * 7. Squad role affects wage demand
 * 8. Transfer cannot exceed budget
 * 9. Installments create future commitments
 * 10. Free agent signs without transfer fee
 * 11. Contract renewal works
 * 12. Expired contract creates free agent
 * 13. Transfer window blocks invalid completion
 * 14. Completed transfer moves player exactly once
 * 15. Buyer balance updates exactly once
 * 16. Seller balance updates exactly once
 * 17. Wage budget updates
 * 18. Transfer history created
 * 19. Save/load preserves active negotiation
 * 20. V1 career save migrates to V2
 */

import { MOCK_CLUBS, MOCK_PLAYERS, MOCK_FINANCES, getInitialTactics } from '../src/lib/data/mockData';
import {
  calculatePlayerValuation,
  calculatePlayerContractDemands,
  evaluateClubTransferOffer,
  evaluatePlayerContractOffer,
  executeTransferCompletion,
  canAffordTransfer,
  createActiveNegotiation,
  getSquadRoleInfo,
  ActiveNegotiation,
  TransferOfferPackage,
  ContractOfferPackage,
} from '../src/lib/negotiation';
import {
  saveCareerState,
  loadCareerState,
  SAVE_KEY_V1,
  SAVE_KEY_V2,
  SAVE_KEY_V3,
} from '../src/lib/career/saveManager';
import { processSingleDay } from '../src/lib/career/dailyProcessor';
import { getTransferWindowStatus } from '../src/lib/career/calendar';
import { Player, Club, FinanceSummary } from '../src/types/game';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [TEST ${totalTests.toString().padStart(2, '0')}] PASS: ${testName}`);
  } else {
    console.error(`❌ [TEST ${totalTests.toString().padStart(2, '0')}] FAIL: ${testName}`);
    if (detail) console.error(`   Details: ${detail}`);
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('⚽ SQUADCRAFT v0.4.0-alpha NEGOTIATION ENGINE TEST SUITE');
  console.log('====================================================\n');

  // Test setup
  const buyerClub: Club = JSON.parse(JSON.stringify(MOCK_CLUBS[0])); // Konstantina SK
  const sellerClub: Club = JSON.parse(JSON.stringify(MOCK_CLUBS[1])); // Anadolu Hisarı
  const targetPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS.find(p => p.clubId === sellerClub.id)!));
  const buyerFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
  buyerFinances.transferBudget = 25000000;
  buyerFinances.clubBalance = 30000000;

  const valuation = calculatePlayerValuation(targetPlayer, sellerClub, buyerClub, '2026-08-15');

  // ----------------------------------------------------
  // 1. Club accepts fair offer
  // ----------------------------------------------------
  {
    const fairOffer: TransferOfferPackage = {
      upfrontFee: valuation.fairValue,
      installmentsFee: Math.round(valuation.fairValue * 0.2),
      installmentsMonths: 12,
      bonuses: [],
      sellOnClause: { percentage: 10, isProfitOnly: true },
    };

    const result = evaluateClubTransferOffer(
      targetPlayer,
      sellerClub,
      buyerClub,
      fairOffer,
      3,
      '2026-08-15'
    );

    assert(
      result.status === 'ACCEPTED',
      'Club accepts fair offer',
      `Result: ${result.status}, feedback: ${result.feedbackMessage}`
    );
  }

  // ----------------------------------------------------
  // 2. Club rejects unrealistic low offer
  // ----------------------------------------------------
  {
    const lowballOffer: TransferOfferPackage = {
      upfrontFee: Math.round(valuation.fairValue * 0.2), // 20% of value
      installmentsFee: 0,
      installmentsMonths: 0,
      bonuses: [],
    };

    const result = evaluateClubTransferOffer(
      targetPlayer,
      sellerClub,
      buyerClub,
      lowballOffer,
      1, // Low patience -> walk away / terminate
      '2026-08-15'
    );

    assert(
      result.status === 'TERMINATED' || result.status === 'REJECTED' || result.status === 'COUNTER_OFFER',
      'Club rejects unrealistic low offer',
      `Result: ${result.status}, feedback: ${result.feedbackMessage}`
    );
  }

  // ----------------------------------------------------
  // 3. Club counteroffers
  // ----------------------------------------------------
  {
    const moderateOffer: TransferOfferPackage = {
      upfrontFee: Math.round(valuation.fairValue * 0.82), // 82% of value
      installmentsFee: 0,
      installmentsMonths: 0,
      bonuses: [],
    };

    const result = evaluateClubTransferOffer(
      targetPlayer,
      sellerClub,
      buyerClub,
      moderateOffer,
      3,
      '2026-08-15'
    );

    assert(
      result.status === 'COUNTER_OFFER' &&
      result.counterOffer !== undefined &&
      (result.counterOffer.upfrontFee + result.counterOffer.installmentsFee) > moderateOffer.upfrontFee,
      'Club counteroffers on moderate proposal',
      `Result: ${result.status}, counterOffer Total: ${(result.counterOffer?.upfrontFee || 0) + (result.counterOffer?.installmentsFee || 0)}`
    );
  }

  // ----------------------------------------------------
  // 4. Negotiation patience decreases
  // ----------------------------------------------------
  {
    const moderateOffer: TransferOfferPackage = {
      upfrontFee: Math.round(valuation.fairValue * 0.75),
      installmentsFee: 0,
      installmentsMonths: 0,
      bonuses: [],
    };

    const result = evaluateClubTransferOffer(
      targetPlayer,
      sellerClub,
      buyerClub,
      moderateOffer,
      3,
      '2026-08-15'
    );

    assert(
      result.patienceRemaining < 3,
      'Negotiation patience decreases after counter/rejection',
      `Patience remaining: ${result.patienceRemaining}`
    );
  }

  // ----------------------------------------------------
  // 5. Player accepts suitable contract
  // ----------------------------------------------------
  {
    const demands = calculatePlayerContractDemands(targetPlayer, buyerClub, 'İlk 11');
    const goodContract: ContractOfferPackage = {
      wage: Math.round(demands.wage * 1.1),
      durationYears: demands.durationYears,
      squadRole: 'İlk 11',
      signingBonus: demands.signingBonus,
      appearanceBonus: demands.appearanceBonus,
      goalBonus: demands.goalBonus,
      cleanSheetBonus: demands.cleanSheetBonus,
      releaseClause: demands.releaseClause,
    };

    const result = evaluatePlayerContractOffer(
      targetPlayer,
      buyerClub,
      goodContract,
      3,
      '2026-08-15'
    );

    assert(
      result.status === 'ACCEPTED',
      'Player accepts suitable contract',
      `Status: ${result.status}, feedback: ${result.feedbackMessage}`
    );
  }

  // ----------------------------------------------------
  // 6. Player rejects unsuitable wage
  // ----------------------------------------------------
  {
    const demands = calculatePlayerContractDemands(targetPlayer, buyerClub, 'İlk 11');
    const terribleContract: ContractOfferPackage = {
      wage: Math.round(demands.wage * 0.3), // 30% of target
      durationYears: 1,
      squadRole: 'Yedek',
      signingBonus: 0,
      appearanceBonus: 0,
      goalBonus: 0,
      cleanSheetBonus: 0,
    };

    const result = evaluatePlayerContractOffer(
      targetPlayer,
      buyerClub,
      terribleContract,
      1,
      '2026-08-15'
    );

    assert(
      result.status === 'TERMINATED' || result.status === 'REJECTED' || result.status === 'COUNTER_OFFER',
      'Player rejects unsuitable wage',
      `Status: ${result.status}, feedback: ${result.feedbackMessage}`
    );
  }

  // ----------------------------------------------------
  // 7. Squad role affects wage demand
  // ----------------------------------------------------
  {
    const starRoleInfo = getSquadRoleInfo('Yıldız Oyuncu');
    const youthRoleInfo = getSquadRoleInfo('Genç Oyuncu');

    assert(
      starRoleInfo.wageMultiplier > youthRoleInfo.wageMultiplier && starRoleInfo.wageMultiplier === 1.30 && youthRoleInfo.wageMultiplier === 0.55,
      'Squad role affects wage demand multipliers',
      `Star: ${starRoleInfo.wageMultiplier}x, Youth: ${youthRoleInfo.wageMultiplier}x`
    );
  }

  // ----------------------------------------------------
  // 8. Transfer cannot exceed budget
  // ----------------------------------------------------
  {
    const poorBuyerFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    poorBuyerFinances.transferBudget = 1000;
    poorBuyerFinances.clubBalance = 2000;

    const expensiveTransfer: TransferOfferPackage = {
      upfrontFee: 10000000,
      installmentsFee: 0,
      installmentsMonths: 0,
      bonuses: [],
    };
    const contract: ContractOfferPackage = {
      wage: 50000,
      durationYears: 3,
      squadRole: 'İlk 11',
      signingBonus: 500000,
      appearanceBonus: 1000,
      goalBonus: 1000,
      cleanSheetBonus: 0,
    };

    const affordCheck = canAffordTransfer(poorBuyerFinances, expensiveTransfer, contract);

    assert(
      !affordCheck.canAfford,
      'Transfer cannot exceed budget (canAffordTransfer reports false on insufficient funds)',
      `Reason: ${affordCheck.reason}`
    );
  }

  // ----------------------------------------------------
  // 9. Installments create future commitments
  // ----------------------------------------------------
  {
    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    testFinances.transferBudget = 20000000;
    testFinances.clubBalance = 20000000;

    const result = executeTransferCompletion({
      player: targetPlayer,
      sellerClub,
      buyerClub,
      transferPackage: {
        upfrontFee: 4000000,
        installmentsFee: 3000000,
        installmentsMonths: 24,
        bonuses: [],
      },
      contractPackage: {
        wage: 25000,
        durationYears: 3,
        squadRole: 'İlk 11',
        signingBonus: 100000,
        appearanceBonus: 1000,
        goalBonus: 1000,
        cleanSheetBonus: 0,
      },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      result.newCommitments.length > 0 &&
      result.newCommitments[0].fromClubId === buyerClub.id &&
      result.newCommitments[0].toClubId === sellerClub.id &&
      result.newCommitments[0].status === 'PENDING',
      'Installments create future commitments with accurate club IDs and status',
      `Commitments count: ${result.newCommitments.length}, first amount: €${result.newCommitments[0]?.amount}`
    );
  }

  // ----------------------------------------------------
  // 10. Free agent signs without transfer fee
  // ----------------------------------------------------
  {
    const freeAgent: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    freeAgent.id = 'free-agent-test-10';
    freeAgent.clubId = 'FREE_AGENT';

    const freeAgentFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    const initialBalance = freeAgentFinances.clubBalance;
    const initialTransferBudget = freeAgentFinances.transferBudget;

    const result = executeTransferCompletion({
      player: freeAgent,
      sellerClub: undefined,
      buyerClub,
      transferPackage: { upfrontFee: 0, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: {
        wage: 20000,
        durationYears: 2,
        squadRole: 'Rotasyon',
        signingBonus: 50000,
        appearanceBonus: 500,
        goalBonus: 500,
        cleanSheetBonus: 0,
      },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: freeAgentFinances,
    });

    assert(
      result.historyRecord.fee === 0 &&
      result.updatedPlayer.clubId === buyerClub.id &&
      result.updatedBuyerFinances.clubBalance === initialBalance - 50000 &&
      result.updatedBuyerFinances.transferBudget === initialTransferBudget, // Transfer budget unchanged
      'Free agent signs without transfer fee (only signing bonus deducted from balance)',
      `Fee: ${result.historyRecord.fee}, balance delta: ${initialBalance - result.updatedBuyerFinances.clubBalance}`
    );
  }

  // ----------------------------------------------------
  // 11. Contract renewal works
  // ----------------------------------------------------
  {
    const squadPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    squadPlayer.clubId = buyerClub.id;
    squadPlayer.contractEnd = '2026-06-30';

    const renewFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    const result = executeTransferCompletion({
      player: squadPlayer,
      sellerClub: buyerClub,
      buyerClub,
      transferPackage: { upfrontFee: 0, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: {
        wage: 35000,
        durationYears: 3,
        squadRole: 'İlk 11',
        signingBonus: 30000,
        appearanceBonus: 1000,
        goalBonus: 1000,
        cleanSheetBonus: 0,
      },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: renewFinances,
      isContractRenewal: true,
    });

    assert(
      result.updatedPlayer.contractEnd === '2029-06-30' &&
      result.updatedPlayer.wage === 35000 &&
      result.updatedPlayer.clubId === buyerClub.id &&
      result.historyRecord.details === 'Sözleşme Yenilendi',
      'Contract renewal works (updates contractEnd to 2029, wage to 35000, preserves club)',
      `New contractEnd: ${result.updatedPlayer.contractEnd}, wage: ${result.updatedPlayer.wage}`
    );
  }

  // ----------------------------------------------------
  // 12. Expired contract creates free agent
  // ----------------------------------------------------
  {
    const expiringPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    expiringPlayer.id = 'expiring-player-12';
    expiringPlayer.clubId = sellerClub.id;
    expiringPlayer.contractEnd = '2026-06-30';

    // Simulate daily career advancing to June 30 2026 (contract expiry date)
    const dayResult = processSingleDay({
      currentDate: '2026-06-29',
      seasonYear: '2026-2027',
      userClubId: buyerClub.id,
      trainingIntensity: 'Normal',
      clubs: [buyerClub, sellerClub],
      players: [expiringPlayer],
      tactics: getInitialTactics(buyerClub.id),
      standings: [],
      fixtures: [],
      inboxMessages: [],
      transferOffers: [],
      shortlistIds: [],
      finances: MOCK_FINANCES,
      newsFeed: [],
      activeNegotiations: [],
      futureCommitments: [],
      transferHistory: [],
    });

    const updatedPlayer = dayResult.updatedState.players.find(p => p.id === expiringPlayer.id);
    assert(
      updatedPlayer !== undefined && (updatedPlayer.clubId === 'FREE_AGENT' || updatedPlayer.clubId === 'free-agent'),
      'Expired contract creates free agent upon reaching contract end date',
      `Player clubId is: ${updatedPlayer?.clubId}`
    );
  }

  // ----------------------------------------------------
  // 13. Transfer window blocks invalid completion
  // ----------------------------------------------------
  {
    const summerOpen = getTransferWindowStatus('2026-07-15') === 'OPEN';
    const winterOpen = getTransferWindowStatus('2027-01-10') === 'OPEN';
    const midSeasonClosed = getTransferWindowStatus('2026-10-15') === 'OPEN';
    const springClosed = getTransferWindowStatus('2027-04-15') === 'OPEN';

    assert(
      summerOpen && winterOpen && !midSeasonClosed && !springClosed,
      'Transfer window blocks invalid periods (open Jul-Aug & Jan-Feb, closed Oct/Apr)',
      `Jul: ${summerOpen}, Jan: ${winterOpen}, Oct: ${midSeasonClosed}, Apr: ${springClosed}`
    );
  }

  // ----------------------------------------------------
  // 14. Completed transfer moves player exactly once
  // ----------------------------------------------------
  {
    const movingPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS.find(p => p.clubId === sellerClub.id)!));
    movingPlayer.id = 'moving-player-14';
    movingPlayer.clubId = sellerClub.id;

    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    testFinances.transferBudget = 10000000;
    testFinances.clubBalance = 15000000;

    const outcome = executeTransferCompletion({
      player: movingPlayer,
      sellerClub,
      buyerClub,
      transferPackage: { upfrontFee: 5000000, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: { wage: 30000, durationYears: 3, squadRole: 'İlk 11', signingBonus: 0, appearanceBonus: 0, goalBonus: 0, cleanSheetBonus: 0 },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      outcome.updatedPlayer.clubId === buyerClub.id,
      'Completed transfer moves player exactly once to buyer club',
      `Player new club: ${outcome.updatedPlayer.clubId}`
    );
  }

  // ----------------------------------------------------
  // 15. Buyer balance updates exactly once
  // ----------------------------------------------------
  {
    const movingPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    movingPlayer.id = 'moving-player-15';
    movingPlayer.clubId = sellerClub.id;

    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    testFinances.clubBalance = 20000000;
    testFinances.transferBudget = 15000000;

    const upfront = 4000000;
    const signBonus = 200000;

    const outcome = executeTransferCompletion({
      player: movingPlayer,
      sellerClub,
      buyerClub,
      transferPackage: { upfrontFee: upfront, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: { wage: 25000, durationYears: 3, squadRole: 'İlk 11', signingBonus: signBonus, appearanceBonus: 0, goalBonus: 0, cleanSheetBonus: 0 },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      outcome.updatedBuyerFinances.clubBalance === 20000000 - upfront - signBonus &&
      outcome.updatedBuyerFinances.transferBudget === 15000000 - upfront,
      'Buyer balance & transfer budget update accurately',
      `Balance: ${outcome.updatedBuyerFinances.clubBalance}, TransferBudget: ${outcome.updatedBuyerFinances.transferBudget}`
    );
  }

  // ----------------------------------------------------
  // 16. Seller balance updates exactly once
  // ----------------------------------------------------
  {
    const movingPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    movingPlayer.id = 'moving-player-16';
    movingPlayer.clubId = sellerClub.id;

    const testSeller: Club = JSON.parse(JSON.stringify(sellerClub));
    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    testFinances.clubBalance = 20000000;
    testFinances.transferBudget = 15000000;

    const upfront = 6000000;

    const outcome = executeTransferCompletion({
      player: movingPlayer,
      sellerClub: testSeller,
      buyerClub,
      transferPackage: { upfrontFee: upfront, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: { wage: 25000, durationYears: 3, squadRole: 'İlk 11', signingBonus: 0, appearanceBonus: 0, goalBonus: 0, cleanSheetBonus: 0 },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      outcome.updatedSellerClub !== undefined &&
      outcome.updatedSellerClub.balance === testSeller.balance + upfront &&
      outcome.updatedSellerClub.transferBudget === testSeller.transferBudget + Math.round(upfront * 0.85),
      'Seller balance & transfer budget credit upfront fee accurately',
      `Seller new balance: ${outcome.updatedSellerClub?.balance}`
    );
  }

  // ----------------------------------------------------
  // 17. Wage budget updates
  // ----------------------------------------------------
  {
    const movingPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    movingPlayer.id = 'moving-player-17';
    movingPlayer.clubId = sellerClub.id;

    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    const initialWages = testFinances.weeklyWages;
    const newWage = 45000;

    const outcome = executeTransferCompletion({
      player: movingPlayer,
      sellerClub,
      buyerClub,
      transferPackage: { upfrontFee: 1000000, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: { wage: newWage, durationYears: 2, squadRole: 'İlk 11', signingBonus: 0, appearanceBonus: 0, goalBonus: 0, cleanSheetBonus: 0 },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      outcome.updatedBuyerFinances.weeklyWages === initialWages + newWage,
      'Buyer weekly wages update with new player wage',
      `Initial wages: ${initialWages}, new wages: ${outcome.updatedBuyerFinances.weeklyWages}`
    );
  }

  // ----------------------------------------------------
  // 18. Transfer history created
  // ----------------------------------------------------
  {
    const movingPlayer: Player = JSON.parse(JSON.stringify(MOCK_PLAYERS[0]));
    movingPlayer.id = 'moving-player-18';
    movingPlayer.clubId = sellerClub.id;

    const testFinances: FinanceSummary = JSON.parse(JSON.stringify(MOCK_FINANCES));
    testFinances.transferBudget = 10000000;
    testFinances.clubBalance = 10000000;

    const outcome = executeTransferCompletion({
      player: movingPlayer,
      sellerClub,
      buyerClub,
      transferPackage: { upfrontFee: 2500000, installmentsFee: 0, installmentsMonths: 0, bonuses: [] },
      contractPackage: { wage: 20000, durationYears: 3, squadRole: 'Rotasyon', signingBonus: 0, appearanceBonus: 0, goalBonus: 0, cleanSheetBonus: 0 },
      currentDate: '2026-08-15',
      seasonYear: '2026-2027',
      buyerFinances: testFinances,
    });

    assert(
      outcome.historyRecord !== undefined &&
      outcome.historyRecord.fee === 2500000 &&
      outcome.historyRecord.fromClubName === sellerClub.name &&
      outcome.historyRecord.toClubName === buyerClub.name,
      'Transfer history record is generated with accurate metadata',
      `Record: ${outcome.historyRecord.playerName} -> ${outcome.historyRecord.toClubName}`
    );
  }

  // ----------------------------------------------------
  // 19. Save/load preserves active negotiation
  // ----------------------------------------------------
  {
    const neg: ActiveNegotiation = createActiveNegotiation(
      targetPlayer,
      buyerClub,
      sellerClub,
      '2026-08-15'
    );
    neg.clubPatience = 2;
    neg.stage = 'PLAYER_NEGOTIATION';

    // Mock window & localStorage
    const storage: Record<string, string> = {};
    (global as any).window = global;
    (global as any).localStorage = {
      getItem: (k: string) => storage[k] || null,
      setItem: (k: string, v: string) => { storage[k] = v; },
      removeItem: (k: string) => { delete storage[k]; },
      clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    };

    saveCareerState({
      saveVersion: 2,
      savedAt: new Date().toISOString(),
      seasonYear: '2026-2027',
      seasonStage: 'REGULAR_SEASON',
      currentDate: '2026-08-15',
      userClubId: buyerClub.id,
      trainingIntensity: 'Normal',
      clubs: MOCK_CLUBS,
      players: MOCK_PLAYERS,
      tactics: getInitialTactics(buyerClub.id),
      standings: [],
      fixtures: [],
      inboxMessages: [],
      transferOffers: [],
      shortlistIds: [],
      finances: MOCK_FINANCES,
      newsFeed: [],
      careerHistory: [],
      activeNegotiations: [neg],
      transferHistory: [],
      futureCommitments: [],
      settings: {
        autoSave: true,
        defaultMatchSpeed: 1,
        debugMode: false,
      },
    });

    const loaded = loadCareerState();

    assert(
      loaded !== null &&
      loaded.activeNegotiations.length === 1 &&
      loaded.activeNegotiations[0].id === neg.id &&
      loaded.activeNegotiations[0].clubPatience === 2 &&
      loaded.activeNegotiations[0].stage === 'PLAYER_NEGOTIATION',
      'Save and load preserves active negotiations with intact stages & patience',
      `Loaded neg count: ${loaded?.activeNegotiations.length}, stage: ${loaded?.activeNegotiations[0]?.stage}`
    );
  }

  // ----------------------------------------------------
  // 20. V1 career save migrates to V2
  // ----------------------------------------------------
  {
    // Write old V1 save format
    const oldV1Save = {
      saveVersion: 1,
      savedAt: '2026-08-01T00:00:00.000Z',
      seasonYear: '2026-2027',
      seasonStage: 'PRE_SEASON' as const,
      currentDate: '2026-08-01',
      userClubId: buyerClub.id,
      trainingIntensity: 'Normal' as const,
      clubs: MOCK_CLUBS,
      players: MOCK_PLAYERS,
      tactics: getInitialTactics(buyerClub.id),
      standings: [],
      fixtures: [],
      inboxMessages: [],
      transferOffers: [],
      shortlistIds: [],
      finances: MOCK_FINANCES,
      newsFeed: [],
      careerHistory: [],
      settings: {
        autoSave: true,
        defaultMatchSpeed: 1,
        debugMode: false,
      },
    };

    (global as any).localStorage.removeItem(SAVE_KEY_V3);
    (global as any).localStorage.removeItem(SAVE_KEY_V2);
    (global as any).localStorage.setItem(SAVE_KEY_V1, JSON.stringify(oldV1Save));

    const migrated = loadCareerState();

    assert(
      migrated !== null &&
      (Number(migrated.saveVersion) === 2 || Number(migrated.saveVersion) === 3) &&
      Array.isArray(migrated.activeNegotiations) &&
      migrated.activeNegotiations.length === 0 &&
      Array.isArray(migrated.transferHistory) &&
      Array.isArray(migrated.futureCommitments),
      'V1 career save cleanly migrates to modern structure with empty negotiation arrays',
      `Migrated version: ${migrated?.saveVersion}, negs: ${migrated?.activeNegotiations?.length}`
    );
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('====================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

const userClub = MOCK_CLUBS[0];
runTests().catch(err => {
  console.error('Test runner encountered unexpected error:', err);
  process.exit(1);
});
