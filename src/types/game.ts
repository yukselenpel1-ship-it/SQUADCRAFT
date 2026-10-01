export type PlayerPosition = 
  | 'GK' 
  | 'DR' | 'DC' | 'DL' 
  | 'DMC' | 'MC' | 'MR' | 'ML' 
  | 'AMC' | 'AMR' | 'AML' 
  | 'ST';

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'ATT';

export type PreferredFoot = 'Sol' | 'Sağ' | 'Her İkisi';

export interface PlayerAttributes {
  // Fiziksel & Hız
  pace: number;
  acceleration: number;
  strength: number;
  stamina: number;
  
  // Hücum & Teknik
  finishing: number;
  longShots: number;
  passing: number;
  vision: number;
  crossing: number;
  dribbling: number;
  technique: number;
  heading: number;
  
  // Savunma
  tackling: number;
  marking: number;
  positioning: number;
  
  // Zihinsel
  aggression: number;
  composure: number;
  decisions: number;
  teamwork: number;
  leadership: number;
  
  // Kalecilik
  handling: number;
  reflexes: number;
  positioningGK: number;
  kicking: number;
}

export type SquadRole =
  | 'Yıldız Oyuncu'
  | 'Önemli Oyuncu'
  | 'Kilit Oyuncu'
  | 'İlk 11'
  | 'Rotasyon'
  | 'Yedek'
  | 'Gelecek Vadeden'
  | 'Genç Oyuncu'
  | 'Genç Yetenek';

export type PlayerArchetype =
  | 'Hızlı Kanat'
  | 'Oyun Kurucu Kanat'
  | 'Oyun Kurucu'
  | 'Bitirici Forvet'
  | 'Pres Forvet'
  | 'Hedef Santrfor'
  | 'Box-to-Box'
  | 'Defansif Orta Saha'
  | 'Pasör Stoper'
  | 'Fiziksel Stoper'
  | 'Hücumcu Bek'
  | 'Savunmacı Bek'
  | 'Süpürücü Kaleci'
  | 'Çizgi Kalecisi';

export type DevelopmentCurve = 'EARLY_PEAK' | 'BALANCED' | 'LATE_BLOOMER';

export interface HiddenPlayerAttributes {
  consistency: number; // 1-100 (İstikrar)
  bigMatchPerformance: number; // 1-100 (Büyük Maç Performansı)
  injuryProneness: number; // 1-100 (Sakatlık Yatkınlığı)
  professionalism: number; // 1-100 (Profesyonellik)
  workEthic: number; // 1-100 (Çalışma Disiplini)
  developmentCurve: DevelopmentCurve; // Gelişim Eğrisi
}

export interface ManagerContract {
  yearsLeft: number;
  weeklySalary: number;
  status: 'ACTIVE' | 'OFFERED' | 'EXPIRED';
  offerYears?: number;
  offerSalary?: number;
}

export interface ScoutingReport {
  isFullyScouted: boolean;
  scoutedLevel: number; // 0-100
  estimatedOvrMin: number;
  estimatedOvrMax: number;
  estimatedPotMin: number;
  estimatedPotMax: number;
}

export interface Player {
  id: string;
  clubId: string;
  firstName: string;
  lastName: string;
  nationality: string;
  age: number;
  birthDate: string;
  position: PlayerPosition;
  secondaryPositions: PlayerPosition[];
  preferredFoot: PreferredFoot;
  height: number; // cm
  weight: number; // kg
  
  // Nitelikler
  attributes: PlayerAttributes;
  
  // Kariyer & Durum
  overall: number; // 1-100
  potential: number; // 1-100
  morale: number; // 1-100
  fitness: number; // 1-100 (Kondisyon)
  matchSharpness?: number; // 0-100 (Maç Keskinliği)
  form: number; // 1-10 (Son maç performansı ortalaması)
  marketValue: number; // Para birimi (örn. €)
  wage: number; // Haftalık maaş
  contractStart: string;
  contractEnd: string;
  contractYearsLeft?: number;
  
  // Durum
  isInjured?: boolean;
  injuryDetails?: {
    type: string;
    daysRemaining: number;
  };
  isSuspended?: boolean;
  suspensionDetails?: {
    reason: string;
    matchesRemaining: number;
  };
  contractUntil?: number | string;
  squadRole?: SquadRole | string;
  promisedRole?: string;
  releaseClause?: number;
  isTransferListed?: boolean;
  isTransferListedByRequest?: boolean;
  transferRequestReason?: string;
  isLoaned?: boolean;
  parentClubId?: string;
  parentClubName?: string;
  previousClubName?: string;
  agent?: any;

  // SquadCraft Player 2.0 & Draft Economy Fields
  draftValue?: number; // EUR € Draft Değeri
  archetype?: PlayerArchetype;
  isRisingTalent?: boolean; // "YÜKSELEN YETENEK"
  hiddenAttributes?: HiddenPlayerAttributes;
  scoutingReport?: ScoutingReport;
  
