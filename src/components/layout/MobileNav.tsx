'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Compass,
  MoreHorizontal,
  Swords,
  Trophy,
  ArrowLeftRight,
  GraduationCap,
  Landmark,
  Inbox,
  Settings,
  Gamepad2,
  X,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const mainNavItems = [
    { label: 'HOME', href: '/dashboard', icon: LayoutDashboard },
    { label: 'SQUAD', href: '/squad', icon: Users },
    { label: 'MATCHES', href: '/fixtures', icon: Calendar },
    { label: 'SCOUT', href: '/scouting', icon: Compass },
  ];

  const moreItems = [
    { label: 'Tactics', href: '/tactics', icon: Swords },
    { label: 'League', href: '/league', icon: Trophy },
    { label: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
    { label: 'Academy', href: '/academy', icon: GraduationCap },
    { label: 'Finances', href: '/finances', icon: Landmark },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Draft League', href: '/draft', icon: Gamepad2 },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070D14]/95 backdrop-blur-2xl border-t border-white/10 px-2 py-2 flex items-center justify-around lg:hidden safe-area-bottom select-none shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreDrawerOpen(false)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all min-w-[54px] min-h-[48px] rounded-lg active:scale-95 ${
                active ? 'text-[#B7FF3C]' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(183,255,60,0.6)]' : ''}`} />
                {active && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B7FF3C] shadow-[0_0_8px_#B7FF3C]" />
                )}
              </div>
              <span className="text-[10px] font-barlow font-bold uppercase tracking-widest mt-1.5 leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* MORE Button */}
        <button
          type="button"
          onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
          className={`flex flex-col items-center justify-center py-1.5 px-2 transition-all min-w-[54px] min-h-[48px] rounded-lg cursor-pointer active:scale-95 ${
            isMoreActive || moreDrawerOpen ? 'text-[#B7FF3C]' : 'text-zinc-400 hover:text-white'
          }`}
          aria-label="Tüm Menüyü Aç"
        >
          <div className="relative flex items-center justify-center">
            <MoreHorizontal className={`w-5 h-5 transition-transform ${isMoreActive || moreDrawerOpen ? 'scale-110 drop-shadow-[0_0_8px_rgba(183,255,60,0.6)]' : ''}`} />
            {(isMoreActive || moreDrawerOpen) && (
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#B7FF3C] shadow-[0_0_8px_#B7FF3C]" />
            )}
          </div>
          <span className="text-[10px] font-barlow font-bold uppercase tracking-widest mt-1.5 leading-none">
            DAHA
          </span>
        </button>
      </nav>

      {/* MORE Slide-Up Drawer */}
      {moreDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            onClick={() => setMoreDrawerOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          />

          <div className="relative z-10 bg-[#070D14]/98 border-t border-white/15 rounded-t-2xl p-5 sm:p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.9)] safe-area-bottom animate-in slide-in-from-bottom duration-250">
            {/* Top decorative pill */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-barlow font-bold text-[#B7FF3C] tracking-widest uppercase block">
                  SQUADCRAFT COMMAND
                </span>
                <span className="font-barlow font-black text-[18px] text-white tracking-wide uppercase">
                  TÜM MODÜLLER
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1 pb-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border font-barlow font-bold text-[13px] uppercase tracking-wider transition-all min-h-[50px] ${
                      active
                        ? 'bg-[#B7FF3C]/15 border-[#B7FF3C] text-[#B7FF3C] shadow-[0_0_15px_rgba(183,255,60,0.15)]'
                        : 'bg-[#0B131E]/80 border-white/10 text-zinc-300 hover:border-white/25 hover:text-white hover:bg-[#0E1A29]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[#B7FF3C]' : 'text-zinc-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
