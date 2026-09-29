import { Player, Club, FinanceSummary, PositionCategory } from '@/types/game';
import { TransferOfferPackage, ContractOfferPackage, SquadRole } from './types';
import { getTransferWindowStatus } from '../career/calendar';
import { calculatePlayerValuation } from './transferValuation';
import { calculatePlayerContractDemands } from './contractValuation';
import { executeTransferCompletion } from './transferCompletion';
import { NewsItem } from '../career/types';

export interface AiTransferDailyResult {
  updatedPlayers: Player[];
  updatedClubs: Club[];
  completedNews: NewsItem[];
}

function getPlayerCategory(pos: string): PositionCategory {
  if (pos === 'GK') return 'GK';
  if (['DR', 'DC', 'DL'].includes(pos)) return 'DEF';
  if (['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(pos)) return 'MID';
  return 'ATT';
}

/**
 * Checks positional depth of an AI club and determines highest priority need.
 */
export function identifyClubSquadNeed(clubPlayers: Player[]): PositionCategory | null {
  const gks = clubPlayers.filter((p) => getPlayerCategory(p.position) === 'GK');
  const defs = clubPlayers.filter((p) => getPlayerCategory(p.position) === 'DEF');
  const mids = clubPlayers.filter((p) => getPlayerCategory(p.position) === 'MID');
  const atts = clubPlayers.filter((p) => getPlayerCategory(p.position) === 'ATT');

  if (gks.length < 2) return 'GK';
  if (defs.length < 5) return 'DEF';
  if (mids.length < 5) return 'MID';
  if (atts.length < 3) return 'ATT';

  // Average rating checks
  const avgGk = gks.reduce((acc, p) => acc + p.overall, 0) / (gks.length || 1);
  const avgDef = defs.reduce((acc, p) => acc + p.overall, 0) / (defs.length || 1);
  const avgMid = mids.reduce((acc, p) => acc + p.overall, 0) / (mids.length || 1);
  const avgAtt = atts.reduce((acc, p) => acc + p.overall, 0) / (atts.length || 1);

  const lowest = Math.min(avgGk, avgDef, avgMid, avgAtt);
  if (lowest === avgGk && gks.length <= 3) return 'GK';
  if (lowest === avgDef && defs.length <= 7) return 'DEF';
  if (lowest === avgMid && mids.length <= 8) return 'MID';
  if (lowest === avgAtt && atts.length <= 6) return 'ATT';

  return null;
}

/**
 * Processes background AI club transfer activity during open transfer window.
 */
export function processAiClubMarketActivity(
  allPlayers: Player[],
  allClubs: Club[],
  userClubId: string,
  currentDate: string,
  seasonYear: string
): AiTransferDailyResult {
  const windowStatus = getTransferWindowStatus(currentDate);
  if (windowStatus === 'CLOSED') {
    return {
      updatedPlayers: allPlayers,
      updatedClubs: allClubs,
      completedNews: [],
    };
  }

  // Activity rate: ~1 AI-to-AI transfer every 6-10 days
  const isDeadlineDay = currentDate.endsWith('-09-01') || currentDate.endsWith('-01-31');
  const activityChance = isDeadlineDay ? 0.40 : 0.09;

  if (Math.random() > activityChance) {
    return {
      updatedPlayers: allPlayers,
      updatedClubs: allClubs,
      completedNews: [],
    };
  }

  // Pick buyer AI club with budget
  const aiBuyerClubs = allClubs.filter(
    (c) => c.id !== userClubId && c.transferBudget > 3000000 && c.balance > 4000000
  );
  if (aiBuyerClubs.length === 0) {
    return { updatedPlayers: allPlayers, updatedClubs: allClubs, completedNews: [] };
  }

  const buyerClub = aiBuyerClubs[Math.floor(Math.random() * aiBuyerClubs.length)];
  const buyerSquad = allPlayers.filter((p) => p.clubId === buyerClub.id);
  const needCategory = identifyClubSquadNeed(buyerSquad) || 'MID';

  // Find candidate target from other AI clubs (exclude user club players here to keep AI-to-user bids in transferProcessor)
  const candidatePlayers = allPlayers.filter(
    (p) =>
      p.clubId !== userClubId &&
      p.clubId !== buyerClub.id &&
      getPlayerCategory(p.position) === needCategory &&
      p.marketValue <= buyerClub.transferBudget * 0.70 &&
      p.overall >= 68
  );

  if (candidatePlayers.length === 0) {
    return { updatedPlayers: allPlayers, updatedClubs: allClubs, completedNews: [] };
  }

  const targetPlayer = candidatePlayers[Math.floor(Math.random() * candidatePlayers.length)];
  const sellerClub = allClubs.find((c) => c.id === targetPlayer.clubId);
  if (!sellerClub) {
    return { updatedPlayers: allPlayers, updatedClubs: allClubs, completedNews: [] };
  }

  const valuation = calculatePlayerValuation(targetPlayer, sellerClub, buyerClub, currentDate);
  if (valuation.isNotForSale) {
    return { updatedPlayers: allPlayers, updatedClubs: allClubs, completedNews: [] };
  }

  // Complete AI-to-AI deal
  const agreedFee = valuation.fairValue;
  const transferPackage: TransferOfferPackage = {
    upfrontFee: Math.round(agreedFee * 0.75),
    installmentsFee: Math.round(agreedFee * 0.25),
    installmentsMonths: 12,
    bonuses: [],
  };

  const demands = calculatePlayerContractDemands(targetPlayer, buyerClub, 'İlk 11');
  const contractPackage: ContractOfferPackage = {
    wage: demands.wage,
    durationYears: demands.durationYears,
    squadRole: 'İlk 11',
    signingBonus: demands.signingBonus,
    appearanceBonus: demands.appearanceBonus,
    goalBonus: demands.goalBonus,
    cleanSheetBonus: demands.cleanSheetBonus,
  };

  const buyerFinances: FinanceSummary = {
    clubBalance: buyerClub.balance,
    transferBudget: buyerClub.transferBudget,
    wageBudget: buyerClub.wageBudget,
    weeklyWages: buyerClub.weeklyWageExpense,
    incomeCategories: { matchdayTickets: 0, sponsorships: 0, broadcasting: 0, merchandising: 0, playerSales: 0 },
    expenseCategories: { playerWages: 0, staffWages: 0, scoutingNetwork: 0, stadiumMaintenance: 0, academyYouth: 0, playerSignings: 0 },
    monthlyHistory: [],
  };

  const transferResult = executeTransferCompletion({
    player: targetPlayer,
    sellerClub,
    buyerClub,
    transferPackage,
    contractPackage,
    currentDate,
    seasonYear,
    buyerFinances,
  });

  const updatedPlayers = allPlayers.map((p) =>
    p.id === targetPlayer.id ? transferResult.updatedPlayer : p
  );

  const updatedClubs = allClubs.map((c) => {
    if (c.id === buyerClub.id) return transferResult.updatedBuyerClub;
    if (sellerClub && c.id === sellerClub.id && transferResult.updatedSellerClub) {
      return transferResult.updatedSellerClub;
    }
    return c;
  });

  const completedNews: NewsItem[] = transferResult.newsItem ? [transferResult.newsItem] : [];

  return {
    updatedPlayers,
    updatedClubs,
    completedNews,
  };
}
