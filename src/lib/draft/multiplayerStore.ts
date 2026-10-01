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
import { getCachedDraftPlayerPool, calculatePlayerDraftValue } from './playerPool';
import { createDefaultBadgeConfig } from './badgeGenerator';
import { FICTIONAL_CLUB_PRESETS } from './clubValidation';
import { resolveMemberConnection, evaluateHostMigration } from './sessionManager';
import {
  simulateDraftFixture,
  updateDraftStandings,
  computeLeagueAwards,
  computeStandingsFromFixtures,
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

  const picks: DraftPick[] = rawPicks.map((p) => ({
    id: p.id,
    roomId: p.room_id || p.roomId || roomId,
    round: p.round,
    pickIndexInRound: p.pick_index_in_round ?? p.pickIndexInRound ?? 0,
    globalPickNumber: p.global_pick_number ?? p.globalPickNumber ?? 0,
    memberId: p.member_id || p.memberId,
    clubId: p.club_id || p.clubId,
    playerId: p.player_id || p.playerId,
    selectedAt: p.selected_at || p.selectedAt || new Date().toISOString(),
    isAutoPick: Boolean(p.is_auto_pick ?? p.isAutoPick),
    timeTakenSeconds: p.time_taken_seconds ?? p.timeTakenSeconds ?? 0,
    draftPrice: p.draft_price !== undefined ? Number(p.draft_price) : (p.draftPrice !== undefined ? Number(p.draftPrice) : undefined),
  }));

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
function mapDbMember(m: any): RoomMember {
  const isBot = Boolean(m.is_bot || m.session_id?.startsWith('bot-session-') || m.id?.includes('bot'));
  return {
    id: m.id,
    roomId: m.room_id,
    sessionId: m.session_id,
    username: m.username,
    isHost: Boolean(m.is_host),
    isSpectator: Boolean(m.is_spectator),
    isReady: Boolean(m.is_ready),
    isBot,
    botDifficulty: isBot ? (m.bot_difficulty || 'ORTA') : undefined,
    botPersonality: isBot ? (m.bot_personality || 'Dengeli') : undefined,
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
  return {
    id: f.id,
    roomId: f.room_id,
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

export class DraftMultiplayerStore {
  /**
   * Checks whether the Supabase multiplayer backend is configured and responsive.
   */
  public static isServerConnected(): boolean {
    return getIsSupabaseConfigured() && Boolean(getSupabaseClient());
  }

  /**
   * Subscribes to real-time room events (Supabase Broadcast + Postgres Changes).
   */
  public static subscribeToRoom(
    roomCode: string,
    onUpdate: (event: { type: string; payload?: any }) => void
  ): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const cleanCode = roomCode.trim().toUpperCase();
    const channelName = `squadcraft_room_${cleanCode}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'ROOM_UPDATE' }, (payload) => {
        onUpdate({ type: 'BROADCAST_ROOM_UPDATE', payload });
      })
      .on('broadcast', { event: 'START_DRAFT' }, (payload) => {
        onUpdate({ type: 'BROADCAST_START_DRAFT', payload });
      })
      .on('broadcast', { event: 'ROOM_CLOSED' }, (payload) => {
        onUpdate({ type: 'BROADCAST_ROOM_CLOSED', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'multiplayer_rooms', filter: `room_code=eq.${cleanCode}` }, (payload) => {
        onUpdate({ type: 'PG_ROOM', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'multiplayer_members' }, (payload) => {
        onUpdate({ type: 'PG_MEMBER', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_clubs' }, (payload) => {
        onUpdate({ type: 'PG_CLUB', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, (payload) => {
        onUpdate({ type: 'PG_PICK', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_fixtures' }, (payload) => {
        onUpdate({ type: 'PG_FIXTURE', payload });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Connected to realtime
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Realtime channel remove warning:', e);
      }
    };
  }

  /**
   * One canonical hydration function for all room pages.
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

      // AUTO-REPAIR / FINALIZATION CHECK:
      // If draft state is complete or status is DRAFTING with full picks, guarantee transition to LEAGUE_ACTIVE
      const totalPicksRequired = (state.room.rules.squadSize || 18) * state.members.filter((m) => !m.isSpectator).length;
      const isDraftFinished = state.draftState?.isCompleted || (state.draftState?.picks.length || 0) >= totalPicksRequired;

      if (isDraftFinished && (state.room.status === 'DRAFTING' || state.room.status === 'DRAFT_FINALIZING' || state.fixtures.length === 0 || state.standings.length === 0)) {
        const finalRes = this.finalizeDraftLeague(state.room.id);
        if (finalRes.success && finalRes.state) {
          state = finalRes.state;
        }
      }

      const currentMember = state.members.find((m) => m.sessionId === sessionId);
      const currentClub = currentMember ? state.clubs.find((c) => c.memberId === currentMember.id) : undefined;
      const isHost = currentMember?.isHost || false;

      // If drafting, ensure draftState is guaranteed non-null
      if (state.room.status === 'DRAFTING' && !state.draftState) {
        state.draftState = reconstructDraftState(state.room.id, state.members, state.room.rules, []);
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
   * Creates a new multiplayer Draft League room asynchronously with Supabase persistence.
   */
  public static async createRoomAsync(
    hostUsername: string,
    sessionId: string,
    rules: DraftRules = PRESET_CLOSED_ALPHA_4,
    roomName?: string
  ): Promise<{ success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode; details?: string }> {
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

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // 1. Insert room
        const { error: roomErr } = await supabase.from('multiplayer_rooms').insert({
          id: roomId,
          room_code: roomCode,
          name: room.name,
          host_member_id: memberId,
          status: 'LOBBY',
          rules: rules,
          created_at: room.createdAt,
          updated_at: room.updatedAt,
        });

        if (roomErr) {
          console.error('Supabase room insert failure:', roomErr);
          return {
            success: false,
            error: 'Oda oluşturulamadı.',
            errorCode: 'SC-MP-011',
            details: roomErr.message,
          };
        }

        // 2. Insert host member
        const { error: memErr } = await supabase.from('multiplayer_members').insert({
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
        });

        if (memErr) {
          console.error('Supabase member insert failure:', memErr);
          return {
            success: false,
            error: 'Oda kurucusu eklenemedi.',
            errorCode: 'SC-MP-011',
            details: memErr.message,
          };
        }

        // 3. Insert host club
        const { error: clubErr } = await supabase.from('draft_clubs').insert({
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
        });

        if (clubErr) {
          console.error('Supabase club insert failure:', clubErr);
          return {
            success: false,
            error: 'Oda kulübü oluşturulamadı.',
            errorCode: 'SC-MP-011',
            details: clubErr.message,
          };
        }
      } catch (err: any) {
        console.error('Database transaction error during room creation:', err);
        return {
          success: false,
          error: 'Veritabanı bağlantı hatası.',
          errorCode: 'SC-MP-011',
          details: err?.message || 'Bilinmeyen veritabanı hatası',
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
      safeDbRun(() => DraftMultiplayerStore.createRoomAsync(hostUsername, sessionId, rules, roomName));
    }

    return state;
  }

  /**
   * Fetches room state from Supabase or local cache.
   */
  public static async fetchRoom(roomIdOrCode: string): Promise<RoomFullState | null> {
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
          const rawMembers: RoomMember[] = (dbRoom.multiplayer_members || []).map(mapDbMember);
          const members: RoomMember[] = rawMembers.filter(
            (m) =>
              !removedIds.has(m.id) &&
              !m.sessionId?.startsWith('removed-') &&
              !m.sessionId?.startsWith('deleted-') &&
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
          const fixtures: DraftFixture[] = dbFixtures.length > 0 && dbFixtures.some((f) => f.status === 'COMPLETED')
            ? dbFixtures
            : rulesFixtures.length > 0
            ? rulesFixtures
            : dbFixtures;

          const standings: DraftStanding[] = computeStandingsFromFixtures(clubs, fixtures);

          if (room.rules?.currentMatchweek && (!room.currentMatchweek || room.currentMatchweek < room.rules.currentMatchweek)) {
            room.currentMatchweek = room.rules.currentMatchweek;
          }
          if (room.rules?.totalMatchweeks && !room.totalMatchweeks) {
            room.totalMatchweeks = room.rules.totalMatchweeks;
          }

          let draftState: DraftState | undefined = undefined;

          // If drafting or league active/completed, fetch picks and reconstruct draftState
          if (
            room.status === 'DRAFTING' ||
            room.status === 'DRAFT_FINALIZING' ||
            room.status === 'LEAGUE_READY' ||
            room.status === 'LEAGUE_ACTIVE' ||
            room.status === 'LEAGUE_COMPLETED' ||
            fixtures.length > 0
          ) {
            const { data: dbPicks } = await supabase
              .from('draft_picks')
              .select('*')
              .eq('room_id', room.id)
              .order('global_pick_number', { ascending: true });

            const localRoom = loadRoomLocal(room.id) || loadRoomLocal(room.roomCode);
            const memPicks = memoryRooms[room.id]?.draftState?.picks || [];
            const localPicks = localRoom?.draftState?.picks || [];

            const mergedPickMap = new Map<string, any>();
            (dbPicks || []).forEach((p: any) => mergedPickMap.set(p.id, p));
            memPicks.forEach((p) => {
              if (!mergedPickMap.has(p.id)) {
                mergedPickMap.set(p.id, p);
              } else {
                const existing = mergedPickMap.get(p.id);
                if (p.draftPrice !== undefined && existing.draftPrice === undefined) {
                  existing.draftPrice = p.draftPrice;
                }
              }
            });
            localPicks.forEach((p) => {
              if (!mergedPickMap.has(p.id)) {
                mergedPickMap.set(p.id, p);
              } else {
                const existing = mergedPickMap.get(p.id);
                if (p.draftPrice !== undefined && existing.draftPrice === undefined) {
                  existing.draftPrice = p.draftPrice;
                }
              }
            });
            const allPicks = Array.from(mergedPickMap.values());

            draftState = reconstructDraftState(room.id, members, room.rules, allPicks);

            // Merge any squads that already exist in memory / local storage
            const memClubs = memoryRooms[room.id]?.clubs || localRoom?.clubs || [];
            if (memClubs.length > 0) {
              clubs = clubs.map((c) => {
                const mc = memClubs.find((m) => m.id === c.id || m.memberId === c.memberId);
                return {
                  ...c,
                  squadPlayerIds: Array.from(new Set([...(c.squadPlayerIds || []), ...(mc?.squadPlayerIds || [])])),
                  spentBudget: Math.max(c.spentBudget || 0, mc?.spentBudget || 0),
                };
              });
            }

            // Authoritatively reconcile and guarantee club squadPlayerIds and budget from canonical draft picks
            clubs = reconcileClubsBudget(clubs, room.rules, draftState?.picks || [], getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM');
          } else {
            // Check if draft already has picks in memory or local storage
            const localRoom = loadRoomLocal(room.id) || loadRoomLocal(room.roomCode);
            const memPicks = memoryRooms[room.id]?.draftState?.picks || localRoom?.draftState?.picks || [];
            if (memPicks.length > 0) {
              clubs = reconcileClubsBudget(clubs, room.rules, memPicks, getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM_LOBBY_RECOVER');
            } else {
              clubs = reconcileClubsBudget(clubs, room.rules, [], getCachedDraftPlayerPool(), room.roomCode, 'FETCH_ROOM_LOBBY');
            }
          }

          let state: RoomFullState = {
            room,
            members,
            clubs,
            draftState,
            fixtures,
            standings,
            playerPool: getCachedDraftPlayerPool(),
          };

          // AUTO-REPAIR / FINALIZATION CHECK:
          // If all required picks are completed, but status is still DRAFTING, or fixtures/standings are missing:
          const totalPicksRequired = (room.rules.squadSize || 18) * members.filter((m) => !m.isSpectator).length;
          const isDraftFinished = draftState?.isCompleted || (draftState?.picks.length || 0) >= totalPicksRequired;

          if (
            isDraftFinished &&
            (room.status === 'DRAFTING' ||
              room.status === 'DRAFT_FINALIZING' ||
              fixtures.length === 0 ||
              standings.length === 0)
          ) {
            memoryRooms[room.id] = state;
            const finalRes = this.finalizeDraftLeague(room.id);
            if (finalRes.success && finalRes.state) {
              state = finalRes.state;
            }
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
        await supabase.from('multiplayer_members').upsert({
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
        });

        if (newClubToInsert) {
          await supabase.from('draft_clubs').upsert({
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
          });
        }

        broadcastRealtimeUpdate(cleanCode, 'JOIN_ROOM', resultingVersion);
      } catch (e) {
        console.warn('Supabase joinRoomAsync write error:', e);
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
      (m) => !m.isSpectator && !removedIds.has(m.id) && !m.sessionId?.startsWith('removed-')
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

    const botMember: RoomMember = {
      id: botMemberId,
      roomId: state.room.id,
      sessionId: `bot-session-${botMemberId}`,
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
      (m) => !m.isSpectator && !removedIds.has(m.id) && !m.sessionId?.startsWith('removed-')
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

    const botMember: RoomMember = {
      id: botMemberId,
      roomId: state.room.id,
      sessionId: `bot-session-${botMemberId}`,
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

    const updatedMembers = state.members.map((m) => {
      if (m.id === botMemberId) {
        return {
          ...m,
          username: updates.name ? updates.name : m.username,
          botDifficulty: updates.difficulty || m.botDifficulty,
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

    const newState: RoomFullState = {
      ...state,
      members: updatedMembers,
      clubs: updatedClubs,
      room: { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() },
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        const botM = updatedMembers.find((m) => m.id === botMemberId);
        const botC = updatedClubs.find((c) => c.memberId === botMemberId);
        if (botM) {
          await supabase.from('multiplayer_members').update({ username: botM.username }).eq('id', botMemberId);
        }
        if (botC) {
          await supabase.from('draft_clubs').update({ name: botC.name, manager_name: botC.managerName, badge: botC.badge }).eq('id', botC.id);
        }
        await supabase
          .from('multiplayer_rooms')
          .update({
            rules: { ...state.room.rules, stateVersion: resultingVersion },
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
      const res = this.makePick(roomId, memberId, playerId, isAutoPick);
      if (res.success && res.state) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const club = res.state.clubs.find((c) => c.memberId === memberId);
          const lastPick = res.state.draftState?.picks[res.state.draftState.picks.length - 1];
          if (club && lastPick) {
            try {
              await Promise.all([
                supabase.from('draft_picks').upsert({
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
                }),
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
    const state = this.getRoom(roomId);
    if (!state || !state.draftState) {
      const err = formatMultiplayerError('SC-MP-007', 'Draft aktif değil');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
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
    let updatedRoom = { ...state.room, stateVersion: resultingVersion, updatedAt: new Date().toISOString() };

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
        await supabase.from('draft_picks').insert({
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
    const state = this.getRoom(roomId);
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

    const pickedPlayerIds = new Set(state.draftState.picks.map((p) => p.playerId));
    const chosenPlayer = chooseBotDraftPick(
      state.playerPool,
      pickedPlayerIds,
      club.squadPlayerIds,
      state.room.rules,
      currentMember.botDifficulty || 'ORTA',
      currentMember.botPersonality || 'Dengeli',
      state.draftState.picks,
      club
    );

    if (!chosenPlayer) {
      return { didPick: false };
    }

    const res = this.makePick(roomId, currentMember.id, chosenPlayer.id, false);
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

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    // 3. Generate fixtures idempotently
    let fixtures = state.fixtures;
    if (fixtures.length === 0) {
      fixtures = generateDraftLeagueFixtures(state.room.id, clubs, rules.format);
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

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: 'LEAGUE_ACTIVE',
      currentMatchweek,
      totalMatchweeks,
      leaguePhase: 'MATCHWEEK_PREP',
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      clubs,
      fixtures,
      standings,
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
              fixtures,
              standings,
              currentMatchweek,
              totalMatchweeks,
              leaguePhase: 'MATCHWEEK_PREP',
              stateVersion: resultingVersion,
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

    // Recompute authoritative standings directly from all completed fixtures
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures);

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const isSeasonComplete = currentMatchweek >= totalMatchweeks;
    const nextMatchweek = isSeasonComplete ? currentMatchweek : currentMatchweek + 1;
    const roomStatus = isSeasonComplete ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE';
    const leaguePhase = isSeasonComplete ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP';

    let awards = state.awards;
    if (isSeasonComplete) {
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool);
    }

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: roomStatus,
      currentMatchweek: nextMatchweek,
      totalMatchweeks,
      leaguePhase,
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
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
    memberId?: string
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const currentMatchweek = state.room.currentMatchweek || 1;
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...state.fixtures.map((f) => f.round), 1);

    const updatedFixtures = state.fixtures.map((f) =>
      f.round === currentMatchweek ? { ...f, status: 'COMPLETED' as const } : f
    );

    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures);

    const nextUnfinished = updatedFixtures.find((f) => f.status !== 'COMPLETED');
    const isSeasonComplete = !nextUnfinished;
    const nextMatchweek = nextUnfinished ? nextUnfinished.round : totalMatchweeks;
    const roomStatus = isSeasonComplete ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE';
    const leaguePhase = isSeasonComplete ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP';

    let awards = state.awards;
    if (isSeasonComplete) {
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool);
    }

    const nextLiveMw: LiveMatchweekState = {
      matchweek: nextMatchweek,
      status: isSeasonComplete ? 'COMPLETED' : 'PREPARING',
      readyMemberIds: [],
      completedMemberIds: [],
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
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
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

    let fixtures = state.fixtures;
    if (fixtures.length === 0 && state.clubs.length >= 2) {
      fixtures = generateDraftLeagueFixtures(state.room.id, state.clubs, state.room.rules.format);
    }

    let standings = state.standings;
    if (standings.length === 0 && state.clubs.length >= 2) {
      standings = initializeDraftStandings(state.clubs);
      fixtures.filter((f) => f.status === 'COMPLETED').forEach((f) => {
        standings = updateDraftStandings(standings, f);
      });
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

    const awards = allDone ? computeLeagueAwards(standings, fixtures, state.clubs, state.playerPool) : state.awards;

    const updatedRoom: MultiplayerRoom = {
      ...state.room,
      status: allDone ? 'LEAGUE_COMPLETED' : 'LEAGUE_ACTIVE',
      currentMatchweek,
      totalMatchweeks,
      leaguePhase: allDone ? 'SEASON_COMPLETE' : 'MATCHWEEK_PREP',
      stateVersion: resultingVersion,
      updatedAt: new Date().toISOString(),
    };

    const newState: RoomFullState = {
      ...state,
      room: updatedRoom,
      clubs,
      fixtures,
      standings,
      awards,
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
              fixtures,
              standings,
              currentMatchweek,
              totalMatchweeks,
              leaguePhase: updatedRoom.leaguePhase,
              stateVersion: resultingVersion,
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

    // Recompute authoritative standings directly from all completed fixtures
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures);

    // Check matchweek progression and whole league completion
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...updatedFixtures.map((f) => f.round), 1);
    const nextUnfinished = updatedFixtures.find((f) => f.status !== 'COMPLETED');
    const nextMatchweek = nextUnfinished ? nextUnfinished.round : totalMatchweeks;
    const allCompleted = updatedFixtures.every((f) => f.status === 'COMPLETED');

    let awards: LeagueAwards | undefined = state.awards;
    let roomStatus = state.room.status;

    if (allCompleted) {
      roomStatus = 'LEAGUE_COMPLETED';
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool);
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
        updatedAt: new Date().toISOString(),
      },
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
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
   * Saves interactive live match simulation result and auto-simulates other bot matches in the round.
   */
  public static saveLiveMatchResult(
    roomId: string,
    completedFixture: DraftFixture
  ): { success: boolean; state?: RoomFullState; error?: string; errorCode?: MultiplayerErrorCode } {
    const state = this.getRoom(roomId);
    if (!state) {
      const err = formatMultiplayerError('SC-MP-001');
      return { success: false, error: err.message, errorCode: 'SC-MP-001' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    let updatedFixtures = state.fixtures.map((f) => (f.id === completedFixture.id ? completedFixture : f));

    // Auto-simulate unplayed bot-vs-bot matches in the same matchweek
    const targetRound = completedFixture.round;
    const pendingBotFixtures = updatedFixtures.filter((f) => {
      if (f.round !== targetRound || f.status === 'COMPLETED' || f.id === completedFixture.id) return false;
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

    // Recompute authoritative standings directly from all completed fixtures
    const updatedStandings = computeStandingsFromFixtures(state.clubs, updatedFixtures);

    // Check matchweek progression and whole league completion
    const totalMatchweeks = state.room.totalMatchweeks || Math.max(...updatedFixtures.map((f) => f.round), 1);
    const nextUnfinished = updatedFixtures.find((f) => f.status !== 'COMPLETED');
    const nextMatchweek = nextUnfinished ? nextUnfinished.round : totalMatchweeks;
    const allCompleted = updatedFixtures.every((f) => f.status === 'COMPLETED');

    let awards: LeagueAwards | undefined = state.awards;
    let roomStatus = state.room.status;

    if (allCompleted) {
      roomStatus = 'LEAGUE_COMPLETED';
      awards = computeLeagueAwards(updatedStandings, updatedFixtures, state.clubs, state.playerPool);
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
        updatedAt: new Date().toISOString(),
      },
      fixtures: updatedFixtures,
      standings: updatedStandings,
      awards,
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
            console.warn('Standings live result sync warning:', e);
          }
        }

        broadcastRealtimeUpdate(state.room.roomCode, 'SIMULATE_MATCH', resultingVersion);
      });
    }

    return { success: true, state: newState };
  }

  /**
   * Restarts the league for a rematch.
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
      const err = formatMultiplayerError('SC-MP-007', 'Yalnızca kurucu yeni lig başlatabilir');
      return { success: false, error: err.message, errorCode: 'SC-MP-007' };
    }

    const prevVersion = state.room.stateVersion || 1;
    const resultingVersion = prevVersion + 1;

    const updatedClubs = state.clubs.map((c) => ({
      ...c,
      squadPlayerIds: [],
      budget: state.room.rules.draftBudget || DEFAULT_DRAFT_BUDGET,
      spentBudget: 0,
    }));

    const newState: RoomFullState = {
      ...state,
      room: {
        ...state.room,
        status: 'LOBBY',
        currentMatchweek: 1,
        totalMatchweeks: undefined,
        leaguePhase: 'LOBBY',
        stateVersion: resultingVersion,
        updatedAt: new Date().toISOString(),
      },
      clubs: updatedClubs,
      draftState: undefined,
      fixtures: [],
      standings: [],
      awards: undefined,
    };

    memoryRooms[state.room.id] = newState;
    persistRoomLocal(newState);

    const supabase = getSupabaseClient();
    if (supabase) {
      safeDbRun(async () => {
        await supabase
          .from('multiplayer_rooms')
          .update({
            status: 'LOBBY',
            current_matchweek: 1,
            total_matchweeks: null,
            league_phase: 'LOBBY',
          })
          .eq('id', state.room.id);
        await supabase.from('draft_picks').delete().eq('room_id', state.room.id);
        await supabase.from('draft_fixtures').delete().eq('room_id', state.room.id);
        await supabase.from('draft_standings').delete().eq('room_id', state.room.id);
        broadcastRealtimeUpdate(state.room.roomCode, 'REMATCH', resultingVersion);
      });
    }

    const member = state.members.find((m) => m.id === hostMemberId);
    logMultiplayerAction('REMATCH', state.room.id, member?.sessionId || hostMemberId, prevVersion, resultingVersion, true);

    return { success: true, state: newState };
  }
}
