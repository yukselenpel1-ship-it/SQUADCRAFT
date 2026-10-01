/**
 * Deterministic PRNG for SquadCraft Match Engine.
 * Implements a high-quality Mulberry32 PRNG seeded by fixtureId.
 * Guarantees that identical inputs + same fixtureId yield identical matches.
 */

export function createSeededRandom(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 15), 1 | h);
    h = (h + Math.imul(h ^ (h >>> 7), 61 | h)) ^ h;
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

let activeRng: (() => number) | null = null;

export function setActiveRng(rng: (() => number) | null) {
  activeRng = rng;
}

export function matchRandom(customRng?: () => number): number {
  if (customRng) return customRng();
  if (activeRng) return activeRng();
  return Math.random();
}
