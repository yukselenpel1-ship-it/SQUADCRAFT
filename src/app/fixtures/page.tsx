'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { formatDateTurkish } from '@/lib/career';
import {
  Calendar,
  Swords,
  ChevronRight,
  Trophy,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function FixturesPage() {
  const {
    fixtures,
    allClubs,
    userClub,
    nextMatch,
    seasonYear,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MY_CLUB' | 'PLAYED' | 'UPCOMING'>('ALL');

  const getClub = (id: string) => allClubs.find((c) => c.id === id);

  const nextOpponent = useMemo(() => {
    if (!nextMatch) return null;
    const oppId = nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId;
    return getClub(oppId);
  }, [nextMatch, userClub.id, allClubs]);

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

  // Group by round
  const rounds = useMemo(() => {
    return Array.from(new Set(filteredFixtures.map((f) => f.round))).sort((a, b) => a - b);
  }, [filteredFixtures]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Fikstür yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Resmi Lig Fikstürü, Maç Sonuçları ve Karşılaşma Önizlemeleri"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* 2. SIRADAKİ MAÇ ÖNİZLEMESİ (SHOWCASE CARD) */}
      {nextMatch && nextOpponent && (
        <div className="rounded-2xl bg-gradient-to-r from-[#09151F] via-[#0A1822] to-[#071018] border border-[rgba(125,160,175,0.22)] p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(125,160,175,0.14)] mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40 text-[10px] font-black uppercase font-mono">
                SIRADAKİ MAÇ • HAFTA {nextMatch.round}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {formatDateTurkish(nextMatch.date)} • {nextMatch.time || '20:00'}
              </span>
            </div>

            <Link
              href={`/match/${nextMatch.id}`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black font-black text-xs uppercase tracking-wider transition shadow-[0_0_15px_rgba(101,245,107,0.3)] active:scale-95"
            >
              <span>Maç Merkezine Git</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-2">
            {/* Home */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-[#0D1C26] border border-zinc-800 flex items-center justify-center p-2 shadow-lg">
                <ClubBadge
                  code={nextMatch.homeClubId === userClub.id ? userClub.code : nextOpponent.code}
                  primaryColor={nextMatch.homeClubId === userClub.id ? userClub.primaryColor : nextOpponent.primaryColor}
                  secondaryColor={nextMatch.homeClubId === userClub.id ? userClub.secondaryColor : nextOpponent.secondaryColor}
                  size="lg"
                />
              </div>
              <h3 className="text-lg font-black uppercase text-white font-sans">
                {nextMatch.homeClubId === userClub.id ? userClub.name : nextOpponent.name}
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                {nextMatch.homeClubId === userClub.id ? 'Ev Sahibi (Kulübünüz)' : 'Ev Sahibi (Rakip)'}
              </span>
            </div>

            {/* VS & Comparison Bars */}
            <div className="space-y-2 text-center">
              <span className="text-2xl font-black italic text-zinc-500 font-mono">VS</span>
              <div className="space-y-1.5 text-xs font-mono pt-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>%58</span>
                  <span>Takım Gücü</span>
                  <span>%52</span>
                </div>
                <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-[#65F56B] w-[55%]" />
                  <div className="bg-amber-400 flex-1" />
                </div>
              </div>
            </div>

            {/* Away */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-[#0D1C26] border border-zinc-800 flex items-center justify-center p-2 shadow-lg">
                <ClubBadge
                  code={nextMatch.homeClubId === userClub.id ? nextOpponent.code : userClub.code}
                  primaryColor={nextMatch.homeClubId === userClub.id ? nextOpponent.primaryColor : userClub.primaryColor}
                  secondaryColor={nextMatch.homeClubId === userClub.id ? nextOpponent.secondaryColor : userClub.secondaryColor}
                  size="lg"
                />
              </div>
              <h3 className="text-lg font-black uppercase text-white font-sans">
                {nextMatch.homeClubId === userClub.id ? nextOpponent.name : userClub.name}
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">
                {nextMatch.homeClubId === userClub.id ? 'Deplasman (Rakip)' : 'Deplasman (Kulübünüz)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-[rgba(125,160,175,0.14)] pb-3 select-none">
        {[
          { id: 'ALL', label: 'Tüm Maçlar' },
          { id: 'MY_CLUB', label: 'Kulübümün Maçları' },
          { id: 'PLAYED', label: 'Oynananlar' },
          { id: 'UPCOMING', label: 'Gelecek Maçlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              selectedFilter === tab.id
                ? 'bg-[#65F56B] text-black font-black shadow-[0_0_12px_rgba(101,245,107,0.3)]'
                : 'bg-[#09141B] text-zinc-400 hover:text-white border border-[rgba(125,160,175,0.14)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. ROUND BY ROUND FIXTURE CARDS */}
      <div className="space-y-4">
        {rounds.map((round) => {
          const roundMatches = filteredFixtures.filter((f) => f.round === round);
          return (
            <div key={round} className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
                <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#65F56B]" />
                  Hafta {round}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {roundMatches.length} Karşılaşma
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roundMatches.map((fix) => {
                  const home = getClub(fix.homeClubId);
                  const away = getClub(fix.awayClubId);
                  const isUserClub = fix.homeClubId === userClub.id || fix.awayClubId === userClub.id;

                  return (
                    <div
                      key={fix.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isUserClub
                          ? 'bg-[#65F56B]/10 border-[#65F56B]/40 shadow-[0_0_12px_rgba(101,245,107,0.1)]'
                          : 'bg-[#0D1C26]/60 border-[rgba(125,160,175,0.1)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <ClubBadge
                          code={home?.code || 'SC'}
                          primaryColor={home?.primaryColor || '#FFF'}
                          secondaryColor={home?.secondaryColor || '#000'}
                          size="xs"
                        />
                        <span className={`text-xs font-bold truncate ${isUserClub && fix.homeClubId === userClub.id ? 'text-[#65F56B]' : 'text-white'}`}>
                          {home?.name || 'Ev'}
                        </span>
                      </div>

                      <div className="px-3 text-center shrink-0">
                        {fix.status === 'FINISHED' ? (
                          <div className="px-2.5 py-1 rounded bg-black/60 text-xs font-black text-white font-mono">
                            {fix.homeScore} - {fix.awayScore}
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-zinc-500">
                            {fix.time || '20:00'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end gap-2 flex-1 min-w-0 text-right">
                        <span className={`text-xs font-bold truncate ${isUserClub && fix.awayClubId === userClub.id ? 'text-[#65F56B]' : 'text-white'}`}>
                          {away?.name || 'Dep'}
                        </span>
                        <ClubBadge
                          code={away?.code || 'SC'}
                          primaryColor={away?.primaryColor || '#FFF'}
                          secondaryColor={away?.secondaryColor || '#000'}
                          size="xs"
                        />
                      </div>
                    </div>
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
