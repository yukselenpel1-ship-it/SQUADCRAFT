import { Player, PlayerPosition, PreferredFoot, Formation, ClubTactics } from '@/types/game';
import { MatchEngineState } from '../match-engine/types';

// ============================================================================
// ROOM & MEMBER TYPES
// ============================================================================

export type RoomStatus =
  | 'LOBBY'
  | 'DRAFTING'
  | 'DRAFT_FINALIZING'
  | 'LEAGUE_READY'
  | 'LEAGUE_ACTIVE'
  | 'LEAGUE_COMPLETED'
  | 'ARCHIVED';

export type LeagueFormat = 'SINGLE_ROUND' | 'DOUBLE_ROUND';
export type SquadSizeOption = 16 | 18 | 20 | 22;
export type PickTimerOption = 0 | 30 | 45 | 60 | 90; // 0 = Unlimited
export type FitnessSetting = 'ON' | 'SIMPLIFIED' | 'OFF';
export type TransferSetting = 'CLOSED' | 'POST_DRAFT_SWAP' | 'FREE_AND_SWAP';
export type MatchTypeSetting = 'FAST_SIM' | 'LIVE_MATCH_CENTER';
export type AutoPickMode = 'AUTO_PICK' | 'SKIP';

export interface DraftRules {
  maxManagers: number; // 2 - 8
  format: LeagueFormat;
  squadSize: SquadSizeOption;
  pickTimerSeconds: PickTimerOption;
  injuries: boolean;
  suspensions: boolean;
  fitness: FitnessSetting;
  transferWindow: TransferSetting;
  matchType: MatchTypeSetting;
  autoPickMode: AutoPickMode;
  draftOrder?: string[];
  removedMemberIds?: string[];
  stateVersion?: number;
  currentMatchweek?: number;
  totalMatchweeks?: number;
  leaguePhase?: LeaguePhase;
  fixtures?: DraftFixture[];
  standings?: DraftStanding[];
  awards?: LeagueAwards;
  liveMatchweek?: LiveMatchweekState;
}

export interface LiveMatchweekState {
  matchweek: number;
  status: 'PREPARING' | 'COUNTDOWN' | 'LIVE' | 'COMPLETED';
  readyMemberIds: string[];
  countdownStartedAt?: string;
  startedAt?: string;
  paceMs?: number;
  completedMemberIds?: string[];
}

export const DEFAULT_DRAFT_RULES: DraftRules = {
  maxManagers: 6,
  format: 'DOUBLE_ROUND',
  squadSize: 18,
  pickTimerSeconds: 60,
  injuries: true,
  suspensions: true,
  fitness: 'SIMPLIFIED',
  transferWindow: 'CLOSED',
  matchType: 'FAST_SIM',
  autoPickMode: 'AUTO_PICK',
};

export const PRESET_4_MANAGERS: DraftRules = {
  maxManagers: 4,
  format: 'DOUBLE_ROUND',
  squadSize: 18,
  pickTimerSeconds: 60,
  injuries: true,
  suspensions: true,
  fitness: 'SIMPLIFIED',
  transferWindow: 'CLOSED',
  matchType: 'FAST_SIM',
  autoPickMode: 'AUTO_PICK',
};

export const PRESET_6_MANAGERS: DraftRules = {
  maxManagers: 6,
  format: 'DOUBLE_ROUND',
  squadSize: 18,
  pickTimerSeconds: 60,
  injuries: true,
  suspensions: true,
  fitness: 'SIMPLIFIED',
  transferWindow: 'CLOSED',
  matchType: 'FAST_SIM',
  autoPickMode: 'AUTO_PICK',
};

export const PRESET_8_MANAGERS: DraftRules = {
  maxManagers: 8,
  format: 'SINGLE_ROUND',
  squadSize: 18,
  pickTimerSeconds: 60,
  injuries: true,
  suspensions: true,
  fitness: 'SIMPLIFIED',
  transferWindow: 'CLOSED',
  matchType: 'FAST_SIM',
  autoPickMode: 'AUTO_PICK',
};

export const PRESET_CLOSED_ALPHA_4: DraftRules = PRESET_4_MANAGERS;
export const PRESET_CLOSED_ALPHA_6: DraftRules = PRESET_6_MANAGERS;
export const PRESET_CLOSED_ALPHA_8: DraftRules = PRESET_8_MANAGERS;
export const PRESET_FRIENDS_LEAGUE: DraftRules = PRESET_4_MANAGERS;

export type BotDifficulty = 'KOLAY' | 'ORTA' | 'ZOR';
export type BotPersonality = 'Kontrollü' | 'Hücumcu' | 'Kontratakçı' | 'Presçi' | 'Dengeli';

