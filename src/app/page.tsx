'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { loadCareerState } from '@/lib/career';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import { APP_VERSION } from '@/lib/version';
import {
  Gamepad2,
  Settings,
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
} from 'lucide-react';

export default function MainMenuPage() {
  const router = useRouter();
  const { loadExistingCareer } = useGame();
  const [savedData, setSavedData] = useState<{ userClub: any; seasonYear: number | string } | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'career' | 'draft' | 'settings'>('hub');

  // Load existing career save state if present
  useEffect(() => {
    try {
      const save = loadCareerState();
      if (save && save.clubs && save.userClubId) {
        const userClub = save.clubs.find((c: any) => c.id === save.userClubId) || save.clubs[0];
        setSavedData({
          userClub,
          seasonYear: save.seasonYear || 1,
        });
      }
    } catch (e) {
      console.warn('Could not read existing save:', e);
    }
  }, []);

  const handleContinueCareer = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const success = loadExistingCareer();
      if (success) {
        router.push('/dashboard');
      } else {
        router.push('/career/new');
      }
    },
    [loadExistingCareer, router]
  );

  // FIFA-style Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or modal is open
      if (isFeedbackOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        router.push('/draft');
      } else if (e.key === 'k' || e.key === 'K') {
        router.push('/career/new');
      } else if (e.key === 's' || e.key === 'S') {
        router.push('/settings');
      } else if (e.key === 'm' || e.key === 'M' || e.key === 'F1') {
        e.preventDefault();
        setIsFeedbackOpen(true);
      } else if ((e.key === 'c' || e.key === 'C') && savedData) {
        handleContinueCareer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFeedbackOpen, savedData, router, handleContinueCareer]);

  return (
    <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. SHARP STADIUM ARENA BACKGROUND (NO BLUR, CRISP GRAPHITE & LIGHTS) */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        {/* High-contrast crisp sports vignette: zero blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-transparent to-[#04060A]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/40 to-[#04060A]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. EA FC BROADCAST TOP NAVIGATION BAR */}
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
                  <span className="text-[#00F5A0]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  PRO SIMULATION
                </span>
              </div>
            </Link>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            {/* League Tag */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 border border-zinc-700/80 text-[10px] font-black uppercase tracking-wider text-zinc-200">
              <Shield className="w-3 h-3 text-[#00F5A0]" />
              <span>ALVERIA PRO LİGİ // RESMİ SİSTEM</span>
            </div>
          </div>

          {/* Center: FIFA Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('hub')}
              className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all border ${
                activeTab === 'hub'
                  ? 'bg-[#00F5A0] text-black border-[#00F5A0]'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              [ ANA MERKEZ ]
            </button>
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
              [ DRAFT LEAGUE ]
            </Link>
            <Link
              href="/settings"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-500 hover:text-white transition-all"
            >
              [ AYARLAR ]
            </Link>
          </nav>

          {/* Right: Server Telemetry & Quick Action HUD */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Server Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>SUNUCU: ÇEVRİMİÇİ</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#00D4FF]">14ms TR</span>
            </div>

            {/* Feedback Button */}
            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              title="Geri Bildirim Gönder (Kısayol: F1 veya M)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
              <kbd className="hidden md:inline px-1 py-0.2 text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-700">
                F1
              </kbd>
            </button>

            {/* Settings Button */}
            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
              title="Ayarlar (Kısayol: S)"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Ayarlar</span>
              <kbd className="hidden md:inline px-1 py-0.2 text-[9px] font-mono bg-zinc-900 text-zinc-400 border border-zinc-700">
                S
              </kbd>
            </Link>
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
            <span className="text-[#00F5A0]">
              KULÜBÜNÜ ZİRVEYE TAŞI.
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-zinc-400 mt-2 max-w-2xl">
            Alveria Futbol Evreninde Kendi Menajerlik Efsaneni Yaz // Gerçek Zamanlı Çok Oyunculu Rekabet
          </p>
        </div>

        {/* ==================================================================== */}
        {/* 4. EA FC STYLE ASYMMETRIC PRIMARY TILES (HIGH IMPACT, ZERO BLUR)     */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
          {/* ------------------------------------------------------------------ */}
          {/* TILE 1: DRAFT LEAGUE (FEATURED MULTIPLAYER MODE - 6 COLS)          */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-6 relative overflow-hidden bg-[#07111A] border-2 border-[#00D4FF] flex flex-col justify-between p-6 sm:p-7 group transition-all">
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
            <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] text-[#00D4FF] font-bold tracking-widest uppercase bg-[#021A26] px-2 py-0.5 border border-[#00D4FF]/40">
              <Zap className="w-3 h-3 text-[#00D4FF]" />
              <span>CANLI REKABET</span>
            </div>

            {/* Content Header */}
            <div className="relative z-10 space-y-2 max-w-[420px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#00D4FF] text-black font-black text-[10px] uppercase tracking-wider">
                  ÇOK OYUNCULU
                </span>
                <span className="text-zinc-400 font-mono text-[11px] font-bold">
                  MODE // 02
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-white group-hover:text-[#00D4FF] transition-colors">
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
                  ⚡ Snake Draft
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  ⏱️ 60sn Seçim
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-[#00D4FF]">
                  🏆 6 Hafta Lig
                </span>
              </div>
            </div>

            {/* CTA Button Bar */}
            <div className="relative z-10 pt-6 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <Link
                href="/draft"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D4FF] hover:bg-[#00B8E6] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-md"
              >
                <span>DRAFT LİGİNE GİR</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </Link>

              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                <span>KISAYOL:</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00D4FF] font-bold">
                  D
                </kbd>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* TILE 2: YENİ KARİYER (CAREER MODE - 6 COLS)                         */}
          {/* ------------------------------------------------------------------ */}
          <div className="lg:col-span-6 relative overflow-hidden bg-[#06140D] border-2 border-[#00F5A0] flex flex-col justify-between p-6 sm:p-7 group transition-all">
            {/* Background Cutout Image with Sharp High-Contrast Linear Mask */}
            <div
              className="absolute right-0 top-0 bottom-0 w-[55%] bg-cover bg-center pointer-events-none transition-transform duration-300 group-hover:scale-105"
              style={{ backgroundImage: "url('/images/card-career-manager.jpg')" }}
            >
              {/* Sharp linear gradient: NO BLUR */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#06140D] via-[#06140D]/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06140D] via-transparent to-[#06140D]/50" />
            </div>

            {/* Corner Decorative Tech Markers */}
            <div className="absolute top-2 right-2 flex items-center gap-1 font-mono text-[9px] text-[#00F5A0] font-bold tracking-widest uppercase bg-[#032416] px-2 py-0.5 border border-[#00F5A0]/40">
              <Trophy className="w-3 h-3 text-[#00F5A0]" />
              <span>TEK OYUNCULU</span>
            </div>

            {/* Content Header */}
            <div className="relative z-10 space-y-2 max-w-[420px]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#00F5A0] text-black font-black text-[10px] uppercase tracking-wider">
                  KARİYER MODU
                </span>
                <span className="text-zinc-400 font-mono text-[11px] font-bold">
                  MODE // 01
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter uppercase text-white group-hover:text-[#00F5A0] transition-colors">
                YENİ KARİYER
              </h2>

              <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                Kendi menajerlik kariyerine başla. Kurgusal Alveria liginde kulübünü seç, transferler yap, taktiklerini oluştur ve kupaya uzan!
              </p>

              {/* Athletic Specs Badges */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  🌍 16 Özgün Kulüp
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  📋 Taktik Motoru
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-zinc-200">
                  📈 Oyuncu Gelişimi
                </span>
                <span className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 text-[11px] font-bold text-[#00F5A0]">
                  💾 Otomatik Kayıt
                </span>
              </div>
            </div>

            {/* CTA Button Bar */}
            <div className="relative z-10 pt-6 mt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/career/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-md"
                >
                  <span>KARİYERE BAŞLA</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </Link>

                {savedData && (
                  <button
                    onClick={handleContinueCareer}
                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
                    title="Kayıtlı Kariyere Devam Et (Kısayol: C)"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#00F5A0]" />
                    <span>DEVAM: {savedData.userClub.name}</span>
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
                <span>KISAYOL:</span>
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00F5A0] font-bold">
                  K
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 5. THREE SECONDARY FIFA CARDS (SHARP TILES, NO BLUR)                  */}
        {/* ==================================================================== */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mt-4 sm:mt-5">
          {/* Card 1: Özgün Futbol Evreni */}
          <div className="bg-[#090D14] border border-zinc-800 hover:border-zinc-600 p-4 flex items-center justify-between transition-all group">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 bg-[#0E1624] border border-[#00F5A0]/80 text-[#00F5A0] flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#00F5A0] uppercase tracking-wider">
                  DATABASE // 01
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#00F5A0] transition-colors truncate">
                  Özgün Futbol Evreni
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  16 kurgusal kulüp ve tamamen özgün futbolcu veri tabanı.
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
              <div className="w-10 h-10 bg-[#081522] border border-[#00D4FF]/80 text-[#00D4FF] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#00D4FF] uppercase tracking-wider">
                  MULTIPLAYER // 02
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#00D4FF] transition-colors truncate">
                  Canlı Draft Odası
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  Gerçek zamanlı sıra, süre sınırlı seçimler ve bot desteği.
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
              <div className="w-10 h-10 bg-[#0E1624] border border-[#00F5A0]/80 text-[#00F5A0] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-[#00F5A0] uppercase tracking-wider">
                  HYPER-SIM // 03
                </div>
                <h3 className="text-sm font-black italic uppercase text-white group-hover:text-[#00F5A0] transition-colors truncate">
                  Taktik & Analitik
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                  Dizilişler, geçiş presi, kondisyon ve canlı maç motoru.
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
      {/* 6. EA FC BROADCAST TICKER & CONTROLLER PROMPT FOOTER                 */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-zinc-800 bg-[#05070B] text-xs">
        {/* Broadcast Live News Ticker Strip */}
        <div className="w-full bg-[#080C14] border-b border-zinc-800/80 px-4 py-1.5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-zinc-800 text-[10px] font-black uppercase text-[#00F5A0]">
            <Radio className="w-3 h-3 text-[#00F5A0] animate-pulse" />
            <span>CANLI BÜLTEN</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-[11px] font-mono text-zinc-400 pl-4">
            <span className="text-zinc-200 font-bold">// ALVERIA PRO LEAGUE 2026/27 AÇILIŞ DRAFTI DEVREDE</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>18 KİŞİLİK RESMİ KADRO SİSTEMİ AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00D4FF]">ÇOK OYUNCULU SNAKE DRAFT MOTORU HAZIR</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>SUPABASE GERÇEK ZAMANLI SENKRONİZASYON AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00F5A0]">SQUADCRAFT KAPALI ALFA SÜRÜMÜ {APP_VERSION}</span>
          </div>
        </div>

        {/* Controller Shortcuts & Status HUD */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left: Keyboard & Controller Shortcuts (FIFA iconic HUD) */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">↵ ENTER</kbd>
              <span>SEÇ</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00D4FF] font-bold">D</kbd>
              <span>DRAFT LEAGUE</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00F5A0] font-bold">K</kbd>
              <span>YENİ KARİYER</span>
            </div>
            {savedData && (
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[#00F5A0] font-bold">C</kbd>
                <span>DEVAM ET</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">M</kbd>
              <span>GERİ BİLDİRİM</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">S</kbd>
              <span>AYARLAR</span>
            </div>
          </div>

          {/* Right: Version and Server Status */}
          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-bold">SQUADCRAFT PRO ENGINE</span>
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
