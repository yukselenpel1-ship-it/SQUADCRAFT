import { Player, Club, FinanceSummary, ClubTactics, InboxMessage } from '@/types/game';
import {
  LoanOfferPackage,
  LoanAgreement,
  LoanNegotiationResponse,
  LoanDurationType,
} from './types';
import { addDaysToDate } from '../career/calendar';
import { NewsItem } from '../career/types';
import { getSquadRoleInfo } from '../negotiation/squadRole';

/**
 * Calculates the exact end date for a loan based on duration type and current date.
 */
export function calculateLoanEndDate(
  duration: LoanDurationType,
  currentDate: string,
  seasonYear: string = '2026/27'
): { endDate: string; durationMonths: number; durationLabel: string } {
  const [yearStr] = currentDate.split('-');
  const currYear = parseInt(yearStr, 10);

  switch (duration) {
    case '3_MONTHS':
      return {
        endDate: addDaysToDate(currentDate, 90),
        durationMonths: 3,
        durationLabel: '3 Ay',
      };
    case '6_MONTHS':
      return {
        endDate: addDaysToDate(currentDate, 180),
        durationMonths: 6,
        durationLabel: '6 Ay',
      };
    case '1_YEAR':
      return {
        endDate: addDaysToDate(currentDate, 365),
        durationMonths: 12,
        durationLabel: '1 Yıl',
      };
    case 'SEASON_END':
    default:
      const endYear = currentDate > `${currYear}-06-30` ? currYear + 1 : currYear;
      return {
        endDate: `${endYear}-06-30`,
        durationMonths: 10,
        durationLabel: 'Sezon Sonu',
      };
  }
}

export interface EvaluateLoanOfferParams {
  player: Player;
  parentClub: Club;
  borrowerClub: Club;
  offerPackage: LoanOfferPackage;
  borrowerFinances?: FinanceSummary;
  currentDate?: string;
}

/**
 * Evaluates a loan offer submitted to a parent club.
 * Supports both object params and positional params.
 */
export function evaluateLoanOffer(
  playerOrParams: Player | EvaluateLoanOfferParams,
  parentClubArg?: Club,
  borrowerClubArg?: Club,
  offerArg?: LoanOfferPackage,
  currentDateArg: string = '2026-08-01'
): LoanNegotiationResponse {
  let player: Player;
  let parentClub: Club;
  let borrowerClub: Club;
  let offer: LoanOfferPackage;
  let currentDate: string = currentDateArg;

  if ('player' in playerOrParams) {
    player = playerOrParams.player;
    parentClub = playerOrParams.parentClub;
    borrowerClub = playerOrParams.borrowerClub;
    offer = playerOrParams.offerPackage;
    currentDate = playerOrParams.currentDate || '2026-08-01';
  } else {
    player = playerOrParams;
    parentClub = parentClubArg!;
    borrowerClub = borrowerClubArg!;
    offer = offerArg!;
  }

  // 1. Check player's contract duration vs loan duration
  const { endDate } = calculateLoanEndDate(offer.duration, currentDate, '2026/27');
  const contractEnd = player.contractEnd || `${player.contractUntil || 2028}-06-30`;

  if (contractEnd < endDate) {
    return {
      decision: 'REJECTED',
      feedback: `${parentClub.name}: "Oyuncunun mevcut sözleşmesi kiralama süresinden önce sona eriyor. Kiralama mümkün değil."`,
      patienceRemaining: 0,
    };
  }

  // 2. Evaluate playing time promise
  const isYoungProspect = player.age <= 22 && player.potential >= player.overall + 5;

  if (isYoungProspect && ['Yedek', 'Rotasyon'].includes(offer.playingTimePromise)) {
    return {
      decision: 'REJECTED',
      feedback: `${parentClub.name}: "Genç yeteneğimizin gelişimi için düzenli maç dakikaları alması şarttır. Yedek veya rotasyon rolünü kabul etmiyoruz."`,
      patienceRemaining: 1,
    };
  }

  // 3. Evaluate Wage Contribution & Loan Fee
  const minWageContribution = isYoungProspect ? 50 : 80;

  if (offer.wageContributionPercentage < minWageContribution) {
    const counterOffer: LoanOfferPackage = {
      ...offer,
      wageContributionPercentage: minWageContribution,
      upfrontLoanFee: Math.max(offer.upfrontLoanFee, Math.round(player.marketValue * 0.05)),
      playingTimePromise: isYoungProspect ? 'İlk 11' : offer.playingTimePromise,
    };

    return {
      decision: 'COUNTER_OFFER',
      feedback: `${parentClub.name}: "Maaş katkısı yetersiz. Oyuncunun haftalık maaşının en az %${minWageContribution}'sini karşılamanızı talep ediyoruz."`,
      counterOffer,
      patienceRemaining: 2,
    };
  }

  return {
    decision: 'ACCEPTED',
    feedback: `${parentClub.name} kulübü sunduğunuz kiralama teklifini memnuniyetle kabul etti.`,
    patienceRemaining: 3,
  };
}

