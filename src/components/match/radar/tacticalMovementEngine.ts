import {
  MatchEngineState,
  MatchEngineEvent,
  PlayerInMatch,
  PitchCoordinates,
  AttackingDirection,
} from '@/lib/match-engine/types';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import { Formation, TacticalSettings } from '@/types/game';

export interface VisualPlayerPosition {
  id: string;
  isHome: boolean;
  name: string;
  role: string;
  rating: number;
  fitness: number;
  isInjured: boolean;
  yellowCards: number;
  redCards: number;
  goals: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  isBallCarrier: boolean;
  isPressing: boolean;
  isScorer: boolean;
}

export interface VisualBallState {
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  isInAir: boolean;
  isGoal: boolean;
  isShot: boolean;
  actionType?: string;
  actionCoords?: PitchCoordinates;
}

export type PossessionPhase =
  | 'KICKOFF'
  | 'HOME_BUILDUP'
  | 'HOME_PROGRESSION'
  | 'HOME_ATTACK'
  | 'HOME_SHOT'
  | 'AWAY_BUILDUP'
  | 'AWAY_PROGRESSION'
  | 'AWAY_ATTACK'
  | 'AWAY_SHOT'
  | 'CORNER_HOME'
  | 'CORNER_AWAY'
  | 'GOAL_CELEBRATION'
  | 'HALFTIME_FULLTIME';

/**
 * Calculates base formation coordinates on full pitch.
 * Home defends Left (x: 8 to 48), attacks Right (x: 50 to 95).
 * Away defends Right (x: 92 to 52), attacks Left (x: 50 to 5).
 */
export function getBaseFormationCoordinates(
  isHome: boolean,
  formation: Formation,
  slotIndex: number,
  totalSlots: number = 11
): { x: number; y: number } {
  const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-2-3-1'];
  const safeIdx = slotIndex >= 0 && slotIndex < slots.length ? slotIndex : slotIndex % slots.length;
  const slot = slots[safeIdx] || slots[0];

  // slot.x: 10 to 90 (tactics board width, 50 center)
  // slot.y: 15 (ST) to 88 (GK)
  let baseX = 50;
  let baseY = 50;

  if (isHome) {
    baseX = 8 + ((88 - slot.y) / 73) * 40;
    baseY = 12 + (slot.x / 100) * 76;
  } else {
    baseX = 92 - ((88 - slot.y) / 73) * 40;
    baseY = 12 + ((100 - slot.x) / 100) * 76;
  }

  return {
    x: Math.max(5, Math.min(95, baseX)),
    y: Math.max(10, Math.min(90, baseY)),
  };
}

/**
 * Applies tactical modifiers (width, defensive line, mentality) to base coordinates.
 */
export function applyTacticalModifiers(
  coords: { x: number; y: number },
  isHome: boolean,
  tactics: TacticalSettings,
  role: string
): { x: number; y: number } {
  let { x, y } = coords;

  // 1. Width adjustment (stretches or compresses along Y axis)
  const widthFactor =
    tactics.width === 'Geniş' ? 1.18 : tactics.width === 'Dar' ? 0.84 : 1.0;
  y = 50 + (y - 50) * widthFactor;

  // 2. Defensive Line modifier (shifts defensive & midfield line X)
  const defLineShift =
    tactics.defensiveLine === 'Yüksek' ? 6 : tactics.defensiveLine === 'Derin' ? -6 : 0;
  if (role !== 'GK') {
    x += isHome ? defLineShift : -defLineShift;
  }

  // 3. Mentality modifier (shifts general team block X)
  let mentalityShift = 0;
  switch (tactics.mentality) {
    case 'Aşırı Hücum':
      mentalityShift = 9;
      break;
    case 'Hücum':
      mentalityShift = 5;
      break;
    case 'Savunmacı':
      mentalityShift = -5;
      break;
    case 'Çok Savunmacı':
      mentalityShift = -9;
      break;
    case 'Dengeli':
    default:
      mentalityShift = 0;
      break;
  }

  if (role !== 'GK') {
    x += isHome ? mentalityShift : -mentalityShift;
  }

  return {
    x: Math.max(isHome ? 6 : 48, Math.min(isHome ? 52 : 94, x)),
    y: Math.max(10, Math.min(90, y)),
  };
}

/**
 * Determines current visual possession phase based on engine state.
 */
