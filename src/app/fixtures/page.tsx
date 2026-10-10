'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { FifaMatchReportModal } from '@/components/match/FifaMatchReportModal';
import { CareerPageHeader } from '@/components/career/CareerPageHeader';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { Fixture } from '@/types/game';
import {
  Calendar,
  Filter,
  ChevronRight,
  CheckCircle2,
  Clock,
  Swords,
  Play,
  Trophy,
  AlertCircle,
  Eye,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function FixturesPage() {
  const router = useRouter();
  const {
    fixtures,
    allClubs,
    userClub,
    seasonEndSummary,
    startNextSeasonRoll,
    seasonYear,
    nextMatch,
    daysUntilNextMatch,
    isMatchDay,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'MY_CLUB' | 'PLAYED' | 'UPCOMING'>('MY_CLUB');
  const [reportFixture, setReportFixture] = useState<Fixture | null>(null);

  const getClub = (id: string) => allClubs.find((c) => c.id === id) || allClubs[0];

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      if (selectedFilter === 'MY_CLUB') {
        return f.homeClubId === userClub.id || f.awayClubId === userClub.id;
      }
      if (selectedFilter === 'PLAYED') {
        return f.status === 'FINISHED';
      }
      if (selectedFilter === 'UPCOMING') {
        return f.status === 'SCHEDULED';
      }
      return true;
    });
  }, [fixtures, selectedFilter, userClub.id]);

  // Group fixtures into chronological Month / Stage blocks
  const monthlyTimeline = useMemo(() => {
    const groups: { round: number; fixtures: Fixture[] }[] = [];
    const sorted = [...filteredFixtures].sort((a, b) => a.round - b.round);

    // Group by round
    const rounds = Array.from(new Set(sorted.map((f) => f.round)));
    for (const r of rounds) {
      const roundFixtures = sorted.filter((f) => f.round === r);
      groups.push({ round: r, fixtures: roundFixtures });
    }
    return groups;
  }, [filteredFixtures]);

  if (!isCareerHydrated || !isInitialized) {
    return (
      <CareerLoadingState
        title="FİKSTÜR TAKVİMİ YÜKLENİYOR"
        message="Sezon fikstürü, maç haftaları ve karşılaşma sonuçları derleniyor..."
      />
    );
  }

  // Next opponent info for featured strip
  const nextOpponent = nextMatch
    ? allClubs.find(
        (c) => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId)
      ) || allClubs[1]
    : allClubs[1] || allClubs[0];

  const isUserHome = nextMatch ? nextMatch.homeClubId === userClub.id : true;

  const finishedMatchesCount = fixtures.filter(f => f.status === 'FINISHED').length;

  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#161616] px-4 sm:px-8 lg:px-12 py-6 pb-20">
      <div className="mx-auto max-w-[1380px]">
        <header className="border-b-2 border-[#332d29] pb-6">
          <p className="font-ibm text-[11px] uppercase tracking-[0.12em] text-[#9b2529]">
            SQUADCRAFT / {seasonYear || '2026/27'} / {userClub.name}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="font-barlow font-black text-[clamp(2.4rem,5vw,4.2rem)] uppercase tracking-tight leading-none">
                FİKSTÜR<span className="text-[#9b2529]">.</span>
              </h1>
              <p className="mt-2 font-serif italic text-base sm:text-lg text-[#70645a]">
                Sezonun her haftası, tek bir yerde.
              </p>
            </div>
            <div className="flex flex-wrap gap-5 text-sm">
              <div><p className="text-[11px] uppercase tracking-wider text-[#70645a]">Oynanan maç</p><strong className="font-barlow text-3xl">{finishedMatchesCount}</strong></div>
              <div><p className="text-[11px] uppercase tracking-wider text-[#70645a]">Sıradaki hafta</p><strong className="font-barlow text-3xl">{nextMatch?.round ?? '—'}</strong></div>
              <div><p className="text-[11px] uppercase tracking-wider text-[#70645a]">Toplam maç</p><strong className="font-barlow text-3xl">{fixtures.length}</strong></div>
            </div>
          </div>
        </header>

        {nextMatch && nextOpponent && (
          <section aria-label="Sıradaki maç" className="my-6 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-5 items-center border-l-[5px] border-[#9b2529] bg-[#eee4d8] px-5 sm:px-7 py-5">
            <div>
              <p className="font-ibm text-[11px] tracking-widest font-bold text-[#9b2529]">SIRADAKİ MAÇ · HAFTA {nextMatch.round}</p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-3">
                <ClubBadge code={userClub.code} name={userClub.name} clubId={userClub.id} primaryColor={userClub.primaryColor} secondaryColor={userClub.secondaryColor} size="md" />
                <div className="min-w-0">
                  <p className="font-barlow font-extrabold uppercase text-lg sm:text-2xl leading-tight text-[#111111]">{userClub.name} <span className="text-[#9b2529]">vs</span> {nextOpponent.name}</p>
                  <p className="text-sm text-[#655a51] mt-1">{isUserHome ? 'İç saha' : 'Deplasman'} · {nextMatch.date ? new Date(nextMatch.date).toLocaleDateString('tr-TR') : 'Tarih bekleniyor'} · {isUserHome ? userClub.stadium : nextOpponent.stadium}</p>
                </div>
                <ClubBadge code={nextOpponent.code} name={nextOpponent.name} clubId={nextOpponent.id} primaryColor={nextOpponent.primaryColor} secondaryColor={nextOpponent.secondaryColor} size="md" />
              </div>
            </div>
            <button type="button" onClick={() => router.push(`/match/${nextMatch.id}`)}
              className="inline-flex items-center justify-center gap-2 min-h-12 bg-[#9b2529] hover:bg-[#751b21] text-white px-6 py-3 font-barlow font-extrabold uppercase tracking-wide">
              <Play size={17} /> {isMatchDay ? 'MAÇA GİR' : 'MAÇ MERKEZİ'}
            </button>
          </section>
        )}

        <nav aria-label="Maç filtreleri" className="flex gap-2 overflow-x-auto py-3 border-b border-[#c9bdaf] mb-5">
          {([
            ['MY_CLUB', 'KULÜBÜM'],
            ['ALL', 'TÜM LİG'],
            ['UPCOMING', 'YAKLAŞAN'],
            ['PLAYED', 'SONUÇLAR'],
          ] as const).map(([id,label]) => (
            <button key={id} type="button" aria-pressed={selectedFilter === id} onClick={() => setSelectedFilter(id)}
              className={`shrink-0 px-4 py-2.5 min-h-11 font-barlow text-sm font-extrabold uppercase tracking-wide border transition-colors ${selectedFilter === id
                ? 'bg-[#9b2529] text-white border-[#9b2529]'
                : 'bg-transparent text-[#403831] border-[#bfb1a2] hover:bg-[#e8ddd0]'}`}>
              {label}
            </button>
          ))}
          <span className="ml-auto shrink-0 self-center font-ibm text-xs text-[#786e65]">{filteredFixtures.length} MAÇ</span>
        </nav>

        <div className="space-y-4">
          {monthlyTimeline.map(({round, fixtures: roundMatches}) => (
            <section key={round} className="grid lg:grid-cols-[95px_minmax(0,1fr)] gap-3 lg:gap-5 border-b border-[#cec2b5] pb-4">
              <div className="pt-1">
                <div className="font-ibm text-xs font-bold text-[#9b2529] uppercase">HAFTA</div>
                <div className="font-barlow text-4xl font-black leading-none mt-1">{String(round).padStart(2,'0')}</div>
                {nextMatch?.round === round && <div className="font-ibm text-[10px] uppercase text-[#9b2529] mt-2 font-bold">SIRADAKİ HAFTA</div>}
              </div>
              <div className={`grid gap-3 ${selectedFilter === 'MY_CLUB' ? 'grid-cols-1' : 'grid-cols-1 2xl:grid-cols-2'}`}>
                {roundMatches.map(match => {
                  const home = getClub(match.homeClubId);
                  const away = getClub(match.awayClubId);
                  const isFinished = match.status === 'FINISHED';
                  const mine = match.homeClubId === userClub.id || match.awayClubId === userClub.id;
                  return (
                    <button type="button" key={match.id}
                      onClick={() => isFinished ? setReportFixture(match) : router.push(`/match/${match.id}`)}
                      className={`group w-full text-left bg-[#fffaf2] hover:bg-[#f9eee2] border px-4 sm:px-5 py-4 transition-colors shadow-[0_2px_8px_rgba(42,31,20,0.04)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9b2529] ${mine ? 'border-[#ba8a87]' : 'border-[#ded4c8]'}`}>
                      <div className="flex items-center justify-between gap-3 border-b border-[#d7cbbd] pb-3 mb-4">
                        <span className="font-ibm text-[11px] text-[#70655c]">{match.date ? new Date(match.date).toLocaleDateString('tr-TR') : `Hafta ${round}`}</span>
                        <span className={`font-ibm text-[11px] uppercase font-bold ${isFinished ? 'text-[#525d45]' : 'text-[#9b2529]'}`}>{isFinished ? 'TAMAMLANDI' : 'PROGRAMLANDI'}</span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-4">
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <ClubBadge code={home.code} name={home.name} clubId={home.id} primaryColor={home.primaryColor} secondaryColor={home.secondaryColor} size="xs" />
                          <span className="font-barlow text-sm sm:text-lg font-extrabold uppercase leading-tight break-words text-[#111111]">{home.name}</span>
                        </div>
                        <strong className="font-barlow text-lg sm:text-2xl whitespace-nowrap text-[#111111]">{isFinished ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}` : 'VS'}</strong>
                        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3 text-right">
                          <span className="font-barlow text-sm sm:text-lg font-extrabold uppercase leading-tight break-words text-[#111111]">{away.name}</span>
                          <ClubBadge code={away.code} name={away.name} clubId={away.id} primaryColor={away.primaryColor} secondaryColor={away.secondaryColor} size="xs" />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4 pt-3 border-t border-[#d7cbbd] text-[#9b2529] font-barlow font-extrabold uppercase text-xs tracking-wide">
                        {isFinished ? 'MAÇ RAPORUNU AÇ' : 'MAÇ MERKEZİ'} <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
          {monthlyTimeline.length === 0 && (
            <div className="border border-[#d2c7b7] p-10 text-center font-serif italic text-lg text-[#746b62]">Bu filtre için gösterilecek maç bulunamadı.</div>
          )}
        </div>
      </div>
      {reportFixture && (
        <FifaMatchReportModal isOpen={true} onClose={() => setReportFixture(null)}
          homeClub={getClub(reportFixture.homeClubId)} awayClub={getClub(reportFixture.awayClubId)}
          homeScore={reportFixture.homeScore ?? 0} awayScore={reportFixture.awayScore ?? 0}
          round={reportFixture.round} matchDate={reportFixture.date} />
      )}
    </div>
  );
}
