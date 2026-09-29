'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { AdvanceProgressModal } from '@/components/career/AdvanceProgressModal';
import { formatDateTurkish } from '@/lib/career/calendar';
import { DailyProcessingResult } from '@/lib/career/types';
import {
  Menu,
  Calendar,
  Wallet,
  Bell,
  ArrowRight,
  Swords,
  Radio,
} from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const router = useRouter();
  const {
    userClub,
    currentDate,
    unreadMessageCount,
    advanceDay,
    smartAdvance,
    isMatchDay,
    nextMatch,
    seasonStage,
  } = useGame();

  const [progressResult, setProgressResult] = useState<DailyProcessingResult | null>(null);

  const handleSmartAdvance = () => {
    if (isMatchDay && nextMatch) {
      router.push(`/match/${nextMatch.id}`);
      return;
    }
    const res = smartAdvance(30);
    setProgressResult(res);
  };

  const handleSingleDayAdvance = () => {
    if (isMatchDay && nextMatch) {
      router.push(`/match/${nextMatch.id}`);
      return;
    }
    const res = advanceDay();
    setProgressResult(res);
  };

  const stageLabels: Record<string, string> = {
    PRE_SEASON: 'Sezon Öncesi',
    REGULAR_SEASON: 'Lig Sezonu',
    SEASON_END: 'Sezon Sonu',
    OFF_SEASON: 'Tatil / Ara Dönem',
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-[#070A0F] border-b border-zinc-800 px-4 lg:px-8 flex items-center justify-between">
        {/* Left: Mobile Toggle & Date Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-1.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white lg:hidden active:scale-95 transition"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current Date Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span className="font-black italic uppercase text-white tracking-wide">
              {formatDateTurkish(currentDate)}
            </span>
            <span className="hidden sm:inline-block text-[10px] text-zinc-400 font-mono">
              // {stageLabels[seasonStage] || 'LİG'}
            </span>
          </div>

          {/* Match Day Alert Pill */}
          {isMatchDay && nextMatch && (
            <Link
              href={`/match/${nextMatch.id}`}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-950 border border-red-600 text-red-300 text-xs font-black italic uppercase animate-pulse shadow-md"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>BUGÜN MAÇ GÜNÜ</span>
            </Link>
          )}
        </div>

        {/* Right Info Bars & Advance CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Club Balance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-xs">
            <Wallet className="w-3.5 h-3.5 text-[#00F5A0]" />
            <div className="flex items-center gap-1 font-mono">
              <span className="text-zinc-400 text-[11px] font-bold">BÜTÇE:</span>
              <span className="font-black text-[#00F5A0]">
                €{(userClub.transferBudget / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>

          {/* Inbox Notification Bell */}
          <Link
            href="/inbox"
            className="relative p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            title="Gelen Kutusu"
          >
            <Bell className="w-4 h-4" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-red-600 text-white animate-pulse">
                {unreadMessageCount}
              </span>
            )}
          </Link>

          {/* +1 GÜN İLERLE */}
          <button
            onClick={handleSingleDayAdvance}
            title="1 Gün İlerle"
            className="px-3 py-1.5 font-bold text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 transition-colors hidden sm:flex items-center gap-1 active:scale-95 uppercase font-mono"
          >
            <span>+1 GÜN</span>
          </button>

          {/* İLERLE or MAÇA GİT (Smart Advance) */}
          <button
            onClick={handleSmartAdvance}
            className={`group relative flex items-center gap-1.5 px-4 sm:px-6 py-2 font-black text-xs sm:text-sm uppercase tracking-wider shadow-md active:scale-95 transition-all ${
              isMatchDay
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/40 animate-pulse'
                : 'bg-[#00F5A0] hover:bg-[#00D68B] text-black shadow-emerald-950/40'
            }`}
          >
            {isMatchDay ? (
              <>
                <Swords className="w-4 h-4 text-white" />
                <span>MAÇA GİT</span>
              </>
            ) : (
              <>
                <span>İLERLE</span>
                <ArrowRight className="w-4 h-4 stroke-[3] transform group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </header>

      {/* Advance Progress Modal */}
      {progressResult && (
        <AdvanceProgressModal
          result={progressResult}
          onClose={() => setProgressResult(null)}
        />
      )}
    </>
  );
};
