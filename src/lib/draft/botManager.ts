import { Player, PlayerPosition, ClubTactics, Formation, Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width } from '@/types/game';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import { DraftRules, DraftClub, BotDifficulty, BotPersonality, DraftPick, DEFAULT_DRAFT_BUDGET, MIN_PLAYER_DRAFT_PRICE } from './types';
import { countSquadPositions } from './draftEngine';
import { createDefaultBadgeConfig, BADGE_SHAPES, BADGE_PATTERNS, BADGE_EMBLEMS } from './badgeGenerator';
import { calculatePlayerDraftValue } from './playerPool';

// ============================================================================
// ORIGINAL FICTIONAL CONTENT GENERATORS
// ============================================================================

const BOT_MANAGERS = [
  'Tufan Sancar',
  'Arven Vural',
  'Metehan Bayraktar',
  'Cevdet Demirhan',
  'Volkan Yıldırım',
  'Ertuğrul Çelik',
  'Boran Karadağ',
  'Tarkan Aksoy',
  'Hakan Serter',
  'Cenk Uludağ',
  'Alparslan Gök',
  'Zafer Şimşek',
  'Kaan Bozkurt',
  'Barlas Keskin',
  'Gökhan Ertekin',
];

const BOT_CLUB_NAMES = [
  { name: 'Kuzeyyalı Doruk SK', code: 'KDS', city: 'Kuzeyyalı' },
  { name: 'Yıldızhisar İdman Yurdu', code: 'YIY', city: 'Yıldızhisar' },
  { name: 'Buzultepe Gücü FK', code: 'BTG', city: 'Buzultepe' },
  { name: 'Demirhisar Atletik', code: 'DHA', city: 'Demirhisar' },
  { name: 'Fırtınatepe SK', code: 'FTP', city: 'Fırtınatepe' },
  { name: 'Gökbayrak Dinamo', code: 'GBD', city: 'Gökbayrak' },
  { name: 'Kanyontepe Spor', code: 'KTS', city: 'Kanyontepe' },
  { name: 'Alevhisar Yıldızları SK', code: 'AHY', city: 'Alevhisar' },
  { name: 'Kalyonhisar FK', code: 'KHF', city: 'Kalyonhisar' },
  { name: 'Boztepe Kartalları SK', code: 'BTK', city: 'Boztepehisar' },
];

const BOT_COLORS = [
  { primary: '#0ea5e9', secondary: '#0284c7' }, // Blue
  { primary: '#eab308', secondary: '#ca8a04' }, // Yellow / Gold
  { primary: '#10b981', secondary: '#059669' }, // Emerald / Green
  { primary: '#f43f5e', secondary: '#e11d48' }, // Rose / Crimson
  { primary: '#8b5cf6', secondary: '#7c3aed' }, // Purple
  { primary: '#f97316', secondary: '#ea580c' }, // Orange
  { primary: '#06b6d4', secondary: '#0891b2' }, // Cyan
  { primary: '#ec4899', secondary: '#db2777' }, // Pink
];

const BOT_PERSONALITIES: BotPersonality[] = [
  'Kontrollü',
  'Hücumcu',
  'Kontratakçı',
  'Presçi',
  'Dengeli',
];

/**
 * Generates a complete fictional bot profile with club, badge, personality and difficulty.
 */
export function generateBotProfile(
  difficulty: BotDifficulty = 'ORTA',
  index: number = 0
): {
  username: string;
  clubName: string;
  clubCode: string;
  personality: BotPersonality;
  primaryColor: string;
  secondaryColor: string;
  badge: ReturnType<typeof createDefaultBadgeConfig>;
} {
  const managerName = BOT_MANAGERS[index % BOT_MANAGERS.length];
  const clubPreset = BOT_CLUB_NAMES[index % BOT_CLUB_NAMES.length];
  const colorScheme = BOT_COLORS[index % BOT_COLORS.length];
  const personality = BOT_PERSONALITIES[index % BOT_PERSONALITIES.length];

  const shapes = BADGE_SHAPES.map((s) => s.id);
  const patterns = BADGE_PATTERNS.map((p) => p.id);
  const emblems = BADGE_EMBLEMS.map((e) => e.id);

  const shape = shapes[index % shapes.length];
  const pattern = patterns[(index + 1) % patterns.length];
  const emblem = emblems[(index + 2) % emblems.length];

  const badge = createDefaultBadgeConfig(colorScheme.primary, colorScheme.secondary, shape, pattern, emblem);

  return {
    username: `Bot ${managerName}`,
    clubName: clubPreset.name,
    clubCode: clubPreset.code,
    personality,
    primaryColor: colorScheme.primary,
    secondaryColor: colorScheme.secondary,
    badge,
  };
}

