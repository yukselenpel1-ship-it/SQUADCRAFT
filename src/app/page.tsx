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
  ArrowRightLeft,
  Play,
  Trophy,
  Zap,
  Shield,
  Radio,
  Search,
  ChevronDown,
  Sparkles,
  TrendingUp,
  BarChart2,
  Award,
  Layers,
  Swords,
  Target,
  UserCheck,
  AlertTriangle,
  Flame,
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
  const [activeNav, setActiveNav] = useState<'home' | 'career' | 'draft' | 'features'>('home');

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

  // Keyboard shortcuts (Desktop only)
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
    <div className="arena-landing relative min-h-screen w-full bg-[#040814] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. AUTHENTIC STADIUM FLOODLIGHT AMBIANCE                             */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        {/* High-contrast crisp sports vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/80 via-[#040814]/60 to-[#040814]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#040814]/30 to-[#040814]/90" />
        {/* Neon stadium flares */}
        <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-[#00F5A0]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -top-32 right-1/4 w-[600px] h-[350px] bg-[#00D4FF]/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT TOP NAVIGATION BAR (FAITHFUL TO MOCKUP)                */}
      {/* ==================================================================== */}
      <header className="relative z-30 w-full border-b border-[#14233A]/80 bg-[#07101C]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 sticky top-0 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          {/* Left: SquadCraft Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 flex items-center justify-center">
              <Image
                src="/images/sc-emblem-official-hd.png"
                alt="SquadCraft Logo"
                width={36}
                height={36}
                className="object-contain drop-shadow-[0_0_12px_rgba(0,245,160,0.6)] group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="flex items-center gap-1.5 font-black uppercase italic tracking-tighter text-xl sm:text-2xl text-white group-hover:text-zinc-100 transition-colors">
              <span>SQUADCRAFT</span>
            </div>
          </Link>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-black uppercase tracking-wider">
            <button
              onClick={() => setActiveNav('home')}
              className={`relative py-1.5 transition-colors ${
                activeNav === 'home'
                  ? 'text-[#00F5A0]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>ANA SAYFA</span>
              {activeNav === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F5A0] shadow-[0_0_8px_#00F5A0] rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                setActiveNav('career');
                if (savedData) handleContinueCareer();
                else handleNewCareerRequest();
              }}
              className={`relative py-1.5 transition-colors ${
                activeNav === 'career'
                  ? 'text-[#00F5A0]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>KARİYER MODU</span>
              {activeNav === 'career' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F5A0] shadow-[0_0_8px_#00F5A0] rounded-full" />
              )}
            </button>

            <Link
              href="/draft"
              onClick={() => setActiveNav('draft')}
              className={`relative py-1.5 transition-colors ${
                activeNav === 'draft'
                  ? 'text-[#00D4FF]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>DRAFT LİGİ</span>
              {activeNav === 'draft' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00D4FF] shadow-[0_0_8px_#00D4FF] rounded-full" />
              )}
            </Link>

            <a
              href="#features"
              onClick={() => setActiveNav('features')}
              className={`relative py-1.5 transition-colors ${
                activeNav === 'features'
                  ? 'text-[#00F5A0]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>ÖZELLİKLER</span>
              {activeNav === 'features' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00F5A0] shadow-[0_0_8px_#00F5A0] rounded-full" />
              )}
            </a>
          </nav>

          {/* Right Utility & CTA Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Icon Button */}
            <button
              onClick={() => router.push('/scouting')}
              className="w-8 h-8 rounded-lg bg-[#081325] hover:bg-[#0E1E38] border border-[#14233A] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Oyuncu / Kulüp Ara"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#081325] border border-[#14233A] text-zinc-300 text-xs font-mono font-bold">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>TR</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>

            {/* Giriş Yap / Kariyer Devam */}
            <button
              onClick={savedData ? handleContinueCareer : handleNewCareerRequest}
              className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#081325] hover:bg-[#0E1E38] text-white border border-[#14233A] hover:border-zinc-500 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
            >
              {savedData ? 'Kariyeri Aç' : 'Giriş Yap'}
            </button>

            {/* Hemen Kayıt Ol / Oyuna Başla */}
            <button
              onClick={handleNewCareerRequest}
              className="px-4 sm:px-5 py-2 rounded-lg bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,160,0.4)] active:scale-95"
            >
              Hemen Kayıt Ol
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. HERO TITLE & SLOGAN BANNER                                        */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-8 pb-12 flex flex-col items-center">
        {/* Top Kicker */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase text-zinc-300">
            F U T B O L U &nbsp; S E N &nbsp; Y Ö N E T
          </span>
        </div>

        {/* Massive SQUADCRAFT Title with Speed Beams */}
        <div className="relative flex items-center justify-center my-1">
          {/* Angled speed lines left & right */}
          <div className="hidden md:flex items-center gap-1.5 mr-4 opacity-75">
            <span className="h-0.5 w-8 bg-gradient-to-r from-transparent to-[#00F5A0]" />
            <span className="h-0.5 w-4 bg-[#00F5A0]" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#00F5A0]" />
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black italic tracking-tight uppercase leading-none font-display">
            <span className="text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]">SQUAD</span>
            <span className="text-[#00F5A0] drop-shadow-[0_0_30px_rgba(0,245,160,0.4)]">CRAFT</span>
          </h1>

          <div className="hidden md:flex items-center gap-1.5 ml-4 opacity-75">
            <span className="w-1.5 h-1.5 rotate-45 bg-[#00F5A0]" />
            <span className="h-0.5 w-4 bg-[#00F5A0]" />
            <span className="h-0.5 w-8 bg-gradient-to-l from-transparent to-[#00F5A0]" />
          </div>
        </div>

        {/* Subtitle Slogan */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono font-black tracking-widest text-[#8E9EB5] uppercase mt-2">
          <span>KUR</span>
          <span className="text-[#00F5A0]">•</span>
          <span>DRAFT ET</span>
          <span className="text-[#00D4FF]">•</span>
          <span>YARIŞ</span>
          <span className="text-[#00F5A0]">•</span>
          <span>ZAFERE ULAŞ</span>
        </div>

        {/* ==================================================================== */}
        {/* 4. THE TWO PRIMARY HERO MODE CARDS (CENTER STAGE)                    */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-10">
          {/* =============================================================== */}
          {/* CARD 1: KARİYER MODU (Vibrant Neon Green Aura)                  */}
          {/* =============================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-[#07101C] border-2 border-[#00F5A0] shadow-[0_0_40px_rgba(0,245,160,0.22)] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] group">
            {/* Background Texture with Tactical Hologram Feel */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('/images/card-career-manager.jpg')` }}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#07101C]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07101C] via-[#07101C]/70 to-transparent pointer-events-none" />

            {/* Tactical Pitch Grid Vector Overlay */}
            <div className="absolute right-4 top-4 w-64 h-48 opacity-15 pointer-events-none border border-[#00F5A0]/40 rounded-xl bg-[radial-gradient(#00F5A0_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 space-y-4">
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F5A0]/15 border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                <span>MENAJER OL // KULÜBÜNÜ İNŞA ET</span>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white font-display">
                  KARİYER <span className="text-[#00F5A0]">MODU</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-2.5 max-w-xl leading-relaxed">
                  Kendi kulübünü yönet, transferlerini yap, taktiğini belirle ve efsane bir kariyer inşa et. Yerel liglerden Avrupa&apos;nın zirvesine uzanan yolculuk senin elinde.
                </p>
              </div>
            </div>

            {/* Bottom Actions & Feature Pills */}
            <div className="relative z-10 pt-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {savedData ? (
                  <button
                    onClick={handleContinueCareer}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,245,160,0.4)] active:scale-95"
                  >
                    <span>DEVAM ET ({savedData.userClub.name})</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    onClick={handleNewCareerRequest}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,245,160,0.4)] active:scale-95"
                  >
                    <span>KARİYERE BAŞLA</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                )}

                {savedData && (
                  <button
                    onClick={handleNewCareerRequest}
                    className="px-4 py-4 rounded-xl bg-[#081325] hover:bg-[#0E1E38] border border-[#14233A] text-zinc-300 hover:text-white font-black text-xs uppercase tracking-wider transition-colors"
                  >
                    YENİ
                  </button>
                )}
              </div>

              {/* 4 Feature Pills Row */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#14233A]/60 text-center">
                <Link
                  href="/transfers"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[11px] font-bold text-zinc-300">Transfer</span>
                </Link>
                <Link
                  href="/tactics"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Swords className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[11px] font-bold text-zinc-300">Taktik</span>
                </Link>
                <Link
                  href="/scouting"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[11px] font-bold text-zinc-300">Gelişim</span>
                </Link>
                <Link
                  href="/league"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Trophy className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[11px] font-bold text-zinc-300">Zafer</span>
                </Link>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* CARD 2: DRAFT LİGİ (Electric Cyan Aura & Championship Trophy)   */}
          {/* =============================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-[#07101C] border-2 border-[#00D4FF] shadow-[0_0_40px_rgba(0,212,255,0.22)] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] group">
            {/* Background Texture with Championship Trophy Look */}
            <div
              className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('/images/card-draft-room.jpg')` }}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#07101C]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07101C] via-[#07101C]/70 to-transparent pointer-events-none" />

            {/* Stadium Floodlights & Trophy Silhouette Flare */}
            <div className="absolute right-6 top-6 w-32 h-32 rounded-full bg-[#00D4FF]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              {/* Badge Tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] text-xs font-mono font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                <span>GERÇEK OYUNCULAR // CANLI REKABET</span>
              </div>

              {/* Title */}
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight text-white font-display">
                  DRAFT <span className="text-[#00D4FF]">LİGİ</span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium mt-2.5 max-w-xl leading-relaxed">
                  Sıfırdan kadro kur, arkadaşlarınla veya diğer menajerlerle aynı ligde mücadele et. Stratejini konuştur, haftalık maçlarla en iyinin kim olduğunu göster.
                </p>
              </div>
            </div>

            {/* Bottom Actions & Feature Pills */}
            <div className="relative z-10 pt-8 space-y-4">
              <Link
                href="/draft"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#00D4FF] hover:bg-[#00B8E6] text-[#040814] font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,212,255,0.4)] active:scale-95"
              >
                <span>DRAFT&apos;A GİR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              {/* 4 Feature Pills Row */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#14233A]/60 text-center">
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Users className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[11px] font-bold text-zinc-300">Lig Kur</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[11px] font-bold text-zinc-300 truncate">Arkadaşla Oyna</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Activity className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[11px] font-bold text-zinc-300">Canlı Maçlar</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Award className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[11px] font-bold text-zinc-300">Ödüller</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. THE 4 FEATURE BLOCKS (ÖZELLİKLER)                                */}
        {/* ==================================================================== */}
        <section id="features" className="w-full mt-12 scroll-mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1: Canlı Maç Merkezi */}
            <Link
              href="/fixtures"
              className="relative overflow-hidden rounded-2xl bg-[#07101C] border border-[#14233A] hover:border-[#00F5A0]/60 p-4 transition-all duration-300 hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail: Realistic Stadium Simulator */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#0c2e1c] border border-[#14233A]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-transparent to-black/30" />

                  {/* Floating Scoreboard Pill (72:14 SC 2 - 1 RVD) */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-black">
                    <span className="text-[#FFB800]">72:14</span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-[#00F5A0]">SC</span>
                    <span className="text-white">2 - 1</span>
                    <span className="text-[#00D4FF]">RVD</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0]">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors">
                    CANLI MAÇ MERKEZİ
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Maçları canlı takip et, istatistikleri anlık gör ve oyunun heyecanını yaşa.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <span className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Feature 2: Transfer & Taktik */}
            <Link
              href="/tactics"
              className="relative overflow-hidden rounded-2xl bg-[#07101C] border border-[#14233A] hover:border-[#00F5A0]/60 p-4 transition-all duration-300 hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail: Tactical Tablet & Squad */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#081325] border border-[#14233A]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-70 group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('/images/thumb-tactics-tablet.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-transparent to-black/30" />

                  {/* Tactical Formation Overlay Badges */}
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-[#00F5A0]/40 text-[#00F5A0] text-[9px] font-mono font-black uppercase">
                      4-2-3-1 MODERN
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0]">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors">
                    TRANSFER & TAKTİK
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Transferlerle kadronu güçlendir, oyun planını oluştur, rakiplerine üstünlük kur.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <span className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Feature 3: Scout & Gelişim */}
            <Link
              href="/scouting"
              className="relative overflow-hidden rounded-2xl bg-[#07101C] border border-[#14233A] hover:border-[#00F5A0]/60 p-4 transition-all duration-300 hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail: Attribute Growth Progression Bars */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#081325] border border-[#14233A] p-3 flex items-end justify-around">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#081325]/80 to-transparent" />

                  {/* 4 Neon Attribute Progress Bars (+8 HIZ, +8 ŞUT, +8 PAS, +12 DRİBLİNG) */}
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-mono font-black text-[#00F5A0]">+8</span>
                    <div className="w-3.5 h-12 bg-zinc-800 rounded-sm overflow-hidden my-1 flex items-end">
                      <div className="w-full h-3/4 bg-[#00F5A0] rounded-sm shadow-[0_0_8px_#00F5A0]" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase">HIZ</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-mono font-black text-[#00F5A0]">+8</span>
                    <div className="w-3.5 h-12 bg-zinc-800 rounded-sm overflow-hidden my-1 flex items-end">
                      <div className="w-full h-2/3 bg-[#00F5A0] rounded-sm shadow-[0_0_8px_#00F5A0]" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase">ŞUT</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-mono font-black text-[#00F5A0]">+8</span>
                    <div className="w-3.5 h-12 bg-zinc-800 rounded-sm overflow-hidden my-1 flex items-end">
                      <div className="w-full h-4/5 bg-[#00F5A0] rounded-sm shadow-[0_0_8px_#00F5A0]" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase">PAS</span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-mono font-black text-[#00F5A0]">+12</span>
                    <div className="w-3.5 h-12 bg-zinc-800 rounded-sm overflow-hidden my-1 flex items-end">
                      <div className="w-full h-full bg-[#00F5A0] rounded-sm shadow-[0_0_12px_#00F5A0]" />
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 font-bold uppercase">DRİBLİNG</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0]">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors">
                    SCOUT & GELİŞİM
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Geleceğin yıldızlarını keşfet, oyuncularını geliştir ve değerlerini artır.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <span className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>

            {/* Feature 4: Çok Oyunculu Rekabet */}
            <Link
              href="/draft"
              className="relative overflow-hidden rounded-2xl bg-[#07101C] border border-[#14233A] hover:border-[#00D4FF]/60 p-4 transition-all duration-300 hover:-translate-y-1 group shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Visual Thumbnail: Squad Numbers in Stadium */}
                <div className="relative w-full h-32 rounded-xl overflow-hidden mb-3 bg-[#081325] border border-[#14233A] flex items-center justify-center">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-65 group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('/images/thumb-draft-team.jpg')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-transparent to-black/30" />

                  {/* Jersey Numbers 10, 7, 8 Badge */}
                  <div className="relative z-10 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-black/80 border border-white/20 text-white font-mono font-black text-xs">
                      #10
                    </span>
                    <span className="px-3 py-1.5 rounded-md bg-black/90 border border-[#00D4FF]/60 text-[#00D4FF] font-mono font-black text-sm shadow-[0_0_12px_rgba(0,212,255,0.4)]">
                      #7
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-black/80 border border-white/20 text-white font-mono font-black text-xs">
                      #8
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF]">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00D4FF] transition-colors">
                    ÇOK OYUNCULU REKABET
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Arkadaşlarına karşı oyna, kendi ligini kur ve global sıralamada yerini al.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <span className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00D4FF]/40 transition-colors">
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* 6. STATS & COMMUNITY FOOTER STRIP (FAITHFUL TO MOCKUP)               */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-[#14233A] bg-[#07101C]/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* The 4 Stats Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 w-full lg:w-auto">
              {/* Stat 1 */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-white leading-none">250K+</div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    AKTİF MENAJER
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-white leading-none">4 LİG MODU</div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    KARİYER & DRAFT
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00D4FF] shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-white leading-none">GERÇEK ZAMANLI</div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    MAÇ DENEYİMİ
                  </div>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-base sm:text-lg font-black font-mono text-white leading-none">BÜYÜYEN TOPLULUK</div>
                  <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-1">
                    TÜRKİYE VE DAHA FAZLASI
                  </div>
                </div>
              </div>
            </div>

            {/* Right Tagline */}
            <div className="text-center lg:text-right shrink-0">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                DAHA FAZLA
              </div>
              <div className="text-sm font-black italic uppercase text-white font-display">
                BİR MENAJERLİK DENEYİMİ
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Micro Bar */}
        <div className="w-full bg-[#040814] border-t border-[#14233A]/70 px-4 sm:px-8 py-2">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
              <span className="text-zinc-400">SQUADCRAFT ENGINE {APP_VERSION}</span>
              <span>•</span>
              <span>TÜM HAKLARI SAKLIDIR &copy; 2026</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFeedbackOpen(true)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3 text-[#00F5A0]" />
                <span>Geri Bildirim</span>
              </button>
              <Link href="/settings" className="hover:text-white transition-colors">
                Ayarlar
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* New Career Safety Confirmation Modal */}
      {isNewCareerConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#07101C] border border-[#14233A] rounded-2xl p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
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
                className="px-4 py-2 bg-[#081325] hover:bg-[#0E1E38] text-zinc-300 hover:text-white border border-[#14233A] text-xs font-bold uppercase rounded-xl transition-colors"
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
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition-colors shadow-lg"
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
