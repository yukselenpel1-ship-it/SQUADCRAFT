'use client';

import React, { useState, useMemo } from 'react';
import { Club, Player } from '@/types/game';
import { MatchEngineEvent, PlayerInMatch, TeamMatchStats } from '@/lib/match-engine/types';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { BadgePreview } from '@/components/draft/BadgePreview';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import {
  Trophy,
  Activity,
  BarChart2,
  Users,
  Clock,
  X,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Target,
  ChevronRight,
  Flame,
} from 'lucide-react';

export interface ClubDisplayInfo {
  id: string;
  name: string;
  code: string;
  primaryColor?: string;
  secondaryColor?: string;
  badge?: any;
}

interface FifaMatchReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  homeClub: ClubDisplayInfo;
  awayClub: ClubDisplayInfo;
  homeScore: number;
  awayScore: number;
  homeStats?: TeamMatchStats;
  awayStats?: TeamMatchStats;
  homePossessionPercent?: number;
  awayPossessionPercent?: number;
  events?: MatchEngineEvent[];
  homePlayers?: Record<string, PlayerInMatch> | PlayerInMatch[];
  awayPlayers?: Record<string, PlayerInMatch> | PlayerInMatch[];
  manOfTheMatch?: PlayerInMatch | null;
  round?: number | string;
  matchDate?: string;
  onInspectPlayer?: (player: Player) => void;
  onViewStandings?: () => void;
  onContinue?: () => void;
}

type TabType = 'overview' | 'lineups' | 'timeline';

const RenderClubBadge: React.FC<{ club: ClubDisplayInfo; size?: 'xs' | 'sm' | 'md' | 'lg' }> = ({
  club,
  size = 'lg',
}) => {
  if (club.badge) {
    const pxSize = size === 'xs' ? 20 : size === 'sm' ? 28 : size === 'md' ? 40 : 54;
    return <BadgePreview badge={club.badge} clubCode={club.code} size={pxSize} />;
  }
  return (
    <ClubBadge
      code={club.code}
      primaryColor={club.primaryColor || '#00F5A0'}
      secondaryColor={club.secondaryColor || '#00D4FF'}
      size={size}
    />
  );
};

