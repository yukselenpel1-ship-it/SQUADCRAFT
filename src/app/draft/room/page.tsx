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
} from 'lucide-react';

const PRESET_CONFIGS = {
  4: {
    label: '4 Menajer',
    badge: '4 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 4 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 4 KİŞİLİK ALFA',
    summaryManagers: '4 Menajer (İnsan/Bot)',
    format: '6 Hafta (Çift Devre)',
    tickerText: '4 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_4_MANAGERS,
  },
  6: {
    label: '6 Menajer',
    badge: '6 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 6 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 6 KİŞİLİK ALFA',
    summaryManagers: '6 Menajer (İnsan/Bot)',
    format: '10 Hafta (Çift Devre)',
    tickerText: '6 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_6_MANAGERS,
  },
  8: {
    label: '8 Menajer',
    badge: '8 KİŞİLİK ALFA LİGİ',
    cardDesc: 'Özel bir canlı draft odası kur, arkadaşlarına oda kodunu ilet ve 8 kişilik rekabetçi ligi başlat.',
    summaryTitle: 'LİG AYARLARI // 8 KİŞİLİK ALFA',
    summaryManagers: '8 Menajer (İnsan/Bot)',
    format: '7 Hafta (Tek Devre)',
    tickerText: '8 KİŞİLİK REKABETÇİ KAPALI ALFA LİGİ',
    preset: PRESET_8_MANAGERS,
  },
} as const;

