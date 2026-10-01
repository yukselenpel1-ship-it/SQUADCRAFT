import {
  Club,
  Player,
  LeagueStanding,
  Fixture,
  InboxMessage,
  FinanceSummary,
} from '@/types/game';
import { ClubCareerHistory } from './types';
import { generateSeasonFixtures } from './fixtureGenerator';

export interface SeasonEndSummary {
  seasonYear: string;
  championClubName: string;
  userClubRank: number;
  userClubPoints: number;
  topScorerName: string;
  topScorerGoals: number;
  continentalClubs: string[];
  relegatedClubs: string[];
}

export interface SeasonBudgetResult {
  updatedClub: Club;
  newFinances?: FinanceSummary;
  prizeMoney: number;
  sponsorshipIncome: number;
  ticketProjection: number;
  broadcastingIncome: number;
  operatingCosts: number;
  newTransferBudget: number;
  newWageBudget: number;
  newBalance: number;
}

/**
 * Calculates authentic end-of-season financial adjustments for a club.
 * Implements realistic prize money, sponsorship, ticket projections,
 * and board-allocated transfer budgets without runaway inflation.
 */
export function calculateSeasonBudgets(
  club: Club,
  rank: number,
  totalClubs: number = 18,
  isUserClub: boolean = false,
  existingFinances?: FinanceSummary
): SeasonBudgetResult {
  // 1. Prize Money based on ranking (for 18-club league)
  let basePrize = 1_500_000;
  if (rank === 1) basePrize = 12_000_000;
  else if (rank === 2) basePrize = 9_500_000;
  else if (rank === 3) basePrize = 7_500_000;
  else if (rank === 4) basePrize = 6_000_000;
  else if (rank === 5) basePrize = 5_000_000;
  else if (rank === 6) basePrize = 4_200_000;
  else if (rank === 7) basePrize = 3_600_000;
  else if (rank === 8) basePrize = 3_100_000;
  else if (rank === 9) basePrize = 2_700_000;
  else if (rank <= 12) basePrize = 2_300_000;
  else if (rank <= 15) basePrize = 1_900_000;
  else basePrize = 1_500_000;

  const prizeMoney = Math.round(basePrize * (0.90 + (club.reputation / 100) * 0.20));

  // 2. New Season Sponsorship
  const repBonus = Math.max(0, (club.reputation - 65) * 220_000);
  const champBonus = rank === 1 ? 4_500_000 : rank <= 3 ? 2_000_000 : 0;
  const sponsorshipIncome = Math.round(6_000_000 + repBonus + champBonus);

  // 3. Matchday & Season Ticket Projection
  const occupancyRate = Math.min(0.95, 0.65 + (rank <= 3 ? 0.25 : rank <= 6 ? 0.15 : 0.05));
  const ticketProjection = Math.round(club.stadiumCapacity * occupancyRate * 300);

  // 4. Broadcasting & Merchandising
  const broadcastingIncome = Math.round(11_000_000 + (totalClubs - rank + 1) * 350_000);
  const merchandisingIncome = Math.round(1_800_000 + (club.reputation / 100) * 2_500_000);

  // 5. Operating Overhead, Taxes, Infrastructure & Maintenance
  // Prevents infinite accumulation of cash
  const annualWages = club.weeklyWageExpense * 52;
  const grossIncome = prizeMoney + sponsorshipIncome + ticketProjection + broadcastingIncome + merchandisingIncome;
  const operatingCosts = Math.round(grossIncome * 0.32 + 3_500_000);

  // Net annual surplus before transfer investments
  const netSeasonSurplus = grossIncome - operatingCosts - annualWages;

  // 6. Club Balance (Kasa)
  // Carry over 60% of existing liquid cash, plus net seasonal surplus
  // Clamped realistically between €4M and €45M
  const rawBalance = Math.round(club.balance * 0.60 + Math.max(1_500_000, netSeasonSurplus));
  const newBalance = Math.max(4_000_000, Math.min(45_000_000, rawBalance));

  // 7. Board Transfer Budget Allocation (Separate from total Club Balance)
  // Champions and top-3 get 45-55% of balance, mid-table gets 35-45%, lower gets 25-35%
  let transferRatio = 0.38;
  if (rank === 1) transferRatio = 0.52;
  else if (rank <= 3) transferRatio = 0.46;
  else if (rank <= 6) transferRatio = 0.40;
  else transferRatio = 0.30;

  const newTransferBudget = Math.round((newBalance * transferRatio * 2) / 250_000) * 250_000;

  // 8. Weekly Wage Budget
  const totalRevenue = sponsorshipIncome + ticketProjection + broadcastingIncome + merchandisingIncome;
  const targetWeeklyWage = Math.round((totalRevenue * 0.48) / 52 / 5_000) * 5_000;
  const newWageBudget = Math.max(180_000, Math.min(850_000, targetWeeklyWage));

  const updatedClub: Club = {
    ...club,
    balance: newBalance,
    transferBudget: newTransferBudget,
    wageBudget: newWageBudget,
  };

  let newFinances: FinanceSummary | undefined;
  if (isUserClub) {
    newFinances = {
      clubBalance: newBalance,
      transferBudget: newTransferBudget,
      wageBudget: newWageBudget,
      weeklyWages: club.weeklyWageExpense,
      incomeCategories: {
        matchdayTickets: ticketProjection,
        sponsorships: sponsorshipIncome,
        broadcasting: broadcastingIncome,
        merchandising: merchandisingIncome,
        playerSales: 0,
      },
      expenseCategories: {
        playerWages: annualWages,
        staffWages: Math.round(operatingCosts * 0.30),
        scoutingNetwork: 750_000,
        stadiumMaintenance: Math.round(operatingCosts * 0.25),
        academyYouth: 1_200_000,
        playerSignings: 0,
      },
      monthlyHistory: [
        {
          month: 'Yeni Sezon Açılışı',
          income: prizeMoney + sponsorshipIncome + ticketProjection,
          expense: operatingCosts / 4,
          net: prizeMoney + sponsorshipIncome + ticketProjection - (operatingCosts / 4),
        },
      ],
    };
  }

  return {
    updatedClub,
    newFinances,
    prizeMoney,
    sponsorshipIncome,
    ticketProjection,
    broadcastingIncome,
    operatingCosts,
    newTransferBudget,
    newWageBudget,
    newBalance,
  };
}