export function FifaMatchReportModal({
  isOpen,
  onClose,
  homeClub,
  awayClub,
  homeScore,
  awayScore,
  homeStats,
  awayStats,
  homePossessionPercent = 50,
  awayPossessionPercent = 50,
  events = [],
  homePlayers = [],
  awayPlayers = [],
  manOfTheMatch,
  round,
  matchDate,
  onInspectPlayer,
  onViewStandings,
  onContinue,
}: FifaMatchReportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Normalize player arrays (always call hooks at top level)
  const homePlayerList: PlayerInMatch[] = useMemo(() => {
    if (!homePlayers) return [];
    const list = Array.isArray(homePlayers) ? homePlayers : Object.values(homePlayers);
    return list.sort((a, b) => (b.matchRating || 0) - (a.matchRating || 0));
  }, [homePlayers]);

  const awayPlayerList: PlayerInMatch[] = useMemo(() => {
    if (!awayPlayers) return [];
    const list = Array.isArray(awayPlayers) ? awayPlayers : Object.values(awayPlayers);
    return list.sort((a, b) => (b.matchRating || 0) - (a.matchRating || 0));
  }, [awayPlayers]);

  // Extract goal scorers for broadcast scoreboard
  const goalEvents = useMemo(() => {
    return (events || []).filter((e) => e.type === 'GOAL');
  }, [events]);

  if (!isOpen) return null;

  const homeGoals = goalEvents.filter((e) => e.teamId === homeClub?.id);
  const awayGoals = goalEvents.filter((e) => e.teamId === awayClub?.id);

  // Default Stats if missing
  const hStats: TeamMatchStats = homeStats || {
    shots: 12,
    shotsOnTarget: 6,
    xG: 1.45,
    corners: 5,
    fouls: 9,
    yellowCards: 1,
    redCards: 0,
    passes: 440,
    completedPasses: 375,
    saves: 3,
    offsides: 1,
  };

  const aStats: TeamMatchStats = awayStats || {
    shots: 9,
    shotsOnTarget: 4,
    xG: 1.1,
    corners: 4,
    fouls: 11,
    yellowCards: 2,
    redCards: 0,
    passes: 410,
    completedPasses: 330,
    saves: 4,
    offsides: 2,
  };

  const isHomeWinner = homeScore > awayScore;
  const isAwayWinner = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  const getRatingBadgeColor = (rating: number) => {
    if (rating >= 8.5) return 'bg-[#00F5A0]/20 text-[#00F5A0] border-[#00F5A0]/50 shadow-[0_0_10px_rgba(0,245,160,0.3)]';
    if (rating >= 7.5) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    if (rating >= 6.8) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (rating >= 6.0) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      {/* Modal Shell with EA FC / FIFA Stadium Aesthetic */}
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-[#070D1A]/95 border border-[#182338] rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden text-zinc-200">
        {/* Subtle Top Neon Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

        {/* Top Control Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-2.5 bg-[#070D1A] border-b border-[#182338]">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black bg-[#00F5A0]/15 text-[#00F5A0] border border-[#00F5A0]/30 tracking-widest uppercase">
              MAÇ RAPORU // 90' TAM SÜRE
            </span>
            {round && (
              <span className="hidden sm:inline text-xs font-mono text-zinc-400">
                Hafta {round} {matchDate ? `• ${matchDate}` : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0B1323] hover:bg-[#121D33] text-zinc-400 hover:text-white border border-[#182338] transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =================================================================== */}
        {/* BROADCAST SCOREBOARD SHOWCASE (EA FC STYLE)                         */}
        {/* =================================================================== */}
        <div className="shrink-0 relative py-3.5 px-4 sm:px-6 bg-gradient-to-b from-[#0B1323] via-[#070D1A] to-[#040711] border-b border-[#182338]">
          {/* Subtle Stadium Bokeh Glow */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#00F5A0]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#00D4FF]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4 max-w-2xl mx-auto">
            {/* Home Club */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="relative group mb-1.5">
                <div
                  className={`absolute -inset-2 rounded-full blur-md opacity-40 transition-opacity ${
                    isHomeWinner ? 'bg-[#00F5A0]' : 'bg-transparent'
                  }`}
                />
                <div className="relative p-1.5 bg-black/40 rounded-full border border-white/10 shadow-lg">
                  <RenderClubBadge club={homeClub} size="md" />
                </div>
              </div>
              <h3 className="text-[11px] sm:text-sm font-black uppercase italic tracking-tight text-white line-clamp-2 w-full text-center leading-tight mt-1">
                {homeClub.name}
              </h3>
              {/* Home Goal Scorers */}
              {homeGoals.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {homeGoals.map((g, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono text-zinc-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center gap-1"
                    >
                      <span className="text-[#00F5A0]">⚽</span>
                      <span className="font-bold truncate max-w-[80px]">{g.playerName || 'Gol'}</span>
                      <span className="text-zinc-500">{g.minute}'</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score & Match Status Banner */}
            <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-5">
              <div className="flex items-center gap-2 sm:gap-3 font-mono font-black text-3xl sm:text-5xl tracking-tight leading-none">
                <span
                  className={`${
                    isHomeWinner
                      ? 'text-[#00F5A0] drop-shadow-[0_0_20px_rgba(0,245,160,0.5)]'
                      : 'text-white'
                  }`}
                >
                  {homeScore}
                </span>
                <span className="text-zinc-600 text-xl sm:text-3xl">-</span>
                <span
                  className={`${
                    isAwayWinner
                      ? 'text-[#00D4FF] drop-shadow-[0_0_20px_rgba(0,212,255,0.5)]'
                      : 'text-white'
                  }`}
                >
                  {awayScore}
                </span>
              </div>
              <div className="mt-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-300">
                {isDraw ? 'BERABERLİK' : 'MAÇ SONU'}
              </div>
            </div>

            {/* Away Club */}
            <div className="flex-1 flex flex-col items-center text-center min-w-0">
              <div className="relative group mb-1.5">
                <div
                  className={`absolute -inset-2 rounded-full blur-md opacity-40 transition-opacity ${
                    isAwayWinner ? 'bg-[#00D4FF]' : 'bg-transparent'
                  }`}
                />
                <div className="relative p-1.5 bg-black/40 rounded-full border border-white/10 shadow-lg">
                  <RenderClubBadge club={awayClub} size="md" />
                </div>
              </div>
              <h3 className="text-[11px] sm:text-sm font-black uppercase italic tracking-tight text-white line-clamp-2 w-full text-center leading-tight mt-1">
                {awayClub.name}
              </h3>
              {/* Away Goal Scorers */}
              {awayGoals.length > 0 && (
                <div className="mt-1 flex flex-wrap justify-center gap-1">
                  {awayGoals.map((g, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono text-zinc-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center gap-1"
                    >
                      <span className="text-[#00D4FF]">⚽</span>
                      <span className="font-bold truncate max-w-[80px]">{g.playerName || 'Gol'}</span>
                      <span className="text-zinc-500">{g.minute}'</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* SEGMENTED EA FC TAB BAR (CAPSULE PILL STYLE)                        */}
        {/* =================================================================== */}
        <div className="shrink-0 px-3 sm:px-6 py-2.5 bg-[#080D1A] border-b border-zinc-800">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-2xl mx-auto p-1 bg-black/60 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#00D4FF]/20 text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">ÖZET</span>
                <span className="hidden sm:inline">GENEL BAKIŞ</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('lineups')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
                activeTab === 'lineups'
                  ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#00D4FF]/20 text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">PUANLAR</span>
                <span className="hidden sm:inline">OYUNCU PUANLARI</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 sm:px-3 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all ${
                activeTab === 'timeline'
                  ? 'bg-gradient-to-r from-[#00F5A0]/20 to-[#00D4FF]/20 text-[#00F5A0] border border-[#00F5A0]/40 shadow-[0_0_15px_rgba(0,245,160,0.15)]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="flex items-center gap-1 truncate">
                <span className="sm:hidden">OLAYLAR</span>
                <span className="hidden sm:inline">MAÇ OLAYLARI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800/80 border border-zinc-700/60 font-mono ml-0.5">
                  {events.length}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB BODY (SCROLLABLE)                                               */}
        {/* =================================================================== */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 pb-10 space-y-6">
          {/* TAB 1: GENEL BAKIŞ & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* SPECIAL EA FC MAN OF THE MATCH (MOTM) CARD */}
              {manOfTheMatch && (
                <div
                  onClick={() => onInspectPlayer && onInspectPlayer(manOfTheMatch.player)}
                  className="relative p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0D1525] to-amber-500/15 border-2 border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.18)] cursor-pointer hover:border-amber-300 transition-all group overflow-hidden"
                >
                  {/* Holographic light sweep hint */}
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                      {/* Player Fictional Portrait in MOTM Frame */}
                      <div className="relative shrink-0">
                        <div className="absolute -inset-1 rounded-2xl bg-amber-400 blur-sm opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl">
                          <PlayerPortrait
                            player={manOfTheMatch.player}
                            size="lg"
                            shape="card"
                            priority={true}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-mono font-black uppercase tracking-wider">
                          <Trophy className="w-3.5 h-3.5 text-amber-400" />
                          <span>MAÇIN ADAMI (MVP)</span>
                        </div>

                        <h4 className="text-xl font-black italic tracking-wide text-white uppercase group-hover:text-amber-300 transition-colors">
                          {manOfTheMatch.player.firstName} {manOfTheMatch.player.lastName}
                        </h4>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-mono text-zinc-300">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-amber-300 border border-zinc-700 font-bold">
                            {manOfTheMatch.currentPosition}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="font-bold text-white">
                            {manOfTheMatch.goals > 0 ? `${manOfTheMatch.goals} Gol` : ''}
                            {manOfTheMatch.goals > 0 && manOfTheMatch.assists > 0 ? ' • ' : ''}
                            {manOfTheMatch.assists > 0 ? `${manOfTheMatch.assists} Asist` : ''}
                            {manOfTheMatch.goals === 0 && manOfTheMatch.assists === 0
                              ? `${manOfTheMatch.currentPosition === 'GK' ? `${manOfTheMatch.saves} Kurtarış` : `${manOfTheMatch.tacklesWon || 3} İkili Mücadele`}`
                              : ''}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400">{manOfTheMatch.player.age} Yaş</span>
                        </div>
                      </div>
                    </div>

                    {/* Big EA FC MOTM Rating Badge */}
                    <div className="flex sm:flex-col items-center justify-center gap-2 sm:gap-0 px-4 py-2 sm:py-3 rounded-xl bg-black/50 border border-amber-400/40">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-300/80">
                        MAÇ PUANI
                      </span>
                      <span className="text-3xl font-black font-mono text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                        {manOfTheMatch.matchRating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* FIFA HEAD-TO-HEAD COMPARISON BARS */}
              <div className="p-5 rounded-2xl bg-[#090E1D] border border-zinc-800 space-y-4 font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800">
                  <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#00F5A0]" />
                    RESMİ MAÇ İSTATİSTİKLERİ
                  </span>
                  <div className="flex items-center gap-3 text-xs font-bold truncate">
                    <span className="text-[#00F5A0] truncate max-w-[130px]">{homeClub.name}</span>
                    <span className="text-zinc-600">vs</span>
                    <span className="text-[#00D4FF] truncate max-w-[130px]">{awayClub.name}</span>
                  </div>
                </div>

                {/* 1. Possession Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-[#00F5A0]">%{homePossessionPercent}</span>
                    <span className="text-zinc-400 uppercase text-[10px]">Topa Sahip Olma</span>
                    <span className="text-[#00D4FF]">%{awayPossessionPercent}</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-900 rounded-full flex overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-[#00F5A0] transition-all duration-300"
                      style={{ width: `${homePossessionPercent}%` }}
                    />
                    <div
                      className="h-full bg-[#00D4FF] transition-all duration-300"
                      style={{ width: `${awayPossessionPercent}%` }}
                    />
                  </div>
                </div>

                {/* 2. xG (Gol Beklentisi) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-white">{hStats.xG.toFixed(2)}</span>
                    <span className="text-zinc-400 uppercase text-[10px]">Gol Beklentisi (xG)</span>
                    <span className="text-white">{aStats.xG.toFixed(2)}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-900 rounded-full flex overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-[#00F5A0] transition-all duration-300"
                      style={{
                        width: `${Math.round((hStats.xG / Math.max(0.1, hStats.xG + aStats.xG)) * 100)}%`,
                      }}
                    />
                    <div
                      className="h-full bg-[#00D4FF] transition-all duration-300"
                      style={{
                        width: `${Math.round((aStats.xG / Math.max(0.1, hStats.xG + aStats.xG)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 3. Numeric Comparison Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Shots Card */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-sm font-black text-white">{hStats.shots} ({hStats.shotsOnTarget})</span>
                    <span className="text-zinc-400 text-[11px] uppercase">Şut (İsabetli)</span>
                    <span className="text-sm font-black text-white">{aStats.shots} ({aStats.shotsOnTarget})</span>
                  </div>

                  {/* Passes Card */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-sm font-black text-[#00F5A0]">
                      %{Math.round((hStats.completedPasses / Math.max(1, hStats.passes)) * 100)}
                    </span>
                    <span className="text-zinc-400 text-[11px] uppercase">Pas Başarısı</span>
                    <span className="text-sm font-black text-[#00D4FF]">
                      %{Math.round((aStats.completedPasses / Math.max(1, aStats.passes)) * 100)}
                    </span>
                  </div>

                  {/* Corners Card */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-sm font-black text-white">{hStats.corners}</span>
                    <span className="text-zinc-400 text-[11px] uppercase">Köşe Vuruşu</span>
                    <span className="text-sm font-black text-white">{aStats.corners}</span>
                  </div>

                  {/* Fouls & Cards */}
                  <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between text-xs">
                    <span className="text-sm font-black text-white">
                      {hStats.fouls} <span className="text-amber-400 text-[10px]">({hStats.yellowCards}🟨)</span>
                    </span>
                    <span className="text-zinc-400 text-[11px] uppercase">Faul (Kart)</span>
                    <span className="text-sm font-black text-white">
                      {aStats.fouls} <span className="text-amber-400 text-[10px]">({aStats.yellowCards}🟨)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OYUNCU PUANLARI (11v11) */}
          {activeTab === 'lineups' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team Lineup */}
                <div className="p-4 rounded-xl bg-[#090E1D] border border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <RenderClubBadge club={homeClub} size="xs" />
                      <span className="text-xs font-black text-white uppercase italic">{homeClub.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase">11v11 Kadro</span>
                  </div>

                  <div className="space-y-1.5">
                    {homePlayerList.map((pim) => (
                      <div
                        key={pim.player.id}
                        onClick={() => onInspectPlayer && onInspectPlayer(pim.player)}
                        className="p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerPortrait player={pim.player} size="xs" />
                          <span className="w-6 text-center px-1 py-0.2 rounded text-[10px] font-black bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {pim.currentPosition}
                          </span>
                          <span className="text-xs font-bold text-white group-hover:text-[#00F5A0] transition-colors truncate">
                            {pim.player.firstName} {pim.player.lastName}
                          </span>
                          {pim.goals > 0 && (
                            <span className="text-xs text-amber-300 font-black">⚽{pim.goals > 1 ? `x${pim.goals}` : ''}</span>
                          )}
                          {pim.assists > 0 && (
                            <span className="text-xs text-cyan-300 font-black">🎯{pim.assists > 1 ? `x${pim.assists}` : ''}</span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${getRatingBadgeColor(
                            pim.matchRating
                          )}`}
                        >
                          {pim.matchRating.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Away Team Lineup */}
                <div className="p-4 rounded-xl bg-[#090E1D] border border-zinc-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <RenderClubBadge club={awayClub} size="xs" />
                      <span className="text-xs font-black text-white uppercase italic">{awayClub.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase">11v11 Kadro</span>
                  </div>

                  <div className="space-y-1.5">
                    {awayPlayerList.map((pim) => (
                      <div
                        key={pim.player.id}
                        onClick={() => onInspectPlayer && onInspectPlayer(pim.player)}
                        className="p-2 rounded-lg bg-zinc-950/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <PlayerPortrait player={pim.player} size="xs" />
                          <span className="w-6 text-center px-1 py-0.2 rounded text-[10px] font-black bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {pim.currentPosition}
                          </span>
                          <span className="text-xs font-bold text-white group-hover:text-[#00D4FF] transition-colors truncate">
                            {pim.player.firstName} {pim.player.lastName}
                          </span>
                          {pim.goals > 0 && (
                            <span className="text-xs text-amber-300 font-black">⚽{pim.goals > 1 ? `x${pim.goals}` : ''}</span>
                          )}
                          {pim.assists > 0 && (
                            <span className="text-xs text-cyan-300 font-black">🎯{pim.assists > 1 ? `x${pim.assists}` : ''}</span>
                          )}
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-xs font-mono font-black border ${getRatingBadgeColor(
                            pim.matchRating
                          )}`}
                        >
                          {pim.matchRating.toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MAÇ ZAMAN ÇİZELGESİ (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="space-y-2 animate-in fade-in duration-200 font-mono">
              {events.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  Bu maç için kayıtlı olay bulunamadı.
                </div>
              ) : (
                events.map((evt, idx) => {
                  const isHome = evt.teamId === homeClub.id;
                  const isGoal = evt.type === 'GOAL';
                  const isCard = evt.type === 'YELLOW_CARD' || evt.type === 'RED_CARD';
                  const isSub = evt.type === 'SUBSTITUTION';

                  const desc = evt.description || '';
                  const playerName = evt.playerName || (isHome ? homeClub.name : awayClub.name);
                  const nameAlreadyInDesc = playerName && desc.toLowerCase().includes(playerName.toLowerCase());

                  return (
                    <div
                      key={evt.id || idx}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                        isGoal
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md'
                          : isCard
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                          : 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2 py-0.5 rounded font-black bg-zinc-900 border border-zinc-700 text-zinc-300 shrink-0">
                          {evt.minute}'
                        </span>
                        <span className="text-base shrink-0">
                          {isGoal ? '⚽' : evt.type === 'RED_CARD' ? '🟥' : evt.type === 'YELLOW_CARD' ? '🟨' : isSub ? '🔄' : '📌'}
                        </span>
                        <div className="truncate">
                          {!nameAlreadyInDesc && (
                            <span className="font-bold text-white mr-1.5">{playerName}</span>
                          )}
                          <span className="text-zinc-300 text-xs">{desc}</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-500 uppercase shrink-0">
                        {isHome ? homeClub.code : awayClub.code}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* BOTTOM ACTION FOOTER (EA FC STYLE)                                  */}
        {/* =================================================================== */}
        <div className="shrink-0 p-3 sm:p-4 bg-[#080D1A] border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Maç Merkezini İncele</span>
          </button>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {onViewStandings && (
              <button
                onClick={onViewStandings}
                className="justify-center flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl font-bold font-mono text-xs bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 transition-colors"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Puan Durumu</span>
              </button>
            )}

            {onContinue && (
              <button
                onClick={onContinue}
                className="justify-center flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl font-black font-mono text-xs bg-[#00F5A0] text-black hover:bg-[#00D68B] transition-all shadow-lg shadow-emerald-500/20"
              >
                <span>Devam Et</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