export default function DraftRoomHubPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [managerCount, setManagerCount] = useState<4 | 6 | 8>(4);
  const currentPreset = PRESET_CONFIGS[managerCount];
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
      const selectedPreset = currentPreset.preset;

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
      {/* 1. SHARP STADIUM ARENA BACKGROUND (NO BLUR, CRISP GRAPHITE & LIGHTS) */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-transparent to-[#04060A]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/40 to-[#04060A]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT BROADCAST TOP NAVIGATION BAR                           */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-[#182338] bg-[#070D1A]/95 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B1323] hover:bg-[#182338] border border-[#182338] text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ANA MENÜ</span>
            </Link>

            <div className="h-6 w-px bg-[#182338] hidden sm:block" />

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
                <span className="text-[9px] font-mono font-bold tracking-widest text-[#00D4FF] uppercase mt-0.5">
                  LOBİ & ODA MERKEZİ
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Tactical Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-[#0B1323] p-1 rounded-2xl border border-[#182338]">
            <Link
              href="/"
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl text-zinc-400 hover:text-white hover:bg-[#070D1A] transition-all"
            >
              ANA MERKEZ
            </Link>
            <Link
              href="/career/new"
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl text-zinc-400 hover:text-[#00F5A0] hover:bg-[#070D1A] transition-all"
            >
              KARİYER MODU
            </Link>
            <Link
              href="/draft"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-[#00D4FF] text-[#040711] shadow-[0_0_15px_rgba(0,212,255,0.3)]"
            >
              DRAFT LEAGUE
            </Link>
            <Link
              href="/settings"
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl text-zinc-400 hover:text-white hover:bg-[#070D1A] transition-all"
            >
              AYARLAR
            </Link>
          </nav>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#0B1323] rounded-xl border border-[#182338] text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              <span>SUNUCU: ÇEVRİMİÇİ</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#4FE4FF]">14ms TR</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1323] hover:bg-[#182338] border border-[#182338] text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C7FF38]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1323] hover:bg-[#182338] border border-[#182338] text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. HERO SECTION & TOURNAMENT OVERVIEW                                */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1520px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 my-auto flex flex-col items-center">
        {/* Header HUD Badges & Title */}
        <div className="w-full flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-[#00D4FF] text-[#040711] text-[10px] font-black uppercase tracking-widest rounded-lg">
              LIVE MULTIPLAYER
            </span>
            <span className="px-2.5 py-0.5 bg-[#0B1323] text-zinc-300 border border-[#182338] text-[10px] font-mono font-bold uppercase tracking-wider rounded-lg">
              {APP_VERSION}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-950/80 text-[#00F5A0] border border-emerald-800/80 text-[10px] font-black uppercase tracking-wider rounded-lg">
              {currentPreset.badge}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tight uppercase text-white mt-1">
            DRAFT LEAGUE{' '}
            <span className="text-[#00D4FF]">
              LOBİ MERKEZİ
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400 mt-2 max-w-2xl">
            Sıfırdan Canlı Kadro Kur // Özel Oda Oluştur veya Mevcut Lige Dahil Ol
          </p>
        </div>

        {/* ==================================================================== */}
        {/* 4. PRIMARY SQUADCRAFT MODE CARDS (2-COLUMN GRID)                     */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 max-w-5xl">
          {/* ------------------------------------------------------------------ */}
          {/* CARD 1: YENİ LİG OLUŞTUR (HOST)                                    */}
          {/* ------------------------------------------------------------------ */}
          <div className="relative overflow-hidden sc-panel rounded-2xl border-2 border-[#00D4FF]/60 flex flex-col justify-between p-6 sm:p-7 shadow-[0_0_30px_rgba(0,212,255,0.15)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent" />

            {/* Top Badge & Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#00D4FF] text-[#040711] font-black text-[10px] uppercase tracking-wider rounded-lg">
                    HOST // ODA KURUCUSU
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px] font-bold">
                    MODE // 02-A
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/40 text-[#00D4FF] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white mb-1.5 font-display">
                YENİ LİG OLUŞTUR
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mb-5">
                {currentPreset.cardDesc}
              </p>

              <form onSubmit={handleCreateRoom} className="space-y-4">
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
                    className="w-full bg-[#070D1A] border border-[#182338] rounded-xl focus:border-[#00D4FF] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
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
                    placeholder="Örn: Alveria Premier Ligi"
                    maxLength={30}
                    disabled={isCreating}
                    className="w-full bg-[#070D1A] border border-[#182338] rounded-xl focus:border-[#00D4FF] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
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
                        className={`py-2 px-3 text-xs font-black uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          managerCount === count
                            ? 'bg-[#00D4FF] text-[#040711] border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.3)] font-black'
                            : 'bg-[#070D1A] text-zinc-400 border-[#182338] hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{PRESET_CONFIGS[count].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Specs Box */}
                <div className="p-4 bg-[#070D1A] rounded-xl border border-[#182338] space-y-2">
                  <div className="text-[11px] font-mono font-bold text-[#00D4FF] uppercase flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
                    <span>{currentPreset.summaryTitle}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00D4FF]">👥</span> {currentPreset.summaryManagers}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">⚡</span> 18 Oyuncu Kadro
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#4FE4FF]">⏱️</span> 60sn Snake Draft
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#00D4FF]">🏆</span> {currentPreset.format}
                    </div>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/90 border border-red-600 rounded-xl text-red-200 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 rounded-xl bg-[#00D4FF] hover:bg-[#00B8E6] text-[#040711] font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#040711] border-t-transparent rounded-full animate-spin" />
                      <span>{createProgressText || 'ODA KURULUYOR...'}</span>
                    </div>
                  ) : (
                    <>
                      <span>ODAYI KUR VE LOBİYE GİR</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* CARD 2: MEVCUT ODAYA KATIL (GUEST)                                  */}
          {/* ------------------------------------------------------------------ */}
          <div className="relative overflow-hidden sc-panel rounded-2xl border-2 border-[#00F5A0]/60 flex flex-col justify-between p-6 sm:p-7 shadow-[0_0_30px_rgba(0,245,160,0.15)]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00F5A0] to-transparent" />

            {/* Top Badge & Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-[#00F5A0] text-[#040711] font-black text-[10px] uppercase tracking-wider rounded-lg">
                    GUEST // KATILIMCI
                  </span>
                  <span className="text-zinc-400 font-mono text-[11px] font-bold">
                    MODE // 02-B
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-[#00F5A0]/10 border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-white mb-1.5 font-display">
                KODLA ODAYA KATIL
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium mb-5">
                Arkadaşınızın paylaştığı 7 haneli oda kodunu girerek canlı draft odasına dahil olun.
              </p>

              <form onSubmit={handleJoinRoom} className="space-y-4">
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
                    className="w-full bg-[#070D1A] border border-[#182338] rounded-xl focus:border-[#00F5A0] px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none transition-colors disabled:opacity-50"
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
                    className="w-full bg-[#070D1A] border border-[#182338] rounded-xl focus:border-[#00F5A0] px-3.5 py-2.5 text-base text-white font-mono uppercase tracking-widest focus:outline-none transition-colors disabled:opacity-50"
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
                    className="w-4 h-4 rounded text-[#00F5A0] bg-[#070D1A] border-[#182338] focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="spectator"
                    className="text-xs font-semibold text-zinc-300 select-none cursor-pointer uppercase tracking-wide"
                  >
                    İzleyici (Seyirci) Modunda Katıl
                  </label>
                </div>

                {joinError && (
                  <div className="p-3 bg-red-950/90 border border-red-600 rounded-xl text-red-200 text-xs font-mono flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{joinError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3.5 rounded-xl bg-[#00F5A0] hover:bg-[#00D68B] text-[#040711] font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(0,245,160,0.3)] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isJoining ? (
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-[#040711] border-t-transparent rounded-full animate-spin" />
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
              <div className="mt-5 pt-4 border-t border-[#182338]">
                <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  SON KATILDIĞINIZ ODALAR
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleJoinRecent(code)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#070D1A] hover:bg-[#182338] border border-[#182338] hover:border-[#00F5A0] text-xs font-mono font-bold text-[#00F5A0] transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 5. SQUADCRAFT BROADCAST TICKER & CONTROLLER PROMPT FOOTER             */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-[#182338] bg-[#070D1A] text-xs">
        {/* Broadcast Live News Ticker Strip */}
        <div className="w-full bg-[#040711] border-b border-[#182338] px-4 py-1.5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-[#182338] text-[10px] font-black uppercase text-[#00D4FF]">
            <Radio className="w-3 h-3 text-[#00D4FF] animate-pulse" />
            <span>CANLI LOBİ</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-[11px] font-mono text-zinc-400 pl-4">
            <span className="text-zinc-200 font-bold">// DRAFT ODASI SUNUCUSU AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>{currentPreset.tickerText}</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00F5A0]">18 TURLUK CANLI SNAKE DRAFT MOTORU</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>GERÇEK ZAMANLI SUPABASE SENKRONİZASYONU</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00D4FF]">{APP_VERSION}</span>
          </div>
        </div>

        {/* Shortcuts & Status HUD */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#0B1323] border border-[#182338] rounded text-white font-bold">↵ ENTER</kbd>
              <span>ODAYA GİR / OLUŞTUR</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#0B1323] border border-[#182338] rounded text-white font-bold">ESC</kbd>
              <span>ANA MENÜ</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-bold">SQUADCRAFT DRAFT ENGINE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[#00F5A0] font-bold">{APP_VERSION}</span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SİSTEM HAZIR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        route="/draft/room"
        gamePhase="Draft Lobisi"
      />
    </div>
  );
}
