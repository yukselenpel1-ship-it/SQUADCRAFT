'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { formatDateTurkish } from '@/lib/career';
import {
  Trophy,
  Swords,
  Inbox,
  ArrowRight,
  Activity,
  Wallet,
  CheckCircle2,
  Circle,
  Newspaper,
  ChevronRight,
  Calendar,
  Users,
  Eye,
  Sliders,
  Sparkles,
  TrendingUp,
  Award,
  Landmark,
  Compass,
  GraduationCap,
  Shirt,
  ShieldAlert,
  ArrowLeftRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const {
    isInitialized,
    hasActiveCareer,
    hasSavedCareer,
    userClub,
    allClubs,
    userPlayers,
    standings,
    fixtures,
    inboxMessages,
    seasonYear,
    seasonNumber,
    newsFeed,
    nextMatch,
    isMatchDay,
    daysUntilNextMatch,
    seasonEndSummary,
    startNextSeasonRoll,
    managerContract,
    respondToManagerContractOffer,
    isCareerHydrated,
    hasCareerSave,
  } = useGame();

  // Guard: Only after full hydration, if neither active career nor any save exists, redirect to main menu
  useEffect(() => {
    if (isInitialized && isCareerHydrated && !hasActiveCareer && !hasSavedCareer && !hasCareerSave) {
      router.replace('/');
    }
  }, [isInitialized, isCareerHydrated, hasActiveCareer, hasSavedCareer, hasCareerSave, router]);

  if (!isInitialized || !isCareerHydrated) {
    return (
      <div className="min-h-screen bg-[#040814] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  const userStanding = standings.find((s) => s.clubId === userClub.id);
  const currentRank = userStanding?.rank || 3;
  const currentPoints = userStanding?.points || 16;

  // Next match opponent details
  const nextOpponent = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      ) || allClubs[1]
    : allClubs[1] || allClubs[0];

  const isUserHome = nextMatch ? nextMatch.homeClubId === userClub.id : true;

  // Total squad value
  const totalSquadValue = userPlayers.reduce((acc, p) => acc + (p.marketValue || 4500000), 0);

  // Key players for Middle Row stats
  // 1. Forma Oyuncusu (Top rated)
  const topFormPlayer =
    [...userPlayers].sort((a, b) => (b.overall || 75) - (a.overall || 75))[0] ||
    userPlayers[0] || {
      id: 'default-form',
      firstName: 'Milutin',
      lastName: 'Gajić',
      overall: 84,
      position: 'MC',
    };

  // 2. En Golcü
  const topScorerPlayer =
    [...userPlayers].sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))[0] ||
    userPlayers.find((p) => p.position === 'ST') ||
    userPlayers[1] || {
      id: 'default-scorer',
      clubId: userClub.id,
      firstName: 'Jonas',
      lastName: 'Vogel',
      seasonStats: { appearances: 10, goals: 6, assists: 1, yellowCards: 0, redCards: 0, cleanSheets: 0, averageRating: 7.4 },
      overall: 78,
      position: 'ST' as const,
    };

  // 3. En Asist
  const topAssistPlayer =
    [...userPlayers].sort((a, b) => (b.seasonStats?.assists || 0) - (a.seasonStats?.assists || 0))[0] ||
    userPlayers.find((p) => ['AML', 'AMR', 'AMC', 'MC'].includes(p.position)) ||
    userPlayers[2] || {
      id: 'default-assist',
      clubId: userClub.id,
      firstName: 'Lovro',
      lastName: 'Bogdanović',
      seasonStats: { appearances: 10, goals: 2, assists: 4, yellowCards: 0, redCards: 0, cleanSheets: 0, averageRating: 7.6 },
      overall: 79,
      position: 'AMC' as const,
    };

  // Upcoming 5 matches for Column 2
  const upcomingFixtures = fixtures
    .filter(
      (f) =>
        (f.homeClubId === userClub.id || f.awayClubId === userClub.id) &&
        f.status === 'SCHEDULED'
    )
    .slice(0, 5);

  // Top 5 standings for Column 3
  const topStandings = [...standings].sort((a, b) => a.rank - b.rank).slice(0, 5);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ==================================================================== */}
      {/* 1. SEASON END SUMMARY BANNER (CONDITIONAL)                           */}
      {/* ==================================================================== */}
      {seasonEndSummary && (
        <div className="sc-panel border border-[#FFB800] p-6 rounded-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#FFB800] text-black text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  SEZON TAMAMLANDI
                </span>
                <span className="text-xs text-zinc-400 font-mono">{seasonYear} SEZON SONU RAPORU</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white">
                ŞAMPİYON: <span className="text-[#FFB800]">{seasonEndSummary.championClubName}</span> 🏆
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Kulübünüz <strong className="text-white">{userClub.name}</strong> sezonu{' '}
                <strong className="text-[#00F5A0]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) tamamladı.
              </p>
            </div>
            <button
              onClick={startNextSeasonRoll}
              className="px-6 py-3 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <span>YENİ SEZONA BAŞLA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. TOP HERO & SIRADAKİ MAÇ SECTION (FAITHFUL TO MOCKUP)              */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT / CENTER: HERO TITLE & 2 PRIMARY MODE CARDS (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-[#14233A] bg-[#07101C] p-5 sm:p-6 shadow-xl min-h-[185px]">
            <div className="absolute inset-0 bg-cover bg-center opacity-55" style={{ backgroundImage: `url('/theme-career/stadium-bg.webp')` }} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07101C] via-[#07101C]/85 to-[#07101C]/15" />
            <Image src="/theme-career/manager-cutout.webp" alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="pointer-events-none !left-auto !right-0 !w-[38%] object-contain object-bottom opacity-70" />
            <div className="relative z-10 flex items-center gap-4">
              <ClubBadge code={userClub.code} name={userClub.name} clubId={userClub.id} primaryColor={userClub.primaryColor} secondaryColor={userClub.secondaryColor} size="lg" />
              <div>
                <p className="text-[10px] font-black tracking-[.2em] text-[#0ef0a2]">KARİYER MODU • {seasonNumber || 1}. SEZON</p>
                <h1 className="mt-1 text-2xl sm:text-4xl font-black italic uppercase tracking-tight text-white">{userClub.name}</h1>
                <p className="mt-1 text-xs text-slate-300">Süper Lig • {userClub.managerName}</p>
              </div>
            </div>
            <p className="relative z-10 mt-7 text-[11px] italic tracking-wider text-slate-300">“KULÜBÜNÜ KUR, TAKTİĞİNİ YAZ, EFSANENİ YAŞA”</p>
          </div>

          {/* TWO PRIMARY MODE CARDS: KARİYER MODU (Green) & DRAFT LİGİ (Purple) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CARD 1: KARİYER MODU (Green Neon Border & Glow) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#07101C] sc-glow-green p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]">
              <div
                className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: `url('/images/card-career-manager.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#07101C]/75 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#00F5A0]/40 flex items-center justify-center text-lg shadow-inner">
                  <ClubBadge
                    code={userClub.code}
                    primaryColor={userClub.primaryColor}
                    secondaryColor={userClub.secondaryColor}
                    size="sm"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white uppercase font-display">
                  KARİYER MODU
                </h2>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                  Sıfırdan bir kulüp kur, altyapıdan dünya devine uzanan hikayeni yaz.
                </p>
              </div>

              <div className="relative z-10 pt-4 flex items-center justify-between gap-2">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(0,245,160,0.3)] active:scale-95"
                >
                  DEVAM ET
                </Link>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border border-[#14233A] rounded-xl text-[10px] text-zinc-300 truncate max-w-[140px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0]" />
                  <span className="truncate">{userClub.name}</span>
                </div>

                <Link
                  href="/fixtures"
                  className="w-8 h-8 rounded-xl bg-[#00F5A0] text-[#040814] flex items-center justify-center transition-transform hover:scale-105"
                  title="Fikstüre Git"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* CARD 2: DRAFT LİGİ (Purple Neon Border & Glow) */}
            <div className="relative overflow-hidden rounded-2xl bg-[#07101C] sc-glow-purple p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]">
              <div
                className="absolute inset-0 opacity-25 pointer-events-none bg-cover bg-center"
                style={{ backgroundImage: `url('/images/card-draft-room.jpg')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#07101C]/75 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-black/60 border border-[#A855F7]/40 flex items-center justify-center text-[#A855F7] shadow-inner">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white uppercase font-display">
                  DRAFT LİGİ
                </h2>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                  Arkadaşlarınla gerçek zamanlı draft yap, kadronu kur, birlikte sezonu yaşa.
                </p>
              </div>

              <div className="relative z-10 pt-4 flex items-center justify-between gap-2">
                <Link
                  href="/draft"
                  className="px-4 py-2 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] active:scale-95"
                >
                  ODA KUR
                </Link>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/70 border border-[#14233A] rounded-xl text-[10px] text-purple-300">
                  <span>👥 2-8 Kişi</span>
                  <span>|</span>
                  <span className="font-mono">Canlı Draft</span>
                </div>

                <Link
                  href="/draft"
                  className="w-8 h-8 rounded-xl bg-[#A855F7] text-white flex items-center justify-center transition-transform hover:scale-105"
                  title="Draft Merkezine Git"
                >
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: CLUB HEALTH & SIRADAKİ MAÇ HUD (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Top HUD: Club Reputation & Finances */}
          <div className="sc-panel rounded-2xl border border-[#14233A] p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#14233A]">
              <div className="flex items-center gap-3">
                <ClubBadge
                  code={userClub.code}
                  name={userClub.name}
                  primaryColor={userClub.primaryColor}
                  secondaryColor={userClub.secondaryColor}
                  size="md"
                />
                <div>
                  <h3 className="text-base font-black italic uppercase text-white tracking-wide font-display">
                    {userClub.name}
                  </h3>
                  <div className="text-[10px] font-mono text-[#8E9EB5]">
                    Süper Lig • {seasonNumber || 1}. Sezon
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 text-center">
              {/* Yönetim Güveni */}
              <div className="p-2 bg-[#040814] rounded-xl border border-[#14233A]">
                <div className="text-[9px] font-mono font-bold text-[#8E9EB5] uppercase">
                  YÖNETİM GÜVENİ
                </div>
                <div className="text-base font-black text-[#00F5A0] mt-0.5">A+</div>
                <div className="w-full bg-[#14233A] h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div className="bg-[#00F5A0] h-full w-[94%] rounded-full shadow-[0_0_8px_#00F5A0]" />
                </div>
              </div>

              {/* Bütçe */}
              <div className="p-2 bg-[#040814] rounded-xl border border-[#14233A]">
                <div className="text-[9px] font-mono font-bold text-[#8E9EB5] uppercase">
                  BÜTÇE
                </div>
                <div className="text-base font-black text-[#00F5A0] mt-0.5">
                  €{(userClub.transferBudget / 1000000).toFixed(1)}M
                </div>
                <div className="text-[9px] text-[#51647E] font-mono mt-1">Transfer</div>
              </div>

              {/* Takım Değeri */}
              <div className="p-2 bg-[#040814] rounded-xl border border-[#14233A]">
                <div className="text-[9px] font-mono font-bold text-[#8E9EB5] uppercase">
                  TAKIM DEĞERİ
                </div>
                <div className="text-base font-black text-[#00D4FF] mt-0.5">
                  €{(totalSquadValue / 1000000).toFixed(1)}M
                </div>
                <div className="text-[9px] text-[#51647E] font-mono mt-1">Piyasa</div>
              </div>
            </div>
          </div>

          {/* Bottom HUD: SIRADAKİ MAÇ Card with Stadium Background (Exact to Mockup) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#07101C] border border-[#14233A] p-5 shadow-xl flex-1 flex flex-col justify-between">
            {/* Background stadium lights */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
              style={{ backgroundImage: `url('/theme-career/stadium-bg.webp')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07101C] via-[#07101C]/80 to-[#07101C]/90 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#14233A]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
                  <span className="text-[11px] font-mono font-black uppercase text-white tracking-wider">
                    SIRADAKİ MAÇ
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#8E9EB5]">
                  Süper Lig • {nextMatch?.round || 11}. Hafta
                </span>
              </div>

              {/* Matchup Teams & Form Badges */}
              <div className="py-4 grid grid-cols-7 items-center gap-2 text-center">
                {/* Home Club (3 cols) */}
                <div className="col-span-3 flex flex-col items-center gap-1.5">
                  <ClubBadge
                    code={userClub.code}
                    primaryColor={userClub.primaryColor}
                    secondaryColor={userClub.secondaryColor}
                    size="md"
                  />
                  <span className="text-xs font-black uppercase italic text-white truncate max-w-[120px]">
                    {userClub.name}
                  </span>
                  {/* Form Pills GGBGM */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-4 h-4 rounded-full bg-[#00F5A0] text-black text-[9px] font-black flex items-center justify-center">G</span>
                    <span className="w-4 h-4 rounded-full bg-[#00F5A0] text-black text-[9px] font-black flex items-center justify-center">G</span>
                    <span className="w-4 h-4 rounded-full bg-[#FFB800] text-black text-[9px] font-black flex items-center justify-center">B</span>
                    <span className="w-4 h-4 rounded-full bg-[#00F5A0] text-black text-[9px] font-black flex items-center justify-center">G</span>
                    <span className="w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center">M</span>
                  </div>
                </div>

                {/* VS & Match Info (1 col) */}
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-[#51647E] font-mono">VS</span>
                  <span className="text-[9px] text-[#00F5A0] font-mono font-bold mt-1">
                    {daysUntilNextMatch > 0 ? `${daysUntilNextMatch} GÜN` : 'BUGÜN'}
                  </span>
                </div>

                {/* Away Club (3 cols) */}
                <div className="col-span-3 flex flex-col items-center gap-1.5">
                  <ClubBadge
                    code={nextOpponent?.code || 'KNY'}
                    primaryColor={nextOpponent?.primaryColor || '#EAB308'}
                    secondaryColor={nextOpponent?.secondaryColor || '#1E293B'}
                    size="md"
                  />
                  <span className="text-xs font-black uppercase italic text-white truncate max-w-[120px]">
                    {nextOpponent?.name || 'Kanyon Atlas SK'}
                  </span>
                  {/* Form Pills M G G B M */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center">M</span>
                    <span className="w-4 h-4 rounded-full bg-[#00F5A0] text-black text-[9px] font-black flex items-center justify-center">G</span>
                    <span className="w-4 h-4 rounded-full bg-[#00F5A0] text-black text-[9px] font-black flex items-center justify-center">G</span>
                    <span className="w-4 h-4 rounded-full bg-[#FFB800] text-black text-[9px] font-black flex items-center justify-center">B</span>
                    <span className="w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-black flex items-center justify-center">M</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-center font-mono text-[#8E9EB5] pb-2">
                18 Kasım 2026 • Çarşamba 20:00 // Doruk Arena
              </div>
            </div>

            {/* Action Buttons Row (Exact to Mockup: MAÇ GÜNÜ, TAKTİK HAZIRLIĞI, MAÇ ÖN İZLEME) */}
            <div className="relative z-10 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link
                href={nextMatch ? `/match/${nextMatch.id}` : '/match'}
                className="col-span-1 sm:col-span-1 py-2.5 px-3 rounded-xl bg-[#00F5A0] hover:bg-[#00E590] text-[#040814] font-black text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,245,160,0.3)] transition-all active:scale-95"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>MAÇ GÜNÜ</span>
              </Link>

              <Link
                href="/tactics"
                className="py-2.5 px-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] text-zinc-300 hover:text-white border border-[#14233A] font-bold text-[11px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all"
              >
                <Sliders className="w-3.5 h-3.5 text-[#00D4FF]" />
                <span className="truncate">Taktik</span>
              </Link>

              <Link
                href="/fixtures"
                className="py-2.5 px-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] text-zinc-300 hover:text-white border border-[#14233A] font-bold text-[11px] uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-[#FFB800]" />
                <span className="truncate">Ön İzleme</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. MIDDLE STATS ROW (6 BALANCED CARDS IN GRID)                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* CARD 1: LİG DURUMU */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <Trophy className="w-3.5 h-3.5 text-[#FFB800]" />
            <span>LİG DURUMU</span>
          </div>

          <div className="my-2 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/15 border border-[#FFB800]/40 flex items-center justify-center font-black text-lg text-[#FFB800]">
              {currentRank}.
            </div>
            <div>
              <div className="text-xs font-bold text-white">{currentPoints} Puan</div>
              <div className="text-[10px] text-[#51647E] font-mono">12 Maç</div>
            </div>
          </div>

          <Link href="/league" className="text-[10px] font-bold text-[#00D4FF] hover:underline flex items-center gap-1">
            <span>Detay</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* CARD 2: SON 5 MAÇ */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <Calendar className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>SON 5 MAÇ</span>
          </div>

          <div className="my-3 flex items-center gap-1.5 justify-center">
            <span className="w-6 h-6 rounded-full bg-[#00F5A0] text-black text-xs font-black flex items-center justify-center shadow-sm">G</span>
            <span className="w-6 h-6 rounded-full bg-[#00F5A0] text-black text-xs font-black flex items-center justify-center shadow-sm">G</span>
            <span className="w-6 h-6 rounded-full bg-[#FFB800] text-black text-xs font-black flex items-center justify-center shadow-sm">B</span>
            <span className="w-6 h-6 rounded-full bg-[#EF4444] text-white text-xs font-black flex items-center justify-center shadow-sm">M</span>
            <span className="w-6 h-6 rounded-full bg-[#00F5A0] text-black text-xs font-black flex items-center justify-center shadow-sm">G</span>
          </div>

          <div className="text-[10px] text-[#51647E] font-mono text-center">
            3G • 1B • 1M (10 Puan)
          </div>
        </div>

        {/* CARD 3: FORMA OYUNCUSU */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <Shirt className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>FORMA OYUNCUSU</span>
          </div>

          <div className="my-2 flex items-center gap-2.5">
            <PlayerPortrait
              player={{
                id: topFormPlayer.id,
                firstName: topFormPlayer.firstName,
                lastName: topFormPlayer.lastName,
                position: topFormPlayer.position,
              }}
              size="sm"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {topFormPlayer.firstName?.[0]}. {topFormPlayer.lastName}
              </div>
              <div className="text-sm font-black text-[#00D4FF] mt-0.5">
                8.4
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#51647E] font-mono">
            Son 5 Maç Ort.
          </div>
        </div>

        {/* CARD 4: EN GOLCÜ */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>EN GOLCÜ</span>
          </div>

          <div className="my-2 flex items-center gap-2.5">
            <PlayerPortrait
              player={{
                id: topScorerPlayer.id,
                firstName: topScorerPlayer.firstName,
                lastName: topScorerPlayer.lastName,
                position: topScorerPlayer.position,
              }}
              size="sm"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {topScorerPlayer.firstName} {topScorerPlayer.lastName}
              </div>
              <div className="text-sm font-black text-[#00F5A0] mt-0.5">
                {topScorerPlayer.seasonStats?.goals ?? 6} Gol
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#51647E] font-mono">
            Lig & Kupa
          </div>
        </div>

        {/* CARD 5: EN ASİST */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <TrendingUp className="w-3.5 h-3.5 text-[#00D4FF]" />
            <span>EN ASİST</span>
          </div>

          <div className="my-2 flex items-center gap-2.5">
            <PlayerPortrait
              player={{
                id: topAssistPlayer.id,
                firstName: topAssistPlayer.firstName,
                lastName: topAssistPlayer.lastName,
                position: topAssistPlayer.position,
              }}
              size="sm"
            />
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {topAssistPlayer.firstName} {topAssistPlayer.lastName}
              </div>
              <div className="text-sm font-black text-[#00D4FF] mt-0.5">
                {topAssistPlayer.seasonStats?.assists ?? 4} Asist
              </div>
            </div>
          </div>

          <div className="text-[10px] text-[#51647E] font-mono">
            Süper Lig
          </div>
        </div>

        {/* CARD 6: YÖNETİM HEDEFLERİ */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-[#8E9EB5] uppercase">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>YÖNETİM HEDEFLERİ</span>
          </div>

          <div className="my-2 space-y-1.5 text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#00F5A0] shrink-0" />
              <span className="truncate">İlk 4 içinde bitir</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-[#00F5A0] shrink-0" />
              <span className="truncate">Altyapıdan 2 oyuncu A takıma</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#8E9EB5]">
              <Circle className="w-3 h-3 text-[#51647E] shrink-0" />
              <span className="truncate">Mali dengeyi koru</span>
            </div>
          </div>

          <Link href="/finances" className="text-[10px] font-bold text-[#00F5A0] hover:underline flex items-center gap-1">
            <span>Tüm Hedefler</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. BOTTOM 3 COLUMNS: HABERLER, YAKLAŞAN FİKSTÜR, LİG TABLOSU         */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COLUMN 1: SON HABERLER */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#14233A]">
            <div className="flex items-center gap-2 text-xs font-black uppercase italic tracking-wide text-white font-display">
              <Newspaper className="w-4 h-4 text-[#FFB800]" />
              <span>SON HABERLER</span>
            </div>
            <Link href="/inbox" className="text-[11px] font-bold text-[#00D4FF] hover:underline flex items-center gap-1">
              <span>Tümü</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Featured News Hero Card */}
          <div className="my-3 p-3.5 bg-[#040814] rounded-xl border border-[#14233A] flex gap-3.5 items-center">
            <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-[#14233A] bg-[#07101C]">
              <PlayerPortrait
                player={{
                  id: 'featured-news-player',
                  firstName: 'Marcos',
                  lastName: 'Silva',
                  position: 'MC',
                }}
                size="md"
              />
            </div>
            <div className="min-w-0">
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/30 uppercase">
                TAKIM
              </span>
              <h4 className="text-xs font-black text-white uppercase italic tracking-tight mt-1 truncate">
                Marcos Silva formda grafiğini sürdürüyor
              </h4>
              <p className="text-[11px] text-[#8E9EB5] line-clamp-2 mt-0.5">
                Orta saha oyuncusu son 5 maçta 3 gol 2 asist ile takımın en etkili ismi oldu.
              </p>
              <div className="text-[9px] text-[#51647E] font-mono mt-1">30 saat önce</div>
            </div>
          </div>

          {/* Compact News Ticker List */}
          <div className="space-y-2">
            {[
              { cat: 'TRANSFER', color: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/30', text: 'Kanyon Atlas SK, yeni forvet arayışında' },
              { cat: 'ALTYAPI', color: 'text-[#00F5A0] bg-[#00F5A0]/10 border-[#00F5A0]/30', text: 'Akademiden 2 genç oyuncu A takımla antrenmanda' },
              { cat: 'LİG', color: 'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30', text: 'Süper Lig 11. hafta fikstürü açıklandı' },
              { cat: 'TRANSFER', color: 'text-[#00D4FF] bg-[#00D4FF]/10 border-[#00D4FF]/30', text: 'Kızılkaya SK, yeni forvet arayışında' },
            ].map((n, idx) => (
              <Link
                key={idx}
                href="/inbox"
                className="flex items-center justify-between p-2 rounded-xl bg-[#040814]/70 hover:bg-[#0E1E38] border border-[#14233A] text-xs transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border uppercase shrink-0 ${n.color}`}>
                    {n.cat}
                  </span>
                  <span className="text-zinc-300 hover:text-white truncate text-[11px]">
                    {n.text}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#51647E] shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* COLUMN 2: YAKLAŞAN FİKSTÜR */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#14233A]">
            <div className="flex items-center gap-2 text-xs font-black uppercase italic tracking-wide text-white font-display">
              <Calendar className="w-4 h-4 text-[#00F5A0]" />
              <span>YAKLAŞAN FİKSTÜR</span>
            </div>
            <Link href="/fixtures" className="text-[11px] font-bold text-[#00F5A0] hover:underline flex items-center gap-1">
              <span>Tümü</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 Fixture Rows */}
          <div className="my-3 space-y-2">
            {[
              { date: '18 Kas', oppCode: 'KNY', oppName: 'Kanyon Atlas SK', venue: 'Ev', league: 'Süper Lig' },
              { date: '22 Kas', oppCode: 'SLV', oppName: 'Solvanya Gücü FK', venue: 'Deplasman', league: 'Süper Lig' },
              { date: '28 Kas', oppCode: 'KZL', oppName: 'Kızılkaya SK', venue: 'Ev', league: 'Süper Lig' },
              { date: '03 Ara', oppCode: 'YLK', oppName: 'Yelkenköy Akademi', venue: 'Deplasman', league: 'Süper Lig' },
              { date: '08 Ara', oppCode: 'LMN', oppName: 'Liman Birlik SK', venue: 'Ev', league: 'Süper Lig' },
            ].map((fx, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#040814] border border-[#14233A] text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] text-[#8E9EB5] font-bold shrink-0 w-11">
                    {fx.date}
                  </span>
                  <ClubBadge code={fx.oppCode} primaryColor="#00F5A0" secondaryColor="#14233A" size="xs" />
                  <span className="font-bold text-white truncate text-[11px]">
                    {fx.oppName}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    fx.venue === 'Ev' ? 'bg-[#00F5A0]/10 text-[#00F5A0]' : 'bg-[#14233A] text-[#8E9EB5]'
                  }`}>
                    {fx.venue}
                  </span>
                  <span className="text-[10px] font-mono text-[#51647E]">
                    {fx.league}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Strip 1 */}
          <div className="pt-2 border-t border-[#14233A] grid grid-cols-3 gap-2">
            <Link
              href="/tactics"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <Swords className="w-3.5 h-3.5 text-[#00F5A0] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Taktik</div>
              <div className="text-[8px] text-[#51647E] truncate">Diziliş & Plan</div>
            </Link>

            <Link
              href="/transfers"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#00D4FF] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Transfer</div>
              <div className="text-[8px] text-[#51647E] truncate">Oyuncu Keşfet</div>
            </Link>

            <Link
              href="/scouting"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <Compass className="w-3.5 h-3.5 text-[#FFB800] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Gözlem Ağı</div>
              <div className="text-[8px] text-[#51647E] truncate">Yıldız Bul</div>
            </Link>
          </div>
        </div>

        {/* COLUMN 3: LİG TABLOSU */}
        <div className="sc-panel rounded-2xl border border-[#14233A] p-5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#14233A]">
            <div className="flex items-center gap-2 text-xs font-black uppercase italic tracking-wide text-white font-display">
              <Trophy className="w-4 h-4 text-[#00D4FF]" />
              <span>LİG TABLOSU</span>
              <span className="text-[10px] font-mono text-[#51647E]">Süper Lig</span>
            </div>
            <Link href="/league" className="text-[11px] font-bold text-[#00D4FF] hover:underline flex items-center gap-1">
              <span>Tümü</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table Headers */}
          <div className="my-2">
            <div className="grid grid-cols-12 text-[10px] font-mono font-bold text-[#51647E] uppercase pb-2 px-2 border-b border-[#14233A]">
              <span className="col-span-1">#</span>
              <span className="col-span-5">TAKIM</span>
              <span className="col-span-1 text-center">O</span>
              <span className="col-span-1 text-center">G</span>
              <span className="col-span-1 text-center">B</span>
              <span className="col-span-1 text-center">M</span>
              <span className="col-span-1 text-center">AV</span>
              <span className="col-span-1 text-right">P</span>
            </div>

            {/* Top 5 Standings Rows */}
            <div className="space-y-1.5 mt-2">
              {[
                { rank: 1, code: 'KUZ', name: 'Kuzey Fırtınası SK', p: 12, w: 7, d: 1, l: 4, gd: '+5', pts: 22 },
                { rank: 2, code: 'SLV', name: 'Solvanya Gücü FK', p: 12, w: 6, d: 3, l: 3, gd: '+10', pts: 21 },
                { rank: 3, code: userClub.code, name: userClub.name, p: 12, w: 5, d: 4, l: 3, gd: '+7', pts: 19, isMe: true },
                { rank: 4, code: 'KZL', name: 'Kızılkaya SK', p: 12, w: 6, d: 1, l: 5, gd: '+3', pts: 17 },
                { rank: 5, code: 'KNY', name: 'Kanyon Atlas SK', p: 12, w: 4, d: 5, l: 3, gd: '+3', pts: 17 },
              ].map((row) => (
                <div
                  key={row.rank}
                  className={`grid grid-cols-12 items-center p-2 rounded-xl text-xs transition-colors ${
                    row.isMe
                      ? 'bg-[#00F5A0]/10 border border-[#00F5A0] shadow-[0_0_12px_rgba(0,245,160,0.15)]'
                      : 'bg-[#040814] border border-[#14233A]'
                  }`}
                >
                  <span className={`col-span-1 font-mono font-black ${row.isMe ? 'text-[#00F5A0]' : 'text-zinc-400'}`}>
                    {row.rank}
                  </span>
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <ClubBadge code={row.code} primaryColor="#00F5A0" secondaryColor="#14233A" size="xs" />
                    <span className={`truncate font-bold text-[11px] ${row.isMe ? 'text-[#00F5A0]' : 'text-white'}`}>
                      {row.name}
                    </span>
                  </div>
                  <span className="col-span-1 text-center font-mono text-zinc-400 text-[10px]">{row.p}</span>
                  <span className="col-span-1 text-center font-mono text-zinc-400 text-[10px]">{row.w}</span>
                  <span className="col-span-1 text-center font-mono text-zinc-400 text-[10px]">{row.d}</span>
                  <span className="col-span-1 text-center font-mono text-zinc-400 text-[10px]">{row.l}</span>
                  <span className="col-span-1 text-center font-mono text-[#00F5A0] text-[10px]">{row.gd}</span>
                  <span className={`col-span-1 text-right font-mono font-black ${row.isMe ? 'text-[#00F5A0]' : 'text-white'}`}>
                    {row.pts}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Strip 2 */}
          <div className="pt-2 border-t border-[#14233A] grid grid-cols-3 gap-2">
            <Link
              href="/academy"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#00F5A0] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Altyapı</div>
              <div className="text-[8px] text-[#51647E] truncate">Yetenek Geliştir</div>
            </Link>

            <Link
              href="/finances"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <Landmark className="w-3.5 h-3.5 text-[#FFB800] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Finans</div>
              <div className="text-[8px] text-[#51647E] truncate">Bütçe Kontrol</div>
            </Link>

            <Link
              href="/squad"
              className="p-2 rounded-xl bg-[#040814] hover:bg-[#0E1E38] border border-[#14233A] text-center transition-colors group"
            >
              <Users className="w-3.5 h-3.5 text-[#00D4FF] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-[10px] font-black uppercase text-white truncate">Kadro</div>
              <div className="text-[8px] text-[#51647E] truncate">Oyuncuları Yönet</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
