'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DraftMultiplayerStore, getRecentRoomCodes } from '@/lib/draft/multiplayerStore';
import {
  getMultiplayerSessionId,
  getStoredMultiplayerUsername,
  setStoredMultiplayerUsername,
} from '@/lib/draft/sessionManager';
import { PRESET_4_MANAGERS, PRESET_6_MANAGERS, PRESET_8_MANAGERS } from '@/lib/draft/types';
import { APP_VERSION } from '@/lib/version';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
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
  Gamepad2,
  Play,
  Share2,
  Flame,
  Swords,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export default function DraftRoomHubPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [managerCount, setManagerCount] = useState<4 | 6 | 8>(6);
  const [isSpectator, setIsSpectator] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createProgressText, setCreateProgressText] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const createInFlightRef = useRef(false);

  useEffect(() => {
    setUsername(getStoredMultiplayerUsername());
    setRecentRooms(getRecentRoomCodes());
    DraftMultiplayerStore.warmupConnection();
    return () => {
      createInFlightRef.current = false;
    };
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createInFlightRef.current || isCreating) return;

    if (!username.trim()) {
      setCreateError('Lütfen bir menajer ismi girin.');
      return;
    }

    createInFlightRef.current = true;
    setCreateError(null);
    setCreateProgressText(null);
    setIsCreating(true);

    try {
      setStoredMultiplayerUsername(username.trim());
      const sessionId = getMultiplayerSessionId();
      const selectedPreset =
        managerCount === 8
          ? PRESET_8_MANAGERS
          : managerCount === 6
          ? PRESET_6_MANAGERS
          : PRESET_4_MANAGERS;

      const res = await DraftMultiplayerStore.createRoomAsync(
        username.trim(),
        sessionId,
        selectedPreset,
        roomName.trim() || undefined,
        (_attempt, _max, statusText) => {
          setCreateProgressText(statusText);
        }
      );

      if (!res.success || !res.state) {
        setCreateError(
          `[${res.errorCode || 'SC-MP-011'}] ${res.error || 'Oda oluşturulamadı.'}${
            res.details ? ` (${res.details})` : ''
          }`
        );
        createInFlightRef.current = false;
        setIsCreating(false);
        setCreateProgressText(null);
        return;
      }

      setCreateProgressText('Odaya yönlendiriliyor...');
      router.push(`/draft/room/${res.state.room.roomCode}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      setCreateError(`[SC-MP-011] Oda oluşturulurken beklenmeyen bir hata oluştu: ${err?.message || ''}`);
      createInFlightRef.current = false;
      setIsCreating(false);
      setCreateProgressText(null);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setJoinError('Lütfen bir menajer ismi girin.');
      return;
    }
    if (!joinCode.trim()) {
      setJoinError('Lütfen oda kodunu girin.');
      return;
    }

    setJoinError(null);
    setIsJoining(true);

    try {
      setStoredMultiplayerUsername(username.trim());
      const sessionId = getMultiplayerSessionId();
      const cleanCode = joinCode.trim().toUpperCase();

      const res = await DraftMultiplayerStore.joinRoomAsync(
        cleanCode,
        username.trim(),
        sessionId,
        isSpectator
      );

      if (!res.success) {
        setJoinError(`[${res.errorCode || 'SC-MP-001'}] ${res.error || 'Odaya katılınamadı.'}`);
        setIsJoining(false);
        return;
      }

      router.push(`/draft/room/${cleanCode}`);
    } catch (err: any) {
      console.error('Join room error:', err);
      setJoinError(`[SC-MP-001] Odaya bağlanırken bir hata oluştu: ${err?.message || ''}`);
      setIsJoining(false);
    }
  };

  const handleJoinRecent = (code: string) => {
    setJoinCode(code);
    router.push(`/draft/room/${code}`);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#070A0F] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. HIGH-CONTRAST STADIUM ARENA BACKGROUND                            */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A0F]/85 via-[#070A0F]/90 to-[#070A0F]" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#070A0F]/50 to-[#070A0F]" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT BROADCAST TOP NAVIGATION BAR                           */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070D14]/95 backdrop-blur-md px-4 sm:px-8 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ANA MENÜ</span>
            </Link>

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
                  <span className="text-[#C7FF38]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#4FE4FF] uppercase mt-0.5">
                  ROOM LOBBY HUB
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Tactical Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
            >
              [ ANA MERKEZ ]
            </Link>
            <Link
              href="/career/new"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#C7FF38] hover:text-[#C7FF38] transition-all"
            >
              [ KARİYER MODU ]
            </Link>
            <Link
              href="/draft"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#4FE4FF] hover:text-[#4FE4FF] transition-all"
            >
              [ DRAFT MERKEZİ ]
            </Link>
            <button
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-[#4FE4FF] text-black border border-[#4FE4FF]"
            >
              [ LOBİ MERKEZİ ]
            </button>
          </nav>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#C7FF38]" />
              <span>SUNUCU: AKTİF</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#4FE4FF]">14ms TR</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C7FF38]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. HERO SECTION & ROOM GATEWAY                                       */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1520px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 my-auto flex flex-col items-center">
        {/* Header HUD Badges & Title */}
        <div className="w-full flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-[#4FE4FF] text-black text-[10px] font-black uppercase tracking-widest">
              LOBİ & ODA MERKEZİ
            </span>
            <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              {APP_VERSION}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-950 text-[#C7FF38] border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
              CANLI DRAFT ODASI
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tight uppercase text-white mt-1 font-display">
            LOBİYE KATIL VEYA{' '}
            <span className="text-[#C7FF38] drop-shadow-[0_0_25px_rgba(0,245,160,0.4)]">
              ÖZEL ODA KUR
            </span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400 mt-2 max-w-2xl">
            Sıfırdan Canlı Kadro Kur // Özel Oda Oluştur veya Mevcut Lige Dahil Ol
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl">
          {/* CARD 1: CREATE NEW ROOM (HOST) */}
          <div className="relative overflow-hidden bg-[#07111A] border-2 border-[#4FE4FF] flex flex-col justify-between p-6 sm:p-7 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#4FE4FF] text-black font-black text-[10px] uppercase tracking-wider">
                    HOST // ODA KURUCUSU
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px] font-bold">
                    MODE // 02-A
                  </span>
                </div>
                <div className="w-8 h-8 bg-[#021A26] border border-[#4FE4FF]/40 text-[#4FE4FF] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white font-display">
                YENİ LİG OLUŞTUR
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve çok oyunculu ligi başlat.
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Menajer İsminiz <span className="text-[#4FE4FF]">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Örn: Menajer Doruk"
                    maxLength={20}
                    required
                    disabled={isCreating}
                    className="w-full bg-[#05090F] border border-zinc-700 focus:border-[#4FE4FF] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Lig / Oda Adı <span className="text-zinc-500">(İsteğe Bağlı)</span>
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Örn: Şampiyonlar Arenası Draftı"
                    maxLength={30}
                    disabled={isCreating}
                    className="w-full bg-[#05090F] border border-zinc-700 focus:border-[#4FE4FF] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Menajer Sayısı (Takım Kotası)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([4, 6, 8] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setManagerCount(count)}
                        className={`py-2 px-3 text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 ${
                          managerCount === count
                            ? 'bg-[#4FE4FF] text-black border-[#4FE4FF] shadow-md shadow-[#4FE4FF]/20 font-black'
                            : 'bg-[#05090F] text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{count} Menajer</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Specs Box */}
                <div className="p-3 bg-[#040A10] border border-zinc-800 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-[#4FE4FF] uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#4FE4FF]" />
                    <span>LİG AYARLARI // {managerCount} KİŞİLİK ALFA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">👥</span> {managerCount} Menajer (İnsan/Bot)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">⚡</span> 18 Oyuncu Kadro
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">⏱️</span> 60sn Snake Draft
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">🏆</span> {managerCount === 8 ? '7 Hafta (Tek Devre)' : managerCount === 6 ? '10 Hafta (Çift Devre)' : '6 Hafta (Çift Devre)'}
                    </div>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/90 border border-red-600 text-red-200 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 bg-[#4FE4FF] hover:bg-[#00B8E6] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>{createProgressText || 'ODA KURULUYOR...'}</span>
                    </div>
                  ) : (
                    <>
                      <span>ÖZEL ODA OLUŞTUR & LOBİYE GİR</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* CARD 2: JOIN EXISTING ROOM (GUEST) */}
          <div className="relative overflow-hidden bg-[#06140D] border-2 border-[#C7FF38] flex flex-col justify-between p-6 sm:p-7 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#C7FF38] text-black font-black text-[10px] uppercase tracking-wider">
                    GUEST // KATILIMCI
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px] font-bold">
                    MODE // 02-B
                  </span>
                </div>
                <div className="w-8 h-8 bg-[#032416] border border-[#C7FF38]/40 text-[#C7FF38] flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white font-display">
                KODLA ODAYA KATIL
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                Arkadaşınızın paylaştığı 7 haneli oda kodunu girerek canlı draft odasına dahil olun.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Menajer İsminiz <span className="text-[#C7FF38]">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Örn: Menajer Kaan"
                    maxLength={20}
                    required
                    disabled={isJoining}
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#C7FF38] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Oda Kodu <span className="text-[#C7FF38]">*</span>
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Örn: SC-WA2P"
                    maxLength={10}
                    required
                    disabled={isJoining}
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#C7FF38] px-3.5 py-2.5 text-base text-white font-mono uppercase tracking-widest focus:outline-none transition-colors disabled:opacity-50"
                  />
                </div>

                {/* Spectator Option */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="spectator"
                    checked={isSpectator}
                    onChange={(e) => setIsSpectator(e.target.checked)}
                    disabled={isJoining}
                    className="w-4 h-4 rounded-none text-[#C7FF38] bg-[#040C08] border-zinc-700 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="spectator"
                    className="text-xs font-semibold text-zinc-300 select-none cursor-pointer uppercase tracking-wide"
                  >
                    İzleyici (Seyirci) Modunda Katıl
                  </label>
                </div>

                {joinError && (
                  <div className="p-3 bg-red-950/90 border border-red-600 text-red-200 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3.5 bg-[#C7FF38] hover:bg-[#D9FF73] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>ODAYA BAĞLANILIYOR...</span>
                    </div>
                  ) : (
                    <>
                      <span>ODAYA GİRİŞ YAP</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Rooms Strip */}
            {recentRooms.length > 0 && (
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  SON KATILDIĞINIZ ODALAR
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleJoinRecent(code)}
                      className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#C7FF38] text-xs font-mono font-bold text-[#C7FF38] transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
          <div className="p-4 bg-[#070D14]/90 border border-zinc-800 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[#C7FF38] shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic font-display">
                Snake Sıralı Draft
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                18 turlu adil yılan draft sistemiyle gerçek zamanlı transfer kapmaca
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#070D14]/90 border border-zinc-800 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[#4FE4FF] shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic font-display">
                2D Canlı Radar Simülatörü
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Taktik dizilişler, kondisyon barları ve gerçek zamanlı maç motoru
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#070D14]/90 border border-zinc-800 flex items-center gap-3 shadow-xl">
            <div className="w-9 h-9 bg-zinc-950 border border-zinc-700 flex items-center justify-center text-[#FFB800] shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic font-display">
                Otomatik Lig Fikstürü
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Draft bitiminde anında oluşan puan durumu, fikstür ve istatistikler
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 4. SQUADCRAFT BROADCAST FOOTER & TICKER                              */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-zinc-800 bg-[#070A0F] py-2 px-4 sm:px-8 text-xs text-zinc-400">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-zinc-400 tracking-wider">
              SQUADCRAFT MULTIPLAYER ENGINE • VERCEL & CLOUDFLARE PRODUCTION
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200">D</span> DRAFT
            <span className="text-zinc-600">•</span>
            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200">K</span> KARİYER
            <span className="text-zinc-600">•</span>
            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-200">S</span> AYARLAR
          </div>
        </div>
      </footer>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        roomId="LOBBY_HUB"
        route="/draft/room"
        gamePhase="Lobby Hub"
      />
    </div>
  );
}
