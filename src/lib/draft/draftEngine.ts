import { Player, PlayerPosition, ClubTactics, Formation } from '@/types/game';
import {
  MultiplayerRoom,
  RoomMember,
  DraftClub,
  DraftRules,
  DraftState,
  DraftPick,
  DraftFixture,
  DraftStanding,
  LeagueFormat,
  MultiplayerErrorCode,
  DEFAULT_DRAFT_BUDGET,
  MIN_PLAYER_DRAFT_PRICE,
} from './types';
import { formatMultiplayerError } from './logger';
import { calculatePlayerDraftValue } from './playerPool';

// Clean character set for readable, non-confusing room codes (omits 0/O, 1/I/L)
const CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a short, uppercase, easy-to-share room code (e.g., "SC-A7K9").
 */
export function generateRoomCode(): string {
  let part = '';
  for (let i = 0; i < 4; i++) {
    part += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return `SC-${part}`;
}

/**
 * Generates randomized initial draft order (shuffled member IDs).
 */
export function generateInitialDraftOrder(memberIds: string[], seed?: number): string[] {
  const list = [...memberIds];
  let s = seed ?? Date.now();
  for (let i = list.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Calculates who drafts at a specific round and pickIndex in Snake Draft format.
 * Round 1 (1-indexed): 0 -> N-1
 * Round 2: N-1 -> 0
 * Round 3: 0 -> N-1 ...
 */
export function getSnakeTurnMemberId(
  draftOrder: string[],
  round: number,
  pickIndexInRound: number
): string {
  const n = draftOrder.length;
  if (n === 0) return '';
  const isReverse = round % 2 === 0;
  const orderIndex = isReverse ? n - 1 - pickIndexInRound : pickIndexInRound;
  return draftOrder[orderIndex];
}

/**
 * Computes the initial DraftState when the host launches the draft.
 */
export function initializeDraftState(
  roomId: string,
  draftOrder: string[],
  rules: DraftRules,
  nowMs: number = Date.now()
): DraftState {
  const currentRound = 1;
  const currentPickIndex = 0;
  const currentTurnMemberId = getSnakeTurnMemberId(draftOrder, currentRound, currentPickIndex);
  const durationMs = rules.pickTimerSeconds > 0 ? rules.pickTimerSeconds * 1000 : 0;
  const pickDeadline = durationMs > 0 ? nowMs + durationMs : Number.MAX_SAFE_INTEGER;

  return {
    roomId,
    currentRound,
    currentPickIndex,
    currentTurnMemberId,
    currentTurnStartTime: nowMs,
    pickDeadline,
    draftOrder,
    isPaused: false,
    isCompleted: false,
    picks: [],
  };
}

export interface SquadPositionalCounts {
  gk: number;
  def: number;
  mid: number;
  att: number;
  total: number;
}

export function countSquadPositions(playerPool: Player[], squadPlayerIds: string[]): SquadPositionalCounts {
  const idSet = new Set(squadPlayerIds);
  const squad = playerPool.filter((p) => idSet.has(p.id));

  let gk = 0;
  let def = 0;
  let mid = 0;
  let att = 0;

  for (const p of squad) {
    if (p.position === 'GK') gk++;
    else if (['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)) def++;
    else if (['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position)) mid++;
    else if (['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position)) att++;
  }

  return { gk, def, mid, att, total: squad.length };
}

/**
 * Validates whether a completed squad satisfies positional quotas and squad size.
 * For 18-player squads: Min 2 GK, 5 DEF, 5 MID, 3 ATT (Remaining 3 slots are free choice).
 */
export function validateCompletedSquad(
  playerPool: Player[],
  squadPlayerIds: string[],
  rules: DraftRules
): { isValid: boolean; error?: string; errorCode?: MultiplayerErrorCode; counts: SquadPositionalCounts } {
  const counts = countSquadPositions(playerPool, squadPlayerIds);

  if (counts.total !== rules.squadSize) {
    const err = formatMultiplayerError('SC-MP-009', `Kadro ${rules.squadSize} oyuncu olmalıdır (Mevcut: ${counts.total})`);
    return { isValid: false, error: err.message, errorCode: 'SC-MP-009', counts };
  }

  if (counts.gk < 2) {
    const err = formatMultiplayerError('SC-MP-009', `En az 2 kaleci gereklidir (Mevcut: ${counts.gk})`);
    return { isValid: false, error: err.message, errorCode: 'SC-MP-009', counts };
  }

  if (counts.def < 5) {
    const err = formatMultiplayerError('SC-MP-009', `En az 5 savunma oyuncusu gereklidir (Mevcut: ${counts.def})`);
    return { isValid: false, error: err.message, errorCode: 'SC-MP-009', counts };
  }

  if (counts.mid < 5) {
    const err = formatMultiplayerError('SC-MP-009', `En az 5 orta saha oyuncusu gereklidir (Mevcut: ${counts.mid})`);
    return { isValid: false, error: err.message, errorCode: 'SC-MP-009', counts };
  }

  if (counts.att < 3) {
    const err = formatMultiplayerError('SC-MP-009', `En az 3 hücum oyuncusu gereklidir (Mevcut: ${counts.att})`);
    return { isValid: false, error: err.message, errorCode: 'SC-MP-009', counts };
  }

  return { isValid: true, counts };
}

/**
 * Validates whether a pick request is legal and atomic.
 */
export function validateDraftPick(
  draftState: DraftState,
  memberId: string,
  playerId: string,
  pickedPlayerIds: Set<string>,
  playerPool: Player[],
  rules: DraftRules,
  club?: DraftClub
): { isValid: boolean; error?: string; errorCode?: MultiplayerErrorCode } {
  if (draftState.isCompleted) {
    const err = formatMultiplayerError('SC-MP-007', 'Draft zaten tamamlandı.');
    return { isValid: false, error: err.message, errorCode: 'SC-MP-007' };
  }

  if (draftState.isPaused) {
    const err = formatMultiplayerError('SC-MP-007', 'Draft şu anda duraklatılmış durumda.');
    return { isValid: false, error: err.message, errorCode: 'SC-MP-007' };
  }

  if (draftState.currentTurnMemberId !== memberId) {
    const err = formatMultiplayerError('SC-MP-003');
    return { isValid: false, error: err.message, errorCode: 'SC-MP-003' };
  }

  if (pickedPlayerIds.has(playerId)) {
    const err = formatMultiplayerError('SC-MP-004');
    return { isValid: false, error: err.message, errorCode: 'SC-MP-004' };
  }

  const player = playerPool.find((p) => p.id === playerId);
  if (!player) {
    const err = formatMultiplayerError('SC-MP-004', 'Futbolcu havuzda bulunamadı.');
    return { isValid: false, error: err.message, errorCode: 'SC-MP-004' };
  }

  // Budget Validation & Mathematical Quota Guarantee
  if (club) {
    const playerPrice = player.draftValue ?? calculatePlayerDraftValue(player);
    const currentBudget = club.budget ?? (rules.draftBudget || DEFAULT_DRAFT_BUDGET);

    if (playerPrice > currentBudget) {
      const err = formatMultiplayerError(
        'SC-MP-013',
        `Bütçe yetersiz! Oyuncu bedeli: €${(playerPrice / 1_000_000).toFixed(1)}M, Mevcut bütçeniz: €${(currentBudget / 1_000_000).toFixed(1)}M`
      );
      return { isValid: false, error: err.message, errorCode: 'SC-MP-013' };
    }

    const currentSquadCount = club.squadPlayerIds?.length || 0;
    const remainingPicks = rules.squadSize - currentSquadCount;
    if (remainingPicks > 1) {
      const remainingAfterPick = currentBudget - playerPrice;
      const minRequiredForRest = (remainingPicks - 1) * MIN_PLAYER_DRAFT_PRICE;
      if (remainingAfterPick < minRequiredForRest) {
        const err = formatMultiplayerError(
          'SC-MP-013',
          `Bu seçim sonrası kalan ${remainingPicks - 1} transferi tamamlamak için gereken asgari bütçe (€150K/seçim) tehlikeye giriyor.`
        );
        return { isValid: false, error: err.message, errorCode: 'SC-MP-013' };
      }
    }
  }

  return { isValid: true };
}

/**
 * Intelligent Auto-Pick algorithm for timeout / AFK players.
 * Evaluates positional requirements: Min 2 GK, 5 DEF, 5 MID, 3 ATT.
 * Strictly respects remaining budget and mathematical quota guarantee.
 */
export function determineAutoPick(
  playerPool: Player[],
  pickedPlayerIds: Set<string>,
  clubPlayerIds: string[],
  rules: DraftRules,
  currentRound: number,
  club?: DraftClub
): Player | null {
  const currentBudget = club?.budget ?? (rules.draftBudget || DEFAULT_DRAFT_BUDGET);
  const counts = countSquadPositions(playerPool, clubPlayerIds);
  const remainingRounds = rules.squadSize - counts.total;
  const minRequiredForRest = Math.max(0, remainingRounds - 1) * MIN_PLAYER_DRAFT_PRICE;

  let availablePlayers = playerPool.filter((p) => {
    if (pickedPlayerIds.has(p.id)) return false;
    const val = p.draftValue ?? calculatePlayerDraftValue(p);
    return currentBudget >= val && (currentBudget - val) >= minRequiredForRest;
  });

  if (availablePlayers.length === 0) {
    // Edge case safety fallback to cheapest unpicked players
    availablePlayers = playerPool
      .filter((p) => !pickedPlayerIds.has(p.id))
      .sort((a, b) => (a.draftValue ?? 0) - (b.draftValue ?? 0));
  }
  if (availablePlayers.length === 0) return null;

  // Minimum required targets
  const minGK = 2;
  const minDEF = 5;
  const minMID = 5;
  const minATT = 3;

  const neededGK = Math.max(0, minGK - counts.gk);
  const neededDEF = Math.max(0, minDEF - counts.def);
  const neededMID = Math.max(0, minMID - counts.mid);
  const neededATT = Math.max(0, minATT - counts.att);
  const totalNeeded = neededGK + neededDEF + neededMID + neededATT;

  // Is an urgent pick needed (i.e. remaining rounds <= needed positions)?
  const isUrgent = remainingRounds <= totalNeeded + 1;

  let bestPlayer: Player = availablePlayers[0];
  let bestScore = -1000;

  for (const p of availablePlayers) {
    let score = p.overall * 1.5;

    const isGK = p.position === 'GK';
    const isDEF = ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position);
    const isMID = ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position);
    const isATT = ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position);

    if (isGK) {
      if (counts.gk >= minGK) {
        score -= 40; // Don't hoard extra goalkeepers
      } else {
        score += neededGK * 15;
        if (isUrgent && neededGK > 0) score += 50;
      }
    } else if (isDEF) {
      if (neededDEF > 0) score += neededDEF * 6;
      if (isUrgent && neededDEF > 0) score += 25;
    } else if (isMID) {
      if (neededMID > 0) score += neededMID * 6;
      if (isUrgent && neededMID > 0) score += 25;
    } else if (isATT) {
      if (neededATT > 0) score += neededATT * 8;
      if (isUrgent && neededATT > 0) score += 25;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPlayer = p;
    }
  }

  return bestPlayer;
}

/**
 * Executes a pick atomically and advances the DraftState.
 */
export function executeDraftPick(
  currentState: DraftState,
  memberId: string,
  clubId: string,
  playerId: string,
  isAutoPick: boolean,
  rules: DraftRules,
  nowMs: number = Date.now(),
  draftPrice?: number
): { nextState: DraftState; newPick: DraftPick } {
  const globalPickNumber = currentState.picks.length + 1;
  const timeTakenSeconds = Math.max(
    1,
    Math.round((nowMs - currentState.currentTurnStartTime) / 1000)
  );

  const newPick: DraftPick = {
    id: `pick-${currentState.roomId}-${globalPickNumber}`,
    roomId: currentState.roomId,
    round: currentState.currentRound,
    pickIndexInRound: currentState.currentPickIndex,
    globalPickNumber,
    memberId,
    clubId,
    playerId,
    selectedAt: new Date(nowMs).toISOString(),
    isAutoPick,
    timeTakenSeconds,
    draftPrice,
  };

  const updatedPicks = [...currentState.picks, newPick];
  const totalManagers = currentState.draftOrder.length;
  const totalPicksRequired = rules.squadSize * totalManagers;

  // Check if draft is finished
  if (updatedPicks.length >= totalPicksRequired) {
    return {
      nextState: {
        ...currentState,
        picks: updatedPicks,
        isCompleted: true,
        currentTurnMemberId: '',
        pickDeadline: 0,
      },
      newPick,
    };
  }

  // Advance to next pick
  let nextRound = currentState.currentRound;
  let nextPickIndex = currentState.currentPickIndex + 1;

  if (nextPickIndex >= totalManagers) {
    nextRound += 1;
    nextPickIndex = 0;
  }

  const nextTurnMemberId = getSnakeTurnMemberId(currentState.draftOrder, nextRound, nextPickIndex);
  const durationMs = rules.pickTimerSeconds > 0 ? rules.pickTimerSeconds * 1000 : 0;
  const nextDeadline = durationMs > 0 ? nowMs + durationMs : Number.MAX_SAFE_INTEGER;

  return {
    nextState: {
      ...currentState,
      currentRound: nextRound,
      currentPickIndex: nextPickIndex,
      currentTurnMemberId: nextTurnMemberId,
      currentTurnStartTime: nowMs,
      pickDeadline: nextDeadline,
      picks: updatedPicks,
    },
    newPick,
  };
}

/**
 * Generates Round-Robin fixtures for the Draft League.
 */
export function generateDraftLeagueFixtures(
  roomId: string,
  clubs: DraftClub[],
  format: LeagueFormat = 'DOUBLE_ROUND',
  seasonNumber: number = 1
): DraftFixture[] {
  const fixtures: DraftFixture[] = [];
  const teamIds = clubs.map((c) => c.id);
  const n = teamIds.length;

  if (n < 2) return [];

  // If odd number of teams, add a dummy bye
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
  }

  const totalRoundsSingle = teams.length - 1;
  const matchesPerRound = teams.length / 2;

  let fixtureCounter = 1;

  // Single round robin schedule using polygon rotation
  for (let round = 1; round <= totalRoundsSingle; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const homeIdx = match;
      const awayIdx = teams.length - 1 - match;

      const home = teams[homeIdx];
      const away = teams[awayIdx];

      if (home !== 'BYE' && away !== 'BYE') {
        fixtures.push({
          id: `fix-${roomId}-s${seasonNumber}-r${round}-${fixtureCounter++}`,
          roomId,
          seasonNumber,
          round,
          homeClubId: round % 2 === 0 ? away : home,
          awayClubId: round % 2 === 0 ? home : away,
          status: 'AWAITING_TACTICS',
        });
      }
    }

    // Rotate array (keep index 0 fixed)
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  // If double round robin, mirror the schedule with swapped home/away
  if (format === 'DOUBLE_ROUND') {
    const singleRoundCount = fixtures.length;
    for (let i = 0; i < singleRoundCount; i++) {
      const f = fixtures[i];
      const returnRound = f.round + totalRoundsSingle;
      fixtures.push({
        id: `fix-${roomId}-s${seasonNumber}-r${returnRound}-${fixtureCounter++}`,
        roomId,
        seasonNumber,
        round: returnRound,
        homeClubId: f.awayClubId,
        awayClubId: f.homeClubId,
        status: 'AWAITING_TACTICS',
      });
    }
  }

  return fixtures;
}

/**
 * Initializes 0-point league standings for all participating clubs.
 */
export function initializeDraftStandings(clubs: DraftClub[]): DraftStanding[] {
  return clubs.map((club, idx) => ({
    rank: idx + 1,
    clubId: club.id,
    clubName: club.name,
    clubCode: club.code,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }));
}

/**
 * Generates default tactics for a newly drafted squad.
 */
export function generateDefaultDraftTactics(clubId: string, squadPlayerIds: string[], playerPool: Player[]): ClubTactics {
  const squad = playerPool.filter((p) => squadPlayerIds.includes(p.id));
  
  // Pick best GK
  const gks = squad.filter((p) => p.position === 'GK').sort((a, b) => b.overall - a.overall);
  const defs = squad.filter((p) => ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const mids = squad.filter((p) => ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position)).sort((a, b) => b.overall - a.overall);
  const atts = squad.filter((p) => ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position)).sort((a, b) => b.overall - a.overall);

  const starting11: { id: string | null; role: PlayerPosition }[] = [
    { id: gks[0]?.id || squad[0]?.id || null, role: 'GK' },
    { id: defs[0]?.id || null, role: 'DL' },
    { id: defs[1]?.id || null, role: 'DC' },
    { id: defs[2]?.id || null, role: 'DC' },
    { id: defs[3]?.id || null, role: 'DR' },
    { id: mids[0]?.id || null, role: 'DMC' },
    { id: mids[1]?.id || null, role: 'MC' },
    { id: mids[2]?.id || null, role: 'AMC' },
    { id: atts[0]?.id || mids[3]?.id || null, role: 'AML' },
    { id: atts[1]?.id || mids[4]?.id || null, role: 'AMR' },
    { id: atts[2]?.id || atts[0]?.id || null, role: 'ST' },
  ];

  const assignedSet = new Set(starting11.map((s) => s.id).filter(Boolean) as string[]);
  const bench = squad.filter((p) => !assignedSet.has(p.id)).map((p) => p.id);

  return {
    clubId,
    formation: '4-3-3',
    settings: {
      mentality: 'Dengeli',
      tempo: 'Standart',
      pressing: 'Orta',
      passingStyle: 'Kısa',
      defensiveLine: 'Standart',
      width: 'Dengeli',
    },
    lineup: starting11.map((s, idx) => ({
      slotId: idx,
      role: s.role,
      x: 50,
      y: idx === 0 ? 90 : idx <= 4 ? 70 : idx <= 7 ? 45 : 20,
      playerId: s.id,
    })),
    substitutes: bench.slice(0, 7),
    reserves: bench.slice(7),
  };
}
