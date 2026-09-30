'use client';

import React, { useState } from 'react';
import { DraftFixture, DraftClub } from '@/lib/draft/types';
import { Player } from '@/types/game';
import { BadgePreview } from './BadgePreview';
import { Trophy, Activity, BarChart3, Users, Clock, ArrowRight, X, Shield, Sparkles } from 'lucide-react';

interface MatchReportModalProps {
  fixture: DraftFixture | null;
  clubs: DraftClub[];
  playerPool: Player[];
  isOpen: boolean;
  onClose: () => void;
}

export function MatchReportModal({
  fixture,
  clubs,
  playerPool,
  isOpen,
  onClose,
}: MatchReportModalProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'stats' | 'lineups'>('events');

  if (!isOpen || !fixture || fixture.status !== 'COMPLETED') return null;

  const homeClub = clubs.find((c) => c.id === fixture.homeClubId);
  const awayClub = clubs.find((c) => c.id === fixture.awayClubId);
  const matchResult = fixture.matchResult;

  const homeStats = matchResult?.home?.stats || {
    shots: 12,
    shotsOnTarget: 5,
    xG: 1.45,
    passes: 450,
    completedPasses: 380,
    corners: 5,
    fouls: 9,
    yellowCards: 1,
    redCards: 0,
  };

  const awayStats = matchResult?.away?.stats || {
    shots: 9,
    shotsOnTarget: 3,
    xG: 0.95,
    passes: 410,
    completedPasses: 335,
    corners: 3,
    fouls: 11,
    yellowCards: 2,
    redCards: 0,
  };

  const totalPasses = (homeStats.passes || 1) + (awayStats.passes || 1);
  const homePossession = Math.round(((homeStats.passes || 1) / totalPasses) * 100);
  const awayPossession = 100 - homePossession;

  const events = matchResult?.events || [];
  const homePlayers = matchResult?.home?.players ? Object.values(matchResult.home.players as Record<string, any>) : [];
  const awayPlayers = matchResult?.away?.players ? Object.values(matchResult.away.players as Record<string, any>) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#04060A]/90 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="bg-[#070D14] border border-zinc-800 max-w-4xl w-full flex flex-col max-h-[92vh] shadow-2xl overflow-hidden relative">
        {/* Top Accent Beam */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F5A0]/80 via-[#00D4FF]/60 to-transparent shadow-[0_0_15px_#00F5A0]" />

        {/* Top Header Controls */}
        <div className="bg-[#0A101A] border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black text-[#00F5A0] px-2.5 py-0.5 bg-zinc-950 border border-zinc-800 uppercase tracking-widest">
              HAFTA {fixture.round} // RESMİ MAÇ RAPORU
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] inline-block animate-pulse" />
              SİMÜLASYON TAMAMLANDI
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800 transition"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scoreboard Broadcast Banner */}
        <div className="p-6 bg-gradient-to-b from-[#0B1520]/90 to-[#070D14] border-b border-zinc-800">
          <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
            {/* Home Club */}
            <div className="flex flex-col items-center text-center flex-1 max-w-[180px] space-y-2">
              <div className="p-2 bg-zinc-950 border border-zinc-800 shadow-lg">
                {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={54} />}
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                  {homeClub?.name}
                </div>
                <div className="text-[11px] text-zinc-400 font-bold">
                  {homeClub?.managerName || 'Menajer'}
                </div>
              </div>
            </div>

            {/* Score & Status */}
            <div className="flex flex-col items-center text-center space-y-2 shrink-0">
              <div className="flex items-center gap-3 bg-zinc-950 px-6 py-2.5 border border-zinc-800 shadow-2xl">
                <span className="font-mono text-4xl sm:text-5xl font-black text-[#00F5A0]">
                  {fixture.homeScore}
                </span>
                <span className="font-mono text-xl text-zinc-600 font-bold">-</span>
                <span className="font-mono text-4xl sm:text-5xl font-black text-[#00D4FF]">
                  {fixture.awayScore}
                </span>
              </div>
              <span className="text-[10px] font-mono font-black text-[#FFB800] uppercase tracking-widest px-2.5 py-0.5 bg-zinc-900 border border-zinc-800">
                MAÇ SONU (90')
              </span>
            </div>

            {/* Away Club */}
            <div className="flex flex-col items-center text-center flex-1 max-w-[180px] space-y-2">
              <div className="p-2 bg-zinc-950 border border-zinc-800 shadow-lg">
                {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={54} />}
              </div>
              <div>
                <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                  {awayClub?.name}
                </div>
                <div className="text-[11px] text-zinc-400 font-bold">
                  {awayClub?.managerName || 'Menajer'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="bg-[#0A101A] border-b border-zinc-800 px-6 py-2 flex items-center justify-center gap-2">
          {[
            { id: 'events', label: 'Önemli Anlar & Goller', icon: Clock },
            { id: 'stats', label: 'Maç İstatistikleri', icon: BarChart3 },
            { id: 'lineups', label: 'Oyuncu Reytingleri', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#00F5A0] text-black border-[#00F5A0] shadow-md'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* TAB 1: Events Timeline */}
          {activeTab === 'events' && (
            <div className="max-w-2xl mx-auto space-y-2.5">
              {events.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs bg-zinc-950 border border-zinc-800">
                  Karşılaşmada gol veya kart olayı kaydedilmedi.
                </div>
              ) : (
                events
                  .filter((ev: any) =>
                    ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'INJURY', 'PENALTY_SAVED', 'WOODWORK', 'SUBSTITUTION'].includes(
                      ev.type
                    )
                  )
                  .map((ev: any, idx: number) => {
                    const isHome = ev.teamId === fixture.homeClubId;
                    const isGoal = ev.type === 'GOAL';
                    const isCard = ev.type === 'YELLOW_CARD' || ev.type === 'RED_CARD';
                    const isSub = ev.type === 'SUBSTITUTION';

                    const typeIcon = isGoal
                      ? '⚽'
                      : ev.type === 'YELLOW_CARD'
                      ? '🟨'
                      : ev.type === 'RED_CARD'
                      ? '🟥'
                      : isSub
                      ? '🔄'
                      : '⚡';

                    return (
                      <div
                        key={ev.id || idx}
                        className={`flex items-center gap-3 p-3.5 border text-xs transition ${
                          isGoal
                            ? 'bg-amber-950/30 border-[#FFB800] text-amber-200'
                            : isCard
                            ? 'bg-rose-950/30 border-rose-600 text-rose-200'
                            : isSub
                            ? 'bg-cyan-950/30 border-[#00D4FF]/40 text-cyan-200'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                        } ${isHome ? 'flex-row' : 'flex-row-reverse text-right'}`}
                      >
                        <span className="font-mono font-black text-[#00F5A0] text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800 shrink-0">
                          {ev.minute}'
                        </span>

                        <span className="text-base shrink-0">{typeIcon}</span>

                        <div className="flex-1 truncate">
                          <div className="font-black text-white truncate text-xs uppercase">
                            {ev.playerName || 'Futbolcu'}
                            {isGoal && ev.secondaryPlayerName && (
                              <span className="text-[#00D4FF] text-[10px] font-normal lowercase ml-1">
                                (asist: {ev.secondaryPlayerName})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {ev.description || ev.commentary}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* TAB 2: Match Stats Comparison */}
          {activeTab === 'stats' && (
            <div className="max-w-2xl mx-auto space-y-4 text-xs">
              {/* Possession Bar */}
              <div className="bg-zinc-950 p-4 border border-zinc-800 space-y-2">
                <div className="flex justify-between font-black uppercase text-xs">
                  <span className="text-[#00F5A0]">{homeClub?.name}: %{homePossession}</span>
                  <span className="text-zinc-400">Topla Oynama</span>
                  <span className="text-[#00D4FF]">{awayClub?.name}: %{awayPossession}</span>
                </div>
                <div className="h-2 w-full bg-zinc-900 border border-zinc-800 overflow-hidden flex">
                  <div className="bg-[#00F5A0] h-full transition-all duration-500" style={{ width: `${homePossession}%` }} />
                  <div className="bg-[#00D4FF] h-full transition-all duration-500" style={{ width: `${awayPossession}%` }} />
                </div>
              </div>

              {/* Stats Rows */}
              <div className="space-y-1.5">
                {[
                  { label: 'Toplam Şut', home: homeStats.shots, away: awayStats.shots },
                  { label: 'İsabetli Şut', home: homeStats.shotsOnTarget, away: awayStats.shotsOnTarget },
                  { label: 'Gol Beklentisi (xG)', home: (homeStats.xG || 0).toFixed(2), away: (awayStats.xG || 0).toFixed(2) },
                  { label: 'Toplam Pas', home: homeStats.passes, away: awayStats.passes },
                  { label: 'İsabetli Pas', home: homeStats.completedPasses, away: awayStats.completedPasses },
                  { label: 'Köşe Vuruşu (Korner)', home: homeStats.corners, away: awayStats.corners },
                  { label: 'Faul', home: homeStats.fouls, away: awayStats.fouls },
                  { label: 'Sarı Kart', home: homeStats.yellowCards, away: awayStats.yellowCards },
                  { label: 'Kırmızı Kart', home: homeStats.redCards, away: awayStats.redCards },
                ].map((item, i) => {
                  const hNum = typeof item.home === 'number' ? item.home : parseFloat(item.home) || 0;
                  const aNum = typeof item.away === 'number' ? item.away : parseFloat(item.away) || 0;
                  const isHomeHigher = hNum > aNum;
                  const isAwayHigher = aNum > hNum;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3.5 bg-zinc-950 border border-zinc-800/80"
                    >
                      <span className={`font-mono font-black w-14 text-left ${isHomeHigher ? 'text-[#00F5A0]' : 'text-white'}`}>
                        {item.home}
                      </span>
                      <span className="text-zinc-400 text-center font-bold flex-1 uppercase text-[11px]">
                        {item.label}
                      </span>
                      <span className={`font-mono font-black w-14 text-right ${isAwayHigher ? 'text-[#00D4FF]' : 'text-white'}`}>
                        {item.away}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Player Ratings */}
          {activeTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Lineup */}
              <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2.5">
                <div className="text-xs font-black text-white uppercase italic tracking-wider border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={20} />}
                    <span>{homeClub?.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00F5A0] font-bold">İlk 11</span>
                </div>

                <div className="space-y-1.5">
                  {homePlayers.map((p: any) => (
                    <div
                      key={p.player?.id || p.id}
                      className="p-2 bg-[#070D14] border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[9px] text-zinc-400 font-black px-1.5 py-0.5 bg-zinc-900 border border-zinc-800">
                          {p.currentPosition || p.player?.position}
                        </span>
                        <span className="font-bold text-white truncate">
                          {p.player?.firstName} {p.player?.lastName}
                        </span>
                        {p.goals > 0 && <span className="text-[10px] text-amber-300 font-bold">⚽x{p.goals}</span>}
                        {p.assists > 0 && <span className="text-[10px] text-cyan-300 font-bold">🎯x{p.assists}</span>}
                      </div>

                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 border ${
                          (p.matchRating || 6.5) >= 7.5
                            ? 'bg-[#00F5A0]/20 text-[#00F5A0] border-[#00F5A0]'
                            : (p.matchRating || 6.5) >= 6.5
                            ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800'
                        }`}
                      >
                        {(p.matchRating || 6.5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Lineup */}
              <div className="bg-zinc-950 border border-zinc-800 p-4 space-y-2.5">
                <div className="text-xs font-black text-white uppercase italic tracking-wider border-b border-zinc-800 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={20} />}
                    <span>{awayClub?.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00D4FF] font-bold">İlk 11</span>
                </div>

                <div className="space-y-1.5">
                  {awayPlayers.map((p: any) => (
                    <div
                      key={p.player?.id || p.id}
                      className="p-2 bg-[#070D14] border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[9px] text-zinc-400 font-black px-1.5 py-0.5 bg-zinc-900 border border-zinc-800">
                          {p.currentPosition || p.player?.position}
                        </span>
                        <span className="font-bold text-white truncate">
                          {p.player?.firstName} {p.player?.lastName}
                        </span>
                        {p.goals > 0 && <span className="text-[10px] text-amber-300 font-bold">⚽x{p.goals}</span>}
                        {p.assists > 0 && <span className="text-[10px] text-cyan-300 font-bold">🎯x{p.assists}</span>}
                      </div>

                      <span
                        className={`font-mono font-black text-xs px-2 py-0.5 border ${
                          (p.matchRating || 6.5) >= 7.5
                            ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]'
                            : (p.matchRating || 6.5) >= 6.5
                            ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                            : 'bg-rose-950/40 text-rose-300 border-rose-800'
                        }`}
                      >
                        {(p.matchRating || 6.5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0A101A] border-t border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] font-mono text-zinc-500 font-bold hidden sm:block">
            SQUADCRAFT 26 // MATCH ENGINE REPORT
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#00F5A0]/20 flex items-center gap-2"
          >
            <span>LİGE DÖN & PUAN TABLOSUNU İNCELE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
