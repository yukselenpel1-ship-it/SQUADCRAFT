'use client';

import React from 'react';
import { Trophy, Check, Calendar, Users, Award } from 'lucide-react';

interface Step2Props {
  leagueSize: 10 | 14 | 18;
  setLeagueSize: (val: 10 | 14 | 18) => void;
}

export function StepLeagueSelection({ leagueSize, setLeagueSize }: Step2Props) {
  const leagueStructures = [
    {
      size: 10 as const,
      name: 'ALVERIA ELİT LİGİ',
      subtitle: 'Kompakt & Yüksek Tempolu',
      weeks: '18 Hafta',
      clubsCount: '10 Kulüp',
      desc: 'Her maçın final havasında geçtiği, puan kaybına tahammülü olmayan kompakt maraton. İlk 3 sıra Kıtasal Şampiyona vizesi alır.',
      continental: 'İlk 3 Sıra',
    },
    {
      size: 14 as const,
      name: 'ALVERIA PREMIER LİGİ',
      subtitle: 'Dengeli Klasik Format',
      weeks: '26 Hafta',
      clubsCount: '14 Kulüp',
      desc: 'Taktiksel derinlik ve kadro rotasyonunun belirleyici olduğu standart lig yapısı. İlk 4 sıra Kıtasal Şampiyona ve Eleme vizesi alır.',
      badge: 'ÖNERİLEN',
      continental: 'İlk 4 Sıra',
    },
    {
      size: 18 as const,
      name: 'ALVERIA SÜPER LİGİ',
      subtitle: 'Büyük Lig Maratonu',
      weeks: '34 Hafta',
      clubsCount: '18 Kulüp',
      desc: '34 haftalık zorlu sezon maratonu. Geniş kadro derinliği, transfer başarısı ve dayanıklılık gerektirir. İlk 5 sıra Avrupa/Kıta vizesi alır.',
      continental: 'İlk 5 Sıra',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-xs text-[#38D8FF] tracking-[0.2em] uppercase font-semibold">
          ADIM 02 // LİG FORMATI VE MARATON YAPISI
        </span>
        <h2 className="font-condensed font-black text-3xl sm:text-4xl text-[#F2F6FA] uppercase tracking-wide leading-none mt-1.5">
          LİG FORMATINI BELİRLE
        </h2>
        <p className="font-sans text-sm text-[#91A2B4] mt-2 max-w-2xl leading-relaxed">
          Mücadele edeceğin kurgusal Alveria liginin kulüp sayısını ve sezon maraton uzunluğunu seç.
        </p>
      </div>

      {/* League Selection Cards */}
      <div className="space-y-3.5">
        {leagueStructures.map((l) => {
          const isSelected = leagueSize === l.size;

          return (
            <div
              key={l.size}
              onClick={() => setLeagueSize(l.size)}
              className={`p-5 rounded-[4px] border-2 cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isSelected
                  ? 'bg-[#B7FF3C]/10 border-[#B7FF3C] shadow-[0_4px_24px_rgba(183,255,60,0.18)]'
                  : 'bg-[#050910] border-white/10 hover:border-white/20 hover:bg-[#070D14]'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-[3px] shrink-0 transition-colors ${
                    isSelected ? 'bg-[#B7FF3C] text-[#070D14]' : 'bg-white/[0.04] text-[#91A2B4]'
                  }`}
                >
                  <Trophy size={24} />
                </div>

                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-condensed font-black text-xl sm:text-2xl text-[#F2F6FA] tracking-wide uppercase">
                      {l.name}
                    </span>
                    {l.badge && (
                      <span className="px-2 py-0.5 rounded-[2px] bg-[#B7FF3C] text-[#070D14] font-condensed font-black text-xs uppercase tracking-wider">
                        {l.badge}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-xs text-[#38D8FF] block mt-0.5 font-medium">
                    {l.subtitle}
                  </span>

                  <p className="font-sans text-xs sm:text-sm text-[#91A2B4] mt-2 max-w-xl leading-relaxed">
                    {l.desc}
                  </p>
                </div>
              </div>

              {/* Right Key Metrics */}
              <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-white/[0.06] shrink-0 font-mono">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#F2F6FA]">
                  <Users size={14} className="text-[#91A2B4]" />
                  <span>{l.clubsCount}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#91A2B4] mt-1">
                  <Calendar size={13} className="text-[#38D8FF]" />
                  <span>{l.weeks}</span>
                </div>
                <div className="text-[10px] text-[#B7FF3C] mt-1 font-semibold">
                  Kıtasal: {l.continental}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
