'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type Formation = '4-3-3' | '4-2-3-1';

interface PlayerPos {
  id: string;
  number: number;
  name: string;
  role: string;
  x433: number; // percentage 0-100
  y433: number; // percentage 0-100
  x4231: number;
  y4231: number;
}

const TACTICAL_PLAYERS: PlayerPos[] = [
  { id: 'gk', number: 1, name: 'VASQUEZ', role: 'GK (Sweeper)', x433: 50, y433: 88, x4231: 50, y4231: 88 },
  { id: 'lb', number: 3, name: 'MORENO', role: 'FB (Inverted)', x433: 18, y433: 72, x4231: 18, y4231: 72 },
  { id: 'cb1', number: 4, name: 'LAURENT', role: 'BPD (Cover)', x433: 38, y433: 75, x4231: 38, y4231: 75 },
  { id: 'cb2', number: 5, name: 'VARGA', role: 'BPD (Stopper)', x433: 62, y433: 75, x4231: 62, y4231: 75 },
  { id: 'rb', number: 2, name: 'COSTA', role: 'FB (Attacking)', x433: 82, y433: 72, x4231: 82, y4231: 72 },
  { id: 'dm1', number: 6, name: 'NOVAK', role: 'DM (Anchor)', x433: 50, y433: 56, x4231: 38, y4231: 56 },
  { id: 'dm2', number: 8, name: 'VELAS', role: 'B2B (Support)', x433: 32, y433: 42, x4231: 62, y4231: 56 },
  { id: 'am', number: 10, name: 'KIMURA', role: 'AP (Playmaker)', x433: 68, y433: 42, x4231: 50, y4231: 36 },
  { id: 'lw', number: 11, name: 'SAAR', role: 'IW (Inside Fwd)', x433: 20, y433: 25, x4231: 20, y4231: 32 },
  { id: 'rw', number: 7, name: 'KOVA', role: 'IW (Support)', x433: 80, y433: 25, x4231: 80, y4231: 32 },
  { id: 'st', number: 9, name: 'POPOV', role: 'AF (Poacher)', x433: 50, y433: 16, x4231: 50, y4231: 16 },
];

export function TacticalPitch3D() {
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [activePlayer, setActivePlayer] = useState<PlayerPos | null>(null);

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Formation toggle controls */}
      <div className="flex items-center gap-2 mb-4 bg-[#090d0a] border border-white/10 p-1.5 rounded-[4px]">
        <button
          type="button"
          onClick={() => setFormation('4-3-3')}
          className={`font-ibm text-[12px] px-3.5 py-1.5 rounded-[2px] transition-all cursor-pointer ${
            formation === '4-3-3'
              ? 'bg-[#b7ff35] text-[#050806] font-semibold shadow-[0_0_12px_rgba(183,255,53,0.35)]'
              : 'text-[#8b958d] hover:text-[#f2f5f2]'
          }`}
        >
          4-3-3 ATTACK
        </button>
        <button
          type="button"
          onClick={() => setFormation('4-2-3-1')}
          className={`font-ibm text-[12px] px-3.5 py-1.5 rounded-[2px] transition-all cursor-pointer ${
            formation === '4-2-3-1'
              ? 'bg-[#b7ff35] text-[#050806] font-semibold shadow-[0_0_12px_rgba(183,255,53,0.35)]'
              : 'text-[#8b958d] hover:text-[#f2f5f2]'
          }`}
        >
          4-2-3-1 CONTROL
        </button>
      </div>

      {/* 3D Tilted Tactical Pitch */}
      <div
        className="relative w-full max-w-[560px] aspect-[4/5] rounded-[8px] overflow-hidden border border-[#b7ff35]/25 p-4 shadow-2xl"
        style={{
          perspective: '1000px',
          background: 'linear-gradient(180deg, #07120b 0%, #040805 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 40px rgba(183,255,53,0.06)',
        }}
      >
        {/* Pitch Lines */}
        <div className="absolute inset-4 border border-[#b7ff35]/20 rounded-[4px] pointer-events-none">
          {/* Halfway line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#b7ff35]/20" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-[#b7ff35]/20" />
          {/* Penalty box top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-[#b7ff35]/20" />
          {/* Penalty box bottom */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-[#b7ff35]/20" />
        </div>

        {/* Players on Pitch */}
        {TACTICAL_PLAYERS.map((player) => {
          const targetX = formation === '4-3-3' ? player.x433 : player.x4231;
          const targetY = formation === '4-3-3' ? player.y433 : player.y4231;
          const isActive = activePlayer?.id === player.id;

          return (
            <motion.div
              key={player.id}
              animate={{
                left: `${targetX}%`,
                top: `${targetY}%`,
              }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 22,
                duration: 0.65,
              }}
              onMouseEnter={() => setActivePlayer(player)}
              onMouseLeave={() => setActivePlayer(null)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center"
            >
              {/* Disc marker */}
              <div
                className={`relative w-8 h-8 rounded-full flex items-center justify-center font-ibm text-[11px] font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-[#b7ff35] text-[#050806] scale-125 shadow-[0_0_20px_#b7ff35]'
                    : 'bg-[#0d120f] border border-[#b7ff35]/60 text-[#f2f5f2] hover:border-[#b7ff35] hover:scale-110'
                }`}
              >
                {player.number}
                {isActive && (
                  <span className="absolute -inset-1 rounded-full border border-[#b7ff35] animate-ping opacity-75" />
                )}
              </div>

              {/* Name label */}
              <span
                className={`font-barlow text-[13px] tracking-wide uppercase mt-0.5 whitespace-nowrap transition-colors ${
                  isActive ? 'text-[#b7ff35] font-bold' : 'text-[#8b958d]'
                }`}
              >
                {player.name}
              </span>
            </motion.div>
          );
        })}

        {/* Active Player Role Floating Tooltip */}
        <AnimatePresence>
          {activePlayer && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-4 left-4 right-4 bg-[#090d0a]/90 backdrop-blur-md border border-[#b7ff35]/40 p-2.5 rounded-[4px] flex items-center justify-between z-20"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#b7ff35] shadow-[0_0_8px_#b7ff35]" />
                <span className="font-barlow text-[16px] font-bold text-[#f2f5f2] tracking-wide">
                  #{activePlayer.number} {activePlayer.name}
                </span>
                <span className="font-ibm text-[11px] text-[#b7ff35] px-1.5 py-0.5 bg-[#b7ff35]/15 rounded">
                  {activePlayer.role}
                </span>
              </div>
              <span className="font-ibm text-[11px] text-[#8b958d]">
                CHEMISTRY 94%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
