'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Shield } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  SpotlightCard,
  MagneticButton,
  DecryptedText,
} from '@/components/ui/react-bits';

interface ModeSelectorProps {
  onSelectCareer: () => void;
  onSelectDraft: () => void;
}

export function ModeSelector({ onSelectCareer, onSelectDraft }: ModeSelectorProps) {
  const { language } = useLanguage();
  const [draftHovered, setDraftHovered] = useState(false);
  const [careerHovered, setCareerHovered] = useState(false);

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.2em] uppercase font-medium">
            <DecryptedText
              text={language === 'tr' ? 'SEZON MİMARİSİ // PROTOKOL' : 'SEASON ARCHITECTURE // PROTOCOL'}
              speed={28}
              maxIterations={10}
              animateOn="view"
            />
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1 uppercase"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            {language === 'tr' ? 'YOLUNU SEÇ' : 'CHOOSE YOUR PATH'}
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            {language === 'tr' ? 'Her efsanevi sezon tek bir kararla başlar.' : 'Every season begins with a decision.'}
          </p>
        </div>

        {/* Two Asymmetrical Mode Environments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 1. CAREER MODE PANEL (7 cols - Primary Editorial Weight) */}
          <div
            className="lg:col-span-7"
            onMouseEnter={() => setCareerHovered(true)}
            onMouseLeave={() => setCareerHovered(false)}
            onClick={onSelectCareer}
          >
            <SpotlightCard
              spotlightColor="rgba(183, 255, 53, 0.14)"
              className="group relative rounded-[8px] overflow-hidden border border-white/10 hover:border-[#b7ff35]/60 transition-all duration-300 cursor-pointer min-h-[540px] h-full flex flex-col justify-end p-8 sm:p-10 bg-[#090d0a]"
            >
              {/* Visual Environment Background: Stadium Tunnel */}
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <img
                  src="/images/bg-fc-arena.jpg"
                  alt="Career Mode Tactical Arena"
                  className={`w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.2] transition-transform duration-700 ${
                    careerHovered ? 'scale-105 -translate-y-2' : 'scale-100'
                  }`}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, #090d0a 0%, rgba(9,13,10,0.85) 45%, rgba(9,13,10,0.3) 100%)',
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative z-10 flex flex-col items-start">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#b7ff35]/15 border border-[#b7ff35]/35 text-[#b7ff35] font-ibm text-[11px] font-semibold mb-4 tracking-wider uppercase">
                  <Shield size={12} />
                  {language === 'tr' ? 'TAM KULÜP YÖNETİMİ' : 'FULL CLUB TOUCHLINE'}
                </div>

                {/* Title & Sub */}
                <h3 className="font-barlow font-extrabold text-[48px] sm:text-[64px] text-[#f2f5f2] leading-none tracking-tight group-hover:text-[#b7ff35] transition-colors uppercase">
                  {language === 'tr' ? 'KARİYER MODU' : 'CAREER MODE'}
                </h3>
                <p className="font-inter text-[15px] sm:text-[16px] text-[#99a39c] mt-2 max-w-lg">
                  {language === 'tr'
                    ? 'Saha kenarından bir hanedanlık kur. Çok sezonlu derinlik, tam taktiksel egemenlik ve transfer hakimiyeti.'
                    : 'Build a dynasty from the touchline. Multi-season depth with total tactical and transfer sovereignty.'}
                </p>

                {/* Stats badges */}
                <div className="flex flex-wrap gap-2 my-6 font-ibm text-[11px] text-[#8b958d] uppercase">
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'ÇOK SEZONLU' : 'MULTI-SEASON'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'TRANSFERLER' : 'TRANSFERS'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'GÖZLEMCİLİK' : 'SCOUTING'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'ALTYAPI' : 'YOUTH ACADEMY'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? '3D TAKTİK' : 'TACTICAL CONTROL'}</span>
                </div>

                {/* CTA Button */}
                <MagneticButton strength={0.18}>
                  <div className="font-barlow font-bold text-[18px] text-[#050806] bg-[#b7ff35] group-hover:bg-[#a6f028] px-7 py-3.5 rounded-[3px] flex items-center gap-2 shadow-lg transition-transform uppercase cursor-pointer">
                    {language === 'tr' ? 'KARİYERE GİR →' : 'BEGIN CAREER →'}
                  </div>
                </MagneticButton>
              </div>
            </SpotlightCard>
          </div>

          {/* 2. DRAFT LEAGUE PANEL (5 cols - Secondary Focus) */}
          <div
            className="lg:col-span-5"
            onMouseEnter={() => setDraftHovered(true)}
            onMouseLeave={() => setDraftHovered(false)}
            onClick={onSelectDraft}
          >
            <SpotlightCard
              spotlightColor="rgba(23, 229, 194, 0.14)"
              className="group relative rounded-[8px] overflow-hidden border border-white/10 hover:border-[#17e5c2]/60 transition-all duration-300 cursor-pointer min-h-[540px] h-full flex flex-col justify-end p-8 sm:p-10 bg-[#090d0a]"
            >
              {/* Visual Environment */}
              <div className="absolute inset-0 z-0 overflow-hidden flex items-center justify-center pointer-events-none">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 30%, rgba(23,229,194,0.14), transparent 60%), #090d0a',
                  }}
                />

                {/* Floating Draft Player Cards */}
                <div className="absolute top-12 flex items-center justify-center pointer-events-none">
                  {/* Left Card */}
                  <motion.div
                    animate={{
                      x: draftHovered ? -55 : -20,
                      rotate: draftHovered ? -14 : -5,
                      scale: draftHovered ? 0.95 : 0.85,
                    }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    className="w-24 sm:w-28 h-36 sm:h-44 rounded-[8px] bg-[#121a16] border border-[#17e5c2]/40 shadow-xl p-2.5 flex flex-col justify-between"
                  >
                    <span className="font-barlow font-bold text-[22px] text-[#17e5c2]">88</span>
                    <span className="font-barlow text-[13px] text-[#f2f5f2] uppercase font-semibold">POPOV</span>
                    <span className="font-ibm text-[9px] text-[#8b958d]">ST</span>
                  </motion.div>

                  {/* Center Featured Card */}
                  <motion.div
                    animate={{
                      y: draftHovered ? -12 : 0,
                      scale: draftHovered ? 1.05 : 0.98,
                    }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    className="relative z-10 w-28 sm:w-32 h-40 sm:h-48 rounded-[8px] bg-[#16221c] border-2 border-[#b7ff35] shadow-[0_0_24px_rgba(183,255,53,0.3)] p-3 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-barlow font-extrabold text-[28px] text-[#b7ff35] leading-none">91</span>
                      <span className="w-2 h-2 rounded-full bg-[#b7ff35] animate-ping" />
                    </div>
                    <span className="font-barlow text-[16px] text-[#f2f5f2] uppercase font-bold text-center">KIMURA</span>
                    <div className="flex justify-between font-ibm text-[10px] text-[#8b958d]">
                      <span>CM</span>
                      <span className="text-[#b7ff35]">{language === 'tr' ? '1. TUR' : 'ROUND 1'}</span>
                    </div>
                  </motion.div>

                  {/* Right Card */}
                  <motion.div
                    animate={{
                      x: draftHovered ? 55 : 20,
                      rotate: draftHovered ? 14 : 5,
                      scale: draftHovered ? 0.95 : 0.85,
                    }}
                    transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                    className="w-24 sm:w-28 h-36 sm:h-44 rounded-[8px] bg-[#121a16] border border-[#17e5c2]/40 shadow-xl p-2.5 flex flex-col justify-between"
                  >
                    <span className="font-barlow font-bold text-[22px] text-[#17e5c2]">85</span>
                    <span className="font-barlow text-[13px] text-[#f2f5f2] uppercase font-semibold">COSTA</span>
                    <span className="font-ibm text-[9px] text-[#8b958d]">RB</span>
                  </motion.div>
                </div>

                {/* Gradient Bottom Fade */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, #090d0a 0%, rgba(9,13,10,0.85) 45%, transparent 100%)',
                  }}
                />
              </div>

              {/* Information */}
              <div className="relative z-10 flex flex-col items-start">
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#17e5c2]/15 border border-[#17e5c2]/35 text-[#17e5c2] font-ibm text-[11px] font-semibold mb-4 tracking-wider uppercase">
                  <Trophy size={12} />
                  {language === 'tr' ? 'ÇOK OYUNCULU REKABET' : 'LIVE COMPETITION'}
                </div>

                {/* Title & Sub */}
                <h3 className="font-barlow font-extrabold text-[48px] sm:text-[60px] text-[#f2f5f2] leading-none tracking-tight group-hover:text-[#17e5c2] transition-colors uppercase">
                  {language === 'tr' ? 'DRAFT LİGİ' : 'DRAFT LEAGUE'}
                </h3>
                <p className="font-inter text-[15px] sm:text-[16px] text-[#99a39c] mt-2 max-w-md">
                  {language === 'tr'
                    ? 'Rakiplerinden önce hayalindeki 11\'i kur. Arkadaşlarınla veya yapay zeka menajerlerle gerçek zamanlı snake draft heyecanı.'
                    : 'Build your squad before your rivals do. Real-time snake drafts with friends and intelligent AI managers.'}
                </p>

                {/* Stats badges */}
                <div className="flex flex-wrap gap-2 my-6 font-ibm text-[11px] text-[#8b958d] uppercase">
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? '2–4 MENAJER' : '2–4 MANAGERS'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">SNAKE DRAFT</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'CANLI SEÇİMLER' : 'LIVE PICKS'}</span>
                  <span className="px-2.5 py-1 bg-white/5 rounded border border-white/10">{language === 'tr' ? 'LİG SEZONU' : 'LEAGUE SEASON'}</span>
                </div>

                {/* CTA Button */}
                <MagneticButton strength={0.18}>
                  <div className="font-barlow font-bold text-[18px] text-[#050806] bg-[#17e5c2] group-hover:bg-[#34eed0] px-7 py-3.5 rounded-[3px] flex items-center gap-2 shadow-lg transition-transform uppercase cursor-pointer">
                    {language === 'tr' ? 'DRAFT\'A GİR →' : 'ENTER DRAFT →'}
                  </div>
                </MagneticButton>
              </div>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </section>
  );
}
