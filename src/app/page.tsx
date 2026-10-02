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
    <div className="relative min-h-screen w-full bg-[#070A0F] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
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
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070A0F] px-4 sm:px-8 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: SquadCraft FC Brand Plate (Clean, Unboxed, Professional) */}
          <div className="flex items-center gap-3.5">
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
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  PRO SIMULATION
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            {/* League Tag */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-700/80 text-[10px] font-black uppercase tracking-wider text-zinc-200">
              <Shield className="w-3 h-3 text-[#C7FF38]" />
              <span>ALVERIA PRO LİGİ // RESMİ SİSTEM</span>
            </div>
          </div>

          {/* Center: SquadCraft Tactical Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('hub')}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all border ${
                activeTab === 'hub'
                  ? 'bg-[#C7FF38] text-black border-[#C7FF38]'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              [ ANA MERKEZ ]
            </button>
            <button
              onClick={handleNewCareerRequest}
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#C7FF38] hover:text-[#C7FF38] transition-all"
            >
              [ KARİYER MODU ]
            </button>
            <Link
              href="/draft"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#4FE4FF] hover:text-[#4FE4FF] transition-all"
            >
              [ DRAFT LEAGUE ]
            </Link>
          </nav>

          {/* Right: Server Telemetry & Quick Action HUD */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Server Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#C7FF38]" />
              <span>SUNUCU: ÇEVRİMİÇİ</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#4FE4FF]">14ms TR</span>
            </div>

            {/* Feedback Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              title="Geri Bildirim Gönder (Kısayol: F1 veya M)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#C7FF38]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
              <kbd className="hidden md:inline px-1 py-0.2 text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-700">
                F1
              </kbd>
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. HERO BRANDING & TOURNAMENT HEADLINE (CLEAN & SPACIOUS)            */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-3 sm:py-5 my-auto flex flex-col items-center">
        {/* Spacious Official Center Logo (Refined, Not Too Big, User Provided PNG) */}
        <div className="w-full flex flex-col items-center text-center mb-3 sm:mb-4">
          <div className="relative w-44 h-28 sm:w-48 sm:h-32 flex items-center justify-center my-1">
            <Image
              src="/images/squadcraft-logo-official-hd.png"
              alt="SquadCraft Official Logo"
              width={200}
              height={143}
              className="object-contain drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
              priority
            />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black italic tracking-tight uppercase text-white mt-1">
            KADRO KUR. TAKTİK YAP.{' '}
            <span className="text-[#C7FF38]">
              KULÜBÜNÜ ZİRVEYE TAŞI.
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400 mt-2 max-w-2xl">
            Alveria Futbol Evreninde Kendi Menajerlik Efsaneni Yaz // Gerçek Zamanlı Çok Oyunculu Rekabet
          </p>
        </div>

        {/* ==================================================================== */}
        {/* 4. SQUADCRAFT TACTICAL PRIMARY TILES (HIGH IMPACT, ZERO BLUR)        */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* ------------------------------------------------------------------ */}
          {/* TILE 1: DRAFT LEAGUE (FEATURED MULTIPLAYER MODE - 6 COLS)          */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-6 relative overflow-hidden bg-[#07111A] border-2 border-[#4FE4FF] flex flex-col justify-between p-6 sm:p-7 group transition-all">
            {/* Background Cutout Image with Sharp High-Contrast Linear Mask */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[55%] bg-cover bg-center pointer-events-none transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: "url('/images/card-draft-room.jpg')" }}
            >
              {/* Sharp linear gradient: NO BLUR */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#07111A] via-[#07111A]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07111A] via-transparent to-[#07111A]/50" />
            </div>

            {/* Corner Decorative Tech Markers */}
            <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] text-[#4FE4FF] font-bold tracking-widest uppercase bg-[#021A26] px-2 py-0.5 border border-[#4FE4FF]/40">
              <Zap className="w-3 h-3 text-[#4FE4FF]" />
              <span>CANLI REKABET</span>
            </div>

            {/* Content Header */}
            <div className="relative z-10 space-y-2 max-w-[420px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#4FE4FF] text-black font-black text-[10px] uppercase tracking-wider">
                  ÇOK OYUNCULU
                </span>
                <span className="text-zinc-400 font-mono text-[11px] font-bold">
                  MODE // 02
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-white group-hover:text-[#4FE4FF] transition-colors">
                DRAFT LEAGUE
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Arkadaşlarınla veya botlarla sıfırdan canlı draft ile kadro kur. 18 kişilik kadronu oluştur, lig fikstüründe şampiyonluk için kapış!
              </p>

              {/* Athletic Specs Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  👥 2–8 Menajer
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  ⚡ Snake Draft & Bütçe
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  ⏱️ 60sn Seçim
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-[#4FE4FF]">
                  🟢 Hazır Sistemi & Canlı Senkron
                </span>
              </div>
            </div>

            {/* CTA Button Bar */}
            <div className="relative z-10 pt-6 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <Link
                href="/draft"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#4FE4FF] hover:bg-[#00B8E6] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-md"
              >
                <span>DRAFT LİGİNE GİR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                <span>KISAYOL:</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#4FE4FF] font-bold">
                  D
                </kbd>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* TILE 2: KARİYER MODU (CAREER MODE - 6 COLS)                         */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-6 relative overflow-hidden bg-[#06140D] border-2 border-[#C7FF38] flex flex-col justify-between p-5 sm:p-7 group transition-all">
            {/* Background Cutout Image with Sharp High-Contrast Linear Mask */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[55%] bg-cover bg-center pointer-events-none transition-transform duration-300 group-hover:scale-105 opacity-40 sm:opacity-100"
              style={{ backgroundImage: "url('/images/card-career-manager.jpg')" }}
            >
              {/* Sharp linear gradient: NO BLUR */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#06140D] via-[#06140D]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06140D] via-transparent to-[#06140D]/50" />
            </div>

            {/* Corner Decorative Tech Markers */}
            <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] text-[#C7FF38] font-bold tracking-widest uppercase bg-[#032416] px-2 py-0.5 border border-[#C7FF38]/40">
              <Trophy className="w-3 h-3 text-[#C7FF38]" />
              <span>TEK OYUNCULU</span>
            </div>

            {/* Content Header */}
            <div className="relative z-10 space-y-2 max-w-[420px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#C7FF38] text-black font-black text-[10px] uppercase tracking-wider">
                  KARİYER MODU
                </span>
                <span className="text-zinc-400 font-mono text-[11px] font-bold">
                  MODE // 01
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-white group-hover:text-[#C7FF38] transition-colors">
                {savedData ? 'KARİYERE DEVAM ET' : 'YENİ KARİYER'}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                {savedData
                  ? `${savedData.userClub.name} ile Sezon ${savedData.seasonYear} kariyerine devam et. Kadron, taktiklerin ve fikstürün hazır!`
                  : '2000+ futbolcu evreni, dinamik transfer pazarlığı, altyapı akademisi, scouting ve yaşayan kariyer haberleriyle kulübünü zirveye taşı!'}
              </p>

              {/* Athletic Specs Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  🌍 2000+ Futbolcu
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  💼 Transfer Masası
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  📈 Gelişim & Akademi
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-[#C7FF38]">
                  📰 Yaşayan Haberler
                </span>
              </div>
            </div>

            {/* CTA Button Bar */}
            <div className="relative z-10 pt-4 sm:pt-6 mt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {savedData ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                  {/* Primary: Continue Career */}
                  <button
                    onClick={handleContinueCareer}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C7FF38] hover:bg-[#D9FF73] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                  >
                    <Play className="w-4 h-4 fill-current text-black" />
                    <span>KARİYERE DEVAM ET</span>
                    <span className="text-[11px] font-mono text-zinc-900 font-bold opacity-80 sm:inline hidden">
                      ({savedData.userClub.name})
                    </span>
                  </button>

                  {/* Below / Secondary: New Career */}
                  <button
                    onClick={handleNewCareerRequest}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-95"
                  >
                    <span>YENİ KARİYER</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href="/career/new"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C7FF38] hover:bg-[#D9FF73] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-md"
                  >
                    <span>KARİYERE BAŞLA</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </Link>
                </div>
              )}

              <div className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                <span>KISAYOL:</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#C7FF38] font-bold">
                  {savedData ? 'C' : 'K'}
                </kbd>
              </div>
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
            <div className="relative w-12 h-12 shrink-0 ml-2 border border-zinc-700 overflow-hidden">
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
          <div className="bg-[#090D14] border border-zinc-800 hover:border-zinc-600 p-4 flex items-center justify-between transition-all group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 bg-[#081522] border border-[#4FE4FF]/80 text-[#4FE4FF] flex items-center justify-center shrink-0">
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
            <div className="relative w-12 h-12 shrink-0 ml-2 border border-zinc-700 overflow-hidden">
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
          <div className="bg-[#090D14] border border-zinc-800 hover:border-zinc-600 p-4 flex items-center justify-between transition-all group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 bg-[#0E1624] border border-[#C7FF38]/80 text-[#C7FF38] flex items-center justify-center shrink-0">
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
            <div className="relative w-12 h-12 shrink-0 ml-2 border border-zinc-700 overflow-hidden">
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
      <footer className="relative z-20 w-full border-t border-zinc-800 bg-[#05070B] text-xs">
        {/* Broadcast Live News Ticker Strip */}
        <div className="w-full bg-[#080C14] border-b border-zinc-800/80 px-4 py-1.5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-zinc-800 text-[10px] font-black uppercase text-[#C7FF38]">
            <Radio className="w-3 h-3 text-[#C7FF38] animate-pulse" />
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
