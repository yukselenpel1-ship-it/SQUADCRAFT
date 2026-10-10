'use client';

import React from 'react';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { CareerDifficulty } from '@/lib/career/types';
import { Shield, Target, Wallet, Award, Users, Activity } from 'lucide-react';

interface DossierProps {
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
  clubStats: {
    avgOverall: number;
    avgAge: number;
    starPlayer?: any;
  };
  boardExpectation: {
    target: string;
    desc: string;
  };
  managerProfile: {
    name: string;
    nationality: string;
    age: number | string;
    tacticalStyle: string;
    difficulty: CareerDifficulty;
  };
  leagueSize: 10 | 14 | 18;
}

export function CareerDossier({
  club,
  clubStats,
  boardExpectation,
  managerProfile,
  leagueSize,
}: DossierProps) {
  const difficultyColors = {
    Rahat: { text: 'text-[#38D8FF]', border: 'border-[#38D8FF]/30', bg: 'bg-[#38D8FF]/10' },
    Standart: { text: 'text-[#B7FF3C]', border: 'border-[#B7FF3C]/30', bg: 'bg-[#B7FF3C]/10' },
    Zorlu: { text: 'text-[#FF4D5F]', border: 'border-[#FF4D5F]/30', bg: 'bg-[#FF4D5F]/10' },
  };

  const currentDiff = difficultyColors[managerProfile.difficulty] || difficultyColors.Standart;

  return (
    <div className="bg-[#080E17]/95 border border-white/10 rounded-[4px] p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between gap-5">
      {/* Dossier Header */}
      <div>
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF3C] animate-pulse" />
            <span className="font-mono text-[10px] text-[#7A8B9E] tracking-[0.2em] uppercase font-semibold">
              CANLI KARİYER DOSYASI
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#38D8FF] tracking-wider">
            {leagueSize} KULÜP
          </span>
        </div>

        {/* Club Crest & Title Showcase */}
        <div className="relative flex flex-col items-center justify-center p-5 bg-[#050910] rounded-[3px] border border-white/[0.08] overflow-hidden group">
          {/* Subtle club primary accent glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at center, ${club.primaryColor || '#B7FF3C'}, transparent 70%)`,
            }}
          />

          <div className="transform transition-transform duration-300 group-hover:scale-105 z-10 my-1">
            <ClubBadge
              code={club.code}
              name={club.name}
              clubId={club.id}
              primaryColor={club.primaryColor}
              secondaryColor={club.secondaryColor}
              size="xl"
            />
          </div>

          <span className="font-condensed font-black text-xl lg:text-2xl text-[#F2F6FA] uppercase tracking-wider mt-3 text-center leading-tight z-10">
            {club.name}
          </span>
          <span className="font-mono text-xs text-[#7A8B9E] mt-0.5 z-10">
            {club.city}
          </span>
        </div>
      </div>

      {/* Key Metric Rows */}
      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* Board Target */}
        <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
          <span className="text-[#7A8B9E] flex items-center gap-1.5">
            <Target size={13} className="text-[#B7FF3C]" />
            <span>HEDEF:</span>
          </span>
          <span className="font-condensed font-bold text-sm text-[#B7FF3C] uppercase tracking-wide">
            {boardExpectation.target}
          </span>
        </div>

        {/* Squad Rating */}
        <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
          <span className="text-[#7A8B9E] flex items-center gap-1.5">
            <Activity size={13} className="text-[#38D8FF]" />
            <span>KADRO GÜCÜ:</span>
          </span>
          <span className="font-bold text-[#F2F6FA]">
            {clubStats.avgOverall} OVR
          </span>
        </div>

        {/* Transfer Budget */}
        <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
          <span className="text-[#7A8B9E] flex items-center gap-1.5">
            <Wallet size={13} className="text-[#B7FF3C]" />
            <span>BÜTÇE:</span>
          </span>
          <span className="font-bold text-[#B7FF3C]">
            €{(club.transferBudget / 1_000_000).toFixed(1)}M
          </span>
        </div>

        {/* Reputation */}
        <div className="flex items-center justify-between py-2 border-b border-white/[0.05]">
          <span className="text-[#7A8B9E] flex items-center gap-1.5">
            <Award size={13} className="text-[#FFC84A]" />
            <span>İTİBAR:</span>
          </span>
          <span className="font-bold text-[#FFC84A]">
            %{club.reputation}
          </span>
        </div>
      </div>

      {/* Manager Summary Card */}
      <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-[3px] flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#7A8B9E] uppercase tracking-wider">
            ATANAN MENAJER
          </span>
          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] border ${currentDiff.border} ${currentDiff.bg} ${currentDiff.text}`}>
            {managerProfile.difficulty.toUpperCase()}
          </span>
        </div>

        <div className="font-condensed font-bold text-base text-[#F2F6FA] uppercase tracking-wide">
          {managerProfile.name || 'Steve'} ({managerProfile.nationality}, {managerProfile.age})
        </div>

        <div className="font-mono text-[11px] text-[#38D8FF] flex items-center gap-1">
          <span>STİL:</span>
          <span className="font-semibold">{managerProfile.tacticalStyle}</span>
        </div>
      </div>

      {/* Board Quote */}
      <div className="p-3 bg-[#050910] border border-white/[0.05] rounded-[3px] font-sans text-xs text-[#91A2B4] italic leading-relaxed">
        &ldquo;{boardExpectation.desc}&rdquo;
      </div>
    </div>
  );
}