export interface ExecuteLoanOfferAcceptanceParams {
  player: Player;
  parentClub: Club;
  borrowerClub: Club;
  offerPackage: LoanOfferPackage;
  currentDate: string;
  seasonYear?: string;
  buyerFinances: FinanceSummary;
}

export interface LoanExecutionResult {
  updatedPlayer: Player;
  updatedParentClub?: Club;
  updatedBorrowerClub?: Club;
  updatedFinances: FinanceSummary;
  loanAgreement: LoanAgreement;
  inboxMessage: InboxMessage;
  newsItem: NewsItem;
}

/**
 * Atomically executes loan offer acceptance.
 */
export function executeLoanOfferAcceptance({
  player,
  parentClub,
  borrowerClub,
  offerPackage,
  currentDate,
  seasonYear = '2026/27',
  buyerFinances,
}: ExecuteLoanOfferAcceptanceParams): LoanExecutionResult {
  const { endDate, durationMonths, durationLabel } = calculateLoanEndDate(
    offerPackage.duration,
    currentDate,
    seasonYear
  );

  const wageBorrowerShare = Math.round(player.wage * (offerPackage.wageContributionPercentage / 100));
  const wageParentShare = player.wage - wageBorrowerShare;

  const loanAgreement: LoanAgreement = {
    id: `loan-${Date.now()}-${player.id}`,
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    playerOverall: player.overall,
    parentClubId: parentClub.id,
    parentClubName: parentClub.name,
    borrowerClubId: borrowerClub.id,
    borrowerClubName: borrowerClub.name,
    startDate: currentDate,
    endDate,
    durationMonths,
    durationLabel,
    upfrontLoanFee: offerPackage.upfrontLoanFee,
    monthlyLoanFee: offerPackage.monthlyLoanFee,
    wageContributionPercentage: offerPackage.wageContributionPercentage,
    parentWageShare: wageParentShare,
    borrowerWageShare: wageBorrowerShare,
    buyOption: offerPackage.buyOption,
    canRecall: offerPackage.canRecall,
    playingTimePromise: offerPackage.playingTimePromise,
    status: 'ACTIVE',
  };

  const updatedPlayer: Player = {
    ...player,
    clubId: borrowerClub.id,
    squadRole: offerPackage.playingTimePromise,
    isLoaned: true,
  };

  const updatedFinances: FinanceSummary = {
    ...buyerFinances,
    clubBalance: buyerFinances.clubBalance - offerPackage.upfrontLoanFee,
  };

  const inboxMessage: InboxMessage = {
    id: `msg-loan-${Date.now()}-${player.id}`,
    clubId: borrowerClub.id,
    senderName: 'Futbol Direktörü',
    senderRole: 'Transfer Komitesi',
    subject: `Kiralık Anlaşma Tamamlandı: ${player.firstName} ${player.lastName}`,
    preview: `${player.firstName} ${player.lastName}, ${parentClub.name} kulübünden kiralandı (${durationLabel}).`,
    body: `Sayın Menajer,\n\n${parentClub.name} kulübünden ${player.firstName} ${player.lastName} (${player.position}) ile ${durationLabel} süreli kiralık sözleşme imzalanmıştır.\n\nMaaş Katkı Oranımız: %${offerPackage.wageContributionPercentage} (€${wageBorrowerShare.toLocaleString('tr-TR')}/hf)\nKiralama Bitiş: ${endDate}\n${
      offerPackage.buyOption
        ? `Satın Alma Maddesi: €${offerPackage.buyOption.fee.toLocaleString('tr-TR')} (${offerPackage.buyOption.isMandatory ? 'Zorunlu' : 'Opsiyonel'})\n`
        : ''
    }Geri Çağırma Maddesi: ${offerPackage.canRecall ? 'Var' : 'Yok'}\n\nOyuncumuz yarından itibaren takımla çalışmalara başlayacaktır.`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'HIGH',
  };

  const newsItem: NewsItem = {
    id: `news-loan-${Date.now()}-${player.id}`,
    date: currentDate,
    category: 'TRANSFER',
    headline: `KİRALIK: ${player.firstName} ${player.lastName} ${borrowerClub.name}'da!`,
    content: `${borrowerClub.name}, ${parentClub.name}'dan ${player.position} mevkiinde görev yapan ${player.firstName} ${player.lastName}'ı ${durationLabel} süreliğine kiraladı.`,
    importance: player.overall >= 76 ? 'HIGH' : 'NORMAL',
    clubId: borrowerClub.id,
    playerId: player.id,
  };

  return {
    updatedPlayer,
    updatedFinances,
    loanAgreement,
    inboxMessage,
    newsItem,
  };
}

