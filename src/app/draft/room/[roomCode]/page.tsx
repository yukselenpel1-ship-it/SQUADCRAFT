'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DraftMultiplayerStore, RoomFullState, HydratedRoomResult } from '@/lib/draft/multiplayerStore';
import { getMultiplayerSessionId, getStoredMultiplayerUsername, setStoredMultiplayerUsername } from '@/lib/draft/sessionManager';
import { DraftClub, DraftRules } from '@/lib/draft/types';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { ClubCustomizerModal } from '@/components/draft/ClubCustomizerModal';
import { RulesConfigModal } from '@/components/draft/RulesConfigModal';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { AlphaDebugOverlay } from '@/components/draft/AlphaDebugOverlay';
import { APP_VERSION } from '@/lib/version';
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
  Swords,
  Layers,
  Gamepad2,
} from 'lucide-react';

interface RoomPageProps {
  params: Promise<{ roomCode: string }>;
}

export default function DraftRoomLobbyPage({ params }: RoomPageProps) {
  const resolvedParams = use(params);
  const roomCode = resolvedParams.roomCode.toUpperCase();
  const router = useRouter();

  const [hydrationResult, setHydrationResult] = useState<HydratedRoomResult>({ status: 'LOADING' });
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
      if (res.status === 'SUCCESS' && res.state) {
        setHydrationResult(res);
        setHasLoadedOnce(true);

        // Automatic transition if room closed
        if (res.state.room.status === 'CLOSED' || res.state.room.status === 'TERMINATED') {
          alert('Oda kurucusu odadan ayrıldığı için oda kapatıldı.');
          router.push('/');
          return;
        }

        // Automatic transition if host started draft
        if (res.state.room.status === 'DRAFTING') {
          router.push(`/draft/room/${roomCode}/draft`);
        } else if (res.state.room.status === 'LEAGUE_ACTIVE' || res.state.room.status === 'LEAGUE_COMPLETED') {
          router.push(`/draft/room/${roomCode}/league`);
        }
      } else {
        if (!hasLoadedOnce) {
          setHydrationResult(res);
        }
      }
    } catch (e: any) {
      console.warn('Fetch room error:', e);
    }
  };

  useEffect(() => {
    fetchState();

    // 1. Realtime broadcast & Postgres changes listener
    const unsubscribe = DraftMultiplayerStore.subscribeToRoom(roomCode, (event) => {
      if (event?.type === 'BROADCAST_ROOM_CLOSED') {
        alert('Oda kurucusu odadan ayrıldı. Oda sonlandırılıyor.');
        router.push('/');
        return;
      }
      if (event?.type === 'BROADCAST_DRAFT_STARTED') {
        router.push(`/draft/room/${roomCode}/draft`);
        return;
      }
      fetchState();
    });

    // 2. Poll fallback every 3 seconds
    const interval = setInterval(fetchState, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [roomCode]);

  // Loading progress counter
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [roomCode]);

  // Loading state (initial only, max 7s)
  if (!hasLoadedOnce && hydrationResult.status === 'LOADING' && elapsedSeconds < 7) {
    return (
      <div className="relative min-h-screen bg-[#050806] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="sc-draft-room-stadium fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050806]/85 via-transparent to-[#050806]/95" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#050806]/40 to-[#050806]/90" />
        </div>
        <div className="relative z-10 p-8 sm:p-10 sc-panel rounded-3xl border border-white/10 max-w-md w-full text-center space-y-6 shadow-2xl backdrop-blur-2xl">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-[#b7ff35]/20 rounded-2xl animate-ping" />
            <div className="relative w-14 h-14 bg-[#0d120f] border border-[#b7ff35]/50 rounded-2xl flex items-center justify-center text-2xl shadow-lg text-[#b7ff35]">
              <Zap className="w-7 h-7 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wider uppercase text-white font-barlow italic">
              LOBİYE BAĞLANILIYOR
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              <span className="font-ibm text-[#b7ff35] font-bold">{roomCode}</span> kodlu maç odası senkronize ediliyor...
            </p>
          </div>
          <div className="w-full bg-[#0d120f] h-2 overflow-hidden border border-white/10 rounded-full">
            <div
              className="bg-gradient-to-r from-[#4FE4FF] to-[#b7ff35] h-full transition-all duration-500 rounded-full shadow-[0_0_12px_#b7ff35]"
              style={{ width: `${Math.min(100, (elapsedSeconds / 4) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Timeout or Error State (Only before first load)
  if (!hasLoadedOnce && (hydrationResult.status === 'TIMEOUT' || hydrationResult.status === 'ERROR')) {
    return (
      <div className="relative min-h-screen bg-[#050806] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050806]/85 via-transparent to-[#050806]/95" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#050806]/40 to-[#050806]/90" />
        </div>
        <div className="relative z-10 p-8 sm:p-10 sc-panel rounded-3xl border border-rose-600/50 max-w-lg w-full text-center space-y-5 shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 mx-auto bg-[#0d120f] border border-rose-500/50 rounded-2xl flex items-center justify-center text-rose-400 text-2xl">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-rose-300 uppercase tracking-wide font-barlow italic">
              Lobi Ekranı Yüklenemedi
            </h2>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              [SC-MP-005] Sunucu bağlantısı zaman aşımına uğradı veya lobi verisi senkronize edilemedi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setElapsedSeconds(0);
                fetchState();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#b7ff35] hover:bg-[#00D485] text-[#050806] text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#b7ff35]/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>TEKRAR DENE</span>
            </button>
            <Link
              href="/draft"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#090d0a] hover:bg-[#141b16] text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider border border-white/10 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>DRAFT MERKEZİ</span>
            </Link>
          </div>

          {/* Diagnostics Panel */}
          <div className="pt-3 border-t border-white/10 text-left">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="text-[10px] font-ibm text-zinc-500 hover:text-zinc-300 flex items-center justify-between w-full"
            >
              <span>⚙️ Tanı & Teşhis Paneli</span>
              <span>{showDiagnostics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}</span>
            </button>

            {showDiagnostics && (
              <div className="mt-2 p-3 bg-[#050806] border border-white/10 rounded-xl font-ibm text-[10px] text-zinc-400 space-y-1">
                <div>Oda Kodu: {roomCode}</div>
                <div>Oda Durumu: {hydrationResult.diagnostics?.roomStatus || 'Bilinmiyor'}</div>
                <div>State Sürümü: {hydrationResult.diagnostics?.stateVersion || 0}</div>
                <div>Menajer Bulundu: {hydrationResult.diagnostics?.memberFound ? 'Evet' : 'Hayır'}</div>
                <div>Kulüp Bulundu: {hydrationResult.diagnostics?.clubFound ? 'Evet' : 'Hayır'}</div>
                <div>Realtime: {hydrationResult.diagnostics?.realtimeConnected ? 'Aktif' : 'Pasif'}</div>
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
      <div className="relative min-h-screen bg-[#050806] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050806]/85 via-transparent to-[#050806]/95" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#050806]/40 to-[#050806]/90" />
        </div>
        <div className="relative z-10 p-8 sm:p-10 sc-panel rounded-3xl border border-white/10 max-w-md w-full text-center space-y-5 shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 mx-auto bg-[#0d120f] border border-white/10 rounded-2xl flex items-center justify-center text-rose-400 text-2xl font-black">
            ✕
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide font-barlow italic">
              ODA BULUNAMADI
            </h2>
            <p className="text-xs text-rose-400 bg-rose-950/60 p-3 rounded-xl border border-rose-900/50 mt-2">
              [SC-MP-001] {hydrationResult.errorMessage || 'Oda bulunamadı veya süresi doldu.'}
            </p>
          </div>
          <Link
            href="/draft"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl bg-[#b7ff35] hover:bg-[#00D485] text-[#050806] transition shadow-lg shadow-[#b7ff35]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>DRAFT MERKEZİNE DÖN</span>
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
      <div className="relative min-h-screen bg-[#050806] text-white flex flex-col items-center justify-center p-4 overflow-hidden select-none font-sans">
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#050806]/85 via-transparent to-[#050806]/95" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#050806]/40 to-[#050806]/90" />
        </div>
        <div className="relative z-10 p-8 sm:p-10 sc-panel rounded-3xl border border-white/10 max-w-md w-full text-center space-y-5 shadow-2xl backdrop-blur-2xl">
          <div className="w-14 h-14 mx-auto bg-[#0d120f] border border-[#b7ff35]/40 rounded-2xl flex items-center justify-center text-[#b7ff35] text-2xl">
            🏟️
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide font-barlow italic">
              {rState.room.name}
            </h2>
            <div className="inline-block px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-xs font-ibm font-bold text-[#b7ff35] mt-2">
              ODA KODU: {roomCode}
            </div>
            <p className="text-xs text-zinc-400 mt-2">
              {isLobby
                ? 'Bu lig odasına katılmak için menajer isminizi girin.'
                : 'Bu odada draft veya lig başlamış durumda. Yalnızca izleyici olarak katılabilirsiniz.'}
            </p>
          </div>

          <form onSubmit={handleInlineJoin} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
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
                className="w-full px-4 py-3 rounded-xl bg-[#0d120f] border border-white/10 text-white placeholder-zinc-500 text-sm font-semibold focus:outline-none focus:border-[#b7ff35] transition"
              />
            </div>

            {!isLobby && (
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                <span>👁️</span>
                <span>İzleyici Modunda Katılacaksınız</span>
              </div>
            )}

            {joinError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-xs text-rose-300">
                {joinError}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoiningInline}
              className="w-full py-3.5 rounded-xl bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#b7ff35]/20 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95"
            >
              {isJoiningInline ? 'Odaya Giriliyor...' : '⚽ Odaya Katıl & Lobiye Gir'}
            </button>
          </form>

          <div className="pt-2">
            <Link href="/draft" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1">
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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/draft/room/${roomCode}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
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

  const handleChangeBotDifficulty = (botMemberId: string, diff: 'KOLAY' | 'ORTA' | 'ZOR') => {
    if (!currentMember || !isHost) return;
    const res = DraftMultiplayerStore.updateBot(room.id, currentMember.id, botMemberId, { difficulty: diff });
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
    <div className="sc-draft-room-readable sc-draft-lobby-v2 sc-draft-career-theme relative min-h-screen w-full bg-[#f2ede3] text-[#24211e] flex flex-col justify-between overflow-x-hidden font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. HIGH-CONTRAST STADIUM ARENA BACKGROUND (FULL VIEWPORT)            */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-transparent to-[#04060A]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/40 to-[#04060A]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT ORIGINAL DRAFT COMMAND CENTER TOP HUD                  */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-[#cdbfb0] bg-[#f2ede3]/95 backdrop-blur-md px-4 sm:px-8 py-3 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#493e35] hover:text-[#24211e] text-xs font-bold uppercase tracking-wider transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-[#97252c]" />
              <span className="hidden sm:inline">ODADAN AYRIL</span>
            </button>

            <div className="h-6 w-px bg-[#141b16] hidden sm:block" />

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
                  <span className="text-[#24211e] group-hover:text-zinc-100 transition-colors">SQUADCRAFT</span>
                  <span className="text-[#97252c]">26</span>
                </div>
                <span className="text-[11px] font-ibm font-bold tracking-wide text-[#b9dedc] uppercase mt-0.5">
                  DRAFT MATCH LOBBY
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Live Match Stats & Room Status */}
          <div className="hidden lg:flex items-center gap-3 bg-[#e9dfd3] border border-[#cdbfb0] rounded-xl px-4 py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a3262c] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-wider text-[#24211e] font-barlow">
                {room.name}
              </span>
            </div>
            <span className="text-[#776b60]">|</span>
            <span className="text-xs font-inter font-semibold text-[#493e35] uppercase">
              {room.rules.maxManagers} TAKIMLI ALFA LİGİ • {room.rules.squadSize} FUTBOLCU • {room.rules.pickTimerSeconds > 0 ? `${room.rules.pickTimerSeconds}S SÜRE` : 'SÜRESİZ'} • €{((room.rules.draftBudget || 250_000_000) / 1_000_000).toFixed(1)}M BÜTÇE
            </span>
          </div>

          {/* Right: Telemetry & Room Code Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#e9dfd3] rounded-xl border border-[#cdbfb0] text-xs font-inter font-semibold text-[#3e362f]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a3262c]" />
              <span>SUNUCU: AKTİF</span>
              <span className="text-[#776b60]">•</span>
              <span className="text-[#b9dedc]">TR</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#3e362f] hover:text-[#24211e] text-xs font-bold uppercase tracking-wider transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#97252c]" />
              <span>Geri Bildirim</span>
            </button>

            {/* Room Code Copy Badge */}
            <button
              onClick={handleCopyCode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-ibm font-bold transition shadow-lg ${
                copied
                  ? 'bg-[#a3262c] text-white border-[#a3262c] shadow-[#b7ff35]/20'
                  : 'bg-[#e9dfd3] hover:bg-[#141b16] border-[#cdbfb0] text-[#97252c]'
              }`}
              title="Kodu Kopyalamak İçin Tıklayın"
            >
              <span className="text-[10px] uppercase tracking-wider text-[#62574d] font-sans font-bold">ODA:</span>
              <span className="font-black text-sm tracking-wider">{roomCode}</span>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-[#97252c]" />}
            </button>
          </div>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-3">
          <div className="p-3 bg-rose-950/80 border border-rose-600/50 rounded-xl text-rose-200 text-xs flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-[#24211e] text-xs font-bold px-2 py-0.5 rounded bg-rose-900/40 transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. MAIN COMMAND CENTER LOBBY GRID                                    */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ==================================================================== */}
        {/* LEFT 8-COLS: MANAGER ROSTER & PODIUM DECK                            */}
        {/* ==================================================================== */}
        <div className="lg:col-span-8 min-w-0 space-y-4">
          {/* Section Header Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 sc-panel rounded-2xl border border-[#cdbfb0] p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ebe1d5] border border-[#cdbfb0] flex items-center justify-center text-[#97252c] font-bold text-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-wide text-[#24211e] uppercase font-barlow">
                    KATILAN MENAJERLER & KULÜPLER
                  </h2>
                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-ibm font-black bg-[#a3262c]/10 border border-[#a3262c]/30 text-[#97252c] uppercase">
                    {activeManagers.length} / {room.rules.maxManagers} DOLU
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#62574d] mt-0.5">
                  <span className="font-bold text-[#24211e]">{humanManagers.length} Gerçek Menajer</span>
                  <span>•</span>
                  <span>{botManagers.length} Yapay Zeka Bot</span>
                  <span>•</span>
                  <span className="text-[#6b6055]">18 Tur Snake Draft</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Quick Bot Addition for Host */}
              {isHost && activeManagers.length < room.rules.maxManagers && (
                <div className="flex items-center bg-[#ebe1d5] border border-[#cdbfb0] rounded-xl p-1.5 gap-1.5">
                  <span className="text-[11px] font-bold text-[#62574d] px-2 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-[#376e67]" />
                    <span>Bot Ekle:</span>
                  </span>
                  <button
                    onClick={() => handleAddBot('KOLAY')}
                    className="px-2.5 py-1 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#97252c] text-xs font-bold uppercase transition"
                  >
                    Kolay
                  </button>
                  <button
                    onClick={() => handleAddBot('ORTA')}
                    className="px-2.5 py-1 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#376e67] text-xs font-bold uppercase transition"
                  >
                    Orta
                  </button>
                  <button
                    onClick={() => handleAddBot('ZOR')}
                    className="px-2.5 py-1 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#956b25] text-xs font-bold uppercase transition"
                  >
                    Zor
                  </button>
                </div>
              )}

              {myClub && (
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-xs font-bold text-[#97252c] hover:text-[#24211e] transition flex items-center gap-2 shadow-sm"
                >
                  <Palette className="w-4 h-4" />
                  <span>Kulübümü Özelleştir</span>
                </button>
              )}
            </div>
          </div>

          {/* Members Tactical Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {members.map((member) => {
              const club = clubs.find((c) => c.memberId === member.id);
              const isMe = member.sessionId === sessionId;

              return (
                <div
                  key={member.id}
                  className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 shadow-2xl flex flex-col justify-between min-h-[156px] overflow-hidden ${
                    isMe
                      ? 'bg-[#f3e4dc] border-[#a3262c] ring-1 ring-[#a3262c]/25'
                      : 'sc-panel border-[#cdbfb0] hover:border-zinc-700'
                  }`}
                >
                  {/* Top Color Accent Line */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{
                      backgroundColor: club?.primaryColor || (isMe ? '#b7ff35' : '#141b16'),
                    }}
                  />

                  <div className="flex items-start justify-between gap-3 pt-1">
                    {/* Club Crest & Info */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {club ? (
                          <div className="p-2 bg-black/80 rounded-xl border border-[#cdbfb0] shadow-inner">
                            <BadgePreview badge={club.badge} clubCode={club.code} size={48} />
                          </div>
                        ) : (
                          <div className="w-13 h-13 rounded-xl bg-[#ebe1d5] border border-[#cdbfb0] flex items-center justify-center text-lg text-[#6b6055]">
                            👁️
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-black text-[#24211e] uppercase tracking-wide break-words font-barlow">
                            {club ? club.name : member.username}
                          </span>
                          {isMe && (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-[#a3262c] text-white uppercase tracking-wider">
                              SEN
                            </span>
                          )}
                          {member.isHost && (
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-[#FFB800]/20 text-[#956b25] border border-[#FFB800]/40 uppercase flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              <span>KURUCU</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-[#62574d] font-medium flex items-center gap-1.5 mt-1">
                          <span className="text-[#493e35] font-semibold">{member.username}</span>
                          {club && (
                            <>
                              <span className="text-[#776b60]">•</span>
                              <span className="font-ibm text-[#97252c] font-bold">{club.code}</span>
                            </>
                          )}
                          {member.isSpectator && (
                            <span className="text-[#6b6055] font-semibold">(İzleyici)</span>
                          )}
                        </div>

                        {/* Bot Badge & Difficulty Selector */}
                        {member.isBot && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            {isHost ? (
                              <div className="flex items-center gap-1 bg-[#ebe1d5] border border-[#cdbfb0] p-0.5 rounded-lg text-[10px] font-ibm font-bold">
                                <Bot className="w-3 h-3 text-[#376e67] ml-1" />
                                <span className="text-[#6b6055] mr-0.5">BOT:</span>
                                {(['KOLAY', 'ORTA', 'ZOR'] as const).map((diff) => (
                                  <button
                                    key={diff}
                                    type="button"
                                    onClick={() => handleChangeBotDifficulty(member.id, diff)}
                                    className={`px-1.5 py-0.5 rounded-md transition ${
                                      (member.botDifficulty || 'ORTA') === diff
                                        ? diff === 'ZOR'
                                          ? 'bg-amber-500/30 text-[#956b25] border border-amber-500/60 font-black'
                                          : diff === 'KOLAY'
                                          ? 'bg-emerald-500/30 text-[#97252c] border border-emerald-500/60 font-black'
                                          : 'bg-sky-500/30 text-[#376e67] border border-sky-500/60 font-black'
                                        : 'text-[#6b6055] hover:text-[#493e35]'
                                    }`}
                                    title={`Zorluğu ${diff} olarak ayarla`}
                                  >
                                    {diff}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-lg font-ibm font-bold uppercase border flex items-center gap-1 ${
                                  member.botDifficulty === 'ZOR'
                                    ? 'bg-amber-950/80 text-[#956b25] border-amber-500/50'
                                    : member.botDifficulty === 'KOLAY'
                                    ? 'bg-emerald-950/80 text-[#97252c] border-emerald-500/50'
                                    : 'bg-sky-950/80 text-[#376e67] border-sky-500/50'
                                }`}
                              >
                                <Bot className="w-3 h-3" />
                                <span>BOT • {member.botDifficulty || 'ORTA'}</span>
                              </span>
                            )}
                            {member.botPersonality && (
                              <span className="text-[10px] text-[#62574d] font-ibm">
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
                              ? 'bg-emerald-950/80 text-[#97252c] border-emerald-500/60 shadow-[0_0_12px_rgba(183, 255, 53,0.2)]'
                              : 'bg-[#e9dfd3] text-[#956b25] border-[#cdbfb0]'
                          }`}
                        >
                          {member.isReady ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-[#97252c]" />
                              <span>HAZIR</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-[#956b25] animate-pulse" />
                              <span>BEKLİYOR</span>
                            </>
                          )}
                        </span>
                      ) : null}

                      {isMe && myClub && (
                        <button
                          onClick={() => setIsCustomizerOpen(true)}
                          className="text-xs text-[#97252c] hover:underline font-bold flex items-center gap-1 mt-1"
                        >
                          <Palette className="w-3.5 h-3.5" />
                          <span>Armayı Düzenle</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty Slots Cards */}
            {Array.from({ length: Math.max(0, room.rules.maxManagers - activeManagers.length) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="p-4 sm:p-5 rounded-2xl border border-dashed border-[#cdbfb0] bg-[#f5eee4] hover:bg-[#eaded0] transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl min-h-[156px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-[#eee3d6] border border-[#cdbfb0] flex items-center justify-center text-[#776b60] font-black text-lg">
                    +
                  </div>
                  <div>
                    <div className="text-base font-bold text-[#3e362f] uppercase tracking-wide font-barlow">
                      Boş Menajer Slotu
                    </div>
                    <div className="text-xs text-[#6b6055] mt-0.5">
                      Arkadaşınızı davet edin veya Bot ekleyin
                    </div>
                  </div>
                </div>

                {isHost ? (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <button
                      onClick={() => handleAddBot('KOLAY')}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#97252c] text-xs font-bold transition"
                    >
                      + Kolay
                    </button>
                    <button
                      onClick={() => handleAddBot('ORTA')}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#376e67] text-xs font-bold transition"
                    >
                      + Orta
                    </button>
                    <button
                      onClick={() => handleAddBot('ZOR')}
                      className="flex-1 sm:flex-initial px-2.5 py-1.5 rounded-lg bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-[#956b25] text-xs font-bold transition"
                    >
                      + Zor
                    </button>
                  </div>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-[#e9dfd3] border border-[#cdbfb0] text-[#493e35] font-ibm font-bold uppercase">
                    BOŞ
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* User Readiness Interactive Bar */}
          {currentMember && !currentMember.isSpectator && (
            <div className="p-5 sc-panel rounded-2xl border border-[#cdbfb0] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-[#ebe1d5] border border-[#cdbfb0] flex items-center justify-center text-[#97252c] shrink-0">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-black text-[#24211e] uppercase tracking-wider italic font-barlow">
                    {currentMember.isReady ? 'KADRONUZ DRAFT İÇİN ONAYLANDI' : 'DRAFT HAZIRLIK DURUMU'}
                  </div>
                  <p className="text-xs text-[#62574d] mt-0.5">
                    {currentMember.isReady
                      ? 'Diğer menajerlerin hazır olması bekleniyor. Draft başladığında anında ekrana yönlendirileceksiniz.'
                      : 'Kulüp bilgilerinizi onayladıktan sonra hazır durumuna geçin.'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleReady}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-xl flex items-center justify-center gap-2 ${
                  currentMember.isReady
                    ? 'bg-[#FFB800] hover:bg-[#E5A700] text-[#050806] shadow-[0_0_20px_rgba(255,184,0,0.3)] active:scale-95'
                    : 'bg-[#a3262c] hover:bg-[#7c1a22] text-white shadow-[0_0_20px_rgba(183, 255, 53,0.3)] active:scale-95'
                }`}
              >
                {currentMember.isReady ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>HAZIR DEĞİLİM (GERİ AL)</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>MAÇA HAZIRIM!</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ==================================================================== */}
        {/* RIGHT 4-COLS: LEAGUE RULES & DRAFT LAUNCHPAD                         */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 space-y-4">
          {/* Lig Kuralları Paneli */}
          <div className="sc-panel rounded-2xl border border-[#cdbfb0] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cdbfb0] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ebe1d5] border border-[#cdbfb0] flex items-center justify-center text-[#956b25]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#24211e] uppercase tracking-wider italic font-barlow">
                    LİG FORMATI & KURALLAR
                  </h3>
                  <span className="text-[10px] font-ibm text-[#6b6055]">SquadCraft {room.rules.maxManagers} Takımlı Lig</span>
                </div>
              </div>

              {isHost && (
                <button
                  onClick={() => setIsRulesOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#e9dfd3] hover:bg-[#141b16] border border-[#cdbfb0] text-xs font-bold text-[#97252c] hover:text-[#24211e] transition flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Düzenle</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Lig Türü</span>
                <span className="font-black text-[#24211e]">
                  {room.rules.format === 'DOUBLE_ROUND' ? 'Çift Devre (Rövanşlı Lig)' : 'Tek Devre (Hızlı Lig)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Kadro Büyüklüğü</span>
                <span className="font-black text-[#24211e]">{room.rules.squadSize} Futbolcu</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Seçim Tur Süresi</span>
                <span className="font-black text-[#97252c]">
                  {room.rules.pickTimerSeconds > 0 ? `${room.rules.pickTimerSeconds} Saniye` : 'Sınırsız'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Kondisyon Ayarı</span>
                <span className="font-black text-[#24211e]">{room.rules.fitness}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Sakatlık & Ceza</span>
                <span className="font-black text-[#24211e]">
                  {room.rules.injuries ? 'Açık' : 'Kapalı'} / {room.rules.suspensions ? 'Açık' : 'Kapalı'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#cdbfb0]/60">
                <span className="text-[#62574d]">Başlangıç Bütçesi</span>
                <span className="font-black text-amber-400 font-ibm">
                  €{((room.rules.draftBudget || 250_000_000) / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#62574d]">Maç Motoru</span>
                <span className="font-black text-[#376e67]">2D Canlı Taktik Radarı</span>
              </div>
            </div>

            {/* LAUNCH CENTER */}
            <div className="pt-3 border-t border-[#cdbfb0]">
              {isHost ? (
                <div className="space-y-3">
                  <button
                    onClick={handleStartDraft}
                    disabled={!canStartDraft || isStartingDraft}
                    className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-2xl ${
                      canStartDraft && !isStartingDraft
                        ? 'bg-[#a3262c] hover:bg-[#7c1a22] text-white shadow-[0_0_25px_rgba(183, 255, 53,0.35)] cursor-pointer active:scale-98'
                        : 'bg-[#e9dfd3] text-[#776b60] cursor-not-allowed border border-[#cdbfb0]'
                    }`}
                  >
                    {isStartingDraft ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#050806]/30 border-t-[#050806] rounded-full animate-spin" />
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
                    <div className="p-3 bg-[#ebe1d5] border border-[#cdbfb0] rounded-xl text-[11px] text-[#62574d] space-y-1.5">
                      <div className="font-bold text-[#956b25]">Başlatma Koşulları:</div>
                      <div className="flex items-center gap-1.5">
                        <span className={activeManagers.length >= 2 ? 'text-[#97252c]' : 'text-[#776b60]'}>
                          {activeManagers.length >= 2 ? '✓' : '✗'}
                        </span>
                        <span>En az 2 takım katılmış olmalıdır. ({activeManagers.length}/2)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={allHumansReady ? 'text-[#97252c]' : 'text-[#776b60]'}>
                          {allHumansReady ? '✓' : '✗'}
                        </span>
                        <span>Tüm gerçek menajerler "HAZIR" olmalıdır.</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-[#ebe1d5] border border-[#cdbfb0] rounded-xl text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#956b25]">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>KURUCU BEKLENİYOR</span>
                  </div>
                  <p className="text-[11px] text-[#6b6055]">
                    Oda kurucusu tüm takımlar hazır olduğunda draftı başlatacaktır.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Davet ve Paylaşım Kartı */}
          <div className="sc-panel rounded-2xl border border-[#cdbfb0] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-[#24211e] uppercase italic font-barlow">
              <Share2 className="w-4 h-4 text-[#97252c]" />
              <span>ARKADAŞLARINI DAVET ET</span>
            </div>
            <p className="text-xs text-[#62574d]">
              Bu odaya katılmak isteyen arkadaşlarınıza aşağıdaki kodu veya davet linkini iletebilirsiniz:
            </p>
            <div className="p-3 bg-[#ebe1d5] border border-[#cdbfb0] rounded-xl flex items-center justify-between font-ibm">
              <span className="text-[#97252c] font-black text-sm tracking-widest">{roomCode}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="text-xs font-bold text-[#493e35] hover:text-[#24211e] px-2.5 py-1.5 rounded-lg bg-[#e9dfd3] border border-[#cdbfb0] hover:border-[#17e5c2] transition"
                  title="Oda Bağlantısını Kopyala"
                >
                  {copiedLink ? 'Link Kopyalandı!' : 'Linki Kopyala'}
                </button>
                <button
                  onClick={handleCopyCode}
                  className="text-xs font-bold text-[#050806] px-3 py-1.5 rounded-lg bg-[#a3262c] hover:bg-[#7c1a22] transition shadow-md"
                >
                  {copied ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 4. SQUADCRAFT BROADCAST TICKER FOOTER                                */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-[#cdbfb0] bg-[#ebe1d5] py-2 px-4 sm:px-8 text-xs text-[#62574d]">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-ibm text-[10px] text-[#62574d] tracking-wider">
              ODA KODU: <span className="text-[#97252c] font-bold">{roomCode}</span> • SQUADCRAFT DRAFT ENGINE • VERCEL PRODUCTION
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-ibm text-[#62574d]">
            <span className="px-1.5 py-0.5 rounded bg-[#e9dfd3] border border-[#cdbfb0] text-[#3e362f]">D</span> DRAFT
            <span className="text-[#776b60]">•</span>
            <span className="px-1.5 py-0.5 rounded bg-[#e9dfd3] border border-[#cdbfb0] text-[#3e362f]">K</span> KARİYER
            <span className="text-[#776b60]">•</span>
            <span className="px-1.5 py-0.5 rounded bg-[#e9dfd3] border border-[#cdbfb0] text-[#3e362f]">S</span> AYARLAR
          </div>
        </div>
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
