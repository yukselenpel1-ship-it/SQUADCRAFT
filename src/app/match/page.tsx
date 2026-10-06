'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import Link from 'next/link';
import { Swords, Calendar, ArrowRight, Play } from 'lucide-react';

export default function MatchIndexPage() {
  const router = useRouter();
  const { nextMatch, userClub, allClubs, isCareerHydrated, isInitialized } = useGame();

  useEffect(() => {
    if (isCareerHydrated && nextMatch) {
      router.replace(`/match/${nextMatch.id}`);
    }
  }, [isCareerHydrated, nextMatch, router]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-ibm text-xs">
        <div className="w-6 h-6 border-2 border-[#b7ff35] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  const opponentClub = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      )
    : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full sc-panel rounded-3xl border border-white/10 p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#b7ff35] to-[#17e5c2]" />

        <div className="w-16 h-16 bg-[#b7ff35]/10 border border-[#b7ff35]/30 rounded-2xl flex items-center justify-center mx-auto text-[#b7ff35] shadow-[0_0_20px_rgba(183, 255, 53,0.2)]">
          <Swords className="w-8 h-8" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 text-[10px] font-ibm font-black uppercase tracking-widest bg-[#b7ff35]/10 text-[#b7ff35] border border-[#b7ff35]/30 rounded-lg block w-max mx-auto mb-2">
            // MAÇ MERKEZİ
          </span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Canlı Maç Motoru
          </h1>
          <p className="text-xs text-zinc-400 font-ibm mt-1">
            {nextMatch
              ? `Sıradaki Karşılaşma: vs ${opponentClub?.name || 'Rakip Takım'}`
              : 'Aktif planlanmış maç bulunmamaktadır.'}
          </p>
        </div>

        {nextMatch ? (
          <Link
            href={`/match/${nextMatch.id}`}
            className="w-full py-3.5 bg-[#b7ff35] text-[#050806] font-ibm font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-[#b7ff35]/90 transition-all rounded-xl shadow-[0_0_20px_rgba(183, 255, 53,0.3)]"
          >
            <Play className="w-4 h-4 fill-current" />
            Maça Başla
          </Link>
        ) : (
          <Link
            href="/fixtures"
            className="w-full py-3.5 bg-[#090d0a] hover:bg-[#141b16] border border-white/10 text-white font-ibm font-bold uppercase text-xs flex items-center justify-center gap-2 rounded-xl transition-all"
          >
            <Calendar className="w-4 h-4" />
            Fikstürü İncele
          </Link>
        )}
      </div>
    </div>
  );
}
