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
  Sparkles,
  ArrowRightLeft,
  UserCheck,
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
    autoAssignTactics,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [activeSquadTab, setActiveSquadTab] = useState<'BENCH' | 'RESERVES'>('BENCH');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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

  const selectedSlot = selectedSlotId !== null ? tactics.lineup.find((s) => s.slotId === selectedSlotId) : null;
  const selectedStarterPlayer = selectedSlot ? getPlayer(selectedSlot.playerId) : null;

  const handleAutoAssign = () => {
    autoAssignTactics();
    setSelectedSlotId(null);
    setActionNotice('Kadro mevkilerine göre en uygun 11 ve yedekler otomatik dizildi.');
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleBenchPlayerClick = (player: Player) => {
    if (selectedSlotId !== null) {
      swapLineupPlayer(selectedSlotId, player.id);
      setSelectedSlotId(null);
      setActionNotice(`${player.firstName[0]}. ${player.lastName} ilk 11'e yerleştirildi.`);
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      setInspectedPlayer(player);
    }
  };

  const handleDirectPutOnPitch = (player: Player, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedSlotId !== null) {
      swapLineupPlayer(selectedSlotId, player.id);
      setSelectedSlotId(null);
      setActionNotice(`${player.firstName[0]}. ${player.lastName} ilk 11'e yerleştirildi.`);
      setTimeout(() => setActionNotice(null), 3000);
      return;
    }

    // Find best slot matching position
    const matchingSlot =
      tactics.lineup.find((s) => s.role === player.position) ||
      tactics.lineup.find((s) => player.secondaryPositions?.includes(s.role)) ||
      tactics.lineup[0];

    if (matchingSlot) {
      swapLineupPlayer(matchingSlot.slotId, player.id);
      setActionNotice(`${player.firstName[0]}. ${player.lastName}, ${matchingSlot.role} mevkisine yerleştirildi.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const activeRoster = activeSquadTab === 'BENCH' ? benchPlayers : reservePlayers;

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#182338]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 rounded-full">
              // TACTICAL HEADQUARTERS
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              FORMASYON: <strong className="text-white">{tactics.formation}</strong> • İLK 11:{' '}
              <strong className="text-[#C7FF38]">{startingPlayers.filter((s) => s.player).length}/11</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Swords className="w-7 h-7 text-[#C7FF38]" />
            Taktik & Saha Dizilişi
          </h1>
        </div>

        {/* Action Controls & Telemetry */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoAssign}
            className="px-5 py-2.5 bg-[#00F5A0] hover:bg-[#00E590] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-[0_0_16px_rgba(0,245,160,0.3)] active:scale-95"
            title="En yüksek genel reyting ve formdaki oyuncuları mevkilerine göre otomatik dizer"
          >
            <Sparkles className="w-4 h-4" />
            <span>OTOMATİK 11 DİZ</span>
          </button>

          <div className="px-3.5 py-1.5 bg-[#070D1A] border border-[#182338] rounded-lg text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Mentalite</span>
            <span className="font-bold text-[#4FE4FF]">{tactics.settings.mentality}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#070D1A] border border-[#182338] rounded-lg text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Tempo</span>
            <span className="font-bold text-[#C7FF38]">{tactics.settings.tempo}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#070D1A] border border-[#182338] rounded-lg text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px] block">Pres Şiddeti</span>
            <span className="font-bold text-amber-400">{tactics.settings.pressing}</span>
          </div>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-[#00F5A0] text-[#00F5A0] text-xs font-mono font-bold flex items-center gap-2 rounded-xl animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

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
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
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

          {/* Active Slot Selection Banner */}
          {selectedSlot && (
            <div className="p-3.5 bg-[#00F5A0]/10 border border-[#00F5A0] text-xs font-mono flex items-center justify-between gap-3 rounded-xl animate-in fade-in">
              <div>
                <span className="text-zinc-400 text-[10px] block uppercase font-bold">// DEĞİŞİKLİK MODU</span>
                <span className="font-bold text-white">
                  Seçili: <span className="text-[#C7FF38] font-black">{selectedSlot.role}</span>{' '}
                  ({selectedStarterPlayer ? `${selectedStarterPlayer.firstName[0]}. ${selectedStarterPlayer.lastName}` : 'Boş'})
                </span>
                <p className="text-[11px] text-zinc-300 mt-0.5">
                  Yer değiştirmek için aşağıdaki oyuncuya veya sahada başka bir mevkiye tıklayın.
                </p>
              </div>
              <button
                onClick={() => setSelectedSlotId(null)}
                className="px-2.5 py-1 bg-[#0B1323] hover:bg-[#0E1B33] text-zinc-300 text-[10px] font-mono border border-[#182338] uppercase rounded"
              >
                İptal
              </button>
            </div>
          )}

          {/* Bench & Reserve Roster */}
          <div className="sc-panel p-4 sm:p-5 rounded-2xl border border-[#182338] shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#182338] pb-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveSquadTab('BENCH')}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    activeSquadTab === 'BENCH'
                      ? 'bg-[#00F5A0] text-black'
                      : 'text-zinc-400 hover:text-white bg-[#070D1A] border border-[#182338]'
                  }`}
                >
                  Yedekler ({benchPlayers.length})
                </button>
                <button
                  onClick={() => setActiveSquadTab('RESERVES')}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase rounded-lg transition-all ${
                    activeSquadTab === 'RESERVES'
                      ? 'bg-[#00F5A0] text-black'
                      : 'text-zinc-400 hover:text-white bg-[#070D1A] border border-[#182338]'
                  }`}
                >
                  Rezervler ({reservePlayers.length})
                </button>
              </div>

              <span className="text-[11px] font-mono text-zinc-500">
                TOPLAM: {benchPlayers.length + reservePlayers.length} OYUNCU
              </span>
            </div>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {activeRoster.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-500 border border-dashed border-[#182338] rounded-xl">
                  Bu kategoride oyuncu bulunmuyor.
                </div>
              ) : (
                activeRoster.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handleBenchPlayerClick(player)}
                    className="flex items-center justify-between p-2.5 bg-[#070D1A] hover:bg-[#0E1B33] border border-[#182338] hover:border-[#00F5A0]/60 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-6 flex items-center justify-center text-[10px] font-mono font-black bg-[#0B1323] text-zinc-300 rounded border border-[#182338]">
                        {player.position}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-[#C7FF38] transition-colors truncate max-w-[130px] sm:max-w-[150px]">
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
                      <button
                        onClick={(e) => handleDirectPutOnPitch(player, e)}
                        title="İlk 11'e yerleştir"
                        className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase bg-[#0B1323] hover:bg-[#00F5A0] text-zinc-300 hover:text-black rounded border border-[#182338] hover:border-white transition-all flex items-center gap-1"
                      >
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                        <span>Sahaya Al</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
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
