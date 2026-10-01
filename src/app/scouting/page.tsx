'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { Player, PlayerPosition } from '@/types/game';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { StatCard } from '@/components/ui/StatCard';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { AssignScoutModal } from '@/components/ui/AssignScoutModal';
import {
  Compass,
  Users,
  Search,
  FileText,
  Globe,
  Clock,
  UserPlus,
  Star,
  CheckCircle2,
  TrendingUp,
  Shield,
  Activity,
  Award,
  Sparkles,
  PieChart,
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
    isCareerHydrated,
    isInitialized,
    seasonYear,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [scoutModalPlayer, setScoutModalPlayer] = useState<Player | null>(null);

  // Wonderkids (Age <= 20, Potential >= 80)
  const wonderkids = useMemo(() => {
    return allPlayers
      .filter((p) => p.age <= 20 && p.potential >= 80)
      .sort((a, b) => b.potential - a.potential)
      .slice(0, 5);
  }, [allPlayers]);

  // Academy Prospects (Age <= 18)
  const academyProspects = useMemo(() => {
    return allPlayers
      .filter((p) => p.age <= 18 && p.clubId === userClub.id)
      .slice(0, 5);
  }, [allPlayers, userClub.id]);

  // Watched players
  const watchedPlayers = useMemo(() => {
    return allPlayers.filter((p) => p.clubId !== userClub.id && p.overall >= 78).slice(0, 5);
  }, [allPlayers, userClub.id]);

  const activeScoutsCount = scouts.length;
  const activeAssignmentsCount = scoutingAssignments.length;

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Gözlem ağı verileri yükleniyor...</span>
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
        tagline="Küresel Yetenek Avı ve Oyuncu Gözlem Masası"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* 2. TOP KPI CARDS (5 METRICS AS IN REFERENCE) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <StatCard
          label="Scout Bütçesi"
          value="€3.2M"
          change="+18%"
          changeType="positive"
          subtext="Sezonluk: €4.0M"
          icon={Compass}
        />

        <StatCard
          label="Aktif Scout"
          value={`${activeScoutsCount} / 8`}
          progressPercent={(activeScoutsCount / 8) * 100}
          subtext="Gözlemci kadrosu"
          icon={Users}
        />

        <StatCard
          label="Aktif Görev"
          value={`${activeAssignmentsCount || 12}`}
          subtext="4 bölgede aktif tarama"
          icon={Activity}
        />

        <StatCard
          label="İzlenen Oyuncu"
          value={`${scoutingReports.length || 214}`}
          change="+37"
          changeType="positive"
          subtext="Takipteki yetenekler"
          icon={Search}
        />

        <StatCard
          label="Keşfedilen Potansiyel"
          value={`${wonderkids.length + 12}`}
          change="+5"
          changeType="positive"
          subtext="≥ 80 potansiyelli yıldız"
          icon={Star}
        />
      </div>

      {/* 3. MIDDLE SECTION: SCOUT AĞI MAP + ATANAN SCOUTLAR + SCOUT VERİMLİLİĞİ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* SCOUT AĞI WORLD MAP (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-3">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-[#65F56B]" />
              Scout Ağı (Küresel Kapsama)
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Dünya Geneli</span>
          </div>

          {/* High-tech SVG Map Canvas */}
          <div className="relative w-full h-56 rounded-xl bg-gradient-to-b from-[#05131C] to-[#040C12] border border-[rgba(125,160,175,0.14)] overflow-hidden my-2 flex items-center justify-center p-3">
            {/* World grid lines */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#30D8CE_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Glowing Region Nodes */}
            <div className="relative w-full h-full">
              {/* Avrupa Node */}
              <div className="absolute top-[30%] left-[50%] flex flex-col items-center">
                <span className="w-3.5 h-3.5 rounded-full bg-[#65F56B] shadow-[0_0_12px_#65F56B] animate-ping opacity-75" />
                <span className="absolute w-3 h-3 rounded-full bg-[#65F56B] border-2 border-black" />
                <div className="mt-2 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-[#65F56B]/40">
                  Avrupa %42 (5 Scout)
                </div>
              </div>

              {/* G. Amerika Node */}
              <div className="absolute top-[65%] left-[32%] flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-[#30D8CE] shadow-[0_0_10px_#30D8CE]" />
                <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-[#30D8CE]/40">
                  G. Amerika %21 (2 Scout)
                </div>
              </div>

              {/* Afrika Node */}
              <div className="absolute top-[60%] left-[53%] flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
                <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-amber-400/40">
                  Afrika %15 (2 Scout)
                </div>
              </div>

              {/* Asya Node */}
              <div className="absolute top-[40%] left-[78%] flex flex-col items-center">
                <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
                <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono font-bold text-white border border-sky-400/40">
                  Asya %12 (1 Scout)
                </div>
              </div>

              {/* SVG Connection Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <line x1="50%" y1="30%" x2="32%" y2="65%" stroke="#65F56B" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50%" y1="30%" x2="53%" y2="60%" stroke="#65F56B" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50%" y1="30%" x2="78%" y2="40%" stroke="#65F56B" strokeDasharray="3 3" strokeWidth="1" />
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#65F56B]" /> Aktif Bölge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#30D8CE]" /> Raporlanan Oyuncular
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Scout Lokasyonu
            </span>
          </div>
        </div>

        {/* ATANAN SCOUTLAR (4 COLS) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-2">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-[#65F56B]" />
              Atanan Scoutlar
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Aktif Görevler</span>
          </div>

          <div className="space-y-2 py-1">
            {scouts.length > 0 ? (
              scouts.slice(0, 4).map((scout) => (
                <div
                  key={scout.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0D1C26]/60 border border-[rgba(125,160,175,0.1)] text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#65F56B]/20 border border-[#65F56B]/40 flex items-center justify-center font-bold text-[10px] text-[#65F56B]">
                      {scout.firstName?.[0] || 'S'}
                    </div>
                    <div className="truncate">
                      <span className="text-white font-bold block truncate">{scout.firstName} {scout.lastName}</span>
                      <span className="text-[9px] text-zinc-400">{scout.nationality || 'Avrupa'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex text-amber-400 text-[10px]">
                      {'★'.repeat(Math.min(5, Math.max(3, Math.round(scout.judgingPotential / 4))))}
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-[#09141B] border border-zinc-800 text-[10px] font-bold text-white">
                      3 Görev
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                Henüz atanmış scout bulunmuyor.
              </div>
            )}
          </div>
        </div>

        {/* SCOUT VERİMLİLİĞİ (3 COLS) */}
        <div className="lg:col-span-3 rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-2">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#65F56B]" />
              Scout Verimliliği
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Bu Sezon</span>
          </div>

          <div className="relative w-32 h-32 mx-auto my-1 flex items-center justify-center">
            <div className="w-full h-full rounded-full border-[12px] border-[#65F56B] border-r-transparent animate-in fade-in" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black font-sans text-white">%87</span>
              <span className="text-[9px] font-mono text-[#65F56B]">▲ +8%</span>
            </div>
          </div>

          <div className="space-y-1.5 text-[10px] font-mono pt-2 border-t border-zinc-800">
            <div className="flex justify-between text-zinc-400">
              <span>Raporlanan Oyuncu</span>
              <span className="text-white font-bold">214</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>İzleme Listesine Eklenen</span>
              <span className="text-white font-bold">47</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Kadroya Önerilen</span>
              <span className="text-white font-bold">17</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Transfer Edilen</span>
              <span className="text-[#65F56B] font-bold">4</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LOWER SECTION: RAPOR ÖZETİ + İZLENEN OYUNCULAR + WONDERKİD + ALTYAPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* RAPOR ÖZETİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            Rapor Özeti (Son 6 Ay)
          </span>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-1.5 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-400">Toplam Rapor</span>
              <span className="font-bold text-white">214 <span className="text-[#65F56B] text-[10px]">▲ +37</span></span>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-400">İzleme Listesi</span>
              <span className="font-bold text-white">47 <span className="text-[#65F56B] text-[10px]">▲ +12</span></span>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-400">Yıldız Adayı</span>
              <span className="font-bold text-white">17 <span className="text-[#65F56B] text-[10px]">▲ +5</span></span>
            </div>
            <div className="flex justify-between p-1.5 rounded bg-[#0D1C26]/60">
              <span className="text-zinc-400">Kadroya Uygun</span>
              <span className="font-bold text-white">29 <span className="text-[#65F56B] text-[10px]">▲ +9</span></span>
            </div>
          </div>
        </div>

        {/* İZLENEN OYUNCULAR */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            İzlenen Oyuncular
          </span>
          <div className="space-y-2">
            {watchedPlayers.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p)}
                className="p-1.5 rounded-lg bg-[#0D1C26]/60 hover:bg-[#0D1C26] cursor-pointer flex items-center justify-between text-xs font-mono transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <PlayerPortrait player={p} size="xs" shape="circle" />
                  <div className="truncate">
                    <span className="text-white font-bold block truncate">{p.firstName[0]}. {p.lastName}</span>
                    <span className="text-[9px] text-zinc-400">{p.position} • Yaş {p.age}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#65F56B]">
                  {p.overall}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WONDERKID LİSTESİ */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            Wonderkid Listesi (Genç Yıldızlar)
          </span>
          <div className="space-y-2">
            {wonderkids.slice(0, 4).map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlayer(p)}
                className="p-1.5 rounded-lg bg-[#0D1C26]/60 hover:bg-[#0D1C26] cursor-pointer flex items-center justify-between text-xs font-mono transition"
              >
                <div className="flex items-center gap-2 truncate">
                  <PlayerPortrait player={p} size="xs" shape="circle" />
                  <div className="truncate">
                    <span className="text-white font-bold block truncate">{p.lastName}</span>
                    <span className="text-[9px] text-zinc-400">{p.position} • Yaş {p.age}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-amber-400 block">POT {p.potential}</span>
                  <span className="text-[9px] text-zinc-500 font-mono">GEN {p.overall}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ALTYAPIDAN YETENEKLER */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-4 shadow-xl">
          <span className="text-xs font-black uppercase text-white font-sans pb-2 border-b border-[rgba(125,160,175,0.14)] mb-3 block">
            Altyapıdan Yetenekler
          </span>
          <div className="space-y-2">
            {academyProspects.length > 0 ? (
              academyProspects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlayer(p)}
                  className="p-1.5 rounded-lg bg-[#0D1C26]/60 hover:bg-[#0D1C26] cursor-pointer flex items-center justify-between text-xs font-mono transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <PlayerPortrait player={p} size="xs" shape="circle" />
                    <div className="truncate">
                      <span className="text-white font-bold block truncate">{p.lastName}</span>
                      <span className="text-[9px] text-zinc-400">{p.position} • Yaş {p.age}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-[#65F56B]">
                    POT {p.potential}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                Altyapı oyuncuları taranıyor...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
