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
  Mail,
  Search,
  ChevronDown,
  ArrowRight,
  Swords,
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
    seasonNumber,
  } = useGame();

  const [progressResult, setProgressResult] = useState<DailyProcessingResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/transfers?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-14 bg-[#050B14]/95 backdrop-blur-xl border-b border-[#14233A] px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Date Indicator (Exact to Mockup) */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-1.5 bg-[#07101C] border border-[#14233A] text-zinc-300 hover:text-white rounded-lg lg:hidden active:scale-95 transition"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current Date Display Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-[#07101C] border border-[#14233A] rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-[#00F5A0]" />
            <span className="font-black italic uppercase text-white tracking-wide text-[11px] sm:text-xs">
              {formatDateTurkish(currentDate)}
            </span>
            <span className="text-[10px] text-[#8E9EB5] font-mono">
              / Süper Lig • {seasonNumber || 1}. Sezon
            </span>
          </div>

          {/* Match Day Alert Pill */}
          {isMatchDay && nextMatch && (
            <Link
              href={`/match/${nextMatch.id}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-500 text-red-200 text-xs font-black italic uppercase rounded-lg animate-pulse shadow-md"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>BUGÜN MAÇ GÜNÜ</span>
            </Link>
          )}
        </div>

        {/* Right Info Bars, Search & Manager Profile (Exact to Mockup) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Oyuncu ara..."
              className="w-44 lg:w-56 bg-[#07101C] border border-[#14233A] focus:border-[#00D4FF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#51647E] focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-[#51647E] absolute left-2.5 pointer-events-none" />
          </form>

          {/* Mail Button */}
          <Link
            href="/inbox"
            className="p-2 bg-[#07101C] hover:bg-[#0E1E38] border border-[#14233A] text-zinc-300 hover:text-white rounded-xl transition-colors"
            title="Gelen Kutusu"
          >
            <Mail className="w-4 h-4 text-[#8E9EB5]" />
          </Link>

          {/* Notification Bell */}
          <Link
            href="/inbox"
            className="relative p-2 bg-[#07101C] hover:bg-[#0E1E38] border border-[#14233A] text-zinc-300 hover:text-white rounded-xl transition-colors"
            title="Bildirimler"
          >
            <Bell className="w-4 h-4 text-[#8E9EB5]" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-black bg-rose-600 text-white rounded-full">
              {unreadMessageCount > 0 ? unreadMessageCount : 23}
            </span>
          </Link>

          {/* Manager Profile Pill */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2">
            <div className="w-8 h-8 rounded-full border border-[#00F5A0]/40 overflow-hidden bg-[#07101C] flex items-center justify-center text-xs font-black text-[#00F5A0]">
              <span>{userClub.managerName?.[0] || 'O'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 cursor-pointer">
              <span className="text-xs font-bold text-white tracking-tight">
                {userClub.managerName || 'Oğuzhan K.'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#51647E]" />
            </div>
          </div>

          {/* Quick Day Advance Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#14233A]">
            <button
              onClick={handleSingleDayAdvance}
              title="1 Gün İlerle"
              className="px-2.5 py-1.5 font-bold text-[11px] bg-[#07101C] hover:bg-[#0E1E38] text-zinc-300 border border-[#14233A] rounded-xl transition-colors hidden xl:flex items-center gap-1 active:scale-95 uppercase font-mono"
            >
              <span>+1 GÜN</span>
            </button>

            <button
              onClick={handleSmartAdvance}
              className={`flex items-center gap-1 px-3.5 py-1.5 font-black text-xs uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all ${
                isMatchDay
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 animate-pulse'
                  : 'bg-[#00F5A0] hover:bg-[#00E590] text-[#050B14] shadow-[0_0_12px_rgba(0,245,160,0.3)]'
              }`}
            >
              <span>{isMatchDay ? 'MAÇ' : 'İLERLE'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
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
