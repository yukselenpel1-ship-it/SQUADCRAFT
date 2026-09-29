'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DraftMultiplayerStore, RoomFullState, HydratedRoomResult } from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId } from '@/lib/draft/sessionManager';
import { Player, PlayerPosition } from '@/types/game';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { countSquadPositions } from '@/lib/draft/draftEngine';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { AlphaDebugOverlay } from '@/components/draft/AlphaDebugOverlay';

interface DraftPageProps {
  params: Promise<{ roomCode: string }>;
}

type PositionFilter = 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';

export default function LiveDraftPage({ params }: DraftPageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [posFilter, setPosFilter] = useState<PositionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'overall' | 'pace' | 'shooting' | 'passing' | 'defending' | 'physical'>('overall');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [mobileTab, setMobileTab] = useState<'pool' | 'squads' | 'history'>('pool');
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const sessionId = getMultiplayerSessionId();
  const botProcessingRef = React.useRef(false);

  // Canonical hydration loop
  const hydrate = async () => {
    // Check turn timeout
    DraftMultiplayerStore.checkTurnTimeout(roomCode);
    const res = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId);
    setHydrationResult(res);

    // Route guards
    if (res.status === 'SUCCESS' && res.state) {
      if (res.state.room.status === 'LOBBY') {
        router.push(`/draft/room/${roomCode}`);
        return;
      }
      if (res.state.room.status === 'LEAGUE_ACTIVE' || res.state.room.status === 'LEAGUE_COMPLETED' || res.state.draftState?.isCompleted) {
        router.push(`/draft/room/${roomCode}/league`);
        return;
      }

      // Check if current turn is a Bot and trigger Bot draft pick
      if (res.state.draftState && !res.state.draftState.isCompleted && !botProcessingRef.current) {
        const turnMemberId = res.state.draftState.currentTurnMemberId;
        const turnMember = res.state.members.find((m) => m.id === turnMemberId);
        if (turnMember && turnMember.isBot) {
          botProcessingRef.current = true;
          setTimeout(() => {
            const pickRes = DraftMultiplayerStore.processBotDraftTurn(res.state!.room.id);
            botProcessingRef.current = false;
            if (pickRes.didPick && pickRes.state) {
              setHydrationResult((prev) => ({
                ...prev,
                state: pickRes.state,
                isMyTurn: pickRes.state?.draftState?.currentTurnMemberId === currentMember?.id,
              }));
            }
          }, 900);
        }
      }

      // Update timer
      if (res.state.draftState && res.state.room.rules.pickTimerSeconds > 0) {
        const remaining = Math.max(0, Math.ceil((res.state.draftState.pickDeadline - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    }
  };

  useEffect(() => {
    hydrate();

    // 1. Realtime broadcast & Postgres changes listener
    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, () => {
      hydrate();
    });

    // 2. Tab visibility & focus listeners
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        hydrate();
      }
    };
    const handleFocus = () => {
      hydrate();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // 3. Fallback interval polling (every 1s)
    const interval = setInterval(() => {
      hydrate();
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [roomCode]);

  // Loading state with 8s maximum timeout
  if (hydrationResult.status === 'LOADING' && elapsedSeconds < 8) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="text-4xl animate-bounce">⚡</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Draft Odası Yükleniyor...
          </h2>
          <p className="text-xs text-slate-400">
            {roomCode} kodlu canlı draft odası hazırlanıyor. ({elapsedSeconds}s)
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

  // Timeout or Error State (Never infinite spinner, strictly max 8s)
  if (hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR' || (hydrationResult.status === 'LOADING' && elapsedSeconds >= 8)) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-rose-900/50 rounded-3xl max-w-lg w-full text-center space-y-5 shadow-2xl">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-rose-300">Bu ekran yüklenemedi.</h2>
          <p className="text-xs text-slate-400">
            [SC-MP-005] Sunucu bağlantısı zaman aşımına uğradı veya canlı draft verisi senkronize edilemedi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                hydrate();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
            >
              🔄 TEKRAR DENE
            </button>
            <Link
              href={`/draft/room/${roomCode}`}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
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

          {/* Collapsible Diagnostics Panel */}
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
                <div>Seçim Sayısı: {hydrationResult.diagnostics?.picksCount || 0} / {hydrationResult.diagnostics?.expectedPicks || 72}</div>
                <div>Havuz Sayısı: {hydrationResult.diagnostics?.poolCount || 0}</div>
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

  // Not Member State
  if (hydrationResult.status === 'NOT_MEMBER') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold text-white">Bu Odanın Üyesi Değilsiniz</h2>
          <p className="text-xs text-slate-400">
            Bu lig odasında seçim yapabilmek için önce odaya katılmanız gerekmektedir.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              href={`/draft/room/${roomCode}`}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
            >
              🚪 Odaya Katıl & Lobiye Git
            </Link>
            <Link
              href="/draft"
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Ana Menü
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
  const currentMember = hydrationResult.currentMember;
  const isMyTurn = Boolean(hydrationResult.isMyTurn);
  const activeTurnMember = members.find((m) => m.id === draftState.currentTurnMemberId);
  const activeTurnClub = clubs.find((c) => c.memberId === draftState.currentTurnMemberId);

  const pickedIds = new Set(draftState.picks.map((p) => p.playerId));
  const availablePlayers = playerPool.filter((p) => !pickedIds.has(p.id));

  // Filter and sort available players
  const filteredPlayers = availablePlayers.filter((p) => {
    const matchesSearch =
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (posFilter === 'GK') return p.position === 'GK';
    if (posFilter === 'DEF') return ['DC', 'DL', 'DR', 'CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.position);
    if (posFilter === 'MID') return ['DMC', 'MC', 'AMC', 'ML', 'MR', 'DM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position);
    if (posFilter === 'ATT') return ['AML', 'AMR', 'ST', 'LW', 'RW', 'CF'].includes(p.position);
    return true;
  });

  filteredPlayers.sort((a, b) => {
    if (sortBy === 'overall') return b.overall - a.overall;
    if (sortBy === 'pace') return b.attributes.pace - a.attributes.pace;
    if (sortBy === 'shooting') return b.attributes.finishing - a.attributes.finishing;
    if (sortBy === 'passing') return b.attributes.passing - a.attributes.passing;
    if (sortBy === 'defending') return b.attributes.tackling - a.attributes.tackling;
    if (sortBy === 'physical') return b.attributes.strength - a.attributes.strength;
    return b.overall - a.overall;
  });

  // Make Draft Pick Action
  const handleSelectPlayer = (player: Player) => {
    if (!currentMember || !isMyTurn) return;
    setPickError(null);

    const res = DraftMultiplayerStore.makePick(room.id, currentMember.id, player.id, false);
    if (!res.success) {
      setPickError(res.error || '[SC-MP-004] Seçim gerçekleştirilemedi.');
      return;
    }

    setSelectedPlayer(null);
    if (res.state) {
      setHydrationResult((prev) => ({
        ...prev,
        state: res.state,
        isMyTurn: res.state?.draftState?.currentTurnMemberId === currentMember.id,
      }));
    }
  };

  const activeSpotlightPlayer = selectedPlayer || filteredPlayers[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 md:p-6 select-none">
      {/* Top Live Draft Status Bar */}
      <div className="max-w-7xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Left: Round & Turn Info */}
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300">
            TUR {draftState.currentRound} / {room.rules.squadSize}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTurnClub && <BadgePreview badge={activeTurnClub.badge} clubCode={activeTurnClub.code} size={36} />}
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">Şu An Seçim Yapan</div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeTurnClub ? activeTurnClub.name : activeTurnMember?.username}</span>
                {isMyTurn ? (
                  <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-extrabold rounded-full animate-pulse">
                    SIRA SENDE!
                  </span>
                ) : activeTurnMember?.isBot ? (
                  <span className="px-2 py-0.5 bg-purple-900/90 border border-purple-500/50 text-purple-300 text-[10px] font-bold rounded-full animate-pulse">
                    🤖 BOT SEÇİYOR... ({activeTurnMember.botDifficulty})
                  </span>
                ) : (
                  <span className="text-xs font-normal text-slate-400 font-mono">({activeTurnMember?.username})</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Turn Timer */}
        {room.rules.pickTimerSeconds > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl">
            <span className="text-base">⏱️</span>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Kalan Süre</div>
              <div
                className={`text-lg font-mono font-extrabold ${
                  timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {timeLeft}s
              </div>
            </div>
          </div>
        )}

        {/* Right: Room & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white">{room.name}</span>
            <span className="text-[10px] font-mono text-emerald-400">{room.roomCode}</span>
          </div>

          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
          >
            💬 Hata Bildir
          </button>
        </div>
      </div>

      {pickError && (
        <div className="max-w-7xl w-full mx-auto mb-4 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-300">
          ⚠️ {pickError}
        </div>
      )}

      {/* Main 3-Column Layout (Desktop) */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 mb-auto">
        {/* Column 1: Player Pool & Filters (6 Cols) */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-[650px]">
          <div className="space-y-3">
            {/* Search & Position Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 İsim veya mevki ara..."
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-48"
              />

              {/* Pos Filter Badges */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as PositionFilter[]).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosFilter(pos)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      posFilter === pos ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos === 'ALL' ? 'Tümü' : pos}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
              <span>{filteredPlayers.length} Futbolcu Mevcut</span>
              <div className="flex items-center gap-1.5">
                <span>Sırala:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-0.5 text-[11px] focus:outline-none"
                >
                  <option value="overall">Genel Güç (OVR)</option>
                  <option value="pace">Hız (PAC)</option>
                  <option value="shooting">Şut (SHO)</option>
                  <option value="passing">Pas (PAS)</option>
                  <option value="defending">Savunma (DEF)</option>
                  <option value="physical">Fizik (PHY)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scrollable Player List */}
          <div className="overflow-y-auto space-y-1.5 my-2 pr-1 custom-scrollbar flex-1">
            {filteredPlayers.slice(0, 80).map((player) => {
              const isSelected = activeSpotlightPlayer?.id === player.id;
              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        player.position === 'GK'
                          ? 'bg-amber-950 text-amber-400 border border-amber-600/40'
                          : ['DC', 'DL', 'DR'].includes(player.position)
                          ? 'bg-blue-950 text-blue-400 border border-blue-600/40'
                          : ['DMC', 'MC', 'AMC', 'ML', 'MR'].includes(player.position)
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                          : 'bg-rose-950 text-rose-400 border border-rose-600/40'
                      }`}
                    >
                      {player.position}
                    </span>

                    <div>
                      <div className="text-xs font-bold text-white">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {player.nationality} • {player.age} Yaş • {player.preferredFoot}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-400 font-mono">{player.overall}</span>
                      <span className="text-[9px] text-slate-500 block">OVR</span>
                    </div>

                    {isMyTurn && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPlayer(player);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg shadow transition"
                      >
                        Seç
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800">
            Toplam {playerPool.length} Futbolcu Havuzda • Kurgusal Evren
          </div>
        </div>

        {/* Column 2: Spotlight Player Detail Card (3 Cols) */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[650px]">
          {activeSpotlightPlayer ? (
            <div className="space-y-5">
              <div className="text-center space-y-2 pb-4 border-b border-slate-800">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-2xl font-bold text-slate-950 shadow-lg">
                  {activeSpotlightPlayer.position}
                </div>
                <h3 className="text-base font-extrabold text-white">
                  {activeSpotlightPlayer.firstName} {activeSpotlightPlayer.lastName}
                </h3>
                <p className="text-xs text-slate-400">
                  {activeSpotlightPlayer.nationality} • {activeSpotlightPlayer.age} Yaş • {activeSpotlightPlayer.height}cm
                </p>
                <div className="inline-block px-3 py-0.5 bg-emerald-950 border border-emerald-500/40 rounded-full text-xs font-mono font-bold text-emerald-400">
                  GÜÇ: {activeSpotlightPlayer.overall} / POT: {activeSpotlightPlayer.potential}
                </div>
              </div>

              {/* Key Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Hız</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.pace}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Bitiricilik</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.finishing}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Pas</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.passing}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Top Sürme</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.dribbling}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Müdahale</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.tackling}</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex justify-between">
                  <span className="text-slate-400">Fizik</span>
                  <span className="font-mono font-bold text-white">{activeSpotlightPlayer.attributes.strength}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Ayak: <span className="text-white font-semibold">{activeSpotlightPlayer.preferredFoot}</span></div>
                <div>Rol: <span className="text-white font-semibold">{activeSpotlightPlayer.squadRole}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-500 my-auto">Detay için bir futbolcu seçin.</div>
          )}

          {activeSpotlightPlayer && isMyTurn && (
            <button
              onClick={() => handleSelectPlayer(activeSpotlightPlayer)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition"
            >
              ⚽ Bu Futbolcuyu Seç
            </button>
          )}
        </div>

        {/* Column 3: My Squad & Pick History (3 Cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* My Club Squad Live Quota */}
          {currentMember && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Kadrom</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {clubs.find((c) => c.memberId === currentMember.id)?.squadPlayerIds.length || 0} / {room.rules.squadSize}
                </span>
              </div>

              {/* Positional Quotas */}
              {(() => {
                const myClub = clubs.find((c) => c.memberId === currentMember.id);
                const counts = countSquadPositions(playerPool, myClub?.squadPlayerIds || []);
                return (
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400">GK</div>
                      <div className={counts.gk >= 2 ? 'text-emerald-400' : 'text-amber-400'}>{counts.gk}/2</div>
                    </div>
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400">DEF</div>
                      <div className={counts.def >= 5 ? 'text-emerald-400' : 'text-amber-400'}>{counts.def}/5</div>
                    </div>
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400">MID</div>
                      <div className={counts.mid >= 5 ? 'text-emerald-400' : 'text-amber-400'}>{counts.mid}/5</div>
                    </div>
                    <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
                      <div className="text-[10px] text-slate-400">ATT</div>
                      <div className={counts.att >= 3 ? 'text-emerald-400' : 'text-amber-400'}>{counts.att}/3</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Recent Picks Log */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2.5 h-[420px] flex flex-col justify-between">
            <div className="text-xs font-bold text-white border-b border-slate-800 pb-2">
              Son Yapılan Seçimler ({draftState.picks.length})
            </div>

            <div className="overflow-y-auto space-y-1.5 pr-1 flex-1 custom-scrollbar">
              {draftState.picks.length === 0 ? (
                <div className="text-center text-xs text-slate-500 my-auto pt-16">Henüz seçim yapılmadı.</div>
              ) : (
                [...draftState.picks].reverse().map((pick) => {
                  const p = playerPool.find((item) => item.id === pick.playerId);
                  const m = members.find((mem) => mem.id === pick.memberId);
                  return (
                    <div key={pick.id} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-200">
                          {p ? `${p.firstName} ${p.lastName}` : pick.playerId}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {m?.username} • Tur {pick.round}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-400">{p?.position}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Feedback Modal */}
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
