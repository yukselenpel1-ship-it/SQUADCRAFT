import { TacticalSettings, Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width } from '@/types/game';
import { TeamRatings } from './types';

export interface TacticalModifiers {
  chanceCreationMult: number;
  defenseSecurityMult: number;
  possessionShareBonus: number; // e.g. +5% or -5%
  counterVulnerabilityMult: number;
  breakawayThreatBonus: number;
  turnoverForcedBonus: number;
  turnoverConcededPenalty: number;
  fatigueBurnRateMult: number;
  crossingFrequencyMult: number;
  centralPlayMult: number;
  foulRiskMult: number;
}

export function computeTacticalModifiers(
  tactics: TacticalSettings,
  teamRatings: TeamRatings,
  opponentTactics: TacticalSettings,
  opponentRatings: TeamRatings
): TacticalModifiers {
  // 1. Mentality base modifiers
  let chanceCreationMult = 1.0;
  let defenseSecurityMult = 1.0;
  let counterVulnerabilityMult = 1.0;
  let possessionShareBonus = 0;

  switch (tactics.mentality) {
    case 'Çok Savunmacı':
      chanceCreationMult = 0.62;
      defenseSecurityMult = 1.35;
      counterVulnerabilityMult = 0.60;
      possessionShareBonus = -8;
      break;
    case 'Savunmacı':
      chanceCreationMult = 0.82;
      defenseSecurityMult = 1.18;
      counterVulnerabilityMult = 0.80;
      possessionShareBonus = -4;
      break;
    case 'Dengeli':
      chanceCreationMult = 1.00;
      defenseSecurityMult = 1.00;
      counterVulnerabilityMult = 1.00;
      possessionShareBonus = 0;
      break;
    case 'Hücum':
      chanceCreationMult = 1.22;
      defenseSecurityMult = 0.85;
      counterVulnerabilityMult = 1.25;
      possessionShareBonus = +4;
      break;
    case 'Aşırı Hücum':
      chanceCreationMult = 1.48;
      defenseSecurityMult = 0.68;
      counterVulnerabilityMult = 1.60;
      possessionShareBonus = +8;
      break;
  }

  // 2. Tempo modifiers
  let fatigueBurnRateMult = 1.0;
  let turnoverConcededPenalty = 0;

  switch (tactics.tempo) {
    case 'Çok Düşük':
      fatigueBurnRateMult *= 0.80;
      chanceCreationMult *= 0.88;
      possessionShareBonus += 4;
      turnoverConcededPenalty -= 0.05;
      break;
    case 'Düşük':
      fatigueBurnRateMult *= 0.90;
      chanceCreationMult *= 0.94;
      possessionShareBonus += 2;
      break;
    case 'Standart':
      break;
    case 'Yüksek':
      fatigueBurnRateMult *= 1.20;
      chanceCreationMult *= 1.10;
      turnoverConcededPenalty += 0.06;
      possessionShareBonus -= 2;
      break;
    case 'Çok Yüksek':
      fatigueBurnRateMult *= 1.45;
      chanceCreationMult *= 1.22;
      turnoverConcededPenalty += 0.12;
      possessionShareBonus -= 4;
      break;
  }

  // 3. Pressing modifiers
  let turnoverForcedBonus = 0;
  let foulRiskMult = 1.0;

  switch (tactics.pressing) {
    case 'Hafif':
      fatigueBurnRateMult *= 0.80;
      turnoverForcedBonus = -0.04;
      foulRiskMult = 0.75;
      break;
    case 'Orta':
      break;
    case 'Yoğun':
      fatigueBurnRateMult *= 1.35;
      turnoverForcedBonus = +0.06;
      foulRiskMult = 1.25;
      defenseSecurityMult *= 1.04;
      counterVulnerabilityMult *= 1.15;
      break;
    case 'Aşırı':
      fatigueBurnRateMult *= 1.80; // High stamina burn in second half
      turnoverForcedBonus = +0.10; // Calibrated down from excessive 0.16
      foulRiskMult = 1.60;
      counterVulnerabilityMult *= 1.35; // Significant defensive space left behind
      break;
  }

  // 4. Passing Style modifiers
  switch (tactics.passingStyle) {
    case 'Kısa':
      if (teamRatings.possessionAbility >= 75) {
        possessionShareBonus += 6;
        chanceCreationMult *= 1.08;
      } else {
        possessionShareBonus += 2;
        turnoverConcededPenalty += 0.04;
      }
      break;
    case 'Karışık':
      break;
    case 'Doğrudan':
      possessionShareBonus -= 4;
      chanceCreationMult *= 1.08;
      if (teamRatings.counterAttackAbility > 68) {
        chanceCreationMult *= 1.12;
      }
      break;
    case 'Uzun':
      possessionShareBonus -= 8;
      if (teamRatings.physicalStrength >= 72) {
        chanceCreationMult *= 1.12;
      } else {
        chanceCreationMult *= 0.90;
      }
      break;
  }

  // 5. Defensive Line & Opponent Pace Interaction
  let breakawayThreatBonus = 0;
  const isHighLine = tactics.defensiveLine === 'Yüksek' || tactics.defensiveLine === 'Çok Yüksek';
  const isDeepLine = tactics.defensiveLine === 'Derin' || tactics.defensiveLine === 'Çok Derin';

  if (isHighLine) {
    // High line compresses pressing, but gives opponent breakaway threat
    turnoverForcedBonus += 0.04;
    counterVulnerabilityMult *= 1.25;
    breakawayThreatBonus += 0.25;
    if (opponentRatings.counterAttackAbility > 65) {
      breakawayThreatBonus += (opponentRatings.counterAttackAbility - 65) * 0.02;
    }
  } else if (isDeepLine) {
    // Deep line compact shape provides robust defense in the box
    defenseSecurityMult *= 1.25;
    possessionShareBonus -= 5;
  }

  // 6. Tactical Matchups Interaction
  const isHighPress = tactics.pressing === 'Yoğun' || tactics.pressing === 'Aşırı';
  const isOpponentHighPress = opponentTactics.pressing === 'Yoğun' || opponentTactics.pressing === 'Aşırı';
  const isOpponentHighLine = opponentTactics.defensiveLine === 'Yüksek' || opponentTactics.defensiveLine === 'Çok Yüksek';
  const isDirectOrCounter = tactics.passingStyle === 'Doğrudan' || tactics.passingStyle === 'Uzun' || teamRatings.counterAttackAbility >= 65;

  // Interaction A: High press vs technically weak midfield
  if (isHighPress && opponentRatings.possessionAbility < 70) {
    turnoverForcedBonus += 0.08;
    possessionShareBonus += 3;
  }
  // Interaction B: High press vs high technical midfield -> press is bypassed easily
  if (isHighPress && opponentRatings.possessionAbility >= 78) {
    counterVulnerabilityMult *= 1.25;
    breakawayThreatBonus += 0.15;
  }
  // Interaction C: Low Block / Deep line defending against High Line / High Press
  // Compresses space, absorbs pressure, and launches lethal direct counters
  if (isDeepLine && (isOpponentHighLine || isOpponentHighPress)) {
    defenseSecurityMult *= 1.20;
    if (isDirectOrCounter) {
      breakawayThreatBonus += 0.40;
      chanceCreationMult *= 1.22;
    }
  }

  // 7. Width Modifiers
  let crossingFrequencyMult = 1.0;
  let centralPlayMult = 1.0;

  switch (tactics.width) {
    case 'Dar':
      centralPlayMult = 1.30;
      crossingFrequencyMult = 0.70;
      possessionShareBonus += 2;
      break;
    case 'Dengeli':
      break;
    case 'Geniş':
      crossingFrequencyMult = 1.40;
      centralPlayMult = 0.75;
      break;
  }

  return {
    chanceCreationMult,
    defenseSecurityMult,
    possessionShareBonus,
    counterVulnerabilityMult,
    breakawayThreatBonus,
    turnoverForcedBonus,
    turnoverConcededPenalty,
    fatigueBurnRateMult,
    crossingFrequencyMult,
    centralPlayMult,
    foulRiskMult,
  };
}
