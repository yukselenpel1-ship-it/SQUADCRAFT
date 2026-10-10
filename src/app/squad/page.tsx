'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PositionCategory } from '@/types/game';
import { TrainingIntensity } from '@/lib/career/types';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
import { CareerPageHeader } from '@/components/career/CareerPageHeader';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import {
  Users,
  Search,
  ArrowUpDown,
  FileText,
  Dumbbell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Zap,
  X,
  HeartPulse,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';

type SortField = 'overall' | 'potential' | 'age' | 'form' | 'fitness' | 'morale' | 'marketValue' | 'wage' | 'lastName';
type SortOrder = 'asc' | 'desc';

export default function SquadPage() {
  const {
    userClub,
    userPlayers,
    tactics,
    finances,
    currentDate,
    trainingIntensity,
    setTrainingIntensity,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [activeSquadTab, setActiveSquadTab] = useState<'WAR_ROOM' | 'ROSTER' | 'CONTRACTS' | 'TRAINING' | 'INJURIES'>('WAR_ROOM');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | PositionCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);
  const [fullModalPlayer, setFullModalPlayer] = useState<Player | null>(null);
  const [renewingPlayer, setRenewingPlayer] = useState<Player | null>(null);

  // Position Category Helper
  const getCategory = (pos: string): PositionCategory => {
    if (pos === 'GK') return 'GK';
    if (['DR', 'DC', 'DL'].includes(pos)) return 'DEF';
    if (['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(pos)) return 'MID';
    return 'ATT';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Starting XI mapped to real players
  const startingLineup = useMemo(() => {
    return (tactics?.lineup || []).map((slot) => {
      const player = userPlayers.find((p) => p.id === slot.playerId);
      return {
        slot,
        player: player || userPlayers[0],
      };
    });
  }, [tactics, userPlayers]);

  const benchPlayers = useMemo(() => {
    return (tactics?.substitutes || [])
      .map((id) => userPlayers.find((p) => p.id === id))
      .filter(Boolean) as Player[];
  }, [tactics, userPlayers]);

  const reservePlayers = useMemo(() => {
    return (tactics?.reserves || [])
      .map((id) => userPlayers.find((p) => p.id === id))
      .filter(Boolean) as Player[];
  }, [tactics, userPlayers]);

  const filteredAndSortedPlayers = useMemo(() => {
    return userPlayers
      .filter((player) => {
        if (selectedCategory !== 'ALL' && getCategory(player.position) !== selectedCategory) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase();
          const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
          const pos = player.position.toLowerCase();
          if (!fullName.includes(query) && !pos.includes(query)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];
        if (sortField === 'lastName') {
          valA = a.lastName.toLowerCase();
          valB = b.lastName.toLowerCase();
        }
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [userPlayers, selectedCategory, searchQuery, sortField, sortOrder]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="KADRO KOMUTASI YÜKLENİYOR"
        message="Oyuncu profilleri, kondisyon verileri ve taktiksel eşleşmeler derleniyor..."
      />
    );
  }

  const avgOvr = Math.round(
    userPlayers.reduce((acc, p) => acc + (p.overall || 70), 0) / (userPlayers.length || 1)
  );

  return (
    <div className="sc-editorial-restyle space-y-6 pb-28 lg:pb-12 select-none animate-in fade-in duration-300">
      {/* Broadcast Header HUD */}
      <CareerPageHeader
        badge="TACTICAL ROSTER // SQUAD DEPT"
        title="SQUAD WAR ROOM"
        subtitle={`${userClub.name} aktif oyuncu kadrosu, kondisyon takibi, antrenman ve sağlık merkezi`}
        metrics={[
          { label: 'TOPLAM OYUNCU', value: userPlayers.length, accent: 'default' },
          { label: 'ORTALAMA GÜÇ', value: `${avgOvr} OVR`, accent: 'lime' },
          { label: 'HAFTALIK MAAŞ', value: `€${(finances.weeklyWages || 0).toLocaleString()}`, accent: 'gold' },
          { label: 'KADRO DURUMU', value: 'TAM HAZIR', accent: 'cyan' },
        ]}
      >
        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 font-barlow font-bold text-[13px] uppercase tracking-wider">
          {[
            { id: 'WAR_ROOM', label: 'WAR ROOM 3D', icon: Layers },
            { id: 'ROSTER', label: 'TAM KADRO', icon: Users },
            { id: 'CONTRACTS', label: 'KONTRATLAR', icon: FileText },
            { id: 'TRAINING', label: 'ANTRENMAN', icon: Dumbbell },
            { id: 'INJURIES', label: 'REVİR', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSquadTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSquadTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer min-h-[42px] ${
                  active
                    ? 'bg-[#B7FF3C] text-black font-black shadow-[0_0_18px_rgba(183,255,60,0.35)] scale-[1.02]'
                    : 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </CareerPageHeader>

      {/* Main Layout: Left Perspective Pitch / Roster + Right Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 or 12 cols depending on drawer) */}
        <div className={`${inspectedPlayer ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
          {/* TAB 1: WAR ROOM PERSPECTIVE PITCH */}
          {activeSquadTab === 'WAR_ROOM' && (
            <div className="space-y-6">
              {/* Interactive Tactical Football Pitch */}
              <div className="relative w-full rounded-[10px] border border-white/15 bg-[#090d0a] shadow-2xl overflow-hidden p-6 sm:p-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6 font-ibm text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#b8ff3d] font-bold uppercase tracking-widest">
                      STARTING XI // DİZİLİŞ: {tactics?.formation || '4-3-3'}
                    </span>
                  </div>
                  <span className="text-[#8f9a91]">
                    OYUNCUYA TIKLAYARAK SAĞ KOMUTA PANELİNİ AÇIN
                  </span>
                </div>

                {/* Perspective Pitch Container */}
                <div
                  className="relative w-full max-w-3xl mx-auto h-[540px] rounded-[10px] border-2 border-[#b8ff3d]/30 overflow-hidden shadow-inner flex flex-col justify-between p-4"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, #0d1e13 0%, #06110a 75%, #050a07 100%)',
                    boxShadow: 'inset 0 0 80px rgba(0,0,0,0.85), 0 0 30px rgba(184,255,61,0.1)',
                  }}
                >
                  {/* Pitch Turf Grid Lines */}
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-[1px] bg-[#b8ff3d]/20" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-[#b8ff3d]/20" />
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-[#b8ff3d]/20" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-[#b8ff3d]/20" />

                  {/* Players Positioning along pitch */}
                  {startingLineup.map(({ slot, player }) => {
                    const isSelected = inspectedPlayer?.id === player?.id;
                    return (
                      <div
                        key={slot.slotId}
                        onClick={() => setInspectedPlayer(player)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out cursor-pointer group"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                        }}
                      >
                        <div
                          className={`flex flex-col items-center transition-transform duration-200 group-hover:scale-110 ${
                            isSelected ? 'scale-110 drop-shadow-[0_0_20px_#b8ff3d]' : ''
                          }`}
                        >
                          {/* Player Marker Pill */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-barlow font-extrabold text-[15px] border-2 shadow-lg transition-colors ${
                              isSelected
                                ? 'bg-[#b8ff3d] text-[#050806] border-[#b8ff3d]'
                                : 'bg-[#0d130f] text-[#f3f6f3] border-white/20 group-hover:border-[#b8ff3d]'
                            }`}
                          >
                            <span>{player?.overall || 75}</span>
                          </div>

                          <div className="mt-1 px-2 py-0.5 rounded bg-[#050806]/90 border border-white/10 text-center whitespace-nowrap shadow">
                            <span className="font-barlow font-bold text-[11px] text-[#f3f6f3] uppercase block leading-none">
                              {player?.lastName || 'OYUNCU'}
                            </span>
                            <span className="font-ibm text-[9px] text-[#b8ff3d]">
                              {slot.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub Roster Below Pitch (Bench & Reserves) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10 font-ibm">
                  {/* Bench */}
                  <div className="p-4 rounded-[6px] bg-[#0d130f] border border-white/10">
                    <span className="text-[11px] text-[#21dfbd] font-bold uppercase tracking-wider block mb-3">
                      YEDEKLER (BENCH - {benchPlayers.length})
                    </span>
                    <div className="space-y-1.5">
                      {benchPlayers.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setInspectedPlayer(p)}
                          className="flex items-center justify-between p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#8f9a91] font-bold">
                              {p.position}
                            </span>
                            <span className="text-[12px] font-bold text-[#f3f6f3]">
                              {p.firstName[0]}. {p.lastName}
                            </span>
                          </div>
                          <span className="font-bold text-[#b8ff3d]">{p.overall} OVR</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reserves */}
                  <div className="p-4 rounded-[6px] bg-[#0d130f] border border-white/10">
                    <span className="text-[11px] text-[#ffd34f] font-bold uppercase tracking-wider block mb-3">
                      REZERV KADRO ({reservePlayers.length})
                    </span>
                    <div className="space-y-1.5">
                      {reservePlayers.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setInspectedPlayer(p)}
                          className="flex items-center justify-between p-2 rounded bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#8f9a91] font-bold">
                              {p.position}
                            </span>
                            <span className="text-[12px] font-bold text-[#f3f6f3]">
                              {p.firstName[0]}. {p.lastName}
                            </span>
                          </div>
                          <span className="font-bold text-[#ffd34f]">{p.overall} OVR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROSTER TABLE */}
          {(activeSquadTab === 'ROSTER' || activeSquadTab === 'CONTRACTS' || activeSquadTab === 'TRAINING' || activeSquadTab === 'INJURIES') && (
            <div className="p-6 rounded-[8px] bg-[#0d130f] border border-white/10 space-y-4 shadow-xl">
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-[3px] font-barlow font-bold text-[12px] uppercase tracking-wider transition-colors cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#b8ff3d] text-[#050806]'
                          : 'bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Oyuncu ara..."
                    className="w-full sm:w-48 bg-[#090d0a] border border-white/10 focus:border-[#b8ff3d] px-7 py-1.5 rounded-[4px] text-[12px] font-inter text-[#f3f6f3] outline-none"
                  />
                  <Search size={14} className="text-[#8f9a91] absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-ibm text-[12px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[#8f9a91]">
                      <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('lastName')}>
                        OYUNCU <ArrowUpDown size={10} className="inline ml-1" />
                      </th>
                      <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('overall')}>
                        OVR
                      </th>
                      <th className="py-2.5 px-2 text-center cursor-pointer" onClick={() => handleSort('potential')}>
                        POT
                      </th>
                      <th className="py-2.5 px-2 text-center">YAŞ</th>
                      <th className="py-2.5 px-2 text-center">KONDİSYON</th>
                      <th className="py-2.5 px-2 text-center">MORAL</th>
                      <th className="py-2.5 px-3 text-right">PİYASA DEĞERİ</th>
                      <th className="py-2.5 px-3 text-right">İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedPlayers.map((player) => (
                      <tr
                        key={player.id}
                        className="border-b border-white/5 hover:bg-white/[0.03] transition-colors cursor-pointer"
                        onClick={() => setInspectedPlayer(player)}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#b8ff3d] font-bold">
                              {player.position}
                            </span>
                            <span className="font-barlow font-bold text-[15px] text-[#f3f6f3] uppercase">
                              {player.firstName} {player.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#b8ff3d]">{player.overall}</td>
                        <td className="py-2.5 px-2 text-center text-[#21dfbd]">{player.potential}</td>
                        <td className="py-2.5 px-2 text-center text-[#8f9a91]">{player.age}</td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={player.fitness >= 85 ? 'text-[#65ff83]' : 'text-[#ffd34f]'}>
                            %{player.fitness}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8f9a91]">%{player.morale}</td>
                        <td className="py-2.5 px-3 text-right text-[#f3f6f3] font-bold">
                          €{((player.marketValue || 4500000) / 1_000_000).toFixed(1)}M
                        </td>
                        <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setFullModalPlayer(player)}
                            className="px-2.5 py-1 rounded bg-white/5 hover:bg-[#b8ff3d] hover:text-[#050806] font-barlow font-bold text-[11px] uppercase transition-colors"
                          >
                            DETAY
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Executive Player Command Drawer */}
        {inspectedPlayer && (
          <div className="lg:col-span-4 p-6 rounded-[8px] bg-[#0d130f] border border-white/10 space-y-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setInspectedPlayer(null)}
              className="absolute top-4 right-4 text-[#8f9a91] hover:text-[#f3f6f3] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header / Portrait */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
              <PlayerPortrait
                player={inspectedPlayer}
                size="lg"
              />
              <div>
                <span className="px-2 py-0.5 rounded bg-[#b8ff3d]/20 text-[#b8ff3d] font-ibm text-[10px] font-bold uppercase">
                  {inspectedPlayer.position}
                </span>
                <h3 className="font-barlow font-extrabold text-[22px] text-[#f3f6f3] uppercase leading-tight mt-1">
                  {inspectedPlayer.firstName} {inspectedPlayer.lastName}
                </h3>
                <span className="font-ibm text-[11px] text-[#8f9a91]">
                  {inspectedPlayer.age} YAŞ · {userClub.name}
                </span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-3 gap-2 text-center font-ibm text-[11px]">
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                <span className="text-[#8f9a91] block text-[9px] uppercase">OVERALL</span>
                <span className="font-barlow font-extrabold text-[24px] text-[#b8ff3d] leading-none">
                  {inspectedPlayer.overall}
                </span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                <span className="text-[#8f9a91] block text-[9px] uppercase">POTENTIAL</span>
                <span className="font-barlow font-extrabold text-[24px] text-[#21dfbd] leading-none">
                  {inspectedPlayer.potential}
                </span>
              </div>
              <div className="p-2.5 rounded bg-white/[0.02] border border-white/5">
                <span className="text-[#8f9a91] block text-[9px] uppercase">FITNESS</span>
                <span className="font-barlow font-extrabold text-[24px] text-[#65ff83] leading-none">
                  %{inspectedPlayer.fitness}
                </span>
              </div>
            </div>

            {/* Attributes Breakdown */}
            <div className="space-y-2 font-ibm text-[11px]">
              <span className="text-[#8f9a91] font-bold uppercase tracking-wider block">
                TEKNİK NİTELİKLER
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[#8f9a91]">HIZ (PACE):</span>
                  <span className="font-bold text-[#f3f6f3]">{inspectedPlayer.attributes?.pace || 78}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[#8f9a91]">BİTİRİCİLİK:</span>
                  <span className="font-bold text-[#f3f6f3]">{inspectedPlayer.attributes?.finishing || 74}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[#8f9a91]">PAS (PASSING):</span>
                  <span className="font-bold text-[#f3f6f3]">{inspectedPlayer.attributes?.passing || 81}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-white/[0.02] border border-white/5">
                  <span className="text-[#8f9a91]">MÜDAHALE (TKL):</span>
                  <span className="font-bold text-[#f3f6f3]">{inspectedPlayer.attributes?.tackling || 70}</span>
                </div>
              </div>
            </div>

            {/* Financial & Contract Details */}
            <div className="p-3.5 rounded bg-[#090d0a] border border-white/10 space-y-2 font-ibm text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#8f9a91]">PİYASA DEĞERİ:</span>
                <span className="font-bold text-[#b8ff3d]">
                  €{((inspectedPlayer.marketValue || 4500000) / 1_000_000).toFixed(1)}M
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8f9a91]">HAFTALIK MAAŞ:</span>
                <span className="font-bold text-[#21dfbd]">
                  €{((inspectedPlayer.wage || 45000) / 1000).toFixed(0)}K / hafta
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8f9a91]">KONTRAT BİTİŞİ:</span>
                <span className="font-bold text-[#f3f6f3]">{inspectedPlayer.contractUntil || 2028}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRenewingPlayer(inspectedPlayer)}
                className="flex-1 py-2.5 rounded bg-[#b8ff3d] hover:bg-[#9bea27] text-[#050806] font-barlow font-bold text-[14px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                SÖZLEŞME YENİLE
              </button>
              <button
                type="button"
                onClick={() => setFullModalPlayer(inspectedPlayer)}
                className="py-2.5 px-4 rounded bg-white/5 hover:bg-white/10 text-[#f3f6f3] font-barlow font-bold text-[14px] uppercase transition-colors cursor-pointer"
              >
                TAM DETAY
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing Full Player Modal */}
      {fullModalPlayer && (
        <PlayerModal
          player={fullModalPlayer}
          onClose={() => setFullModalPlayer(null)}
        />
      )}

      {/* Existing Contract Negotiation Modal */}
      {renewingPlayer && (
        <NegotiationModal
          player={renewingPlayer}
          onClose={() => setRenewingPlayer(null)}
        />
      )}
    </div>
  );
}
