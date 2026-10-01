import { PlayerInMatch, MatchEventType } from './types';
import { getEffectiveAttribute } from './teamStrength';
import { matchRandom } from './random';

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
      return 0.38 + matchRandom() * 0.12; // 0.38 - 0.50
    case 'CENTRAL_BOX':
      return 0.15 + matchRandom() * 0.09; // 0.15 - 0.24
    case 'WIDE_CROSS_HEADER':
      return 0.08 + matchRandom() * 0.07; // 0.08 - 0.15
    case 'WIDE_CROSS_VOLLEY':
      return 0.10 + matchRandom() * 0.08; // 0.10 - 0.18
    case 'CORNER_HEADER':
      return 0.06 + matchRandom() * 0.06; // 0.06 - 0.12
    case 'DIRECT_FREE_KICK':
      return 0.05 + matchRandom() * 0.05; // 0.05 - 0.10
    case 'LONG_SHOT':
      return 0.02 + matchRandom() * 0.03; // 0.02 - 0.05
    default:
      return 0.09;
  }
}

export function resolveShot(
  chanceType: ChanceType,
  shooter: PlayerInMatch,
  goalkeeper: PlayerInMatch,
  defendingOverallDefense: number,
  assister?: PlayerInMatch,
  isCompetitive: boolean = true
): ShotResolutionResult {
  const isHeader = chanceType === 'WIDE_CROSS_HEADER' || chanceType === 'CORNER_HEADER';
  const isLongShot = chanceType === 'LONG_SHOT' || chanceType === 'DIRECT_FREE_KICK';
  const isBreakaway = chanceType === 'ONE_ON_ONE';
  const isPenalty = chanceType === 'PENALTY';

  const shooterArch = shooter.player.archetype;
  const gkArch = goalkeeper.player.archetype;

  // Base xG
  let xG = calculateBaseXG(chanceType, isLongShot ? 24 : 12);

  // Playmaker Assister Impact: Great vision/passing increases chance quality (xG)
  if (assister) {
    const vis = getEffectiveAttribute(assister, 'vision', isCompetitive);
    const pas = getEffectiveAttribute(assister, 'passing', isCompetitive);
    let passQualityMult = (vis * 0.55 + pas * 0.45) / 75;
    if (assister.player.archetype === 'Oyun Kurucu' || assister.player.archetype === 'Oyun Kurucu Kanat') {
      passQualityMult *= 1.08;
    }
    xG = Number((xG * Math.max(0.85, Math.min(1.22, passQualityMult))).toFixed(3));
  }

  // Shooter skill score according to context:
  // Striker attributes: finishing, pace (for breakaways), physical/heading (for crosses/corners), composure
  let shooterSkill = 1.0;
  const fin = getEffectiveAttribute(shooter, 'finishing', isCompetitive);
  const com = getEffectiveAttribute(shooter, 'composure', isCompetitive);
  const tec = getEffectiveAttribute(shooter, 'technique', isCompetitive);
  const pac = getEffectiveAttribute(shooter, 'pace', isCompetitive);
  const str = getEffectiveAttribute(shooter, 'strength', isCompetitive);
  const hea = getEffectiveAttribute(shooter, 'heading', isCompetitive);
  const lsh = getEffectiveAttribute(shooter, 'longShots', isCompetitive);

  if (isPenalty) {
    shooterSkill = (fin * 0.55 + com * 0.45) / 75;
    if (shooterArch === 'Bitirici Forvet') shooterSkill *= 1.05;
  } else if (isHeader) {
    shooterSkill = (hea * 0.50 + str * 0.30 + com * 0.20) / 75;
    if (shooterArch === 'Hedef Santrfor') shooterSkill *= 1.10;
  } else if (isBreakaway) {
    shooterSkill = (fin * 0.40 + pac * 0.25 + com * 0.25 + tec * 0.10) / 75;
    if (shooterArch === 'Hızlı Kanat') shooterSkill *= 1.06;
    if (shooterArch === 'Bitirici Forvet') shooterSkill *= 1.08;
  } else if (isLongShot) {
    shooterSkill = (lsh * 0.60 + tec * 0.25 + com * 0.15) / 75;
  } else {
    // Central Box
    shooterSkill = (fin * 0.50 + com * 0.30 + str * 0.10 + tec * 0.10) / 75;
    if (shooterArch === 'Bitirici Forvet') shooterSkill *= 1.08;
  }

  // Shooter skill moderately adjusts xG without double-multiplying
  xG = Number((xG * Math.max(0.75, Math.min(1.25, shooterSkill))).toFixed(3));

  // Goalkeeper quality
  const gkReflexes = getEffectiveAttribute(goalkeeper, 'reflexes', isCompetitive);
  const gkPositioning = getEffectiveAttribute(goalkeeper, 'positioningGK', isCompetitive);
  const gkHandling = getEffectiveAttribute(goalkeeper, 'handling', isCompetitive);
  let gkSkill = (gkReflexes * 0.45 + gkPositioning * 0.35 + gkHandling * 0.20) / 75;

  // Sweeper Keeper cuts angle on 1-on-1 breakaways
  if (isBreakaway && gkArch === 'Süpürücü Kaleci') {
    gkSkill *= 1.15;
  }
  // Line Keeper has elite reflex saves on close-range box shots / headers
  if ((chanceType === 'CENTRAL_BOX' || isHeader) && gkArch === 'Çizgi Kalecisi') {
    gkSkill *= 1.10;
  }

  // Defensive pressure from defending unit
  const defPressure = defendingOverallDefense / 75;

  // Defensive contest combines GK ability and defensive line pressure
  const defContest = Math.max(0.60, gkSkill * 0.60 + defPressure * 0.40);

  // Conversion probability reflects xG challenged by defensive contest
  let goalProbability = xG * (1.10 / defContest);
  goalProbability = Math.max(0.01, Math.min(0.85, goalProbability));

  const roll = matchRandom();

  if (roll < goalProbability) {
    // GOAL!
    shooter.goals += 1;
    shooter.shots += 1;
    shooter.shotsOnTarget += 1;
    if (assister) {
      assister.assists += 1;
      assister.keyPasses = (assister.keyPasses || 0) + 1;
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
  const onTargetRoll = matchRandom();
  const onTargetThreshold = Math.min(0.85, 0.45 + (fin / 100) * 0.35);

  if (onTargetRoll < onTargetThreshold) {
    // Shot is on target -> Goalkeeper makes save or defender blocks
    shooter.shotsOnTarget += 1;

    // Check for post/crossbar (approx 4% of on-target non-goals)
    if (matchRandom() < 0.05) {
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
    if (matchRandom() < 0.25 && defendingOverallDefense > 65) {
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
