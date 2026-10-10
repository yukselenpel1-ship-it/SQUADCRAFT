'use client';

import React from 'react';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { CareerDifficulty } from '@/lib/career/types';
import { CheckCircle2, Shield, Sparkles, Award, FileText } from 'lucide-react';

interface Step5Props {
  club: {
    id: string;
    name: string;
    code: string;
    city: string;
    transferBudget: number;
    reputation: number;
    primaryColor: string;
    secondaryColor: string;
  };
  managerProfile: {
    name: string;
    nationality: string;
    age: number | string;
    tacticalStyle: string;
    difficulty: CareerDifficulty;
  };
  leagueSize: 10 | 14 | 18;
  boardExpectation: {
    target: string;
    desc: string;
  };
}

export function StepConfirmation({
  club,
  managerProfile,
  leagueSize,
  boardExpectation,
}: Step5Props) {
  const leagueNameMap: Record<number, string> = {
    10: 'ALVERIA ELİT LİGİ (18 HAFTA)',
    14: 'ALVERIA PREMIER LİGİ (26 HAFTA)',
    18: 'ALVERIA SÜPER LİGİ (34 HAFTA)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="font-mono text-xs text-[#B7FF3C] tracking-[0.2em] uppercase font-semibold">
          ADIM 05 // RESMİ SÖZLEŞME VE ONAY
        </span>
        <h2 className="font-condensed font-black text-3xl sm:text-4xl text-[#F2F6FA] uppercase tracking-wide leading-none mt-1.5">
          MENAJERLİK SÖZLEŞMESİ HAZIR
        </h2>
        <p className="font-sans text-sm text-[#91A2B4] mt-1.5 max-w-xl">
          Tüm şartlar ve kulüp hedefleri belirlendi. Resmi sözleşmeyi gözden geçirip kariyerini başlatabilirsin.
        </p>
      </div>

      {/* Cinematic Contract Certificate Card */}
      <div className="p-6 rounded-[4px] bg-[#050910] border-2 border-white/10 relative overflow-hidden shadow-2xl">
        {/* Subtle watermark crest */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-8 translate-y-8 scale-150">
          <ClubBadge
            code={club.code}
            name={club.name}
            clubId={club.id}
            primaryColor={club.primaryColor}
            secondaryColor={club.secondaryColor}
            size="xl"
          />
        </div>

        {/* Contract Top Banner */}
        <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3.5">
            <ClubBadge
              code={club.code}
              name={club.name}
              clubId={club.id}
              primaryColor={club.primaryColor}
              secondaryColor={club.secondaryColor}
              size="lg"
            />
            <div>
              <span className="font-condensed font-black text-2xl text-[#F2F6FA] uppercase tracking-wider block leading-none">
                {club.name}
              </span>
              <span className="font-mono text-xs text-[#38D8FF] uppercase tracking-wider mt-1 block">
                RESMİ ATAMA PROTOKOLÜ // 2026/27 SEZONU
              </span>
            </div>
          </div>

          <div className="hidden sm:flex flex-col text-right font-mono">
            <span className="text-[10px] text-[#7A8B9E] tracking-wider uppercase">LİG DÜZENİ</span>
            <span className="text-xs font-bold text-[#F2F6FA]">{leagueNameMap[leagueSize]}</span>
          </div>
        </div>

        {/* Terms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          {/* Manager Block */}
          <div className="p-3.5 rounded-[3px] bg-white/[0.02] border border-white/[0.06] space-y-2">
            <span className="text-[10px] text-[#7A8B9E] tracking-widest uppercase block font-semibold">
              ATANAN TEKNİK DİREKTÖR
            </span>
            <div className="font-condensed font-black text-lg text-[#F2F6FA] uppercase tracking-wide">
              {managerProfile.name || 'Steve'}
            </div>
            <div className="text-[#91A2B4] flex items-center justify-between">
              <span>UYRUK / YAŞ:</span>
              <span className="text-[#F2F6FA] font-bold">{managerProfile.nationality}, {managerProfile.age} Yaş</span>
            </div>
            <div className="text-[#91A2B4] flex items-center justify-between">
              <span>TAKTIKSEL FELSEFE:</span>
              <span className="text-[#38D8FF] font-bold">{managerProfile.tacticalStyle}</span>
            </div>
          </div>

          {/* Board Terms Block */}
          <div className="p-3.5 rounded-[3px] bg-white/[0.02] border border-white/[0.06] space-y-2">
            <span className="text-[10px] text-[#7A8B9E] tracking-widest uppercase block font-semibold">
              YÖNETİM KURULU ŞARTLARI
            </span>
            <div className="font-condensed font-black text-lg text-[#B7FF3C] uppercase tracking-wide">
              {boardExpectation.target}
            </div>
            <div className="text-[#91A2B4] flex items-center justify-between">
              <span>TRANSFER BÜTÇESİ:</span>
              <span className="text-[#B7FF3C] font-bold">
                €{(club.transferBudget / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <div className="text-[#91A2B4] flex items-center justify-between">
              <span>ZORLUK MODU:</span>
              <span className="text-[#FFC84A] font-bold uppercase">{managerProfile.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Board Pledge */}
        <div className="mt-4 p-3 rounded-[3px] bg-[#080E17] border border-white/[0.06] font-sans text-xs text-[#91A2B4] italic leading-relaxed">
          &ldquo;{boardExpectation.desc}&rdquo; — {club.name} Yönetim Kurulu
        </div>
      </div>
    </div>
  );
}
