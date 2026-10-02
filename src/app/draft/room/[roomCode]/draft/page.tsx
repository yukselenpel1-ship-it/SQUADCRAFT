'use client';

import React, { useState, useEffect, use, useRef, Component, ErrorInfo, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  DraftMultiplayerStore,
  RoomFullState,
  HydratedRoomResult,
} from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId } from '@/lib/draft/sessionManager';
import { Player, PlayerPosition } from '@/types/game';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { countSquadPositions, getSnakeTurnMemberId } from '@/lib/draft/draftEngine';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { DEFAULT_DRAFT_BUDGET, MIN_PLAYER_DRAFT_PRICE, DraftPick } from '@/lib/draft/types';
import { calculatePlayerDraftValue } from '@/lib/draft/playerPool';
import {
  Trophy,
  Shield,
  Users,
  Zap,
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Filter,
  ChevronRight,
  Copy,
  CheckCheck,
  Eye,
  HelpCircle,
  MessageSquare,
  Flame,
  Swords,
  UserCheck,
  Bot,
  Activity,
  Layers,
  ChevronDown,
  Coins,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  CheckCircle2,
  LogOut,
} from 'lucide-react';

// ============================================================================
// ERROR BOUNDARY COMPONENT (PREVENTS FULL-PAGE CRASHES)
// ============================================================================
interface ErrorBoundaryProps {
  children: ReactNode;
  roomCode: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DraftErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[DraftErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#04060A] text-[#F3F4F6] flex flex-col items-center justify-center p-4 select-none font-sans">
          <div className="p-8 bg-[#070D14] border-2 border-red-500/60 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl shadow-red-950/40">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-wide text-white font-display">
              Görsel Arayüz Hatası Yakalandı
            </h2>
            <p className="text-xs text-zinc-400">
              Seçim ekranı verisi güvenli şekilde korundu. Sayfayı yenileyerek drafta kaldığınız yerden devam edebilirsiniz.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-left font-mono text-[11px] text-red-300 break-words">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleRetry}
                className="w-full sm:w-auto px-6 py-3 bg-[#00F5A0] hover:bg-[#00D485] text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
              >
                🔄 YENİDEN BAĞLAN
              </button>
              <Link
                href={`/draft/room/${this.props.roomCode}`}
                className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-zinc-700 transition"
              >
                🚪 LOBİYE DÖN
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// TYPES & HELPER FUNCTIONS
// ============================================================================
interface DraftPageProps {
  params: Promise<{ roomCode: string }>;
}

type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';
type SmartFilterPreset = 'ALL' | 'RISING' | 'BEST_FP' | 'STARS' | 'DEVELOPMENT';
type PriceRangeFilter = 'ALL' | 'UNDER_5M' | '5M_15M' | '15M_30M' | '30M_PLUS';
type AgeRangeFilter = 'ALL' | 'YOUTH' | 'PRIME' | 'VETERAN';
type SortField =
  | 'overall'
  | 'price_asc'
  | 'price_desc'
  | 'fp_ratio'
  | 'potential'
  | 'age'
  | 'pace'
  | 'shooting'
  | 'passing'
  | 'defending'
  | 'physical';

export default function LiveDraftPage({ params }: DraftPageProps) {
  const resolvedParams = use(params);
  const roomCode = (resolvedParams.roomCode || '').toUpperCase();

  return (
    <DraftErrorBoundary roomCode={roomCode}>
      <LiveDraftContent roomCode={roomCode} />
    </DraftErrorBoundary>
  );
}

function LiveDraftContent({ roomCode }: { roomCode: string }) {
  const router = useRouter();
  const sessionId = getMultiplayerSessionId();

  // State
  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Smart Filters
  const [posFilter, setPosFilter] = useState<PositionFilter>('ALL');
  const [smartPreset, setSmartPreset] = useState<SmartFilterPreset>('ALL');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('ALL');
  const [ageRange, setAgeRange] = useState<AgeRangeFilter>('ALL');
  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('overall');
  const [visibleCount, setVisibleCount] = useState<number>(50);

  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [mobileTab, setMobileTab] = useState<'pool' | 'card' | 'squad'>('pool');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [isSubmittingPick, setIsSubmittingPick] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [initialElapsed, setInitialElapsed] = useState(0);

  const botProcessingRef = useRef(false);
  const lastStateVersionRef = useRef<number>(0);

  // Local persistent pick tracking to guarantee budget never reverts to €250M
  const localPicksStorageKey = `squadcraft_confirmed_picks_${roomCode}`;
  const localSpentStorageKey = `squadcraft_confirmed_spent_${roomCode}`;

  const [localConfirmedPicks, setLocalConfirmedPicks] = useState<DraftPick[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(localPicksStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [localConfirmedSpent, setLocalConfirmedSpent] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem(localSpentStorageKey);
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Reset pagination slice when any filter changes
  useEffect(() => {
    setVisibleCount(50);
  }, [posFilter, smartPreset, priceRange, ageRange, onlyAffordable, searchQuery, sortBy]);

  // Helper to trigger and chain bot draft turns snappily without waiting for 3s poll intervals
  const triggerBotTurnIfNeeded = (state: RoomFullState, myMemberId?: string) => {
    if (!state.draftState || state.draftState.isCompleted || botProcessingRef.current) {
      if (
        state.draftState?.isCompleted ||
        state.room.status === 'LEAGUE_ACTIVE' ||
        state.room.status === 'LEAGUE_COMPLETED'
      ) {
        router.push(`/draft/room/${roomCode}/league`);
      }
      return;
    }

    const turnMemberId = state.draftState.currentTurnMemberId;
    const turnMember = state.members.find((m) => m.id === turnMemberId);
    if (turnMember && turnMember.isBot) {
      botProcessingRef.current = true;
      setTimeout(() => {
        try {
          const pickRes = DraftMultiplayerStore.processBotDraftTurn(state.room.id);
          botProcessingRef.current = false;
          if (pickRes.didPick && pickRes.state) {
            const nextState = pickRes.state;
            setHydrationResult((prev) => ({
              ...prev,
              state: nextState,
              isMyTurn: nextState.draftState?.currentTurnMemberId === (myMemberId || prev.currentMember?.id),
            }));

            if (
              nextState.draftState?.isCompleted ||
              nextState.room.status === 'LEAGUE_ACTIVE' ||
              nextState.room.status === 'LEAGUE_COMPLETED'
            ) {
              router.push(`/draft/room/${roomCode}/league`);
              return;
            }

            // Chain to next bot if consecutive bot turns
            triggerBotTurnIfNeeded(nextState, myMemberId);
          } else {
            console.warn('[DraftPage] Bot pick returned false, error:', pickRes.error);
          }
        } catch (botErr) {
          console.error('[DraftPage] Bot pick processing error:', botErr);
        } finally {
          botProcessingRef.current = false;
        }
      }, 250);
    }
  };

  // Canonical hydration loop
  const hydrate = async (isBackground = false) => {
    if (isBackground && hasLoadedOnce) {
      setIsSyncing(true);
    }
    try {
      DraftMultiplayerStore.checkTurnTimeout(roomCode);
      const res = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId);

      if (res.status === 'SUCCESS' && res.state) {
        setHydrationResult(res);
        setHasLoadedOnce(true);
        lastStateVersionRef.current = res.state.room.stateVersion || 1;

        // Route Guards
        if (res.state.room.status === 'CLOSED' || res.state.room.status === 'TERMINATED') {
          alert('Oda kurucusu odadan ayrıldığı için oda kapatıldı.');
          router.push('/');
          return;
        }
        if (res.state.room.status === 'LOBBY') {
          router.push(`/draft/room/${roomCode}`);
          return;
        }
        if (
          res.state.room.status === 'LEAGUE_ACTIVE' ||
          res.state.room.status === 'LEAGUE_COMPLETED' ||
          res.state.draftState?.isCompleted
        ) {
          router.push(`/draft/room/${roomCode}/league`);
          return;
        }

        // Auto-Trigger Bot Pick if it's Bot turn
        triggerBotTurnIfNeeded(res.state, res.currentMember?.id);

        // Update timer
        if (res.state.draftState && res.state.room.rules.pickTimerSeconds > 0) {
          const remaining = Math.max(0, Math.ceil((res.state.draftState.pickDeadline - Date.now()) / 1000));
          setTimeLeft(remaining);
        }
      } else {
        if (!hasLoadedOnce) {
          setHydrationResult(res);
        }
      }
    } catch (err: any) {
      console.warn('Hydration warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    hydrate();

    // 1. Realtime broadcast & Postgres changes listener
    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, (event) => {
      if (event?.type === 'BROADCAST_ROOM_CLOSED') {
        alert('Oda kurucusu odadan ayrıldığı için oda kapatıldı.');
        router.push('/');
        return;
      }
      hydrate(true);
    });

    // 2. Tab visibility & focus listeners
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        hydrate(true);
      }
    };
    const handleFocus = () => hydrate(true);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // 3. Fallback polling loop (every 3 seconds)
    const pollTimer = setInterval(() => {
      hydrate(true);
    }, 3000);

    // 4. Local clock countdown
    const clockTimer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Initial timeout helper
    const initialElapsedTimer = setInterval(() => {
      setInitialElapsed((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
      clearInterval(clockTimer);
      clearInterval(initialElapsedTimer);
    };
  }, [roomCode]);

  // Copy room code pill helper
  const copyRoomCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // ==========================================================================
  // 1. INITIAL LOADING SCREEN
  // ==========================================================================
  if (!hasLoadedOnce && hydrationResult.status === 'LOADING' && initialElapsed < 7) {
    return (
      <div className="min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 select-none font-sans">
        <div className="p-8 bg-[#070D14] border border-zinc-800 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF] animate-pulse">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white font-display">
              DRAFT ARENASI YÜKLENİYOR
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Oda {roomCode} • Oyuncu veritabanı 2.0 ve bütçe motoru senkronize ediliyor...
            </p>
          </div>
          <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-[#00D4FF] to-[#00F5A0] h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, (initialElapsed / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // 2. ERROR / NOT FOUND / TIMEOUT STATES
  // ==========================================================================
  if (!hasLoadedOnce && (hydrationResult.status === 'NOT_FOUND' || hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR')) {
    return (
      <div className="min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 select-none font-sans">
        <div className="p-8 bg-[#070D14] border-2 border-zinc-800 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white font-display">
              {hydrationResult.status === 'NOT_FOUND' ? 'Oda Bulunamadı' : 'Bağlantı Kurulamadı'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {hydrationResult.errorMessage || 'Draft odası verisi alınırken bir sorun oluştu.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setInitialElapsed(0);
                hydrate();
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#00F5A0] hover:bg-[#00D485] text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg active:scale-95"
            >
              🔄 TEKRAR DENE
            </button>
            <Link
              href="/draft"
              className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-zinc-700 transition"
            >
              🏠 DRAFT MERKEZİ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!hasLoadedOnce && hydrationResult.status === 'NOT_MEMBER') {
    return (
      <div className="min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 select-none font-sans">
        <div className="p-8 bg-[#070D14] border-2 border-zinc-800 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF]">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-wider text-white font-display">
              Bu Odanın Üyesi Değilsiniz
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Seçim yapabilmek için önce odaya katılmanız gerekmektedir.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href={`/draft/room/${roomCode}`}
              className="px-6 py-2.5 bg-[#00F5A0] hover:bg-[#00D485] text-black text-xs font-black uppercase tracking-wider rounded-xl transition shadow-lg"
            >
              🚪 ODAYA KATIL
            </Link>
            <Link
              href="/draft"
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl border border-zinc-700 transition"
            >
              ANA MENÜ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roomState = hydrationResult.state;
  if (!roomState || !roomState.draftState) {
    return null;
  }

  const { room, members, clubs, draftState, playerPool } = roomState;
  const currentMember =
    hydrationResult.currentMember ||
    members.find((m) => m.sessionId === sessionId) ||
    (room.hostMemberId ? members.find((m) => m.id === room.hostMemberId) : undefined) ||
    members.find((m) => !m.isBot && !m.isSpectator);
  const currentClub = clubs.find(
    (c) => c.memberId === currentMember?.id || (currentMember?.clubId && c.id === currentMember.clubId)
  );
  const isMyTurn = Boolean(
    currentMember &&
    draftState.currentTurnMemberId === currentMember.id &&
    !draftState.isCompleted &&
    !draftState.isPaused
  );

  const activeTurnMember = members.find((m) => m.id === draftState.currentTurnMemberId);
  const activeTurnClub = clubs.find((c) => c.memberId === draftState.currentTurnMemberId);

  // Compute Snake Queue (Next 3 Drafters)
  const nextDrafters: { round: number; pickIndex: number; member?: typeof members[0]; club?: typeof clubs[0] }[] = [];
  if (draftState.draftOrder && draftState.draftOrder.length > 0) {
    const totalM = draftState.draftOrder.length;
    let r = draftState.currentRound;
    let pIdx = draftState.currentPickIndex;

    for (let i = 1; i <= 3; i++) {
      let nextP = pIdx + i;
      let nextR = r;
      if (nextP >= totalM) {
        nextR += Math.floor(nextP / totalM);
        nextP = nextP % totalM;
      }
      if (nextR <= (room.rules.squadSize || 18)) {
        const mId = getSnakeTurnMemberId(draftState.draftOrder, nextR, nextP);
        const mem = members.find((m) => m.id === mId);
        const clb = clubs.find((c) => c.memberId === mId);
        nextDrafters.push({ round: nextR, pickIndex: nextP, member: mem, club: clb });
      }
    }
  }

  // Budget calculations for Current Club (Canonical & Bulletproof)
  const targetSquadSize = room.rules.squadSize || 18;
  const initialBudget = room.rules.draftBudget || DEFAULT_DRAFT_BUDGET;

  // Combine all canonical and locally confirmed picks to prevent any background drop
  const allKnownPicks = Array.from(
    new Map(
      [...(draftState.picks || []), ...localConfirmedPicks].map((p) => [
        p.id || `${p.playerId}-${p.clubId || p.memberId}`,
        p,
      ])
    ).values()
  );

  const myPicks = allKnownPicks.filter((p) => {
    const pClubId = p.clubId || (p as any).club_id;
    const pMemberId = p.memberId || (p as any).member_id;
    return (
      (pClubId && (pClubId === currentClub?.id || pClubId === currentClub?.code)) ||
      (pMemberId && (pMemberId === currentMember?.id || pMemberId === currentMember?.sessionId))
    );
  });
  const mySquadPlayerIds = Array.from(
    new Set([
      ...(currentClub?.squadPlayerIds || []),
      ...myPicks.map((p) => p.playerId || (p as any).player_id).filter(Boolean),
    ])
  );
  const mySquadLength = mySquadPlayerIds.length;
  const remainingPicks = Math.max(1, targetSquadSize - mySquadLength);

  const playerPoolMap = new Map((playerPool || []).map((p) => [p.id, p]));
  let canonicalSpent = 0;
  for (const pid of mySquadPlayerIds) {
    const pickForPid = myPicks.find((p) => (p.playerId || (p as any).player_id) === pid);
    if (pickForPid && pickForPid.draftPrice !== undefined && pickForPid.draftPrice !== null && pickForPid.draftPrice > 0) {
      canonicalSpent += Number(pickForPid.draftPrice);
    } else {
      const pl = playerPoolMap.get(pid);
      canonicalSpent += pl?.draftValue ?? (pl ? calculatePlayerDraftValue(pl) : MIN_PLAYER_DRAFT_PRICE);
    }
  }

  // Canonical spend can NEVER decrease once registered
  const spentBudget = Math.max(
    canonicalSpent,
    localConfirmedSpent,
    currentClub?.spentBudget ? Number(currentClub.spentBudget) : 0
  );

  // CANONICAL RULE: remainingBudget = roomConfiguredInitialBudget - SUM(confirmed draft pick prices for this club)
  // NEVER fall back to DEFAULT_DRAFT_BUDGET (€250M) once drafting has begun or if spend exists
  const calculatedRemaining = Math.max(0, initialBudget - spentBudget);
  const currentBudget = spentBudget > 0
    ? calculatedRemaining
    : mySquadLength > 0
    ? calculatedRemaining
    : Math.min(calculatedRemaining, currentClub?.budget ?? calculatedRemaining);
  const minRequiredForRest = (remainingPicks - 1) * MIN_PLAYER_DRAFT_PRICE;
  const avgBudgetPerPick = currentBudget / remainingPicks;

  // Player pool filtering
  const pickedIds = new Set((draftState.picks || []).map((p) => p.playerId));
  const availablePlayers = (playerPool || []).filter((p) => !pickedIds.has(p.id));

  const filteredPlayers = availablePlayers.filter((p) => {
    const pVal = p.draftValue ?? calculatePlayerDraftValue(p);
    const query = searchQuery.trim().toLowerCase();
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch =
      !query ||
      fullName.includes(query) ||
      p.position.toLowerCase().includes(query) ||
      p.nationality.toLowerCase().includes(query) ||
      (p.archetype && p.archetype.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    // Position filter
    if (posFilter === 'GK' && p.position !== 'GK') return false;
    if (posFilter === 'DEF' && !['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position)) return false;
    if (posFilter === 'MID' && !['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position)) return false;
    if (posFilter === 'ATT' && !['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position)) return false;

    // Smart Presets
    if (smartPreset === 'RISING') {
      if (!p.isRisingTalent && !(p.age <= 21 && p.potential >= 84)) return false;
    } else if (smartPreset === 'BEST_FP') {
      const priceInM = Math.max(0.5, pVal / 1_000_000);
      const ratio = p.overall / priceInM;
      if (ratio < 6.8 && pVal > 8_000_000) return false;
    } else if (smartPreset === 'STARS') {
      if (p.overall < 82) return false;
    } else if (smartPreset === 'DEVELOPMENT') {
      if ((p.potential - p.overall) < 6) return false;
    }

    // Price range
    if (priceRange === 'UNDER_5M' && pVal >= 5_000_000) return false;
    if (priceRange === '5M_15M' && (pVal < 5_000_000 || pVal > 15_000_000)) return false;
    if (priceRange === '15M_30M' && (pVal <= 15_000_000 || pVal > 30_000_000)) return false;
    if (priceRange === '30M_PLUS' && pVal <= 30_000_000) return false;

    // Age range
    if (ageRange === 'YOUTH' && p.age > 21) return false;
    if (ageRange === 'PRIME' && (p.age < 22 || p.age > 28)) return false;
    if (ageRange === 'VETERAN' && p.age < 29) return false;

    // Only Affordable (Checks balance AND mathematical quota guarantee)
    if (onlyAffordable) {
      if (pVal > currentBudget || (currentBudget - pVal) < minRequiredForRest) return false;
    }

    return true;
  });

  filteredPlayers.sort((a, b) => {
    const aVal = a.draftValue ?? calculatePlayerDraftValue(a);
    const bVal = b.draftValue ?? calculatePlayerDraftValue(b);
    const aAttr = a.attributes || ({} as any);
    const bAttr = b.attributes || ({} as any);

    if (sortBy === 'overall') return b.overall - a.overall;
    if (sortBy === 'price_asc') return aVal - bVal;
    if (sortBy === 'price_desc') return bVal - aVal;
    if (sortBy === 'fp_ratio') {
      const aRatio = a.overall / Math.max(0.5, aVal / 1_000_000);
      const bRatio = b.overall / Math.max(0.5, bVal / 1_000_000);
      return bRatio - aRatio;
    }
    if (sortBy === 'potential') return (b.potential ?? b.overall) - (a.potential ?? a.overall);
    if (sortBy === 'age') return a.age - b.age;
    if (sortBy === 'pace') return (bAttr.pace ?? 0) - (aAttr.pace ?? 0);
    if (sortBy === 'shooting') return (bAttr.finishing ?? 0) - (aAttr.finishing ?? 0);
    if (sortBy === 'passing') return (bAttr.passing ?? 0) - (aAttr.passing ?? 0);
    if (sortBy === 'defending') return (bAttr.tackling ?? 0) - (aAttr.tackling ?? 0);
    if (sortBy === 'physical') return (bAttr.strength ?? 0) - (aAttr.strength ?? 0);
    return b.overall - a.overall;
  });

  // Slice for 60fps virtualization window
  const displayedPlayers = filteredPlayers.slice(0, visibleCount);

  const activeSpotlightPlayer = selectedPlayer || filteredPlayers[0] || null;
  const activeSpotlightPrice = activeSpotlightPlayer
    ? (activeSpotlightPlayer.draftValue ?? calculatePlayerDraftValue(activeSpotlightPlayer))
    : 0;

  const spotlightAffordable = currentBudget >= activeSpotlightPrice;
  const spotlightQuotaSafe = (currentBudget - activeSpotlightPrice) >= minRequiredForRest;
  const spotlightCanDraft = isMyTurn && spotlightAffordable && (remainingPicks <= 1 || spotlightQuotaSafe);

  // Make Draft Pick Action (Locked and Thread-Safe)
  const handleSelectPlayer = async (player: Player) => {
    if (isSubmittingPick || !currentMember || !isMyTurn) return;

    const pVal = player.draftValue ?? calculatePlayerDraftValue(player);
    if (pVal > currentBudget) {
      setPickError(`Bütçe yetersiz! (€${(pVal / 1_000_000).toFixed(1)}M > €${(currentBudget / 1_000_000).toFixed(1)}M)`);
      return;
    }
    if (remainingPicks > 1 && (currentBudget - pVal) < (remainingPicks - 1) * MIN_PLAYER_DRAFT_PRICE) {
      setPickError(`Bu seçim sonrası kalan ${remainingPicks - 1} transfer için asgari bütçe (€150K) kalmıyor.`);
      return;
    }

    setIsSubmittingPick(true);
    setPickError(null);

    try {
      let res = await DraftMultiplayerStore.makePickAsync(room.id, currentMember.id, player.id, false);

      // If pick failed with SC-MP-007 (Draft aktif değil), perform emergency room hydration and retry once
      if (!res.success && (res.errorCode === 'SC-MP-007' || res.error?.includes('Draft aktif değil'))) {
        console.warn('[DraftPage] SC-MP-007 encountered during pick. Emergency re-hydrating room and retrying...');
        const rehydrateRes = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId);
        if (rehydrateRes.state?.draftState) {
          res = await DraftMultiplayerStore.makePickAsync(room.id, currentMember.id, player.id, false);
        }
      }

      if (!res.success) {
        setPickError(res.error || '[SC-MP-004] Seçim gerçekleştirilemedi.');
        setIsSubmittingPick(false);
        return;
      }

      setSelectedPlayer(null);

      // Immediately track pick in local store to prevent any race condition budget revert
      const newConfirmedPick: DraftPick = {
        id: `pick-${room.id}-${Date.now()}`,
        roomId: room.id,
        round: draftState.currentRound,
        pickIndexInRound: draftState.currentPickIndex,
        globalPickNumber: (draftState.picks?.length || 0) + 1,
        memberId: currentMember.id,
        clubId: currentClub?.id || '',
        playerId: player.id,
        selectedAt: new Date().toISOString(),
        isAutoPick: false,
        timeTakenSeconds: 1,
        draftPrice: pVal,
      };

      setLocalConfirmedPicks((prev) => {
        const next = [...prev, newConfirmedPick];
        try {
          localStorage.setItem(localPicksStorageKey, JSON.stringify(next));
        } catch {}
        return next;
      });

      setLocalConfirmedSpent((prev) => {
        const next = prev + pVal;
        try {
          localStorage.setItem(localSpentStorageKey, String(next));
        } catch {}
        return next;
      });

      if (res.state) {
        setHydrationResult((prev) => ({
          ...prev,
          state: res.state,
          isMyTurn: res.state?.draftState?.currentTurnMemberId === currentMember.id,
        }));

        if (
          res.state.draftState?.isCompleted ||
          res.state.room.status === 'LEAGUE_ACTIVE' ||
          res.state.room.status === 'LEAGUE_COMPLETED'
        ) {
          router.push(`/draft/room/${roomCode}/league`);
          return;
        }

        // Trigger consecutive bot pick chaining if next turn is bot
        triggerBotTurnIfNeeded(res.state, currentMember.id);
      }
    } catch (err: any) {
      console.error('Pick execution error:', err);
      setPickError(`[SC-MP-004] Seçim sırasında bir hata oluştu: ${err?.message || ''}`);
    } finally {
      setIsSubmittingPick(false);
    }
  };

  const handleLeaveRoom = async () => {
    const isHost = currentMember?.isHost || room.hostMemberId === currentMember?.id;
    if (isHost && currentMember) {
      const confirmed = window.confirm('Oda kurucususunuz. Odadan ayrıldığınızda oda kapatılacak ve tüm üyeler ana sayfaya yönlendirilecektir. Ayrılmak istiyor musunuz?');
      if (!confirmed) return;
      await DraftMultiplayerStore.closeRoomByHost(room.id, currentMember.id);
      router.push('/');
    } else {
      router.push('/draft');
    }
  };

  // Helper for Positional Colors
  const getPosColorClass = (pos: string) => {
    if (pos === 'GK') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    if (['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos))
      return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
    if (['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(pos))
      return 'bg-emerald-500/20 text-[#00F5A0] border-emerald-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  const getAttrColor = (val: number) => {
    if (val >= 85) return 'text-[#00F5A0] font-black';
    if (val >= 75) return 'text-[#00D4FF] font-bold';
    if (val >= 65) return 'text-[#FFB800] font-semibold';
    return 'text-zinc-400 font-medium';
  };

  const formatPrice = (val: number) => {
    if (val >= 1_000_000) return `€${(val / 1_000_000).toFixed(1)}M`;
    return `€${Math.round(val / 1_000)}K`;
  };

  // My Squad positional counts
  const mySquadCounts = countSquadPositions(playerPool, currentClub?.squadPlayerIds || []);

  // Smart team needs advisory
  const getTeamNeedsAdvice = () => {
    if (mySquadCounts.gk < 2 && remainingPicks <= 4) return '⚠️ Kaleci (GK) açığınız var, kalan seçimlerde mutlaka 2 kaleci tamamlanmalı.';
    if (mySquadCounts.def < 5 && remainingPicks <= 6) return '🛡️ Savunma kotası (En az 5 DEF) için stoper veya bek seçmelisiniz.';
    if (mySquadCounts.mid < 5 && remainingPicks <= 6) return '⚡ Orta saha kotası (En az 5 MID) için dinamik orta saha transferi yapın.';
    if (mySquadCounts.att < 3 && remainingPicks <= 4) return '⚽ Hücum kotası (En az 3 ATT) için kanat veya forvet seçmelisiniz.';
    if (avgBudgetPerPick < 5_000_000) return '💡 Kalan bütçeniz kısıtlı, F/P filtresinden uygun maliyetli gençlere yönelin.';
    return '✨ Kadro ve bütçe dengeniz mükemmel ilerliyor.';
  };

  return (
    <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* Background Ambience */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-[#04060A]/90 to-[#04060A]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]" />
      </div>

      {/* ==================================================================== */}
      {/* 1. SQUADCRAFT DRAFT COMMAND CENTER HUD & BUDGET CONTROLS              */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070D14]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Round Indicator */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="relative h-8 sm:h-9 w-10 sm:w-12 flex items-center justify-center shrink-0">
                <Image
                  src="/images/sc-emblem-official-hd.png"
                  alt="SquadCraft SC"
                  width={48}
                  height={36}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 font-black uppercase italic tracking-tighter text-sm sm:text-base leading-none">
                  <span className="text-white group-hover:text-zinc-100 transition-colors">SQUADCRAFT</span>
                  <span className="text-[#00F5A0]">26</span>
                </div>
                <span className="text-[8px] font-mono font-bold tracking-widest text-[#00D4FF] uppercase mt-0.5">
                  DRAFT MERKEZİ 2.0
                </span>
              </div>
            </Link>

            {/* Round Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded">
              <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase">TUR</div>
              <div className="text-sm font-black font-mono text-[#00F5A0]">
                {draftState.currentRound} <span className="text-zinc-600">/</span> {targetSquadSize}
              </div>
              <div className="hidden md:block w-16 bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800 ml-1">
                <div
                  className="bg-[#00F5A0] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${(draftState.currentRound / targetSquadSize) * 100}%` }}
                />
              </div>
            </div>

            {/* Manager Live Budget Widget */}
            {currentClub && (
              <div className="flex items-center gap-2.5 px-3 py-1 bg-gradient-to-r from-emerald-950/60 to-zinc-950 border border-emerald-500/40 rounded shadow-md">
                <div className="w-7 h-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#00F5A0]">
                  <Coins className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>KALAN BÜTÇE</span>
                    <span className="text-emerald-400 font-bold">({remainingPicks} seçim)</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black font-mono text-[#00F5A0]">
                      €{(currentBudget / 1_000_000).toFixed(1)}M
                    </span>
                    <span className="hidden sm:inline text-[9px] font-mono text-zinc-400">
                      • Ort: €{(avgBudgetPerPick / 1_000_000).toFixed(1)}M/seçim
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Background Sync Pill */}
            {isSyncing && (
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#00D4FF]/10 border border-[#00D4FF]/30 text-[#00D4FF] text-[10px] font-mono font-bold uppercase animate-pulse rounded">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Bağlantı...</span>
              </div>
            )}
          </div>

          {/* Center: Current Turn Drafter Spotlight */}
          <div className="flex items-center gap-2.5 sm:gap-4 bg-zinc-950/90 border border-zinc-800/80 px-3 sm:px-4 py-1.5 rounded">
            {activeTurnClub && (
              <BadgePreview badge={activeTurnClub.badge} clubCode={activeTurnClub.code} size={32} />
            )}
            <div className="flex flex-col">
              <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <span>SEÇİM YAPAN:</span>
                <span className="text-white font-bold">{activeTurnClub?.name || activeTurnMember?.username}</span>
              </div>
              <div className="flex items-center gap-2">
                {isMyTurn ? (
                  <span className="flex items-center gap-1 text-[11px] font-black uppercase text-[#00F5A0] animate-pulse tracking-wide">
                    <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
                    ⚡ SIRA SENDE! OYUNCUNU SEÇ
                  </span>
                ) : activeTurnMember?.isBot ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-300">
                    <Bot className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    🤖 BOT SEÇİYOR ({activeTurnMember.botDifficulty || 'ORTA'})...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-300">
                    <Clock className="w-3 h-3 text-[#00D4FF]" />
                    {activeTurnMember?.username} düşünüyor...
                  </span>
                )}
              </div>
            </div>

            {/* Turn Timer */}
            {room.rules.pickTimerSeconds > 0 && (
              <div
                className={`ml-2 px-2.5 py-1 font-mono font-black text-sm sm:text-base border rounded flex items-center gap-1.5 ${
                  timeLeft <= 10
                    ? 'bg-rose-950/80 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-zinc-900 border-zinc-700 text-[#00F5A0]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
          </div>

          {/* Right: Next Up Snake Queue & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Next in Snake Draft Ticker (Desktop) */}
            {nextDrafters.length > 0 && (
              <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1 rounded">
                <span className="text-zinc-500">SIRADAKİ:</span>
                {nextDrafters.map((nxt, idx) => (
                  <span
                    key={idx}
                    className={`font-semibold ${
                      nxt.member?.id === currentMember?.id ? 'text-[#00F5A0] font-black' : 'text-zinc-300'
                    }`}
                  >
                    {nxt.club?.code || nxt.member?.username?.slice(0, 3)}
                    {idx < nextDrafters.length - 1 && <span className="text-zinc-600 mx-1">→</span>}
                  </span>
                ))}
              </div>
            )}

            {/* Room Code Copy Pill */}
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-[11px] font-mono font-bold text-zinc-300 transition-all active:scale-95 rounded"
              title="Oda kodunu kopyala"
            >
              {copiedCode ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
                  <span className="text-[#00F5A0]">KOPYALANDI</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{roomCode}</span>
                </>
              )}
            </button>

            {/* Feedback & Actions */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 text-zinc-300 text-xs font-bold uppercase transition rounded"
              title="Geri Bildirim"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00F5A0]" />
            </button>

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition rounded"
              title="Odadan Ayrıl"
            >
              <LogOut className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="hidden sm:inline">ODADAN AYRIL</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden relative z-20 bg-[#070D14] border-b border-zinc-800 px-3 py-2 flex items-center justify-around gap-1">
        <button
          onClick={() => setMobileTab('pool')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'pool'
              ? 'bg-[#00D4FF] text-black font-black'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Havuz ({availablePlayers.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('card')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'card'
              ? 'bg-[#FFB800] text-black font-black'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Oyuncu Kartı</span>
        </button>
        <button
          onClick={() => setMobileTab('squad')}
          className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'squad'
              ? 'bg-[#00F5A0] text-black font-black'
              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Kadrom ({mySquadLength}/{targetSquadSize})</span>
        </button>
      </div>

      {/* Dismissible Pick Error Alert */}
      {pickError && (
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 mt-3">
          <div className="p-3 bg-red-950/90 border border-red-500/80 text-red-200 text-xs font-medium flex items-center justify-between shadow-lg rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{pickError}</span>
            </div>
            <button
              onClick={() => setPickError(null)}
              className="text-red-400 hover:text-white text-xs font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. MAIN 3-COLUMN DRAFT ARENA (DESKTOP) & TABBED (MOBILE)             */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1600px] w-full mx-auto px-3 sm:px-6 py-4 my-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* ================================================================== */}
        {/* COLUMN 1: PLAYER POOL & SMART PRESET FILTERS (5 Cols)              */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-5 bg-[#070D14]/95 border border-zinc-800 flex flex-col justify-between h-[700px] shadow-2xl rounded-lg overflow-hidden ${
            mobileTab !== 'pool' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Top Search & Filter Bar */}
          <div className="p-3 border-b border-zinc-800 space-y-2.5 bg-[#05090F]">
            {/* Search Input & Sort Dropdown */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Futbolcu, mevki, rol veya ülke ara..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-[#00D4FF] pl-9 pr-8 py-2 text-xs text-white font-medium placeholder-zinc-500 focus:outline-none transition rounded"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-200 rounded px-2 py-2 text-[11px] font-bold focus:outline-none focus:border-[#00D4FF]"
                >
                  <option value="overall">OVR (En Yüksek)</option>
                  <option value="price_asc">Fiyat (En Ucuz)</option>
                  <option value="price_desc">Fiyat (En Pahalı)</option>
                  <option value="fp_ratio">F/P Oranı (En İyi)</option>
                  <option value="potential">Potansiyel (POT)</option>
                  <option value="age">Yaş (En Genç)</option>
                  <option value="pace">Hız (PAC)</option>
                  <option value="shooting">Bitiricilik (SHO)</option>
                  <option value="passing">Pas (PAS)</option>
                  <option value="defending">Savunma (DEF)</option>
                  <option value="physical">Fizik (PHY)</option>
                </select>
              </div>
            </div>

            {/* Smart Presets Bar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'ALL', label: 'TÜMÜ' },
                { id: 'RISING', label: '🌟 YÜKSELEN YETENEK' },
                { id: 'BEST_FP', label: '💎 EN İYİ F/P' },
                { id: 'STARS', label: '⚡ HAZIR YILDIZLAR' },
                { id: 'DEVELOPMENT', label: '🌱 GELİŞİME AÇIK' },
              ].map((p) => {
                const isActive = smartPreset === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSmartPreset(p.id as SmartFilterPreset)}
                    className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded whitespace-nowrap transition-all border ${
                      isActive
                        ? 'bg-[#00F5A0] text-black border-[#00F5A0] shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Position Filter Tabs & Affordable Toggle */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <div className="flex-1 flex items-center justify-between gap-1 bg-zinc-950 p-1 border border-zinc-800/80 rounded">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as PositionFilter[]).map((pos) => {
                  const isActive = posFilter === pos;
                  return (
                    <button
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className={`flex-1 py-1 text-[10px] font-black uppercase tracking-wider transition-all text-center rounded ${
                        isActive
                          ? pos === 'GK'
                            ? 'bg-amber-500 text-black shadow-sm'
                            : pos === 'DEF'
                            ? 'bg-blue-500 text-black shadow-sm'
                            : pos === 'MID'
                            ? 'bg-[#00F5A0] text-black shadow-sm'
                            : pos === 'ATT'
                            ? 'bg-rose-500 text-black shadow-sm'
                            : 'bg-zinc-200 text-black shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                      }`}
                    >
                      {pos === 'ALL' ? 'TÜMÜ' : pos}
                    </button>
                  );
                })}
              </div>

              {/* Only Affordable Checkbox */}
              <button
                onClick={() => setOnlyAffordable(!onlyAffordable)}
                className={`px-2.5 py-1 text-[10px] font-bold border rounded flex items-center gap-1.5 transition-all shrink-0 ${
                  onlyAffordable
                    ? 'bg-emerald-950/80 border-emerald-500 text-[#00F5A0]'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="w-3 h-3" />
                <span>Bütçeme Uygun</span>
              </button>
            </div>
          </div>

          {/* Scrollable Player List (Windowed Virtualization) */}
          <div className="overflow-y-auto space-y-1 p-2 flex-1 custom-scrollbar">
            {filteredPlayers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <Search className="w-8 h-8 text-zinc-600" />
                <span className="text-xs font-bold text-zinc-400">Aradığınız kriterlere uygun futbolcu bulunamadı.</span>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPosFilter('ALL');
                    setSmartPreset('ALL');
                    setOnlyAffordable(false);
                  }}
                  className="text-[11px] font-bold text-[#00D4FF] underline"
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <>
                {displayedPlayers.map((player) => {
                  const isSelected = activeSpotlightPlayer?.id === player.id;
                  const attr = player.attributes || ({} as any);
                  const pVal = player.draftValue ?? calculatePlayerDraftValue(player);
                  const isExceeded = pVal > currentBudget;
                  const isQuotaRisk = !isExceeded && (currentBudget - pVal) < minRequiredForRest;
                  const canPick = isMyTurn && !isExceeded && (remainingPicks <= 1 || !isQuotaRisk);

                  return (
                    <div
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayer(player);
                        if (window.innerWidth < 1024) {
                          setMobileTab('card');
                        }
                      }}
                      className={`p-2 border transition-all cursor-pointer flex items-center justify-between group rounded ${
                        isSelected
                          ? 'bg-zinc-900/90 border-[#00F5A0] shadow-md shadow-[#00F5A0]/10'
                          : isExceeded
                          ? 'bg-[#05090F]/50 border-zinc-800/50 opacity-60 hover:opacity-90'
                          : 'bg-[#05090F]/80 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      {/* Left: Position & Player Info */}
                      <div className="flex items-center gap-2 min-w-0">
                        <PlayerPortrait player={player} size="xs" />
                        <span
                          className={`w-7 h-7 rounded border flex items-center justify-center font-mono font-black text-[11px] shrink-0 ${getPosColorClass(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>

                        <div className="truncate">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-black text-white group-hover:text-[#00F5A0] transition-colors truncate">
                              {player.firstName} {player.lastName}
                            </span>
                            {player.isRisingTalent && (
                              <span className="px-1.5 py-0.2 bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-[9px] font-black uppercase tracking-wider rounded shrink-0 shadow-sm">
                                ⭐ YÜKSELEN
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-medium flex items-center gap-1.5 truncate">
                            <span>{player.archetype || 'Oyuncu'}</span>
                            <span className="text-zinc-600">•</span>
                            <span>{player.age} Yaş</span>
                            <span className="text-zinc-600">•</span>
                            <span>{player.nationality}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Price & Key Stats & Action */}
                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        {/* Price Tag */}
                        <div className="text-right">
                          <div className={`text-xs font-black font-mono ${isExceeded ? 'text-rose-400 line-through' : 'text-[#00F5A0]'}`}>
                            {formatPrice(pVal)}
                          </div>
                          {isExceeded ? (
                            <div className="text-[8px] font-mono font-bold text-rose-500 uppercase">YETERSİZ</div>
                          ) : isQuotaRisk ? (
                            <div className="text-[8px] font-mono font-bold text-amber-400 uppercase">KOTA RİSKİ</div>
                          ) : (
                            <div className="text-[8px] font-mono text-zinc-500 uppercase">BONSERVİS</div>
                          )}
                        </div>

                        {/* Overall Badge */}
                        <div className="w-7 text-right">
                          <div className="text-xs font-black font-mono text-white leading-none">
                            {player.overall}
                          </div>
                          <div className="text-[7px] font-mono text-zinc-500 uppercase">OVR</div>
                        </div>

                        {/* Pick CTA Button */}
                        {isMyTurn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPlayer(player);
                            }}
                            disabled={isSubmittingPick || !canPick}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition active:scale-95 rounded shadow-sm ${
                              canPick
                                ? 'bg-[#00F5A0] hover:bg-[#00D485] text-black shadow-[#00F5A0]/20'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                            }`}
                          >
                            {isSubmittingPick && selectedPlayer?.id === player.id ? '...' : canPick ? 'SEÇ' : 'YETERSİZ'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button for 2,000 Player Virtualization */}
                {visibleCount < filteredPlayers.length && (
                  <div className="p-2 text-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 50)}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded transition"
                    >
                      Daha Fazla Göster (+50 Futbolcu) • [{visibleCount} / {filteredPlayers.length}]
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Pool Stats */}
          <div className="p-2.5 bg-[#05090F] border-t border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
            <span>{displayedPlayers.length} / {filteredPlayers.length} Futbolcu Listeleniyor</span>
            <span className="text-zinc-500">2,000 Oyuncu Kurgusal SC-2.0 Veritabanı</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* COLUMN 2: SQUADCRAFT PLAYER SCOUTING SPOTLIGHT (4 Cols)             */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-4 bg-[#070D14]/95 border-2 border-zinc-800 flex flex-col justify-between h-[700px] p-5 shadow-2xl rounded-lg ${
            mobileTab !== 'card' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeSpotlightPlayer ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              {/* Top Tactical Scouting Card */}
              <div className="relative p-5 bg-gradient-to-b from-[#0B1522] to-[#050B12] border border-[#00D4FF]/30 shadow-xl overflow-hidden rounded-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D4FF]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PlayerPortrait player={activeSpotlightPlayer} size="lg" shape="card" priority={true} />
                    <div>
                      <div className="text-3xl sm:text-4xl font-black font-mono text-[#00F5A0] leading-none">
                        {activeSpotlightPlayer.overall}
                      </div>
                      <div
                        className={`inline-block px-2 py-0.5 mt-1 text-xs font-mono font-black border rounded ${getPosColorClass(
                          activeSpotlightPlayer.position
                        )}`}
                      >
                        {activeSpotlightPlayer.position}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase">DRAFT BEDELİ</div>
                    <div className="text-xl font-mono font-black text-[#00F5A0]">
                      {formatPrice(activeSpotlightPrice)}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400 mt-1 uppercase">POTANSİYEL: <span className="text-[#00D4FF] font-bold">{activeSpotlightPlayer.potential || activeSpotlightPlayer.overall}</span></div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black italic tracking-tight text-white uppercase font-display">
                      {activeSpotlightPlayer.firstName} {activeSpotlightPlayer.lastName}
                    </h3>
                    {activeSpotlightPlayer.isRisingTalent && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-[10px] font-black uppercase tracking-wider rounded shadow-md animate-pulse">
                        ⭐ YÜKSELEN YETENEK
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300 font-semibold mt-1">
                    <span className="px-1.5 py-0.5 bg-zinc-800 text-[#00D4FF] rounded text-[10px] uppercase font-mono">
                      {activeSpotlightPlayer.archetype || 'Standart'}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>{activeSpotlightPlayer.nationality}</span>
                    <span className="text-zinc-600">•</span>
                    <span>{activeSpotlightPlayer.age} Yaş</span>
                    <span className="text-zinc-600">•</span>
                    <span>{activeSpotlightPlayer.height} cm</span>
                  </div>
                </div>
              </div>

              {/* 6 Core FC Attribute Grid */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>TEMEL YETENEK PROFİLİ</span>
                  <span className="text-[10px] text-zinc-500 font-mono">Gelişim: {activeSpotlightPlayer.hiddenAttributes?.developmentCurve === 'EARLY_PEAK' ? 'Hızlı Zirve' : activeSpotlightPlayer.hiddenAttributes?.developmentCurve === 'LATE_BLOOMER' ? 'Geç Açılan' : 'Dengeli'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(() => {
                    const a = activeSpotlightPlayer.attributes || ({} as any);
                    const stats = [
                      { label: 'Hız (PAC)', val: a.pace ?? 70 },
                      { label: 'Bitiricilik (SHO)', val: a.finishing ?? 70 },
                      { label: 'Paslaşma (PAS)', val: a.passing ?? 70 },
                      { label: 'Top Sürme (DRI)', val: a.dribbling ?? 70 },
                      { label: 'Savunma (DEF)', val: a.tackling ?? 70 },
                      { label: 'Fizik & Güç (PHY)', val: a.strength ?? 70 },
                    ];

                    return stats.map((st, i) => (
                      <div
                        key={i}
                        className="p-2 bg-zinc-950 border border-zinc-800/90 rounded flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-mono text-zinc-400">{st.label}</span>
                          <span className={`text-xs font-mono ${getAttrColor(st.val)}`}>{st.val}</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden border border-zinc-800">
                          <div
                            className={`h-full rounded-full ${
                              st.val >= 85
                                ? 'bg-[#00F5A0]'
                                : st.val >= 75
                                ? 'bg-[#00D4FF]'
                                : st.val >= 65
                                ? 'bg-[#FFB800]'
                                : 'bg-zinc-600'
                            }`}
                            style={{ width: `${Math.min(100, (st.val / 99) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Extra Details: Foot, Hidden Mentals, Affordability Check */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-[11px] text-zinc-300 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">AYAK</span>
                    <span className="font-bold text-white">{activeSpotlightPlayer.preferredFoot}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">İSTİKRAR</span>
                    <span className="font-bold text-white">{activeSpotlightPlayer.hiddenAttributes?.consistency ?? 70}/99</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">BÜYÜK MAÇ</span>
                    <span className="font-bold text-white">{activeSpotlightPlayer.hiddenAttributes?.bigMatchPerformance ?? 70}/99</span>
                  </div>
                </div>

                {/* Affordability Status Box */}
                <div className={`p-2 border rounded text-[10px] font-mono flex items-center justify-between ${
                  spotlightCanDraft
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : !spotlightAffordable
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {spotlightCanDraft ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>
                      {spotlightCanDraft
                        ? `Transfer edilebilir • Kalan: €${((currentBudget - activeSpotlightPrice) / 1_000_000).toFixed(1)}M`
                        : !spotlightAffordable
                        ? `Bütçe aşıldı (€${(activeSpotlightPrice / 1_000_000).toFixed(1)}M > €${(currentBudget / 1_000_000).toFixed(1)}M)`
                        : `Kalan ${remainingPicks - 1} seçim için asgari bütçe riski`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Big Action Button */}
              {isMyTurn ? (
                <button
                  onClick={() => handleSelectPlayer(activeSpotlightPlayer)}
                  disabled={isSubmittingPick || !spotlightCanDraft}
                  className={`w-full py-3.5 rounded font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-2 active:scale-98 ${
                    spotlightCanDraft
                      ? 'bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] hover:to-[#00C475] text-black shadow-[#00F5A0]/20'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isSubmittingPick ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>KADROYA EKLENİYOR...</span>
                    </div>
                  ) : spotlightCanDraft ? (
                    <>
                      <Sparkles className="w-4 h-4 fill-black" />
                      <span>KADROYA AL — {formatPrice(activeSpotlightPrice)}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  ) : !spotlightAffordable ? (
                    <span>BÜTÇE YETERSİZ ({formatPrice(activeSpotlightPrice)})</span>
                  ) : (
                    <span>KOTA GÜVENCESİ YETERSİZ</span>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded text-center text-xs font-mono text-zinc-400">
                  {draftState.isCompleted ? 'Draft tamamlandı.' : 'Sıranız geldiğinde transfer butonu aktifleşecektir.'}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-zinc-500">
              <Sparkles className="w-10 h-10 text-zinc-700" />
              <div className="text-xs font-bold text-zinc-400">Detayları görmek için havuzdan bir futbolcu seçin.</div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* COLUMN 3: MY CLUB SQUAD & LIVE RECENT PICKS (3 Cols)               */}
        {/* ================================================================== */}
        <div
          className={`lg:col-span-3 space-y-4 ${
            mobileTab !== 'squad' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* My Club Live Quota & Budget Breakdown Card */}
          {currentMember && currentClub && (
            <div className="bg-[#070D14]/95 border border-zinc-800 p-4 shadow-xl space-y-3 rounded-lg">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <BadgePreview badge={currentClub.badge} clubCode={currentClub.code} size={28} />
                  <div>
                    <div className="text-xs font-black text-white uppercase">{currentClub.name}</div>
                    <div className="text-[10px] font-mono text-zinc-400">{currentMember.username}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-black text-[#00F5A0]">
                    {mySquadLength} <span className="text-zinc-600">/</span> {targetSquadSize}
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase">KADRO</div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded text-[11px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">BAŞLANGIÇ BÜTÇESİ:</span>
                  <span className="text-zinc-300 font-bold">€{(initialBudget / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">HARCANAN:</span>
                  <span className="text-amber-400 font-bold">€{(spentBudget / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">KALAN BÜTÇE:</span>
                  <span className="text-[#00F5A0] font-black">€{(currentBudget / 1_000_000).toFixed(1)}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">KALAN SEÇİM:</span>
                  <span className="text-zinc-200 font-bold">{remainingPicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">SEÇİM BAŞINA ORTALAMA:</span>
                  <span className="text-[#00D4FF] font-bold">€{(avgBudgetPerPick / 1_000_000).toFixed(1)}M</span>
                </div>
              </div>

              {/* Position Quotas Matrix */}
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">GK</div>
                  <div
                    className={`text-xs font-mono font-black ${
                      mySquadCounts.gk >= 2 ? 'text-[#00F5A0]' : 'text-amber-400'
                    }`}
                  >
                    {mySquadCounts.gk}/2
                  </div>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">DEF</div>
                  <div
                    className={`text-xs font-mono font-black ${
                      mySquadCounts.def >= 5 ? 'text-[#00F5A0]' : 'text-amber-400'
                    }`}
                  >
                    {mySquadCounts.def}/5
                  </div>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">MID</div>
                  <div
                    className={`text-xs font-mono font-black ${
                      mySquadCounts.mid >= 5 ? 'text-[#00F5A0]' : 'text-amber-400'
                    }`}
                  >
                    {mySquadCounts.mid}/5
                  </div>
                </div>
                <div className="p-2 bg-zinc-950 border border-zinc-800 rounded">
                  <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">ATT</div>
                  <div
                    className={`text-xs font-mono font-black ${
                      mySquadCounts.att >= 3 ? 'text-[#00F5A0]' : 'text-amber-400'
                    }`}
                  >
                    {mySquadCounts.att}/3
                  </div>
                </div>
              </div>

              {/* Advisory note */}
              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-zinc-400">
                {getTeamNeedsAdvice()}
              </div>
            </div>
          )}

          {/* Recent Picks Feed */}
          <div className="bg-[#070D14]/95 border border-zinc-800 p-4 shadow-xl flex flex-col justify-between h-[420px] rounded-lg">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-white">
                SON SEÇİMLER ({(draftState.picks || []).length})
              </div>
              <span className="text-[10px] font-mono text-[#00D4FF]">CANLI AKIŞ</span>
            </div>

            <div className="overflow-y-auto space-y-1.5 my-2 pr-1 flex-1 custom-scrollbar">
              {(draftState.picks || []).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-zinc-500">
                  <Clock className="w-8 h-8 text-zinc-700" />
                  <span className="text-xs">Henüz seçim yapılmadı.</span>
                </div>
              ) : (
                [...(draftState.picks || [])].reverse().map((pick) => {
                  const p = playerPool.find((item) => item.id === pick.playerId);
                  const m = members.find((mem) => mem.id === pick.memberId);
                  const c = clubs.find((clb) => clb.id === pick.clubId || clb.memberId === pick.memberId);
                  const price = pick.draftPrice || (p ? (p.draftValue ?? calculatePlayerDraftValue(p)) : 0);

                  return (
                    <div
                      key={pick.id}
                      className="p-2 bg-zinc-950/80 border border-zinc-800 text-xs flex items-center justify-between rounded"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {c && <BadgePreview badge={c.badge} clubCode={c.code} size={22} />}
                        <div className="truncate">
                          <div className="font-black text-zinc-200 truncate flex items-center gap-1.5">
                            <span>{p ? `${p.firstName} ${p.lastName}` : pick.playerId}</span>
                            {p?.isRisingTalent && (
                              <span className="text-[8px] text-amber-400 font-mono">⭐</span>
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-400 truncate">
                            {m?.username} • Tur {pick.round} (#{pick.globalPickNumber || pick.round})
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-mono font-black text-[#00F5A0] block">
                          {p?.overall || 75} OVR
                        </span>
                        <span className="text-[9px] font-mono text-zinc-400 block">
                          {formatPrice(price)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 text-[10px] font-mono text-zinc-500 text-center">
              Snake Draft Formatı • Bütçe Tavanı €{(initialBudget / 1_000_000).toFixed(1)}M
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roomId={room.id}
        route={`/draft/room/${roomCode}/draft`}
        gamePhase="Draft Picking"
        stateVersion={room.stateVersion}
      />
    </div>
  );
}