/**
 * Calculates natural delay in milliseconds for Bot draft picks.
 */
export function getBotPickDelayMs(difficulty: BotDifficulty): number {
  switch (difficulty) {
    case 'KOLAY':
      return 1500 + Math.random() * 2000; // 1.5 - 3.5s
    case 'ORTA':
      return 1000 + Math.random() * 1500; // 1.0 - 2.5s
    case 'ZOR':
      return 600 + Math.random() * 1000;  // 0.6 - 1.6s
  }
}

// ============================================================================
// BOT DRAFT DECISION ENGINE
// ============================================================================

/**
 * Calculates a natural, organic contingency reserve for a club manager.
 * Varies naturally across clubs and personalities without artificial zero-draining.
 */
export function getClubManagerBuffer(clubId: string, difficulty: BotDifficulty, personality?: BotPersonality): number {
  let hash = 0;
  for (let i = 0; i < clubId.length; i++) {
    hash = (hash * 31 + clubId.charCodeAt(i)) >>> 0;
  }
  const variance = (hash % 100) / 100; // 0.00 to 0.99

  let personalityBias = 0;
  if (personality === 'Kontrollü') personalityBias = 0.20;
  else if (personality === 'Hücumcu') personalityBias = -0.15;
  else if (personality === 'Kontratakçı') personalityBias = 0.10;

  const factor = Math.max(0, Math.min(1, variance + personalityBias));

  if (difficulty === 'KOLAY') {
    // Easy: €2.0M to €11.5M (typical ~€4M - €9M)
    return 2_000_000 + factor * 9_500_000;
  } else if (difficulty === 'ORTA') {
    // Medium: €1.0M to €7.5M (typical ~€2.5M - €5.5M)
    return 1_000_000 + factor * 6_500_000;
  } else {
    // Hard: €0.5M to €5.5M (typical ~€1.5M - €4.0M)
    return 500_000 + factor * 5_000_000;
  }
}

/**
 * Decides which player the bot will pick during snake draft.
 * Respects difficulty tiers with zero hidden cheating.
 */
