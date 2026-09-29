import React, { useState } from 'react';
import { DraftClub, BadgeShape, BadgePattern, BadgeEmblem } from '@/lib/draft/types';
import { BadgePreview } from './BadgePreview';
import { BADGE_SHAPES, BADGE_PATTERNS, BADGE_EMBLEMS, DEFAULT_COLORS, generateRandomBadgeConfig } from '@/lib/draft/badgeGenerator';
import { validateDraftClub, FICTIONAL_CLUB_PRESETS } from '@/lib/draft/clubValidation';

interface ClubCustomizerModalProps {
  club: DraftClub;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedClub: Partial<DraftClub>) => void;
}

export const ClubCustomizerModal: React.FC<ClubCustomizerModalProps> = ({
  club,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(club.name);
  const [code, setCode] = useState(club.code);
  const [managerName, setManagerName] = useState(club.managerName);
  const [primaryColor, setPrimaryColor] = useState(club.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(club.secondaryColor);
  const [shape, setShape] = useState<BadgeShape>(club.badge.shape);
  const [pattern, setPattern] = useState<BadgePattern>(club.badge.pattern);
  const [emblem, setEmblem] = useState<BadgeEmblem>(club.badge.emblem);

  if (!isOpen) return null;

  const validation = validateDraftClub(name, code, managerName);

  const handleRandomize = () => {
    const preset = FICTIONAL_CLUB_PRESETS[Math.floor(Math.random() * FICTIONAL_CLUB_PRESETS.length)];
    const randomBadge = generateRandomBadgeConfig();
    setName(preset.name);
    setCode(preset.code);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setShape(randomBadge.shape);
    setPattern(randomBadge.pattern);
    setEmblem(randomBadge.emblem);
  };

  const handleSave = () => {
    if (!validation.isValid) return;
    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      managerName: managerName.trim(),
      primaryColor,
      secondaryColor,
      badge: {
        shape,
        pattern,
        emblem,
        primaryColor,
        secondaryColor,
        accentColor: '#ffffff',
      },
    });
    onClose();
  };

  const currentBadge = {
    shape,
    pattern,
    emblem,
    primaryColor,
    secondaryColor,
    accentColor: '#ffffff',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl p-6 text-white my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <BadgePreview badge={currentBadge} clubCode={code} size={44} />
            <div>
              <h2 className="text-xl font-bold text-white">Kulüp & Arma Düzenleyici</h2>
              <p className="text-xs text-slate-400">Kurgusal kulübünüzün kimliğini ve görsel armasını özelleştirin</p>
            </div>
          </div>
          <button
            onClick={handleRandomize}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-semibold text-amber-400 transition"
          >
            🎲 Rastgele Oluştur
          </button>
        </div>

        {validation.warning && (
          <div className="mb-4 p-3 bg-amber-950/60 border border-amber-500/50 rounded-lg text-xs text-amber-300">
            ⚠️ {validation.warning}
          </div>
        )}

        {validation.error && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-lg text-xs text-rose-300">
            ❌ {validation.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Club Info Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kulüp Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                placeholder="Örn: Kuzey Fırtınası FK"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kısaltma (3 Harf)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
                  placeholder="KZF"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teknik Direktör</label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Kulüp Renkleri</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ana Renk</span>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {DEFAULT_COLORS.slice(0, 10).map((c) => (
                      <button
                        key={`p-${c}`}
                        type="button"
                        onClick={() => setPrimaryColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border ${primaryColor === c ? 'border-white scale-110 shadow-sm' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">İkincil Renk</span>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {DEFAULT_COLORS.slice(6, 16).map((c) => (
                      <button
                        key={`s-${c}`}
                        type="button"
                        onClick={() => setSecondaryColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border ${secondaryColor === c ? 'border-white scale-110 shadow-sm' : 'border-transparent'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Customizer */}
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-center py-2">
              <BadgePreview badge={currentBadge} clubCode={code} size={84} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Arma Şekli</label>
              <div className="grid grid-cols-3 gap-1.5">
                {BADGE_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id)}
                    className={`px-2 py-1 text-xs rounded border transition ${shape === s.id ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Desen</label>
              <div className="grid grid-cols-3 gap-1.5">
                {BADGE_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPattern(p.id)}
                    className={`px-2 py-1 text-xs rounded border transition ${pattern === p.id ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amblem / Sembol</label>
              <div className="grid grid-cols-4 gap-1.5">
                {BADGE_EMBLEMS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmblem(e.id)}
                    className={`px-1.5 py-1 text-[11px] rounded border truncate transition ${emblem === e.id ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-semibold' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
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
            disabled={!validation.isValid}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg transition"
          >
            Kaydet & Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
