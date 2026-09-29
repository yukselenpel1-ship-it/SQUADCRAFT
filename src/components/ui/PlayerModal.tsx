'use client';

import React, { useState } from 'react';
import { Player, Club } from '@/types/game';
import { StatBadge } from './StatBadge';
import { FitnessIndicator } from './FitnessIndicator';
import { MoraleIndicator } from './MoraleIndicator';
import { ClubBadge } from './ClubBadge';
import { useGame } from '@/lib/context/GameContext';
import { AssignScoutModal } from './AssignScoutModal';
import { LoanOfferModal } from './LoanOfferModal';
import {
  X,
  Activity,
  Award,
  DollarSign,
  Bookmark,
  AlertTriangle,
  FileSignature,
  Compass,
  Handshake,
  Eye,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

interface PlayerModalProps {
  player: Player | null;
  club?: Club;
  onClose: () => void;
  isShortlisted?: boolean;
  onToggleShortlist?: (id: string) => void;
  onMakeBid?: (id: string) => void;
  onRenewContract?: (player: Player) => void;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  club,
  onClose,
  isShortlisted = false,
  onToggleShortlist,
  onMakeBid,
  onRenewContract,
}) => {
  const { userClub, getMaskedPlayer } = useGame();
  const [showScoutModal, setShowScoutModal] = useState<boolean>(false);
  const [showLoanModal, setShowLoanModal] = useState<boolean>(false);

  if (!player) return null;

  const isOwnPlayer = player.clubId === userClub.id;
  const masked = getMaskedPlayer(player);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#070B12] border-2 border-zinc-700 shadow-2xl text-zinc-200">
          {/* Header Banner */}
          <div className="relative p-6 bg-[#0B101D] border-b border-zinc-800">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {club && (
                  <ClubBadge
                    code={club.code}
                    primaryColor={club.primaryColor}
                    secondaryColor={club.secondaryColor}
                    size="lg"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-[#00F5A0] border border-emerald-500/30">
                      {player.position}
                    </span>
                    {player.secondaryPositions.map((sec) => (
                      <span
                        key={sec}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700"
                      >
                        {sec}
                      </span>
                    ))}
                    <span className="text-xs text-zinc-400">
                      {player.nationality} • {player.age} Yaş ({player.birthDate})
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                    {player.firstName} {player.lastName}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                    <span>{club ? club.name : 'Kulüp'}</span>
                    <span>•</span>
                    <span>{player.height} cm / {player.weight} kg</span>
                    <span>•</span>
                    <span>Tercih Edilen Ayak: <strong className="text-zinc-200">{player.preferredFoot}</strong></span>
                  </div>
                </div>
              </div>

              {/* Ratings & Fog of War Preview */}
              <div className="flex items-center gap-4 bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800">
                <div className="text-center">
                  <span className="block text-[10px] uppercase font-bold text-zinc-400">Genel</span>
                  <StatBadge value={masked.overallDisplay} size="lg" />
                </div>
                <div className="text-center border-l border-zinc-800 pl-3">
                  <span className="block text-[10px] uppercase font-bold text-zinc-400">Potansiyel</span>
                  <StatBadge value={masked.potentialDisplay} size="lg" />
                </div>
                <div className="text-center border-l border-zinc-800 pl-3">
                  <span className="block text-[10px] uppercase font-bold text-zinc-400">Form</span>
                  <span className="text-lg font-black text-emerald-400">{player.form}</span>
                </div>
              </div>
            </div>

            {/* Scouting Knowledge Bar */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-sky-400" />
                <span className="text-xs text-zinc-300 font-bold">
                  {isOwnPlayer
                    ? 'Kendi Oyuncumuz (Tam Bilgi / Seviye 5)'
                    : `Gözlem Düzeyi: %${masked.knowledgePercentage} (Seviye ${masked.knowledgeLevel}/5)`}
                </span>
              </div>

              {!isOwnPlayer && (
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-[#00F5A0] rounded-full transition-all duration-300"
                      style={{ width: `${masked.knowledgePercentage}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setShowScoutModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    Gözlemci Gönder
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Status & Alerts */}
            {(player.isInjured || player.isSuspended) && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-sm text-rose-300">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  {player.isInjured && (
                    <p>
                      <strong>Sakatlık:</strong> {player.injuryDetails?.type} ({player.injuryDetails?.daysRemaining} gün)
                    </p>
                  )}
                  {player.isSuspended && (
                    <p>
                      <strong>Cezalı:</strong> {player.suspensionDetails?.reason} ({player.suspensionDetails?.matchesRemaining} maç)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-[#141A28] p-4 rounded-xl border border-[#20293D]">
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Piyasa Değeri</span>
                <span className="text-sm font-bold text-white">{masked.marketValueDisplay}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Haftalık Maaş</span>
                <span className="text-sm font-bold text-emerald-400">{masked.wageDisplay}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Sözleşme Bitiş</span>
                <span className="text-sm font-bold text-amber-300">{player.contractUntil}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Kondisyon</span>
                <FitnessIndicator value={player.fitness} isInjured={player.isInjured} />
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Maç Keskinliği</span>
                <span className="text-sm font-black text-cyan-400">%{player.matchSharpness ?? 80}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Moral</span>
                <MoraleIndicator value={player.morale} showText={true} />
              </div>
            </div>

            {/* Scout Report Summary (if scouted) */}
            {masked.latestReport && (
              <div className="p-4 rounded-xl bg-sky-950/30 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-sky-400" />
                    <h4 className="text-xs font-black text-sky-300 uppercase tracking-wider">
                      Son Gözlem Raporu ({masked.latestReport.scoutName} • {masked.latestReport.date})
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-500/30">
                    Öneri: {masked.latestReport.recommendation} (Güven: %{masked.latestReport.confidence})
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <strong className="text-emerald-400 block mb-1">Güçlü Yönler:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                      {masked.latestReport.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <strong className="text-rose-400 block mb-1">Zayıf Yönler:</strong>
                    <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                      {masked.latestReport.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-sky-500/20 text-xs text-zinc-300 flex flex-wrap gap-4">
                  {masked.personalityHint && <span><strong>Karakter:</strong> {masked.personalityHint}</span>}
                  {masked.consistencyHint && <span><strong>İstikrar:</strong> {masked.consistencyHint}</span>}
                  {masked.injuryHint && <span><strong>Sakatlık Eğilimi:</strong> {masked.injuryHint}</span>}
                </div>
              </div>
            )}

            {/* Detailed Attributes Grid */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#00F5A0]" />
                  Futbolcu Nitelikleri
                </span>
                {!isOwnPlayer && masked.knowledgeLevel < 5 && (
                  <span className="text-[11px] text-amber-400/80 font-normal">
                    * Belirsiz nitelikler gözlemci raporlarıyla netleşir
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Teknik & Hücum */}
                <div className="p-4 rounded-xl bg-[#141A28] border border-[#20293D] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#00F5A0] pb-2 border-b border-zinc-800">
                    Teknik & Hücum
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Bitiricilik</span>
                    <StatBadge value={masked.attributes.finishing.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Uzaktan Şut</span>
                    <StatBadge value={masked.attributes.longShots.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Pas</span>
                    <StatBadge value={masked.attributes.passing.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Vizyon (Oyun Görüşü)</span>
                    <StatBadge value={masked.attributes.vision.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Orta Açma</span>
                    <StatBadge value={masked.attributes.crossing.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Dribbling (Top Sürme)</span>
                    <StatBadge value={masked.attributes.dribbling.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Teknik</span>
                    <StatBadge value={masked.attributes.technique.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Kafa Vuruşu</span>
                    <StatBadge value={masked.attributes.heading.displayString} size="sm" />
                  </div>
                </div>

                {/* Fiziksel & Savunma */}
                <div className="p-4 rounded-xl bg-[#141A28] border border-[#20293D] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 pb-2 border-b border-zinc-800">
                    Fizik & Savunma
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Hız (Pace)</span>
                    <StatBadge value={masked.attributes.pace.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Hızlanma</span>
                    <StatBadge value={masked.attributes.acceleration.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Güç</span>
                    <StatBadge value={masked.attributes.strength.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Dayanıklılık</span>
                    <StatBadge value={masked.attributes.stamina.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Top Çalma (Tackling)</span>
                    <StatBadge value={masked.attributes.tackling.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Markaj</span>
                    <StatBadge value={masked.attributes.marking.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Pozisyon Alma</span>
                    <StatBadge value={masked.attributes.positioning.displayString} size="sm" />
                  </div>
                </div>

                {/* Zihinsel & Kalecilik */}
                <div className="p-4 rounded-xl bg-[#141A28] border border-[#20293D] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-zinc-800">
                    Zihinsel & Özel
                  </h4>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Soğukkanlılık</span>
                    <StatBadge value={masked.attributes.composure.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Karar Verme</span>
                    <StatBadge value={masked.attributes.decisions.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Takım Oyunu</span>
                    <StatBadge value={masked.attributes.teamwork.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Liderlik</span>
                    <StatBadge value={masked.attributes.leadership.displayString} size="sm" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-300">Agresiflik</span>
                    <StatBadge value={masked.attributes.aggression.displayString} size="sm" />
                  </div>

                  {player.position === 'GK' && (
                    <>
                      <h5 className="text-[11px] font-bold uppercase text-amber-300 pt-2 border-t border-zinc-800">
                        Kalecilik
                      </h5>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-300">Top Kontrolü / Elle Tutma</span>
                        <StatBadge value={masked.attributes.handling.displayString} size="sm" />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-300">Refleksler</span>
                        <StatBadge value={masked.attributes.reflexes.displayString} size="sm" />
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-300">Kaleci Pozisyonu</span>
                        <StatBadge value={masked.attributes.positioningGK.displayString} size="sm" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 flex-wrap">
              {onToggleShortlist && (
                <button
                  onClick={() => onToggleShortlist(player.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isShortlisted
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  {isShortlisted ? 'Gözlem Listesinden Çıkar' : 'Gözlem Listesine Ekle'}
                </button>
              )}

              {/* Loan Offer Button */}
              {!isOwnPlayer && player.clubId !== 'FREE_AGENT' && (
                <button
                  onClick={() => setShowLoanModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 transition-all"
                >
                  <Handshake className="w-4 h-4" />
                  Kirala
                </button>
              )}

              {onRenewContract && isOwnPlayer && (
                <button
                  onClick={() => onRenewContract(player)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/20"
                >
                  <FileSignature className="w-4 h-4" />
                  Sözleşme Yenile
                </button>
              )}

              {onMakeBid && !isOwnPlayer && (
                <button
                  onClick={() => onMakeBid(player.id)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#00F5A0] text-black hover:bg-[#00D68B] transition-all shadow-lg shadow-emerald-500/20"
                >
                  <DollarSign className="w-4 h-4" />
                  Bonservis Pazarlığı
                </button>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      {showScoutModal && (
        <AssignScoutModal
          player={player}
          onClose={() => setShowScoutModal(false)}
        />
      )}

      {showLoanModal && (
        <LoanOfferModal
          player={player}
          onClose={() => setShowLoanModal(false)}
        />
      )}
    </>
  );
};
