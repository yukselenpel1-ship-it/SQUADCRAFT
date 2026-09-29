'use client';

import React, { useState } from 'react';
import { DraftFixture, DraftClub } from '@/lib/draft/types';
import { Player } from '@/types/game';
import { BadgePreview } from './BadgePreview';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header / Score Banner */}
        <div className="bg-gradient-to-b from-slate-800/80 to-slate-900 p-5 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>

          <div className="text-center text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider mb-2">
            Hafta {fixture.round} Karşılaşması • Maç Raporu
          </div>

          <div className="flex items-center justify-around gap-4 pt-1">
            {/* Home Club */}
            <div className="flex flex-col items-center text-center max-w-[150px] space-y-1">
              {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={50} />}
              <div className="text-sm font-bold text-white truncate max-w-full">{homeClub?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{homeClub?.managerName}</div>
            </div>

            {/* Score */}
            <div className="text-center space-y-1">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
                {fixture.homeScore} - {fixture.awayScore}
              </div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase">Maç Sonu (90')</div>
            </div>

            {/* Away Club */}
            <div className="flex flex-col items-center text-center max-w-[150px] space-y-1">
              {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={50} />}
              <div className="text-sm font-bold text-white truncate max-w-full">{awayClub?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{awayClub?.managerName}</div>
            </div>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div className="flex items-center justify-center gap-2 p-2.5 bg-slate-950 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('events')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'events' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏱️ Önemli Anlar
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'stats' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Maç İstatistikleri
          </button>
          <button
            onClick={() => setActiveTab('lineups')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'lineups' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            👥 Oyuncu Reytingleri
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* TAB 1: Events Timeline */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Gol veya kart olayı kaydedilmedi.
                </div>
              ) : (
                events
                  .filter((ev: any) => ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'INJURY', 'PENALTY_SAVED', 'WOODWORK'].includes(ev.type))
                  .map((ev: any, idx: number) => {
                    const isHome = ev.teamId === fixture.homeClubId;
                    return (
                      <div
                        key={ev.id || idx}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs ${
                          isHome
                            ? 'bg-slate-900/90 border-slate-800 flex-row'
                            : 'bg-slate-900/90 border-slate-800 flex-row-reverse text-right'
                        }`}
                      >
                        <span className="font-mono font-bold text-emerald-400 text-[11px] px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {ev.minute}'
                        </span>

                        <span className="text-base">
                          {ev.type === 'GOAL' && '⚽'}
                          {ev.type === 'YELLOW_CARD' && '🟨'}
                          {ev.type === 'RED_CARD' && '🟥'}
                          {ev.type === 'INJURY' && '🚑'}
                          {ev.type === 'PENALTY_SAVED' && '🧤'}
                          {ev.type === 'WOODWORK' && '🥅'}
                        </span>

                        <div className="flex-1 truncate">
                          <div className="font-bold text-white truncate">
                            {ev.playerName || 'Futbolcu'}
                            {ev.type === 'GOAL' && ev.secondaryPlayerName && (
                              <span className="text-slate-400 text-[10px] font-normal ml-1">
                                (Asist: {ev.secondaryPlayerName})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
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
            <div className="space-y-3 text-xs">
              {/* Possession Bar */}
              <div className="space-y-1 pb-2 border-b border-slate-800">
                <div className="flex justify-between font-semibold text-slate-300">
                  <span>%{homePossession}</span>
                  <span className="text-slate-400">Topla Oynama</span>
                  <span>%{awayPossession}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${homePossession}%` }} />
                  <div className="bg-blue-500 h-full" style={{ width: `${awayPossession}%` }} />
                </div>
              </div>

              {/* Stats Rows */}
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
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 px-2 bg-slate-950/50 rounded-lg border border-slate-800/60">
                  <span className="font-mono font-bold text-white w-12 text-left">{item.home}</span>
                  <span className="text-slate-400 text-center font-medium flex-1">{item.label}</span>
                  <span className="font-mono font-bold text-white w-12 text-right">{item.away}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Player Ratings */}
          {activeTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Home Lineup */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-400 border-b border-slate-800 pb-1">
                  {homeClub?.name} Reytingleri
                </div>
                <div className="space-y-1">
                  {homePlayers.map((p: any) => (
                    <div key={p.player?.id || p.id} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-slate-400 font-bold w-6">{p.currentPosition || p.player?.position}</span>
                        <span className="font-semibold text-white truncate">{p.player?.firstName} {p.player?.lastName}</span>
                        {p.goals > 0 && <span className="text-[10px] text-amber-400">⚽x{p.goals}</span>}
                        {p.assists > 0 && <span className="text-[10px] text-blue-400">🎯x{p.assists}</span>}
                      </div>
                      <span className={`font-mono font-extrabold text-xs px-1.5 py-0.5 rounded ${
                        (p.matchRating || 6.5) >= 7.5 ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {(p.matchRating || 6.5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Lineup */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-blue-400 border-b border-slate-800 pb-1">
                  {awayClub?.name} Reytingleri
                </div>
                <div className="space-y-1">
                  {awayPlayers.map((p: any) => (
                    <div key={p.player?.id || p.id} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-[10px] text-slate-400 font-bold w-6">{p.currentPosition || p.player?.position}</span>
                        <span className="font-semibold text-white truncate">{p.player?.firstName} {p.player?.lastName}</span>
                        {p.goals > 0 && <span className="text-[10px] text-amber-400">⚽x{p.goals}</span>}
                        {p.assists > 0 && <span className="text-[10px] text-blue-400">🎯x{p.assists}</span>}
                      </div>
                      <span className={`font-mono font-extrabold text-xs px-1.5 py-0.5 rounded ${
                        (p.matchRating || 6.5) >= 7.5 ? 'bg-blue-950 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {(p.matchRating || 6.5).toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Close */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
