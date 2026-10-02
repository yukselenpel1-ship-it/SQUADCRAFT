import { Player, ClubTactics } from '@/types/game';
import {
  MultiplayerRoom,
  RoomMember,
  DraftClub,
  DraftRules,
  DraftState,
  DraftPick,
  DraftFixture,
  DraftStanding,
  LeagueAwards,
  DEFAULT_DRAFT_RULES,
  PRESET_CLOSED_ALPHA_4,
  MultiplayerErrorCode,
  BotDifficulty,
  BotPersonality,
  LiveMatchweekState,
  DEFAULT_DRAFT_BUDGET,
  MIN_PLAYER_DRAFT_PRICE,
  PlayerSeasonStats,
  PastSeasonHistory,
} from './types';
import {
  generateRoomCode,
  generateInitialDraftOrder,
  initializeDraftState,
  getSnakeTurnMemberId,
  validateDraftPick,
  determineAutoPick,
  executeDraftPick,
  generateDraftLeagueFixtures,
  initializeDraftStandings,
  generateDefaultDraftTactics,
} from './draftEngine';
import { getCachedDraftPlayerPool, getCachedDraftPlayerPoolMap, calculatePlayerDraftValue } from './playerPool';
import { createDefaultBadgeConfig } from './badgeGenerator';
import { FICTIONAL_CLUB_PRESETS } from './clubValidation';
import { resolveMemberConnection, evaluateHostMigration } from './sessionManager';
import {
  simulateDraftFixture,
  updateDraftStandings,
  computeLeagueAwards,
  computeStandingsFromFixtures,
  computeSeasonPlayerStats,
  extractFixtureSeasonNumber,
} from './matchEngineIntegration';
import { generateBotProfile, chooseBotDraftPick, generateBotTactics, getBotPickDelayMs } from './botManager';
import { logMultiplayerAction, formatMultiplayerError } from './logger';
import { recordTelemetryEvent } from './telemetry';
import { getSupabaseClient, getIsSupabaseConfigured } from '@/lib/supabase/client';
import { SQUADCRAFT_VERSION } from '@/lib/version';

export interface RoomFullState {
  room: MultiplayerRoom;
  members: RoomMember[];
  clubs: DraftClub[];
  draftState?: DraftState;
  fixtures: DraftFixture[];
  standings: DraftStanding[];
  awards?: LeagueAwards;
  playerPool: Player[];
  seasonHistory?: PastSeasonHistory[];
  seasonPlayerStats?: Record<string, PlayerSeasonStats>;
}

export type HydrationStatus =
  | 'LOADING'
  | 'SUCCESS'
  | 'NOT_FOUND'
  | 'NOT_MEMBER'
  | 'UNAUTHORIZED'
  | 'ERROR'
  | 'TIMEOUT';

export interface HydratedRoomResult {
  status: HydrationStatus;
  state?: RoomFullState;
  currentMember?: RoomMember;
  currentClub?: DraftClub;
  isHost?: boolean;
  isMyTurn?: boolean;
  errorCode?: MultiplayerErrorCode;
  errorMessage?: string;
  diagnostics?: {
    roomFetched: boolean;
    memberFound: boolean;
    clubFound: boolean;
    poolCount: number;
    picksCount: number;
    expectedPicks?: number;
    squadCounts?: Record<string, number>;
    fixturesCount?: number;
    standingsCount?: number;
    currentMatchweek?: number;
    realtimeConnected: boolean;
    lastError?: string;
    stateVersion: number;
    roomStatus?: string;
    lastSuccessfulFetch?: string;
  };
}

// In-memory room store (mirrored to localStorage when in browser)
const memoryRooms: Record<string, RoomFullState> = {};
const roomCodeMap: Record<string, string> = {}; // code -> roomId
let isDraftPicksTableAvailable = true;

const DRAFT_LOCAL_STORAGE_PREFIX = 'squadcraft_draft_room_';
const RECENT_ROOMS_KEY = 'squadcraft_recent_draft_rooms';

/**
 * Safely executes background async Supabase tasks without unhandled rejections
 */
function safeDbRun(task: () => Promise<unknown>): void {
  try {
    task().catch((e) => {
      console.warn('Background Supabase sync warning:', e);
    });
  } catch (e) {
    console.warn('Background Supabase trigger warning:', e);
  }
}

/**
 * Reconstructs DraftState completely and deterministically from members, rules, and picks.
 */
export function reconstructDraftState(
  roomId: string,
  members: RoomMember[],
  rules: DraftRules,
  rawPicks: any[] = []
): DraftState | undefined {
  const activeManagers = members.filter((m) => !m.isSpectator);
  if (activeManagers.length === 0) return undefined;

  // Use draftOrder from rules if present, or deterministic order based on joinedAt / memberId
  const draftOrder: string[] =
    Array.isArray(rules.draftOrder) && rules.draftOrder.length === activeManagers.length
      ? rules.draftOrder
      : [...activeManagers].sort((a, b) => a.joinedAt.localeCompare(b.joinedAt)).map((m) => m.id);

  const initial = initializeDraftState(roomId, draftOrder, rules);
  if (!rawPicks || rawPicks.length === 0) {
    return initial;
  }

  const picks: DraftPick[] = rawPicks.map((p) => {
    const rawPrice = p.draftPrice ?? p.draft_price ?? p.purchase_price ?? p.price;
    let priceNum = rawPrice !== undefined && rawPrice !== null && !isNaN(Number(rawPrice)) ? Number(rawPrice) : undefined;
    const memberId = p.memberId || p.member_id || '';
    const clubId = p.clubId || p.club_id || '';
    const playerId = p.playerId || p.player_id || '';
    if ((priceNum === undefined || priceNum <= 0) && playerId) {
      const pl = getCachedDraftPlayerPoolMap().get(playerId);
      if (pl) {
        priceNum = pl.draftValue ?? calculatePlayerDraftValue(pl);
      }
    }
    const pickId = p.id || `pick-${roomId}-${p.global_pick_number || p.pick_index || Math.random().toString(36).substring(2, 7)}`;
    return {
      id: pickId,
      roomId: p.room_id || p.roomId || roomId,
      round: p.round ?? p.round_number ?? 1,
      pickIndexInRound: p.pick_index_in_round ?? p.pickIndexInRound ?? p.pick_index ?? 0,
      globalPickNumber: p.global_pick_number ?? p.globalPickNumber ?? p.pick_index ?? 0,
      memberId,
      member_id: memberId,
      clubId,
      club_id: clubId,
      playerId,
      player_id: playerId,
      selectedAt: p.selected_at || p.selectedAt || new Date().toISOString(),
      isAutoPick: Boolean(p.is_auto_pick ?? p.isAutoPick),
      timeTakenSeconds: p.time_taken_seconds ?? p.timeTakenSeconds ?? 0,
      draftPrice: priceNum,
      purchase_price: priceNum,
    };
  });

  const totalManagers = draftOrder.length;
  const totalPicksRequired = (rules.squadSize || 18) * totalManagers;
  const currentPickCount = picks.length;

  if (currentPickCount >= totalPicksRequired) {
    return {
      ...initial,
      picks,
      currentRound: rules.squadSize || 18,
      currentPickIndex: totalManagers - 1,
      currentTurnMemberId: '',
      pickDeadline: 0,
      isCompleted: true,
    };
  }

  const currentRound = Math.floor(currentPickCount / totalManagers) + 1;
  const pickIndexInRound = currentPickCount % totalManagers;
  const currentTurnMemberId = getSnakeTurnMemberId(draftOrder, currentRound, pickIndexInRound);

  const lastPick = picks[picks.length - 1];
  const lastPickTime = lastPick ? new Date(lastPick.selectedAt).getTime() : Date.now();
  const durationMs = rules.pickTimerSeconds > 0 ? rules.pickTimerSeconds * 1000 : 0;
  const pickDeadline = durationMs > 0 ? lastPickTime + durationMs : Number.MAX_SAFE_INTEGER;

  return {
    roomId,
    currentRound,
    currentPickIndex: pickIndexInRound,
    currentTurnMemberId,
    currentTurnStartTime: lastPickTime,
    pickDeadline,
    draftOrder,
    isPaused: false,
    isCompleted: false,
    picks,
  };
}

/**
 * Maps database row to MultiplayerRoom
 */
function mapDbRoom(r: any): MultiplayerRoom {
  const rules = r.rules || DEFAULT_DRAFT_RULES;
  return {
    id: r.id,
    roomCode: r.room_code,
    name: r.name,
    hostMemberId: r.host_member_id,
    status: r.status,
    rules: rules,
    stateVersion: rules.stateVersion || r.state_version || 1,
    seasonNumber: rules.seasonNumber || r.season_number || 1,
    seasonHistory: rules.seasonHistory || undefined,
    seasonPlayerStats: rules.seasonPlayerStats || undefined,
    currentMatchweek: rules.currentMatchweek || r.current_matchweek || 1,
    totalMatchweeks: rules.totalMatchweeks || r.total_matchweeks || undefined,
    leaguePhase: rules.leaguePhase || r.league_phase || undefined,
    liveMatchweek: rules.liveMatchweek || undefined,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
  };
}

/**
 * Maps database row to RoomMember
 */
function mapDbMember(m: any, rules?: DraftRules): RoomMember {
  const isBot = Boolean(m.is_bot || m.session_id?.startsWith('bot-session') || m.id?.includes('bot'));
  
  let parsedDifficulty: BotDifficulty | undefined = undefined;
  let parsedPersonality: BotPersonality | undefined = undefined;

  // 1. Authoritative lookup from rules.botConfigs JSONB
  if (rules?.botConfigs?.[m.id]) {
    parsedDifficulty = rules.botConfigs[m.id].difficulty;
    parsedPersonality = rules.botConfigs[m.id].personality;
  }

  // 2. Decode from persistent session_id (e.g. bot-session-KOLAY-Hücumcu-mem-...)
  if (!parsedDifficulty && typeof m.session_id === 'string' && m.session_id.startsWith('bot-session-')) {
    const afterPrefix = m.session_id.substring('bot-session-'.length);
    const parts = afterPrefix.split('-');
    if (parts[0] === 'KOLAY' || parts[0] === 'ORTA' || parts[0] === 'ZOR') {
      parsedDifficulty = parts[0] as BotDifficulty;
      if (parts[1] && ['Kontrollü', 'Hücumcu', 'Kontratakçı', 'Presçi', 'Dengeli'].includes(parts[1])) {
        parsedPersonality = parts[1] as BotPersonality;
      }
    }
  }

  // 3. Fallback to DB fields if provided
  if (!parsedDifficulty && m.bot_difficulty) {
    parsedDifficulty = m.bot_difficulty;
  }
  if (!parsedPersonality && m.bot_personality) {
    parsedPersonality = m.bot_personality;
  }

  return {
    id: m.id,
    roomId: m.room_id,
    sessionId: m.session_id,
    username: m.username,
    isHost: Boolean(m.is_host),
    isSpectator: Boolean(m.is_spectator),
    isReady: Boolean(m.is_ready),
    isBot,
    botDifficulty: isBot ? (parsedDifficulty || 'ORTA') : undefined,
    botPersonality: isBot ? (parsedPersonality || 'Dengeli') : undefined,
    clubId: m.club_id || undefined,
    isConnected: Boolean(m.is_connected),
    lastSeenAt: m.last_seen_at || new Date().toISOString(),
    joinedAt: m.joined_at || new Date().toISOString(),
  };
}

/**
 * Authoritatively calculates and reconciles clubs' budget & spentBudget from confirmed picks.
 * Guarantees budget never resets to €250M on refresh, reconnect, state update, or bot turn.
 * Canonical Rule: remainingBudget = roomConfiguredInitialBudget - SUM(confirmed draft pick prices for this club)
 */
export function reconcileClubsBudget(
  clubs: DraftClub[],
  rules: DraftRules,
  picks: DraftPick[] = [],
  playerPool: Player[] = [],
  roomCode: string = '',
  event: string = 'RECONCILE'
): DraftClub[] {
  const initialBudget = rules?.draftBudget || DEFAULT_DRAFT_BUDGET;
  const pool = playerPool.length > 0 ? playerPool : getCachedDraftPlayerPool();
  const playerMap = new Map(pool.map((p) => [p.id, p]));

  return clubs.map((c) => {
    // 1. Gather all matching picks (supporting snake_case, camelCase, club id, club code, and member session)
    const matchingPicks = picks.filter((p) => {
      const pClubId = p.clubId || (p as any).club_id;
      const pMemberId = p.memberId || (p as any).member_id;
      return (
        (pClubId && (pClubId === c.id || pClubId === c.code)) ||
        (pMemberId && (pMemberId === c.memberId || pMemberId === c.id))
      );
    });

    const pickPlayerIds = matchingPicks.map((p) => p.playerId || (p as any).player_id).filter(Boolean);
    const existingSquadIds = (c.squadPlayerIds || []).filter(Boolean);

    // 2. Canonical squad list is union of picks and existing squad
    const allPlayerIds = Array.from(new Set([...existingSquadIds, ...pickPlayerIds]));

    // 3. Compute canonical spent amount across all confirmed players
    let spent = 0;
    for (const pid of allPlayerIds) {
      const matchingPick = matchingPicks.find((p) => (p.playerId || (p as any).player_id) === pid);
      if (matchingPick && matchingPick.draftPrice !== undefined && matchingPick.draftPrice !== null && matchingPick.draftPrice > 0) {
        spent += Number(matchingPick.draftPrice);
      } else {
        const pl = playerMap.get(pid);
        const val = pl?.draftValue ?? (pl ? calculatePlayerDraftValue(pl) : MIN_PLAYER_DRAFT_PRICE);
        spent += val;
      }
    }

    // Never decrease recorded spend if squad or club already registered spend
    if (c.spentBudget && Number(c.spentBudget) > spent) {
      spent = Number(c.spentBudget);
    }
    // If club had already spent budget registered via previous remaining budget, guarantee it never resets to initialBudget
    if (spent === 0 && c.budget !== undefined && c.budget < initialBudget) {
      spent = initialBudget - c.budget;
    }

    // Canonical calculation: strictly initialBudget - confirmedSpend
    const canonicalBudget = Math.max(0, initialBudget - spent);
    const previousRemaining = c.budget ?? initialBudget;

    // Visible Audit Logger with all required telemetry fields
    console.log('[BUDGET_AUDIT]', {
      event,
      roomCode: roomCode || c.roomId || '',
      clubId: c.id,
      source: 'reconcileClubsBudget',
      initialBudget,
      confirmedSpend: spent,
      previousRemaining,
      calculatedRemaining: canonicalBudget,
      newRemaining: canonicalBudget,
      pickCount: allPlayerIds.length,
      timestamp: new Date().toISOString(),
    });

    return {
      ...c,
      budget: canonicalBudget,
      spentBudget: spent,
      squadPlayerIds: allPlayerIds,
    };
  });
}

/**
 * Maps database row to DraftClub
 */
function mapDbClub(c: any, defaultBudget: number = DEFAULT_DRAFT_BUDGET): DraftClub {
  const spent = c.spent_budget != null ? Number(c.spent_budget) : 0;
  const remaining = c.budget != null ? Number(c.budget) : Math.max(0, defaultBudget - spent);
  return {
    id: c.id,
    roomId: c.room_id,
    memberId: c.member_id,
    name: c.name,
    code: c.code,
    managerName: c.manager_name,
    primaryColor: c.primary_color,
    secondaryColor: c.secondary_color,
    badge: c.badge || {},
    squadPlayerIds: c.squad_player_ids || [],
    budget: remaining,
    spentBudget: spent,
  };
}

/**
 * Maps database row to DraftFixture
 */
function mapDbFixture(f: any): DraftFixture {
  const seasonNumber = extractFixtureSeasonNumber(f);
  return {
    id: f.id,
    roomId: f.room_id,
    seasonNumber,
    round: f.round,
    homeClubId: f.home_club_id,
    awayClubId: f.away_club_id,
    status: f.status,
    homeTactics: f.home_tactics || undefined,
    awayTactics: f.away_tactics || undefined,
    homeScore: f.home_score != null ? f.home_score : undefined,
    awayScore: f.away_score != null ? f.away_score : undefined,
    matchResult: f.match_result || undefined,
    seed: f.seed || undefined,
    simulatedAt: f.simulated_at || undefined,
  };
}

/**
 * Maps database row to DraftStanding
 */
function mapDbStanding(s: any, clubs: DraftClub[]): DraftStanding {
  const club = clubs.find((c) => c.id === s.club_id);
  return {
    rank: s.rank,
    clubId: s.club_id,
    clubName: club?.name || 'Kulüp',
    clubCode: club?.code || 'KLP',
    played: s.played || 0,
    won: s.won || 0,
    drawn: s.drawn || 0,
    lost: s.lost || 0,
    goalsFor: s.goals_for || 0,
    goalsAgainst: s.goals_against || 0,
    goalDifference: s.goal_difference || 0,
    points: s.points || 0,
    form: s.form || [],
  };
}

/**
 * Broadcasts room state update to Supabase Realtime channel
 */
function broadcastRealtimeUpdate(roomCode: string, action: string, stateVersion: number): void {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  safeDbRun(async () => {
    const channel = supabase.channel(`squadcraft_room_${roomCode.toUpperCase()}`);
    await channel.send({
      type: 'broadcast',
      event: 'ROOM_UPDATE',
      payload: { action, stateVersion, timestamp: Date.now() },
    });
    if (action === 'START_DRAFT') {
      await channel.send({
        type: 'broadcast',
        event: 'START_DRAFT',
        payload: { action, stateVersion, timestamp: Date.now() },
      });
    } else if (action === 'CLOSE_ROOM') {
      await channel.send({
        type: 'broadcast',
        event: 'ROOM_CLOSED',
        payload: { action, stateVersion, timestamp: Date.now() },
      });
    }
  });
}

/**
 * Saves room state to local storage for offline resilience & persistence.
 */
function persistRoomLocal(state: RoomFullState): void {
  if (typeof window === 'undefined') return;
  try {
    const serialized = JSON.stringify({
      ...state,
      // Do not store the large player pool in local storage
      playerPool: [],
    });
    localStorage.setItem(`${DRAFT_LOCAL_STORAGE_PREFIX}${state.room.id}`, serialized);

    // Update recent room codes
    const recent = getRecentRoomCodes();
    if (!recent.includes(state.room.roomCode)) {
      localStorage.setItem(
        RECENT_ROOMS_KEY,
        JSON.stringify([state.room.roomCode, ...recent].slice(0, 10))
      );
    }
  } catch (e) {
    console.warn('Draft local storage persist warning:', e);
  }
}

/**
 * Loads room from local storage if not in memory.
 */
