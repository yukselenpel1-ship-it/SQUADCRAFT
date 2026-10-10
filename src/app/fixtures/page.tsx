'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { FifaMatchReportModal } from '@/components/match/FifaMatchReportModal';
import { CareerPageHeader } from '@/components/career/CareerPageHeader';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { Fixture } from '@/types/game';
import {
  Calendar,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  Swords,
  Play,
  Trophy,
  AlertCircle,
  Eye,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function FixturesPage() {
  const router = useRouter();
  const {
    fixtures,
    allClubs,
    userClub,
    seasonEndSummary,
    startNextSeasonRoll,
    seasonYear,
    nextMatch,
    daysUntilNextMatch,
    isMatchDay,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MY_CLUB' | 'PLAYED' | 'UPCOMING'>('MY_CLUB');
  const [reportFixture, setReportFixture] = useState<Fixture | null>(null);

  const getClub = (id: string) => allClubs.find((c) => c.id === id) || allClubs[0];

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      if (selectedFilter === 'MY_CLUB') {
        return f.homeClubId === userClub.id || f.awayClubId === userClub.id;
      }
      if (selectedFilter === 'PLAYED') {
        return f.status === 'FINISHED';
      }
      if (selectedFilter === 'UPCOMING') {
        return f.status === 'SCHEDULED';
      }
      return true;
    });
  }, [fixtures, selectedFilter, userClub.id]);

  // Group fixtures into chronological Month / Stage blocks
  const monthlyTimeline = useMemo(() => {
    const groups: { month: string; round: number; fixtures: Fixture[] }[] = [];
    const sorted = [...filteredFixtures].sort((a, b) => a.round - b.round);

    // Group by round
    const rounds = Array.from(new Set(sorted.map((f) => f.round)));
    for (const r of rounds) {
      const roundFixtures = sorted.filter((f) => f.round === r);
      // Rough month mapping based on round
      const monthNames = ['AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK', 'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS'];
      const monthIdx = Math.min(monthNames.length - 1, Math.floor((r - 1) / 2));
      groups.push({
        month: monthNames[monthIdx] || 'AĞUSTOS',
        round: r,
        fixtures: roundFixtures,
      });
    }
    return groups;
  }, [filteredFixtures]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="FİKSTÜR TAKVİMİ YÜKLENİYOR"
        message="Sezon fikstürü, maç haftaları ve karşılaşma sonuçları derleniyor..."
      />
    );
  }

  // Next opponent info for featured strip
  const nextOpponent = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      ) || allClubs[1]
    : allClubs[1] || allClubs[0];

  const isUserHome = nextMatch ? nextMatch.homeClubId === userClub.id : true;

  const finishedMatchesCount = fixtures.filter(f => f.status === 'FINISHED').length;

  return (
    <div className="space-y-6 pb-28 lg:pb-12 select-none animate-in fade-in duration-300">
      {/* Broadcast Header HUD */}
      <CareerPageHeader
        badge={`CALENDAR & MATCH SCHEDULE // ${seasonYear || '2026/27'}`}
        title="SEASON TIMELINE"
        subtitle={`${userClub.name} lig fikstürü, maç sonuçları ve yaklaşan karşılaşmalar`}
        metrics={[
          { label: 'SEZON', value: seasonYear || '2026/27', accent: 'default' },
          { label: 'SIRADAKİ RAKİP', value: nextOpponent?.name || 'Rakip', accent: 'lime' },
          { label: 'OYNANAN MAÇ', value: `${finishedMatchesCount}`, accent: 'cyan' },
          { label: 'HAFTA', value: `W-${nextMatch?.round || 1}`, accent: 'gold' },
        ]}
      >
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 font-barlow font-bold text-[13px] uppercase tracking-wider">
          {[
            { id: 'MY_CLUB', label: 'KULÜBÜMÜZ' },
            { id: 'ALL', label: 'TÜM LİG' },
            { id: 'PLAYED', label: 'TAMAMLANAN' },
            { id: 'UPCOMING', label: 'GELECEK MAÇLAR' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer min-h-[42px] ${
                selectedFilter === tab.id
                  ? 'bg-[#B7FF3C] text-black font-black shadow-[0_0_18px_rgba(183,255,60,0.35)] scale-[1.02]'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </CareerPageHeader>

      {/* Featured Upcoming Match Cinematic Strip */}
      {nextMatch && (
        <div className="relative rounded-[8px] border border-white/15 bg-[#0d130f] p-6 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b8ff3d] via-[#21dfbd] to-transparent" />

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Match Kicker */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[4px] bg-[#b8ff3d]/10 border border-[#b8ff3d]/40 flex items-center justify-center text-[#b8ff3d]">
                <Swords size={24} />
              </div>
              <div>
                <span className="font-ibm text-[10px] text-[#b8ff3d] font-bold uppercase tracking-widest block">
                  FEATURED UPCOMING MATCH // {nextMatch.round}. HAFTA
                </span>
                <span className="font-barlow font-extrabold text-[24px] text-[#f3f6f3] uppercase tracking-wide leading-none mt-1 block">
                  {userClub.name} <span className="text-[#8f9a91] font-normal">vs</span> {nextOpponent.name}
                </span>
                <span className="font-ibm text-[11px] text-[#8f9a91] mt-1 block">
                  {isUserHome ? 'İç Saha' : 'Deplasman'} · {daysUntilNextMatch ?? 3} gün kaldı ·{' '}
                  {isUserHome ? userClub.stadium : nextOpponent.stadium}
                </span>
              </div>
            </div>

            {/* Badges Clash & CTA */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <ClubBadge
                  code={userClub.code}
                  name={userClub.name}
                  clubId={userClub.id}
                  primaryColor={userClub.primaryColor}
                  secondaryColor={userClub.secondaryColor}
                  size="md"
                />
                <span className="font-barlow font-extrabold text-[22px] text-outline-lime">VS</span>
                <ClubBadge
                  code={nextOpponent.code}
                  name={nextOpponent.name}
                  clubId={nextOpponent.id}
                  primaryColor={nextOpponent.primaryColor}
                  secondaryColor={nextOpponent.secondaryColor}
                  size="md"
                />
              </div>

              <button
                type="button"
                onClick={() => router.push(`/match/${nextMatch.id}`)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[3px] bg-[#b8ff3d] hover:bg-[#9bea27] text-[#050806] font-barlow font-extrabold text-[15px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(184,255,61,0.35)]"
              >
                <Play size={16} fill="currentColor" />
                <span>{isMatchDay ? 'MAÇA GİR' : 'MAÇ MERKEZİ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Season Timeline Architecture */}
      <div className="space-y-8 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-[2px] before:bg-white/10 before:z-0">
        {monthlyTimeline.map(({ month, round, fixtures: roundMatches }) => {
          const isCurrentRound = nextMatch?.round === round;

          return (
            <div key={round} className="relative z-10 space-y-4">
              {/* Round Timeline Header Node */}
              <div className="flex items-center gap-3 pl-1 sm:pl-3">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-ibm text-[11px] font-bold border-2 transition-all ${
                    isCurrentRound
                      ? 'bg-[#b8ff3d] text-[#050806] border-[#b8ff3d] shadow-[0_0_12px_#b8ff3d] animate-pulse'
                      : 'bg-[#090d0a] text-[#8f9a91] border-white/20'
                  }`}
                >
                  {round}
                </div>
                <div className="flex items-center gap-2 font-ibm">
                  <span className="font-barlow font-extrabold text-[18px] text-[#f3f6f3] tracking-wide uppercase">
                    HAFTA {round}
                  </span>
                  <span className="text-[11px] text-[#8f9a91]">· {month} 2026</span>
                  {isCurrentRound && (
                    <span className="px-2 py-0.5 rounded bg-[#b8ff3d] text-[#050806] text-[10px] font-bold uppercase font-ibm">
                      ŞİMDİKİ TUR
                    </span>
                  )}
                </div>
              </div>

              {/* Match Nodes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-8 sm:pl-12">
                {roundMatches.map((match) => {
                  const home = getClub(match.homeClubId);
                  const away = getClub(match.awayClubId);
                  const isUserMatch =
                    match.homeClubId === userClub.id || match.awayClubId === userClub.id;
                  const isFinished = match.status === 'FINISHED';

                  // Determine outcome for user
                  let outcomePill: { label: string; bg: string; color: string } | null = null;
                  if (isFinished && isUserMatch) {
                    const isHome = match.homeClubId === userClub.id;
                    const uScore = isHome ? match.homeScore ?? 0 : match.awayScore ?? 0;
                    const oScore = isHome ? match.awayScore ?? 0 : match.homeScore ?? 0;
                    if (uScore > oScore) {
                      outcomePill = { label: 'W', bg: 'bg-[#65ff83]/20', color: 'text-[#65ff83]' };
                    } else if (uScore === oScore) {
                      outcomePill = { label: 'D', bg: 'bg-[#ffd34f]/20', color: 'text-[#ffd34f]' };
                    } else {
                      outcomePill = { label: 'L', bg: 'bg-[#ff5365]/20', color: 'text-[#ff5365]' };
                    }
                  }

                  return (
                    <div
                      key={match.id}
                      onClick={() => {
                        if (isFinished) setReportFixture(match);
                        else router.push(`/match/${match.id}`);
                      }}
                      className={`p-4 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between ${
                        isUserMatch
                          ? 'bg-[#0d130f] border-[#b8ff3d]/40 hover:border-[#b8ff3d] shadow-lg'
                          : 'bg-[#090d0a] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between font-ibm text-[10px] text-[#8f9a91] pb-2 border-b border-white/5">
                        <span>{match.date ? new Date(match.date).toLocaleDateString('tr-TR') : 'Hafta Sonu'}</span>
                        {isFinished ? (
                          <span className="text-[#65ff83] font-bold">MS (BİTTİ)</span>
                        ) : (
                          <span className="text-[#21dfbd]">PROGRAMLANDI</span>
                        )}
                      </div>

                      {/* Teams & Score */}
                      <div className="my-3 space-y-2">
                        {/* Home Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClubBadge
                              code={home.code}
                              name={home.name}
                              clubId={home.id}
                              primaryColor={home.primaryColor}
                              secondaryColor={home.secondaryColor}
                              size="xs"
                            />
                            <span
                              className={`font-barlow font-bold text-[15px] uppercase ${
                                home.id === userClub.id ? 'text-[#b8ff3d]' : 'text-[#f3f6f3]'
                              }`}
                            >
                              {home.name}
                            </span>
                          </div>
                          <span className="font-ibm font-extrabold text-[16px] text-[#f3f6f3]">
                            {isFinished ? match.homeScore : '—'}
                          </span>
                        </div>

                        {/* Away Team */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClubBadge
                              code={away.code}
                              name={away.name}
                              clubId={away.id}
                              primaryColor={away.primaryColor}
                              secondaryColor={away.secondaryColor}
                              size="xs"
                            />
                            <span
                              className={`font-barlow font-bold text-[15px] uppercase ${
                                away.id === userClub.id ? 'text-[#b8ff3d]' : 'text-[#f3f6f3]'
                              }`}
                            >
                              {away.name}
                            </span>
                          </div>
                          <span className="font-ibm font-extrabold text-[16px] text-[#f3f6f3]">
                            {isFinished ? match.awayScore : '—'}
                          </span>
                        </div>
                      </div>

                      {/* Node Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/5 font-ibm text-[11px]">
                        {outcomePill ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded font-extrabold ${outcomePill.bg} ${outcomePill.color}`}
                            >
                              {outcomePill.label}
                            </span>
                            <span className="text-[#8f9a91]">SONUÇ</span>
                          </div>
                        ) : (
                          <span className="text-[#8f9a91]">
                            {isFinished ? 'MAÇ RAPORU' : 'ÖNİZLEME'}
                          </span>
                        )}

                        <span className="text-[#b8ff3d] hover:underline flex items-center gap-1 text-[11px]">
                          {isFinished ? 'RAPORU AÇ' : 'MAÇ MERKEZİ'}
                          <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Match Report Modal for Clicked Finished Matches */}
      {reportFixture && (
        <FifaMatchReportModal
          isOpen={true}
          onClose={() => setReportFixture(null)}
          homeClub={getClub(reportFixture.homeClubId)}
          awayClub={getClub(reportFixture.awayClubId)}
          homeScore={reportFixture.homeScore ?? 0}
          awayScore={reportFixture.awayScore ?? 0}
          round={reportFixture.round}
          matchDate={reportFixture.date}
        />
      )}
    </div>
  );
}
