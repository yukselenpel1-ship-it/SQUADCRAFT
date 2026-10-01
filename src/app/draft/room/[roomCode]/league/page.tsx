'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DraftMultiplayerStore, RoomFullState, HydratedRoomResult } from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId } from '@/lib/draft/sessionManager';
import { SQUADCRAFT_VERSION } from '@/lib/version';
import { DraftFixture, DraftStanding, LeagueAwards, DraftPick, RoomMember, DraftClub, PastSeasonHistory, PlayerSeasonStats } from '@/lib/draft/types';
import { computeSeasonPlayerStats } from '@/lib/draft/matchEngineIntegration';
import { Player, Formation, Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width } from '@/types/game';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { MatchReportModal } from '@/components/draft/MatchReportModal';
import { DraftLiveMatchModal } from '@/components/draft/DraftLiveMatchModal';
import { MatchweekReadyBanner } from '@/components/draft/MatchweekReadyBanner';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { AlphaDebugOverlay } from '@/components/draft/AlphaDebugOverlay';
import {
  Trophy,
  Shield,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  Settings,
  MessageSquare,
  Radio,
  Copy,
  Check,
  Play,
  Flame,
  Swords,
  ChevronRight,
  Sparkles,
  Award,
  Calendar,
  Layers,
  BarChart3,
  History,
  Activity,
  UserCheck,
  Sliders,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Crown,
  Eye,
  LogOut,
  ChevronDown,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';

interface LeaguePageProps {
  params: Promise<{ roomCode: string }>;
}

type TabType = 'overview' | 'squad' | 'tactics' | 'fixtures' | 'standings' | 'players' | 'history';
type SquadPositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';
type SquadViewMode = 'grid' | 'table';

export function isSlotCompatible(playerPosition: string, slotRole: string): boolean {
  if (slotRole === 'GK') return playerPosition === 'GK';
  const defs = ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'];
  const mids = ['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'];
  const atts = ['LW', 'RW', 'ST', 'CF', 'AML', 'AMR'];
  if (defs.includes(slotRole)) return defs.includes(playerPosition);
  if (mids.includes(slotRole)) return mids.includes(playerPosition);
  if (atts.includes(slotRole)) return atts.includes(playerPosition);
  return false;
}

export function autoAssignPlayersToSlots(
  playerIds: string[],
  pool: Player[],
  form: Formation
): string[] {
  const slots = FORMATION_COORDINATES[form] || FORMATION_COORDINATES['4-3-3'];
  const players = playerIds.map((id) => pool.find((p) => p.id === id)).filter(Boolean) as Player[];
  if (players.length === 0) return playerIds;

  const result: (string | null)[] = new Array(11).fill(null);
  const unassigned = [...players];

  const getCat = (pos: string): 'GK' | 'DEF' | 'MID' | 'ATT' => {
    if (pos === 'GK') return 'GK';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(pos)) return 'DEF';
    if (['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'].includes(pos)) return 'MID';
    return 'ATT';
  };

  // 1. Assign GK to slot 0 if exists
  const gkIdx = unassigned.findIndex((p) => getCat(p.position) === 'GK');
  if (gkIdx !== -1) {
    result[0] = unassigned[gkIdx].id;
    unassigned.splice(gkIdx, 1);
  }

  // 2. Assign matching category slots
  for (let i = 1; i < slots.length; i++) {
    const slotCat = getCat(slots[i].role);
    const matchIdx = unassigned.findIndex((p) => getCat(p.position) === slotCat);
    if (matchIdx !== -1) {
      result[i] = unassigned[matchIdx].id;
      unassigned.splice(matchIdx, 1);
    }
  }

  // 3. Fill any remaining unassigned slots
  for (let i = 0; i < result.length; i++) {
    if (!result[i] && unassigned.length > 0) {
      result[i] = unassigned.shift()!.id;
    }
  }

  return result.filter(Boolean) as string[];
}

