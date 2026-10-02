'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { YouthPlayer } from '@/lib/youth/types';
import { StatBadge } from '@/components/ui/StatBadge';
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
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedPlayer, setSelectedPlayer] = useState<YouthPlayer | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#070A0F] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Broadcast Header HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-amber-400/10 text-amber-400 border border-amber-400/30">
              // YOUTH ACADEMY & TALENT INCUBATOR
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              ÖZ KAYNAK DÜZENİ & WONDERKID HAVUZU
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-amber-400" />
            Gençlik Gelişim Akademisi
          </h1>
        </div>

        {/* Next Intake Milestone */}
        <div className="flex items-center gap-3 bg-[#080D1A] p-2.5 border border-zinc-800 text-xs font-mono">
          <Calendar className="w-5 h-5 text-amber-400" />
          <div>
            <span className="block text-[10px] uppercase font-bold text-zinc-500">Gelecek Genç Alımı</span>
            <span className="text-sm font-black text-white">{academyFacilities.nextIntakeDate} (15 Mart)</span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-3 border text-xs font-mono flex items-center gap-3 animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-[#C7FF38]/10 border-[#C7FF38]/40 text-[#C7FF38]'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#C7FF38]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* Facility & Development Investments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Academy Level */}
        <div className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#4FE4FF]" />
                Akademi Tesis Seviyesi
              </span>
              <span className="text-xs font-mono font-black text-[#4FE4FF] px-2 py-0.5 bg-[#4FE4FF]/10 border border-[#4FE4FF]/30">
                Seviye {academyFacilities.academyLevel} / 10
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Tesis kalitesi genç oyuncuların potansiyeline ulaşma hızını ve antrenman verimini artırır.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400">
              {academyFacilities.academyLevel >= 10 ? 'Maks Seviye' : `€${levelCost.toLocaleString('tr-TR')}`}
            </span>
            <button
              onClick={() => handleUpgrade('academyLevel')}
              disabled={academyFacilities.academyLevel >= 10 || finances.clubBalance < levelCost}
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#4FE4FF] text-black hover:bg-[#4FE4FF]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Yükselt
            </button>
          </div>
        </div>

        {/* Youth Coaching Quality */}
        <div className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#C7FF38]" />
                Antrenör Kalitesi
              </span>
              <span className="text-xs font-mono font-black text-[#C7FF38] px-2 py-0.5 bg-[#C7FF38]/10 border border-[#C7FF38]/30">
                %{academyFacilities.youthCoachingQuality}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Antrenör ekibinin pedagojik ve taktiksel birikimi altyapıdan çıkan futbolcuların başlangıç yeteneklerini yükseltir.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400">
              {academyFacilities.youthCoachingQuality >= 100 ? 'Maks Kalite' : `€${coachingCost.toLocaleString('tr-TR')}`}
            </span>
            <button
              onClick={() => handleUpgrade('youthCoachingQuality')}
              disabled={academyFacilities.youthCoachingQuality >= 100 || finances.clubBalance < coachingCost}
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#C7FF38] text-black hover:bg-[#D9FF73] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Geliştir
            </button>
          </div>
        </div>

        {/* Recruitment Network */}
        <div className="p-4 bg-[#080D1A] border border-zinc-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                Yetenek Tarama Ağı
              </span>
              <span className="text-xs font-mono font-black text-amber-400 px-2 py-0.5 bg-amber-400/10 border border-amber-400/30">
                %{academyFacilities.youthRecruitmentNetwork}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Geniş tarama ağı, her 15 Mart'ta akademiye üstün yetenekli (Wonderkid) gençlerin katılma ihtimalini güçlendirir.
            </p>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-zinc-400">
              {academyFacilities.youthRecruitmentNetwork >= 100 ? 'Maks Ağ' : `€${networkCost.toLocaleString('tr-TR')}`}
            </span>
            <button
              onClick={() => handleUpgrade('youthRecruitmentNetwork')}
              disabled={academyFacilities.youthRecruitmentNetwork >= 100 || finances.clubBalance < networkCost}
              className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-amber-400 text-black hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Genişlet
            </button>
          </div>
        </div>
      </div>

      {/* Youth Players Roster */}
      <div className="p-4 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300">
              Akademi Kadrosu ({youthPlayers.length} Futbolcu)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            YAŞ: 15 – 18
          </span>
        </div>

        {youthPlayers.length === 0 ? (
          <div className="p-8 text-center bg-[#040711] border border-zinc-850">
            <GraduationCap className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1 uppercase font-mono">Şu Anda Akademide Futbolcu Bulunmuyor</h4>
            <p className="text-xs font-mono text-zinc-400 max-w-md mx-auto">
              Her yıl <strong>15 Mart</strong> tarihinde altyapınıza yeni nesil genç yetenek adayları katılacaktır.
            </p>
          </div>
        ) : (
          <div className="border border-zinc-850 bg-[#040711] overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#040711] text-zinc-400 uppercase font-mono font-black text-[10px] tracking-widest border-b border-zinc-800">
                  <th className="p-3">GENÇ FUTBOLCU</th>
                  <th className="p-3 text-center">MEVKİ</th>
                  <th className="p-3 text-center">YAŞ</th>
                  <th className="p-3 text-center">GENEL</th>
                  <th className="p-3 text-center">POTANSİYEL ARALIĞI</th>
                  <th className="p-3">GÖZLEMCİ GÖRÜŞÜ</th>
                  <th className="p-3 text-right">İŞLEM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850 text-zinc-200">
                {youthPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="hover:bg-zinc-900/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <td className="p-3">
                      <span className="font-bold text-white block uppercase">
                        {player.firstName} {player.lastName}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {player.nationality} • MEZUNİYET: {player.academyGraduationYear}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 font-mono text-[10px] font-black bg-zinc-900 border border-zinc-700 text-[#C7FF38]">
                        {player.position}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-zinc-300">{player.age}</td>
                    <td className="p-3 text-center">
                      <StatBadge value={player.overall} size="sm" />
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-[#C7FF38]">
                      {player.estimatedPotentialRange[0]} – {player.estimatedPotentialRange[1]}
                    </td>
                    <td className="p-3 text-zinc-400 italic max-w-xs truncate font-mono text-[11px]">
                      {player.scoutOpinion}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handlePromote(player.id)}
                        className="px-2.5 py-1 text-xs font-mono font-bold uppercase bg-[#C7FF38] text-black hover:bg-[#D9FF73] transition-all flex items-center gap-1 ml-auto border border-white"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        A Takıma Yükselt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Intake History */}
      {academyFacilities.intakeHistory && academyFacilities.intakeHistory.length > 0 && (
        <div className="p-4 bg-[#080D1A] border border-zinc-800 shadow-xl space-y-3">
          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#4FE4FF]" />
            Geçmiş Yıllık Alım Arşivi
          </h3>

          <div className="space-y-2">
            {academyFacilities.intakeHistory.map((batch) => (
              <div key={batch.id} className="p-3 bg-[#040711] border border-zinc-850 space-y-1 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">
                    {batch.seasonYear} Sezonu Genç Alımı ({batch.date})
                  </span>
                  <span className="text-[11px] font-bold text-[#C7FF38]">
                    {batch.players.length} Futbolcu Katıldı
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{batch.intakeSummary}</p>
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
    </div>
  );
}
