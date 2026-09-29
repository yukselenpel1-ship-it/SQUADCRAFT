import { YouthPlayer } from './types';

/**
 * Handles monthly development of youth players in the academy.
 */
export function processMonthlyYouthDevelopment(
  player: YouthPlayer,
  academyLevel: number = 5,
  coachingQuality: number = 50
): YouthPlayer {
  // Only players below their potential grow
  if (player.overall >= player.potential) {
    return player;
  }

  // Monthly growth chance (e.g. 15-25% chance of +1 overall each month)
  const growthChance = 0.15 + (academyLevel * 0.01) + (coachingQuality * 0.001);
  const willGrow = Math.random() < growthChance;

  if (!willGrow) {
    return player;
  }

  const newOverall = player.overall + 1;
  const updatedAttrs = { ...player.attributes };

  // Boost random positional attribute
  const keys = Object.keys(updatedAttrs) as (keyof typeof updatedAttrs)[];
  const targetKey = keys[Math.floor(Math.random() * keys.length)];
  if (updatedAttrs[targetKey]) {
    updatedAttrs[targetKey] = Math.min(99, updatedAttrs[targetKey] + 1);
  }

  return {
    ...player,
    overall: newOverall,
    attributes: updatedAttrs,
  };
}
