'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGame } from '@/lib/context/GameContext';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { formatDateTurkish } from '@/lib/career';
import {
  Trophy,
  Award,
  Calendar,
  Flame,
  Shield,
  Users,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Newspaper,
  CheckCircle2,
} from 'lucide-react';

export default function LeaguePage() {
  const {
    standings,
    allClubs,
    allPlayers,
    userClub,
    fixtures,
    newsFeed,
    seasonEndSummary,
    startNextSeasonRoll,
    isCareerHydrated,
    isInitialized,
    seasonYear,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'overview' | 'league' | 'cup' | 'supercup'>('overview');

  const getClub = (id: string) => allClubs.find((c) => c.id === id);

  // Top Scorers
  const topScorers = useMemo(() => {
    return [...allPlayers]
      .filter((p) => p.seasonStats && p.seasonStats.goals > 0)
      .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))
      .slice(0, 5);
  }, [allPlayers]);

  // Top Assists
  const topAssists = useMemo(() => {
    return [...allPlayers]
      .filter((p) => p.seasonStats && p.seasonStats.assists > 0)
      .sort((a, b) => (b.seasonStats?.assists || 0) - (a.seasonStats?.assists || 0))
      .slice(0, 5);
  }, [allPlayers]);

  // Upcoming Matches
  const upcomingMatches = useMemo(() => {
    return fixtures.filter((f) => f.status === 'SCHEDULED').slice(0, 4);
  }, [fixtures]);

  // Recent Results
  const recentResults = useMemo(() => {
    return fixtures.filter((f) => f.status === 'FINISHED').slice(-4).reverse();
  }, [fixtures]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Lig verileri yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName="Alveria Elit Ligi"
        clubCode="ALV"
        primaryColor="#65F56B"
        secondaryColor="#09141B"
        tagline="1. Kademe Ulusal Lig • 10 Kulüp • 18 Hafta"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="1959"
        location="Ulusal Lig Yönetimi"
        stadiumName="Merkez Stadyumu"
        capacity="55.000"
      />

      {/* 2. TABS BAR */}
      <div className="flex items-center gap-2 border-b border-[rgba(125,160,175,0.14)] pb-3 select-none">
        {[
          { id: 'overview', label: 'Genel Bakış' },
          { id: 'league', label: 'Süper Lig' },
          { id: 'cup', label: 'Türkiye Kupası' },
          { id: 'supercup', label: 'Süper Kupa' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === tab.id
                ? 'bg-[#65F56B] text-black font-black shadow-[0_0_12px_rgba(101,245,107,0.3)]'
                : 'bg-[#09141B] text-zinc-400 hover:text-white border border-[rgba(125,160,175,0.14)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. MAIN SECTION: STANDINGS (LEFT) + FORM & STATS (MIDDLE) + FIXTURES (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* STANDINGS TABLE (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 sm:p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
              <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-[#65F56B]" />
                Süper Lig Puan Durumu
              </span>
              <span className="text-[10px] font-mono text-zinc-500">18 Hafta</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                    <th className="py-2 pl-2 w-6">#</th>
                    <th className="py-2">Kulüp</th>
                    <th className="py-2 text-center w-8">O</th>
                    <th className="py-2 text-center w-8">G</th>
                    <th className="py-2 text-center w-8">B</th>
                    <th className="py-2 text-center w-8">M</th>
                    <th className="py-2 text-center w-10">AV</th>
                    <th className="py-2 text-right pr-2 w-8 font-black text-white">P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {standings.map((s) => {
                    const isUser = s.clubId === userClub.id;
                    const club = getClub(s.clubId);
                    return (
                      <tr
                        key={s.clubId}
                        className={
                          isUser
                            ? 'bg-[#65F56B]/15 text-white font-bold border-l-2 border-[#65F56B]'
                            : 'hover:bg-[#0D1C26]/70 text-zinc-300'
                        }
                      >
                        <td className={`py-2 pl-2 font-bold ${isUser ? 'text-[#65F56B]' : 'text-zinc-500'}`}>
                          {s.rank}
                        </td>
                        <td className="py-2 truncate max-w-[130px]">
                          <div className="flex items-center gap-2">
                            <ClubBadge
                              code={club?.code || 'SC'}
                              primaryColor={club?.primaryColor || '#FFF'}
                              secondaryColor={club?.secondaryColor || '#000'}
                              size="xs"
                            />
                            <span className="truncate text-white">{club?.name || s.clubId}</span>
                          </div>
                        </td>
                        <td className="py-2 text-center text-zinc-400">{s.played}</td>
                        <td className="py-2 text-center text-zinc-400">{s.won}</td>
                        <td className="py-2 text-center text-zinc-400">{s.drawn}</td>
                        <td className="py-2 text-center text-zinc-400">{s.lost}</td>
                        <td className="py-2 text-center text-zinc-400">
                          {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                        </td>
                        <td className="py-2 text-right pr-2 font-black text-white">{s.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: FORM TABLE + TOP SCORERS / ASSISTS (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          {/* FORM TABLOSU */}
          <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3">
              <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-[#65F56B]" />
                Form Tablosu (Son 5 Maç)
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {standings.slice(0, 5).map((s) => {
                const club = getClub(s.clubId);
                const isUser = s.clubId === userClub.id;
                const forms = ['G', 'G', 'G', 'B', 'M'];
                return (
                  <div
                    key={s.clubId}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isUser ? 'bg-[#65F56B]/15 border border-[#65F56B]/30' : 'bg-[#0D1C26]/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClubBadge
                        code={club?.code || 'SC'}
                        primaryColor={club?.primaryColor || '#FFF'}
                        secondaryColor={club?.secondaryColor || '#000'}
                        size="xs"
                      />
                      <span className="truncate text-white font-bold">{club?.name || s.clubId}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {forms.map((f, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center ${
                            f === 'G'
                              ? 'bg-[#65F56B]/20 text-[#65F56B]'
                              : f === 'B'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GOL & ASİST KRALLIĞI */}
          <div className="grid grid-cols-2 gap-3">
            {/* GOL KRALLIĞI */}
            <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-3.5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-white font-sans block pb-2 border-b border-[rgba(125,160,175,0.14)] mb-2">
                ⚽ Gol Krallığı
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {topScorers.length > 0 ? (
                  topScorers.slice(0, 4).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-zinc-500 w-3 font-bold">{idx + 1}</span>
                        <span className="text-white truncate">{p.lastName}</span>
                      </div>
                      <span className="font-black text-[#65F56B]">{p.seasonStats?.goals || 0}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-zinc-500 py-3 text-center">Henüz gol yok</div>
                )}
              </div>
            </div>

            {/* ASİST KRALLIĞI */}
            <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-3.5 shadow-xl">
              <span className="text-[11px] font-black uppercase text-white font-sans block pb-2 border-b border-[rgba(125,160,175,0.14)] mb-2">
                🎯 Asist Krallığı
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {topAssists.length > 0 ? (
                  topAssists.slice(0, 4).map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-zinc-500 w-3 font-bold">{idx + 1}</span>
                        <span className="text-white truncate">{p.lastName}</span>
                      </div>
                      <span className="font-black text-[#30D8CE]">{p.seasonStats?.assists || 0}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-[10px] text-zinc-500 py-3 text-center">Henüz asist yok</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING & RECENT MATCHES (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          {/* YAKLAŞAN MAÇLAR */}
          <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
            <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
              Yaklaşan Maçlar
            </span>
            <div className="space-y-2 text-xs font-mono">
              {upcomingMatches.map((fix) => {
                const home = getClub(fix.homeClubId);
                const away = getClub(fix.awayClubId);
                return (
                  <div key={fix.id} className="p-2 rounded-lg bg-[#0D1C26]/60 space-y-1">
                    <div className="text-[9px] text-zinc-500">{formatDateTurkish(fix.date)}</div>
                    <div className="flex items-center justify-between font-bold text-white">
                      <span className="truncate">{home?.name || 'Ev'}</span>
                      <span className="text-zinc-500">vs</span>
                      <span className="truncate text-right">{away?.name || 'Dep'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SON MAÇ SONUÇLARI */}
          <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
            <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
              Son Maç Sonuçları
            </span>
            <div className="space-y-2 text-xs font-mono">
              {recentResults.map((fix) => {
                const home = getClub(fix.homeClubId);
                const away = getClub(fix.awayClubId);
                return (
                  <div key={fix.id} className="p-2 rounded-lg bg-[#0D1C26]/60 flex items-center justify-between">
                    <span className="text-zinc-300 truncate max-w-[80px]">{home?.name}</span>
                    <span className="font-black text-white px-2 py-0.5 rounded bg-black/60">
                      {fix.homeScore} - {fix.awayScore}
                    </span>
                    <span className="text-zinc-300 truncate max-w-[80px] text-right">{away?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: TEAM COMPARISON + LEAGUE NEWS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TEAM COMPARISON */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            Takım Karşılaştırması ({userClub.name} vs Lig Lideri)
          </span>

          <div className="space-y-3 text-xs font-mono py-1">
            {[
              { metric: 'Maç Başı Gol', userVal: '2.4', oppVal: '2.2', userRatio: 65 },
              { metric: 'Maç Başı Şut', userVal: '14.3', oppVal: '12.9', userRatio: 60 },
              { metric: 'Topa Sahip Olma', userVal: '%58', oppVal: '%55', userRatio: 58 },
              { metric: 'Pas Başarısı', userVal: '%86', oppVal: '%84', userRatio: 55 },
              { metric: 'İsabetli Şut', userVal: '6.1', oppVal: '5.8', userRatio: 55 },
            ].map((stat) => (
              <div key={stat.metric} className="space-y-1">
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span className="text-white font-bold">{stat.userVal}</span>
                  <span>{stat.metric}</span>
                  <span className="text-white font-bold">{stat.oppVal}</span>
                </div>
                <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-[#65F56B]" style={{ width: `${stat.userRatio}%` }} />
                  <div className="bg-amber-400 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LEAGUE NEWS */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            Lig Haberleri
          </span>

          <div className="space-y-3">
            {newsFeed && newsFeed.length > 0 ? (
              newsFeed.slice(0, 3).map((news, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-[#0D1C26]/60 border border-[rgba(125,160,175,0.1)] flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#65F56B]/15 border border-[#65F56B]/30 flex items-center justify-center text-[#65F56B] shrink-0 mt-0.5">
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase font-sans">
                      {news.headline}
                    </h5>
                    <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-2 font-sans">
                      {news.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-zinc-500 py-6 text-center font-mono">
                Henüz lig haberi bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
