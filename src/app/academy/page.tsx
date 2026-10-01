'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { YouthPlayer } from '@/lib/youth/types';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { StatCard } from '@/components/ui/StatCard';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { getFacilityUpgradeCost } from '@/lib/youth/academyQuality';
import {
  GraduationCap,
  Sparkles,
  Award,
  Users,
  Calendar,
  ArrowUpCircle,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Building,
  Target,
  ChevronRight,
  Star,
} from 'lucide-react';

export default function AcademyPage() {
  const {
    userClub,
    academyFacilities,
    youthPlayers,
    finances,
    promoteYouthPlayer,
    upgradeAcademy,
    isCareerHydrated,
    isInitialized,
    seasonYear,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<YouthPlayer | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Akademi verileri yükleniyor...</span>
      </div>
    );
  }

  const levelCost = getFacilityUpgradeCost(academyFacilities.academyLevel);
  const coachingCost = Math.round(academyFacilities.youthCoachingQuality * 15_000);
  const networkCost = Math.round(academyFacilities.youthRecruitmentNetwork * 12_000);

  const handleUpgrade = (type: 'academyLevel' | 'youthCoachingQuality' | 'youthRecruitmentNetwork') => {
    setActionFeedback(null);
    const res = upgradeAcademy(type);
    if (!res.success) {
      setActionFeedback({ type: 'error', message: res.message });
    } else {
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  const handlePromote = (youthPlayerId: string) => {
    setActionFeedback(null);
    const res = promoteYouthPlayer(youthPlayerId);
    if (!res.success) {
      setActionFeedback({ type: 'error', message: res.message });
    } else {
      setActionFeedback({ type: 'success', message: res.message });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Altyapı Akademisi, Genç Yetenek Geliştirme ve Geleceğin Yıldızları"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {/* Action Feedback */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-[#65F56B]/20 border-[#65F56B]/50 text-white'
              : 'bg-rose-500/20 border-rose-500/50 text-rose-300'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#65F56B] shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Tesis Seviyesi"
          value={`Seviye ${academyFacilities.academyLevel}`}
          progressPercent={(academyFacilities.academyLevel / 5) * 100}
          subtext="Maksimum Seviye 5"
          icon={Building}
        />

        <StatCard
          label="Antrenör Kalitesi"
          value={`${academyFacilities.youthCoachingQuality} / 20`}
          progressPercent={(academyFacilities.youthCoachingQuality / 20) * 100}
          subtext="Gelişim hızı çarpanı"
          icon={Award}
        />

        <StatCard
          label="Gözlemci Ağı"
          value={`${academyFacilities.youthRecruitmentNetwork} / 20`}
          progressPercent={(academyFacilities.youthRecruitmentNetwork / 20) * 100}
          subtext="Bölgesel yetenek çekimi"
          icon={Target}
        />

        <StatCard
          label="Gelecek Genç Alımı"
          value="15 Mart"
          subtext={academyFacilities.nextIntakeDate || '2027'}
          icon={Calendar}
        />
      </div>

      {/* 3. ACADEMY UPGRADE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* UPGRADE LEVEL */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Building className="w-4 h-4 text-[#65F56B]" />
              Akademi Tesis Seviyesi
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Tesis seviyesini yükselterek her bahar alımında daha yüksek potansiyele sahip oyuncu çekin.
            </p>
          </div>

          <div className="pt-4 border-t border-[rgba(125,160,175,0.14)] mt-4 flex items-center justify-between">
            <span className="text-xs font-black text-white font-mono">
              €{(levelCost / 1000).toFixed(0)}K
            </span>
            <button
              onClick={() => handleUpgrade('academyLevel')}
              disabled={academyFacilities.academyLevel >= 5}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
            >
              Yükselt
            </button>
          </div>
        </div>

        {/* UPGRADE COACHING */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Award className="w-4 h-4 text-[#30D8CE]" />
              Genç Antrenör Kalitesi
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Daha tecrübeli eğitmenlerle genç futbolcuların potansiyellerine ulaşma hızını artırın.
            </p>
          </div>

          <div className="pt-4 border-t border-[rgba(125,160,175,0.14)] mt-4 flex items-center justify-between">
            <span className="text-xs font-black text-white font-mono">
              €{(coachingCost / 1000).toFixed(0)}K
            </span>
            <button
              onClick={() => handleUpgrade('youthCoachingQuality')}
              disabled={academyFacilities.youthCoachingQuality >= 20}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#30D8CE] to-[#40E8DE] hover:brightness-110 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
            >
              Yükselt
            </button>
          </div>
        </div>

        {/* UPGRADE NETWORK */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              Yetenek Çekim Ağı
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bölgesel altyapı ağınızı genişleterek komşu şehirlerden yetenekli adaylar keşfedin.
            </p>
          </div>

          <div className="pt-4 border-t border-[rgba(125,160,175,0.14)] mt-4 flex items-center justify-between">
            <span className="text-xs font-black text-white font-mono">
              €{(networkCost / 1000).toFixed(0)}K
            </span>
            <button
              onClick={() => handleUpgrade('youthRecruitmentNetwork')}
              disabled={academyFacilities.youthRecruitmentNetwork >= 20}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:brightness-110 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider transition active:scale-95"
            >
              Yükselt
            </button>
          </div>
        </div>
      </div>

      {/* 4. YOUTH PROSPECTS TABLE */}
      <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)] mb-4">
          <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#65F56B]" />
            Akademi Futbolcuları ({youthPlayers.length})
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            A Takıma Terfi İçin Seçim Yapın
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="text-[10px] text-zinc-500 uppercase border-b border-zinc-800">
                <th className="py-2 pl-2">Futbolcu</th>
                <th className="py-2 text-center w-14">Mevki</th>
                <th className="py-2 text-center w-12">Yaş</th>
                <th className="py-2 text-center w-14">GEN</th>
                <th className="py-2 text-center w-20">Potansiyel</th>
                <th className="py-2 text-center w-24">Gelişim</th>
                <th className="py-2 text-right pr-2 w-32">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {youthPlayers.length > 0 ? (
                youthPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-[#0D1C26]/70 transition text-zinc-300">
                    <td className="py-2.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <PlayerPortrait player={player as any} size="xs" shape="circle" />
                        <div>
                          <span className="text-white font-bold block truncate">
                            {player.firstName} {player.lastName}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {player.nationality || 'TUR'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0D1C26] border border-zinc-800 text-zinc-300">
                        {player.position}
                      </span>
                    </td>

                    <td className="py-2.5 text-center text-zinc-400">{player.age}</td>

                    <td className="py-2.5 text-center font-black text-white">{player.overall}</td>

                    <td className="py-2.5 text-center font-black text-amber-400">
                      ★ {player.potential}
                    </td>

                    <td className="py-2.5 text-center text-[#65F56B] text-[10px]">
                      Hızlı Gelişiyor
                    </td>

                    <td className="py-2.5 text-right pr-2">
                      <button
                        onClick={() => handlePromote(player.id)}
                        className="px-3 py-1 rounded-lg bg-[#65F56B]/20 hover:bg-[#65F56B]/30 text-[#65F56B] border border-[#65F56B]/40 text-[10px] font-black uppercase transition active:scale-95"
                      >
                        A Takıma Çıkar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500 font-mono">
                    Akademide şu anda oyuncu bulunmuyor. Bir sonraki genç alımı 15 Mart tarihinde gerçekleşecek.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