function loadRoomLocal(roomIdOrCode: string): RoomFullState | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try by ID first
    const item = localStorage.getItem(`${DRAFT_LOCAL_STORAGE_PREFIX}${roomIdOrCode}`);
    if (item) {
      const parsed = JSON.parse(item) as RoomFullState;
      parsed.playerPool = getCachedDraftPlayerPool();
      if (parsed.clubs && parsed.room) {
        parsed.clubs = reconcileClubsBudget(parsed.clubs, parsed.room.rules, parsed.draftState?.picks || [], parsed.playerPool);
      }
      memoryRooms[parsed.room.id] = parsed;
      roomCodeMap[parsed.room.roomCode.toUpperCase()] = parsed.room.id;
      return parsed;
    }

    // Try scanning for roomCode
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(DRAFT_LOCAL_STORAGE_PREFIX)) {
        const val = localStorage.getItem(key);
        if (val) {
          const parsed = JSON.parse(val) as RoomFullState;
          if (parsed.room?.roomCode?.toUpperCase() === roomIdOrCode.toUpperCase()) {
            parsed.playerPool = getCachedDraftPlayerPool();
            if (parsed.clubs && parsed.room) {
              parsed.clubs = reconcileClubsBudget(parsed.clubs, parsed.room.rules, parsed.draftState?.picks || [], parsed.playerPool);
            }
            memoryRooms[parsed.room.id] = parsed;
            roomCodeMap[parsed.room.roomCode.toUpperCase()] = parsed.room.id;
            return parsed;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Draft local storage load error:', e);
  }
  return null;
}

export function getRecentRoomCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_ROOMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Classifies whether an error is a transient network/connection failure that should be retried,
 * vs a permanent database error (e.g. RLS denied, schema/column error, constraint violation) that should not be retried.
 */
export function isTransientNetworkError(err: any): boolean {
  if (!err) return false;
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return true;

  const msg = (err.message || err.details || err.error_description || String(err)).toLowerCase();
  const code = String(err.code || '');

  // Permanent database errors (NEVER retry these)
  if (
    code === '42501' || // RLS / permission denied
    code === '23505' || // Unique violation
    code === '23503' || // Foreign key violation
    code === '23502' || // Not null violation
    code === '22P02' || // Invalid text representation
    code === '42703' || // Undefined column
    code === '42P01' || // Undefined table
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('violates foreign key') ||
    msg.includes('duplicate key value') ||
    msg.includes('violates not-null') ||
    msg.includes('violates check constraint')
  ) {
    return false;
  }

  // Network / fetch / connectivity errors (safe to retry)
  if (
    err instanceof TypeError ||
    msg.includes('failed to fetch') ||
    msg.includes('network error') ||
    msg.includes('networkrequestfailed') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('net::err_') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('bad gateway') ||
    msg.includes('service unavailable') ||
    msg.includes('gateway timeout') ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504 ||
    err.status === 408
  ) {
    return true;
  }

  return false;
}

/**
 * Wraps an async operation with a strict timeout to prevent indefinite network hanging.
 */
export async function withTimeout<T = any>(
  promiseFactory: () => PromiseLike<T> | Promise<T>,
  timeoutMs: number = 8500,
  operationName: string = 'İşlem'
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${operationName} zaman aşımına uğradı (${timeoutMs}ms)`);
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  try {
    const mainPromise = Promise.resolve(promiseFactory());
    mainPromise.catch(() => {});
    const result = await Promise.race([mainPromise, timeoutPromise]);
    return result as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

let isConnectionWarmingUp = false;
let isConnectionWarmedUp = false;

/**
 * Performs a lightweight connectivity check / ping to Supabase to warm up DNS,
 * TLS handshake, and keep-alive HTTP socket before critical room operations.
 */
export async function warmupSupabaseConnection(): Promise<boolean> {
  if (isConnectionWarmedUp) return true;
  if (isConnectionWarmingUp) return false;
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  isConnectionWarmingUp = true;
  let timer: NodeJS.Timeout | undefined;
  try {
    const warmupPromise = Promise.resolve(supabase.from('multiplayer_rooms').select('id').limit(1))
      .then(() => true)
      .catch(() => false);
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timer = setTimeout(() => resolve(false), 3000);
    });
    const result = await Promise.race([warmupPromise, timeoutPromise]);
    if (result) {
      isConnectionWarmedUp = true;
    }
    return result;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
    isConnectionWarmingUp = false;
  }
}

export class DraftMultiplayerStore {
  private static finalizingRooms = new Map<string, Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }>>();
  private static repairingRooms = new Map<string, Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }>>();
  // A room can be requested by polling, focus, and Realtime at the same time.  Keep
  // one authoritative read in flight per room so an older response cannot overwrite
  // a newer hydration result and so Realtime does not amplify into request storms.
  private static roomFetchesInFlight = new Map<string, Promise<RoomFullState | null>>();
  private static isCreatingRoomInProgress = false;

  /**
   * Warm up connection static helper
   */
  public static async warmupConnection(): Promise<boolean> {
    return warmupSupabaseConnection();
  }

  /**
   * Safely checks and cleans up stale orphan rooms (older than 15 mins with 0 members and 0 clubs in LOBBY status)
   */
  public static async cleanupStaleOrphanRooms(): Promise<{ cleanedCount: number; orphanIds: string[] }> {
    const supabase = getSupabaseClient();
    if (!supabase) return { cleanedCount: 0, orphanIds: [] };

    try {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: staleRooms, error } = await supabase
        .from('multiplayer_rooms')
        .select('id, status, created_at, multiplayer_members(id), draft_clubs(id)')
        .eq('status', 'LOBBY')
        .lt('created_at', fifteenMinsAgo)
        .limit(20);

      if (error || !staleRooms) return { cleanedCount: 0, orphanIds: [] };

      const orphanIds: string[] = [];
      for (const r of staleRooms) {
        const memCount = (r as any).multiplayer_members?.length || 0;
        const clubCount = (r as any).draft_clubs?.length || 0;
        if (memCount === 0 && clubCount === 0) {
          orphanIds.push(r.id);
        }
      }

      for (const id of orphanIds) {
        await supabase.from('multiplayer_rooms').delete().eq('id', id);
      }

      return { cleanedCount: orphanIds.length, orphanIds };
    } catch (err) {
      console.error('[DraftMultiplayerStore] Orphan cleanup error:', err);
      return { cleanedCount: 0, orphanIds: [] };
    }
  }

  /**
   * Checks whether the Supabase multiplayer backend is configured and responsive.
   */
  public static isServerConnected(): boolean {
    return getIsSupabaseConfigured() && Boolean(getSupabaseClient());
  }

  /**
   * Subscribes to real-time room events (Supabase Broadcast + Postgres Changes).
   * Scoped strictly by room_code for multiplayer_rooms and room_id for child tables.
   */
  public static subscribeToRoom(
    roomCode: string,
    onUpdate: (event: { type: string; payload?: any }) => void,
    knownRoomId?: string
  ): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const cleanCode = roomCode.trim().toUpperCase();
    let currentRoomId =
      knownRoomId ||
      roomCodeMap[cleanCode] ||
      memoryRooms[cleanCode]?.room?.id;

    if (!currentRoomId) {
      const local = loadRoomLocal(cleanCode);
      if (local?.room?.id) currentRoomId = local.room.id;
    }

    const mainChannelName = `squadcraft_room_${cleanCode}`;
    const mainChannel = supabase.channel(mainChannelName);
    let childChannel: any = null;

    const setupChildSubscriptions = (rId: string) => {
      if (childChannel || !rId) return;
      currentRoomId = rId;
      const childChannelName = `squadcraft_room_child_${rId}`;
      childChannel = supabase.channel(childChannelName);
      childChannel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'multiplayer_members', filter: `room_id=eq.${rId}` },
          (payload: any) => {
            console.log(`REALTIME_EVENT multiplayer_members ${rId}`);
            onUpdate({ type: 'PG_MEMBER', payload });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'draft_clubs', filter: `room_id=eq.${rId}` },
          (payload: any) => {
            console.log(`REALTIME_EVENT draft_clubs ${rId}`);
            onUpdate({ type: 'PG_CLUB', payload });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'draft_picks', filter: `room_id=eq.${rId}` },
          (payload: any) => {
            console.log(`REALTIME_EVENT draft_picks ${rId}`);
            onUpdate({ type: 'PG_PICK', payload });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'draft_fixtures', filter: `room_id=eq.${rId}` },
          (payload: any) => {
            console.log(`REALTIME_EVENT draft_fixtures ${rId}`);
            onUpdate({ type: 'PG_FIXTURE', payload });
          }
        )
        .subscribe();
    };

    mainChannel
      .on('broadcast', { event: 'ROOM_UPDATE' }, (payload) => {
        onUpdate({ type: 'BROADCAST_ROOM_UPDATE', payload });
      })
      .on('broadcast', { event: 'START_DRAFT' }, (payload) => {
        onUpdate({ type: 'BROADCAST_START_DRAFT', payload });
      })
      .on('broadcast', { event: 'ROOM_CLOSED' }, (payload) => {
        onUpdate({ type: 'BROADCAST_ROOM_CLOSED', payload });
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_rooms', filter: `room_code=eq.${cleanCode}` },
        (payload) => {
          console.log(`REALTIME_EVENT multiplayer_rooms ${cleanCode}`);
          if (payload?.new && (payload.new as any).id) {
            const newRoomId = (payload.new as any).id;
            roomCodeMap[cleanCode] = newRoomId;
            if (!currentRoomId) {
              setupChildSubscriptions(newRoomId);
            }
          }
          onUpdate({ type: 'PG_ROOM', payload });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to realtime
        }
      });

    if (currentRoomId) {
      setupChildSubscriptions(currentRoomId);
    }

    const cleanup = () => {
      try {
        supabase.removeChannel(mainChannel);
        if (childChannel) {
          supabase.removeChannel(childChannel);
        }
      } catch (e) {
        console.warn('Realtime channel remove warning:', e);
      }
    };

    (cleanup as any).setRoomId = (id: string) => {
      if (id && !currentRoomId) {
        setupChildSubscriptions(id);
      }
    };

    return cleanup;
  }

  /**
   * One canonical hydration function for all room pages (READ-ONLY).
   */
  public static async hydrateDraftRoom(
    roomCodeOrId: string,
    sessionId: string
  ): Promise<HydratedRoomResult> {
    const raw = roomCodeOrId.trim();
    const upper = raw.toUpperCase();

    try {
      let state = await this.fetchRoom(upper);
      const pool = getCachedDraftPlayerPool();

      if (!state) {
        return {
          status: 'NOT_FOUND',
          errorCode: 'SC-MP-001',
          errorMessage: 'Oda bulunamadı veya süresi doldu.',
          diagnostics: {
            roomFetched: false,
            memberFound: false,
            clubFound: false,
            poolCount: pool.length,
            picksCount: 0,
            realtimeConnected: this.isServerConnected(),
            stateVersion: 0,
            lastSuccessfulFetch: new Date().toISOString(),
          },
        };
      }

      // Authoritatively reconcile and lock club budgets from canonical picks & room rules
      state.clubs = reconcileClubsBudget(
        state.clubs,
        state.room.rules,
        state.draftState?.picks || [],
        pool,
        state.room.roomCode,
        'HYDRATE_ROOM'
      );

      // READ-ONLY: If fixtures or standings exist in room.rules but not top-level, populate without mutating DB
      if (state.fixtures.length === 0 && Array.isArray(state.room.rules?.fixtures) && state.room.rules.fixtures.length > 0) {
        state.fixtures = state.room.rules.fixtures;
      }
      if (state.standings.length === 0 && Array.isArray(state.room.rules?.standings) && state.room.rules.standings.length > 0) {
        state.standings = state.room.rules.standings;
      }

      const totalPicksRequired = (state.room.rules.squadSize || 18) * state.members.filter((m) => !m.isSpectator).length;

      const currentMember = state.members.find((m) => m.sessionId === sessionId);
      const currentClub = currentMember ? state.clubs.find((c) => c.memberId === currentMember.id) : undefined;
      const isHost = currentMember?.isHost || false;

      // If drafting, ensure draftState is guaranteed non-null with all known picks
      if ((state.room.status === 'DRAFTING' || Boolean(state.room.rules?.confirmedPicks?.length)) && !state.draftState) {
        const local = loadRoomLocal(state.room.id) || loadRoomLocal(state.room.roomCode);
        const memPicks = memoryRooms[state.room.id]?.draftState?.picks;
        const confirmedPicks = memPicks || local?.draftState?.picks || (Array.isArray(state.room.rules?.confirmedPicks) ? state.room.rules.confirmedPicks : []);
        state.draftState = reconstructDraftState(state.room.id, state.members, state.room.rules, confirmedPicks);
      }

      const isMyTurn = Boolean(
        currentMember && state.draftState && state.draftState.currentTurnMemberId === currentMember.id
      );

      const squadCounts: Record<string, number> = {};
      state.clubs.forEach((c) => {
        squadCounts[c.name] = c.squadPlayerIds.length;
      });

      const diagnostics = {
        roomFetched: true,
        memberFound: Boolean(currentMember),
        clubFound: Boolean(currentClub),
        poolCount: state.playerPool?.length || pool.length,
        picksCount: state.draftState?.picks.length || 0,
        expectedPicks: totalPicksRequired,
        squadCounts,
        fixturesCount: state.fixtures.length,
        standingsCount: state.standings.length,
        currentMatchweek: state.room.currentMatchweek || 1,
        realtimeConnected: this.isServerConnected(),
        stateVersion: state.room.stateVersion || 1,
        roomStatus: state.room.status,
        lastSuccessfulFetch: new Date().toISOString(),
      };

      if (!currentMember) {
        return {
          status: 'NOT_MEMBER',
          state,
          errorCode: 'SC-MP-002',
          errorMessage: 'Bu odanın henüz bir üyesi değilsiniz.',
          diagnostics,
        };
      }

      return {
        status: 'SUCCESS',
        state,
        currentMember,
        currentClub,
        isHost,
        isMyTurn,
        diagnostics,
      };
    } catch (err: any) {
      console.error('hydrateDraftRoom error:', err);
      return {
        status: 'ERROR',
        errorCode: 'SC-MP-010',
        errorMessage: err?.message || 'Oda yüklenirken bir hata oluştu.',
        diagnostics: {
          roomFetched: false,
          memberFound: false,
          clubFound: false,
          poolCount: getCachedDraftPlayerPool().length,
          picksCount: 0,
          realtimeConnected: this.isServerConnected(),
          lastError: err?.message,
          stateVersion: 0,
          lastSuccessfulFetch: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Creates a new multiplayer Draft League room asynchronously with Supabase persistence,
   * single-ID idempotency, existence verification, transient network retries (max 3),
   * timeout guards, and partial state rollback fallback.
   */
  public static async createRoomAsync(
    hostUsername: string,
    sessionId: string,
    rules: DraftRules = PRESET_CLOSED_ALPHA_4,
    roomName?: string,
    onProgress?: (attempt: number, maxAttempts: number, statusText: string) => void,
    existingState?: RoomFullState
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode; details?: string }> {
    // 1. In-flight creation lock (Hard single-flight guard)
    if (DraftMultiplayerStore.isCreatingRoomInProgress) {
      return {
        success: false,
        error: 'Şu anda bir oda oluşturma işlemi devam ediyor. Lütfen bekleyin.',
        errorCode: 'SC-MP-011',
      };
    }
    DraftMultiplayerStore.isCreatingRoomInProgress = true;

    try {
      // 2. Generate IDs ONCE before retry loop (Guarantees idempotency across retries)
      const roomId = existingState?.room.id || `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      let roomCode = existingState?.room.roomCode || generateRoomCode();

      const memberId = existingState?.members[0]?.id || `mem-${roomId}-host`;
      const clubId = existingState?.clubs[0]?.id || `club-${roomId}-host`;

      const randomPreset = FICTIONAL_CLUB_PRESETS[Math.floor(Math.random() * FICTIONAL_CLUB_PRESETS.length)];

      const hostClub: DraftClub = existingState?.clubs[0] || {
        id: clubId,
        roomId,
        memberId,
        name: `${hostUsername || 'Doruk'} SK`,
        code: (hostUsername || 'DSK').slice(0, 3).toUpperCase(),
        managerName: hostUsername || 'Menajer',
        primaryColor: randomPreset.primaryColor,
        secondaryColor: randomPreset.secondaryColor,
        badge: createDefaultBadgeConfig(randomPreset.primaryColor, randomPreset.secondaryColor),
        squadPlayerIds: [],
        budget: rules.draftBudget || DEFAULT_DRAFT_BUDGET,
        spentBudget: 0,
      };

      const hostMember: RoomMember = existingState?.members[0] || {
        id: memberId,
        roomId,
        sessionId,
        username: hostUsername || 'Oda Kurucusu',
        isHost: true,
        isSpectator: false,
        isReady: true,
        clubId,
        isConnected: true,
        lastSeenAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
      };

      const room: MultiplayerRoom = existingState?.room || {
        id: roomId,
        roomCode,
        name: roomName || `${hostUsername} Draft Ligi`,
        hostMemberId: memberId,
        status: 'LOBBY',
        rules,
        stateVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const state: RoomFullState = existingState || {
        room,
        members: [hostMember],
        clubs: [hostClub],
        fixtures: [],
        standings: [],
        playerPool: getCachedDraftPlayerPool(),
      };

    const supabase = getSupabaseClient();
    if (supabase) {
      const MAX_ATTEMPTS = 3;
      let lastError: any = null;
      let roomCreatedOnServer = false;
      let memberCreatedOnServer = false;
      let clubCreatedOnServer = false;

      try {
        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          try {
            if (attempt > 1 && onProgress) {
              onProgress(attempt, MAX_ATTEMPTS, `Sunucuya bağlanılıyor... (${attempt}/${MAX_ATTEMPTS})`);
            }

            // --- STEP A: Verify / Insert Room ---
            if (!roomCreatedOnServer) {
              const { data: existingRoom, error: checkRoomErr } = await withTimeout(
                () => supabase.from('multiplayer_rooms').select('id, room_code').eq('id', roomId).maybeSingle(),
                6000,
                'Oda kontrolü'
              );

              if (existingRoom && existingRoom.id) {
                roomCreatedOnServer = true;
              } else {
                if (checkRoomErr && isTransientNetworkError(checkRoomErr)) {
                  throw checkRoomErr;
                }

                const { error: roomErr } = await withTimeout(
                  () => supabase.from('multiplayer_rooms').insert({
                    id: roomId,
                    room_code: roomCode,
                    name: room.name,
                    host_member_id: memberId,
                    status: 'LOBBY',
                    rules: rules,
                    created_at: room.createdAt,
                    updated_at: room.updatedAt,
                  }),
                  8500,
                  'Oda kaydı'
                );

                if (roomErr) {
                  if (isTransientNetworkError(roomErr)) {
                    throw roomErr;
                  }
                  console.error('Permanent room insert error:', roomErr);
                  lastError = roomErr;
                  break;
                }
                roomCreatedOnServer = true;
              }
            }

            // --- STEP B: Verify / Insert Host Member ---
            if (!memberCreatedOnServer) {
              const { data: existingMember, error: checkMemErr } = await withTimeout(
                () => supabase.from('multiplayer_members').select('id').eq('id', memberId).maybeSingle(),
                6000,
                'Üye kontrolü'
              );

              if (existingMember && existingMember.id) {
                memberCreatedOnServer = true;
              } else {
                if (checkMemErr && isTransientNetworkError(checkMemErr)) {
                  throw checkMemErr;
                }

                const { error: memErr } = await withTimeout(
                  () => supabase.from('multiplayer_members').insert({
                    id: memberId,
                    room_id: roomId,
                    session_id: sessionId,
                    username: hostMember.username,
                    is_host: true,
                    is_spectator: false,
                    is_ready: true,
                    club_id: clubId,
                    is_connected: true,
                    last_seen_at: hostMember.lastSeenAt,
                    joined_at: hostMember.joinedAt,
                  }),
                  8500,
                  'Üye kaydı'
                );

                if (memErr) {
                  if (isTransientNetworkError(memErr)) {
                    throw memErr;
                  }
                  console.error('Permanent member insert error:', memErr);
                  lastError = memErr;
                  break;
                }
                memberCreatedOnServer = true;
              }
            }

            // --- STEP C: Verify / Insert Host Club ---
            if (!clubCreatedOnServer) {
              const { data: existingClub, error: checkClubErr } = await withTimeout(
                () => supabase.from('draft_clubs').select('id').eq('id', clubId).maybeSingle(),
                6000,
                'Kulüp kontrolü'
              );

              if (existingClub && existingClub.id) {
                clubCreatedOnServer = true;
              } else {
                if (checkClubErr && isTransientNetworkError(checkClubErr)) {
                  throw checkClubErr;
                }

                const { error: clubErr } = await withTimeout(
                  () => supabase.from('draft_clubs').insert({
                    id: clubId,
                    room_id: roomId,
                    member_id: memberId,
                    name: hostClub.name,
                    code: hostClub.code,
                    manager_name: hostClub.managerName,
                    primary_color: hostClub.primaryColor,
                    secondary_color: hostClub.secondaryColor,
                    badge: hostClub.badge,
                    squad_player_ids: [],
                  }),
                  8500,
                  'Kulüp kaydı'
                );

                if (clubErr) {
                  if (isTransientNetworkError(clubErr)) {
                    throw clubErr;
                  }
                  console.error('Permanent club insert error:', clubErr);
                  lastError = clubErr;
                  break;
                }
                clubCreatedOnServer = true;
              }
            }

            // If all 3 steps succeeded on server, exit retry loop
            if (roomCreatedOnServer && memberCreatedOnServer && clubCreatedOnServer) {
              lastError = null;
              break;
            }
          } catch (attemptErr: any) {
            lastError = attemptErr;
            console.warn(`[DraftMultiplayerStore] Room create attempt ${attempt}/${MAX_ATTEMPTS} transient failure:`, attemptErr?.message || attemptErr);

            if (attempt < MAX_ATTEMPTS) {
              const backoffMs = attempt === 1 ? 300 : 700;
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
            }
          }
        }

        // If incomplete after all attempts or permanent error: execute client-side rollback
        if (!roomCreatedOnServer || !memberCreatedOnServer || !clubCreatedOnServer) {
          console.warn(`[DraftMultiplayerStore] Room creation failed or incomplete. Rolling back partial state for roomId: ${roomId}...`);
          try {
            if (clubCreatedOnServer) {
              await supabase.from('draft_clubs').delete().eq('id', clubId).eq('room_id', roomId);
            }
            if (memberCreatedOnServer) {
              await supabase.from('multiplayer_members').delete().eq('id', memberId).eq('room_id', roomId);
            }
            if (roomCreatedOnServer) {
              await supabase.from('multiplayer_rooms').delete().eq('id', roomId);
            }
          } catch (rollbackErr) {
            console.error('[DraftMultiplayerStore] Rollback error:', rollbackErr);
          }

          DraftMultiplayerStore.isCreatingRoomInProgress = false;

          const isNetworkFailure = isTransientNetworkError(lastError);
          return {
            success: false,
            error: isNetworkFailure
              ? 'Oda oluşturulamadı. Bağlantı kısa süreli kesildi. Tekrar deneyin.'
              : 'Oda oluşturulurken veritabanı hatası oluştu.',
            errorCode: 'SC-MP-011',
            details: lastError?.message || lastError?.details || 'Bağlantı hatası',
          };
        }
      } catch (err: any) {
        console.error('Unexpected error during room creation:', err);
        return {
          success: false,
          error: isTransientNetworkError(err)
            ? 'Oda oluşturulamadı. Bağlantı kısa süreli kesildi. Tekrar deneyin.'
            : 'Veritabanı bağlantı hatası.',
          errorCode: 'SC-MP-011',
          details: err?.message || 'Bilinmeyen hata',
        };
      }
    }

    // Cache in memory and local storage
    memoryRooms[roomId] = state;
    roomCodeMap[roomCode.toUpperCase()] = roomId;
    persistRoomLocal(state);

    logMultiplayerAction('JOIN_ROOM', roomId, sessionId, 0, 1, true, undefined, {
      role: 'HOST',
      username: hostUsername,
      roomCode,
    });

    return { success: true, state };
  } finally {
    DraftMultiplayerStore.isCreatingRoomInProgress = false;
  }
}

  /**
   * Synchronous createRoom wrapper for compatibility.
   */
  public static createRoom(
    hostUsername: string,
    sessionId: string,
    rules: DraftRules = PRESET_CLOSED_ALPHA_4,
    roomName?: string
  ): RoomFullState {
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let roomCode = generateRoomCode();

    const memberId = `mem-${roomId}-host`;
    const clubId = `club-${roomId}-host`;

    const randomPreset = FICTIONAL_CLUB_PRESETS[Math.floor(Math.random() * FICTIONAL_CLUB_PRESETS.length)];

    const hostClub: DraftClub = {
      id: clubId,
      roomId,
      memberId,
      name: `${hostUsername || 'Doruk'} SK`,
      code: (hostUsername || 'DSK').slice(0, 3).toUpperCase(),
      managerName: hostUsername || 'Menajer',
      primaryColor: randomPreset.primaryColor,
      secondaryColor: randomPreset.secondaryColor,
      badge: createDefaultBadgeConfig(randomPreset.primaryColor, randomPreset.secondaryColor),
      squadPlayerIds: [],
      budget: rules.draftBudget || DEFAULT_DRAFT_BUDGET,
      spentBudget: 0,
    };

    const hostMember: RoomMember = {
      id: memberId,
      roomId,
      sessionId,
      username: hostUsername || 'Oda Kurucusu',
      isHost: true,
      isSpectator: false,
      isReady: true,
      clubId,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    const room: MultiplayerRoom = {
      id: roomId,
      roomCode,
      name: roomName || `${hostUsername} Draft Ligi`,
      hostMemberId: memberId,
      status: 'LOBBY',
      rules,
      stateVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const state: RoomFullState = {
      room,
      members: [hostMember],
      clubs: [hostClub],
      fixtures: [],
      standings: [],
      playerPool: getCachedDraftPlayerPool(),
    };

    memoryRooms[roomId] = state;
    roomCodeMap[roomCode.toUpperCase()] = roomId;
    persistRoomLocal(state);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(() => DraftMultiplayerStore.createRoomAsync(hostUsername, sessionId, rules, roomName, undefined, state));
    }

    return state;
  }

  /**
   * Fetches room state from Supabase or local cache.
   */
  public static async fetchRoom(roomIdOrCode: string): Promise<RoomFullState | null> {
    const key = roomIdOrCode.trim().toUpperCase();
    const inFlight = this.roomFetchesInFlight.get(key);
    if (inFlight) return inFlight;

    const request = this.fetchRoomUncoalesced(roomIdOrCode);
    this.roomFetchesInFlight.set(key, request);
    try {
      return await request;
    } finally {
      // Only clear our own request. A later request must never be deleted here.
      if (this.roomFetchesInFlight.get(key) === request) {
        this.roomFetchesInFlight.delete(key);
      }
    }
  }

  private static async fetchRoomUncoalesced(roomIdOrCode: string): Promise<RoomFullState | null> {
    const raw = roomIdOrCode.trim();
    const upper = raw.toUpperCase();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const query = upper.startsWith('SC-') || upper.startsWith('AUD') || upper.startsWith('TST') || upper.length <= 10
          ? supabase.from('multiplayer_rooms').select('*, multiplayer_members(*), draft_clubs(*), draft_fixtures(*), draft_standings(*)').eq('room_code', upper).maybeSingle()
          : supabase.from('multiplayer_rooms').select('*, multiplayer_members(*), draft_clubs(*), draft_fixtures(*), draft_standings(*)').eq('id', raw).maybeSingle();

        const { data: dbRoom, error } = await query;

        if (dbRoom && !error) {
          const room = mapDbRoom(dbRoom);
          const removedIds = new Set(room.rules.removedMemberIds || []);
          const rawMembers: RoomMember[] = (dbRoom.multiplayer_members || []).map((m: any) => mapDbMember(m, room.rules));
          const localRoom = loadRoomLocal(room.id) || loadRoomLocal(room.roomCode);
          const memMembers = memoryRooms[room.id]?.members || localRoom?.members || [];
          const members: RoomMember[] = rawMembers.map((m) => {
            if (m.isBot) {
              const mem = memMembers.find((mm) => mm.id === m.id);
              if (mem && mem.botDifficulty) {
                m.botDifficulty = mem.botDifficulty;
                m.botPersonality = mem.botPersonality || m.botPersonality;
              }
            }
            return m;
          }).filter(
            (m) =>
              !removedIds.has(m.id) &&
              !(typeof m.sessionId === 'string' && (m.sessionId.startsWith('removed-') || m.sessionId.startsWith('deleted-'))) &&
              m.username !== '[REMOVED_BOT]' &&
              m.username !== '[DELETED]'
          );
          const activeMemberIds = new Set(members.map((m) => m.id));
          const initialRoomBudget = room.rules?.draftBudget || DEFAULT_DRAFT_BUDGET;
          const rawClubs: DraftClub[] = (dbRoom.draft_clubs || []).map((c: any) => mapDbClub(c, initialRoomBudget));
          let clubs: DraftClub[] = rawClubs.filter(
            (c) =>
              !removedIds.has(c.memberId) &&
              activeMemberIds.has(c.memberId) &&
              c.name !== '[REMOVED]'
          );
          const dbFixtures: DraftFixture[] = (dbRoom.draft_fixtures || []).map(mapDbFixture);
          const rulesFixtures: DraftFixture[] = (room.rules?.fixtures || []);
          const memFixtures: DraftFixture[] = memoryRooms[room.id]?.fixtures || [];
          const localFixtures: DraftFixture[] = localRoom?.fixtures || [];

          // Single Source of Truth: Canonical Fixture Reconciliation
          // Merge fixtures across db, rules, memory, and local storage.
          // Rule: A fixture with real scores (homeScore & awayScore !== undefined) is preserved and never dropped.
          const fixtureMap = new Map<string, DraftFixture>();
          const allCandidateFixtures = [...localFixtures, ...memFixtures, ...dbFixtures, ...rulesFixtures];
          for (const f of allCandidateFixtures) {
            if (!f || !f.id) continue;
            const existing = fixtureMap.get(f.id);
            if (!existing) {
              fixtureMap.set(f.id, f);
            } else {
              const isFCompleted = (f.status === 'COMPLETED' || (f.status as string) === 'FINISHED') && f.homeScore !== undefined && f.awayScore !== undefined;
              const isExistingCompleted = (existing.status === 'COMPLETED' || (existing.status as string) === 'FINISHED') && existing.homeScore !== undefined && existing.awayScore !== undefined;
              if (isFCompleted || (!isExistingCompleted && f.status !== 'AWAITING_TACTICS')) {
                fixtureMap.set(f.id, {
                  ...existing,
                  ...f,
                  homeScore: f.homeScore ?? existing.homeScore,
                  awayScore: f.awayScore ?? existing.awayScore,
                  status: (isFCompleted ? 'COMPLETED' : f.status) as any,
                });
              }
            }
          }
          const currentSeason = room.seasonNumber || room.rules?.seasonNumber || 1;
          const fixtures: DraftFixture[] = Array.from(fixtureMap.values())
            .map((f) => ({ ...f, seasonNumber: extractFixtureSeasonNumber(f) }))
            .filter((f) => f.seasonNumber === currentSeason)
            .sort((a, b) => a.round - b.round);
          const standings: DraftStanding[] = computeStandingsFromFixtures(clubs, fixtures, currentSeason);

          if (room.rules?.currentMatchweek && (!room.currentMatchweek || room.currentMatchweek < room.rules.currentMatchweek)) {
            room.currentMatchweek = room.rules.currentMatchweek;
          }
          if (room.rules?.totalMatchweeks && !room.totalMatchweeks) {
            room.totalMatchweeks = room.rules.totalMatchweeks;
          }

          let draftState: DraftState | undefined = undefined;
          const existingMemState = memoryRooms[room.id] || memoryRooms[room.roomCode?.toUpperCase()];
          const existingLocalState = loadRoomLocal(room.id) || loadRoomLocal(room.roomCode);

          // If drafting or league active/completed, or if memory/rules/storage already has picks/draftState
          const isDraftActive =
            room.status === 'DRAFTING' ||
            room.status === 'DRAFT_FINALIZING' ||
            room.status === 'LEAGUE_READY' ||
            room.status === 'LEAGUE_ACTIVE' ||
            room.status === 'LEAGUE_COMPLETED' ||
            fixtures.length > 0 ||
            Boolean(existingMemState?.draftState) ||
            Boolean(existingLocalState?.draftState) ||
            (Array.isArray(room.rules?.confirmedPicks) && room.rules.confirmedPicks.length > 0);

          if (isDraftActive) {
            let dbPicks: any[] = [];
            if (isDraftPicksTableAvailable) {
              try {
                const { data, error: picksErr } = await supabase
                  .from('draft_picks')
                  .select('*')
                  .eq('room_id', room.id);
                if (picksErr) {
                  const code = String((picksErr as any).code || '');
                  const msg = String(picksErr.message || '').toLowerCase();
                  if (code === '42501' || msg.includes('permission denied') || msg.includes('unauthorized') || (picksErr as any).status === 401) {
                    isDraftPicksTableAvailable = false;
                  }
                } else if (Array.isArray(data)) {
                  dbPicks = data;
                }
              } catch (picksCatch: any) {
                if (picksCatch?.status === 401 || String(picksCatch?.message).includes('401')) {
                  isDraftPicksTableAvailable = false;
                }
              }
            }

            const rulesPicks = Array.isArray(room.rules?.confirmedPicks) ? room.rules.confirmedPicks : [];
            const localRoom = existingLocalState;
            const memPicks = existingMemState?.draftState?.picks || [];
            const localPicks = localRoom?.draftState?.picks || [];

            const mergedPickMap = new Map<string, any>();
            (dbPicks || []).forEach((p: any) => {
              if (p && p.id) mergedPickMap.set(p.id, p);
            });
            rulesPicks.forEach((p: any) => {
              if (p && p.id) {
                if (!mergedPickMap.has(p.id)) {
                  mergedPickMap.set(p.id, p);
                } else {
                  const existing = mergedPickMap.get(p.id);
                  const price = p.draftPrice ?? p.purchase_price ?? p.draft_price;
                  if (price !== undefined && existing.draftPrice === undefined) {
                    existing.draftPrice = price;
                    existing.purchase_price = price;
                  }
                }
              }
            });
            memPicks.forEach((p: any) => {
              if (p && p.id) {
                if (!mergedPickMap.has(p.id)) {
                  mergedPickMap.set(p.id, p);
                } else {
                  const existing = mergedPickMap.get(p.id);
                  const price = p.draftPrice ?? p.purchase_price ?? p.draft_price;
                  if (price !== undefined && existing.draftPrice === undefined) {
                    existing.draftPrice = price;
                    existing.purchase_price = price;
                  }
                }
              }
            });
            localPicks.forEach((p: any) => {
              if (p && p.id) {
                if (!mergedPickMap.has(p.id)) {
                  mergedPickMap.set(p.id, p);
                } else {
                  const existing = mergedPickMap.get(p.id);
                  const price = p.draftPrice ?? p.purchase_price ?? p.draft_price;
                  if (price !== undefined && existing.draftPrice === undefined) {
                    existing.draftPrice = price;
                    existing.purchase_price = price;
                  }
                }
              }
            });
            const allPicks = Array.from(mergedPickMap.values())
              .map((p) => {
                const pId = p.playerId || p.player_id;
                let price = p.draftPrice ?? p.purchase_price ?? p.draft_price;
                if ((price === undefined || price === null || price <= 0) && pId) {
                  const pl = getCachedDraftPlayerPoolMap().get(pId);
                  if (pl) {
                    price = pl.draftValue ?? calculatePlayerDraftValue(pl);
                  }
                }
                return {
                  ...p,
                  draftPrice: price,
                  purchase_price: price,
                };
              })
              .sort(
                (a, b) =>
                  (a.global_pick_number ?? a.globalPickNumber ?? a.pick_index ?? 0) -
                  (b.global_pick_number ?? b.globalPickNumber ?? b.pick_index ?? 0)
              );

            draftState = reconstructDraftState(room.id, members, room.rules, allPicks);

            // Defensive safety: Never drop an existing valid active memory draftState if reconstructed is somehow undefined or older
            if (!draftState && existingMemState?.draftState) {
              draftState = existingMemState.draftState;
            } else if (draftState && existingMemState?.draftState && (existingMemState.draftState.picks.length > draftState.picks.length)) {
              draftState = existingMemState.draftState;
            }

            // Merge any squads and budgets that already exist in memory / local storage / rules
            const memClubs = existingMemState?.clubs || localRoom?.clubs || [];
            const ruleClubs = Array.isArray(room.rules?.clubBudgets) ? room.rules.clubBudgets : [];
            if (memClubs.length > 0 || ruleClubs.length > 0) {
              clubs = clubs.map((c) => {
                const mc = memClubs.find((m: any) => m.id === c.id || m.memberId === c.memberId || (m.code && m.code === c.code));
                const rc = ruleClubs.find((r: any) => r.id === c.id || r.memberId === c.memberId || (r.code && r.code === c.code));
                const mergedSquad = Array.from(new Set([
                  ...(c.squadPlayerIds || []),
                  ...(mc?.squadPlayerIds || []),
                  ...(rc?.squadPlayerIds || []),
                ])).filter(Boolean);
                const maxSpent = Math.max(c.spentBudget || 0, mc?.spentBudget || 0, rc?.spentBudget || 0);
                const clubBudget = c.budget ?? initialRoomBudget;
                const preservedBudget = mc?.budget !== undefined && mc.budget < clubBudget
                  ? mc.budget
                  : rc?.budget !== undefined && rc.budget < clubBudget
                  ? rc.budget
                  : clubBudget;
                return {
                  ...c,
                  squadPlayerIds: mergedSquad,
                  spentBudget: maxSpent,
                  budget: preservedBudget,
                };
              });
            }

            // Authoritatively reconcile and guarantee club squadPlayerIds and budget from canonical draft picks
            clubs = reconcileClubsBudget(clubs, room.rules, draftState?.picks || [], getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM');
          } else {
            // Check if draft already has picks in memory or local storage
            const localRoom = existingLocalState;
            const memPicks = existingMemState?.draftState?.picks || localRoom?.draftState?.picks || [];
            if (existingMemState?.draftState) {
              draftState = existingMemState.draftState;
            }
            if (memPicks.length > 0) {
              clubs = reconcileClubsBudget(clubs, room.rules, memPicks, getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM_LOBBY_RECOVER');
            } else {
              clubs = reconcileClubsBudget(clubs, room.rules, [], getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM_LOBBY');
            }
          }

          const currentSeasonNum = room.seasonNumber || room.rules?.seasonNumber || 1;
          const seasonStatsRes = computeSeasonPlayerStats(fixtures, clubs, getCachedDraftPlayerPool(), currentSeasonNum);
          const seasonHistory = room.seasonHistory || room.rules?.seasonHistory || memoryRooms[room.id]?.seasonHistory || [];
          const seasonPlayerStats = room.rules?.seasonPlayerStats || seasonStatsRes.playerStats;

          let state: RoomFullState = {
            room: {
              ...room,
              seasonNumber: currentSeasonNum,
              seasonHistory,
              seasonPlayerStats,
            },
            members,
            clubs,
            draftState,
            fixtures,
            standings,
            playerPool: getCachedDraftPlayerPool(),
            awards: room.rules?.awards || memoryRooms[room.id]?.awards,
            seasonHistory,
            seasonPlayerStats,
          };

          // READ-ONLY: If fixtures or standings exist in room.rules but not top-level, populate without mutating DB
          if (state.fixtures.length === 0 && Array.isArray(room.rules?.fixtures) && room.rules.fixtures.length > 0) {
            state.fixtures = room.rules.fixtures;
          }
          if (state.standings.length === 0 && Array.isArray(room.rules?.standings) && room.rules.standings.length > 0) {
            state.standings = room.rules.standings;
          }

          memoryRooms[room.id] = state;
          roomCodeMap[room.roomCode.toUpperCase()] = room.id;
          persistRoomLocal(state);
          return state;
        }
      } catch (err) {
        console.warn('Supabase fetchRoom error:', err);
      }
    }

    // Fallback to memory / localStorage
    return this.getRoom(roomIdOrCode);
  }

  /**
   * Joins a room asynchronously with Supabase DB synchronization.
   */
  public static async joinRoomAsync(
    roomCode: string,
    username: string,
    sessionId: string,
    isSpectator: boolean = false
  ): Promise<{ success: boolean; state?: RoomFullState; currentMember?: RoomMember; error?: string; errorCode?: MultiplayerErrorCode }> {
    const cleanCode = roomCode.trim().toUpperCase();

    // 1. Fetch room state from Supabase or local
    let state = await this.fetchRoom(cleanCode);

    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      logMultiplayerAction('JOIN_ROOM', cleanCode, sessionId, 0, 0, false, 'SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    // Keep a recovery point until the server has accepted the complete join.
    // A local-only member is especially harmful: the UI enters the room but a
    // refresh makes that same player disappear again.
    const stateBeforeJoin = state;

    const prevVersion = state.room.stateVersion || 1;

    // Check maximum players
    const activeManagers = state.members.filter((m) => !m.isSpectator);
    const isExisting = state.members.some((m) => m.sessionId === sessionId);

    if (!isExisting && !isSpectator && activeManagers.length >= state.room.rules.maxManagers) {
      const err = formatMultiplayerError('SC-MP-008');
      logMultiplayerAction('JOIN_ROOM', state.room.id, sessionId, prevVersion, prevVersion, false, 'SC-MP-008');
      return { success: false, error: err.message, errorCode: 'SC-MP-008' };
    }

    const { updatedMembers, currentMember } = resolveMemberConnection(
      state.members,
      sessionId,
      username,
      state.room.id,
      false,
      isSpectator
    );

    // Create club for new manager if not spectator and doesn't have one
    let updatedClubs = [...state.clubs];
    let newClubToInsert: DraftClub | null = null;

    if (!currentMember.isSpectator && !currentMember.clubId) {
      const preset = FICTIONAL_CLUB_PRESETS[updatedClubs.length % FICTIONAL_CLUB_PRESETS.length];
      const newClubId = `club-${state.room.id}-${currentMember.id}`;
      const newClub: DraftClub = {
        id: newClubId,
        roomId: state.room.id,
        memberId: currentMember.id,
        name: `${currentMember.username} FK`,
        code: currentMember.username.slice(0, 3).toUpperCase() || 'KLP',
        managerName: currentMember.username,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        badge: createDefaultBadgeConfig(preset.primaryColor, preset.secondaryColor),
        squadPlayerIds: [],
        budget: state.room.rules.draftBudget || DEFAULT_DRAFT_BUDGET,
        spentBudget: 0,
      };
      updatedClubs.push(newClub);
      currentMember.clubId = newClubId;
      newClubToInsert = newClub;
    }

    const resultingVersion = prevVersion + 1;
    state = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: {
        ...state.room,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = state;
    roomCodeMap[cleanCode] = state.room.id;
    persistRoomLocal(state);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: memberError } = await withTimeout(
          () => supabase.from('multiplayer_members').upsert({
          id: currentMember.id,
          room_id: state.room.id,
          session_id: currentMember.sessionId,
          username: currentMember.username,
          is_host: currentMember.isHost,
          is_spectator: currentMember.isSpectator,
          is_ready: currentMember.isReady,
          club_id: currentMember.clubId,
          is_connected: currentMember.isConnected,
          last_seen_at: currentMember.lastSeenAt,
          joined_at: currentMember.joinedAt,
          }),
          8500,
          'Oda üyeliği'
        );
        if (memberError) throw memberError;

        if (newClubToInsert) {
          const { error: clubError } = await withTimeout(
            () => supabase.from('draft_clubs').upsert({
            id: newClubToInsert.id,
            room_id: state.room.id,
            member_id: newClubToInsert.memberId,
            name: newClubToInsert.name,
            code: newClubToInsert.code,
            manager_name: newClubToInsert.managerName,
            primary_color: newClubToInsert.primaryColor,
            secondary_color: newClubToInsert.secondaryColor,
            badge: newClubToInsert.badge,
            squad_player_ids: [],
            }),
            8500,
            'Kulüp kaydı'
          );
          if (clubError) {
            // The member was created in this request, so remove only that
            // partial row. Existing reconnecting members are never deleted.
            if (!isExisting) {
              await supabase.from('multiplayer_members').delete().eq('id', currentMember.id).eq('room_id', state.room.id);
            }
            throw clubError;
          }
        }

        broadcastRealtimeUpdate(cleanCode, 'JOIN_ROOM', resultingVersion);
      } catch (e: any) {
        memoryRooms[stateBeforeJoin.room.id] = stateBeforeJoin;
        persistRoomLocal(stateBeforeJoin);
        const error = isTransientNetworkError(e)
          ? 'Odaya bağlanılamadı. Bağlantıyı kontrol edip tekrar deneyin.'
          : 'Oda üyeliği kaydedilemedi. Lütfen tekrar deneyin.';
        console.warn('Supabase joinRoomAsync write error:', e);
        return { success: false, error, errorCode: 'SC-MP-010' };
      }
    }

    logMultiplayerAction(
      isExisting ? 'RECONNECT' : 'JOIN_ROOM',
      state.room.id,
      sessionId,
      prevVersion,
      resultingVersion,
      true,
      undefined,
      { username, isSpectator }
    );

    return { success: true, state, currentMember };
  }

  /**
   * Synchronous joinRoom wrapper for compatibility.
   */
  public static joinRoom(
    roomCode: string,
    username: string,
    sessionId: string,
    isSpectator: boolean = false
  ): { success: boolean; state?: RoomFullState; currentMember?: RoomMember; error?: string; errorCode?: MultiplayerErrorCode } {
    const cleanCode = roomCode.trim().toUpperCase();
    let state = memoryRooms[roomCodeMap[cleanCode]] || loadRoomLocal(cleanCode);

    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      logMultiplayerAction('JOIN_ROOM', cleanCode, sessionId, 0, 0, false, 'SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const activeManagers = state.members.filter((m) => !m.isSpectator);
    const isExisting = state.members.some((m) => m.sessionId === sessionId);

    if (!isExisting && !isSpectator && activeManagers.length >= state.room.rules.maxManagers) {
      const err = formatMultiplayerError('SC-MP-008');
      logMultiplayerAction('JOIN_ROOM', state.room.id, sessionId, prevVersion, prevVersion, false, 'SC-MP-008');
      return { success: false, error: err.message, errorCode: 'SC-MP-008' };
    }

    const { updatedMembers, currentMember } = resolveMemberConnection(
      state.members,
      sessionId,
      username,
      state.room.id,
      false,
      isSpectator
    );

    let updatedClubs = [...state.clubs];
    if (!currentMember.isSpectator && !currentMember.clubId) {
      const preset = FICTIONAL_CLUB_PRESETS[updatedClubs.length % FICTIONAL_CLUB_PRESETS.length];
      const newClubId = `club-${state.room.id}-${currentMember.id}`;
      const newClub: DraftClub = {
        id: newClubId,
        roomId: state.room.id,
        memberId: currentMember.id,
        name: `${currentMember.username} FK`,
        code: currentMember.username.slice(0, 3).toUpperCase() || 'KLP',
        managerName: currentMember.username,
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        badge: createDefaultBadgeConfig(preset.primaryColor, preset.secondaryColor),
        squadPlayerIds: [],
        budget: state.room.rules.draftBudget || DEFAULT_DRAFT_BUDGET,
        spentBudget: 0,
      };
      updatedClubs.push(newClub);
      currentMember.clubId = newClubId;
    }

    const resultingVersion = prevVersion + 1;
    state = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: {
        ...state.room,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = state;
    roomCodeMap[cleanCode] = state.room.id;
    persistRoomLocal(state);

    return { success: true, state, currentMember };
  }

  /**
   * Retrieves full room state synchronously from memory / localStorage.
   */
  public static getRoom(roomIdOrCode: string): RoomFullState | null {
    const raw = roomIdOrCode.trim();
    const upper = raw.toUpperCase();
    return (
      memoryRooms[raw] ||
      memoryRooms[upper] ||
      (roomCodeMap[upper] ? memoryRooms[roomCodeMap[upper]] : null) ||
      loadRoomLocal(raw) ||
      loadRoomLocal(upper)
    );
  }

  /**
   * Updates a club's identity (name, code, manager, colors, badge).
   */
  public static updateClub(
    roomId: string,
    memberId: string,
    clubData: Partial<DraftClub>
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const clubIndex = state.clubs.findIndex((c) => c.memberId === memberId);
    if (clubIndex < 0) {
      const err = formatMultiplayerError('SC-MP-007', 'Kulüp bulunamadı');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const updatedClub: DraftClub = {
      ...state.clubs[clubIndex],
      ...clubData,
      id: state.clubs[clubIndex].id,
      roomId: state.room.id,
      memberId,
    };

    const updatedClubs = [...state.clubs];
    updatedClubs[clubIndex] = updatedClub;

    const newState: RoomFullState = {
      ...state,
      clubs: updatedClubs,
      room: { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('draft_clubs')
          .update({
            name: updatedClub.name,
            code: updatedClub.code,
            manager_name: updatedClub.managerName,
            primary_color: updatedClub.primaryColor,
            secondary_color: updatedClub.secondaryColor,
            badge: updatedClub.badge,
          })
          .eq('id', updatedClub.id);
        broadcastRealtimeUpdate(state.room.roomCode, 'UPDATE_CLUB', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === memberId);
    logMultiplayerAction('UPDATE_CLUB', state.room.id, member?.sessionId || memberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Toggles readiness status of a member asynchronously with DB synchronization.
   */
  public static async toggleMemberReadyAsync(
    roomId: string,
    memberId: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    let state = this.getRoom(roomId);
    if (!state) {
      state = await this.fetchRoom(roomId);
    }
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    let targetMember: RoomMember | undefined;
    const updatedMembers = state.members.map((m) => {
      if (m.id === memberId) {
        targetMember = { ...m, isReady: !m.isReady };
        return targetMember;
      }
      return m;
    });

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      room: { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase && targetMember) {
      const isReadyVal = targetMember.isReady;
      try {
        await supabase
          .from('multiplayer_members')
          .update({ is_ready: isReadyVal })
          .eq('id', memberId);
        broadcastRealtimeUpdate(state.room.roomCode, 'READY', resultingVersion);
      } catch (e) {
        console.warn('Supabase toggleMemberReadyAsync error:', e);
      }
    }

    const member = state.members.find((m) => m.id === memberId);
    logMultiplayerAction('READY', state.room.id, member?.sessionId || memberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Toggles readiness status of a member.
   */
  public static toggleMemberReady(
    roomId: string,
    memberId: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    let targetMember: RoomMember | undefined;
    const updatedMembers = state.members.map((m) => {
      if (m.id === memberId) {
        targetMember = { ...m, isReady: !m.isReady };
        return targetMember;
      }
      return m;
    });

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      room: { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase && targetMember) {
      const isReadyVal = targetMember.isReady;
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_members')
          .update({ is_ready: isReadyVal })
          .eq('id', memberId);
        broadcastRealtimeUpdate(state.room.roomCode, 'READY', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === memberId);
    logMultiplayerAction('READY', state.room.id, member?.sessionId || memberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Updates league rules (Host only).
   */
  public static updateRules(
    roomId: string,
    hostMemberId: string,
    rules: DraftRules
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu kuralları değiştirebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const newBudget = rules.draftBudget || DEFAULT_DRAFT_BUDGET;
    const updatedClubs = state.clubs.map((c) => {
      const picksCount = c.squadPlayerIds?.length || 0;
      if (picksCount === 0) {
        return { ...c, budget: newBudget, spentBudget: 0 };
      }
      return c;
    });

    const newState: RoomFullState = {
      ...state,
      room: { ...state.room, rules, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
      clubs: updatedClubs,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({ rules, updated_at: new Date().toISOString() })
          .eq('id', roomId);
        broadcastRealtimeUpdate(state.room.roomCode, 'UPDATE_RULES', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === hostMemberId);
    logMultiplayerAction('UPDATE_RULES', state.room.id, member?.sessionId || hostMemberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Adds an AI Bot manager to the lobby asynchronously (Host only).
   */
  public static async addBotAsync(
    roomId: string,
    hostMemberId: string,
    difficulty: BotDifficulty = 'ORTA'
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    let state = this.getRoom(roomId);
    if (!state) {
      state = await this.fetchRoom(roomId);
    }
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu bot ekleyebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }
    if (state.room.status !== 'LOBBY') {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca lobide bot eklenebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const removedIds = new Set(state.room.rules.removedMemberIds || []);
    const activeManagers = state.members.filter(
      (m) => !m.isSpectator && !removedIds.has(m.id) && !(typeof m.sessionId === 'string' && m.sessionId.startsWith('removed-'))
    );
    if (activeManagers.length >= state.room.rules.maxManagers) {
      const err = formatMultiplayerError('SC-MP-008');
      return { success: false, error: err.message, errorCode: 'SC-MP-008' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const botCount = activeManagers.filter((m) => m.isBot).length;
    const botProfile = generateBotProfile(difficulty, botCount);

    const botMemberId = `mem-${state.room.id}-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botClubId = `club-${state.room.id}-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botSessionId = `bot-session-${difficulty}-${botProfile.personality}-${botMemberId}`;

    const botMember: RoomMember = {
      id: botMemberId,
      roomId: state.room.id,
      sessionId: botSessionId,
      username: botProfile.username,
      isHost: false,
      isSpectator: false,
      isReady: true,
      isBot: true,
      botDifficulty: difficulty,
      botPersonality: botProfile.personality,
      clubId: botClubId,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    const botClub: DraftClub = {
      id: botClubId,
      roomId: state.room.id,
      memberId: botMemberId,
      name: botProfile.clubName,
      code: botProfile.clubCode,
      managerName: botProfile.username,
      primaryColor: botProfile.primaryColor,
      secondaryColor: botProfile.secondaryColor,
      badge: botProfile.badge,
      squadPlayerIds: [],
      budget: state.room.rules.draftBudget || DEFAULT_DRAFT_BUDGET,
      spentBudget: 0,
    };

    const updatedRules: DraftRules = {
      ...state.room.rules,
      stateVersion: resultingVersion,
      botConfigs: {
        ...(state.room.rules.botConfigs || {}),
        [botMemberId]: {
          difficulty,
          personality: botProfile.personality,
        },
      },
    };

    const newState: RoomFullState = {
      ...state,
      members: [...state.members, botMember],
      clubs: [...state.clubs, botClub],
      room: {
        ...state.room,
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('multiplayer_members').insert({
          id: botMember.id,
          room_id: state.room.id,
          session_id: botMember.sessionId,
          username: botMember.username,
          is_host: false,
          is_spectator: false,
          is_ready: true,
          club_id: botClubId,
          is_connected: true,
          last_seen_at: botMember.lastSeenAt,
          joined_at: botMember.joinedAt,
        });

        await supabase.from('draft_clubs').insert({
          id: botClub.id,
          room_id: state.room.id,
          member_id: botMember.id,
          name: botClub.name,
          code: botClub.code,
          manager_name: botClub.managerName,
          primary_color: botClub.primaryColor,
          secondary_color: botClub.secondaryColor,
          badge: botClub.badge,
          squad_player_ids: [],
        });

        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'ADD_BOT', resultingVersion);
      } catch (err: any) {
        console.error('Supabase addBot error:', err);
      }
    }

    logMultiplayerAction('JOIN_ROOM', state.room.id, botMember.sessionId, prevVersion, resultingVersion, true, undefined, {
      isBot: true,
      difficulty,
      personality: botProfile.personality,
    });

    return { success: true, state: newState };
  }

  /**
   * Adds an AI Bot manager to the lobby (Host only).
   */
  public static addBot(
    roomId: string,
    hostMemberId: string,
    difficulty: BotDifficulty = 'ORTA'
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu bot ekleyebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }
    if (state.room.status !== 'LOBBY') {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca lobide bot eklenebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const removedIds = new Set(state.room.rules.removedMemberIds || []);
    const activeManagers = state.members.filter(
      (m) => !m.isSpectator && !removedIds.has(m.id) && !(typeof m.sessionId === 'string' && m.sessionId.startsWith('removed-'))
    );
    if (activeManagers.length >= state.room.rules.maxManagers) {
      const err = formatMultiplayerError('SC-MP-008');
      return { success: false, error: err.message, errorCode: 'SC-MP-008' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const botCount = activeManagers.filter((m) => m.isBot).length;
    const botProfile = generateBotProfile(difficulty, botCount);

    const botMemberId = `mem-${state.room.id}-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botClubId = `club-${state.room.id}-bot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const botSessionId = `bot-session-${difficulty}-${botProfile.personality}-${botMemberId}`;

    const botMember: RoomMember = {
      id: botMemberId,
      roomId: state.room.id,
      sessionId: botSessionId,
      username: botProfile.username,
      isHost: false,
      isSpectator: false,
      isReady: true,
      isBot: true,
      botDifficulty: difficulty,
      botPersonality: botProfile.personality,
      clubId: botClubId,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };

    const botClub: DraftClub = {
      id: botClubId,
      roomId: state.room.id,
      memberId: botMemberId,
      name: botProfile.clubName,
      code: botProfile.clubCode,
      managerName: botProfile.username,
      primaryColor: botProfile.primaryColor,
      secondaryColor: botProfile.secondaryColor,
      badge: botProfile.badge,
      squadPlayerIds: [],
      budget: state.room.rules.draftBudget || DEFAULT_DRAFT_BUDGET,
      spentBudget: 0,
    };

    const updatedRules: DraftRules = {
      ...state.room.rules,
      stateVersion: resultingVersion,
      botConfigs: {
        ...(state.room.rules.botConfigs || {}),
        [botMemberId]: {
          difficulty,
          personality: botProfile.personality,
        },
      },
    };

    const newState: RoomFullState = {
      ...state,
      members: [...state.members, botMember],
      clubs: [...state.clubs, botClub],
      room: {
        ...state.room,
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase.from('multiplayer_members').insert({
          id: botMember.id,
          room_id: state.room.id,
          session_id: botMember.sessionId,
          username: botMember.username,
          is_host: false,
          is_spectator: false,
          is_ready: true,
          club_id: botClubId,
          is_connected: true,
          last_seen_at: botMember.lastSeenAt,
          joined_at: botMember.joinedAt,
        });

        await supabase.from('draft_clubs').insert({
          id: botClub.id,
          room_id: state.room.id,
          member_id: botMember.id,
          name: botClub.name,
          code: botClub.code,
          manager_name: botClub.managerName,
          primary_color: botClub.primaryColor,
          secondary_color: botClub.secondaryColor,
          badge: botClub.badge,
          squad_player_ids: [],
        });

        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'ADD_BOT', resultingVersion);
      });
    }

    logMultiplayerAction('JOIN_ROOM', state.room.id, botMember.sessionId, prevVersion, resultingVersion, true, undefined, {
      isBot: true,
      difficulty,
      personality: botProfile.personality,
    });

    return { success: true, state: newState };
  }

  /**
   * Removes a Bot manager from the lobby asynchronously with DB synchronization (Host only).
   */
  public static async removeBotAsync(
    roomId: string,
    hostMemberId: string,
    botMemberId: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    let state = this.getRoom(roomId);
    if (!state) {
      state = await this.fetchRoom(roomId);
    }
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu bot silebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }
    if (state.room.status !== 'LOBBY') {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca lobide bot silinebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const targetMember = state.members.find((m) => m.id === botMemberId);
    if (!targetMember || (!targetMember.isBot && !targetMember.sessionId.startsWith('bot-'))) {
      return { success: false, error: 'Silinecek bot menajer bulunamadı.', errorCode: 'SC-MP-012' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const removedMemberIds = Array.from(new Set([...(state.room.rules.removedMemberIds || []), botMemberId]));
    const updatedRules: DraftRules = {
      ...state.room.rules,
      removedMemberIds,
      stateVersion: resultingVersion,
    };

    const updatedMembers = state.members.filter((m) => m.id !== botMemberId);
    const updatedClubs = state.clubs.filter((c) => c.memberId !== botMemberId);

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: {
        ...state.room,
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // 1. Deactivate/soft-delete bot member in DB
        await supabase
          .from('multiplayer_members')
          .update({
            is_connected: false,
            is_ready: false,
            session_id: `removed-bot-${botMemberId}`,
            username: '[REMOVED_BOT]',
          })
          .eq('id', botMemberId);

        // 2. Try delete in case RLS allows it
        await supabase.from('multiplayer_members').delete().eq('id', botMemberId);
        await supabase.from('draft_clubs').delete().eq('member_id', botMemberId);

        // 3. Update room rules with removedMemberIds to guarantee canonical server exclusion
        const { error: roomErr } = await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        if (roomErr) {
          console.error('Supabase removeBot room update error:', roomErr);
          return {
            success: false,
            error: 'Bot odadan kaldırılamadı.',
            errorCode: 'SC-MP-012',
          };
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'REMOVE_BOT', resultingVersion);
      } catch (err: any) {
        console.error('Supabase removeBot network error:', err);
        return {
          success: false,
          error: 'Bot odadan kaldırılamadı.',
          errorCode: 'SC-MP-012',
        };
      }
    }

    logMultiplayerAction('LEAVE_ROOM', state.room.id, botMemberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Removes a Bot manager from the lobby (Host only).
   */
  public static removeBot(
    roomId: string,
    hostMemberId: string,
    botMemberId: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu bot silebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }
    if (state.room.status !== 'LOBBY') {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca lobide bot silinebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const removedMemberIds = Array.from(new Set([...(state.room.rules.removedMemberIds || []), botMemberId]));
    const updatedRules: DraftRules = {
      ...state.room.rules,
      removedMemberIds,
      stateVersion: resultingVersion,
    };

    const updatedMembers = state.members.filter((m) => m.id !== botMemberId);
    const updatedClubs = state.clubs.filter((c) => c.memberId !== botMemberId);

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: {
        ...state.room,
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_members')
          .update({
            is_connected: false,
            is_ready: false,
            session_id: `removed-bot-${botMemberId}`,
            username: '[REMOVED_BOT]',
          })
          .eq('id', botMemberId);

        await supabase.from('multiplayer_members').delete().eq('id', botMemberId);
        await supabase.from('draft_clubs').delete().eq('member_id', botMemberId);

        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'REMOVE_BOT', resultingVersion);
      });
    }

    logMultiplayerAction('LEAVE_ROOM', state.room.id, botMemberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }

  /**
   * Closes and terminates a room when the host explicitly leaves (Host only).
   * Sets room status to CLOSED, broadcasts to all participants, and terminates room state.
   */
  public static async closeRoomByHost(
    roomId: string,
    hostMemberId: string
  ): Promise<{ success: boolean; error?: string; errorCode?: MultiplayerErrorCode }> {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu odayı kapatabilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const closedRoom: MultiplayerRoom = {
      ...state.room,
      status: 'CLOSED',
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: closedRoom,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'CLOSED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'CLOSE_ROOM', resultingVersion);
      } catch (err: any) {
        console.warn('Supabase closeRoomByHost warning:', err);
      }
    }

    logMultiplayerAction('CLOSE_ROOM', state.room.id, hostMemberId, prevVersion, resultingVersion, true);

    return { success: true };
  }

  /**
   * Customizes a Bot manager in the lobby (Host only).
   */
  public static updateBot(
    roomId: string,
    hostMemberId: string,
    botMemberId: string,
    updates: { difficulty?: BotDifficulty; name?: string; clubName?: string; regenerateBadge?: boolean }
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yetkisiz işlem');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const targetBot = state.members.find((m) => m.id === botMemberId);
    const existingConfig = state.room.rules.botConfigs?.[botMemberId];
    const newDifficulty = updates.difficulty || targetBot?.botDifficulty || existingConfig?.difficulty || 'ORTA';
    const newPersonality = targetBot?.botPersonality || existingConfig?.personality || 'Dengeli';
    const newSessionId = `bot-session-${newDifficulty}-${newPersonality}-${botMemberId}`;

    const updatedMembers = state.members.map((m) => {
      if (m.id === botMemberId) {
        return {
          ...m,
          sessionId: newSessionId,
          username: updates.name ? updates.name : m.username,
          botDifficulty: newDifficulty,
          botPersonality: newPersonality,
        };
      }
      return m;
    });

    const updatedClubs = state.clubs.map((c) => {
      if (c.memberId === botMemberId) {
        let badge = c.badge;
        if (updates.regenerateBadge) {
          const shapes = ['shield', 'circle', 'diamond', 'hexagon', 'banner'] as const;
          const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
          badge = createDefaultBadgeConfig(c.primaryColor, c.secondaryColor, randomShape);
        }
        return {
          ...c,
          name: updates.clubName || c.name,
          managerName: updates.name || c.managerName,
          badge,
        };
      }
      return c;
    });

    const updatedRules: DraftRules = {
      ...state.room.rules,
      stateVersion: resultingVersion,
      botConfigs: {
        ...(state.room.rules.botConfigs || {}),
        [botMemberId]: {
          difficulty: newDifficulty,
          personality: newPersonality,
        },
      },
    };

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: { ...state.room, rules: updatedRules, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        const botM = updatedMembers.find((m) => m.id === botMemberId);
        const botC = updatedClubs.find((c) => c.memberId === botMemberId);
        if (botM) {
          await supabase.from('multiplayer_members').update({ username: botM.username, session_id: newSessionId }).eq('id', botMemberId);
        }
        if (botC) {
          await supabase.from('draft_clubs').update({ name: botC.name, manager_name: botC.managerName, badge: botC.badge }).eq('id', botC.id);
        }
        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);
        broadcastRealtimeUpdate(state.room.roomCode, 'UPDATE_BOT', resultingVersion);
      });
    }

    return { success: true, state: newState };
  }

  /**
   * Starts the draft asynchronously with DB confirmation (Host only).
   */
  public static async startDraftAsync(
    roomId: string,
    hostMemberId: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    let state = this.getRoom(roomId);
    if (!state) {
      state = await this.fetchRoom(roomId);
    }
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu draftı başlatabilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const managers = state.members.filter((m) => !m.isSpectator);
    if (managers.length < 2) {
      const err = formatMultiplayerError('SC-MP-007', 'Draft başlatmak için en az 2 menajer gereklidir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const draftOrder = generateInitialDraftOrder(managers.map((m) => m.id));
    const updatedRules: DraftRules = { ...state.room.rules, draftOrder };
    const draftState = initializeDraftState(state.room.id, draftOrder, updatedRules);

    const newState: RoomFullState = {
      ...state,
      room: {
        ...state.room,
        status: 'DRAFTING',
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
      draftState,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: dbError } = await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'DRAFTING',
            rules: {
              ...updatedRules,
              stateVersion: resultingVersion,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        if (dbError) {
          console.error('Supabase startDraft DB update error:', dbError);
          return {
            success: false,
            error: `Veritabanı güncellenemedi: ${dbError.message}`,
            errorCode: 'SC-MP-011',
          };
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'START_DRAFT', resultingVersion);
      } catch (err: any) {
        console.error('Supabase startDraft network/exec error:', err);
        return {
          success: false,
          error: `Bağlantı hatası: ${err?.message || ''}`,
          errorCode: 'SC-MP-011',
        };
      }
    }

    const member = state.members.find((m) => m.id === hostMemberId);
    logMultiplayerAction('START_DRAFT', state.room.id, member?.sessionId || hostMemberId, prevVersion, resultingVersion, true, undefined, {
      managersCount: managers.length,
      draftOrder,
    });

    return { success: true, state: newState };
  }

  /**
   * Starts the draft (Host only).
   */
  public static startDraft(
    roomId: string,
    hostMemberId: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu draftı başlatabilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const managers = state.members.filter((m) => !m.isSpectator);
    if (managers.length < 2) {
      const err = formatMultiplayerError('SC-MP-007', 'Draft başlatmak için en az 2 menajer gereklidir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const draftOrder = generateInitialDraftOrder(managers.map((m) => m.id));
    const updatedRules: DraftRules = { ...state.room.rules, draftOrder };
    const draftState = initializeDraftState(state.room.id, draftOrder, updatedRules);

    const newState: RoomFullState = {
      ...state,
      room: {
        ...state.room,
        status: 'DRAFTING',
        rules: updatedRules,
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
      draftState,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'DRAFTING',
            rules: {
              ...updatedRules,
              stateVersion: resultingVersion,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', roomId);
        broadcastRealtimeUpdate(state.room.roomCode, 'START_DRAFT', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === hostMemberId);
    logMultiplayerAction('START_DRAFT', state.room.id, member?.sessionId || hostMemberId, prevVersion, resultingVersion, true, undefined, {
      managersCount: managers.length,
      draftOrder,
    });

    return { success: true, state: newState };
  }

  /**
   * Mutex lock map for draft picks to prevent concurrency collisions.
   */
  private static pickLockMap: Record<string, boolean> = {};

  /**
   * Asynchronously makes an atomic draft pick with in-flight concurrency lock.
   */
  public static async makePickAsync(
    roomId: string,
    memberId: string,
    playerId: string,
    isAutoPick: boolean = false
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    const lockKey = roomId;
    if (this.pickLockMap[lockKey]) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    this.pickLockMap[lockKey] = true;

    try {
      let res = this.makePick(roomId, memberId, playerId, isAutoPick);

      // If makePick failed with SC-MP-007 or SC-MP-002, try recovering fresh state from DB and retry once
      if (!res.success && (res.errorCode === 'SC-MP-007' || res.errorCode === 'SC-MP-002')) {
        console.warn(`[makePickAsync] Attempting state recovery after ${res.errorCode} for room: ${roomId}`);
        const freshState = await this.fetchRoom(roomId);
        if (freshState?.draftState) {
          res = this.makePick(roomId, memberId, playerId, isAutoPick);
        }
      }

      if (res.success && res.state) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const club = res.state.clubs.find((c) => c.memberId === memberId);
          const lastPick = res.state.draftState?.picks[res.state.draftState.picks.length - 1];
          if (club && lastPick) {
            try {
              const playerPrice = lastPick.draftPrice || 0;
              const upsertPick = async () => {
                try {
                  const { error: pickErr } = await supabase.from('draft_picks').upsert({
                    id: lastPick.id,
                    room_id: roomId,
                    round: lastPick.round,
                    pick_index_in_round: lastPick.pickIndexInRound,
                    global_pick_number: lastPick.globalPickNumber,
                    member_id: lastPick.memberId,
                    club_id: lastPick.clubId,
                    player_id: lastPick.playerId,
                    selected_at: lastPick.selectedAt,
                    is_auto_pick: lastPick.isAutoPick,
                    time_taken_seconds: lastPick.timeTakenSeconds,
                  });
                  if (pickErr) {
                    console.warn('draft_picks upsert error in makePickAsync:', pickErr.message || pickErr);
                  }
                } catch (e1) {
                  console.warn('draft_picks upsert exception in makePickAsync:', e1);
                }
              };

              await Promise.all([
                supabase.from('multiplayer_rooms').update({
                  rules: res.state.room.rules,
                  updated_at: new Date().toISOString(),
                }).eq('id', roomId),
                upsertPick(),
                supabase.from('draft_clubs').update({
                  squad_player_ids: club.squadPlayerIds,
                }).eq('id', club.id),
              ]);
            } catch (dbErr) {
              console.warn('DB pick sync warning (handled via memory):', dbErr);
            }
          }
        }
      }
      return res;
    } finally {
      this.pickLockMap[lockKey] = false;
    }
  }

  /**
   * Makes an atomic draft pick.
   */
  public static makePick(
    roomId: string,
    memberId: string,
    playerId: string,
    isAutoPick: boolean = false
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    let state = this.getRoom(roomId);

    // Auto-recovery if draftState is missing in memory
    if (!state || !state.draftState) {
      const local = loadRoomLocal(roomId) || (state ? loadRoomLocal(state.room.roomCode) : null);
      if (local?.draftState) {
        state = local;
        memoryRooms[state.room.id] = state;
      } else if (state?.room) {
        const confirmedPicks = Array.isArray(state.room.rules?.confirmedPicks) ? state.room.rules.confirmedPicks : [];
        const reconstructed = reconstructDraftState(state.room.id, state.members, state.room.rules, confirmedPicks);
        if (reconstructed) {
          state.draftState = reconstructed;
          memoryRooms[state.room.id] = state;
        }
      }
    }

    if (!state || !state.draftState) {
      const err = formatMultiplayerError('SC-MP-007', 'Draft aktif değil');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    // Idempotency: If this member already picked this player, return success immediately
    if (state.draftState.picks.some((p) => p.playerId === playerId && p.memberId === memberId)) {
      return { success: true, state };
    }

    const member = state.members.find((m) => m.id === memberId);
    const club = state.clubs.find((c) => c.memberId === memberId);
    if (!member || !club) {
      const err = formatMultiplayerError('SC-MP-002', 'Menajer veya kulüp bulunamadı');
      return { success: false, error: err.message, errorCode: 'SC-MP-002' };
    }

    const pickedPlayerIds = new Set(state.draftState.picks.map((p) => p.playerId));
    const prevVersion = state.room.stateVersion || 1;

    // Validate pick
    const validation = validateDraftPick(
      state.draftState,
      memberId,
      playerId,
      pickedPlayerIds,
      state.playerPool,
      state.room.rules,
      club
    );

    if (!validation.isValid) {
      logMultiplayerAction(
        isAutoPick ? 'AUTO_PICK' : 'PLAYER_PICK',
        state.room.id,
        member.sessionId,
        prevVersion,
        prevVersion,
        false,
        validation.errorCode || 'SC-MP-004'
      );
      return { success: false, error: validation.error, errorCode: validation.errorCode || 'SC-MP-004' };
    }

    const pickedPlayer = state.playerPool.find((p) => p.id === playerId);
    const playerPrice = pickedPlayer?.draftValue ?? (pickedPlayer ? calculatePlayerDraftValue(pickedPlayer) : 0);

    // Execute pick
    const { nextState, newPick } = executeDraftPick(
      state.draftState,
      memberId,
      club.id,
      playerId,
      isAutoPick,
      state.room.rules,
      Date.now(),
      playerPrice
    );

    const pickEvent = isAutoPick ? 'AUTO_PICK' : (member.isBot ? 'BOT_PICK' : 'PLAYER_PICK');
    // Authoritatively reconcile ALL clubs from canonical picks
    const reconciledClubs = reconcileClubsBudget(
      state.clubs,
      state.room.rules,
      nextState.picks,
      state.playerPool,
      state.room.roomCode,
      pickEvent
    );

    const resultingVersion = prevVersion + 1;
    const updatedRules: DraftRules = {
      ...state.room.rules,
      stateVersion: resultingVersion,
      confirmedPicks: nextState.picks,
      clubBudgets: reconciledClubs.map((c) => ({
        id: c.id,
        memberId: c.memberId,
        code: c.code,
        budget: c.budget,
        spentBudget: c.spentBudget,
        squadPlayerIds: c.squadPlayerIds,
      })),
    };

    let updatedRoom = {
      ...state.room,
      rules: updatedRules,
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const intermediateState: RoomFullState = {
      ...state,
      room: updatedRoom,
      clubs: reconciledClubs,
      draftState: nextState,
    };

    memoryRooms[state.room.id] = intermediateState;
    persistRoomLocal(intermediateState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        // 1. Authoritatively update multiplayer_rooms with rules containing confirmedPicks and clubBudgets
        const { error: roomUpdateErr } = await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);
        if (roomUpdateErr) {
          console.warn('multiplayer_rooms update error in makePick:', roomUpdateErr.message || roomUpdateErr);
        }

        // 2. Resilient upsert into draft_picks (only if table is available and not unauthorized)
        if (isDraftPicksTableAvailable) {
          try {
            const { error: pickErr } = await supabase.from('draft_picks').upsert({
              id: newPick.id,
              room_id: state.room.id,
              round: newPick.round,
              pick_index_in_round: newPick.pickIndexInRound,
              global_pick_number: newPick.globalPickNumber,
              member_id: newPick.memberId,
              club_id: newPick.clubId,
              player_id: newPick.playerId,
              selected_at: newPick.selectedAt,
              is_auto_pick: newPick.isAutoPick,
              time_taken_seconds: newPick.timeTakenSeconds,
            });
            if (pickErr) {
              const code = String((pickErr as any).code || '');
              const msg = String(pickErr.message || '').toLowerCase();
              if (code === '42501' || msg.includes('permission denied') || (pickErr as any).status === 401) {
                isDraftPicksTableAvailable = false;
              }
            }
          } catch (e1: any) {
            if (e1?.status === 401 || String(e1?.message).includes('401')) {
              isDraftPicksTableAvailable = false;
            }
          }
        }

        // 3. Update squad_player_ids on draft_clubs
        const updatedClubItem = reconciledClubs.find((c) => c.id === club.id);
        if (updatedClubItem) {
          await supabase
            .from('draft_clubs')
            .update({
              squad_player_ids: updatedClubItem.squadPlayerIds,
            })
            .eq('id', club.id);
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'DRAFT_PICK', resultingVersion);
      });
    }

    recordTelemetryEvent(
      isAutoPick ? 'AUTO_PICK' : 'DRAFT_PICK',
      {
        playerId,
        playerName: pickedPlayer ? `${pickedPlayer.firstName} ${pickedPlayer.lastName}` : playerId,
        playerOverall: pickedPlayer?.overall || 75,
        playerPosition: pickedPlayer?.position || 'CM',
        round: newPick.round,
        pickIndex: newPick.pickIndexInRound,
        isAutoPick,
        timeTakenSeconds: newPick.timeTakenSeconds,
      },
      state.room.id
    );

    logMultiplayerAction(
      isAutoPick ? 'AUTO_PICK' : 'PLAYER_PICK',
      state.room.id,
      member.sessionId,
      prevVersion,
      resultingVersion,
      true,
      undefined,
      {
        playerId,
        playerName: pickedPlayer ? `${pickedPlayer.firstName} ${pickedPlayer.lastName}` : playerId,
        overall: pickedPlayer?.overall,
        position: pickedPlayer?.position,
        isAutoPick,
      }
    );

    // If draft finished, execute canonical finalization transaction
    if (nextState.isCompleted) {
      return this.finalizeDraftLeague(state.room.id);
    }

    return { success: true, state: intermediateState };
  }

  /**
   * Automatically executes a Bot's draft pick if current turn is a Bot.
   */
  public static processBotDraftTurn(
    roomId: string
  ): { didPick: boolean; state?: RoomFullState; error?: string } {
    let state = this.getRoom(roomId);
    if (!state || !state.draftState) {
      const local = loadRoomLocal(roomId);
      if (local?.draftState) {
        state = local;
        memoryRooms[state.room.id] = state;
      }
    }
    if (!state || !state.draftState || state.draftState.isCompleted || state.draftState.isPaused) {
      return { didPick: false };
    }

    const currentTurnMemberId = state.draftState.currentTurnMemberId;
    const currentMember = state.members.find((m) => m.id === currentTurnMemberId);
    if (!currentMember || !currentMember.isBot) {
      return { didPick: false };
    }

    const club = state.clubs.find((c) => c.memberId === currentMember.id);
    if (!club) return { didPick: false };

    const pool = (state.playerPool && state.playerPool.length > 0) ? state.playerPool : getCachedDraftPlayerPool();
    state.playerPool = pool;

    const pickedPlayerIds = new Set(state.draftState.picks.map((p) => p.playerId));
    let chosenPlayer = chooseBotDraftPick(
      pool,
      pickedPlayerIds,
      club.squadPlayerIds,
      state.room.rules,
      currentMember.botDifficulty || 'ORTA',
      currentMember.botPersonality || 'Dengeli',
      state.draftState.picks,
      club
    );

    if (!chosenPlayer) {
      chosenPlayer = pool.find((p) => !pickedPlayerIds.has(p.id)) || null;
    }

    if (!chosenPlayer) {
      return { didPick: false };
    }

    let res = this.makePick(state.room.id, currentMember.id, chosenPlayer.id, false);
    if (!res.success) {
      console.warn(`[processBotDraftTurn] Primary bot pick failed for ${currentMember.username} (${res.error}), trying cheapest fallback player`);
      const cheapest = pool
        .filter((p) => !pickedPlayerIds.has(p.id))
        .sort((a, b) => (a.draftValue ?? calculatePlayerDraftValue(a)) - (b.draftValue ?? calculatePlayerDraftValue(b)))[0];
      if (cheapest && cheapest.id !== chosenPlayer.id) {
        res = this.makePick(state.room.id, currentMember.id, cheapest.id, true);
      }
    }

    return { didPick: res.success, state: res.state, error: res.error };
  }

  /**
   * Server-authoritative post-draft finalization transaction (Idempotent).
   */
  public static finalizeDraftLeague(
    roomId: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const clubs = state.clubs;
    const playerPool = state.playerPool;
    const rules = state.room.rules;
    const squadSize = rules.squadSize || 18;

    // 0. Ensure club squadPlayerIds are fully populated from draftState.picks
    if (state.draftState && state.draftState.picks.length > 0) {
      for (const club of clubs) {
        const clubPicks = state.draftState.picks.filter(
          (p) => p.clubId === club.id || p.memberId === club.memberId
        );
        if (clubPicks.length > 0) {
          club.squadPlayerIds = clubPicks.map((p) => p.playerId);
        }
      }
    }

    // 1. Validate all squads have exact required squad size (auto-recover if any pick was dropped)
    for (const club of clubs) {
      if (club.squadPlayerIds.length < squadSize) {
        const pickedIds = new Set(clubs.flatMap((c) => c.squadPlayerIds));
        const missingCount = squadSize - club.squadPlayerIds.length;
        const available = playerPool.filter((p) => !pickedIds.has(p.id));
        for (let i = 0; i < missingCount && i < available.length; i++) {
          club.squadPlayerIds.push(available[i].id);
          pickedIds.add(available[i].id);
        }
      }
    }

    // 2. Validate no duplicate player ownership
    const seen = new Set<string>();
    for (const club of clubs) {
      club.squadPlayerIds = club.squadPlayerIds.filter((id) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    const currentSeason = state.room.seasonNumber || rules.seasonNumber || 1;

    // 3. Generate fixtures idempotently
    let fixtures = state.fixtures;
    if (fixtures.length === 0) {
      fixtures = generateDraftLeagueFixtures(state.room.id, clubs, rules.format, currentSeason);
    }

    // 4. Generate tactics for all clubs
    fixtures = fixtures.map((f) => {
      const homeC = clubs.find((c) => c.id === f.homeClubId);
      const awayC = clubs.find((c) => c.id === f.awayClubId);
      const homeM = state.members.find((m) => m.id === homeC?.memberId);
      const awayM = state.members.find((m) => m.id === awayC?.memberId);

      const homeTactics =
        f.homeTactics ||
        (homeC
          ? homeM?.isBot
            ? generateBotTactics(homeC.id, homeC.squadPlayerIds, playerPool, homeM.botDifficulty, homeM.botPersonality)
            : generateDefaultDraftTactics(homeC.id, homeC.squadPlayerIds, playerPool)
          : undefined);

      const awayTactics =
        f.awayTactics ||
        (awayC
          ? awayM?.isBot
            ? generateBotTactics(awayC.id, awayC.squadPlayerIds, playerPool, awayM.botDifficulty, awayM.botPersonality)
            : generateDefaultDraftTactics(awayC.id, awayC.squadPlayerIds, playerPool)
          : undefined);

      return { ...f, homeTactics, awayTactics };
    });

    // 5. Generate standings idempotently (unique by clubId)
    let standings = state.standings;
    if (standings.length === 0) {
      standings = initializeDraftStandings(clubs);
    } else {
      const seenClubIds = new Set<string>();
      standings = standings.filter((s) => {
        if (seenClubIds.has(s.clubId)) return false;
        seenClubIds.add(s.clubId);
        return true;
      });
      for (const club of clubs) {
        if (!seenClubIds.has(club.id)) {
          standings.push({
            rank: standings.length + 1,
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
          });
        }
      }
    }

    const totalMatchweeks = fixtures.length > 0 ? Math.max(...fixtures.map((f) => f.round), 1) : 6;
    const currentMatchweek = state.room.currentMatchweek || 1;
    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;
    const initialSeasonStats = computeSeasonPlayerStats(fixtures, clubs, playerPool, currentSeason).playerStats;

    const updatedRules: DraftRules = {
      ...state.room.rules,
      seasonNumber: currentSeason,
      seasonPlayerStats: initialSeasonStats,
      fixtures,
      standings,
      currentMatchweek,
      totalMatchweeks,
      leaguePhase: 'MATCHWEEK_PREP',
      stateVersion: resultingVersion,
    };

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: 'LEAGUE_ACTIVE',
      seasonNumber: currentSeason,
      seasonPlayerStats: initialSeasonStats,
      currentMatchweek,
      totalMatchweeks,
      leaguePhase: 'MATCHWEEK_PREP',
      rules: updatedRules,
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      clubs,
      fixtures,
      standings,
      seasonPlayerStats: initialSeasonStats,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'LEAGUE_ACTIVE',
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        for (const club of clubs) {
          await supabase
            .from('draft_clubs')
            .update({ squad_player_ids: club.squadPlayerIds })
            .eq('id', club.id);
        }

        if (fixtures.length > 0) {
          const fixRows = fixtures.map((f) => ({
            id: f.id,
            room_id: state.room.id,
            round: f.round,
            home_club_id: f.homeClubId,
            away_club_id: f.awayClubId,
            status: f.status,
            home_tactics: f.homeTactics,
            away_tactics: f.awayTactics,
            home_score: f.homeScore,
            away_score: f.awayScore,
            match_result: f.matchResult,
            simulated_at: f.simulatedAt,
          }));
          await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
        }

        if (standings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = standings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (e) {
            console.warn('Standings sync warning:', e);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'START_LEAGUE', resultingVersion);
      });
    }

    logMultiplayerAction('START_LEAGUE' as any, state.room.id, 'system', prevVersion, resultingVersion, true, undefined, {
      matchweeks: totalMatchweeks,
      fixturesCount: fixtures.length,
    });

    return { success: true, state: newState };
  }

  /**
   * Async server-authoritative post-draft finalization transaction (Awaited DB writes, Single In-Flight Owner).
   */
  public static async finalizeDraftLeagueAsync(
    roomId: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    if (this.finalizingRooms.has(roomId)) {
      return this.finalizingRooms.get(roomId)!;
    }

    const task = (async () => {
      try {
        console.log('LEAGUE_FINALIZATION_START', roomId);
        const syncRes = this.finalizeDraftLeague(roomId);
        if (!syncRes.success || !syncRes.state) {
          return syncRes;
        }

        const supabase = getSupabaseClient();
        if (supabase) {
          const state = syncRes.state;
          const { room, clubs, fixtures, standings } = state;

          await supabase
            .from('multiplayer_rooms')
            .update({
              status: 'LEAGUE_ACTIVE',
              rules: room.rules,
              updated_at: new Date().toISOString(),
            })
            .eq('id', room.id);

          await Promise.all(
            clubs.map((club) =>
              supabase
                .from('draft_clubs')
                .update({ squad_player_ids: club.squadPlayerIds })
                .eq('id', club.id)
            )
          );

          if (fixtures.length > 0) {
            const fixRows = fixtures.map((f) => ({
              id: f.id,
              room_id: room.id,
              round: f.round,
              home_club_id: f.homeClubId,
              away_club_id: f.awayClubId,
              status: f.status,
              home_tactics: f.homeTactics,
              away_tactics: f.awayTactics,
              home_score: f.homeScore,
              away_score: f.awayScore,
              match_result: f.matchResult,
              simulated_at: f.simulatedAt,
            }));
            await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
          }

          if (standings.length > 0) {
            try {
              await supabase.from('draft_standings').delete().eq('room_id', room.id);
              const rows = standings.map((s) => ({
                room_id: room.id,
                club_id: s.clubId,
                rank: s.rank,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                goals_for: s.goalsFor,
                goals_against: s.goalsAgainst,
                goal_difference: s.goalDifference,
                points: s.points,
                form: s.form,
              }));
              await supabase.from('draft_standings').insert(rows);
            } catch (stErr) {
              console.warn('Finalize standings sync warning:', stErr);
            }
          }
        }

        console.log('LEAGUE_FINALIZATION_END', roomId);
        return syncRes;
      } finally {
        this.finalizingRooms.delete(roomId);
      }
    })();

    this.finalizingRooms.set(roomId, task);
    return task;
  }

  /**
   * Advances the league to the next matchweek:
   * 1. Simulates any unplayed / bot fixtures in current matchweek.
   * 2. Updates standings and league awards.
   * 3. Increments currentMatchweek (or sets LEAGUE_COMPLETED).
   */
  public static advanceMatchweek(
    roomId: string,
    memberId?: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const currentMatchweek = state.room.currentMatchweek || 1;
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...state.fixtures.map((f) => f.round), 1);

    // Find all fixtures of current matchweek
    const mwFixtures = state.fixtures.filter((f) => f.round === currentMatchweek);
    let updatedFixtures = [...state.fixtures];

    // Simulate unplayed fixtures in this matchweek
    for (const fix of mwFixtures) {
      if (fix.status !== 'COMPLETED') {
        const homeClub = state.clubs.find((c) => c.id === fix.homeClubId);
        const awayClub = state.clubs.find((c) => c.id === fix.awayClubId);
        if (homeClub && awayClub) {
          const homeM = state.members.find((m) => m.id === homeClub.memberId);
          const awayM = state.members.find((m) => m.id === awayClub.memberId);

          const homeTactics =
            fix.homeTactics ||
            (homeM?.isBot
              ? generateBotTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool, homeM.botDifficulty, homeM.botPersonality)
              : generateDefaultDraftTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool));

          const awayTactics =
            fix.awayTactics ||
            (awayM?.isBot
              ? generateBotTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool, awayM.botDifficulty, awayM.botPersonality)
              : generateDefaultDraftTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool));

          const { updatedFixture } = simulateDraftFixture(
            fix,
            homeClub,
            awayClub,
            homeTactics,
            awayTactics,
            state.playerPool
          );

          updatedFixtures = updatedFixtures.map((f) => (f.id === fix.id ? updatedFixture : f));
        }
      }
    }

    // Recompute authoritative standings directly from all completed fixtures for current season
    const currentSeasonNumber = state.room.seasonNumber || state.room.rules?.seasonNumber || 1;
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures, currentSeasonNumber);
    const seasonStatsRes = computeSeasonPlayerStats(updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
    const updatedSeasonPlayerStats = seasonStatsRes.playerStats;

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const isSeasonComplete = currentMatchweek >= totalMatchweeks;
    const nextMatchweek = isSeasonComplete ? currentMatchweek : currentMatchweek + 1;
    const roomStatus = isSeasonComplete ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE';
    const leaguePhase = isSeasonComplete ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP';

    let awards = state.awards;
    if (isSeasonComplete) {
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
    }

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: roomStatus,
      currentMatchweek: nextMatchweek,
      totalMatchweeks,
      leaguePhase,
      stateVersion: resultingVersion,
      seasonPlayerStats: updatedSeasonPlayerStats,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
      seasonPlayerStats: updatedSeasonPlayerStats,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: roomStatus,
            rules: {
              ...state.room.rules,
              fixtures: updatedFixtures,
              standings: updatedStandings,
              currentMatchweek: nextMatchweek,
              totalMatchweeks,
              leaguePhase,
              stateVersion: resultingVersion,
              awards,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        if (updatedFixtures.length > 0) {
          const fixRows = updatedFixtures.map((f) => ({
            id: f.id,
            room_id: state.room.id,
            round: f.round,
            home_club_id: f.homeClubId,
            away_club_id: f.awayClubId,
            status: f.status,
            home_tactics: f.homeTactics,
            away_tactics: f.awayTactics,
            home_score: f.homeScore,
            away_score: f.awayScore,
            match_result: f.matchResult,
            simulated_at: f.simulatedAt,
          }));
          await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
        }

        if (updatedStandings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = updatedStandings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (e) {
            console.warn('Standings advance sync warning:', e);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'ADVANCE_MATCHWEEK', resultingVersion);
      });
    }

    logMultiplayerAction('SIMULATE_MATCH', state.room.id, memberId || 'system', prevVersion, resultingVersion, true, undefined, {
      completedMatchweek: currentMatchweek,
      nextMatchweek,
      isSeasonComplete,
    });

    return { success: true, state: newState };
  }

  /**
   * Sets or unsets a manager's READY state for the current matchweek.
   * When all required human managers give HAZIR, automatically initiates 3-2-1 COUNTDOWN.
   */
  public static setMatchweekReady(
    roomId: string,
    memberId: string,
    isReady: boolean
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const currentMatchweek = state.room.currentMatchweek || 1;
    let liveMw: LiveMatchweekState = state.room.rules.liveMatchweek && state.room.rules.liveMatchweek.matchweek === currentMatchweek
      ? { ...state.room.rules.liveMatchweek }
      : {
          matchweek: currentMatchweek,
          status: 'PREPARING',
          readyMemberIds: [],
          completedMemberIds: [],
        };

    // If matches are already LIVE, cannot alter ready status
    if (liveMw.status === 'LIVE') {
      return { success: false, error: 'Haftanın maçları şu anda canlı oynanıyor.' };
    }

    const member = state.members.find((m) => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Menajer odada bulunamadı.' };
    }

    let readyIds = new Set(liveMw.readyMemberIds || []);
    if (isReady) {
      readyIds.add(memberId);
    } else {
      readyIds.delete(memberId);
      // If was in countdown, abort countdown back to preparing
      if (liveMw.status === 'COUNTDOWN') {
        liveMw.status = 'PREPARING';
        delete liveMw.countdownStartedAt;
      }
    }

    liveMw.readyMemberIds = Array.from(readyIds);

    // Check if all required human managers in room are ready
    const humanManagers = state.members.filter((m) => !m.isBot && !m.isSpectator);
    const allHumansReady = humanManagers.length > 0 && humanManagers.every((m) => liveMw.readyMemberIds.includes(m.id));

    if (allHumansReady && liveMw.status === 'PREPARING') {
      liveMw.status = 'COUNTDOWN';
      liveMw.countdownStartedAt = new Date().toISOString();
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      stateVersion: resultingVersion,
      liveMatchweek: liveMw,
      rules: {
        ...state.room.rules,
        liveMatchweek: liveMw,
        stateVersion: resultingVersion,
      },
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: state.room.status,
            rules: {
              ...state.room.rules,
              fixtures: state.fixtures,
              standings: state.standings,
              currentMatchweek,
              totalMatchweeks: state.room.totalMatchweeks,
              liveMatchweek: liveMw,
              stateVersion: resultingVersion,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'MATCHWEEK_READY', resultingVersion);
      });
    }

    logMultiplayerAction('MATCHWEEK_READY', state.room.id, memberId, prevVersion, resultingVersion, true, undefined, {
      matchweek: currentMatchweek,
      isReady,
      allReady: allHumansReady,
      status: liveMw.status,
    });

    return { success: true, state: newState };
  }

  /**
   * Starts live matches for the matchweek simultaneously for all players and devices.
   * Pre-simulates deterministic match outcomes and timestamps the kickoff.
   */
  public static launchLiveMatchweek(
    roomId: string,
    triggeredByMemberId?: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const currentMatchweek = state.room.currentMatchweek || 1;
    let liveMw: LiveMatchweekState = state.room.rules.liveMatchweek && state.room.rules.liveMatchweek.matchweek === currentMatchweek
      ? { ...state.room.rules.liveMatchweek }
      : {
          matchweek: currentMatchweek,
          status: 'PREPARING',
          readyMemberIds: [],
        };

    // Idempotency: cannot launch twice
    if (liveMw.status === 'LIVE') {
      return { success: true, state };
    }

    // Pre-simulate all uncompleted fixtures for current matchweek
    let updatedFixtures = [...state.fixtures];
    const mwFixtures = updatedFixtures.filter((f) => f.round === currentMatchweek);

    for (const fix of mwFixtures) {
      if (fix.status !== 'COMPLETED') {
        const homeClub = state.clubs.find((c) => c.id === fix.homeClubId);
        const awayClub = state.clubs.find((c) => c.id === fix.awayClubId);
        if (homeClub && awayClub) {
          const homeM = state.members.find((m) => m.id === homeClub.memberId);
          const awayM = state.members.find((m) => m.id === awayClub.memberId);

          const homeTactics =
            fix.homeTactics ||
            homeClub.tactics ||
            (homeM?.isBot
              ? generateBotTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool, homeM.botDifficulty, homeM.botPersonality)
              : generateDefaultDraftTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool));

          const awayTactics =
            fix.awayTactics ||
            awayClub.tactics ||
            (awayM?.isBot
              ? generateBotTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool, awayM.botDifficulty, awayM.botPersonality)
              : generateDefaultDraftTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool));

          const { updatedFixture } = simulateDraftFixture(
            fix,
            homeClub,
            awayClub,
            homeTactics,
            awayTactics,
            state.playerPool
          );

          // Mark as SIMULATING with full precomputed matchResult
          updatedFixtures = updatedFixtures.map((f) =>
            f.id === fix.id
              ? {
                  ...updatedFixture,
                  status: 'SIMULATING',
                }
              : f
          );
        }
      }
    }

    liveMw = {
      matchweek: currentMatchweek,
      status: 'LIVE',
      readyMemberIds: liveMw.readyMemberIds || [],
      startedAt: new Date().toISOString(),
      paceMs: 800, // 800ms per minute -> total game ~ 72 seconds
      completedMemberIds: [],
    };

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: 'LEAGUE_ACTIVE',
      stateVersion: resultingVersion,
      liveMatchweek: liveMw,
      rules: {
        ...state.room.rules,
        fixtures: updatedFixtures,
        currentMatchweek,
        liveMatchweek: liveMw,
        stateVersion: resultingVersion,
      },
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      fixtures: updatedFixtures,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'LEAGUE_ACTIVE',
            rules: {
              ...state.room.rules,
              fixtures: updatedFixtures,
              standings: state.standings,
              currentMatchweek,
              totalMatchweeks: state.room.totalMatchweeks,
              liveMatchweek: liveMw,
              stateVersion: resultingVersion,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'START_LIVE_MATCHWEEK', resultingVersion);
      });
    }

    logMultiplayerAction('START_LIVE_MATCHWEEK', state.room.id, triggeredByMemberId || 'system', prevVersion, resultingVersion, true, undefined, {
      matchweek: currentMatchweek,
      fixturesCount: mwFixtures.length,
    });

    return { success: true, state: newState };
  }

  /**
   * Finalizes the live matchweek once the 90th minute has concluded:
   * 1. Marks all current week fixtures as COMPLETED.
   * 2. Authoritatively updates standings and league awards.
   * 3. Advances to next matchweek or marks LEAGUE_COMPLETED.
   * 4. Resets liveMatchweek to PREPARING for the next week.
   */
  public static finishLiveMatchweek(
    roomId: string,
    memberId?: string,
    completedFixture?: DraftFixture
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const currentMatchweek = state.room.currentMatchweek || 1;
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...state.fixtures.map((f) => f.round), 1);

    // 1. Merge completedFixture if provided
    let updatedFixtures = state.fixtures.map((f) =>
      completedFixture && f.id === completedFixture.id
        ? { ...f, ...completedFixture, status: 'COMPLETED' as const }
        : f
    );

    // 2. Ensure ALL fixtures in the current matchweek are completed with real Match Engine results
    const roundFixtures = updatedFixtures.filter((f) => f.round === currentMatchweek);
    for (const fix of roundFixtures) {
      const isAlreadyCompleted =
        (fix.status === 'COMPLETED' || (fix.status as string) === 'FINISHED') &&
        fix.homeScore !== undefined &&
        fix.awayScore !== undefined;

      if (!isAlreadyCompleted) {
        const homeClub = state.clubs.find((c) => c.id === fix.homeClubId);
        const awayClub = state.clubs.find((c) => c.id === fix.awayClubId);
        if (homeClub && awayClub) {
          const homeM = state.members.find((m) => m.id === homeClub.memberId);
          const awayM = state.members.find((m) => m.id === awayClub.memberId);

          const homeTactics =
            fix.homeTactics ||
            homeClub.tactics ||
            (homeM?.isBot
              ? generateBotTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool, homeM.botDifficulty, homeM.botPersonality)
              : generateDefaultDraftTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool));

          const awayTactics =
            fix.awayTactics ||
            awayClub.tactics ||
            (awayM?.isBot
              ? generateBotTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool, awayM.botDifficulty, awayM.botPersonality)
              : generateDefaultDraftTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool));

          const { updatedFixture } = simulateDraftFixture(
            fix,
            homeClub,
            awayClub,
            homeTactics,
            awayTactics,
            state.playerPool
          );
          updatedFixtures = updatedFixtures.map((f) => (f.id === fix.id ? updatedFixture : f));
        }
      }
    }

    // 3. Mark all current week fixtures as COMPLETED
    updatedFixtures = updatedFixtures.map((f) =>
      f.round === currentMatchweek ? { ...f, status: 'COMPLETED' as const } : f
    );

    // 4. Calculate authoritative standings and player stats from all completed fixtures
    const currentSeasonNumber = state.room.seasonNumber || state.room.rules?.seasonNumber || 1;
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures, currentSeasonNumber);
    const seasonStatsRes = computeSeasonPlayerStats(updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
    const updatedSeasonPlayerStats = seasonStatsRes.playerStats;

    // 5. Check if all fixtures across the league are completed
    const nextUnfinished = updatedFixtures.find(
      (f) => f.status !== 'COMPLETED' && (f.status as string) !== 'FINISHED'
    );
    const isSeasonComplete = !nextUnfinished;
    const nextMatchweek = nextUnfinished ? nextUnfinished.round : totalMatchweeks;
    const roomStatus = isSeasonComplete ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE';
    const leaguePhase = isSeasonComplete ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP';

    let awards = state.awards;
    if (isSeasonComplete) {
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
    }

    const nextLiveMw: LiveMatchweekState = {
      matchweek: nextMatchweek,
      status: isSeasonComplete ? 'COMPLETED' : 'PREPARING',
      readyMemberIds: [],
      completedMemberIds: [],
      paceMs: state.room.liveMatchweek?.paceMs || 800,
    };

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: roomStatus,
      currentMatchweek: nextMatchweek,
      totalMatchweeks,
      leaguePhase,
      liveMatchweek: nextLiveMw,
      stateVersion: resultingVersion,
      seasonNumber: currentSeasonNumber,
      seasonPlayerStats: updatedSeasonPlayerStats,
      rules: {
        ...state.room.rules,
        seasonNumber: currentSeasonNumber,
        seasonPlayerStats: updatedSeasonPlayerStats,
        fixtures: updatedFixtures,
        standings: updatedStandings,
        currentMatchweek: nextMatchweek,
        totalMatchweeks,
        leaguePhase,
        liveMatchweek: nextLiveMw,
        stateVersion: resultingVersion,
        awards,
      },
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
      seasonPlayerStats: updatedSeasonPlayerStats,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: roomStatus,
            rules: {
              ...state.room.rules,
              fixtures: updatedFixtures,
              standings: updatedStandings,
              currentMatchweek: nextMatchweek,
              totalMatchweeks,
              leaguePhase,
              liveMatchweek: nextLiveMw,
              stateVersion: resultingVersion,
              awards,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        if (updatedStandings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = updatedStandings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (stErr) {
            console.warn('draft_standings sync notice:', stErr);
          }
        }

        if (updatedFixtures.length > 0) {
          try {
            const fixRows = updatedFixtures.map((f) => ({
              id: f.id,
              room_id: state.room.id,
              round: f.round,
              home_club_id: f.homeClubId,
              away_club_id: f.awayClubId,
              status: f.status,
              home_tactics: f.homeTactics,
              away_tactics: f.awayTactics,
              home_score: f.homeScore,
              away_score: f.awayScore,
              match_result: f.matchResult,
              simulated_at: f.simulatedAt,
            }));
            await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
          } catch (fxErr) {
            console.warn('draft_fixtures sync notice:', fxErr);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'FINISH_LIVE_MATCHWEEK', resultingVersion);
      });
    }

    logMultiplayerAction('FINISH_LIVE_MATCHWEEK', state.room.id, memberId || 'system', prevVersion, resultingVersion, true, undefined, {
      completedMatchweek: currentMatchweek,
      nextMatchweek,
      isSeasonComplete,
    });

    return { success: true, state: newState };
  }

  /**
   * Diagnostic / Host repair tool to fix missing fixtures, standings, or matchweeks without data loss.
   */
  public static repairRoomState(
    roomId: string,
    hostMemberId?: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const clubs = state.clubs;
    const playerPool = state.playerPool;
    const rules = state.room.rules;
    const squadSize = rules.squadSize || 18;

    // Ensure squadPlayerIds are populated from draft picks if available
    if (state.draftState && state.draftState.picks.length > 0) {
      for (const club of clubs) {
        const clubPicks = state.draftState.picks.filter(
          (p) => p.clubId === club.id || p.memberId === club.memberId
        );
        if (clubPicks.length > 0) {
          club.squadPlayerIds = clubPicks.map((p) => p.playerId);
        }
      }
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const currentSeason = state.room.seasonNumber || state.room.rules?.seasonNumber || 1;
    let fixtures = state.fixtures;
    if (fixtures.length === 0 && state.clubs.length >= 2) {
      fixtures = generateDraftLeagueFixtures(state.room.id, state.clubs, state.room.rules.format, currentSeason);
    }

    let standings = state.standings;
    if (standings.length === 0 && state.clubs.length >= 2) {
      standings = computeStandingsFromFixtures(clubs, fixtures, currentSeason);
    } else {
      const seen = new Set<string>();
      standings = standings.filter((s) => {
        if (seen.has(s.clubId)) return false;
        seen.add(s.clubId);
        return true;
      });
      for (const club of clubs) {
        if (!seen.has(club.id)) {
          standings.push({
            rank: standings.length + 1,
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
          });
        }
      }
    }

    const totalMatchweeks = fixtures.length > 0 ? Math.max(...fixtures.map((f) => f.round), 1) : 6;
    const firstUnfinished = fixtures.find((f) => f.status !== 'COMPLETED');
    const currentMatchweek = firstUnfinished ? firstUnfinished.round : totalMatchweeks;
    const allDone = fixtures.length > 0 && fixtures.every((f) => f.status === 'COMPLETED');

    const seasonStatsRes = computeSeasonPlayerStats(fixtures, state.clubs, state.playerPool, currentSeason);
    const awards = allDone ? computeLeagueAwards(standings, fixtures, state.clubs, state.playerPool, currentSeason) : state.awards;

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: allDone ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE',
      currentMatchweek,
      totalMatchweeks,
      leaguePhase: allDone ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP',
      stateVersion: resultingVersion,
      seasonNumber: currentSeason,
      seasonPlayerStats: seasonStatsRes.playerStats,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      clubs,
      fixtures,
      standings,
      awards,
      seasonPlayerStats: seasonStatsRes.playerStats,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: updatedRoom.status,
            rules: {
              ...state.room.rules,
              seasonNumber: currentSeason,
              seasonPlayerStats: seasonStatsRes.playerStats,
              fixtures,
              standings,
              currentMatchweek,
              totalMatchweeks,
              leaguePhase: updatedRoom.leaguePhase,
              stateVersion: resultingVersion,
              awards,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        for (const club of clubs) {
          await supabase
            .from('draft_clubs')
            .update({ squad_player_ids: club.squadPlayerIds })
            .eq('id', club.id);
        }

        if (fixtures.length > 0) {
          const fixRows = fixtures.map((f) => ({
            id: f.id,
            room_id: state.room.id,
            round: f.round,
            home_club_id: f.homeClubId,
            away_club_id: f.awayClubId,
            status: f.status,
            home_tactics: f.homeTactics,
            away_tactics: f.awayTactics,
            home_score: f.homeScore,
            away_score: f.awayScore,
            match_result: f.matchResult,
            simulated_at: f.simulatedAt,
          }));
          await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
        }

        if (standings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = standings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (e) {
            console.warn('Standings repair sync warning:', e);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'REPAIR_ROOM', resultingVersion);
      });
    }

    return { success: true, state: newState };
  }

  /**
   * Async Diagnostic / Host repair tool (Awaited DB writes, Single In-Flight Owner).
   */
  public static async repairRoomStateAsync(
    roomId: string,
    hostMemberId?: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode }> {
    if (this.repairingRooms.has(roomId)) {
      return this.repairingRooms.get(roomId)!;
    }

    const task = (async () => {
      try {
        console.log('LEAGUE_REPAIR_START', roomId);
        const syncRes = this.repairRoomState(roomId, hostMemberId);
        if (!syncRes.success || !syncRes.state) {
          return syncRes;
        }

        const supabase = getSupabaseClient();
        if (supabase) {
          const state = syncRes.state;
          const { room, clubs, fixtures, standings } = state;

          await supabase
            .from('multiplayer_rooms')
            .update({
              status: room.status,
              rules: room.rules,
              updated_at: new Date().toISOString(),
            })
            .eq('id', room.id);

          await Promise.all(
            clubs.map((club) =>
              supabase
                .from('draft_clubs')
                .update({ squad_player_ids: club.squadPlayerIds })
                .eq('id', club.id)
            )
          );

          if (fixtures.length > 0) {
            const fixRows = fixtures.map((f) => ({
              id: f.id,
              room_id: room.id,
              round: f.round,
              home_club_id: f.homeClubId,
              away_club_id: f.awayClubId,
              status: f.status,
              home_tactics: f.homeTactics,
              away_tactics: f.awayTactics,
              home_score: f.homeScore,
              away_score: f.awayScore,
              match_result: f.matchResult,
              simulated_at: f.simulatedAt,
            }));
            await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
          }

          if (standings.length > 0) {
            try {
              await supabase.from('draft_standings').delete().eq('room_id', room.id);
              const rows = standings.map((s) => ({
                room_id: room.id,
                club_id: s.clubId,
                rank: s.rank,
                played: s.played,
                won: s.won,
                drawn: s.drawn,
                lost: s.lost,
                goals_for: s.goalsFor,
                goals_against: s.goalsAgainst,
                goal_difference: s.goalDifference,
                points: s.points,
                form: s.form,
              }));
              await supabase.from('draft_standings').insert(rows);
            } catch (e) {
              console.warn('Repair standings sync warning:', e);
            }
          }
        }

        console.log('LEAGUE_REPAIR_END', roomId);
        return syncRes;
      } finally {
        this.repairingRooms.delete(roomId);
      }
    })();

    this.repairingRooms.set(roomId, task);
    return task;
  }

  /**
   * Checks turn timeout and executes auto-pick if timer expired.
   */
  public static checkTurnTimeout(roomId: string): { timedOut: boolean; state?: RoomFullState } {
    const state = this.getRoom(roomId);
    if (!state || !state.draftState || state.draftState.isCompleted || state.draftState.isPaused) {
      return { timedOut: false };
    }

    const now = Date.now();
    if (state.room.rules.pickTimerSeconds > 0 && now >= state.draftState.pickDeadline) {
      const currentMemberId = state.draftState.currentTurnMemberId;
      const club = state.clubs.find((c) => c.memberId === currentMemberId);
      if (!club) return { timedOut: false };

      const pickedPlayerIds = new Set(state.draftState.picks.map((p) => p.playerId));
      const autoPick = determineAutoPick(
        state.playerPool,
        pickedPlayerIds,
        club.squadPlayerIds,
        state.room.rules,
        state.draftState.currentRound,
        club
      );

      if (autoPick) {
        const res = this.makePick(roomId, currentMemberId, autoPick.id, true);
        return { timedOut: true, state: res.state };
      }
    }

    return { timedOut: false, state };
  }

  /**
   * Updates tactics for a club's upcoming match.
   */
  public static updateClubTactics(
    roomId: string,
    memberId: string,
    tactics: ClubTactics
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const club = state.clubs.find((c) => c.memberId === memberId && c.id === tactics.clubId);
    if (!club) {
      const err = formatMultiplayerError('SC-MP-007', 'Bu kulübün taktiğini düzenleme yetkiniz yok');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    // Update tactics on the club itself AND in all awaiting fixtures
    const updatedClubs = state.clubs.map((c) => (c.id === club.id ? { ...c, tactics } : c));
    const updatedFixtures = state.fixtures.map((f) => {
      if (f.status === 'AWAITING_TACTICS' || f.status === 'READY') {
        if (f.homeClubId === club.id) return { ...f, homeTactics: tactics };
        if (f.awayClubId === club.id) return { ...f, awayTactics: tactics };
      }
      return f;
    });

    const newState: RoomFullState = {
      ...state,
      clubs: updatedClubs,
      fixtures: updatedFixtures,
      room: { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    broadcastRealtimeUpdate(state.room.roomCode, 'SUBMIT_TACTICS', resultingVersion);

    const member = state.members.find((m) => m.id === memberId);
    logMultiplayerAction('SUBMIT_TACTICS', state.room.id, member?.sessionId || memberId, prevVersion, resultingVersion, true, undefined, {
      formation: tactics.formation,
    });

    return { success: true, state: newState };
  }

  /**
   * Simulates a single fixture server-side and updates standings.
   */
  public static simulateFixture(
    roomId: string,
    fixtureId: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const fixture = state.fixtures.find((f) => f.id === fixtureId);
    if (!fixture) {
      const err = formatMultiplayerError('SC-MP-007', 'Fikstür maçı bulunamadı');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }
    if (fixture.status === 'COMPLETED') {
      const err = formatMultiplayerError('SC-MP-006');
      return { success: false, error: err.message, errorCode: 'SC-MP-006' };
    }

    const homeClub = state.clubs.find((c) => c.id === fixture.homeClubId);
    const awayClub = state.clubs.find((c) => c.id === fixture.awayClubId);
    if (!homeClub || !awayClub) {
      const err = formatMultiplayerError('SC-MP-007', 'Eşleşen kulüpler bulunamadı');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const homeM = state.members.find((m) => m.id === homeClub.memberId);
    const awayM = state.members.find((m) => m.id === awayClub.memberId);

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const homeTactics =
      fixture.homeTactics ||
      homeClub.tactics ||
      (homeM?.isBot
        ? generateBotTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool, homeM.botDifficulty, homeM.botPersonality)
        : generateDefaultDraftTactics(homeClub.id, homeClub.squadPlayerIds, state.playerPool));

    const awayTactics =
      fixture.awayTactics ||
      awayClub.tactics ||
      (awayM?.isBot
        ? generateBotTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool, awayM.botDifficulty, awayM.botPersonality)
        : generateDefaultDraftTactics(awayClub.id, awayClub.squadPlayerIds, state.playerPool));

    const { updatedFixture } = simulateDraftFixture(
      fixture,
      homeClub,
      awayClub,
      homeTactics,
      awayTactics,
      state.playerPool
    );

    let updatedFixtures = state.fixtures.map((f) => (f.id === fixtureId ? updatedFixture : f));

    // Auto-simulate unplayed bot-vs-bot matches in the same matchweek
    const targetRound = fixture.round;
    const pendingBotFixtures = updatedFixtures.filter((f) => {
      if (f.round !== targetRound || f.status === 'COMPLETED' || f.id === fixtureId) return false;
      const hClub = state.clubs.find((c) => c.id === f.homeClubId);
      const aClub = state.clubs.find((c) => c.id === f.awayClubId);
      const hMember = state.members.find((m) => m.id === hClub?.memberId);
      const aMember = state.members.find((m) => m.id === aClub?.memberId);
      return hMember?.isBot && aMember?.isBot;
    });

    for (const botFix of pendingBotFixtures) {
      const hClub = state.clubs.find((c) => c.id === botFix.homeClubId);
      const aClub = state.clubs.find((c) => c.id === botFix.awayClubId);
      if (hClub && aClub) {
        const hM = state.members.find((m) => m.id === hClub.memberId);
        const aM = state.members.find((m) => m.id === aClub.memberId);
        const hTactics =
          botFix.homeTactics ||
          generateBotTactics(hClub.id, hClub.squadPlayerIds, state.playerPool, hM?.botDifficulty, hM?.botPersonality);
        const aTactics =
          botFix.awayTactics ||
          generateBotTactics(aClub.id, aClub.squadPlayerIds, state.playerPool, aM?.botDifficulty, aM?.botPersonality);
        const { updatedFixture: simBotFix } = simulateDraftFixture(
          botFix,
          hClub,
          aClub,
          hTactics,
          aTactics,
          state.playerPool
        );
        updatedFixtures = updatedFixtures.map((f) => (f.id === botFix.id ? simBotFix : f));
      }
    }

    // Recompute authoritative standings directly from all completed fixtures for current season
    const currentSeasonNumber = state.room.seasonNumber || state.room.rules?.seasonNumber || 1;
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures, currentSeasonNumber);
    const seasonStatsRes = computeSeasonPlayerStats(updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
    const updatedSeasonPlayerStats = seasonStatsRes.playerStats;

    // Check matchweek progression and whole league completion
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...updatedFixtures.map((f) => f.round), 1);
    const nextUnfinished = updatedFixtures.find((f) => f.status !== 'COMPLETED');
    const nextMatchweek = nextUnfinished ? nextUnfinished.round : totalMatchweeks;
    const allCompleted = updatedFixtures.every((f) => f.status === 'COMPLETED');

    let awards: LeagueAwards | undefined = state.awards;
    let roomStatus = state.room.status;

    if (allCompleted) {
      roomStatus = 'LEAGUE_COMPLETED';
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool, currentSeasonNumber);
      recordTelemetryEvent('LEAGUE_COMPLETED', { champion: awards.championClubName }, state.room.id);
    }

    const newState: RoomFullState = {
      ...state,
      room: {
        ...state.room,
        status: roomStatus,
        currentMatchweek: nextMatchweek,
        totalMatchweeks,
        leaguePhase: allCompleted ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP',
        stateVersion: resultingVersion,
        seasonNumber: currentSeasonNumber,
        seasonPlayerStats: updatedSeasonPlayerStats,
        updatedAt: new Date().toISOString(),
      },
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
      seasonPlayerStats: updatedSeasonPlayerStats,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: roomStatus,
            rules: {
              ...state.room.rules,
              seasonNumber: currentSeasonNumber,
              seasonPlayerStats: updatedSeasonPlayerStats,
              fixtures: updatedFixtures,
              standings: updatedStandings,
              currentMatchweek: nextMatchweek,
              totalMatchweeks,
              leaguePhase: allCompleted ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP',
              stateVersion: resultingVersion,
              awards,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        if (updatedFixtures.length > 0) {
          const fixRows = updatedFixtures.map((f) => ({
            id: f.id,
            room_id: state.room.id,
            round: f.round,
            home_club_id: f.homeClubId,
            away_club_id: f.awayClubId,
            status: f.status,
            home_tactics: f.homeTactics,
            away_tactics: f.awayTactics,
            home_score: f.homeScore,
            away_score: f.awayScore,
            match_result: f.matchResult,
            simulated_at: f.simulatedAt,
          }));
          await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
        }

        if (updatedStandings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = updatedStandings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (e) {
            console.warn('Standings simulate sync warning:', e);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'SIMULATE_MATCH', resultingVersion);
      });
    }

    recordTelemetryEvent(
      'MATCH_SIMULATED',
      {
        fixtureId,
        homeScore: updatedFixture.homeScore,
        awayScore: updatedFixture.awayScore,
        homeFormation: homeTactics.formation,
        awayFormation: awayTactics.formation,
        totalShots: (updatedFixture.matchResult?.home.stats.shots || 10) + (updatedFixture.matchResult?.away.stats.shots || 10),
        totalXg: (updatedFixture.matchResult?.home.stats.xG || 1.2) + (updatedFixture.matchResult?.away.stats.xG || 1.1),
      },
      state.room.id
    );

    logMultiplayerAction('SIMULATE_MATCH', state.room.id, 'server-engine', prevVersion, resultingVersion, true, undefined, {
      fixtureId,
      score: `${updatedFixture.homeScore} - ${updatedFixture.awayScore}`,
    });

    return { success: true, state: newState };
  }

  /**
   * Updates match presentation speed (1x, 2x, 3x, 4x) for live matchweek.
   */
  public static updateMatchSpeed(
    roomId: string,
    hostMemberId: string,
    matchSpeed: 1 | 2 | 3 | 4
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca oda kurucusu maç hızını değiştirebilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    // Pace in ms per minute: 1x=800ms (~72s), 2x=400ms (~36s), 3x=266ms (~24s), 4x=200ms (~18s)
    const paceMs = matchSpeed === 4 ? 200 : matchSpeed === 3 ? 266 : matchSpeed === 2 ? 400 : 800;

    const updatedLiveMw: LiveMatchweekState = {
      ...(state.room.liveMatchweek || {
        matchweek: state.room.currentMatchweek || 1,
        status: 'PREPARING',
        readyMemberIds: [],
      }),
      paceMs,
    };

    const updatedRules: DraftRules = {
      ...state.room.rules,
      matchSpeed,
      liveMatchweek: updatedLiveMw,
      stateVersion: resultingVersion,
    };

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      liveMatchweek: updatedLiveMw,
      rules: updatedRules,
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        broadcastRealtimeUpdate(state.room.roomCode, 'MATCH_SPEED_UPDATED', resultingVersion);
      });
    }

    return { success: true, state: newState };
  }

  /**
   * Saves interactive live match simulation result and authoritatively updates matchweek standings.
   */
  public static saveLiveMatchResult(
    roomId: string,
    completedFixture: DraftFixture,
    memberId?: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    return this.finishLiveMatchweek(roomId, memberId, completedFixture);
  }

  /**
   * Starts a new league season with the existing squads, lineups, and tactics (True Rematch).
   * Preserves: same room, managers, bots, bot difficulties, clubs, 18/18 squad players, tactics, formations, matchSpeed.
   * Resets: Standings (all 0s), new season fixtures (with seasonNumber), matchweek -> 1, ready states -> false (bots true), liveMatchweek -> PREPARING, awards -> undefined, seasonPlayerStats -> {}.
   * Archives: completed season into seasonHistory.
   */
  public static rematch(
    roomId: string,
    hostMemberId: string,
    keepClubs: boolean = true
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }
    if (state.room.hostMemberId !== hostMemberId) {
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca kurucu yeni sezon başlatabilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const currentSeason = state.room.seasonNumber || state.room.rules?.seasonNumber || 1;
    const nextSeason = currentSeason + 1;

    // 1. Compute and archive completed season into history
    const previousAwards = state.awards || computeLeagueAwards(state.standings, state.fixtures, state.clubs, state.playerPool, currentSeason);
    const championClub = state.clubs.find((c) => c.id === previousAwards.championClubId) || state.clubs.find((c) => c.name === previousAwards.championClubName) || state.clubs[0];
    
    const archivedSeason: PastSeasonHistory = {
      seasonNumber: currentSeason,
      championClubId: previousAwards.championClubId || state.standings[0]?.clubId || championClub?.id || '',
      championClubName: previousAwards.championClubName || state.standings[0]?.clubName || championClub?.name || 'Şampiyon',
      championManagerName: championClub?.managerName || previousAwards.championClubName || 'Menajer',
      championBadge: championClub?.badge,
      finalStandings: [...state.standings],
      topScorer: previousAwards.topScorer ? {
        playerId: previousAwards.topScorer.playerId,
        playerName: previousAwards.topScorer.playerName,
        clubName: previousAwards.topScorer.clubName,
        goals: previousAwards.topScorer.goals,
        matches: previousAwards.topScorer.matches,
      } : undefined,
      topAssists: previousAwards.topAssists ? {
        playerId: previousAwards.topAssists.playerId,
        playerName: previousAwards.topAssists.playerName,
        clubName: previousAwards.topAssists.clubName,
        assists: previousAwards.topAssists.assists,
        matches: previousAwards.topAssists.matches,
      } : undefined,
      mvp: previousAwards.bestRating ? {
        playerId: previousAwards.bestRating.playerId,
        playerName: previousAwards.bestRating.playerName,
        clubName: previousAwards.bestRating.clubName,
        rating: previousAwards.bestRating.rating,
        matches: previousAwards.bestRating.matches,
      } : undefined,
      completedAt: new Date().toISOString(),
    };

    const existingHistory = state.seasonHistory || state.room.rules?.seasonHistory || [];
    const updatedSeasonHistory = [...existingHistory, archivedSeason];

    // 2. Generate brand new fixtures tagged with nextSeason and format fix-${roomId}-s${seasonNumber}-r${round}-${idx}
    const newFixtures = generateDraftLeagueFixtures(
      state.room.id,
      state.clubs,
      state.room.rules.format,
      nextSeason
    );

    // Attach tactics to fixtures if already set
    const finalizedNewFixtures = newFixtures.map((f) => {
      const homeC = state.clubs.find((c) => c.id === f.homeClubId);
      const awayC = state.clubs.find((c) => c.id === f.awayClubId);
      const homeM = state.members.find((m) => m.id === homeC?.memberId);
      const awayM = state.members.find((m) => m.id === awayC?.memberId);

      const homeTactics =
        homeC?.tactics ||
        (homeC
          ? homeM?.isBot
            ? generateBotTactics(homeC.id, homeC.squadPlayerIds, state.playerPool, homeM.botDifficulty, homeM.botPersonality)
            : generateDefaultDraftTactics(homeC.id, homeC.squadPlayerIds, state.playerPool)
          : undefined);

      const awayTactics =
        awayC?.tactics ||
        (awayC
          ? awayM?.isBot
            ? generateBotTactics(awayC.id, awayC.squadPlayerIds, state.playerPool, awayM.botDifficulty, awayM.botPersonality)
            : generateDefaultDraftTactics(awayC.id, awayC.squadPlayerIds, state.playerPool)
          : undefined);

      return { ...f, homeTactics, awayTactics };
    });

    // 3. Reset standings table (all 0s)
    const resetStandings = initializeDraftStandings(state.clubs);

    // 4. Reset member ready states (humans false, bots true)
    const updatedMembers = state.members.map((m) => ({
      ...m,
      isReady: Boolean(m.isBot),
    }));

    // 5. Reset liveMatchweek state to PREPARING for Week 1
    const totalMatchweeks = Math.max(...finalizedNewFixtures.map((f) => f.round), 1);
    const paceMs = state.room.liveMatchweek?.paceMs || (state.room.rules?.matchSpeed === 4 ? 200 : state.room.rules?.matchSpeed === 3 ? 266 : state.room.rules?.matchSpeed === 2 ? 400 : 800);
    const newLiveMw: LiveMatchweekState = {
      matchweek: 1,
      status: 'PREPARING',
      readyMemberIds: [],
      completedMemberIds: [],
      paceMs,
    };

    // 6. Clubs remain EXACTLY the same: 18/18 squads preserved, tactics preserved, budget preserved
    const preservedClubs = state.clubs;

    const updatedRules: DraftRules = {
      ...state.room.rules,
      seasonNumber: nextSeason,
      seasonHistory: updatedSeasonHistory,
      seasonPlayerStats: {},
      awards: undefined,
      currentMatchweek: 1,
      totalMatchweeks,
      fixtures: finalizedNewFixtures,
      standings: resetStandings,
      liveMatchweek: newLiveMw,
      stateVersion: resultingVersion,
    };

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: 'LEAGUE_ACTIVE',
      seasonNumber: nextSeason,
      seasonHistory: updatedSeasonHistory,
      seasonPlayerStats: {},
      currentMatchweek: 1,
      totalMatchweeks,
      leaguePhase: 'MATCHWEEK_PREP',
      liveMatchweek: newLiveMw,
      rules: updatedRules,
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      members: updatedMembers,
      clubs: preservedClubs,
      fixtures: finalizedNewFixtures,
      standings: resetStandings,
      awards: undefined,
      seasonHistory: updatedSeasonHistory,
      seasonPlayerStats: {},
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'LEAGUE_ACTIVE',
            current_matchweek: 1,
            total_matchweeks: totalMatchweeks,
            league_phase: 'MATCHWEEK_PREP',
            rules: updatedRules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', state.room.id);

        // Reset human members is_ready
        for (const m of updatedMembers) {
          await supabase
            .from('multiplayer_members')
            .update({ is_ready: m.isReady })
            .eq('id', m.id);
        }

        // Upsert new season fixtures
        if (finalizedNewFixtures.length > 0) {
          const fixRows = finalizedNewFixtures.map((f) => ({
            id: f.id,
            room_id: state.room.id,
            round: f.round,
            home_club_id: f.homeClubId,
            away_club_id: f.awayClubId,
            status: f.status,
            home_tactics: f.homeTactics,
            away_tactics: f.awayTactics,
            home_score: f.homeScore,
            away_score: f.awayScore,
            match_result: f.matchResult,
            simulated_at: f.simulatedAt,
          }));
          await supabase.from('draft_fixtures').upsert(fixRows, { onConflict: 'id' });
        }

        // Delete old standings and insert reset standings
        if (resetStandings.length > 0) {
          try {
            await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
            const rows = resetStandings.map((s) => ({
              room_id: state.room.id,
              club_id: s.clubId,
              rank: s.rank,
              played: s.played,
              won: s.won,
              drawn: s.drawn,
              lost: s.lost,
              goals_for: s.goalsFor,
              goals_against: s.goalsAgainst,
              goal_difference: s.goalDifference,
              points: s.points,
              form: s.form,
            }));
            await supabase.from('draft_standings').insert(rows);
          } catch (stErr) {
            console.warn('Standings rematch sync notice:', stErr);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'REMATCH', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === hostMemberId);
    logMultiplayerAction('REMATCH', state.room.id, member?.sessionId || hostMemberId, prevVersion, resultingVersion, true, undefined, {
      seasonNumber: nextSeason,
    });

    return { success: true, state: newState };
  }
}
