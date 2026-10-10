'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { AdvanceProgressModal } from '@/components/career/AdvanceProgressModal';
import { useLanguage } from '@/lib/context/LanguageContext';
import type { DailyProcessingResult } from '@/lib/career/types';

export const Topbar: React.FC<{onMenuToggle?: () => void}> = () => {
  const router = useRouter();
  const { currentDate, unreadMessageCount, advanceDay, smartAdvance, isMatchDay, nextMatch, daysUntilNextMatch, seasonNumber, finances } = useGame();
  const { language } = useLanguage();
  const tr = language === 'tr';
  const [progressResult, setProgressResult] = useState<DailyProcessingResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const handleSmartAdvance = () => {
    if (isMatchDay && nextMatch) { router.push(`/match/${nextMatch.id}`); return; }
    setProgressResult(smartAdvance(30));
  };
  const handleSingleDayAdvance = () => {
    if (isMatchDay && nextMatch) { router.push(`/match/${nextMatch.id}`); return; }
    setProgressResult(advanceDay());
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) router.push(`/transfers?search=${encodeURIComponent(searchTerm.trim())}`);
  };
  const budget = typeof finances?.transferBudget === 'number'
    ? new Intl.NumberFormat(tr ? 'tr-TR' : 'en-GB', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(finances.transferBudget)
    : '—';
  return <>
    <div className="border-b border-[#cec5b9] bg-[#e8e0d5] text-[#322d29]">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-8 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-5 font-ibm text-[10px] sm:text-[11px] uppercase tracking-wider">
          <span className="font-bold">{currentDate || '—'}</span>
          <span className="text-[#756b62]">{tr ? 'SEZON' : 'SEASON'} {seasonNumber || 1}</span>
          {nextMatch && <Link href={isMatchDay ? `/match/${nextMatch.id}` : '/fixtures'} className="text-[#a3262c] hover:underline">{isMatchDay ? (tr?'MAÇ GÜNÜ':'MATCHDAY') : `${daysUntilNextMatch ?? '—'} ${tr?'GÜN SONRA':'DAYS'}`}</Link>}
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <form onSubmit={handleSearchSubmit} className="hidden xl:block">
            <label htmlFor="career-search" className="sr-only">{tr?'Oyuncu ara':'Search player'}</label>
            <input id="career-search" placeholder={tr?'Oyuncu ara…':'Search player…'} value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-36 bg-transparent border-b border-[#8c8075] text-xs py-1 focus:outline-none focus:border-[#a3262c]"/>
          </form>
          <Link href="/inbox" className="text-xs font-bold uppercase hover:text-[#a3262c]">{tr?'POSTA':'INBOX'} {unreadMessageCount > 0 ? `(${unreadMessageCount})` : ''}</Link>
          <Link href="/finances" className="hidden sm:inline text-xs font-bold hover:text-[#a3262c]">{budget}</Link>
          <button type="button" onClick={handleSingleDayAdvance} className="border border-[#9e9185] px-3 py-2 font-barlow font-extrabold text-sm uppercase hover:bg-[#d7c9b8]">+1 {tr?'GÜN':'DAY'}</button>
          <button type="button" onClick={handleSmartAdvance} className="bg-[#a3262c] px-5 py-2 text-white font-barlow font-black uppercase text-sm hover:bg-[#751a20]">{isMatchDay ? (tr?'MAÇA GİR':'ENTER MATCH') : (tr?'DEVAM ET →':'CONTINUE →')}</button>
        </div>
      </div>
    </div>
    {progressResult && <AdvanceProgressModal result={progressResult} onClose={()=>setProgressResult(null)}/>}
  </>;
};
