'use client';

import React, { useMemo } from 'react';
import { MatchEngineState, MatchEngineEvent } from '@/lib/match-engine/types';
import { FORMATION_COORDINATES } from '@/lib/data/mockData';
import { Zap, Trophy, Shield, Activity, Flame } from 'lucide-react';

interface TacticalRadarPitchProps {
  state: MatchEngineState;
  speed?: number;
  isPlaying?: boolean;
  onPlayerClick?: (playerId: string) => void;
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
  const homeActivePlayers = state.home.activePitchPlayerIds
    .map((id) => state.home.players[id])
    .filter(Boolean);
  const awayActivePlayers = state.away.activePitchPlayerIds
    .map((id) => state.away.players[id])
    .filter(Boolean);

  // Formations
  const homeFormation = state.home.formation || '4-2-3-1';
  const awayFormation = state.away.formation || '4-2-3-1';

  const homeSlots = FORMATION_COORDINATES[homeFormation] || FORMATION_COORDINATES['4-2-3-1'];
  const awaySlots = FORMATION_COORDINATES[awayFormation] || FORMATION_COORDINATES['4-2-3-1'];

  // Transition duration in milliseconds based on simulation speed
  const animDuration = speed === 4 ? 90 : speed === 3 ? 180 : speed === 2 ? 300 : 500;

  // Attacking phase
  const attackingPhase = lastAction?.direction; // 'HOME_ATTACK' | 'AWAY_ATTACK' | undefined

  // Goal Detection: check if current minute or latest event is a GOAL
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

  const isHomeGoal = useMemo(() => {
    if (latestEvent?.type === 'GOAL') {
      return latestEvent.teamId === state.home.club.id;
    }
    return attackingPhase === 'HOME_ATTACK';
  }, [latestEvent, attackingPhase, state.home.club.id]);

  /**
   * Calculates pitch coordinates for any player node.
   * Home defends LEFT (x: 8% to 48%), attacks RIGHT.
   * Away defends RIGHT (x: 92% to 52%), attacks LEFT.
   */
  const getCoordinates = (
    isHome: boolean,
    playerList: typeof homeActivePlayers,
    playerIdx: number
  ) => {
    const pim = playerList[playerIdx];
    if (!pim) return { x: isHome ? 25 : 75, y: 50 };

    const slots = isHome ? homeSlots : awaySlots;

    // Determine slot index (0 to 10)
    let slotIdx = pim.slotIndex !== undefined && pim.slotIndex >= 0 && pim.slotIndex < slots.length
      ? pim.slotIndex
      : playerIdx % slots.length;

    const slot = slots[slotIdx] || slots[0];
    const role = pim.currentPosition || slot.role;

    // Base coordinate math
    // slot.x: tactics board width (10 to 90), slot.y: length (88 is GK, 15 is ST)
    let baseX = 50;
    let baseY = 50;

    if (isHome) {
      baseX = 8 + ((88 - slot.y) / 73) * 40;
      baseY = 12 + (slot.x / 100) * 76;
    } else {
      baseX = 92 - ((88 - slot.y) / 73) * 40;
      baseY = 12 + ((100 - slot.x) / 100) * 76;
    }

    // Dynamic tactical shifting (NO CIRCULAR SPINNING!)
    let shiftX = 0;
    let shiftY = 0;

    if (isPlaying && minute > 0) {
      if (isRecentGoal) {
        // Goal celebration movement
        if (pim.player.id === goalScorerId) {
          // Scorer runs towards corner flag
          shiftX = isHome ? (90 - baseX) * 0.8 : (10 - baseX) * 0.8;
          shiftY = (20 - baseY) * 0.7;
        } else if ((isHome && isHomeGoal) || (!isHome && !isHomeGoal)) {
          // Teammates converge towards scorer/corner
          shiftX = isHome ? 15 : -15;
        } else {
          // Conceding team drops back dejectedly towards center
          shiftX = isHome ? 5 : -5;
        }
      } else if (attackingPhase === 'HOME_ATTACK') {
        if (isHome) {
          // Home team attacks forward to the right
          if (['ST', 'AML', 'AMR', 'AMC'].includes(role)) {
            shiftX = 18;
          } else if (['MC', 'MR', 'ML', 'DMC'].includes(role)) {
            shiftX = 12;
          } else if (['DL', 'DR'].includes(role)) {
            shiftX = 10;
          } else if (role === 'DC') {
            shiftX = 6;
          } else if (role === 'GK') {
            shiftX = 3;
          }
        } else {
          // Away team drops deep to defend their goal on the right
          if (['DC', 'DL', 'DR'].includes(role)) {
            shiftX = 6;
          } else if (['DMC', 'MC', 'MR', 'ML'].includes(role)) {
            shiftX = 8;
          } else if (['ST'].includes(role)) {
            shiftX = -3;
          }
        }
      } else if (attackingPhase === 'AWAY_ATTACK') {
        if (!isHome) {
          // Away team attacks forward to the left
          if (['ST', 'AML', 'AMR', 'AMC'].includes(role)) {
            shiftX = -18;
          } else if (['MC', 'MR', 'ML', 'DMC'].includes(role)) {
            shiftX = -12;
          } else if (['DL', 'DR'].includes(role)) {
            shiftX = -10;
          } else if (role === 'DC') {
            shiftX = -6;
          } else if (role === 'GK') {
            shiftX = -3;
          }
        } else {
          // Home team drops deep to defend their goal on the left
          if (['DC', 'DL', 'DR'].includes(role)) {
            shiftX = -6;
          } else if (['DMC', 'MC', 'MR', 'ML'].includes(role)) {
            shiftX = -8;
          } else if (['ST'].includes(role)) {
            shiftX = 3;
          }
        }
      } else {
        // Neutral / Midfield linear tactical stepping (NO CIRCLES!)
        const linearOffset = Math.sin(minute * 0.4 + playerIdx * 0.8) * 1.6;
        shiftX = linearOffset;
      }
    }

    // Hard clamp to ensure players stay inside field boundaries
    const finalX = Math.max(isHome ? 6 : 48, Math.min(isHome ? 52 : 94, baseX + shiftX));
    const finalY = Math.max(12, Math.min(88, baseY + shiftY));

    return { x: finalX, y: finalY };
  };

