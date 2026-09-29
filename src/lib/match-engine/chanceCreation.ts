import {
  MatchEngineEvent,
  MatchTeamRuntime,
  PlayerInMatch,
  PitchCoordinates,
  AttackingDirection,
} from './types';
import { TacticalModifiers } from './tacticalEffects';
import { selectShooter, selectAssister, getGoalkeeper } from './playerSelection';
import { resolveShot, ChanceType } from './shotResolver';
import { generateCommentary } from './commentary';
import { addMomentumBoost, MomentumState } from './momentum';

export interface AttackSequenceResult {
  hasAttack: boolean;
  events: MatchEngineEvent[];
  homeScoreDelta: number;
  awayScoreDelta: number;
  homeStatsDelta: {
    shots: number;
    shotsOnTarget: number;
    xG: number;
    corners: number;
    saves: number;
  };
  awayStatsDelta: {
    shots: number;
    shotsOnTarget: number;
    xG: number;
    corners: number;
    saves: number;
  };
  attackingTeamId?: string;
  momentum: MomentumState;
  pitchCoords?: PitchCoordinates;
  attackingDirection?: AttackingDirection;
}

export function simulateMinuteAttack(
  minute: number,
  home: MatchTeamRuntime,
  away: MatchTeamRuntime,
  homeMods: TacticalModifiers,
  awayMods: TacticalModifiers,
  homePossessionRatio: number, // e.g. 0.54
  momentum: MomentumState,
  homeAdvantageMultiplier: number = 1.05
): AttackSequenceResult {
  const result: AttackSequenceResult = {
    hasAttack: false,
    events: [],
    homeScoreDelta: 0,
    awayScoreDelta: 0,
    homeStatsDelta: { shots: 0, shotsOnTarget: 0, xG: 0, corners: 0, saves: 0 },
    awayStatsDelta: { shots: 0, shotsOnTarget: 0, xG: 0, corners: 0, saves: 0 },
    momentum,
  };

  // Base chance creation probability per minute ~0.155
  const baseChanceProb = 0.155;

  // Decide if Home or Away attacks
  const homeAttackStrength = (home.ratings.attackingStrength / 75) * homeMods.chanceCreationMult * (momentum.homeMomentum / 50) * homeAdvantageMultiplier;
  const awayAttackStrength = (away.ratings.attackingStrength / 75) * awayMods.chanceCreationMult * (momentum.awayMomentum / 50);

  // Player count penalty (if red card received)
  const homePlayerCountMult = home.activePitchPlayerIds.length / 11;
  const awayPlayerCountMult = away.activePitchPlayerIds.length / 11;

  const homeProb = baseChanceProb * homePossessionRatio * homeAttackStrength * homePlayerCountMult;
  const awayProb = baseChanceProb * (1 - homePossessionRatio) * awayAttackStrength * awayPlayerCountMult;

  const roll = Math.random();
  let attackingTeam: 'HOME' | 'AWAY' | 'NONE' = 'NONE';

  if (roll < homeProb) {
    attackingTeam = 'HOME';
  } else if (roll < homeProb + awayProb) {
    attackingTeam = 'AWAY';
  }

  if (attackingTeam === 'NONE') {
    return result;
  }

  result.hasAttack = true;
  const isHome = attackingTeam === 'HOME';
  const attTeam = isHome ? home : away;
  const defTeam = isHome ? away : home;
  const attMods = isHome ? homeMods : awayMods;
  const defMods = isHome ? awayMods : homeMods;

  const activeAttackers = attTeam.activePitchPlayerIds.map((id) => attTeam.players[id]).filter(Boolean);
  const activeDefenders = defTeam.activePitchPlayerIds.map((id) => defTeam.players[id]).filter(Boolean);

  const goalkeeper = getGoalkeeper(activeDefenders) || activeDefenders[0];
  if (!goalkeeper || activeAttackers.length === 0) return result;

  // Attacking direction and pitch coordinates
  const direction: AttackingDirection = isHome ? 'HOME_ATTACK' : 'AWAY_ATTACK';
  result.attackingDirection = direction;

  // Chance Type determination
  let chanceType: ChanceType = 'CENTRAL_BOX';
  let coords: PitchCoordinates = isHome ? { x: 75 + Math.random() * 18, y: 35 + Math.random() * 30 } : { x: 7 + Math.random() * 18, y: 35 + Math.random() * 30 };
  let isCross = false;

  const chanceRoll = Math.random();

  // Penalty check (~3% of attacking chances)
  if (chanceRoll < 0.035) {
    chanceType = 'PENALTY';
    coords = isHome ? { x: 88, y: 50 } : { x: 12, y: 50 };
  }
  // Breakaway check (boosted by opponent high line)
  else if (chanceRoll < 0.035 + 0.14 * (1 + defMods.breakawayThreatBonus)) {
    chanceType = 'ONE_ON_ONE';
    coords = isHome ? { x: 84 + Math.random() * 8, y: 45 + Math.random() * 10 } : { x: 8 + Math.random() * 8, y: 45 + Math.random() * 10 };
  }
  // Wide cross check (boosted by wide play)
  else if (chanceRoll < 0.42 * attMods.crossingFrequencyMult) {
    chanceType = Math.random() < 0.65 ? 'WIDE_CROSS_HEADER' : 'WIDE_CROSS_VOLLEY';
    isCross = true;
    coords = isHome ? { x: 82 + Math.random() * 10, y: 30 + Math.random() * 40 } : { x: 10 + Math.random() * 10, y: 30 + Math.random() * 40 };
  }
  // Corner check (~16% of chances)
  else if (chanceRoll < 0.58) {
    chanceType = 'CORNER_HEADER';
    coords = isHome ? { x: 86 + Math.random() * 8, y: 40 + Math.random() * 20 } : { x: 6 + Math.random() * 8, y: 40 + Math.random() * 20 };
  }
  // Long shot check
  else if (chanceRoll < 0.76) {
    chanceType = 'LONG_SHOT';
    coords = isHome ? { x: 72 + Math.random() * 6, y: 35 + Math.random() * 30 } : { x: 22 + Math.random() * 6, y: 35 + Math.random() * 30 };
  }
  // Central box play
  else {
    chanceType = 'CENTRAL_BOX';
    coords = isHome ? { x: 84 + Math.random() * 8, y: 40 + Math.random() * 20 } : { x: 8 + Math.random() * 8, y: 40 + Math.random() * 20 };
  }

  result.pitchCoords = coords;

  // Select Shooter & Assister
  const isSetPiece = chanceType === 'CORNER_HEADER';
  const shooter = selectShooter(activeAttackers, isSetPiece);
  const assister = chanceType !== 'PENALTY'
    ? selectAssister(activeAttackers, shooter.player.id, isCross)
    : undefined;

  // Resolve Shot
  const shotRes = resolveShot(
    chanceType,
    shooter,
    goalkeeper,
    defTeam.ratings.defensiveStrength,
    assister
  );

  // If corner awarded
  if (chanceType === 'CORNER_HEADER') {
    if (isHome) result.homeStatsDelta.corners += 1;
    else result.awayStatsDelta.corners += 1;
  }

  // Update Stats Delta
  if (isHome) {
    result.homeStatsDelta.shots += 1;
    result.homeStatsDelta.xG += shotRes.xG;
    if (shotRes.isOnTarget) result.homeStatsDelta.shotsOnTarget += 1;
    if (shotRes.outcome === 'GOAL') result.homeScoreDelta += 1;
    if (shotRes.outcome === 'SAVE') result.awayStatsDelta.saves += 1;
  } else {
    result.awayStatsDelta.shots += 1;
    result.awayStatsDelta.xG += shotRes.xG;
    if (shotRes.isOnTarget) result.awayStatsDelta.shotsOnTarget += 1;
    if (shotRes.outcome === 'GOAL') result.awayScoreDelta += 1;
    if (shotRes.outcome === 'SAVE') result.homeStatsDelta.saves += 1;
  }

  // Update Momentum
  if (shotRes.outcome === 'GOAL') {
    result.momentum = addMomentumBoost(momentum, isHome ? 'HOME' : 'AWAY', 18);
  } else if (shotRes.xG > 0.25 || shotRes.outcome === 'POST') {
    result.momentum = addMomentumBoost(momentum, isHome ? 'HOME' : 'AWAY', 6);
  }

  // Create Event Object
  const shooterName = `${shooter.player.firstName} ${shooter.player.lastName}`;
  const assisterName = assister ? `${assister.player.firstName} ${assister.player.lastName}` : undefined;
  const gkName = `${goalkeeper.player.firstName} ${goalkeeper.player.lastName}`;

  let desc = '';
  if (shotRes.outcome === 'GOAL') {
    desc = assisterName
      ? `${shooterName}, ${assisterName}'ın asistiyle topu ağlara gönderdi.`
      : `${shooterName} şık bir vuruşla golü attı.`;
  } else if (shotRes.outcome === 'SAVE') {
    desc = `${shooterName}'ın vuruşunda kaleci ${gkName} başarılı bir kurtarış yaptı.`;
  } else if (shotRes.outcome === 'POST') {
    desc = `${shooterName}'ın şutu direkten döndü!`;
  } else if (shotRes.outcome === 'BLOCKED_SHOT') {
    desc = `${shooterName}'ın şutu savunmadan döndü.`;
  } else {
    desc = `${shooterName}'ın vuruşu auta gitti.`;
  }

  const commentary = generateCommentary(shotRes.outcome as any, {
    player: shooterName,
    assister: assisterName,
    goalkeeper: gkName,
    team: attTeam.club.name,
    opponent: defTeam.club.name,
    minute,
  });

  const event: MatchEngineEvent = {
    id: `ev-${Date.now()}-${minute}-${shooter.player.id}`,
    minute,
    second: Math.floor(Math.random() * 59),
    type: shotRes.outcome,
    teamId: attTeam.club.id,
    playerId: shooter.player.id,
    playerName: shooterName,
    secondaryPlayerId: assister?.player.id,
    secondaryPlayerName: assisterName,
    description: desc,
    commentary,
    xGValue: shotRes.xG,
    pitchCoords: coords,
    attackingDirection: direction,
    isImportant: shotRes.outcome === 'GOAL' || shotRes.outcome === 'POST' || shotRes.xG >= 0.30,
  };

  result.events.push(event);
  return result;
}
