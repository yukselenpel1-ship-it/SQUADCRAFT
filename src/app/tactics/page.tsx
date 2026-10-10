'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { CareerPageHeader } from '@/components/career/CareerPageHeader';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { Player, Formation, Mentality, Tempo, Pressing, PassingStyle, DefensiveLine, Width } from '@/types/game';
import {
  Swords,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  ArrowRightLeft,
  Flame,
  Layers,
  Activity,
  Compass,
} from 'lucide-react';

export default function TacticsPage() {
  const {
    userClub,
    userPlayers,
    tactics,
    setFormation,
    updateTacticalSettings,
    swapLineupPlayer,
    autoAssignTactics,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SHAPE' | 'HEATMAP' | 'TRANSITION'>('SHAPE');

  const getPlayer = (id: string | null) => {
    if (!id) return null;
    return userPlayers.find((p) => p.id === id) || null;
  };

  const startingPlayers = (tactics?.lineup || []).map((s) => ({
    slot: s,
    player: getPlayer(s.playerId),
  }));

  const benchPlayers = (tactics?.substitutes || [])
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

  const settings = tactics?.settings || {
    mentality: 'Dengeli',
    tempo: 'Standart',
    pressing: 'Orta',
    passingStyle: 'Kısa',
    defensiveLine: 'Standart',
    width: 'Dengeli',
  };

  const handleSettingChange = (key: string, val: any) => {
    updateTacticalSettings({
      ...settings,
      [key]: val,
    });
  };

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="TAKTİK TAHTASI HAZIRLANIYOR"
        message="Diziliş formasyonu, oyun anlayışı ve oyuncu pozisyonları yükleniyor..."
      />
    );
  }

  // Visual offsets based on Width and Defensive Line
  const widthFactor = settings.width === 'Geniş' ? 1.15 : settings.width === 'Dar' ? 0.85 : 1.0;
  const defLineOffset =
    settings.defensiveLine === 'Çok Yüksek'
      ? -10
      : settings.defensiveLine === 'Yüksek'
      ? -6
      : settings.defensiveLine === 'Derin'
      ? 6
      : settings.defensiveLine === 'Çok Derin'
      ? 10
      : 0;

  return (
    <div className="space-y-6 pb-28 lg:pb-12 select-none animate-in fade-in duration-300">
      {/* Broadcast Header HUD */}
      <CareerPageHeader
        badge="TACTICAL SYSTEM // COMMAND CENTER"
        title="TACTICAL COMMAND CENTER"
        subtitle={`${userClub.name} oyun felsefesi, saha yerleşimi ve maç stratejisi`}
        metrics={[
          { label: 'DİZİLİŞ', value: tactics?.formation || '4-3-3', accent: 'lime' },
          { label: 'ANLAYIŞ', value: settings.mentality || 'Dengeli', accent: 'cyan' },
          { label: 'TEMPO', value: settings.tempo || 'Standart', accent: 'gold' },
          { label: 'PRES', value: settings.pressing || 'Orta', accent: 'default' },
        ]}
        actions={
          <button
            type="button"
            onClick={handleAutoAssign}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B7FF3C] text-black font-barlow font-black text-[13px] uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(183,255,60,0.35)] hover:scale-[1.02] cursor-pointer"
          >
            <Sparkles size={16} />
            <span>KADROYU DİZ (AUTO-ASSIGN)</span>
          </button>
        }
      />

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="p-4 rounded-xl bg-[#B7FF3C]/10 border border-[#B7FF3C]/40 text-[#B7FF3C] font-mono text-[12px] flex items-center gap-3 animate-in fade-in shadow-[0_0_20px_rgba(183,255,60,0.15)]">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Large Tactical Pitch + Right Tactical Philosophy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Pitch and Tactical Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[10px] border border-white/15 bg-[#090d0a] shadow-2xl p-6 sm:p-8 overflow-hidden relative">
            {/* Tactical Display Sub-tabs & Formation Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6 font-ibm text-[11px]">
              <div className="flex items-center gap-3">
                <span className="text-[#8f9a91]">DİZİLİŞ:</span>
                <select
                  value={tactics.formation}
                  onChange={(e) => setFormation(e.target.value as Formation)}
                  className="bg-[#0d130f] border border-white/10 focus:border-[#b8ff3d] px-3 py-1.5 rounded-[4px] font-barlow font-extrabold text-[16px] text-[#b8ff3d] outline-none cursor-pointer"
                >
                  {[
                    '4-3-3',
                    '4-2-3-1',
                    '4-4-2',
                    '3-5-2',
                    '3-4-3',
                    '5-3-2',
                    '4-1-4-1',
                    '4-2-4',
                  ].map((f) => (
                    <option key={f} value={f} className="bg-[#090d0a]">
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Modes */}
              <div className="flex items-center gap-1.5 bg-[#0d130f] border border-white/10 p-1 rounded-[4px]">
                {[
                  { id: 'SHAPE', label: 'TAKTIK DİZİLİŞ' },
                  { id: 'HEATMAP', label: 'PRES & BASKI ALANI' },
                  { id: 'TRANSITION', label: 'GEÇİŞ HATTI' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setActiveTab(mode.id as any)}
                    className={`px-3 py-1 rounded-[2px] font-barlow font-bold text-[12px] uppercase tracking-wider transition-colors cursor-pointer ${
                      activeTab === mode.id
                        ? 'bg-[#b8ff3d] text-[#050806]'
                        : 'text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Pitch Console */}
            <div
              className="relative w-full max-w-2xl mx-auto h-[560px] rounded-[10px] border-2 border-[#b8ff3d]/30 overflow-hidden shadow-inner flex flex-col justify-between p-4"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #0a170f 0%, #050b07 80%, #040805 100%)',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9), 0 0 30px rgba(184,255,61,0.1)',
              }}
            >
              {/* Pitch Marking Geometry */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-[#b8ff3d]/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#b8ff3d]/20" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-[#b8ff3d]/20" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-[#b8ff3d]/20" />

              {/* Pressing Heatmap Overlay Mode */}
              {activeTab === 'HEATMAP' && (
                <div
                  className="absolute inset-x-0 pointer-events-none transition-all duration-700"
                  style={{
                    top: settings.pressing === 'Aşırı' ? '15%' : settings.pressing === 'Yoğun' ? '25%' : '40%',
                    bottom: '20%',
                    background:
                      'radial-gradient(ellipse at 50% 50%, rgba(255, 83, 101, 0.35) 0%, rgba(255, 211, 79, 0.2) 60%, transparent 100%)',
                  }}
                />
              )}

              {/* Dynamic Tactical Pitch Players */}
              {startingPlayers.map(({ slot, player }) => {
                const isSelected = selectedSlotId === slot.slotId;
                const isDef = ['GK', 'DC', 'DR', 'DL'].includes(slot.role);

                // Apply width & def line vertical/horizontal factor
                const posX = Math.min(92, Math.max(8, 50 + (slot.x - 50) * widthFactor));
                const posY = isDef ? Math.max(10, slot.y + defLineOffset) : slot.y;

                return (
                  <div
                    key={slot.slotId}
                    onClick={() => {
                      if (selectedSlotId === slot.slotId) setSelectedSlotId(null);
                      else setSelectedSlotId(slot.slotId);
                    }}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out cursor-pointer group"
                    style={{
                      left: `${posX}%`,
                      top: `${posY}%`,
                    }}
                  >
                    <div
                      className={`flex flex-col items-center transition-transform duration-200 group-hover:scale-110 ${
                        isSelected ? 'scale-110 drop-shadow-[0_0_20px_#b8ff3d]' : ''
                      }`}
                    >
                      {/* Tactical Role Token */}
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-barlow font-extrabold text-[15px] border-2 shadow-xl transition-all ${
                          isSelected
                            ? 'bg-[#b8ff3d] text-[#050806] border-[#b8ff3d]'
                            : 'bg-[#0d130f] text-[#f3f6f3] border-white/20 group-hover:border-[#b8ff3d]'
                        }`}
                      >
                        <span>{player?.overall || 75}</span>
                      </div>

                      <div className="mt-1 px-2.5 py-0.5 rounded bg-[#050806]/95 border border-white/10 text-center whitespace-nowrap shadow">
                        <span className="font-barlow font-bold text-[11px] text-[#f3f6f3] uppercase block leading-none">
                          {player?.lastName || 'BOŞ MEVKİ'}
                        </span>
                        <span className="font-ibm text-[9px] text-[#b8ff3d] font-bold">
                          {slot.role}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tactical Bench Strip */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <span className="font-ibm text-[11px] text-[#8f9a91] uppercase tracking-wider block mb-3">
                YEDEK KULÜBESİ (SAHAYA ALMAK İÇİN ÖNCE MEVKİYE SONRA OYUNCUYA TIKLAYIN)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-ibm text-[11px]">
                {benchPlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handleBenchPlayerClick(player)}
                    className="p-2.5 rounded bg-[#0d130f] border border-white/10 hover:border-[#b8ff3d] cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <span className="text-[#8f9a91] text-[9px] block">{player.position}</span>
                      <span className="font-bold text-[#f3f6f3] truncate">
                        {player.firstName[0]}. {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-[#b8ff3d]">{player.overall}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Tactical Philosophy Sliders */}
        <div className="lg:col-span-4 p-6 rounded-[8px] bg-[#0d130f] border border-white/10 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-3">
            <span className="font-ibm text-[11px] text-[#b8ff3d] uppercase tracking-widest font-semibold block">
              TACTICAL PHILOSOPHY
            </span>
            <h3 className="font-barlow font-extrabold text-[24px] text-[#f3f6f3] uppercase leading-none mt-1">
              OYUN ANLAYIŞI & TALİMATLAR
            </h3>
          </div>

          <div className="space-y-4 font-ibm text-[12px]">
            {/* 1. Mentality */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>MENTALİTE (MENTALITY)</span>
                <span className="text-[#b8ff3d]">{settings.mentality}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Savunmacı', 'Dengeli', 'Hücum'] as Mentality[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('mentality', val)}
                    className={`py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.mentality === val
                        ? 'bg-[#b8ff3d] text-[#050806]'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tempo */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>TEMPO</span>
                <span className="text-[#21dfbd]">{settings.tempo}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Düşük', 'Standart', 'Yüksek'] as Tempo[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('tempo', val)}
                    className={`py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.tempo === val
                        ? 'bg-[#21dfbd] text-[#050806]'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pressing */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>PRES YOĞUNLUĞU (PRESSING)</span>
                <span className="text-[#ff5365]">{settings.pressing}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['Hafif', 'Orta', 'Yoğun', 'Aşırı'] as Pressing[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('pressing', val)}
                    className={`py-1.5 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      settings.pressing === val
                        ? 'bg-[#ff5365] text-white'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Width */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>GENİŞLİK (WIDTH)</span>
                <span className="text-[#ffd34f]">{settings.width}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Dar', 'Dengeli', 'Geniş'] as Width[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('width', val)}
                    className={`py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.width === val
                        ? 'bg-[#ffd34f] text-[#050806]'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Defensive Line */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>SAVUNMA ÇİZGİSİ (DEFENSIVE LINE)</span>
                <span className="text-[#b8ff3d]">{settings.defensiveLine}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Derin', 'Standart', 'Yüksek'] as DefensiveLine[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('defensiveLine', val)}
                    className={`py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.defensiveLine === val
                        ? 'bg-[#b8ff3d] text-[#050806]'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Passing Style / Build-up */}
            <div>
              <div className="flex justify-between text-[#8f9a91] mb-1.5 font-bold">
                <span>PAS STİLİ (BUILD-UP)</span>
                <span className="text-[#21dfbd]">{settings.passingStyle}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Kısa', 'Doğrudan', 'Uzun'] as PassingStyle[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('passingStyle', val)}
                    className={`py-1.5 rounded text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.passingStyle === val
                        ? 'bg-[#21dfbd] text-[#050806]'
                        : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
