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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d0a]/98 backdrop-blur-xl border-t border-white/10 px-3 py-2 flex items-center justify-around lg:hidden safe-area-bottom select-none">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreDrawerOpen(false)}
              className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-w-[54px] ${
                active ? 'text-[#b7ff35]' : 'text-[#8f9a91] hover:text-[#f3f6f3]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#b7ff35] shadow-[0_0_8px_#b7ff35]" />
                )}
              </div>
              <span className="text-[10px] font-barlow font-bold uppercase tracking-wider mt-1">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* MORE Button */}
        <button
          type="button"
          onClick={() => setMoreDrawerOpen(!moreDrawerOpen)}
          className={`flex flex-col items-center justify-center py-1 px-2 transition-colors min-w-[54px] cursor-pointer ${
            isMoreActive || moreDrawerOpen ? 'text-[#b7ff35]' : 'text-[#8f9a91] hover:text-[#f3f6f3]'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {isMoreActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#b7ff35] shadow-[0_0_8px_#b7ff35]" />
            )}
          </div>
          <span className="text-[10px] font-barlow font-bold uppercase tracking-wider mt-1">
            MORE
          </span>
        </button>
      </nav>

      {/* MORE Slide-Up Drawer */}
      {moreDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            onClick={() => setMoreDrawerOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative z-10 bg-[#090d0a] border-t border-white/15 rounded-t-2xl p-6 shadow-2xl safe-area-bottom animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="font-barlow font-extrabold text-[18px] text-[#f3f6f3] tracking-wider uppercase">
                SQUADCRAFT COMMAND MENU
              </span>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                className="p-1 rounded text-[#8f9a91] hover:text-[#f3f6f3]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreDrawerOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-[6px] border font-barlow font-bold text-[14px] uppercase tracking-wide transition-all ${
                      active
                        ? 'bg-[#b7ff35]/15 border-[#b7ff35] text-[#b7ff35]'
                        : 'bg-[#0d130f] border-white/10 text-[#f3f6f3] hover:border-white/20'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[#b7ff35]' : 'text-[#8f9a91]'} />
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
