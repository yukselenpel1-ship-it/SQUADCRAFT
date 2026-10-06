'use client';

import React, { useState, useMemo } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { YouthPlayer } from '@/lib/youth/types';
import { StatBadge } from '@/components/ui/StatBadge';
import { PlayerModal } from '@/components/ui/PlayerModal';
import { getFacilityUpgradeCost } from '@/lib/youth/academyQuality';
import { daysBetween } from '@/lib/career';
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
  Flame,
  Zap,
  ChevronDown,
  Layers,
  Clock,
  Briefcase,
  Star,
} from 'lucide-react';

export default function AcademyPage() {
  const {
    academyFacilities,
    youthPlayers,
    finances,
    currentDate,
    promoteYouthPlayer,
    upgradeAcademy,
    getClubById,
    userClub,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<YouthPlayer | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showIntakeArchive, setShowIntakeArchive] = useState(false);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#050806] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#b8ff3d] border-t-transparent rounded-full animate-spin" />
        <span>Akademi verileri yükleniyor...</span>
      </div>
    );
  }

  const levelCost = getFacilityUpgradeCost(academyFacilities.academyLevel);
  const coachingCost = Math.round(academyFacilities.youthCoachingQuality * 15_000);
  const networkCost = Math.round(academyFacilities.youthRecruitmentNetwork * 12_000);

  // Next intake countdown
  const nextIntakeYear = new Date(currentDate).getMonth() >= 3 ? new Date(currentDate).getFullYear() + 1 : new Date(currentDate).getFullYear();
  const nextIntakeDateStr = `${nextIntakeYear}-03-15`;
  const daysToIntake = Math.max(0, daysBetween(currentDate, nextIntakeDateStr));

  const handleUpgrade = (type: 'academyLevel' | 'youthCoachingQuality' | 'youthRecruitmentNetwork') => {
    setActionFeedback(null);
    const res = upgradeAcademy(type);
    if (!res.success) {
      setActionFeedback({ type: 'error', message: res.message });
    } else {
      setActionFeedback({ type: 'success', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const handlePromote = (youthPlayerId: string) => {
    setActionFeedback(null);
    const res = promoteYouthPlayer(youthPlayerId);
    if (!res.success) {
      setActionFeedback({ type: 'error', message: res.message });
    } else {
      setActionFeedback({ type: 'success', message: res.message });
    }
    setTimeout(() => setActionFeedback(null), 5000);
  };

  // Facility quality label
  const getAcademyLevelLabel = (lvl: number) => {
    if (lvl >= 9) return 'ELİT ULUSLARARASI KAMPÜS (DÜNYA STANDARDI)';
    if (lvl >= 7) return 'ÜST DÜZEY KATEGORİ 1 AKADEMİ';
    if (lvl >= 5) return 'GELİŞMİŞ BÖLGESEL GELİŞİM TESİSİ';
    if (lvl >= 3) return 'ORTA ÖLÇEKLİ ALTYAPI KOMPLEKSİ';
    return 'STANDART GELİŞİM TESİSİ';
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* 1. BROADCAST ACADEMY LAB HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-white/10 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffd34f]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-[#b8ff3d]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#ffd34f]/15 text-[#ffd34f] border border-[#ffd34f]/30">
                // PLAYER DEVELOPMENT LAB & TALENT INCUBATOR
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30">
                SEVİYE {academyFacilities.academyLevel} / 10
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ffd34f]/10 border border-[#ffd34f]/20 flex items-center justify-center text-[#ffd34f]">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sport">
                  FUTBOL AKADEMİSİ
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  {userClub.name.toUpperCase()} • {getAcademyLevelLabel(academyFacilities.academyLevel)}
                </p>
              </div>
            </div>
          </div>

          {/* Right Intake Milestone Banner */}
          <div className="flex items-center gap-4 bg-[#050706]/90 rounded-2xl border border-white/10 p-4 shadow-xl shrink-0">
            <div className="w-12 h-12 rounded-xl bg-[#ffd34f]/10 border border-[#ffd34f]/30 flex flex-col items-center justify-center text-[#ffd34f] shrink-0">
              <Calendar className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-mono font-black">15 MAR</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block tracking-wider">
                YILLIK GENÇ ALIMI (YOUTH INTAKE)
              </span>
              <div className="text-lg font-black text-white font-mono mt-0.5 flex items-center gap-2">
                <span className="text-[#ffd34f]">{daysToIntake} GÜN KALDI</span>
                <span className="text-xs text-zinc-500 font-normal">({nextIntakeDateStr})</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Wonderkid ihtimali: %{Math.round(academyFacilities.youthRecruitmentNetwork * 0.4 + academyFacilities.academyLevel * 5)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex items-center gap-3 animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-[#b8ff3d]/10 border-[#b8ff3d]/40 text-[#b8ff3d]'
              : 'bg-[#ff5365]/10 border-[#ff5365]/40 text-[#ff5365]'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#b8ff3d]" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-[#ff5365]" />
          )}
          <span className="font-bold">{actionFeedback.message}</span>
        </div>
      )}

      {/* 2. FACILITIES UPGRADE CONSOLE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight font-sport">
              TESİS & GELİŞİM YATIRIM PANELİ
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              Altyapı tesislerini modernize ederek oyuncuların gelişim ivmesini ve yeni jenerasyon kalitesini artırın
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-400">
            Kulüp Kasası: <strong className="text-[#b8ff3d]">€{(finances.clubBalance / 1_000_000).toFixed(2)}M</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Academy Level */}
          <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#21dfbd]/10 border border-[#21dfbd]/30 flex items-center justify-center text-[#21dfbd]">
                    <Building className="w-4 h-4" />
                  </div>
                  AKADEMİ TESİSLERİ
                </span>
                <span className="text-xs font-mono font-black text-[#21dfbd] px-2.5 py-1 bg-[#21dfbd]/10 border border-[#21dfbd]/30 rounded-lg">
                  SEVİYE {academyFacilities.academyLevel} / 10
                </span>
              </div>

              {/* Level Pip Progress */}
              <div className="grid grid-cols-10 gap-1 my-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-sm ${
                      i < academyFacilities.academyLevel
                        ? 'bg-[#21dfbd] shadow-[0_0_8px_rgba(33,223,189,0.5)]'
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>

              <p className="text-xs text-zinc-400 font-mono mt-2">
                Tesis kalitesi genç oyuncuların potansiyeline ulaşma hızını ve günlük antrenman gelişim çarpanını artırır.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">YATIRIM MALİYETİ</span>
                <span className="text-xs font-bold text-white">
                  {academyFacilities.academyLevel >= 10 ? 'MAKSİMUM SEVİYE' : `€${levelCost.toLocaleString('tr-TR')}`}
                </span>
              </div>

              <button
                onClick={() => handleUpgrade('academyLevel')}
                disabled={academyFacilities.academyLevel >= 10 || finances.clubBalance < levelCost}
                className="px-4 py-2 text-xs font-mono font-black uppercase rounded-xl bg-[#21dfbd] hover:bg-[#1bc4a5] disabled:opacity-40 disabled:cursor-not-allowed text-[#050806] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(33,223,189,0.3)]"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Yükselt
              </button>
            </div>
          </div>

          {/* 2. Youth Coaching Quality */}
          <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#b8ff3d]/10 border border-[#b8ff3d]/30 flex items-center justify-center text-[#b8ff3d]">
                    <Award className="w-4 h-4" />
                  </div>
                  ANTRENÖR EKİBİ KALİTESİ
                </span>
                <span className="text-xs font-mono font-black text-[#b8ff3d] px-2.5 py-1 bg-[#b8ff3d]/10 border border-[#b8ff3d]/30 rounded-lg">
                  %{academyFacilities.youthCoachingQuality}
                </span>
              </div>

              {/* Quality Progress Bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden my-3">
                <div
                  className="h-full bg-[#b8ff3d] shadow-[0_0_8px_rgba(184,255,61,0.5)]"
                  style={{ width: `${academyFacilities.youthCoachingQuality}%` }}
                />
              </div>

              <p className="text-xs text-zinc-400 font-mono mt-2">
                Antrenör ekibinin pedagojik ve taktiksel birikimi altyapıdan çıkan futbolcuların başlangıç temel güçlerini yükseltir.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">GELİŞTİRME GİDERİ</span>
                <span className="text-xs font-bold text-white">
                  {academyFacilities.youthCoachingQuality >= 100 ? 'MAKSİMUM KALİTE' : `€${coachingCost.toLocaleString('tr-TR')}`}
                </span>
              </div>

              <button
                onClick={() => handleUpgrade('youthCoachingQuality')}
                disabled={academyFacilities.youthCoachingQuality >= 100 || finances.clubBalance < coachingCost}
                className="px-4 py-2 text-xs font-mono font-black uppercase rounded-xl bg-[#b8ff3d] hover:bg-[#a6ec31] disabled:opacity-40 disabled:cursor-not-allowed text-[#050806] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(184,255,61,0.3)]"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Geliştir
              </button>
            </div>
          </div>

          {/* 3. Recruitment Network */}
          <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 flex flex-col justify-between space-y-4 shadow-xl hover:border-white/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#ffd34f]/10 border border-[#ffd34f]/30 flex items-center justify-center text-[#ffd34f]">
                    <Target className="w-4 h-4" />
                  </div>
                  YETENEK TARAMA AĞI
                </span>
                <span className="text-xs font-mono font-black text-[#ffd34f] px-2.5 py-1 bg-[#ffd34f]/10 border border-[#ffd34f]/30 rounded-lg">
                  %{academyFacilities.youthRecruitmentNetwork}
                </span>
              </div>

              {/* Network Progress Bar */}
              <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden my-3">
                <div
                  className="h-full bg-[#ffd34f] shadow-[0_0_8px_rgba(255,211,79,0.5)]"
                  style={{ width: `${academyFacilities.youthRecruitmentNetwork}%` }}
                />
              </div>

              <p className="text-xs text-zinc-400 font-mono mt-2">
                Geniş tarama ağı, her 15 Mart alımında akademiye üstün yetenekli (Wonderkid) gençlerin katılma ihtimalini güçlendirir.
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">GENİŞLETME GİDERİ</span>
                <span className="text-xs font-bold text-white">
                  {academyFacilities.youthRecruitmentNetwork >= 100 ? 'MAKSİMUM AĞ' : `€${networkCost.toLocaleString('tr-TR')}`}
                </span>
              </div>

              <button
                onClick={() => handleUpgrade('youthRecruitmentNetwork')}
                disabled={academyFacilities.youthRecruitmentNetwork >= 100 || finances.clubBalance < networkCost}
                className="px-4 py-2 text-xs font-mono font-black uppercase rounded-xl bg-[#ffd34f] hover:bg-[#ecc03f] disabled:opacity-40 disabled:cursor-not-allowed text-[#050806] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(255,211,79,0.3)]"
              >
                <ArrowUpCircle className="w-4 h-4" />
                Genişlet
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. PROSPECT DEVELOPMENT LANES (YOUTH PLAYERS) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight font-sport">
              AKADEMİ GELİŞİM HAVUZU ({youthPlayers.length} ADAY FUTBOLCU)
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              15–18 yaş arası profesyonel akademi futbolcuları, potansiyel tavanları ve gelişim hızları
            </p>
          </div>
        </div>

        {youthPlayers.length === 0 ? (
          <div className="p-12 text-center bg-[#090d0a] rounded-2xl border border-white/10 space-y-2">
            <GraduationCap className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white uppercase font-mono">Akademide Henüz Futbolcu Bulunmuyor</h4>
            <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
              Her yıl <strong>15 Mart</strong> tarihinde altyapınıza yeni nesil genç yetenek adayları katılacaktır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {youthPlayers.map((player) => {
              const velocity = player.overall > 60 ? 'FAST' : 'STEADY';

              return (
                <div
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-4 hover:border-white/20 transition-all cursor-pointer shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#050706] border border-white/10 flex items-center justify-center text-[#ffd34f]">
                        <Star className="w-6 h-6 fill-[#ffd34f]/20" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white uppercase tracking-tight font-sport">
                          {player.firstName} {player.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                          <span className="px-2 py-0.5 rounded bg-[#b8ff3d]/15 text-[#b8ff3d] font-bold">
                            {player.position}
                          </span>
                          <span>{player.age} YAŞ</span>
                          <span>•</span>
                          <span>{player.nationality}</span>
                        </div>
                      </div>
                    </div>

                    {/* Overall vs Potential Ceiling */}
                    <div className="text-right font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-xl font-black text-white">{player.overall}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-xl font-black text-[#b8ff3d]">
                          [{player.estimatedPotentialRange[0]}–{player.estimatedPotentialRange[1]}]
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase block">OVR → POTANSİYEL</span>
                    </div>
                  </div>

                  {/* Velocity Meter & Graduation */}
                  <div className="flex items-center justify-between p-3 bg-[#050706] rounded-xl border border-white/5 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-[10px] uppercase">GELİŞİM HIZI:</span>
                      <span className="flex items-center gap-1 font-bold text-[#21dfbd]">
                        <span className="w-2 h-2 rounded-full bg-[#21dfbd] animate-ping" />
                        {velocity === 'FAST' ? 'HIZLI GELİŞİM (FAST)' : 'DENGELİ (STEADY)'}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      Mezuniyet: <strong>{player.academyGraduationYear}</strong>
                    </span>
                  </div>

                  {/* Scout Pull-Quote */}
                  <p className="text-xs text-zinc-300 font-mono italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                    "{player.scoutOpinion}"
                  </p>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handlePromote(player.id)}
                      className="px-4 py-2 text-xs font-mono font-black uppercase rounded-xl bg-[#b8ff3d] hover:bg-[#a6ec31] text-[#050806] transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(184,255,61,0.3)]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      A Takıma Yükselt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. INTAKE HISTORY COLLAPSIBLE DRAWER */}
      {academyFacilities.intakeHistory && academyFacilities.intakeHistory.length > 0 && (
        <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 space-y-4 shadow-xl">
          <button
            onClick={() => setShowIntakeArchive(!showIntakeArchive)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#4FE4FF]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-white font-sport">
                GEÇMİŞ YILLIK GENÇ ALIM ARŞİVİ ({academyFacilities.intakeHistory.length} DÖNEM)
              </h3>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform ${showIntakeArchive ? 'rotate-180' : ''}`}
            />
          </button>

          {showIntakeArchive && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              {academyFacilities.intakeHistory.map((batch) => (
                <div key={batch.id} className="p-4 bg-[#050706] rounded-xl border border-white/10 space-y-1 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white uppercase">
                      {batch.seasonYear} Sezonu Genç Alımı ({batch.date})
                    </span>
                    <span className="text-[#b8ff3d] font-bold">
                      {batch.players.length} Futbolcu Katıldı
                    </span>
                  </div>
                  <p className="text-zinc-400">{batch.intakeSummary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          club={getClubById(selectedPlayer.clubId)}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
