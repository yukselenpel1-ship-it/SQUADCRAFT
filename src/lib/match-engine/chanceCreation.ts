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
import { matchRandom } from './random';

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

  // Base chance creation probability per minute ~0.148 (realistic ~13-14 total attacks per match)
  const baseChanceProb = 0.148;

  // Attack vs Defense ratio creates natural advantage without scripted outcome:
  // Attacking team's offensive strength is challenged by defending team's defensive capability
  const homeAttackVsAwayDef = Math.pow(home.ratings.attackingStrength / Math.max(45, away.ratings.defensiveStrength), 0.60);
  const awayAttackVsHomeDef = Math.pow(away.ratings.attackingStrength / Math.max(45, home.ratings.defensiveStrength), 0.60);

  const homeAttackStrength = homeAttackVsAwayDef * homeMods.chanceCreationMult * (momentum.homeMomentum / 50) * homeAdvantageMultiplier;
  const awayAttackStrength = awayAttackVsHomeDef * awayMods.chanceCreationMult * (momentum.awayMomentum / 50);

  // Player count penalty (if red card received)
  const homePlayerCountMult = home.activePitchPlayerIds.length / 11;
  const awayPlayerCountMult = away.activePitchPlayerIds.length / 11;

  const homeProb = baseChanceProb * homePossessionRatio * homeAttackStrength * homePlayerCountMult;
  const awayProb = baseChanceProb * (1 - homePossessionRatio) * awayAttackStrength * awayPlayerCountMult;

  const roll = matchRandom();
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

  // Archetype traits on pitch
  const hasFastWinger = activeAttackers.some((p) => p.player.archetype === 'Hızlı Kanat');
  const hasTargetForward = activeAttackers.some((p) => p.player.archetype === 'Hedef Santrfor');
  const hasPlaymaker = activeAttackers.some((p) => p.player.archetype === 'Oyun Kurucu' || p.player.archetype === 'Oyun Kurucu Kanat');
  const hasSweeperKeeper = goalkeeper.player.archetype === 'Süpürücü Kaleci';

  // Chance Type determination
  let chanceType: ChanceType = 'CENTRAL_BOX';
  let coords: PitchCoordinates = isHome ? { x: 75 + matchRandom() * 18, y: 35 + matchRandom() * 30 } : { x: 7 + matchRandom() * 18, y: 35 + matchRandom() * 30 };
  let isCross = false;

  const chanceRoll = matchRandom();

  // Penalty check (~3.5% of attacking chances)
  if (chanceRoll < 0.035) {
    chanceType = 'PENALTY';
    coords = isHome ? { x: 88, y: 50 } : { x: 12, y: 50 };
  }
  // Breakaway check (boosted by fast wingers, opponent high line, low block counter attacks, suppressed by sweeper keeper)
  else if (chanceRoll < 0.035 + 0.15 * (1 + (defMods.breakawayThreatBonus || 0) + (attMods.breakawayThreatBonus || 0)) * (hasFastWinger ? 1.25 : 1.0) * (hasSweeperKeeper ? 0.80 : 1.0)) {
    chanceType = 'ONE_ON_ONE';
    coords = isHome ? { x: 84 + matchRandom() * 8, y: 45 + matchRandom() * 10 } : { x: 8 + matchRandom() * 8, y: 45 + matchRandom() * 10 };
  }
  // Wide cross check (boosted by wide play and target forwards)
  else if (chanceRoll < 0.42 * attMods.crossingFrequencyMult * (hasTargetForward ? 1.25 : 1.0)) {
    chanceType = matchRandom() < 0.65 ? 'WIDE_CROSS_HEADER' : 'WIDE_CROSS_VOLLEY';
    isCross = true;
    coords = isHome ? { x: 82 + matchRandom() * 10, y: 30 + matchRandom() * 40 } : { x: 10 + matchRandom() * 10, y: 30 + matchRandom() * 40 };
  }
  // Corner check (~16% of chances)
  else if (chanceRoll < 0.58) {
    chanceType = 'CORNER_HEADER';
    coords = isHome ? { x: 86 + matchRandom() * 8, y: 40 + matchRandom() * 20 } : { x: 6 + matchRandom() * 8, y: 40 + matchRandom() * 20 };
  }
  // Long shot check (reduced if playmakers seek incisive box through balls)
  else if (chanceRoll < (hasPlaymaker ? 0.70 : 0.76)) {
    chanceType = 'LONG_SHOT';
    coords = isHome ? { x: 72 + matchRandom() * 6, y: 35 + matchRandom() * 30 } : { x: 22 + matchRandom() * 6, y: 35 + matchRandom() * 30 };
  }
  // Central box play (dominant when playmakers unlock defense)
  else {
    chanceType = 'CENTRAL_BOX';
    coords = isHome ? { x: 84 + matchRandom() * 8, y: 40 + matchRandom() * 20 } : { x: 8 + matchRandom() * 8, y: 40 + matchRandom() * 20 };
  }

  result.pitchCoords = coords;

  // Select Shooter & Assister based on chance context
  const shooter = selectShooter(activeAttackers, chanceType);
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
    id: `ev-${minute}-${shooter.player.id}`,
    minute,
    second: Math.floor(matchRandom() * 59),
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
