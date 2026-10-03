import React, { useState } from 'react';
import { DraftRules, PRESET_4_MANAGERS, PRESET_6_MANAGERS, PRESET_8_MANAGERS, SquadSizeOption, PickTimerOption, FitnessSetting, LeagueFormat, DEFAULT_DRAFT_BUDGET } from '@/lib/draft/types';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="relative bg-[#07101C]/95 border border-[#14233A] rounded-3xl w-full max-w-xl shadow-[0_0_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl p-6 sm:p-8 text-white my-8 overflow-hidden">
        {/* Top neon accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

        {/* Glow ambient */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#14233A] pb-5 mb-6 gap-3">
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

          {/* Kulüp Başlangıç Bütçesi */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Kulüp Başlangıç Bütçesi</span>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                €{((current.draftBudget || DEFAULT_DRAFT_BUDGET) / 1_000_000).toFixed(1)}M
              </span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {[100_000_000, 150_000_000, 200_000_000, 250_000_000, 300_000_000].map((b) => {
                const isSelected = (current.draftBudget || DEFAULT_DRAFT_BUDGET) === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCurrent({ ...current, draftBudget: b })}
                    className={`py-2 px-1 text-xs font-mono font-bold rounded-xl border transition text-center ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    €{b / 1_000_000}M
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  const curr = current.draftBudget || DEFAULT_DRAFT_BUDGET;
                  if ([100_000_000, 150_000_000, 200_000_000, 250_000_000, 300_000_000].includes(curr)) {
                    setCurrent({ ...current, draftBudget: 175_000_000 });
                  }
                }}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition text-center ${
                  ![100_000_000, 150_000_000, 200_000_000, 250_000_000, 300_000_000].includes(current.draftBudget || DEFAULT_DRAFT_BUDGET)
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/25 hover:text-white'
                }`}
              >
                Özel
              </button>
            </div>

            {![100_000_000, 150_000_000, 200_000_000, 250_000_000, 300_000_000].includes(current.draftBudget || DEFAULT_DRAFT_BUDGET) && (
              <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-xl flex items-center gap-3">
                <span className="text-xs font-bold text-amber-400 shrink-0">Özel Bütçe (€50M - €500M):</span>
                <input
                  type="number"
                  min={50}
                  max={500}
                  step={5}
                  value={Math.round((current.draftBudget || DEFAULT_DRAFT_BUDGET) / 1_000_000)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const clamped = Math.max(50, Math.min(500, val || 50));
                    setCurrent({ ...current, draftBudget: clamped * 1_000_000 });
                  }}
                  className="w-24 bg-black border border-white/20 rounded-lg px-2 py-1 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 text-center"
                />
                <span className="text-xs font-mono text-zinc-400">Milyon Euro</span>
              </div>
            )}
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
