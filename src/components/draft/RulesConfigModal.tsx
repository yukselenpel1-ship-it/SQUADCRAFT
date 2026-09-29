import React, { useState } from 'react';
import { DraftRules, PRESET_CLOSED_ALPHA_4, SquadSizeOption, PickTimerOption, FitnessSetting, LeagueFormat } from '@/lib/draft/types';

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

  const handlePresetAlpha = () => {
    setCurrent({ ...PRESET_CLOSED_ALPHA_4 });
  };

  const handleSave = () => {
    onSave(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl p-6 text-white my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">Lig & Draft Ayarları</h2>
            <p className="text-xs text-slate-400">Oda kuralları, süreler ve lig formatını belirleyin</p>
          </div>
          <button
            onClick={handlePresetAlpha}
            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-lg text-xs font-semibold text-emerald-300 transition flex items-center gap-1.5 shadow-sm"
          >
            <span>⚡</span>
            <span>KAPALI ALFA — 4 KİŞİ</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Max Managers & Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Maksimum Menajer</label>
              <select
                value={current.maxManagers}
                onChange={(e) => setCurrent({ ...current, maxManagers: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} Menajer
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lig Formatı</label>
              <select
                value={current.format}
                onChange={(e) => setCurrent({ ...current, format: e.target.value as LeagueFormat })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="SINGLE_ROUND">Tek Devre (Hızlı)</option>
                <option value="DOUBLE_ROUND">Çift Devre (Rövanşlı)</option>
              </select>
            </div>
          </div>

          {/* Squad Size & Timer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kadro Büyüklüğü (Tur Sayısı)</label>
              <select
                value={current.squadSize}
                onChange={(e) => setCurrent({ ...current, squadSize: Number(e.target.value) as SquadSizeOption })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={16}>16 Futbolcu (Kısa Draft)</option>
                <option value={18}>18 Futbolcu (Standart Alfa)</option>
                <option value={20}>20 Futbolcu (Geniş Kadro)</option>
                <option value={22}>22 Futbolcu (Tam Kadro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Seçim Süresi (Pick Timer)</label>
              <select
                value={current.pickTimerSeconds}
                onChange={(e) => setCurrent({ ...current, pickTimerSeconds: Number(e.target.value) as PickTimerOption })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={30}>30 Saniye (Çok Hızlı)</option>
                <option value={45}>45 Saniye (Hızlı)</option>
                <option value={60}>60 Saniye (Standart Alfa)</option>
                <option value={90}>90 Saniye (Rahat)</option>
                <option value={0}>Sınırsız (Zamanlayıcı Yok)</option>
              </select>
            </div>
          </div>

          {/* Fitness, Injuries, Suspensions */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kondisyon</label>
              <select
                value={current.fitness}
                onChange={(e) => setCurrent({ ...current, fitness: e.target.value as FitnessSetting })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="SIMPLIFIED">Basitleştirilmiş</option>
                <option value="ON">Açık (Tam)</option>
                <option value="OFF">Kapalı (%100 Sabit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Sakatlıklar</label>
              <select
                value={current.injuries ? 'true' : 'false'}
                onChange={(e) => setCurrent({ ...current, injuries: e.target.value === 'true' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="true">Açık</option>
                <option value="false">Kapalı</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cezalar</label>
              <select
                value={current.suspensions ? 'true' : 'false'}
                onChange={(e) => setCurrent({ ...current, suspensions: e.target.value === 'true' })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="true">Açık</option>
                <option value="false">Kapalı</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-lg transition"
          >
            Kuralları Güncelle
          </button>
        </div>
      </div>
    </div>
  );
};
