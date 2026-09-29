import { Player, PlayerPosition, PlayerAttributes } from '@/types/game';

// ============================================================================
// 1. FICTIONAL SCOUTING REGIONS
// ============================================================================
export type ScoutingRegionId =
  | 'valeria-north'
  | 'sorven-basin'
  | 'eldoria-west'
  | 'merovin-belt'
  | 'tarsen-isles'
  | 'alveria-central';

export interface ScoutingRegion {
  id: ScoutingRegionId;
  name: string;
  description: string;
  talentDensity: number; // 1-100
  prominentAttributes: (keyof PlayerAttributes)[];
  descriptionTurkish: string;
}

// ============================================================================
// 2. SCOUT STAFF
// ============================================================================
export interface Scout {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  clubId: string; // User club or 'FREE_AGENT'
  judgingAbility: number; // 1-100 (accuracy of current ability assessment)
  judgingPotential: number; // 1-100 (accuracy of potential assessment)
  tacticalKnowledge: number; // 1-100 (tactical fit evaluation)
  adaptability: number; // 1-100 (efficiency outside familiar regions)
  regionKnowledge: Record<ScoutingRegionId, number>; // 1-100 per region
  wage: number; // Weekly wage (€)
  reputation: number; // 1-100
  activeAssignmentId?: string;
}

// ============================================================================
// 3. SCOUTING ASSIGNMENTS
// ============================================================================
export type AssignmentDurationDays = 3 | 7 | 14 | 30;

export interface ScoutAssignment {
  id: string;
  scoutId: string;
  scoutName: string;
  userClubId: string;
  targetType: 'PLAYER' | 'REGION';
  targetPlayerId?: string;
  targetPlayerName?: string;
  targetRegionId?: ScoutingRegionId;
  durationDays: AssignmentDurationDays;
  daysRemaining: number;
  startDate: string;
  completedDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

// ============================================================================
// 4. SCOUTING KNOWLEDGE LEVELS (0 to 5)
// ============================================================================
export type KnowledgeLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface ScoutingKnowledgeRecord {
  userClubId: string;
  playerId: string;
  knowledgeLevel: KnowledgeLevel;
  percentage: number; // 0 - 100%
  lastObservedDate: string;
  scoutedByScoutId?: string;
  isDiscovered: boolean;
}

// ============================================================================
// 5. HIDDEN PLAYER PROFILES (PERSONALITY, CONSISTENCY, BIG MATCH)
// ============================================================================
export type PlayerPersonalityType =
  | 'Profesyonel'
  | 'Hırslı'
  | 'Sadık'
  | 'Uyumlu'
  | 'Rekabetçi'
  | 'Rahat'
  | 'Dengesiz'
  | 'Takım Odaklı';

export interface PlayerHiddenProfile {
  playerId: string;
  personality: PlayerPersonalityType;
  consistency: number; // 1-100 (match rating variance)
  bigMatchTemperament: number; // 1-100 (performance in finals / derbies)
  injuryTendency: number; // 1-100
}

// ============================================================================
// 6. SCOUTING REPORTS & RECOMMENDATIONS
// ============================================================================
export type ScoutRecommendation =
  | 'Kesinlikle Önerilir'
  | 'Önerilir'
  | 'Takip Edilmeli'
  | 'Kararsız'
  | 'Önerilmez';

export interface ScoutingReport {
  id: string;
  scoutId: string;
  scoutName: string;
  playerId: string;
  playerName: string;
  date: string;
  knowledgeLevel: KnowledgeLevel;
  confidence: number; // 30% - 95%
  estimatedOverallMin: number;
  estimatedOverallMax: number;
  estimatedPotentialMin: number;
  estimatedPotentialMax: number;
  bestPosition: PlayerPosition;
  strengths: string[];
  weaknesses: string[];
  tacticalFit: string;
  personalityHint: string;
  consistencyHint: string;
  injuryTendencyHint: string;
  estimatedTransferFeeMin: number;
  estimatedTransferFeeMax: number;
  estimatedWageMin: number;
  estimatedWageMax: number;
  recommendation: ScoutRecommendation;
  summaryNotes: string;
}

// ============================================================================
// 7. FOG OF WAR & MASKED PLAYER VIEW
// ============================================================================
export interface MaskedAttributeRange {
  min: number;
  max: number;
  exact?: number;
  isUnknown: boolean;
  displayString: string; // e.g. "62-78", "73", "?"
}

export interface MaskedPlayerView {
  player: Player;
  isOwnPlayer: boolean;
  knowledgeLevel: KnowledgeLevel;
  knowledgePercentage: number;
  overallDisplay: string; // e.g. "72-76", "75", "?"
  potentialDisplay: string; // e.g. "78-87", "84", "?"
  marketValueDisplay: string; // e.g. "€4.5M – €6.8M", "€5.5M"
  wageDisplay: string; // e.g. "€25K – €32K/hf", "€28.000/hf"
  attributes: Record<keyof PlayerAttributes, MaskedAttributeRange>;
  personalityHint?: string;
  consistencyHint?: string;
  injuryHint?: string;
  latestReport?: ScoutingReport;
}
