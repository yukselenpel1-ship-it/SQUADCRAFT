import { Club, FinanceSummary, Fixture } from '@/types/game';
import { FutureTransferCommitment } from '../negotiation/types';

export interface FinanceProcessingResult {
  updatedFinances: FinanceSummary;
  weeklyWagesDeducted: boolean;
  wageDeducted?: boolean;
  wageAmount?: number;
  monthlyCashflowProcessed: boolean;
  sponsorCredited?: boolean;
  sponsorAmount?: number;
  matchdayIncomeAdded: number;
  updatedCommitments?: FutureTransferCommitment[];
  dueCommitmentsProcessed?: number;
}

export function calculateFixtureAttendance(homeClub: Club, awayClub: Club, round: number): number {
  const capacity = homeClub.stadiumCapacity || 30000;
  const baseFillRatio = 0.65 + (homeClub.reputation / 100) * 0.25;
  const derbyBonus = awayClub.reputation > 80 ? 0.08 : 0;
  const variance = (Math.random() - 0.5) * 0.06;

  const finalRatio = Math.min(0.99, Math.max(0.40, baseFillRatio + derbyBonus + variance));
  return Math.round(capacity * finalRatio);
}

export function processDailyFinances(
  arg1: string | FinanceSummary,
  arg2: FinanceSummary | string,
  arg3?: Club | Club[],
  arg4?: any,
  arg5?: Fixture | Fixture[] | FutureTransferCommitment[],
  arg6?: string | FutureTransferCommitment[],
  arg7?: FutureTransferCommitment[]
): FinanceProcessingResult {
  let currentDate: string;
  let finances: FinanceSummary;
  let userClub: Club;
  let playedHomeFixture: Fixture | undefined;
  let commitments: FutureTransferCommitment[] = [];

  if (typeof arg1 === 'string') {
    currentDate = arg1;
    finances = arg2 as FinanceSummary;
    userClub = (arg3 as Club) || { id: 'kalyon-doruk', name: 'Kulüp', balance: finances.clubBalance, reputation: 80 };
    playedHomeFixture = arg4 as Fixture | undefined;
    commitments = (arg5 as FutureTransferCommitment[]) || [];
  } else {
    finances = arg1 as FinanceSummary;
    currentDate = arg2 as string;
    const clubsList = Array.isArray(arg3) ? arg3 : [arg3 as Club];
    const userClubId = typeof arg6 === 'string' ? arg6 : 'kalyon-doruk';
    userClub = clubsList.find((c) => c?.id === userClubId) || clubsList[0] || { id: userClubId, name: 'Kulüp', balance: finances.clubBalance, reputation: 80 };
    
    if (Array.isArray(arg5)) {
      playedHomeFixture = (arg5 as Fixture[]).find(
        (f) => f.date === currentDate && f.homeClubId === userClubId && f.status === 'FINISHED'
      );
    }
    commitments = arg7 || (Array.isArray(arg6) ? arg6 : []);
  }

  const [, month, day] = currentDate.split('-');
  let clubBalance = finances.clubBalance;
  let weeklyWagesDeducted = false;
  let wageAmount = 0;
  let monthlyCashflowProcessed = false;
  let sponsorAmount = 0;
  let matchdayIncomeAdded = 0;

  // 1. Weekly Wage Deduction (Every Monday, or day of week === 1)
  const d = new Date(currentDate);
  if (d.getDay() === 1) { // Monday
    const weeklyWages = finances.weeklyWages || finances.weeklyWageBill || 315000;
    clubBalance -= weeklyWages;
    weeklyWagesDeducted = true;
    wageAmount = weeklyWages;
  }

  // 2. Match Day Ticket Revenue (if user club played at home)
  if (playedHomeFixture) {
    const attendance = playedHomeFixture.attendance || calculateFixtureAttendance(userClub, userClub, playedHomeFixture.round);
    const ticketPrice = 35; // Average ticket price €35
    matchdayIncomeAdded = attendance * ticketPrice;
    clubBalance += matchdayIncomeAdded;
  }

  // 3. Monthly Sponsorship & Maintenance Installment (1st of each month)
  let updatedMonthlyHistory = [...(finances.monthlyHistory || [])];
  if (day === '01') {
    const monthlySponsorship = Math.round((finances.incomeCategories?.sponsorships || 24000000) / 12);
    const monthlyBroadcasting = Math.round((finances.incomeCategories?.broadcasting || 18000000) / 12);
    const monthlyFacilityCost = Math.round(
      (finances.expenseCategories?.stadiumMaintenance || 2500000) / 12 +
      (finances.expenseCategories?.staffWages || 1800000) / 12
    );

    const netMonthly = monthlySponsorship + monthlyBroadcasting - monthlyFacilityCost;
    clubBalance += netMonthly;
    monthlyCashflowProcessed = true;
    sponsorAmount = monthlySponsorship + monthlyBroadcasting;

    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthName = `${monthNames[Number(month) - 1]} ${d.getFullYear()}`;

    updatedMonthlyHistory.push({
      month: monthName,
      income: monthlySponsorship + monthlyBroadcasting,
      expense: monthlyFacilityCost,
      net: netMonthly,
    });
  }

  // 4. Future Transfer Installment Commitments Processing
  let dueCommitmentsProcessed = 0;
  const updatedCommitments = commitments.map((com) => {
    if (com.status === 'PENDING' && com.dueDate <= currentDate) {
      if (com.fromClubId === userClub.id) {
        clubBalance -= com.amount;
      } else if (com.toClubId === userClub.id) {
        clubBalance += com.amount;
      }
      dueCommitmentsProcessed++;
      return { ...com, status: 'PAID' as const };
    }
    return com;
  });

  return {
    updatedFinances: {
      ...finances,
      clubBalance,
      monthlyHistory: updatedMonthlyHistory.slice(-6),
    },
    weeklyWagesDeducted,
    wageDeducted: weeklyWagesDeducted,
    wageAmount,
    monthlyCashflowProcessed,
    sponsorCredited: monthlyCashflowProcessed,
    sponsorAmount,
    matchdayIncomeAdded,
    updatedCommitments,
    dueCommitmentsProcessed,
  };
}
