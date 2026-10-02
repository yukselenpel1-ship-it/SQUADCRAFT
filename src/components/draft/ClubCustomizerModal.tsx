import React, { useState } from 'react';
import { DraftClub, BadgeShape, BadgePattern, BadgeEmblem } from '@/lib/draft/types';
import { BadgePreview } from './BadgePreview';
import { BADGE_SHAPES, BADGE_PATTERNS, BADGE_EMBLEMS, DEFAULT_COLORS, generateRandomBadgeConfig } from '@/lib/draft/badgeGenerator';
import { validateDraftClub, FICTIONAL_CLUB_PRESETS } from '@/lib/draft/clubValidation';
import { Dices, Palette, Shield, Sparkles, Check, X, AlertTriangle, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative bg-[#0B0F19] border border-white/10 rounded-3xl w-full max-w-2xl shadow-2xl p-6 sm:p-8 text-white my-8 overflow-hidden">
        {/* Decorative ambient lighting */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: secondaryColor }}
        />

        {/* Modal Header */}
        <div className="relative flex items-center justify-between border-b border-white/[0.08] pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-1.5 rounded-2xl bg-black/50 border border-white/10 shadow-inner">
              <BadgePreview badge={currentBadge} clubCode={code} size={48} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">
                  Kulüp & Arma Düzenleyici
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-[#C7FF38] border border-emerald-500/40 uppercase">
                  SQUADCRAFT HD
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kulüp kimliği, renkler, forma arması ve teknik direktör bilgileri
              </p>
            </div>
          </div>

          <button
            onClick={handleRandomize}
            className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-amber-500/40 rounded-xl text-xs font-bold text-amber-400 transition flex items-center gap-1.5 shadow-sm"
          >
            <Dices className="w-4 h-4" />
            <span className="hidden sm:inline">Rastgele</span>
          </button>
        </div>

        {validation.warning && (
          <div className="mb-4 p-3.5 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{validation.warning}</span>
          </div>
        )}

        {validation.error && (
          <div className="mb-4 p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validation.error}</span>
          </div>
        )}

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Club Info Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Kulüp Adı
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                placeholder="Örn: Kuzey Fırtınası FK"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Kısaltma (3 Harf)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={4}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-emerald-400 font-mono font-black uppercase tracking-widest focus:outline-none focus:border-emerald-500 transition"
                  placeholder="KZF"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teknik Direktör
                </label>
                <input
                  type="text"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Kulüp Renk Paleti
              </label>
              <div className="space-y-3 bg-black/40 p-3.5 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Ana Renk</span>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {DEFAULT_COLORS.slice(0, 10).map((c) => (
                      <button
                        key={`p-${c}`}
                        type="button"
                        onClick={() => setPrimaryColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border transition transform ${primaryColor === c ? 'border-white scale-125 shadow-md shadow-black' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-semibold text-slate-400">İkincil Renk</span>
                  <div className="flex items-center gap-1.5 flex-wrap max-w-[200px]">
                    {DEFAULT_COLORS.slice(6, 16).map((c) => (
                      <button
                        key={`s-${c}`}
                        type="button"
                        onClick={() => setSecondaryColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border transition transform ${secondaryColor === c ? 'border-white scale-125 shadow-md shadow-black' : 'border-transparent hover:scale-110'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Badge Customizer */}
          <div className="space-y-4 bg-black/50 p-4 sm:p-5 rounded-2xl border border-white/[0.08]">
            <div className="flex flex-col items-center justify-center py-2 space-y-2">
              <div className="p-2 rounded-2xl bg-black/60 border border-white/10 shadow-xl">
                <BadgePreview badge={currentBadge} clubCode={code} size={84} />
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
                {name || 'Kulüp Arması'} ({code})
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Arma Kalkan Şekli
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BADGE_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShape(s.id)}
                    className={`px-2 py-1.5 text-xs rounded-xl border transition ${shape === s.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Desen Modeli
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {BADGE_PATTERNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPattern(p.id)}
                    className={`px-2 py-1.5 text-xs rounded-xl border transition ${pattern === p.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Amblem & Sembol
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {BADGE_EMBLEMS.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setEmblem(e.id)}
                    className={`px-1.5 py-1.5 text-[11px] rounded-xl border truncate transition ${emblem === e.id ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-sm' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'}`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition"
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            disabled={!validation.isValid}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>KAYDET & UYGULA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