  // İstatistikler (Sezon)
  seasonStats?: {
    appearances: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    cleanSheets: number;
    averageRating: number;
  };
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  code: string; // 3 harfli kod (örn. KDO, VAD)
  city: string;
  stadium: string;
  stadiumCapacity: number;
  reputation: number; // 1-100
  balance: number; // Toplam Kulüp Kasası
  transferBudget: number; // Transfer Bütçesi
  wageBudget: number; // Haftalık Maaş Bütçesi
  weeklyWageExpense: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  managerName: string;
  foundedYear: number;
}

export type Formation =
  | '4-2-3-1'
  | '4-3-3'
  | '4-4-2'
  | '4-1-2-1-2'
  | '4-3-1-2'
  | '4-3-2-1'
  | '4-2-2-2'
  | '4-1-4-1'
  | '4-2-4'
  | '3-5-2'
  | '3-4-3'
  | '3-4-2-1'
  | '3-4-1-2'
  | '5-3-2'
  | '5-2-3';

export type Mentality = 'Çok Savunmacı' | 'Savunmacı' | 'Dengeli' | 'Hücum' | 'Aşırı Hücum';
export type Tempo = 'Çok Düşük' | 'Düşük' | 'Standart' | 'Yüksek' | 'Çok Yüksek';
export type Pressing = 'Hafif' | 'Orta' | 'Yoğun' | 'Aşırı';
export type PassingStyle = 'Kısa' | 'Karışık' | 'Doğrudan' | 'Uzun';
export type DefensiveLine = 'Çok Derin' | 'Derin' | 'Standart' | 'Yüksek' | 'Çok Yüksek';
export type Width = 'Dar' | 'Dengeli' | 'Geniş';

export interface TacticalSettings {
  mentality: Mentality;
  tempo: Tempo;
  pressing: Pressing;
  passingStyle: PassingStyle;
  defensiveLine: DefensiveLine;
  width: Width;
}

export interface PitchPositionSlot {
  slotId: number; // 0 (GK) to 10 (ST/Forward)
  role: PlayerPosition;
  x: number; // 0-100 percentage of pitch width
  y: number; // 0-100 percentage of pitch length (GK at bottom or top)
  playerId: string | null;
}

export interface ClubTactics {
  clubId: string;
  formation: Formation;
  settings: TacticalSettings;
  lineup: PitchPositionSlot[];
  substitutes: string[]; // Player IDs (bench)
  reserves: string[]; // Player IDs
}

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'INJURY' | 'VAR_CANCEL';
  teamId: string;
  playerId: string;
  playerName: string;
  secondaryPlayerId?: string;
  secondaryPlayerName?: string;
  description: string;
}

export interface MatchStats {
  possession: [number, number]; // [Home, Away] e.g. [54, 46]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  passAccuracy: [number, number]; // percentage
  xg: [number, number]; // Expected Goals
}

export interface Fixture {
  id: string;
  seasonYear: string;
  competition: string;
  round: number;
  date: string;
  time: string;
  homeClubId: string;
  awayClubId: string;
  homeScore?: number;
  awayScore?: number;
  status: MatchStatus;
  events?: MatchEvent[];
  stats?: MatchStats;
  referee?: string;
  stadium?: string;
  attendance?: number;
}

export interface LeagueStanding {
  rank: number;
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export type TransferType = 'MARKET' | 'INCOMING_OFFER' | 'OUTGOING_OFFER' | 'SHORTLIST';
export type TransferOfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEGOTIATING' | 'COMPLETED';

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  fee: number;
  wageOffer?: number;
  status: TransferOfferStatus;
  date: string;
  expiresInDays: number;
}

export interface InboxMessage {
  id: string;
  clubId: string;
  senderName: string;
  senderRole: string; // e.g. "Yönetim Kurulu Başkanı", "Baş Fizyoterapist", "Baş Gözlemci"
  subject: string;
  preview: string;
  body: string;
  date: string;
  category: 'BOARD' | 'INJURY' | 'TRANSFER' | 'SCOUT' | 'SCOUTING' | 'MATCH' | 'CONTRACT' | 'TRAINING';
  isRead: boolean;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  actionable?: boolean;
  actionType?: 'REPLY_TRANSFER' | 'RENEW_CONTRACT' | 'VIEW_TACTICS' | 'VIEW_SQUAD' | 'VIEW_PLAYER' | 'VIEW_ACADEMY' | 'VIEW_SCOUTING';
  actionPayload?: Record<string, unknown>;
}

export interface FinanceSummary {
  clubBalance: number;
  transferBudget: number;
  wageBudget: number;
  weeklyWages: number;
  weeklyWageBill?: number;
  incomeCategories: {
    matchdayTickets: number;
    sponsorships: number;
    broadcasting: number;
    merchandising: number;
    playerSales: number;
  };
  expenseCategories: {
    playerWages: number;
    staffWages: number;
    scoutingNetwork: number;
    stadiumMaintenance: number;
    academyYouth: number;
    playerSignings: number;
  };
  monthlyHistory: {
    month: string;
    income: number;
    expense: number;
    net: number;
  }[];
}

export interface Competition {
  id: string;
  name: string;
  shortName: string;
  code: string;
  country: string;
  tier: number;
  totalTeams: number;
  currentRound: number;
  totalRounds: number;
  seasonYear: string;
}