export function chooseBotDraftPick(
  playerPool: Player[],
  pickedPlayerIds: Set<string>,
  clubPlayerIds: string[],
  rules: DraftRules,
  difficulty: BotDifficulty,
  personality: BotPersonality = 'Dengeli',
  publicHistory: DraftPick[] = [],
  club?: DraftClub
): Player | null {
  const allAvailable = playerPool.filter((p) => !pickedPlayerIds.has(p.id));
  if (allAvailable.length === 0) return null;

  const counts = countSquadPositions(playerPool, clubPlayerIds);
  const remainingPicksForClub = Math.max(1, rules.squadSize - counts.total);
  const initialBudget = rules.draftBudget || DEFAULT_DRAFT_BUDGET;
  const currentBudget = club?.budget ?? initialBudget;
  const minRequiredForRest = Math.max(0, remainingPicksForClub - 1) * MIN_PLAYER_DRAFT_PRICE;

  // Strict mathematical guarantee filter: Bot can never choose an unaffordable player
  let availablePlayers = allAvailable.filter((p) => {
    const val = p.draftValue ?? calculatePlayerDraftValue(p);
    return currentBudget >= val && (currentBudget - val) >= minRequiredForRest;
  });

  if (availablePlayers.length === 0) {
    // Edge case safety fallback to cheapest available
    availablePlayers = [...allAvailable].sort(
      (a, b) => (a.draftValue ?? 0) - (b.draftValue ?? 0)
    );
  }

  const minGK = 2;
  const minDEF = 5;
  const minMID = 5;
  const minATT = 3;

  const neededGK = Math.max(0, minGK - counts.gk);
  const neededDEF = Math.max(0, minDEF - counts.def);
  const neededMID = Math.max(0, minMID - counts.mid);
  const neededATT = Math.max(0, minATT - counts.att);
  const totalMinNeeded = neededGK + neededDEF + neededMID + neededATT;

  const mustFillMin = remainingPicksForClub <= totalMinNeeded + 1;

  // Filter candidates based on urgent minimum requirements
  let candidates = [...availablePlayers];

  if (mustFillMin) {
    if (neededGK > 0 && remainingPicksForClub <= neededGK + 1) {
      const gks = candidates.filter((p) => p.position === 'GK');
      if (gks.length > 0) candidates = gks;
    } else if (neededDEF > 0 && remainingPicksForClub <= neededDEF + 1) {
      const defs = candidates.filter((p) => ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position));
      if (defs.length > 0) candidates = defs;
    } else if (neededMID > 0 && remainingPicksForClub <= neededMID + 1) {
      const mids = candidates.filter((p) => ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
      if (mids.length > 0) candidates = mids;
    } else if (neededATT > 0 && remainingPicksForClub <= neededATT + 1) {
      const atts = candidates.filter((p) => ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position));
      if (atts.length > 0) candidates = atts;
    }
  }

  const clubPlayersMap = new Map(playerPool.map((p) => [p.id, p]));
  const existingClubPlayers = clubPlayerIds.map((id) => clubPlayersMap.get(id)).filter(Boolean) as Player[];
  const budgetScale = initialBudget / DEFAULT_DRAFT_BUDGET;
  const starPriceThreshold = 35_000_000 * budgetScale;
  const starAnchorCount = existingClubPlayers.filter((p) => (p.draftValue ?? 0) >= starPriceThreshold || p.overall >= 88).length;
  const currentRound = counts.total + 1;

  // Organic Manager Financial Disposition & Contingency Reserve (scaled with room budget)
  const desiredReserve = getClubManagerBuffer(club?.id ?? 'default-club', difficulty, personality) * budgetScale;
  const plannedSpendCap = initialBudget - desiredReserve;
  const currentSpent = club?.spentBudget ?? 0;

  // Target Reserve Schedule per pick scaled dynamically to room budget
  let targetReservePerPick = 0;
  if (difficulty === 'ZOR') {
    if (currentRound <= 3) targetReservePerPick = 8_200_000 * budgetScale;
    else if (currentRound <= 7) targetReservePerPick = 6_500_000 * budgetScale;
    else if (currentRound <= 11) targetReservePerPick = 4_500_000 * budgetScale;
    else if (currentRound <= 14) targetReservePerPick = 2_400_000 * budgetScale;
    else targetReservePerPick = 1_000_000 * budgetScale;
  } else if (difficulty === 'ORTA') {
    if (currentRound <= 3) targetReservePerPick = 7_500_000 * budgetScale;
    else if (currentRound <= 7) targetReservePerPick = 5_800_000 * budgetScale;
    else if (currentRound <= 11) targetReservePerPick = 3_800_000 * budgetScale;
    else if (currentRound <= 14) targetReservePerPick = 2_200_000 * budgetScale;
    else targetReservePerPick = 900_000 * budgetScale;
  } else {
    // KOLAY: Pacing adjusted so bench lands naturally at 63-66 OVR
    if (currentRound <= 3) targetReservePerPick = 6_800_000 * budgetScale;
    else if (currentRound <= 7) targetReservePerPick = 5_000_000 * budgetScale;
    else if (currentRound <= 11) targetReservePerPick = 3_200_000 * budgetScale;
    else if (currentRound <= 14) targetReservePerPick = 1_600_000 * budgetScale;
    else targetReservePerPick = 700_000 * budgetScale;
  }

  // Rank available players using evaluation score
  const scoredCandidates = candidates.map((p) => {
    // Current ability is the primary anchor of all scouting decisions
    let score = p.overall * 3.5;
    const playerPrice = p.draftValue ?? calculatePlayerDraftValue(p);

    const isGK = p.position === 'GK';
    const isDEF = ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position);
    const isMID = ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position);
    const isATT = ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position);

    // Positional Need Bonuses
    if (isGK) {
      if (counts.gk >= minGK) {
        score -= 90; // Strictly never hoard 3+ GKs
      } else if (counts.gk >= 1 && currentRound <= 12) {
        score -= 40; // Do not buy an expensive backup goalkeeper during Starting XI rounds
      } else {
        score += neededGK * 15;
        if (mustFillMin && neededGK > 0) score += 60;
      }
    } else if (isDEF) {
      if (neededDEF > 0) score += neededDEF * 6;
      if (mustFillMin && neededDEF > 0) score += 30;
    } else if (isMID) {
      if (neededMID > 0) score += neededMID * 6;
      if (mustFillMin && neededMID > 0) score += 30;
    } else if (isATT) {
      if (neededATT > 0) score += neededATT * 8;
      if (mustFillMin && neededATT > 0) score += 35;
    }

    // Budget Reserve check
    const remainingPicksAfterPick = remainingPicksForClub - 1;
    if (remainingPicksAfterPick > 0) {
      const projectedPerPick = (currentBudget - playerPrice) / remainingPicksAfterPick;
      if (projectedPerPick < targetReservePerPick) {
        const deficit = targetReservePerPick - projectedPerPick;
        const penaltyMultiplier = difficulty === 'ZOR' ? 3.5 : 2.5;
        score -= (deficit / 100_000) * penaltyMultiplier;
      }
    }

    // Organic Planned Spend Cap Soft Penalty:
    // When projected total spending approaches or exceeds the manager's target spend cap,
    // apply a soft penalty so that natural leftover funds emerge organically.
    const projectedTotalSpent = currentSpent + playerPrice + Math.max(0, remainingPicksAfterPick) * 600_000;
    if (projectedTotalSpent > plannedSpendCap) {
      const excess = projectedTotalSpent - plannedSpendCap;
      score -= (excess / 100_000) * 2.2;
    }

    // Bench Spend Discipline & Role-Based Pricing (Rounds 12-18):
    // In late rounds, clubs avoid needlessly overpaying for bench depth while securing quality.
    if (currentRound >= 12 && !p.isRisingTalent) {
      const priceInM = playerPrice / 1_000_000;
      const lateRoundMultiplier = currentRound >= 16 ? 2.0 : currentRound >= 14 ? 1.5 : 1.0;
      if (difficulty === 'KOLAY') {
        score -= priceInM * 2.8 * lateRoundMultiplier;
      } else if (difficulty === 'ORTA') {
        score -= priceInM * 1.8 * lateRoundMultiplier;
      } else if (difficulty === 'ZOR') {
        if (playerPrice > 4_500_000) {
          score -= (priceInM - 4.5) * 3.5 * lateRoundMultiplier;
        }
      }
    }

    // Personality Modifiers (Tactical Fit)
    if (difficulty === 'ORTA' || difficulty === 'ZOR') {
      if (personality === 'Hücumcu') {
        if (isATT) score += 6;
        score += (p.attributes.finishing + p.attributes.pace) * 0.05;
      } else if (personality === 'Presçi') {
        score += (p.attributes.stamina + p.attributes.tackling) * 0.08;
      } else if (personality === 'Kontrollü') {
        score += (p.attributes.passing + p.attributes.vision + p.attributes.decisions) * 0.06;
      } else if (personality === 'Kontratakçı') {
        if (isDEF || isATT) score += 4;
        score += (p.attributes.pace + p.attributes.acceleration) * 0.08;
      }
    }

    // Difficulty specific logic
    if (difficulty === 'KOLAY') {
      // Inefficient picks, occasional overpay for older players, ignores potential
      if (p.age >= 28 && p.overall >= 80) score += 2;
      if (p.age >= 33) score -= 3; // Moderate veteran cap
      if (p.potential > p.overall) score -= 2; // Ignores potential
      // Preference for decent mid-tier benchers in late rounds (63-69 OVR at €1.0M-€3.0M)
      if (currentRound >= 12 && p.overall >= 63 && p.overall <= 69 && playerPrice <= 3_000_000) {
        score += 6;
      }
    } else if (difficulty === 'ORTA') {
      // Balanced squad building (max 2 stars)
      if (playerPrice >= 35_000_000 && starAnchorCount >= 2) score -= 60;
      // Prime age focus
      if (p.age >= 24 && p.age <= 28) score += 4;
      else if (p.age >= 32) score -= 6;
      if (p.age <= 23 && p.potential > p.overall) {
        score += Math.min(6, (p.potential - p.overall) * 0.6);
      }
      if (p.isRisingTalent && currentRound >= 10) {
        score += 8; // Medium scouts appreciate some rising talent
      }
      if (currentRound >= 12 && p.overall >= 67 && playerPrice <= 4_500_000) {
        score += 6;
      }
    } else if (difficulty === 'ZOR') {
      // Dominant Starting XI & Smart depth
      if (playerPrice >= 35_000_000 && starAnchorCount >= 2) score -= 80;

      if (currentRound <= 11) {
        // Starting XI phase: 1-2 prime anchors + dominant Starting XI OVR + Prime Age (22-29)
        if (currentRound <= 3 && p.overall >= 86 && starAnchorCount < 2) score += 28;
        if (p.overall >= 78) score += (p.overall - 77) * 3.5;
        if (p.isRisingTalent) score += 25; // Elite young prodigies valued for Starting XI
        if (p.age >= 22 && p.age <= 29) score += 10; // Prime age dominance
        if (p.age >= 31) score -= 10; // Avoid veterans in Starting XI
      } else {
        // Depth / Bench phase (R12-18): Target high-ceiling upside, Rising Talents & cheap bargains
        if (p.isRisingTalent) score += 32;
        if (p.age <= 22 && p.potential >= 82) score += Math.min(10, (p.potential - p.overall) * 0.9);
        if (p.overall >= 70 && playerPrice <= 6_000_000) score += 8 + (p.overall - 70) * 1.5;
        if (p.age >= 29) score -= 10; // Strict youth depth bias
      }
    }

    return { player: p, score };
  });

  scoredCandidates.sort((a, b) => b.score - a.score);

  // Guarantee only affordable & quota-safe players are picked
  const safeScored = scoredCandidates.filter((c) => {
    const val = c.player.draftValue ?? calculatePlayerDraftValue(c.player);
    return currentBudget >= val && (currentBudget - val) >= minRequiredForRest;
  });
  const finalCandidates = safeScored.length > 0 ? safeScored : scoredCandidates;

  // Difficulty Selection variance:
  if (difficulty === 'KOLAY') {
    // Pick among top 4 with slight randomness
    const topN = finalCandidates.slice(0, Math.min(4, finalCandidates.length));
    const chosen = topN[Math.floor(Math.random() * topN.length)];
    return chosen.player;
  }

  if (difficulty === 'ORTA') {
    // Pick among top 2
    const topN = finalCandidates.slice(0, Math.min(2, finalCandidates.length));
    const chosen = topN[Math.floor(Math.random() * topN.length)];
    return chosen.player;
  }

  // ZOR always picks the highest scored player
  return finalCandidates[0]?.player || availablePlayers[0];
}