export const executeLoanAgreement = executeLoanOfferAcceptance;

/**
 * Handles expiration or early termination of a loan agreement.
 */
export function terminateOrExpireLoan(
  loan: LoanAgreement,
  player: Player,
  currentDate: string = '2027-06-30'
): {
  updatedPlayer: Player;
  updatedLoan: LoanAgreement;
  inboxMessage: InboxMessage;
} {
  // If mandatory buy option existed, convert to permanent deal
  if (loan.buyOption?.isMandatory) {
    const updatedPlayer: Player = {
      ...player,
      clubId: loan.borrowerClubId,
      isLoaned: false,
    };
    const updatedLoan: LoanAgreement = {
      ...loan,
      status: 'BOUGHT_PERMANENT',
    };
    const inboxMessage: InboxMessage = {
      id: `msg-loan-mand-${Date.now()}-${player.id}`,
      clubId: loan.borrowerClubId,
      senderName: 'Mali İşler Departmanı',
      senderRole: 'Transfer Komitesi',
      subject: `Zorunlu Satın Alma Gerçekleşti: ${player.firstName} ${player.lastName}`,
      preview: `${player.firstName} ${player.lastName}'ın zorunlu satın alma opsiyonu kullanıldı ve bonservisi alındı.`,
      body: `Kiralama sözleşmesindeki zorunlu satın alma maddesi gereğince €${loan.buyOption.fee.toLocaleString('tr-TR')} ödenerek oyuncunun bonservisi kulübümüze geçmiştir.`,
      date: currentDate,
      category: 'TRANSFER',
      isRead: false,
      priority: 'HIGH',
    };
    return { updatedPlayer, updatedLoan, inboxMessage };
  }

  const updatedPlayer: Player = {
    ...player,
    clubId: loan.parentClubId,
    isLoaned: false,
  };

  const updatedLoan: LoanAgreement = {
    ...loan,
    status: 'EXPIRED',
  };

  const inboxMessage: InboxMessage = {
    id: `msg-loan-end-${Date.now()}-${player.id}`,
    clubId: loan.borrowerClubId,
    senderName: 'Kulüp Sekreteri',
    senderRole: 'İdari İşler',
    subject: `Kiralık Sözleşmesi Sona Erdi: ${player.firstName} ${player.lastName}`,
    preview: `${player.firstName} ${player.lastName}'ın kiralık süresi dolmuş ve kulübüne dönmüştür.`,
    body: `Sayın Menajer,\n\n${loan.parentClubName} kulübünden kiraladığımız ${player.firstName} ${player.lastName} (${player.position}) kiralık sözleşmesinin sona ermesiyle birlikte ana kulübüne geri dönmüştür. Kulübümüze verdiği emekler için teşekkür ederiz.`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'NORMAL',
  };

  return {
    updatedPlayer,
    updatedLoan,
    inboxMessage,
  };
}

/**
 * Recalls a loaned player back to parent club early.
 */
