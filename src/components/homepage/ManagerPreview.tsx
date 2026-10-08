'use client';

import React from 'react';
import { Trophy } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  SpotlightCard,
  AnimatedCounter,
} from '@/components/ui/react-bits';

export function ManagerPreview() {
  const { language } = useLanguage();

  const trophies = [
    { title: language === 'tr' ? 'LİG ŞAMPİYONLUĞU' : 'LEAGUE CHAMPION', season: '2027/28', club: 'KALYON DORUK SK', tier: 'GOLD' },
    { title: language === 'tr' ? 'KITASAL KUPA' : 'CONTINENTAL CUP', season: '2026/27', club: 'KALYON DORUK SK', tier: 'PLATINUM' },
    { title: language === 'tr' ? 'SÜPER KUPA' : 'DOMESTIC SUPER CUP', season: '2027/28', club: 'KALYON DORUK SK', tier: 'SILVER' },
    { title: language === 'tr' ? 'DRAFT ŞAMPİYONU' : 'DRAFT INVITATIONAL', season: 'SEZON 01', club: 'KALYON DORUK SK', tier: 'LIME' },
  ];

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#b7ff35] tracking-[0.2em] uppercase font-semibold">
            <DecryptedText
              text={language === 'tr' ? 'MİRAS & BAŞARILAR // PROFİL' : 'LEGACY & HONOURS // DOSSIER'}
              speed={28}
              maxIterations={10}
              animateOn="view"
            />
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1 uppercase"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            {language === 'tr' ? 'MENAJER PROFİLİ & KUPA ODASI' : 'MANAGER PROFILE & TROPHY ROOM'}
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            {language === 'tr'
              ? 'Taktiksel kilometre taşlarını, kişisel kariyer ödüllerini ve kupa vitrinini incele.'
              : 'Track tactical milestones, personal career accolades, and silverware cabinet.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Manager Dossier Card (5 cols) */}
          <div className="lg:col-span-5">
            <SpotlightCard
              spotlightColor="rgba(183, 255, 53, 0.12)"
              className="bg-[#090d0a] border border-white/10 rounded-[8px] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden h-full"
            >
              <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                <Trophy size={180} />
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-full bg-[#b7ff35]/20 border border-[#b7ff35] flex items-center justify-center font-barlow font-extrabold text-[24px] text-[#b7ff35]">
                    ST
                  </div>
                  <div>
                    <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest block uppercase">
                      {language === 'tr' ? 'TEKNİK DİREKTÖR // SÖZLEŞMELİ' : 'HEAD COACH // CONTRACTED'}
                    </span>
                    <h3 className="font-barlow font-extrabold text-[32px] text-[#f2f5f2] leading-none">
                      STEVE
                    </h3>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 font-ibm my-6">
                  <div className="p-4 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[#8b958d] text-[11px] block uppercase">
                      {language === 'tr' ? 'YÖNETİLEN SEZON' : 'SEASONS MANAGED'}
                    </span>
                    <span className="font-barlow font-extrabold text-[32px] text-[#f2f5f2]">
                      <AnimatedCounter value={3} duration={1} />
                    </span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[#8b958d] text-[11px] block uppercase">
                      {language === 'tr' ? 'KAZANILAN KUPA' : 'TROPHIES WON'}
                    </span>
                    <span className="font-barlow font-extrabold text-[32px] text-[#b7ff35]">
                      <AnimatedCounter value={4} duration={1} />
                    </span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[#8b958d] text-[11px] block uppercase">
                      {language === 'tr' ? 'GALİBİYET ORANI' : 'CAREER WIN RATE'}
                    </span>
                    <span className="font-barlow font-extrabold text-[32px] text-[#17e5c2]">
                      <AnimatedCounter value={68} suffix="%" duration={1.2} />
                    </span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-[4px] border border-white/5">
                    <span className="text-[#8b958d] text-[11px] block uppercase">
                      {language === 'tr' ? 'İTİBAR' : 'REPUTATION'}
                    </span>
                    <span className="font-barlow font-extrabold text-[28px] text-[#65ff83]">
                      ELİTE
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 font-ibm text-[12px] text-[#8b958d] flex justify-between items-center">
                <span>{language === 'tr' ? 'FELSEFE: TOPA SAHİP OLMA & PRES' : 'PHILOSOPHY: POSSESSION PRESS'}</span>
                <span className="text-[#b7ff35] font-semibold">{language === 'tr' ? 'TOPLAM 96 MAÇ' : '96 MATCHES TOTAL'}</span>
              </div>
            </SpotlightCard>
          </div>

          {/* Trophy Pedestals Showcase (7 cols) - Designated Static Rest Zone */}
          <div className="lg:col-span-7 bg-[#090d0a] border border-white/10 rounded-[8px] p-8 shadow-xl">
            <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider block mb-6">
              {language === 'tr' ? 'VİTRİN // KUPA KOLEKSİYONU' : 'CABINET // PEDESTAL EXHIBITION'}
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {trophies.map((trophy, idx) => (
                <div
                  key={idx}
                  className="group bg-[#060a07] border border-white/10 hover:border-[#b7ff35]/50 rounded-[6px] p-6 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-2px] cursor-pointer shadow-lg relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Trophy
                      size={28}
                      className={
                        trophy.tier === 'GOLD'
                          ? 'text-[#ffc84a]'
                          : trophy.tier === 'PLATINUM'
                          ? 'text-[#17e5c2]'
                          : 'text-[#b7ff35]'
                      }
                    />
                    <span className="font-ibm text-[10px] text-[#8b958d] bg-white/5 px-2 py-0.5 rounded">
                      {trophy.season}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-barlow font-extrabold text-[22px] text-[#f2f5f2] tracking-wide uppercase leading-tight group-hover:text-[#b7ff35] transition-colors">
                      {trophy.title}
                    </h4>
                    <span className="font-ibm text-[11px] text-[#8b958d] mt-1 block">
                      {trophy.club}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
