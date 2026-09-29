import { Player, PlayerPosition, PlayerAttributes } from '@/types/game';

// ============================================================================
// 1. YOUTH PLAYER
// ============================================================================
export interface YouthPlayer extends Player {
  isAcademyGraduate: boolean;
  academyGraduationYear: string;
  contractStatus: 'AKADEMI' | 'PROFESYONEL';
  estimatedPotentialRange: [number, number];
  scoutOpinion: string;
}

// ============================================================================
// 2. YOUTH INTAKE BATCH
// ============================================================================
export interface YouthIntakeBatch {
  id: string;
  date: string;
  seasonYear: string;
  clubId: string;
  players: YouthPlayer[];
  intakeSummary: string;
}

// ============================================================================
// 3. YOUTH ACADEMY FACILITY
// ============================================================================
export interface YouthAcademyFacility {
  clubId: string;
  academyLevel: number; // 1 to 10
  youthCoachingQuality: number; // 1 to 100
  youthRecruitmentNetwork: number; // 1 to 100
  academyBudgetAnnual: number; // Annual budget (€)
  nextIntakeDate: string; // e.g. '2027-03-15'
  intakeHistory: YouthIntakeBatch[];
}
