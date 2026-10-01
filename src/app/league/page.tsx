'use client';

import React from 'react';
import { useGame } from '@/lib/context/GameContext';
import { LeagueTable } from '@/components/league/LeagueTable';
import { StatBadge } from '@/components/ui/StatBadge';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { Trophy, Award, Flame, Shield, Users, ChevronRight } from 'lucide-react';

export default function LeaguePage() {
  const { standings, allClubs, allPlayers, userClub, seasonEndSummary, startNextSeasonRoll, isCareerHydrated, isInitialized } = useGame();

  const getClub = (id: string) => allClubs.find((c) => c.id === id);

  // Top Scorers Fictional Leaderboard
  const topScorers = [...allPlayers]
    .filter((p) => p.seasonStats && p.seasonStats.goals > 0)
    .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))
    .slice(0, 5);

  // Top Assists Leaderboard
  const topAssists = [...allPlayers]
    .filter((p) => p.seasonStats && p.seasonStats.assists > 0)
    .sort((a, b) => (b.seasonStats?.assists || 0) - (a.seasonStats?.assists || 0))
    .slice(0, 5);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
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
              Kulübünüz <strong className="text-white">{userClub.name}</strong> sezonu{' '}
              <strong className="text-[#00F5A0]">{seasonEndSummary.userClubRank}. sırada</strong> ({seasonEndSummary.userClubPoints} Puan) tamamladı.
            </p>
          </div>
          <button
            onClick={startNextSeasonRoll}
            className="px-6 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shrink-0"
          >
            YENİ SEZONA BAŞLA
          </button>
        </div>
      )}

      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
              // OFFICIAL STANDINGS
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              1. KADEME ULUSAL LİG • 10 KULÜP • 18 HAFTA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-[#00F5A0]" />
            Alveria Elit Ligi Puan Durumu
          </h1>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080D1A] border border-zinc-800">
            <span className="w-2.5 h-2.5 bg-[#00F5A0]" />
            <span className="text-zinc-300 text-[11px] uppercase">Kıtasal Şampiyona (1.)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080D1A] border border-zinc-800">
            <span className="w-2.5 h-2.5 bg-[#00D4FF]" />
            <span className="text-zinc-300 text-[11px] uppercase">Kıtasal Eleme (2-3.)</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#080D1A] border border-zinc-800">
            <span className="w-2.5 h-2.5 bg-rose-500" />
            <span className="text-zinc-300 text-[11px] uppercase">Düşme Hattı (9-10.)</span>
          </div>
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="space-y-2">
        <LeagueTable
          standings={standings}
          clubs={allClubs}
          userClubId={userClub.id}
        />
      </div>

      {/* Stats Leaders Section (Top Scorers & Assists) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top Scorers */}
        <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Gol Krallığı <span className="text-[10px] text-zinc-500">// TOP SCORERS</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">GOL</span>
          </div>

          <div className="space-y-1.5">
            {topScorers.length === 0 ? (
              <div className="text-xs text-zinc-500 font-mono py-4 text-center">Henüz gol istatistiği kaydedilmedi.</div>
            ) : (
              topScorers.map((player, idx) => {
                const club = getClub(player.clubId);
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 bg-[#040711] border border-zinc-850 hover:border-amber-400/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-mono font-black text-xs text-amber-400">
                        #{idx + 1}
                      </span>
                      {club && (
                        <ClubBadge
                          code={club.code}
                          primaryColor={club.primaryColor}
                          secondaryColor={club.secondaryColor}
                          size="xs"
                        />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-tight">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {player.position} • {club?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 border border-amber-400/30">
                        {player.seasonStats?.goals} GOL
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top Assists */}
        <div className="p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-400" />
              Asist Krallığı <span className="text-[10px] text-zinc-500">// TOP ASSISTS</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">ASİST</span>
          </div>

          <div className="space-y-1.5">
            {topAssists.length === 0 ? (
              <div className="text-xs text-zinc-500 font-mono py-4 text-center">Henüz asist istatistiği kaydedilmedi.</div>
            ) : (
              topAssists.map((player, idx) => {
                const club = getClub(player.clubId);
                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-2.5 bg-[#040711] border border-zinc-850 hover:border-sky-400/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 font-mono font-black text-xs text-sky-400">
                        #{idx + 1}
                      </span>
                      {club && (
                        <ClubBadge
                          code={club.code}
                          primaryColor={club.primaryColor}
                          secondaryColor={club.secondaryColor}
                          size="xs"
                        />
                      )}
                      <div>
                        <div className="text-xs font-bold text-white uppercase tracking-tight">
                          {player.firstName} {player.lastName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          {player.position} • {club?.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black text-sky-400 bg-sky-400/10 px-2 py-0.5 border border-sky-400/30">
                        {player.seasonStats?.assists} AST
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
