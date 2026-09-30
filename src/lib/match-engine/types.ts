import {
  Club,
  Player,
  PlayerPosition,
  Formation,
  TacticalSettings,
  MatchStatus,
} from '@/types/game';

export type MatchEventType =
  | 'KICKOFF'
  | 'HALFTIME'
  | 'FULLTIME'
  | 'GOAL'
  | 'SHOT'
  | 'SHOT_ON_TARGET'
  | 'SAVE'
  | 'POST'
  | 'BLOCKED_SHOT'
  | 'CORNER'
  | 'FOUL'
  | 'YELLOW_CARD'
  | 'RED_CARD'
  | 'INJURY'
  | 'SUBSTITUTION'
  | 'BIG_CHANCE'
  | 'PENALTY_AWARDED'
  | 'PENALTY_MISSED'
  | 'OFFSIDE';

export type AttackingDirection = 'HOME_ATTACK' | 'AWAY_ATTACK' | 'MIDFIELD';

export interface PitchCoordinates {
  x: number; // 0 to 100 (left to right)
  y: number; // 0 to 100 (top to bottom)
}

export interface MatchEngineEvent {
  id: string;
  minute: number;
  second: number;
  type: MatchEventType;
  teamId: string;
  playerId?: string;
  playerName?: string;
  secondaryPlayerId?: string;
  secondaryPlayerName?: string;
  description: string;
  commentary: string;
  xGValue?: number;
  pitchCoords?: PitchCoordinates;
  attackingDirection?: AttackingDirection;
  isImportant: boolean;
}

export interface TeamMatchStats {
  shots: number;
  shotsOnTarget: number;
  xG: number;
  corners: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  passes: number;
  completedPasses: number;
  saves: number;
  offsides: number;
}

export interface PlayerInMatch {
  player: Player;
  currentPosition: PlayerPosition;
  slotIndex?: number;
  isStartingXI: boolean;
  isOnPitch: boolean;
  minutesPlayed: number;
  matchRating: number; // Starts 6.5 (4.0 to 10.0)
  currentFitness: number; // 1-100
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passesAttempted: number;
  passesCompleted: number;
  tacklesAttempted: number;
  tacklesWon: number;
  interceptions: number;
  saves: number;
  foulsCommitted: number;
  yellowCards: number;
  redCards: number;
  keyPasses?: number;
  blocks?: number;
  matchDayConsistencyVariance?: number;
  isInjured: boolean;
  injurySeverity?: 'LIGHT' | 'MODERATE' | 'SEVERE';
}

export interface TeamRatings {
  attackingStrength: number;
  midfieldStrength: number;
  defensiveStrength: number;
  goalkeeperStrength: number;
  physicalStrength: number;
  creativity: number;
  pressingAbility: number;
  possessionAbility: number;
  counterAttackAbility: number;
  setPieceAbility: number;
  overallRating: number;
}

export interface MatchTeamRuntime {
  club: Club;
  tactics: TacticalSettings;
  formation: Formation;
  players: Record<string, PlayerInMatch>;
  startingXIIds: string[];
  activePitchPlayerIds: string[];
  benchPlayerIds: string[];
  substitutionsUsed: number; // max 5
  maxSubstitutions: number;
  ratings: TeamRatings;
  stats: TeamMatchStats;
  consecutiveAttacks: number;
}

export interface MatchEngineState {
  fixtureId: string;
  minute: number;
  addedTimeFirstHalf: number;
  addedTimeSecondHalf: number;
  currentAddedTime: number;
  isFirstHalf: boolean;
  isSecondHalf: boolean;
  isFinished: boolean;
  homeScore: number;
  awayScore: number;
  homePossessionPercent: number; // 0 to 100
  awayPossessionPercent: number; // 0 to 100
  homeMomentum: number; // 0 to 100
  awayMomentum: number; // 0 to 100
  home: MatchTeamRuntime;
  away: MatchTeamRuntime;
  events: MatchEngineEvent[];
  commentaryLog: string[];
  latestEvent?: MatchEngineEvent;
  lastAttackingAction?: {
    direction: AttackingDirection;
    type: string;
    coords: PitchCoordinates;
  };
  debugInfo?: {
    homeOverall: number;
    awayOverall: number;
    homeAttack: number;
    awayAttack: number;
    homeDefense: number;
    awayDefense: number;
    homeMidfield: number;
    awayMidfield: number;
    chanceProbabilityHome: number;
    chanceProbabilityAway: number;
    possessionDelta: number;
  };
}

export interface MatchSimulationConfig {
  isCompetitive: boolean;
  enableHomeAdvantage: boolean;
  homeAdvantageMultiplier?: number;
  randomSeed?: number;
  debugMode?: boolean;
}
