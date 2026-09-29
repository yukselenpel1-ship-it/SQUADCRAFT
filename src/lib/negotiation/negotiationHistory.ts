import {
  ActiveNegotiation,
  NegotiationLogEntry,
  TransferOfferPackage,
  ContractOfferPackage,
  TransferHistoryRecord,
} from './types';
import { Player, Club } from '@/types/game';

/**
 * Initializes a new active negotiation for a player.
 */
export function createActiveNegotiation(
  player: Player,
  buyerClub: Club,
  sellerClub: Club | undefined,
  currentDate: string,
  isContractRenewal: boolean = false
): ActiveNegotiation {
  const isFreeAgent = !sellerClub || player.clubId === 'free-agent' || player.clubId === 'FREE_AGENT';

  const initialLog: NegotiationLogEntry = {
    id: `log-${Date.now()}-init`,
    date: currentDate,
    sender: 'USER',
    senderName: buyerClub.name,
    text: isContractRenewal
      ? `${player.firstName} ${player.lastName} ile sözleşme yenileme görüşmeleri başlatıldı.`
      : isFreeAgent
      ? `Serbest oyuncu ${player.firstName} ${player.lastName} ile doğrudan sözleşme görüşmeleri başlatıldı.`
      : `${sellerClub?.name} kulübü ile ${player.firstName} ${player.lastName} için resmi transfer görüşmeleri başlatıldı.`,
    type: 'INFO',
  };

  return {
    id: `neg-${Date.now()}-${player.id}`,
    playerId: player.id,
    buyerClubId: buyerClub.id,
    sellerClubId: isFreeAgent ? 'FREE_AGENT' : sellerClub?.id || 'FREE_AGENT',
    isFreeAgent,
    isContractRenewal,
    stage: isFreeAgent || isContractRenewal ? 'PLAYER_NEGOTIATION' : 'CLUB_NEGOTIATION',
    clubPatience: 3,
    playerPatience: 3,
    clubStatus: 'PENDING',
    playerStatus: 'PENDING',
    history: [initialLog],
    createdDate: currentDate,
    lastUpdatedDate: currentDate,
  };
}

/**
 * Appends a log entry to an active negotiation.
 */
export function addNegotiationLog(
  negotiation: ActiveNegotiation,
  entry: Omit<NegotiationLogEntry, 'id'>
): ActiveNegotiation {
  const newEntry: NegotiationLogEntry = {
    ...entry,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  };

  return {
    ...negotiation,
    lastUpdatedDate: entry.date,
    history: [...negotiation.history, newEntry],
  };
}
