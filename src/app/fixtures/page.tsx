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
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Season End Summary Banner */}
      {seasonEndSummary && (
        <div className="bg-[#141005] border-2 border-amber-500 p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest font-mono">
              SEZON TAMAMLANDI
            </span>
            <h2 className="text-xl sm:text-2xl font-black italic uppercase text-white">
              Şampiyon: <span className="text-amber-400">{seasonEndSummary.championClubName}</span> 🏆
            </h2>
            <p className="text-xs text-zinc-300 font-medium">
              Kulübünüz sezonu <strong className="text-[#C7FF38]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) bitirdi.
            </p>
          </div>
          <button
            onClick={startNextSeasonRoll}
            className="px-6 py-3 bg-[#C7FF38] hover:bg-[#D9FF73] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
          >
            YENİ SEZONA BAŞLA
          </button>
        </div>
      )}

      {/* Broadcast Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#C7FF38]/10 text-[#C7FF38] border border-[#C7FF38]/30">
              // FIXTURE CALENDAR
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ALVERİA ELİT LİGİ • 2026/27 SEZONU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Calendar className="w-7 h-7 text-[#C7FF38]" />
            Maç Fikstürü & Sonuçlar
          </h1>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#080D1A] p-1.5 border border-zinc-800">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'ALL'
                ? 'bg-[#C7FF38] text-black border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Tüm Maçlar
          </button>
          <button
            onClick={() => setSelectedFilter('MY_CLUB')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'MY_CLUB'
                ? 'bg-[#C7FF38] text-black border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {userClub.code} Maçları
          </button>
          <button
            onClick={() => setSelectedFilter('PLAYED')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'PLAYED'
                ? 'bg-[#C7FF38] text-black border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Oynananlar
          </button>
          <button
            onClick={() => setSelectedFilter('UPCOMING')}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all ${
              selectedFilter === 'UPCOMING'
                ? 'bg-[#C7FF38] text-black border border-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
                <span className="px-3 py-1 font-mono font-black text-xs uppercase bg-[#080D1A] border-2 border-[#C7FF38]/60 text-[#C7FF38] tracking-wider">
                  HAFTA {roundNumber}
                </span>
                <div className="h-px flex-1 bg-zinc-800" />
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
