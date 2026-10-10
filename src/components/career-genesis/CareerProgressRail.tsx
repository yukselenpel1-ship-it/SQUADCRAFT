'use client';

import React from 'react';
import { Check } from 'lucide-react';

interface ProgressProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onSelectStep: (step: 1 | 2 | 3 | 4 | 5) => void;
  variant?: 'desktop' | 'mobile' | 'both';
}

export const CAREER_STEPS = [
  { num: 1, id: '01', title: 'KİMLİK & VİZYON', sub: 'Menajer Profili & Zorluk' },
  { num: 2, id: '02', title: 'LİG FORMATI', sub: 'Boyut & Maraton Süresi' },
  { num: 3, id: '03', title: 'KULÜP SEÇİMİ', sub: 'Arma, Bütçe & Hedef' },
  { num: 4, id: '04', title: 'SEZON PARAMETRELERİ', sub: 'Takvim & Motor Ayarları' },
  { num: 5, id: '05', title: 'RESMİ SÖZLEŞME', sub: 'Protokol İmza & Başlat' },
] as const;

export function CareerProgressRail({ currentStep, onSelectStep, variant = 'both' }: ProgressProps) {
  const showDesktop = variant === 'desktop' || variant === 'both';
  const showMobile = variant === 'mobile' || variant === 'both';

  return (
    <>
      {/* =========================================================================
          DESKTOP VERTICAL PROGRESS RAIL (Hidden on mobile/tablet)
          ========================================================================= */}
      {showDesktop && (
        <div className="hidden lg:flex flex-col bg-[#080E17]/95 border border-white/10 rounded-[4px] p-4 shadow-2xl backdrop-blur-md">
        <div className="px-3 py-2 font-mono text-[10px] text-[#7A8B9E] uppercase tracking-[0.2em] border-b border-white/[0.06] mb-3 flex items-center justify-between">
          <span>PROTOKOL AŞAMALARI</span>
          <span className="text-[#B7FF3C]">5 FAZ</span>
        </div>

        <div className="flex flex-col gap-2">
          {CAREER_STEPS.map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            const isClickable = isCompleted || s.num <= currentStep;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isClickable) onSelectStep(s.num as any);
                }}
                disabled={!isClickable}
                className={`w-full text-left p-3.5 rounded-[3px] border transition-all duration-200 flex items-center justify-between select-none ${
                  isCurrent
                    ? 'bg-[#B7FF3C]/12 border-[#B7FF3C] text-white shadow-[0_0_20px_rgba(183,255,60,0.18)] cursor-default'
                    : isCompleted
                    ? 'bg-white/[0.02] border-white/10 text-[#C1CEDC] hover:border-white/20 hover:bg-white/[0.05] cursor-pointer'
                    : 'bg-transparent border-transparent text-[#7A8B9E]/40 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-bold text-xs px-2 py-0.5 rounded-[2px] transition-colors ${
                      isCurrent
                        ? 'bg-[#B7FF3C] text-[#070D14]'
                        : isCompleted
                        ? 'bg-[#38D8FF]/20 text-[#38D8FF]'
                        : 'bg-white/5 text-[#7A8B9E]'
                    }`}
                  >
                    {s.id}
                  </span>

                  <div>
                    <div
                      className={`font-condensed font-black text-[15px] uppercase tracking-wide leading-none transition-colors ${
                        isCurrent
                          ? 'text-white'
                          : isCompleted
                          ? 'text-[#C1CEDC]'
                          : 'text-[#7A8B9E]'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className="font-sans text-[11px] text-[#7A8B9E] mt-1 line-clamp-1">
                      {s.sub}
                    </div>
                  </div>
                </div>

                {isCompleted && (
                  <Check size={16} className="text-[#38D8FF] stroke-[2.5] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      )}

      {/* =========================================================================
          MOBILE / TABLET HORIZONTAL PROGRESS INDICATOR
          ========================================================================= */}
      {showMobile && (
        <div className="lg:hidden w-full bg-[#080E17]/95 border border-white/10 rounded-[4px] p-3 mb-4 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="font-mono text-[10px] text-[#7A8B9E] tracking-wider uppercase">
              AŞAMA {currentStep} / 5
            </span>
            <span className="font-condensed font-bold text-xs text-[#B7FF3C] uppercase tracking-wide">
              {CAREER_STEPS[currentStep - 1].title}
            </span>
          </div>

          {/* 5 Progress Bars */}
          <div className="grid grid-cols-5 gap-1.5">
            {CAREER_STEPS.map((s) => {
              const isCurrent = currentStep === s.num;
              const isCompleted = currentStep > s.num;

              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (isCompleted || s.num <= currentStep) {
                      onSelectStep(s.num as any);
                    }
                  }}
                  className={`h-1.5 rounded-[1px] transition-all duration-300 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#B7FF3C] shadow-[0_0_8px_#B7FF3C]'
                      : isCompleted
                      ? 'bg-[#38D8FF]'
                      : 'bg-white/10'
                  }`}
                  title={s.title}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
