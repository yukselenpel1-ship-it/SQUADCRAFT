'use client';

import React from 'react';

interface BackdropProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  clubPrimaryColor?: string;
}

export function CinematicStadiumBackdrop({ currentStep, clubPrimaryColor }: BackdropProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#05080E]">
      {/* 1. Deep Atmospheric Gradient Layers */}
      <div
        className="absolute inset-0 transition-opacity duration-1000 ease-out"
        style={{
          background: `
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(183, 255, 60, ${0.05 + currentStep * 0.015}), transparent 70%),
            radial-gradient(ellipse 70% 50% at 85% 30%, ${clubPrimaryColor ? `${clubPrimaryColor}18` : 'rgba(56, 216, 255, 0.04)'}, transparent 65%),
            radial-gradient(ellipse 80% 50% at 15% 70%, rgba(15, 34, 56, 0.4), transparent 70%),
            #05080E
          `,
        }}
      />

      {/* 2. Architectural Tunnel Floodlights Horizon (Top of screen) */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#0B1524]/60 to-transparent" />

      {/* 3. Subtle Structural Stadium Grid Lines (Hairline, low-opacity) */}
      <div
        className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:64px_64px]"
        style={{ maskImage: 'radial-gradient(ellipse 80% 50% at 50% 50%, #000 60%, transparent 100%)' }}
      />

      {/* 4. Stadium Floodlight Beams (Step-reactive) */}
      <div className="absolute -top-32 left-1/4 w-96 h-[600px] bg-gradient-to-b from-[#B7FF3C]/[0.08] to-transparent rotate-12 blur-3xl transition-opacity duration-700" />
      <div className="absolute -top-32 right-1/4 w-96 h-[600px] bg-gradient-to-b from-[#38D8FF]/[0.06] to-transparent -rotate-12 blur-3xl transition-opacity duration-700" />

      {/* 5. Linear Floodlight Status Bar at Very Top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] flex gap-1 px-4 sm:px-8 z-10 opacity-80">
        {[1, 2, 3, 4, 5].map((light) => (
          <div
            key={light}
            className={`flex-1 h-full transition-all duration-700 ${
              light <= currentStep
                ? 'bg-[#B7FF3C] shadow-[0_0_12px_#B7FF3C]'
                : 'bg-white/[0.06]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
