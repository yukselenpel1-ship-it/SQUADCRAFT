import { Player, Club, PlayerPosition } from '@/types/game';

// ============================================================================
// SQUAD ROLES
// ============================================================================
export type SquadRole =
  | 'Yıldız Oyuncu'
  | 'Önemli Oyuncu'
  | 'İlk 11'
  | 'Rotasyon'
  | 'Yedek'
  | 'Gelecek Vadeden'
  | 'Genç Oyuncu';

// ============================================================================
// AGENT / REPRESENTATIVE STYLES
// ============================================================================
export type AgentStyle =
  | 'Kolaycı'
  | 'Dengeli'
  | 'Sert'
  | 'Maksimum Kazanç Odaklı'
  | 'Kariyer Odaklı';

export interface PlayerAgent {
  name: string;
  style: AgentStyle;
  reputation: number; // 1-100
}

// ============================================================================
// PLAYER INTEREST IN TRANSFER
// ============================================================================
export type PlayerInterestLevel =
  | 'Çok İlgili'
  | 'İlgili'
  | 'Kararsız'
  | 'İsteksiz'
  | 'İlgilenmiyor';

export interface PlayerInterestDetails {
  level: PlayerInterestLevel;
  score: number; // 0 - 100
  reasons: string[];
}

// ============================================================================
// TRANSFER BONUS & CLAUSE TYPES
// ============================================================================
export type TransferBonusType =
  | 'APPEARANCES' // e.g. 20 lig maçı
  | 'GOALS' // e.g. 15 gol
  | 'CHAMPIONSHIP' // e.g. Lig Şampiyonluğu
  | 'CONTINENTAL'; // e.g. Kıtasal Turnuvaya Katılım

export interface TransferBonus {
  type: TransferBonusType;
  threshold?: number; // e.g. 20 appearances
  amount: number; // e.g. €500,000
  description: string;
}

export interface SellOnClause {
  percentage: number; // e.g. 10 (%)
  isProfitOnly: boolean; // Sonraki satıştan mı yoksa kârdan mı
}

// ============================================================================
// CLUB TRANSFER NEGOTIATION PACKAGES
// ============================================================================
export interface TransferOfferPackage {
  upfrontFee: number; // Peşin bonservis (€)
  installmentsFee: number; // Taksitli toplam bedel (€)
  installmentsMonths: number; // 6, 12, 18, 24 ay
  bonuses: TransferBonus[];
  sellOnClause?: SellOnClause;
}

export type ClubNegotiationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTER_OFFER'
  | 'NOT_FOR_SALE'
  | 'TERMINATED'
  | 'WITHDRAWN';

export interface ClubNegotiationResponse {
  status: ClubNegotiationStatus;
  feedbackMessage: string;
  counterOffer?: TransferOfferPackage;
  patienceRemaining: number;
  cooldownDays?: number;
}

// ============================================================================
// PLAYER CONTRACT NEGOTIATION PACKAGES
// ============================================================================
export interface ContractOfferPackage {
  wage: number; // Haftalık maaş (€/hafta)
  durationYears: number; // 1-5 yıl
  squadRole: SquadRole;
  signingBonus: number; // İmza parası (€)
  appearanceBonus: number; // Maç başı prim (€)
  goalBonus: number; // Gol primi (€)
  cleanSheetBonus: number; // Gol yememe primi (GK/DEF) (€)
  releaseClause?: number; // Serbest kalma bedeli (€)
}

export type PlayerNegotiationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTER_OFFER'
  | 'TERMINATED'
  | 'WITHDRAWN';

export interface PlayerNegotiationResponse {
  status: PlayerNegotiationStatus;
  feedbackMessage: string;
  counterOffer?: ContractOfferPackage;
  patienceRemaining: number;
  cooldownDays?: number;
}

// ============================================================================
// NEGOTIATION LOG & ACTIVE NEGOTIATION
// ============================================================================
export interface NegotiationLogEntry {
  id: string;
  date: string;
  sender: 'USER' | 'CLUB' | 'PLAYER' | 'AGENT';
  senderName: string;
  text: string;
  type: 'OFFER' | 'COUNTER' | 'ACCEPT' | 'REJECT' | 'TERMINATE' | 'INFO';
  clubOffer?: TransferOfferPackage;
  contractOffer?: ContractOfferPackage;
}

export interface ActiveNegotiation {
  id: string;
  playerId: string;
  buyerClubId: string;
  sellerClubId: string; // 'FREE_AGENT' for free agents
  isFreeAgent: boolean;
  isContractRenewal: boolean;
  
  // Stages: 'CLUB_NEGOTIATION' -> 'PLAYER_NEGOTIATION' -> 'COMPLETED' / 'FAILED'
  stage: 'CLUB_NEGOTIATION' | 'PLAYER_NEGOTIATION' | 'COMPLETED' | 'FAILED';
  
  // Club stage state
  clubPatience: number; // e.g. starts at 3-4
  latestClubOffer?: TransferOfferPackage;
  latestClubDemand?: TransferOfferPackage;
  clubStatus: ClubNegotiationStatus;
  
  // Player contract stage state
  playerPatience: number; // e.g. starts at 3
  latestContractOffer?: ContractOfferPackage;
  latestContractDemand?: ContractOfferPackage;
  playerStatus: PlayerNegotiationStatus;
  
  // History and logs
  history: NegotiationLogEntry[];
  cooldownUntilDate?: string;
  
  createdDate: string;
  lastUpdatedDate: string;
}

// ============================================================================
// FUTURE COMMITMENTS & TRANSFER HISTORY
// ============================================================================
export interface FutureTransferCommitment {
  id: string;
  transferId: string;
  fromClubId: string;
  fromClubName?: string;
  toClubId: string;
  toClubName?: string;
  playerId?: string;
  playerName?: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  isPaid?: boolean;
  installmentIndex?: number;
  totalInstallments?: number;
}

export type TransferHistoryStatus =
  | 'Tamamlandı'
  | 'Reddedildi'
  | 'İptal'
  | 'Görüşmede'
  | 'Oyuncu Reddetti'
  | 'Kulüp Reddetti';

export interface TransferHistoryRecord {
  id: string;
  date: string;
  playerId: string;
  playerName: string;
  playerOverall: number;
  playerPosition: PlayerPosition;
  fromClubId: string;
  fromClubName: string;
  toClubId: string;
  toClubName: string;
  fee: number; // Guaranteed upfront + installments
  wage: number;
  squadRole: SquadRole;
  status: TransferHistoryStatus;
  details?: string;
}

// ============================================================================
// VALUATION ESTIMATES (FOR UI DISPLAY)
// ============================================================================
export interface PlayerTransferValuation {
  marketValue: number;
  fairValue: number;
  estimatedMinFee: number;
  estimatedMaxFee: number;
  isNotForSale: boolean;
  clubStance: 'Satışa Açık' | 'Dengeli' | 'Zorlu' | 'Pazarlığa Kapalı' | 'Serbest Oyuncu' | 'Sözleşme Bitiyor';
  stanceReason: string;
  agent: PlayerAgent;
  interest: PlayerInterestDetails;
}
