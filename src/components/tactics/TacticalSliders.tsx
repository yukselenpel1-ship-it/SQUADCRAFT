import React, { useState } from 'react';
import {
  Formation,
  TacticalSettings as TacticalSettingsType,
  Mentality,
  Tempo,
  Pressing,
  PassingStyle,
  DefensiveLine,
  Width,
} from '@/types/game';
import { Sliders, Shield, Zap, Target, Gauge, Wind, MoveHorizontal } from 'lucide-react';

interface TacticalSlidersProps {
  formation: Formation;
  settings: TacticalSettingsType;
  onFormationChange: (f: Formation) => void;
  onSettingsChange: (settings: Partial<TacticalSettingsType>) => void;
}

interface FormationMeta {
  id: Formation;
  label: string;
  sublabel: string;
  category: '4_DEF' | '3_DEF' | '5_DEF';
}

export const TacticalSliders: React.FC<TacticalSlidersProps> = ({
  formation,
  settings,
  onFormationChange,
  onSettingsChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<'ALL' | '4_DEF' | '3_DEF' | '5_DEF'>('ALL');

  const formationCatalog: FormationMeta[] = [
    // 4 Savunma Sistemleri
    { id: '4-2-3-1', label: '4-2-3-1', sublabel: 'Modern', category: '4_DEF' },
    { id: '4-3-3', label: '4-3-3', sublabel: 'Kanat', category: '4_DEF' },
    { id: '4-4-2', label: '4-4-2', sublabel: 'Klasik', category: '4_DEF' },
    { id: '4-1-2-1-2', label: '4-1-2-1-2', sublabel: 'Baklava', category: '4_DEF' },
    { id: '4-3-2-1', label: '4-3-2-1', sublabel: 'Ağaç', category: '4_DEF' },
    { id: '4-2-2-2', label: '4-2-2-2', sublabel: 'Çift 10', category: '4_DEF' },
    { id: '4-1-4-1', label: '4-1-4-1', sublabel: 'Kompakt', category: '4_DEF' },
    { id: '4-2-4', label: '4-2-4', sublabel: 'Hücum', category: '4_DEF' },
    // 3 Savunma Sistemleri
    { id: '3-5-2', label: '3-5-2', sublabel: 'Kanat Bek', category: '3_DEF' },
    { id: '3-4-3', label: '3-4-3', sublabel: 'Geniş', category: '3_DEF' },
    { id: '3-4-2-1', label: '3-4-2-1', sublabel: 'Amorim', category: '3_DEF' },
    { id: '3-4-1-2', label: '3-4-1-2', sublabel: 'Çift Forvet', category: '3_DEF' },
    // 5 Savunma Sistemleri
    { id: '5-3-2', label: '5-3-2', sublabel: 'Kontra', category: '5_DEF' },
    { id: '5-2-3', label: '5-2-3', sublabel: 'Geçiş', category: '5_DEF' },
  ];

  const filteredFormations = formationCatalog.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.category === filterCategory;
  });

  const mentalities: Mentality[] = ['Çok Savunmacı', 'Savunmacı', 'Dengeli', 'Hücum', 'Aşırı Hücum'];
  const tempos: Tempo[] = ['Çok Düşük', 'Düşük', 'Standart', 'Yüksek', 'Çok Yüksek'];
  const pressings: Pressing[] = ['Hafif', 'Orta', 'Yoğun', 'Aşırı'];
  const passingStyles: PassingStyle[] = ['Kısa', 'Karışık', 'Doğrudan', 'Uzun'];
  const defensiveLines: DefensiveLine[] = ['Çok Derin', 'Derin', 'Standart', 'Yüksek', 'Çok Yüksek'];
  const widths: Width[] = ['Dar', 'Dengeli', 'Geniş'];

  return (
    <div className="space-y-4">
      {/* Formation Selector Hub */}
      <div className="sc-panel p-4 sm:p-5 rounded-2xl border border-[#14233A] shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#14233A] pb-2.5">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#00F5A0]" />
            Diziliş Seçimi <span className="text-[10px] text-zinc-500 font-mono">// FORMATION ({formationCatalog.length})</span>
          </label>
          <span className="text-xs font-mono font-bold text-[#00F5A0] bg-[#00F5A0]/10 px-2 py-0.5 rounded border border-[#00F5A0]/30">
            {formation}
          </span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#040814] p-1 rounded-lg border border-[#14233A]">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all ${
              filterCategory === 'ALL'
                ? 'bg-[#00F5A0] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1B33]'
            }`}
          >
            Tümü ({formationCatalog.length})
          </button>
          <button
            onClick={() => setFilterCategory('4_DEF')}
            className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all ${
              filterCategory === '4_DEF'
                ? 'bg-[#00F5A0] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1B33]'
            }`}
          >
            4&apos;lü (8)
          </button>
          <button
            onClick={() => setFilterCategory('3_DEF')}
            className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all ${
              filterCategory === '3_DEF'
                ? 'bg-[#00F5A0] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1B33]'
            }`}
          >
            3&apos;lü (4)
          </button>
          <button
            onClick={() => setFilterCategory('5_DEF')}
            className={`flex-1 py-1 text-[10px] font-mono font-bold uppercase rounded transition-all ${
              filterCategory === '5_DEF'
                ? 'bg-[#00F5A0] text-black font-black'
                : 'text-zinc-400 hover:text-white hover:bg-[#0E1B33]'
            }`}
          >
            5&apos;li (2)
          </button>
        </div>

        {/* Formation Buttons Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
          {filteredFormations.map((item) => {
            const isSelected = formation === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onFormationChange(item.id)}
                className={`py-2 px-1.5 text-center rounded-lg transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[#00F5A0] text-black font-black border-2 border-white shadow-lg scale-[1.02]'
                    : 'bg-[#040814] text-zinc-300 hover:bg-[#0E1B33] border border-[#14233A]'
                }`}
              >
                <span className="text-xs font-mono font-black tracking-tight">{item.label}</span>
                <span
                  className={`text-[9px] font-mono uppercase tracking-wider ${
                    isSelected ? 'text-black/80 font-bold' : 'text-zinc-500'
                  }`}
                >
                  {item.sublabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tactical Instructions Grid */}
      <div className="sc-panel p-4 sm:p-5 rounded-2xl border border-[#14233A] shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#14233A] pb-2.5">
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00F5A0]" />
            Taktiksel Talimatlar <span className="text-[10px] text-zinc-500 font-mono">// TEAM INSTRUCTIONS</span>
          </h3>
          <span className="text-[10px] font-mono text-zinc-400">TACTICAL ENGINE v2.0</span>
        </div>

        {/* 1. Mentalite */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-blue-400" /> Mentalite
            </span>
            <span className="text-[#00F5A0] font-mono font-bold text-xs">{settings.mentality}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 bg-[#040814] p-1 border border-zinc-800">
            {mentalities.map((m) => (
              <button
                key={m}
                onClick={() => onSettingsChange({ mentality: m })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase transition-all truncate ${
                  settings.mentality === m
                    ? 'bg-[#4FE4FF] text-black font-black border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Tempo */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Oyun Temposu
            </span>
            <span className="text-[#00F5A0] font-mono font-bold text-xs">{settings.tempo}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 bg-[#040814] p-1 border border-zinc-800">
            {tempos.map((t) => (
              <button
                key={t}
                onClick={() => onSettingsChange({ tempo: t })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase transition-all truncate ${
                  settings.tempo === t
                    ? 'bg-[#00F5A0] text-black font-black border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Pres Şiddeti */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Pres Yoğunluğu
            </span>
            <span className="text-amber-400 font-mono font-bold text-xs">{settings.pressing}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-[#040814] p-1 border border-zinc-800">
            {pressings.map((p) => (
              <button
                key={p}
                onClick={() => onSettingsChange({ pressing: p })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase transition-all truncate ${
                  settings.pressing === p
                    ? 'bg-amber-400 text-black font-black border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Pas Tarzı */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Wind className="w-3.5 h-3.5 text-sky-400" /> Pas Tarzı
            </span>
            <span className="text-sky-400 font-mono font-bold text-xs">{settings.passingStyle}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-[#040814] p-1 border border-zinc-800">
            {passingStyles.map((ps) => (
              <button
                key={ps}
                onClick={() => onSettingsChange({ passingStyle: ps })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase transition-all truncate ${
                  settings.passingStyle === ps
                    ? 'bg-sky-400 text-black font-black border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Savunma Çizgisi */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Savunma Çizgisi
            </span>
            <span className="text-rose-400 font-mono font-bold text-xs">{settings.defensiveLine}</span>
          </div>
          <div className="grid grid-cols-5 gap-1 bg-[#040814] p-1 border border-zinc-800">
            {defensiveLines.map((dl) => (
              <button
                key={dl}
                onClick={() => onSettingsChange({ defensiveLine: dl })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase transition-all truncate ${
                  settings.defensiveLine === dl
                    ? 'bg-rose-500 text-white font-black border border-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {dl}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Oyun Genişliği */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <MoveHorizontal className="w-3.5 h-3.5 text-purple-400" /> Oyun Genişliği
            </span>
            <span className="text-purple-400 font-mono font-bold text-xs">{settings.width}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-[#040814] p-1 rounded-lg border border-[#14233A]">
            {widths.map((w) => (
              <button
                key={w}
                onClick={() => onSettingsChange({ width: w })}
                className={`py-1.5 px-1 text-[10px] font-bold uppercase rounded transition-all truncate ${
                  settings.width === w
                    ? 'bg-purple-500 text-white font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-[#0E1B33]'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ÖZEL TALİMATLAR (SCREEN 4 MOCKUP) */}
      <div className="sc-panel p-4 sm:p-5 rounded-2xl border border-[#14233A] space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#14233A] pb-2.5">
          <span className="text-xs font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00F5A0]" />
            ÖZEL TALİMATLAR
          </span>
          <span className="text-[10px] font-mono text-zinc-400">TACTICAL TOGGLES</span>
        </div>

        <div className="space-y-3 pt-1">
          {/* Toggle 1: Ofsayt Taktiği */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#07101C] border border-[#14233A]">
            <div>
              <div className="text-xs font-bold text-white uppercase">Ofsayt Taktiği</div>
              <div className="text-[10px] text-zinc-400">Savunma hattı senkronize öne fırlar</div>
            </div>
            <label className="sc-toggle">
              <input type="checkbox" defaultChecked />
              <span className="sc-toggle-slider" />
            </label>
          </div>

          {/* Toggle 2: Duran Toplar */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#07101C] border border-[#14233A]">
            <div>
              <div className="text-xs font-bold text-white uppercase">Duran Toplar</div>
              <div className="text-[10px] text-zinc-400">Korner ve serbest vuruşlarda ceza sahasına yığılma</div>
            </div>
            <label className="sc-toggle">
              <input type="checkbox" defaultChecked />
              <span className="sc-toggle-slider" />
            </label>
          </div>

          {/* Toggle 3: Kaleciden Oyun Kurma */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#07101C] border border-[#14233A]">
            <div>
              <div className="text-xs font-bold text-white uppercase">Kaleciden Oyun Kurma</div>
              <div className="text-[10px] text-zinc-400">Stoperler açılır, kısa pasla çıkılır</div>
            </div>
            <label className="sc-toggle">
              <input type="checkbox" defaultChecked />
              <span className="sc-toggle-slider" />
            </label>
          </div>

          {/* Toggle 4: Kanatları Kullan */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#07101C] border border-[#14233A]">
            <div>
              <div className="text-xs font-bold text-white uppercase">Kanatları Kullan</div>
              <div className="text-[10px] text-zinc-400">Bekler hücuma katılır, çizgiye inilir</div>
            </div>
            <label className="sc-toggle">
              <input type="checkbox" />
              <span className="sc-toggle-slider" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
