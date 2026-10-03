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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#C7FF38] border-t-transparent rounded-full animate-spin" />
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
      <div className="max-w-md w-full sc-panel rounded-3xl border border-[#182338] p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00F5A0] to-[#00D4FF]" />

        <div className="w-16 h-16 bg-[#00F5A0]/10 border border-[#00F5A0]/30 rounded-2xl flex items-center justify-center mx-auto text-[#00F5A0] shadow-[0_0_20px_rgba(0,245,160,0.2)]">
          <Swords className="w-8 h-8" />
        </div>

        <div>
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 rounded-lg block w-max mx-auto mb-2">
            // MAÇ MERKEZİ
          </span>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Canlı Maç Motoru
          </h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            {nextMatch
              ? `Sıradaki Karşılaşma: vs ${opponentClub?.name || 'Rakip Takım'}`
              : 'Aktif planlanmış maç bulunmamaktadır.'}
          </p>
        </div>

        {nextMatch ? (
          <Link
            href={`/match/${nextMatch.id}`}
            className="w-full py-3.5 bg-[#00F5A0] text-[#040711] font-mono font-black uppercase text-sm flex items-center justify-center gap-2 hover:bg-[#00F5A0]/90 transition-all rounded-xl shadow-[0_0_20px_rgba(0,245,160,0.3)]"
          >
            <Play className="w-4 h-4 fill-current" />
            Maça Başla
          </Link>
        ) : (
          <Link
            href="/fixtures"
            className="w-full py-3.5 bg-[#0B1323] hover:bg-[#182338] border border-[#182338] text-white font-mono font-bold uppercase text-xs flex items-center justify-center gap-2 rounded-xl transition-all"
          >
            <Calendar className="w-4 h-4" />
            Fikstürü İncele
          </Link>
        )}
      </div>
    </div>
  );
}
