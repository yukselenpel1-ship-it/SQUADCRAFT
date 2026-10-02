'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PositionCategory } from '@/types/game';
import { TrainingIntensity } from '@/lib/career/types';
import { PlayerAvatar } from '@/components/ui/PlayerAvatar';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { StatBadge } from '@/components/ui/StatBadge';
import { FitnessIndicator } from '@/components/ui/FitnessIndicator';
import { MoraleIndicator } from '@/components/ui/MoraleIndicator';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { NegotiationModal } from '@/components/negotiation/NegotiationModal';
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
} from 'lucide-react';

type SortField = 'overall' | 'potential' | 'age' | 'form' | 'fitness' | 'morale' | 'marketValue' | 'wage' | 'lastName';
type SortOrder = 'asc' | 'desc';

export default function SquadPage() {
  const {
    userClub,
    userPlayers,
    finances,
    currentDate,
    trainingIntensity,
    setTrainingIntensity,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [activeSquadTab, setActiveSquadTab] = useState<'OVERVIEW' | 'CONTRACTS' | 'TRAINING' | 'INJURIES'>('OVERVIEW');
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

  const injuredCount = userPlayers.filter((p) => p.isInjured).length;
  const suspendedCount = userPlayers.filter((p) => p.isSuspended).length;
  const expiringContractsCount = userPlayers.filter((p) => (p.contractYearsLeft ?? 2) <= 1).length;

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#C7FF38] text-black text-[10px] font-black uppercase tracking-widest">
              {userClub.name}
            </span>
            <span className="text-xs text-zinc-400 font-mono">2026/27 A TAKIM KADRO LİSTESİ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#C7FF38]" />
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
            <span className="text-base font-black italic text-[#C7FF38]">
              {(userPlayers.reduce((acc, p) => acc + p.overall, 0) / (userPlayers.length || 1)).toFixed(1)}
            </span>
          </div>
          <div className="px-3 text-center border-l border-zinc-800">
            <span className="text-[9px] font-mono text-zinc-400 block font-bold uppercase">Haftalık Maaş</span>
            <span className="text-base font-black italic text-[#4FE4FF]">
              €{(userPlayers.reduce((acc, p) => acc + p.wage, 0) / 1000).toFixed(0)}K
            </span>
          </div>
        </div>
      </div>

      {/* Main Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSquadTab('OVERVIEW')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeSquadTab === 'OVERVIEW'
              ? 'bg-[#C7FF38] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Genel Kadro ({userPlayers.length})</span>
        </button>

        <button
          onClick={() => setActiveSquadTab('CONTRACTS')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 relative ${
            activeSquadTab === 'CONTRACTS'
              ? 'bg-[#C7FF38] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sözleşmeler & Maaşlar</span>
          {expiringContractsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black font-mono">
              {expiringContractsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSquadTab('TRAINING')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 ${
            activeSquadTab === 'TRAINING'
              ? 'bg-[#C7FF38] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Antrenman & Form ({trainingIntensity})</span>
        </button>

        <button
          onClick={() => setActiveSquadTab('INJURIES')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 relative ${
            activeSquadTab === 'INJURIES'
              ? 'bg-[#C7FF38] text-black border border-white'
              : 'bg-[#080D1A] text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Sakatlıklar & Cezalar</span>
          {injuredCount + suspendedCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black font-mono">
              {injuredCount + suspendedCount}
            </span>
          )}
        </button>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeSquadTab === 'OVERVIEW' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-[#070B12] p-1 border border-zinc-800">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-[#C7FF38] text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 font-mono ${
                    selectedCategory === cat.id ? 'bg-black text-[#C7FF38]' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Oyuncu ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-[#070B12] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C7FF38] transition-colors"
              />
            </div>
          </div>

          {/* Squad Table */}
          <div className="overflow-x-auto border border-zinc-850 bg-[#070B12]">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#05080E] text-[10px] font-mono font-black uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 px-3 w-12 text-center">NO</th>
                  <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('lastName')}>
                    <div className="flex items-center gap-1">
                      <span>OYUNCU</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">MEVKİ</th>
                  <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('age')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>YAŞ</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('overall')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>GENEL</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('potential')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>POT</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('form')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>FORM</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSort('fitness')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>KONDİSYON</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">MORAL</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('marketValue')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>PİYASA DEĞERİ</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('wage')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>MAAŞ</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
                {filteredAndSortedPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayer(player)}
                    className="hover:bg-zinc-850/60 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-500">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <PlayerPortrait
                          player={player}
                          size="sm"
                        />
                        <div>
                          <div className="font-bold text-white uppercase tracking-tight group-hover:text-[#C7FF38] transition-colors flex items-center gap-1.5">
                            <span>{player.firstName} {player.lastName}</span>
                            {player.isInjured && (
                              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono">
                                SAKAT
                              </span>
                            )}
                            {player.isSuspended && (
                              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono">
                                CEZALI
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            {player.nationality} • {player.preferredFoot} Ayak
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 font-mono text-[10px] font-black uppercase bg-zinc-900 border border-zinc-700 text-[#C7FF38]">
                        {player.position}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-zinc-300">
                      {player.age}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <StatBadge value={player.overall} size="sm" />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <StatBadge value={player.potential} size="sm" />
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono">
                      <span className={`font-bold ${player.form >= 7.5 ? 'text-[#C7FF38]' : player.form <= 6.0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {player.form.toFixed(1)}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <FitnessIndicator value={player.fitness} showText />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <MoraleIndicator value={player.morale} />
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      €{(player.marketValue / 1000000).toFixed(2)}M
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                      €{player.wage.toLocaleString('tr-TR')}/hf
                    </td>

                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedPlayer(player)}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 hover:border-[#C7FF38] text-white hover:text-[#C7FF38] font-mono text-[10px] uppercase font-bold transition-all"
                      >
                        İncele
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CONTRACTS & WAGES SUB-TAB */}
      {activeSquadTab === 'CONTRACTS' && (
        <div className="space-y-4">
          {/* Contracts Overview Banner */}
          <div className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Maaş Bütçesi Durumu</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-mono font-black text-white">
                  €{(finances.weeklyWages / 1000).toFixed(0)}K
                </span>
                <span className="text-xs text-zinc-500">/ €{(finances.wageBudget / 1000).toFixed(0)}K haftalık limit</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-amber-400">
                ⚠️ {expiringContractsCount} futbolcunun sözleşmesi 1 yıl veya daha az kaldı.
              </span>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="overflow-x-auto border border-zinc-850 bg-[#080D1A] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                  <th className="py-3 px-4">FUTBOLCU</th>
                  <th className="py-3 px-3 text-center">MEVKİ</th>
                  <th className="py-3 px-3 text-center">YAŞ</th>
                  <th className="py-3 px-3 text-center">OVR</th>
                  <th className="py-3 px-3 text-right">HAFTALIK MAAŞ</th>
                  <th className="py-3 px-3 text-center">KALAN SÜRE</th>
                  <th className="py-3 px-3 text-center">BİTİŞ TARİHİ</th>
                  <th className="py-3 px-3 text-center">DURUM</th>
                  <th className="py-3 px-4 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
                {userPlayers.map((player) => {
                  const yearsLeft = player.contractYearsLeft ?? 2;
                  const isExpiringSoon = yearsLeft <= 1;

                  return (
                    <tr key={player.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="py-3 px-4 font-bold text-white uppercase tracking-tight">
                        <div className="flex items-center gap-2.5">
                          <PlayerPortrait player={player} size="xs" />
                          <span>{player.firstName} {player.lastName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-zinc-900 border border-zinc-700 text-[#C7FF38]">
                          {player.position}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {player.age}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <StatBadge value={player.overall} size="sm" />
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[#C7FF38] font-bold">
                        €{player.wage.toLocaleString('tr-TR')}/hf
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {yearsLeft} Yıl
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-400">
                        {player.contractEnd || '2028-06-30'}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase border ${
                          isExpiringSoon
                            ? 'bg-rose-950/60 text-rose-300 border-rose-700/60'
                            : 'bg-emerald-950/40 text-[#C7FF38] border-emerald-800/40'
                        }`}>
                          {isExpiringSoon ? 'Sözleşme Bitiyor' : 'Güvenli'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setRenewingPlayer(player)}
                          className={`px-3 py-1.5 font-mono font-bold text-xs uppercase border transition-all ${
                            isExpiringSoon
                              ? 'bg-amber-500 text-black hover:bg-amber-400 border-amber-300'
                              : 'bg-[#C7FF38] text-black hover:bg-[#D9FF73] border-white'
                          }`}
                        >
                          Sözleşme Yenile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TRAINING & FORM SUB-TAB */}
      {activeSquadTab === 'TRAINING' && (
        <div className="space-y-4">
          {/* Training Intensity Controller */}
          <div className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">Haftalık Antrenman Yoğunluğu</span>
              <p className="text-xs text-zinc-300 mt-1">
                Yoğun antrenman gençlerin gelişimini hızlandırır fakat sakatlık riskini ve kondisyon harcamasını artırır.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['Hafif', 'Normal', 'Yoğun'] as TrainingIntensity[]).map((intensity) => (
                <button
                  key={intensity}
                  onClick={() => setTrainingIntensity(intensity)}
                  className={`px-4 py-2 font-mono text-xs font-bold uppercase border transition-all ${
                    trainingIntensity === intensity
                      ? 'bg-[#C7FF38] text-black border-white'
                      : 'bg-[#040810] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {intensity}
                </button>
              ))}
            </div>
          </div>

          {/* Form and Training Progress Table */}
          <div className="overflow-x-auto border border-zinc-850 bg-[#080D1A] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#040711] text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400">
                  <th className="py-3 px-4">FUTBOLCU</th>
                  <th className="py-3 px-3 text-center">MEVKİ</th>
                  <th className="py-3 px-3 text-center">KONDİSYON</th>
                  <th className="py-3 px-3 text-center">MAÇ KESKİNLİĞİ</th>
                  <th className="py-3 px-3 text-center">SON FORM</th>
                  <th className="py-3 px-3 text-center">MORAL</th>
                  <th className="py-3 px-3 text-center">GELİŞİM EĞRİSİ</th>
                  <th className="py-3 px-4 text-center">DURUM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-xs font-semibold">
                {userPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-white uppercase tracking-tight">
                      {player.firstName} {player.lastName}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-zinc-900 border border-zinc-700 text-[#C7FF38]">
                        {player.position}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <FitnessIndicator value={player.fitness} showText />
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className="font-bold text-[#4FE4FF]">%{player.matchSharpness ?? 85}</span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`font-bold ${player.form >= 7.5 ? 'text-[#C7FF38]' : player.form <= 6.0 ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {player.form.toFixed(1)} / 10
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <MoraleIndicator value={player.morale} />
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-zinc-300">
                      {player.hiddenAttributes?.developmentCurve === 'EARLY_PEAK'
                        ? 'Erken Zirve'
                        : player.hiddenAttributes?.developmentCurve === 'LATE_BLOOMER'
                        ? 'Geç Açılan'
                        : 'Dengeli Gelişim'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px]">
                      {player.isInjured ? (
                        <span className="text-rose-400">Tedavi Görüyor</span>
                      ) : player.fitness < 70 ? (
                        <span className="text-amber-400">Yorgun</span>
                      ) : (
                        <span className="text-[#C7FF38]">Tam Hazır</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. INJURIES & SUSPENSIONS SUB-TAB */}
      {activeSquadTab === 'INJURIES' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Revir (Injuries) */}
            <div className="p-4 bg-[#080D1A] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-white text-sm uppercase">Revir & Sakat Oyuncular ({injuredCount})</h3>
                </div>
              </div>

              {injuredCount === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  Revir boş. Takımda aktif sakatlığı bulunan oyuncu yok.
                </div>
              ) : (
                <div className="space-y-2">
                  {userPlayers.filter((p) => p.isInjured).map((p) => (
                    <div key={p.id} className="p-3 bg-rose-950/30 border border-rose-800/50 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase">{p.firstName} {p.lastName}</h4>
                        <span className="text-[11px] font-mono text-rose-300">
                          {p.injuryDetails?.type || 'Kas Zorlanması'}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-rose-900 text-rose-200 font-mono text-xs font-bold border border-rose-700">
                        {p.injuryDetails?.daysRemaining || 7} Gün Kaldı
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cezalılar (Suspensions) */}
            <div className="p-4 bg-[#080D1A] border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <h3 className="font-bold text-white text-sm uppercase">Cezalı Oyuncular ({suspendedCount})</h3>
                </div>
              </div>

              {suspendedCount === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-mono">
                  Takımda kart cezalısı oyuncu bulunmamaktadır.
                </div>
              ) : (
                <div className="space-y-2">
                  {userPlayers.filter((p) => p.isSuspended).map((p) => (
                    <div key={p.id} className="p-3 bg-amber-950/30 border border-amber-800/50 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase">{p.firstName} {p.lastName}</h4>
                        <span className="text-[11px] font-mono text-amber-300">
                          {p.suspensionDetails?.reason || 'Kırmızı Kart / Kart Limiti'}
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-amber-900 text-amber-200 font-mono text-xs font-bold border border-amber-700">
                        {p.suspensionDetails?.matchesRemaining || 1} Maç Ceza
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          club={userClub}
          onClose={() => setSelectedPlayer(null)}
          isShortlisted={false}
          onToggleShortlist={() => {}}
          onRenewContract={(p) => {
            setRenewingPlayer(p);
            setSelectedPlayer(null);
          }}
          onMakeBid={() => {
            setRenewingPlayer(selectedPlayer);
            setSelectedPlayer(null);
          }}
        />
      )}

      {/* Contract Renewal Modal */}
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
