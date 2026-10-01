'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { MatchEngine } from '@/lib/match-engine/engine';
import { MatchEngineState, MatchEngineEvent } from '@/lib/match-engine/types';
import { TacticalRadarPitch } from '@/components/match/TacticalRadarPitch';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { PlayerModal } from '@/components/ui/PlayerModal';
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
  const { fixtures, allClubs, allPlayers, userClub, tactics, applyMatchResult } = useGame();

  const matchId = params?.id as string;
  const fixture = fixtures.find((f) => f.id === matchId) || fixtures[0];

  const homeClub = allClubs.find((c) => c.id === fixture?.homeClubId) || allClubs[0];
  const awayClub = allClubs.find((c) => c.id === fixture?.awayClubId) || allClubs[1];

  const homePlayers = allPlayers.filter((p) => p.clubId === homeClub.id);
  const awayPlayers = allPlayers.filter((p) => p.clubId === awayClub.id);

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
    if (!fixture || homePlayers.length === 0 || awayPlayers.length === 0) return;

    const isUserHome = homeClub.id === userClub.id;
    const userTacticsSettings = tactics.settings;
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

  if (!engineState) {
    return (
      <div className="p-12 text-center text-zinc-400">
        Maç motoru yükleniyor...
      </div>
    );
  }

  const manOfTheMatch = engineState.isFinished
    ? findManOfTheMatch(engineState.home.players, engineState.away.players)
    : null;

  const isUserHome = homeClub.id === userClub.id;
  const userTeamState = isUserHome ? engineState.home : engineState.away;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#121622] hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Fikstüre Dön</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-[#00F5A0] border border-emerald-500/30">
            Alveria Elit Ligi • Hafta {fixture?.round}
          </span>
          <span className="hidden md:inline">{fixture?.date}</span>
        </div>
      </div>

      {/* 2. LIVE SCOREBOARD & HEADER HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111728] via-[#0D121F] to-[#080B12] border border-[#1E293F] p-5 sm:p-7 shadow-2xl">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Match Clock & Venue Pill */}
        <div className="relative z-10 flex flex-col items-center justify-center mb-5">
          <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-black shadow-lg">
            <Clock className={`w-3.5 h-3.5 ${isPlaying ? 'text-[#00F5A0] animate-spin' : 'text-zinc-400'}`} />
            <span className="text-white tracking-wider">
              {engineState.minute === 0
                ? 'MAÇ BAŞLAMADI'
                : engineState.isFinished
                ? 'MAÇ SONUCU (MS)'
                : engineState.minute === 45
                ? 'İLK YARI (İY)'
                : `${engineState.minute}' DAKİKA`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-zinc-400">
            <MapPin className="w-3 h-3 text-zinc-500" />
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
            <h2 className="mt-2.5 text-sm sm:text-xl font-black text-white truncate max-w-full">
              {homeClub.name}
            </h2>
            <span className="text-[11px] text-zinc-400 truncate">
              {homeClub.managerName}
            </span>
          </div>

          {/* Central Score Card */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-2xl bg-[#090C14] border border-[#222E47] shadow-inner">
              <span className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {engineState.homeScore}
              </span>
              <span className="text-xl sm:text-3xl font-black text-zinc-600">:</span>
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
            <h2 className="mt-2.5 text-sm sm:text-xl font-black text-white truncate max-w-full">
              {awayClub.name}
            </h2>
            <span className="text-[11px] text-zinc-400 truncate">
              {awayClub.managerName}
            </span>
          </div>
        </div>

        {/* Simulation Control Buttons Bar */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={engineState.isFinished}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${
              engineState.isFinished
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-[#00F5A0] text-black shadow-lg shadow-emerald-500/20 hover:bg-[#00D68B]'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Durdur (Pause)' : engineState.minute === 0 ? 'Maçı Başlat' : 'Devam Et'}</span>
          </button>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  speed === s.val && isPlaying
                    ? 'bg-[#00F5A0] text-black'
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
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors disabled:opacity-50"
            title="Aynı simülasyon motorunu 90. dakikaya kadar tek seferde çalıştırır."
          >
            <FastForward className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span>Hızlı Sonuç</span>
          </button>

          {/* Post Match Report Button if Finished */}
          {engineState.isFinished && (
            <button
              onClick={() => setShowPostMatchModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Maç Raporu</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CENTER VIEW SWITCHER TABS */}
      <div className="flex flex-wrap items-center gap-1.5 bg-[#121622] p-1.5 rounded-2xl border border-zinc-800 text-xs">
        <button
          onClick={() => setActiveCenterTab('RADAR')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'RADAR'
              ? 'bg-[#00F5A0] text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>2D Taktik Radarı</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('TIMELINE')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'TIMELINE'
              ? 'bg-[#00F5A0] text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Olay Zaman Çizelgesi ({engineState.events.length})</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('COMMENTARY')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'COMMENTARY'
              ? 'bg-[#00F5A0] text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Canlı Anlatım Feed</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('TACTICS')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'TACTICS'
              ? 'bg-[#00F5A0] text-black shadow'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Canlı Taktik Ayarları</span>
        </button>

        <button
          onClick={() => setActiveCenterTab('SUBS')}
          className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
            activeCenterTab === 'SUBS'
              ? 'bg-[#00F5A0] text-black shadow'
              : 'text-zinc-400 hover:text-white'
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
                <div className="p-3.5 rounded-2xl bg-[#121622] border border-[#1E273A] flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded font-black bg-[#00F5A0] text-black">
                    {engineState.latestEvent.minute}&apos;
                  </span>
                  <p className="text-zinc-200 font-semibold truncate">
                    {engineState.latestEvent.commentary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TIMELINE */}
          {activeCenterTab === 'TIMELINE' && (
            <div className="p-5 rounded-2xl bg-[#121622] border border-[#1E273A] space-y-3 max-h-[500px] overflow-y-auto">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-zinc-800">
                Maç Olayları
              </h3>
              {engineState.events.map((ev) => (
                <div
                  key={ev.id}
                  className={`p-3 rounded-xl border flex items-center gap-3 text-xs ${
                    ev.type === 'GOAL'
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                      : ev.type === 'RED_CARD'
                      ? 'bg-rose-950/30 border-rose-500/40 text-white'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-200'
                  }`}
                >
                  <span className="w-8 h-6 rounded bg-zinc-950 font-black text-xs text-[#00F5A0] flex items-center justify-center shrink-0">
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
            <div className="p-5 rounded-2xl bg-[#121622] border border-[#1E273A] space-y-2 max-h-[500px] overflow-y-auto font-mono text-xs">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-zinc-800">
                Canlı Maç Anlatım Akışı
              </h3>
              {[...engineState.commentaryLog].reverse().map((line, idx) => (
                <div key={idx} className="py-2 border-b border-zinc-800/40 text-zinc-300">
                  <span className="text-[#00F5A0] font-bold mr-2">›</span>
                  {line}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: LIVE TACTICS */}
          {activeCenterTab === 'TACTICS' && (
            <div className="p-5 rounded-2xl bg-[#121622] border border-[#1E273A] space-y-4">
              <h3 className="text-xs font-black uppercase text-zinc-400 pb-2 border-b border-zinc-800">
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
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold ${
                        userTeamState.tactics.mentality === m ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400'
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
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold ${
                        userTeamState.tactics.tempo === t ? 'bg-[#00F5A0] text-black' : 'bg-zinc-900 text-zinc-400'
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
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-bold ${
                        userTeamState.tactics.pressing === p ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-400'
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
            <div className="p-5 rounded-2xl bg-[#121622] border border-[#1E273A] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <h3 className="text-xs font-black uppercase text-zinc-300">
                  Oyuncu Değişikliği Masası ({userTeamState.substitutionsUsed}/5 Kullanıldı)
                </h3>
                {subMessage && (
                  <span className="text-xs font-bold text-[#00F5A0]">{subMessage}</span>
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
                          className={`p-2 rounded-xl border cursor-pointer text-xs flex items-center justify-between ${
                            isSelected
                              ? 'bg-rose-500/20 border-rose-500/50 text-white'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
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
                          className={`p-2 rounded-xl border cursor-pointer text-xs flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
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

              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={handleConfirmSubstitution}
                  disabled={!selectedSubOutId || !selectedSubInId || userTeamState.substitutionsUsed >= 5}
                  className="px-5 py-2 rounded-xl bg-[#00F5A0] text-black font-black text-xs hover:bg-[#00D68B] disabled:opacity-40 transition-all"
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
          <div className="p-5 rounded-2xl bg-[#121622] border border-[#1E273A] shadow-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 pb-2 border-b border-zinc-800">
              <Award className="w-4 h-4 text-emerald-400" />
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

      {/* 5. POST MATCH SUMMARY MODAL */}
      {showPostMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-[#080D1A] border-2 border-zinc-700 p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-200">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 text-xs font-mono font-black bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 uppercase">
                Maç Raporu • 90 Dakika
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {homeClub.name} {engineState.homeScore} - {engineState.awayScore} {awayClub.name}
              </h2>
            </div>

            {/* Man of the Match Card */}
            {manOfTheMatch && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-zinc-900 to-amber-500/15 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-7 h-7 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">Maçın Adamı (MVP)</span>
                    <span className="text-sm font-black text-white">{manOfTheMatch.player.firstName} {manOfTheMatch.player.lastName}</span>
                    <span className="text-xs text-zinc-400 block">{manOfTheMatch.currentPosition} • {manOfTheMatch.goals} Gol, {manOfTheMatch.assists} Asist</span>
                  </div>
                </div>
                <StatBadge value={manOfTheMatch.matchRating} size="lg" />
              </div>
            )}

            {/* Quick Final Stats Overview */}
            <div className="grid grid-cols-3 gap-3 text-center bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block">xG (Gol Beklentisi)</span>
                <span className="text-base font-black text-white">{engineState.home.stats.xG} - {engineState.away.stats.xG}</span>
              </div>
              <div className="border-x border-zinc-800">
                <span className="text-zinc-500 block">Topa Sahip Olma</span>
                <span className="text-base font-black text-[#00F5A0]">%{engineState.homePossessionPercent} - %{engineState.awayPossessionPercent}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">İsabetli Şut</span>
                <span className="text-base font-black text-white">{engineState.home.stats.shotsOnTarget} - {engineState.away.stats.shotsOnTarget}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => router.push('/league')}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition-colors"
              >
                Puan Durumunu Gör
              </button>
              <button
                onClick={() => setShowPostMatchModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#00F5A0] text-black text-xs font-black hover:bg-[#00D68B] transition-colors"
              >
                Maç Merkezini İncele
              </button>
            </div>
          </div>
        </div>
      )}

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
