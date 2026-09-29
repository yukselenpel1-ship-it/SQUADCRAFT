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
  KeyRound,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Crown,
  Sparkles,
  Bot,
  Copy,
  Check,
  Palette,
  Play,
  Share2,
  UserCheck,
  Flame,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  LogOut,
} from 'lucide-react';

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
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url('/stadium-draft-bg.webp')` }}
        />
        <div className="relative z-10 p-8 sm:p-10 bg-[#0B0F19]/90 border border-white/10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping opacity-50" />
            <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-lg">
              ⚽
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wider uppercase text-white font-display">
              Lobiye Bağlanılıyor
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-mono text-emerald-400 font-bold">{roomCode}</span> kodlu maç odası senkronize ediliyor ({elapsedSeconds}s)
            </p>
          </div>
          <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-1000 rounded-full shadow-lg shadow-emerald-500/50"
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
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url('/stadium-draft-bg.webp')` }}
        />
        <div className="relative z-10 p-8 sm:p-10 bg-[#0B0F19]/90 border border-rose-500/30 rounded-3xl max-w-lg w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl shadow-lg">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-300 uppercase tracking-wide">
              Lobi Ekranı Yüklenemedi
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              [SC-MP-005] Sunucu bağlantısı zaman aşımına uğradı veya lobi verisi senkronize edilemedi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                fetchState();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>TEKRAR DENE</span>
            </button>
            <Link
              href="/draft"
              className="w-full sm:w-auto px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl border border-white/10 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>DRAFT MERKEZİ</span>
            </Link>
          </div>

          {/* Diagnostics Panel */}
          <div className="pt-4 border-t border-white/[0.08] text-left">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-300 flex items-center justify-between w-full"
            >
              <span>⚙️ Tanı & Teşhis Paneli (Diagnostics)</span>
              <span>{showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}</span>
            </button>

            {showDiagnostics && (
              <div className="mt-3 p-3.5 bg-black/60 rounded-xl border border-white/10 font-mono text-[10px] text-slate-400 space-y-1">
                <div>Oda Kodu: {roomCode}</div>
                <div>Oda Durumu: {hydrationResult.diagnostics?.roomStatus || 'Bilinmiyor'}</div>
                <div>State Sürümü: {hydrationResult.diagnostics?.stateVersion || 0}</div>
                <div>Menajer Bulundu: {hydrationResult.diagnostics?.memberFound ? 'Evet' : 'Hayır'}</div>
                <div>Kulüp Bulundu: {hydrationResult.diagnostics?.clubFound ? 'Evet' : 'Hayır'}</div>
                <div>Realtime: {hydrationResult.diagnostics?.realtimeConnected ? 'Aktif' : 'Pasif'}</div>
                <div>Son Hata: {hydrationResult.diagnostics?.lastError || 'Yok'}</div>
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
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url('/stadium-draft-bg.webp')` }}
        />
        <div className="relative z-10 p-8 sm:p-10 bg-[#0B0F19]/90 border border-white/10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl shadow-lg">
            ✕
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">
              Oda Bulunamadı
            </h2>
            <p className="text-xs text-rose-400 bg-rose-950/60 p-3 rounded-xl border border-rose-900/50 mt-2">
              [SC-MP-001] {hydrationResult.errorMessage || 'Oda bulunamadı veya süresi doldu.'}
            </p>
          </div>
          <Link
            href="/draft"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Draft Merkezine Dön</span>
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
      <div className="relative min-h-screen bg-[#04060A] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: `url('/stadium-draft-bg.webp')` }}
        />
        <div className="relative z-10 p-8 sm:p-10 bg-[#0B0F19]/90 border border-white/10 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-2xl shadow-lg">
            🏟️
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">
              {rState.room.name}
            </h2>
            <div className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-full text-xs font-mono font-bold text-emerald-400 mt-2">
              ODA KODU: {roomCode}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isLobby
                ? 'Bu lig odasına katılmak için menajer isminizi girin.'
                : 'Bu odada draft veya lig başlamış durumda. Yalnızca izleyici olarak katılabilirsiniz.'}
            </p>
          </div>

          <form onSubmit={handleInlineJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Menajer İsminiz
              </label>
              <input
                type="text"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                placeholder="Örn: Menajer Eren"
                maxLength={20}
                required
                disabled={isJoiningInline}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {!isLobby && (
              <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <span>👁️</span>
                <span>İzleyici Modunda Katılacaksınız</span>
              </div>
            )}

            {joinError && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-300">
                {joinError}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoiningInline}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isJoiningInline ? 'Odaya Giriliyor...' : '⚽ Odaya Katıl & Lobiye Gir'}
            </button>
          </form>

          <div className="pt-2">
            <Link href="/draft" className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Draft Ana Sayfasına Dön</span>
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
    <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* Dynamic Atmospheric Stadium Arena Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/stadium-draft-bg.webp')`,
          filter: 'brightness(0.24) contrast(1.18) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-t from-[#04060A] via-[#04060A]/90 to-transparent" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_75%_75%_at_50%_-15%,rgba(16,185,129,0.18),rgba(255,255,255,0))]" />

      {/* TOP BROADCAST STATUS BAR */}
      <header className="relative z-20 w-full border-b border-white/[0.08] bg-[#070B14]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/draft"
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-bold transition duration-200"
            >
              <LogOut className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">ODADAN AYRIL</span>
            </Link>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm md:text-base font-black tracking-wide text-white uppercase font-display truncate max-w-[180px] sm:max-w-xs md:max-w-sm">
                    {room.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                    CANLI LOBİ
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>{room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre Lig' : 'Tek Devre Lig'}</span>
                  <span>•</span>
                  <span>{room.rules.squadSize} Oyuncu</span>
                  <span>•</span>
                  <span>{room.rules.pickTimerSeconds > 0 ? `${room.rules.pickTimerSeconds}s Süre` : 'Sınırsız'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>Geri Bildirim</span>
            </button>

            {/* Room Code Copy Badge */}
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-mono font-bold transition shadow-lg ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-950/80 scale-105'
                  : 'bg-emerald-950/80 hover:bg-emerald-900/90 border-emerald-500/50 text-emerald-300 hover:text-white shadow-emerald-950/40'
              }`}
              title="Kodu Kopyalamak İçin Tıklayın"
            >
              <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-sans font-bold">KOD:</span>
              <span className="font-black text-sm tracking-wider">{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white text-xs font-bold px-2 py-1 bg-rose-900/40 rounded-lg transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MAIN LOBBY CONTAINER */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ==================================================================== */}
        {/* LEFT 2-COLS: MANAGER ROSTER & PODIUM CARDS */}
        {/* ==================================================================== */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F19]/90 border border-white/[0.08] p-4 rounded-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black tracking-wide text-white uppercase">
                  Katılan Menajerler & Kadrolar
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">{activeManagers.length} / {room.rules.maxManagers} Slot Dolu</span>
                  <span>•</span>
                  <span>{humanManagers.length} İnsan Menajer</span>
                  {botManagers.length > 0 && <span>• {botManagers.length} Yapay Zeka Bot</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bot Addition Bar for Host */}
              {isHost && activeManagers.length < room.rules.maxManagers && (
                <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 gap-1">
                  <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Bot:</span>
                  </span>
                  <button
                    onClick={() => handleAddBot('KOLAY')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition shadow-sm"
                    title="Kolay Seviye Bot Ekle"
                  >
                    Kolay
                  </button>
                  <button
                    onClick={() => handleAddBot('ORTA')}
                    className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-[11px] font-bold transition shadow-sm"
                    title="Orta Seviye Bot Ekle"
                  >
                    Orta
                  </button>
                  <button
                    onClick={() => handleAddBot('ZOR')}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 text-[11px] font-bold transition shadow-sm"
                    title="Zor Seviye Bot Ekle"
                  >
                    Zor
                  </button>
                </div>
              )}

              {myClub && (
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 hover:text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Palette className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kulübümü Düzenle</span>
                </button>
              )}
            </div>
          </div>

          {/* Members FIFA Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((member) => {
              const club = clubs.find((c) => c.memberId === member.id);
              const isMe = member.sessionId === sessionId;

              return (
                <div
                  key={member.id}
                  className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-300 backdrop-blur-xl ${
                    isMe
                      ? 'bg-gradient-to-br from-[#0B0F19] via-[#0E1726] to-[#0B0F19] border-emerald-500/60 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                      : member.isBot
                      ? 'bg-[#0B0F19]/80 border-purple-500/20 hover:border-purple-500/40 shadow-lg'
                      : 'bg-[#0B0F19]/80 border-white/[0.08] hover:border-white/20 shadow-lg'
                  }`}
                >
                  {/* Decorative Glow Stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
                    style={{
                      backgroundImage: club
                        ? `linear-gradient(to right, ${club.primaryColor}, ${club.secondaryColor})`
                        : undefined,
                    }}
                  />

                  <div className="flex items-center justify-between gap-3">
                    {/* Club Crest & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {club ? (
                          <div className="p-1 rounded-xl bg-black/40 border border-white/10 shadow-inner">
                            <BadgePreview badge={club.badge} clubCode={club.code} size={46} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-lg text-slate-400">
                            👁️
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-black text-white uppercase tracking-wide truncate font-display">
                            {club ? club.name : member.username}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 uppercase tracking-wider shadow-sm">
                              SEN
                            </span>
                          )}
                          {member.isHost && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-400" />
                              <span>KURUCU</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <span>{member.username}</span>
                          {club && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-emerald-400 font-bold">{club.code}</span>
                            </>
                          )}
                          {member.isSpectator && (
                            <span className="text-slate-500 font-semibold">(İzleyici)</span>
                          )}
                        </div>

                        {/* Bot Archetype & Difficulty Badge */}
                        {member.isBot && (
                          <div className="mt-1 flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border flex items-center gap-1 ${
                                member.botDifficulty === 'ZOR'
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                                  : member.botDifficulty === 'KOLAY'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                  : 'bg-sky-950/80 text-sky-300 border-sky-500/50'
                              }`}
                            >
                              <Bot className="w-3 h-3" />
                              <span>BOT • {member.botDifficulty || 'ORTA'}</span>
                            </span>
                            {member.botPersonality && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({member.botPersonality})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {member.isBot && isHost ? (
                        <button
                          onClick={() => handleRemoveBot(member.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-xs font-bold transition shadow-sm"
                          title="Botu Odadan Çıkar"
                        >
                          ✕ Kaldır
                        </button>
                      ) : !member.isSpectator && !member.isBot ? (
                        <span
                          className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shadow-sm ${
                            member.isReady
                              ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50 shadow-emerald-950/50'
                              : 'bg-slate-900 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {member.isReady ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>HAZIR</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              <span>BEKLİYOR</span>
                            </>
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots Cards */}
            {Array.from({ length: Math.max(0, room.rules.maxManagers - activeManagers.length) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="relative overflow-hidden rounded-2xl p-5 border border-dashed border-white/10 bg-white/[0.01] hover:bg-white/[0.03] transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-slate-500 font-black text-base">
                    +
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                      Boş Menajer Slotu
                    </div>
                    <div className="text-xs text-slate-500">
                      Arkadaşınızı davet edin veya Bot ekleyin
                    </div>
                  </div>
                </div>

                {isHost ? (
                  <button
                    onClick={() => handleAddBot('ORTA')}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bot Ekle</span>
                  </button>
                ) : (
                  <span className="text-[10px] px-2 py-1 bg-white/[0.03] border border-white/10 rounded-lg text-slate-500 font-mono font-bold uppercase">
                    BOŞ
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* User Readiness Interactive Bar */}
          {currentMember && !currentMember.isSpectator && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B0F19] to-[#111827] border border-white/[0.08] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white uppercase tracking-wider">
                    {currentMember.isReady ? 'Kadronuz Draft İçin Onaylandı' : 'Drafta Başlamaya Hazır mısınız?'}
                  </div>
                  <p className="text-xs text-slate-400">
                    {currentMember.isReady
                      ? 'Diğer menajerlerin hazır olması bekleniyor.'
                      : 'Kulüp bilgilerinizi kontrol ettikten sonra hazır durumunuzu güncelleyin.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center gap-2 ${
                  currentMember.isReady
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/60'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60'
                }`}
              >
                {currentMember.isReady ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Hazır Değilim (Geri Al)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>MAÇA HAZIRIM!</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RIGHT COLUMN: LEAGUE RULES & DRAFT LAUNCHPAD */}
        {/* ==================================================================== */}
        <div className="space-y-5">
          {/* Lig Kuralları Paneli */}
          <div className="bg-[#0B0F19]/90 border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Lig Formatı & Kurallar
                  </h3>
                  <span className="text-[10px] text-slate-400">SquadCraft Alpha 4</span>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={() => setIsRulesOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-emerald-400 hover:text-white transition flex items-center gap-1"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-slate-400">Lig Türü</span>
                <span className="font-bold text-white">
                  {room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre (Rövanşlı)' : 'Tek Devre (Hızlı)'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-slate-400">Kadro Kotası</span>
                <span className="font-bold text-white">{room.rules.squadSize} Futbolcu</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-slate-400">Seçim Tur Süresi</span>
                <span className="font-bold text-emerald-400">
                  {room.rules.pickTimerSeconds > 0 ? `${room.rules.pickTimerSeconds} Saniye` : 'Sınırsız'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-slate-400">Kondisyon Ayarı</span>
                <span className="font-bold text-white">{room.rules.fitness}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/[0.05]">
                <span className="text-slate-400">Sakatlık & Ceza</span>
                <span className="font-bold text-white">
                  {room.rules.injuries ? 'Açık' : 'Kapalı'} / {room.rules.suspensions ? 'Açık' : 'Kapalı'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Maç Motoru</span>
                <span className="font-bold text-amber-400">2D Taktik Radarı</span>
              </div>
            </div>

            {/* LAUNCH CENTER */}
            <div className="pt-3 border-t border-white/[0.08]">
              {isHost ? (
                <div className="space-y-3">
                  <button
                    onClick={handleStartDraft}
                    disabled={!canStartDraft || isStartingDraft}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider shadow-2xl transition flex items-center justify-center gap-2 ${
                      canStartDraft && !isStartingDraft
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/80 cursor-pointer animate-pulse'
                        : 'bg-white/[0.05] text-slate-500 cursor-not-allowed border border-white/[0.08]'
                    }`}
                  >
                    {isStartingDraft ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>DRAFT BAŞLATILIYOR...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>DRAFT'I BAŞLAT ({activeManagers.length}/{room.rules.maxManagers})</span>
                      </>
                    )}
                  </button>

                  {!canStartDraft && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                      <div className="font-bold">Başlatma Koşulları:</div>
                      <div className="flex items-center gap-1.5">
                        <span>{activeManagers.length >= 2 ? '✓' : '✗'}</span>
                        <span>En az 2 takım katılmış olmalıdır. ({activeManagers.length}/2)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>{allHumansReady ? '✓' : '✗'}</span>
                        <span>Tüm gerçek menajerler "HAZIR" olmalıdır.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>KURUCU BEKLENİYOR</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Oda kurucusu tüm takımlar hazır olduğunda draftı başlatacaktır.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Davet ve Paylaşım Kartı */}
          <div className="bg-[#0B0F19]/90 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Arkadaşlarını Davet Et</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu odaya katılmak isteyen arkadaşlarınıza aşağıdaki kodu iletmeniz yeterlidir:
            </p>
            <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/30 flex items-center justify-between font-mono">
              <span className="text-emerald-400 font-black text-sm tracking-widest">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg transition"
              >
                {copied ? 'Kopyalandı!' : 'Kopyala'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#070B14]/80 py-4 text-center text-xs text-slate-500">
        Oda Kodu: <span className="font-mono text-emerald-400 font-bold">{roomCode}</span> • SquadCraft Realtime Match Engine
      </footer>

      {/* MODALS */}
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