// ============================================================================
// BOT TACTICS GENERATION
// ============================================================================

/**
 * Generates starting XI, bench, and full tactical instructions for a Bot club.
 */
export function generateBotTactics(
  clubId: string,
  squadPlayerIds: string[],
  playerPool: Player[],
  difficulty: BotDifficulty = 'ORTA',
  personality: BotPersonality = 'Dengeli'
): ClubTactics {
  const squad = playerPool.filter((p) => squadPlayerIds.includes(p.id));

  // Determine formation by personality
  let formation: Formation = '4-3-3';
  let mentality: Mentality = 'Dengeli';
  let tempo: Tempo = 'Standart';
  let pressing: Pressing = 'Orta';
  let passingStyle: PassingStyle = 'Kısa';
  let defensiveLine: DefensiveLine = 'Standart';
  let width: Width = 'Dengeli';

  switch (personality) {
    case 'Hücumcu': {
      const attackingFormations: Formation[] = difficulty === 'ZOR' ? ['3-4-3', '4-2-4', '3-4-2-1'] : ['4-3-3', '4-2-4', '4-2-2-2'];
      formation = attackingFormations[Math.floor(Math.random() * attackingFormations.length)];
      mentality = 'Hücum';
      tempo = 'Yüksek';
      pressing = 'Yoğun';
      passingStyle = 'Doğrudan';
      defensiveLine = 'Yüksek';
      width = 'Geniş';
      break;
    }

    case 'Presçi': {
      const pressingFormations: Formation[] = ['4-3-3', '4-1-2-1-2', '4-3-2-1'];
      formation = pressingFormations[Math.floor(Math.random() * pressingFormations.length)];
      mentality = 'Dengeli';
      tempo = 'Yüksek';
      pressing = 'Aşırı';
      passingStyle = 'Kısa';
      defensiveLine = 'Yüksek';
      width = 'Dengeli';
      break;
    }

    case 'Kontrollü': {
      const controlFormations: Formation[] = ['4-2-3-1', '4-1-4-1', '3-4-2-1'];
      formation = controlFormations[Math.floor(Math.random() * controlFormations.length)];
      mentality = 'Dengeli';
      tempo = 'Düşük';
      pressing = 'Orta';
      passingStyle = 'Kısa';
      defensiveLine = 'Standart';
      width = 'Dar';
      break;
    }

    case 'Kontratakçı': {
      const counterFormations: Formation[] = difficulty === 'ZOR' ? ['5-3-2', '5-2-3', '3-5-2'] : ['4-4-2', '5-3-2', '3-5-2'];
      formation = counterFormations[Math.floor(Math.random() * counterFormations.length)];
      mentality = 'Savunmacı';
      tempo = 'Çok Yüksek';
      pressing = 'Hafif';
      passingStyle = 'Doğrudan';
      defensiveLine = 'Derin';
      width = 'Geniş';
      break;
    }

    case 'Dengeli':
    default: {
      const balancedFormations: Formation[] = ['4-3-3', '4-2-2-2', '4-2-3-1', '3-4-1-2'];
      formation = balancedFormations[Math.floor(Math.random() * balancedFormations.length)];
      mentality = 'Dengeli';
      tempo = 'Standart';
      pressing = 'Orta';
      passingStyle = 'Kısa';
      defensiveLine = 'Standart';
      width = 'Dengeli';
      break;
    }
  }

  // Look up exact pitch coordinates & roles from FORMATION_COORDINATES
  const coords = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3'];
  const remainingSquad = [...squad].sort((a, b) => b.overall - a.overall);
  const starting11: { id: string | null; role: PlayerPosition; x: number; y: number }[] = [];

  for (const slot of coords) {
    let bestIdx = remainingSquad.findIndex((p) => p.position === slot.role);
    if (bestIdx === -1) {
      bestIdx = remainingSquad.findIndex((p) => p.secondaryPositions?.includes(slot.role));
    }
    if (bestIdx === -1) {
      bestIdx = 0;
    }

    const pickedPlayer = remainingSquad[bestIdx];
    if (pickedPlayer) {
      remainingSquad.splice(bestIdx, 1);
      starting11.push({ id: pickedPlayer.id, role: slot.role, x: slot.x, y: slot.y });
    } else {
      starting11.push({ id: null, role: slot.role, x: slot.x, y: slot.y });
    }
  }

  const assignedSet = new Set(starting11.map((s) => s.id).filter(Boolean) as string[]);
  const bench = squad.filter((p) => !assignedSet.has(p.id)).sort((a, b) => b.overall - a.overall).map((p) => p.id);

  return {
    clubId,
    formation,
    settings: {
      mentality,
      tempo,
      pressing,
      passingStyle,
      defensiveLine,
      width,
    },
    lineup: starting11.map((s, idx) => ({
      slotId: idx,
      role: s.role,
      x: s.x,
      y: s.y,
      playerId: s.id,
    })),
    substitutes: bench.slice(0, 7),
    reserves: bench.slice(7),
  };
}
