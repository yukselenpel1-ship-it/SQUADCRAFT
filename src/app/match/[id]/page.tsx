'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { MatchEngine } from '@/lib/match-engine/engine';
import { MatchEngineState, MatchEngineEvent } from '@/lib/match-engine/types';
import { TacticalRadarPitch } from '@/components/match/TacticalRadarPitch';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { FifaMatchReportModal } from '@/components/match/FifaMatchReportModal';
import { findManOfTheMatch } from '@/lib/match-engine/matchStats';
import {
  Play,
  Pause,
  Zap,
  RotateCcw,
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Activity,
  Award,
  AlertCircle,
  CheckCircle,
  Swords,
  Sliders,
  Users,
  FastForward,
  Trophy,
  Flame,
  FileText,
  Info,
} from 'lucide-react';
import { Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width, Player, Formation } from '@/types/game';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';

function getOptimalLineupForFormation(players: Player[], formation: Formation): string[] {
  const slots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-2-3-1'];
  const selectedIds: string[] = [];

  for (const slot of slots) {
    let match = players.find(
      (p) => !selectedIds.includes(p.id) && !p.isInjured && !p.isSuspended && p.position === slot.role
    );
    if (!match) {
      match = players.find(
        (p) => !selectedIds.includes(p.id) && !p.isInjured && !p.isSuspended && p.secondaryPositions?.includes(slot.role)
      );
    }
    if (!match) {
      const isDef = ['DR', 'DC', 'DL'].includes(slot.role);
      const isMid = ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(slot.role);
      const isAtt = ['ST', 'AML', 'AMR'].includes(slot.role);
      const isGK = slot.role === 'GK';

      match = players
        .filter((p) => !selectedIds.includes(p.id) && !p.isInjured && !p.isSuspended)
        .sort((a, b) => b.overall - a.overall)
        .find((p) => {
          if (isGK) return p.position === 'GK';
          if (isDef) return ['DR', 'DC', 'DL', 'DMC'].includes(p.position);
          if (isMid) return ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(p.position);
          if (isAtt) return ['ST', 'AML', 'AMR', 'AMC'].includes(p.position);
          return false;
        });
    }
    if (!match) {
      match = players
        .filter((p) => !selectedIds.includes(p.id) && !p.isInjured && !p.isSuspended)
        .sort((a, b) => b.overall - a.overall)[0];
    }
    if (!match && players.length > 0) {
      match = players.find((p) => !selectedIds.includes(p.id)) || players[0];
    }
    if (match) {
      selectedIds.push(match.id);
    }
  }

  return selectedIds;
}

