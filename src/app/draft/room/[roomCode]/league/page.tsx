'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
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

interface LeaguePageProps {
  params: Promise<{ roomCode: string }>;
}

type TabType = 'overview' | 'squad' | 'tactics' | 'fixtures' | 'standings' | 'players' | 'history';
type SquadPositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';

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

  // Squad filters
  const [squadPosFilter, setSquadPosFilter] = useState<SquadPositionFilter>('ALL');

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
            // Draft completed, finalize server-authoritatively without bouncing back to /draft
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

    // 1. Realtime broadcast & Postgres changes listener
    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, () => {
      fetchState();
    });

    // 2. Tab visibility & focus listeners
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

    // 3. Fallback interval polling (every 1s)
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

  // Loading state (max 8s)
  if (hydrationResult.status === 'LOADING' && elapsedSeconds < 8) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="text-4xl animate-bounce">🏆</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Lig Yükleniyor...
          </h2>
          <p className="text-xs text-slate-400">
            {roomCode} lig tablosu ve fikstür hazırlanıyor. ({elapsedSeconds}s)
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-1000 rounded-full"
              style={{ width: `${Math.min(100, (elapsedSeconds / 8) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Timeout or Error State (Strictly max 8s)
  if (hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR' || (hydrationResult.status === 'LOADING' && elapsedSeconds >= 8)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-rose-900/50 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-rose-300">Bu ekran yüklenemedi.</h2>
          <p className="text-xs text-slate-400">
            [SC-MP-005] Sunucu ile bağlantı zaman aşımına uğradı veya lig verisi senkronize edilemedi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                fetchState();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
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
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
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

  // Calculate detailed alpha balance metrics
  const totalCompleted = completedFixtures.length;
  let totalGoals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalShots = 0;
  let totalXg = 0;
  let totalCards = 0;
  let totalInjuries = 0;

  completedFixtures.forEach((f: DraftFixture) => {
    const h = f.homeScore ?? 0;
    const a = f.awayScore ?? 0;
    totalGoals += h + a;
    if (h > a) homeWins++;
    else if (h === a) draws++;
    else awayWins++;

    if (f.matchResult) {
      totalShots += (f.matchResult.home.stats?.shots || 10) + (f.matchResult.away.stats?.shots || 10);
      totalXg += (f.matchResult.home.stats?.xG || 1.2) + (f.matchResult.away.stats?.xG || 1.1);
      totalCards += (f.matchResult.home.stats?.yellowCards || 0) + (f.matchResult.away.stats?.yellowCards || 0);
      totalInjuries +=
        (f.matchResult.home.players ? Object.values(f.matchResult.home.players).filter((p: any) => p.isInjured).length : 0) +
        (f.matchResult.away.players ? Object.values(f.matchResult.away.players).filter((p: any) => p.isInjured).length : 0);
    }
  });

  const avgGoals = totalCompleted > 0 ? (totalGoals / totalCompleted).toFixed(2) : '0.00';
  const avgXg = totalCompleted > 0 ? (totalXg / totalCompleted).toFixed(2) : '0.00';
  const avgShots = totalCompleted > 0 ? (totalShots / totalCompleted).toFixed(1) : '0.0';

  // Squad OVRs
  const clubOvrs = clubs.map((c: DraftClub) => {
    const squad = playerPool.filter((p: Player) => c.squadPlayerIds.includes(p.id));
    const avg = squad.length > 0 ? squad.reduce((sum: number, p: Player) => sum + p.overall, 0) / squad.length : 0;
    const sorted = [...squad].sort((a, b) => b.overall - a.overall);
    const xiAvg = sorted.slice(0, 11).reduce((sum: number, p: Player) => sum + p.overall, 0) / Math.max(1, Math.min(11, sorted.length));
    const benchAvg = sorted.slice(11).length > 0 ? sorted.slice(11).reduce((sum: number, p: Player) => sum + p.overall, 0) / sorted.slice(11).length : 0;
    const standing = standings.find((s: DraftStanding) => s.clubId === c.id);
    const draftInitialPos = roomState.draftState?.draftOrder.indexOf(c.memberId);

    return {
      club: c,
      avgOvr: Number(avg.toFixed(1)),
      xiAvg: Number(xiAvg.toFixed(1)),
      benchAvg: Number(benchAvg.toFixed(1)),
      rank: standing?.rank || 0,
      points: standing?.points || 0,
      goalsFor: standing?.goalsFor || 0,
      goalsAgainst: standing?.goalsAgainst || 0,
      draftInitialPos: draftInitialPos !== undefined && draftInitialPos >= 0 ? draftInitialPos + 1 : 1,
    };
  });

  const maxOvr = Math.max(...clubOvrs.map((c) => c.avgOvr), 0);
  const minOvr = Math.min(...clubOvrs.map((c) => c.avgOvr), 100);
  const ovrGap = Number((maxOvr - minOvr).toFixed(1));

  const progressPercent = fixtures.length > 0 ? Math.round((completedFixtures.length / fixtures.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-6 select-none">
      {/* Top Header Bar */}
      <div className="max-w-7xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/draft"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition"
          >
            ← Odadan Çık
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{room.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                isSeasonComplete
                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-600/40'
              }`}>
                {isSeasonComplete ? '🏆 SEZON BİTTİ' : `⚽ HAFTA ${currentMatchweek} / ${totalMatchweeks}`}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {clubs.length} Kulüp • {room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre' : 'Tek Devre'} • {completedFixtures.length}/{fixtures.length} Maç Tamamlandı (%{progressPercent})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              onClick={handleRepairRoom}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition flex items-center gap-1"
              title="Oda ve lig verisini senkronize et"
            >
              <span>🛠️</span> Odayı Onar
            </button>
          )}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1"
          >
            <span>💬</span> Geri Bildirim
          </button>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 font-bold">
            {roomCode}
          </div>
        </div>
      </div>

      {/* Progress & Toast Alerts */}
      {statusMessage && (
        <div className="max-w-7xl w-full mx-auto mb-3 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <span>✓ {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-white ml-2">✕</button>
        </div>
      )}
      {errorMessage && (
        <div className="max-w-7xl w-full mx-auto mb-3 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Top Hero Matchweek Progress Banner */}
      <div className="max-w-7xl w-full mx-auto mb-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <span className="text-lg">📅</span>
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {isSeasonComplete ? 'Lig Sezonu Tamamlandı' : `Hafta ${currentMatchweek} / ${totalMatchweeks} İlerlemesi`}
              </span>
              <span className="text-[11px] text-slate-400 block">
                Bu hafta: {currentWeekCompleted.length} / {currentWeekFixtures.length} Maç Oynandı
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Primary Context-Aware Matchweek Actions */}
            {!isSeasonComplete && (
              <>
                {myNextFixture && myNextFixture.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleSimulateFixture(myNextFixture.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition flex items-center gap-1.5"
                  >
                    <span>▶️</span> Maçı Başlat & Simüle Et
                  </button>
                )}

                {isHost && !isCurrentWeekFinished && currentWeekFixtures.some(f => f.status !== 'COMPLETED') && (
                  <button
                    onClick={handleSimulateRemainingInWeek}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <span>⚡</span> Haftanın Kalan Maçlarını Simüle Et
                  </button>
                )}

                {isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                  <button
                    onClick={handleAdvanceMatchweek}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                  >
                    <span>⏭️</span> Sonraki Haftaya Geç (Hafta {currentMatchweek + 1})
                  </button>
                )}

                {!isHost && isCurrentWeekFinished && currentMatchweek < totalMatchweeks && (
                  <div className="text-xs text-amber-300 font-semibold px-3 py-1.5 bg-amber-950/60 border border-amber-500/40 rounded-xl">
                    ⏳ Kurucunun Hafta {currentMatchweek + 1}'e geçmesi bekleniyor...
                  </div>
                )}
              </>
            )}

            {isSeasonComplete && isHost && (
              <button
                onClick={handleRematch}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <span>🔄</span> Yeni Sezon Başlat (Rematch)
              </button>
            )}
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Champion Celebration Banner (if finished) */}
      {isSeasonComplete && awards && (
        <div className="max-w-7xl w-full mx-auto mb-6 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-500/60 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl animate-bounce">👑</div>
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest">SQUADCRAFT DRAFT LİGİ ŞAMPİYONU</div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">{awards.championClubName}</h2>
                <p className="text-xs text-slate-300 mt-0.5">Sezon boyunca gösterilen üstün performansla lig kupasını kazandı!</p>
              </div>
            </div>

            {isHost && (
              <button
                onClick={handleRematch}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition"
              >
                🔄 Aynı Oyuncularla Yeni Lig Başlat (Rematch)
              </button>
            )}
          </div>

          {/* Awards Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 text-xs">
            {awards.topScorer && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">⚽ Gol Kralı</div>
                <div className="font-bold text-white truncate">{awards.topScorer.playerName}</div>
                <div className="text-amber-400 font-semibold">{awards.topScorer.goals} Gol</div>
              </div>
            )}
            {awards.topAssists && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">🎯 Asist Kralı</div>
                <div className="font-bold text-white truncate">{awards.topAssists.playerName}</div>
                <div className="text-blue-400 font-semibold">{awards.topAssists.assists} Asist</div>
              </div>
            )}
            {awards.bestRating && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">⭐ En İyi Oyuncu</div>
                <div className="font-bold text-white truncate">{awards.bestRating.playerName}</div>
                <div className="text-emerald-400 font-semibold">{awards.bestRating.rating} / 10</div>
              </div>
            )}
            {awards.bestGoalkeeper && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">🧤 En İyi Kaleci</div>
                <div className="font-bold text-white truncate">{awards.bestGoalkeeper.playerName}</div>
                <div className="text-purple-400 font-semibold">{awards.bestGoalkeeper.cleanSheets} Maç Gol Yemedi</div>
              </div>
            )}
            {awards.bestAttack && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">🔥 En İyi Hücum</div>
                <div className="font-bold text-white truncate">{awards.bestAttack.clubName}</div>
                <div className="text-amber-300 font-semibold">{awards.bestAttack.goalsFor} Gol</div>
              </div>
            )}
            {awards.bestDefense && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-slate-400 text-[10px]">🛡️ En İyi Savunma</div>
                <div className="font-bold text-white truncate">{awards.bestDefense.clubName}</div>
                <div className="text-emerald-300 font-semibold">{awards.bestDefense.goalsAgainst} Yenilen</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-800">
        {[
          { id: 'overview', label: 'Genel Bakış', icon: '📊' },
          { id: 'squad', label: `Kadrom (${mySquad.length}/18)`, icon: '👥' },
          { id: 'tactics', label: 'Taktik & Diziliş', icon: '📋' },
          { id: 'fixtures', label: 'Fikstür & Maçlar', icon: '⚽' },
          { id: 'standings', label: 'Puan Durumu', icon: '🏆' },
          { id: 'players', label: 'İstatistikler', icon: '⭐' },
          { id: 'history', label: 'Draft Geçmişi', icon: '📜' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition shrink-0 flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="max-w-7xl w-full mx-auto flex-1">
        {/* ================================================================== */}
        {/* 1. OVERVIEW TAB */}
        {/* ================================================================== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Next Match Spotlight */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚡</span>
                    <span>
                      {myNextFixture
                        ? `Sıradaki Karşılaşma (Hafta ${myNextFixture.round})`
                        : isSeasonComplete
                        ? 'Tüm Lig Maçları Tamamlandı'
                        : 'Sıradaki Maç'}
                    </span>
                  </h3>
                  {myNextFixture && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                      {myNextFixture.status === 'COMPLETED' ? 'TAMAMLANDI' : 'HAZIR'}
                    </span>
                  )}
                </div>

                {myNextFixture ? (
                  <div className="space-y-4">
                    {(() => {
                      const homeClub = clubs.find((c: DraftClub) => c.id === myNextFixture.homeClubId);
                      const awayClub = clubs.find((c: DraftClub) => c.id === myNextFixture.awayClubId);

                      return (
                        <div className="flex items-center justify-around py-5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                          {/* Home Club */}
                          <div className="text-center space-y-2 max-w-[140px]">
                            {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={56} />}
                            <div className="text-sm font-bold text-white truncate">{homeClub?.name}</div>
                            <div className="text-[10px] text-slate-400">{homeClub?.managerName}</div>
                          </div>

                          {/* Center VS & Score */}
                          <div className="text-center space-y-3">
                            <div className="text-3xl font-extrabold text-slate-200 font-mono">
                              {myNextFixture.status === 'COMPLETED'
                                ? `${myNextFixture.homeScore} - ${myNextFixture.awayScore}`
                                : 'VS'}
                            </div>

                            {myNextFixture.status === 'COMPLETED' ? (
                              <button
                                onClick={() => {
                                  setSelectedFixture(myNextFixture);
                                  setIsReportModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                              >
                                📋 Maç Raporu
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSimulateFixture(myNextFixture.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition"
                              >
                                ▶️ Maçı Simüle Et
                              </button>
                            )}
                          </div>

                          {/* Away Club */}
                          <div className="text-center space-y-2 max-w-[140px]">
                            {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={56} />}
                            <div className="text-sm font-bold text-white truncate">{awayClub?.name}</div>
                            <div className="text-[10px] text-slate-400">{awayClub?.managerName}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Lig fikstüründeki tüm karşılaşmalar simüle edildi! Puan durumu kesinleşti.
                  </div>
                )}
              </div>

              {/* Recent Results */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white">Son Karşılaşmalar</h3>
                <div className="space-y-2">
                  {completedFixtures.length === 0 ? (
                    <div className="text-xs text-slate-500 text-center py-4">Henüz tamamlanan karşılaşma yok.</div>
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
                            className="p-3 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 cursor-pointer transition"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[10px] font-mono text-slate-500 font-bold">H{f.round}</span>
                              <span className="font-semibold text-white truncate">{h?.name}</span>
                            </div>
                            <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded font-mono font-bold text-emerald-400 text-xs">
                              {f.homeScore} - {f.awayScore}
                            </div>
                            <div className="flex items-center gap-2 truncate justify-end">
                              <span className="font-semibold text-white truncate">{a?.name}</span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Standings Preview */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Puan Durumu</span>
                <button
                  onClick={() => setActiveTab('standings')}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  Tümü →
                </button>
              </h3>

              <div className="space-y-1.5 text-xs">
                {standings.map((st: DraftStanding) => {
                  const club = clubs.find((c: DraftClub) => c.id === st.clubId);
                  const isMine = myClub?.id === st.clubId;

                  return (
                    <div
                      key={st.clubId}
                      className={`p-2.5 rounded-xl flex items-center justify-between border transition ${
                        isMine
                          ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm'
                          : 'bg-slate-950/50 border-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 text-center font-bold text-slate-400">{st.rank}</span>
                        {club && <BadgePreview badge={club.badge} clubCode={club.code} size={22} />}
                        <span className="font-semibold text-white truncate">
                          {st.clubName} {isMine && <span className="text-[10px] text-emerald-400 font-bold">(SEN)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono font-semibold">
                        <span className="text-slate-400">{st.played}M</span>
                        <span className="text-emerald-400 font-bold">{st.points}P</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 2. SQUAD TAB (18/18 with filters) */}
        {/* ================================================================== */}
        {activeTab === 'squad' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">{myClub?.name} Kadrosu</h3>
                <p className="text-xs text-slate-400">{mySquad.length} / 18 Futbolcu Mevcut</p>
              </div>

              {/* Positional Filters */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as SquadPositionFilter[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSquadPosFilter(pos)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      squadPosFilter === pos ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos === 'ALL' ? 'Tümü' : pos}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">OVR</th>
                    <th className="py-2.5 px-2">Futbolcu</th>
                    <th className="py-2.5 px-2">Mevki</th>
                    <th className="py-2.5 px-2">Yaş</th>
                    <th className="py-2.5 px-2">Uyruk</th>
                    <th className="py-2.5 px-2">Ayak</th>
                    <th className="py-2.5 px-2">Hız</th>
                    <th className="py-2.5 px-2">Şut</th>
                    <th className="py-2.5 px-2">Pas</th>
                    <th className="py-2.5 px-2">Savunma</th>
                    <th className="py-2.5 px-2">Fizik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filteredSquad.map((player: Player) => (
                    <tr key={player.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold">
                        <span className="px-1.5 py-0.5 rounded text-xs font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-mono">
                          {player.overall}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 font-semibold text-white">
                        {player.firstName} {player.lastName}
                      </td>
                      <td className="py-2.5 px-2">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                          {player.position}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-slate-400">{player.age}</td>
                      <td className="py-2.5 px-2 text-slate-400">{player.nationality}</td>
                      <td className="py-2.5 px-2 text-slate-400">{player.preferredFoot}</td>
                      <td className="py-2.5 px-2 text-slate-300 font-mono">{player.attributes.pace}</td>
                      <td className="py-2.5 px-2 text-slate-300 font-mono">{player.attributes.finishing}</td>
                      <td className="py-2.5 px-2 text-slate-300 font-mono">{player.attributes.passing}</td>
                      <td className="py-2.5 px-2 text-slate-300 font-mono">{player.attributes.tackling}</td>
                      <td className="py-2.5 px-2 text-slate-300 font-mono">{player.attributes.strength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 3. TACTICS TAB */}
        {/* ================================================================== */}
        {activeTab === 'tactics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Taktiksel Talimatlar</h3>
                <button
                  onClick={handleAutoBestXI}
                  className="px-3 py-1 bg-emerald-950 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-lg transition"
                >
                  ⚡ En İyi 11'i Otomatik Belirle
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Diziliş (Formasyon)</label>
                  <select
                    value={formation}
                    onChange={(e) => setFormation(e.target.value as Formation)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value="4-2-3-1">4-2-3-1 (Dengeli & Modern)</option>
                    <option value="4-3-3">4-3-3 (Hücum & Kanat Organizasyonları)</option>
                    <option value="4-4-2">4-4-2 (Klasik Çift Forvet)</option>
                    <option value="4-1-2-1-2">4-1-2-1-2 (Baklava / Diamond)</option>
                    <option value="4-3-2-1">4-3-2-1 (Yılbaşı Ağacı / Christmas Tree)</option>
                    <option value="4-2-2-2">4-2-2-2 (Çift Ön Libero & Çift 10 Numara)</option>
                    <option value="4-1-4-1">4-1-4-1 (Guardiola / Kompakt Orta Saha)</option>
                    <option value="4-2-4">4-2-4 (Tam Hücum & 4 Forvet)</option>
                    <option value="3-5-2">3-5-2 (Orta Saha Hakimiyeti & Kanat Bek)</option>
                    <option value="3-4-3">3-4-3 (Toplam Hücum)</option>
                    <option value="3-4-2-1">3-4-2-1 (Modern Amorim / Alonso 3'lüsü)</option>
                    <option value="3-4-1-2">3-4-1-2 (3 Stoper, 10 Numara & Çift Forvet)</option>
                    <option value="5-3-2">5-3-2 (Kayıtsız Savunma & Kontratak)</option>
                    <option value="5-2-3">5-2-3 (5-4-1 Geçiş Hücumu)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Oyun Anlayışı</label>
                    <select
                      value={mentality}
                      onChange={(e) => setMentality(e.target.value as Mentality)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Çok Savunmacı">Çok Savunmacı</option>
                      <option value="Savunmacı">Savunmacı</option>
                      <option value="Dengeli">Dengeli</option>
                      <option value="Hücum">Hücum</option>
                      <option value="Aşırı Hücum">Aşırı Hücum</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tempo</label>
                    <select
                      value={tempo}
                      onChange={(e) => setTempo(e.target.value as Tempo)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Çok Düşük">Çok Düşük</option>
                      <option value="Düşük">Düşük</option>
                      <option value="Standart">Standart</option>
                      <option value="Yüksek">Yüksek</option>
                      <option value="Çok Yüksek">Çok Yüksek</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pres Şiddeti</label>
                    <select
                      value={pressing}
                      onChange={(e) => setPressing(e.target.value as Pressing)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Hafif">Hafif</option>
                      <option value="Orta">Orta</option>
                      <option value="Yoğun">Yoğun</option>
                      <option value="Aşırı">Aşırı</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Pas Tercihi</label>
                    <select
                      value={passingStyle}
                      onChange={(e) => setPassingStyle(e.target.value as PassingStyle)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Kısa">Kısa</option>
                      <option value="Karışık">Karışık</option>
                      <option value="Doğrudan">Doğrudan</option>
                      <option value="Uzun">Uzun</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleSaveTactics}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                >
                  ✓ Taktiği Kaydet & Gelecek Maça Uygula
                </button>
              </div>
            </div>

            {/* Pitch Visualizer */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Saha Diziliş Önizlemesi</h3>
              <div className="h-72 bg-emerald-950/40 border border-emerald-700/40 rounded-xl relative flex items-center justify-center my-4 overflow-hidden shadow-inner">
                <div className="w-full h-full border border-white/20 rounded-lg flex items-center justify-center relative">
                  <div className="w-28 h-28 rounded-full border border-white/20" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
                  <div className="absolute inset-x-12 top-0 h-16 border-b border-x border-white/20" />
                  <div className="absolute inset-x-12 bottom-0 h-16 border-t border-x border-white/20" />
                  <div className="text-xs font-bold text-emerald-300 z-10 bg-slate-950/90 px-3 py-1 rounded-full border border-emerald-500/40 shadow">
                    Formasyon: {formation}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center">
                İlk 11 ve yedekler otomatik olarak en yüksek OVR gücüne ve taktik pozisyonlarına göre dizilmiştir.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 4. FIXTURES TAB */}
        {/* ================================================================== */}
        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {Array.from({ length: totalMatchweeks }, (_, i) => i + 1).map((weekNum) => {
              const weekFixtures = fixtures.filter((f: DraftFixture) => f.round === weekNum);
              if (weekFixtures.length === 0) return null;

              return (
                <div key={weekNum} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Hafta {weekNum}</span>
                      {weekNum === currentMatchweek && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded-full font-bold">
                          ŞU ANKİ HAFTA
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {weekFixtures.filter(f => f.status === 'COMPLETED').length} / {weekFixtures.length} Tamamlandı
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {weekFixtures.map((f: DraftFixture) => {
                      const homeClub = clubs.find((c: DraftClub) => c.id === f.homeClubId);
                      const awayClub = clubs.find((c: DraftClub) => c.id === f.awayClubId);
                      const isUserMatch = myClub && (f.homeClubId === myClub.id || f.awayClubId === myClub.id);

                      return (
                        <div
                          key={f.id}
                          className={`p-3.5 rounded-xl border transition flex items-center justify-between ${
                            isUserMatch
                              ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                              : f.status === 'COMPLETED'
                              ? 'bg-slate-950/70 border-slate-800'
                              : 'bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate max-w-[200px] sm:max-w-[240px]">
                            <div className="truncate">
                              <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={18} />}
                                <span>{homeClub?.name}</span>
                              </div>
                              <div className="text-xs font-bold text-slate-300 truncate flex items-center gap-1.5 mt-1">
                                {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={18} />}
                                <span>{awayClub?.name}</span>
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
                                className="font-mono font-extrabold text-sm text-emerald-400 bg-slate-950 hover:bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 hover:border-emerald-500/40 transition"
                              >
                                {f.homeScore} - {f.awayScore}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSimulateFixture(f.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition"
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

        {/* ================================================================== */}
        {/* 5. STANDINGS TAB */}
        {/* ================================================================== */}
        {activeTab === 'standings' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Resmi Lig Puan Durumu</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Sıra</th>
                    <th className="py-2.5 px-2">Kulüp</th>
                    <th className="py-2.5 px-2 text-center">O</th>
                    <th className="py-2.5 px-2 text-center">G</th>
                    <th className="py-2.5 px-2 text-center">B</th>
                    <th className="py-2.5 px-2 text-center">M</th>
                    <th className="py-2.5 px-2 text-center">A</th>
                    <th className="py-2.5 px-2 text-center">Y</th>
                    <th className="py-2.5 px-2 text-center">AV</th>
                    <th className="py-2.5 px-3 text-right">Puan</th>
                    <th className="py-2.5 px-3 text-right">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {standings.map((st: DraftStanding) => {
                    const club = clubs.find((c: DraftClub) => c.id === st.clubId);
                    const isMine = myClub?.id === st.clubId;

                    return (
                      <tr key={st.clubId} className={`hover:bg-slate-800/40 ${isMine ? 'bg-emerald-950/20' : ''}`}>
                        <td className="py-2.5 px-3 font-bold text-slate-400">{st.rank}</td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-2">
                            {club && <BadgePreview badge={club.badge} clubCode={club.code} size={24} />}
                            <span className="font-bold text-white">
                              {st.clubName} {isMine && <span className="text-[10px] text-emerald-400 font-bold">(SEN)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.played}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.won}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.drawn}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.lost}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.goalsFor}</td>
                        <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{st.goalsAgainst}</td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-200 font-mono">{st.goalDifference}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-400 text-sm font-mono">{st.points}</td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {st.form.map((res: 'W' | 'D' | 'L', i: number) => (
                              <span
                                key={i}
                                className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${
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

        {/* ================================================================== */}
        {/* 6. STATISTICS TAB */}
        {/* ================================================================== */}
        {activeTab === 'players' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">⚽ Gol Krallığı</h3>
              <div className="space-y-2 text-xs">
                {awards?.topScorer ? (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{awards.topScorer.playerName}</div>
                      <div className="text-slate-400 text-[10px]">{awards.topScorer.clubName}</div>
                    </div>
                    <span className="font-mono font-bold text-amber-400 text-sm">{awards.topScorer.goals} Gol</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-4 text-center">Maçlar oynandıkça goller listelenecektir.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">🎯 Asist Liderliği</h3>
              <div className="space-y-2 text-xs">
                {awards?.topAssists ? (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{awards.topAssists.playerName}</div>
                      <div className="text-slate-400 text-[10px]">{awards.topAssists.clubName}</div>
                    </div>
                    <span className="font-mono font-bold text-blue-400 text-sm">{awards.topAssists.assists} Asist</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-4 text-center">Maçlar oynandıkça asistler listelenecektir.</div>
                )}
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">⭐ En İyi Oyuncu Reytingleri</h3>
              <div className="space-y-2 text-xs">
                {awards?.bestRating ? (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{awards.bestRating.playerName}</div>
                      <div className="text-slate-400 text-[10px]">{awards.bestRating.clubName}</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">{awards.bestRating.rating} / 10</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-xs py-4 text-center">Maçlar oynandıkça ortalama reytingler listelenecektir.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* 7. DRAFT HISTORY TAB */}
        {/* ================================================================== */}
        {activeTab === 'history' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              Draft Seçim Kayıtları (Toplam {roomState.draftState?.picks.length || 0} Seçim)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Sıra</th>
                    <th className="py-2.5 px-2">Tur</th>
                    <th className="py-2.5 px-2">Kulüp</th>
                    <th className="py-2.5 px-2">Futbolcu</th>
                    <th className="py-2.5 px-2">Mevki</th>
                    <th className="py-2.5 px-2">OVR</th>
                    <th className="py-2.5 px-3 text-right">Seçim Türü</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {roomState.draftState?.picks.map((pick: DraftPick) => {
                    const player = playerPool.find((p: Player) => p.id === pick.playerId);
                    const club = clubs.find((c: DraftClub) => c.id === pick.clubId);

                    return (
                      <tr key={pick.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono text-slate-500 font-bold">#{pick.globalPickNumber}</td>
                        <td className="py-2.5 px-2 text-slate-400 font-mono">Tur {pick.round}</td>
                        <td className="py-2.5 px-2 font-bold text-white">
                          <div className="flex items-center gap-1.5">
                            {club && <BadgePreview badge={club.badge} clubCode={club.code} size={16} />}
                            <span>{club?.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-slate-200">
                          {player ? `${player.firstName} ${player.lastName}` : pick.playerId}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-semibold text-[10px]">
                            {player?.position || '--'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-300 font-mono">{player?.overall || '--'}</td>
                        <td className="py-2.5 px-3 text-right text-[10px] text-slate-500">
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

      {/* Footer Version */}
      <div className="max-w-7xl w-full mx-auto text-center text-xs text-slate-500 pt-6">
        SquadCraft <span className="font-mono text-emerald-400 font-semibold">{SQUADCRAFT_VERSION}</span> • Hızlı Lig & Multiplayer Draft Engine
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
