import { Club, Player, TransferOffer, InboxMessage } from '@/types/game';
import { getTransferWindowStatus } from './calendar';

export interface TransferProcessingResult {
  newOffers: TransferOffer[];
  newInboxMessages: InboxMessage[];
  inboxMessages: InboxMessage[];
}

export function processDailyAITransfers(
  currentDate: string,
  arg2: Club[] | Player[],
  arg3?: Player[] | string[] | Club[],
  arg4?: string | TransferOffer[],
  arg5?: TransferOffer[]
): TransferProcessingResult {
  const windowStatus = getTransferWindowStatus(currentDate);
  if (windowStatus === 'CLOSED') {
    return { newOffers: [], newInboxMessages: [], inboxMessages: [] };
  }

  // Low daily probability so user isn't bombarded (approx 1 offer every 8-14 days during window)
  if (Math.random() > 0.08) {
    return { newOffers: [], newInboxMessages: [], inboxMessages: [] };
  }

  let clubs: Club[] = [];
  let players: Player[] = [];
  let userClubId = 'kalyon-doruk';
  let existingOffers: TransferOffer[] = [];

  if (Array.isArray(arg2) && arg2.length > 0 && 'transferBudget' in arg2[0]) {
    clubs = arg2 as Club[];
    players = (arg3 as Player[]) || [];
    userClubId = (arg4 as string) || 'kalyon-doruk';
    existingOffers = arg5 || [];
  } else {
    players = (arg2 as Player[]) || [];
    userClubId = (arg4 as string) || 'kalyon-doruk';
    existingOffers = (arg5 as TransferOffer[]) || [];
  }

  // Select buyer club from AI clubs
  const aiClubs = clubs.filter((c) => c.id !== userClubId && (c.transferBudget || 5000000) > 2000000);
  const buyerClub = aiClubs.length > 0
    ? aiClubs[Math.floor(Math.random() * aiClubs.length)]
    : { id: 'alveria-yildizi', name: 'Alveria Yıldızı', managerName: 'AI Menajer', transferBudget: 15000000 };

  // Find target player from user club (prefer good rating, not already bid on)
  const userPlayers = players.filter((p) => p.clubId === userClubId && !p.isInjured);
  const pendingBidPlayerIds = existingOffers.filter((o) => o.status === 'PENDING').map((o) => o.playerId);
  const eligiblePlayers = userPlayers.filter((p) => !pendingBidPlayerIds.includes(p.id) && p.marketValue <= (buyerClub.transferBudget || 10000000) * 0.9);

  if (eligiblePlayers.length === 0) {
    return { newOffers: [], newInboxMessages: [], inboxMessages: [] };
  }

  // Pick player with decent overall
  eligiblePlayers.sort((a, b) => b.overall - a.overall);
  const targetPlayer = eligiblePlayers[Math.floor(Math.random() * Math.min(5, eligiblePlayers.length))];

  const feeMultiplier = 0.95 + Math.random() * 0.25; // 95% to 120% of market value
  const bidFee = Math.round((targetPlayer.marketValue * feeMultiplier) / 50000) * 50000;

  const newOffer: TransferOffer = {
    id: `tr-inc-${Date.now()}-${targetPlayer.id}`,
    playerId: targetPlayer.id,
    fromClubId: buyerClub.id,
    toClubId: userClubId,
    fee: bidFee,
    wageOffer: Math.round(targetPlayer.wage * 1.2),
    status: 'PENDING',
    date: currentDate,
    expiresInDays: 3,
  };

  const newInboxMsg: InboxMessage = {
    id: `msg-tr-inc-${Date.now()}-${targetPlayer.id}`,
    clubId: userClubId,
    senderName: `${buyerClub.name} Transfer Masası`,
    senderRole: buyerClub.name,
    subject: `Resmi Transfer Teklifi: ${targetPlayer.firstName} ${targetPlayer.lastName}`,
    preview: `${buyerClub.name}, oyuncunuz ${targetPlayer.firstName} ${targetPlayer.lastName} için €${bidFee.toLocaleString('tr-TR')} teklif ediyor.`,
    body: `Sayın Menajer,\n\nKulübümüz ${buyerClub.name}, A Takım oyuncularınızdan ${targetPlayer.firstName} ${targetPlayer.lastName} (${targetPlayer.position}) için net €${bidFee.toLocaleString('tr-TR')} tutarında resmi transfer teklifi sunmaktadır.\n\nTeklifimizin kabul edilmesi halinde sonraki satıştan %10 pay maddesi eklenecektir. Yanıtınızı beklemekteyiz.\n\n${(buyerClub as any).managerName || 'Transfer Komitesi'}\n${buyerClub.name} Yönetimi`,
    date: currentDate,
    category: 'TRANSFER',
    isRead: false,
    priority: 'HIGH',
    actionable: true,
    actionType: 'REPLY_TRANSFER',
  };

  return {
    newOffers: [newOffer],
    newInboxMessages: [newInboxMsg],
    inboxMessages: [newInboxMsg],
  };
}
