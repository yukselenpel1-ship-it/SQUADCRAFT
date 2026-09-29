import { Player, PlayerPosition } from '@/types/game';
import { PlayerInMatch, TeamRatings } from './types';

// Position mismatch penalty matrix
export function getPositionSuitability(playerPos: PlayerPosition, secondaryPositions: PlayerPosition[], targetRole: PlayerPosition): number {
  if (playerPos === targetRole) return 1.0;
  if (secondaryPositions.includes(targetRole)) return 0.92;

  const isGK = (p: PlayerPosition) => p === 'GK';
  const isDef = (p: PlayerPosition) => ['DR', 'DC', 'DL'].includes(p);
  const isMid = (p: PlayerPosition) => ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(p);
  const isAtt = (p: PlayerPosition) => ['AMR', 'AML', 'ST'].includes(p);

  // Severe penalty if GK plays outfield or outfield plays GK
  if (isGK(playerPos) !== isGK(targetRole)) {
    return 0.15;
  }

  // Same line transitions (e.g., DR to DL or AMR to AML)
  if (
    (isDef(playerPos) && isDef(targetRole)) ||
    (isMid(playerPos) && isMid(targetRole)) ||
    (isAtt(playerPos) && isAtt(targetRole))
  ) {
    return 0.86;
  }

  // Adjacent lines (e.g., DMC to DC or AMC to ST)
  if (
    (playerPos === 'DMC' && isDef(targetRole)) ||
    (playerPos === 'DC' && targetRole === 'DMC') ||
    (playerPos === 'AMC' && targetRole === 'ST') ||
    (playerPos === 'ST' && targetRole === 'AMC')
  ) {
    return 0.80;
  }

  // Non-adjacent general outfield positions (e.g., DC playing ST)
  return 0.68;
}

// Calculate effective attribute of a player accounting for suitability, fitness, morale, and form
export function getEffectiveAttribute(
  pim: PlayerInMatch,
  attrKey: keyof Player['attributes']
): number {
  const p = pim.player;
  const baseAttr = p.attributes[attrKey] || 50;

  // Suitability
  const suitability = getPositionSuitability(p.position, p.secondaryPositions, pim.currentPosition);

  // Fitness effect: Fitness below 75 starts degrading attributes (pace, decisions, stamina heavily)
  let fitnessMult = 1.0;
  if (pim.currentFitness < 75) {
    fitnessMult = Math.max(0.65, 0.75 + (pim.currentFitness / 75) * 0.25);
  }

  // Form effect: 1 to 10 -> (form - 7.0) gives -0.09 to +0.045
  const formMult = 1.0 + (p.form - 7.0) * 0.015;

  // Morale effect: 1 to 100 -> (morale - 75) gives -0.045 to +0.025
  const moraleMult = 1.0 + (p.morale - 75) * 0.001;

  const effective = baseAttr * suitability * fitnessMult * formMult * moraleMult;
  return Math.max(10, Math.min(99, Math.round(effective)));
}

