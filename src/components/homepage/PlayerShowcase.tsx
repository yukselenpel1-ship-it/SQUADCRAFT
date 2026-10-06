'use client';

import React from 'react';
import { PlayerCard3D } from '@/components/three/PlayerCard3D';
import { useLanguage } from '@/lib/context/LanguageContext';

export function PlayerShowcase() {
  const { t } = useLanguage();

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 overflow-hidden select-none">
      <div className="max-w-[1500px] mx-auto text-center mb-8">
        <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.25em] uppercase font-semibold">
          {t.playerShowcaseBadge}
        </span>
        <h2
          className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
          style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
        >
          {t.playerShowcaseTitle}
        </h2>
        <p className="font-inter text-[16px] text-[#8b958d] mt-2 max-w-lg mx-auto">
          {t.playerShowcaseDesc}
        </p>
      </div>

      <PlayerCard3D />
    </section>
  );
}
