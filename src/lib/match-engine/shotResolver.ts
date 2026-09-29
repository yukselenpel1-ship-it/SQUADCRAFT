import { PlayerInMatch, MatchEventType } from './types';
import { getEffectiveAttribute } from './teamStrength';

export type ChanceType =
  | 'PENALTY'
  | 'ONE_ON_ONE'
  | 'CENTRAL_BOX'
  | 'WIDE_CROSS_HEADER'
  | 'WIDE_CROSS_VOLLEY'
  | 'LONG_SHOT'
  | 'DIRECT_FREE_KICK'
  | 'CORNER_HEADER';

export interface ShotResolutionResult {
  outcome: MatchEventType;
  xG: number;
  isOnTarget: boolean;
  shooterRatingChange: number;
  gkRatingChange: number;
  assisterRatingChange?: number;
}

export function calculateBaseXG(chanceType: ChanceType, distanceMeters: number): number {
  switch (chanceType) {
    case 'PENALTY':
      return 0.76;
    case 'ONE_ON_ONE':
      return 0.45 + Math.random() * 0.18; // 0.45 - 0.63
    case 'CENTRAL_BOX':
      return 0.22 + Math.random() * 0.14; // 0.22 - 0.36
    case 'WIDE_CROSS_HEADER':
      return 0.09 + Math.random() * 0.08; // 0.09 - 0.17
    case 'WIDE_CROSS_VOLLEY':
      return 0.12 + Math.random() * 0.10; // 0.12 - 0.22
    case 'CORNER_HEADER':
      return 0.08 + Math.random() * 0.09; // 0.08 - 0.17
    case 'DIRECT_FREE_KICK':
      return 0.06 + Math.random() * 0.06; // 0.06 - 0.12
    case 'LONG_SHOT':
      return 0.02 + Math.random() * 0.04; // 0.02 - 0.06
    default:
      return 0.10;
  }
}

export function resolveShot(
  chanceType: ChanceType,
  shooter: PlayerInMatch,
  goalkeeper: PlayerInMatch,
  defendingOverallDefense: number,
  assister?: PlayerInMatch
): ShotResolutionResult {
  const isHeader = chanceType === 'WIDE_CROSS_HEADER' || chanceType === 'CORNER_HEADER';
  const isLongShot = chanceType === 'LONG_SHOT' || chanceType === 'DIRECT_FREE_KICK';

  // Base xG
  let xG = calculateBaseXG(chanceType, isLongShot ? 24 : 12);

  // Shooter attribute modifiers
  const finishing = isHeader
    ? getEffectiveAttribute(shooter, 'heading')
    : isLongShot
    ? getEffectiveAttribute(shooter, 'longShots')
    : getEffectiveAttribute(shooter, 'finishing');

  const composure = getEffectiveAttribute(shooter, 'composure');
  const technique = getEffectiveAttribute(shooter, 'technique');

  // Shooter skill score (0.80 to 1.25)
  const shooterSkill = (finishing * 0.50 + composure * 0.30 + technique * 0.20) / 75;
  xG = Number((xG * Math.max(0.70, Math.min(1.30, shooterSkill))).toFixed(3));

  // Goalkeeper quality
  const gkReflexes = getEffectiveAttribute(goalkeeper, 'reflexes');
  const gkPositioning = getEffectiveAttribute(goalkeeper, 'positioningGK');
  const gkHandling = getEffectiveAttribute(goalkeeper, 'handling');
  const gkSkill = (gkReflexes * 0.45 + gkPositioning * 0.35 + gkHandling * 0.20) / 75;

  // Defensive pressure
  const defPressure = defendingOverallDefense / 75;

  // Conversion probability (heavily based on xG, fine-tuned by shooter vs GK & defenders)
  let goalProbability = xG * 0.90;
  goalProbability = goalProbability * (shooterSkill / ((gkSkill + defPressure) / 2));
  goalProbability = Math.max(0.015, Math.min(0.92, goalProbability));

  const roll = Math.random();

  if (roll < goalProbability) {
    // GOAL!
    shooter.goals += 1;
    shooter.shots += 1;
    shooter.shotsOnTarget += 1;
    if (assister) {
      assister.assists += 1;
    }

    return {
      outcome: 'GOAL',
      xG,
      isOnTarget: true,
      shooterRatingChange: 0.8,
      gkRatingChange: -0.2,
      assisterRatingChange: 0.5,
    };
  }

  // If not a goal, determine if on target, saved, blocked, or off target
  shooter.shots += 1;
  const onTargetRoll = Math.random();
  const onTargetThreshold = Math.min(0.85, 0.45 + (finishing / 100) * 0.35);

  if (onTargetRoll < onTargetThreshold) {
    // Shot is on target -> Goalkeeper makes save or defender blocks
    shooter.shotsOnTarget += 1;

    // Check for post/crossbar (approx 4% of on-target non-goals)
    if (Math.random() < 0.05) {
      return {
        outcome: 'POST',
        xG,
        isOnTarget: true,
        shooterRatingChange: 0.1,
        gkRatingChange: 0.0,
      };
    }

    // Goalkeeper Save
    goalkeeper.saves += 1;
    return {
      outcome: 'SAVE',
      xG,
      isOnTarget: true,
      shooterRatingChange: 0.05,
      gkRatingChange: 0.25,
    };
  } else {
    // Defender Block check (approx 20% of off-target shots)
    if (Math.random() < 0.25 && defendingOverallDefense > 65) {
      return {
        outcome: 'BLOCKED_SHOT',
        xG,
        isOnTarget: false,
        shooterRatingChange: -0.05,
        gkRatingChange: 0.0,
      };
    }

    // Off Target
    return {
      outcome: 'SHOT',
      xG,
      isOnTarget: false,
      shooterRatingChange: xG > 0.35 ? -0.2 : -0.05, // penalty for missing big chance
      gkRatingChange: 0.0,
    };
  }
}
