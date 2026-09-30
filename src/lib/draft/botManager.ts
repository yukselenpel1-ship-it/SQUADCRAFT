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
  const currentBudget = club?.budget ?? DEFAULT_DRAFT_BUDGET;
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

  const avgBudgetPerPick = currentBudget / remainingPicksForClub;

  // Rank available players using evaluation score
  const scoredCandidates = candidates.map((p) => {
    let score = p.overall * 2;
    const playerPrice = p.draftValue ?? calculatePlayerDraftValue(p);

    const isGK = p.position === 'GK';
    const isDEF = ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position);
    const isMID = ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position);
    const isATT = ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position);

    // Positional Need Bonuses
    if (isGK) {
      if (counts.gk >= minGK) {
        score -= 50; // Already satisfied min GK
      } else {
        score += neededGK * 25;
        if (mustFillMin && neededGK > 0) score += 60;
      }
    } else if (isDEF) {
      if (neededDEF > 0) score += neededDEF * 8;
      if (mustFillMin && neededDEF > 0) score += 30;
    } else if (isMID) {
      if (neededMID > 0) score += neededMID * 8;
      if (mustFillMin && neededMID > 0) score += 30;
    } else if (isATT) {
      if (neededATT > 0) score += neededATT * 10;
      if (mustFillMin && neededATT > 0) score += 35;
    }

    // Personality Modifiers (Tactical Fit)
    if (difficulty === 'ORTA' || difficulty === 'ZOR') {
      if (personality === 'Hücumcu') {
        if (isATT) score += 12;
        score += (p.attributes.finishing + p.attributes.pace) * 0.1;
      } else if (personality === 'Presçi') {
        score += (p.attributes.stamina + p.attributes.tackling) * 0.15;
      } else if (personality === 'Kontrollü') {
        score += (p.attributes.passing + p.attributes.vision + p.attributes.decisions) * 0.12;
      } else if (personality === 'Kontratakçı') {
        if (isDEF || isATT) score += 8;
        score += (p.attributes.pace + p.attributes.acceleration) * 0.15;
      }
    }

    // Budget Pacing Modifiers
    if (difficulty === 'KOLAY') {
      // Pacing so KOLAY does not burn entire budget in early rounds
      if (playerPrice > avgBudgetPerPick * 2.5) {
        score -= 25;
      }
    } else if (difficulty === 'ORTA') {
      // ORTA: Paces budget so it doesn't spend >2.2x average in late rounds
      if (remainingPicksForClub <= 10 && playerPrice > avgBudgetPerPick * 2.2) {
        score -= 20;
      }
    } else if (difficulty === 'ZOR') {
      // ZOR: Advanced Price/Performance (F/P) & Strategy
      // 1. Price-to-overall efficiency ratio (OVR per Million €)
      const priceInM = Math.max(0.5, playerPrice / 1_000_000);
      const fpRatio = p.overall / priceInM;
      if (fpRatio >= 8) score += 12; // Incredible bargain
      else if (fpRatio >= 5) score += 6;

      // 2. "YÜKSELEN YETENEK" Badge bonus
      if (p.isRisingTalent) {
        score += 18;
      }

      // 3. High POT youth premium
      if (p.age <= 22 && p.potential >= 85) {
        score += 14;
      }

      // 4. Aging expensive penalty: Avoid burning 20M+ on 31+ year olds
      if (p.age >= 31 && playerPrice > 16_000_000) {
        score -= 15;
      }

      // 5. Early marquee star allowance vs late round thriftiness
      const currentRound = counts.total + 1;
      if (currentRound <= 3 && p.overall >= 86) {
        score += 15; // Bot willingly invests in anchor superstars early
      } else if (currentRound >= 12 && playerPrice > avgBudgetPerPick * 1.6) {
        score -= 25; // Heavily favor smart bargains in depth rounds
      }

      // 6. Positional scarcity in remaining pool
      const samePosAvailable = availablePlayers.filter((cand) => cand.position === p.position);
      if (samePosAvailable.length <= 4) {
        score += 15; // Scarcity premium
      }

      // 7. Check public history to anticipate run on positions
      const recentPicks = publicHistory.slice(-4);
      const recentPosCount = recentPicks.filter((pick) => {
        const picked = playerPool.find((pl) => pl.id === pick.playerId);
        return picked?.position === p.position;
      }).length;

      if (recentPosCount >= 2) {
        score += 8; // Competitors are actively targeting this position
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
