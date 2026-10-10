'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { CareerPageHeader } from '@/components/career/CareerPageHeader';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { formatDateTurkish } from '@/lib/career';
import {
  Trophy,
  Swords,
  Inbox,
  ArrowRight,
  Activity,
  Wallet,
  CheckCircle2,
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
  Clock,
  Play,
  HeartPulse,
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
  const { language } = useLanguage();
  const isTR = language === 'tr';

  // Guard: Only after full hydration, if neither active career nor save exists, return to root
  useEffect(() => {
    if (isInitialized && isCareerHydrated && !hasActiveCareer && !hasSavedCareer && !hasCareerSave) {
      router.replace('/');
    }
  }, [isInitialized, isCareerHydrated, hasActiveCareer, hasSavedCareer, hasCareerSave, router]);

  // League standing & nearby teams
  const userStanding = standings.find((s) => s.clubId === userClub?.id);
  const currentRank = userStanding?.rank || 3;
  const currentPoints = userStanding?.points || 26;

  // Nearby teams (rank - 1, user, rank + 1)
  const nearbyStandings = useMemo(() => {
    if (!standings || standings.length === 0) return [];
    const sorted = [...standings].sort((a, b) => a.rank - b.rank);
    const userIndex = sorted.findIndex((s) => s.clubId === userClub?.id);
    if (userIndex === -1) return sorted.slice(0, 3);
    const start = Math.max(0, userIndex - 1);
    const end = Math.min(sorted.length, start + 3);
    return sorted.slice(start, end);
  }, [standings, userClub?.id]);

  // Next match opponent details
  const nextOpponent = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub?.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      ) || allClubs[1]
    : allClubs[1] || allClubs[0];

  const isUserHome = nextMatch ? nextMatch.homeClubId === userClub?.id : true;

  // Recent team form from finished fixtures
  const recentForm = useMemo(() => {
    const userFixtures = (fixtures || [])
      .filter(
        (f) =>
          f.status === 'FINISHED' &&
          (f.homeClubId === userClub?.id || f.awayClubId === userClub?.id)
      )
      .slice(-5);

    if (userFixtures.length === 0) {
      return [
        { res: 'W', score: '3-1' },
        { res: 'W', score: '2-0' },
        { res: 'D', score: '1-1' },
        { res: 'W', score: '4-2' },
        { res: 'L', score: '0-1' },
      ];
    }

    return userFixtures.map((f) => {
      const isHome = f.homeClubId === userClub?.id;
      const userScore = isHome ? f.homeScore ?? 0 : f.awayScore ?? 0;
      const oppScore = isHome ? f.awayScore ?? 0 : f.homeScore ?? 0;
      let res: 'W' | 'D' | 'L' = 'D';
      if (userScore > oppScore) res = 'W';
      else if (userScore < oppScore) res = 'L';
      return { res, score: `${userScore}-${oppScore}` };
    });
  }, [fixtures, userClub?.id]);

  // Average squad condition
  const avgFitness = Math.round(
    (userPlayers || []).reduce((acc, p) => acc + (p.fitness || 90), 0) / (userPlayers?.length || 1)
  );
  const avgMorale = Math.round(
    (userPlayers || []).reduce((acc, p) => acc + (p.morale || 85), 0) / (userPlayers?.length || 1)
  );
  const avgSharpness = Math.round(
    (userPlayers || []).reduce((acc, p) => acc + (p.matchSharpness || 80), 0) / (userPlayers?.length || 1)
  );

  // Development spotlight player (highest potential young player)
  const prospectPlayer = useMemo(() => {
    if (!userPlayers || userPlayers.length === 0) return null;
    return (
      [...userPlayers]
        .filter((p) => p.age <= 23)
        .sort((a, b) => b.potential - a.potential)[0] ||
      userPlayers[0]
    );
  }, [userPlayers]);

  // Latest 3 inbox messages
  const latestMessages = (inboxMessages || []).slice(0, 3);

  if (!isInitialized || !isCareerHydrated) {
    return (
      <CareerLoadingState
        title={isTR ? 'KOMUTA MERKEZİ BAĞLANIYOR' : 'CONNECTING TO COMMAND CENTER'}
        message={isTR ? 'Kariyer ve lig veritabanı senkronize ediliyor...' : 'Synchronizing career and league databases...'}
      />
    );
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-12 select-none animate-in fade-in duration-300">
      {/* Broadcast Page Header */}
      <CareerPageHeader
        badge={isTR ? `KOMUTA MERKEZİ // SEZON ${seasonNumber || 1}` : `COMMAND CENTER // SEASON ${seasonNumber || 1}`}
        title={isTR ? 'YÖNETİM MERKEZİ' : 'MANAGER CENTRAL'}
        subtitle={isTR ? `${userClub.name} kulübü menajerlik odası ve canlı maç hazırlıkları` : `${userClub.name} club management suite and live match preparation`}
        metrics={[
          { label: isTR ? 'KULÜP' : 'CLUB', value: userClub.name, accent: 'default' },
          { label: isTR ? 'MENAJER' : 'MANAGER', value: userClub.managerName || 'Steve', accent: 'lime' },
          { label: isTR ? 'LİG SIRASI' : 'RANK', value: `#${currentRank}`, accent: 'cyan' },
          { label: isTR ? 'PUAN' : 'PTS', value: currentPoints, accent: 'gold' },
        ]}
      />

      {/* Season End Summary Banner (if season finished) */}
      {seasonEndSummary && (
        <div className="p-6 rounded-[8px] bg-[#ffd34f]/10 border-2 border-[#ffd34f] flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="px-2 py-0.5 rounded bg-[#ffd34f] text-[#050806] font-ibm text-[10px] font-black uppercase">
              SEZON TAMAMLANDI
            </span>
            <h2 className="font-barlow font-extrabold text-[24px] text-[#f3f6f3] uppercase mt-1">
              Şampiyon: {seasonEndSummary.championClubName} 🏆
            </h2>
            <p className="font-inter text-[13px] text-[#8f9a91]">
              Kulübünüz sezonu {seasonEndSummary.userClubRank}. sırada ({seasonEndSummary.userClubPoints} Puan) bitirdi.
            </p>
          </div>
          <button
            onClick={startNextSeasonRoll}
            className="px-6 py-2.5 rounded-[3px] bg-[#b8ff3d] hover:bg-[#9bea27] text-[#050806] font-barlow font-bold text-[15px] uppercase tracking-wider cursor-pointer shadow-lg"
          >
            YENİ SEZONA GEÇ
          </button>
        </div>
      )}

      {/* Contract Offer Notification (if pending) */}
      {managerContract?.status === 'OFFERED' && (
        <div className="p-4 rounded-[6px] bg-[#21dfbd]/15 border border-[#21dfbd] flex items-center justify-between gap-4 font-ibm text-[12px]">
          <div className="flex items-center gap-3">
            <Sparkles className="text-[#21dfbd]" size={20} />
            <div>
              <span className="text-[#21dfbd] font-bold uppercase block">YENİ SÖZLEŞME TEKLİFİ</span>
              <span className="text-[#f3f6f3]">
                Yönetim kurulu {managerContract.offerYears || 2} yıllık yeni kontrat teklif etti.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => respondToManagerContractOffer(true)}
              className="px-4 py-1.5 rounded bg-[#b8ff3d] text-[#050806] font-bold uppercase cursor-pointer"
            >
              İMZALA
            </button>
            <button
              onClick={() => respondToManagerContractOffer(false)}
              className="px-3 py-1.5 rounded bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3] uppercase cursor-pointer"
            >
              REDDET
            </button>
          </div>
        </div>
      )}

      {/* Asymmetrical Sports Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================================================================== */}
        {/* Left Column (8 cols): Primary Cinematic Fixture + Tactical Vitals    */}
        {/* ==================================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Feature: NEXT MATCH CLASH CARD */}
          <div className="relative rounded-2xl border border-white/10 bg-[#0B131E]/80 backdrop-blur-xl p-6 sm:p-8 overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.6)]">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B7FF3C] via-[#38D8FF] to-transparent" />

            {/* Match Header Tag */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6 font-ibm text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-ping" />
                <span className="text-[#B7FF3C] uppercase font-bold tracking-widest">
                  {isTR ? 'SIRADAKİ MAÇ // LİG KARŞILAŞMASI' : 'NEXT MATCH // LEAGUE FIXTURE'}
                </span>
              </div>
              <span className="text-zinc-400 font-mono">
                {daysUntilNextMatch !== null
                  ? daysUntilNextMatch === 0
                    ? (isTR ? 'BUGÜN' : 'TODAY')
                    : (isTR ? `${daysUntilNextMatch} GÜN KALDI` : `${daysUntilNextMatch} DAYS LEFT`)
                  : (isTR ? 'YAKINDA' : 'SOON')} · {userClub.stadium || 'Polar Stadyumu'}
              </span>
            </div>

            {/* Club Clash Presentation */}
            <div className="grid grid-cols-3 items-center text-center my-4">
              {/* Home Club */}
              <div className="flex flex-col items-center">
                <div className="transform transition-transform hover:scale-105 duration-300">
                  <ClubBadge
                    code={isUserHome ? userClub.code : nextOpponent.code}
                    name={isUserHome ? userClub.name : nextOpponent.name}
                    clubId={isUserHome ? userClub.id : nextOpponent.id}
                    primaryColor={isUserHome ? userClub.primaryColor : nextOpponent.primaryColor}
                    secondaryColor={isUserHome ? userClub.secondaryColor : nextOpponent.secondaryColor}
                    size="xl"
                  />
                </div>
                <span className="font-barlow font-extrabold text-[20px] sm:text-[24px] text-white uppercase tracking-wider mt-3 block leading-tight">
                  {isUserHome ? userClub.name : nextOpponent.name}
                </span>
                <span className="font-ibm text-[11px] text-zinc-400 mt-1">
                  {isUserHome ? (isTR ? 'EV SAHİBİ' : 'HOME') : (isTR ? 'DEPLASMAN' : 'AWAY')}
                </span>
              </div>

              {/* Center VS Clash */}
              <div className="flex flex-col items-center justify-center">
                <span className="font-barlow font-extrabold text-[48px] sm:text-[64px] text-outline-lime leading-none">
                  VS
                </span>
                <span className="font-ibm text-[11px] text-[#38D8FF] bg-[#38D8FF]/10 px-2.5 py-0.5 rounded uppercase mt-2 font-bold border border-[#38D8FF]/20">
                  {isTR ? 'HAFTANIN MAÇI' : 'MATCH OF THE WEEK'}
                </span>
              </div>

              {/* Away Club */}
              <div className="flex flex-col items-center">
                <div className="transform transition-transform hover:scale-105 duration-300">
                  <ClubBadge
                    code={!isUserHome ? userClub.code : nextOpponent.code}
                    name={!isUserHome ? userClub.name : nextOpponent.name}
                    clubId={!isUserHome ? userClub.id : nextOpponent.id}
                    primaryColor={!isUserHome ? userClub.primaryColor : nextOpponent.primaryColor}
                    secondaryColor={!isUserHome ? userClub.secondaryColor : nextOpponent.secondaryColor}
                    size="xl"
                  />
                </div>
                <span className="font-barlow font-extrabold text-[20px] sm:text-[24px] text-white uppercase tracking-wider mt-3 block leading-tight">
                  {!isUserHome ? userClub.name : nextOpponent.name}
                </span>
                <span className="font-ibm text-[11px] text-zinc-400 mt-1">
                  {!isUserHome ? (isTR ? 'EV SAHİBİ' : 'HOME') : (isTR ? 'DEPLASMAN' : 'AWAY')}
                </span>
              </div>
            </div>

            {/* Clash Bottom Action */}
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="font-ibm text-[11px] text-zinc-400">
                {isTR ? 'BEKLENEN GOL (xG):' : 'EXPECTED GOALS (xG):'} <span className="text-[#B7FF3C] font-bold">1.84</span> vs{' '}
                <span className="text-[#38D8FF] font-bold">1.22</span>
              </div>

              <Link
                href={nextMatch ? `/match/${nextMatch.id}` : '/fixtures'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3 rounded-xl bg-[#B7FF3C] hover:bg-[#c6ff5e] text-black font-barlow font-black text-[16px] uppercase tracking-wider transition-all shadow-[0_0_24px_rgba(183,255,60,0.4)] hover:scale-[1.02] active:scale-95"
              >
                <Play size={16} fill="currentColor" />
                <span>{isTR ? 'MAÇ MERKEZİ' : 'MATCH CENTER'}</span>
              </Link>
            </div>
          </div>

          {/* Secondary Row (2 modules: Squad Condition + Team Form) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Module 1: Squad Condition Radials */}
            <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide">
                  {isTR ? 'KADRO KONDİSYON VE MORAL' : 'SQUAD CONDITION'}
                </span>
                <Activity size={18} className="text-[#B7FF3C]" />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-barlow font-bold text-[10px] text-zinc-400 uppercase block mb-1">
                    {isTR ? 'KONDİSYON' : 'FITNESS'}
                  </span>
                  <span className="font-barlow font-black text-[26px] text-[#B7FF3C] leading-none">
                    {avgFitness}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-barlow font-bold text-[10px] text-zinc-400 uppercase block mb-1">
                    {isTR ? 'MORAL' : 'MORALE'}
                  </span>
                  <span className="font-barlow font-black text-[26px] text-[#38D8FF] leading-none">
                    {avgMorale}%
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-barlow font-bold text-[10px] text-zinc-400 uppercase block mb-1">
                    {isTR ? 'MAÇ RİTMİ' : 'SHARPNESS'}
                  </span>
                  <span className="font-barlow font-black text-[26px] text-[#FFC84A] leading-none">
                    {avgSharpness}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-[11px] text-zinc-400">
                <span>{isTR ? 'SAKATLIK RAPORU:' : 'INJURY REPORT:'}</span>
                <span className="text-[#B7FF3C] font-bold">{isTR ? 'TAM KADRO HAZIR' : 'FULL SQUAD AVAILABLE'}</span>
              </div>
            </div>

            {/* Module 2: Sequential Team Form Record */}
            <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide">
                    {isTR ? 'TAKIM FORMU & PERFORMANS' : 'TEAM FORM TREND'}
                  </span>
                  <TrendingUp size={18} className="text-[#38D8FF]" />
                </div>

                <div className="flex gap-2 my-4">
                  {recentForm.map((f, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5 animate-in fade-in"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <span
                        className={`font-barlow font-black text-[18px] ${
                          f.res === 'W'
                            ? 'text-[#B7FF3C]'
                            : f.res === 'D'
                            ? 'text-[#FFC84A]'
                            : 'text-[#FF4D5F]'
                        }`}
                      >
                        {f.res}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400 mt-1">{f.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="font-mono text-[11px] text-zinc-400">
                {isTR ? 'YENİLMEZLİK SERİSİ:' : 'UNBEATEN RUN:'} <span className="text-[#B7FF3C] font-bold">{isTR ? '4 MAÇ' : '4 MATCHES'}</span>
              </div>
            </div>
          </div>

          {/* Module 3: Club News Editorial Feed */}
          <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide">
                {isTR ? 'KULÜP HABERLERİ & YAYIN' : 'CLUB NEWS & BROADCAST'}
              </span>
              <Newspaper size={18} className="text-zinc-400" />
            </div>

            <div className="space-y-3 font-mono text-[12px]">
              {(newsFeed || []).slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-start justify-between gap-4 hover:border-white/20 transition-colors"
                >
                  <div>
                    <span className="font-barlow font-bold text-[14px] text-white block mb-1">{item.headline}</span>
                    <p className="text-[12px] text-zinc-400 font-sans leading-relaxed">{item.content}</p>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Right Column (4 cols): League Standings, Prospect Spotlight, Inbox   */}
        {/* ==================================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Module 1: League Status & Nearby Teams */}
          <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide block leading-none">
                  {isTR ? 'LİG SIRALAMASI' : 'LEAGUE POSITION'}
                </span>
                <span className="font-mono text-[10px] text-zinc-400 uppercase mt-1 block">
                  ALVERIA ELİT LİGİ
                </span>
              </div>
              <span className="font-barlow font-black text-[38px] text-[#B7FF3C] leading-none drop-shadow-[0_0_12px_rgba(183,255,60,0.3)]">
                0{currentRank}
              </span>
            </div>

            {/* Nearby Standings Table */}
            <div className="space-y-2 font-mono text-[12px]">
              {nearbyStandings.map((s) => {
                const isUser = s.clubId === userClub.id;
                const club = allClubs.find((c) => c.id === s.clubId) || userClub;

                return (
                  <div
                    key={s.clubId}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                      isUser
                        ? 'bg-[#B7FF3C]/10 border border-[#B7FF3C]/40 text-white font-bold shadow-[0_0_15px_rgba(183,255,60,0.1)]'
                        : 'bg-white/[0.02] border border-white/5 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-5 text-center font-bold ${isUser ? 'text-[#B7FF3C]' : 'text-zinc-500'}`}>{s.rank}</span>
                      <span className="truncate">{isUser ? (isTR ? 'SEN // ' : 'YOU // ') + club.name : club.name}</span>
                    </div>
                    <span className="font-bold">{s.points} {isTR ? 'PUAN' : 'PTS'}</span>
                  </div>
                );
              })}
            </div>

            <Link
              href="/league"
              className="inline-flex items-center gap-1.5 text-[11px] font-barlow font-bold uppercase tracking-wider text-[#B7FF3C] hover:underline pt-2"
            >
              <span>{isTR ? 'TAM LİG TABLOSUNU GÖRÜNTÜLE' : 'VIEW FULL STANDINGS'}</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Module 2: Development Spotlight */}
          {prospectPlayer && (
            <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide">
                  {isTR ? 'ÖNE ÇIKAN GENÇ YETENEK' : 'DEVELOPMENT SPOTLIGHT'}
                </span>
                <Sparkles size={18} className="text-[#38D8FF]" />
              </div>

              <div className="flex items-center gap-3.5">
                <PlayerPortrait
                  player={prospectPlayer}
                  size="md"
                />
                <div>
                  <span className="font-barlow font-black text-[18px] text-white uppercase block leading-none">
                    {prospectPlayer.firstName} {prospectPlayer.lastName}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400 mt-1 block">
                    {prospectPlayer.position} · {prospectPlayer.age} {isTR ? 'YAŞ' : 'YRS'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
                <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-zinc-400 block text-[9px] uppercase">
                    {isTR ? 'GÜÇ (OVR)' : 'RATING'}
                  </span>
                  <span className="font-bold text-white text-[16px]">{prospectPlayer.overall}</span>
                </div>
                <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-zinc-400 block text-[9px] uppercase">
                    {isTR ? 'POTANSİYEL' : 'POTENTIAL'}
                  </span>
                  <span className="font-bold text-[#B7FF3C] text-[16px]">{prospectPlayer.potential}</span>
                </div>
                <div className="p-2.5 bg-white/[0.03] rounded-xl border border-white/5">
                  <span className="text-zinc-400 block text-[9px] uppercase">
                    {isTR ? 'GELİŞİM' : 'GROWTH'}
                  </span>
                  <span className="font-bold text-[#38D8FF] text-[16px]">+3 OVR</span>
                </div>
              </div>
            </div>
          )}

          {/* Module 3: Inbox Intelligence */}
          <div className="p-6 rounded-2xl bg-[#0B131E]/80 backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-barlow font-black text-[18px] text-white uppercase tracking-wide">
                {isTR ? 'GELEN KUTUSU İSTİHBARATI' : 'INBOX INTELLIGENCE'}
              </span>
              <Inbox size={18} className="text-[#38D8FF]" />
            </div>

            <div className="space-y-2.5 font-mono text-[11px]">
              {latestMessages.map((msg) => (
                <Link
                  key={msg.id}
                  href="/inbox"
                  className="block p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#B7FF3C]/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#B7FF3C] font-bold truncate max-w-[180px]">
                      {msg.senderName}
                    </span>
                    <span className="text-[10px] text-zinc-500">{msg.date}</span>
                  </div>
                  <span className="text-white font-medium block truncate">
                    {msg.subject}
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/inbox"
              className="inline-flex items-center gap-1.5 text-[11px] font-barlow font-bold uppercase tracking-wider text-[#38D8FF] hover:underline pt-1"
            >
              <span>{isTR ? 'GELEN KUTUSUNA GİT' : 'GO TO INBOX'}</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
