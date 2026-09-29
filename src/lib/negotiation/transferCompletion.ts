import { Player, Club, FinanceSummary, ClubTactics, InboxMessage } from '@/types/game';
import {
  TransferOfferPackage,
  ContractOfferPackage,
  FutureTransferCommitment,
  TransferHistoryRecord,
} from './types';
import { NewsItem } from '../career/types';
import { addDaysToDate, getTransferWindowStatus } from '../career/calendar';

export interface TransferExecutionInput {
  player: Player;
  sellerClub: Club | undefined;
  buyerClub: Club;
  transferPackage: TransferOfferPackage;
  contractPackage: ContractOfferPackage;
  currentDate: string;
  seasonYear: string;
  buyerFinances: FinanceSummary;
  sellerTactics?: ClubTactics;
  isContractRenewal?: boolean;
}

export interface TransferExecutionResult {
  updatedPlayer: Player;
  updatedBuyerClub: Club;
  updatedSellerClub?: Club;
  updatedBuyerFinances: FinanceSummary;
  updatedSellerTactics?: ClubTactics;
  newCommitments: FutureTransferCommitment[];
  historyRecord: TransferHistoryRecord;
  inboxMessage: InboxMessage;
  newsItem?: NewsItem;
}

/**
 * Validates whether buyer club can afford the transfer fee and signing bonuses.
 */
export function canAffordTransfer(
  buyerFinances: FinanceSummary,
  transferPackage: TransferOfferPackage,
  contractPackage: ContractOfferPackage
): { canAfford: boolean; reason?: string } {
  const totalImmediateCost = transferPackage.upfrontFee + (contractPackage.signingBonus || 0);

  if (buyerFinances.clubBalance < totalImmediateCost) {
    return {
      canAfford: false,
      reason: `Kulüp kasasında yeterli bakiye bulunmuyor. Gerekli nakit: €${totalImmediateCost.toLocaleString('tr-TR')}, Mevcut bakiye: €${buyerFinances.clubBalance.toLocaleString('tr-TR')}`,
    };
  }

  if (buyerFinances.transferBudget < transferPackage.upfrontFee) {
    return {
      canAfford: false,
      reason: `Yönetim tarafından tahsis edilen transfer bütçesi aşıldı. Bütçeniz: €${buyerFinances.transferBudget.toLocaleString('tr-TR')}`,
    };
  }

  const remainingWageBudget = buyerFinances.wageBudget - buyerFinances.weeklyWages;
  if (remainingWageBudget < contractPackage.wage) {
    return {
      canAfford: false,
      reason: `Maaş bütçesi yetersiz. Oyuncunun talep ettiği haftalık €${contractPackage.wage.toLocaleString('tr-TR')} için mevcut kalan maaş limiti: €${remainingWageBudget.toLocaleString('tr-TR')}`,
    };
  }

  return { canAfford: true };
}

/**
 * Completes a transfer or contract renewal transaction atomically.
 */