export function determinePossessionPhase(state: MatchEngineState): PossessionPhase {
  const latest = state.latestEvent;
  const lastAction = state.lastAttackingAction;
  const minute = state.minute;

  if (state.isFinished || minute === 45) {
    return 'HALFTIME_FULLTIME';
  }

  if (minute === 0 && (!latest || latest.type === 'KICKOFF')) {
    return 'KICKOFF';
  }

  // Goal celebration check
  if (
    lastAction?.type === 'GOAL' ||
    (latest?.type === 'GOAL' && minute - latest.minute <= 2)
  ) {
    return 'GOAL_CELEBRATION';
  }

  // Corner check
  if (latest?.type === 'CORNER') {
    return latest.teamId === state.home.club.id ? 'CORNER_HOME' : 'CORNER_AWAY';
  }

  // Active attack direction
  if (lastAction?.direction === 'HOME_ATTACK') {
    if (['SHOT', 'SHOT_ON_TARGET', 'GOAL', 'SAVE', 'POST'].includes(lastAction.type)) {
      return 'HOME_SHOT';
    }
    return lastAction.coords && lastAction.coords.x > 75
      ? 'HOME_ATTACK'
      : 'HOME_PROGRESSION';
  }

  if (lastAction?.direction === 'AWAY_ATTACK') {
    if (['SHOT', 'SHOT_ON_TARGET', 'GOAL', 'SAVE', 'POST'].includes(lastAction.type)) {
      return 'AWAY_SHOT';
    }
    return lastAction.coords && lastAction.coords.x < 25
      ? 'AWAY_ATTACK'
      : 'AWAY_PROGRESSION';
  }

  // Neutral / possession based
  const isHome = state.homePossessionPercent >= 50;
  return isHome ? 'HOME_BUILDUP' : 'AWAY_BUILDUP';
}

/**
 * Computes target coordinates for all 22 players and the ball for the current frame/state.
 */
