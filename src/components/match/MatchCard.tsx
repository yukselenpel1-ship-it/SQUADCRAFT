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
      className={`p-4 sm:p-5 border transition-all ${
        highlight
          ? 'bg-[#0A1020] border-2 border-[#00F5A0] shadow-xl'
          : 'bg-[#080D1A] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      {/* Top Competition & Date Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase font-black px-1.5 py-0.5 bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30">
            {fixture.competition}
          </span>
          <span className="font-mono text-zinc-400 text-[11px]">HAFTA {fixture.round}</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-[11px]">
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
          <span className="text-[10px] font-mono text-zinc-500 uppercase">EV SAHİBİ</span>
        </div>

        {/* Center Score / VS */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {isFinished ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#040711] border border-zinc-700 shadow-inner">
              <span className="text-xl sm:text-2xl font-mono font-black text-white">{fixture.homeScore}</span>
              <span className="text-zinc-600 font-bold">:</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-white">{fixture.awayScore}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="px-2.5 py-1 bg-[#00F5A0]/10 border border-[#00F5A0]/40 text-[#00F5A0] text-xs font-mono font-black tracking-wider">
                VS
              </span>
              <span className="text-[10px] font-mono text-zinc-400 mt-1">{fixture.time}</span>
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
          <span className="text-[10px] font-mono text-zinc-500 uppercase">DEPLASMAN</span>
        </div>
      </div>

      {/* Footer Info & Match Center Button */}
      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] truncate">
          <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="truncate font-mono">{fixture.stadium || homeClub?.stadium || 'Şehir Stadyumu'}</span>
        </div>

        <Link
          href={`/match/${fixture.id}`}
          className="flex items-center gap-1 font-mono font-bold text-xs uppercase text-[#00F5A0] hover:text-white transition-colors bg-[#00F5A0]/10 hover:bg-[#00F5A0]/20 px-2.5 py-1 border border-[#00F5A0]/30"
        >
          <span>MAÇ MERKEZİ</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
