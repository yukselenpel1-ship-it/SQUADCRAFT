'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  MagneticButton,
} from '@/components/ui/react-bits';

interface FinalCTAProps {
  onStartCareer: () => void;
  onEnterDraft: () => void;
}

export function FinalCTA({ onStartCareer, onEnterDraft }: FinalCTAProps) {
  const { language } = useLanguage();

  return (
    <section className="relative w-full bg-[#050806] py-32 px-6 sm:px-12 lg:px-16 border-t border-white/10 select-none overflow-hidden text-center">
      {/* 3D Tunnel Light Atmosphere Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(183, 255, 53, 0.35) 0%, rgba(23, 229, 194, 0.15) 30%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.25em] uppercase font-semibold mb-4">
          <DecryptedText
            text={language === 'tr' ? 'MAÇ GÜNÜNE HAZIR // BAŞLANGIÇ' : 'MATCHDAY READY // KICKOFF'}
            speed={30}
            maxIterations={10}
            animateOn="view"
          />
        </span>

        {/* Headline */}
        <h2
          className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.84] tracking-tight uppercase"
          style={{ fontSize: 'clamp(58px, 9vw, 140px)' }}
        >
          {language === 'tr' ? 'SENİN SEZONUN ' : 'YOUR SEASON '}
          <span className="text-outline-lime">
            {language === 'tr' ? 'BURADA BAŞLIYOR.' : 'STARTS HERE.'}
          </span>
        </h2>

        {/* Sub */}
        <p className="font-inter text-[18px] sm:text-[20px] text-[#99a39c] mt-6 max-w-lg mx-auto">
          {language === 'tr'
            ? 'Tek bir kulüp. On sekiz oyuncu. Sonsuz taktiksel ihtimal.'
            : 'One club. Eighteen players. Endless decisions.'}
        </p>

        {/* CTAs with Magnetic Buttons */}
        <div className="flex flex-row flex-wrap items-center justify-center gap-4 mt-10">
          <MagneticButton strength={0.22}>
            <button
              type="button"
              onClick={onStartCareer}
              className="group font-barlow font-bold text-[18px] tracking-wider text-[#050806] bg-[#b7ff35] hover:bg-[#a6f028] h-[54px] px-10 rounded-[3px] flex items-center gap-2.5 transition-colors cursor-pointer shadow-[0_4px_28px_rgba(183,255,53,0.4)] uppercase"
            >
              {language === 'tr' ? 'SQUADCRAFT\'A BAŞLA' : 'START SQUADCRAFT'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </MagneticButton>

          <MagneticButton strength={0.16}>
            <button
              type="button"
              onClick={onEnterDraft}
              className="font-barlow font-bold text-[18px] tracking-wider text-[#f2f5f2] bg-white/[0.04] border border-white/20 hover:border-[#17e5c2] hover:text-[#17e5c2] h-[54px] px-8 rounded-[3px] flex items-center transition-all cursor-pointer hover:bg-white/10 uppercase"
            >
              {language === 'tr' ? 'DRAFT LİGİNE KATIL' : 'PLAY DRAFT LEAGUE'}
            </button>
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}
