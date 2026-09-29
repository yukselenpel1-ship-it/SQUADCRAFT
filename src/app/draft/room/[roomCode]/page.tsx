'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DraftMultiplayerStore, RoomFullState, HydratedRoomResult } from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId, getStoredMultiplayerUsername, setStoredMultiplayerUsername } from '@/lib/draft/sessionManager';
import { DraftClub, DraftRules } from '@/lib/draft/types';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { ClubCustomizerModal } from '@/components/draft/ClubCustomizerModal';
import { RulesConfigModal } from '@/components/draft/RulesConfigModal';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { AlphaDebugOverlay } from '@/components/draft/AlphaDebugOverlay';

interface RoomPageProps {
  params: Promise<{ roomCode: string }>;
}

export default function DraftRoomLobbyPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isStartingDraft, setIsStartingDraft] = useState(false);

  // Inline Join state
  const [joinUsername, setJoinUsername] = useState('');
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const [isJoiningInline, setIsJoiningInline] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const sessionId = getMultiplayerSessionId();

  useEffect(() => {
    setJoinUsername(getStoredMultiplayerUsername());
  }, []);

  // Hydrate room state
  const fetchState = async () => {
    try {
      const res = await DraftMultiplayerStore.hydrateDraftRoom(roomCode, sessionId);
      setHydrationResult(res);

      if (res.status === 'SUCCESS' && res.state) {
        // Automatic transition if host started draft
        if (res.state.room.status === 'DRAFTING') {
          router.push(`/draft/room/${roomCode}/draft`);
        } else if (res.state.room.status === 'LEAGUE_ACTIVE' || res.state.room.status === 'LEAGUE_COMPLETED') {
          router.push(`/draft/room/${roomCode}/league`);
        }
      }
    } catch (e: any) {
      console.warn('Fetch room error:', e);
    }
  };

  useEffect(() => {
    fetchState();

    // 1. Realtime broadcast & Postgres changes listener
    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, () => {
      fetchState();
    });

    // 2. Tab visibility & focus listeners (instant wake-up on tab switch)
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
          <div className="text-4xl animate-bounce">⚽</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Lobi Yükleniyor...
          </h2>
          <p className="text-xs text-slate-400">
            {roomCode} kodlu lig odasına bağlanılıyor. ({elapsedSeconds}s)
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
            [SC-MP-005] Sunucu bağlantısı zaman aşımına uğradı veya lobi verisi senkronize edilemedi.
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
              href="/draft"
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
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
                <div>Menajer Bulundu: {hydrationResult.diagnostics?.memberFound ? 'Evet' : 'Hayır'}</div>
                <div>Kulüp Bulundu: {hydrationResult.diagnostics?.clubFound ? 'Evet' : 'Hayır'}</div>
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

  // Not Member State (Inline Join Form)
  if (hydrationResult.status === 'NOT_MEMBER' && hydrationResult.state) {
    const rState = hydrationResult.state;
    const isLobby = rState.room.status === 'LOBBY';

    const handleInlineJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinUsername.trim()) {
        setJoinError('Lütfen menajer isminizi girin.');
        return;
      }
      setJoinError(null);
      setIsJoiningInline(true);

      try {
        setStoredMultiplayerUsername(joinUsername.trim());
        const res = await DraftMultiplayerStore.joinRoomAsync(
          roomCode,
          joinUsername.trim(),
          sessionId,
          joinAsSpectator
        );

        if (!res.success) {
          setJoinError(`[${res.errorCode || 'SC-MP-008'}] ${res.error || 'Odaya katılınamadı.'}`);
          setIsJoiningInline(false);
          return;
        }

        setIsJoiningInline(false);
        fetchState();
      } catch (err: any) {
        setJoinError(`[SC-MP-001] Odaya katılırken hata oluştu: ${err?.message || ''}`);
        setIsJoiningInline(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full text-center space-y-5 shadow-2xl">
          <div className="text-4xl">🚪</div>
          <h2 className="text-xl font-bold text-white">{rState.room.name}</h2>
          <div className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs font-mono text-emerald-400">
            ODA KODU: {roomCode}
          </div>

          <p className="text-xs text-slate-400">
            {isLobby
              ? 'Bu lig odasına katılmak için menajer isminizi girin.'
              : 'Bu odada draft veya lig başlamış durumda. Yalnızca izleyici olarak katılabilirsiniz.'}
          </p>

          <form onSubmit={handleInlineJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Menajer İsminiz</label>
              <input
                type="text"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                placeholder="Örn: Menajer Eren"
                maxLength={20}
                required
                disabled={isJoiningInline}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {!isLobby && (
              <div className="p-2.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <span>👁️</span>
                <span>İzleyici Modunda Katılacaksınız</span>
              </div>
            )}

            {joinError && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-500/50 rounded-lg text-xs text-rose-300">
                {joinError}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoiningInline}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isJoiningInline ? 'Odaya Giriliyor...' : '⚽ Odaya Katıl & Lobiye Gir'}
            </button>
          </form>

          <div className="pt-2">
            <Link href="/draft" className="text-xs text-slate-500 hover:text-slate-400">
              ← Draft Ana Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const roomState = hydrationResult.state;
  if (!roomState) return null;

  const { room, members, clubs } = roomState;
  const currentMember = hydrationResult.currentMember;
  const isHost = Boolean(hydrationResult.isHost);
  const myClub = hydrationResult.currentClub;
  const activeManagers = members.filter((m) => !m.isSpectator);
  const humanManagers = activeManagers.filter((m) => !m.isBot);
  const botManagers = activeManagers.filter((m) => m.isBot);
  const allHumansReady = humanManagers.length > 0 && humanManagers.every((m) => m.isReady);
  const canStartDraft = isHost && activeManagers.length >= 2 && allHumansReady;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = async () => {
    if (!currentMember) return;
    const res = await DraftMultiplayerStore.toggleMemberReadyAsync(room.id, currentMember.id);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
    }
  };

  const handleAddBot = async (difficulty: 'KOLAY' | 'ORTA' | 'ZOR') => {
    if (!currentMember || !isHost) return;
    setError(null);
    const res = await DraftMultiplayerStore.addBotAsync(room.id, currentMember.id, difficulty);
    if (!res.success) {
      setError(res.error || '[SC-MP-008] Bot eklenemedi.');
      return;
    }
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
    }
  };

  const handleRemoveBot = async (botMemberId: string) => {
    if (!currentMember || !isHost) return;
    setError(null);
    const res = await DraftMultiplayerStore.removeBotAsync(room.id, currentMember.id, botMemberId);
    if (!res.success) {
      setError(`[${res.errorCode || 'SC-MP-012'}] ${res.error || 'Bot odadan kaldırılamadı.'}`);
      return;
    }
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
    }
  };

  const handleSaveClub = (updatedData: Partial<DraftClub>) => {
    if (!currentMember) return;
    const res = DraftMultiplayerStore.updateClub(room.id, currentMember.id, updatedData);
    if (res.state) {
      setHydrationResult((prev) => ({
        ...prev,
        state: res.state,
        currentClub: res.state?.clubs.find((c) => c.memberId === currentMember.id),
      }));
    }
  };

  const handleSaveRules = (newRules: DraftRules) => {
    if (!currentMember) return;
    const res = DraftMultiplayerStore.updateRules(room.id, currentMember.id, newRules);
    if (res.state) {
      setHydrationResult((prev) => ({ ...prev, state: res.state }));
    }
  };

  const handleStartDraft = async () => {
    if (!currentMember || !isHost || isStartingDraft) return;
    setIsStartingDraft(true);
    setError(null);
    try {
      const res = await DraftMultiplayerStore.startDraftAsync(room.id, currentMember.id);
      if (!res.success) {
        setError(res.error || '[SC-MP-007] Draft başlatılamadı.');
        setIsStartingDraft(false);
        return;
      }
      router.push(`/draft/room/${roomCode}/draft`);
    } catch (err: any) {
      setError(`[SC-MP-007] Hata: ${err?.message || 'Draft başlatılamadı'}`);
      setIsStartingDraft(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/draft" className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg transition">
            ← Odadan Ayrıl
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold text-white truncate max-w-[200px] md:max-w-sm">{room.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-medium rounded-lg transition flex items-center gap-1.5"
          >
            <span>💬</span> Geri Bildirim / Hata
          </button>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold rounded-lg transition"
          >
            <span>{copied ? '✓ KOPYALANDI' : roomCode}</span>
            <span className="text-[10px] opacity-75">📋</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl w-full mx-auto mt-3 p-3 bg-rose-950/80 border border-rose-500/60 rounded-xl text-xs text-rose-300 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-white text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Lobby Container */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Left: Manager Roster (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Katılan Menajerler</h2>
              <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-xs font-semibold text-emerald-400">
                {activeManagers.length} / {room.rules.maxManagers}
              </span>
              <span className="text-xs text-slate-400">
                ({humanManagers.length} İnsan{botManagers.length > 0 ? `, ${botManagers.length} Bot` : ''})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isHost && activeManagers.length < room.rules.maxManagers && (
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
                  <span className="text-[11px] font-semibold text-slate-400 px-1.5">🤖 Bot Ekle:</span>
                  <button
                    onClick={() => handleAddBot('KOLAY')}
                    className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold rounded transition"
                  >
                    Kolay
                  </button>
                  <button
                    onClick={() => handleAddBot('ORTA')}
                    className="px-2 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/40 text-blue-300 text-[11px] font-bold rounded transition"
                  >
                    Orta
                  </button>
                  <button
                    onClick={() => handleAddBot('ZOR')}
                    className="px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-600/40 text-purple-300 text-[11px] font-bold rounded transition"
                  >
                    Zor
                  </button>
                </div>
              )}

              {myClub && (
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5"
                >
                  <span>🎨</span> Kulübümü Düzenle
                </button>
              )}
            </div>
          </div>

          {/* Members List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((member) => {
              const club = clubs.find((c) => c.memberId === member.id);
              const isMe = member.sessionId === sessionId;

              return (
                <div
                  key={member.id}
                  className={`p-4 rounded-xl border transition relative flex items-center justify-between ${
                    isMe
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                      : member.isBot
                      ? 'bg-slate-900/60 border-slate-700/80'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {club ? (
                      <BadgePreview badge={club.badge} clubCode={club.code} size={42} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xs text-slate-500">
                        👁️
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{club ? club.name : member.username}</span>
                        {isMe && <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-600/40 rounded font-semibold">SEN</span>}
                        {member.isBot && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${
                              member.botDifficulty === 'ZOR'
                                ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                                : member.botDifficulty === 'KOLAY'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                                : 'bg-blue-950 text-blue-300 border-blue-500/40'
                            }`}
                          >
                            🤖 BOT • {member.botDifficulty || 'ORTA'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {member.username} {club && `• ${club.code}`}
                        {member.botPersonality && (
                          <span className="ml-1 text-slate-400 font-mono text-[11px]">
                            ({member.botPersonality})
                          </span>
                        )}
                        {member.isSpectator && <span className="ml-1 text-slate-500">(İzleyici)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.isHost && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-500/40 rounded-full font-semibold">
                        KURUCU
                      </span>
                    )}

                    {member.isBot && isHost && (
                      <button
                        onClick={() => handleRemoveBot(member.id)}
                        className="text-[11px] px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/40 text-rose-300 rounded font-semibold transition"
                        title="Botu Çıkar"
                      >
                        ✕ Kaldır
                      </button>
                    )}

                    {!member.isSpectator && !member.isBot && (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-md ${
                          member.isReady
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {member.isReady ? '✓ HAZIR' : 'BEKLİYOR'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: Math.max(0, room.rules.maxManagers - activeManagers.length) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 font-bold text-sm">
                    +
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-400">Boş Menajer Slotu</div>
                    <div className="text-xs text-slate-500">Katılım veya Bot bekleniyor</div>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-slate-400 font-mono">
                  BOŞ
                </span>
              </div>
            ))}
          </div>

          {/* User Readiness Action */}
          {currentMember && !currentMember.isSpectator && (
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Kadronuzu kurmaya hazır olduğunuzda hazır durumunuzu işaretleyin.
              </div>
              <button
                onClick={handleToggleReady}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition shadow-md ${
                  currentMember.isReady
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {currentMember.isReady ? 'Hazır Değilim' : 'Hazırım!'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Room Rules & Launch Center */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Lig Formatı & Kurallar</h3>
              {isHost && (
                <button
                  onClick={() => setIsRulesOpen(true)}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  ⚙️ Düzenle
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Lig Türü</span>
                <span className="font-semibold text-white">{room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre (12 Maç)' : 'Tek Devre (6 Maç)'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Kadro Büyüklüğü</span>
                <span className="font-semibold text-white">{room.rules.squadSize} Futbolcu</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Draft Süresi</span>
                <span className="font-semibold text-white">{room.rules.pickTimerSeconds > 0 ? `${room.rules.pickTimerSeconds} Saniye` : 'Sınırsız'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Kondisyon</span>
                <span className="font-semibold text-white">{room.rules.fitness}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Sakatlık / Ceza</span>
                <span className="font-semibold text-white">{room.rules.injuries ? 'Açık' : 'Kapalı'} / {room.rules.suspensions ? 'Açık' : 'Kapalı'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Maç Simülasyonu</span>
                <span className="font-semibold text-white">{room.rules.matchType === 'FAST_SIM' ? 'Hızlı Simülasyon' : 'Maç Merkezi'}</span>
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2">
              {isHost ? (
                <button
                  onClick={handleStartDraft}
                  disabled={!canStartDraft || isStartingDraft}
                  className={`w-full py-3 rounded-xl font-bold text-sm shadow-xl transition flex items-center justify-center gap-2 ${
                    canStartDraft && !isStartingDraft
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <span>{isStartingDraft ? '⏳' : '🚀'}</span>
                  {isStartingDraft ? 'Draft Başlatılıyor...' : `Draft'ı Başlat (${activeManagers.length} / ${room.rules.maxManagers})`}
                </button>
              ) : (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-center text-xs text-slate-400">
                  ⏳ Oda kurucusunun draftı başlatması bekleniyor...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-4">
        Oda Kodu: <span className="font-mono text-emerald-400 font-bold">{roomCode}</span> • Arkadaşlarınıza kodu ileterek davet edebilirsiniz
      </div>

      {/* Modals */}
      {myClub && (
        <ClubCustomizerModal
          club={myClub}
          isOpen={isCustomizerOpen}
          onClose={() => setIsCustomizerOpen(false)}
          onSave={handleSaveClub}
        />
      )}

      {isHost && (
        <RulesConfigModal
          rules={room.rules}
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
          onSave={handleSaveRules}
        />
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roomId={room.id}
        route={`/draft/room/${roomCode}`}
        gamePhase="Lobby"
        stateVersion={room.stateVersion}
      />

      <AlphaDebugOverlay
        roomState={roomState}
        sessionId={sessionId}
      />
    </div>
  );
}
