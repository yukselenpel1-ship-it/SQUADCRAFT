'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { DraftMultiplayerStore, getRecentRoomCodes } from '@/lib/draft/multiplayerStore';
import {
  getMultiplayerSessionId,
  getStoredMultiplayerUsername,
  setStoredMultiplayerUsername,
} from '@/lib/draft/sessionManager';
import { PRESET_CLOSED_ALPHA_4 } from '@/lib/draft/types';
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
  const [isSpectator, setIsSpectator] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    setUsername(getStoredMultiplayerUsername());
    setRecentRooms(getRecentRoomCodes());
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setCreateError('Lütfen bir menajer ismi girin.');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    try {
      setStoredMultiplayerUsername(username.trim());
      const sessionId = getMultiplayerSessionId();
      const res = await DraftMultiplayerStore.createRoomAsync(
        username.trim(),
        sessionId,
        PRESET_CLOSED_ALPHA_4,
        roomName.trim() || undefined
      );

      if (!res.success || !res.state) {
        setCreateError(
          `[${res.errorCode || 'SC-MP-011'}] ${res.error || 'Oda oluşturulamadı.'}${
            res.details ? ` (${res.details})` : ''
          }`
        );
        setIsCreating(false);
        return;
      }

      router.push(`/draft/room/${res.state.room.roomCode}`);
    } catch (err: any) {
      console.error('Create room error:', err);
      setCreateError(`[SC-MP-011] Oda oluşturulurken beklenmeyen bir hata oluştu: ${err?.message || ''}`);
      setIsCreating(false);
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
    <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. SHARP STADIUM ARENA BACKGROUND (CRISP GRAPHITE & LIGHTS)          */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-transparent to-[#04060A]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/40 to-[#04060A]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. EA FC BROADCAST TOP NAVIGATION BAR                                */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070A0F] px-4 sm:px-8 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/draft"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>DRAFT MERKEZİ</span>
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
                  <span className="text-[#00F5A0]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  ROOM LOBBY HUB
                </span>
              </div>
            </Link>
          </div>

          {/* Center: FIFA Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
            >
              [ ANA MERKEZ ]
            </Link>
            <Link
              href="/career/new"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#00F5A0] hover:text-[#00F5A0] transition-all"
            >
              [ KARİYER MODU ]
            </Link>
            <Link
              href="/draft"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all"
            >
              [ DRAFT MERKEZİ ]
            </Link>
            <button
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-[#00D4FF] text-black border border-[#00D4FF]"
            >
              [ LOBİ MERKEZİ ]
            </button>
          </nav>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>SUNUCU: AKTİF</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#00D4FF]">14ms TR</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00F5A0]" />
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
      <main className="relative z-20 max-w-[1520px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 my-auto flex flex-col items-center">
        {/* Header HUD Badges & Title */}
        <div className="w-full flex flex-col items-center text-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 bg-[#00D4FF] text-black text-[10px] font-black uppercase tracking-widest">
              LOBİ & ODA MERKEZİ
            </span>
            <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-300 border border-zinc-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              {APP_VERSION}
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-950 text-[#00F5A0] border border-emerald-800 text-[10px] font-black uppercase tracking-wider">
              CANLI DRAFT ODASI
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase font-display leading-tight italic">
            LOBİYE KATIL VEYA{' '}
            <span className="text-[#00F5A0] drop-shadow-[0_0_25px_rgba(0,245,160,0.4)]">
              ÖZEL ODA KUR
            </span>
          </h1>
          <p className="text-sm md:text-base text-zinc-400 font-normal max-w-2xl mt-1.5">
            Arkadaşlarınızla ve akıllı yapay zeka botlarla kıyasıya bir futbol mücadelesine girin.
            Kadro seçimlerini yapın, 2D taktik radarıyla şampiyonluğu göğüsleyin.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl w-full">
          {/* CARD 1: JOIN EXISTING ROOM */}
          <div className="relative group bg-[#0B0F17]/95 border border-zinc-800 hover:border-zinc-700 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00F5A0]">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white uppercase italic">
                      ODAYA KATIL
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Oda kodu ile doğrudan lig lobisine bağlanın
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] uppercase">
                  HIZLI GİRİŞ
                </span>
              </div>

              {joinError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Menajer İsminiz
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Örn: Menajer Eren"
                    maxLength={20}
                    required
                    disabled={isJoining}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-semibold focus:outline-none focus:border-[#00F5A0] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Oda Kodu
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="ÖRN: SC-XXXX"
                      maxLength={10}
                      required
                      disabled={isJoining}
                      className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 text-[#00F5A0] font-mono text-base font-black tracking-widest uppercase placeholder-zinc-600 focus:outline-none focus:border-[#00F5A0] transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 font-bold">
                      4-7 HANE
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="spectatorCheck"
                    checked={isSpectator}
                    onChange={(e) => setIsSpectator(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-[#00F5A0] focus:ring-[#00F5A0]"
                  />
                  <label
                    htmlFor="spectatorCheck"
                    className="text-xs text-zinc-400 hover:text-zinc-300 cursor-pointer select-none"
                  >
                    Yalnızca İzleyici (Seyirci) Modunda Katıl
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-3.5 bg-[#00F5A0] hover:bg-[#00D485] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#00F5A0]/20 flex items-center justify-center gap-2 group/btn disabled:opacity-50 active:scale-[0.99]"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>ODAYA BAĞLANILIYOR...</span>
                    </>
                  ) : (
                    <>
                      <span>ODAYA KATIL & LOBİYE GİR</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Rooms Quick Reconnect */}
            {recentRooms.length > 0 && (
              <div className="pt-4 mt-4 border-t border-zinc-800/80 space-y-2">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Son Katıldığınız Odalar</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((code) => (
                    <button
                      key={code}
                      onClick={() => handleJoinRecent(code)}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-[#00F5A0] text-[#00F5A0] hover:text-white font-mono text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>{code}</span>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: CREATE NEW ROOM */}
          <div className="relative group bg-[#0B0F17]/95 border border-zinc-800 hover:border-zinc-700 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 shadow-2xl">
            <div className="space-y-5">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#FFB800]">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-wide text-white uppercase italic">
                      ÖZEL ODA KUR
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Kendi liginizi oluşturun ve arkadaşlarınızı davet edin
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#FFB800]/10 border border-[#FFB800]/30 text-[#FFB800] uppercase">
                  KURUCU
                </span>
              </div>

              {createError && (
                <div className="p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Menajer İsminiz
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Örn: Menajer Eren"
                    maxLength={20}
                    required
                    disabled={isCreating}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-semibold focus:outline-none focus:border-[#FFB800] transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Oda / Lig Başlığı (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Örn: Şampiyonlar Arenası Draftı"
                    maxLength={30}
                    disabled={isCreating}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 text-white placeholder-zinc-500 text-sm font-semibold focus:outline-none focus:border-[#FFB800] transition"
                  />
                </div>

                {/* Preset Specs Showcase */}
                <div className="p-3 bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#FFB800] uppercase tracking-wider text-[11px]">
                      Varsayılan Format
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Kapalı Alfa (4 Takım)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Kadro</div>
                      <div className="font-black text-white">18 Oyuncu</div>
                    </div>
                    <div className="p-2 bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Süre</div>
                      <div className="font-black text-white">60 Saniye</div>
                    </div>
                    <div className="p-2 bg-zinc-900/80 border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-400 uppercase">Lig</div>
                      <div className="font-black text-[#00F5A0]">Çift Devre</div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-3.5 bg-[#FFB800] hover:bg-[#E5A700] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#FFB800]/20 flex items-center justify-center gap-2 group/btn disabled:opacity-50 active:scale-[0.99]"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>ODA OLUŞTURULUYOR...</span>
                    </>
                  ) : (
                    <>
                      <span>ÖZEL ODA OLUŞTUR & LOBİYE GİR</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Feature Highlights Strip */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
          <div className="p-4 bg-[#0B0F17]/80 border border-zinc-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00F5A0] shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic">
                Snake Sıralı Draft
              </h4>
              <p className="text-[11px] text-zinc-400">
                18 turlu adil yılan draft sistemiyle gerçek zamanlı transfer kapmaca
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#0B0F17]/80 border border-zinc-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#00D4FF] shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic">
                2D Canlı Radar Simülatörü
              </h4>
              <p className="text-[11px] text-zinc-400">
                Taktik dizilişler, kondisyon barları ve gerçek zamanlı maç motoru
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#0B0F17]/80 border border-zinc-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-zinc-900 border border-zinc-700 flex items-center justify-center text-[#FFB800] shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white uppercase italic">
                Otomatik Lig Fikstürü
              </h4>
              <p className="text-[11px] text-zinc-400">
                Draft bitiminde anında oluşan puan durumu, fikstür ve istatistikler
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 4. EA FC BROADCAST FOOTER & TICKER                                   */}
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
