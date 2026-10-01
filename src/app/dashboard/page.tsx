'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { StatCard } from '@/components/ui/StatCard';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { formatDateTurkish } from '@/lib/career';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import { Player, Formation } from '@/types/game';
import {
  Trophy,
  Swords,
  Users,
  Wallet,
  Calendar,
  Activity,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Sliders,
  DollarSign,
  PieChart,
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
    finances,
    tactics,
    allPlayers,
  } = useGame();

  // Guard: Only after full hydration, if neither active career nor any save exists, redirect to main menu
  useEffect(() => {
    if (isInitialized && isCareerHydrated && !hasActiveCareer && !hasSavedCareer && !hasCareerSave) {
      router.replace('/');
    }
  }, [isInitialized, isCareerHydrated, hasActiveCareer, hasSavedCareer, hasCareerSave, router]);

  const userStanding = standings.find((s) => s.clubId === userClub.id);

  // Next match opponent
  const nextOpponent = useMemo(() => {
    if (!nextMatch) return null;
    const oppId = nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId;
    return allClubs.find((c) => c.id === oppId);
  }, [nextMatch, userClub.id, allClubs]);

  // Squad Total Market Value
  const totalSquadValue = useMemo(() => {
    return userPlayers.reduce((sum, p) => sum + (p.marketValue || 0), 0);
  }, [userPlayers]);

  // Wage utilization
  const wageUsagePercent = useMemo(() => {
    const weekly = finances?.weeklyWages || 100000;
    const budget = finances?.wageBudget || 200000;
    return Math.min(100, Math.round((weekly / budget) * 100));
  }, [finances]);

  // Form (Last 5 matches)
  const formBadges = useMemo(() => {
    if (userStanding?.form && userStanding.form.length > 0) {
      return userStanding.form.slice(-5);
    }
    const recent = fixtures
      .filter((f) => (f.homeClubId === userClub.id || f.awayClubId === userClub.id) && f.status === 'FINISHED')
      .slice(-5);
    return recent.map((f) => {
      const isHome = f.homeClubId === userClub.id;
      const myScore = isHome ? (f.homeScore ?? 0) : (f.awayScore ?? 0);
      const oppScore = isHome ? (f.awayScore ?? 0) : (f.homeScore ?? 0);
      if (myScore > oppScore) return 'W';
      if (myScore === oppScore) return 'D';
      return 'L';
    });
  }, [userStanding, fixtures, userClub.id]);

  // Top In-form Players
  const inFormPlayers = useMemo(() => {
    return [...userPlayers]
      .sort((a, b) => (b.form || 7.0) - (a.form || 7.0))
      .slice(0, 5);
  }, [userPlayers]);

  // Recent 5 Finished Matches
  const recentFinishedMatches = useMemo(() => {
    return fixtures
      .filter((f) => (f.homeClubId === userClub.id || f.awayClubId === userClub.id) && f.status === 'FINISHED')
      .slice(-4)
      .reverse();
  }, [fixtures, userClub.id]);

  // Recommended Transfer Targets (outside user club)
  const transferTargets = useMemo(() => {
    return allPlayers
      .filter((p) => p.clubId !== userClub.id && p.overall >= 75)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 4);
  }, [allPlayers, userClub.id]);

  // Starting 11 on Pitch
  const starting11 = useMemo(() => {
    const formKey = (tactics?.formation || '4-3-3') as Formation;
    const slots = FORMATION_COORDINATES[formKey] || FORMATION_COORDINATES['4-3-3'];
    const lineup = tactics?.lineup || [];
    return slots.slice(0, 11).map((slot, idx) => {
      const assigned = lineup[idx];
      const player = assigned ? userPlayers.find((p) => p.id === assigned.playerId) : userPlayers[idx];
      return {
        slot,
        player,
      };
    });
  }, [tactics, userPlayers]);

  if (!isInitialized || !isCareerHydrated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin shadow-[0_0_12px_rgba(101,245,107,0.4)]" />
        <span className="text-[#65F56B] font-bold tracking-wider">Kariyer verileri senkronize ediliyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Season End Summary Banner (Conditional) */}
      {seasonEndSummary && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#0B151E] to-[#070D14] border border-amber-500/50 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest font-mono flex items-center gap-1.5 w-max">
              <Award className="w-3.5 h-3.5" />
              SEZON TAMAMLANDI
            </span>
            <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white font-sans">
              ŞAMPİYON: <span className="text-amber-400">{seasonEndSummary.championClubName}</span> 🏆
            </h2>
            <p className="text-xs text-zinc-300 font-medium">
              Kulübünüz <strong className="text-white">{userClub.name}</strong> sezonu{' '}
              <strong className="text-[#65F56B]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) tamamladı.
            </p>
          </div>
          <button
            onClick={startNextSeasonRoll}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>YENİ SEZONA BAŞLA</span>
          </button>
        </div>
      )}

      {/* Manager Contract Offer Banner (Conditional) */}
      {managerContract.status === 'OFFERED' && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#09141B] to-[#070D14] border border-amber-400/40 p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black uppercase tracking-widest font-mono">
              // SÖZLEŞME UZATMA TEKLİFİ
            </span>
            <h3 className="text-base font-black text-white uppercase font-sans">
              2 Yıllık Sözleşme Teklifi
            </h3>
            <p className="text-xs text-zinc-300">
              Yönetim haftalık maaşınızı{' '}
              <strong className="text-amber-400">€{(managerContract.offerSalary || 50000).toLocaleString('tr-TR')}</strong> seviyesine çıkarmak istiyor.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => respondToManagerContractOffer(true)}
              className="px-5 py-2.5 rounded-lg bg-[#65F56B] hover:bg-[#52e058] text-black font-black text-xs uppercase tracking-wider transition shadow-md active:scale-95"
            >
              Kabul Et
            </button>
            <button
              onClick={() => respondToManagerContractOffer(false)}
              className="px-4 py-2.5 rounded-lg bg-[#09141B] hover:bg-[#0E1E28] text-zinc-300 text-xs font-bold uppercase tracking-wider border border-[rgba(125,160,175,0.2)] transition active:scale-95"
            >
              Reddet
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Daha Büyük Hedeflere"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
        managerName={userClub.managerName}
      />

      {/* 2. TOP KPI ROW (5 METRICS AS IN REFERENCE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Kulüp Bütçesi"
          value={`€${(userClub.transferBudget / 1000000).toFixed(1)}M`}
          change="+12%"
          changeType="positive"
          subtext={`Sezon Başı: €${((userClub.transferBudget * 0.9) / 1000000).toFixed(1)}M`}
          icon={Wallet}
        />

        <StatCard
          label="Kadro Değeri"
          value={`€${(totalSquadValue / 1000000).toFixed(1)}M`}
          change="+8%"
          changeType="positive"
          subtext={`Lig'de ${userStanding?.rank || 5}. sırada`}
          icon={TrendingUp}
        />

        <StatCard
          label="Maaş Bütçesi"
          value={`€${((finances?.weeklyWages || 120000) / 1000).toFixed(0)}K / hf`}
          progressPercent={wageUsagePercent}
          subtext={`%${wageUsagePercent} kullanım`}
          icon={DollarSign}
        />

        <StatCard
          label="Son 5 Maç Formu"
          value={formBadges.join(' ')}
          customBadge={
            <div className="flex items-center gap-1.5 mt-1">
              {formBadges.map((f, i) => (
                <span
                  key={i}
                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black uppercase font-mono ${
                    f === 'W'
                      ? 'bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40 shadow-[0_0_8px_rgba(101,245,107,0.3)]'
                      : f === 'D'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {f === 'W' ? 'G' : f === 'D' ? 'B' : 'M'}
                </span>
              ))}
            </div>
          }
          icon={Activity}
        />

        <StatCard
          label="Kulüp İtibarı"
          value={`${((userClub.reputation || 82) / 10).toFixed(1)} / 10`}
          progressPercent={userClub.reputation || 82}
          subtext={`Süper Lig'de ${userStanding?.rank || 5}. sıra`}
          icon={Star}
        />
      </div>

      {/* 3. MAIN CARDS GRID (4 TILES AS IN REFERENCE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: SIRADAKİ MAÇ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <Swords className="w-3.5 h-3.5 text-[#65F56B]" />
              Sıradaki Maç
            </span>
            <span className="text-[10px] font-mono font-bold text-zinc-400">
              Süper Lig
            </span>
          </div>

          {nextMatch && nextOpponent ? (
            <div className="py-4 space-y-4 text-center">
              <div className="flex items-center justify-around gap-2">
                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0D1C26] border border-zinc-800 flex items-center justify-center p-1">
                    <ClubBadge
                      code={nextMatch.homeClubId === userClub.id ? userClub.code : nextOpponent.code}
                      primaryColor={nextMatch.homeClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                      secondaryColor={nextMatch.homeClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                      size="md"
                    />
                  </div>
                  <span className="text-xs font-black uppercase text-white truncate max-w-[90px]">
                    {nextMatch.homeClubId === userClub.id ? userClub.name : nextOpponent.name}
                  </span>
                  <div className="flex gap-0.5">
                    {['G', 'G', 'B', 'G', 'M'].map((f, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-xs text-[8px] font-mono font-bold bg-[#65F56B]/20 text-[#65F56B] flex items-center justify-center">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="text-sm font-black italic text-zinc-500 font-mono">VS</span>

                <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#0D1C26] border border-zinc-800 flex items-center justify-center p-1">
                    <ClubBadge
                      code={nextMatch.homeClubId === userClub.id ? nextOpponent.code : userClub.code}
                      primaryColor={nextMatch.homeClubId === userClub.id ? nextOpponent.primaryColor : userClub.primaryColor}
                      secondaryColor={nextMatch.homeClubId === userClub.id ? nextOpponent.secondaryColor : userClub.secondaryColor}
                      size="md"
                    />
                  </div>
                  <span className="text-xs font-black uppercase text-white truncate max-w-[90px]">
                    {nextMatch.homeClubId === userClub.id ? nextOpponent.name : userClub.name}
                  </span>
                  <div className="flex gap-0.5">
                    {['G', 'M', 'G', 'B', 'G'].map((f, i) => (
                      <span key={i} className="w-3.5 h-3.5 rounded-xs text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 flex items-center justify-center">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-[11px] font-mono text-zinc-400 space-y-0.5 pt-1">
                <div>{formatDateTurkish(nextMatch.date)} • {nextMatch.time || '20:00'}</div>
                <div className="text-zinc-500">{userClub.stadium}</div>
              </div>

              <Link
                href={`/match/${nextMatch.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black text-xs font-black uppercase tracking-wider transition shadow-[0_0_15px_rgba(101,245,107,0.25)] active:scale-95"
              >
                <span>Maç Önizlemesi</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500 font-mono">
              Fikstürde sıradaki maç bulunamadı.
            </div>
          )}
        </div>

        {/* CARD 2: LİG TABLOSU */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <Trophy className="w-3.5 h-3.5 text-[#65F56B]" />
              Lig Tablosu
            </span>
            <Link
              href="/league"
              className="text-[10px] font-mono font-bold text-[#65F56B] hover:underline flex items-center gap-1"
            >
              <span>Tüm Tablo</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="py-2 overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-zinc-500 text-[10px] border-b border-zinc-800/80">
                  <th className="py-1 text-left w-5">#</th>
                  <th className="py-1 text-left">Kulüp</th>
                  <th className="py-1 text-center w-6">O</th>
                  <th className="py-1 text-center w-7">AV</th>
                  <th className="py-1 text-right w-6 font-bold text-white">P</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {standings.slice(0, 6).map((s) => {
                  const isUser = s.clubId === userClub.id;
                  const club = allClubs.find((c) => c.id === s.clubId);
                  return (
                    <tr
                      key={s.clubId}
                      className={
                        isUser
                          ? 'bg-[#65F56B]/15 text-white font-bold border-l-2 border-[#65F56B]'
                          : 'text-zinc-300 hover:bg-[#0D1C26]'
                      }
                    >
                      <td className={`py-1.5 pl-1 ${isUser ? 'text-[#65F56B]' : 'text-zinc-500'}`}>
                        {s.rank}
                      </td>
                      <td className="py-1.5 truncate max-w-[110px]">
                        <div className="flex items-center gap-1.5">
                          <ClubBadge
                            code={club?.code || 'SC'}
                            primaryColor={club?.primaryColor || '#FFF'}
                            secondaryColor={club?.secondaryColor || '#000'}
                            size="xs"
                          />
                          <span className="truncate">{club?.name || s.clubId}</span>
                        </div>
                      </td>
                      <td className="py-1.5 text-center text-zinc-400">{s.played}</td>
                      <td className="py-1.5 text-center text-zinc-400">
                        {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                      </td>
                      <td className="py-1.5 text-right font-black text-white">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CARD 3: TAKTİK DİZİLİŞİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <Sliders className="w-3.5 h-3.5 text-[#65F56B]" />
              Taktik Dizilişi
            </span>
            <Link
              href="/tactics"
              className="text-[10px] font-mono font-bold text-[#65F56B] hover:underline flex items-center gap-1"
            >
              <span>Taktiği Düzenle</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="relative w-full h-44 rounded-xl bg-gradient-to-b from-[#0c2415] to-[#06140b] border border-[#65F56B]/30 overflow-hidden my-2">
            {/* Pitch Lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute inset-2 border border-white" />
              <div className="absolute top-1/2 left-2 right-2 h-px bg-white" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white" />
            </div>

            {/* Starting 11 Dots with OVR and Name */}
            {starting11.map((item, idx) => {
              if (!item.player) return null;
              return (
                <div
                  key={idx}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                  style={{ left: `${item.slot.x}%`, top: `${item.slot.y}%` }}
                >
                  <div className="w-5 h-5 rounded-full bg-black/90 border border-[#65F56B] flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                    {item.player.overall}
                  </div>
                  <span className="text-[7px] font-mono font-bold text-zinc-300 truncate max-w-[40px] drop-shadow-md">
                    {item.player.lastName}
                  </span>
                </div>
              );
            })}

            <div className="absolute bottom-2 left-3 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-[#65F56B] border border-[#65F56B]/30">
              {tactics?.formation || '4-3-3'}
            </div>
          </div>
        </div>

        {/* CARD 4: FORMDA OYUNCULAR */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <Flame className="w-3.5 h-3.5 text-[#65F56B]" />
              Formda Oyuncular
            </span>
            <Link
              href="/squad"
              className="text-[10px] font-mono font-bold text-[#65F56B] hover:underline flex items-center gap-1"
            >
              <span>Tüm Kadro</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2 py-1">
            {inFormPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-1.5 rounded-lg bg-[#0D1C26]/60 border border-[rgba(125,160,175,0.1)] hover:border-[rgba(125,160,175,0.3)] transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <PlayerPortrait player={player} size="xs" shape="circle" />
                  <div className="truncate">
                    <div className="text-xs font-black uppercase text-white truncate">
                      {player.firstName[0]}. {player.lastName}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-400">
                      {player.position} • Yaş {player.age}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 rounded bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40 text-[10px] font-black font-mono">
                    {player.form ? player.form.toFixed(1) : '7.8'}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    ⚽ {player.seasonStats?.goals || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. LOWER CONTENT ROW: RECENT RESULTS, TRANSFER TARGETS, TEAM ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ROW ITEM 1: SON MAÇ SONUÇLARI */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <Calendar className="w-3.5 h-3.5 text-[#65F56B]" />
              Son Maç Sonuçları
            </span>
            <Link
              href="/fixtures"
              className="text-[10px] font-mono font-bold text-[#65F56B] hover:underline flex items-center gap-1"
            >
              <span>Tüm Maçlar</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentFinishedMatches.length > 0 ? (
              recentFinishedMatches.map((fix) => {
                const isHome = fix.homeClubId === userClub.id;
                const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                const opp = allClubs.find((c) => c.id === oppId);
                const myScore = isHome ? fix.homeScore : fix.awayScore;
                const oppScore = isHome ? fix.awayScore : fix.homeScore;
                const isWin = (myScore ?? 0) > (oppScore ?? 0);
                const isDraw = myScore === oppScore;

                return (
                  <div
                    key={fix.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#0D1C26]/60 border border-[rgba(125,160,175,0.1)] text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClubBadge
                        code={opp?.code || 'SC'}
                        primaryColor={opp?.primaryColor || '#FFF'}
                        secondaryColor={opp?.secondaryColor || '#000'}
                        size="xs"
                      />
                      <span className="truncate text-white font-bold">{opp?.name || 'Rakip'}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-white">
                        {fix.homeScore} - {fix.awayScore}
                      </span>
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${
                          isWin
                            ? 'bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40'
                            : isDraw
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {isWin ? 'G' : isDraw ? 'B' : 'M'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                Henüz tamamlanmış maç yok.
              </div>
            )}
          </div>
        </div>

        {/* ROW ITEM 2: TRANSFER HEDEFLERİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <TrendingUp className="w-3.5 h-3.5 text-[#65F56B]" />
              Transfer Hedefleri
            </span>
            <Link
              href="/transfers"
              className="text-[10px] font-mono font-bold text-[#65F56B] hover:underline flex items-center gap-1"
            >
              <span>Tüm Liste</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {transferTargets.map((player, idx) => {
              const club = allClubs.find((c) => c.id === player.clubId);
              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0D1C26]/60 border border-[rgba(125,160,175,0.1)] hover:border-[rgba(125,160,175,0.3)] transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayerPortrait player={player} size="xs" shape="circle" />
                    <div className="truncate">
                      <div className="text-xs font-black uppercase text-white truncate">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-400 truncate">
                        {player.position} • {club?.name || 'Serbest'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-[#65F56B] font-mono">
                      €{(player.marketValue / 1000000).toFixed(1)}M
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400">
                      {idx === 0 ? 'Öncelik Yüksek' : 'Öncelik Orta'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROW ITEM 3: TAKIM ANALİTİĞİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white flex items-center gap-2 font-sans">
              <PieChart className="w-3.5 h-3.5 text-[#65F56B]" />
              Takım Analitiği
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Lig Ortalamasına Göre</span>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="p-2.5 rounded-xl bg-[#0D1C26]/80 border border-[rgba(125,160,175,0.1)]">
              <span className="text-[10px] font-mono text-zinc-400 block">Topa Sahip Olma</span>
              <div className="text-xl font-black italic text-white font-sans mt-0.5">%57</div>
              <span className="text-[9px] font-mono text-[#65F56B]">▲ Lig Ort. %49</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1C26]/80 border border-[rgba(125,160,175,0.1)]">
              <span className="text-[10px] font-mono text-zinc-400 block">Gol Beklentisi (xG)</span>
              <div className="text-xl font-black italic text-white font-sans mt-0.5">1.9</div>
              <span className="text-[9px] font-mono text-[#65F56B]">▲ Lig Ort. 1.4</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1C26]/80 border border-[rgba(125,160,175,0.1)]">
              <span className="text-[10px] font-mono text-zinc-400 block">Maç Başına Şut</span>
              <div className="text-xl font-black italic text-white font-sans mt-0.5">16.2</div>
              <span className="text-[9px] font-mono text-[#65F56B]">▲ Lig Ort. 11.8</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0D1C26]/80 border border-[rgba(125,160,175,0.1)]">
              <span className="text-[10px] font-mono text-zinc-400 block">Yenilen Gol Ort.</span>
              <div className="text-xl font-black italic text-white font-sans mt-0.5">0.8</div>
              <span className="text-[9px] font-mono text-[#65F56B]">▼ Lig Ort. 1.3</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SQUADCRAFT HABERLER TICKER */}
      <div className="rounded-xl bg-[#070D14] border border-[rgba(125,160,175,0.16)] px-4 py-2.5 flex items-center gap-3 overflow-hidden select-none">
        <span className="px-2 py-0.5 rounded bg-[#65F56B]/15 text-[#65F56B] border border-[#65F56B]/30 text-[10px] font-black uppercase font-mono tracking-widest shrink-0">
          SQUADCRAFT HABERLER
        </span>

        <div className="text-xs text-zinc-300 font-medium truncate flex-1 flex items-center gap-6">
          {newsFeed && newsFeed.length > 0 ? (
            newsFeed.slice(0, 3).map((item, idx) => (
              <span key={idx} className="truncate">
                • {item.headline || item.content}
              </span>
            ))
          ) : (
            <span className="truncate">
              • {userClub.name} yeni sezon hazırlıklarını tüm hızıyla sürdürüyor.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
