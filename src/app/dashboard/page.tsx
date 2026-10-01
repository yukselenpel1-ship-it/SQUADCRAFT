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
  } = useGame();

  // Guard: If initialized and no active career and no save exists, redirect to main menu
  useEffect(() => {
    if (isInitialized && !hasActiveCareer && !hasSavedCareer) {
      router.replace('/');
    }
  }, [isInitialized, hasActiveCareer, hasSavedCareer, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#04060A] flex items-center justify-center text-zinc-500 font-mono text-xs">
        Kariyer yükleniyor...
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Season End Summary Banner (Conditional) */}
      {seasonEndSummary && (
        <div className="bg-[#141005] border-2 border-amber-500 p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
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
              className="px-6 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>YENİ SEZONA BAŞLA</span>
            </button>
          </div>
        </div>
      )}

      {/* Manager Contract Offer Banner */}
      {managerContract.status === 'OFFERED' && (
        <div className="bg-[#110D05] border-2 border-amber-400 p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2 py-0.5 bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest font-mono">
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
              className="px-5 py-2.5 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Kabul Et
            </button>
            <button
              onClick={() => respondToManagerContractOffer(false)}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider border border-zinc-700 transition-all"
            >
              Reddet
            </button>
          </div>
        </div>
      )}

      {/* 2. GRAND HERO: Club Identity & Command Hub (SquadCraft Club Header, ZERO BLUR) */}
      <div className="bg-[#070B12] border-2 border-[#00F5A0] p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <ClubBadge
              code={userClub.code}
              primaryColor={userClub.primaryColor}
              secondaryColor={userClub.secondaryColor}
              size="xl"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-[#00F5A0] text-black text-[9px] font-black uppercase tracking-wider">
                  ALVERIA ELİT LİGİ
                </span>
                <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 text-[9px] font-mono font-bold uppercase">
                  {seasonYear} SEZONU (SEZON #{seasonNumber})
                </span>
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-[#00F5A0] text-[9px] font-mono font-bold uppercase">
                  TD SÖZLEŞMESİ: {managerContract.yearsLeft} YIL (€{(managerContract.weeklySalary).toLocaleString('tr-TR')}/HF)
                </span>
                <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-400 text-[9px] font-mono">
                  {userClub.city}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black italic uppercase text-white tracking-tight">
                {userClub.name}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2 font-mono">
                <span>MENAJER: <strong className="text-white">{userClub.managerName}</strong></span>
                <span>•</span>
                <span>STADYUM: <strong className="text-zinc-200">{userClub.stadium}</strong></span>
                <span>•</span>
                <span>İTİBAR: <strong className="text-[#00F5A0]">%{userClub.reputation}</strong></span>
              </p>
            </div>
          </div>

          {/* Quick Stat Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#040810] p-3 border border-zinc-800">
            <div className="text-center px-3 py-1">
              <span className="block text-[9px] font-mono uppercase font-bold text-zinc-400">Lig Sırası</span>
              <span className="text-2xl font-black italic text-[#00F5A0]">{userStanding?.rank || 1}.</span>
            </div>
            <div className="text-center px-3 py-1 border-l border-zinc-800">
              <span className="block text-[9px] font-mono uppercase font-bold text-zinc-400">Puan</span>
              <span className="text-2xl font-black italic text-white">{userStanding?.points || 0}</span>
            </div>
            <div className="text-center px-3 py-1 border-l border-zinc-800">
              <span className="block text-[9px] font-mono uppercase font-bold text-zinc-400">Kadro</span>
              <span className="text-2xl font-black italic text-[#00D4FF]">{userPlayers.length}</span>
            </div>
            <div className="text-center px-3 py-1 border-l border-zinc-800">
              <span className="block text-[9px] font-mono uppercase font-bold text-zinc-400">Transfer Bütçesi</span>
              <span className="text-xl font-black italic text-emerald-400">
                €{(userClub.transferBudget / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NEXT MATCH AS MAIN FOCUS (Large Visual Match Center Card, ZERO BLUR) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#00F5A0]" />
            <h2 className="text-xs font-black uppercase tracking-wider text-zinc-300 font-mono">
              // SIRADAKİ MAÇ ODAĞI
            </h2>
          </div>
          {nextMatch && (
            <Link
              href={`/match/${nextMatch.id}`}
              className="text-xs font-black uppercase tracking-wider text-[#00F5A0] hover:text-[#00D68B] flex items-center gap-1 group font-mono"
            >
              <span>MAÇ MERKEZİNE GİT</span>
              <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {nextMatch && nextOpponent ? (
          <div className="bg-[#070B12] border-2 border-[#00D4FF] p-6 shadow-2xl">
            {/* Top Match Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#00D4FF] text-black text-[9px] font-black uppercase">
                  {nextMatch.competition} • HAFTA {nextMatch.round}
                </span>
                <span className="text-xs text-zinc-400 font-mono font-medium">
                  {formatDateTurkish(nextMatch.date)} • {nextMatch.time || '20:00'}
                </span>
              </div>

              <div>
                {isMatchDay ? (
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5 shadow-md">
                    <Swords className="w-3.5 h-3.5" />
                    BUGÜN MAÇ GÜNÜ!
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-zinc-300">
                    {daysUntilNextMatch > 0 ? `${daysUntilNextMatch} GÜN KALDI` : 'BUGÜN'}
                  </span>
                )}
              </div>
            </div>

            {/* Face-off Center Display */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-3 items-center gap-6 text-center">
              {/* Home Team */}
              <div className="flex flex-col items-center gap-2">
                <ClubBadge
                  code={nextMatch.homeClubId === userClub.id ? userClub.code : nextOpponent.code}
                  primaryColor={nextMatch.homeClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                  secondaryColor={nextMatch.homeClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                  size="lg"
                />
                <h4 className="text-lg md:text-xl font-black italic uppercase text-white">
                  {nextMatch.homeClubId === userClub.id ? userClub.name : nextOpponent.name}
                </h4>
                <span className="text-xs text-zinc-400 font-mono">
                  {nextMatch.homeClubId === userClub.id ? '(Ev Sahibi)' : '(Ev Sahibi / Rakip)'}
                </span>
              </div>

              {/* VS Center Pillar */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-zinc-950 border border-zinc-700 flex items-center justify-center font-black italic text-lg text-[#00D4FF]">
                  VS
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-[#00F5A0]" />
                  <span>{nextMatch.stadium || (nextMatch.homeClubId === userClub.id ? userClub.stadium : nextOpponent.stadium)}</span>
                </div>
                {nextMatch.referee && (
                  <span className="text-[11px] text-zinc-500 font-mono">Hakem: {nextMatch.referee}</span>
                )}
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center gap-2">
                <ClubBadge
                  code={nextMatch.awayClubId === userClub.id ? userClub.code : nextOpponent.code}
                  primaryColor={nextMatch.awayClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                  secondaryColor={nextMatch.awayClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                  size="lg"
                />
                <h4 className="text-lg md:text-xl font-black italic uppercase text-white">
                  {nextMatch.awayClubId === userClub.id ? userClub.name : nextOpponent.name}
                </h4>
                <span className="text-xs text-zinc-400 font-mono">
                  {nextMatch.awayClubId === userClub.id ? '(Deplasman)' : '(Deplasman / Rakip)'}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-zinc-400 text-center sm:text-left font-mono">
                <span>Rakip Menajeri: </span>
                <strong className="text-white">{nextOpponent.managerName}</strong> •{' '}
                <span>Rakip İtibarı: </span>
                <strong className="text-[#00F5A0]">%{nextOpponent.reputation}</strong>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/tactics"
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider border border-zinc-700 text-center transition-colors"
                >
                  Taktik Tahtası
                </Link>

                <Link
                  href={`/match/${nextMatch.id}`}
                  className={`flex-1 sm:flex-initial px-7 py-2.5 font-black text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-2 ${
                    isMatchDay
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                      : 'bg-[#00D4FF] hover:bg-[#00B8E6] text-black shadow-lg'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>{isMatchDay ? 'MAÇA GİT' : 'MAÇA HAZIRLAN'}</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-[#070B12] border border-zinc-800 text-center text-zinc-400 text-xs font-mono">
            Planlanmış maç bulunmuyor. Sezon tamamlanmış olabilir.
          </div>
        )}
      </div>

      {/* 4. CONTENT SECTIONS GRID (2 Columns Left, 1 Column Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols): Takım Durumu, Sonuçlar, Lig Tablosu */}
        <div className="lg:col-span-2 space-y-5">
          {/* TAKIM DURUMU & ANTRENMAN YOĞUNLUĞU */}
          <div className="p-5 bg-[#070B12] border border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#04140B] border border-[#00F5A0]/60 flex items-center justify-center text-[#00F5A0]">
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
              <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800">
                {(['Hafif', 'Normal', 'Yoğun'] as TrainingIntensity[]).map((level) => {
                  const isSelected = trainingIntensity === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setTrainingIntensity(level)}
                      className={`px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider transition-all ${
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
              <div className="p-3.5 bg-[#040810] border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Ortalama Kondisyon</span>
                  <span className="text-2xl font-black italic text-white">%{avgFitness}</span>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {avgFitness >= 85 ? 'Kadro diri ve maça hazır' : 'Yorgunluk belirtileri var'}
                  </p>
                </div>
                <div className="w-16 h-2 bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      avgFitness >= 85 ? 'bg-[#00F5A0]' : avgFitness >= 70 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${avgFitness}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-[#040810] border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Maç Keskinliği</span>
                  <span className="text-2xl font-black italic text-[#00D4FF]">%{avgSharpness}</span>
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                    {avgSharpness >= 75 ? 'Tempolu ve refleksler yerinde' : 'Maç eksiği bulunuyor'}
                  </p>
                </div>
                <div className="w-16 h-2 bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-[#00D4FF]" style={{ width: `${avgSharpness}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* SONUÇLAR (Son 3 Maç) */}
          <div className="p-5 bg-[#070B12] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00D4FF]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                  Son Karşılaşmalar
                </h3>
              </div>
              <Link
                href="/fixtures"
                className="text-xs font-bold text-[#00D4FF] hover:underline flex items-center gap-1 font-mono"
              >
                <span>TÜM FİKSTÜR</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentFinishedMatches.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentFinishedMatches.map((fix) => {
                  const isUserHome = fix.homeClubId === userClub.id;
                  const oppId = isUserHome ? fix.awayClubId : fix.homeClubId;
                  const oppClub = allClubs.find((c) => c.id === oppId);
                  const userScore = isUserHome ? fix.homeScore : fix.awayScore;
                  const oppScore = isUserHome ? fix.awayScore : fix.homeScore;
                  const isWin = (userScore || 0) > (oppScore || 0);
                  const isDraw = userScore === oppScore;

                  return (
                    <div
                      key={fix.id}
                      className="p-3 bg-[#040810] border border-zinc-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1.5">
                        <span>Hafta {fix.round}</span>
                        <span
                          className={`px-1.5 py-0.2 font-black uppercase text-[9px] ${
                            isWin
                              ? 'bg-emerald-950 text-[#00F5A0] border border-emerald-700'
                              : isDraw
                              ? 'bg-amber-950 text-amber-300 border border-amber-700'
                              : 'bg-red-950 text-red-300 border border-red-700'
                          }`}
                        >
                          {isWin ? 'GALİBİYET' : isDraw ? 'BERABERLİK' : 'MAĞLUBİYET'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between my-1">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          vs {oppClub?.name || 'Rakip'}
                        </span>
                        <span className="text-base font-black italic text-white font-mono">
                          {fix.homeScore} - {fix.awayScore}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-500 mt-1">
                        {formatDateTurkish(fix.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                Henüz tamamlanmış lig maçı bulunmamaktadır.
              </div>
            )}
          </div>

          {/* LİG TABLOSU ÖZETİ */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                  Alveria Elit Ligi Sıralaması
                </h3>
              </div>
              <Link
                href="/league"
                className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>PUAN DURUMU</span>
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
        </div>

        {/* Right Column: Gündem, Sakat/Cezalı, Hızlı Yönetim */}
        <div className="space-y-5">
          {/* GÜNDEM / GELEN KUTUSU */}
          <div className="p-5 bg-[#070B12] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                  Gelen Kutusu & Gündem
                </h3>
              </div>
              <Link
                href="/inbox"
                className="text-xs font-bold font-mono text-[#00F5A0] hover:underline"
              >
                TÜMÜ ({inboxMessages.length})
              </Link>
            </div>

            <div className="space-y-2">
              {unreadMessages.length > 0 ? (
                unreadMessages.map((msg) => (
                  <Link
                    key={msg.id}
                    href="/inbox"
                    className="block p-3 bg-[#040810] hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-mono">
                      <span className="font-bold text-white group-hover:text-[#00F5A0] transition-colors">
                        {msg.senderRole}
                      </span>
                      <span>{msg.date}</span>
                    </div>
                    <h5 className="text-xs font-bold text-zinc-200 truncate">{msg.subject}</h5>
                  </Link>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-zinc-500 font-mono flex flex-col items-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5 text-[#00F5A0]" />
                  <span>Okunmamış yeni bildiriminiz yok.</span>
                </div>
              )}
            </div>
          </div>

          {/* SAKAT VE CEZALI OYUNCU DURUMU */}
          <div className="p-5 bg-[#070B12] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
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
                <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                  Şu an sakat veya cezalı oyuncu bulunmamaktadır.
                </div>
              ) : (
                <>
                  {injuredPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-red-950/40 border border-red-800/60"
                    >
                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-red-300 font-mono">
                          {p.injuryDetails?.type || 'Sakatlık'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-red-900 text-red-200 border border-red-700">
                        {p.injuryDetails?.daysRemaining} gün
                      </span>
                    </div>
                  ))}

                  {suspendedPlayers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 bg-amber-950/40 border border-amber-800/60"
                    >
                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          {p.firstName} {p.lastName}
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono">
                          {p.suspensionDetails?.reason || 'Kart Cezası'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-amber-900 text-amber-200 border border-amber-700">
                        {p.suspensionDetails?.matchesRemaining} maç
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* DÜNYADAN HABERLER BÜLTENİ */}
          <div className="p-5 bg-[#070B12] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-[#00F5A0]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200 font-mono">
                  Lig Bülteni
                </h3>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">HABERLER</span>
            </div>

            <div className="space-y-2">
              {newsFeed.length > 0 ? (
                newsFeed.slice(0, 3).map((news) => (
                  <div
                    key={news.id}
                    className="p-2.5 bg-[#040810] border border-zinc-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span className="font-bold text-[#00F5A0]">{news.category}</span>
                      <span>{news.date}</span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug">{news.headline}</h5>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-zinc-500 font-mono">
                  Henüz kaydedilmiş lig haberi bulunmuyor.
                </div>
              )}
            </div>
          </div>

          {/* HIZLI KONTROL KÖPRÜLERİ */}
          <div className="grid grid-cols-3 gap-2.5">
            <Link
              href="/tactics"
              className="p-3 bg-[#070B12] hover:bg-zinc-900 border border-zinc-800 hover:border-[#00F5A0] text-center transition-all group"
            >
              <Swords className="w-4 h-4 text-[#00F5A0] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-black uppercase text-white">Taktik</div>
              <div className="text-[9px] font-mono text-zinc-500">DİZİLİŞ</div>
            </Link>

            <Link
              href="/transfers"
              className="p-3 bg-[#070B12] hover:bg-zinc-900 border border-zinc-800 hover:border-[#00F5A0] text-center transition-all group"
            >
              <Wallet className="w-4 h-4 text-[#00D4FF] mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-black uppercase text-white">Transfer</div>
              <div className="text-[9px] font-mono text-zinc-500">PAZARLIK</div>
            </Link>

            <Link
              href="/scouting"
              className="p-3 bg-[#070B12] hover:bg-zinc-900 border border-zinc-800 hover:border-[#00F5A0] text-center transition-all group"
            >
              <Compass className="w-4 h-4 text-amber-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-black uppercase text-white">Gözlem</div>
              <div className="text-[9px] font-mono text-zinc-500">SCOUT</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
