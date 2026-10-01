'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';
import { SquadCraftLogo } from '@/components/ui/SquadCraftLogo';
import { useGame } from '@/lib/context/GameContext';
import {
  LayoutDashboard,
  Users,
  Swords,
  Calendar,
  Trophy,
  ArrowLeftRight,
  Landmark,
  Inbox,
  Settings,
  Compass,
  GraduationCap,
  Gamepad2,
  BarChart3,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number | string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { unreadMessageCount } = useGame();

  const isDraftRoute = pathname.startsWith('/draft');

  // Career Nav Items
  const careerNavItems: NavItem[] = [
    { label: 'Ana Panel', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Kadro', href: '/squad', icon: Users },
    { label: 'Taktikler', href: '/tactics', icon: Swords },
    { label: 'Maçlar', href: '/fixtures', icon: Calendar },
    { label: 'Transferler', href: '/transfers', icon: ArrowLeftRight },
    { label: 'Scout', href: '/scouting', icon: Compass },
    { label: 'Altyapı', href: '/academy', icon: GraduationCap },
    { label: 'Lig', href: '/league', icon: Trophy },
    { label: 'Finans', href: '/finances', icon: Landmark },
    {
      label: 'Gelen Kutusu',
      href: '/inbox',
      icon: Inbox,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    { label: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  // Draft Nav Items
  const draftNavItems: NavItem[] = [
    { label: 'Ana Panel', href: '/draft', icon: LayoutDashboard },
    { label: 'Kadro', href: '/draft', icon: Users },
    { label: 'Taktikler', href: '/draft', icon: Swords },
    { label: 'Maçlar', href: '/draft', icon: Calendar },
    { label: 'Draft', href: '/draft', icon: Gamepad2 },
    { label: 'Lig', href: '/draft', icon: Trophy },
    { label: 'İstatistikler', href: '/draft', icon: Award },
    { label: 'Ayarlar / Oda', href: '/draft', icon: Settings },
  ];

  const currentNavItems = isDraftRoute ? draftNavItems : careerNavItems;

  const isItemActive = (itemHref: string) => {
    if (itemHref === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (itemHref === '/draft') {
      return pathname === '/draft';
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#050B10] border-r border-[rgba(125,160,175,0.14)] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[rgba(125,160,175,0.14)] flex items-center justify-between">
          <Link href="/" onClick={onClose} className="hover:opacity-90 transition-opacity">
            <SquadCraftLogo size="sm" showText={true} />
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="overflow-y-auto flex-1 px-3 py-4 space-y-1 select-none">
          {currentNavItems.map((item) => {
            const active = isItemActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs tracking-wide transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#65F56B]/25 via-[#65F56B]/15 to-[#65F56B]/5 border border-[#65F56B]/40 text-white font-black shadow-[0_0_15px_rgba(101,245,107,0.15)]'
                    : 'text-[#82909B] hover:text-white hover:bg-[#09141B]/80 font-bold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors shrink-0 ${
                      active ? 'text-[#65F56B]' : 'text-[#82909B] group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[9px] font-black bg-[#65F56B] text-black rounded-full shadow-[0_0_8px_rgba(101,245,107,0.5)]">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#65F56B] shadow-[0_0_6px_#65F56B]" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom Atmosphere Graphic Banner: "DAHA BÜYÜK HİKAYELER BİRLİKTE YAZILIR" */}
        <div className="relative overflow-hidden p-4 border-t border-[rgba(125,160,175,0.14)] bg-[#070D14]/90 select-none">
          <div
            className="absolute inset-0 pointer-events-none bg-cover bg-center opacity-15 mix-blend-screen"
            style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
          />
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050B10] via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col space-y-1">
            <span className="text-[11px] font-black italic tracking-tighter uppercase text-white font-sans leading-tight">
              DAHA BÜYÜK
            </span>
            <span className="text-[11px] font-black italic tracking-tighter uppercase text-white font-sans leading-tight">
              HİKAYELER
            </span>
            <span className="text-[11px] font-black italic tracking-tighter uppercase text-white font-sans leading-tight">
              BİRLİKTE
            </span>
            <span className="text-xs font-black italic tracking-wider uppercase text-[#65F56B] font-sans leading-tight flex items-center gap-1">
              YAZILIR
              <Flame className="w-3.5 h-3.5 text-[#65F56B]" />
            </span>

            <div className="pt-2 text-[9px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/60 mt-1">
              <span>SQUADCRAFT 26</span>
              <span className="text-[#65F56B] font-bold">V2 THEME</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
