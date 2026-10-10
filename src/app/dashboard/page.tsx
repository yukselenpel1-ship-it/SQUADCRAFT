'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { PlayerPortrait } from '@/components/ui/PlayerPortrait';
import { CareerLoadingState } from '@/components/career/CareerLoadingState';
import { ArrowUpRight, ArrowRight, CalendarDays, Trophy, Users, Wallet, Mail, ChevronRight } from 'lucide-react';

/**
 * Editorial Football / Career — visual-only redesign.
 * All career data, hydration guards and actions still come from GameContext.
 * No mocked matches, ratings, balances, news or online state are displayed.
 */
export default function DashboardPage() {
  const router = useRouter();
  const game = useGame();
  const { language } = useLanguage();
  const tr = language === 'tr';
  const {
    isInitialized, isCareerHydrated, hasActiveCareer, hasSavedCareer, hasCareerSave,
    userClub, allClubs, userPlayers, standings, fixtures, inboxMessages,
    seasonYear, seasonNumber, nextMatch, seasonEndSummary,
    startNextSeasonRoll, managerContract, respondToManagerContractOffer,
  } = game;

  useEffect(() => {
    if (isInitialized && isCareerHydrated && !hasActiveCareer && !hasSavedCareer && !hasCareerSave) {
      router.replace('/');
    }
  }, [isInitialized, isCareerHydrated, hasActiveCareer, hasSavedCareer, hasCareerSave, router]);

  const ranking = useMemo(() => [...(standings || [])].sort((a, b) => a.rank - b.rank), [standings]);
  const standing = ranking.find(s => s.clubId === userClub?.id);
  const opponent = nextMatch && userClub
    ? allClubs.find(c => c.id === (nextMatch.homeClubId === userClub.id ? nextMatch.awayClubId : nextMatch.homeClubId))
    : undefined;
  const prospect = useMemo(() => [...(userPlayers || [])]
    .filter(p => p.age <= 23)
    .sort((a, b) => b.potential - a.potential)[0], [userPlayers]);
  const messages = (inboxMessages || []).slice(0, 2);
  const completedMatches = (fixtures || []).filter(f => f.status === 'FINISHED' &&
    (f.homeClubId === userClub?.id || f.awayClubId === userClub?.id));
  const lastMatch = completedMatches.length ? completedMatches[completedMatches.length - 1] : null;
  const balance = userClub?.transferBudget;
  const localName = userClub?.name || (tr ? 'Kulübün' : 'Your club');
  const headingClass = 'font-barlow font-black uppercase leading-[0.83] tracking-[-0.035em]';
  const sectionLabel = 'font-barlow font-extrabold uppercase text-[23px] sm:text-[27px] leading-none tracking-tight text-[#951f24]';
  const eyebrow = 'font-ibm text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.18em]';
  const paper = 'border-t border-[#33302d]/35 pt-4';

  if (!isInitialized || !isCareerHydrated || !userClub) {
    return <CareerLoadingState title={tr ? 'KARİYER YÜKLENİYOR' : 'LOADING CAREER'} message={tr ? 'Kulüp verileri hazırlanıyor...' : 'Preparing club data...'} />;
  }

  const currentTop = ranking.slice(0, 6);
  const nextMatchLink = nextMatch ? `/match/${nextMatch.id}` : '/fixtures';
  const homeClub = nextMatch?.homeClubId === userClub.id ? userClub : opponent;
  const awayClub = nextMatch?.awayClubId === userClub.id ? userClub : opponent;

  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#242321] selection:bg-[#a6282c] selection:text-white font-inter -mx-4 sm:-mx-6 lg:-mx-8 -my-6 px-4 sm:px-8 lg:px-12 py-7 pb-24">
      <div className="mx-auto max-w-[1600px]">
        <header className="border-b-2 border-[#252322] pb-4 flex flex-wrap gap-3 justify-between items-end">
          <div className="flex items-center gap-3">
            <span className="font-barlow font-black tracking-tight text-xl sm:text-2xl">SQUAD<span className="text-[#a6282c]">CRAFT</span></span>
            <span className="hidden sm:block h-5 border-l border-[#252322]/40" />
            <span className={eyebrow + ' hidden sm:block text-[#746b65]'}>{tr ? 'KULÜP / İNSAN / MİRAS' : 'CLUB / PEOPLE / LEGACY'}</span>
          </div>
          <nav aria-label={tr ? 'Kariyer kısayolları' : 'Career shortcuts'} className="flex gap-4 sm:gap-6 text-xs font-bold uppercase tracking-wide">
            <Link className="border-b-2 border-[#a6282c] pb-1" href="/dashboard">{tr ? 'KARİYER' : 'CAREER'}</Link>
            <Link className="hover:text-[#a6282c]" href="/squad">{tr ? 'KADRO' : 'SQUAD'}</Link>
            <Link className="hover:text-[#a6282c]" href="/transfers">{tr ? 'TRANSFER' : 'TRANSFERS'}</Link>
            <Link className="hover:text-[#a6282c]" href="/fixtures">{tr ? 'FİKSTÜR' : 'FIXTURES'}</Link>
          </nav>
        </header>

        <section className="pt-5 sm:pt-8 pb-6 border-b border-[#2b2927]/35">
          <div className="flex flex-wrap justify-between gap-4 items-start">
            <div>
              <div className={eyebrow + ' text-[#8b2429] mb-3'}>{tr ? 'FUTBOLUN İÇİNDEN / SAYI' : 'THE FOOTBALL JOURNAL / ISSUE'} {String(seasonNumber || 1).padStart(2, '0')}</div>
              <h1 className={headingClass + ' text-[clamp(4.2rem,12vw,11rem)]'}>{tr ? 'KARİYER' : 'CAREER'}<span className="text-[#a6282c]">.</span></h1>
            </div>
            <div className="sm:text-right max-w-xs pt-2">
              <div className="font-serif italic text-2xl sm:text-3xl leading-tight">{tr ? 'Bir kadrodan fazlasını inşa et.' : 'Build more than a squad.'}</div>
              <div className={eyebrow + ' text-[#756e66] mt-3'}>{seasonYear || (tr ? 'GÜNCEL SEZON' : 'CURRENT SEASON')}</div>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.05fr_0.95fr] border-b-2 border-[#252322]">
          <div className="py-7 sm:py-10 lg:pr-10 flex flex-col justify-between min-h-64">
            <div>
              <div className={eyebrow + ' text-[#a6282c] mb-6'}>{tr ? 'KULÜP DOSYASI / SEZON' : 'CLUB DOSSIER / SEASON'} {String(seasonNumber || 1).padStart(2,'0')}</div>
              <div className="flex items-center gap-5">
                <div className="shrink-0"><ClubBadge clubId={userClub.id} code={userClub.code} name={userClub.name} primaryColor={userClub.primaryColor} secondaryColor={userClub.secondaryColor} size="xl" /></div>
                <div>
                  <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[0.95]">{localName}</h2>
                  <p className="font-serif italic text-[#716862] text-lg mt-3">{tr ? 'Kulübün geleceği senin ellerinde.' : 'The future of the club is in your hands.'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-9 pt-4 border-t border-[#252322]/25">
              <div><p className={eyebrow + ' text-[#7a716a]'}>{tr ? 'SIRA' : 'RANK'}</p><strong className="font-barlow text-5xl font-black">{standing?.rank ?? '—'}</strong></div>
              <div><p className={eyebrow + ' text-[#7a716a]'}>{tr ? 'PUAN' : 'POINTS'}</p><strong className="font-barlow text-5xl font-black">{standing?.points ?? '—'}</strong></div>
              <div><p className={eyebrow + ' text-[#7a716a]'}>{tr ? 'KADRO' : 'SQUAD'}</p><strong className="font-barlow text-5xl font-black">{userPlayers?.length ?? 0}</strong></div>
            </div>
          </div>
          <div className="relative min-h-[260px] sm:min-h-[345px] bg-[#a62b30] text-[#fff4e9] p-7 sm:p-10 flex flex-col justify-between overflow-hidden">
            <div aria-hidden className="absolute inset-0 opacity-[0.10]" style={{backgroundImage:'repeating-linear-gradient(0deg, transparent 0px, transparent 18px, #fff 19px, transparent 20px)'}} />
            <span className={eyebrow + ' relative z-10'}>{tr ? 'SEZONUN HİKÂYESİ' : 'THE SEASON STORY'}</span>
            <div className="relative z-10">
              <p className={headingClass + ' text-[clamp(3.2rem,6vw,7rem)]'}>{tr ? <>BİR KULÜP.<br />BİR MİRAS.</> : <>ONE CLUB.<br />ONE LEGACY.</>}</p>
              <p className="font-serif italic text-xl sm:text-2xl mt-4">{tr ? 'Sonraki sayfayı sen yaz.' : 'Write the next chapter.'}</p>
            </div>
            <span className={eyebrow + ' relative z-10 opacity-80'}>SQUADCRAFT / FOOTBALL STORIES</span>
          </div>
        </section>

        {seasonEndSummary && <aside className="bg-[#a6282c] text-white mt-7 p-5 sm:p-6 flex flex-wrap items-center gap-4 justify-between">
          <div><div className={eyebrow}>{tr ? 'SEZON TAMAMLANDI' : 'SEASON COMPLETE'}</div><p className="font-serif text-xl mt-1">{tr ? 'Şampiyon' : 'Champion'}: {seasonEndSummary.championClubName}</p></div>
          <button className="bg-white text-[#a6282c] px-5 py-3 font-bold uppercase text-xs hover:bg-[#f4e6d8]" onClick={startNextSeasonRoll}>{tr ? 'YENİ SEZONA GEÇ' : 'START NEXT SEASON'} →</button>
        </aside>}

        {managerContract?.status === 'OFFERED' && <aside className="border-2 border-[#a6282c] mt-6 p-5 flex flex-wrap items-center justify-between gap-4">
          <div><p className={eyebrow + ' text-[#a6282c]'}>{tr ? 'YENİ SÖZLEŞME TEKLİFİ' : 'NEW CONTRACT OFFER'}</p><p className="font-serif text-lg">{managerContract.offerYears || 2} {tr ? 'yıllık teklif' : 'year offer'}</p></div>
          <div className="flex gap-3"><button className="bg-[#a6282c] text-white px-4 py-2 font-bold text-xs" onClick={() => respondToManagerContractOffer(true)}>{tr ? 'KABUL ET' : 'ACCEPT'}</button><button className="border border-[#252322] px-4 py-2 font-bold text-xs" onClick={() => respondToManagerContractOffer(false)}>{tr ? 'REDDET' : 'DECLINE'}</button></div>
        </aside>}

        <section className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 py-8 border-b border-[#252322]/35">
          <article>
            <div className="flex items-center justify-between mb-5"><h3 className={sectionLabel}>{tr ? 'SIRADAKİ MAÇ' : 'NEXT FIXTURE'}</h3><span className={eyebrow + ' text-[#716862]'}>{tr ? 'MAÇ GÜNÜ' : 'MATCHDAY'}</span></div>
            {nextMatch && opponent && homeClub && awayClub ? <>
              <div className="flex justify-between items-center gap-2 border-y border-[#252322]/30 py-8">
                <div className="flex-1 text-center"><div className="flex justify-center"><ClubBadge clubId={homeClub.id} code={homeClub.code} name={homeClub.name} primaryColor={homeClub.primaryColor} secondaryColor={homeClub.secondaryColor} size="lg" /></div><p className="font-barlow font-extrabold uppercase text-lg sm:text-2xl mt-2">{homeClub.name}</p></div>
                <div className="text-center shrink-0"><span className="font-serif italic text-[#9b242b] text-3xl sm:text-5xl">vs.</span></div>
                <div className="flex-1 text-center"><div className="flex justify-center"><ClubBadge clubId={awayClub.id} code={awayClub.code} name={awayClub.name} primaryColor={awayClub.primaryColor} secondaryColor={awayClub.secondaryColor} size="lg" /></div><p className="font-barlow font-extrabold uppercase text-lg sm:text-2xl mt-2">{awayClub.name}</p></div>
              </div>
              <p className="text-xs text-[#746e67] mt-3 font-ibm">{userClub.stadium || ''}</p>
              <Link href={nextMatchLink} className="mt-6 inline-flex items-center gap-4 bg-[#a6282c] text-white px-6 py-4 font-barlow font-black uppercase text-lg hover:bg-[#7e1d22]">{tr ? 'MAÇ MERKEZİNE GİT' : 'OPEN MATCH CENTER'} <ArrowUpRight size={22}/></Link>
            </> : <div className="py-16 border-y border-[#252322]/30 font-serif italic text-xl">{tr ? 'Şu anda planlanmış maç yok.' : 'No upcoming fixture scheduled.'}<div className="mt-4"><Link className="text-[#a6282c] underline font-inter text-sm" href="/fixtures">{tr ? 'Fikstürü aç' : 'View fixtures'}</Link></div></div>}
            {lastMatch && <div className="mt-6 text-xs uppercase tracking-wider text-[#716862]">{tr ? 'SON TAMAMLANAN MAÇ' : 'LAST PLAYED MATCH'} — {lastMatch.homeScore ?? '—'} : {lastMatch.awayScore ?? '—'}</div>}
          </article>
          <article>
            <div className="flex items-center justify-between mb-5"><h3 className={sectionLabel}>{tr ? 'LİG TABLOSU' : 'LEAGUE TABLE'}</h3><Link href="/league" aria-label={tr ? 'Tam lig tablosu' : 'Full league table'}><ArrowUpRight size={22}/></Link></div>
            <div className="border-t-2 border-[#242321]">
              <div className={eyebrow + ' grid grid-cols-[35px_1fr_55px] py-3 text-[#716862]'}><span>#</span><span>{tr ? 'KULÜP' : 'CLUB'}</span><span className="text-right">{tr ? 'PUAN' : 'PTS'}</span></div>
              {currentTop.map(s => {
                const c = allClubs.find(club => club.id === s.clubId);
                const mine = s.clubId === userClub.id;
                return <div key={s.clubId} className={`grid grid-cols-[35px_1fr_55px] gap-2 items-center py-3 border-t border-[#252322]/25 text-sm ${mine ? 'bg-[#a6282c] text-white px-2 -mx-2 font-bold' : ''}`}><span className="font-barlow text-xl font-black">{s.rank}</span><span className="truncate">{c?.name || s.clubId}</span><span className="text-right font-bold">{s.points}</span></div>;
              })}
              {!currentTop.length && <p className="py-5 text-sm">{tr ? 'Lig verisi henüz yok.' : 'League data is not available yet.'}</p>}
            </div>
            <Link href="/league" className="mt-4 inline-flex gap-2 items-center text-xs uppercase font-bold text-[#9b242b]">{tr ? 'TÜM SIRALAMA' : 'FULL TABLE'} <ArrowRight size={16}/></Link>
          </article>
        </section>

        <section className="grid md:grid-cols-3 gap-8 md:gap-7 py-9 border-b border-[#252322]/35">
          <article className={paper}><h3 className={sectionLabel}>{tr ? 'GENÇ YETENEK' : 'YOUTH REPORT'}</h3>
            {prospect ? <><div className="flex gap-4 items-center mt-6"><PlayerPortrait player={prospect} size="md"/><div><strong className="font-barlow font-black text-2xl uppercase leading-none block">{prospect.firstName} {prospect.lastName}</strong><span className={eyebrow + ' text-[#786e67]'}>{prospect.position} / {prospect.age} {tr ? 'YAŞ' : 'YEARS'}</span></div></div><p className="font-serif italic text-lg mt-4">{tr ? 'Gelecek burada yetişiyor.' : 'The future begins here.'}</p><div className="flex gap-8 mt-3 border-t border-[#252322]/25 pt-3"><div><p className={eyebrow + ' text-[#7b706a]'}>OVR</p><strong className="font-barlow text-3xl">{prospect.overall}</strong></div><div><p className={eyebrow + ' text-[#7b706a]'}>{tr ? 'POTANSİYEL' : 'POTENTIAL'}</p><strong className="font-barlow text-3xl text-[#a6282c]">{prospect.potential}</strong></div></div></> : <p className="mt-6 text-sm">{tr ? 'Genç oyuncu bulunmuyor.' : 'No youth prospects available.'}</p>}
            <Link href="/squad" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase text-[#a6282c]">{tr ? 'KADROYU İNCELE' : 'EXPLORE SQUAD'} <ArrowUpRight size={16}/></Link>
          </article>
          <article className={paper}><h3 className={sectionLabel}>{tr ? 'KULÜP DURUMU' : 'CLUB HEALTH'}</h3>
            <div className="mt-7 space-y-5">
              <div><p className={eyebrow + ' text-[#786e67]'}>{tr ? 'TRANSFER BÜTÇESİ' : 'TRANSFER BUDGET'}</p><p className="font-barlow font-black text-4xl mt-1">{typeof balance === 'number' ? new Intl.NumberFormat(tr ? 'tr-TR' : 'en-GB', {style:'currency',currency:'EUR',maximumFractionDigits:0}).format(balance) : '—'}</p></div>
              <div className="border-t border-[#252322]/25 pt-4"><p className={eyebrow + ' text-[#786e67]'}>{tr ? 'KADRO DURUMU' : 'SQUAD STATUS'}</p><p className="font-serif text-2xl mt-1">{userPlayers.length} {tr ? 'futbolcu' : 'players'}</p></div>
            </div>
            <Link href="/transfers" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase text-[#a6282c]">{tr ? 'TRANSFER MERKEZİ' : 'TRANSFER HUB'} <ArrowUpRight size={16}/></Link>
          </article>
          <article className={paper}><h3 className={sectionLabel}>{tr ? 'KULÜP POSTASI' : 'CLUB POST'}</h3>
            <div className="mt-6 divide-y divide-[#252322]/25 border-b border-[#252322]/25">
              {messages.map(m => <Link href="/inbox" key={m.id} className="block py-3 group"><div className={eyebrow + ' text-[#786e67]'}>{m.senderName}</div><p className="font-serif text-lg mt-1 group-hover:text-[#a6282c]">{m.subject}</p></Link>)}
              {!messages.length && <p className="py-4 text-sm">{tr ? 'Yeni mesaj yok.' : 'No recent messages.'}</p>}
            </div>
            <Link href="/inbox" className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase text-[#a6282c]">{tr ? 'GELEN KUTUSU' : 'INBOX'} <ArrowUpRight size={16}/></Link>
          </article>
        </section>
        <footer className="flex flex-wrap justify-between gap-3 pt-5 font-ibm text-[10px] tracking-[0.15em] text-[#786e67] uppercase"><span>SQUADCRAFT / CAREER EDITION</span><span>{localName} · {seasonYear}</span></footer>
      </div>
    </div>
  );
}
