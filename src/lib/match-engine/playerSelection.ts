import { PlayerInMatch } from './types';
import { getEffectiveAttribute } from './teamStrength';
import { ChanceType } from './shotResolver';
import { matchRandom } from './random';

export function selectShooter(
  attackingPlayers: PlayerInMatch[],
  chanceType: ChanceType,
  isCompetitive: boolean = true,
  rng?: () => number
): PlayerInMatch {
  if (attackingPlayers.length === 0) {
    throw new Error('No active attacking players found');
  }

  const isHeader = chanceType === 'CORNER_HEADER' || chanceType === 'WIDE_CROSS_HEADER';
  const isBreakaway = chanceType === 'ONE_ON_ONE';
  const isLongShot = chanceType === 'LONG_SHOT' || chanceType === 'DIRECT_FREE_KICK';
  const isPenalty = chanceType === 'PENALTY';

  const weights = attackingPlayers.map((pim) => {
    const pos = pim.currentPosition;
    const arch = pim.player.archetype;

    let baseWeight = 1.0;
    let statFactor = 1.0;

    if (isPenalty) {
      const fin = getEffectiveAttribute(pim, 'finishing', isCompetitive);
      const com = getEffectiveAttribute(pim, 'composure', isCompetitive);
      baseWeight = pos === 'ST' ? 5.0 : ['AMC', 'AML', 'AMR', 'MC'].includes(pos) ? 3.0 : 1.0;
      statFactor = (fin * 0.55 + com * 0.45) / 50;
      if (arch === 'Bitirici Forvet') baseWeight *= 1.3;
    } else if (isHeader) {
      const hea = getEffectiveAttribute(pim, 'heading', isCompetitive);
      const str = getEffectiveAttribute(pim, 'strength', isCompetitive);
      const posG = getEffectiveAttribute(pim, 'positioning', isCompetitive);

      if (pos === 'ST') baseWeight = 5.0;
      else if (pos === 'DC') baseWeight = chanceType === 'CORNER_HEADER' ? 4.5 : 0.8;
      else if (['AML', 'AMR', 'AMC'].includes(pos)) baseWeight = 2.0;
      else if (['MC', 'DMC'].includes(pos)) baseWeight = 1.2;
      else baseWeight = 0.4;

      statFactor = (hea * 0.50 + str * 0.30 + posG * 0.20) / 50;
      if (arch === 'Hedef Santrfor') baseWeight *= 1.6;
      if (arch === 'Fiziksel Stoper' && chanceType === 'CORNER_HEADER') baseWeight *= 1.4;
    } else if (isBreakaway) {
      const pac = getEffectiveAttribute(pim, 'pace', isCompetitive);
      const acc = getEffectiveAttribute(pim, 'acceleration', isCompetitive);
      const fin = getEffectiveAttribute(pim, 'finishing', isCompetitive);
      const posG = getEffectiveAttribute(pim, 'positioning', isCompetitive);

      if (pos === 'ST') baseWeight = 5.5;
      else if (['AML', 'AMR'].includes(pos)) baseWeight = 5.0;
      else if (pos === 'AMC') baseWeight = 2.5;
      else if (['MC', 'MR', 'ML'].includes(pos)) baseWeight = 1.2;
      else baseWeight = 0.2;

      statFactor = (pac * 0.40 + acc * 0.25 + fin * 0.20 + posG * 0.15) / 50;
      if (arch === 'Hızlı Kanat') baseWeight *= 1.5;
      if (arch === 'Bitirici Forvet') baseWeight *= 1.4;
    } else if (isLongShot) {
      const lsh = getEffectiveAttribute(pim, 'longShots', isCompetitive);
      const tec = getEffectiveAttribute(pim, 'technique', isCompetitive);
      const com = getEffectiveAttribute(pim, 'composure', isCompetitive);

      if (pos === 'AMC') baseWeight = 4.5;
      else if (['MC', 'MR', 'ML'].includes(pos)) baseWeight = 4.0;
      else if (['AML', 'AMR'].includes(pos)) baseWeight = 3.0;
      else if (pos === 'ST') baseWeight = 2.2;
      else if (pos === 'DMC') baseWeight = 1.5;
      else baseWeight = 0.5;

      statFactor = (lsh * 0.55 + tec * 0.25 + com * 0.20) / 50;
    } else {
      // Central Box Play
      const fin = getEffectiveAttribute(pim, 'finishing', isCompetitive);
      const posG = getEffectiveAttribute(pim, 'positioning', isCompetitive);
      const com = getEffectiveAttribute(pim, 'composure', isCompetitive);
      const str = getEffectiveAttribute(pim, 'strength', isCompetitive);

      if (pos === 'ST') baseWeight = 6.0;
      else if (['AML', 'AMR', 'AMC'].includes(pos)) baseWeight = 3.0;
      else if (['MC', 'MR', 'ML'].includes(pos)) baseWeight = 1.4;
      else if (pos === 'DC') baseWeight = 0.3;
      else baseWeight = 0.5;

      statFactor = (fin * 0.45 + posG * 0.30 + com * 0.15 + str * 0.10) / 50;
      if (arch === 'Bitirici Forvet') baseWeight *= 1.5;
      if (arch === 'Hedef Santrfor') baseWeight *= 1.25;
    }

    if (pos === 'GK') baseWeight = 0.001;

    return Math.max(0.01, baseWeight * statFactor);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = matchRandom(rng) * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      return attackingPlayers[i];
    }
  }

  return attackingPlayers[0];
}

