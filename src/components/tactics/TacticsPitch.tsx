import React, { useState } from 'react';
import { Formation, PitchPositionSlot, Player } from '@/types/game';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { RefreshCw, UserCheck, AlertCircle } from 'lucide-react';

interface TacticsPitchProps {
  formation: Formation;
  lineup: PitchPositionSlot[];
  allPlayers: Player[];
  substitutes: string[];
  reserves: string[];
  selectedSlotId?: number | null;
  onSelectSlot?: (slotId: number | null) => void;
  onSwapPlayer: (slotId: number, newPlayerId: string) => void;
  onSwapSlots: (fromSlotId: number, toSlotId: number) => void;
  onPlayerClick?: (player: Player) => void;
}

export const TacticsPitch: React.FC<TacticsPitchProps> = ({
  formation,
  lineup,
  allPlayers,
  substitutes,
  reserves,
  selectedSlotId: controlledSelectedSlotId,
  onSelectSlot,
  onSwapPlayer,
  onSwapSlots,
  onPlayerClick,
}) => {
  const [internalSelectedSlotId, setInternalSelectedSlotId] = useState<number | null>(null);
  const selectedSlotId = controlledSelectedSlotId !== undefined ? controlledSelectedSlotId : internalSelectedSlotId;
  const setSelectedSlotId = (slotId: number | null) => {
    if (onSelectSlot) onSelectSlot(slotId);
    setInternalSelectedSlotId(slotId);
  };
  const [benchSwapModalOpen, setBenchSwapModalOpen] = useState(false);

  const getPlayer = (id: string | null) => {
    if (!id) return null;
    return allPlayers.find((p) => p.id === id) || null;
  };

  const handleSlotClick = (slotId: number) => {
    if (selectedSlotId === null) {
      setSelectedSlotId(slotId);
    } else if (selectedSlotId === slotId) {
      setSelectedSlotId(null);
    } else {
      // Swap two slots on pitch
      onSwapSlots(selectedSlotId, slotId);
      setSelectedSlotId(null);
    }
  };

  const handleOpenBenchSwap = (slotId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlotId(slotId);
    setBenchSwapModalOpen(true);
  };

  const selectedSlot = lineup.find((s) => s.slotId === selectedSlotId);
  const selectedPlayer = selectedSlot ? getPlayer(selectedSlot.playerId) : null;

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Pitch Outer Shell */}
      <div className="relative w-full max-w-[620px] aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-[#1B2433] bg-[#0c2415] select-none">
        {/* Grass Pattern & Stripes */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e2c1a] to-[#0a1f12]">
          {/* Repeating Field Grass Stripes */}
          <div className="w-full h-full flex flex-col opacity-30">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`w-full flex-1 ${i % 2 === 0 ? 'bg-black/15' : 'bg-white/5'}`}
              />
            ))}
          </div>
        </div>

        {/* Pitch Lines (SVG Layer) */}
        <svg
          viewBox="0 0 1000 1300"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none stroke-emerald-400/30"
          strokeWidth="2"
          fill="none"
        >
          {/* Pitch Outer Margin */}
          <rect x="50" y="52" width="900" height="1196" />

          {/* Halfway Line */}
          <line x1="50" y1="650" x2="950" y2="650" />

          {/* Center Circle */}
          <circle cx="500" cy="650" r="140" />
          <circle cx="500" cy="650" r="15" fill="#00F5A0" fillOpacity="0.4" />

          {/* Top Penalty Box (Opponent Side) */}
          <rect x="250" y="52" width="500" height="234" />
          <rect x="370" y="52" width="260" height="91" />
          <path d="M 400 286 A 100 80 0 0 0 600 286" />

          {/* Bottom Penalty Box (Our Side / GK) */}
          <rect x="250" y="1014" width="500" height="234" />
          <rect x="370" y="1157" width="260" height="91" />
          <path d="M 400 1014 A 100 80 0 0 1 600 1014" />

          {/* Corner Arcs */}
          <path d="M 50 91 A 30 30 0 0 0 80 52" />
          <path d="M 920 52 A 30 30 0 0 0 950 91" />
          <path d="M 50 1209 A 30 30 0 0 1 80 1248" />
          <path d="M 920 1248 A 30 30 0 0 1 950 1209" />
        </svg>

        {/* Interactive Player Nodes on Pitch */}
        {lineup.map((slot) => {
          const player = getPlayer(slot.playerId);
          const isSelected = selectedSlotId === slot.slotId;

          return (
            <div
              key={slot.slotId}
              onClick={() => handleSlotClick(slot.slotId)}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute cursor-pointer group transition-all duration-200 z-10 flex flex-col items-center ${
                isSelected ? 'scale-110' : 'hover:scale-105'
              }`}
            >
              {/* Pulse ring when selected */}
              {isSelected && (
                <span className="absolute -inset-2 rounded-full border-2 border-[#00F5A0] animate-ping opacity-75" />
              )}

              {/* Player Jersey / Crest Node */}
              <div
                className={`relative flex items-center justify-center w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 shadow-2xl transition-all ${
                  isSelected
                    ? 'bg-[#00F5A0] border-white text-black shadow-[0_0_18px_#00F5A0]'
                    : player?.isInjured
                    ? 'bg-rose-950 border-rose-500 text-white'
                    : 'bg-[#050811] hover:bg-zinc-900 border-emerald-500/70 text-white'
                }`}
              >
                {/* Role indicator pill */}
                <span
                  className={`text-[10px] sm:text-xs font-black tracking-wider ${
                    isSelected ? 'text-black' : 'text-emerald-400'
                  }`}
                >
                  {slot.role}
                </span>

                {/* Overall rating pill */}
                {player && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 text-[9px] font-extrabold px-1 py-0.2 rounded-full border shadow-sm ${
                      player.overall >= 80
                        ? 'bg-emerald-500 text-black border-emerald-300'
                        : player.overall >= 74
                        ? 'bg-sky-500 text-white border-sky-300'
                        : 'bg-amber-500 text-black border-amber-300'
                    }`}
                  >
                    {player.overall}
                  </span>
                )}

                {/* Quick action button for bench swap */}
                <button
                  onClick={(e) => handleOpenBenchSwap(slot.slotId, e)}
                  title="Yedeklerle Değiştir"
                  className="absolute -bottom-1 -left-1 p-1 rounded-full bg-zinc-900 border border-zinc-700 hover:border-[#00F5A0] text-zinc-400 hover:text-[#00F5A0] transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Player Name Tag */}
              <div
                className={`mt-1 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-tight shadow-md border truncate max-w-[110px] text-center transition-all ${
                  isSelected
                    ? 'bg-[#00F5A0] text-black border-white'
                    : 'bg-zinc-950/95 text-zinc-100 border-zinc-700/80 group-hover:border-emerald-500/60'
                }`}
              >
                {player ? `${player.firstName[0]}. ${player.lastName}` : 'Boş'}
              </div>

              {/* Player Condition / Fitness Bar */}
              {player && (
                <div className="mt-0.5 w-12 sm:w-14 flex items-center gap-1 bg-black/90 px-1 py-0.5 rounded border border-zinc-800 shadow-sm">
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        player.fitness >= 85
                          ? 'bg-[#00F5A0]'
                          : player.fitness >= 65
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(5, Math.min(100, player.fitness))}%` }}
                    />
                  </div>
                  <span className="text-[7.5px] font-mono font-bold text-zinc-400">
                    %{player.fitness}
                  </span>
                  {player.isInjured && (
                    <span className="text-[8px] leading-none" title="Sakat">🩹</span>
                  )}
                  {player.isSuspended && (
                    <span className="text-[8px] leading-none" title="Cezalı">🟥</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Helper Prompt Bar */}
      <div className="mt-3 text-xs text-zinc-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
        <span>Oyuncuları sahada yer değiştirmek için iki mevkiye sırayla tıklayın veya <RefreshCw className="inline w-3 h-3 text-zinc-300 mx-0.5" /> simgesine basıp yedek oyuncu seçin.</span>
      </div>

      {/* Bench Substitution Modal */}
      {benchSwapModalOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#070B14] border-2 border-zinc-700 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-black text-white">Oyuncu Değişikliği</h3>
                <p className="text-xs text-zinc-400">
                  <span className="text-[#00F5A0] font-bold">{selectedSlot.role}</span> mevkisi için yedek veya rezerv oyuncu seçin.
                </p>
              </div>
              <button
                onClick={() => setBenchSwapModalOpen(false)}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* List of Substitutes & Reserves */}
            <div className="mt-4 max-h-80 overflow-y-auto space-y-2 pr-1">
              <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Yedekler & Rezervler</h4>
              {[...substitutes, ...reserves].map((playerId) => {
                const p = getPlayer(playerId);
                if (!p) return null;

                const isRoleMatch = p.position === selectedSlot.role || p.secondaryPositions.includes(selectedSlot.role);

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSwapPlayer(selectedSlot.slotId, p.id);
                      setBenchSwapModalOpen(false);
                      setSelectedSlotId(null);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isRoleMatch
                        ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-900/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-zinc-800 text-zinc-200 border border-zinc-700">
                        {p.position}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{p.firstName} {p.lastName}</span>
                          {p.isInjured && (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1 font-semibold">
                              <AlertCircle className="w-3 h-3" /> Sakat
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {p.age} Yaş • Kondisyon: %{p.fitness} • Form: {p.form}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatBadge value={p.overall} size="md" />
                      <button className="px-3 py-1.5 rounded-lg bg-[#00F5A0] text-black text-xs font-bold hover:bg-[#00D68B]">
                        Sahaya Al
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
