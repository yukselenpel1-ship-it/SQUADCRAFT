'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DraftMultiplayerStore, RoomFullState, HydratedRoomResult } from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId } from '@/lib/draft/sessionManager';
import { SQUADCRAFT_VERSION } from '@/lib/version';
import { DraftFixture, DraftStanding, LeagueAwards, DraftPick, RoomMember, DraftClub } from '@/lib/draft/types';
import { Player, Formation, Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width } from '@/types/game';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { MatchReportModal } from '@/components/draft/MatchReportModal';
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
} from 'lucide-react';

interface LeaguePageProps {
  params: Promise<{ roomCode: string }>;
}

type TabType = 'overview' | 'squad' | 'tactics' | 'fixtures' | 'standings' | 'players' | 'history';
type SquadPositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';
type SquadViewMode = 'grid' | 'table';

export default function DraftLeagueHubPage({ params }: LeaguePageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFixture, setSelectedFixture] = useState<DraftFixture | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
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

  // Tactical local state
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [mentality, setMentality] = useState<Mentality>('Dengeli');
  const [tempo, setTempo] = useState<Tempo>('Standart');
  const [pressing, setPressing] = useState<Pressing>('Orta');
  const [passingStyle, setPassingStyle] = useState<PassingStyle>('Kısa');
  const [defensiveLine, setDefensiveLine] = useState<DefensiveLine>('Standart');
  const [width, setWidth] = useState<Width>('Dengeli');

  const sessionId = getMultiplayerSessionId();

  const fetchState = async () => {
    try {
      const res = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId);
      setHydrationResult(res);

      if (res.status === 'SUCCESS' && res.state) {
        if (res.state.room.status === 'LOBBY') {
          router.push(`/draft/room/${roomCode}`);
        } else if (res.state.room.status === 'DRAFTING') {
          if (res.state.draftState?.isCompleted) {
            DraftMultiplayerStore.finalizeDraftLeague(res.state.room.id);
          } else {
            router.push(`/draft/room/${roomCode}/draft`);
          }
        } else if (res.state.room.status === 'LEAGUE_ACTIVE' && (res.state.fixtures.length === 0 || res.state.standings.length === 0)) {
          DraftMultiplayerStore.repairRoomState(res.state.room.id, res.state.members[0]?.id);
        }
      }
    } catch (e) {
      console.warn('League fetch state error:', e);
    }
  };

  useEffect(() => {
    fetchState();

    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, () => {
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

    const interval = setInterval(() => {
      fetchState();
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [roomCode]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Loading state (max 8s)
  if (hydrationResult.status === 'LOADING' && elapsedSeconds < 8) {
    return (
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        <div className="fixed inset-0 bg-[#04060A] -z-20" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-[#060913]/90 to-[#020408] -z-10" />

        <div className="p-8 bg-slate-900/90 border border-emerald-500/30 rounded-3xl max-w-md w-full text-center space-y-5 shadow-[0_15px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,245,160,0.2)]">
            <Trophy className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 tracking-widest uppercase mb-1">
              SQUADCRAFT COMMAND CENTER
            </div>
            <h2 className="text-xl font-extrabold bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              Lig Merkezi Yükleniyor...
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            <span className="font-mono text-emerald-400 font-bold">{roomCode}</span> fikstür ve puan tablosu senkronize ediliyor ({elapsedSeconds}s)
          </p>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000 rounded-full"
              style={{ width: `${Math.min(100, (elapsedSeconds / 8) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Timeout or Error State
  if (hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR' || (hydrationResult.status === 'LOADING' && elapsedSeconds >= 8)) {
    return (
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        <div className="fixed inset-0 bg-[#04060A] -z-20" />
        <div className="p-8 bg-slate-900/90 border border-rose-900/60 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-rose-300">Bu ekran yüklenemedi.</h2>
            <p className="text-xs text-slate-400 mt-1">
              [SC-MP-005] Sunucu ile bağlantı zaman aşımına uğradı veya lig verisi senkronize edilemedi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                fetchState();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-950"
            >
              🔄 TEKRAR DENE
            </button>
            <Link
              href={`/draft/room/${roomCode}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              🚪 ODAYA DÖN
            </Link>
            <Link
              href="/draft"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-xl border border-slate-800 transition"
            >
              🏠 ANA MENÜ
            </Link>
          </div>

          {/* Diagnostics Panel */}
          <div className="pt-4 border-t border-slate-800 text-left">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center justify-between w-full"
            >
              <span>⚙️ Alfa Tanı Paneli (Diagnostics)</span>
              <span>{showDiagnostics ? '▲' : '▼'}</span>
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
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
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none">
        <div className="fixed inset-0 bg-[#04060A] -z-20" />
        <div className="p-8 bg-slate-900/90 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="text-4xl">❌</div>
          <h2 className="text-xl font-bold text-white">Oda Bulunamadı</h2>
          <p className="text-xs text-rose-400 bg-rose-950/60 p-3 rounded-xl border border-rose-900/50">
            [SC-MP-001] {hydrationResult.errorMessage || 'Oda bulunamadı veya süresi doldu.'}
          </p>
          <Link
            href="/draft"
            className="inline-block text-xs font-semibold px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            ← Draft Ana Sayfasına Dön
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

  // Next user fixture in current matchweek or upcoming
  const myNextFixture = myClub
    ? fixtures.find((f: DraftFixture) => (f.homeClubId === myClub.id || f.awayClubId === myClub.id) && f.status !== 'COMPLETED' && f.round === currentMatchweek) ||
      fixtures.find((f: DraftFixture) => (f.homeClubId === myClub.id || f.awayClubId === myClub.id) && f.status !== 'COMPLETED')
    : fixtures.find((f: DraftFixture) => f.status !== 'COMPLETED');

  // Simulate Fixture
  const handleSimulateFixture = (fixtureId: string) => {
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
      setStatusMessage('Maç simülasyonu tamamlandı!');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Simulate all remaining matches in current matchweek
  const handleSimulateRemainingInWeek = () => {
    const pendingInWeek = currentWeekFixtures.filter((f: DraftFixture) => f.status !== 'COMPLETED');
    if (pendingInWeek.length === 0) return;

    for (const f of pendingInWeek) {
      DraftMultiplayerStore.simulateFixture(room.id, f.id);
    }
    fetchState();
    setStatusMessage(`Hafta ${currentMatchweek} maçlarının tamamı simüle edildi!`);
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

  // Auto best XI
  const handleAutoBestXI = () => {
    if (!mySquad || mySquad.length === 0) return;

    const gks = mySquad.filter((p: Player) => p.position === 'GK').sort((a, b) => b.overall - a.overall);
    const defs = mySquad.filter((p: Player) => ['CB', 'LB', 'RB', 'LWB', 'RWB', 'DC', 'DL', 'DR'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const mids = mySquad.filter((p: Player) => ['DM', 'CM', 'CAM', 'LM', 'RM', 'DMC', 'MC', 'AMC', 'ML', 'MR'].includes(p.position)).sort((a, b) => b.overall - a.overall);
    const atts = mySquad.filter((p: Player) => ['LW', 'RW', 'ST', 'CF', 'AML', 'AMR'].includes(p.position)).sort((a, b) => b.overall - a.overall);

    const starting11 = [
      gks[0]?.id || mySquad[0]?.id,
      defs[0]?.id || mySquad[1]?.id,
      defs[1]?.id || mySquad[2]?.id,
      defs[2]?.id || mySquad[3]?.id,
      defs[3]?.id || mySquad[4]?.id,
      mids[0]?.id || mySquad[5]?.id,
      mids[1]?.id || mySquad[6]?.id,
      mids[2]?.id || mySquad[7]?.id,
      atts[0]?.id || mids[3]?.id || mySquad[8]?.id,
      atts[1]?.id || mids[4]?.id || mySquad[9]?.id,
      atts[2]?.id || atts[0]?.id || mySquad[10]?.id,
    ].filter(Boolean) as string[];

    const tactics = {
      clubId: myClub!.id,
      formation,
      settings: {
        mentality,
        tempo,
        pressing,
        passingStyle,
        defensiveLine,
        width,
      },
      lineup: starting11.map((id, idx) => ({
        slotId: idx,
        role: (idx === 0 ? 'GK' : idx <= 4 ? 'DC' : idx <= 7 ? 'MC' : 'ST') as any,
        x: 50,
        y: idx === 0 ? 90 : idx <= 4 ? 70 : idx <= 7 ? 45 : 20,
        playerId: id,
      })),
      substitutes: mySquad.filter((p: Player) => !starting11.includes(p.id)).slice(0, 7).map((p: Player) => p.id),
      reserves: mySquad.filter((p: Player) => !starting11.includes(p.id)).slice(7).map((p: Player) => p.id),
    };

    const res = DraftMultiplayerStore.updateClubTactics(room.id, currentMember!.id, tactics as any);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
      setStatusMessage('En iyi 11 otomatik dizildi ve taktik kaydedildi!');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Save Tactics
  const handleSaveTactics = () => {
    if (!myClub || !currentMember) return;
    handleAutoBestXI();
  };

  // Rematch
  const handleRematch = () => {
    if (!currentMember || !isHost) return;
    const res = DraftMultiplayerStore.rematch(room.id, currentMember.id, true);
    if (res.state) {
      router.push(`/draft/room/${roomCode}`);
    }
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
  const sortedSquad = [...mySquad].sort((a, b) => b.overall - a.overall);
  const teamAvgOvr = mySquad.length > 0 ? (mySquad.reduce((sum, p) => sum + p.overall, 0) / mySquad.length).toFixed(1) : '0.0';
  const xiAvgOvr = sortedSquad.length >= 11 ? (sortedSquad.slice(0, 11).reduce((sum, p) => sum + p.overall, 0) / 11).toFixed(1) : teamAvgOvr;
  const benchAvgOvr = sortedSquad.length > 11 ? (sortedSquad.slice(11).reduce((sum, p) => sum + p.overall, 0) / (sortedSquad.length - 11)).toFixed(1) : '0.0';

  const progressPercent = fixtures.length > 0 ? Math.round((completedFixtures.length / fixtures.length) * 100) : 0;

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
    if (ovr >= 88) return 'from-amber-400 to-yellow-600 text-slate-950 border-amber-300 shadow-amber-500/30';
    if (ovr >= 84) return 'from-emerald-400 to-teal-600 text-slate-950 border-emerald-300 shadow-emerald-500/30';
    if (ovr >= 80) return 'from-cyan-400 to-blue-600 text-white border-cyan-300 shadow-cyan-500/30';
    return 'from-slate-700 to-slate-800 text-slate-200 border-slate-600 shadow-slate-700/30';
  };

  return (
    <div className="relative min-h-screen bg-[#04060A] text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      {/* 1. Ultra-Premium Stadium Arena Background */}
      <div className="fixed inset-0 bg-[#04060A] -z-30" />
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <Image
          src="/images/bg-fc-arena.jpg"
          alt="Stadium Atmosphere"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-25 mix-blend-screen scale-105 filter brightness-90 contrast-125"
        />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-[#060913]/90 to-[#020408] -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-950/25 via-transparent to-transparent -z-10" />
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] -z-10" />

      {/* Top Stadium Light Beam */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F5A0]/80 via-[#00D4FF]/60 to-transparent shadow-[0_0_15px_#00F5A0]" />

      <div className="p-3 md:p-6 max-w-7xl w-full mx-auto flex-1 flex flex-col">
        {/* ================================================================== */}
        {/* TOP BROADCAST HUD HEADER */}
        {/* ================================================================== */}
        <header className="w-full bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <Link
              href="/draft"
              className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/60 transition flex items-center gap-1.5 shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Odadan Çık</span>
            </Link>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* SquadCraft SC Official Emblem HD */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[2px] shadow-[0_0_20px_rgba(0,245,160,0.3)] hidden sm:flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span>{room.name}</span>
                </h1>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isSeasonComplete
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/60 shadow-amber-500/20'
                      : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50 shadow-emerald-500/20 animate-pulse'
                  }`}
                >
                  {isSeasonComplete ? '🏆 SEZON ŞAMPİYONLUĞU' : `⚽ HAFTA ${currentMatchweek} / ${totalMatchweeks}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {clubs.length} Kulüp • {room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre' : 'Tek Devre'} • {completedFixtures.length}/{fixtures.length} Maç Tamamlandı (%{progressPercent})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Live Server Telemetry */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>REALTIME: AKTİF • 14ms TR</span>
            </div>

            {isHost && (
              <button
                onClick={handleRepairRoom}
                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                title="Oda ve lig verisini senkronize et"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Odayı Onar</span>
              </button>
            )}

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Geri Bildirim</span>
            </button>

            {/* Room Code Copy Pill */}
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-xs font-mono text-emerald-400 font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,245,160,0.15)] transition active:scale-95"
              title="Oda kodunu kopyalamak için tıkla"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{roomCode}</span>
            </button>
          </div>
        </header>

        {/* Status Alerts */}
        {statusMessage && (
          <div className="mb-4 p-3.5 bg-emerald-950/90 border border-emerald-500/70 rounded-2xl text-xs text-emerald-200 flex items-center justify-between shadow-[0_0_20px_rgba(0,245,160,0.2)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{statusMessage}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-950/90 border border-rose-500/70 rounded-2xl text-xs text-rose-200 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* ================================================================== */}
        {/* HERO MATCHWEEK COMMAND STRIP */}
        {/* ================================================================== */}
        <div className="mb-4 bg-gradient-to-r from-slate-900/90 via-[#0a101f]/90 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
                <Calendar className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>{isSeasonComplete ? 'LİG SEZONU TAMAMLANDI' : `HAFTA ${currentMatchweek} / ${totalMatchweeks} İLERLEMESİ`}</span>
                  {!isSeasonComplete && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40">
                      %{progressPercent} TAMAMLANDI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Bu hafta oynanan: <span className="font-bold text-white">{currentWeekCompleted.length}</span> / <span className="font-bold text-white">{currentWeekFixtures.length}</span> Maç
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
              {!isSeasonComplete && (
                <>
                  {myNextFixture && myNextFixture.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleSimulateFixture(myNextFixture.id)}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_25px_rgba(0,245,160,0.4)] transition transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Sıradaki Maçımı Oyna & Simüle Et</span>
                    </button>
                  )}

                  {isHost && !isCurrentWeekFinished && currentWeekFixtures.some((f) => f.status !== 'COMPLETED') && (
                    <button
                      onClick={handleSimulateRemainingInWeek}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/40 transition flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Haftanın Diğer Maçlarını Simüle Et</span>
                    </button>
                  )}

                  {isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                    <button
                      onClick={handleAdvanceMatchweek}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_25px_rgba(0,245,160,0.4)] transition flex items-center gap-2 uppercase tracking-wider"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>Sonraki Haftaya Geç (Hafta {currentMatchweek + 1})</span>
                    </button>
                  )}

                  {!isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                    <div className="text-xs text-amber-300 font-semibold px-4 py-2 bg-amber-950/60 border border-amber-500/40 rounded-xl flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Kurucunun Hafta {currentMatchweek + 1}'e geçmesi bekleniyor...</span>
                    </div>
                  )}
                </>
              )}

              {isSeasonComplete && isHost && (
                <button
                  onClick={handleRematch}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_30px_rgba(251,191,36,0.4)] transition flex items-center gap-2 uppercase tracking-wider"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Yeni Sezon Başlat (Rematch)</span>
                </button>
              )}
            </div>
          </div>

          {/* Glowing Gradient Progress Bar */}
          <div className="w-full bg-slate-950/80 h-2.5 rounded-full overflow-hidden border border-slate-800/80 p-[1px]">
            <div
              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full transition-all duration-700 rounded-full shadow-[0_0_10px_rgba(0,245,160,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* CHAMPION PODIUM & CELEBRATION (When completed) */}
        {/* ================================================================== */}
        {isSeasonComplete && awards && (
          <div className="mb-6 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/90 border border-amber-500/70 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(251,191,36,0.25)] space-y-5 backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-[3px] shadow-[0_0_40px_rgba(251,191,36,0.5)] animate-bounce flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[13px] flex items-center justify-center text-4xl">
                    👑
                  </div>
                </div>
                <div>
                  <div className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>SQUADCRAFT DRAFT LİGİ ŞAMPİYONU</span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white tracking-wide mt-1">
                    {awards.championClubName}
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Sezon boyunca gösterilen üstün taktiksel performans ve lig puanı ile şampiyonluk kupasını kaldırdı!
                  </p>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={handleRematch}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.4)] transition transform active:scale-95 uppercase tracking-wider flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Aynı Kadrolarla Yeni Lig (Rematch)</span>
                </button>
              )}
            </div>

            {/* Awards Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {awards.topScorer && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-amber-500/30 shadow-inner">
                  <div className="text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>⚽</span> Gol Kralı
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.topScorer.playerName}</div>
                  <div className="text-amber-300 font-mono font-black text-sm mt-0.5">{awards.topScorer.goals} Gol</div>
                </div>
              )}
              {awards.topAssists && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-cyan-500/30 shadow-inner">
                  <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>🎯</span> Asist Kralı
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.topAssists.playerName}</div>
                  <div className="text-cyan-300 font-mono font-black text-sm mt-0.5">{awards.topAssists.assists} Asist</div>
                </div>
              )}
              {awards.bestRating && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30 shadow-inner">
                  <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>⭐</span> Sezonun MVP'si
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.bestRating.playerName}</div>
                  <div className="text-emerald-300 font-mono font-black text-sm mt-0.5">{awards.bestRating.rating} / 10</div>
                </div>
              )}
              {awards.bestGoalkeeper && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-purple-500/30 shadow-inner">
                  <div className="text-purple-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>🧤</span> En İyi Kaleci
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.bestGoalkeeper.playerName}</div>
                  <div className="text-purple-300 font-mono font-black text-sm mt-0.5">{awards.bestGoalkeeper.cleanSheets} Maç Gol Yemedi</div>
                </div>
              )}
              {awards.bestAttack && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-orange-500/30 shadow-inner">
                  <div className="text-orange-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>🔥</span> En İyi Hücum
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.bestAttack.clubName}</div>
                  <div className="text-orange-300 font-mono font-black text-sm mt-0.5">{awards.bestAttack.goalsFor} Gol</div>
                </div>
              )}
              {awards.bestDefense && (
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-blue-500/30 shadow-inner">
                  <div className="text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span>🛡️</span> En İyi Savunma
                  </div>
                  <div className="font-extrabold text-white text-xs truncate">{awards.bestDefense.clubName}</div>
                  <div className="text-blue-300 font-mono font-black text-sm mt-0.5">{awards.bestDefense.goalsAgainst} Yenilen</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* BROADCAST NAVIGATION TABS BAR */}
        {/* ================================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 border-b border-slate-800/80 no-scrollbar">
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
                className={`px-4 py-2.5 text-xs font-extrabold rounded-2xl transition-all duration-200 shrink-0 flex items-center gap-2 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(0,245,160,0.35)] scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800/80 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================================================================== */}
        {/* TAB PANELS */}
        {/* ================================================================== */}
        <div className="flex-1">
          {/* ================================================================ */}
          {/* TAB 1: GENEL BAKIŞ (OVERVIEW) */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Spotlight & Recent Matches */}
              <div className="lg:col-span-2 space-y-5">
                {/* Next Match Broadcast Spotlight */}
                <div className="bg-slate-900/85 border border-emerald-500/30 rounded-3xl p-6 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        {myNextFixture
                          ? `Sıradaki Karşılaşma (Hafta ${myNextFixture.round})`
                          : isSeasonComplete
                          ? 'Tüm Lig Maçları Tamamlandı'
                          : 'Sıradaki Maç'}
                      </h3>
                    </div>
                    {myNextFixture && (
                      <span className="text-[10px] px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-emerald-400 rounded-full font-mono font-bold">
                        {myNextFixture.status === 'COMPLETED' ? 'TAMAMLANDI' : 'HAZIR'}
                      </span>
                    )}
                  </div>

                  {myNextFixture ? (
                    <div>
                      {(() => {
                        const homeClub = clubs.find((c: DraftClub) => c.id === myNextFixture.homeClubId);
                        const awayClub = clubs.find((c: DraftClub) => c.id === myNextFixture.awayClubId);

                        return (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-slate-950/70 rounded-2xl border border-slate-800/80 shadow-inner">
                            {/* Home Club */}
                            <div className="text-center space-y-2.5 flex-1 max-w-[180px]">
                              <div className="flex justify-center">
                                {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={68} />}
                              </div>
                              <div className="text-sm font-black text-white truncate">{homeClub?.name}</div>
                              <div className="text-[11px] text-slate-400 truncate">Menajer: {homeClub?.managerName}</div>
                            </div>

                            {/* Center Score / VS */}
                            <div className="text-center space-y-3 flex-1">
                              <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-wider">
                                {myNextFixture.status === 'COMPLETED' ? (
                                  <span className="text-emerald-400">
                                    {myNextFixture.homeScore} - {myNextFixture.awayScore}
                                  </span>
                                ) : (
                                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
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
                                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 mx-auto"
                                >
                                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Maç Raporu</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSimulateFixture(myNextFixture.id)}
                                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(0,245,160,0.3)] transition transform active:scale-95 uppercase tracking-wider mx-auto flex items-center gap-1.5"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>Maçı Simüle Et</span>
                                </button>
                              )}
                            </div>

                            {/* Away Club */}
                            <div className="text-center space-y-2.5 flex-1 max-w-[180px]">
                              <div className="flex justify-center">
                                {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={68} />}
                              </div>
                              <div className="text-sm font-black text-white truncate">{awayClub?.name}</div>
                              <div className="text-[11px] text-slate-400 truncate">Menajer: {awayClub?.managerName}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-xs bg-slate-950/50 rounded-2xl border border-slate-800/60">
                      Lig fikstüründeki tüm karşılaşmalar tamamlandı! Şampiyonluk ve ödül tablosunu yukarıda inceleyebilirsiniz.
                    </div>
                  )}
                </div>

                {/* Recent Match Results */}
                <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Son Karşılaşmalar</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('fixtures')}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <span>Tüm Fikstür</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {completedFixtures.length === 0 ? (
                      <div className="text-xs text-slate-500 text-center py-6">Henüz tamamlanan maç bulunmuyor.</div>
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
                              className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs hover:border-emerald-500/50 cursor-pointer transition shadow-sm hover:shadow-[0_0_15px_rgba(0,245,160,0.1)]"
                            >
                              <div className="flex items-center gap-2.5 truncate flex-1">
                                <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 py-0.5 bg-slate-900 rounded">
                                  H{f.round}
                                </span>
                                {h && <BadgePreview badge={h.badge} clubCode={h.code} size={20} />}
                                <span className="font-bold text-white truncate">{h?.name}</span>
                              </div>

                              <div className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono font-black text-emerald-400 text-xs shadow-inner">
                                {f.homeScore} - {f.awayScore}
                              </div>

                              <div className="flex items-center gap-2.5 truncate justify-end flex-1">
                                <span className="font-bold text-white truncate">{a?.name}</span>
                                {a && <BadgePreview badge={a.badge} clubCode={a.code} size={20} />}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Standings Table */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Puan Durumu</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('standings')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
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
                        className={`p-3 rounded-2xl flex items-center justify-between border transition ${
                          isMine
                            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                            : 'bg-slate-950/70 border-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`w-5 text-center font-mono font-black ${
                              st.rank === 1 ? 'text-amber-400' : st.rank <= 3 ? 'text-emerald-400' : 'text-slate-400'
                            }`}
                          >
                            {st.rank}
                          </span>
                          {club && <BadgePreview badge={club.badge} clubCode={club.code} size={24} />}
                          <span className="font-bold text-white truncate">
                            {st.clubName} {isMine && <span className="text-[10px] text-emerald-400 font-bold">(SEN)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="text-slate-400 text-[11px]">{st.played}M</span>
                          <span className="text-emerald-400 text-xs px-2 py-0.5 bg-slate-900 rounded-lg border border-slate-800">
                            {st.points}P
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 2: KADROM (SQUAD ROSTER) */}
          {/* ================================================================ */}
          {activeTab === 'squad' && (
            <div className="space-y-5">
              {/* Squad Summary Card */}
              <div className="bg-slate-900/85 border border-emerald-500/30 rounded-3xl p-6 shadow-lg backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {myClub && <BadgePreview badge={myClub.badge} clubCode={myClub.code} size={52} />}
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>{myClub?.name || 'Kulübüm'}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">
                        {mySquad.length} / 18 Oyuncu
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Menajer: <span className="text-white font-semibold">{myClub?.managerName}</span> • Formasyon: <span className="text-emerald-400 font-mono font-bold">{formation}</span>
                    </p>
                  </div>
                </div>

                {/* Squad OVR Stats */}
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">İlk 11 Gücü</div>
                    <div className="text-sm font-mono font-black text-emerald-400">{xiAvgOvr} OVR</div>
                  </div>
                  <div className="px-4 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Kadro Ort.</div>
                    <div className="text-sm font-mono font-black text-cyan-400">{teamAvgOvr} OVR</div>
                  </div>
                  <div className="px-4 py-2 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Yedek Gücü</div>
                    <div className="text-sm font-mono font-black text-slate-300">{benchAvgOvr} OVR</div>
                  </div>
                </div>
              </div>

              {/* Positional Filters & View Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
                  {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as SquadPositionFilter[]).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setSquadPosFilter(pos)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        squadPosFilter === pos
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {pos === 'ALL' ? 'Tümü' : pos === 'DEF' ? 'Savunma' : pos === 'MID' ? 'Orta Saha' : pos === 'ATT' ? 'Hücum' : 'Kaleci'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    onClick={() => setSquadViewMode('grid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      squadViewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Kart Görünümü
                  </button>
                  <button
                    onClick={() => setSquadViewMode('table')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      squadViewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tablo Görünümü
                  </button>
                </div>
              </div>

              {/* Cards Grid View */}
              {squadViewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredSquad.map((player: Player) => {
                    const ovrStyle = getOvrColor(player.overall);

                    return (
                      <div
                        key={player.id}
                        className="bg-slate-900/85 border border-slate-800/80 hover:border-emerald-500/50 rounded-3xl p-4 shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ovrStyle} font-mono font-black text-lg flex items-center justify-center border shadow-md shrink-0`}>
                              {player.overall}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white truncate max-w-[140px]">
                                {player.firstName} {player.lastName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                                <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded font-bold text-emerald-400">
                                  {player.position}
                                </span>
                                <span>{player.nationality}</span>
                                <span>•</span>
                                <span>{player.age} Yaş</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Player 6 Key Attributes Grid */}
                        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono bg-slate-950/60 p-2.5 rounded-2xl border border-slate-800/60">
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">HIZ</div>
                            <div className="font-bold text-white">{player.attributes.pace}</div>
                          </div>
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">ŞUT</div>
                            <div className="font-bold text-white">{player.attributes.finishing}</div>
                          </div>
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">PAS</div>
                            <div className="font-bold text-white">{player.attributes.passing}</div>
                          </div>
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">DRİ</div>
                            <div className="font-bold text-white">{player.attributes.dribbling}</div>
                          </div>
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">SAV</div>
                            <div className="font-bold text-white">{player.attributes.tackling}</div>
                          </div>
                          <div className="p-1 rounded bg-slate-900/50">
                            <div className="text-slate-500 text-[9px]">FİZ</div>
                            <div className="font-bold text-white">{player.attributes.strength}</div>
                          </div>
                        </div>

                        {/* Condition / Fitness Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400 font-semibold">Kondisyon</span>
                            <span className="text-emerald-400 font-mono font-bold">%100</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                            <div className="bg-emerald-500 h-full w-full rounded-full" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Broadcast Table View */
                <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-5 shadow-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-3">OVR</th>
                        <th className="py-3 px-3">Futbolcu</th>
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
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredSquad.map((player: Player) => (
                        <tr key={player.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-bold">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                              {player.overall}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            {player.firstName} {player.lastName}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 bg-slate-950 text-slate-300 rounded-md font-bold text-[10px] border border-slate-800">
                              {player.position}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-slate-400">{player.age}</td>
                          <td className="py-3 px-2 text-slate-400">{player.nationality}</td>
                          <td className="py-3 px-2 text-slate-400">{player.preferredFoot}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.pace}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.finishing}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.passing}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.dribbling}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.tackling}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{player.attributes.strength}</td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-emerald-400 font-mono font-bold">%100</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 3: TAKTİK & DİZİLİŞ (TACTICS & 2D PITCH) */}
          {/* ================================================================ */}
          {activeTab === 'tactics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tactical Instructions Panel */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Taktiksel Talimatlar</span>
                  </h3>
                  <button
                    onClick={handleAutoBestXI}
                    className="px-3.5 py-1.5 bg-emerald-950 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>En İyi 11'i Otomatik Belirle</span>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">Diziliş (Formasyon)</label>
                    <select
                      value={formation}
                      onChange={(e) => setFormation(e.target.value as Formation)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="4-2-3-1">4-2-3-1 (Dengeli & Modern Geçiş)</option>
                      <option value="4-3-3">4-3-3 (Hücum & Kanat Organizasyonları)</option>
                      <option value="4-4-2">4-4-2 (Klasik Çift Forvet & Baskı)</option>
                      <option value="4-1-2-1-2">4-1-2-1-2 (Baklava / Dar Elmas)</option>
                      <option value="4-3-2-1">4-3-2-1 (Yılbaşı Ağacı / Dar Hücum)</option>
                      <option value="4-2-2-2">4-2-2-2 (Çift Ön Libero & Çift 10 Numara)</option>
                      <option value="4-1-4-1">4-1-4-1 (Guardiola / Kompakt Orta Saha)</option>
                      <option value="4-2-4">4-2-4 (Tam Hücum & 4 Forvet)</option>
                      <option value="3-5-2">3-5-2 (Orta Saha Hakimiyeti & Kanat Bek)</option>
                      <option value="3-4-3">3-4-3 (Toplam Hücum & Kanat Baskısı)</option>
                      <option value="3-4-2-1">3-4-2-1 (Modern Amorim / Alonso 3'lüsü)</option>
                      <option value="3-4-1-2">3-4-1-2 (3 Stoper, 10 Numara & Çift Forvet)</option>
                      <option value="5-3-2">5-3-2 (Kayıtsız Savunma & Kontratak)</option>
                      <option value="5-2-3">5-2-3 (5-4-1 Geçiş Hücumu)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Oyun Anlayışı</label>
                      <select
                        value={mentality}
                        onChange={(e) => setMentality(e.target.value as Mentality)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="Çok Savunmacı">Çok Savunmacı</option>
                        <option value="Savunmacı">Savunmacı</option>
                        <option value="Dengeli">Dengeli</option>
                        <option value="Hücum">Hücum</option>
                        <option value="Aşırı Hücum">Aşırı Hücum</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Tempo</label>
                      <select
                        value={tempo}
                        onChange={(e) => setTempo(e.target.value as Tempo)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
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
                      <label className="block text-slate-300 font-bold mb-1.5">Pres Şiddeti</label>
                      <select
                        value={pressing}
                        onChange={(e) => setPressing(e.target.value as Pressing)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="Hafif">Hafif</option>
                        <option value="Orta">Orta</option>
                        <option value="Yoğun">Yoğun</option>
                        <option value="Aşırı">Aşırı</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">Pas Tercihi</label>
                      <select
                        value={passingStyle}
                        onChange={(e) => setPassingStyle(e.target.value as PassingStyle)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
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
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-2xl shadow-[0_0_25px_rgba(0,245,160,0.35)] transition transform active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2 mt-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Taktiği Kaydet & Gelecek Maça Uygula</span>
                  </button>
                </div>
              </div>

              {/* 2D Tactical Pitch Visualizer */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Saha Diziliş Görseli</span>
                  </h3>
                  <span className="text-xs font-mono font-black text-emerald-400 px-3 py-1 bg-slate-950 rounded-xl border border-slate-800">
                    {formation}
                  </span>
                </div>

                {/* Tactical Pitch Surface */}
                <div className="h-80 bg-gradient-to-b from-emerald-950/60 to-emerald-900/40 border border-emerald-500/40 rounded-2xl relative my-4 overflow-hidden shadow-inner flex items-center justify-center">
                  {/* Pitch Markings */}
                  <div className="absolute inset-2 border border-white/20 rounded-xl pointer-events-none" />
                  <div className="absolute inset-x-2 top-1/2 h-px bg-white/20 pointer-events-none" />
                  <div className="w-28 h-28 rounded-full border border-white/20 absolute pointer-events-none" />
                  <div className="w-2 h-2 rounded-full bg-white/30 absolute pointer-events-none" />
                  {/* Penalty Boxes */}
                  <div className="absolute inset-x-16 top-2 h-16 border-b border-x border-white/20 pointer-events-none" />
                  <div className="absolute inset-x-16 bottom-2 h-16 border-t border-x border-white/20 pointer-events-none" />

                  {/* 11 Starter Nodes Simulation */}
                  <div className="absolute inset-4 flex flex-col justify-between py-2">
                    {/* Attackers (top) */}
                    <div className="flex justify-around">
                      {sortedSquad.slice(8, 11).map((p, i) => (
                        <div key={p.id || i} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[11px] flex items-center justify-center border-2 border-slate-900 shadow-md">
                            {p.overall}
                          </div>
                          <span className="text-[9px] font-bold text-white truncate max-w-[70px] mt-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded">
                            {p.lastName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Midfielders */}
                    <div className="flex justify-around">
                      {sortedSquad.slice(4, 8).map((p, i) => (
                        <div key={p.id || i} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-[11px] flex items-center justify-center border-2 border-slate-900 shadow-md">
                            {p.overall}
                          </div>
                          <span className="text-[9px] font-bold text-white truncate max-w-[70px] mt-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded">
                            {p.lastName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Defenders */}
                    <div className="flex justify-around">
                      {sortedSquad.slice(1, 4).map((p, i) => (
                        <div key={p.id || i} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-mono font-black text-[11px] flex items-center justify-center border-2 border-slate-900 shadow-md">
                            {p.overall}
                          </div>
                          <span className="text-[9px] font-bold text-white truncate max-w-[70px] mt-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded">
                            {p.lastName}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Goalkeeper (bottom) */}
                    <div className="flex justify-center">
                      {sortedSquad.slice(0, 1).map((p, i) => (
                        <div key={p.id || i} className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-mono font-black text-[11px] flex items-center justify-center border-2 border-slate-900 shadow-md">
                            {p.overall}
                          </div>
                          <span className="text-[9px] font-bold text-white truncate max-w-[70px] mt-0.5 bg-slate-950/80 px-1.5 py-0.5 rounded">
                            {p.lastName} (GK)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  İlk 11 ve yedekler otomatik olarak en yüksek OVR gücüne ve taktiksel uyuma göre sahaya yerleştirilmiştir.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 4: FİKSTÜR & MAÇLAR (FIXTURES & SCHEDULE) */}
          {/* ================================================================ */}
          {activeTab === 'fixtures' && (
            <div className="space-y-6">
              {/* Fixtures Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/85 border border-slate-800/80 p-4 rounded-3xl backdrop-blur-xl">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                  <button
                    onClick={() => setSelectedWeekFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                      selectedWeekFilter === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Tüm Haftalar
                  </button>
                  {Array.from({ length: totalMatchweeks }, (_, i) => i + 1).map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeekFilter(w)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                        selectedWeekFilter === w
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Hafta {w}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowOnlyMyFixtures(!showOnlyMyFixtures)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    showOnlyMyFixtures
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sadece Benim Maçlarım</span>
                </button>
              </div>

              {/* Matchweeks List */}
              {Array.from({ length: totalMatchweeks }, (_, i) => i + 1).map((weekNum) => {
                if (selectedWeekFilter !== 'ALL' && selectedWeekFilter !== weekNum) return null;

                const weekFixtures = displayedFixtures.filter((f: DraftFixture) => f.round === weekNum);
                if (weekFixtures.length === 0) return null;

                return (
                  <div key={weekNum} className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span>Hafta {weekNum}</span>
                        {weekNum === currentMatchweek && (
                          <span className="text-[10px] px-2.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/50 rounded-full font-black animate-pulse">
                            ŞU ANKİ HAFTA
                          </span>
                        )}
                      </h3>
                      <span className="text-xs text-slate-400 font-mono">
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
                            className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                              isUserMatch
                                ? 'bg-slate-900/95 border-emerald-500/50 shadow-[0_0_20px_rgba(0,245,160,0.15)]'
                                : f.status === 'COMPLETED'
                                ? 'bg-slate-950/70 border-slate-800/70'
                                : 'bg-slate-900/70 border-slate-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-3 truncate flex-1">
                              <div className="space-y-1.5 truncate">
                                <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                                  {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={20} />}
                                  <span className="truncate">{homeClub?.name}</span>
                                </div>
                                <div className="text-xs font-bold text-slate-300 truncate flex items-center gap-2">
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
                                  className="font-mono font-black text-sm text-emerald-400 bg-slate-950 hover:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition shadow-inner"
                                >
                                  {f.homeScore} - {f.awayScore}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSimulateFixture(f.id)}
                                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                                >
                                  Simüle Et
                                </button>
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

          {/* ================================================================ */}
          {/* TAB 5: PUAN DURUMU (STANDINGS TABLE) */}
          {/* ================================================================ */}
          {activeTab === 'standings' && (
            <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Resmi Lig Puan Durumu</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {completedFixtures.length} / {fixtures.length} Karşılaşma Oynandı
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
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
                      <th className="py-3 px-3 text-right">Son 5 Maç</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {standings.map((st: DraftStanding) => {
                      const club = clubs.find((c: DraftClub) => c.id === st.clubId);
                      const isMine = myClub?.id === st.clubId;

                      return (
                        <tr
                          key={st.clubId}
                          className={`hover:bg-slate-800/40 transition ${
                            isMine ? 'bg-emerald-950/30' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-mono font-black">
                            {st.rank === 1 ? (
                              <span className="text-amber-400 flex items-center gap-1">
                                <Crown className="w-3.5 h-3.5" />
                                <span>1</span>
                              </span>
                            ) : st.rank <= 3 ? (
                              <span className="text-emerald-400">{st.rank}</span>
                            ) : (
                              <span className="text-slate-400">{st.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              {club && <BadgePreview badge={club.badge} clubCode={club.code} size={24} />}
                              <div>
                                <span className="font-extrabold text-white">
                                  {st.clubName} {isMine && <span className="text-[10px] text-emerald-400 font-bold">(SEN)</span>}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{club?.managerName}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{st.played}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{st.won}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{st.drawn}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono font-semibold">{st.lost}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono">{st.goalsFor}</td>
                          <td className="py-3 px-2 text-center text-slate-300 font-mono">{st.goalsAgainst}</td>
                          <td className="py-3 px-2 text-center font-bold text-slate-200 font-mono">{st.goalDifference}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm font-mono">{st.points}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {st.form.map((res: 'W' | 'D' | 'L', i: number) => (
                                <span
                                  key={i}
                                  className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shadow-sm ${
                                    res === 'W'
                                      ? 'bg-emerald-600 text-white'
                                      : res === 'D'
                                      ? 'bg-amber-600 text-white'
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

          {/* ================================================================ */}
          {/* TAB 6: İSTATİSTİKLER (LEADERBOARDS & RECORDS) */}
          {/* ================================================================ */}
          {activeTab === 'players' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Scorers */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                  <span>⚽</span>
                  <span>Gol Krallığı</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  {awards?.topScorer ? (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-amber-500/30 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="font-extrabold text-white text-sm">{awards.topScorer.playerName}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{awards.topScorer.clubName}</div>
                      </div>
                      <span className="font-mono font-black text-amber-400 text-base">{awards.topScorer.goals} Gol</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs py-6 text-center">Maçlar oynandıkça goller listelenecektir.</div>
                  )}
                </div>
              </div>

              {/* Top Assists */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                  <span>🎯</span>
                  <span>Asist Liderliği</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  {awards?.topAssists ? (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-cyan-500/30 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="font-extrabold text-white text-sm">{awards.topAssists.playerName}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{awards.topAssists.clubName}</div>
                      </div>
                      <span className="font-mono font-black text-cyan-400 text-base">{awards.topAssists.assists} Asist</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs py-6 text-center">Maçlar oynandıkça asistler listelenecektir.</div>
                  )}
                </div>
              </div>

              {/* Best Ratings */}
              <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white border-b border-slate-800/80 pb-3 flex items-center gap-2">
                  <span>⭐</span>
                  <span>En Yüksek Reytingler</span>
                </h3>
                <div className="space-y-2.5 text-xs">
                  {awards?.bestRating ? (
                    <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 flex items-center justify-between shadow-inner">
                      <div>
                        <div className="font-extrabold text-white text-sm">{awards.bestRating.playerName}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{awards.bestRating.clubName}</div>
                      </div>
                      <span className="font-mono font-black text-emerald-400 text-base">{awards.bestRating.rating} / 10</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs py-6 text-center">Maçlar oynandıkça reytingler listelenecektir.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* TAB 7: DRAFT GEÇMİŞİ (DRAFT HISTORY TIMELINE) */}
          {/* ================================================================ */}
          {activeTab === 'history' && (
            <div className="bg-slate-900/85 border border-slate-800/80 rounded-3xl p-6 shadow-lg backdrop-blur-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-400" />
                  <span>Draft Seçim Kayıtları (Toplam {roomState.draftState?.picks.length || 0} Seçim)</span>
                </h3>

                {/* Filter by club */}
                <select
                  value={historyClubFilter}
                  onChange={(e) => setHistoryClubFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:outline-none focus:border-emerald-500"
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
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
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
                  <tbody className="divide-y divide-slate-800/50">
                    {displayedPicks.map((pick: DraftPick) => {
                      const player = playerPool.find((p: Player) => p.id === pick.playerId);
                      const club = clubs.find((c: DraftClub) => c.id === pick.clubId);

                      return (
                        <tr key={pick.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 font-mono text-slate-500 font-bold">#{pick.globalPickNumber}</td>
                          <td className="py-3 px-2 text-slate-400 font-mono">Tur {pick.round}</td>
                          <td className="py-3 px-2 font-bold text-white">
                            <div className="flex items-center gap-2">
                              {club && <BadgePreview badge={club.badge} clubCode={club.code} size={18} />}
                              <span>{club?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 font-bold text-slate-200">
                            {player ? `${player.firstName} ${player.lastName}` : pick.playerId}
                          </td>
                          <td className="py-3 px-2">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded font-bold text-[10px]">
                              {player?.position || '--'}
                            </span>
                          </td>
                          <td className="py-3 px-2 font-black text-amber-300 font-mono">{player?.overall || '--'}</td>
                          <td className="py-3 px-3 text-right text-[10px] text-slate-400 font-semibold">
                            {pick.isAutoPick ? '🤖 Otomatik' : '👤 Manuel'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Broadcast Version */}
        <footer className="mt-8 text-center text-xs text-slate-500 pb-2">
          SquadCraft <span className="font-mono text-emerald-400 font-bold">{SQUADCRAFT_VERSION}</span> • Broadcast Draft & League Engine
        </footer>
      </div>

      {/* Modals */}
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
