'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { MatchCard } from '@/components/match/MatchCard';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { Calendar, Filter, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

export default function FixturesPage() {
  const { fixtures, allClubs, userClub, seasonEndSummary, startNextSeasonRoll, seasonYear, isCareerHydrated, isInitialized } = useGame();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MY_CLUB' | 'PLAYED' | 'UPCOMING'>('ALL');

  const getClub = (id: string) => allClubs.find((c) => c.id === id);

  const filteredFixtures = fixtures.filter((f) => {
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

  // Group by round
  const rounds = Array.from(new Set(filteredFixtures.map((f) => f.round))).sort((a, b) => a - b);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#040814] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Season End Summary Banner */}
      {seasonEndSummary && (
        <div className="sc-panel rounded-2xl border-2 border-amber-500 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest font-mono">
              SEZON TAMAMLANDI
            </span>
            <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white">
              Şampiyon: <span className="text-amber-400">{seasonEndSummary.championClubName}</span> 🏆
            </h2>
            <p className="text-xs text-zinc-300 font-medium">
              Kulübünüz sezonu <strong className="text-[#00F5A0]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) bitirdi.
            </p>
          </div>
          <button
            onClick={startNextSeasonRoll}
            className="px-6 py-3 rounded-xl bg-[#00F5A0] hover:bg-[#00D68B] text-[#040814] font-black text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
          >
            YENİ SEZONA BAŞLA
          </button>
        </div>
      )}

      {/* Broadcast Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#14233A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
              // FIXTURE CALENDAR
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ALVERİA ELİT LİGİ • 2026/27 SEZONU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#00F5A0]" />
            Maç Fikstürü & Sonuçlar
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 sc-panel rounded-2xl p-1.5 border border-[#14233A]">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-[#00F5A0] text-[#040814] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1A2E]'
            }`}
          >
            Tüm Maçlar
          </button>
          <button
            onClick={() => setSelectedFilter('MY_CLUB')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'MY_CLUB'
                ? 'bg-[#00F5A0] text-[#040814] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1A2E]'
            }`}
          >
            {userClub.code} Maçları
          </button>
          <button
            onClick={() => setSelectedFilter('PLAYED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'PLAYED'
                ? 'bg-[#00F5A0] text-[#040814] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1A2E]'
            }`}
          >
            Oynananlar
          </button>
          <button
            onClick={() => setSelectedFilter('UPCOMING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'UPCOMING'
                ? 'bg-[#00F5A0] text-[#040814] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1A2E]'
            }`}
          >
            Gelecek Maçlar
          </button>
        </div>
      </div>

      {/* Rounds & Fixture Cards List */}
      <div className="space-y-8">
        {rounds.map((roundNumber) => {
          const roundFixtures = filteredFixtures.filter((f) => f.round === roundNumber);

          return (
            <div key={roundNumber} className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-xl font-mono font-black text-xs uppercase bg-[#07101C] border border-[#00F5A0]/40 text-[#00F5A0] tracking-wider shadow-[0_0_10px_rgba(0,245,160,0.2)]">
                  HAFTA {roundNumber}
                </span>
                <div className="h-px flex-1 bg-[#14233A]" />
                <span className="text-[11px] font-mono text-zinc-500 uppercase">
                  {roundFixtures.length} KARŞILAŞMA
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roundFixtures.map((fixture) => {
                  const home = getClub(fixture.homeClubId);
                  const away = getClub(fixture.awayClubId);
                  const isUserMatch =
                    fixture.homeClubId === userClub.id || fixture.awayClubId === userClub.id;

                  return (
                    <MatchCard
                      key={fixture.id}
                      fixture={fixture}
                      homeClub={home}
                      awayClub={away}
                      highlight={isUserMatch}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
