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
  ChevronRight,
  Clock,
  Sparkles,
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
    daysUntilNextMatch,
    seasonNumber,
    finances,
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

  const formattedBudget = finances?.transferBudget
    ? `€${(finances.transferBudget / 1_000_000).toFixed(1)}M`
    : '€42.8M';

  return (
    <>
      <header className="sc-career-topbar sticky top-0 z-30 h-[64px] bg-[#090d0a]/98 backdrop-blur-xl border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-3 select-none">
        {/* Left: Mobile Menu + Date / Season Status Module */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 bg-[#0d130f] border border-white/10 text-[#8f9a91] hover:text-[#f3f6f3] rounded-[4px] lg:hidden active:scale-95 transition"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Date & Season Capsule */}
          <div className="flex items-center gap-3 py-1.5 px-3 rounded-[4px] bg-[#0d130f] border border-white/10">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#b7ff35]" />
              <span className="font-barlow font-extrabold text-[15px] uppercase text-[#f3f6f3] tracking-wider leading-none">
                {formatDateTurkish(currentDate)}
              </span>
            </div>

            <span className="hidden sm:inline w-[1px] h-3.5 bg-white/10" />

            <div className="hidden sm:flex items-center gap-1.5 font-ibm text-[11px] text-[#8f9a91]">
              <span className="text-[#f3f6f3] font-bold">SEZON {seasonNumber || 1}</span>
              <span>·</span>
              <span className="text-[#b7ff35] font-semibold">MATCHDAY</span>
            </div>
          </div>

          {/* Next Match Alert Strip */}
          {nextMatch && (
            <Link
              href={isMatchDay ? `/match/${nextMatch.id}` : '/fixtures'}
              className={`hidden md:flex items-center gap-2 py-1.5 px-3 rounded-[4px] border font-ibm text-[11px] transition-all ${
                isMatchDay
                  ? 'bg-[#ff5365]/20 border-[#ff5365] text-[#ff5365] animate-pulse font-bold'
                  : 'bg-[#0d130f] border-white/10 text-[#8f9a91] hover:border-[#b7ff35]/40 hover:text-[#f3f6f3]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>
                {isMatchDay
                  ? 'BUGÜN MAÇ GÜNÜ!'
                  : `NEXT MATCH · ${daysUntilNextMatch ?? 3} GÜN`}
              </span>
            </Link>
          )}
        </div>

        {/* Right: Inbox, Budget, Search & Continue Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick Player Search */}
          <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Oyuncu ara..."
              className="w-40 lg:w-48 bg-[#0d130f] border border-white/10 focus:border-[#b7ff35]/60 rounded-[4px] pl-7 pr-2.5 py-1 text-[11px] text-[#f3f6f3] placeholder-[#8f9a91]/60 focus:outline-none transition-all font-inter"
            />
            <Search className="w-3 h-3 text-[#8f9a91] absolute left-2 pointer-events-none" />
          </form>

          {/* Inbox Counter Module */}
          <Link
            href="/inbox"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[4px] bg-[#0d130f] border border-white/10 hover:border-[#b7ff35]/40 transition-colors"
            title="Gelen Kutusu"
          >
            <Mail className="w-3.5 h-3.5 text-[#8f9a91]" />
            <span className="font-ibm text-[11px] text-[#8f9a91] hidden sm:inline">INBOX</span>
            <span className="font-barlow font-bold text-[13px] text-[#b7ff35]">
              {unreadMessageCount > 0 ? unreadMessageCount : 2}
            </span>
          </Link>

          {/* Budget Display Module */}
          <Link
            href="/finances"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0d130f] border border-white/10 hover:border-[#b7ff35]/40 transition-colors"
            title="Transfer & Maaş Bütçesi"
          >
            <Wallet className="w-3.5 h-3.5 text-[#17e5c2]" />
            <div className="flex items-center gap-1.5 font-ibm text-[11px]">
              <span className="text-[#8f9a91]">BUDGET:</span>
              <span className="font-barlow font-bold text-[14px] text-[#17e5c2]">
                {formattedBudget}
              </span>
            </div>
          </Link>

          {/* Actions: +1 Day & Big Continue > */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <button
              onClick={handleSingleDayAdvance}
              type="button"
              title="1 Gün İlerle"
              className="hidden lg:flex items-center gap-1 px-2.5 py-2 font-ibm text-[11px] font-bold text-[#8f9a91] hover:text-[#f3f6f3] bg-[#0d130f] hover:bg-white/5 border border-white/10 rounded-[3px] transition-colors cursor-pointer active:scale-95 uppercase"
            >
              +1 GÜN
            </button>

            <button
              onClick={handleSmartAdvance}
              type="button"
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-[3px] font-barlow font-extrabold text-[14px] sm:text-[15px] tracking-wider uppercase transition-all cursor-pointer shadow-lg active:scale-95 ${
                isMatchDay
                  ? 'bg-[#ff5365] hover:bg-[#ff3d52] text-white shadow-[0_0_20px_rgba(255,83,101,0.4)] animate-pulse'
                  : 'bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] shadow-[0_0_20px_rgba(183,255,53,0.35)] hover:translate-y-[-1px]'
              }`}
            >
              <span>{isMatchDay ? 'MAÇA GİR' : 'CONTINUE >'}</span>
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
