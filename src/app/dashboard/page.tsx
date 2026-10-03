'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { LeagueTable } from '@/components/league/LeagueTable';
import { formatDateTurkish } from '@/lib/career';
import { TrainingIntensity } from '@/lib/career/types';
import {
  Trophy,
  Swords,
  Inbox,
  AlertTriangle,
  ArrowRight,
  Activity,
  Wallet,
  CheckCircle2,
  Newspaper,
  Dumbbell,
  RefreshCw,
  Award,
  ChevronRight,
  MapPin,
  Compass,
  Calendar,
  Zap,
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
    trainingIntensity,
    setTrainingIntensity,
    newsFeed,
    nextMatch,
    isMatchDay,
    daysUntilNextMatch,
    seasonEndSummary,
    startNextSeasonRoll,
    managerContract,
    respondToManagerContractOffer,
    seasonNumber,
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
      <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  const userStanding = standings.find((s) => s.clubId === userClub.id);
  const injuredPlayers = userPlayers.filter((p) => p.isInjured);
  const suspendedPlayers = userPlayers.filter((p) => p.isSuspended);
  const unreadMessages = inboxMessages.filter((m) => !m.isRead).slice(0, 3);

  // Past 3 matches
  const recentFinishedMatches = fixtures
    .filter(
      (f) =>
        (f.homeClubId === userClub.id || f.awayClubId === userClub.id) &&
        f.status === 'FINISHED'
    )
    .slice(-3)
    .reverse();

  // Average fitness & match sharpness
  const avgFitness = Math.round(
    userPlayers.reduce((acc, p) => acc + p.fitness, 0) / (userPlayers.length || 1)
  );
  const avgSharpness = Math.round(
    userPlayers.reduce((acc, p) => acc + (p.matchSharpness ?? 80), 0) / (userPlayers.length || 1)
  );

  // Next match opponent details
  const nextOpponent = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      )
    : null;
  // Total squad value
  const totalSquadValue = userPlayers.reduce((acc, p) => acc + (p.marketValue || 4500000), 0);
  const bestFormPlayer = [...userPlayers].sort((a, b) => (b.overall || 75) - (a.overall || 75))[0] || userPlayers[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Season End Summary Banner (Conditional) */}
      {seasonEndSummary && (
        <div className="sc-panel border-2 border-amber-500/80 p-6 rounded-2xl shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  SEZON TAMAMLANDI
                </span>
                <span className="text-xs text-zinc-400 font-mono">{seasonYear} SEZON SONU RAPORU</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-white">
                ŞAMPİYON: <span className="text-amber-400">{seasonEndSummary.championClubName}</span> 🏆
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Kulübünüz <strong className="text-white">{userClub.name}</strong> sezonu{' '}
                <strong className="text-[#00F5A0]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) tamamladı.
                {seasonEndSummary.topScorerGoals > 0 && (
                  <span className="ml-2 text-zinc-400">
                    Gol Kralı: <strong className="text-white">{seasonEndSummary.topScorerName}</strong> ({seasonEndSummary.topScorerGoals} Gol)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={startNextSeasonRoll}
              className="px-6 py-3 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>YENİ SEZONA BAŞLA</span>
            </button>
          </div>
        </div>
      )}

      {/* Manager Contract Offer Banner */}
      {managerContract.status === 'OFFERED' && (
        <div className="sc-panel border-2 border-amber-400/80 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest font-mono rounded">
              // YÖNETİM KURULU SÖZLEŞME TEKLİFİ
            </span>
            <h3 className="text-lg font-black text-white uppercase">
              2 Yıllık Sözleşme Uzatma Teklifi
            </h3>
            <p className="text-xs text-zinc-300">
              Yönetim, sözleşmenizi 2 yıl uzatmayı ve haftalık maaşınızı{' '}
              <strong className="text-amber-400">€{(managerContract.offerSalary || 50000).toLocaleString('tr-TR')}</strong> seviyesine çıkarmayı teklif ediyor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => respondToManagerContractOffer(true)}
              className="px-5 py-2.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md"
            >
              Kabul Et
            </button>
            <button
              onClick={() => respondToManagerContractOffer(false)}
              className="px-4 py-2.5 bg-[#0B1323] hover:bg-[#0E1B33] text-zinc-300 text-xs font-bold uppercase tracking-wider border border-[#182338] rounded-lg transition-all"
            >
              Reddet
            </button>
          </div>
        </div>
      )}

      {/* 2. CLUB HERO HEADER (SCREEN 2 SHOWCASE) */}
      <div className="sc-panel p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left: Club Crest, Name & Badges */}
          <div className="flex items-center gap-5">
            <div className="p-2 bg-[#040711] rounded-2xl border border-[#182338]">
              <ClubBadge
                code={userClub.code}
                primaryColor={userClub.primaryColor}
                secondaryColor={userClub.secondaryColor}
                size="xl"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/40 text-[10px] font-black uppercase tracking-wider rounded-full">
                  SÜPER LİG
                </span>
                <span className="px-2.5 py-0.5 bg-[#070D1A] border border-[#182338] text-zinc-300 text-[10px] font-mono font-bold uppercase rounded-full">
                  SEZON {seasonYear}
                </span>
                <span className="px-2.5 py-0.5 bg-[#070D1A] border border-[#182338] text-zinc-300 text-[10px] font-mono font-bold uppercase rounded-full">
                  HAFTA {nextMatch?.round || 1}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black italic uppercase text-white tracking-tight">
                {userClub.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                <span>MENAJER: <strong className="text-white">{userClub.managerName}</strong></span>
                <span>•</span>
                <span>STADYUM: <strong className="text-zinc-200">{userClub.stadium}</strong></span>
              </p>
            </div>
          </div>

          {/* Right: 4 Metrics (Takım Değeri, Bütçe, Taraftar Desteği, Yönetim Güveni) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#070D1A] p-4 rounded-xl border border-[#182338]">
            <div className="text-left px-2">
              <span className="block text-[10px] font-mono uppercase font-bold text-zinc-400">TAKIM DEĞERİ</span>
              <span className="text-xl sm:text-2xl font-black italic text-white">
                €{(totalSquadValue / 1000000).toFixed(1)}M
              </span>
              <span className="block text-[10px] font-bold text-[#00F5A0] mt-0.5">+12.4% bu sezon</span>
            </div>

            <div className="text-left px-2 border-l border-[#182338]">
              <span className="block text-[10px] font-mono uppercase font-bold text-zinc-400">BÜTÇE</span>
              <span className="text-xl sm:text-2xl font-black italic text-[#00F5A0]">
                €{(userClub.transferBudget / 1000000).toFixed(1)}M
              </span>
              <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">Transfer Hazır</span>
            </div>

            <div className="text-left px-2 border-l border-[#182338]">
              <span className="block text-[10px] font-mono uppercase font-bold text-zinc-400">TARAFTAR DESTEĞİ</span>
              <span className="text-xl sm:text-2xl font-black italic text-[#00D4FF]">87%</span>
              <div className="w-full bg-[#182338] h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-[#00D4FF] h-full w-[87%]" />
              </div>
            </div>

            <div className="text-center px-2 border-l border-[#182338] flex flex-col items-center justify-center">
              <span className="block text-[10px] font-mono uppercase font-bold text-zinc-400">YÖNETİM GÜVENİ</span>
              <div className="w-10 h-10 rounded-full border-2 border-[#00F5A0] bg-[#00F5A0]/10 flex items-center justify-center font-black text-[#00F5A0] text-sm mt-1 shadow-[0_0_12px_rgba(0,245,160,0.3)]">
                A+
              </div>
            </div>
          </div>
        </div>

        {/* Subnav Navigation Tabs (Genel Bakış, Kadro, Fikstür, Transferler, Altyapı, Kulüp Derinliği) */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#182338] overflow-x-auto pb-1 text-xs font-bold uppercase tracking-wider">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-[#00F5A0] text-black font-black rounded-lg shadow-sm whitespace-nowrap"
          >
            Genel Bakış
          </Link>
          <Link
            href="/squad"
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-[#0E1B33] rounded-lg transition-colors whitespace-nowrap"
          >
            Kadro
          </Link>
          <Link
            href="/fixtures"
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-[#0E1B33] rounded-lg transition-colors whitespace-nowrap"
          >
            Fikstür
          </Link>
          <Link
            href="/transfers"
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-[#0E1B33] rounded-lg transition-colors whitespace-nowrap"
          >
            Transferler
          </Link>
          <Link
            href="/academy"
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-[#0E1B33] rounded-lg transition-colors whitespace-nowrap"
          >
            Altyapı
          </Link>
          <Link
            href="/finances"
            className="px-4 py-2 text-zinc-400 hover:text-white hover:bg-[#0E1B33] rounded-lg transition-colors whitespace-nowrap"
          >
            Kulüp Derinliği
          </Link>
        </div>
      </div>

      {/* 3. NEXT MATCH & MAIN GRID (2 Columns Left, 1 Column Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Sıradaki Maç & 3 Bottom Cards */}
        <div className="lg:col-span-8 space-y-6">
          {/* SIRADAKİ MAÇ CARD */}
          {nextMatch && nextOpponent ? (
            <div className="sc-panel border border-[#182338] p-6 rounded-2xl relative overflow-hidden">
              {/* Header: SÜPER LİG • HAFTA 12 */}
              <div className="flex items-center justify-between pb-4 border-b border-[#182338]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
                    SIRADAKİ MAÇ • SÜPER LİG • HAFTA {nextMatch.round}
                  </span>
                </div>
                <div className="px-3 py-1 rounded-full bg-[#0B1323] border border-[#182338] text-[11px] font-mono text-zinc-400">
                  {formatDateTurkish(nextMatch.date)} • 20:00
                </div>
              </div>

              {/* Matchup Center Display */}
              <div className="py-8 grid grid-cols-3 items-center text-center">
                {/* Home */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-[#070D1A] rounded-2xl border border-[#182338]">
                    <ClubBadge
                      code={nextMatch.homeClubId === userClub.id ? userClub.code : nextOpponent.code}
                      primaryColor={nextMatch.homeClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                      secondaryColor={nextMatch.homeClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                      size="xl"
                    />
                  </div>
                  <h3 className="text-base sm:text-xl font-black italic uppercase text-white">
                    {nextMatch.homeClubId === userClub.id ? userClub.name : nextOpponent.name}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">Ev Sahibi</span>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-2xl sm:text-3xl font-black italic text-zinc-500 font-mono">VS</span>
                  <div className="text-[11px] font-mono text-zinc-400">
                    {nextMatch.stadium || userClub.stadium}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 text-[10px] font-bold uppercase">
                    4-3-3 Ofansif / Yüksek Baskı
                  </div>
                </div>

                {/* Away */}
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-[#070D1A] rounded-2xl border border-[#182338]">
                    <ClubBadge
                      code={nextMatch.awayClubId === userClub.id ? userClub.code : nextOpponent.code}
                      primaryColor={nextMatch.awayClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                      secondaryColor={nextMatch.awayClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                      size="xl"
                    />
                  </div>
                  <h3 className="text-base sm:text-xl font-black italic uppercase text-white">
                    {nextMatch.awayClubId === userClub.id ? userClub.name : nextOpponent.name}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">Deplasman</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#182338] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-zinc-400 font-mono">
                  Rakip Menajeri: <strong className="text-white">{nextOpponent.managerName}</strong>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Link
                    href="/tactics"
                    className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#070D1A] hover:bg-[#0E1B33] text-zinc-200 border border-[#182338] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors text-center"
                  >
                    Taktik Hazırlığı
                  </Link>
                  <Link
                    href={`/match/${nextMatch.id}`}
                    className="flex-1 sm:flex-initial px-7 py-2.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-[0_0_16px_rgba(0,245,160,0.3)] transition-all flex items-center justify-center gap-2"
                  >
                    <span>MAÇ GÜNÜ</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="sc-panel p-6 rounded-2xl text-center text-zinc-400 text-xs font-mono">
              Planlanmış maç bulunmuyor. Sezon tamamlanmış olabilir.
            </div>
          )}

          {/* 3 BOTTOM ROW MINI CARDS (SON 5 MAÇ, YÖNETİM GÜVENİ, FORMDA OYUNCU) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: SON 5 MAÇ */}
            <div className="sc-panel p-4 rounded-xl border border-[#182338]">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-2.5">
                SON 5 MAÇ
              </span>
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-[#00F5A0] border border-[#00F5A0]/40 flex items-center justify-center font-bold text-xs">
                  G
                </span>
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-[#00F5A0] border border-[#00F5A0]/40 flex items-center justify-center font-bold text-xs">
                  G
                </span>
                <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
                  B
                </span>
                <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-[#00F5A0] border border-[#00F5A0]/40 flex items-center justify-center font-bold text-xs">
                  G
                </span>
                <span className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center font-bold text-xs">
                  M
                </span>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 mt-2">10 Puan / Son 5 Maç</p>
            </div>

            {/* Card 2: YÖNETİM GÜVENİ */}
            <div className="sc-panel p-4 rounded-xl border border-[#182338] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-1">
                  YÖNETİM GÜVENİ
                </span>
                <span className="text-xl font-black text-white italic">A+ / %94</span>
                <p className="text-[10px] font-mono text-[#00F5A0] mt-0.5">Hedeflerle tam uyumlu</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-[#00F5A0] bg-[#00F5A0]/10 flex items-center justify-center font-black text-[#00F5A0] text-sm shadow-[0_0_10px_rgba(0,245,160,0.3)]">
                A+
              </div>
            </div>

            {/* Card 3: FORMDA OYUNCU */}
            <div className="sc-panel p-4 rounded-xl border border-[#182338]">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-1">
                FORMDA OYUNCU
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase truncate">
                    {bestFormPlayer ? `${bestFormPlayer.firstName[0]}. ${bestFormPlayer.lastName}` : 'Arda Yılmaz'}
                  </h4>
                  <span className="text-[11px] font-bold text-[#00F5A0]">8.4 Form</span>
                </div>
                {/* Mini SVG Sparkline */}
                <svg className="w-16 h-8 text-[#00F5A0]" viewBox="0 0 60 25" fill="none">
                  <path
                    d="M 2 18 Q 15 22 25 10 T 45 6 T 58 2"
                    stroke="#00F5A0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p className="text-[10px] font-mono text-zinc-500 mt-1">Son 5 maçta 4 gol, 3 asist</p>
            </div>
          </div>

          {/* 3. TAKIM DURUMU & ANTRENMAN YOĞUNLUĞU */}
          <div className="sc-panel p-5 rounded-2xl border border-[#182338] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182338]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00F5A0]/10 border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0]">
                  <Dumbbell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                    Takım Durumu & Antrenman
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Kondisyon seviyesi, maç keskinliği ve antrenman yoğunluğu
                  </p>
                </div>
              </div>

              {/* Training Intensity Segmented Buttons */}
              <div className="flex items-center gap-1 bg-[#040711] p-1 rounded-lg border border-[#182338]">
                {(['Hafif', 'Normal', 'Yoğun'] as TrainingIntensity[]).map((level) => {
                  const isSelected = trainingIntensity === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setTrainingIntensity(level)}
                      className={`px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider rounded transition-all ${
                        isSelected
                          ? level === 'Yoğun'
                            ? 'bg-red-600 text-white font-black'
                            : level === 'Hafif'
                            ? 'bg-cyan-500 text-black font-black'
                            : 'bg-[#00F5A0] text-black font-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Condition Meters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#070D1A] rounded-xl border border-[#182338] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Ortalama Kondisyon</span>
                  <span className="text-2xl font-black italic text-white">%{avgFitness}</span>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {avgFitness >= 85 ? 'Kadro diri ve maça hazır' : 'Yorgunluk belirtileri var'}
                  </p>
                </div>
                <div className="w-16 h-2 bg-[#182338] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      avgFitness >= 85 ? 'bg-[#00F5A0]' : avgFitness >= 70 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${avgFitness}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#070D1A] rounded-xl border border-[#182338] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Maç Keskinliği</span>
                  <span className="text-2xl font-black italic text-[#00D4FF]">%{avgSharpness}</span>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {avgSharpness >= 75 ? 'Tempolu ve refleksler yerinde' : 'Maç eksiği bulunuyor'}
                  </p>
                </div>
                <div className="w-16 h-2 bg-[#182338] rounded-full overflow-hidden">
                  <div className="h-full bg-[#00D4FF]" style={{ width: `${avgSharpness}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): LİG DURUMU & SON HABERLER */}
        <div className="lg:col-span-4 space-y-6">
          {/* LİG DURUMU (MATCHING SCREEN 2 MOCKUP) */}
          <div className="sc-panel p-5 rounded-2xl border border-[#182338] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#182338]">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#FFB800]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                  LİG DURUMU
                </h3>
              </div>
              <Link
                href="/league"
                className="text-xs font-bold text-[#00F5A0] hover:underline flex items-center gap-1 font-mono"
              >
                <span>Tüm Tabloyu Gör</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <LeagueTable
              standings={standings}
              clubs={allClubs}
              userClubId={userClub.id}
              limit={5}
            />
          </div>

          {/* SON HABERLER & BİLDİRİMLER (MATCHING SCREEN 2 MOCKUP) */}
          <div className="sc-panel p-5 rounded-2xl border border-[#182338] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#182338]">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                  SON HABERLER & BİLDİRİMLER
                </h3>
              </div>
              <Link href="/inbox" className="text-xs font-bold text-[#00F5A0] hover:underline font-mono">
                TÜMÜ
              </Link>
            </div>

            <div className="space-y-2.5">
              {newsFeed.length > 0 ? (
                newsFeed.slice(0, 3).map((news) => (
                  <div
                    key={news.id}
                    className="p-3 bg-[#070D1A] rounded-xl border border-[#182338] hover:border-zinc-600 transition-colors space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="font-bold text-[#00F5A0] uppercase px-1.5 py-0.5 rounded bg-[#00F5A0]/10 border border-[#00F5A0]/30">
                        {news.category}
                      </span>
                      <span>{news.date}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug pt-1">{news.headline}</h5>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-[#070D1A] rounded-xl border border-[#182338] text-xs text-zinc-400 font-mono">
                  Transfer görüşmesi tamamlandı. Oyuncu kadroya katıldı.
                </div>
              )}
            </div>
          </div>

          {/* SAKAT & CEZALILAR */}
          <div className="sc-panel p-5 rounded-2xl border border-[#182338] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#182338]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                  Sakat & Cezalılar
                </h3>
              </div>
              <Link href="/squad" className="text-xs font-bold font-mono text-zinc-400 hover:text-white">
                KADRO
              </Link>
            </div>

            <div className="space-y-2">
              {injuredPlayers.length === 0 && suspendedPlayers.length === 0 ? (
                <div className="py-2 text-center text-xs text-zinc-500 font-mono">
                  Şu an sakat veya cezalı oyuncu bulunmamaktadır.
                </div>
              ) : (
                <>
                  {injuredPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/30 border border-red-800/40"
                    >
                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-red-300 font-mono">
                          {p.injuryDetails?.type || 'Sakatlık'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-red-900/60 text-red-200 rounded border border-red-700">
                        {p.injuryDetails?.daysRemaining} gün
                      </span>
                    </div>
                  ))}

                  {suspendedPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40"
                    >
                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          {p.suspensionDetails?.reason || 'Kart Cezası'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-900/60 text-amber-200 rounded border border-amber-700">
                        {p.suspensionDetails?.matchesRemaining} maç
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