export function calculateTeamRatings(activePlayers: PlayerInMatch[]): TeamRatings {
  if (activePlayers.length === 0) {
    return {
      attackingStrength: 50,
      midfieldStrength: 50,
      defensiveStrength: 50,
      goalkeeperStrength: 50,
      physicalStrength: 50,
      creativity: 50,
      pressingAbility: 50,
      possessionAbility: 50,
      counterAttackAbility: 50,
      setPieceAbility: 50,
      overallRating: 50,
    };
  }

  // Group active players by role on pitch
  const gks = activePlayers.filter((p) => p.currentPosition === 'GK');
  const defs = activePlayers.filter((p) => ['DR', 'DC', 'DL'].includes(p.currentPosition));
  const mids = activePlayers.filter((p) => ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(p.currentPosition));
  const atts = activePlayers.filter((p) => ['AMR', 'AML', 'ST'].includes(p.currentPosition));

  // Goalkeeper Strength
  let gkStrength = 50;
  if (gks.length > 0) {
    const gk = gks[0];
    const handling = getEffectiveAttribute(gk, 'handling');
    const reflexes = getEffectiveAttribute(gk, 'reflexes');
    const positioningGK = getEffectiveAttribute(gk, 'positioningGK');
    const kicking = getEffectiveAttribute(gk, 'kicking');
    const decisions = getEffectiveAttribute(gk, 'decisions');
    gkStrength = Math.round(handling * 0.30 + reflexes * 0.30 + positioningGK * 0.25 + kicking * 0.10 + decisions * 0.05);
  } else {
    // Severe penalty if playing without a goalkeeper
    gkStrength = 20;
  }

  // Attacking Strength (Forwards 60%, Midfielders 30%, Defenders 10%)
  const calcAttScore = (p: PlayerInMatch) => {
    const finishing = getEffectiveAttribute(p, 'finishing');
    const composure = getEffectiveAttribute(p, 'composure');
    const pace = getEffectiveAttribute(p, 'pace');
    const accel = getEffectiveAttribute(p, 'acceleration');
    const dribbling = getEffectiveAttribute(p, 'dribbling');
    const positioning = getEffectiveAttribute(p, 'positioning');
    const heading = getEffectiveAttribute(p, 'heading');
    return finishing * 0.30 + composure * 0.15 + pace * 0.15 + accel * 0.10 + dribbling * 0.10 + positioning * 0.10 + heading * 0.10;
  };

  const attForwards = atts.length > 0 ? atts.reduce((sum, p) => sum + calcAttScore(p), 0) / atts.length : 50;
  const attMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcAttScore(p), 0) / mids.length : 45;
  const attDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcAttScore(p), 0) / defs.length : 35;
  const attackingStrength = Math.round(attForwards * 0.60 + attMids * 0.30 + attDefs * 0.10);

  // Midfield Strength
  const calcMidScore = (p: PlayerInMatch) => {
    const passing = getEffectiveAttribute(p, 'passing');
    const vision = getEffectiveAttribute(p, 'vision');
    const technique = getEffectiveAttribute(p, 'technique');
    const decisions = getEffectiveAttribute(p, 'decisions');
    const teamwork = getEffectiveAttribute(p, 'teamwork');
    const stamina = getEffectiveAttribute(p, 'stamina');
    return passing * 0.25 + vision * 0.20 + technique * 0.15 + decisions * 0.15 + teamwork * 0.15 + stamina * 0.10;
  };

  const midMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcMidScore(p), 0) / mids.length : 45;
  const midDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcMidScore(p), 0) / defs.length : 40;
  const midAtts = atts.length > 0 ? atts.reduce((sum, p) => sum + calcMidScore(p), 0) / atts.length : 40;
  const midfieldStrength = Math.round(midMids * 0.70 + midDefs * 0.15 + midAtts * 0.15);

  // Defensive Strength (Defenders 65%, Midfielders 25%, Attackers 10%)
  const calcDefScore = (p: PlayerInMatch) => {
    const tackling = getEffectiveAttribute(p, 'tackling');
    const marking = getEffectiveAttribute(p, 'marking');
    const positioning = getEffectiveAttribute(p, 'positioning');
    const strength = getEffectiveAttribute(p, 'strength');
    const heading = getEffectiveAttribute(p, 'heading');
    const decisions = getEffectiveAttribute(p, 'decisions');
    return tackling * 0.25 + marking * 0.20 + positioning * 0.20 + strength * 0.15 + heading * 0.10 + decisions * 0.10;
  };

  const defDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcDefScore(p), 0) / defs.length : 45;
  const defMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcDefScore(p), 0) / mids.length : 40;
  const defAtts = atts.length > 0 ? atts.reduce((sum, p) => sum + calcDefScore(p), 0) / atts.length : 30;
  const defensiveStrength = Math.round(defDefs * 0.65 + defMids * 0.25 + defAtts * 0.10);

  // Physical Strength
  const physicalStrength = Math.round(
    activePlayers.reduce((sum, p) => {
      const str = getEffectiveAttribute(p, 'strength');
      const sta = getEffectiveAttribute(p, 'stamina');
      const pac = getEffectiveAttribute(p, 'pace');
      const agg = getEffectiveAttribute(p, 'aggression');
      return sum + (str * 0.40 + sta * 0.30 + pac * 0.20 + agg * 0.10);
    }, 0) / activePlayers.length
  );

  // Creativity
  const creativity = Math.round(
    activePlayers.reduce((sum, p) => {
      const vis = getEffectiveAttribute(p, 'vision');
      const tec = getEffectiveAttribute(p, 'technique');
      const dri = getEffectiveAttribute(p, 'dribbling');
      const dec = getEffectiveAttribute(p, 'decisions');
      return sum + (vis * 0.40 + tec * 0.30 + dri * 0.20 + dec * 0.10);
    }, 0) / activePlayers.length
  );

  // Pressing Ability
  const pressingAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const twk = getEffectiveAttribute(p, 'teamwork');
      const sta = getEffectiveAttribute(p, 'stamina');
      const agg = getEffectiveAttribute(p, 'aggression');
      const pac = getEffectiveAttribute(p, 'pace');
      return sum + (twk * 0.30 + sta * 0.30 + agg * 0.20 + pac * 0.20);
    }, 0) / activePlayers.length
  );

  // Possession Ability
  const possessionAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const pas = getEffectiveAttribute(p, 'passing');
      const tec = getEffectiveAttribute(p, 'technique');
      const com = getEffectiveAttribute(p, 'composure');
      const twk = getEffectiveAttribute(p, 'teamwork');
      return sum + (pas * 0.35 + tec * 0.25 + com * 0.20 + twk * 0.20);
    }, 0) / activePlayers.length
  );

  // Counter Attack Ability
  const counterAttackAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const pac = getEffectiveAttribute(p, 'pace');
      const acc = getEffectiveAttribute(p, 'acceleration');
      const vis = getEffectiveAttribute(p, 'vision');
      const fin = getEffectiveAttribute(p, 'finishing');
      return sum + (pac * 0.40 + acc * 0.30 + vis * 0.15 + fin * 0.15);
    }, 0) / activePlayers.length
  );

  // Set Piece Ability
  const setPieceAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const cro = getEffectiveAttribute(p, 'crossing');
      const hea = getEffectiveAttribute(p, 'heading');
      const str = getEffectiveAttribute(p, 'strength');
      const lsh = getEffectiveAttribute(p, 'longShots');
      return sum + (cro * 0.35 + hea * 0.35 + str * 0.20 + lsh * 0.10);
    }, 0) / activePlayers.length
  );

  // Overall combined rating
  const overallRating = Math.round(
    attackingStrength * 0.30 +
    midfieldStrength * 0.30 +
    defensiveStrength * 0.25 +
    gkStrength * 0.15
  );

  return {
    attackingStrength,
    midfieldStrength,
    defensiveStrength,
    goalkeeperStrength: gkStrength,
    physicalStrength,
    creativity,
    pressingAbility,
    possessionAbility,
    counterAttackAbility,
    setPieceAbility,
    overallRating,
  };
}