  // Ball coordinate calculation (passing & circulating between players)
  const ballCoords = useMemo(() => {
    if (isRecentGoal) {
      // Ball is in the net
      return isHomeGoal ? { x: 95.5, y: 50 } : { x: 4.5, y: 50 };
    }

    if (lastAction?.coords) {
      return { x: lastAction.coords.x, y: lastAction.coords.y };
    }

    if (!isPlaying || minute === 0) {
      return { x: 50, y: 50 };
    }

    // Dynamic passing sequence:
    // Determine which team currently has possession in this minute
    const isHomePossession = attackingPhase === 'HOME_ATTACK'
      ? true
      : attackingPhase === 'AWAY_ATTACK'
      ? false
      : (minute % 2 === 0 ? state.homePossessionPercent >= 50 : state.homePossessionPercent >= 60);

    const activeList = isHomePossession ? homeActivePlayers : awayActivePlayers;
    if (activeList.length === 0) return { x: 50, y: 50 };

    // Select passing candidates based on attack phase
    let candidateIndices: number[] = [];
    if (attackingPhase === 'HOME_ATTACK' || attackingPhase === 'AWAY_ATTACK') {
      // Pass among midfielders and forwards
      candidateIndices = activeList
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => ['ST', 'AML', 'AMR', 'AMC', 'MC', 'MR', 'ML'].includes(p.currentPosition))
        .map(({ idx }) => idx);
    }

    if (candidateIndices.length === 0) {
      // Build-up phase: defenders and midfielders
      candidateIndices = activeList
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => ['MC', 'DMC', 'DL', 'DR', 'DC'].includes(p.currentPosition))
        .map(({ idx }) => idx);
    }

    if (candidateIndices.length === 0) {
      candidateIndices = activeList.map((_, idx) => idx);
    }

    // Select player holding the ball
    const carrierIdx = candidateIndices[minute % candidateIndices.length];
    const carrierCoords = getCoordinates(isHomePossession, activeList, carrierIdx);

