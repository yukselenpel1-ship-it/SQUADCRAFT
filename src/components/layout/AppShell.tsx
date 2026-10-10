'use client';

import React, { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { Topbar } from './Topbar';
import { useGame, GameProvider } from '@/lib/context/GameContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { LanguageProvider, useLanguage } from '@/lib/context/LanguageContext';

const links = [
  { href: '/dashboard', tr: 'Genel Bakış', en: 'Overview' },
  { href: '/squad', tr: 'Kadro', en: 'Squad' },
  { href: '/tactics', tr: 'Taktikler', en: 'Tactics' },
  { href: '/fixtures', tr: 'Maçlar', en: 'Matches' },
  { href: '/league', tr: 'Lig', en: 'League' },
  { href: '/transfers', tr: 'Transferler', en: 'Transfers' },
  { href: '/scouting', tr: 'Gözlem', en: 'Scouting' },
  { href: '/academy', tr: 'Akademi', en: 'Academy' },
  { href: '/finances', tr: 'Finans', en: 'Finances' },
  { href: '/inbox', tr: 'Posta', en: 'Inbox' },
  { href: '/draft', tr: 'Draft League', en: 'Draft League' },
];

function EditorialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { userClub, unreadMessageCount } = useGame();
  const [open, setOpen] = useState(false);
  const tr = language === 'tr';
  const standalone = pathname === '/' || pathname === '/career/new' || pathname.startsWith('/draft') || pathname.startsWith('/vault');
  if (standalone) return <main className="min-h-screen w-full">{children}</main>;
  return (
    <div className="min-h-screen bg-[#f3efe6] text-[#242321]">
      <header className="sticky top-0 z-50 bg-[#f3efe6]/95 backdrop-blur-md border-b border-[#2d2925]">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8">
          <div className="flex items-center justify-between h-[70px] gap-4">
            <Link href="/" className="font-barlow font-black text-2xl tracking-[-0.05em] shrink-0">SQUAD<span className="text-[#9b2529]">CRAFT</span><span className="block font-ibm text-[9px] tracking-[0.18em] text-[#746d64]">FOOTBALL STORIES / 26</span></Link>
            <div className="hidden xl:flex items-center gap-3 min-w-0"><span className="h-8 w-px bg-[#d0c8bc]"/><span className="font-serif italic text-lg truncate max-w-[240px]">{userClub?.name || (tr ? 'Kariyer' : 'Career')}</span></div>
            <div className="hidden lg:flex items-center gap-5 font-barlow text-sm font-bold tracking-wider uppercase">
              <Link href="/dashboard" className={pathname === '/dashboard' ? 'text-[#9b2529] underline underline-offset-8' : 'hover:text-[#9b2529]'}>{tr ? 'KARİYER' : 'CAREER'}</Link>
              <Link href="/squad" className={pathname.startsWith('/squad') ? 'text-[#9b2529] underline underline-offset-8' : 'hover:text-[#9b2529]'}>{tr ? 'KADRO' : 'SQUAD'}</Link>
              <Link href="/fixtures" className={pathname.startsWith('/fixtures') ? 'text-[#9b2529] underline underline-offset-8' : 'hover:text-[#9b2529]'}>{tr ? 'MAÇLAR' : 'MATCHES'}</Link>
              <Link href="/transfers" className={pathname.startsWith('/transfers') ? 'text-[#9b2529] underline underline-offset-8' : 'hover:text-[#9b2529]'}>{tr ? 'TRANSFER' : 'TRANSFERS'}</Link>
              <Link href="/draft" className="bg-[#9b2529] px-4 py-2 text-white hover:bg-[#762025]">DRAFT <ArrowUpRight size={14} className="inline"/></Link>
            </div>
            <button type="button" onClick={() => setOpen(v => !v)} aria-label={tr ? 'Menüyü aç veya kapat' : 'Toggle menu'} aria-expanded={open} className="border border-[#2d2925] p-2 lg:hidden">{open ? <X size={22}/> : <Menu size={22}/>}</button>
          </div>
          <nav aria-label={tr ? 'Kariyer bölümleri' : 'Career sections'} className="hidden lg:flex gap-5 overflow-x-auto border-t border-[#d9d1c4] py-2 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
            {links.filter(l => !['/dashboard','/squad','/draft'].includes(l.href)).map(l => <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'text-[#9b2529]' : 'text-[#605a52] hover:text-[#9b2529]'}>{tr ? l.tr : l.en}{l.href === '/inbox' && unreadMessageCount > 0 ? ' • ' + unreadMessageCount : ''}</Link>)}
          </nav>
        </div>
        {open && <nav aria-label={tr ? 'Mobil navigasyon' : 'Mobile navigation'} className="lg:hidden border-t border-[#d0c8bc] p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-[#f3efe6]">{links.map(l => <Link key={l.href} onClick={()=>setOpen(false)} href={l.href} className={`px-3 py-3 border border-[#d0c8bc] font-barlow uppercase font-bold ${pathname.startsWith(l.href) ? 'bg-[#9b2529] text-white' : ''}`}>{tr ? l.tr : l.en}</Link>)}</nav>}
      </header>
      <Topbar />
      <main className="w-full min-h-[calc(100vh-70px)]">{children}</main>
    </div>
  );
}
export const AppShell: React.FC<{children: ReactNode}> = ({children}) => (
  <AuthProvider><GameProvider><LanguageProvider><EditorialShell>{children}</EditorialShell></LanguageProvider></GameProvider></AuthProvider>
);
