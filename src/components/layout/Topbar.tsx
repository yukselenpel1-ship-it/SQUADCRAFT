'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { AdvanceProgressModal } from '@/components/career/AdvanceProgressModal';
import { formatDateTurkish } from '@/lib/career/calendar';
import { DailyProcessingResult } from '@/lib/career/types';
import { SquadCraftLogo } from '@/components/ui/SquadCraftLogo';
import {
  Menu,
  Calendar,
  Wallet,
  Bell,
  ArrowRight,
  Swords,
  Search,
  ChevronDown,
  User,
  Gamepad2,
  Trophy,
} from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    userClub,
    currentDate,
    unreadMessageCount,
    advanceDay,
    smartAdvance,
    isMatchDay,
    nextMatch,
    seasonYear,
    seasonNumber,
  } = useGame();

  const [progressResult, setProgressResult] = useState<DailyProcessingResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isDraftMode = pathname.startsWith('/draft');
  const isCareerMode = !isDraftMode && pathname !== '/';

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
    if (searchQuery.trim()) {
      if (isCareerMode) {
        router.push(`/transfers?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/draft?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const managerName = userClub?.managerName || 'Arda Yılmaz';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#070D14]/95 backdrop-blur-md border-b border-[rgba(125,160,175,0.14)] px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
        {/* Left Section: Mobile Menu, Logo & Season Selector */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={onMenuToggle}
            className="p-2 bg-[#09141B] border border-[rgba(125,160,175,0.18)] text-zinc-300 hover:text-white rounded-lg lg:hidden active:scale-95 transition"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo in topbar (hidden on large desktop if sidebar is already visible, but displayed nicely on mobile/tablet) */}
          <div className="lg:hidden flex items-center">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <SquadCraftLogo size="sm" showText={false} />
            </Link>
          </div>

          {/* Season / Context Selector Dropdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#09141B] border border-[rgba(125,160,175,0.18)] text-xs text-zinc-300">
            <span className="font-mono text-[11px] font-bold text-white">
              Sezon {seasonYear || '2026/27'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyuncu, kulüp veya lig ara..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#09141B] border border-[rgba(125,160,175,0.18)] focus:border-[#65F56B]/60 text-xs text-white placeholder-zinc-500 focus:outline-none transition shadow-inner font-sans"
            />
          </form>
        </div>

        {/* Mode Switcher: [Kariyer Modu] [Draft Ligi] */}
        <div className="flex items-center p-1 rounded-xl bg-[#09141B] border border-[rgba(125,160,175,0.18)] shrink-0">
          <Link
            href="/dashboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isCareerMode
                ? 'bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40 shadow-[0_0_10px_rgba(101,245,107,0.15)] font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Kariyer Modu</span>
          </Link>
          <Link
            href="/draft"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              isDraftMode
                ? 'bg-[#65F56B]/20 text-[#65F56B] border border-[#65F56B]/40 shadow-[0_0_10px_rgba(101,245,107,0.15)] font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Draft Ligi</span>
          </Link>
        </div>

        {/* Right Action Icons & Manager Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Notifications Bell */}
          <Link
            href="/inbox"
            className="relative p-2 rounded-lg bg-[#09141B] hover:bg-[#0E1E28] border border-[rgba(125,160,175,0.18)] text-zinc-300 hover:text-white transition"
            title="Gelen Kutusu"
          >
            <Bell className="w-4 h-4 text-zinc-300" />
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-black bg-[#65F56B] text-black rounded-full shadow-[0_0_8px_rgba(101,245,107,0.6)] animate-pulse">
                {unreadMessageCount}
              </span>
            )}
          </Link>

          {/* Career Advance Button (When inside Career Mode) */}
          {isCareerMode && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSingleDayAdvance}
                title="+1 Gün İlerle"
                className="hidden xl:flex items-center px-2.5 py-1.5 rounded-lg bg-[#09141B] hover:bg-[#0E1E28] border border-[rgba(125,160,175,0.2)] text-[11px] font-mono font-bold text-zinc-300 transition"
              >
                +1 GÜN
              </button>

              <button
                onClick={handleSmartAdvance}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition shadow-lg active:scale-95 ${
                  isMatchDay
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40 animate-pulse'
                    : 'bg-gradient-to-r from-[#65F56B] to-[#7BFF70] hover:brightness-110 text-black shadow-[0_0_15px_rgba(101,245,107,0.25)]'
                }`}
              >
                {isMatchDay ? (
                  <>
                    <Swords className="w-3.5 h-3.5" />
                    <span>MAÇA GİT</span>
                  </>
                ) : (
                  <>
                    <span>İLERLE</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Manager Profile Chip */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-[rgba(125,160,175,0.18)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#65F56B]/30 to-[#09141B] border border-[#65F56B]/50 flex items-center justify-center text-xs font-bold text-[#65F56B] overflow-hidden shrink-0 shadow-sm">
              <User className="w-4 h-4 text-[#65F56B]" />
            </div>

            <div className="hidden lg:flex flex-col leading-tight">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">Menajer</span>
              <span className="text-xs font-black italic uppercase text-white tracking-wide truncate max-w-[120px]">
                {managerName}
              </span>
            </div>
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
