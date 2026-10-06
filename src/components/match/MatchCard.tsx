import React from 'react';
import Link from 'next/link';
import { Fixture, Club } from '@/types/game';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { Calendar, MapPin, Play, Clock, ChevronRight } from 'lucide-react';

interface MatchCardProps {
  fixture: Fixture;
  homeClub?: Club;
  awayClub?: Club;
  highlight?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  fixture,
  homeClub,
  awayClub,
  highlight = false,
}) => {
  const isFinished = fixture.status === 'FINISHED';

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl transition-all ${
        highlight
          ? 'bg-[#090d0a] border-2 border-[#b7ff35] shadow-[0_0_25px_rgba(183, 255, 53,0.2)]'
          : 'sc-panel hover:border-[#1E2E4A]'
      }`}
    >
      {/* Top Competition & Date Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-ibm text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-[#b7ff35]/10 text-[#b7ff35] border border-[#b7ff35]/30">
            {fixture.competition}
          </span>
          <span className="font-ibm text-zinc-400 text-[11px]">HAFTA {fixture.round}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 font-ibm text-[11px]">
          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
          <span>{fixture.date} • {fixture.time}</span>
        </div>
      </div>

      {/* Clubs & Scoreboard */}
      <div className="py-4 grid grid-cols-7 items-center gap-2">
        {/* Home Club */}
        <div className="col-span-3 flex flex-col items-center text-center">
          {homeClub && (
            <ClubBadge
              code={homeClub.code}
              primaryColor={homeClub.primaryColor}
              secondaryColor={homeClub.secondaryColor}
              size="md"
            />
          )}
          <span className="mt-2 text-xs sm:text-sm font-black text-white truncate max-w-full uppercase tracking-tight">
            {homeClub ? homeClub.name : 'Ev Sahibi'}
          </span>
          <span className="text-[10px] font-ibm text-zinc-500 uppercase">EV SAHİBİ</span>
        </div>

        {/* Center Score / VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {isFinished ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#050806] border border-white/10 shadow-inner">
              <span className="text-xl sm:text-2xl font-ibm font-black text-white">{fixture.homeScore}</span>
              <span className="text-zinc-600 font-bold">:</span>
              <span className="text-xl sm:text-2xl font-ibm font-black text-white">{fixture.awayScore}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="px-2.5 py-1 rounded-lg bg-[#b7ff35]/10 border border-[#b7ff35]/40 text-[#b7ff35] text-xs font-ibm font-black tracking-wider">
                VS
              </span>
              <span className="text-[10px] font-ibm text-zinc-400 mt-1">{fixture.time}</span>
            </div>
          )}
        </div>

        {/* Away Club */}
        <div className="col-span-3 flex flex-col items-center text-center">
          {awayClub && (
            <ClubBadge
              code={awayClub.code}
              primaryColor={awayClub.primaryColor}
              secondaryColor={awayClub.secondaryColor}
              size="md"
            />
          )}
          <span className="mt-2 text-xs sm:text-sm font-black text-white truncate max-w-full uppercase tracking-tight">
            {awayClub ? awayClub.name : 'Deplasman'}
          </span>
          <span className="text-[10px] font-ibm text-zinc-500 uppercase">DEPLASMAN</span>
        </div>
      </div>

      {/* Footer Info & Match Center Button */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] truncate">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="truncate font-ibm">{fixture.stadium || homeClub?.stadium || 'Şehir Stadyumu'}</span>
        </div>

        <Link
          href={`/match/${fixture.id}`}
          className="flex items-center gap-1 font-ibm font-bold text-xs uppercase text-[#b7ff35] hover:text-white transition-colors bg-[#b7ff35]/10 hover:bg-[#b7ff35]/20 px-3 py-1.5 rounded-xl border border-[#b7ff35]/30"
        >
          <span>MAÇ MERKEZİ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