export function evaluateSeasonEnd(
  seasonYear: string,
  standings: LeagueStanding[],
  clubs: Club[],
  players: Player[],
  userClubId: string
): SeasonEndSummary {
  const sorted = [...standings].sort((a, b) => b.points - a.points);
  const champClub = clubs.find((c) => c.id === sorted[0]?.clubId);
  const userStanding = sorted.find((s) => s.clubId === userClubId);

  const topScorer = [...players]
    .filter((p) => (p.seasonStats?.goals || 0) > 0)
    .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))[0];

  const continentalClubs = sorted.slice(0, 3).map((s) => clubs.find((c) => c.id === s.clubId)?.name || '');
  const relegatedClubs = sorted.slice(-2).map((s) => clubs.find((c) => c.id === s.clubId)?.name || '');

  return {
    seasonYear,
    championClubName: champClub?.name || 'Şampiyon Kulüp',
    userClubRank: userStanding?.rank || 1,
    userClubPoints: userStanding?.points || 0,
    topScorerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Yok',
    topScorerGoals: topScorer?.seasonStats?.goals || 0,
    continentalClubs,
    relegatedClubs,
  };
}

export function startNewSeason(
  currentSeasonYear: string,
  clubs: Club[],
  players: Player[],
  standings: LeagueStanding[],
  userClubId: string,
  currentFinances?: FinanceSummary
): {
  newSeasonYear: string;
  newCurrentDate: string;
  newFixtures: Fixture[];
  newStandings: LeagueStanding[];
  resetPlayers: Player[];
  updatedClubs: Club[];
  newFinances: FinanceSummary;
  archivedHistory: ClubCareerHistory[];
  boardMessage: InboxMessage;
} {
  // Parse year "2026/27" -> "2027/28"
  const startYear = parseInt(currentSeasonYear.split('/')[0], 10) + 1;
  const endYearShort = (startYear + 1).toString().slice(-2);
  const newSeasonYear = `${startYear}/${endYearShort}`;
  const newCurrentDate = `${startYear}-08-01`;

  // 1. Archive previous season for user club
  const userStanding = standings.find((s) => s.clubId === userClubId);
  const userClub = clubs.find((c) => c.id === userClubId);
  const userPlayers = players.filter((p) => p.clubId === userClubId);
  const topScorer = [...userPlayers].sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))[0];

  const archivedEntry: ClubCareerHistory = {
    seasonYear: currentSeasonYear,
    clubId: userClubId,
    clubName: userClub?.name || 'Kalyon Doruk SK',
    rank: userStanding?.rank || 1,
    points: userStanding?.points || 0,
    won: userStanding?.won || 0,
    drawn: userStanding?.drawn || 0,
    lost: userStanding?.lost || 0,
    goalsFor: userStanding?.goalsFor || 0,
    goalsAgainst: userStanding?.goalsAgainst || 0,
    topScorerName: topScorer ? `${topScorer.firstName} ${topScorer.lastName}` : 'Yok',
    topScorerGoals: topScorer?.seasonStats?.goals || 0,
    averageRating: 7.2,
  };

  // 2. Budget Recalculation for All Clubs (User & AI)
  let updatedUserFinances: FinanceSummary | undefined;
  let userBudgetDetails: SeasonBudgetResult | undefined;

  const updatedClubs: Club[] = clubs.map((club) => {
    const clubStanding = standings.find((s) => s.clubId === club.id);
    const clubRank = clubStanding?.rank || 5;
    const isUser = club.id === userClubId;

    const res = calculateSeasonBudgets(club, clubRank, clubs.length, isUser, currentFinances);
    if (isUser) {
      updatedUserFinances = res.newFinances;
      userBudgetDetails = res;
    }
    return res.updatedClub;
  });

  // Fallback finances if needed
  const finalFinances: FinanceSummary = updatedUserFinances || {
    clubBalance: userClub?.balance || 15_000_000,
    transferBudget: userClub?.transferBudget || 8_000_000,
    wageBudget: userClub?.wageBudget || 350_000,
    weeklyWages: userClub?.weeklyWageExpense || 280_000,
    incomeCategories: {
      matchdayTickets: 5_000_000,
      sponsorships: 9_000_000,
      broadcasting: 12_000_000,
      merchandising: 2_500_000,
      playerSales: 0,
    },
    expenseCategories: {
      playerWages: (userClub?.weeklyWageExpense || 280_000) * 52,
      staffWages: 2_000_000,
      scoutingNetwork: 750_000,
      stadiumMaintenance: 1_200_000,
      academyYouth: 1_200_000,
      playerSignings: 0,
    },
    monthlyHistory: [],
  };

  // 3. Reset Standings table for all clubs in league
  const newStandings: LeagueStanding[] = updatedClubs.map((club, idx) => ({
    rank: idx + 1,
    clubId: club.id,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));

  // 4. AI Club Contract Renewals, Age Progression & Transfers
  let updatedPlayers: Player[] = players.map((p) => {
    const isUserPlayer = p.clubId === userClubId;
    const newAge = p.age + 1;
    let contractYears = Math.max(0, (p.contractYearsLeft ?? 2) - 1);
    let wage = p.wage;
    let clubId = p.clubId;

    if (!isUserPlayer && clubId && clubId !== 'FREE_AGENT') {
      if (contractYears <= 1 && p.overall >= 72) {
        contractYears = Math.floor(Math.random() * 2) + 2;
        wage = Math.round(wage * 1.1);
      } else if (contractYears <= 1 && p.overall < 68 && newAge > 28) {
        clubId = 'FREE_AGENT';
        contractYears = 0;
      }
    }

    return {
      ...p,
      age: newAge,
      contractYearsLeft: contractYears,
      wage,
      clubId,
      fitness: 100,
      matchSharpness: 85,
      form: 7.0,
      isInjured: false,
      injuryDetails: undefined,
      isSuspended: false,
      suspensionDetails: undefined,
      seasonStats: {
        appearances: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        cleanSheets: 0,
        averageRating: 7.0,
      },
    };
  });

  // 5. AI-to-AI Club Transfers between seasons
  const aiClubs = updatedClubs.filter((c) => c.id !== userClubId);
  const transferCount = Math.min(5, Math.max(2, Math.floor(aiClubs.length / 3)));

  for (let i = 0; i < transferCount; i++) {
    const buyerClub = aiClubs[Math.floor(Math.random() * aiClubs.length)];
    const sellerClub = aiClubs.filter((c) => c.id !== buyerClub.id)[Math.floor(Math.random() * (aiClubs.length - 1))];

    if (!buyerClub || !sellerClub) continue;

    const sellerPlayers = updatedPlayers.filter((p) => p.clubId === sellerClub.id && p.overall >= 74 && p.overall <= 85);
    if (sellerPlayers.length === 0) continue;

    const targetPlayer = sellerPlayers[Math.floor(Math.random() * sellerPlayers.length)];
    if (buyerClub.transferBudget >= targetPlayer.marketValue * 0.8) {
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.id === targetPlayer.id) {
          return {
            ...p,
            clubId: buyerClub.id,
            contractYearsLeft: 3,
            wage: Math.round(p.wage * 1.15),
          };
        }
        return p;
      });
    }
  }

  // 6. Generate new fixture schedule
  const newFixtures = generateSeasonFixtures(updatedClubs, newSeasonYear, `${startYear}-08-15`);

  // 7. Comprehensive Board Welcome & Budget Allocation Message
  const prizeStr = userBudgetDetails ? `€${(userBudgetDetails.prizeMoney / 1_000_000).toFixed(1)}M` : '€4.5M';
  const sponsorStr = userBudgetDetails ? `€${(userBudgetDetails.sponsorshipIncome / 1_000_000).toFixed(1)}M` : '€9.0M';
  const tBudgetStr = userBudgetDetails ? `€${(userBudgetDetails.newTransferBudget / 1_000_000).toFixed(1)}M` : '€8.5M';
  const wBudgetStr = userBudgetDetails ? `€${(userBudgetDetails.newWageBudget / 1_000).toFixed(0)}K/hf` : '€350K/hf';
  const balanceStr = userBudgetDetails ? `€${(userBudgetDetails.newBalance / 1_000_000).toFixed(1)}M` : '€18.0M';

  const boardMessage: InboxMessage = {
    id: `msg-board-new-${Date.now()}`,
    clubId: userClubId,
    senderName: 'Yönetim Kurulu',
    senderRole: 'Kulüp Başkanı',
    subject: `Yeni Sezon Finansmanı & Hedefleri (${newSeasonYear})`,
    preview: `${newSeasonYear} sezonu bütçe paketiniz ve yönetim hedefleri belirlendi...`,
    body: `Sayın Menajer,\n\n${newSeasonYear} sezonuna resmi olarak başlamış bulunuyoruz. Geçtiğimiz sezondaki lig dereceniz (${userStanding?.rank || 1}. sıra) ve kulübümüzün mali performansı doğrultusunda yönetim kurulumuz yeni sezon bütçe planını onaylamıştır:\n\n• Lig Başarı Ödülü: ${prizeStr}\n• Yeni Sezon Sponsorluk Geliri: ${sponsorStr}\n• Toplam Kulüp Kasası: ${balanceStr}\n• Onaylanan Transfer Bütçesi: ${tBudgetStr}\n• Haftalık Maaş Limiti: ${wBudgetStr}\n\nKulüp kasamız ve transfer bütçemiz birbirinden bağımsız yönetilmektedir. Bu sezonki öncelikli hedefimiz ligi üst sıralarda bitirerek Avrupa kupalarına katılmaktır. Transfer dönemi açılmıştır.\n\nBaşarılar dileriz.\nYönetim Kurulu`,
    date: newCurrentDate,
    category: 'BOARD',
    isRead: false,
    priority: 'HIGH',
  };

  return {
    newSeasonYear,
    newCurrentDate,
    newFixtures,
    newStandings,
    resetPlayers: updatedPlayers,
    updatedClubs,
    newFinances: finalFinances,
    archivedHistory: [archivedEntry],
    boardMessage,
  };
}
