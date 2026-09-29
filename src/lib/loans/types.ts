import { Player, Club, SquadRole } from '@/types/game';

// ============================================================================
// LOAN DURATIONS & ROLES
// ============================================================================
export type LoanDurationType = '3_MONTHS' | '6_MONTHS' | 'SEASON_END' | '1_YEAR';

export interface LoanBuyOption {
  isMandatory: boolean; // false = Opsiyonel, true = Zorunlu Satın Alma
  fee: number; // €
  isTriggered?: boolean;
}

export interface LoanOfferPackage {
  duration: LoanDurationType;
  upfrontLoanFee: number; // Peşin kiralama bedeli (€)
  monthlyLoanFee: number; // Aylık kiralama bedeli (€)
  wageContributionPercentage: number; // 0% - 100% (borrower pays this share of wage)
  buyOption?: LoanBuyOption;
  canRecall: boolean; // Parent club early recall clause
  playingTimePromise: SquadRole;
}

export interface LoanAgreement {
  id: string;
  playerId: string;
  playerName: string;
  playerOverall: number;
  parentClubId: string;
  parentClubName: string;
  borrowerClubId: string;
  borrowerClubName: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  durationLabel: string;
  upfrontLoanFee: number;
  monthlyLoanFee: number;
  wageContributionPercentage: number;
  parentWageShare: number; // weekly € paid by parent
  borrowerWageShare: number; // weekly € paid by borrower
  buyOption?: LoanBuyOption;
  canRecall: boolean;
  playingTimePromise: SquadRole;
  status: 'ACTIVE' | 'EXPIRED' | 'RECALLED' | 'BOUGHT_PERMANENT';
}

export interface LoanNegotiationResponse {
  decision: 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER';
  feedback: string;
  counterOffer?: LoanOfferPackage;
  patienceRemaining: number;
}