export function executeTransferCompletion({
  player,
  sellerClub,
  buyerClub,
  transferPackage,
  contractPackage,
  currentDate,
  seasonYear,
  buyerFinances,
  sellerTactics,
  isContractRenewal = false,
}: TransferExecutionInput): TransferExecutionResult {
  const isFreeAgent = !sellerClub || player.clubId === 'free-agent' || player.clubId === 'FREE_AGENT';
  const upfrontFee = isFreeAgent || isContractRenewal ? 0 : transferPackage.upfrontFee;
  const installmentsFee = isFreeAgent || isContractRenewal ? 0 : transferPackage.installmentsFee;
  const totalFee = upfrontFee + installmentsFee;

  // 1. Calculate new contract dates
  const currYear = parseInt(currentDate.split('-')[0], 10);
  const contractEndYear = currYear + contractPackage.durationYears;
  const contractEnd = `${contractEndYear}-06-30`;

  // 2. Update Player Object
  const updatedPlayer: Player = {
    ...player,
    clubId: buyerClub.id,
    wage: contractPackage.wage,
    contractStart: currentDate,
    contractEnd,
    squadRole: contractPackage.squadRole,
    promisedRole: contractPackage.squadRole,
    releaseClause: contractPackage.releaseClause,
    isTransferListedByRequest: false,
    transferRequestReason: undefined,
    morale: Math.min(100, (player.morale || 70) + 15), // Morale boost upon signing
  };

  // 3. Update Buyer Finances
  const totalImmediateDeduction = upfrontFee + (contractPackage.signingBonus || 0);
  const updatedBuyerFinances: FinanceSummary = {
    ...buyerFinances,
    clubBalance: buyerFinances.clubBalance - totalImmediateDeduction,
    transferBudget: Math.max(0, buyerFinances.transferBudget - upfrontFee),
    weeklyWages: isContractRenewal
      ? buyerFinances.weeklyWages - player.wage + contractPackage.wage
      : buyerFinances.weeklyWages + contractPackage.wage,
    expenseCategories: {
      ...buyerFinances.expenseCategories,
      playerSignings: buyerFinances.expenseCategories.playerSignings + totalImmediateDeduction,
      playerWages: buyerFinances.expenseCategories.playerWages + contractPackage.wage * 52,
    },
  };

  // 4. Update Buyer Club
  const updatedBuyerClub: Club = {
    ...buyerClub,
    balance: updatedBuyerFinances.clubBalance,
    transferBudget: updatedBuyerFinances.transferBudget,
    weeklyWageExpense: updatedBuyerFinances.weeklyWages,
  };

  // 5. Update Seller Club (if applicable)
  let updatedSellerClub: Club | undefined;
  if (sellerClub && !isFreeAgent && !isContractRenewal) {
    updatedSellerClub = {
      ...sellerClub,
      balance: sellerClub.balance + upfrontFee,
      transferBudget: sellerClub.transferBudget + Math.round(upfrontFee * 0.85),
      weeklyWageExpense: Math.max(0, sellerClub.weeklyWageExpense - player.wage),
    };
  }

  // 6. Clean Seller Tactics/Lineup if player was on pitch/bench
  let updatedSellerTactics = sellerTactics;
  if (sellerTactics && sellerClub && !isFreeAgent && !isContractRenewal) {
    const newLineup = sellerTactics.lineup.map((slot) =>
      slot.playerId === player.id ? { ...slot, playerId: null } : slot
    );
    const newSubs = sellerTactics.substitutes.filter((id) => id !== player.id);
    const newReserves = sellerTactics.reserves.filter((id) => id !== player.id);

    updatedSellerTactics = {
      ...sellerTactics,
      lineup: newLineup,
      substitutes: newSubs,
      reserves: newReserves,
    };
  }

  // 7. Future Commitments (Installments)
  const newCommitments: FutureTransferCommitment[] = [];
  if (installmentsFee > 0 && sellerClub && !isFreeAgent && !isContractRenewal) {
    const months = transferPackage.installmentsMonths || 12;
    const installmentsCount = months <= 12 ? 2 : 4;
    const perInstallment = Math.round(installmentsFee / installmentsCount);

    for (let i = 1; i <= installmentsCount; i++) {
      const daysOffset = Math.round((months / installmentsCount) * i * 30);
      newCommitments.push({
        id: `com-${Date.now()}-${i}-${player.id}`,
        transferId: `tr-${Date.now()}-${player.id}`,
        fromClubId: buyerClub.id,
        fromClubName: buyerClub.name,
        toClubId: sellerClub.id,
        toClubName: sellerClub.name,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        amount: perInstallment,
        dueDate: addDaysToDate(currentDate, daysOffset),
        description: `${player.firstName} ${player.lastName} transfer taksiti (${i}/${installmentsCount})`,
        status: 'PENDING',
        isPaid: false,
        installmentIndex: i,
        totalInstallments: installmentsCount,
      });
    }
  }

  // 8. History Record
  const historyRecord: TransferHistoryRecord = {
    id: `tr-hist-${Date.now()}-${player.id}`,
    date: currentDate,
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    playerOverall: player.overall,
    playerPosition: player.position,
    fromClubId: sellerClub?.id || 'FREE_AGENT',
    fromClubName: isFreeAgent ? 'Serbest Oyuncu' : sellerClub?.name || 'Bilinmiyor',
    toClubId: buyerClub.id,
    toClubName: buyerClub.name,
    fee: totalFee,
    wage: contractPackage.wage,
    squadRole: contractPackage.squadRole,
    status: 'Tamamlandı',
    details: isContractRenewal
      ? 'Sözleşme Yenilendi'
      : isFreeAgent
      ? 'Bedelsiz İmza'
      : `Bonservis: €${upfrontFee.toLocaleString('tr-TR')} + €${installmentsFee.toLocaleString('tr-TR')} Taksit`,
  };

  // 9. Inbox Notification Message
  const inboxMessage: InboxMessage = {
    id: `msg-tr-done-${Date.now()}-${player.id}`,
    clubId: buyerClub.id,
    senderName: 'Futbol Direktörü',
    senderRole: 'Transfer Komitesi',
    subject: isContractRenewal
      ? `Sözleşme Uzatıldı: ${player.firstName} ${player.lastName}`
      : `Transfer Tamamlandı: ${player.firstName} ${player.lastName}`,
    preview: isContractRenewal
      ? `${player.firstName} ${player.lastName} ile yeni sözleşme imzalandı.`
      : `${player.firstName} ${player.lastName} kulübümüzle resmi sözleşmeyi imzaladı.`,
    body: isContractRenewal
      ? `Sayın Menajer,\n\nFutbolcumuz ${player.firstName} ${player.lastName} ile yürütülen sözleşme görüşmeleri başarıyla sonuçlanmıştır.\n\nYeni Haftalık Maaş: €${contractPackage.wage.toLocaleString('tr-TR')}\nSözleşme Bitiş Tarihi: ${contractEnd}\nKadro Rolü: ${contractPackage.squadRole}\n\nOyuncunun antrenman ve maç odaklılığı en üst seviyededir.`
      : `Sayın Menajer,\n\n${isFreeAgent ? 'Serbest statüdeki' : sellerClub?.name + ' kulübünden'} transfer edilen ${player.firstName} ${player.lastName} (${player.position}) sağlık kontrollerinden başarıyla geçmiş ve kendisini ${contractPackage.durationYears} yıllığına kulübümüze bağlayan resmi sözleşmeyi imzalamıştır.\n\nBonservis Bedeli: €${totalFee.toLocaleString('tr-TR')}\nHaftalık Maaş: €${contractPackage.wage.toLocaleString('tr-TR')}\nKadro Rolü: ${contractPackage.squadRole}\n\nOyuncumuz yarından itibaren A Takım antrenmanlarına başlayacaktır.`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'HIGH',
    actionable: true,
    actionType: 'VIEW_SQUAD',
  };

  // 10. News Feed Item
  let newsItem: NewsItem | undefined;
  if (!isContractRenewal) {
    newsItem = {
      id: `news-tr-${Date.now()}-${player.id}`,
      date: currentDate,
      category: 'TRANSFER',
      headline: `TRANSFER: ${player.firstName} ${player.lastName} ${buyerClub.name}'da!`,
      content: `${buyerClub.name}, ${isFreeAgent ? 'serbest oyuncu havuzundan' : sellerClub?.name + ' kulübünden'} ${player.position} mevkiinde oynayan ${player.firstName} ${player.lastName} (${player.age}) ile ${contractPackage.durationYears} yıllık resmi sözleşme imzaladı.`,
      importance: player.overall >= 76 ? 'HIGH' : 'NORMAL',
      clubId: buyerClub.id,
      playerId: player.id,
    };
  }

  return {
    updatedPlayer,
    updatedBuyerClub,
    updatedSellerClub,
    updatedBuyerFinances,
    updatedSellerTactics,
    newCommitments,
    historyRecord,
    inboxMessage,
    newsItem,
  };
}