export function selectAssister(
  attackingPlayers: PlayerInMatch[],
  excludePlayerId: string,
  isCross: boolean = false,
  isCompetitive: boolean = true,
  rng?: () => number
): PlayerInMatch | undefined {
  const candidates = attackingPlayers.filter((p) => p.player.id !== excludePlayerId && p.currentPosition !== 'GK');
  if (candidates.length === 0) return undefined;

  const weights = candidates.map((pim) => {
    const pos = pim.currentPosition;
    const arch = pim.player.archetype;
    const vis = getEffectiveAttribute(pim, 'vision', isCompetitive);
    const pas = getEffectiveAttribute(pim, 'passing', isCompetitive);
    const cro = getEffectiveAttribute(pim, 'crossing', isCompetitive);
    const tec = getEffectiveAttribute(pim, 'technique', isCompetitive);

    let baseWeight = 1.0;
    let statFactor = 1.0;

    if (isCross) {
      if (['AMR', 'AML', 'MR', 'ML'].includes(pos)) baseWeight = 6.0;
      else if (['DR', 'DL'].includes(pos)) baseWeight = 4.5;
      else if (['AMC', 'MC'].includes(pos)) baseWeight = 2.0;
      else if (pos === 'ST') baseWeight = 1.2;
      else baseWeight = 0.6;

      statFactor = (cro * 0.55 + vis * 0.25 + tec * 0.20) / 50;
      if (arch === 'Hücumcu Bek') baseWeight *= 1.5;
      if (arch === 'Hızlı Kanat' || arch === 'Oyun Kurucu Kanat') baseWeight *= 1.4;
    } else {
      if (pos === 'AMC') baseWeight = 6.0;
      else if (pos === 'MC') baseWeight = 4.5;
      else if (['AMR', 'AML'].includes(pos)) baseWeight = 3.2;
      else if (pos === 'ST') baseWeight = 2.2;
      else if (pos === 'DMC') baseWeight = 1.8;
      else if (pos === 'DC') baseWeight = 0.8;
      else baseWeight = 0.8;

      statFactor = (vis * 0.45 + pas * 0.40 + tec * 0.15) / 50;
      if (arch === 'Oyun Kurucu' || arch === 'Oyun Kurucu Kanat') baseWeight *= 1.7;
      if (arch === 'Pasör Stoper') baseWeight *= 1.4;
    }

    return Math.max(0.01, baseWeight * statFactor);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = matchRandom(rng) * totalWeight;

  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      return candidates[i];
    }
  }

  return candidates[0];
}

export function getGoalkeeper(teamPlayers: PlayerInMatch[]): PlayerInMatch | undefined {
  const gk = teamPlayers.find((p) => p.isOnPitch && p.currentPosition === 'GK');
  if (gk) return gk;
  return teamPlayers.find((p) => p.isOnPitch);
}
