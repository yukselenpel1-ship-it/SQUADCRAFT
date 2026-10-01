'use client';

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { MatchEngineState, MatchEngineEvent } from '@/lib/match-engine/types';
import {
  computeTacticalTargets,
  PossessionPhase,
  getBaseFormationCoordinates,
  applyTacticalModifiers,
} from './radar/tacticalMovementEngine';
import { Zap, Trophy, Shield, Activity, Flame, Clock, Radio, Users } from 'lucide-react';

interface TacticalRadarPitchProps {
  state: MatchEngineState;
  speed?: number;
  isPlaying?: boolean;
  onPlayerClick?: (playerId: string) => void;
}

interface RenderPosition {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isBallCarrier: boolean;
  isPressing: boolean;
}

export const TacticalRadarPitch: React.FC<TacticalRadarPitchProps> = ({
  state,
  speed = 1,
  isPlaying = false,
  onPlayerClick,
}) => {
  const latestEvent = state.latestEvent;
  const lastAction = state.lastAttackingAction;
  const minute = state.minute;

  // Home & Away Active Players
  const homeActivePlayers = useMemo(
    () =>
      state.home.activePitchPlayerIds
        .map((id) => state.home.players[id])
        .filter(Boolean),
    [state.home.activePitchPlayerIds, state.home.players]
  );

  const awayActivePlayers = useMemo(
    () =>
      state.away.activePitchPlayerIds
        .map((id) => state.away.players[id])
        .filter(Boolean),
    [state.away.activePitchPlayerIds, state.away.players]
  );

  // Animation Refs & State for 60 FPS Interpolation
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const phaseProgressRef = useRef<number>(0);

  // Position storage refs for continuous interpolation
  const playerPositionsRef = useRef<Record<string, RenderPosition>>({});
  const ballPosRef = useRef<{
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    isGoal: boolean;
    isShot: boolean;
  }>({
    x: 50,
    y: 50,
    targetX: 50,
    targetY: 50,
    isGoal: false,
    isShot: false,
  });

  // State to trigger DOM re-positioning at optimal frame rate
  const [, setFrameTick] = useState<number>(0);
  const [activePhase, setActivePhase] = useState<PossessionPhase>('KICKOFF');

  // Compute tactical targets whenever state changes
  useEffect(() => {
    const targets = computeTacticalTargets(state, phaseProgressRef.current);
    setActivePhase(targets.activePhase);

    // Initialize or update target coordinates in refs
    Object.entries(targets.players).forEach(([pId, target]) => {
      if (!playerPositionsRef.current[pId]) {
        playerPositionsRef.current[pId] = {
          x: target.x,
          y: target.y,
          targetX: target.x,
          targetY: target.y,
          isBallCarrier: target.isBallCarrier,
          isPressing: target.isPressing,
        };
      } else {
        playerPositionsRef.current[pId].targetX = target.x;
        playerPositionsRef.current[pId].targetY = target.y;
        playerPositionsRef.current[pId].isBallCarrier = target.isBallCarrier;
        playerPositionsRef.current[pId].isPressing = target.isPressing;
      }
    });

    ballPosRef.current.targetX = targets.ball.x;
    ballPosRef.current.targetY = targets.ball.y;
    ballPosRef.current.isGoal = targets.ball.isGoal;
    ballPosRef.current.isShot = targets.ball.isShot;
  }, [state]);

  // High-performance requestAnimationFrame loop for continuous live motion
  useEffect(() => {
    const speedMultiplier = speed === 4 ? 2.8 : speed === 3 ? 1.8 : speed === 2 ? 1.3 : 1.0;
    const lerpFactor = Math.min(0.25, 0.08 * speedMultiplier);
    const ballLerpFactor = Math.min(0.40, 0.14 * speedMultiplier);

    let isSubscribed = true;

    const animate = (time: number) => {
      if (!isSubscribed) return;

      const dt = Math.min(100, time - lastTimeRef.current);
      lastTimeRef.current = time;

      // Cycle phase progress from 0 to 1
      phaseProgressRef.current = (phaseProgressRef.current + (dt / 1000) * (0.6 * speedMultiplier)) % 1;

      // 1. Interpolate players towards target positions + organic micro-breathing
      const tSec = time / 1000;
      Object.keys(playerPositionsRef.current).forEach((pId, idx) => {
        const p = playerPositionsRef.current[pId];
        if (!p) return;

        // Organic micro-breathing when idle so players feel alive
        const idleX = Math.sin(tSec * 2.2 + idx * 0.7) * 0.35;
        const idleY = Math.cos(tSec * 1.8 + idx * 0.9) * 0.30;

        p.x += (p.targetX + idleX - p.x) * lerpFactor;
        p.y += (p.targetY + idleY - p.y) * lerpFactor;
      });

      // 2. Interpolate ball position towards target
      const ball = ballPosRef.current;
      ball.x += (ball.targetX - ball.x) * ballLerpFactor;
      ball.y += (ball.targetY - ball.y) * ballLerpFactor;

      // Trigger frame update (batched by React 19 / modern browser RAF)
      setFrameTick((prev) => (prev + 1) % 1000000);

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Single frame update to settle positions
      setFrameTick((prev) => prev + 1);
    }

    return () => {
      isSubscribed = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed]);

  // Goal celebration check
  const isRecentGoal = useMemo(() => {
    if (lastAction?.type === 'GOAL') return true;
    if (latestEvent?.type === 'GOAL' && minute - latestEvent.minute <= 2) return true;
    return false;
  }, [lastAction, latestEvent, minute]);

  const goalScorerId = useMemo(() => {
    if (latestEvent?.type === 'GOAL' && latestEvent.playerId) {
      return latestEvent.playerId;
    }
    return null;
  }, [latestEvent]);

  // Timeline events for bottom match timeline bar
  const timelineEvents = useMemo(() => {
    return state.events
      .filter((ev) => ['GOAL', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION'].includes(ev.type))
      .slice(-12);
  }, [state.events]);

  const totalMatchMinutes = 90 + (state.addedTimeSecondHalf || 3);
  const timelineProgressPercent = Math.min(100, Math.max(0, (minute / totalMatchMinutes) * 100));

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/10] overflow-hidden shadow-2xl border-2 border-zinc-800 bg-[#06180C] select-none flex flex-col justify-between">
      {/* 1. Field Grass & Subtle Stripes */}
      <div className="absolute inset-0 bg-[#071F10]">
        <div className="w-full h-full flex opacity-15">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`h-full flex-1 ${i % 2 === 0 ? 'bg-black/30' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      {/* 2. SVG Tactical Pitch Markings (Crisp, High Contrast, SquadCraft Tactical Style) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-400/35"
        strokeWidth="1.75"
        fill="none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
      >
        {/* Outer Boundary */}
        <rect x="40" y="36" width="920" height="528" />

        {/* Halfway Line */}
        <line x1="500" y1="36" x2="500" y2="564" />

        {/* Center Circle & Spot */}
        <circle cx="500" cy="300" r="84" />
        <circle cx="500" cy="300" r="9" fill="#00F5A0" fillOpacity="0.8" />

        {/* Left Goal Area (Home Defense Box) */}
        <rect x="40" y="144" width="150" height="312" />
        <rect x="40" y="216" width="55" height="168" />
        <path d="M 190 240 A 60 60 0 0 1 190 360" />
        <circle cx="150" cy="300" r="6" fill="#00F5A0" fillOpacity="0.6" />

        {/* Right Goal Area (Away Defense Box) */}
        <rect x="810" y="144" width="150" height="312" />
        <rect x="905" y="216" width="55" height="168" />
        <path d="M 810 240 A 60 60 0 0 0 810 360" />
        <circle cx="850" cy="300" r="6" fill="#00F5A0" fillOpacity="0.6" />

        {/* Corner Arcs */}
        <path d="M 40 51 A 15 15 0 0 1 55 36" />
        <path d="M 40 549 A 15 15 0 0 0 55 564" />
        <path d="M 960 51 A 15 15 0 0 0 945 36" />
        <path d="M 960 549 A 15 15 0 0 1 945 564" />
      </svg>

      {/* 3. Top HUD: Live Direction & Tactical Phase Pill */}
      <div className="absolute top-2.5 inset-x-4 z-30 flex items-center justify-between pointer-events-none text-[10px] sm:text-xs">
        {/* Left: Home Team State */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur border border-zinc-700/80 rounded-md">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
            style={{ backgroundColor: state.home.club.primaryColor || '#00F5A0' }}
          />
          <span className="font-mono font-black text-white">{state.home.club.code}</span>
          <span className="font-mono font-bold text-zinc-400">({state.home.formation})</span>
        </div>

        {/* Center: Live Action / Possession Phase Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/90 backdrop-blur border border-[#00F5A0]/60 rounded-full text-[#00F5A0] font-mono font-black tracking-wider uppercase shadow-[0_0_12px_rgba(0,245,160,0.25)]">
          <Radio className="w-3 h-3 animate-pulse text-[#00F5A0]" />
          <span>
            {activePhase === 'GOAL_CELEBRATION'
              ? '⚽ GOL KUTLAMASI'
              : activePhase === 'HOME_SHOT'
              ? `${state.home.club.code} ŞUT ÇEKİYOR! ⚡`
              : activePhase === 'AWAY_SHOT'
              ? `⚡ ${state.away.club.code} ŞUT ÇEKİYOR!`
              : activePhase === 'HOME_ATTACK' || activePhase === 'HOME_PROGRESSION'
              ? `${state.home.club.code} HÜCUM EDİYOR ➔`
              : activePhase === 'AWAY_ATTACK' || activePhase === 'AWAY_PROGRESSION'
              ? `⬅ ${state.away.club.code} HÜCUM EDİYOR`
              : activePhase === 'CORNER_HOME'
              ? `${state.home.club.code} KÖŞE VURUŞU`
              : activePhase === 'CORNER_AWAY'
              ? `${state.away.club.code} KÖŞE VURUŞU`
              : 'ORTA ALAN MÜCADELESİ'}
          </span>
        </div>

        {/* Right: Away Team State */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 backdrop-blur border border-zinc-700/80 rounded-md">
          <span className="font-mono font-bold text-zinc-400">({state.away.formation})</span>
          <span className="font-mono font-black text-white">{state.away.club.code}</span>
          <span
            className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
            style={{ backgroundColor: state.away.club.primaryColor || '#3B82F6' }}
          />
        </div>
      </div>

      {/* 4. Live Match Ball (⚽) with Dynamic Glow & Shadow */}
      <div
        style={{
          left: `${ballPosRef.current.x}%`,
          top: `${ballPosRef.current.y}%`,
          transform: 'translate(-50%, -50%)',
          willChange: 'left, top',
        }}
        className="absolute z-25 pointer-events-none transition-[left,top] duration-75 ease-out"
      >
        <span className="absolute -inset-2 rounded-full bg-[#00F5A0]/40 animate-ping pointer-events-none" />
        <div className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white border border-black shadow-[0_0_16px_#00F5A0] text-[11px] sm:text-[12px] font-bold">
          ⚽
        </div>
      </div>

      {/* 5. Action Target Marker (Shots, Saves, Corners) */}
      {lastAction && lastAction.coords && (
        <div
          style={{
            left: `${lastAction.coords.x}%`,
            top: `${lastAction.coords.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="absolute z-30 pointer-events-none"
        >
          <span className="absolute -inset-3 rounded-full bg-[#00F5A0]/30 animate-ping" />
          <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black border-2 border-[#00F5A0] shadow-[0_0_20px_#00F5A0] text-xs sm:text-sm font-black text-[#00F5A0]">
            {lastAction.type === 'GOAL' ? '⚽' : lastAction.type === 'SAVE' ? '🧤' : lastAction.type === 'POST' ? '🥅' : '⚡'}
          </div>
        </div>
      )}

      {/* 6. Goal Celebration Broadcast Banner Overlay */}
      {isRecentGoal && latestEvent && (
        <div className="absolute inset-x-0 top-1/3 z-40 flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-90 duration-300">
          <div className="px-6 py-2.5 sm:py-3 bg-black/95 border-2 border-[#00F5A0] shadow-[0_0_30px_#00F5A0] rounded-xl flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 text-[#00F5A0] font-black text-base sm:text-lg tracking-widest uppercase animate-bounce">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              <span>⚽ GOOOOOOOL!</span>
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="text-white font-black text-xs sm:text-sm uppercase">
              {latestEvent.playerName || 'Oyuncu'} ({latestEvent.minute}&apos;)
            </div>
            {latestEvent.secondaryPlayerName && (
              <div className="text-zinc-400 font-mono text-[9px] sm:text-[10px]">
                Asist: {latestEvent.secondaryPlayerName}
              </div>
            )}
            <div className="mt-1 px-3 py-0.5 bg-[#00F5A0]/20 border border-[#00F5A0]/40 text-[#00F5A0] font-mono text-xs font-black">
              {state.home.club.code} {state.homeScore} - {state.awayScore} {state.away.club.code}
            </div>
          </div>
        </div>
      )}

      {/* 7. 11 Home Players on Pitch */}
      {homeActivePlayers.map((pim) => {
        const pos = playerPositionsRef.current[pim.player.id] || {
          x: 25,
          y: 50,
          isBallCarrier: false,
          isPressing: false,
        };
        const isScorer = pim.player.id === goalScorerId;

        return (
          <div
            key={pim.player.id}
            onClick={() => onPlayerClick && onPlayerClick(pim.player.id)}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              willChange: 'left, top',
            }}
            className="absolute z-20 cursor-pointer group flex flex-col items-center hover:scale-125 transition-transform"
          >
            {/* Player Crest Dot */}
            <div
              className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black text-black border-2 border-white shadow-lg ${
                isScorer ? 'ring-4 ring-amber-400 animate-pulse' : ''
              } ${pos.isBallCarrier ? 'ring-2 ring-[#00F5A0] shadow-[0_0_12px_#00F5A0]' : ''}`}
              style={{ backgroundColor: state.home.club.primaryColor || '#00F5A0' }}
            >
              <span>{pim.currentPosition}</span>

              {/* Match Rating Badge */}
              <span className="absolute -top-1.5 -right-1.5 px-0.5 py-0.2 rounded text-[7px] font-black bg-black border border-zinc-700 text-[#00F5A0]">
                {pim.matchRating.toFixed(1)}
              </span>

              {/* Scorer Star */}
              {pim.goals > 0 && (
                <span className="absolute -bottom-1 -left-1 text-[8px]">⚽</span>
              )}
            </div>

            {/* Name Tag */}
            <span className="mt-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-bold bg-black/95 text-white border border-zinc-700 truncate max-w-[55px] text-center">
              {pim.player.lastName}
            </span>

            {/* Mini Condition Bar & Badges */}
            <div className="mt-0.5 flex items-center gap-0.5">
              <div className="w-4 sm:w-5 h-0.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/80">
                <div
                  className={`h-full rounded-full ${
                    pim.currentFitness >= 75
                      ? 'bg-[#00F5A0]'
                      : pim.currentFitness >= 50
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(10, Math.min(100, pim.currentFitness))}%` }}
                />
              </div>
              {pim.player.isInjured && (
                <span className="text-[7px] leading-none" title="Sakat">🩹</span>
              )}
              {pim.yellowCards > 0 && pim.redCards === 0 && (
                <span className="text-[7px] leading-none" title="Sarı Kart">🟨</span>
              )}
              {pim.redCards > 0 && (
                <span className="text-[7px] leading-none" title="Kırmızı Kart">🟥</span>
              )}
            </div>
          </div>
        );
      })}

      {/* 8. 11 Away Players on Pitch */}
      {awayActivePlayers.map((pim) => {
        const pos = playerPositionsRef.current[pim.player.id] || {
          x: 75,
          y: 50,
          isBallCarrier: false,
          isPressing: false,
        };
        const isScorer = pim.player.id === goalScorerId;

        return (
          <div
            key={pim.player.id}
            onClick={() => onPlayerClick && onPlayerClick(pim.player.id)}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              willChange: 'left, top',
            }}
            className="absolute z-20 cursor-pointer group flex flex-col items-center hover:scale-125 transition-transform"
          >
            {/* Player Crest Dot */}
            <div
              className={`relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[8px] sm:text-[9px] font-black text-white border-2 border-zinc-300 shadow-lg ${
                isScorer ? 'ring-4 ring-amber-400 animate-pulse' : ''
              } ${pos.isBallCarrier ? 'ring-2 ring-cyan-400 shadow-[0_0_12px_#38BDF8]' : ''}`}
              style={{ backgroundColor: state.away.club.primaryColor || '#3B82F6' }}
            >
              <span>{pim.currentPosition}</span>

              {/* Match Rating Badge */}
              <span className="absolute -top-1.5 -right-1.5 px-0.5 py-0.2 rounded text-[7px] font-black bg-black border border-zinc-700 text-cyan-300">
                {pim.matchRating.toFixed(1)}
              </span>

              {/* Scorer Star */}
              {pim.goals > 0 && (
                <span className="absolute -bottom-1 -left-1 text-[8px]">⚽</span>
              )}
            </div>

            {/* Name Tag */}
            <span className="mt-0.5 px-1 py-0.2 rounded text-[7px] sm:text-[8px] font-bold bg-black/95 text-zinc-200 border border-zinc-700 truncate max-w-[55px] text-center">
              {pim.player.lastName}
            </span>

            {/* Mini Condition Bar & Badges */}
            <div className="mt-0.5 flex items-center gap-0.5">
              <div className="w-4 sm:w-5 h-0.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-700/80">
                <div
                  className={`h-full rounded-full ${
                    pim.currentFitness >= 75
                      ? 'bg-[#00F5A0]'
                      : pim.currentFitness >= 50
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.max(10, Math.min(100, pim.currentFitness))}%` }}
                />
              </div>
              {pim.player.isInjured && (
                <span className="text-[7px] leading-none" title="Sakat">🩹</span>
              )}
              {pim.yellowCards > 0 && pim.redCards === 0 && (
                <span className="text-[7px] leading-none" title="Sarı Kart">🟨</span>
              )}
              {pim.redCards > 0 && (
                <span className="text-[7px] leading-none" title="Kırmızı Kart">🟥</span>
              )}
            </div>
          </div>
        );
      })}

      {/* 9. Bottom Match Timeline Progress Bar with Event Icons */}
      <div className="relative z-30 w-full px-4 pb-2.5 pt-1.5 bg-black/85 backdrop-blur border-t border-zinc-800">
        <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-400 mb-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#00F5A0]" />
            <span>0&apos;</span>
          </span>
          <span className="text-white font-black bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
            {minute}&apos;
          </span>
          <span>90&apos;+</span>
        </div>

        {/* Timeline Track */}
        <div className="relative w-full h-1.5 bg-zinc-900 rounded-full overflow-visible border border-zinc-800">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-[#00F5A0] rounded-full transition-all duration-300"
            style={{ width: `${timelineProgressPercent}%` }}
          />

          {/* Current minute thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-[#00F5A0] rounded-full shadow-[0_0_8px_#00F5A0]"
            style={{ left: `${timelineProgressPercent}%` }}
          />

          {/* Event markers on timeline */}
          {timelineEvents.map((ev) => {
            const evPercent = Math.min(100, Math.max(0, (ev.minute / totalMatchMinutes) * 100));
            const icon =
              ev.type === 'GOAL'
                ? '⚽'
                : ev.type === 'RED_CARD'
                ? '🟥'
                : ev.type === 'YELLOW_CARD'
                ? '🟨'
                : '🔄';

            return (
              <div
                key={ev.id}
                title={`${ev.minute}' ${ev.playerName || ''} - ${ev.description}`}
                style={{ left: `${evPercent}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform text-[9px] select-none"
              >
                <span>{icon}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
