'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DraftFixture, DraftClub } from '@/lib/draft/types';
import { Player, Formation, TacticalSettings } from '@/types/game';
import { MatchEngine } from '@/lib/match-engine/engine';
import { MatchEngineState, MatchEngineEvent } from '@/lib/match-engine/types';
import { TacticalRadarPitch } from '@/components/match/TacticalRadarPitch';
import { BadgePreview } from './BadgePreview';
import { draftClubToClub } from '@/lib/draft/matchEngineIntegration';
import {
  Play,
  Pause,
  Zap,
  FastForward,
  Activity,
  Award,
  Clock,
  Shield,
  BarChart3,
  Users,
  FileText,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Flame,
  Check,
  ChevronRight,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface DraftLiveMatchModalProps {
  fixture: DraftFixture | null;
  clubs: DraftClub[];
  playerPool: Player[];
  isOpen: boolean;
  onClose: () => void;
  onMatchFinished: (updatedFixture: DraftFixture) => void;
}

export function DraftLiveMatchModal({
  fixture,
  clubs,
  playerPool,
  isOpen,
  onClose,
  onMatchFinished,
}: DraftLiveMatchModalProps) {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'STATS' | 'EVENTS' | 'LINEUPS'>('RADAR');
  const [speed, setSpeed] = useState<number>(2); // 1 = 1x, 2 = 2x, 3 = 3x, 4 = 4x
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [engineState, setEngineState] = useState<MatchEngineState | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Substitution state during match
  const [selectedSubOutId, setSelectedSubOutId] = useState<string | null>(null);
  const [selectedSubInId, setSelectedSubInId] = useState<string | null>(null);
  const [subNotification, setSubNotification] = useState<string | null>(null);

  const engineRef = useRef<MatchEngine | null>(null);

  useEffect(() => {
    if (!isOpen || !fixture) {
      engineRef.current = null;
      setEngineState(null);
      setIsFinished(false);
      return;
    }

    const homeClub = clubs.find((c) => c.id === fixture.homeClubId);
    const awayClub = clubs.find((c) => c.id === fixture.awayClubId);

    if (!homeClub || !awayClub) return;

    const homeClubModel = draftClubToClub(homeClub);
    const awayClubModel = draftClubToClub(awayClub);

    const homePlayers = playerPool.filter((p) => homeClub.squadPlayerIds.includes(p.id));
    const awayPlayers = playerPool.filter((p) => awayClub.squadPlayerIds.includes(p.id));

    const homeTacticsSettings: TacticalSettings = fixture.homeTactics?.settings || {
      mentality: 'Dengeli',
      tempo: 'Standart',
      pressing: 'Orta',
      passingStyle: 'Kısa',
      defensiveLine: 'Standart',
      width: 'Dengeli',
    };

    const awayTacticsSettings: TacticalSettings = fixture.awayTactics?.settings || {
      mentality: 'Dengeli',
      tempo: 'Standart',
      pressing: 'Orta',
      passingStyle: 'Kısa',
      defensiveLine: 'Standart',
      width: 'Dengeli',
    };

    const homeFormation = (fixture.homeTactics?.formation as Formation) || '4-3-3';
    const awayFormation = (fixture.awayTactics?.formation as Formation) || '4-3-3';

    const homeStartingIds = fixture.homeTactics?.lineup
      ? fixture.homeTactics.lineup.map((s) => s.playerId).filter(Boolean) as string[]
      : undefined;

    const awayStartingIds = fixture.awayTactics?.lineup
      ? fixture.awayTactics.lineup.map((s) => s.playerId).filter(Boolean) as string[]
      : undefined;

    const engine = new MatchEngine(
      homeClubModel,
      awayClubModel,
      homePlayers,
      awayPlayers,
      homeTacticsSettings,
      awayTacticsSettings,
      homeFormation,
      awayFormation,
      homeStartingIds,
      awayStartingIds,
      fixture.id,
      { isCompetitive: true, enableHomeAdvantage: true, homeAdvantageMultiplier: 1.06 }
    );

    // If already completed previously, fast forward
    if (fixture.status === 'COMPLETED' && fixture.matchResult) {
      engineRef.current = engine;
      setEngineState(fixture.matchResult);
      setIsFinished(true);
      setIsPlaying(false);
      return;
    }

    engineRef.current = engine;
    setEngineState(engine.getState());
    setIsPlaying(true);
    setIsFinished(false);
  }, [isOpen, fixture?.id]);

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying || !engineRef.current || isFinished) return;

    const intervalMs = speed === 4 ? 90 : speed === 3 ? 180 : speed === 2 ? 320 : 600;

    const timer = setInterval(() => {
      if (!engineRef.current) return;

      const step = engineRef.current.simulateMinute();
      const updatedState = { ...engineRef.current.getState() };
      setEngineState(updatedState);

      if (step.isFinished) {
        setIsPlaying(false);
        setIsFinished(true);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, isFinished]);

  if (!isOpen || !fixture) return null;

  const homeClub = clubs.find((c) => c.id === fixture.homeClubId);
  const awayClub = clubs.find((c) => c.id === fixture.awayClubId);

  // Handle Instant Finish
  const handleInstantFinish = () => {
    if (!engineRef.current) return;
    const finalState = engineRef.current.simulateFullMatch();
    setEngineState({ ...finalState });
    setIsPlaying(false);
    setIsFinished(true);
  };

  // Finalize & Save Result
  const handleSaveAndClose = () => {
    if (!engineState || !fixture) {
      onClose();
      return;
    }

    const updatedFixture: DraftFixture = {
      ...fixture,
      status: 'COMPLETED',
      homeScore: engineState.homeScore,
      awayScore: engineState.awayScore,
      matchResult: engineState,
      simulatedAt: new Date().toISOString(),
    };

    onMatchFinished(updatedFixture);
    onClose();
  };

  // Perform live substitution
  const handlePerformSubstitution = (isHome: boolean) => {
    if (!engineRef.current || !selectedSubOutId || !selectedSubInId) return;

    const res = engineRef.current.makeSubstitution(isHome, selectedSubOutId, selectedSubInId);
    if (res.success) {
      setSubNotification(res.message || 'Oyuncu değişikliği yapıldı.');
      setEngineState({ ...engineRef.current.getState() });
      setSelectedSubOutId(null);
      setSelectedSubInId(null);
      setTimeout(() => setSubNotification(null), 3500);
    } else {
      setSubNotification(res.message || 'Değişiklik yapılamadı.');
      setTimeout(() => setSubNotification(null), 3000);
    }
  };

  const currentMinute = engineState?.minute || 0;
  const homeScore = engineState?.homeScore ?? 0;
  const awayScore = engineState?.awayScore ?? 0;

  const homeStats = engineState?.home.stats || {
    shots: 0,
    shotsOnTarget: 0,
    xG: 0,
    passes: 0,
    completedPasses: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
  };

  const awayStats = engineState?.away.stats || {
    shots: 0,
    shotsOnTarget: 0,
    xG: 0,
    passes: 0,
    completedPasses: 0,
    corners: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
  };

  const totalPasses = (homeStats.passes || 1) + (awayStats.passes || 1);
  const homePossession = Math.round(((homeStats.passes || 1) / totalPasses) * 100);
  const awayPossession = 100 - homePossession;

  const events = engineState?.events || [];
  const homePlayersList = engineState?.home.players ? Object.values(engineState.home.players) : [];
  const awayPlayersList = engineState?.away.players ? Object.values(engineState.away.players) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#04060A]/90 backdrop-blur-md animate-in fade-in duration-200 select-none font-sans">
      <div className="bg-[#070D14] border-2 border-zinc-800 max-w-5xl w-full h-[95vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Top Glow Light */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#00F5A0] via-[#00D4FF] to-transparent shadow-[0_0_15px_#00F5A0]" />

        {/* Header Broadcast Scoreboard */}
        <div className="bg-[#0A101A] border-b border-zinc-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-black uppercase px-2.5 py-0.5 bg-[#00F5A0]/10 border border-[#00F5A0]/40 text-[#00F5A0]">
              HAFTA {fixture.round} // CANLI MAÇ MERKEZİ
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300">
              <span className={`w-2 h-2 rounded-full ${isFinished ? 'bg-[#FFB800]' : 'bg-[#00F5A0] animate-ping'}`} />
              <span>{isFinished ? "MAÇ SONU (90')" : `${currentMinute}' DAKİKA`}</span>
            </div>
          </div>

          {/* Speed & Sim Controls */}
          <div className="flex items-center gap-1.5">
            {!isFinished && (
              <>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-bold uppercase transition flex items-center gap-1"
                  title={isPlaying ? 'Durdur' : 'Oynat'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-[#FFB800]" /> : <Play className="w-3.5 h-3.5 text-[#00F5A0] fill-current" />}
                  <span className="hidden sm:inline">{isPlaying ? 'DURDUR' : 'OYNAT'}</span>
                </button>

                {/* 1x, 2x, 3x, 4x Speed Pills */}
                {[1, 2, 3, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpeed(s);
                      setIsPlaying(true);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono font-black transition border ${
                      speed === s && isPlaying
                        ? 'bg-[#00F5A0] text-black border-[#00F5A0] shadow-[0_0_10px_#00F5A0]'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}

                <button
                  onClick={handleInstantFinish}
                  className="px-3 py-1.5 bg-[#00D4FF] hover:bg-[#00B4E0] text-black text-xs font-black uppercase tracking-wider transition flex items-center gap-1 ml-1"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">HIZLI BİTİR</span>
                </button>
              </>
            )}

            {isFinished && (
              <button
                onClick={handleSaveAndClose}
                className="px-5 py-2 bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#00F5A0]/20 flex items-center gap-1.5 active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>LİGE DÖN & KAYDET</span>
              </button>
            )}
          </div>
        </div>

        {/* Big Teams Score Banner */}
        <div className="bg-[#05080E] border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center gap-3.5 flex-1 justify-start">
            {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={54} />}
            <div>
              <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                {homeClub?.name}
              </div>
              <div className="text-[11px] text-zinc-400 font-bold">
                {homeClub?.managerName} • <span className="text-[#00F5A0] font-mono">{engineState?.home.formation || '4-3-3'}</span>
              </div>
            </div>
          </div>

          {/* Center Score */}
          <div className="text-center px-4">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-widest bg-zinc-950 px-5 py-1.5 border border-zinc-800 shadow-inner">
              <span className={homeScore > awayScore ? 'text-[#00F5A0]' : 'text-white'}>{homeScore}</span>
              <span className="text-zinc-600 mx-2">-</span>
              <span className={awayScore > homeScore ? 'text-[#00F5A0]' : 'text-white'}>{awayScore}</span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3.5 flex-1 justify-end text-right">
            <div>
              <div className="text-sm sm:text-base font-black text-white uppercase italic tracking-wide truncate">
                {awayClub?.name}
              </div>
              <div className="text-[11px] text-zinc-400 font-bold">
                {awayClub?.managerName} • <span className="text-[#00D4FF] font-mono">{engineState?.away.formation || '4-3-3'}</span>
              </div>
            </div>
            {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={54} />}
          </div>
        </div>

        {/* Sub-tabs Ribbon */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-zinc-800 bg-[#070D14]">
          {[
            { id: 'RADAR', label: 'Canlı Radar Saha', icon: Activity },
            { id: 'EVENTS', label: `Canlı Anlatım (${events.length})`, icon: FileText },
            { id: 'STATS', label: 'Maç İstatistikleri', icon: BarChart3 },
            { id: 'LINEUPS', label: 'Oyuncu Reytingleri & Değişiklik', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition border-b-2 flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#00F5A0] border-[#00F5A0] bg-[#00F5A0]/5'
                    : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification Pill */}
        {subNotification && (
          <div className="px-6 py-2 bg-emerald-950 border-b border-emerald-500/50 text-[#00F5A0] text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{subNotification}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#04060A]">
          {/* TAB 1: 2D RADAR PITCH */}
          {activeTab === 'RADAR' && engineState && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="h-88 sm:h-96 w-full relative border-2 border-emerald-500/40 shadow-2xl overflow-hidden bg-[#071d13]">
                <TacticalRadarPitch
                  state={engineState}
                  speed={speed}
                  isPlaying={isPlaying}
                />
              </div>

              {/* Latest Commentary Bar */}
              <div className="bg-zinc-950 p-3.5 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <span className="font-mono font-black text-[#00F5A0] px-2 py-0.5 bg-zinc-900 border border-zinc-800">
                    {engineState.latestEvent ? `${engineState.latestEvent.minute}'` : `${currentMinute}'`}
                  </span>
                  <span className="font-bold text-white truncate">
                    {engineState.latestEvent?.commentary || engineState.latestEvent?.description || 'Karşılaşma orta sahada dengeli mücadeleyle sürüyor...'}
                  </span>
                </div>
                {engineState.lastAttackingAction && (
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase hidden sm:inline">
                    {engineState.lastAttackingAction.type} ({engineState.lastAttackingAction.direction === 'HOME_ATTACK' ? homeClub?.name : awayClub?.name})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EVENTS & COMMENTARY */}
          {activeTab === 'EVENTS' && (
            <div className="max-w-3xl mx-auto space-y-2.5">
              {events.length === 0 ? (
                <div className="text-xs text-zinc-500 text-center py-10">Henüz önemli bir olay kaydedilmedi.</div>
              ) : (
                [...events].reverse().map((ev: MatchEngineEvent, idx: number) => {
                  const isGoal = ev.type === 'GOAL';
                  const isCard = ev.type === 'YELLOW_CARD' || ev.type === 'RED_CARD';
                  const isSub = ev.type === 'SUBSTITUTION';
                  const typeIcon = isGoal ? '⚽' : isCard ? (ev.type === 'YELLOW_CARD' ? '🟨' : '🟥') : isSub ? '🔄' : '⚡';

                  return (
                    <div
                      key={idx}
                      className={`p-3 border flex items-center gap-3 text-xs ${
                        isGoal
                          ? 'bg-amber-950/40 border-[#FFB800] text-amber-200'
                          : isCard
                          ? 'bg-rose-950/30 border-rose-600 text-rose-200'
                          : isSub
                          ? 'bg-cyan-950/30 border-[#00D4FF]/40 text-cyan-200'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span className="font-mono font-black px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[#00F5A0] text-[11px]">
                        {ev.minute}'
                      </span>
                      <span className="text-base">{typeIcon}</span>
                      <span className="font-bold flex-1">{ev.commentary || ev.description}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: STATS COMPARISON */}
          {activeTab === 'STATS' && (
            <div className="max-w-3xl mx-auto bg-[#070D14] border border-zinc-800 p-6 space-y-4">
              <h3 className="text-sm font-black text-white uppercase italic tracking-wider border-b border-zinc-800 pb-3 text-center">
                CANLI MAÇ İSTATİSTİKLERİ
              </h3>

              {/* Stats Rows */}
              {[
                { label: 'Topla Oynama (%)', home: `${homePossession}%`, away: `${awayPossession}%`, homeVal: homePossession, awayVal: awayPossession },
                { label: 'Gol Beklentisi (xG)', home: (homeStats.xG || 0).toFixed(2), away: (awayStats.xG || 0).toFixed(2), homeVal: homeStats.xG, awayVal: awayStats.xG },
                { label: 'Toplam Şut', home: homeStats.shots, away: awayStats.shots, homeVal: homeStats.shots, awayVal: awayStats.shots },
                { label: 'İsabetli Şut', home: homeStats.shotsOnTarget, away: awayStats.shotsOnTarget, homeVal: homeStats.shotsOnTarget, awayVal: awayStats.shotsOnTarget },
                { label: 'Korner', home: homeStats.corners, away: awayStats.corners, homeVal: homeStats.corners, awayVal: awayStats.corners },
                { label: 'Faul', home: homeStats.fouls, away: awayStats.fouls, homeVal: homeStats.fouls, awayVal: awayStats.fouls },
                { label: 'Sarı Kart', home: homeStats.yellowCards, away: awayStats.yellowCards, homeVal: homeStats.yellowCards, awayVal: awayStats.yellowCards },
                { label: 'Kırmızı Kart', home: homeStats.redCards, away: awayStats.redCards, homeVal: homeStats.redCards, awayVal: awayStats.redCards },
              ].map((stat, i) => (
                <div key={i} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span className="text-[#00F5A0] font-black text-sm">{stat.home}</span>
                    <span className="text-zinc-400 uppercase text-[11px] font-sans">{stat.label}</span>
                    <span className="text-[#00D4FF] font-black text-sm">{stat.away}</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 border border-zinc-800 flex overflow-hidden">
                    <div
                      className="bg-[#00F5A0] h-full transition-all duration-300"
                      style={{ width: `${Math.max(5, (Number(stat.homeVal || 0) / Math.max(1, Number(stat.homeVal || 0) + Number(stat.awayVal || 0))) * 100)}%` }}
                    />
                    <div
                      className="bg-[#00D4FF] h-full transition-all duration-300 ml-auto"
                      style={{ width: `${Math.max(5, (Number(stat.awayVal || 0) / Math.max(1, Number(stat.homeVal || 0) + Number(stat.awayVal || 0))) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LIVE RATINGS & SUBSTITUTIONS */}
          {activeTab === 'LINEUPS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Home Lineup */}
              <div className="bg-[#070D14] border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="text-xs font-black text-white uppercase truncate flex items-center gap-2">
                    {homeClub && <BadgePreview badge={homeClub.badge} clubCode={homeClub.code} size={20} />}
                    <span>{homeClub?.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00F5A0] font-bold">İlk 11 & Yedekler</span>
                </div>

                <div className="space-y-1.5">
                  {homePlayersList.map((p) => {
                    const isPitch = p.isOnPitch;
                    const isSelectedOut = selectedSubOutId === p.player.id;
                    const isSelectedIn = selectedSubInId === p.player.id;

                    return (
                      <div
                        key={p.player.id}
                        className={`p-2 border flex items-center justify-between text-xs transition ${
                          isSelectedOut || isSelectedIn
                            ? 'bg-[#00F5A0]/20 border-[#00F5A0]'
                            : isPitch
                            ? 'bg-zinc-950 border-zinc-800'
                            : 'bg-zinc-950/50 border-zinc-900 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black ${isPitch ? 'bg-[#00F5A0] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                            {p.currentPosition || p.player.position}
                          </span>
                          <span className="font-bold text-white truncate">{p.player.firstName} {p.player.lastName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-400 text-[10px]">{p.currentFitness}% FİZ</span>
                          <span className="font-mono font-black text-[#FFB800] text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800">
                            {p.matchRating.toFixed(1)}
                          </span>

                          {!isFinished && (
                            <button
                              onClick={() => {
                                if (isPitch) {
                                  setSelectedSubOutId(selectedSubOutId === p.player.id ? null : p.player.id);
                                } else {
                                  setSelectedSubInId(selectedSubInId === p.player.id ? null : p.player.id);
                                }
                              }}
                              className={`px-2 py-0.5 text-[10px] font-black uppercase transition ${
                                isPitch
                                  ? isSelectedOut ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:text-white'
                                  : isSelectedIn ? 'bg-[#00F5A0] text-black' : 'bg-zinc-800 text-[#00F5A0] hover:bg-zinc-700'
                              }`}
                            >
                              {isPitch ? (isSelectedOut ? 'İptal' : 'Çıkar') : (isSelectedIn ? 'Seçildi' : 'Oyuna Al')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedSubOutId && selectedSubInId && (
                  <button
                    onClick={() => handlePerformSubstitution(true)}
                    className="w-full py-2.5 bg-[#00F5A0] hover:bg-[#00D485] text-black font-black text-xs uppercase tracking-wider transition shadow-lg mt-2"
                  >
                    ✓ DEĞİŞİKLİĞİ ONAYLA
                  </button>
                )}
              </div>

              {/* Away Lineup */}
              <div className="bg-[#070D14] border border-zinc-800 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="text-xs font-black text-white uppercase truncate flex items-center gap-2">
                    {awayClub && <BadgePreview badge={awayClub.badge} clubCode={awayClub.code} size={20} />}
                    <span>{awayClub?.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00D4FF] font-bold">İlk 11 & Yedekler</span>
                </div>

                <div className="space-y-1.5">
                  {awayPlayersList.map((p) => {
                    const isPitch = p.isOnPitch;
                    return (
                      <div
                        key={p.player.id}
                        className={`p-2 border flex items-center justify-between text-xs ${
                          isPitch ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-950/50 border-zinc-900 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-black ${isPitch ? 'bg-[#00D4FF] text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                            {p.currentPosition || p.player.position}
                          </span>
                          <span className="font-bold text-white truncate">{p.player.firstName} {p.player.lastName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-zinc-400 text-[10px]">{p.currentFitness}% FİZ</span>
                          <span className="font-mono font-black text-[#FFB800] text-xs px-2 py-0.5 bg-zinc-900 border border-zinc-800">
                            {p.matchRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0A101A] border-t border-zinc-800 px-6 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-bold uppercase transition"
          >
            KAPAT
          </button>

          {isFinished && (
            <button
              onClick={handleSaveAndClose}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00F5A0] to-[#00D485] hover:from-[#00E590] text-black font-black text-xs uppercase tracking-wider transition shadow-lg shadow-[#00F5A0]/20 flex items-center gap-2"
            >
              <span>LİGE DÖN & SKORU KAYDET</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
