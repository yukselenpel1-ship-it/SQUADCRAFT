import { Player, InboxMessage } from '@/types/game';
import { daysBetween } from './calendar';
import { ContractExpiryStatus } from './types';

export function getContractExpiryStatus(currentDate: string, contractEndDate: string): ContractExpiryStatus {
  const days = daysBetween(currentDate, contractEndDate);

  if (days <= 0) return 'EXPIRED';
  if (days <= 90) return 'EXPIRING';
  if (days <= 180) return '6_MONTHS';
  if (days <= 365) return '12_MONTHS';
  if (days <= 540) return '18_MONTHS';
  return 'SAFE';
}

export function getContractStatusLabel(status: ContractExpiryStatus): string {
  switch (status) {
    case 'SAFE':
      return 'Güvende';
    case '18_MONTHS':
      return '18 Ay Kaldı';
    case '12_MONTHS':
      return '12 Ay Kaldı';
    case '6_MONTHS':
      return '6 Ay Kaldı';
    case 'EXPIRING':
      return 'Süresi Doluyor';
    case 'EXPIRED':
      return 'Süresi Doldu';
  }
}

export function checkContractWarnings(
  player: Player,
  currentDate: string,
  userClubId: string
): InboxMessage | undefined {
  if (player.clubId !== userClubId) return undefined;

  const days = daysBetween(currentDate, player.contractEnd);

  // Check milestone days (e.g. exactly 365, 180, 90, 30 days)
  let warningMilestone: string | null = null;
  if (days === 365) warningMilestone = '1 yıl (12 ay)';
  else if (days === 180) warningMilestone = '6 ay';
  else if (days === 90) warningMilestone = '3 ay';
  else if (days === 30) warningMilestone = '1 ay';

  if (!warningMilestone) return undefined;

  return {
    id: `msg-ctr-${Date.now()}-${player.id}`,
    clubId: userClubId,
    senderName: 'Kulüp Avukatı & Sözleşme Masası',
    senderRole: 'Hukuk Departmanı',
    subject: `Sözleşme Uyarısı: ${player.firstName} ${player.lastName}`,
    preview: `${player.firstName} ${player.lastName}'ın sözleşmesinin bitmesine ${warningMilestone} kaldı.`,
    body: `Sayın Menajer,\n\nA Takım oyuncularımızdan ${player.firstName} ${player.lastName} (${player.position}) için mevcut sözleşme süresinin sonuna yaklaşılmaktadır. Oyuncunun kontratının bitmesine ${warningMilestone} kalmıştır.\n\nOyuncunun serbest kalmaması adına sözleşme uzatma görüşmelerine başlanması tavsiye edilmektedir.\n\nHaftalık Mevcut Maaş: €${player.wage.toLocaleString('tr-TR')}\nSözleşme Bitiş: ${player.contractEnd}`,
    date: currentDate,
    category: 'CONTRACT',
    isRead: false,
    priority: days <= 90 ? 'HIGH' : 'NORMAL',
    actionable: true,
    actionType: 'RENEW_CONTRACT',
  };
}
