'use client';

import React, { useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { LeagueTable } from '@/components/league/LeagueTable';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { Trophy, Award, Flame, Shield, Users, ChevronRight, Swords, Sparkles, TrendingUp } from 'lucide-react';

export default function LeaguePage() {
  const {
    standings,
    allClubs,
    allPlayers,
    userClub,
    fixtures,
    nextMatch,
    seasonYear,
    seasonEndSummary,
    startNextSeasonRoll,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const getClub = (id: string) => allClubs.find((c) => c.id === id) || allClubs[0];

  // Top Scorers Leaderboard
  const topScorers = useMemo(() => {
    return [...allPlayers]
      .filter((p) => p.seasonStats && p.seasonStats.goals > 0)
      .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))
      .slice(0, 4);
  }, [allPlayers]);

  // Top Assists Leaderboard
  const topAssists = useMemo(() => {
    return [...allPlayers]
      .filter((p) => p.seasonStats && p.seasonStats.assists > 0)
      .sort((a, b) => (b.seasonStats?.assists || 0) - (a.seasonStats?.assists || 0))
      .slice(0, 4);
  }, [allPlayers]);

  // Next Matchday upcoming fixtures
  const upcomingRoundFixtures = useMemo(() => {
    const round = nextMatch?.round || 1;
    return fixtures.filter((f) => f.round === round).slice(0, 4);
  }, [fixtures, nextMatch]);

  // Best form club
  const bestFormClub = useMemo(() => {
    return [...standings].sort((a, b) => {
      const aWins = (a.form || []).filter((r) => r === 'W').length;
      const bWins = (b.form || []).filter((r) => r === 'W').length;
      return bWins - aWins;
    })[0];
  }, [standings]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="LİG MERKEZİ YÜKLENİYOR"
        message="Puan durumu, averaj tabloları ve haftalık fikstür derleniyor..."
      />
    );
  }

  return (
    <div className="sc-editorial-restyle space-y-5 px-4 sm:px-8 lg:px-12 py-6 pb-20 max-w-[1480px] mx-auto select-none animate-in fade-in duration-300">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#292622] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-ibm text-[11px] text-[#9b2529] tracking-widest uppercase font-semibold">
              LİG DOSYASI // ALVERIA ELİT LİGİ
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#65ff83] animate-pulse" />
          </div>
          <h1 className="font-barlow font-black text-[clamp(1.9rem,3.4vw,3.1rem)] text-[#292622] uppercase tracking-tight leading-[0.94] mt-3">
            SEZON {seasonYear || '2026/27'} · HAFTA {nextMatch?.round || 1}
          </h1>
        </div>

        {/* Qualification Legend */}
        <div className="flex flex-wrap items-center gap-2 font-ibm text-[11px] max-w-full">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#e8ded1] border border-[#cabeaf]">
            <span className="w-2 h-2 rounded-full bg-[#ffd34f]" />
            <span className="text-[#655b52]">Şampiyon (1.)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#e8ded1] border border-[#cabeaf]">
            <span className="w-2 h-2 rounded-full bg-[#21dfbd]" />
            <span className="text-[#655b52]">Kıtasal Kupa (2-3.)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#e8ded1] border border-[#cabeaf]">
            <span className="w-2 h-2 rounded-full bg-[#ff5365]" />
            <span className="text-[#655b52]">Düşme Hattı (9-10.)</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Standings (8 cols) + Varied Side Modules (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Official Standings Table */}
        <div className="lg:col-span-8 space-y-4">
          <LeagueTable
            standings={standings}
            clubs={allClubs}
            userClubId={userClub.id}
          />
        </div>

        {/* Right Column (4 cols): Varied Side Modules */}
        <div className="lg:col-span-4 space-y-5">
          {/* Module 1: Top Scorers (Golden Boot) */}
          <div className="p-5 rounded-sm bg-[#fffaf2] border border-[#d6cabb] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#d6cabb] pb-2.5">
              <span className="font-barlow font-extrabold text-[16px] text-[#9b2529] uppercase tracking-wide flex items-center gap-2">
                <Flame size={16} />
                TOP SCORERS
              </span>
              <span className="font-ibm text-[10px] text-[#655b52] uppercase">GOL</span>
            </div>

            <div className="space-y-2 font-ibm text-[12px]">
              {topScorers.length === 0 ? (
                <span className="text-[#655b52] text-[11px] block py-2">Henüz gol kaydı bulunmuyor.</span>
              ) : (
                topScorers.map((p, idx) => {
                  const club = getClub(p.clubId);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded bg-[#f4ece1] border border-[#e0d5c7]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-4 font-bold text-[#9b2529] text-[11px]">#{idx + 1}</span>
                        <div className="truncate">
                          <span className="font-bold text-[#171717] truncate block leading-none">
                            {p.firstName[0]}. {p.lastName}
                          </span>
                          <span className="text-[10px] text-[#655b52] truncate block mt-0.5">
                            {club.name}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#e8d5c4] text-[#9b2529] font-bold text-[12px]">
                        {p.seasonStats?.goals}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Module 2: Top Assists */}
          <div className="p-5 rounded-sm bg-[#fffaf2] border border-[#d6cabb] space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#d6cabb] pb-2.5">
              <span className="font-barlow font-extrabold text-[16px] text-[#9b2529] uppercase tracking-wide flex items-center gap-2">
                <Award size={16} />
                TOP ASSISTS
              </span>
              <span className="font-ibm text-[10px] text-[#655b52] uppercase">ASİST</span>
            </div>

            <div className="space-y-2 font-ibm text-[12px]">
              {topAssists.length === 0 ? (
                <span className="text-[#655b52] text-[11px] block py-2">Henüz asist kaydı bulunmuyor.</span>
              ) : (
                topAssists.map((p, idx) => {
                  const club = getClub(p.clubId);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded bg-[#f4ece1] border border-[#e0d5c7]"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-4 font-bold text-[#9b2529] text-[11px]">#{idx + 1}</span>
                        <div className="truncate">
                          <span className="font-bold text-[#171717] truncate block leading-none">
                            {p.firstName[0]}. {p.lastName}
                          </span>
                          <span className="text-[10px] text-[#655b52] truncate block mt-0.5">
                            {club.name}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#e8d5c4] text-[#9b2529] font-bold text-[12px]">
                        {p.seasonStats?.assists}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Module 3: Best Form Club */}
          {bestFormClub && (
            <div className="p-4 rounded-sm bg-[#fffaf2] border border-[#d6cabb] space-y-2">
              <div className="flex items-center justify-between border-b border-[#d6cabb] pb-2 font-ibm text-[10px] text-[#655b52] uppercase">
                <span className="flex items-center gap-1.5 text-[#9b2529] font-bold">
                  <TrendingUp size={14} />
                  BEST FORM CLUB
                </span>
                <span>ZİRVE TRENDİ</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <ClubBadge
                    code={getClub(bestFormClub.clubId).code}
                    name={getClub(bestFormClub.clubId).name}
                    clubId={bestFormClub.clubId}
                    primaryColor={getClub(bestFormClub.clubId).primaryColor}
                    secondaryColor={getClub(bestFormClub.clubId).secondaryColor}
                    size="xs"
                  />
                  <span className="font-barlow font-bold text-[15px] text-[#171717] uppercase">
                    {getClub(bestFormClub.clubId).name}
                  </span>
                </div>
                <div className="flex gap-1 font-ibm text-[10px] font-bold">
                  {(bestFormClub.form || []).slice(-4).map((r, i) => (
                    <span
                      key={i}
                      className={`px-1 rounded ${
                        r === 'W' ? 'bg-[#65ff83]/20 text-[#65ff83]' : 'bg-[#ffd34f]/20 text-[#9b2529]'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Module 4: Next Matchday Preview */}
          <div className="p-4 rounded-sm bg-[#fffaf2] border border-[#d6cabb] space-y-2">
            <div className="flex items-center justify-between border-b border-[#d6cabb] pb-2 font-ibm text-[10px] text-[#655b52] uppercase">
              <span className="flex items-center gap-1.5 text-[#171717] font-bold">
                <Swords size={14} className="text-[#9b2529]" />
                NEXT MATCHDAY CLASHES
              </span>
              <span>HAFTA {nextMatch?.round || 1}</span>
            </div>
            <div className="space-y-1.5 font-ibm text-[11px]">
              {upcomingRoundFixtures.map((f) => (
                <div key={f.id} className="flex justify-between p-1.5 rounded bg-[#f4ece1] text-[#655b52]">
                  <span className="truncate max-w-[120px] text-[#171717]">{getClub(f.homeClubId).name}</span>
                  <span className="text-[#9b2529] font-bold">vs</span>
                  <span className="truncate max-w-[120px] text-[#171717]">{getClub(f.awayClubId).name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
