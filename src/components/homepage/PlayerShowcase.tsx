'use client';

import React from 'react';
import { PlayerCard3D } from '@/components/three/PlayerCard3D';

export function PlayerShowcase() {
  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 overflow-hidden select-none">
      <div className="max-w-[1500px] mx-auto text-center mb-8">
        <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.25em] uppercase font-semibold">
          ASSET INSPECTION
        </span>
        <h2
          className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
          style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
        >
          3D PLAYER CARD ARCHITECTURE
        </h2>
        <p className="font-inter text-[16px] text-[#8b958d] mt-2 max-w-lg mx-auto">
          Hover and tilt the cursor across the holographic carbon composite card to inspect attributes, chemistry, and market valuation.
        </p>
      </div>

      <PlayerCard3D />
    </section>
  );
}
