'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { AdvanceProgressModal } from '@/components/career/AdvanceProgressModal';
import { formatDateTurkish } from '@/lib/career/calendar';
import { DailyProcessingResult } from '@/lib/career/types';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  Menu,
  Calendar,
  Wallet,
  Mail,
  Search,
  Swords,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TopbarProps {
  onMenuToggle: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuToggle }) => {
  const router = useRouter();
  const {
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

  const { language } = useLanguage();
  const isTR = language === 'tr';

  return (
    <>
      <header className="sc-career-topbar sticky top-0 z-30 h-[64px] bg-[#070D14]/98 backdrop-blur-xl border-b border-white/[0.08] px-4 lg:px-6 flex items-center justify-between gap-3 select-none">
        {/* Left: Mobile Menu + Date / Season Status Module */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 bg-[#050910] border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] rounded-[2px] lg:hidden active:scale-95 transition cursor-pointer"
            aria-label="Menüyü Aç"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Date & Season Capsule */}
          <div className="flex items-center gap-3 py-1.5 px-3 rounded-[2px] bg-[#050910] border border-white/10 shadow-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#B7FF3C]" />
              <span className="font-condensed font-black text-base uppercase text-[#F2F6FA] tracking-wider leading-none">
                {formatDateTurkish(currentDate)}
              </span>
            </div>

            <span className="hidden sm:inline w-[1px] h-3.5 bg-white/10" />

            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-[#91A2B4]">
              <span className="text-[#F2F6FA] font-bold">SEZON {seasonNumber || 1}</span>
              <span>·</span>
              <span className="text-[#B7FF3C] font-semibold">{isTR ? 'MAÇ GÜNÜ' : 'MATCHDAY'}</span>
            </div>
          </div>

          {/* Next Match Alert Strip */}
          {nextMatch && (
            <Link
              href={isMatchDay ? `/match/${nextMatch.id}` : '/fixtures'}
              className={`hidden md:flex items-center gap-2 py-1.5 px-3 rounded-[2px] border font-mono text-[11px] transition-all cursor-pointer ${
                isMatchDay
                  ? 'bg-[#FF4D5F]/15 border-[#FF4D5F]/40 text-[#FF4D5F] font-bold shadow-[0_0_12px_rgba(255,77,95,0.25)]'
                  : 'bg-[#050910] border-white/10 text-[#91A2B4] hover:border-[#B7FF3C]/40 hover:text-[#F2F6FA]'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-[#B7FF3C]" />
              <span>
                {isMatchDay
                  ? (isTR ? 'BUGÜN MAÇ GÜNÜ!' : 'MATCHDAY TODAY!')
                  : (isTR ? `SIRADAKİ MAÇ · ${daysUntilNextMatch ?? 3} GÜN` : `NEXT MATCH · ${daysUntilNextMatch ?? 3} DAYS`)}
              </span>
            </Link>
          )}
        </div>

        {/* Right: Inbox, Budget, Search & Continue Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Player Search */}
          <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isTR ? 'Oyuncu ara...' : 'Search player...'}
              className="w-40 lg:w-48 bg-[#050910] border border-white/10 focus:border-[#B7FF3C] rounded-[2px] pl-7 pr-2.5 py-1.5 text-xs text-[#F2F6FA] placeholder-[#7A8B9E] focus:outline-none transition-all font-sans"
            />
            <Search className="w-3.5 h-3.5 text-[#7A8B9E] absolute left-2 pointer-events-none" />
          </form>

          {/* Inbox Counter Module */}
          <Link
            href="/inbox"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] bg-[#050910] border border-white/10 hover:border-[#B7FF3C]/40 transition-colors"
            title={isTR ? 'Gelen Kutusu' : 'Inbox'}
          >
            <Mail className="w-3.5 h-3.5 text-[#91A2B4]" />
            <span className="font-mono text-[11px] text-[#91A2B4] hidden sm:inline">{isTR ? 'GELEN' : 'INBOX'}</span>
            <span className="font-condensed font-black text-sm text-[#B7FF3C]">
              {unreadMessageCount > 0 ? unreadMessageCount : 2}
            </span>
          </Link>

          {/* Budget Display Module */}
          <Link
            href="/finances"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-[2px] bg-[#050910] border border-white/10 hover:border-[#B7FF3C]/40 transition-colors"
            title={isTR ? 'Transfer & Maaş Bütçesi' : 'Transfer & Wage Budget'}
          >
            <Wallet className="w-3.5 h-3.5 text-[#38D8FF]" />
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-[#91A2B4]">{isTR ? 'BÜTÇE:' : 'BUDGET:'}</span>
              <span className="font-condensed font-black text-sm text-[#B7FF3C]">
                {formattedBudget}
              </span>
            </div>
          </Link>

          {/* Actions: +1 Day & Big Continue > */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={handleSingleDayAdvance}
              type="button"
              title={isTR ? '1 Gün İlerle' : '+1 Day'}
              className="hidden lg:flex items-center gap-1 px-3 py-2 font-mono text-xs font-bold text-[#91A2B4] hover:text-[#F2F6FA] bg-[#050910] hover:bg-white/[0.05] border border-white/10 rounded-[2px] transition-colors cursor-pointer active:translate-y-0.5 uppercase"
            >
              +1 GÜN
            </button>

            <button
              onClick={handleSmartAdvance}
              type="button"
              className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-[2px] font-condensed font-black text-xs sm:text-sm tracking-wider uppercase transition-all cursor-pointer shadow-lg active:translate-y-0.5 ${
                isMatchDay
                  ? 'bg-[#FF4D5F] hover:bg-[#ff384c] text-white shadow-[0_2px_14px_rgba(255,77,95,0.35)]'
                  : 'bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#070D14] shadow-[0_2px_14px_rgba(183,255,60,0.25)]'
              }`}
            >
              <span>{isMatchDay ? (isTR ? 'MAÇA GİR' : 'ENTER MATCH') : (isTR ? 'DEVAM ET >' : 'CONTINUE >')}</span>
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
