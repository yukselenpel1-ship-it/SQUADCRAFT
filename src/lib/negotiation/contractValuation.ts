import { Player, Club } from '@/types/game';
import { ContractOfferPackage, SquadRole, PlayerAgent } from './types';
import { getSquadRoleInfo } from './squadRole';
import { getPlayerAgent } from './agentLogic';
import { calculateRecommendedReleaseClause } from './releaseClauses';

/**
 * Calculates base weekly wage expectation for a player based on overall rating and age.
 */
export function calculateBaseWageDemand(overall: number, age: number): number {
  let baseWage = 3000;

  if (overall >= 85) baseWage = 75000 + (overall - 85) * 12000;
  else if (overall >= 80) baseWage = 45000 + (overall - 80) * 6000;
  else if (overall >= 75) baseWage = 25000 + (overall - 75) * 4000;
  else if (overall >= 70) baseWage = 14000 + (overall - 70) * 2200;
  else if (overall >= 65) baseWage = 8000 + (overall - 65) * 1200;
  else if (overall >= 60) baseWage = 4500 + (overall - 60) * 700;
  else baseWage = 2500 + (overall - 50) * 200;

  // Age factor
  if (age <= 19) baseWage *= 0.65;
  else if (age <= 21) baseWage *= 0.85;
  else if (age >= 33) baseWage *= 0.80;

  return Math.round(baseWage / 500) * 500;
}

/**
 * Computes ideal / initial demands of a player and agent for contract negotiation.
 */
export function calculatePlayerContractDemands(
  player: Player,
  buyerClub: Club,
  targetRole: SquadRole = 'İlk 11',
  isRenewal: boolean = false
): ContractOfferPackage {
  const agent = getPlayerAgent(player);
  const roleInfo = getSquadRoleInfo(targetRole);

  const baseWage = calculateBaseWageDemand(player.overall, player.age);
  
  // Existing wage floor
  const currentWage = player.wage || baseWage;
  let wageMultiplier = roleInfo.wageMultiplier;

  // Renewal / loyalty or agent style factor
  if (isRenewal) {
    wageMultiplier *= 1.10; // modest raise on renewal
  }

  if (agent.style === 'Maksimum Kazanç Odaklı') {
    wageMultiplier *= 1.25;
  } else if (agent.style === 'Sert') {
    wageMultiplier *= 1.15;
  } else if (agent.style === 'Kolaycı') {
    wageMultiplier *= 0.95;
  }

  const targetWage = Math.max(
    Math.round(currentWage * 1.05),
    Math.round((baseWage * wageMultiplier) / 500) * 500
  );

  // Preferred Duration
  let durationYears = 3;
  if (player.age <= 22) durationYears = 4;
  else if (player.age >= 32) durationYears = 2;
  else if (player.age >= 34) durationYears = 1;

  // Bonuses
  let signingBonus = Math.round(targetWage * 6);
  if (agent.style === 'Maksimum Kazanç Odaklı') signingBonus = Math.round(targetWage * 12);
  else if (agent.style === 'Kolaycı') signingBonus = Math.round(targetWage * 3);

  const appearanceBonus = Math.round((targetWage * 0.12) / 100) * 100;
  
  let goalBonus = 0;
  let cleanSheetBonus = 0;

  if (['ST', 'AML', 'AMR', 'AMC'].includes(player.position)) {
    goalBonus = Math.round((targetWage * 0.15) / 100) * 100;
  }

  if (['GK', 'DC', 'DR', 'DL', 'DMC'].includes(player.position)) {
    cleanSheetBonus = Math.round((targetWage * 0.12) / 100) * 100;
  }

  const releaseClause = calculateRecommendedReleaseClause(player);

  return {
    wage: targetWage,
    durationYears,
    squadRole: targetRole,
    signingBonus,
    appearanceBonus,
    goalBonus,
    cleanSheetBonus,
    releaseClause,
  };
}
