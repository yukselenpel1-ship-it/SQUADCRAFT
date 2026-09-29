'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PositionCategory } from '@/types/game';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { MoraleIndicator } from '@/components/ui/MoraleIndicator';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
import {
  Users,
  Search,
  ArrowUpDown,
} from 'lucide-react';

type SortField = 'overall' | 'potential' | 'age' | 'form' | 'fitness' | 'morale' | 'marketValue' | 'wage' | 'lastName';
type SortOrder = 'asc' | 'desc';

export default function SquadPage() {
  const { userClub, userPlayers } = useGame();

  const [selectedCategory, setSelectedCategory] = useState<'ALL' | PositionCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('overall');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
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

  const filteredAndSortedPlayers = useMemo(() => {
    return userPlayers
      .filter((player) => {
        // Category Filter
        if (selectedCategory !== 'ALL' && getCategory(player.position) !== selectedCategory) {
          return false;
        }
        // Search Filter
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

  const categories = [
    { id: 'ALL', label: 'TÜM KADRO', count: userPlayers.length },
    { id: 'GK', label: 'KALECİLER', count: userPlayers.filter((p) => p.position === 'GK').length },
    { id: 'DEF', label: 'SAVUNMA', count: userPlayers.filter((p) => getCategory(p.position) === 'DEF').length },
    { id: 'MID', label: 'ORTA SAHA', count: userPlayers.filter((p) => getCategory(p.position) === 'MID').length },
    { id: 'ATT', label: 'HÜCUM & FORVET', count: userPlayers.filter((p) => getCategory(p.position) === 'ATT').length },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
              {userClub.name}
            </span>
            <span className="text-xs text-zinc-400 font-mono">2026/27 A TAKIM KADRO LİSTESİ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#00F5A0]" />
            KADRO YÖNETİMİ
          </h1>
        </div>

        {/* Quick Squad Stats */}
        <div className="flex items-center gap-2.5 bg-[#070B12] p-2 border border-zinc-800 text-xs">
          <div className="px-3 text-center">
            <span className="text-[9px] font-mono text-zinc-400 block font-bold uppercase">Toplam Oyuncu</span>
            <span className="text-base font-black italic text-white">{userPlayers.length}</span>
          </div>
          <div className="px-3 text-center border-l border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-400 block font-bold uppercase">Yaş Ort.</span>
            <span className="text-base font-black italic text-emerald-400">
              {(userPlayers.reduce((acc, p) => acc + p.age, 0) / (userPlayers.length || 1)).toFixed(1)}
            </span>
          </div>
          <div className="px-3 text-center border-l border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-400 block font-bold uppercase">Genel Güç</span>
            <span className="text-base font-black italic text-[#00F5A0]">
              {(userPlayers.reduce((acc, p) => acc + p.overall, 0) / (userPlayers.length || 1)).toFixed(1)}
            </span>
          </div>
          <div className="px-3 text-center border-l border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-400 block font-bold uppercase">Ort. Kondisyon</span>
            <span className="text-base font-black italic text-[#00D4FF]">
              %{(userPlayers.reduce((acc, p) => acc + p.fitness, 0) / (userPlayers.length || 1)).toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#070B12] p-1 border border-zinc-800">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                selectedCategory === cat.id
                  ? 'bg-[#00F5A0] text-black border-[#00F5A0] font-black'
                  : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                  selectedCategory === cat.id ? 'bg-black text-[#00F5A0]' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Oyuncu veya mevki ara..."
            className="w-full pl-10 pr-4 py-2 bg-[#070B12] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00F5A0] transition-colors font-medium"
          />
        </div>
      </div>

      {/* Squad Table (Crisp EA FC Sports Table, Zero Blur) */}
      <div className="overflow-x-auto border border-zinc-800 bg-[#070B12] shadow-xl">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-[#040810] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              <th
                onClick={() => handleSort('lastName')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span>Oyuncu</span>
                  <ArrowUpDown className="w-3 h-3 text-[#00F5A0]" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">Mevki</th>
              <th
                onClick={() => handleSort('age')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Yaş</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('overall')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Genel (OVR)</span>
                  <ArrowUpDown className="w-3 h-3 text-[#00F5A0]" />
                </div>
              </th>
              <th
                onClick={() => handleSort('potential')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Potansiyel</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('form')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Form</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('morale')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Moral</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('fitness')}
                className="py-3 px-3 text-center cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Kondisyon</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('marketValue')}
                className="py-3 px-3 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Piyasa Değeri</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('wage')}
                className="py-3 px-4 text-right cursor-pointer hover:text-white"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Haftalık Maaş</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800 text-xs font-semibold">
            {filteredAndSortedPlayers.map((player) => (
              <tr
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className="hover:bg-zinc-900/80 cursor-pointer transition-colors group"
              >
                {/* Player Avatar & Name */}
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-3">
                    <PlayerAvatar
                      firstName={player.firstName}
                      lastName={player.lastName}
                      position={player.position}
                      size="sm"
                    />
                    <div>
                      <div className="font-black italic uppercase text-zinc-100 group-hover:text-[#00F5A0] transition-colors flex items-center gap-1.5">
                        <span>{player.firstName} {player.lastName}</span>
                        {player.isInjured && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-red-950 text-red-400 border border-red-700">
                            SAKAT
                          </span>
                        )}
                        {player.isSuspended && (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-bold bg-amber-950 text-amber-400 border border-amber-700">
                            CEZALI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {player.nationality} • {player.preferredFoot} Ayak
                      </div>
                    </div>
                  </div>
                </td>

                {/* Position */}
                <td className="py-2.5 px-3 text-center">
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-[#00F5A0]">
                    {player.position}
                  </span>
                </td>

                {/* Age */}
                <td className="py-2.5 px-3 text-center text-zinc-300 font-mono font-bold">
                  {player.age}
                </td>

                {/* Overall */}
                <td className="py-2.5 px-3 text-center">
                  <StatBadge value={player.overall} size="sm" />
                </td>

                {/* Potential */}
                <td className="py-2.5 px-3 text-center">
                  <StatBadge value={player.potential} size="sm" />
                </td>

                {/* Form */}
                <td className="py-2.5 px-3 text-center font-bold font-mono text-[#00F5A0]">
                  {player.form}
                </td>

                {/* Morale */}
                <td className="py-2.5 px-3 text-center">
                  <MoraleIndicator value={player.morale} />
                </td>

                {/* Fitness */}
                <td className="py-2.5 px-3 text-center">
                  <FitnessIndicator value={player.fitness} isInjured={player.isInjured} compact={true} />
                </td>

                {/* Market Value */}
                <td className="py-2.5 px-3 text-right font-black italic text-white font-mono">
                  €{(player.marketValue / 1000000).toFixed(2)}M
                </td>

                {/* Wage */}
                <td className="py-2.5 px-4 text-right font-bold text-emerald-400 font-mono">
                  €{player.wage.toLocaleString('tr-TR')}/hf
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Player Detail Attribute Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          club={userClub}
          onClose={() => setSelectedPlayer(null)}
          onRenewContract={(player) => {
            setSelectedPlayer(null);
            setRenewingPlayer(player);
          }}
        />
      )}

      {/* Contract Renewal Negotiation Modal */}
      {renewingPlayer && (
        <NegotiationModal
          player={renewingPlayer}
          isContractRenewal={true}
          onClose={() => setRenewingPlayer(null)}
        />
      )}
    </div>
  );
}
