'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

interface HeaderProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function CareerGenesisHeader({ currentStep }: HeaderProps) {
  const stepTitles = [
    'MENAJER KİMLİĞİ',
    'LİG FORMATI',
    'KULÜP TERCİHİ',
    'SEZON PARAMETRELERİ',
    'RESMİ SÖZLEŞME & ONAY',
  ];

  return (
    <header className="relative z-20 w-full border-b border-white/[0.08] bg-[#070D14]/90 backdrop-blur-md px-4 sm:px-6 lg:px-12 py-3.5 safe-area-top transition-colors">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Return & Brand Lockup */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#91A2B4] hover:text-[#F2F6FA] text-xs font-mono font-medium uppercase tracking-wider transition-all cursor-pointer"
            aria-label="Ana Menüye Dön"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">ANA MENÜ</span>
          </Link>

          <div className="h-5 w-[1px] bg-white/10 hidden sm:block" />

          {/* Franchise Crest & Identity */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 bg-[#09111C] border border-white/15 rounded-[3px] shadow-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#B7FF3C] [clip-path:polygon(0_0,100%_0,100%_100%)]" />
              <span className="font-condensed font-black text-base text-[#F2F6FA]">SC</span>
            </div>
            <div className="flex flex-col">
              <span className="font-condensed font-black text-lg sm:text-xl text-[#F2F6FA] tracking-[0.06em] uppercase leading-none">
                CAREER GENESIS
              </span>
              <span className="font-mono text-[9px] text-[#91A2B4] tracking-[0.18em] uppercase leading-none mt-1">
                THE BEGINNING OF A LEGACY
              </span>
            </div>
          </div>
        </div>

        {/* Right: Step Indicator & Active Stage */}
        <div className="flex items-center gap-3 sm:gap-4 font-mono text-xs">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[10px] text-[#7A8B9E] tracking-widest uppercase">
              AKTİF AŞAMA
            </span>
            <span className="font-condensed font-bold text-sm text-[#B7FF3C] uppercase tracking-wider">
              {stepTitles[currentStep - 1]}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[#09111C] border border-white/10 text-xs">
            <span className="text-[#91A2B4]">ADIM</span>
            <span className="font-black text-[#B7FF3C]">{currentStep}</span>
            <span className="text-white/20">/</span>
            <span className="text-[#91A2B4]">5</span>
          </div>
        </div>
      </div>
    </header>
  );
}
