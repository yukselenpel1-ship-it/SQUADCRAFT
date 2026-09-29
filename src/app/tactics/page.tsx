'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { TacticsPitch } from '@/components/tactics/TacticsPitch';
import { TacticalSliders } from '@/components/tactics/TacticalSliders';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { Player } from '@/types/game';
import {
  Swords,
  Shield,
  Zap,
  Users,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
} from 'lucide-react';

export default function TacticsPage() {
  const {
    userClub,
    userPlayers,
    tactics,
    setFormation,
    updateTacticalSettings,
    swapLineupPlayer,
    swapPitchSlots,
  } = useGame();

  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  const getPlayer = (id: string | null) => {
    if (!id) return null;
    return userPlayers.find((p) => p.id === id) || null;
  };

  const startingPlayers = tactics.lineup.map((s) => ({
    slot: s,
    player: getPlayer(s.playerId),
  }));

  const benchPlayers = tactics.substitutes
    .map((id) => getPlayer(id))
    .filter(Boolean) as Player[];

  const reservePlayers = tactics.reserves
    .map((id) => getPlayer(id))
    .filter(Boolean) as Player[];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
              // TACTICAL HEADQUARTERS
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              FORMASYON: <strong className="text-white">{tactics.formation}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Swords className="w-7 h-7 text-[#00F5A0]" />
            Taktik & Saha Dizilişi
          </h1>
        </div>

        {/* Telemetry Summary Cards */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-1.5 bg-[#080D1A] border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Mentalite</span>
            <span className="font-bold text-[#00D4FF]">{tactics.settings.mentality}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#080D1A] border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Tempo</span>
            <span className="font-bold text-[#00F5A0]">{tactics.settings.tempo}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#080D1A] border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Pres Şiddeti</span>
            <span className="font-bold text-amber-400">{tactics.settings.pressing}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#080D1A] border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Genişlik</span>
            <span className="font-bold text-purple-400">{tactics.settings.width}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Tactical Pitch (Left) + Sliders & Bench (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 Cols on desktop): Interactive Pitch */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <TacticsPitch
            formation={tactics.formation}
            lineup={tactics.lineup}
            allPlayers={userPlayers}
            substitutes={tactics.substitutes}
            reserves={tactics.reserves}
            onSwapPlayer={swapLineupPlayer}
            onSwapSlots={swapPitchSlots}
            onPlayerClick={(p) => setInspectedPlayer(p)}
          />
        </div>

        {/* Right Column (5 Cols on desktop): Tactical Sliders & Bench */}
        <div className="lg:col-span-5 space-y-5">
          {/* Tactical Sliders */}
          <TacticalSliders
            formation={tactics.formation}
            settings={tactics.settings}
            onFormationChange={setFormation}
            onSettingsChange={updateTacticalSettings}
          />

          {/* Bench & Reserve Roster */}
          <div className="p-4 sm:p-5 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00F5A0]" />
                Yedek Kulübesi <span className="text-[10px] font-mono text-zinc-500">// SUBS & RESERVES</span>
              </h3>
              <span className="text-xs font-mono font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                {benchPlayers.length} Oyuncu
              </span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {benchPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => setInspectedPlayer(player)}
                  className="flex items-center justify-between p-2.5 bg-[#040711] hover:bg-zinc-900 border border-zinc-850 hover:border-[#00F5A0]/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-6 flex items-center justify-center text-[10px] font-mono font-black bg-zinc-900 text-zinc-300 border border-zinc-700">
                      {player.position}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#00F5A0] transition-colors truncate max-w-[140px]">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {player.age} YAŞ • FORM: {player.form}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FitnessIndicator value={player.fitness} isInjured={player.isInjured} compact={true} />
                    <StatBadge value={player.overall} size="sm" />
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#00F5A0] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Inspect Player Modal */}
      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          club={userClub}
          onClose={() => setInspectedPlayer(null)}
        />
      )}
    </div>
  );
}
