'use client';

import React, { useState } from 'react';
import { Player } from '@/types/game';
import { useGame } from '@/lib/context/GameContext';
import { AssignmentDurationDays } from '@/lib/scouting/types';
import { X, Compass, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react';

interface AssignScoutModalProps {
  player: Player;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignScoutModal: React.FC<AssignScoutModalProps> = ({
  player,
  onClose,
  onSuccess,
}) => {
  const { scouts, assignScout } = useGame();
  const [selectedScoutId, setSelectedScoutId] = useState<string>(
    scouts.find((s) => !s.activeAssignmentId)?.id || scouts[0]?.id || ''
  );
  const [duration, setDuration] = useState<AssignmentDurationDays>(7);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedScout = scouts.find((s) => s.id === selectedScoutId);

  const durationOptions: { days: AssignmentDurationDays; label: string; desc: string }[] = [
    { days: 3, label: '3 Gün', desc: 'Hızlı Ön İnceleme (%15 - %25 bilgi artışı)' },
    { days: 7, label: '7 Gün', desc: 'Standart Rapor (%35 - %50 bilgi artışı)' },
    { days: 14, label: '14 Gün', desc: 'Detaylı Değerlendirme (%65 - %80 bilgi artışı)' },
    { days: 30, label: '30 Gün', desc: 'Kapsamlı Derinlemesine İzleme (Tam Bilgi / Rapor)' },
  ];

  const handleAssign = () => {
    if (!selectedScoutId) {
      setError('Lütfen bir gözlemci seçiniz.');
      return;
    }

    const result = assignScout(selectedScoutId, player.id, duration);
    if (!result.success) {
      setError(result.message);
    } else {
      setSuccessMsg(result.message);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0d120f]/95 border border-white/10 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-6 text-zinc-200 overflow-hidden">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b7ff35] to-[#17e5c2]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#090d0a] hover:bg-[#121D33] text-zinc-400 hover:text-white border border-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Gözlemci Görevi Ata</h3>
            <p className="text-xs text-zinc-400">
              {player.firstName} {player.lastName} ({player.position})
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Scout Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Gözlemci Seçimi</label>
            {scouts.length === 0 ? (
              <p className="text-xs text-rose-400">Kulübünüzde aktif gözlemci bulunmamaktadır.</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {scouts.map((scout) => {
                  const isBusy = Boolean(scout.activeAssignmentId);
                  const isSelected = scout.id === selectedScoutId;
                  return (
                    <div
                      key={scout.id}
                      onClick={() => !isBusy && setSelectedScoutId(scout.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500/50 text-white'
                          : isBusy
                          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60 cursor-not-allowed'
                          : 'bg-[#141A28] border-[#20293D] hover:border-zinc-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {scout.firstName} {scout.lastName}
                          </span>
                          {isBusy ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Görevde
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Müsait
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                          <span>Yetenek: <strong className="text-zinc-200">{scout.judgingAbility}</strong></span>
                          <span>•</span>
                          <span>Potansiyel: <strong className="text-zinc-200">{scout.judgingPotential}</strong></span>
                        </div>
                      </div>
                      {isSelected && <UserCheck className="w-4 h-4 text-sky-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2">Gözlem Süresi</label>
            <div className="grid grid-cols-2 gap-2">
              {durationOptions.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setDuration(opt.days)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    duration === opt.days
                      ? 'bg-[#b7ff35]/15 border-[#b7ff35]/50 text-white'
                      : 'bg-[#141A28] border-[#20293D] hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="block text-xs font-black text-white">{opt.label}</span>
                  <span className="block text-[10px] text-zinc-400 mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
          >
            İptal
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedScout || Boolean(selectedScout.activeAssignmentId)}
            className="px-5 py-2 rounded-xl text-xs font-black bg-[#b7ff35] text-black hover:bg-[#9bea27] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
          >
            Görevi Başlat
          </button>
        </div>
      </div>
    </div>
  );
};
