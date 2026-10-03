'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { loadCareerState, loadCareerMetadata } from '@/lib/career';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import {
  Gamepad2,
  Globe,
  Users,
  Activity,
  ArrowRight,
  ArrowRightLeft,
  Trophy,
  Search,
  ChevronDown,
  TrendingUp,
  BarChart2,
  Award,
  Swords,
  UserCheck,
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
  const [activeNav, setActiveNav] = useState<'home' | 'career' | 'draft' | 'features'>('home');

  // Load existing career save state canonical hydration check
  useEffect(() => {
    // 1. Instant check from lightweight localStorage metadata
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
    <div className="relative w-full min-h-screen xl:h-screen xl:max-h-screen xl:overflow-hidden bg-[#040814] text-white flex flex-col justify-between select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. HOMEPAGE STADIUM BACKGROUND (DIRECT ASSET: homepage-stadium.png)   */}
      {/* ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/homepage-stadium.png"
          alt="SquadCraft Stadium Arena"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Cinematic dark vignette overlays for text legibility */}
        <div className="absolute inset-0 bg-[#040814]/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040814]/85 via-transparent to-[#040814]/90" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#040814]/40 to-[#040814]/95" />
      </div>

      {/* ==================================================================== */}
      {/* 2. TOP BROADCAST NAVIGATION BAR                                      */}
      {/* ==================================================================== */}
      <header className="relative z-30 w-full border-b border-[#14233A]/80 bg-[#07101C]/85 backdrop-blur-xl px-4 sm:px-8 py-2.5 shrink-0 shadow-lg">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
          {/* Left: SquadCraft Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center">
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
          <nav className="hidden lg:flex items-center gap-9 text-xs font-black uppercase tracking-wider">
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
              href="#ozellikler"
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

          {/* Right Utility & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Search Icon */}
            <button
              onClick={() => router.push('/scouting')}
              className="w-8 h-8 rounded-lg bg-[#081325] hover:bg-[#0E1E38] border border-[#14233A] text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Arama"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language Dropdown */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#081325] border border-[#14233A] text-zinc-300 text-xs font-mono font-bold">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span>TR</span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>

            {/* Giriş Yap / Devam Et */}
            <button
              onClick={savedData ? handleContinueCareer : handleNewCareerRequest}
              className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#081325] hover:bg-[#0E1E38] text-white border border-[#14233A] hover:border-zinc-500 text-xs font-black uppercase tracking-wider transition-all active:scale-95"
            >
              {savedData ? 'Kariyeri Aç' : 'Giriş Yap'}
            </button>

            {/* Hemen Kayıt Ol */}
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
      {/* 3. MAIN CENTER STAGE                                                 */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1720px] w-full mx-auto px-4 sm:px-8 py-2 xl:py-3 flex-1 flex flex-col justify-between">
        {/* ================================================================== */}
        {/* 3.1 HERO SQUADCRAFT TITLE SECTION                                  */}
        {/* ================================================================== */}
        <div className="flex flex-col items-center text-center my-0.5 xl:my-1">
          {/* Top Kicker */}
          <div className="text-[10px] sm:text-xs font-mono font-bold tracking-[0.35em] uppercase text-zinc-300 mb-0.5">
            F U T B O L U &nbsp; S E N &nbsp; Y Ö N E T
          </div>

          {/* SQUADCRAFT Brand Typography with Neon Speed Slits */}
          <div className="relative flex items-center justify-center">
            {/* Left speed slashes */}
            <div className="hidden sm:flex items-center gap-1.5 mr-4 opacity-85">
              <span className="w-1.5 h-6 bg-[#00F5A0] -skew-x-[25deg] shadow-[0_0_10px_#00F5A0]" />
              <span className="w-1.5 h-6 bg-[#00F5A0]/60 -skew-x-[25deg]" />
              <span className="w-1 h-4 bg-[#00F5A0]/30 -skew-x-[25deg]" />
            </div>

            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black italic tracking-tighter uppercase leading-none font-display drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
              <span className="text-white">SQUAD</span>
              <span className="text-[#00F5A0] drop-shadow-[0_0_30px_rgba(0,245,160,0.5)]">CRAFT</span>
            </h1>

            {/* Right speed slashes */}
            <div className="hidden sm:flex items-center gap-1.5 ml-4 opacity-85">
              <span className="w-1 h-4 bg-[#00F5A0]/30 -skew-x-[25deg]" />
              <span className="w-1.5 h-6 bg-[#00F5A0]/60 -skew-x-[25deg]" />
              <span className="w-1.5 h-6 bg-[#00F5A0] -skew-x-[25deg] shadow-[0_0_10px_#00F5A0]" />
            </div>
          </div>

          {/* Subtitle Slogan */}
          <div className="flex items-center gap-3 sm:gap-6 text-[10px] sm:text-xs font-mono font-black tracking-widest text-[#8E9EB5] uppercase mt-1">
            <span>KUR</span>
            <span className="text-[#00F5A0]">•</span>
            <span>DRAFT ET</span>
            <span className="text-[#00D4FF]">•</span>
            <span>YARIŞ</span>
            <span className="text-[#00F5A0]">•</span>
            <span>ZAFERE ULAŞ</span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3.2 THE TWO PRIMARY HERO MODE CARDS (SIDE BY SIDE)                 */}
        {/* ================================================================== */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6 my-1.5 xl:my-2">
          {/* =============================================================== */}
          {/* LEFT: KARİYER MODU (career-manager.png fills card height)        */}
          {/* =============================================================== */}
          <div className="relative overflow-hidden rounded-2xl xl:rounded-3xl bg-[#07101C]/95 border-2 border-[#00F5A0] shadow-[0_0_35px_rgba(0,245,160,0.22)] p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:scale-[1.006] group min-h-[300px] xl:min-h-[340px]">
            {/* Prominent Manager Figure: Filling the full card height on the right side with soft blend */}
            <div className="absolute right-0 top-0 bottom-0 w-[48%] pointer-events-none overflow-hidden select-none">
              <Image
                src="/images/career-manager.png"
                alt="SquadCraft Kariyer Menajeri"
                fill
                priority
                className="object-contain object-right-bottom group-hover:scale-105 transition-transform duration-700"
              />
              {/* Soft gradient edge to melt left and bottom into card background */}
              <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#07101C] via-[#07101C]/80 to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#07101C] via-[#07101C]/60 to-transparent z-10" />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#07101C] to-transparent z-10" />
            </div>

            {/* Tactical Grid Ambient Glow */}
            <div className="absolute right-6 top-6 w-56 h-36 opacity-15 pointer-events-none rounded-xl border border-[#00F5A0]/40 bg-[radial-gradient(#00F5A0_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Text & Content on Left Half */}
            <div className="relative z-10 space-y-2.5 max-w-[58%]">
              {/* Green Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00F5A0]/15 border border-[#00F5A0]/50 text-[#00F5A0] text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse" />
                <span>MENAJER OL // KULÜBÜNÜ İNŞA ET</span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black italic uppercase tracking-tight text-white font-display">
                  KARİYER <span className="text-[#00F5A0]">MODU</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-300 font-medium mt-1.5 leading-relaxed">
                  Kendi kulübünü yönet, transferlerini yap, taktiğini belirle ve efsane bir kariyer inşa et. Yerel liglerden Avrupa&apos;nın zirvesine uzanan yolculuk senin elinde.
                </p>
              </div>
            </div>

            {/* Bottom Actions & Feature Icons */}
            <div className="relative z-10 pt-4 xl:pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Primary Action Button */}
              {savedData ? (
                <button
                  onClick={handleContinueCareer}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,160,0.4)] active:scale-95 shrink-0"
                >
                  <span>DEVAM ET ({savedData.userClub.name})</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              ) : (
                <button
                  onClick={handleNewCareerRequest}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,245,160,0.4)] active:scale-95 shrink-0"
                >
                  <span>KARİYERE BAŞLA</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}

              {/* 4 Feature Icons Row in Frosted Glass HUD */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 px-3 py-1.5 rounded-xl bg-[#040814]/80 backdrop-blur-md border border-white/5 text-center">
                <Link
                  href="/transfers"
                  className="flex flex-col items-center gap-1 hover:text-[#00F5A0] transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[10px] font-bold text-zinc-300">Transfer</span>
                </Link>
                <Link
                  href="/tactics"
                  className="flex flex-col items-center gap-1 hover:text-[#00F5A0] transition-colors"
                >
                  <Swords className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[10px] font-bold text-zinc-300">Taktik</span>
                </Link>
                <Link
                  href="/scouting"
                  className="flex flex-col items-center gap-1 hover:text-[#00F5A0] transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[10px] font-bold text-zinc-300">Gelişim</span>
                </Link>
                <Link
                  href="/league"
                  className="flex flex-col items-center gap-1 hover:text-[#00F5A0] transition-colors"
                >
                  <Trophy className="w-4 h-4 text-[#00F5A0]" />
                  <span className="text-[10px] font-bold text-zinc-300">Zafer</span>
                </Link>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT: DRAFT LİGİ (draft-trophy.png as main visual focus)        */}
          {/* =============================================================== */}
          <div className="relative overflow-hidden rounded-2xl xl:rounded-3xl bg-[#07101C]/95 border-2 border-[#00D4FF] shadow-[0_0_35px_rgba(0,212,255,0.22)] p-5 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:scale-[1.006] group min-h-[300px] xl:min-h-[340px]">
            {/* Visual Focus: draft-trophy.png filling right side with the glowing Crown Trophy with smooth mask */}
            <div className="absolute right-0 top-0 bottom-0 w-[58%] pointer-events-none overflow-hidden select-none">
              <Image
                src="/images/draft-trophy.png"
                alt="Draft Şampiyonluk Arenası ve Kupa"
                fill
                priority
                className="object-cover object-[55%_center] group-hover:scale-105 transition-transform duration-700"
              />
              {/* Soft gradient edge to melt left and bottom into card background */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#07101C] via-[#07101C]/80 to-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#07101C] via-[#07101C]/60 to-transparent z-10" />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#07101C] to-transparent z-10" />
            </div>

            {/* Cyan Spotlight Flare */}
            <div className="absolute right-8 top-8 w-44 h-44 rounded-full bg-[#00D4FF]/15 blur-3xl pointer-events-none" />

            {/* Text & Content on Left */}
            <div className="relative z-10 space-y-2.5 max-w-[58%]">
              {/* Cyan Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D4FF]/15 border border-[#00D4FF]/50 text-[#00D4FF] text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-pulse" />
                <span>GERÇEK OYUNCULAR // CANLI REKABET</span>
              </div>

              {/* Title & Description */}
              <div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black italic uppercase tracking-tight text-white font-display">
                  DRAFT <span className="text-[#00D4FF]">LİGİ</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-300 font-medium mt-1.5 leading-relaxed">
                  Sıfırdan kadro kur, arkadaşlarınla veya diğer menajerlerle aynı ligde mücadele et. Stratejini konuştur, haftalık maçlarla en iyinin kim olduğunu göster.
                </p>
              </div>
            </div>

            {/* Bottom Actions & Feature Icons */}
            <div className="relative z-10 pt-4 xl:pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Primary Action Button */}
              <Link
                href="/draft"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00D4FF] hover:bg-[#00B8E6] text-[#040814] font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 shrink-0"
              >
                <span>DRAFT&apos;A GİR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              {/* 4 Feature Icons Row in Frosted Glass HUD */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 px-3 py-1.5 rounded-xl bg-[#040814]/80 backdrop-blur-md border border-white/5 text-center">
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 hover:text-[#00D4FF] transition-colors"
                >
                  <Users className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[10px] font-bold text-zinc-300">Lig Kur</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 hover:text-[#00D4FF] transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[10px] font-bold text-zinc-300 truncate">Arkadaşla</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 hover:text-[#00D4FF] transition-colors"
                >
                  <Activity className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[10px] font-bold text-zinc-300">Canlı</span>
                </Link>
                <Link
                  href="/draft"
                  className="flex flex-col items-center gap-1 hover:text-[#00D4FF] transition-colors"
                >
                  <Award className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-[10px] font-bold text-zinc-300">Ödüller</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3.3 THE 4 VISUAL FEATURE CARDS (IMAGES FILLING TOP HALF)           */}
        {/* ================================================================== */}
        <section id="ozellikler" className="w-full my-1 xl:my-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 xl:gap-4">
            {/* 1. CANLI MAÇ MERKEZİ (feature-live-match.png) */}
            <Link
              href="/fixtures"
              className="relative overflow-hidden rounded-2xl bg-[#081220]/95 border border-[#14233A] hover:border-[#00F5A0]/60 transition-all duration-300 hover:-translate-y-1 group shadow-xl flex flex-col justify-between"
            >
              {/* Image filling top half */}
              <div className="relative w-full h-28 xl:h-32 overflow-hidden bg-black/60 border-b border-[#14233A]">
                <Image
                  src="/images/feature-live-match.png"
                  alt="Canlı Maç Merkezi"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081220] via-transparent to-transparent opacity-50" />
              </div>

              {/* Bottom Content */}
              <div className="p-3 xl:p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0] shrink-0">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors truncate">
                      CANLI MAÇ MERKEZİ
                    </h3>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
                    Maçları canlı takip et, istatistikleri anlık gör ve oyunun heyecanını yaşa.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <span className="w-6 h-6 rounded-lg bg-[#07101C] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 2. TRANSFER & TAKTİK (feature-transfer-tactics.png) */}
            <Link
              href="/tactics"
              className="relative overflow-hidden rounded-2xl bg-[#081220]/95 border border-[#14233A] hover:border-[#00F5A0]/60 transition-all duration-300 hover:-translate-y-1 group shadow-xl flex flex-col justify-between"
            >
              {/* Image filling top half */}
              <div className="relative w-full h-28 xl:h-32 overflow-hidden bg-black/60 border-b border-[#14233A]">
                <Image
                  src="/images/feature-transfer-tactics.png"
                  alt="Transfer & Taktik"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081220] via-transparent to-transparent opacity-50" />
              </div>

              {/* Bottom Content */}
              <div className="p-3 xl:p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0] shrink-0">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors truncate">
                      TRANSFER & TAKTİK
                    </h3>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
                    Transferlerle kadronu güçlendir, oyun planını oluştur, rakiplerine üstünlük kur.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <span className="w-6 h-6 rounded-lg bg-[#07101C] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 3. SCOUT & GELİŞİM (feature-scout.png cropped from feature-transfer-tactics) */}
            <Link
              href="/scouting"
              className="relative overflow-hidden rounded-2xl bg-[#081220]/95 border border-[#14233A] hover:border-[#00F5A0]/60 transition-all duration-300 hover:-translate-y-1 group shadow-xl flex flex-col justify-between"
            >
              {/* Image filling top half */}
              <div className="relative w-full h-28 xl:h-32 overflow-hidden bg-black/60 border-b border-[#14233A]">
                <Image
                  src="/images/feature-scout.png"
                  alt="Scout & Gelişim"
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081220] via-transparent to-transparent opacity-50" />
              </div>

              {/* Bottom Content */}
              <div className="p-3 xl:p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[#00F5A0]/10 flex items-center justify-center text-[#00F5A0] shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00F5A0] transition-colors truncate">
                      SCOUT & GELİŞİM
                    </h3>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
                    Geleceğin yıldızlarını keşfet, oyuncularını geliştir ve değerlerini artır.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <span className="w-6 h-6 rounded-lg bg-[#07101C] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00F5A0]/40 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>

            {/* 4. ÇOK OYUNCULU REKABET (feature-multiplayer.png) */}
            <Link
              href="/draft"
              className="relative overflow-hidden rounded-2xl bg-[#081220]/95 border border-[#14233A] hover:border-[#00D4FF]/60 transition-all duration-300 hover:-translate-y-1 group shadow-xl flex flex-col justify-between"
            >
              {/* Image filling top half */}
              <div className="relative w-full h-28 xl:h-32 overflow-hidden bg-black/60 border-b border-[#14233A]">
                <Image
                  src="/images/feature-multiplayer.png"
                  alt="Çok Oyunculu Rekabet"
                  fill
                  className="object-cover object-bottom group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081220] via-transparent to-transparent opacity-50" />
              </div>

              {/* Bottom Content */}
              <div className="p-3 xl:p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-md bg-[#00D4FF]/10 flex items-center justify-center text-[#00D4FF] shrink-0">
                      <Trophy className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-black italic uppercase tracking-wider text-white group-hover:text-[#00D4FF] transition-colors truncate">
                      ÇOK OYUNCULU REKABET
                    </h3>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-medium leading-relaxed line-clamp-2">
                    Arkadaşlarına karşı oyna, kendi ligini kur ve global sıralamada yerini al.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <span className="w-6 h-6 rounded-lg bg-[#07101C] border border-[#14233A] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-[#00D4FF]/40 transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* 4. BOTTOM STATS & COMMUNITY BAR                                      */}
      {/* ==================================================================== */}
      <footer className="relative z-30 w-full border-t border-[#14233A] bg-[#07101C]/90 backdrop-blur-md px-4 sm:px-8 py-2 xl:py-2.5 shrink-0">
        <div className="max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* 4 Core Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 w-full md:w-auto">
            {/* Stat 1 */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black font-mono text-white leading-none">250K+</div>
                <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                  AKTİF MENAJER
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black font-mono text-white leading-none">4 LİG MODU</div>
                <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                  KARİYER & DRAFT
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00D4FF] shrink-0">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black font-mono text-white leading-none">GERÇEK ZAMANLI</div>
                <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                  MAÇ DENEYİMİ
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#081325] border border-[#14233A] flex items-center justify-center text-[#00F5A0] shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-black font-mono text-white leading-none">BÜYÜYEN TOPLULUK</div>
                <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider mt-0.5">
                  TÜRKİYE VE DAHA FAZLASI
                </div>
              </div>
            </div>
          </div>

          {/* Right: Tagline with 3D Ball Accent */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center md:text-right">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 italic">
                DAHA FAZLA
              </div>
              <div className="text-xs sm:text-sm font-black italic uppercase text-white font-display">
                BİR MENAJERLİK DENEYİMİ
              </div>
            </div>

            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 shadow-md shrink-0 hidden sm:block">
              <Image
                src="/images/art-ball-cleats.jpg"
                alt="SquadCraft Ball"
                fill
                className="object-cover"
              />
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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        route="/"
        gamePhase="Ana Menü"
      />
    </div>
  );
}
