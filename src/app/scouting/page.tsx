'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PlayerPosition } from '@/types/game';
import { StatBadge } from '@/components/ui/StatBadge';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { AssignScoutModal } from '@/components/ui/AssignScoutModal';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
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
  TrendingUp,
  Award,
  Zap,
  Target,
  UserCheck,
  X,
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

  const [activeTab, setActiveTab] = useState<'network' | 'search' | 'scouts' | 'assignments' | 'reports'>('network');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [scoutModalPlayer, setScoutModalPlayer] = useState<Player | null>(null);

  // Search Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [maxAgeFilter, setMaxAgeFilter] = useState<number>(40);
  const [minKnowledge, setMinKnowledge] = useState<number>(0);

  // Filtered Players for Fog of War search (excluding user club players)
  const nonUserPlayers = allPlayers.filter((p) => p.clubId !== userClub.id);
  const filteredPlayers = nonUserPlayers.filter((p) => {
    const matchesName = `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPos = positionFilter === 'ALL' || p.position === positionFilter || p.secondaryPositions.includes(positionFilter as PlayerPosition);
    const matchesAge = p.age <= maxAgeFilter;
    const masked = getMaskedPlayer(p);
    const matchesKnowledge = masked.knowledgePercentage >= minKnowledge;
    return matchesName && matchesPos && matchesAge && matchesKnowledge;
  });

  const totalWeeklyScoutWages = scouts.reduce((acc, s) => acc + s.wage, 0);
  const activeAssignmentsCount = scoutingAssignments.filter((a) => a.status === 'ACTIVE').length;
  const overallCoveragePercent = Math.min(100, Math.round((scouts.length / 6) * 75 + (activeAssignmentsCount * 5)));

  // Recommendation Grade Helper
  const getScoutRecommendation = (player: Player) => {
    const score = player.overall * 0.5 + player.potential * 0.5;
    if (score >= 82) return { grade: 'A+', text: 'Öncelikli Hedef', color: 'text-[#b8ff3d] bg-[#b8ff3d]/15 border-[#b8ff3d]/40' };
    if (score >= 77) return { grade: 'A', text: 'Tavsiye Edilir', color: 'text-[#21dfbd] bg-[#21dfbd]/15 border-[#21dfbd]/40' };
    if (score >= 72) return { grade: 'B', text: 'Takip Edilmeli', color: 'text-[#4FE4FF] bg-[#4FE4FF]/15 border-[#4FE4FF]/40' };
    if (score >= 67) return { grade: 'C', text: 'Alternatif', color: 'text-[#ffd34f] bg-[#ffd34f]/15 border-[#ffd34f]/40' };
    return { grade: 'D', text: 'Yetersiz', color: 'text-zinc-400 bg-zinc-800 border-white/10' };
  };

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="GÖZLEM AĞI YÜKLENİYOR"
        message="Küresel scout ağı, oyuncu raporları ve havza analizleri yükleniyor..."
      />
    );
  }

  return (
    <div className="space-y-6 pb-28 lg:pb-12 animate-in fade-in duration-300">
      {/* 1. BROADCAST SCOUTING HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-white/10 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#21dfbd]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-[#b8ff3d]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#21dfbd]/15 text-[#21dfbd] border border-[#21dfbd]/30">
                // GLOBAL SCOUT NETWORK & INTELLIGENCE
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#ffd34f]/15 text-[#ffd34f] border border-[#ffd34f]/30">
                SİS PERDESİ (FOG OF WAR) AKTİF
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#21dfbd]/10 border border-[#21dfbd]/20 flex items-center justify-center text-[#21dfbd]">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sport">
                  GÖZLEM DEPARTMANI
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  {userClub.name.toUpperCase()} • KÜRESEL YETENEK İSTİHBARATI & HAVZA ANALİZİ
                </p>
              </div>
            </div>
          </div>

          {/* Right Scouting Telemetry */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {/* Global Coverage */}
            <div className="bg-[#050706]/80 rounded-xl border border-white/10 p-3 min-w-[130px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">AĞ KAPSAMA</span>
                <Globe className="w-3.5 h-3.5 text-[#21dfbd]" />
              </div>
              <div className="text-xl font-black text-[#21dfbd] font-mono">
                %{overallCoveragePercent}
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-[#21dfbd]" style={{ width: `${overallCoveragePercent}%` }} />
              </div>
            </div>

            {/* Active Assignments */}
            <div className="bg-[#050706]/80 rounded-xl border border-white/10 p-3 min-w-[130px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">AKTİF GÖREV</span>
                <Clock className="w-3.5 h-3.5 text-[#4FE4FF]" />
              </div>
              <div className="text-xl font-black text-[#4FE4FF] font-mono">
                {activeAssignmentsCount} <span className="text-xs text-zinc-500 font-normal">/ {scouts.length}</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {scouts.length - activeAssignmentsCount} gözlemci müsait
              </div>
            </div>

            {/* Scout Budget */}
            <div className="bg-[#050706]/80 rounded-xl border border-white/10 p-3 min-w-[130px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">HAFTALIK GİDER</span>
                <Award className="w-3.5 h-3.5 text-[#b8ff3d]" />
              </div>
              <div className="text-xl font-black text-[#b8ff3d] font-mono">
                €{(totalWeeklyScoutWages / 1000).toFixed(0)}K
                <span className="text-xs text-zinc-500 font-normal">/hf</span>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {scoutingReports.length} rapor arşivde
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('network')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'network'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>AĞ HARİTASI & BÖLGELER</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'search'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>OYUNCU HAVUZU (SİS PERDESİ)</span>
        </button>

        <button
          onClick={() => setActiveTab('scouts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'scouts'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>GÖZLEMCİ KADROSU ({scouts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'assignments'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>GÖREVLER ({activeAssignmentsCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'reports'
              ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_15px_rgba(184,255,61,0.3)]'
              : 'bg-[#090d0a] text-zinc-400 hover:text-white border border-white/10 hover:border-white/20'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>RAPOR ARŞİVİ ({scoutingReports.length})</span>
        </button>
      </div>

      {/* TAB 1: NETWORK INTELLIGENCE MAP / REGIONAL NODES */}
      {activeTab === 'network' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight font-sport">
                BÖLGESEL İSTİHBARAT AĞI
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Her coğrafi bölgenin yetenek yoğunluğu, futbol ekolü ve aktif gözlemci ataması
              </p>
            </div>
            <button
              onClick={() => setActiveTab('search')}
              className="px-4 py-2 rounded-xl bg-[#b8ff3d] hover:bg-[#a6ec31] text-[#050806] font-mono font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(184,255,61,0.3)]"
            >
              <Search className="w-4 h-4" />
              Oyuncu Tara
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCOUTING_REGIONS.map((region: any, idx: number) => {
              // Find if any scout is currently assigned here
              const assignedScout = scouts[idx % scouts.length];
              const priorityTier = idx < 2 ? 'ÖNCELİK 1' : idx < 4 ? 'ÖNCELİK 2' : 'ÖNCELİK 3';

              return (
                <div
                  key={region.id}
                  className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">
                        COĞRAFİ HAVZA #{idx + 1}
                      </span>
                      <h3 className="text-base font-black text-white uppercase font-sport mt-0.5">
                        {region.name}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                        idx < 2
                          ? 'bg-[#b8ff3d]/15 text-[#b8ff3d] border-[#b8ff3d]/30'
                          : idx < 4
                          ? 'bg-[#21dfbd]/15 text-[#21dfbd] border-[#21dfbd]/30'
                          : 'bg-zinc-800 text-zinc-400 border-white/10'
                      }`}
                    >
                      {priorityTier}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-mono line-clamp-2">
                    {region.descriptionTurkish}
                  </p>

                  {/* Coverage & Talent Density Gauge */}
                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">YETENEK YOĞUNLUĞU</span>
                      <span className="font-bold text-[#21dfbd]">%{region.talentDensity}</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#21dfbd] to-[#b8ff3d]"
                        style={{ width: `${region.talentDensity}%` }}
                      />
                    </div>
                  </div>

                  {/* Assigned Scout Node */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#050706] border border-white/10 flex items-center justify-center text-[#21dfbd]">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">BÖLGE SORUMLUSU</span>
                        <span className="font-bold text-white">
                          {assignedScout ? `${assignedScout.firstName} ${assignedScout.lastName}` : 'ATANMAMIŞ'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab('search')}
                      className="px-3 py-1 bg-[#050706] hover:bg-zinc-900 border border-white/10 rounded-lg text-zinc-300 hover:text-white text-[11px] font-bold uppercase transition-all"
                    >
                      Tara
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FOG OF WAR SEARCH TABLE */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-4 space-y-3 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Futbolcu adı ile ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#b8ff3d] font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b8ff3d] font-mono"
                >
                  <option value="ALL">Tüm Mevkiler</option>
                  <option value="GK">Kaleci (GK)</option>
                  <option value="DC">Stoper (DC)</option>
                  <option value="DR">Sağ Bek (DR)</option>
                  <option value="DL">Sol Bek (DL)</option>
                  <option value="DMC">Ön Libero (DMC)</option>
                  <option value="MC">Merkez Orta Saha (MC)</option>
                  <option value="AMC">Ofansif Orta Saha (AMC)</option>
                  <option value="MR">Sağ Kanat (MR)</option>
                  <option value="ML">Sol Kanat (ML)</option>
                  <option value="ST">Santrfor (ST)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#050706] rounded-xl border border-white/10 text-xs font-mono">
                  <span className="text-zinc-500 text-[10px]">Yaş ≤</span>
                  <span className="font-bold text-white">{maxAgeFilter}</span>
                  <input
                    type="range"
                    min="16"
                    max="40"
                    value={maxAgeFilter}
                    onChange={(e) => setMaxAgeFilter(Number(e.target.value))}
                    className="w-full accent-[#b8ff3d]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={minKnowledge}
                  onChange={(e) => setMinKnowledge(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs text-white focus:outline-none focus:border-[#b8ff3d] font-mono"
                >
                  <option value="0">Bilgi: Tümü</option>
                  <option value="50">%50+ Raporlu</option>
                  <option value="80">%80+ Net Bilgi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fog of War Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">OYUNCU</th>
                  <th className="py-3 px-3">KULÜBÜ</th>
                  <th className="py-3 px-2 text-center">MEVKİ</th>
                  <th className="py-3 px-2 text-center">YAŞ</th>
                  <th className="py-3 px-3 text-center">SİS DERECESİ</th>
                  <th className="py-3 px-3 text-center">OVR TAHMİNİ</th>
                  <th className="py-3 px-3 text-center">POTANSİYEL</th>
                  <th className="py-3 px-3 text-right">PİYASA DEĞERİ</th>
                  <th className="py-3 px-3 text-center">TAVSİYE</th>
                  <th className="py-3 px-4 text-center">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-medium">
                {filteredPlayers.slice(0, 35).map((player) => {
                  const masked = getMaskedPlayer(player);
                  const club = getClubById(player.clubId);
                  const rec = getScoutRecommendation(player);

                  return (
                    <tr
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className="hover:bg-[#0d130f] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <PlayerPortrait player={player} size="sm" />
                          <div>
                            <span className="font-bold text-white uppercase block hover:text-[#b8ff3d] transition-colors">
                              {player.firstName} {player.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">{player.nationality}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-zinc-300 text-xs">
                        {club ? club.name : 'Serbest'}
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#050706] border border-white/10 text-[#b8ff3d] rounded">
                          {player.position}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-center font-mono text-zinc-300">{player.age}</td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2 font-mono text-[10px]">
                          <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#21dfbd]"
                              style={{ width: `${masked.knowledgePercentage}%` }}
                            />
                          </div>
                          <span className="text-[#21dfbd] font-bold">%{masked.knowledgePercentage}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#050706] border border-white/10 font-bold text-white">
                          {masked.overallDisplay}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#050706] border border-white/10 font-bold text-[#4FE4FF]">
                          {masked.potentialDisplay}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {masked.marketValueDisplay}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${rec.color}`}>
                          {rec.grade}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setScoutModalPlayer(player)}
                          className="px-3 py-1 bg-[#21dfbd] hover:bg-[#1bc4a5] text-[#050806] font-mono font-black text-xs uppercase rounded-lg transition-all flex items-center gap-1 mx-auto"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          Gözlemci Gönder
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

      {/* TAB 3: SCOUT STAFF MANAGEMENT */}
      {activeTab === 'scouts' && (
        <div className="space-y-6">
          {/* Active Club Scouts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-sport flex items-center gap-2">
                <Users className="w-4 h-4 text-[#b8ff3d]" />
                KULÜP GÖZLEMCİ EKİBİ ({scouts.length} / 6 KONTENJAN)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scouts.map((scout) => {
                const isBusy = Boolean(scout.activeAssignmentId);
                const activeAssign = scoutingAssignments.find((a) => a.id === scout.activeAssignmentId);

                return (
                  <div key={scout.id} className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-white uppercase font-sport">
                          {scout.firstName} {scout.lastName}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {scout.nationality} • {scout.age} YAŞ • €{scout.wage.toLocaleString('tr-TR')}/hf
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                          isBusy
                            ? 'bg-[#ffd34f]/20 text-[#ffd34f] border-[#ffd34f]/30'
                            : 'bg-[#b8ff3d]/20 text-[#b8ff3d] border-[#b8ff3d]/30'
                        }`}
                      >
                        {isBusy ? 'GÖREVDE' : 'MÜSAİT'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-[#050706] rounded-xl border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Yetenek Sezisi</span>
                        <strong className="text-white font-bold">{scout.judgingAbility} / 20</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Potansiyel Sezisi</span>
                        <strong className="text-[#b8ff3d] font-bold">{scout.judgingPotential} / 20</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Taktik Bilgisi</span>
                        <strong className="text-[#4FE4FF] font-bold">{scout.tacticalKnowledge} / 20</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Uyum Becerisi</span>
                        <strong className="text-zinc-300 font-bold">{scout.adaptability} / 20</strong>
                      </div>
                    </div>

                    {isBusy && activeAssign && (
                      <div className="p-3 bg-[#050706] rounded-xl border border-white/10 text-xs font-mono text-zinc-300">
                        <span className="text-[10px] text-zinc-500 block uppercase">AKTİF GÖREV</span>
                        <strong className="text-white block mt-0.5">{activeAssign.targetPlayerName || 'Bölgesel Tarama'}</strong>
                        <span className="text-[10px] text-[#4FE4FF] block mt-0.5">Kalan: {activeAssign.daysRemaining} Gün</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      <button
                        onClick={() => fireScout(scout.id)}
                        className="text-xs font-mono text-[#ff5365] hover:text-[#ff384e] font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Sözleşmeyi Feshet
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Free Agent Scouts to Hire */}
          {freeAgentScouts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-white/10">
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-sport flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#21dfbd]" />
                SERBEST GÖZLEMCİ HAVUZU (İŞE ALINABİLİR)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeAgentScouts.map((scout) => (
                  <div key={scout.id} className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-white uppercase font-sport">
                          {scout.firstName} {scout.lastName}
                        </h4>
                        <span className="text-[11px] font-mono text-zinc-400">
                          {scout.nationality} • €{scout.wage.toLocaleString('tr-TR')}/hf
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase bg-[#21dfbd]/15 text-[#21dfbd] border border-[#21dfbd]/30">
                        BOŞTA
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-[#050706] rounded-xl border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px]">YETENEK</span>
                        <strong className="text-white">{scout.judgingAbility} / 20</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px]">POTANSİYEL</span>
                        <strong className="text-[#b8ff3d]">{scout.judgingPotential} / 20</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => hireScout(scout.id)}
                      disabled={scouts.length >= 6}
                      className="w-full py-2 bg-[#21dfbd] hover:bg-[#1bc4a5] disabled:opacity-40 text-[#050806] font-mono font-black text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      Ekibe Kat (€{scout.wage.toLocaleString('tr-TR')}/hf)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACTIVE ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-sport flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4FE4FF]" />
              DEVAM EDEN VE TAMAMLANMIŞ GÖREVLER
            </h3>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#090d0a] shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 bg-[#050706] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">GÖZLEMCİ</th>
                  <th className="py-3 px-3">HEDEF / BÖLGE</th>
                  <th className="py-3 px-3">BAŞLANGIÇ</th>
                  <th className="py-3 px-3">SÜRE</th>
                  <th className="py-3 px-3">KALAN GÜN</th>
                  <th className="py-3 px-3">DURUM</th>
                  <th className="py-3 px-4 text-right">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-medium">
                {scoutingAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                      Şu an kayıtlı bir görev bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  scoutingAssignments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#0d130f]">
                      <td className="py-3 px-4 font-bold text-white uppercase">{a.scoutName}</td>
                      <td className="py-3 px-3 font-mono text-zinc-300">{a.targetPlayerName || 'Bölgesel Tarama'}</td>
                      <td className="py-3 px-3 font-mono text-zinc-500">{a.startDate}</td>
                      <td className="py-3 px-3 font-mono text-zinc-400">{a.durationDays} Gün</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#4FE4FF]">
                        {a.status === 'ACTIVE' ? `${a.daysRemaining} Gün` : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${
                            a.status === 'ACTIVE'
                              ? 'bg-[#4FE4FF]/15 text-[#4FE4FF] border-[#4FE4FF]/30'
                              : a.status === 'COMPLETED'
                              ? 'bg-[#b8ff3d]/15 text-[#b8ff3d] border-[#b8ff3d]/30'
                              : 'bg-[#ff5365]/15 text-[#ff5365] border-[#ff5365]/30'
                          }`}
                        >
                          {a.status === 'ACTIVE' ? 'Sürüyor' : a.status === 'COMPLETED' ? 'Tamamlandı' : 'İptal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {a.status === 'ACTIVE' && (
                          <button
                            onClick={() => cancelScoutAssignment(a.id)}
                            className="px-2.5 py-1 bg-[#ff5365]/10 border border-[#ff5365]/30 text-[#ff5365] hover:bg-[#ff5365]/20 text-xs font-mono font-bold uppercase rounded-lg"
                          >
                            İptal
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

      {/* TAB 5: REPORTS ARCHIVE */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-white font-sport flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#b8ff3d]" />
              GÖZLEMCİ RAPORLARI DOSYASI ({scoutingReports.length} RAPOR)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoutingReports.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-[#090d0a] rounded-2xl border border-white/10 text-zinc-400 font-mono text-xs">
                Arşivde henüz tamamlanmış bir gözlemci raporu bulunmamaktadır.
              </div>
            ) : (
              scoutingReports.map((rep) => {
                const targetP = allPlayers.find((p) => p.id === rep.playerId);
                return (
                  <div
                    key={rep.id}
                    onClick={() => targetP && setSelectedPlayer(targetP)}
                    className="p-5 bg-[#090d0a] rounded-2xl border border-white/10 hover:border-white/20 transition-all cursor-pointer space-y-3 shadow-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white uppercase font-sport">{rep.playerName}</h4>
                          <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30 rounded">
                            {rep.bestPosition}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 block mt-0.5">
                          Gözlemci: {rep.scoutName} • {rep.date}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#4FE4FF]/15 text-[#4FE4FF] border border-[#4FE4FF]/30 uppercase">
                        {rep.recommendation}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 bg-[#050706] rounded-xl border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Tahmini Seviye</span>
                        <strong className="text-white">{rep.estimatedOverallMin} – {rep.estimatedOverallMax} GEN</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Potansiyel Bandı</span>
                        <strong className="text-[#b8ff3d]">{rep.estimatedPotentialMin} – {rep.estimatedPotentialMax} POT</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Bonservis</span>
                        <span className="text-zinc-300">
                          €{(rep.estimatedTransferFeeMin / 1_000_000).toFixed(1)}M – €{(rep.estimatedTransferFeeMax / 1_000_000).toFixed(1)}M
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[10px] uppercase">Güven Oranı</span>
                        <span className="text-[#4FE4FF] font-bold">%{rep.confidence}</span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 font-mono italic">{rep.summaryNotes}</p>
                  </div>
                );
              })
            )}
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
