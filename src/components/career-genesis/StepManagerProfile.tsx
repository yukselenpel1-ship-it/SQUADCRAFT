'use client';

import React from 'react';
import { CareerDifficulty } from '@/lib/career/types';
import { User, Check, ShieldAlert, Sparkles, Compass } from 'lucide-react';

interface Step1Props {
  managerName: string;
  setManagerName: (val: string) => void;
  nationality: string;
  setNationality: (val: string) => void;
  age: number | string;
  setAge: (val: number | string) => void;
  tacticalStyle: string;
  setTacticalStyle: (val: string) => void;
  difficulty: CareerDifficulty;
  setDifficulty: (val: CareerDifficulty) => void;
  nationalities: string[];
  tacticalStyles: { id: string; name: string; desc: string }[];
}

export function StepManagerProfile({
  managerName,
  setManagerName,
  nationality,
  setNationality,
  age,
  setAge,
  tacticalStyle,
  setTacticalStyle,
  difficulty,
  setDifficulty,
  nationalities,
  tacticalStyles,
}: Step1Props) {
  const difficultyOptions: {
    id: CareerDifficulty;
    title: string;
    sub: string;
    desc: string;
    color: string;
    borderColor: string;
    badgeBg: string;
  }[] = [
    {
      id: 'Rahat',
      title: 'RELAXED',
      sub: 'Rahat & Hızlı',
      desc: '+%25 Bonus bütçe, sabırlı yönetim kurulu ve ivmeli genç oyuncu gelişimi.',
      color: 'text-[#38D8FF]',
      borderColor: 'border-[#38D8FF]',
      badgeBg: 'bg-[#38D8FF]/15',
    },
    {
      id: 'Standart',
      title: 'STANDARD',
      sub: 'Dengeli & Gerçekçi',
      desc: 'Resmi lig standartları, dengeli transfer pazarı ve dinamik yapay zekâ rekabeti.',
      color: 'text-[#B7FF3C]',
      borderColor: 'border-[#B7FF3C]',
      badgeBg: 'bg-[#B7FF3C]/15',
    },
    {
      id: 'Zorlu',
      title: 'HARDCORE',
      sub: 'Kıran Kırana',
      desc: 'Kısıtlı transfer bütçesi, sıfır hata toleranslı yönetim ve agresif rakip taktikler.',
      color: 'text-[#FF4D5F]',
      borderColor: 'border-[#FF4D5F]',
      badgeBg: 'bg-[#FF4D5F]/15',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <span className="font-mono text-xs text-[#B7FF3C] tracking-[0.2em] uppercase font-semibold">
          ADIM 01 // MENAJER KİMLİĞİ VE VİZYON
        </span>
        <h2 className="font-condensed font-black text-3xl sm:text-4xl text-[#F2F6FA] uppercase tracking-wide leading-none mt-1.5">
          MENAJER PROFİLİNİ OLUŞTUR
        </h2>
        <p className="font-sans text-sm text-[#91A2B4] mt-2 max-w-2xl leading-relaxed">
          Kariyerinin temellerini at. Saha kenarındaki kimliğini, taktiksel felsefeni ve lig mücadele zorluğunu belirle.
        </p>
      </div>

      {/* Inputs Grid */}
      <div className="space-y-4">
        {/* Manager Name */}
        <div>
          <label className="font-mono text-xs uppercase text-[#91A2B4] block mb-1.5 font-semibold tracking-wider">
            MENAJER ADI & SOYADI
          </label>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Örn: Steve Vance"
            className="w-full bg-[#050910] border border-white/10 focus:border-[#B7FF3C] px-4 py-3 rounded-[3px] text-[#F2F6FA] font-sans text-base outline-none transition-all focus:bg-[#070D16] focus:shadow-[0_0_15px_rgba(183,255,60,0.15)]"
          />
        </div>

        {/* Nationality & Age */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-mono text-xs uppercase text-[#91A2B4] block mb-1.5 font-semibold tracking-wider">
              UYRUK
            </label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full bg-[#050910] border border-white/10 focus:border-[#B7FF3C] px-3.5 py-3 rounded-[3px] text-[#F2F6FA] font-sans text-sm outline-none transition-all cursor-pointer focus:bg-[#070D16]"
            >
              {nationalities.map((n) => (
                <option key={n} value={n} className="bg-[#070D14] text-[#F2F6FA]">
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-xs uppercase text-[#91A2B4] block mb-1.5 font-semibold tracking-wider">
              YAŞ (21 - 75)
            </label>
            <input
              type="number"
              min={21}
              max={75}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-[#050910] border border-white/10 focus:border-[#B7FF3C] px-4 py-3 rounded-[3px] text-[#F2F6FA] font-mono text-base outline-none transition-all focus:bg-[#070D16] focus:shadow-[0_0_15px_rgba(183,255,60,0.15)]"
            />
          </div>
        </div>

        {/* Tactical Philosophy */}
        <div>
          <label className="font-mono text-xs uppercase text-[#91A2B4] block mb-1.5 font-semibold tracking-wider">
            TAKTIKSEL FELSEFE
          </label>
          <select
            value={tacticalStyle}
            onChange={(e) => setTacticalStyle(e.target.value)}
            className="w-full bg-[#050910] border border-white/10 focus:border-[#B7FF3C] px-3.5 py-3 rounded-[3px] text-[#F2F6FA] font-sans text-sm outline-none transition-all cursor-pointer focus:bg-[#070D16]"
          >
            {tacticalStyles.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#070D14] text-[#F2F6FA]">
                {t.name} — {t.desc}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selection Cards */}
        <div className="pt-3">
          <label className="font-mono text-xs uppercase text-[#91A2B4] block mb-2 font-semibold tracking-wider">
            KARİYER ZORLUK SEVİYESİ
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {difficultyOptions.map((item) => {
              const isSelected = difficulty === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setDifficulty(item.id)}
                  className={`p-4 rounded-[4px] border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? `${item.borderColor} ${item.badgeBg} shadow-[0_4px_24px_rgba(0,0,0,0.6)]`
                      : 'border-white/10 bg-[#050910] hover:border-white/20 hover:bg-[#070D14]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-condensed font-black text-xl uppercase tracking-wide ${item.color}`}>
                        {item.title}
                      </span>
                      {isSelected && <Check size={16} className={item.color} />}
                    </div>
                    <div className="font-mono text-[10px] text-[#91A2B4] uppercase tracking-wider">
                      {item.sub}
                    </div>
                    <p className="font-sans text-xs text-[#91A2B4] mt-2.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
