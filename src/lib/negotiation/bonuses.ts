import { TransferBonus, TransferBonusType } from './types';

export function createAppearanceBonus(threshold: number, amount: number): TransferBonus {
  return {
    type: 'APPEARANCES',
    threshold,
    amount,
    description: `${threshold} resmi lig maçına çıkması halinde €${amount.toLocaleString('tr-TR')}`,
  };
}

export function createGoalBonus(threshold: number, amount: number): TransferBonus {
  return {
    type: 'GOALS',
    threshold,
    amount,
    description: `Sezonda ${threshold} gole ulaşması halinde €${amount.toLocaleString('tr-TR')}`,
  };
}

export function createChampionshipBonus(amount: number): TransferBonus {
  return {
    type: 'CHAMPIONSHIP',
    amount,
    description: `Alveria Elit Ligi şampiyonluğu kazanılması halinde €${amount.toLocaleString('tr-TR')}`,
  };
}

export function createContinentalBonus(amount: number): TransferBonus {
  return {
    type: 'CONTINENTAL',
    amount,
    description: `Kıtasal Şampiyona / Kıtasal Kupa vizesi alınması halinde €${amount.toLocaleString('tr-TR')}`,
  };
}

/**
 * Calculates the expected / discounted value of a set of bonuses from the selling club's perspective.
 */
export function calculateExpectedBonusValue(bonuses: TransferBonus[], buyerReputation: number = 75): number {
  let totalExpected = 0;
  for (const bonus of bonuses) {
    let probability = 0.5;
    if (bonus.type === 'APPEARANCES') probability = 0.80;
    else if (bonus.type === 'GOALS') probability = 0.65;
    else if (bonus.type === 'CONTINENTAL') probability = buyerReputation >= 75 ? 0.60 : 0.30;
    else if (bonus.type === 'CHAMPIONSHIP') probability = buyerReputation >= 85 ? 0.40 : 0.15;

    totalExpected += bonus.amount * probability;
  }
  return totalExpected;
}
