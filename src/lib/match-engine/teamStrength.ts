import { Player, PlayerPosition } from '@/types/game';
import { PlayerInMatch, TeamRatings } from './types';

// Position mismatch penalty matrix
export function getPositionSuitability(playerPos: PlayerPosition, secondaryPositions?: PlayerPosition[], targetRole?: PlayerPosition): number {
  if (!targetRole || playerPos === targetRole) return 1.0;
  if (secondaryPositions && secondaryPositions.includes(targetRole)) return 0.92;

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

// Progressive, bounded fatigue curve
export function calculateFatigueMultiplier(fitness: number): number {
  const fitClamped = Math.max(30, Math.min(100, fitness));
  return 0.74 + 0.26 * Math.pow(fitClamped / 100, 1.5);
}

// Calculate effective attribute of a player accounting for suitability, fitness, morale, form, consistency, and bigMatchPerformance
export function getEffectiveAttribute(
  pim: PlayerInMatch,
  attrKey: keyof Player['attributes'],
  isCompetitive: boolean = true
): number {
  const p = pim.player;
  const baseAttr = p.attributes[attrKey] || 50;

  // 1. Position Suitability
  const suitability = getPositionSuitability(p.position, p.secondaryPositions, pim.currentPosition);

  // 2. Fitness effect: Smooth, bounded progressive fatigue curve
  // Completely eliminates cliff effects (e.g. 51 vs 49) while preserving progressive decline.
  // 100: 1.000, 90: 0.978, 80: 0.956, 70: 0.935, 60: 0.915, 50: 0.896, 45: 0.886, 40: 0.877
  // Allows an exhausted 90 star team (~79.7 effective) to compete tightly against an 82 fresh team (~81.6 effective)
  const fitnessMult = calculateFatigueMultiplier(pim.currentFitness);

  // 3. Form effect: (1 to 10, avg 7.0) -> -7.5% to +4.5%
  const formMult = 1.0 + (p.form - 7.0) * 0.015;

  // 4. Morale effect: (1 to 100, avg 75) -> -4% to +3%
  const moraleMult = 1.0 + (p.morale - 75) * 0.0012;

  // 5. Match-day consistency variance (hidden attribute: consistency)
  let consistencyMult = 1.0;
  if (pim.matchDayConsistencyVariance !== undefined) {
    consistencyMult = 1.0 + pim.matchDayConsistencyVariance;
  }

  // 6. Big match performance (hidden attribute: bigMatchPerformance)
  let bigMatchMult = 1.0;
  if (isCompetitive && p.hiddenAttributes?.bigMatchPerformance) {
    bigMatchMult = 1.0 + (p.hiddenAttributes.bigMatchPerformance - 70) * 0.0012;
  }

  const effective = baseAttr * suitability * fitnessMult * formMult * moraleMult * consistencyMult * bigMatchMult;
  return Math.max(10, Math.min(99, Math.round(effective)));
}

export function calculateTeamRatings(activePlayers: PlayerInMatch[], isCompetitive: boolean = true): TeamRatings {
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

  // 1. Goalkeeper Strength (pure GK-specific ability rather than generic outfield weighting)
  let gkStrength = 50;
  if (gks.length > 0) {
    const gk = gks[0];
    const handling = getEffectiveAttribute(gk, 'handling', isCompetitive);
    const reflexes = getEffectiveAttribute(gk, 'reflexes', isCompetitive);
    const positioningGK = getEffectiveAttribute(gk, 'positioningGK', isCompetitive);
    const kicking = getEffectiveAttribute(gk, 'kicking', isCompetitive);
    const decisions = getEffectiveAttribute(gk, 'decisions', isCompetitive);

    let baseGkScore = handling * 0.28 + reflexes * 0.35 + positioningGK * 0.25 + kicking * 0.07 + decisions * 0.05;
    if (gk.player.archetype === 'Çizgi Kalecisi') {
      baseGkScore += 2; // Reflex & line shot stopping boost
    } else if (gk.player.archetype === 'Süpürücü Kaleci') {
      baseGkScore += 1; // Sweeper positioning
    }
    gkStrength = Math.round(baseGkScore);
  } else {
    // Severe penalty if playing without a goalkeeper
    gkStrength = 20;
  }

  // 2. Attacking Strength:
  // Strikers rely on finishing, composure, positioning, pace, physical strength, heading
  // Wingers rely on pace, acceleration, dribbling, crossing, technique, finishing
  const calcAttScore = (p: PlayerInMatch) => {
    const pos = p.currentPosition;
    const fin = getEffectiveAttribute(p, 'finishing', isCompetitive);
    const com = getEffectiveAttribute(p, 'composure', isCompetitive);
    const pac = getEffectiveAttribute(p, 'pace', isCompetitive);
    const acc = getEffectiveAttribute(p, 'acceleration', isCompetitive);
    const dri = getEffectiveAttribute(p, 'dribbling', isCompetitive);
    const posG = getEffectiveAttribute(p, 'positioning', isCompetitive);
    const hea = getEffectiveAttribute(p, 'heading', isCompetitive);
    const str = getEffectiveAttribute(p, 'strength', isCompetitive);
    const cro = getEffectiveAttribute(p, 'crossing', isCompetitive);
    const tec = getEffectiveAttribute(p, 'technique', isCompetitive);

    let score = 50;
    if (pos === 'ST') {
      // Pure Striker formula: finishing, composure, positioning, strength, heading, pace
      score = fin * 0.35 + com * 0.20 + posG * 0.15 + str * 0.10 + hea * 0.10 + pac * 0.10;
      if (p.player.archetype === 'Bitirici Forvet') score += 3;
      else if (p.player.archetype === 'Hedef Santrfor') score += 2;
    } else if (pos === 'AML' || pos === 'AMR') {
      // Winger formula: pace, acceleration, dribbling, crossing, technique, finishing
      score = pac * 0.25 + acc * 0.20 + dri * 0.20 + cro * 0.15 + tec * 0.10 + fin * 0.10;
      if (p.player.archetype === 'Hızlı Kanat') score += 3;
      else if (p.player.archetype === 'Oyun Kurucu Kanat') score += 2;
    } else {
      // Secondary offensive contribution (AMC / Midfielders)
      score = fin * 0.25 + com * 0.20 + tec * 0.20 + posG * 0.15 + pac * 0.10 + str * 0.10;
    }
    return score;
  };

  const attForwards = atts.length > 0 ? atts.reduce((sum, p) => sum + calcAttScore(p), 0) / atts.length : 50;
  const attMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcAttScore(p), 0) / mids.length : 45;
  const attDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcAttScore(p), 0) / defs.length : 35;
  const attackingStrength = Math.round(attForwards * 0.65 + attMids * 0.25 + attDefs * 0.10);

  // 3. Midfield Strength:
  // Differentiated by role: DMC anchors defense/stamina, MC dictates tempo, AMC creates chances
  const calcMidScore = (p: PlayerInMatch) => {
    const pos = p.currentPosition;
    const pas = getEffectiveAttribute(p, 'passing', isCompetitive);
    const vis = getEffectiveAttribute(p, 'vision', isCompetitive);
    const tec = getEffectiveAttribute(p, 'technique', isCompetitive);
    const dec = getEffectiveAttribute(p, 'decisions', isCompetitive);
    const twk = getEffectiveAttribute(p, 'teamwork', isCompetitive);
    const sta = getEffectiveAttribute(p, 'stamina', isCompetitive);
    const tac = getEffectiveAttribute(p, 'tackling', isCompetitive);
    const posG = getEffectiveAttribute(p, 'positioning', isCompetitive);
    const str = getEffectiveAttribute(p, 'strength', isCompetitive);
    const dri = getEffectiveAttribute(p, 'dribbling', isCompetitive);

    let score = 50;
    if (pos === 'DMC') {
      // Defensive Midfielder: tackling, positioning, stamina, passing, strength
      score = tac * 0.25 + posG * 0.20 + sta * 0.20 + pas * 0.15 + str * 0.10 + dec * 0.10;
      if (p.player.archetype === 'Defansif Orta Saha') score += 3;
    } else if (pos === 'AMC') {
      // Attacking Midfielder: vision, passing, technique, decisions, dribbling
      score = vis * 0.25 + pas * 0.20 + tec * 0.20 + dec * 0.15 + dri * 0.10 + twk * 0.10;
      if (p.player.archetype === 'Oyun Kurucu') score += 3;
    } else {
      // Central / Box-to-Box Midfielder: balanced passing, vision, technique, stamina, decisions
      score = pas * 0.25 + vis * 0.20 + tec * 0.15 + dec * 0.15 + twk * 0.15 + sta * 0.10;
      if (p.player.archetype === 'Box-to-Box') score += 2;
    }
    return score;
  };

  const midMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcMidScore(p), 0) / mids.length : 45;
  const midDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcMidScore(p), 0) / defs.length : 40;
  const midAtts = atts.length > 0 ? atts.reduce((sum, p) => sum + calcMidScore(p), 0) / atts.length : 40;
  const midfieldStrength = Math.round(midMids * 0.70 + midDefs * 0.15 + midAtts * 0.15);

  // 4. Defensive Strength:
  // CB relies on tackling, marking, positioning, strength, heading, and recovery pace
  // Fullback relies on tackling, pace, positioning, marking, stamina
  const calcDefScore = (p: PlayerInMatch) => {
    const pos = p.currentPosition;
    const tac = getEffectiveAttribute(p, 'tackling', isCompetitive);
    const mar = getEffectiveAttribute(p, 'marking', isCompetitive);
    const posG = getEffectiveAttribute(p, 'positioning', isCompetitive);
    const str = getEffectiveAttribute(p, 'strength', isCompetitive);
    const hea = getEffectiveAttribute(p, 'heading', isCompetitive);
    const pac = getEffectiveAttribute(p, 'pace', isCompetitive);
    const dec = getEffectiveAttribute(p, 'decisions', isCompetitive);
    const sta = getEffectiveAttribute(p, 'stamina', isCompetitive);

    let score = 50;
    if (pos === 'DC') {
      // Centre-back: tackling, marking, positioning, strength, heading, recovery pace
      score = tac * 0.25 + mar * 0.20 + posG * 0.20 + str * 0.15 + hea * 0.10 + pac * 0.10;
      if (p.player.archetype === 'Fiziksel Stoper') score += 3;
      else if (p.player.archetype === 'Pasör Stoper') score += 1;
    } else if (pos === 'DL' || pos === 'DR') {
      // Fullback: tackling, pace, positioning, marking, stamina
      score = tac * 0.25 + pac * 0.25 + posG * 0.20 + mar * 0.15 + sta * 0.15;
      if (p.player.archetype === 'Savunmacı Bek') score += 3;
    } else if (pos === 'DMC') {
      // Defensive Mid shield contribution
      score = tac * 0.30 + posG * 0.25 + str * 0.20 + dec * 0.15 + sta * 0.10;
    } else {
      score = tac * 0.30 + posG * 0.25 + mar * 0.20 + str * 0.15 + dec * 0.10;
    }
    return score;
  };

  const defDefs = defs.length > 0 ? defs.reduce((sum, p) => sum + calcDefScore(p), 0) / defs.length : 45;
  const defMids = mids.length > 0 ? mids.reduce((sum, p) => sum + calcDefScore(p), 0) / mids.length : 40;
  const defAtts = atts.length > 0 ? atts.reduce((sum, p) => sum + calcDefScore(p), 0) / atts.length : 30;
  const defensiveStrength = Math.round(defDefs * 0.65 + defMids * 0.25 + defAtts * 0.10);

  // 5. Physical Strength
  const physicalStrength = Math.round(
    activePlayers.reduce((sum, p) => {
      const str = getEffectiveAttribute(p, 'strength', isCompetitive);
      const sta = getEffectiveAttribute(p, 'stamina', isCompetitive);
      const pac = getEffectiveAttribute(p, 'pace', isCompetitive);
      const agg = getEffectiveAttribute(p, 'aggression', isCompetitive);
      return sum + (str * 0.40 + sta * 0.30 + pac * 0.20 + agg * 0.10);
    }, 0) / activePlayers.length
  );

  // 6. Creativity (Playmakers & creative wingers boost team creativity)
  let creativity = Math.round(
    activePlayers.reduce((sum, p) => {
      const vis = getEffectiveAttribute(p, 'vision', isCompetitive);
      const tec = getEffectiveAttribute(p, 'technique', isCompetitive);
      const dri = getEffectiveAttribute(p, 'dribbling', isCompetitive);
      const dec = getEffectiveAttribute(p, 'decisions', isCompetitive);
      return sum + (vis * 0.40 + tec * 0.30 + dri * 0.20 + dec * 0.10);
    }, 0) / activePlayers.length
  );
  const playmakerCount = activePlayers.filter(p => p.player.archetype === 'Oyun Kurucu' || p.player.archetype === 'Oyun Kurucu Kanat').length;
  creativity = Math.min(99, creativity + playmakerCount * 3);

  // 7. Pressing Ability (Pressing forwards & high work-rate players boost team pressing)
  let pressingAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const twk = getEffectiveAttribute(p, 'teamwork', isCompetitive);
      const sta = getEffectiveAttribute(p, 'stamina', isCompetitive);
      const agg = getEffectiveAttribute(p, 'aggression', isCompetitive);
      const pac = getEffectiveAttribute(p, 'pace', isCompetitive);
      return sum + (twk * 0.30 + sta * 0.30 + agg * 0.20 + pac * 0.20);
    }, 0) / activePlayers.length
  );
  const pressingForwardCount = activePlayers.filter(p => p.player.archetype === 'Pres Forvet').length;
  pressingAbility = Math.min(99, pressingAbility + pressingForwardCount * 4);

  // 8. Possession Ability (Ball-playing CBs & playmakers control tempo)
  let possessionAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const pas = getEffectiveAttribute(p, 'passing', isCompetitive);
      const tec = getEffectiveAttribute(p, 'technique', isCompetitive);
      const com = getEffectiveAttribute(p, 'composure', isCompetitive);
      const twk = getEffectiveAttribute(p, 'teamwork', isCompetitive);
      return sum + (pas * 0.35 + tec * 0.25 + com * 0.20 + twk * 0.20);
    }, 0) / activePlayers.length
  );
  const ballPlayingCbCount = activePlayers.filter(p => p.player.archetype === 'Pasör Stoper').length;
  possessionAbility = Math.min(99, possessionAbility + ballPlayingCbCount * 2 + playmakerCount * 2);

  // 9. Counter Attack Ability (Fast wingers & speed threats dominate counters)
  let counterAttackAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const pac = getEffectiveAttribute(p, 'pace', isCompetitive);
      const acc = getEffectiveAttribute(p, 'acceleration', isCompetitive);
      const vis = getEffectiveAttribute(p, 'vision', isCompetitive);
      const fin = getEffectiveAttribute(p, 'finishing', isCompetitive);
      return sum + (pac * 0.40 + acc * 0.30 + vis * 0.15 + fin * 0.15);
    }, 0) / activePlayers.length
  );
  const fastWingerCount = activePlayers.filter(p => p.player.archetype === 'Hızlı Kanat').length;
  counterAttackAbility = Math.min(99, counterAttackAbility + fastWingerCount * 3);

  // 10. Set Piece Ability (Target forwards & aerial specialists dominate set pieces)
  let setPieceAbility = Math.round(
    activePlayers.reduce((sum, p) => {
      const cro = getEffectiveAttribute(p, 'crossing', isCompetitive);
      const hea = getEffectiveAttribute(p, 'heading', isCompetitive);
      const str = getEffectiveAttribute(p, 'strength', isCompetitive);
      const lsh = getEffectiveAttribute(p, 'longShots', isCompetitive);
      return sum + (cro * 0.35 + hea * 0.35 + str * 0.20 + lsh * 0.10);
    }, 0) / activePlayers.length
  );
  const targetForwardCount = activePlayers.filter(p => p.player.archetype === 'Hedef Santrfor').length;
  setPieceAbility = Math.min(99, setPieceAbility + targetForwardCount * 3);

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
