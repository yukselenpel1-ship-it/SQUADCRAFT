import {
  Club,
  Player,
  ClubTactics,
  LeagueStanding,
  Fixture,
  InboxMessage,
  TransferOffer,
  FinanceSummary,
  Formation,
} from '@/types/game';

export type TrainingIntensity = 'Hafif' | 'Normal' | 'Yoğun';

export type SeasonStage = 'PRE_SEASON' | 'REGULAR_SEASON' | 'SEASON_END' | 'OFF_SEASON';

export type TransferWindowStatus = 'OPEN' | 'CLOSED';

export type ContractExpiryStatus =
  | 'SAFE'
  | '18_MONTHS'
  | '12_MONTHS'
  | '6_MONTHS'
  | 'EXPIRING'
  | 'EXPIRED';

export interface NewsItem {
  id: string;
  date: string;
  headline: string;
  content: string;
  category: 'MATCH_RESULTS' | 'TRANSFER' | 'INJURY' | 'TITLE_RACE' | 'CLUB_NEWS' | 'TRAINING' | 'TEAM_NEWS' | 'LEAGUE_NEWS';
  importance: 'NORMAL' | 'HIGH';
  clubId?: string;
  playerId?: string;
}

export interface ClubCareerHistory {
  seasonYear: string;
  clubId: string;
  clubName: string;
  rank: number;
  points: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  topScorerName: string;
  topScorerGoals: number;
  averageRating: number;
}

export interface DailyProcessingResult {
  currentDate: string;
  daysProcessed: number;
  eventsTriggered: string[];
  newInboxMessages: InboxMessage[];
  newNews: NewsItem[];
  hasUserMatch: boolean;
  userMatchFixtureId?: string;
  stoppedReason?: 'MATCH_DAY' | 'TRANSFER_OFFER' | 'INJURY' | 'CONTRACT_CRITICAL' | 'SEASON_END' | 'MANUAL_STOP';
  seasonFinished?: boolean;
}

export interface CareerSaveDataV1 {
  saveVersion: 1;
  savedAt: string;
  seasonYear: string;
  seasonStage: SeasonStage;
  currentDate: string;
  userClubId: string;
  trainingIntensity: TrainingIntensity;
  clubs: Club[];
  players: Player[];
  tactics: ClubTactics;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  inboxMessages: InboxMessage[];
  transferOffers: TransferOffer[];
  shortlistIds: string[];
  finances: FinanceSummary;
  newsFeed: NewsItem[];
  careerHistory: ClubCareerHistory[];
  settings: {
    autoSave: boolean;
    defaultMatchSpeed: number;
    debugMode: boolean;
  };
}

export interface CareerSaveDataV2 {
  saveVersion: 2;
  savedAt: string;
  seasonYear: string;
  seasonStage: SeasonStage;
  currentDate: string;
  userClubId: string;
  trainingIntensity: TrainingIntensity;
  clubs: Club[];
  players: Player[];
  tactics: ClubTactics;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  inboxMessages: InboxMessage[];
  transferOffers: TransferOffer[];
  shortlistIds: string[];
  finances: FinanceSummary;
  newsFeed: NewsItem[];
  careerHistory: ClubCareerHistory[];
  activeNegotiations?: any[];
  transferHistory?: any[];
  futureCommitments?: any[];
  settings: {
    autoSave: boolean;
    defaultMatchSpeed: number;
    debugMode: boolean;
  };
}

export interface CareerSaveDataV3 {
  saveVersion: 3;
  savedAt: string;
  seasonYear: string;
  seasonStage: SeasonStage;
  currentDate: string;
  userClubId: string;
  trainingIntensity: TrainingIntensity;
  clubs: Club[];
  players: Player[];
  tactics: ClubTactics;
  standings: LeagueStanding[];
  fixtures: Fixture[];
  inboxMessages: InboxMessage[];
  transferOffers: TransferOffer[];
  shortlistIds: string[];
  finances: FinanceSummary;
  newsFeed: NewsItem[];
  careerHistory: ClubCareerHistory[];
  activeNegotiations: any[]; // ActiveNegotiation[]
  transferHistory: any[]; // TransferHistoryRecord[]
  futureCommitments: any[]; // FutureTransferCommitment[]
  // v0.5.0 additions
  scouts: any[]; // Scout[]
  scoutingAssignments: any[]; // ScoutAssignment[]
  scoutingKnowledge: Record<string, any>; // Record<string, ScoutingKnowledgeRecord>
  scoutingReports: any[]; // ScoutingReport[]
  activeLoans: any[]; // LoanAgreement[]
  academyFacilities?: any; // YouthAcademyFacility
  youthPlayers?: any[]; // YouthPlayer[]
  playerHiddenProfiles?: Record<string, any>; // Record<string, PlayerHiddenProfile>
  leagueSize?: 10 | 14 | 18;
  difficulty?: CareerDifficulty;
  settings: {
    autoSave: boolean;
    defaultMatchSpeed: number;
    debugMode: boolean;
  };
}

export type CareerDifficulty = 'Rahat' | 'Standart' | 'Zorlu';

export interface ManagerProfile {
  name: string;
  nationality: string;
  age: number;
  tacticalStyle: string;
  avatarPlaceholder?: string;
  difficulty: CareerDifficulty;
}

export interface CareerSetupConfig {
  managerProfile: ManagerProfile;
  selectedClubId: string;
  leagueId?: string;
  leagueSize?: 10 | 14 | 18;
  seasonYear?: string;
  startingDate?: string;
}

export type CareerSaveData = CareerSaveDataV1 | CareerSaveDataV2 | CareerSaveDataV3;


