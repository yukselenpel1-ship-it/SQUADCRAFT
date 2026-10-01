'use client';

import React from 'react';
import Image from 'next/image';
import { ClubBadge } from './ClubBadge';
import { Trophy, Calendar, MapPin, Users, Award, Shield, Sparkles } from 'lucide-react';

export interface CareerClubHeroProps {
  clubName: string;
  clubCode?: string;
  primaryColor?: string;
  secondaryColor?: string;
  tagline?: string;
  leagueName?: string;
  seasonLabel?: string;
  foundedYear?: number | string;
  location?: string;
  stadiumName?: string;
  capacity?: number | string;
  reputation?: number;
  managerName?: string;
  watermarkText?: string;
  className?: string;
  actions?: React.ReactNode;
}

export const CareerClubHero: React.FC<CareerClubHeroProps> = ({
  clubName,
  clubCode = 'KDO',
  primaryColor = '#65F56B',
  secondaryColor = '#09141B',
  tagline = 'Daha Büyük Hedeflere',
  leagueName = 'Süper Lig',
  seasonLabel = 'Sezon 2026/27',
  foundedYear = '2024',
  location = 'Kocaeli, Türkiye',
  stadiumName = 'Kartepe Stadyumu',
  capacity = '32.000',
  reputation,
  managerName,
  watermarkText = 'SINIR YOK DAHA FAZLASI VAR',
  className = '',
  actions,
}) => {
  const formattedCapacity = typeof capacity === 'number' ? capacity.toLocaleString('tr-TR') : capacity;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#071018] via-[#0A1620] to-[#060D14] border border-[rgba(125,160,175,0.18)] shadow-2xl p-5 sm:p-6 lg:p-7 ${className}`}
    >
      {/* Stadium atmospheric background with dark overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-30 mix-blend-luminosity"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      />
      {/* High-contrast gradient vignette */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#071018]/95 via-[#0A1620]/80 to-[#071018]/90" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050B10] via-transparent to-transparent opacity-80" />

      {/* Top Right Watermark Quote */}
      <div className="absolute top-4 right-6 pointer-events-none select-none hidden md:flex flex-col items-end opacity-20">
        <span className="text-xl lg:text-2xl font-black italic tracking-tighter uppercase text-white font-sans">
          {watermarkText}
        </span>
        <div className="h-0.5 w-24 bg-gradient-to-l from-[#65F56B] to-transparent mt-1" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Club Badge with glowing aura */}
          <div className="relative shrink-0 flex items-center justify-center p-2.5 rounded-2xl bg-[#09141B]/90 border border-[rgba(125,160,175,0.25)] shadow-[0_0_25px_rgba(101,245,107,0.15)] group">
            <ClubBadge
              code={clubCode}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              size="xl"
            />
          </div>

          {/* Club Name & Meta Info */}
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#65F56B]">
                KARİYER MODU • {seasonLabel.toUpperCase()}
              </span>
              {reputation !== undefined && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#65F56B]/10 text-[#65F56B] border border-[#65F56B]/30">
                  ★ %{reputation} İTİBAR
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tight text-white leading-none truncate font-sans">
              {clubName}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 font-medium tracking-wide">
              {tagline}
            </p>

            {/* Information Chips Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-zinc-300">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0D1C26]/90 border border-[rgba(125,160,175,0.18)]">
                <Trophy className="w-3 h-3 text-[#65F56B]" />
                <span className="font-bold text-white">{leagueName}</span>
              </div>

              {foundedYear && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0D1C26]/90 border border-[rgba(125,160,175,0.18)]">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <span>Kuruluş {foundedYear}</span>
                </div>
              )}

              {location && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0D1C26]/90 border border-[rgba(125,160,175,0.18)]">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  <span>{location}</span>
                </div>
              )}

              {stadiumName && (
                <div className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0D1C26]/90 border border-[rgba(125,160,175,0.18)]">
                  <Shield className="w-3 h-3 text-zinc-400" />
                  <span>{stadiumName}</span>
                  {capacity && <span className="text-zinc-500">({formattedCapacity})</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action slot or custom controls */}
        {actions && (
          <div className="relative z-10 shrink-0 flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
