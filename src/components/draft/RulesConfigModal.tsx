import React, { useState } from 'react';
import { DraftRules, PRESET_4_MANAGERS, PRESET_6_MANAGERS, PRESET_8_MANAGERS, SquadSizeOption, PickTimerOption, FitnessSetting, LeagueFormat } from '@/lib/draft/types';
import { Trophy, Settings, Zap, Check, X, Shield, Clock, Flame, Users } from 'lucide-react';

interface RulesConfigModalProps {
  rules: DraftRules;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newRules: DraftRules) => void;
}

export const RulesConfigModal: React.FC<RulesConfigModalProps> = ({
  rules,
  isOpen,
  onClose,
  onSave,
}) => {
  const [current, setCurrent] = useState<DraftRules>({ ...rules });

  if (!isOpen) return null;

  const handleApplyPreset = (preset: DraftRules) => {
    setCurrent({ ...preset });
  };

  const handleSave = () => {
    onSave(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative bg-[#0B0F19] border border-white/10 rounded-3xl w-full max-w-xl shadow-2xl p-6 sm:p-8 text-white my-8 overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-5 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">
                Lig & Draft Kuralları
              </h2>
              <p className="text-xs text-slate-400">
                Menajer sayısı, seçim süreleri ve lig formatını belirleyin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => handleApplyPreset(PRESET_4_MANAGERS)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                current.maxManagers === 4
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-emerald-500/50'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>4 KİŞİ</span>
            </button>
            <button
              onClick={() => handleApplyPreset(PRESET_6_MANAGERS)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                current.maxManagers === 6
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-emerald-500/50'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>6 KİŞİ</span>
            </button>
            <button
              onClick={() => handleApplyPreset(PRESET_8_MANAGERS)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                current.maxManagers === 8
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-emerald-500/50'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>8 KİŞİ</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Max Managers & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Maksimum Menajer
              </label>
              <select
                value={current.maxManagers}
                onChange={(e) => setCurrent({ ...current, maxManagers: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} Menajer (Takım)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Lig Formatı
              </label>
              <select
                value={current.format}
                onChange={(e) => setCurrent({ ...current, format: e.target.value as LeagueFormat })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="SINGLE_ROUND">Tek Devre (Hızlı Simülasyon)</option>
                <option value="DOUBLE_ROUND">Çift Devre (Rövanşlı Lig)</option>
              </select>
            </div>
          </div>

          {/* Squad Size & Timer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kadro Kotası (Tur Sayısı)
              </label>
              <select
                value={current.squadSize}
                onChange={(e) => setCurrent({ ...current, squadSize: Number(e.target.value) as SquadSizeOption })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value={16}>16 Futbolcu (Kısa Draft)</option>
                <option value={18}>18 Futbolcu (Standart Alfa)</option>
                <option value={20}>20 Futbolcu (Geniş Kadro)</option>
                <option value={22}>22 Futbolcu (Tam Kadro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Seçim Süresi (Pick Timer)
              </label>
              <select
                value={current.pickTimerSeconds}
                onChange={(e) => setCurrent({ ...current, pickTimerSeconds: Number(e.target.value) as PickTimerOption })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>30 Saniye (Ultra Hızlı)</option>
                <option value={45}>45 Saniye (Hızlı)</option>
                <option value={60}>60 Saniye (Standart Alfa)</option>
                <option value={90}>90 Saniye (Rahat)</option>
                <option value={0}>Sınırsız (Süre Yok)</option>
              </select>
            </div>
          </div>

          {/* Fitness, Injuries, Suspensions */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kondisyon
              </label>
              <select
                value={current.fitness}
                onChange={(e) => setCurrent({ ...current, fitness: e.target.value as FitnessSetting })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="SIMPLIFIED">Basitleştirilmiş</option>
                <option value="ON">Açık (Tam)</option>
                <option value="OFF">Kapalı (%100 Sabit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Sakatlıklar
              </label>
              <select
                value={current.injuries ? 'true' : 'false'}
                onChange={(e) => setCurrent({ ...current, injuries: e.target.value === 'true' })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="true">Açık</option>
                <option value="false">Kapalı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Cezalar
              </label>
              <select
                value={current.suspensions ? 'true' : 'false'}
                onChange={(e) => setCurrent({ ...current, suspensions: e.target.value === 'true' })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="true">Açık</option>
                <option value="false">Kapalı</option>
              </select>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>KURALLARI KAYDET</span>
          </button>
        </div>
      </div>
    </div>
  );
};