export type LeaguePhase =
  | 'LOBBY'
  | 'DRAFTING'
  | 'DRAFT_FINALIZING'
  | 'LEAGUE_ACTIVE'
  | 'MATCHWEEK_PREP'
  | 'MATCH_READY'
  | 'MATCH_SIMULATING'
  | 'MATCHWEEK_COMPLETE'
  | 'SEASON_COMPLETE'
  | 'LEAGUE_COMPLETED';

export interface MultiplayerRoom {
  id: string;
  roomCode: string; // e.g. "SC-A7K9"
  name: string;
  hostMemberId: string;
  status: RoomStatus;
  rules: DraftRules;
  stateVersion: number;
  currentMatchweek?: number;
  totalMatchweeks?: number;
  leaguePhase?: LeaguePhase;
  liveMatchweek?: LiveMatchweekState;
  createdAt: string;
  updatedAt: string;
}

export interface RoomMember {
  id: string;
  roomId: string;
  sessionId: string; // Persistent browser UUID
  username: string;
  isHost: boolean;
  isSpectator: boolean;
  isReady: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  botPersonality?: BotPersonality;
  clubId?: string;
  isConnected: boolean;
  lastSeenAt: string;
  joinedAt: string;
}

// ============================================================================
// ERROR CODES & LOGGING
// ============================================================================

export type MultiplayerErrorCode =
  | 'SC-MP-001' // Room not found
  | 'SC-MP-002' // Session mismatch
  | 'SC-MP-003' // Not current draft turn
  | 'SC-MP-004' // Player already drafted
  | 'SC-MP-005' // Realtime disconnected
  | 'SC-MP-006' // Match already simulated
  | 'SC-MP-007' // Unauthorized action
  | 'SC-MP-008' // Room capacity full
  | 'SC-MP-009' // Squad validation failure
  | 'SC-MP-010' // State desync
  | 'SC-MP-011' // Room creation failed
  | 'SC-MP-012'; // Bot management failed

export const ERROR_MESSAGES: Record<MultiplayerErrorCode, string> = {
  'SC-MP-001': 'Oda bulunamadı.',
  'SC-MP-002': 'Oturum uyuşmazlığı tespit edildi.',
  'SC-MP-003': 'Sıra sizde değil.',
  'SC-MP-004': 'Bu futbolcu başka bir kulüp tarafından seçildi.',
  'SC-MP-005': 'Çok oyunculu sunucu bağlantısı kurulamadı.',
  'SC-MP-006': 'Maç zaten simüle edildi.',
  'SC-MP-007': 'Yetkisiz işlem.',
  'SC-MP-008': 'Oda dolu! Maksimum menajer sayısına ulaşıldı.',
  'SC-MP-009': 'Kadro kuralları sağlanamadı (Minimum 2 GK, 5 DEF, 5 MID, 3 ATT).',
  'SC-MP-010': 'Oda durumu senkronize edilemedi.',
  'SC-MP-011': 'Oda oluşturulamadı.',
  'SC-MP-012': 'Bot odadan kaldırılamadı.',
};

export type MultiplayerActionType =
  | 'JOIN_ROOM'
  | 'LEAVE_ROOM'
  | 'READY'
  | 'START_DRAFT'
  | 'PLAYER_PICK'
  | 'AUTO_PICK'
  | 'RECONNECT'
  | 'HOST_MIGRATION'
  | 'SUBMIT_TACTICS'
  | 'SIMULATE_MATCH'
  | 'MATCHWEEK_READY'
  | 'START_LIVE_MATCHWEEK'
  | 'FINISH_LIVE_MATCHWEEK'
  | 'UPDATE_STANDINGS'
  | 'UPDATE_RULES'
  | 'UPDATE_CLUB'
  | 'ADD_BOT'
  | 'REMOVE_BOT'
  | 'REMATCH';

