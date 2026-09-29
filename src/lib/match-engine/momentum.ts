export interface MomentumState {
  homeMomentum: number; // 0 to 100
  awayMomentum: number; // 0 to 100
}

export function createInitialMomentum(isHomeAdvantaged: boolean = true): MomentumState {
  return {
    homeMomentum: isHomeAdvantaged ? 54 : 50,
    awayMomentum: isHomeAdvantaged ? 46 : 50,
  };
}

export function decayMomentum(state: MomentumState): MomentumState {
  const decayTowards = (current: number, target = 50, rate = 0.06) => {
    return Number((current + (target - current) * rate).toFixed(2));
  };

  return {
    homeMomentum: decayTowards(state.homeMomentum),
    awayMomentum: decayTowards(state.awayMomentum),
  };
}

export function addMomentumBoost(
  state: MomentumState,
  team: 'HOME' | 'AWAY',
  amount: number
): MomentumState {
  const boostHome = team === 'HOME';
  const newHome = boostHome
    ? Math.min(95, state.homeMomentum + amount)
    : Math.max(10, state.homeMomentum - amount * 0.7);
  const newAway = !boostHome
    ? Math.min(95, state.awayMomentum + amount)
    : Math.max(10, state.awayMomentum - amount * 0.7);

  return {
    homeMomentum: Number(newHome.toFixed(2)),
    awayMomentum: Number(newAway.toFixed(2)),
  };
}