export function computeTacticalTargets(
  state: MatchEngineState,
  phaseProgress: number = 0.5 // 0 to 1 within current minute/action cycle
): {
  players: Record<string, { x: number; y: number; isBallCarrier: boolean; isPressing: boolean }>;
  ball: { x: number; y: number; isGoal: boolean; isShot: boolean; isInAir: boolean };
  activePhase: PossessionPhase;
} {
  const phase = determinePossessionPhase(state);
  const homeActive = state.home.activePitchPlayerIds.map((id) => state.home.players[id]).filter(Boolean);
  const awayActive = state.away.activePitchPlayerIds.map((id) => state.away.players[id]).filter(Boolean);

  const homeTactics = state.home.tactics;
  const awayTactics = state.away.tactics;
  const homeFormation = state.home.formation || '4-2-3-1';
  const awayFormation = state.away.formation || '4-2-3-1';

  const playerTargets: Record<string, { x: number; y: number; isBallCarrier: boolean; isPressing: boolean }> = {};

  // 1. Base + Tactical Coordinates for Home
  homeActive.forEach((pim, idx) => {
    const slotIdx = pim.slotIndex !== undefined ? pim.slotIndex : idx;
    const base = getBaseFormationCoordinates(true, homeFormation, slotIdx, homeActive.length);
    const mod = applyTacticalModifiers(base, true, homeTactics, pim.currentPosition);
    playerTargets[pim.player.id] = {
      x: mod.x,
      y: mod.y,
      isBallCarrier: false,
      isPressing: false,
    };
  });

  // 2. Base + Tactical Coordinates for Away
  awayActive.forEach((pim, idx) => {
    const slotIdx = pim.slotIndex !== undefined ? pim.slotIndex : idx;
    const base = getBaseFormationCoordinates(false, awayFormation, slotIdx, awayActive.length);
    const mod = applyTacticalModifiers(base, false, awayTactics, pim.currentPosition);
    playerTargets[pim.player.id] = {
      x: mod.x,
      y: mod.y,
      isBallCarrier: false,
      isPressing: false,
    };
  });

  // 3. Phase-driven team block shifts
  let ballX = 50;
  let ballY = 50;
  let isShot = false;
  let isGoal = false;
  let isInAir = false;

  const isHomeAttacking = phase.startsWith('HOME_');
  const isAwayAttacking = phase.startsWith('AWAY_');

  // Identify primary ball carrier
  let carrierId: string | null = null;
  const minute = state.minute;

  if (isHomeAttacking) {
    // Select attacking player based on phase
    const candidates = homeActive.filter((p) => {
      if (phase === 'HOME_SHOT' || phase === 'HOME_ATTACK') {
        return ['ST', 'AMR', 'AML', 'AMC', 'MC'].includes(p.currentPosition);
      }
      if (phase === 'HOME_PROGRESSION') {
        return ['MC', 'DMC', 'AMR', 'AML', 'AMC', 'DR', 'DL'].includes(p.currentPosition);
      }
      return ['DC', 'DL', 'DR', 'DMC', 'MC', 'GK'].includes(p.currentPosition);
    });

    const chosen = candidates.length > 0 ? candidates[minute % candidates.length] : homeActive[0];
    if (chosen) {
      carrierId = chosen.player.id;
    }

    // Home team pushes up, Away team drops
    const attackShift = phase === 'HOME_SHOT' ? 24 : phase === 'HOME_ATTACK' ? 18 : 10;
    homeActive.forEach((p) => {
      const cur = playerTargets[p.player.id];
      if (!cur) return;
      if (p.currentPosition !== 'GK') {
        cur.x = Math.min(94, cur.x + attackShift * (['ST', 'AMR', 'AML'].includes(p.currentPosition) ? 1.2 : 0.85));
      } else {
        cur.x = Math.min(18, cur.x + 4); // GK sweeps slightly upfield
      }
    });

    // Away team drops into compact defensive shape
    awayActive.forEach((p) => {
      const cur = playerTargets[p.player.id];
      if (!cur) return;
      if (p.currentPosition !== 'GK') {
        cur.x = Math.min(94, cur.x + attackShift * 0.7); // drops right towards their goal
      }
    });

    // Away High Press / Pressing reaction
    const pressIntensity = awayTactics.pressing === 'Aşırı' ? 1.0 : awayTactics.pressing === 'Yoğun' ? 0.7 : 0.3;
    if (pressIntensity > 0.4 && carrierId && playerTargets[carrierId]) {
      // Find nearest away defender to press
      const carrierPos = playerTargets[carrierId];
      let nearestAwayId: string | null = null;
      let minDist = 9999;
      awayActive.forEach((p) => {
        if (p.currentPosition === 'GK') return;
        const cur = playerTargets[p.player.id];
        if (!cur) return;
        const d = Math.hypot(cur.x - carrierPos.x, cur.y - carrierPos.y);
        if (d < minDist) {
          minDist = d;
          nearestAwayId = p.player.id;
        }
      });

      if (nearestAwayId && playerTargets[nearestAwayId]) {
        playerTargets[nearestAwayId].isPressing = true;
        // Surge towards ball carrier
        playerTargets[nearestAwayId].x += (carrierPos.x - playerTargets[nearestAwayId].x) * 0.65;
        playerTargets[nearestAwayId].y += (carrierPos.y - playerTargets[nearestAwayId].y) * 0.65;
      }
    }
  } else if (isAwayAttacking) {
    // Away attacking left
    const candidates = awayActive.filter((p) => {
      if (phase === 'AWAY_SHOT' || phase === 'AWAY_ATTACK') {
        return ['ST', 'AMR', 'AML', 'AMC', 'MC'].includes(p.currentPosition);
      }
      if (phase === 'AWAY_PROGRESSION') {
        return ['MC', 'DMC', 'AMR', 'AML', 'AMC', 'DR', 'DL'].includes(p.currentPosition);
      }
      return ['DC', 'DL', 'DR', 'DMC', 'MC', 'GK'].includes(p.currentPosition);
    });

    const chosen = candidates.length > 0 ? candidates[minute % candidates.length] : awayActive[0];
    if (chosen) {
      carrierId = chosen.player.id;
    }

    const attackShift = phase === 'AWAY_SHOT' ? 24 : phase === 'AWAY_ATTACK' ? 18 : 10;
    awayActive.forEach((p) => {
      const cur = playerTargets[p.player.id];
      if (!cur) return;
      if (p.currentPosition !== 'GK') {
        cur.x = Math.max(6, cur.x - attackShift * (['ST', 'AMR', 'AML'].includes(p.currentPosition) ? 1.2 : 0.85));
      } else {
        cur.x = Math.max(82, cur.x - 4);
      }
    });

    homeActive.forEach((p) => {
      const cur = playerTargets[p.player.id];
      if (!cur) return;
      if (p.currentPosition !== 'GK') {
        cur.x = Math.max(6, cur.x - attackShift * 0.7); // drops left towards their goal
      }
    });

    // Home High Press reaction
    const pressIntensity = homeTactics.pressing === 'Aşırı' ? 1.0 : homeTactics.pressing === 'Yoğun' ? 0.7 : 0.3;
    if (pressIntensity > 0.4 && carrierId && playerTargets[carrierId]) {
      const carrierPos = playerTargets[carrierId];
      let nearestHomeId: string | null = null;
      let minDist = 9999;
      homeActive.forEach((p) => {
        if (p.currentPosition === 'GK') return;
        const cur = playerTargets[p.player.id];
        if (!cur) return;
        const d = Math.hypot(cur.x - carrierPos.x, cur.y - carrierPos.y);
        if (d < minDist) {
          minDist = d;
          nearestHomeId = p.player.id;
        }
      });

      if (nearestHomeId && playerTargets[nearestHomeId]) {
        playerTargets[nearestHomeId].isPressing = true;
        playerTargets[nearestHomeId].x += (carrierPos.x - playerTargets[nearestHomeId].x) * 0.65;
        playerTargets[nearestHomeId].y += (carrierPos.y - playerTargets[nearestHomeId].y) * 0.65;
      }
    }
  }

  // 4. Ball Positioning & Action Resolution
  if (phase === 'GOAL_CELEBRATION') {
    isGoal = true;
    const isHomeGoal = state.latestEvent?.teamId === state.home.club.id;
    ballX = isHomeGoal ? 96.5 : 3.5;
    ballY = 50;

    // Celebration: scorer runs toward corner, teammates celebrate
    const scorerId = state.latestEvent?.playerId;
    if (scorerId && playerTargets[scorerId]) {
      playerTargets[scorerId].x = isHomeGoal ? 92 : 8;
      playerTargets[scorerId].y = 22;
    }
  } else if (phase === 'HOME_SHOT') {
    isShot = true;
    const targetGoal = state.lastAttackingAction?.coords || { x: 96, y: 50 };
    ballX = 82 + (targetGoal.x - 82) * phaseProgress;
    ballY = 50 + (targetGoal.y - 50) * phaseProgress;
  } else if (phase === 'AWAY_SHOT') {
    isShot = true;
    const targetGoal = state.lastAttackingAction?.coords || { x: 4, y: 50 };
    ballX = 18 - (18 - targetGoal.x) * phaseProgress;
    ballY = 50 + (targetGoal.y - 50) * phaseProgress;
  } else if (phase === 'CORNER_HOME') {
    ballX = 96;
    ballY = minute % 2 === 0 ? 8 : 92;
  } else if (phase === 'CORNER_AWAY') {
    ballX = 4;
    ballY = minute % 2 === 0 ? 8 : 92;
  } else if (carrierId && playerTargets[carrierId]) {
    playerTargets[carrierId].isBallCarrier = true;
    const carrier = playerTargets[carrierId];
    // Dynamic micro-pass movement: ball placed at feet or passing toward receiver
    ballX = carrier.x + (isHomeAttacking ? 1.4 : -1.4);
    ballY = carrier.y + Math.sin(phaseProgress * Math.PI) * 1.2;
  } else {
    ballX = 50;
    ballY = 50;
  }

  // 5. Goalkeeper Angle Adjustment (adjusts Y to ball Y to narrow angle)
  const homeGK = homeActive.find((p) => p.currentPosition === 'GK');
  if (homeGK && playerTargets[homeGK.player.id]) {
    const gk = playerTargets[homeGK.player.id];
    gk.y = 50 + (ballY - 50) * 0.28;
    if (phase === 'AWAY_SHOT') {
      gk.x = Math.max(7, Math.min(14, gk.x + 2));
    }
  }

  const awayGK = awayActive.find((p) => p.currentPosition === 'GK');
  if (awayGK && playerTargets[awayGK.player.id]) {
    const gk = playerTargets[awayGK.player.id];
    gk.y = 50 + (ballY - 50) * 0.28;
    if (phase === 'HOME_SHOT') {
      gk.x = Math.min(93, Math.max(86, gk.x - 2));
    }
  }

  return {
    players: playerTargets,
    ball: {
      x: Math.max(3, Math.min(97, ballX)),
      y: Math.max(6, Math.min(94, ballY)),
      isGoal,
      isShot,
      isInAir,
    },
    activePhase: phase,
  };
}
