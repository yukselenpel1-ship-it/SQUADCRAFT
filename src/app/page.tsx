'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { loadCareerState, loadCareerMetadata } from '@/lib/career';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { APP_VERSION } from '@/lib/version';
import {
  Gamepad2,
  MessageSquare,
  Globe,
  Users,
  Activity,
  ArrowRight,
  Play,
  Trophy,
  Zap,
  Shield,
  Radio,
  AlertTriangle,
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'hub' | 'career' | 'draft'>('hub');

  // Load existing career save state canonical hydration check
  useEffect(() => {
    // 1. Instant synchronous check from lightweight localStorage metadata (< 1KB)
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
        // Direct read fallback to ensure absolute reliability across browser environments
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

  // SquadCraft Keyboard shortcuts (Desktop only, inputs/modals ignored)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or modal is open
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
    <div className="arena-landing relative min-h-screen w-full bg-[#070A0F] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. SHARP STADIUM ARENA BACKGROUND (NO BLUR, CRISP GRAPHITE & LIGHTS) */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        {/* High-contrast crisp sports vignette: zero blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A0F]/85 via-transparent to-[#070A0F]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#070A0F]/40 to-[#070A0F]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT BROADCAST TOP NAVIGATION BAR                           */}
      {/* ==================================================================== */}
      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT BRAND HEADER                                            */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-[#182338] bg-[#070D1A]/95 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] shadow-[0_0_8px_#00F5A0]" />
            <span className="font-black italic uppercase tracking-wider text-xl text-white group-hover:text-zinc-200 transition-colors">
              SQUADCRAFT
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <button onClick={handleContinueCareer} className="hover:text-white transition-colors">
              Kariyer
            </button>
            <Link href="/draft" className="hover:text-white transition-colors">
              Draft Ligi
            </Link>
            <Link href="/tactics" className="hover:text-white transition-colors">
              Taktik
            </Link>
            <Link href="/transfers" className="hover:text-white transition-colors">
              Transfer
            </Link>
            <button onClick={() => setIsFeedbackOpen(true)} className="hover:text-white transition-colors">
              Topluluk
            </button>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="text-xs font-bold text-zinc-400 hover:text-white uppercase transition-colors"
            >
              Geri Bildirim
            </button>
            <button
              onClick={savedData ? handleContinueCareer : handleNewCareerRequest}
              className="px-4 py-2 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_16px_rgba(0,245,160,0.3)] transition-all active:scale-95"
            >
              {savedData ? 'Kariyeri Aç' : 'Kayıt Ol'}
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. HERO SECTION (SENİN KULÜBÜN. SENİN HİKAYEN.)                       */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col items-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] text-xs font-bold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
          <span>YENİ NESİL FUTBOL MENAJERLİK DENEYİMİ</span>
        </div>

        {/* Hero Title */}
        <div className="text-center max-w-4xl space-y-3">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black italic tracking-tight uppercase text-white leading-none">
            SENİN KULÜBÜN.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F5A0] via-[#00D4FF] to-[#00F5A0]">
              SENİN HİKAYEN.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-medium max-w-2xl mx-auto pt-2 leading-relaxed">
            Gerçek zamanlı maç motoru, dinamik transfer piyasası ve multiplayer draft moduyla takımını zirveye taşı.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
          <button
            onClick={savedData ? handleContinueCareer : handleNewCareerRequest}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_24px_rgba(0,245,160,0.4)] transition-all active:scale-95"
          >
            <span>{savedData ? 'KARİYERE DEVAM ET' : 'HEMEN BAŞLA'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <Link
            href="/draft"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#0B1323] hover:bg-[#0E1B33] text-zinc-200 hover:text-white border border-[#182338] font-bold text-sm uppercase tracking-wider rounded-xl transition-all active:scale-95"
          >
            <Gamepad2 className="w-4 h-4 text-[#A855F7]" />
            <span>DRAFT LİGİNE GÖZ AT</span>
          </Link>
        </div>

        {/* ==================================================================== */}
        {/* 4. STATS STRIP (100K+, 500K+, 15K+, 98%)                             */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 mb-8">
          <div className="sc-panel p-4 text-center rounded-xl">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#00F5A0]">100K+</div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mt-1">AKTİF MENAJER</div>
          </div>
          <div className="sc-panel p-4 text-center rounded-xl">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#00D4FF]">500K+</div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mt-1">OYNANAN MAÇ</div>
          </div>
          <div className="sc-panel p-4 text-center rounded-xl">
            <div className="text-2xl sm:text-3xl font-black font-mono text-white">15K+</div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mt-1">GERÇEK OYUNCU</div>
          </div>
          <div className="sc-panel p-4 text-center rounded-xl">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#FFB800]">98%</div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400 mt-1">OLUMLU YORUM</div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. DUAL GAMEPLAY MODE CARDS (KARİYER MODU & DRAFT LİGİ)               */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mt-4">
          {/* Card 1: Kariyer Modu */}
          <div className="sc-panel-interactive border-2 border-[#00F5A0]/80 sc-glow-green p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/40 rounded-full text-xs font-black uppercase tracking-wider">
                  TEK OYUNCULU
                </span>
                <Trophy className="w-6 h-6 text-[#00F5A0]" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white">
                  KARİYER MODU
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Sıfırdan bir kulüp kur ya da efsane bir takımı devral. 30+ lig, gerçekçi transfer piyasası.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="text-[#00F5A0] font-black">✓</span>
                  <span>Dinamik Transfer Piyasası</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00F5A0] font-black">✓</span>
                  <span>Altyapı & Oyuncu Gelişimi</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#00F5A0] font-black">✓</span>
                  <span>Gelişmiş Taktik Motoru</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              {savedData ? (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleContinueCareer}
                    className="flex-1 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>DEVAM ET ({savedData.userClub.name})</span>
                  </button>
                  <button
                    onClick={handleNewCareerRequest}
                    className="px-4 py-3.5 bg-[#0B1323] hover:bg-[#0E1B33] text-zinc-300 hover:text-white border border-[#182338] text-xs font-bold uppercase rounded-xl transition-all"
                  >
                    YENİ
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNewCareerRequest}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95"
                >
                  <span>KARİYER BAŞLAT</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>

          {/* Card 2: Draft Ligi */}
          <div className="sc-panel-interactive border-2 border-[#A855F7]/80 sc-glow-purple p-6 sm:p-8 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-[#A855F7]/15 text-[#A855F7] border border-[#A855F7]/40 rounded-full text-xs font-black uppercase tracking-wider">
                  ÇOK OYUNCULU
                </span>
                <Gamepad2 className="w-6 h-6 text-[#A855F7]" />
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white">
                  DRAFT LİGİ
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                  Arkadaşlarınla gerçek zamanlı draft yap, kadronu kur, haftalık ligde şampiyonluk mücadelesi ver.
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-semibold text-zinc-300">
                <div className="flex items-center gap-2">
                  <span className="text-[#A855F7] font-black">✓</span>
                  <span>Canlı Snake Draft</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A855F7] font-black">✓</span>
                  <span>2-8 Kişilik Özel Odalar</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#A855F7] font-black">✓</span>
                  <span>Canlı Maç Simülasyonu</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/draft"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all active:scale-95"
              >
                <span>DRAFT ODASI KUR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. THREE SECONDARY SQUADCRAFT TILES (SHARP TILES, NO BLUR)           */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-4 sm:mt-5">
          {/* Card 1: Özgün Futbol Evreni */}
          <div className="bg-[#090D14] border border-zinc-800 hover:border-zinc-600 p-4 flex items-center justify-between transition-all group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 bg-[#0E1624] border border-[#C7FF38]/80 text-[#C7FF38] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#C7FF38] uppercase tracking-wider">
                  DATABASE 2.0 // 01
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#C7FF38] transition-colors truncate">
                  2000+ Futbolcu Evreni
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  10 küresel bölge, potansiyel gelişim eğrileri, gizli özellikler ve serbest oyuncu havuzu.
                </p>
              </div>
            </div>
            <div className="relative w-12 h-12 shrink-0 ml-2 rounded-lg border border-[#182338] overflow-hidden">
              <Image
                src="/images/thumb-globe.jpg"
                alt="Özgün Futbol Evreni"
                width={48}
                height={48}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Card 2: Canlı Draft Sistemi */}
          <div className="sc-panel hover:border-zinc-500 p-4 flex items-center justify-between transition-all group rounded-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#0B1323] border border-[#00D4FF]/40 text-[#00D4FF] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#4FE4FF] uppercase tracking-wider">
                  MULTIPLAYER // 02
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#4FE4FF] transition-colors truncate">
                  Draft & Bütçe Ekonomisi
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  €100M-€300M lobi bütçe seçimi, Hazır sistemi ve canlı maç senkronizasyonu.
                </p>
              </div>
            </div>
            <div className="relative w-12 h-12 shrink-0 ml-2 rounded-lg border border-[#182338] overflow-hidden">
              <Image
                src="/images/thumb-draft-team.jpg"
                alt="Canlı Draft Sistemi"
                width={48}
                height={48}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>

          {/* Card 3: Menajerlik & Taktik */}
          <div className="sc-panel hover:border-zinc-500 p-4 flex items-center justify-between transition-all group rounded-xl">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#0B1323] border border-[#00F5A0]/40 text-[#00F5A0] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#C7FF38] uppercase tracking-wider">
                  HYPER-SIM // 03
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#C7FF38] transition-colors truncate">
                  Taktik, Scouting & Haberler
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  9 diziliş, taktik denge, derin gözlem ağı, akademi ve canlı haber bülteni.
                </p>
              </div>
            </div>
            <div className="relative w-12 h-12 shrink-0 ml-2 rounded-lg border border-[#182338] overflow-hidden">
              <Image
                src="/images/thumb-tactics-tablet.jpg"
                alt="Menajerlik Taktik Ekranı"
                width={48}
                height={48}
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* 6. SQUADCRAFT BROADCAST TICKER & CONTROLLER PROMPT FOOTER             */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-[#182338] bg-[#070D1A] text-xs">
        {/* Broadcast Live News Ticker Strip */}
        <div className="w-full bg-[#040711] border-b border-[#182338] px-4 py-1.5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-[#182338] text-[10px] font-black uppercase text-[#00F5A0]">
            <Radio className="w-3 h-3 text-[#00F5A0] animate-pulse" />
            <span>CANLI BÜLTEN</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-[11px] font-mono text-zinc-400 pl-4">
            <span className="text-zinc-200 font-bold">// ALVERIA PRO LEAGUE 2026/27 AÇILIŞ DRAFTI DEVREDE</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>18 KİŞİLİK RESMİ KADRO SİSTEMİ AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#4FE4FF]">ÇOK OYUNCULU SNAKE DRAFT MOTORU HAZIR</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>SUPABASE GERÇEK ZAMANLI SENKRONİZASYON AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#C7FF38]">SQUADCRAFT KAPALI ALFA SÜRÜMÜ {APP_VERSION}</span>
          </div>
        </div>

        {/* Controller Shortcuts & Status HUD */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left: Keyboard & Controller Shortcuts (SquadCraft Tactical HUD - Hidden on Mobile) */}
          <div className="hidden md:flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">↵ ENTER</kbd>
              <span>SEÇ</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#4FE4FF] font-bold">D</kbd>
              <span>DRAFT LEAGUE</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#C7FF38] font-bold">K</kbd>
              <span>YENİ KARİYER</span>
            </div>
            {savedData && (
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#C7FF38] font-bold">C</kbd>
                <span>DEVAM ET</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">M</kbd>
              <span>GERİ BİLDİRİM</span>
            </div>
          </div>

          {/* Right: Version and Server Status */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-bold">SQUADCRAFT PRO ENGINE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[#C7FF38] font-bold">{APP_VERSION}</span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SİSTEM HAZIR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* New Career Safety Confirmation Modal */}
      {isNewCareerConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#070A12] border-2 border-amber-500/80 p-5 sm:p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  DİKKAT // MEVCUT KAYIT
                </div>
                <h3 className="text-base font-black text-white uppercase">
                  Yeni Kariyer Başlatılsın mı?
                </h3>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed mb-6">
              Mevcut kariyer kaydınız silinecek. Yeni kariyer başlatmak istiyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-3 font-mono">
              <button
                onClick={() => setIsNewCareerConfirmOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase transition-colors"
              >
                İPTAL
              </button>
              <button
                onClick={async () => {
                  setIsNewCareerConfirmOpen(false);
                  await resetEntireCareer();
                  setSavedData(null);
                  router.push('/career/new');
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 text-xs font-black uppercase transition-colors shadow-lg"
              >
                YENİ KARİYER BAŞLAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback & Bug Reporting Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        route="/"
        gamePhase="Ana Menü"
      />
    </div>
  );
}