export function recallLoanPlayer(
  loan: LoanAgreement,
  player: Player,
  currentDate: string,
  requestingClubId: string
): {
  success: boolean;
  message: string;
  updatedPlayer: Player;
  updatedLoan: LoanAgreement;
  inboxMessage: InboxMessage;
} {
  if (!loan.canRecall) {
    return {
      success: false,
      message: 'Bu kiralık anlaşmasında geri çağırma (recall) maddesi bulunmamaktadır.',
      updatedPlayer: player,
      updatedLoan: loan,
      inboxMessage: {} as any,
    };
  }

  const updatedPlayer: Player = {
    ...player,
    clubId: loan.parentClubId,
    isLoaned: false,
  };

  const updatedLoan: LoanAgreement = {
    ...loan,
    status: 'RECALLED',
  };

  const inboxMessage: InboxMessage = {
    id: `msg-recall-${Date.now()}-${player.id}`,
    clubId: loan.borrowerClubId,
    senderName: 'Kulüp Sekreterliği',
    senderRole: 'Transfer Komitesi',
    subject: `Geri Çağırma Bildirimi: ${player.firstName} ${player.lastName}`,
    preview: `${loan.parentClubName}, oyuncusu ${player.firstName} ${player.lastName}'ı kiralıktan geri çağırdı.`,
    body: `Sözleşmedeki geri çağırma maddesi işletilerek ${player.firstName} ${player.lastName} ana kulübü ${loan.parentClubName}'na geri dönmüştür.`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'HIGH',
  };

  return {
    success: true,
    message: `${player.firstName} ${player.lastName} başarıyla ana kulübüne geri çağrıldı.`,
    updatedPlayer,
    updatedLoan,
    inboxMessage,
  };
}

/**
 * Exercises optional buyout clause to purchase player permanently.
 */
export function exerciseBuyOption(
  loan: LoanAgreement,
  player: Player,
  buyerFinances: FinanceSummary,
  currentDate: string
): {
  success: boolean;
  message: string;
  updatedPlayer: Player;
  updatedLoan: LoanAgreement;
  updatedFinances: FinanceSummary;
  inboxMessage: InboxMessage;
  newsItem: NewsItem;
} {
  if (!loan.buyOption) {
    return {
      success: false,
      message: 'Bu anlaşmada satın alma opsiyonu bulunmamaktadır.',
      updatedPlayer: player,
      updatedLoan: loan,
      updatedFinances: buyerFinances,
      inboxMessage: {} as any,
      newsItem: {} as any,
    };
  }

  if (buyerFinances.clubBalance < loan.buyOption.fee) {
    return {
      success: false,
      message: 'Opsiyon bedeli için kulüp kasasında yeterli bakiye bulunmamaktadır.',
      updatedPlayer: player,
      updatedLoan: loan,
      updatedFinances: buyerFinances,
      inboxMessage: {} as any,
      newsItem: {} as any,
    };
  }

  const updatedPlayer: Player = {
    ...player,
    clubId: loan.borrowerClubId,
    isLoaned: false,
    contractUntil: '2030',
  };

  const updatedLoan: LoanAgreement = {
    ...loan,
    status: 'BOUGHT_PERMANENT',
  };

  const updatedFinances: FinanceSummary = {
    ...buyerFinances,
    clubBalance: buyerFinances.clubBalance - loan.buyOption.fee,
  };

  const inboxMessage: InboxMessage = {
    id: `msg-buyopt-${Date.now()}-${player.id}`,
    clubId: loan.borrowerClubId,
    senderName: 'Futbol Direktörü',
    senderRole: 'Transfer Komitesi',
    subject: `Satın Alma Opsiyonu Kullanıldı: ${player.firstName} ${player.lastName}`,
    preview: `${player.firstName} ${player.lastName} bonservisiyle kulübümüze katıldı (€${loan.buyOption.fee.toLocaleString('tr-TR')}).`,
    body: `Tebrikler! ${loan.parentClubName} ile yapılan kiralık sözleşmesindeki satın alma opsiyonu kullanılmış ve ${player.firstName} ${player.lastName} kulübümüzün kalıcı futbolcusu olmuştur.`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'HIGH',
  };

  const newsItem: NewsItem = {
    id: `news-buyopt-${Date.now()}-${player.id}`,
    date: currentDate,
    category: 'TRANSFER',
    headline: `RESMİ: ${player.firstName} ${player.lastName} ${loan.borrowerClubName}'da Kaldı!`,
    content: `${loan.borrowerClubName}, kiralık olarak forma giyen ${player.firstName} ${player.lastName}'ın €${(loan.buyOption.fee / 1_000_000).toFixed(1)}M tutarındaki satın alma opsiyonunu kullandı.`,
    importance: 'HIGH',
    clubId: loan.borrowerClubId,
    playerId: player.id,
  };

  return {
    success: true,
    message: `${player.firstName} ${player.lastName} kalıcı olarak kulübümüze transfer oldu.`,
    updatedPlayer,
    updatedLoan,
    updatedFinances,
    inboxMessage,
    newsItem,
  };
}
