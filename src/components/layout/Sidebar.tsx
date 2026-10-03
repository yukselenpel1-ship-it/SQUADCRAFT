'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';
import { SquadCraftLogo } from '@/components/ui/SquadCraftLogo';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { useGame } from '@/lib/context/GameContext';
import {
  LayoutGrid,
  Users,
  Swords,
  Calendar,
  Trophy,
  ArrowLeftRight,
  Landmark,
  Inbox,
  ShieldCheck,
  ChevronRight,
  Settings,
  Compass,
  GraduationCap,
  Gamepad2,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { unreadMessageCount, userClub } = useGame();

  const navGroups = [
    {
      groupTitle: '// KULÜP',
      items: [
        { label: 'ANA MERKEZ', href: '/dashboard', icon: LayoutGrid },
        { label: 'KADRO YÖNETİMİ', href: '/squad', icon: Users },
        { label: 'TAKTİK TAHTASI', href: '/tactics', icon: Swords },
      ],
    },
    {
      groupTitle: '// SEZON',
      items: [
        { label: 'FİKSTÜR & MAÇLAR', href: '/fixtures', icon: Calendar },
        { label: 'LİG & SIRALAMA', href: '/league', icon: Trophy },
      ],
    },
    {
      groupTitle: '// YÖNETİM',
      items: [
        { label: 'TRANSFER MASASI', href: '/transfers', icon: ArrowLeftRight },
        { label: 'GÖZLEM AĞI (SCOUT)', href: '/scouting', icon: Compass },
        { label: 'ALTYAPI AKADEMİSİ', href: '/academy', icon: GraduationCap },
        { label: 'FİNANS & BÜTÇE', href: '/finances', icon: Landmark },
      ],
    },
    {
      groupTitle: '// SİSTEM',
      items: [
        {
          label: 'GELEN KUTUSU',
          href: '/inbox',
          icon: Inbox,
          badge: unreadMessageCount > 0 ? unreadMessageCount : 23,
        },
        { label: 'DRAFT LEAGUE', href: '/draft', icon: Gamepad2, isMultiplayer: true },
        { label: 'AYARLAR', href: '/settings', icon: Settings },
      ],
    },
  ];

  const isActive = (itemHref: string) => {
    if (itemHref === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(itemHref);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sc-career-sidebar fixed top-0 bottom-0 left-0 z-40 w-[246px] bg-[#050B14]/98 backdrop-blur-xl border-r border-[#14233A] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Scrollable Navigation */}
        <div className="overflow-y-auto flex-1 py-3.5 scrollbar-thin">
          {/* Brand Logo Header */}
          <div className="px-5 pb-3 flex items-center justify-between">
            <Link href="/" onClick={onClose} className="hover:opacity-90 transition-opacity">
              <SquadCraftLogo size="sm" />
            </Link>
          </div>

          {/* Active Club Identity Card (Faithful to Mockup) */}
          <div className="px-3.5 py-2.5 mx-3 mb-3 bg-[#07101C] border border-[#14233A] rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <ClubBadge
                code={userClub.code}
                name={userClub.name}
                clubId={userClub.id}
                primaryColor={userClub.primaryColor}
                secondaryColor={userClub.secondaryColor}
                size="sm"
              />
              <div className="truncate">
                <div className="text-xs font-black italic uppercase text-white truncate leading-tight">
                  {userClub.name}
                </div>
                <div className="text-[10px] text-[#8E9EB5] truncate font-mono">
                  {userClub.managerName}
                </div>
              </div>
            </div>

            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 rounded">
              PRO
            </span>
          </div>

          {/* Navigation Groups */}
          <nav className="px-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-[#43556D] uppercase">
                  {group.groupTitle}
                </div>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
                        active
                          ? 'bg-[#00F5A0] text-[#050B14] font-black shadow-[0_0_15px_rgba(0,245,160,0.35)]'
                          : 'text-[#8E9EB5] hover:text-white hover:bg-[#0B1524]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors shrink-0 ${
                            active ? 'text-[#050B14]' : 'text-[#51647E] group-hover:text-zinc-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.isMultiplayer && (
                          <span
                            className={`px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase rounded ${
                              active
                                ? 'bg-black text-[#00D4FF]'
                                : 'bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30'
                            }`}
                          >
                            MP
                          </span>
                        )}
                        {item.badge ? (
                          <span className="px-1.5 py-0.2 text-[9px] font-mono font-black bg-rose-600 text-white rounded-full">
                            {item.badge}
                          </span>
                        ) : (
                          active && <ChevronRight className="w-3.5 h-3.5 text-[#050B14] stroke-[3]" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Floodlight Graphic & Status (Exact to Mockup) */}
        <div className="relative overflow-hidden p-3 border-t border-[#14233A] bg-[#040814]">
          {/* Subtle floodlights in background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-bottom"
            style={{ backgroundImage: `url('/theme-career/stadium-bg.webp')` }}
          />
          <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-[#8E9EB5]">
            <span className="flex items-center gap-1.5 font-bold text-[#51647E]">
              <Settings className="w-3.5 h-3.5" />
              SQUADCRAFT v0.5.7+
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black text-[#00F5A0] uppercase">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
              ONLINE
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
