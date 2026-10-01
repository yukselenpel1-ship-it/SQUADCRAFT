'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { loadCareerState, loadCareerMetadata } from '@/lib/career';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { getRecentRoomCodes } from '@/lib/draft/multiplayerStore';
import { APP_VERSION } from '@/lib/version';
import {
  Gamepad2,
  MessageSquare,
  Trophy,
  Zap,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Shield,
  Activity,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { ClubBadge } from '@/components/ui/ClubBadge';

export default function MainMenuPage() {
  const router = useRouter();
  const {
    loadExistingCareer,
    isCareerHydrated,
    hasCareerSave,
    savedCareerPreview,
    resetEntireCareer,
  } = useGame();

  const [savedData, setSavedData] = useState<{ userClub: any; seasonYear: number | string; currentDate?: string } | null>(null);
  const [isNewCareerConfirmOpen, setIsNewCareerConfirmOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [recentRooms, setRecentRooms] = useState<string[]>([]);

  // Load existing career save state canonical hydration check
  useEffect(() => {
    setRecentRooms(getRecentRoomCodes().slice(0, 2));

    // 1. Instant check from lightweight metadata
    const meta = loadCareerMetadata();
    if (meta && meta.exists) {
      setSavedData({
        userClub: { id: meta.userClubId, name: meta.clubName },
        seasonYear: meta.seasonYear,
        currentDate: meta.currentDate,
      });
    }

    // 2. Full hydration check from GameContext / IndexedDB
    if (isCareerHydrated) {
      if (hasCareerSave && savedCareerPreview) {
        setSavedData(savedCareerPreview);
      } else if (!meta) {
        try {
          const direct = loadCareerState();
          if (direct && direct.clubs && direct.userClubId) {
            const userClub = direct.clubs.find((c: any) => c.id === direct.userClubId) || direct.clubs[0];
            setSavedData({
              userClub,
              seasonYear: direct.seasonYear || '2026/27',
              currentDate: direct.currentDate,
            });
          } else {
            setSavedData(null);
          }
        } catch {
          setSavedData(null);
        }
      }
    }
  }, [isCareerHydrated, hasCareerSave, savedCareerPreview]);

  const handleContinueCareer = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const success = await loadExistingCareer();
      if (success) {
        router.push('/dashboard');
      } else {
        router.push('/career/new');
      }
    },
    [loadExistingCareer, router]
  );

  const handleNewCareerRequest = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (savedData) {
        setIsNewCareerConfirmOpen(true);
      } else {
        router.push('/career/new');
      }
    },
    [savedData, router]
  );

  // Desktop only keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFeedbackOpen || isNewCareerConfirmOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        router.push('/draft');
      } else if (e.key === 'k' || e.key === 'K') {
        handleNewCareerRequest();
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'F1') {
        e.preventDefault();
        setIsFeedbackOpen(true);
      } else if ((e.key === 'c' || e.key === 'C') && savedData) {
        handleContinueCareer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedbackOpen, isNewCareerConfirmOpen, savedData, router, handleContinueCareer, handleNewCareerRequest]);

  return (
    <div className="relative min-h-screen w-full bg-[#050B10] text-[#F3F7F8] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* Stadium Arena Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#050B10]/90 via-[#050B10]/75 to-[#050B10]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#050B10]/40 to-[#050B10]/90" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 w-full border-b border-[rgba(125,160,175,0.14)] bg-[#070D14]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative h-8 w-11 flex items-center justify-center">
                <Image
                  src="/images/sc-emblem-official-hd.png"
                  alt="SquadCraft SC"
                  width={46}
                  height={32}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 font-black uppercase italic tracking-tighter text-lg leading-none">
                  <span className="text-white">SQUADCRAFT</span>
                  <span className="text-[#65F56B]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  PRO SIMULATION
                </span>
              </div>
            </Link>
          </div>

          {/* Right Status & Feedback */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#09141B] border border-[rgba(125,160,175,0.18)] text-[11px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#65F56B] shadow-[0_0_8px_#65F56B]" />
              <span>SUNUCU: ÇEVRİMİÇİ</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#30D8CE]">14ms TR</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#09141B] hover:bg-[#0E1E28] border border-[rgba(125,160,175,0.2)] text-zinc-200 hover:text-white text-xs font-bold transition active:scale-95"
              title="Geri Bildirim Gönder"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#65F56B]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Hero & Cards */}
      <main className="relative z-20 max-w-[1500px] w-full mx-auto px-4 sm:px-8 py-6 my-auto flex flex-col items-center">
        {/* Center Brand Title */}
        <div className="w-full flex flex-col items-center text-center mb-6 sm:mb-8">
          <div className="relative w-40 h-24 sm:w-48 sm:h-28 flex items-center justify-center my-1">
            <Image
              src="/images/squadcraft-logo-official-hd.png"
              alt="SquadCraft Official Logo"
              width={190}
              height={136}
              className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tight uppercase text-white mt-1">
            KADRO KUR. TAKTİK YAP.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#65F56B] to-[#7BFF70]">
              KULÜBÜNÜ ZİRVEYE TAŞI.
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400 mt-2 max-w-xl">
            Alveria Futbol Evreninde Kendi Menajerlik Efsaneni Yaz // Gerçek Zamanlı Çok Oyunculu Rekabet
          </p>
        </div>

        {/* 2 Primary Mode Cards: CAREER & DRAFT */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* CARD 1: CAREER MODE */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#09151F] via-[#071018] to-[#050C12] border border-[rgba(125,160,175,0.22)] flex flex-col justify-between p-6 sm:p-8 shadow-2xl group transition-all hover:border-[#65F56B]/40">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-[#65F56B]/10 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#65F56B]/15 text-[#65F56B] border border-[#65F56B]/30 font-black text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" />
                  TEK OYUNCULU
                </span>
                <span className="text-[11px] font-mono text-zinc-500 font-bold">MODE // 01</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase text-white tracking-tight group-hover:text-[#65F56B] transition-colors">
                  KARİYER MODU
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Bir kulüp devral, transfer masasına otur, taktiğini belirle, fikstürde ilerle ve lig şampiyonluğuna yürü!
                </p>
              </div>

              {/* Saved Career Badge if save exists */}
              {savedData ? (
                <div className="p-3.5 rounded-xl bg-[#0B1822] border border-[#65F56B]/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#070F16] border border-zinc-800 flex items-center justify-center shrink-0">
                      <ClubBadge
                        code={savedData.userClub?.code || 'KDO'}
                        primaryColor={savedData.userClub?.primaryColor || '#65F56B'}
                        secondaryColor={savedData.userClub?.secondaryColor || '#09141B'}
                        size="sm"
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black uppercase text-white truncate">
                        {savedData.userClub?.name || 'Kayıtlı Kulüp'}
                      </div>
                      <div className="text-[10px] font-mono text-[#65F56B] truncate">
                        Sezon {savedData.seasonYear} {savedData.currentDate ? `• ${savedData.currentDate}` : ''}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#65F56B]/15 text-[#65F56B] border border-[#65F56B]/30 shrink-0">
                    KAYIT MEVCUT
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 text-[11px] font-mono text-zinc-300">
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    🏆 10 Takımlı Lig
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    💰 Dinamik Transfer Masası
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    📊 2D Canlı Taktiksel Radar
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="relative z-10 pt-6 mt-6 border-t border-[rgba(125,160,175,0.14)] flex flex-wrap items-center gap-3">
              {savedData ? (
                <>
                  <button
                    onClick={handleContinueCareer}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(101,245,107,0.3)] active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>KARİYERE DEVAM ET</span>
                  </button>

                  <button
                    onClick={handleNewCareerRequest}
                    className="px-4 py-3 rounded-xl bg-[#09141B] hover:bg-[#0E1E28] text-zinc-300 hover:text-white border border-[rgba(125,160,175,0.2)] text-xs font-bold uppercase tracking-wider transition active:scale-95"
                    title="Yeni Kariyer"
                  >
                    YENİ KARİYER
                  </button>
                </>
              ) : (
                <button
                  onClick={handleNewCareerRequest}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(101,245,107,0.3)] active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>YENİ KARİYER BAŞLAT</span>
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: DRAFT LEAGUE */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#09151F] via-[#071018] to-[#050C12] border border-[rgba(125,160,175,0.22)] flex flex-col justify-between p-6 sm:p-8 shadow-2xl group transition-all hover:border-[#30D8CE]/40">
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl bg-[#30D8CE]/10 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md bg-[#30D8CE]/15 text-[#30D8CE] border border-[#30D8CE]/30 font-black text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  ÇOK OYUNCULU
                </span>
                <span className="text-[11px] font-mono text-zinc-500 font-bold">MODE // 02</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase text-white tracking-tight group-hover:text-[#30D8CE] transition-colors">
                  DRAFT LEAGUE
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Arkadaşlarınla veya botlarla sıfırdan canlı draft ile kadro kur. 18 kişilik kadronu oluştur, lig fikstüründe şampiyonluk için kapış!
                </p>
              </div>

              {recentRooms.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-[#0B1822] border border-[#30D8CE]/30 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="text-[10px] font-mono text-zinc-400 block uppercase">Son Katılınan Oda</span>
                    <span className="text-sm font-black font-mono text-[#30D8CE]">
                      {recentRooms[0]}
                    </span>
                  </div>

                  <Link
                    href={`/draft/room/${recentRooms[0]}`}
                    className="px-3 py-1.5 rounded-lg bg-[#30D8CE]/20 hover:bg-[#30D8CE]/30 text-[#30D8CE] border border-[#30D8CE]/40 text-xs font-bold transition font-mono"
                  >
                    ODAYA GİR →
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 text-[11px] font-mono text-zinc-300">
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    👥 2–8 Menajer
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    ⚡ Snake Draft & Bütçe
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#0B1822] border border-[rgba(125,160,175,0.14)]">
                    🟢 Canlı Senkron Lig
                  </span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="relative z-10 pt-6 mt-6 border-t border-[rgba(125,160,175,0.14)] flex items-center justify-between gap-3">
              <Link
                href="/draft"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#30D8CE] to-[#40E8DE] hover:brightness-110 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-[0_0_20px_rgba(48,216,206,0.3)] active:scale-95"
              >
                <span>DRAFT LİGİNE GİR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Only show keyboard shortcut tags on desktop */}
      <footer className="relative z-20 w-full border-t border-[rgba(125,160,175,0.14)] bg-[#070D14]/90 px-4 sm:px-8 py-3 text-xs text-zinc-400 font-mono">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">SQUADCRAFT {APP_VERSION}</span>
            <span>•</span>
            <span>CLOSED ALPHA</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[11px] text-zinc-500">
            {savedData && (
              <span><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">C</kbd> DEVAM ET</span>
            )}
            <span><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">K</kbd> YENİ KARİYER</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">D</kbd> DRAFT LEAGUE</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">M</kbd> GERİ BİLDİRİM</span>
          </div>
        </div>
      </footer>

      {/* New Career Confirmation Modal */}
      {isNewCareerConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#09141B] border border-rose-600/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black uppercase text-white font-sans">
                Kayıtlı Kariyer Üzerine Yazılacak
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Mevcut kariyeriniz silinecektir. Yeni bir kariyer başlatmak istediğinizden emin misiniz?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsNewCareerConfirmOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  resetEntireCareer();
                  setIsNewCareerConfirmOpen(false);
                  router.push('/career/new');
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition shadow-lg shadow-rose-900/40"
              >
                Yeni Kariyer Başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        route="/"
      />
    </div>
  );
}
