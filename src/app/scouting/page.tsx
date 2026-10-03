'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PlayerPosition } from '@/types/game';
import { StatBadge } from '@/components/ui/StatBadge';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { AssignScoutModal } from '@/components/ui/AssignScoutModal';
import { SCOUTING_REGIONS } from '@/lib/scouting/regionalKnowledge';
import { ScoutingRegionId } from '@/lib/scouting/types';
import {
  Compass,
  Users,
  Search,
  FileText,
  Globe,
  Clock,
  UserPlus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  Sparkles,
  Shield,
  ChevronRight,
} from 'lucide-react';

export default function ScoutingPage() {
  const {
    scouts,
    freeAgentScouts,
    scoutingAssignments,
    scoutingReports,
    allPlayers,
    userClub,
    finances,
    cancelScoutAssignment,
    hireScout,
    fireScout,
    getMaskedPlayer,
    getClubById,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'scouts' | 'assignments' | 'search' | 'reports' | 'regions'>('dashboard');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [scoutModalPlayer, setScoutModalPlayer] = useState<Player | null>(null);

  // Search Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(40);

  // Filtered Players for Fog of War search (excluding user club players)
  const nonUserPlayers = allPlayers.filter((p) => p.clubId !== userClub.id);
  const filteredPlayers = nonUserPlayers.filter((p) => {
    const matchesName = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter || p.secondaryPositions.includes(positionFilter as PlayerPosition);
    const matchesAge = p.age <= maxAgeFilter;
    return matchesName && matchesPos && matchesAge;
  });

  const totalWeeklyScoutWages = scouts.reduce((acc, s) => acc + s.wage, 0);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#182338]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-widest bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30">
              // SCOUTING INTELLIGENCE NETWORK
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              SİS PERDESİ (FOG OF WAR) & OYUNCU İZLEME
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Compass className="w-7 h-7 text-[#00D4FF]" />
            Gözlem Departmanı
          </h1>
        </div>

        {/* Quick Dept Stats */}
        <div className="flex items-center gap-3 sc-panel rounded-2xl p-2.5 border border-[#182338] text-xs font-mono">
          <div className="px-3 text-center">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Gözlemciler</span>
            <span className="text-base font-black text-white">{scouts.length} / 6</span>
          </div>
          <div className="px-3 text-center border-l border-[#182338]">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Aktif Görev</span>
            <span className="text-base font-black text-[#00D4FF]">
              {scoutingAssignments.filter((a) => a.status === 'ACTIVE').length}
            </span>
          </div>
          <div className="px-3 text-center border-l border-[#182338]">
            <span className="text-[10px] text-zinc-500 uppercase block font-bold">Rapor Arşivi</span>
            <span className="text-base font-black text-[#00F5A0]">{scoutingReports.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#182338] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Gözlem Merkezi</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'search'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Oyuncu Arama (Sis Perdesi)</span>
        </button>

        <button
          onClick={() => setActiveTab('scouts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'scouts'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Gözlemci Ekibi ({scouts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'assignments'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aktif Görevler ({scoutingAssignments.filter((a) => a.status === 'ACTIVE').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'reports'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Raporlar ({scoutingReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('regions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all shrink-0 ${
            activeTab === 'regions'
              ? 'bg-[#00F5A0] text-[#040711] font-black shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              : 'sc-panel text-zinc-400 hover:text-white border border-[#182338]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Fikri Bölgeler</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sc-panel rounded-2xl border border-[#182338]">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Haftalık Scout Gideri</span>
              <span className="text-xl font-mono font-black text-[#00F5A0]">€{totalWeeklyScoutWages.toLocaleString('tr-TR')}/hf</span>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Maaş bütçesinden düşülür</span>
            </div>

            <div className="p-4 bg-[#080D1A] border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Müsait Gözlemciler</span>
              <span className="text-xl font-mono font-black text-[#00D4FF]">
                {scouts.filter((s) => !s.activeAssignmentId).length} / {scouts.length}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Hemen görevlendirilebilir</span>
            </div>

            <div className="p-4 bg-[#080D1A] border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Taranan Oyuncu Sayısı</span>
              <span className="text-xl font-mono font-black text-amber-400">
                {allPlayers.filter((p) => p.clubId !== userClub.id).length} Futbolcu
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Lig ve serbest havuz</span>
            </div>

            <div className="p-4 bg-[#080D1A] border border-zinc-800">
              <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-1">Önerilen Hedefler</span>
              <span className="text-xl font-mono font-black text-[#00F5A0]">
                {scoutingReports.filter((r) => r.recommendation.includes('Önerilir')).length} Oyuncu
              </span>
              <span className="text-[10px] font-mono text-zinc-500 block mt-1">Olumlu scout raporu</span>
            </div>
          </div>

          {/* Active Assignments & Recent Reports 2-Column */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Assignments Overview */}
            <div className="p-5 bg-[#080D1A] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00D4FF]" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300">Devam Eden Görevler</h3>
                </div>
                <button
                  onClick={() => setActiveTab('assignments')}
                  className="text-xs font-mono text-[#00D4FF] hover:underline"
                >
                  Tümünü Gör
                </button>
              </div>

              {scoutingAssignments.filter((a) => a.status === 'ACTIVE').length === 0 ? (
                <div className="p-8 text-center bg-[#040711] border border-zinc-850">
                  <Compass className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-mono text-zinc-400">Şu anda devam eden gözlem görevi yok.</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-3 px-3 py-1.5 text-xs font-mono font-bold bg-[#00F5A0] text-black uppercase border border-white"
                  >
                    Oyuncu Ara ve Gözlemci Ata
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {scoutingAssignments
                    .filter((a) => a.status === 'ACTIVE')
                    .map((assign) => (
                      <div
                        key={assign.id}
                        className="p-3 bg-[#040711] border border-zinc-850 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">
                              {assign.targetPlayerName || 'Bölge Taraması'}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
                              {assign.scoutName}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                            Kalan: <strong className="text-white">{assign.daysRemaining} gün</strong> ({assign.durationDays} günlük görev)
                          </span>
                        </div>
                        <button
                          onClick={() => cancelScoutAssignment(assign.id)}
                          className="text-[11px] font-mono text-rose-400 hover:text-rose-300 font-bold px-2 py-1 bg-rose-500/10 border border-rose-500/30"
                        >
                          İptal
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Recent Reports Overview */}
            <div className="p-5 bg-[#080D1A] border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#00F5A0]" />
                  <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300">Son Gözlem Raporları</h3>
                </div>
                <button
                  onClick={() => setActiveTab('reports')}
                  className="text-xs font-mono text-[#00F5A0] hover:underline"
                >
                  Tümünü Gör
                </button>
              </div>

              {scoutingReports.length === 0 ? (
                <div className="p-8 text-center bg-[#040711] border border-zinc-850">
                  <FileText className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs font-mono text-zinc-400">Henüz tamamlanmış bir gözlem raporu bulunmuyor.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scoutingReports.slice(0, 4).map((rep) => {
                    const targetP = allPlayers.find((p) => p.id === rep.playerId);
                    return (
                      <div
                        key={rep.id}
                        onClick={() => targetP && setSelectedPlayer(targetP)}
                        className="p-3 bg-[#040711] border border-zinc-850 hover:border-zinc-700 cursor-pointer transition-all flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase">{rep.playerName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#00F5A0]/20 text-[#00F5A0] font-black border border-[#00F5A0]/30">
                              {rep.bestPosition}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">({rep.date})</span>
                          </div>
                          <p className="text-[11px] font-mono text-zinc-400 mt-1 line-clamp-1">
                            Öneri: <strong className="text-zinc-200">{rep.recommendation}</strong> • Güven: %{rep.confidence}
                          </p>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-xs font-black text-[#00F5A0] block">
                            {rep.estimatedOverallMin}-{rep.estimatedOverallMax} GEN
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASKED PLAYER SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 bg-[#080D1A] border border-zinc-800 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Futbolcu adı ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#040711] border border-zinc-800 pl-9 pr-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00F5A0]"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="bg-[#040711] border border-zinc-800 px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-[#00F5A0]"
              >
                <option value="ALL">Tüm Mevkiler</option>
                <option value="GK">GK (Kaleci)</option>
                <option value="CB">CB (Stoper)</option>
                <option value="LB">LB (Sol Bek)</option>
                <option value="RB">RB (Sağ Bek)</option>
                <option value="DM">DM (Ön Libero)</option>
                <option value="CM">CM (Merkez Orta Saha)</option>
                <option value="LM">LM (Sol Kanat)</option>
                <option value="RM">RM (Sağ Kanat)</option>
                <option value="AM">AM (Ofansif Orta Saha)</option>
                <option value="LW">LW (Sol Açık)</option>
                <option value="RW">RW (Sağ Açık)</option>
                <option value="ST">ST (Santrafor)</option>
              </select>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">Maks Yaş: {maxAgeFilter}</span>
                <input
                  type="range"
                  min="16"
                  max="40"
                  value={maxAgeFilter}
                  onChange={(e) => setMaxAgeFilter(Number(e.target.value))}
                  className="w-24 accent-[#00F5A0]"
                />
              </div>
            </div>
          </div>

          {/* Players Table */}
          <div className="border border-zinc-850 bg-[#080D1A] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#040711] text-zinc-400 uppercase font-mono font-black text-[10px] tracking-widest border-b border-zinc-800">
                    <th className="p-3">FUTBOLCU</th>
                    <th className="p-3">KULÜP</th>
                    <th className="p-3 text-center">MEVKİ</th>
                    <th className="p-3 text-center">YAŞ</th>
                    <th className="p-3">BİLGİ DÜZEYİ</th>
                    <th className="p-3 text-center">GENEL</th>
                    <th className="p-3 text-center">POTANSİYEL</th>
                    <th className="p-3">PİYASA DEĞERİ</th>
                    <th className="p-3 text-right">İŞLEMLER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850 text-zinc-200">
                  {filteredPlayers.map((player) => {
                    const masked = getMaskedPlayer(player);
                    const club = getClubById(player.clubId);

                    return (
                      <tr
                        key={player.id}
                        className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <PlayerPortrait player={player} size="sm" />
                            <div>
                              <span className="font-bold text-white block uppercase">
                                {player.firstName} {player.lastName}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">{player.nationality}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-zinc-300 font-mono text-[11px]">
                          {club ? club.name : 'Serbest'}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-zinc-900 border border-zinc-700 text-[#00F5A0]">
                            {player.position}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-zinc-300">{player.age}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 font-mono">
                            <div className="w-16 bg-zinc-900 h-1.5 overflow-hidden border border-zinc-700">
                              <div
                                className="h-full bg-[#00F5A0]"
                                style={{ width: `${masked.knowledgePercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-400">%{masked.knowledgePercentage}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <StatBadge value={masked.overallDisplay} size="sm" />
                        </td>
                        <td className="p-3 text-center">
                          <StatBadge value={masked.potentialDisplay} size="sm" />
                        </td>
                        <td className="p-3 text-zinc-300 font-mono">{masked.marketValueDisplay}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setScoutModalPlayer(player)}
                            className="px-2.5 py-1 text-xs font-mono font-bold uppercase bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30 hover:bg-[#00D4FF]/20 transition-all flex items-center gap-1 ml-auto"
                          >
                            <Compass className="w-3.5 h-3.5" />
                            Gözlemci Ata
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCOUT STAFF */}
      {activeTab === 'scouts' && (
        <div className="space-y-6">
          {/* User Club Scouts */}
          <div>
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00F5A0]" />
              Kulüp Gözlemci Ekibi ({scouts.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scouts.map((scout) => {
                const isBusy = Boolean(scout.activeAssignmentId);
                const activeAssign = scoutingAssignments.find((a) => a.id === scout.activeAssignmentId);

                return (
                  <div key={scout.id} className="p-4 bg-[#080D1A] border border-zinc-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase">
                          {scout.firstName} {scout.lastName}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {scout.nationality} • {scout.age} YAŞ • €{scout.wage.toLocaleString('tr-TR')}/hf
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 font-bold uppercase border ${
                          isBusy
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-[#00F5A0] border-emerald-500/30'
                        }`}
                      >
                        {isBusy ? 'Görevde' : 'Müsait'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Mevcut Yetenek</span>
                        <StatBadge value={scout.judgingAbility} size="sm" />
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Potansiyel</span>
                        <StatBadge value={scout.judgingPotential} size="sm" />
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Taktik Bilgisi</span>
                        <StatBadge value={scout.tacticalKnowledge} size="sm" />
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] font-mono uppercase">Uyum</span>
                        <StatBadge value={scout.adaptability} size="sm" />
                      </div>
                    </div>

                    {isBusy && activeAssign && (
                      <div className="p-2.5 bg-[#040711] border border-zinc-800 text-[11px] font-mono text-zinc-300">
                        <strong>HEDEF:</strong> {activeAssign.targetPlayerName || 'Bölgesel Tarama'}
                        <span className="block text-[10px] text-zinc-500 mt-0.5">
                          Kalan: {activeAssign.daysRemaining} gün
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-zinc-800 flex justify-end">
                      <button
                        onClick={() => fireScout(scout.id)}
                        className="text-xs font-mono text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Görevine Son Ver
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free Agent Scouts Market */}
          <div className="pt-6 border-t border-zinc-800">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#00D4FF]" />
              Serbest Gözlemci Pazarı (Transfer Edilebilir)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeAgentScouts.map((faScout) => (
                <div key={faScout.id} className="p-4 bg-[#080D1A] border border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">
                        {faScout.firstName} {faScout.lastName}
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400">
                        {faScout.nationality} • {faScout.age} YAŞ • €{faScout.wage.toLocaleString('tr-TR')}/hf
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 font-bold uppercase bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30">
                      Serbest
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase">Mevcut Yetenek</span>
                      <StatBadge value={faScout.judgingAbility} size="sm" />
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase">Potansiyel</span>
                      <StatBadge value={faScout.judgingPotential} size="sm" />
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase">Taktik Bilgisi</span>
                      <StatBadge value={faScout.tacticalKnowledge} size="sm" />
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-mono uppercase">Uyum</span>
                      <StatBadge value={faScout.adaptability} size="sm" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-end">
                    <button
                      onClick={() => hireScout(faScout.id)}
                      className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#00F5A0] text-black hover:bg-[#00D68B] transition-all flex items-center gap-1.5 border border-white"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      İşe Al (€{faScout.wage.toLocaleString('tr-TR')}/hf)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00D4FF]" />
            Tüm Aktif ve Geçmiş Görevler
          </h3>

          <div className="border border-zinc-850 bg-[#080D1A] overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#040711] text-zinc-400 uppercase font-mono font-black text-[10px] tracking-widest border-b border-zinc-800">
                  <th className="p-3">GÖZLEMCİ</th>
                  <th className="p-3">HEDEF</th>
                  <th className="p-3">BAŞLANGIÇ</th>
                  <th className="p-3">SÜRE</th>
                  <th className="p-3">KALAN GÜN</th>
                  <th className="p-3">DURUM</th>
                  <th className="p-3 text-right">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-200">
                {scoutingAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400 font-mono">
                      Henüz atanmış bir gözlem görevi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  scoutingAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3 font-bold text-white uppercase">{a.scoutName}</td>
                      <td className="p-3 text-zinc-300 font-mono">{a.targetPlayerName || 'Bölgesel Tarama'}</td>
                      <td className="p-3 text-zinc-400 font-mono">{a.startDate}</td>
                      <td className="p-3 text-zinc-300 font-mono">{a.durationDays} Gün</td>
                      <td className="p-3 font-mono font-bold text-[#00D4FF]">
                        {a.status === 'ACTIVE' ? `${a.daysRemaining} Gün` : '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 font-mono text-[10px] font-bold uppercase border ${
                            a.status === 'ACTIVE'
                              ? 'bg-sky-500/20 text-[#00D4FF] border-sky-500/30'
                              : a.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-[#00F5A0] border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {a.status === 'ACTIVE' ? 'Sürüyor' : a.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal Edildi'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => cancelScoutAssignment(a.id)}
                            className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-mono font-bold uppercase"
                          >
                            İptal Et
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#00F5A0]" />
            Gözlemci Raporları Arşivi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoutingReports.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-[#080D1A] border border-zinc-800">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-mono text-xs">Arşivde henüz bir gözlemci raporu bulunmamaktadır.</p>
              </div>
            ) : (
              scoutingReports.map((rep) => {
                const targetP = allPlayers.find((p) => p.id === rep.playerId);
                return (
                  <div
                    key={rep.id}
                    onClick={() => targetP && setSelectedPlayer(targetP)}
                    className="p-4 bg-[#080D1A] border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white uppercase">{rep.playerName}</h4>
                          <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">
                            {rep.bestPosition}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 mt-0.5 block">
                          Gözlemci: {rep.scoutName} • {rep.date}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[#00D4FF]/20 text-[#00D4FF] border border-[#00D4FF]/30 uppercase">
                        {rep.recommendation}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#040711] border border-zinc-800 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Tahmini Yetenek</span>
                        <strong className="text-white">{rep.estimatedOverallMin} – {rep.estimatedOverallMax}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Potansiyel</span>
                        <strong className="text-[#00F5A0]">{rep.estimatedPotentialMin} – {rep.estimatedPotentialMax}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Bonservis</span>
                        <span className="text-zinc-300">
                          €{(rep.estimatedTransferFeeMin / 1_000_000).toFixed(1)}M – €{(rep.estimatedTransferFeeMax / 1_000_000).toFixed(1)}M
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Güven Oranı</span>
                        <span className="text-[#00D4FF] font-bold">%{rep.confidence}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 italic">{rep.summaryNotes}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 6: FICTIONAL REGIONS */}
      {activeTab === 'regions' && (
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#00D4FF]" />
            SquadCraft Fikri Futbol Havzaları & Bölgeleri
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCOUTING_REGIONS.map((region: any) => (
              <div key={region.id} className="p-4 bg-[#080D1A] border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase">{region.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#00F5A0]/20 text-[#00F5A0] font-bold border border-[#00F5A0]/30">
                    Yoğunluk: %{region.talentDensity}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">{region.descriptionTurkish}</p>
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[10px] uppercase font-mono font-bold text-zinc-500 block mb-1">
                    Öne Çıkan Nitelikler:
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono">
                    {region.prominentAttributes.map((attr: string) => (
                      <span
                        key={attr}
                        className="px-1.5 py-0.5 text-[10px] bg-zinc-900 text-zinc-300 border border-zinc-700 font-bold"
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          club={getClubById(selectedPlayer.clubId)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {scoutModalPlayer && (
        <AssignScoutModal
          player={scoutModalPlayer}
          onClose={() => setScoutModalPlayer(null)}
        />
      )}
    </div>
  );
}
