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
    <div className="sc-editorial-restyle space-y-6 pb-28 lg:pb-12 select-none animate-in fade-in duration-300">
      {/* Broadcast Header HUD */}
      <CareerPageHeader
        badge="SQUADCRAFT / TAKTİK DOSYASI"
        title="TAKTİK TAHTASI"
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#9b2529] text-white font-barlow font-black text-[13px] uppercase tracking-wider transition-all hover:bg-[#751c22] cursor-pointer"
          >
            <Sparkles size={16} />
            <span>KADROYU DİZ (AUTO-ASSIGN)</span>
          </button>
        }
      />

      {/* Action Notice Banner */}
      {actionNotice && (
        <div className="p-4 rounded-sm bg-[#eee4d8] border border-[#bfa19c] text-[#8f2027] font-mono text-[12px] flex items-center gap-3 animate-in fade-in shadow-[0_0_20px_rgba(183,255,60,0.15)]">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="font-bold">{actionNotice}</span>
        </div>
      )}

      {/* Main Grid: Left Large Tactical Pitch + Right Tactical Philosophy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Pitch and Tactical Visualization */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-sm border border-[#d7cab9] bg-[#fffaf2] shadow-sm p-4 sm:p-6 overflow-hidden relative">
            {/* Tactical Display Sub-tabs & Formation Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#d6c9b9] pb-4 mb-5 font-ibm text-[11px]">
              <div className="flex items-center gap-3">
                <span className="text-[#62584f]">DİZİLİŞ:</span>
                <select
                  value={tactics.formation}
                  onChange={(e) => setFormation(e.target.value as Formation)}
                  className="bg-[#f0e6d9] border border-[#c4b5a4] focus:border-[#9b2529] px-3 py-2 rounded-sm font-barlow font-extrabold text-[16px] text-[#24211e] outline-none cursor-pointer"
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
              <div className="flex flex-wrap items-center gap-1.5 bg-[#efe5d8] border border-[#cfbfad] p-1 rounded-sm">
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
                        ? 'bg-[#9b2529] text-white'
                        : 'text-[#4b423a] hover:text-[#9b2529]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Pitch Console */}
            <div
              className="relative w-full max-w-[660px] mx-auto h-[clamp(370px,49vw,520px)] rounded-sm border-2 border-[#8b9d89]/40 overflow-hidden shadow-inner flex flex-col justify-between p-4"
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
            <div className="mt-5 pt-4 border-t border-[#d6c9b9]">
              <span className="font-ibm text-[11px] text-[#62584f] uppercase tracking-wider block mb-3">
                YEDEK KULÜBESİ (SAHAYA ALMAK İÇİN ÖNCE MEVKİYE SONRA OYUNCUYA TIKLAYIN)
              </span>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 font-ibm text-[12px]">
                {benchPlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handleBenchPlayerClick(player)}
                    className="p-3 min-w-0 rounded-sm bg-[#f3ebe0] border border-[#d4c6b5] hover:border-[#9b2529] cursor-pointer flex items-center justify-between gap-2 transition-colors"
                  >
                    <div>
                      <span className="text-[#675c52] text-[11px] block">{player.position}</span>
                      <span className="font-bold text-[#161616] truncate block">
                        {player.firstName[0]}. {player.lastName}
                      </span>
                    </div>
                    <span className="font-bold text-[#9b2529]">{player.overall}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Tactical Philosophy Sliders */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-sm bg-[#fffaf2] border border-[#d7cab9] space-y-5 shadow-sm">
          <div className="border-b border-[#d6c9b9] pb-3">
            <span className="font-ibm text-[11px] text-[#9b2529] uppercase tracking-widest font-semibold block">
              TACTICAL PHILOSOPHY
            </span>
            <h3 className="font-barlow font-extrabold text-[21px] text-[#161616] uppercase leading-none mt-1">
              OYUN ANLAYIŞI & TALİMATLAR
            </h3>
          </div>

          <div className="space-y-5 font-ibm text-[12px]">
            {/* 1. Mentality */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>MENTALİTE (MENTALITY)</span>
                <span className="text-[#9b2529]">{settings.mentality}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Savunmacı', 'Dengeli', 'Hücum'] as Mentality[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('mentality', val)}
                    className={`py-2.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.mentality === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Tempo */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>TEMPO</span>
                <span className="text-[#9b2529]">{settings.tempo}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Düşük', 'Standart', 'Yüksek'] as Tempo[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('tempo', val)}
                    className={`py-2.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.tempo === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Pressing */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>PRES YOĞUNLUĞU (PRESSING)</span>
                <span className="text-[#9b2529]">{settings.pressing}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['Hafif', 'Orta', 'Yoğun', 'Aşırı'] as Pressing[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('pressing', val)}
                    className={`py-2.5 rounded-sm text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      settings.pressing === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Width */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>GENİŞLİK (WIDTH)</span>
                <span className="text-[#9b2529]">{settings.width}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Dar', 'Dengeli', 'Geniş'] as Width[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('width', val)}
                    className={`py-2.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.width === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Defensive Line */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>SAVUNMA ÇİZGİSİ (DEFENSIVE LINE)</span>
                <span className="text-[#9b2529]">{settings.defensiveLine}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Derin', 'Standart', 'Yüksek'] as DefensiveLine[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('defensiveLine', val)}
                    className={`py-2.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.defensiveLine === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* 6. Passing Style / Build-up */}
            <div>
              <div className="flex justify-between text-[#4f463e] mb-2 font-bold">
                <span>PAS STİLİ (BUILD-UP)</span>
                <span className="text-[#9b2529]">{settings.passingStyle}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Kısa', 'Doğrudan', 'Uzun'] as PassingStyle[]).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleSettingChange('passingStyle', val)}
                    className={`py-2.5 rounded-sm text-[11px] font-bold uppercase transition-all cursor-pointer ${
                      settings.passingStyle === val
                        ? 'bg-[#9b2529] text-white'
                        : 'bg-[#eee4d8] border border-[#d7c9b8] text-[#38302b] hover:bg-[#e4d4c2]'
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
