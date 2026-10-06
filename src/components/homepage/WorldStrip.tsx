'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function WorldStrip() {
  const words = [
    'BUILD THE CLUB',
    'CONTROL THE MARKET',
    'MASTER THE TACTICS',
    'WIN THE TITLE',
    'WRITE THE HISTORY',
  ];

  return (
    <section className="relative w-full bg-[#050806] py-16 overflow-hidden border-t border-b border-white/10 select-none">
      {/* Background Parallax Images layer */}
      <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-between">
        <div className="w-1/3 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b7ff35]/15 via-transparent to-transparent" />
        <div className="w-1/3 h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#17e5c2]/15 via-transparent to-transparent" />
      </div>

      {/* Cinematic Center Typography */}
      <div className="relative z-10 max-w-[1500px] mx-auto px-6 sm:px-12 text-center my-6">
        <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.25em] uppercase font-semibold">
          THE FOOTBALL UNIVERSE
        </span>
        <h2 className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.85] tracking-tight mt-2 text-[52px] sm:text-[84px] md:text-[110px]">
          ONE SEASON. <span className="text-outline">THOUSANDS OF DECISIONS.</span>
        </h2>
      </div>

      {/* Moving Marquee Strip (Section 19: Homepage Feature Strip) */}
      <div className="relative w-full overflow-hidden py-4 border-t border-b border-white/5 bg-[#090d0a]/60 backdrop-blur-sm">
        <div className="flex whitespace-nowrap animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
          {[...words, ...words, ...words].map((phrase, idx) => (
            <div key={idx} className="flex items-center mx-6">
              <span
                className={`font-barlow font-bold text-[26px] sm:text-[34px] tracking-wider uppercase ${
                  idx % 2 === 0 ? 'text-[#f2f5f2]' : 'text-outline-lime'
                }`}
              >
                {phrase}
              </span>
              <span className="mx-6 font-ibm text-[#b7ff35]/40 text-[18px]">//</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
