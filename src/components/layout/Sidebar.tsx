'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { APP_VERSION } from '@/lib/version';
import { SquadCraftLogo } from '@/components/ui/SquadCraftLogo';
import { ClubBadge } from '@/components/ui/ClubBadge';
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
  ShieldCheck,
  ChevronRight,
  Settings,
  Compass,
  GraduationCap,
  Gamepad2,
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
        { label: 'Ana Merkez', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Kadro Yönetimi', href: '/squad', icon: Users },
        { label: 'Taktik Tahtası', href: '/tactics', icon: Swords },
      ],
    },
    {
      groupTitle: '// SEZON',
      items: [
        { label: 'Fikstür & Maçlar', href: '/fixtures', icon: Calendar },
        { label: 'Lig & Sıralama', href: '/league', icon: Trophy },
      ],
    },
    {
      groupTitle: '// YÖNETİM',
      items: [
        { label: 'Transfer Masası', href: '/transfers', icon: ArrowLeftRight },
        { label: 'Gözlem Ağı (Scout)', href: '/scouting', icon: Compass },
        { label: 'Altyapı Akademisi', href: '/academy', icon: GraduationCap },
        { label: 'Finans & Bütçe', href: '/finances', icon: Landmark },
      ],
    },
    {
      groupTitle: '// SİSTEM',
      items: [
        {
          label: 'Gelen Kutusu',
          href: '/inbox',
          icon: Inbox,
          badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
        },
        { label: 'Draft League', href: '/draft', icon: Gamepad2, isMultiplayer: true },
        { label: 'Ayarlar', href: '/settings', icon: Settings },
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
      {/* Mobile Backdrop (Zero Blur) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#070D1A]/98 backdrop-blur-md border-r border-[#182338] flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Scrollable Navigation */}
        <div className="overflow-y-auto flex-1 py-3.5">
          {/* Brand Logo Header */}
          <div className="px-5 pb-3.5 border-b border-[#182338] flex items-center justify-between">
            <Link href="/" onClick={onClose} className="hover:opacity-90 transition-opacity">
              <SquadCraftLogo size="sm" />
            </Link>
          </div>

          {/* Active Club Identity Card */}
          <div className="px-3.5 py-2.5 mx-3 my-3 bg-[#0B1323] border border-[#182338] rounded-xl flex items-center justify-between shadow-sm">
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
                <div className="text-[10px] text-zinc-400 truncate font-mono">
                  {userClub.managerName}
                </div>
              </div>
            </div>

            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#00F5A0]/10 text-[#00F5A0] border border-[#00F5A0]/30 rounded">
              PRO
            </span>
          </div>

          {/* Navigation Groups */}
          <nav className="px-3 space-y-4 mt-2">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                  {group.groupTitle}
                </div>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center justify-between px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                        active
                          ? 'bg-[#00F5A0] text-black font-black italic shadow-[0_0_12px_rgba(0,245,160,0.3)]'
                          : 'text-zinc-400 hover:text-white hover:bg-[#0B1323]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 transition-colors shrink-0 ${
                            active ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-300'
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
                                : 'bg-cyan-950/80 text-[#00D4FF] border border-cyan-800'
                            }`}
                          >
                            MP
                          </span>
                        )}
                        {item.badge ? (
                          <span className="px-2 py-0.5 text-[10px] font-black bg-red-600 text-white rounded-full animate-pulse">
                            {item.badge}
                          </span>
                        ) : (
                          active && <ChevronRight className="w-3.5 h-3.5 text-black stroke-[3]" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Version Status */}
        <div className="p-3 border-t border-zinc-800 bg-[#05070B]">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C7FF38]" />
              SQUADCRAFT {APP_VERSION}
            </span>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-[9px] font-black text-[#C7FF38]">
              CLOSED ALPHA
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
