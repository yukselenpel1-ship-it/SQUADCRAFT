'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { TacticsPitch } from '@/components/tactics/TacticsPitch';
import { TacticalSliders } from '@/components/tactics/TacticalSliders';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
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
  Award,
  Activity,
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
    seasonYear,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'formation' | 'roles' | 'instructions' | 'setpieces' | 'styles' | 'analysis'>('formation');
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

  if (!isInitialized || !isCareerHydrated) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Taktik tahtası hazırlanıyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Taktik Tahtası & Maç Öncesi Sahaya Yayılış"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* Action Notice */}
      {actionNotice && (
        <div className="p-3 rounded-xl bg-[#65F56B]/20 border border-[#65F56B]/50 text-white text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in shadow-[0_0_15px_rgba(101,245,107,0.3)]">
          <CheckCircle2 className="w-4 h-4 text-[#65F56B] shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* 2. TACTICAL TABS */}
      <div className="flex items-center gap-2 border-b border-[rgba(125,160,175,0.14)] pb-3 overflow-x-auto select-none">
        {[
          { id: 'formation', label: 'Taktik Düzeni' },
          { id: 'roles', label: 'Oyuncu Rolleri' },
          { id: 'instructions', label: 'Özel Talimatlar' },
          { id: 'setpieces', label: 'Duran Toplar' },
          { id: 'styles', label: 'Taktik Stiller' },
          { id: 'analysis', label: 'Analiz' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#65F56B] text-black font-black shadow-[0_0_12px_rgba(101,245,107,0.3)]'
                : 'bg-[#09141B] text-zinc-400 hover:text-white border border-[rgba(125,160,175,0.14)]'
            }`}
          >
            {tab.label}
          </button>
        ))}

        <div className="ml-auto shrink-0">
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#09141B] hover:bg-[#0E1E28] border border-[#65F56B]/40 text-[#65F56B] text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#65F56B]" />
            <span>En İyi 11 Otomatik Diz</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN SECTION: PITCH & SLIDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CENTER PITCH (7 COLS) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-4">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#65F56B]" />
              Saha Yerleşimi ({tactics.formation})
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {selectedSlotId !== null ? 'Değiştirmek için saha veya yedekten oyuncu seçin' : 'Mevki seçmek için oyuncuya tıklayın'}
            </span>
          </div>

          <TacticsPitch
            formation={tactics.formation}
            lineup={tactics.lineup}
            allPlayers={userPlayers}
            substitutes={tactics.substitutes}
            reserves={tactics.reserves}
            selectedSlotId={selectedSlotId}
            onSelectSlot={(id) => setSelectedSlotId(id)}
            onSwapPlayer={(slotId, playerId) => {
              swapLineupPlayer(slotId, playerId);
              setSelectedSlotId(null);
            }}
            onSwapSlots={(from, to) => {
              swapPitchSlots(from, to);
              setSelectedSlotId(null);
            }}
            onPlayerClick={(player) => setInspectedPlayer(player)}
          />
        </div>

        {/* RIGHT SETTINGS SLIDERS (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[rgba(125,160,175,0.14)] mb-4">
              <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#65F56B]" />
                Taktiksel Ayarlar & Diziliş
              </span>
            </div>

            <TacticalSliders
              formation={tactics.formation}
              settings={tactics.settings}
              onFormationChange={(form) => setFormation(form)}
              onSettingsChange={(newSettings) => updateTacticalSettings(newSettings)}
            />
          </div>
        </div>
      </div>

      {/* 4. BOTTOM BENCH & RESERVES TRAY */}
      <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase text-white font-sans">
              Kadro Havuzu & Değişiklikler
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveSquadTab('BENCH')}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                  activeSquadTab === 'BENCH'
                    ? 'bg-[#65F56B] text-black font-black'
                    : 'bg-[#0D1C26] text-zinc-400 hover:text-white'
                }`}
              >
                Yedek Kulübesi ({benchPlayers.length})
              </button>
              <button
                onClick={() => setActiveSquadTab('RESERVES')}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                  activeSquadTab === 'RESERVES'
                    ? 'bg-[#65F56B] text-black font-black'
                    : 'bg-[#0D1C26] text-zinc-400 hover:text-white'
                }`}
              >
                Tribün / Rezerv ({reservePlayers.length})
              </button>
            </div>
          </div>

          <span className="text-[10px] font-mono text-zinc-500">
            İlk 11 ile değiştirmek için oyuncu kartına tıklayın
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {(activeSquadTab === 'BENCH' ? benchPlayers : reservePlayers).map((player) => (
            <div
              key={player.id}
              onClick={() => handleBenchPlayerClick(player)}
              className="p-3 rounded-xl bg-[#0D1C26] border border-zinc-800 hover:border-[#65F56B]/50 cursor-pointer flex flex-col items-center text-center transition group shadow-md"
            >
              <div className="relative mb-2">
                <PlayerPortrait player={player} size="xs" shape="circle" />
                <span className="absolute -top-1 -right-1.5 px-1 rounded bg-black text-[8px] font-mono font-black text-[#65F56B] border border-[#65F56B]/40">
                  {player.overall}
                </span>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-[#65F56B] truncate max-w-full">
                {player.firstName[0]}. {player.lastName}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">{player.position}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Player Modal */}
      {inspectedPlayer && (
        <PlayerModal
          player={inspectedPlayer}
          onClose={() => setInspectedPlayer(null)}
        />
      )}
    </div>
  );
}
