import { Scout } from './types';

/**
 * Calculates a scout's overall competence score (1-100).
 */
export function getScoutOverallRating(scout: Scout): number {
  return Math.round(
    scout.judgingAbility * 0.40 +
    scout.judgingPotential * 0.35 +
    scout.tacticalKnowledge * 0.15 +
    scout.adaptability * 0.10
  );
}

/**
 * Calculates error margin (uncertainty half-width) for attribute estimation.
 * Strong scout (e.g. 85 ability) -> small error margin (1-2)
 * Weak scout (e.g. 45 ability) -> wide error margin (6-9)
 */
export function calculateScoutErrorMargin(
  scoutSkill: number, // 1-100 (judgingAbility or judgingPotential)
  daysScouted: number,
  isPotential: boolean = false
): number {
  // Base margin between 1 and 10 based on scout skill
  const skillFactor = Math.max(1, Math.round((100 - scoutSkill) / 10));
  
  // Time factor: longer scouting reduces margin
  let timeReduction = 0;
  if (daysScouted >= 30) timeReduction = 3;
  else if (daysScouted >= 14) timeReduction = 2;
  else if (daysScouted >= 7) timeReduction = 1;

  let margin = Math.max(1, skillFactor - timeReduction);

  // Potential is always harder to estimate by 50%
  if (isPotential) {
    margin = Math.max(2, Math.round(margin * 1.5));
  }

  return margin;
}

/**
 * Computes scout report confidence percentage (30% to 95%).
 */
export function calculateScoutConfidence(
  scout: Scout,
  daysScouted: number,
  regionalFamiliarity: number = 50
): number {
  const baseConfidence = Math.round(
    (scout.judgingAbility * 0.35 + scout.judgingPotential * 0.30 + scout.tacticalKnowledge * 0.15) * 0.6
  );
  
  const timeBonus = Math.min(30, Math.round(daysScouted * 1.0));
  const regionBonus = Math.round((regionalFamiliarity - 50) * 0.15);

  const confidence = Math.min(95, Math.max(30, baseConfidence + timeBonus + regionBonus));
  return confidence;
}

export const calculateReportConfidence = calculateScoutConfidence;

