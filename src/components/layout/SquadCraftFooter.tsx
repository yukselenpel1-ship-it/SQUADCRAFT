'use client';

import React from 'react';

export function SquadCraftFooter() {
  return (
    <footer className="w-full bg-[#050806] border-t border-[#b7ff35]/30 py-12 px-6 sm:px-12 lg:px-16 select-none">
      <div className="max-w-[1500px] mx-auto flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[3px] bg-[#0d1611] border border-[#b7ff35]/60 flex items-center justify-center">
              <span className="font-barlow font-extrabold text-[15px] text-[#b7ff35]">SC</span>
            </div>
            <span className="font-barlow font-extrabold text-[22px] text-[#f2f5f2] tracking-wider uppercase">
              SQUAD<span className="text-[#b7ff35]">CRAFT</span>
            </span>
          </div>

          {/* Center Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 font-ibm text-[12px] text-[#8b958d]">
            <a href="#career-preview" className="hover:text-[#b7ff35] transition-colors">CAREER</a>
            <a href="#draft-preview" className="hover:text-[#b7ff35] transition-colors">DRAFT</a>
            <a href="#tactics" className="hover:text-[#b7ff35] transition-colors">FEATURES</a>
            <a href="#league" className="hover:text-[#b7ff35] transition-colors">LEAGUE</a>
            <a href="#manager" className="hover:text-[#b7ff35] transition-colors">COMMUNITY</a>
          </div>

          {/* Right Slogan */}
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest uppercase font-semibold">
            BUILT FOR FOOTBALL THINKERS.
          </span>
        </div>

        {/* Bottom copyright & disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 font-ibm text-[11px] text-[#8b958d]">
          <span>© 2026 SQUADCRAFT. ALL FICTIONAL CLUB & PLAYER ASSETS RESERVED.</span>
          <span>NEXT-GEN 3D WEB SPORTS SIMULATION PLATFORM</span>
        </div>
      </div>
    </footer>
  );
}