export interface MultiplayerActionLog {
  id: string;
  timestamp: string;
  roomId: string;
  sessionId: string;
  action: MultiplayerActionType;
  previousStateVersion: number;
  resultingStateVersion: number;
  success: boolean;
  errorCode?: MultiplayerErrorCode;
  errorMessage?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// CLUB & BADGE TYPES
// ============================================================================

export type BadgeShape = 'shield' | 'circle' | 'diamond' | 'hexagon' | 'banner';
export type BadgePattern = 'solid' | 'stripes_vertical' | 'stripes_horizontal' | 'diagonal_half' | 'cross' | 'quartered';
export type BadgeEmblem = 'star' | 'crown' | 'eagle_crest' | 'lion_crest' | 'anchor' | 'torch' | 'lightning' | 'initials';

export interface BadgeConfig {
  shape: BadgeShape;
  pattern: BadgePattern;
  emblem: BadgeEmblem;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
}

export interface DraftClub {
  id: string;
  roomId: string;
  memberId: string;
  name: string;
  code: string; // 3-letter uppercase code
  managerName: string;
  primaryColor: string;
  secondaryColor: string;
  badge: BadgeConfig;
  squadPlayerIds: string[];
}

// ============================================================================
// DRAFT STATE & PICK TYPES
// ============================================================================

export interface DraftPick {
  id: string;
  roomId: string;
  round: number; // 1-indexed
  pickIndexInRound: number; // 0-indexed
  globalPickNumber: number; // 1-indexed
  memberId: string;
  clubId: string;
  playerId: string;
  selectedAt: string;
  isAutoPick: boolean;
  timeTakenSeconds: number;
}

export interface DraftState {
  roomId: string;
  currentRound: number;
  currentPickIndex: number;
  currentTurnMemberId: string;
  currentTurnStartTime: number; // ms timestamp
  pickDeadline: number; // ms timestamp
  draftOrder: string[]; // memberIds
  isPaused: boolean;
  isCompleted: boolean;
  picks: DraftPick[];
}

// ============================================================================
// FIXTURE & LEAGUE TYPES
// ============================================================================

export type DraftFixtureStatus = 'AWAITING_TACTICS' | 'READY' | 'SIMULATING' | 'COMPLETED';

export interface DraftFixture {
  id: string;
  roomId: string;
  round: number;
  homeClubId: string;
  awayClubId: string;
  status: DraftFixtureStatus;
  homeTactics?: ClubTactics;
  awayTactics?: ClubTactics;
  homeScore?: number;
  awayScore?: number;
  matchResult?: MatchEngineState;
  seed?: string;
  simulatedAt?: string;
}

export interface DraftStanding {
  rank: number;
  clubId: string;
  clubName: string;
  clubCode: string;
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

export interface LeagueAwards {
  championClubId: string;
  championClubName: string;
  topScorer?: { playerId: string; playerName: string; clubName: string; goals: number; assists?: number };
  topAssists?: { playerId: string; playerName: string; clubName: string; assists: number };
  bestRating?: { playerId: string; playerName: string; clubName: string; rating: number };
  bestGoalkeeper?: { playerId: string; playerName: string; clubName: string; cleanSheets: number };
  highestScoringMatch?: { homeName: string; awayName: string; score: string; totalGoals: number };
  biggestWin?: { winnerName: string; loserName: string; score: string; goalDiff: number };
  bestAttack?: { clubName: string; goalsFor: number };
  bestDefense?: { clubName: string; goalsAgainst: number };
}

// ============================================================================
// FEEDBACK & BUG REPORT
// ============================================================================

export type FeedbackCategory = 'Hata' | 'Denge' | 'Arayüz' | 'Maç Motoru' | 'Draft' | 'Diğer';

export interface MultiplayerFeedback {
  id: string;
  roomId?: string;
  sessionId: string;
  route: string;
  category: FeedbackCategory;
  comment: string;
  createdAt: string;
}

export interface DetailedAlphaFeedback {
  id: string;
  roomId?: string;
  sessionId: string;
  ratings: {
    draftFun: number; // 1-5
    draftBalance: number; // 1-5
    playerSelectionUI: number; // 1-5
    squadManagement: number; // 1-5
    tacticsScreen: number; // 1-5
    matchRealism: number; // 1-5
    matchSpeed: number; // 1-5
    mobileUsability: number; // 1-5
    overallExperience: number; // 1-5
  };
  textAnswers: {
    mostFrustrating: string;
    mostEnjoyable: string;
    missingFeature: string;
    singleChange: string;
  };
  createdAt: string;
}

export interface AlphaBugReport {
  id: string;
  errorType: string;
  description: string;
  currentRoute: string;
  roomCode?: string;
  gamePhase: string;
  appVersion: string;
  browserType: string;
  stateVersion?: number;
  recentLogs: MultiplayerActionLog[];
  createdAt: string;
}

export interface MultiplayerTelemetryEvent {
  id: string;
  roomId?: string;
  eventType: 'DRAFT_PICK' | 'AUTO_PICK' | 'MATCH_SIMULATED' | 'LEAGUE_COMPLETED' | 'RECONNECT' | 'HOST_MIGRATED';
  data: Record<string, unknown>;
  timestamp: string;
}