export default function MatchCenterPage() {
  const params = useParams();
  const router = useRouter();
  const { fixtures, allClubs, allPlayers, userClub, tactics, applyMatchResult, isCareerHydrated, isInitialized } = useGame();

  const matchId = params?.id as string;
  const fixture = fixtures.find((f) => f.id === matchId) || fixtures[0];

  const homeClub = allClubs.find((c) => c.id === fixture?.homeClubId) || allClubs[0];
  const awayClub = allClubs.find((c) => c.id === fixture?.awayClubId) || allClubs[1];

  const homePlayers = homeClub ? allPlayers.filter((p) => p.clubId === homeClub.id) : [];
  const awayPlayers = awayClub ? allPlayers.filter((p) => p.clubId === awayClub.id) : [];

  // Engine instance reference
  const engineRef = useRef<MatchEngine | null>(null);

  // Engine state in React
  const [engineState, setEngineState] = useState<MatchEngineState | null>(null);

  // Simulation controls
  const [speed, setSpeed] = useState<number>(1); // 0 = pause, 1 = 1x, 2 = 2x, 4 = 4x
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Tabs & Modals
  const [activeCenterTab, setActiveCenterTab] = useState<'RADAR' | 'TIMELINE' | 'COMMENTARY' | 'TACTICS' | 'SUBS'>('RADAR');
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [showPostMatchModal, setShowPostMatchModal] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);

  // Substitution state
  const [selectedSubOutId, setSelectedSubOutId] = useState<string | null>(null);
  const [selectedSubInId, setSelectedSubInId] = useState<string | null>(null);
  const [subMessage, setSubMessage] = useState<string | null>(null);

  // Initialize engine on load
  useEffect(() => {
    if (!isCareerHydrated || !isInitialized || !fixture || !homeClub || !awayClub || homePlayers.length === 0 || awayPlayers.length === 0) return;

    const isUserHome = homeClub.id === userClub.id;
    const userTacticsSettings = tactics?.settings || {
      mentality: (tactics as any)?.mentality || ('Dengeli' as Mentality),
      tempo: (tactics as any)?.tempo || ('Standart' as Tempo),
      pressing: (tactics as any)?.pressing || ('Orta' as Pressing),
      passingStyle: (tactics as any)?.passingStyle || ('Karışık' as PassingStyle),
      defensiveLine: (tactics as any)?.defensiveLine || ('Standart' as DefensiveLine),
      width: (tactics as any)?.width || ('Dengeli' as Width),
    };
    const opponentTacticsSettings = {
      mentality: 'Dengeli' as Mentality,
      tempo: 'Standart' as Tempo,
      pressing: 'Orta' as Pressing,
      passingStyle: 'Karışık' as PassingStyle,
      defensiveLine: 'Standart' as DefensiveLine,
      width: 'Dengeli' as Width,
    };

    const homeTact = isUserHome ? userTacticsSettings : opponentTacticsSettings;
    const awayTact = !isUserHome ? userTacticsSettings : opponentTacticsSettings;

    const homeFormation = isUserHome ? tactics.formation : '4-2-3-1';
    const awayFormation = !isUserHome ? tactics.formation : '4-2-3-1';

    let startingHomeIds: string[] = [];
    if (isUserHome) {
      const userIds = ((tactics?.lineup || (tactics as any)?.startingLineup || []) as any[])
        .map((s) => s?.playerId)
        .filter(Boolean) as string[];
      if (new Set(userIds).size === 11) {
        startingHomeIds = userIds;
      } else {
        startingHomeIds = getOptimalLineupForFormation(homePlayers, homeFormation);
      }
    } else {
      startingHomeIds = getOptimalLineupForFormation(homePlayers, homeFormation);
    }

    let startingAwayIds: string[] = [];
    if (!isUserHome) {
      const userIds = ((tactics?.lineup || (tactics as any)?.startingLineup || []) as any[])
        .map((s) => s?.playerId)
        .filter(Boolean) as string[];
      if (new Set(userIds).size === 11) {
        startingAwayIds = userIds;
      } else {
        startingAwayIds = getOptimalLineupForFormation(awayPlayers, awayFormation);
      }
    } else {
      startingAwayIds = getOptimalLineupForFormation(awayPlayers, awayFormation);
    }

    const engine = new MatchEngine(
      homeClub,
      awayClub,
      homePlayers,
      awayPlayers,
      homeTact,
      awayTact,
      homeFormation,
      awayFormation,
      startingHomeIds,
      startingAwayIds,
      fixture.id,
      { isCompetitive: true, enableHomeAdvantage: true, homeAdvantageMultiplier: 1.06 }
    );

    // If fixture was already finished previously, fast-simulate to end
    if (fixture.status === 'FINISHED') {
      engine.simulateFullMatch();
    }

    engineRef.current = engine;
    setEngineState(engine.getState());
  }, [matchId, fixture?.id, allPlayers.length, allClubs.length]);

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying || !engineRef.current || speed === 0) return;

    const intervalMs = speed === 4 ? 110 : speed === 3 ? 200 : speed === 2 ? 340 : 600;

    const timer = setInterval(() => {
      if (!engineRef.current) return;

      const step = engineRef.current.simulateMinute();
      const updatedState = { ...engineRef.current.getState() };
      setEngineState(updatedState);

      if (step.isFinished) {
        setIsPlaying(false);
        handleMatchCompletion(updatedState);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Handle Match Finish & Sync to League Standings & Players
  const handleMatchCompletion = (finalState: MatchEngineState) => {
    setShowPostMatchModal(true);

    const playerUpdates: {
      playerId: string;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      matchRating: number;
      fitness: number;
    }[] = [];

    Object.values(finalState.home.players).forEach((p) => {
      playerUpdates.push({
        playerId: p.player.id,
        goals: p.goals,
        assists: p.assists,
        yellowCards: p.yellowCards,
        redCards: p.redCards,
        matchRating: p.matchRating,
        fitness: p.currentFitness,
      });
    });

    Object.values(finalState.away.players).forEach((p) => {
      playerUpdates.push({
        playerId: p.player.id,
        goals: p.goals,
        assists: p.assists,
        yellowCards: p.yellowCards,
        redCards: p.redCards,
        matchRating: p.matchRating,
        fitness: p.currentFitness,
      });
    });

    applyMatchResult(
      finalState.fixtureId,
      finalState.homeScore,
      finalState.awayScore,
      finalState.events,
      {
        possession: [finalState.homePossessionPercent, finalState.awayPossessionPercent],
        shots: [finalState.home.stats.shots, finalState.away.stats.shots],
        shotsOnTarget: [finalState.home.stats.shotsOnTarget, finalState.away.stats.shotsOnTarget],
        corners: [finalState.home.stats.corners, finalState.away.stats.corners],
        fouls: [finalState.home.stats.fouls, finalState.away.stats.fouls],
        yellowCards: [finalState.home.stats.yellowCards, finalState.away.stats.yellowCards],
        redCards: [finalState.home.stats.redCards, finalState.away.stats.redCards],
        passAccuracy: [
          Math.round((finalState.home.stats.completedPasses / Math.max(1, finalState.home.stats.passes)) * 100),
          Math.round((finalState.away.stats.completedPasses / Math.max(1, finalState.away.stats.passes)) * 100),
        ],
        xg: [finalState.home.stats.xG, finalState.away.stats.xG],
      },
      playerUpdates
    );
  };

  // Instant Full Match Simulation
  const handleInstantResult = () => {
    if (!engineRef.current) return;
    setIsPlaying(false);
    const finalState = engineRef.current.simulateFullMatch();
    setEngineState({ ...finalState });
    handleMatchCompletion(finalState);
  };

  // Live Tactical Changes handler
  const handleLiveTacticsChange = (newTactics: Partial<typeof tactics.settings>) => {
    if (!engineRef.current) return;
    const isHome = homeClub.id === userClub.id;
    engineRef.current.applyTactics(isHome, newTactics);
    setEngineState({ ...engineRef.current.getState() });
  };

  // Live Substitution handler
  const handleConfirmSubstitution = () => {
    if (!engineRef.current || !selectedSubOutId || !selectedSubInId) return;

    const isHome = homeClub.id === userClub.id;
    const res = engineRef.current.makeSubstitution(isHome, selectedSubOutId, selectedSubInId);

    setSubMessage(res.message);
    if (res.success) {
      setSelectedSubOutId(null);
      setSelectedSubInId(null);
      setEngineState({ ...engineRef.current.getState() });
      setTimeout(() => setSubMessage(null), 3500);
    }
  };

  if (!isCareerHydrated || !isInitialized || !engineState) {
    return (
      <CareerLoadingState
        title="MAÇ MOTORU VE TAKTİKSEL RADAR BAŞLATILIYOR"
        message="22 oyunculu simülasyon motoru, canlı istatistikler ve stadyum atmosferi hazırlanıyor..."
      />
    );
  }

  const manOfTheMatch = engineState.isFinished
    ? findManOfTheMatch(engineState.home.players, engineState.away.players)
    : null;

  const isUserHome = homeClub.id === userClub.id;
  const userTeamState = isUserHome ? engineState.home : engineState.away;

  return (
    <div className="sc-career-match-readable space-y-5 px-3 sm:px-6 py-4 animate-in fade-in duration-300">
      {/* 1. Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090d0a] hover:bg-[#141b16] border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fikstüre Dön</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-[#b7ff35]/10 text-[#b7ff35] border border-[#b7ff35]/30 font-ibm">
            Alveria Elit Ligi • Hafta {fixture?.round}
          </span>
          <span className="hidden md:inline font-ibm">{fixture?.date}</span>
        </div>
      </div>

      {/* 2. LIVE SCOREBOARD & HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl sc-panel border border-white/10 p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b7ff35] to-[#17e5c2]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#b7ff35]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Match Clock & Venue Pill */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-5">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0d120f] border border-white/10 text-xs font-black shadow-lg">
            <Clock className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#b7ff35] animate-spin' : 'text-zinc-400'}`} />
            <span className="text-white tracking-wider font-ibm">
              {engineState.minute === 0
                ? 'MAÇ BAŞLAMADI'
                : engineState.isFinished
                ? 'MAÇ SONUCU (MS)'
                : engineState.minute === 45
                ? 'İLK YARI (İY)'
                : `${engineState.minute}' DAKİKA`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-300">
            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
            <span>{fixture?.stadium || homeClub.stadium}</span>
          </div>
        </div>

        {/* Scoreboard Clubs & Giant Digit Display */}
        <div className="relative z-10 grid grid-cols-7 items-center gap-2 sm:gap-4">
          {/* Home Club */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <ClubBadge
              code={homeClub.code}
              primaryColor={homeClub.primaryColor}
              secondaryColor={homeClub.secondaryColor}
              size="lg"
            />
            <h2 className="mt-2.5 text-base sm:text-2xl font-black text-white break-words max-w-full font-barlow leading-tight">
              {homeClub.name}
            </h2>
            <span className="text-xs sm:text-sm text-zinc-300 break-words">
              {homeClub.managerName}
            </span>
          </div>

          {/* Central Score Card */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl bg-[#050806] border border-white/10 shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {engineState.homeScore}
              </span>
              <span className="text-xl sm:text-3xl font-black text-[#b7ff35]">:</span>
              <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {engineState.awayScore}
              </span>
            </div>
          </div>

          {/* Away Club */}
          <div className="col-span-3 flex flex-col items-center text-center">
            <ClubBadge
              code={awayClub.code}
              primaryColor={awayClub.primaryColor}
              secondaryColor={awayClub.secondaryColor}
              size="lg"
            />
            <h2 className="mt-2.5 text-base sm:text-2xl font-black text-white break-words max-w-full font-barlow leading-tight">
              {awayClub.name}
            </h2>
            <span className="text-xs sm:text-sm text-zinc-300 break-words">
              {awayClub.managerName}
            </span>
          </div>
        </div>

        {/* Simulation Control Buttons Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={engineState.isFinished}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
              engineState.isFinished
                ? 'bg-[#090d0a] text-zinc-500 cursor-not-allowed border border-white/10'
                : isPlaying
                ? 'bg-amber-400 text-[#050806] shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-[#b7ff35] text-[#050806] shadow-[0_0_20px_rgba(183, 255, 53,0.3)] hover:bg-[#b7ff35]/90'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Durdur (Pause)' : engineState.minute === 0 ? 'Maçı Başlat' : 'Devam Et'}</span>
          </button>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1 bg-[#0d120f] p-1 rounded-xl border border-white/10">
            {[
              { val: 1, label: '1x' },
              { val: 2, label: '2x' },
              { val: 3, label: '3x' },
              { val: 4, label: '4x' },
            ].map((s) => (
              <button
                key={s.val}
                onClick={() => {
                  setSpeed(s.val);
                  setIsPlaying(true);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                  speed === s.val && isPlaying
                    ? 'bg-[#b7ff35] text-[#050806] shadow-[0_0_10px_rgba(183, 255, 53,0.2)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Instant Result */}
          <button
            onClick={handleInstantResult}
            disabled={engineState.isFinished}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-[#090d0a] hover:bg-[#141b16] border border-white/10 text-zinc-200 transition-colors disabled:opacity-50"
            title="Aynı simülasyon motorunu 90. dakikaya kadar tek seferde çalıştırır."
          >
            <FastForward className="w-3.5 h-3.5 text-[#b7ff35]" />
            <span>Hızlı Sonuç</span>
          </button>

          {/* Post Match Report Button if Finished */}
          {engineState.isFinished && (
            <button
              onClick={() => setShowPostMatchModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black bg-[#17e5c2] hover:bg-[#17e5c2]/90 text-[#050806] shadow-[0_0_15px_rgba(23, 229, 194,0.3)] transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Maç Raporu</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CENTER VIEW SWITCHER TABS */}
      <div className="flex flex-wrap items-center gap-1.5 sc-panel p-1.5 rounded-2xl border border-white/10 text-xs">
        <button
          onClick={() => setActiveCenterTab('RADAR')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'RADAR'
              ? 'bg-[#b7ff35] text-[#050806] font-black shadow-[0_0_15px_rgba(183, 255, 53,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#0E1728]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>2D Taktik Radarı</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('TIMELINE')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'TIMELINE'
              ? 'bg-[#b7ff35] text-[#050806] font-black shadow-[0_0_15px_rgba(183, 255, 53,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#0E1728]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Olay Zaman Çizelgesi ({engineState.events.length})</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('COMMENTARY')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'COMMENTARY'
              ? 'bg-[#b7ff35] text-[#050806] font-black shadow-[0_0_15px_rgba(183, 255, 53,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#0E1728]'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Canlı Anlatım Feed</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('TACTICS')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'TACTICS'
              ? 'bg-[#b7ff35] text-[#050806] font-black shadow-[0_0_15px_rgba(183, 255, 53,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#0E1728]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Canlı Taktik Ayarları</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('SUBS')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'SUBS'
              ? 'bg-[#b7ff35] text-[#050806] font-black shadow-[0_0_15px_rgba(183, 255, 53,0.3)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#0E1728]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Oyuncu Değişikliği ({userTeamState.substitutionsUsed}/5)</span>
        </button>
      </div>

      {/* 4. MAIN INTERACTIVE CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Interactive Panel (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB 1: 2D RADAR PITCH */}
          {activeCenterTab === 'RADAR' && (
            <div className="space-y-3">
              <TacticalRadarPitch
                state={engineState}
                speed={speed}
                isPlaying={isPlaying}
                onPlayerClick={(pId) => {
                  const p = allPlayers.find((item) => item.id === pId);
                  if (p) setInspectedPlayer(p);
                }}
              />

              {/* Latest commentary snippet banner */}
              {engineState.latestEvent && (
                <div className="p-3.5 rounded-2xl sc-panel border border-white/10 flex items-center gap-3 text-xs">
                  <span className="px-2.5 py-0.5 rounded-lg font-black bg-[#b7ff35] text-[#050806] font-ibm">
                    {engineState.latestEvent.minute}&apos;
                  </span>
                  <p className="text-zinc-200 font-semibold truncate font-ibm">
                    {engineState.latestEvent.commentary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeCenterTab === 'TIMELINE' && (
            <div className="p-5 rounded-2xl sc-panel border border-white/10 space-y-3 max-h-[500px] overflow-y-auto">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-white/10">
                Maç Olayları
              </h3>
              {engineState.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                    ev.type === 'GOAL'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-white'
                      : ev.type === 'RED_CARD'
                      ? 'bg-rose-950/40 border-rose-500/40 text-white'
                      : 'bg-[#0d120f] border-white/10 text-zinc-200'
                  }`}
                >
                  <span className="w-8 h-6 rounded-lg bg-[#050806] border border-white/10 font-black text-xs text-[#b7ff35] flex items-center justify-center shrink-0 font-ibm">
                    {ev.minute}&apos;
                  </span>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-1.5">
                      {ev.type === 'GOAL' && <span>⚽ GOL!</span>}
                      {ev.type === 'YELLOW_CARD' && <span>🟨 Sarı Kart</span>}
                      {ev.type === 'RED_CARD' && <span>🟥 Kırmızı Kart</span>}
                      {ev.type === 'SUBSTITUTION' && <span>🔄 Değişiklik</span>}
                      {ev.type === 'INJURY' && <span>🩹 Sakatlık</span>}
                      <span>{ev.playerName}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: COMMENTARY LOG */}
          {activeCenterTab === 'COMMENTARY' && (
            <div className="p-5 rounded-2xl sc-panel border border-white/10 space-y-2 max-h-[500px] overflow-y-auto font-ibm text-xs">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-white/10">
                Canlı Maç Anlatım Akışı
              </h3>
              {[...engineState.commentaryLog].reverse().map((line, idx) => (
                <div key={idx} className="py-2 border-b border-white/10/60 text-zinc-300">
                  <span className="text-[#b7ff35] font-bold mr-2">›</span>
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LIVE TACTICS */}
          {activeCenterTab === 'TACTICS' && (
            <div className="p-5 rounded-2xl sc-panel border border-white/10 space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-white/10">
                Canlı Taktik Talimatlarını Değiştir
              </h3>

              {/* Mentalite */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold block">Mentalite</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Çok Savunmacı', 'Savunmacı', 'Dengeli', 'Hücum', 'Aşırı Hücum'] as Mentality[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => handleLiveTacticsChange({ mentality: m })}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all ${
                        userTeamState.tactics.mentality === m ? 'bg-[#17e5c2] text-[#050806] font-black' : 'bg-[#0d120f] border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tempo */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold block">Oyun Temposu</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['Çok Düşük', 'Düşük', 'Standart', 'Yüksek', 'Çok Yüksek'] as Tempo[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleLiveTacticsChange({ tempo: t })}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all ${
                        userTeamState.tactics.tempo === t ? 'bg-[#b7ff35] text-[#050806] font-black' : 'bg-[#0d120f] border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pressing */}
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-300 font-bold block">Pres Yoğunluğu</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Hafif', 'Orta', 'Yoğun', 'Aşırı'] as Pressing[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleLiveTacticsChange({ pressing: p })}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all ${
                        userTeamState.tactics.pressing === p ? 'bg-amber-400 text-[#050806] font-black' : 'bg-[#0d120f] border border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE SUBSTITUTIONS */}
          {activeCenterTab === 'SUBS' && (
            <div className="p-5 rounded-2xl sc-panel border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="text-xs font-black uppercase text-zinc-300">
                  Oyuncu Değişikliği Masası ({userTeamState.substitutionsUsed}/5 Kullanıldı)
                </h3>
                {subMessage && (
                  <span className="text-xs font-bold text-[#b7ff35]">{subMessage}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* On-Pitch Players */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 mb-2">1. Sahadan Çıkacak Oyuncu</h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {userTeamState.activePitchPlayerIds.map((id) => {
                      const pim = userTeamState.players[id];
                      if (!pim) return null;
                      const isSelected = selectedSubOutId === id;

                      return (
                        <div
                          key={id}
                          onClick={() => setSelectedSubOutId(id)}
                          className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500/50 text-white'
                              : 'bg-[#0d120f] border-white/10 text-zinc-300 hover:bg-[#0E1728]'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white block">{pim.player.firstName} {pim.player.lastName}</span>
                            <span className="text-[10px] text-zinc-500">{pim.currentPosition} • Kondisyon: %{Math.round(pim.currentFitness)}</span>
                          </div>
                          <StatBadge value={pim.matchRating} size="sm" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bench Players */}
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 mb-2">2. Oyuna Girecek Yedek</h4>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {userTeamState.benchPlayerIds.map((id) => {
                      const pim = userTeamState.players[id];
                      if (!pim || pim.redCards > 0) return null;
                      const isSelected = selectedSubInId === id;

                      return (
                        <div
                          key={id}
                          onClick={() => setSelectedSubInId(id)}
                          className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                              : 'bg-[#0d120f] border-white/10 text-zinc-300 hover:bg-[#0E1728]'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-white block">{pim.player.firstName} {pim.player.lastName}</span>
                            <span className="text-[10px] text-zinc-500">{pim.player.position} • Güç: {pim.player.overall}</span>
                          </div>
                          <FitnessIndicator value={pim.currentFitness} compact={true} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={handleConfirmSubstitution}
                  disabled={!selectedSubOutId || !selectedSubInId || userTeamState.substitutionsUsed >= 5}
                  className="px-5 py-2.5 rounded-xl bg-[#b7ff35] text-[#050806] font-black text-xs hover:bg-[#b7ff35]/90 disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(183, 255, 53,0.3)]"
                >
                  Değişikliği Onayla
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Live Match Statistics & Team Ratings (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Live Stats Comparison Card */}
          <div className="p-5 rounded-2xl sc-panel border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 pb-2.5 border-b border-white/10">
              <Award className="w-4 h-4 text-[#b7ff35]" />
              Canlı Maç İstatistikleri
            </h3>

            {/* Possession Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-black">
                <span className="text-emerald-400">%{engineState.homePossessionPercent}</span>
                <span className="text-zinc-400 text-[10px] uppercase">Topa Sahip Olma</span>
                <span className="text-sky-400">%{engineState.awayPossessionPercent}</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-900 rounded-full flex overflow-hidden border border-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${engineState.homePossessionPercent}%` }}
                />
                <div
                  className="h-full bg-sky-500 transition-all duration-300"
                  style={{ width: `${engineState.awayPossessionPercent}%` }}
                />
              </div>
            </div>

            {/* Numeric Comparison Rows */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="font-black text-white">{engineState.home.stats.shots}</span>
                <span className="text-zinc-400">Toplam Şut</span>
                <span className="font-black text-white">{engineState.away.stats.shots}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="font-black text-emerald-400">{engineState.home.stats.shotsOnTarget}</span>
                <span className="text-zinc-400">İsabetli Şut</span>
                <span className="font-black text-sky-400">{engineState.away.stats.shotsOnTarget}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="font-black text-white">{engineState.home.stats.xG}</span>
                <span className="text-zinc-400">Gol Beklentisi (xG)</span>
                <span className="font-black text-white">{engineState.away.stats.xG}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="font-black text-white">{engineState.home.stats.corners}</span>
                <span className="text-zinc-400">Köşe Vuruşları</span>
                <span className="font-black text-white">{engineState.away.stats.corners}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/60">
                <span className="font-black text-white">{engineState.home.stats.saves}</span>
                <span className="text-zinc-400">Kaleci Kurtarışları</span>
                <span className="font-black text-white">{engineState.away.stats.saves}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="font-bold text-zinc-400">{engineState.home.stats.fouls}</span>
                <span className="text-zinc-400">Fauller</span>
                <span className="font-bold text-zinc-400">{engineState.away.stats.fouls}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. EA SPORTS FC / FIFA MODERN POST-MATCH REPORT MODAL */}
      <FifaMatchReportModal
        isOpen={showPostMatchModal}
        onClose={() => setShowPostMatchModal(false)}
        homeClub={homeClub}
        awayClub={awayClub}
        homeScore={engineState.homeScore}
        awayScore={engineState.awayScore}
        homeStats={engineState.home.stats}
        awayStats={engineState.away.stats}
        homePossessionPercent={engineState.homePossessionPercent}
        awayPossessionPercent={engineState.awayPossessionPercent}
        events={engineState.events}
        homePlayers={engineState.home.players}
        awayPlayers={engineState.away.players}
        manOfTheMatch={manOfTheMatch}
        round={fixture?.round}
        matchDate={fixture?.date}
        onInspectPlayer={(p) => setInspectedPlayer(p)}
        onViewStandings={() => router.push('/league')}
        onContinue={() => router.push('/fixtures')}
      />

      {/* 6. INSPECT PLAYER MODAL */}
      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          club={allClubs.find((c) => c.id === inspectedPlayer.clubId)}
          onClose={() => setInspectedPlayer(null)}
        />
      )}
    </div>
  );
}
