import { PlayerInMatch } from './types';
import { getEffectiveAttribute } from './teamStrength';

export function selectShooter(
  attackingPlayers: PlayerInMatch[],
  isSetPiece: boolean = false
): PlayerInMatch {
  if (attackingPlayers.length === 0) {
    throw new Error('No active attacking players found');
  }

  const weights = attackingPlayers.map((pim) => {
    const pos = pim.currentPosition;
    const finishing = getEffectiveAttribute(pim, 'finishing');
    const positioning = getEffectiveAttribute(pim, 'positioning');
    const heading = getEffectiveAttribute(pim, 'heading');

    let baseWeight = 1.0;
    if (pos === 'ST') baseWeight = 5.5;
    else if (['AML', 'AMR', 'AMC'].includes(pos)) baseWeight = 3.8;
    else if (['MC', 'MR', 'ML'].includes(pos)) baseWeight = 1.8;
    else if (pos === 'DC') baseWeight = isSetPiece ? 4.5 : 0.4;
    else if (['DR', 'DL', 'DMC'].includes(pos)) baseWeight = isSetPiece ? 1.5 : 0.6;
    else if (pos === 'GK') baseWeight = 0.01;

    const statFactor = isSetPiece
      ? (heading * 0.6 + positioning * 0.4)
      : (finishing * 0.6 + positioning * 0.4);

    return baseWeight * (statFactor / 50);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;

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
  isCross: boolean = false
): PlayerInMatch | undefined {
  const candidates = attackingPlayers.filter((p) => p.player.id !== excludePlayerId && p.currentPosition !== 'GK');
  if (candidates.length === 0) return undefined;

  const weights = candidates.map((pim) => {
    const pos = pim.currentPosition;
    const vision = getEffectiveAttribute(pim, 'vision');
    const passing = getEffectiveAttribute(pim, 'passing');
    const crossing = getEffectiveAttribute(pim, 'crossing');

    let baseWeight = 1.0;
    if (['AMC', 'MC'].includes(pos)) baseWeight = isCross ? 2.5 : 5.0;
    else if (['AMR', 'AML', 'MR', 'ML'].includes(pos)) baseWeight = isCross ? 6.0 : 3.5;
    else if (['DR', 'DL'].includes(pos)) baseWeight = isCross ? 4.0 : 1.8;
    else if (pos === 'ST') baseWeight = 2.0;
    else baseWeight = 0.8;

    const statFactor = isCross ? (crossing * 0.6 + vision * 0.4) : (passing * 0.5 + vision * 0.5);
    return baseWeight * (statFactor / 50);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;

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
