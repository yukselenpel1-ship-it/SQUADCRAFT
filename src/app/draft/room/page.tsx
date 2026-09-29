'use client';

import React, { useState, useEffect } from 'react';
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
  Flame,
  Swords,
  Sparkles,
  Gamepad2,
  Crown,
  Play,
  Share2,
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
      {/* Stadium Arena Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/stadium-draft-bg.webp')`,
          filter: 'brightness(0.28) contrast(1.15) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-t from-[#04060A] via-[#04060A]/85 to-transparent" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))]" />

      {/* TOP BROADCAST NAVIGATION BAR */}
      <header className="relative z-20 w-full border-b border-white/[0.08] bg-[#070B14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/draft"
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-bold transition duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>DRAFT MERKEZİ</span>
            </Link>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-900/40 border border-emerald-500/40 shadow-lg shadow-emerald-950/40">
                <Swords className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black tracking-wider text-white uppercase font-display">
                    SQUADCRAFT
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    LOBİ MERKEZİ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Canlı Çok Oyunculu Draft Odaları & Maç Öncesi Lobisi
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Geri Bildirim</span>
            </button>

            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>CANLI RADAR AKTİF</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col justify-center">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>EA SPORTS FC & CHAMPIONS LEAGUE KALİTESİNDE DRAFT</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase font-display leading-tight">
            Lobiye Katıl veya{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Özel Oda Kur
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-normal leading-relaxed">
            Arkadaşlarınızla ve akıllı yapay zeka botlarla kıyasıya bir futbol mücadelesine girin.
            Kadro seçimlerini yapın, 2D taktik radarıyla şampiyonluğu göğüsleyin.
          </p>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-5xl mx-auto w-full">
          {/* CARD 1: JOIN EXISTING ROOM */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-white/15 via-white/5 to-white/0 shadow-2xl transition duration-300">
            <div className="relative rounded-3xl bg-[#0B0F19]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 border border-white/[0.06]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-wide text-white uppercase">
                      Odaya Katıl
                    </h2>
                    <p className="text-xs text-slate-400">
                      Var olan bir lig lobisine 4-7 haneli kodla bağlanın
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 uppercase tracking-widest">
                  HIZLI GİRİŞ
                </span>
              </div>

              {joinError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{joinError}</span>
                </div>
              )}

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                      className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-emerald-400 font-mono text-base font-black tracking-widest uppercase placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                      4-7 HANE
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="spectatorCheck"
                    checked={isSpectator}
                    onChange={(e) => setIsSpectator(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                  />
                  <label
                    htmlFor="spectatorCheck"
                    className="text-xs text-slate-400 hover:text-slate-300 cursor-pointer select-none"
                  >
                    Yalnızca İzleyici (Seyirci) Modunda Bağlan
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isJoining}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/60 hover:shadow-emerald-900/80 transition duration-200 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {isJoining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>ODAYA BAĞLANILIYOR...</span>
                    </>
                  ) : (
                    <>
                      <span>ODAYA KATIL</span>
                      <ArrowRight className="w-4 h-4 text-emerald-200 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Recent Rooms Quick Reconnect */}
              {recentRooms.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08] space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Son Katıldığınız Odalar</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentRooms.map((code) => (
                      <button
                        key={code}
                        onClick={() => handleJoinRecent(code)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 hover:border-emerald-500/50 text-emerald-400 hover:text-white font-mono text-xs font-bold transition flex items-center gap-1.5 group/recent"
                      >
                        <span>{code}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover/recent:text-emerald-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: CREATE NEW ROOM */}
          <div className="relative group rounded-3xl p-[1px] bg-gradient-to-b from-amber-500/30 via-white/5 to-white/0 shadow-2xl transition duration-300">
            <div className="relative rounded-3xl bg-[#0B0F19]/90 backdrop-blur-xl p-6 sm:p-8 space-y-6 border border-white/[0.06]">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-wide text-white uppercase">
                      Özel Oda Kur
                    </h2>
                    <p className="text-xs text-slate-400">
                      Kendi liginizi oluşturun ve arkadaşlarınızı davet edin
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-950/60 border border-amber-500/30 text-amber-400 uppercase tracking-widest">
                  KURUCU MERKEZİ
                </span>
              </div>

              {createError && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
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
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Oda / Lig Başlığı (İsteğe Bağlı)
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Örn: Şampiyonlar Arenası Draftı"
                    maxLength={30}
                    disabled={isCreating}
                    className="w-full px-4 py-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                  />
                </div>

                {/* Preset Specs Showcase */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.08] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Varsayılan Format
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Kapalı Alfa (4 Takım)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[10px] text-slate-400">Kadro</div>
                      <div className="font-bold text-white">18 Futbolcu</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[10px] text-slate-400">Tur Süresi</div>
                      <div className="font-bold text-white">60 Saniye</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[10px] text-slate-400">Lig Tipi</div>
                      <div className="font-bold text-emerald-400">Çift Devre</div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/60 hover:shadow-amber-900/80 transition duration-200 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>ODA OLUŞTURULUYOR...</span>
                    </>
                  ) : (
                    <>
                      <span>ÖZEL ODA OLUŞTUR & LOBİYE GİR</span>
                      <ArrowRight className="w-4 h-4 text-slate-950 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Snake Sıralı Draft
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Adil 18 turlu yılan draft sistemiyle gerçek zamanlı oyuncu kapmaca
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                2D Canlı Radar Simülatörü
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Taktik dizilişler, kondisyon barları ve gerçek zamanlı maç motoru
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Otomatik Lig Fikstürü
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug">
                Draft bitiminde anında oluşan puan durumu, fikstür ve istatistikler
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] bg-[#070B14]/80 py-4 text-center text-xs text-slate-500">
        <p>SquadCraft Draft & Multiplayer Engine • FIFA & EA FC Standartlarında Gerçekçi Futbol Simülatörü</p>
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