    // Ball placed right near the carrier player's feet
    const ballOffset = isHomePossession ? 1.8 : -1.8;
    return {
      x: Math.max(6, Math.min(94, carrierCoords.x + ballOffset)),
      y: Math.max(12, Math.min(88, carrierCoords.y + (Math.sin(minute * 1.2) * 0.7))),
    };
  }, [isRecentGoal, isHomeGoal, lastAction, attackingPhase, isPlaying, minute, state.homePossessionPercent, homeActivePlayers, awayActivePlayers]);

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/10] overflow-hidden shadow-2xl border-2 border-zinc-800 bg-[#06180C] select-none">
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

      {/* SVG Tactical Pitch Markings (Crisp, High Contrast, SquadCraft Tactical Style) */}
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

      {/* 2. Attacking Direction Indicator Pill */}
      {lastAction && (
        <div
          className={`absolute top-3 px-3 py-1 font-mono text-[10px] font-black tracking-wider uppercase border z-30 flex items-center gap-1.5 transition-all duration-200 ${
            lastAction.direction === 'HOME_ATTACK'
              ? 'left-6 bg-black text-[#00F5A0] border-[#00F5A0]'
              : 'right-6 bg-black text-[#00D4FF] border-[#00D4FF]'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span>
            {lastAction.direction === 'HOME_ATTACK'
              ? `${state.home.club.code} HÜCUM EDİYOR ➔`
              : `⬅ ${state.away.club.code} HÜCUM EDİYOR`}
          </span>
        </div>
      )}

      {/* 3. Match Ball (⚽) with High Visibility Glow */}
      <div
        style={{
          left: `${ballCoords.x}%`,
          top: `${ballCoords.y}%`,
          transform: 'translate(-50%, -50%)',
          transition: `left ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
        }}
        className="absolute z-25 pointer-events-none"
      >
        <span className="absolute -inset-2 rounded-full bg-[#00F5A0]/40 animate-ping" />
        <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-black shadow-[0_0_16px_#00F5A0] text-[12px]">
          ⚽
        </div>
      </div>

      {/* 4. Action Target Marker (Goals, Shots, Saves, Corners) */}
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
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-black border-2 border-[#00F5A0] shadow-[0_0_20px_#00F5A0] text-sm font-black">
            {lastAction.type === 'GOAL' ? '⚽' : lastAction.type === 'SAVE' ? '🧤' : lastAction.type === 'POST' ? '🥅' : '⚡'}
          </div>
        </div>
      )}

      {/* 5. Goal Celebration Broadcast Banner Overlay */}
      {isRecentGoal && latestEvent && (
        <div className="absolute inset-x-0 top-1/3 z-40 flex flex-col items-center justify-center pointer-events-none animate-in zoom-in-90 duration-300">
          <div className="px-6 py-3 bg-black/95 border-2 border-[#00F5A0] shadow-[0_0_30px_#00F5A0] rounded-xl flex flex-col items-center gap-1 text-center">
            <div className="flex items-center gap-2 text-[#00F5A0] font-black text-lg tracking-widest uppercase animate-bounce">
              <Flame className="w-5 h-5 text-amber-400" />
              <span>⚽ GOOOOOOOL!</span>
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-white font-black text-sm uppercase">
              {latestEvent.playerName || 'Oyuncu'} ({latestEvent.minute}&apos;)
            </div>
            {latestEvent.secondaryPlayerName && (
              <div className="text-zinc-400 font-mono text-[10px]">
                Asist: {latestEvent.secondaryPlayerName}
              </div>
            )}
            <div className="mt-1 px-3 py-0.5 bg-[#00F5A0]/20 border border-[#00F5A0]/40 text-[#00F5A0] font-mono text-xs font-black">
              {state.home.club.code} {state.homeScore} - {state.awayScore} {state.away.club.code}
            </div>
          </div>
        </div>
      )}

      {/* 6. Home Players Nodes on Pitch (All 11 in Formation) */}
      {homeActivePlayers.map((pim, idx) => {
        const coords = getCoordinates(true, homeActivePlayers, idx);
        const isScorer = pim.player.id === goalScorerId;

        return (
          <div
            key={pim.player.id}
            onClick={() => onPlayerClick && onPlayerClick(pim.player.id)}
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: `left ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            }}
            className="absolute z-20 cursor-pointer group flex flex-col items-center hover:scale-125 transition-transform"
          >
            {/* Player Crest Dot */}
            <div
              className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black text-black border-2 border-white shadow-lg ${
                isScorer ? 'ring-4 ring-amber-400 animate-pulse' : ''
              }`}
              style={{ backgroundColor: state.home.club.primaryColor || '#00F5A0' }}
            >
              <span>{pim.currentPosition}</span>

              {/* Match Rating Badge */}
              <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded text-[8px] font-black bg-black border border-zinc-700 text-[#00F5A0]">
                {pim.matchRating.toFixed(1)}
              </span>

              {/* Scorer Star */}
              {pim.goals > 0 && (
                <span className="absolute -bottom-1 -left-1 text-[9px]">⚽</span>
              )}
            </div>

            {/* Name Tag */}
            <span className="mt-0.5 px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-black/95 text-white border border-zinc-700 truncate max-w-[62px] text-center">
              {pim.player.lastName}
            </span>

            {/* Mini Condition / Fitness Bar & Badges */}
            <div className="mt-0.5 flex items-center gap-0.5">
              <div className="w-5 sm:w-6 h-1 bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-700/80">
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
                <span className="text-[8px] leading-none" title="Sakat">🩹</span>
              )}
              {pim.yellowCards > 0 && pim.redCards === 0 && (
                <span className="text-[8px] leading-none" title="Sarı Kart">🟨</span>
              )}
              {pim.redCards > 0 && (
                <span className="text-[8px] leading-none" title="Kırmızı Kart">🟥</span>
              )}
            </div>
          </div>
        );
      })}

      {/* 7. Away Players Nodes on Pitch (All 11 in Formation) */}
      {awayActivePlayers.map((pim, idx) => {
        const coords = getCoordinates(false, awayActivePlayers, idx);
        const isScorer = pim.player.id === goalScorerId;

        return (
          <div
            key={pim.player.id}
            onClick={() => onPlayerClick && onPlayerClick(pim.player.id)}
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              transform: 'translate(-50%, -50%)',
              transition: `left ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1), top ${animDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
            }}
            className="absolute z-20 cursor-pointer group flex flex-col items-center hover:scale-125 transition-transform"
          >
            {/* Player Crest Dot */}
            <div
              className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-black text-white border-2 border-zinc-300 shadow-lg ${
                isScorer ? 'ring-4 ring-amber-400 animate-pulse' : ''
              }`}
              style={{ backgroundColor: state.away.club.primaryColor || '#3B82F6' }}
            >
              <span>{pim.currentPosition}</span>

              {/* Match Rating Badge */}
              <span className="absolute -top-1.5 -right-1.5 px-1 py-0.2 rounded text-[8px] font-black bg-black border border-zinc-700 text-cyan-300">
                {pim.matchRating.toFixed(1)}
              </span>

              {/* Scorer Star */}
              {pim.goals > 0 && (
                <span className="absolute -bottom-1 -left-1 text-[9px]">⚽</span>
              )}
            </div>

            {/* Name Tag */}
            <span className="mt-0.5 px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-black/95 text-zinc-200 border border-zinc-700 truncate max-w-[62px] text-center">
              {pim.player.lastName}
            </span>

            {/* Mini Condition / Fitness Bar & Badges */}
            <div className="mt-0.5 flex items-center gap-0.5">
              <div className="w-5 sm:w-6 h-1 bg-zinc-900/90 rounded-full overflow-hidden border border-zinc-700/80">
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
                <span className="text-[8px] leading-none" title="Sakat">🩹</span>
              )}
              {pim.yellowCards > 0 && pim.redCards === 0 && (
                <span className="text-[8px] leading-none" title="Sarı Kart">🟨</span>
              )}
              {pim.redCards > 0 && (
                <span className="text-[8px] leading-none" title="Kırmızı Kart">🟥</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