export default function DraftLeagueHubPage({ params }: LeaguePageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFixture, setSelectedFixture] = useState<DraftFixture | null>(null);
  const [liveMatchFixture, setLiveMatchFixture] = useState<DraftFixture | null>(null);
  const [isLiveMatchModalOpen, setIsLiveMatchModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isRematchModalOpen, setIsRematchModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Squad filters & view mode
  const [squadPosFilter, setSquadPosFilter] = useState<SquadPositionFilter>('ALL');
  const [squadViewMode, setSquadViewMode] = useState<SquadViewMode>('grid');

  // Fixtures filter
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'ALL'>('ALL');
  const [showOnlyMyFixtures, setShowOnlyMyFixtures] = useState(false);

  // Draft history filters
  const [historyClubFilter, setHistoryClubFilter] = useState<string>('ALL');

  // Tactical local state & interactive substitutions
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [mentality, setMentality] = useState<Mentality>('Dengeli');
  const [tempo, setTempo] = useState<Tempo>('Standart');
  const [pressing, setPressing] = useState<Pressing>('Orta');
  const [passingStyle, setPassingStyle] = useState<PassingStyle>('Kısa');
  const [defensiveLine, setDefensiveLine] = useState<DefensiveLine>('Standart');
  const [width, setWidth] = useState<Width>('Dengeli');

  // Starting 11 custom lineup IDs (interactive starter-bench swap)
  const [customLineupIds, setCustomLineupIds] = useState<string[]>([]);
  const [selectedStarterId, setSelectedStarterId] = useState<string | null>(null);
  const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);
  const [dismissedLiveMw, setDismissedLiveMw] = useState<number | null>(null);

  const fetchInFlightRef = useRef(false);
  const fetchQueuedRef = useRef(false);
  const latestRequestIdRef = useRef(0);
  const isRepairingRef = useRef(false);
  const hasRepairedRef = useRef(false);
  const isMountedRef = useRef(true);

  // FM-style Gol Krallığı, Asist, Reyting computed unconditionally at top level (Rules of Hooks)
  const seasonStats = React.useMemo(() => {
    if (!hydrationResult.state) {
      return { topScorers: [], topAssists: [], bestRatings: [] };
    }
    const { fixtures, clubs, playerPool, room } = hydrationResult.state;
    const currentSeasonNum = room.seasonNumber || room.rules?.seasonNumber || 1;
    return computeSeasonPlayerStats(fixtures, clubs, playerPool, currentSeasonNum);
  }, [hydrationResult.state]);
  const { topScorers, topAssists, bestRatings } = seasonStats;

  const sessionId = getMultiplayerSessionId();

  const fetchState = async () => {
    if (!isMountedRef.current) return;

    if (fetchInFlightRef.current) {
      fetchQueuedRef.current = true;
      console.log('LEAGUE_FETCH_SKIPPED_IN_FLIGHT');
      console.log('LEAGUE_FETCH_QUEUED');
      return;
    }

    fetchInFlightRef.current = true;
    const currentRequestId = ++latestRequestIdRef.current;
    console.log('LEAGUE_FETCH_START', currentRequestId);

    try {
      // 15-second network timeout protection
      const res = await Promise.race([
        DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId),
        new Promise<HydratedRoomResult>((_, reject) =>
          setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), 15000)
        ),
      ]);

      if (!isMountedRef.current || currentRequestId !== latestRequestIdRef.current) {
        return; // Ignore stale response
      }

      // Single-owner idempotent repair if missing fixtures/standings in active league
      if (
        res.status === 'SUCCESS' &&
        res.state &&
        res.state.room.status === 'LEAGUE_ACTIVE' &&
        (res.state.fixtures.length === 0 || res.state.standings.length === 0) &&
        !isRepairingRef.current &&
        !hasRepairedRef.current
      ) {
        isRepairingRef.current = true;
        const repairRes = await DraftMultiplayerStore.repairRoomStateAsync(
          res.state.room.id,
          res.state.members[0]?.id
        );
        hasRepairedRef.current = true;
        isRepairingRef.current = false;
        if (repairRes.success && repairRes.state && isMountedRef.current) {
          res.state = repairRes.state;
        }
      }

      // Single-owner idempotent finalization if drafting completed
      if (
        res.status === 'SUCCESS' &&
        res.state &&
        res.state.room.status === 'DRAFTING' &&
        res.state.draftState?.isCompleted &&
        !isRepairingRef.current &&
        !hasRepairedRef.current
      ) {
        isRepairingRef.current = true;
        const finalRes = await DraftMultiplayerStore.finalizeDraftLeagueAsync(res.state.room.id);
        hasRepairedRef.current = true;
        isRepairingRef.current = false;
        if (finalRes.success && finalRes.state && isMountedRef.current) {
          res.state = finalRes.state;
        }
      }

      setHydrationResult(res);

      if (res.status === 'SUCCESS' && res.state) {
        if (res.state.room.status === 'LOBBY') {
          router.push(`/draft/room/${roomCode}`);
          return;
        } else if (res.state.room.status === 'DRAFTING' && !res.state.draftState?.isCompleted) {
          router.push(`/draft/room/${roomCode}/draft`);
          return;
        }

        // Initialize custom lineup from myClub if not initialized yet
        const currentM = res.state.members.find((m: RoomMember) => m.sessionId === sessionId);
        const myC = res.state.clubs.find((c: DraftClub) => c.memberId === currentM?.id);
        if (myC && customLineupIds.length === 0) {
          const pool = res.state.playerPool;
          const myS = pool.filter((p: Player) => myC.squadPlayerIds.includes(p.id));
          if (myC.tactics) {
            if (myC.tactics.formation) setFormation(myC.tactics.formation);
            if (myC.tactics.settings?.mentality) setMentality(myC.tactics.settings.mentality);
            if (myC.tactics.settings?.tempo) setTempo(myC.tactics.settings.tempo);
            if (myC.tactics.settings?.pressing) setPressing(myC.tactics.settings.pressing);
            if (myC.tactics.settings?.passingStyle) setPassingStyle(myC.tactics.settings.passingStyle);
            if (myC.tactics.settings?.defensiveLine) setDefensiveLine(myC.tactics.settings.defensiveLine);
            if (myC.tactics.settings?.width) setWidth(myC.tactics.settings.width);
            if (myC.tactics.lineup && myC.tactics.lineup.length === 11) {
              const savedIds = myC.tactics.lineup.map((l) => l.playerId).filter(Boolean) as string[];
              if (savedIds.length === 11) {
                setCustomLineupIds(savedIds);
              }
            }
          }
        }

        if (res.state.room.status === 'CLOSED' || res.state.room.status === 'TERMINATED') {
          alert('Oda kurucusu odadan ayrıldığı için oda kapatıldı.');
          router.push('/');
          return;
        }
      }
    } catch (e: any) {
      if (!isMountedRef.current || currentRequestId !== latestRequestIdRef.current) return;
      if (e?.message === 'NETWORK_TIMEOUT') {
        setHydrationResult({
          status: 'TIMEOUT',
          errorCode: 'SC-MP-005',
          errorMessage: 'Sunucu bağlantısı zaman aşımına uğradı (15s).',
        });
      } else {
        console.warn('League fetch state error:', e);
      }
    } finally {
      fetchInFlightRef.current = false;
      console.log('LEAGUE_FETCH_END', currentRequestId);

      if (fetchQueuedRef.current && isMountedRef.current) {
        fetchQueuedRef.current = false;
        setTimeout(fetchState, 50);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchState();

    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, (event) => {
      if (event?.type === 'BROADCAST_ROOM_CLOSED') {
        alert('Oda kurucusu odadan ayrıldığı için oda kapatıldı.');
        router.push('/');
        return;
      }
      fetchState();
    });

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchState();
      }
    };
    const handleFocus = () => {
      fetchState();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // Visual timer only - does NOT trigger network requests
    const timerInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    // Fallback polling interval: 8-10 seconds when Realtime connected, 5 seconds when disconnected
    const fallbackPollMs = DraftMultiplayerStore.isServerConnected() ? 8000 : 5000;
    const pollInterval = setInterval(() => {
      fetchState();
    }, fallbackPollMs);

    return () => {
      isMountedRef.current = false;
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(timerInterval);
      clearInterval(pollInterval);
    };
  }, [roomCode]);

  // Synchronized Auto-Transition to Live Match when status turns LIVE
  useEffect(() => {
    const state = hydrationResult.state;
    if (!state) return;
    const { room, members, clubs, fixtures } = state;
    if (room.liveMatchweek?.status === 'LIVE') {
      const liveMw = room.liveMatchweek.matchweek;
      if (dismissedLiveMw === liveMw) return;

      const currentM = members.find((m: RoomMember) => m.sessionId === sessionId);
      const myC = clubs.find((c: DraftClub) => c.memberId === currentM?.id);

      const targetFixture =
        (myC
          ? fixtures.find(
              (f: DraftFixture) =>
                (f.homeClubId === myC.id || f.awayClubId === myC.id) &&
                f.round === liveMw
            )
          : null) ||
        fixtures.find((f: DraftFixture) => f.round === liveMw && (f.status === 'SIMULATING' || f.status === 'COMPLETED')) ||
        fixtures.find((f: DraftFixture) => f.round === liveMw);

      if (targetFixture && !isLiveMatchModalOpen) {
        setLiveMatchFixture(targetFixture);
        setIsLiveMatchModalOpen(true);
      }
    }
  }, [hydrationResult.state?.room?.liveMatchweek?.status, hydrationResult.state?.room?.liveMatchweek?.matchweek, sessionId, isLiveMatchModalOpen, dismissedLiveMw]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Loading state (max 8s)
  if (hydrationResult.status === 'LOADING' && elapsedSeconds < 8) {
    return (
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-[#04060A]/90 to-[#04060A]" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]" />
        </div>

        <div className="relative z-10 p-8 sm:p-10 bg-[#070D14]/95 border border-zinc-800 max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-md">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-[#00F5A0]/20 rounded-2xl animate-ping" />
            <div className="relative w-14 h-14 bg-zinc-950 border border-[#00F5A0]/50 rounded-2xl flex items-center justify-center text-2xl shadow-lg text-[#00F5A0]">
              <Trophy className="w-7 h-7 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-[#00F5A0] tracking-widest uppercase mb-1">
              SQUADCRAFT COMMAND CENTER
            </div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-wider">
              LİG MERKEZİ YÜKLENİYOR...
            </h2>
          </div>
          <p className="text-xs text-zinc-400">
            <span className="font-mono text-[#00F5A0] font-bold">{roomCode}</span> fikstür ve puan tablosu hazırlanıyor ({elapsedSeconds}s)
          </p>
          <div className="w-full bg-zinc-950 h-2 border border-zinc-800">
            <div
              className="bg-gradient-to-r from-[#00F5A0] to-[#00D4FF] h-full transition-all duration-1000 shadow-[0_0_10px_#00F5A0]"
              style={{ width: `${Math.min(100, (elapsedSeconds / 15) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Timeout or Error State
  if (hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR') {
    return (
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-[#04060A]/90 to-[#04060A]" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]" />
        </div>

        <div className="relative z-10 p-8 sm:p-10 bg-[#070D14]/95 border border-rose-900/60 max-w-lg w-full text-center space-y-5 shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 mx-auto bg-zinc-950 border border-rose-500/40 rounded-2xl flex items-center justify-center text-rose-400">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-300 uppercase italic">BU EKRAN YÜKLENEMEDİ</h2>
            <p className="text-xs text-zinc-400 mt-1">
              [SC-MP-005] Sunucu bağlantısı zaman aşımına uğradı veya lig verisi senkronize edilemedi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                fetchState();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-[#00F5A0] hover:bg-[#00D485] text-black text-xs font-black uppercase tracking-wider transition shadow-lg shadow-[#00F5A0]/20"
            >
              🔄 TEKRAR DENE
            </button>
            <Link
              href={`/draft/room/${roomCode}`}
              className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider border border-zinc-700 transition"
            >
              🚪 ODAYA DÖN
            </Link>
            <Link
              href="/draft"
              className="w-full sm:w-auto px-5 py-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider border border-zinc-800 transition"
            >
              🏠 ANA MENÜ
            </Link>
          </div>

          {/* Diagnostics Panel */}
          <div className="pt-4 border-t border-zinc-800 text-left">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center justify-between w-full"
            >
              <span>⚙️ Alfa Tanı Paneli (Diagnostics)</span>
              <span>{showDiagnostics ? '▲' : '▼'}</span>
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3 bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-zinc-400 space-y-1">
                <div>Oda Kodu: {roomCode}</div>
                <div>Oda Durumu: {hydrationResult.diagnostics?.roomStatus || 'Bilinmiyor'}</div>
                <div>State Sürümü: {hydrationResult.diagnostics?.stateVersion || 0}</div>
                <div>Fikstür Sayısı: {hydrationResult.diagnostics?.fixturesCount || 0}</div>
                <div>Puan Durumu: {hydrationResult.diagnostics?.standingsCount || 0}</div>
                <div>Aktif Hafta: {hydrationResult.diagnostics?.currentMatchweek || 1}</div>
                <div>Realtime: {hydrationResult.diagnostics?.realtimeConnected ? 'Aktif' : 'Pasif'}</div>
                <div>Son Hata: {hydrationResult.diagnostics?.lastError || 'Yok'}</div>
                <div>Son İstek: {hydrationResult.diagnostics?.lastSuccessfulFetch || '-'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (hydrationResult.status === 'NOT_FOUND') {
    return (
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-[#04060A]/90 to-[#04060A]" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]" />
        </div>

        <div className="relative z-10 p-8 sm:p-10 bg-[#070D14]/95 border border-zinc-800 max-w-md w-full text-center space-y-5 shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 mx-auto bg-zinc-950 border border-zinc-700 rounded-2xl flex items-center justify-center text-rose-400 text-2xl font-black">
            ✕
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide font-display italic">
              ODA BULUNAMADI
            </h2>
            <p className="text-xs text-rose-400 bg-rose-950/60 p-3 border border-rose-900/50 mt-2">
              [SC-MP-001] {hydrationResult.errorMessage || 'Oda bulunamadı veya süresi doldu.'}
            </p>
          </div>
          <Link
            href="/draft"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 bg-[#00F5A0] hover:bg-[#00D485] text-black transition shadow-lg shadow-[#00F5A0]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>DRAFT MERKEZİNE DÖN</span>
          </Link>
        </div>
      </div>
    );
  }

  const roomState = hydrationResult.state;
  if (!roomState) return null;

  const { room, members, clubs, fixtures, standings, awards, playerPool } = roomState;
  const currentMember = members.find((m: RoomMember) => m.sessionId === sessionId);
  const myClub = clubs.find((c: DraftClub) => c.memberId === currentMember?.id);
  const isHost = currentMember?.isHost || false;

  const mySquad = myClub ? playerPool.filter((p: Player) => myClub.squadPlayerIds.includes(p.id)) : [];

  // Matchweek progression calculations
  const totalMatchweeks = room.totalMatchweeks || (room.rules.format === 'DOUBLE_ROUND' ? (clubs.length - 1) * 2 : clubs.length - 1) || 6;
  const currentMatchweek = room.currentMatchweek || 1;

  const completedFixtures = fixtures.filter((f: DraftFixture) => f.status === 'COMPLETED');
  const isSeasonComplete = room.status === 'LEAGUE_COMPLETED' || room.leaguePhase === 'SEASON_COMPLETE' || (fixtures.length > 0 && completedFixtures.length === fixtures.length);

  // Current matchweek fixtures
  const currentWeekFixtures = fixtures.filter((f: DraftFixture) => f.round === currentMatchweek);
  const currentWeekCompleted = currentWeekFixtures.filter((f: DraftFixture) => f.status === 'COMPLETED');
  const isCurrentWeekFinished = currentWeekFixtures.length > 0 && currentWeekCompleted.length === currentWeekFixtures.length;

  // Active human managers status
  const humanMembers = members.filter((m) => !m.isBot && !m.isSpectator);
  const humanClubs = clubs.filter((c) => humanMembers.some((m) => m.id === c.memberId));

  // Next user fixture in current matchweek or upcoming
  const myNextFixture = myClub
    ? fixtures.find((f: DraftFixture) => (f.homeClubId === myClub.id || f.awayClubId === myClub.id) && f.status !== 'COMPLETED' && f.round === currentMatchweek) ||
      fixtures.find((f: DraftFixture) => (f.homeClubId === myClub.id || f.awayClubId === myClub.id) && f.status !== 'COMPLETED')
    : fixtures.find((f: DraftFixture) => f.status !== 'COMPLETED');

  const readyMemberIds = new Set(room.liveMatchweek?.readyMemberIds || []);
  const isCurrentMemberReady = currentMember ? readyMemberIds.has(currentMember.id) : false;

  // Interactive Live Match Launcher
  const handleOpenLiveMatch = (fixture: DraftFixture) => {
    setDismissedLiveMw(null);
    setLiveMatchFixture(fixture);
    setIsLiveMatchModalOpen(true);
  };

  // Close live match modal (memorize dismissal so it does not auto-reopen)
  const handleCloseLiveModal = () => {
    if (room.liveMatchweek?.matchweek) {
      setDismissedLiveMw(room.liveMatchweek.matchweek);
    }
    setIsLiveMatchModalOpen(false);
  };

  // Toggle ready status for current manager
  const handleToggleReady = (isReady: boolean) => {
    if (!currentMember) return;
    const res = DraftMultiplayerStore.setMatchweekReady(room.id, currentMember.id, isReady);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage(isReady ? 'Hafta için HAZIR veridiniz!' : 'Hazır durumunuz geri çekildi.');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Launch live matchweek (after countdown or triggered)
  const handleLaunchLiveMatchweek = () => {
    if (!currentMember) return;
    const res = DraftMultiplayerStore.launchLiveMatchweek(room.id, currentMember.id);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage('Haftanın maçları CANLI başladı!');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Callback when live simulation ends
  const handleLiveMatchFinished = (completedFix: DraftFixture) => {
    if (room.liveMatchweek?.matchweek) {
      setDismissedLiveMw(room.liveMatchweek.matchweek);
    }
    if (currentMember) {
      const res = DraftMultiplayerStore.finishLiveMatchweek(room.id, currentMember.id, completedFix);
      if (res.state) {
        setHydrationResult((prev) => ({ ...prev, state: res.state }));
        setSelectedFixture(completedFix);
        setIsLiveMatchModalOpen(false);
        setStatusMessage(`Hafta ${completedFix.round} tamamlandı ve lig puan durumu güncellendi!`);
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
    }

    const res = DraftMultiplayerStore.saveLiveMatchResult(room.id, completedFix);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setSelectedFixture(completedFix);
      setIsLiveMatchModalOpen(false);
      setStatusMessage(`Hafta ${completedFix.round} maçı tamamlandı ve puan durumu güncellendi!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Set match simulation speed (1x, 2x, 3x, 4x)
  const handleSetMatchSpeed = (speed: 1 | 2 | 3 | 4) => {
    if (!currentMember || !isHost) return;
    const res = DraftMultiplayerStore.updateMatchSpeed(room.id, currentMember.id, speed);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage(`Maç simülasyon hızı ${speed}x olarak güncellendi.`);
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Fast Simulate Fixture (Instantly simulate + auto-simulate other bots in week)
  const handleFastSimulateFixture = (fixtureId: string) => {
    const res = DraftMultiplayerStore.simulateFixture(room.id, fixtureId);
    if (!res.success) {
      setErrorMessage(res.error || '[SC-MP-006] Maç simüle edilemedi.');
      return;
    }
    if (res.state) {
      setHydrationResult((prev) => ({
        ...prev,
        state: res.state,
      }));
      const updated = res.state.fixtures.find((f: DraftFixture) => f.id === fixtureId);
      if (updated) {
        setSelectedFixture(updated);
        setIsReportModalOpen(true);
      }
      setStatusMessage('Maç ve haftanın yapay zeka karşılaşmaları simüle edildi! Puan durumu güncellendi.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Simulate all remaining matches in current matchweek
  const handleSimulateRemainingInWeek = () => {
    const pendingInWeek = currentWeekFixtures.filter((f: DraftFixture) => f.status !== 'COMPLETED');
    if (pendingInWeek.length === 0) return;

    let lastState: any = null;
    for (const f of pendingInWeek) {
      const res = DraftMultiplayerStore.simulateFixture(room.id, f.id);
      if (res.state) lastState = res.state;
    }
    if (lastState) {
      setHydrationResult((prev) => ({ ...prev, state: lastState }));
    } else {
      fetchState();
    }
    setStatusMessage(`Hafta ${currentMatchweek} maçlarının tamamı simüle edildi ve puan durumu güncellendi!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Advance to next matchweek
  const handleAdvanceMatchweek = () => {
    if (!currentMember || !isHost) return;
    const res = DraftMultiplayerStore.advanceMatchweek(room.id, currentMember.id);
    if (!res.success) {
      setErrorMessage(res.error || 'Sonraki haftaya geçilemedi.');
      return;
    }
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage(`Hafta ${res.state.room.currentMatchweek} başladı!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Diagnostic room repair
  const handleRepairRoom = () => {
    if (!currentMember) return;
    const res = DraftMultiplayerStore.repairRoomState(room.id, currentMember.id);
    if (res.success && res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage('Oda ve lig durumu başarıyla onarıldı!');
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setErrorMessage(res.error || 'Oda onarılamadı.');
    }
  };

  const handleLeaveRoom = async () => {
    if (isHost && currentMember) {
      const confirmed = window.confirm('Oda kurucususunuz. Odadan ayrıldığınızda oda kapatılacak ve tüm katılımcılar ana sayfaya yönlendirilecektir. Ayrılmak istiyor musunuz?');
      if (!confirmed) return;
      await DraftMultiplayerStore.closeRoomByHost(room.id, currentMember.id);
      router.push('/');
    } else {
      router.push('/draft');
    }
  };

  // Formation change handler
  const handleFormationChange = (newFormation: Formation) => {
    setFormation(newFormation);
    const currentLineup = customLineupIds.length === 11 ? customLineupIds : mySquad.slice(0, 11).map((p) => p.id);
    const reordered = autoAssignPlayersToSlots(currentLineup, mySquad, newFormation);
    setCustomLineupIds(reordered);
    setSelectedStarterId(null);
    setSelectedBenchId(null);
    setStatusMessage(`Diziliş ${newFormation} olarak ayarlandı. Kadro sahaya yerleştirildi.`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Interactive Pitch Player Click (Select or Pitch-to-Pitch Swap)
  const handlePitchPlayerClick = (playerId: string) => {
    if (!selectedStarterId) {
      setSelectedStarterId(playerId);
      setSelectedBenchId(null);
      return;
    }

    if (selectedStarterId === playerId) {
      setSelectedStarterId(null);
      return;
    }

    // Another starter clicked -> swap their positions on the pitch!
    const idx1 = customLineupIds.indexOf(selectedStarterId);
    const idx2 = customLineupIds.indexOf(playerId);
    if (idx1 !== -1 && idx2 !== -1) {
      const nextLineup = [...customLineupIds];
      nextLineup[idx1] = playerId;
      nextLineup[idx2] = selectedStarterId;
      setCustomLineupIds(nextLineup);

      const p1 = mySquad.find((p) => p.id === selectedStarterId);
      const p2 = mySquad.find((p) => p.id === playerId);
      setSelectedStarterId(null);
      setStatusMessage(`${p1?.lastName || 'Oyuncu 1'} ile ${p2?.lastName || 'Oyuncu 2'} mevkileri değiştirildi!`);
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  // Interactive Bench Player Click (Select or Starter-to-Bench Swap)
  const handleBenchPlayerClick = (benchPlayerId: string) => {
    if (selectedStarterId) {
      const starterId = selectedStarterId;
      const updatedLineup = customLineupIds.map((id) => (id === starterId ? benchPlayerId : id));
      setCustomLineupIds(updatedLineup);
      setSelectedStarterId(null);
      setSelectedBenchId(null);

      const pStarter = mySquad.find((p) => p.id === starterId);
      const pBench = mySquad.find((p) => p.id === benchPlayerId);
      setStatusMessage(`${pStarter?.lastName || 'As oyuncu'} yerine ${pBench?.lastName || 'Yedek oyuncu'} oyuna alındı!`);
      setTimeout(() => setStatusMessage(null), 2000);
    } else {
      setSelectedBenchId(selectedBenchId === benchPlayerId ? null : benchPlayerId);
    }
  };

  // Auto best XI
  const handleAutoBestXI = () => {
    if (!mySquad || mySquad.length === 0) return;

    const gks = mySquad.filter((p: Player) => p.position === 'GK').sort((a, b) => b.overall - a.overall);
    const defs = mySquad.filter((p: Player) => ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const mids = mySquad.filter((p: Player) => ['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const atts = mySquad.filter((p: Player) => ['LW', 'RW', 'ST', 'CF', 'AML', 'AMR'].includes(p.position)).sort((a, b) => b.overall - a.overall);

    const candidates = [
      ...gks.slice(0, 1),
      ...defs.slice(0, 5),
      ...mids.slice(0, 5),
      ...atts.slice(0, 4),
    ].sort((a, b) => b.overall - a.overall);

    const best11: Player[] = [];
    if (gks.length > 0) best11.push(gks[0]);
    const others = candidates.filter((p) => p.id !== gks[0]?.id);
    for (const p of others) {
      if (best11.length < 11) best11.push(p);
    }

    const assigned = autoAssignPlayersToSlots(best11.map((p) => p.id), mySquad, formation);
    setCustomLineupIds(assigned);
    setSelectedStarterId(null);
    setSelectedBenchId(null);

    if (myClub && currentMember) {
      const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3'];
      const tactics = {
        clubId: myClub.id,
        formation,
        settings: { mentality, tempo, pressing, passingStyle, defensiveLine, width },
        lineup: assigned.map((id, idx) => ({
          slotId: idx,
          role: slots[idx]?.role || 'MC',
          x: slots[idx]?.x || 50,
          y: slots[idx]?.y || 50,
          playerId: id,
        })),
        substitutes: mySquad.filter((p: Player) => !assigned.includes(p.id)).slice(0, 7).map((p: Player) => p.id),
        reserves: mySquad.filter((p: Player) => !assigned.includes(p.id)).slice(7).map((p: Player) => p.id),
      };
      const res = DraftMultiplayerStore.updateClubTactics(room.id, currentMember.id, tactics as any);
      if (res.state) {
        setHydrationResult((prev) => ({ ...prev, state: res.state }));
      }
    }

    setStatusMessage('En iyi 11 otomatik dizildi ve taktiğe işlendi!');
    setTimeout(() => setStatusMessage(null), 2500);
  };

  // Interactive Starter & Bench Swap Handler
  const handleSwapStarterAndBench = (starterId: string, benchId: string) => {
    const updatedLineup = customLineupIds.map((id) => (id === starterId ? benchId : id));
    setCustomLineupIds(updatedLineup);
    setSelectedStarterId(null);
    setSelectedBenchId(null);

    if (myClub && currentMember) {
      const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3'];
      const tactics = {
        clubId: myClub.id,
        formation,
        settings: { mentality, tempo, pressing, passingStyle, defensiveLine, width },
        lineup: updatedLineup.map((id, idx) => ({
          slotId: idx,
          role: slots[idx]?.role || 'MC',
          x: slots[idx]?.x || 50,
          y: slots[idx]?.y || 50,
          playerId: id,
        })),
        substitutes: mySquad.filter((p) => !updatedLineup.includes(p.id)).slice(0, 7).map((p) => p.id),
        reserves: mySquad.filter((p) => !updatedLineup.includes(p.id)).slice(7).map((p) => p.id),
      };
      DraftMultiplayerStore.updateClubTactics(room.id, currentMember.id, tactics as any);
      setStatusMessage('Oyuncu değişikliği başarıyla yapıldı ve taktiğe işlendi!');
      setTimeout(() => setStatusMessage(null), 2000);
    }
  };

  // Save Tactics
  const handleSaveTactics = () => {
    if (!myClub || !currentMember) return;
    const lineupToSave = customLineupIds.length === 11 ? customLineupIds : mySquad.slice(0, 11).map((p) => p.id);
    const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3'];
    const tactics = {
      clubId: myClub.id,
      formation,
      settings: { mentality, tempo, pressing, passingStyle, defensiveLine, width },
      lineup: lineupToSave.map((id, idx) => ({
        slotId: idx,
        role: slots[idx]?.role || 'MC',
        x: slots[idx]?.x || 50,
        y: slots[idx]?.y || 50,
        playerId: id,
      })),
      substitutes: mySquad.filter((p) => !lineupToSave.includes(p.id)).slice(0, 7).map((p) => p.id),
      reserves: mySquad.filter((p) => !lineupToSave.includes(p.id)).slice(7).map((p) => p.id),
    };
    const res = DraftMultiplayerStore.updateClubTactics(room.id, currentMember.id, tactics as any);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage(`Taktik kaydedildi: ${formation} (${mentality})`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Rematch
  const handleRematch = () => {
    if (!currentMember || !isHost) return;
    setIsRematchModalOpen(true);
  };

  const handleConfirmRematch = () => {
    if (!currentMember || !isHost) return;
    const res = DraftMultiplayerStore.rematch(room.id, currentMember.id, true);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage(`Sezon ${res.state.room.seasonNumber || 2} başarıyla başlatıldı! Kadrolar ve taktikler korundu.`);
      setTimeout(() => setStatusMessage(null), 4000);
    } else if (res.error) {
      setErrorMessage(res.error);
    }
    setIsRematchModalOpen(false);
  };

  // Filter squad
  const filteredSquad = mySquad.filter((p) => {
    if (squadPosFilter === 'GK') return p.position === 'GK';
    if (squadPosFilter === 'DEF') return ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(p.position);
    if (squadPosFilter === 'MID') return ['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'].includes(p.position);
    if (squadPosFilter === 'ATT') return ['LW', 'RW', 'ST', 'CF', 'AML', 'AMR'].includes(p.position);
    return true;
  });

  // Calculate team stats & OVR averages
  const activeStarters = mySquad.filter((p) => customLineupIds.includes(p.id));
  const activeBench = mySquad.filter((p) => !customLineupIds.includes(p.id));

  const teamAvgOvr = mySquad.length > 0 ? (mySquad.reduce((sum, p) => sum + p.overall, 0) / mySquad.length).toFixed(1) : '0.0';
  const xiAvgOvr = activeStarters.length > 0 ? (activeStarters.reduce((sum, p) => sum + p.overall, 0) / activeStarters.length).toFixed(1) : teamAvgOvr;
  const benchAvgOvr = activeBench.length > 0 ? (activeBench.reduce((sum, p) => sum + p.overall, 0) / activeBench.length).toFixed(1) : '0.0';

  const progressPercent = fixtures.length > 0 ? Math.round((completedFixtures.length / fixtures.length) * 100) : 0;
  const currentSeasonNum = room.seasonNumber || room.rules?.seasonNumber || 1;

  // Real season player statistics leaderboards (FM-style Gol Krallığı, Asist, Reyting) are computed at top level

  // Filtered fixtures for Fixtures tab
  const displayedFixtures = fixtures.filter((f: DraftFixture) => {
    if (selectedWeekFilter !== 'ALL' && f.round !== selectedWeekFilter) return false;
    if (showOnlyMyFixtures && myClub && f.homeClubId !== myClub.id && f.awayClubId !== myClub.id) return false;
    return true;
  });

  // Filtered draft picks
  const displayedPicks = (roomState.draftState?.picks || []).filter((pick: DraftPick) => {
    if (historyClubFilter !== 'ALL' && pick.clubId !== historyClubFilter) return false;
    return true;
  });

  // Function to get OVR badge color
  const getOvrColor = (ovr: number) => {
    if (ovr >= 88) return 'from-[#FFB800] via-[#FFE082] to-[#FF8F00] text-black border-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.4)]';
    if (ovr >= 84) return 'from-[#00F5A0] via-[#69F0AE] to-[#00BFA5] text-black border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.4)]';
    if (ovr >= 80) return 'from-[#00D4FF] via-[#80D8FF] to-[#0091EA] text-black border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)]';
    return 'from-zinc-700 to-zinc-800 text-zinc-200 border-zinc-600 shadow-zinc-700/30';
  };

  return (
    <div className="relative min-h-screen bg-[#04060A] text-zinc-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* ==================================================================== */}
      {/* 1. HIGH-CONTRAST STADIUM ARENA BACKGROUND (FULL VIEWPORT)            */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-[#04060A]/90 to-[#04060A]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]" />
      </div>

      {/* Top Stadium Light Beam */}
      <div className="relative z-30 h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F5A0]/80 via-[#00D4FF]/60 to-transparent shadow-[0_0_15px_#00F5A0]" />

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT ORIGINAL LEAGUE COMMAND CENTER TOP HUD                 */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070D14]/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="hidden sm:inline">ODADAN AYRIL</span>
            </button>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 sm:h-9 w-11 sm:w-13 flex items-center justify-center">
                <Image
                  src="/images/sc-emblem-official-hd.png"
                  alt="SquadCraft SC"
                  width={52}
                  height={36}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 font-black uppercase italic tracking-tighter text-lg sm:text-xl leading-none">
                  <span className="text-white group-hover:text-zinc-100 transition-colors">SQUADCRAFT</span>
                  <span className="text-[#00F5A0]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#00D4FF] uppercase mt-0.5">
                  LEAGUE COMMAND CENTER
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Live Match Stats & Room Status */}
          <div className="hidden lg:flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 px-4 py-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSeasonComplete ? 'bg-[#FFB800]' : 'bg-[#00F5A0]'} animate-pulse`} />
              <span className="text-xs font-black uppercase tracking-wider text-white font-display">
                {room.name}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] text-[10px] font-mono font-black uppercase tracking-wider">
              SEZON {currentSeasonNum}
            </span>
            <span className="text-zinc-600">|</span>
            <span className={`text-[11px] font-mono font-bold uppercase ${isSeasonComplete ? 'text-[#FFB800]' : 'text-[#00F5A0]'}`}>
              {isSeasonComplete ? '🏆 SEZON ŞAMPİYONLUĞU' : `⚽ HAFTA ${currentMatchweek} / ${totalMatchweeks}`}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase">
              {clubs.length} KULÜP • {completedFixtures.length}/{fixtures.length} MAÇ (%{progressPercent})
            </span>
          </div>

          {/* Right: Telemetry & Room Code Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
              <span>SUNUCU: AKTİF</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#00D4FF]">14ms TR</span>
            </div>

            {isHost && (
              <button
                onClick={handleRepairRoom}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
                title="Oda ve lig verisini senkronize et"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span>Odayı Onar</span>
              </button>
            )}

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Geri Bildirim</span>
            </button>

            {/* Room Code Copy Badge */}
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-2 px-4 py-2 border text-xs font-mono font-bold transition shadow-lg ${
                copiedCode
                  ? 'bg-[#00F5A0] text-black border-[#00F5A0] shadow-[#00F5A0]/20'
                  : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-700 text-[#00F5A0]'
              }`}
              title="Kodu Kopyalamak İçin Tıklayın"
            >
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-sans font-bold">ODA:</span>
              <span className="font-black text-sm tracking-wider">{roomCode}</span>
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-[#00F5A0]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ALERT BANNERS */}
      {statusMessage && (
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-3">
          <div className="p-3.5 bg-emerald-950/90 border border-[#00F5A0]/70 text-[#00F5A0] text-xs font-bold flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-[#00F5A0] hover:text-white px-2 py-0.5">✕</button>
          </div>
        </div>
      )}
      {errorMessage && (
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-3">
          <div className="p-3.5 bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-bold flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white px-2 py-0.5">✕</button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. HERO MATCHWEEK COMMAND STRIP                                      */}
      {/* ==================================================================== */}
      <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-4">
        <div className="bg-[#070D14]/95 border border-zinc-800 p-4 sm:p-5 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[#00F5A0] font-bold text-base shadow-inner">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 bg-[#FFB800]/20 border border-[#FFB800]/50 text-[#FFB800] uppercase tracking-wider">
                    SEZON {currentSeasonNum}
                  </span>
                  <span className="text-sm sm:text-base font-black text-white uppercase italic tracking-wider font-display">
                    {isSeasonComplete ? 'LİG SEZONU TAMAMLANDI' : `HAFTA ${currentMatchweek} / ${totalMatchweeks} İLERLEMESİ`}
                  </span>
                  {!isSeasonComplete && (
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.5 bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] uppercase">
                      %{progressPercent} TAMAMLANDI
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Bu hafta oynanan: <span className="font-bold text-white">{currentWeekCompleted.length}</span> / <span className="font-bold text-white">{currentWeekFixtures.length}</span> Karşılaşma
                </div>
              </div>
            </div>

            {/* Broadcast Action CTAs */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
              {/* Match Speed Selector */}
              <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-zinc-800 px-3 py-2 text-xs">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#00F5A0]" />
                  <span>HIZ:</span>
                </span>
                {([1, 2, 3, 4] as const).map((spd) => {
                  const currentSpeed =
                    room.rules?.matchSpeed ||
                    (room.liveMatchweek?.paceMs === 200
                      ? 4
                      : room.liveMatchweek?.paceMs === 266
                      ? 3
                      : room.liveMatchweek?.paceMs === 400
                      ? 2
                      : 1);
                  const isSelected = currentSpeed === spd;
                  return (
                    <button
                      key={spd}
                      onClick={() => isHost && handleSetMatchSpeed(spd)}
                      disabled={!isHost}
                      className={`px-2 py-0.5 font-mono text-[11px] font-black transition-all ${
                        isSelected
                          ? 'bg-[#00F5A0] text-black shadow-sm'
                          : isHost
                          ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'text-zinc-600 cursor-not-allowed'
                      }`}
                      title={isHost ? `Maç hızını ${spd}x yap` : `Yalnızca kurucu hızı değiştirebilir (${spd}x)`}
                    >
                      {spd}x
                    </button>
                  );
                })}
              </div>

              {!isSeasonComplete && (
                <>
                  {room.liveMatchweek?.status === 'LIVE' && (
                    <button
                      onClick={() => {
                        const target = myNextFixture || fixtures.find((f) => f.round === currentMatchweek);
                        if (target) handleOpenLiveMatch(target);
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 animate-pulse active:scale-95"
                    >
                      <Radio className="w-4 h-4" />
                      <span>🔴 CANLI MAÇ YAYININA GİRİŞ YAP</span>
                    </button>
                  )}

                  {room.liveMatchweek?.status === 'COUNTDOWN' && (
                    <div className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 animate-bounce">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>GERİ SAYIM BAŞLADI... DÜDÜK ÇALIYOR!</span>
                    </div>
                  )}

                  {(!room.liveMatchweek || room.liveMatchweek.status === 'PREPARING') && !isCurrentWeekFinished && (
                    <>
                      <button
                        onClick={() => handleToggleReady(!isCurrentMemberReady)}
                        className={`w-full sm:w-auto px-6 py-3 font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
                          isCurrentMemberReady
                            ? 'bg-zinc-900 border-2 border-amber-500/60 text-amber-300'
                            : 'bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black border-2 border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                        }`}
                      >
                        {isCurrentMemberReady ? (
                          <>
                            <RotateCcw className="w-4 h-4 text-amber-400" />
                            <span>HAZIR VERİLDİ (İPTAL ET)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 fill-current" />
                            <span>HAZIR</span>
                          </>
                        )}
                      </button>

                      {isHost && (
                        <button
                          onClick={handleSimulateRemainingInWeek}
                          className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
                          title="Haftanın maçlarını Match Engine ile anında tamamla"
                        >
                          <Play className="w-3.5 h-3.5 text-[#00D4FF]" />
                          <span>HAFTAYI OYNA</span>
                        </button>
                      )}
                    </>
                  )}

                  {isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                    <button
                      onClick={handleAdvanceMatchweek}
                      className="px-6 py-3 bg-gradient-to-r from-[#00F5A0] to-[#00D4FF] hover:from-[#00E590] text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 active:scale-95"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>SONRAKİ HAFTAYA GEÇ (HAFTA {currentMatchweek + 1})</span>
                    </button>
                  )}

                  {!isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                    <div className="text-xs text-[#FFB800] font-bold px-4 py-2.5 bg-amber-950/60 border border-[#FFB800]/40 flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Kurucunun Hafta {currentMatchweek + 1}'e geçmesi bekleniyor...</span>
                    </div>
                  )}
                </>
              )}

              {isSeasonComplete && (
                isHost ? (
                  <button
                    onClick={handleRematch}
                    className="px-6 py-3 bg-gradient-to-r from-[#FFB800] to-[#E5A500] hover:from-[#FFE082] text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 active:scale-95"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>YENİ SEZON BAŞLAT (REMATCH)</span>
                  </button>
                ) : (
                  <div className="text-xs text-[#FFB800] font-bold px-4 py-2.5 bg-amber-950/60 border border-[#FFB800]/40 flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Kurucu yeni sezonu başlatmayı bekliyor.</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-zinc-950 h-2 border border-zinc-800 mt-4">
            <div
              className="bg-gradient-to-r from-[#00F5A0] via-[#00D4FF] to-[#FFB800] h-full transition-all duration-700 shadow-[0_0_10px_#00F5A0]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. CHAMPION PODIUM BANNER (When completed)                           */}
      {/* ==================================================================== */}
      {isSeasonComplete && awards && (
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-4">
          <div className="bg-gradient-to-r from-amber-950/90 via-[#070D14] to-amber-950/90 border-2 border-[#FFB800] p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-zinc-950 border-2 border-[#FFB800] flex items-center justify-center text-4xl shadow-lg animate-bounce">
                  👑
                </div>
                <div>
                  <div className="text-xs font-black text-[#FFB800] uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>SQUADCRAFT DRAFT LİGİ ŞAMPİYONU</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-wide uppercase mt-1">
                    {awards.championClubName}
                  </h2>
                  <p className="text-xs text-zinc-300 mt-1">
                    Sezon boyunca gösterilen üstün taktiksel performans ve lig puanı ile şampiyonluk kupasını kazandı!
                  </p>
                </div>
              </div>

              {isHost ? (
                <button
                  onClick={handleRematch}
                  className="px-6 py-3.5 bg-gradient-to-r from-[#FFB800] to-[#E5A500] hover:from-[#FFE082] text-black font-black text-xs uppercase tracking-wider transition shadow-lg active:scale-95"
                >
                  🔄 AYNI KADROLARLA YENİ LİG (REMATCH)
                </button>
              ) : (
                <div className="text-xs text-[#FFB800] font-bold px-4 py-2.5 bg-amber-950/60 border border-[#FFB800]/40 flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Kurucu yeni sezonu başlatmayı bekliyor.</span>
                </div>
              )}
            </div>

            {/* Awards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {awards.topScorer && (
                <div className="bg-zinc-950 p-3.5 border border-[#FFB800]/40">
                  <div className="text-[#FFB800] text-[10px] font-black uppercase tracking-wider mb-1">⚽ Gol Kralı</div>
                  <div className="font-black text-white text-xs truncate">{awards.topScorer.playerName}</div>
                  <div className="text-[#FFB800] font-mono font-black text-sm mt-0.5">{awards.topScorer.goals} Gol</div>
                </div>
              )}
              {awards.topAssists && (
                <div className="bg-zinc-950 p-3.5 border border-[#00D4FF]/40">
                  <div className="text-[#00D4FF] text-[10px] font-black uppercase tracking-wider mb-1">🎯 Asist Kralı</div>
                  <div className="font-black text-white text-xs truncate">{awards.topAssists.playerName}</div>
                  <div className="text-[#00D4FF] font-mono font-black text-sm mt-0.5">{awards.topAssists.assists} Asist</div>
                </div>
              )}
              {awards.bestRating && (
                <div className="bg-zinc-950 p-3.5 border border-[#00F5A0]/40">
                  <div className="text-[#00F5A0] text-[10px] font-black uppercase tracking-wider mb-1">⭐ Sezonun MVP'si</div>
                  <div className="font-black text-white text-xs truncate">{awards.bestRating.playerName}</div>
                  <div className="text-[#00F5A0] font-mono font-black text-sm mt-0.5">{awards.bestRating.rating} / 10</div>
                </div>
              )}
              {awards.bestGoalkeeper && (
                <div className="bg-zinc-950 p-3.5 border border-purple-500/40">
                  <div className="text-purple-400 text-[10px] font-black uppercase tracking-wider mb-1">🧤 En İyi Kaleci</div>
                  <div className="font-black text-white text-xs truncate">{awards.bestGoalkeeper.playerName}</div>
                  <div className="text-purple-300 font-mono font-black text-sm mt-0.5">{awards.bestGoalkeeper.cleanSheets} Maç Gol Yemedi</div>
                </div>
              )}
              {awards.bestAttack && (
                <div className="bg-zinc-950 p-3.5 border border-orange-500/40">
                  <div className="text-orange-400 text-[10px] font-black uppercase tracking-wider mb-1">🔥 En İyi Hücum</div>
                  <div className="font-black text-white text-xs truncate">{awards.bestAttack.clubName}</div>
                  <div className="text-orange-300 font-mono font-black text-sm mt-0.5">{awards.bestAttack.goalsFor} Gol</div>
                </div>
              )}
              {awards.bestDefense && (
                <div className="bg-zinc-950 p-3.5 border border-blue-500/40">
                  <div className="text-blue-400 text-[10px] font-black uppercase tracking-wider mb-1">🛡️ En İyi Savunma</div>
                  <div className="font-black text-white text-xs truncate">{awards.bestDefense.clubName}</div>
                  <div className="text-blue-300 font-mono font-black text-sm mt-0.5">{awards.bestDefense.goalsAgainst} Yenilen</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. BROADCAST NAVIGATION TAB RIBBON                                   */}
      {/* ==================================================================== */}
      <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-800 no-scrollbar">
          {[
            { id: 'overview', label: 'Genel Bakış', icon: BarChart3 },
            { id: 'squad', label: `Kadrom (${mySquad.length}/18)`, icon: Users },
            { id: 'tactics', label: 'Taktik & Diziliş', icon: Sliders },
            { id: 'fixtures', label: 'Fikstür & Maçlar', icon: Calendar },
            { id: 'standings', label: 'Puan Durumu', icon: Trophy },
            { id: 'players', label: 'İstatistikler', icon: Award },
            { id: 'history', label: 'Draft Geçmişi', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#00F5A0] text-black shadow-lg shadow-[#00F5A0]/20'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 6. MAIN CONTENT PANELS                                               */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-4 flex-1">
        {/* ================================================================== */}
        {/* TAB 1: GENEL BAKIŞ (OVERVIEW)                                      */}
        {/* ================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Top Interactive Ready System Hub */}
            {!isSeasonComplete && (
              <MatchweekReadyBanner
                matchweek={currentMatchweek}
                totalMatchweeks={totalMatchweeks}
                liveMatchweek={room.liveMatchweek}
                members={members}
                clubs={clubs}
                currentMemberId={currentMember?.id}
                isHost={isHost}
                onToggleReady={handleToggleReady}
                onLaunchMatchweek={handleLaunchLiveMatchweek}
                onOpenLiveMatch={() => {
                  const target = myNextFixture || fixtures.find((f) => f.round === currentMatchweek);
                  if (target) handleOpenLiveMatch(target);
                }}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left 8 Cols: Spotlight Matchday & Results */}
              <div className="lg:col-span-8 space-y-5">
                {/* Matchday Spotlight Card */}
                <div className="bg-[#070D14]/95 border border-zinc-800 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5 mb-5">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#00F5A0]" />
                      <h3 className="text-sm font-black text-white uppercase italic tracking-wider font-display">
                        {myNextFixture
                          ? `SIRADAKİ KARŞILAŞMA (HAFTA ${myNextFixture.round})`
                          : isSeasonComplete
                          ? 'TÜM LİG MAÇLARI TAMAMLANDI'
                          : 'SIRADAKİ MAÇ'}
                      </h3>
                    </div>
                    {myNextFixture && (
                      <span className="text-[10px] px-3 py-1 bg-zinc-950 border border-zinc-800 text-[#00F5A0] font-mono font-black uppercase">
                        {myNextFixture.status === 'COMPLETED'
                          ? 'TAMAMLANDI'
                          : room.liveMatchweek?.status === 'LIVE'
                          ? 'CANLI MAÇ'
                          : isCurrentMemberReady
                          ? 'HAZIR VERİLDİ'
                          : 'HAZIR BEKLENİYOR'}
                      </span>
                    )}
                  </div>

                  {myNextFixture ? (
                    <div>
                      {(() => {
                        const homeClub = clubs.find((c: DraftClub) => c.id === myNextFixture.homeClubId);
                        const awayClub = clubs.find((c: DraftClub) => c.id === myNextFixture.awayClubId);

                        return (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 sm:p-6 bg-zinc-950/80 border border-zinc-800">
                            {/* Home Club */}
                            <div className="text-center space-y-2.5 flex-1 max-w-[200px]">
                              <div className="flex justify-center">
                                {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={76} />}
                              </div>
                              <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                                {homeClub?.name}
                              </div>
                              <div className="text-xs text-zinc-400 font-bold">Menajer: {homeClub?.managerName}</div>
                            </div>

                            {/* Center Score / VS */}
                            <div className="text-center space-y-3 flex-1">
                              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest">
                                {myNextFixture.status === 'COMPLETED' ? (
                                  <span className="text-[#00F5A0]">
                                    {myNextFixture.homeScore} - {myNextFixture.awayScore}
                                  </span>
                                ) : (
                                  <span className="text-[#00D4FF]">
                                    VS
                                  </span>
                                )}
                              </div>

                              {myNextFixture.status === 'COMPLETED' ? (
                                <button
                                  onClick={() => {
                                    setSelectedFixture(myNextFixture);
                                    setIsReportModalOpen(true);
                                  }}
                                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider border border-zinc-700 transition flex items-center gap-1.5 mx-auto"
                                >
                                  <Eye className="w-3.5 h-3.5 text-[#00D4FF]" />
                                  <span>MAÇ RAPORU</span>
                                </button>
                              ) : room.liveMatchweek?.status === 'LIVE' ? (
                                <button
                                  onClick={() => handleOpenLiveMatch(myNextFixture)}
                                  className="px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-rose-600/30 flex items-center gap-2 animate-pulse mx-auto active:scale-95"
                                >
                                  <Radio className="w-4 h-4" />
                                  <span>CANLI MAÇI İZLE</span>
                                </button>
                              ) : room.liveMatchweek?.status === 'COUNTDOWN' ? (
                                <div className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 animate-bounce mx-auto">
                                  <Clock className="w-4 h-4 animate-spin" />
                                  <span>BAŞLIYOR (GERİ SAYIM)</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleToggleReady(!isCurrentMemberReady)}
                                  className={`px-6 py-3 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 mx-auto active:scale-95 ${
                                    isCurrentMemberReady
                                      ? 'bg-zinc-900 border-2 border-amber-500/60 text-amber-300'
                                      : 'bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black border-2 border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                                  }`}
                                >
                                  {isCurrentMemberReady ? (
                                    <>
                                      <RotateCcw className="w-4 h-4 text-amber-400" />
                                      <span>HAZIR VERİLDİ (İPTAL ET)</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 fill-current" />
                                      <span>HAZIR VER</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Away Club */}
                            <div className="text-center space-y-2.5 flex-1 max-w-[200px]">
                              <div className="flex justify-center">
                                {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={76} />}
                              </div>
                              <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                                {awayClub?.name}
                              </div>
                              <div className="text-xs text-zinc-400 font-bold">Menajer: {awayClub?.managerName}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400 text-xs bg-zinc-950 border border-zinc-800">
                      Lig fikstüründeki tüm karşılaşmalar tamamlandı! Şampiyonluk podyumunu yukarıda inceleyebilirsiniz.
                    </div>
                  )}
                </div>

              {/* Recent Match Results */}
              <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <Activity className="w-4 h-4 text-[#00D4FF]" />
                    <span>SON KARŞILAŞMALAR</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('fixtures')}
                    className="text-xs font-bold text-[#00F5A0] hover:underline flex items-center gap-1 uppercase"
                  >
                    <span>Tüm Fikstür</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {completedFixtures.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-6">Henüz tamamlanan maç bulunmuyor.</div>
                  ) : (
                    completedFixtures
                      .slice(-4)
                      .reverse()
                      .map((f: DraftFixture) => {
                        const h = clubs.find((c: DraftClub) => c.id === f.homeClubId);
                        const a = clubs.find((c: DraftClub) => c.id === f.awayClubId);

                        return (
                          <div
                            key={f.id}
                            onClick={() => {
                              setSelectedFixture(f);
                              setIsReportModalOpen(true);
                            }}
                            className="p-3.5 bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs hover:border-[#00F5A0]/60 cursor-pointer transition shadow-sm"
                          >
                            <div className="flex items-center gap-2.5 truncate flex-1">
                              <span className="text-[10px] font-mono text-zinc-500 font-bold px-2 py-0.5 bg-zinc-900 border border-zinc-800">
                                H{f.round}
                              </span>
                              {h && <BadgePreview badge={h.badge} clubCode={h.code} size={22} />}
                              <span className="font-black text-white truncate uppercase">{h?.name}</span>
                            </div>

                            <div className="px-4 py-1 bg-zinc-900 border border-zinc-700 font-mono font-black text-[#00F5A0] text-sm">
                              {f.homeScore} - {f.awayScore}
                            </div>

                            <div className="flex items-center gap-2.5 truncate justify-end flex-1">
                              <span className="font-black text-white truncate uppercase">{a?.name}</span>
                              {a && <BadgePreview badge={a.badge} clubCode={a.code} size={22} />}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Standings Preview */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <Trophy className="w-4 h-4 text-[#FFB800]" />
                    <span>PUAN DURUMU</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('standings')}
                    className="text-xs font-bold text-[#00F5A0] hover:underline flex items-center gap-1 uppercase"
                  >
                    <span>Detaylı Tablo</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {standings.map((st: DraftStanding) => {
                    const club = clubs.find((c: DraftClub) => c.id === st.clubId);
                    const isMine = myClub?.id === st.clubId;

                    return (
                      <div
                        key={st.clubId}
                        className={`p-3 flex items-center justify-between border transition ${
                          isMine
                            ? 'bg-[#00F5A0]/10 border-[#00F5A0]/60 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                            : 'bg-zinc-950/80 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-5 text-center font-mono font-black ${
                              st.rank === 1 ? 'text-[#FFB800]' : st.rank <= 3 ? 'text-[#00F5A0]' : 'text-zinc-400'
                            }`}
                          >
                            {st.rank}
                          </span>
                          {club && <BadgePreview badge={club.badge} clubCode={club.code} size={24} />}
                          <span className="font-black text-white truncate uppercase">
                            {st.clubName} {isMine && <span className="text-[10px] text-[#00F5A0] font-black">(SEN)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="text-zinc-400 text-[11px]">{st.played}M</span>
                          <span className="text-[#00F5A0] text-xs px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 font-black">
                            {st.points}P
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ================================================================== */}
        {/* TAB 2: KADROM (SQUAD ROSTER)                                       */}
        {/* ================================================================== */}
        {activeTab === 'squad' && (
          <div className="space-y-5">
            {/* Squad Summary Card */}
            <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {myClub && <BadgePreview badge={myClub.badge} clubCode={myClub.code} size={56} />}
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase italic tracking-wide flex items-center gap-2 font-display">
                    <span>{myClub?.name || 'Kulübüm'}</span>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/40 font-bold">
                      {mySquad.length} / 18 OYUNCU
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Menajer: <span className="text-white font-bold">{myClub?.managerName}</span> • Formasyon: <span className="text-[#00F5A0] font-mono font-bold">{formation}</span>
                  </p>
                </div>
              </div>

              {/* Squad OVR Stats */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-400 uppercase font-black">İlk 11 Gücü</div>
                  <div className="text-base font-mono font-black text-[#00F5A0]">{xiAvgOvr} OVR</div>
                </div>
                <div className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-400 uppercase font-black">Kadro Ort.</div>
                  <div className="text-base font-mono font-black text-[#00D4FF]">{teamAvgOvr} OVR</div>
                </div>
                <div className="px-4 py-2 bg-zinc-950 border border-zinc-800 text-center">
                  <div className="text-[10px] text-zinc-400 uppercase font-black">Yedek Gücü</div>
                  <div className="text-base font-mono font-black text-zinc-300">{benchAvgOvr} OVR</div>
                </div>
              </div>
            </div>

            {/* Positional Filters & View Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 border border-zinc-800">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as SquadPositionFilter[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSquadPosFilter(pos)}
                    className={`px-3.5 py-1.5 text-xs font-black uppercase transition ${
                      squadPosFilter === pos
                        ? 'bg-[#00F5A0] text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pos === 'ALL' ? 'Tümü' : pos === 'DEF' ? 'Savunma' : pos === 'MID' ? 'Orta Saha' : pos === 'ATT' ? 'Hücum' : 'Kaleci'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-zinc-950 p-1.5 border border-zinc-800">
                <button
                  onClick={() => setSquadViewMode('grid')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                    squadViewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Kart Görünümü
                </button>
                <button
                  onClick={() => setSquadViewMode('table')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                    squadViewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Tablo Görünümü
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            {squadViewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredSquad.map((player: Player) => {
                  const ovrStyle = getOvrColor(player.overall);
                  const isStarter = customLineupIds.includes(player.id);

                  return (
                    <div
                      key={player.id}
                      className={`bg-[#070D14]/95 border p-4 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-3 ${
                        isStarter ? 'border-zinc-800 hover:border-[#00F5A0]/60' : 'border-zinc-900 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${ovrStyle} font-mono font-black text-lg flex items-center justify-center border shadow-md shrink-0`}>
                            {player.overall}
                          </div>
                          <div>
                            <div className="text-xs font-black text-white uppercase truncate max-w-[140px]">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-400 font-bold">
                              <span className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-[#00F5A0]">
                                {player.position}
                              </span>
                              <span>{player.nationality}</span>
                              <span>•</span>
                              <span>{player.age} Yaş</span>
                            </div>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase ${isStarter ? 'bg-[#00F5A0] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                          {isStarter ? 'İLK 11' : 'YEDEK'}
                        </span>
                      </div>

                      {/* 6 Core Attributes Grid */}
                      <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-zinc-950 p-2.5 border border-zinc-800">
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">HIZ</div>
                          <div className="font-black text-white">{player.attributes.pace}</div>
                        </div>
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">ŞUT</div>
                          <div className="font-black text-white">{player.attributes.finishing}</div>
                        </div>
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">PAS</div>
                          <div className="font-black text-white">{player.attributes.passing}</div>
                        </div>
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">DRİ</div>
                          <div className="font-black text-white">{player.attributes.dribbling}</div>
                        </div>
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">SAV</div>
                          <div className="font-black text-white">{player.attributes.tackling}</div>
                        </div>
                        <div className="p-1 bg-zinc-900 border border-zinc-800">
                          <div className="text-zinc-500 text-[9px] font-bold">FİZ</div>
                          <div className="font-black text-white">{player.attributes.strength}</div>
                        </div>
                      </div>

                      {/* Condition Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-zinc-400 font-bold uppercase">Kondisyon</span>
                          <span className="text-[#00F5A0] font-mono font-bold">%100</span>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 border border-zinc-800">
                          <div className="bg-[#00F5A0] h-full w-full" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Broadcast Table View */
              <div className="bg-[#070D14]/95 border border-zinc-800 p-5 shadow-2xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-3">OVR</th>
                      <th className="py-3 px-3">Futbolcu</th>
                      <th className="py-3 px-2">Durum</th>
                      <th className="py-3 px-2">Mevki</th>
                      <th className="py-3 px-2">Yaş</th>
                      <th className="py-3 px-2">Uyruk</th>
                      <th className="py-3 px-2">Ayak</th>
                      <th className="py-3 px-2 text-center">Hız</th>
                      <th className="py-3 px-2 text-center">Şut</th>
                      <th className="py-3 px-2 text-center">Pas</th>
                      <th className="py-3 px-2 text-center">Dri</th>
                      <th className="py-3 px-2 text-center">Sav</th>
                      <th className="py-3 px-2 text-center">Fiz</th>
                      <th className="py-3 px-3 text-right">Kondisyon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredSquad.map((player: Player) => {
                      const isStarter = customLineupIds.includes(player.id);
                      return (
                        <tr key={player.id} className="hover:bg-zinc-900/50 transition">
                          <td className="py-3 px-3 font-bold">
                            <span className="px-2 py-0.5 text-xs font-black bg-emerald-950 text-[#00F5A0] border border-emerald-500/40 font-mono">
                              {player.overall}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-white uppercase">
                            {player.firstName} {player.lastName}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-black ${isStarter ? 'bg-[#00F5A0] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                              {isStarter ? 'İLK 11' : 'YEDEK'}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 bg-zinc-950 text-zinc-300 font-bold text-[10px] border border-zinc-800">
                              {player.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-zinc-400">{player.age}</td>
                          <td className="py-3 px-2 text-zinc-400">{player.nationality}</td>
                          <td className="py-3 px-2 text-zinc-400">{player.preferredFoot}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.pace}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.finishing}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.passing}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.dribbling}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.tackling}</td>
                          <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{player.attributes.strength}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-[#00F5A0] font-mono font-bold">%100</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: TAKTİK & DİZİLİŞ (TACTICS & INTERACTIVE SUBS)               */}
        {/* ================================================================== */}
        {activeTab === 'tactics' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Tactical Controls (5 cols) */}
              <div className="lg:col-span-5 bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <Sliders className="w-4 h-4 text-[#00F5A0]" />
                    <span>TAKTIKSEL TALİMATLAR</span>
                  </h3>
                  <button
                    onClick={handleAutoBestXI}
                    className="px-3 py-1 bg-[#00F5A0]/10 border border-[#00F5A0]/40 hover:bg-[#00F5A0]/20 text-[#00F5A0] text-xs font-black uppercase transition flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>En İyi 11</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-zinc-300 font-bold uppercase mb-1.5">Diziliş (Formasyon)</label>
                    <select
                      value={formation}
                      onChange={(e) => handleFormationChange(e.target.value as Formation)}
                      className="w-full bg-zinc-950 border border-zinc-700 p-3 text-white focus:outline-none focus:border-[#00F5A0] font-bold"
                    >
                      <option value="4-3-3">4-3-3 (Hücum & Kanat Organizasyonları)</option>
                      <option value="4-2-3-1">4-2-3-1 (Dengeli & Modern Geçiş)</option>
                      <option value="4-4-2">4-4-2 (Klasik Çift Forvet & Baskı)</option>
                      <option value="4-1-4-1">4-1-4-1 (Guardiola / Kompakt Orta Saha)</option>
                      <option value="4-3-1-2">4-3-1-2 (Dar Elmas & Çift Forvet)</option>
                      <option value="3-4-3">3-4-3 (Toplam Hücum & Kanat Baskısı)</option>
                      <option value="3-5-2">3-5-2 (Orta Saha Hakimiyeti & Kanat Bek)</option>
                      <option value="5-3-2">5-3-2 (Katı Savunma & Kontratak)</option>
                      <option value="5-2-3">5-2-3 (5'li Savunma & Hızlı Geçiş)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-bold uppercase mb-1.5">Oyun Anlayışı</label>
                      <select
                        value={mentality}
                        onChange={(e) => setMentality(e.target.value as Mentality)}
                        className="w-full bg-zinc-950 border border-zinc-700 p-2.5 text-white focus:outline-none focus:border-[#00F5A0] font-semibold"
                      >
                        <option value="Çok Savunmacı">Çok Savunmacı</option>
                        <option value="Savunmacı">Savunmacı</option>
                        <option value="Dengeli">Dengeli</option>
                        <option value="Hücum">Hücum</option>
                        <option value="Aşırı Hücum">Aşırı Hücum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-bold uppercase mb-1.5">Tempo</label>
                      <select
                        value={tempo}
                        onChange={(e) => setTempo(e.target.value as Tempo)}
                        className="w-full bg-zinc-950 border border-zinc-700 p-2.5 text-white focus:outline-none focus:border-[#00F5A0] font-semibold"
                      >
                        <option value="Çok Düşük">Çok Düşük</option>
                        <option value="Düşük">Düşük</option>
                        <option value="Standart">Standart</option>
                        <option value="Yüksek">Yüksek</option>
                        <option value="Çok Yüksek">Çok Yüksek</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-zinc-300 font-bold uppercase mb-1.5">Pres Şiddeti</label>
                      <select
                        value={pressing}
                        onChange={(e) => setPressing(e.target.value as Pressing)}
                        className="w-full bg-zinc-950 border border-zinc-700 p-2.5 text-white focus:outline-none focus:border-[#00F5A0] font-semibold"
                      >
                        <option value="Hafif">Hafif</option>
                        <option value="Orta">Orta</option>
                        <option value="Yoğun">Yoğun</option>
                        <option value="Aşırı">Aşırı</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-zinc-300 font-bold uppercase mb-1.5">Pas Tercihi</label>
                      <select
                        value={passingStyle}
                        onChange={(e) => setPassingStyle(e.target.value as PassingStyle)}
                        className="w-full bg-zinc-950 border border-zinc-700 p-2.5 text-white focus:outline-none focus:border-[#00F5A0] font-semibold"
                      >
                        <option value="Kısa">Kısa Pas</option>
                        <option value="Karışık">Karışık</option>
                        <option value="Doğrudan">Doğrudan (Direkt)</option>
                        <option value="Uzun">Uzun Top</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveTactics}
                    className="w-full py-3.5 bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#00F5A0]/20 flex items-center justify-center gap-2 mt-2 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>TAKTİĞİ KAYDET & GELECEK MAÇA UYGULA</span>
                  </button>
                </div>
              </div>

              {/* 2D Pitch Visualizer (7 cols) */}
              <div className="lg:col-span-7 bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <Layers className="w-4 h-4 text-[#00F5A0]" />
                    <span>SAHA DİZİLİŞ GÖRSELİ</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400">Değiştirmek için oyuncuya tıkla</span>
                    <span className="text-xs font-mono font-black text-[#00F5A0] px-3 py-1 bg-zinc-950 border border-zinc-800">
                      {formation}
                    </span>
                  </div>
                </div>

                {/* Realistic Pitch */}
                <div
                  onClick={() => {
                    setSelectedStarterId(null);
                    setSelectedBenchId(null);
                  }}
                  className="w-full h-[520px] sm:h-[560px] bg-gradient-to-b from-[#0a2318] via-[#0d2f21] to-[#0a2318] border-2 border-emerald-500/40 relative my-4 overflow-hidden shadow-2xl rounded-lg flex items-center justify-center select-none"
                >
                  {/* Grass Stripes */}
                  <div className="absolute inset-0 opacity-15 flex flex-col pointer-events-none">
                    <div className="flex-1 bg-black/30" />
                    <div className="flex-1 bg-transparent" />
                    <div className="flex-1 bg-black/30" />
                    <div className="flex-1 bg-transparent" />
                    <div className="flex-1 bg-black/30" />
                    <div className="flex-1 bg-transparent" />
                    <div className="flex-1 bg-black/30" />
                    <div className="flex-1 bg-transparent" />
                  </div>

                  {/* Pitch Markings */}
                  <div className="absolute inset-3 border border-white/25 pointer-events-none rounded" />
                  <div className="absolute inset-x-3 top-1/2 h-px bg-white/25 pointer-events-none" />
                  <div className="w-28 h-28 rounded-full border border-white/25 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                  <div className="w-2 h-2 rounded-full bg-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                  {/* Penalty Box Top */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-white/25 pointer-events-none" />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-9 border-b border-x border-white/25 pointer-events-none" />
                  <div className="w-24 h-10 border-b border-white/25 rounded-b-full absolute top-[83px] left-1/2 -translate-x-1/2 pointer-events-none" />

                  {/* Penalty Box Bottom */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/25 pointer-events-none" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-9 border-t border-x border-white/25 pointer-events-none" />
                  <div className="w-24 h-10 border-t border-white/25 rounded-t-full absolute bottom-[83px] left-1/2 -translate-x-1/2 pointer-events-none" />

                  {/* 11 Starter Coordinate Nodes */}
                  {(FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-3-3']).map((slot, slotIdx) => {
                    const playerId = customLineupIds[slotIdx];
                    const player = mySquad.find((p) => p.id === playerId);
                    if (!player) return null;

                    const isSelected = selectedStarterId === player.id;
                    const isCompatible = isSlotCompatible(player.position, slot.role);

                    const getPosBadgeColor = () => {
                      if (slot.role === 'GK') return 'bg-purple-600 text-white border-purple-300';
                      if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(slot.role))
                        return 'bg-[#00D4FF] text-black border-cyan-300';
                      if (['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'].includes(slot.role))
                        return 'bg-[#00F5A0] text-black border-emerald-300';
                      return 'bg-[#FFB800] text-black border-amber-300';
                    };

                    return (
                      <div
                        key={`${slotIdx}-${slot.role}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePitchPlayerClick(player.id);
                        }}
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        className="absolute flex flex-col items-center cursor-pointer transition-all duration-300 z-10 hover:scale-110 active:scale-95 group"
                      >
                        {/* MEVKİ DIŞI Warning Pill */}
                        {!isCompatible && (
                          <span className="mb-0.5 px-1.5 py-0.5 bg-rose-600 text-white font-black text-[8px] tracking-wider rounded uppercase shadow-lg animate-pulse whitespace-nowrap border border-rose-400">
                            MEVKİ DIŞI
                          </span>
                        )}

                        {/* Player Circle Node */}
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-mono font-black text-xs flex items-center justify-center border-2 shadow-xl transition-all ${
                            isSelected
                              ? 'bg-rose-500 text-white border-white ring-4 ring-[#00F5A0] shadow-[0_0_20px_#00F5A0] animate-bounce scale-110'
                              : !isCompatible
                              ? 'bg-rose-950 text-rose-200 border-rose-500 ring-2 ring-rose-500/80 shadow-rose-900/50'
                              : getPosBadgeColor()
                          }`}
                        >
                          {player.overall}
                        </div>

                        {/* Player Name and Slot Role Label */}
                        <div className="flex flex-col items-center mt-0.5 pointer-events-none">
                          <span className="text-[9px] sm:text-[10px] font-black text-white uppercase truncate max-w-[84px] bg-black/90 px-1.5 py-0.5 border border-zinc-800 rounded shadow-md">
                            {player.lastName}
                          </span>
                          <span
                            className={`text-[8px] font-mono font-bold px-1 rounded mt-0.5 ${
                              !isCompatible
                                ? 'text-rose-300 bg-rose-950/90 border border-rose-700 font-black'
                                : 'text-zinc-300 bg-zinc-950/90 border border-zinc-800'
                            }`}
                          >
                            {player.position} ({slot.role})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center text-[11px] font-bold text-zinc-400">
                  {selectedStarterId ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-[#FFB800] animate-pulse">
                        ⚡ Sahadan bir oyuncu seçildi! Aşağıdaki yedeklerden birine veya sahadaki başka bir oyuncuya tıklayarak yer değiştirin.
                      </span>
                      <button
                        onClick={() => setSelectedStarterId(null)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase rounded border border-zinc-600 transition"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <span>Sahadaki veya yedekteki oyunculara tıklayarak anında yer değiştirebilirsiniz.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Substitutes & Bench Swapping Rack */}
            <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                  <Users className="w-4 h-4 text-[#00D4FF]" />
                  <span>YEDEKLER KULÜBESİ ({activeBench.length} OYUNCU)</span>
                </h3>
                <span className="text-xs text-zinc-400 font-bold">
                  {selectedStarterId ? '👉 Oyuna almak için aşağıdaki yedeğe tıkla' : 'Değişiklik için önce sahadan oyuncu seçin'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {activeBench.map((player) => {
                  const ovrStyle = getOvrColor(player.overall);
                  const isSelectedBench = selectedBenchId === player.id;

                  return (
                    <div
                      key={player.id}
                      onClick={() => handleBenchPlayerClick(player.id)}
                      className={`p-3 border flex items-center justify-between transition cursor-pointer rounded ${
                        selectedStarterId
                          ? 'bg-zinc-950 hover:bg-[#00F5A0]/15 border-[#00F5A0]/50 hover:border-[#00F5A0] shadow-[0_0_10px_rgba(0,245,160,0.15)] ring-1 ring-[#00F5A0]/30'
                          : isSelectedBench
                          ? 'bg-zinc-900 border-[#00D4FF] ring-2 ring-[#00D4FF]'
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-9 h-9 bg-gradient-to-br ${ovrStyle} font-mono font-black text-xs flex items-center justify-center border shrink-0 rounded`}>
                          {player.overall}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-black text-white uppercase truncate max-w-[120px]">
                            {player.firstName} {player.lastName}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-bold">
                            <span className="text-[#00F5A0] font-mono">{player.position}</span> • {player.age} Yaş
                          </div>
                        </div>
                      </div>

                      {selectedStarterId && (
                        <button className="px-2.5 py-1 bg-[#00F5A0] hover:bg-[#00D485] text-black text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md rounded">
                          <Repeat className="w-3 h-3" />
                          <span>AL</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: FİKSTÜR & MAÇLAR (FIXTURES & SCHEDULE)                      */}
        {/* ================================================================== */}
        {activeTab === 'fixtures' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#070D14]/95 border border-zinc-800 p-4 shadow-2xl">
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                <button
                  onClick={() => setSelectedWeekFilter('ALL')}
                  className={`px-3.5 py-1.5 text-xs font-black uppercase transition shrink-0 ${
                    selectedWeekFilter === 'ALL'
                      ? 'bg-[#00F5A0] text-black shadow-md'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  Tüm Haftalar
                </button>
                {Array.from({ length: totalMatchweeks }, (_, i) => i + 1).map((w) => (
                  <button
                    key={w}
                    onClick={() => setSelectedWeekFilter(w)}
                    className={`px-3.5 py-1.5 text-xs font-black uppercase transition shrink-0 ${
                      selectedWeekFilter === w
                        ? 'bg-[#00F5A0] text-black shadow-md'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    Hafta {w}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowOnlyMyFixtures(!showOnlyMyFixtures)}
                className={`px-4 py-1.5 text-xs font-black uppercase transition flex items-center gap-1.5 border ${
                  showOnlyMyFixtures
                    ? 'bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/50'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Sadece Benim Maçlarım</span>
              </button>
            </div>

            {/* Matchweeks */}
            {Array.from({ length: totalMatchweeks }, (_, i) => i + 1).map((weekNum) => {
              if (selectedWeekFilter !== 'ALL' && selectedWeekFilter !== weekNum) return null;

              const weekFixtures = displayedFixtures.filter((f: DraftFixture) => f.round === weekNum);
              if (weekFixtures.length === 0) return null;

              return (
                <div key={weekNum} className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                      <Calendar className="w-4 h-4 text-[#00F5A0]" />
                      <span>HAFTA {weekNum}</span>
                      {weekNum === currentMatchweek && (
                        <span className="text-[10px] px-2.5 py-0.5 bg-emerald-950 text-[#00F5A0] border border-emerald-500/50 font-black animate-pulse">
                          ŞU ANKİ HAFTA
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-zinc-400 font-mono font-bold">
                      {weekFixtures.filter((f) => f.status === 'COMPLETED').length} / {weekFixtures.length} Tamamlandı
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weekFixtures.map((f: DraftFixture) => {
                      const homeClub = clubs.find((c: DraftClub) => c.id === f.homeClubId);
                      const awayClub = clubs.find((c: DraftClub) => c.id === f.awayClubId);
                      const isUserMatch = myClub && (f.homeClubId === myClub.id || f.awayClubId === myClub.id);

                      return (
                        <div
                          key={f.id}
                          className={`p-4 border transition-all duration-200 flex items-center justify-between gap-3 ${
                            isUserMatch
                              ? 'bg-zinc-950 border-[#00F5A0]/60 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                              : f.status === 'COMPLETED'
                              ? 'bg-zinc-950/60 border-zinc-800'
                              : 'bg-zinc-950/80 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate flex-1">
                            <div className="space-y-1.5 truncate">
                              <div className="text-xs font-black text-white uppercase truncate flex items-center gap-2">
                                {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={20} />}
                                <span className="truncate">{homeClub?.name}</span>
                              </div>
                              <div className="text-xs font-black text-zinc-300 uppercase truncate flex items-center gap-2">
                                {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={20} />}
                                <span className="truncate">{awayClub?.name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {f.status === 'COMPLETED' ? (
                              <button
                                onClick={() => {
                                  setSelectedFixture(f);
                                  setIsReportModalOpen(true);
                                }}
                                className="font-mono font-black text-sm text-[#00F5A0] bg-zinc-900 hover:bg-zinc-800 px-3.5 py-1.5 border border-zinc-700 hover:border-[#00F5A0]/50 transition"
                              >
                                {f.homeScore} - {f.awayScore}
                              </button>
                            ) : room.liveMatchweek?.status === 'LIVE' && f.round === room.liveMatchweek.matchweek ? (
                              <button
                                onClick={() => handleOpenLiveMatch(f)}
                                className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-black text-xs uppercase tracking-wider transition animate-pulse flex items-center gap-1.5"
                              >
                                <Radio className="w-3.5 h-3.5" />
                                <span>CANLI İZLE</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-zinc-400 px-2.5 py-1 bg-zinc-950 border border-zinc-800">
                                  ⏳ Beklemede
                                </span>
                                {isHost && (
                                  <button
                                    onClick={() => handleFastSimulateFixture(f.id)}
                                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#00D4FF] text-zinc-300 hover:text-white font-mono text-[10px] uppercase font-bold transition flex items-center gap-1"
                                    title="Bu maçı Match Engine ile anında simüle et"
                                  >
                                    <Play className="w-3 h-3 text-[#00D4FF]" />
                                    <span>Simüle</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: PUAN DURUMU (STANDINGS TABLE)                               */}
        {/* ================================================================== */}
        {activeTab === 'standings' && (
          <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                <Trophy className="w-4 h-4 text-[#FFB800]" />
                <span>RESMİ LİG PUAN DURUMU</span>
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-400">
                {completedFixtures.length} / {fixtures.length} Karşılaşma Oynandı
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3">Sıra</th>
                    <th className="py-3 px-3">Kulüp & Menajer</th>
                    <th className="py-3 px-2 text-center">O</th>
                    <th className="py-3 px-2 text-center">G</th>
                    <th className="py-3 px-2 text-center">B</th>
                    <th className="py-3 px-2 text-center">M</th>
                    <th className="py-3 px-2 text-center">AG</th>
                    <th className="py-3 px-2 text-center">YG</th>
                    <th className="py-3 px-2 text-center">AV</th>
                    <th className="py-3 px-3 text-right">Puan</th>
                    <th className="py-3 px-3 text-right">Son 5 Maç Formu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {standings.map((st: DraftStanding) => {
                    const club = clubs.find((c: DraftClub) => c.id === st.clubId);
                    const isMine = myClub?.id === st.clubId;

                    return (
                      <tr
                        key={st.clubId}
                        className={`hover:bg-zinc-900/50 transition ${
                          isMine ? 'bg-[#00F5A0]/10' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-black">
                          {st.rank === 1 ? (
                            <span className="text-[#FFB800] flex items-center gap-1 font-black">
                              <Crown className="w-3.5 h-3.5" />
                              <span>1</span>
                            </span>
                          ) : st.rank <= 3 ? (
                            <span className="text-[#00F5A0]">{st.rank}</span>
                          ) : (
                            <span className="text-zinc-400">{st.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {club && <BadgePreview badge={club.badge} clubCode={club.code} size={24} />}
                            <div>
                              <span className="font-black text-white uppercase">
                                {st.clubName} {isMine && <span className="text-[10px] text-[#00F5A0] font-black">(SEN)</span>}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-bold block">{club?.managerName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{st.played}</td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{st.won}</td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{st.drawn}</td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono font-bold">{st.lost}</td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono">{st.goalsFor}</td>
                        <td className="py-3 px-2 text-center text-zinc-300 font-mono">{st.goalsAgainst}</td>
                        <td className="py-3 px-2 text-center font-bold text-zinc-200 font-mono">{st.goalDifference}</td>
                        <td className="py-3 px-3 text-right font-black text-[#00F5A0] text-sm font-mono">{st.points}</td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {st.form.map((res: 'W' | 'D' | 'L', i: number) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center shadow-sm ${
                                  res === 'W'
                                    ? 'bg-[#00F5A0] text-black'
                                    : res === 'D'
                                    ? 'bg-[#FFB800] text-black'
                                    : 'bg-rose-600 text-white'
                                }`}
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: İSTATİSTİKLER (LEADERBOARDS & RECORDS)                      */}
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* TAB 6: İSTATİSTİKLER (LEADERBOARDS & RECORDS)                      */}
        {/* ================================================================== */}
        {activeTab === 'players' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#070D14]/95 border border-zinc-800 p-4">
              <div>
                <h2 className="text-base font-black text-white uppercase italic tracking-wider font-display flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#00F5A0]" />
                  <span>SEZON {currentSeasonNum} OYUNCU İSTATİSTİKLERİ VE LİDERLER</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Tamamlanan {completedFixtures.length} karşılaşmanın gerçek Match Engine verilerinden türetilmiştir.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-zinc-400 px-3 py-1 bg-zinc-950 border border-zinc-800">
                GÜNCEL VERİ
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. GOL KRALLIĞI */}
              <div className="bg-[#070D14]/95 border border-zinc-800 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <span className="text-lg">⚽</span>
                    <span>GOL KRALLIĞI</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#FFB800] uppercase bg-amber-950/40 px-2 py-0.5 border border-[#FFB800]/30">
                    TOPLAM {topScorers.filter((p) => p.goals > 0).length} GOLCÜ
                  </span>
                </div>

                {topScorers.length === 0 || topScorers.every((p) => p.goals === 0 && p.appearances === 0) ? (
                  <div className="text-zinc-400 text-xs py-10 text-center space-y-1">
                    <div className="text-lg">⚽</div>
                    <div>Maçlar oynandıkça goller listelenecektir.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-2 text-center w-8">#</th>
                          <th className="py-2.5 px-2">Futbolcu</th>
                          <th className="py-2.5 px-2">Kulüp</th>
                          <th className="py-2.5 px-2 text-center">Maç</th>
                          <th className="py-2.5 px-2 text-right">Gol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {topScorers.slice(0, 15).map((p, idx) => {
                          const isTop = idx === 0 && p.goals > 0;
                          const club = clubs.find((c) => c.id === p.clubId);
                          return (
                            <tr
                              key={p.playerId}
                              className={`transition ${isTop ? 'bg-amber-950/20 text-[#FFB800]' : 'hover:bg-zinc-900/50 text-zinc-200'}`}
                            >
                              <td className="py-2.5 px-2 text-center font-black">
                                {idx === 0 ? '👑' : `${idx + 1}`}
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="font-bold text-white truncate max-w-[130px]">{p.playerName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{p.position}</div>
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="flex items-center gap-1.5 truncate max-w-[110px]" title={p.clubName}>
                                  {club && <BadgePreview badge={club.badge} clubCode={club.code} size={14} />}
                                  <span className="truncate text-zinc-300 text-[11px]">{p.clubName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center text-zinc-400 font-bold">{p.appearances}</td>
                              <td className="py-2.5 px-2 text-right font-black text-[#FFB800] text-sm">
                                {p.goals}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 2. ASİST LİDERLİĞİ */}
              <div className="bg-[#070D14]/95 border border-zinc-800 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <span className="text-lg">🎯</span>
                    <span>ASİST LİDERLİĞİ</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#00D4FF] uppercase bg-cyan-950/40 px-2 py-0.5 border border-[#00D4FF]/30">
                    TOPLAM {topAssists.filter((p) => p.assists > 0).length} ASİSTÇİ
                  </span>
                </div>

                {topAssists.length === 0 || topAssists.every((p) => p.assists === 0 && p.appearances === 0) ? (
                  <div className="text-zinc-400 text-xs py-10 text-center space-y-1">
                    <div className="text-lg">🎯</div>
                    <div>Maçlar oynandıkça asistler listelenecektir.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-2 text-center w-8">#</th>
                          <th className="py-2.5 px-2">Futbolcu</th>
                          <th className="py-2.5 px-2">Kulüp</th>
                          <th className="py-2.5 px-2 text-center">Maç</th>
                          <th className="py-2.5 px-2 text-right">Asist</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {topAssists.slice(0, 15).map((p, idx) => {
                          const isTop = idx === 0 && p.assists > 0;
                          const club = clubs.find((c) => c.id === p.clubId);
                          return (
                            <tr
                              key={p.playerId}
                              className={`transition ${isTop ? 'bg-cyan-950/20 text-[#00D4FF]' : 'hover:bg-zinc-900/50 text-zinc-200'}`}
                            >
                              <td className="py-2.5 px-2 text-center font-black">
                                {idx === 0 ? '👑' : `${idx + 1}`}
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="font-bold text-white truncate max-w-[130px]">{p.playerName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{p.position}</div>
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="flex items-center gap-1.5 truncate max-w-[110px]" title={p.clubName}>
                                  {club && <BadgePreview badge={club.badge} clubCode={club.code} size={14} />}
                                  <span className="truncate text-zinc-300 text-[11px]">{p.clubName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center text-zinc-400 font-bold">{p.appearances}</td>
                              <td className="py-2.5 px-2 text-right font-black text-[#00D4FF] text-sm">
                                {p.assists}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. EN YÜKSEK REYTİNGLER */}
              <div className="bg-[#070D14]/95 border border-zinc-800 p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <span className="text-lg">⭐</span>
                    <span>EN YÜKSEK REYTİNGLER</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#00F5A0] uppercase bg-emerald-950/40 px-2 py-0.5 border border-[#00F5A0]/30">
                    MİN. 1 MAÇ
                  </span>
                </div>

                {bestRatings.length === 0 ? (
                  <div className="text-zinc-400 text-xs py-10 text-center space-y-1">
                    <div className="text-lg">⭐</div>
                    <div>Maçlar oynandıkça reytingler listelenecektir.</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                        <tr>
                          <th className="py-2.5 px-2 text-center w-8">#</th>
                          <th className="py-2.5 px-2">Futbolcu</th>
                          <th className="py-2.5 px-2">Kulüp</th>
                          <th className="py-2.5 px-2 text-center">Maç</th>
                          <th className="py-2.5 px-2 text-right">Reyting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono">
                        {bestRatings.slice(0, 15).map((p, idx) => {
                          const isTop = idx === 0;
                          const club = clubs.find((c) => c.id === p.clubId);
                          return (
                            <tr
                              key={p.playerId}
                              className={`transition ${isTop ? 'bg-emerald-950/20 text-[#00F5A0]' : 'hover:bg-zinc-900/50 text-zinc-200'}`}
                            >
                              <td className="py-2.5 px-2 text-center font-black">
                                {idx === 0 ? '👑' : `${idx + 1}`}
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="font-bold text-white truncate max-w-[130px]">{p.playerName}</div>
                                <div className="text-[10px] text-zinc-500 font-mono">{p.position}</div>
                              </td>
                              <td className="py-2.5 px-2 font-sans">
                                <div className="flex items-center gap-1.5 truncate max-w-[110px]" title={p.clubName}>
                                  {club && <BadgePreview badge={club.badge} clubCode={club.code} size={14} />}
                                  <span className="truncate text-zinc-300 text-[11px]">{p.clubName}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-2 text-center text-zinc-400 font-bold">{p.appearances}</td>
                              <td className="py-2.5 px-2 text-right font-black text-[#00F5A0] text-sm">
                                {p.averageRating.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 7: DRAFT GEÇMİŞİ (DRAFT HISTORY & PAST SEASONS)                */}
        {/* ================================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Archived Past Seasons if any */}
            {roomState.seasonHistory && roomState.seasonHistory.length > 0 && (
              <div className="bg-[#070D14]/95 border border-[#FFB800]/50 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                    <Trophy className="w-4 h-4 text-[#FFB800]" />
                    <span>GEÇMİŞ SEZONLAR ARŞİVİ ({roomState.seasonHistory.length} SEZON)</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-[#FFB800] uppercase bg-amber-950/50 px-2.5 py-1 border border-[#FFB800]/40">
                    KAYITLI SEZONLAR
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roomState.seasonHistory.map((past) => (
                    <div key={past.seasonNumber} className="bg-zinc-950 border border-zinc-800 p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                        <span className="text-xs font-black text-[#FFB800] font-mono uppercase">
                          SEZON {past.seasonNumber}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(past.completedAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-950/60 border border-[#FFB800]/40 flex items-center justify-center text-lg">
                          👑
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-400 font-bold uppercase">ŞAMPİYON</div>
                          <div className="font-black text-white text-sm uppercase">{past.championClubName}</div>
                          <div className="text-[10px] text-zinc-400">Menajer: {past.championManagerName}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-900 text-[11px] font-mono">
                        {past.topScorer && (
                          <div className="bg-zinc-900/60 p-2 border border-zinc-800">
                            <div className="text-[9px] text-[#FFB800] font-bold">⚽ GOL KRALI</div>
                            <div className="font-bold text-white truncate text-[10px] mt-0.5">{past.topScorer.playerName}</div>
                            <div className="text-[#FFB800] font-black">{past.topScorer.goals} Gol</div>
                          </div>
                        )}
                        {past.topAssists && (
                          <div className="bg-zinc-900/60 p-2 border border-zinc-800">
                            <div className="text-[9px] text-[#00D4FF] font-bold">🎯 ASİST</div>
                            <div className="font-bold text-white truncate text-[10px] mt-0.5">{past.topAssists.playerName}</div>
                            <div className="text-[#00D4FF] font-black">{past.topAssists.assists} Asist</div>
                          </div>
                        )}
                        {past.mvp && (
                          <div className="bg-zinc-900/60 p-2 border border-zinc-800">
                            <div className="text-[9px] text-[#00F5A0] font-bold">⭐ MVP</div>
                            <div className="font-bold text-white truncate text-[10px] mt-0.5">{past.mvp.playerName}</div>
                            <div className="text-[#00F5A0] font-black">{past.mvp.rating}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Draft Selection Timeline */}
            <div className="bg-[#070D14]/95 border border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2 font-display">
                  <History className="w-4 h-4 text-[#00F5A0]" />
                  <span>DRAFT SEÇİM KAYITLARI (TOPLAM {roomState.draftState?.picks.length || 0} SEÇİM)</span>
                </h3>

              {/* Filter by club */}
              <select
                value={historyClubFilter}
                onChange={(e) => setHistoryClubFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 font-bold uppercase focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="ALL">Tüm Kulüpler</option>
                {clubs.map((c: DraftClub) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="py-3 px-3">Sıra</th>
                    <th className="py-3 px-2">Tur</th>
                    <th className="py-3 px-2">Kulüp</th>
                    <th className="py-3 px-2">Futbolcu</th>
                    <th className="py-3 px-2">Mevki</th>
                    <th className="py-3 px-2">OVR</th>
                    <th className="py-3 px-3 text-right">Seçim Türü</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {displayedPicks.map((pick: DraftPick) => {
                    const player = playerPool.find((p: Player) => p.id === pick.playerId);
                    const club = clubs.find((c: DraftClub) => c.id === pick.clubId);

                    return (
                      <tr key={pick.id} className="hover:bg-zinc-900/50 transition">
                        <td className="py-3 px-3 font-mono text-zinc-500 font-bold">#{pick.globalPickNumber}</td>
                        <td className="py-3 px-2 text-zinc-400 font-mono font-bold">Tur {pick.round}</td>
                        <td className="py-3 px-2 font-black text-white uppercase">
                          <div className="flex items-center gap-2">
                            {club && <BadgePreview badge={club.badge} clubCode={club.code} size={18} />}
                            <span>{club?.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-bold text-zinc-200 uppercase">
                          {player ? `${player.firstName} ${player.lastName}` : pick.playerId}
                        </td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-[#00F5A0] font-bold text-[10px]">
                            {player?.position || '--'}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-black text-[#FFB800] font-mono">{player?.overall || '--'}</td>
                        <td className="py-3 px-3 text-right text-[10px] text-zinc-400 font-bold uppercase">
                          {pick.isAutoPick ? '🤖 Otomatik' : '👤 Manuel'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </main>

      {/* Rematch Confirmation Modal */}
      {isRematchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#070D14] border-2 border-[#FFB800] max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto bg-amber-950/60 border border-[#FFB800]/50 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
              🔄
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase italic tracking-wider font-display">
                YENİ SEZON BAŞLAT
              </h3>
              <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                Mevcut kadrolar ve oyuncular korunacak. Puan durumu, fikstür ve sezon istatistikleri sıfırlanarak yeni sezon başlayacak.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRematchModalOpen(false)}
                className="w-1/2 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 font-black text-xs uppercase tracking-wider transition"
              >
                İPTAL
              </button>
              <button
                type="button"
                onClick={handleConfirmRematch}
                className="w-1/2 py-2.5 bg-gradient-to-r from-[#FFB800] to-[#E5A500] hover:from-[#FFE082] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#FFB800]/20"
              >
                YENİ SEZONU BAŞLAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. FOOTER BROADCAST HUD                                              */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-zinc-900 bg-[#04060A]/95 py-3 px-4 sm:px-8 text-center text-xs text-zinc-500 font-mono">
        SquadCraft <span className="text-[#00F5A0] font-bold">{SQUADCRAFT_VERSION}</span> • Broadcast Draft & League Command Center
      </footer>

      {/* Live Interactive Match Simulation Modal */}
      <DraftLiveMatchModal
        fixture={liveMatchFixture}
        clubs={clubs}
        playerPool={playerPool}
        isOpen={isLiveMatchModalOpen}
        onClose={handleCloseLiveModal}
        onMatchFinished={handleLiveMatchFinished}
        startedAt={room.liveMatchweek?.startedAt}
        paceMs={room.liveMatchweek?.paceMs || (room.rules?.matchSpeed === 4 ? 200 : room.rules?.matchSpeed === 3 ? 266 : room.rules?.matchSpeed === 2 ? 400 : 800)}
        isMultiplayerSynced={room.liveMatchweek?.status === 'LIVE'}
      />

      {/* Match Post-Report Modal */}
      <MatchReportModal
        fixture={selectedFixture}
        clubs={clubs}
        playerPool={playerPool}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roomId={room.id}
        route={`/draft/room/${roomCode}/league`}
        gamePhase="League Hub"
        stateVersion={room.stateVersion}
      />

      <AlphaDebugOverlay
        roomState={roomState}
        sessionId={sessionId}
      />
    </div>
  );
}
