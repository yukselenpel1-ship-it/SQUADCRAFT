'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Compass,
  GraduationCap,
  Landmark,
  Inbox,
  Gamepad2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Dot,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: number | null;
  isMultiplayer?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const pathname = usePathname();
  const { unreadMessageCount, userClub } = useGame();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups: NavGroup[] = [
    {
      groupTitle: 'CLUB',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
        { label: 'Squad', href: '/squad', icon: Users },
        { label: 'Tactics', href: '/tactics', icon: Swords },
      ],
    },
    {
      groupTitle: 'SEASON',
      items: [
        { label: 'Fixtures', href: '/fixtures', icon: Calendar },
        { label: 'League', href: '/league', icon: Trophy },
      ],
    },
    {
      groupTitle: 'RECRUITMENT',
      items: [
        { label: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
        { label: 'Scouting', href: '/scouting', icon: Compass },
        { label: 'Academy', href: '/academy', icon: GraduationCap },
      ],
    },
    {
      groupTitle: 'MANAGEMENT',
      items: [
        { label: 'Finances', href: '/finances', icon: Landmark },
        {
          label: 'Inbox',
          href: '/inbox',
          icon: Inbox,
          badge: unreadMessageCount > 0 ? unreadMessageCount : null,
        },
      ],
    },
    {
      groupTitle: 'SYSTEM',
      items: [
        { label: 'Draft League', href: '/draft', icon: Gamepad2, isMultiplayer: true },
        { label: 'Settings', href: '/settings', icon: Settings },
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
          className="fixed inset-0 bg-black/85 z-40 lg:hidden backdrop-blur-sm"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sc-career-sidebar fixed top-0 bottom-0 left-0 z-40 ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-[246px]'
        } w-[260px] bg-[#090d0a]/98 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-all duration-200 select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <div className="overflow-y-auto flex-1 py-4 scrollbar-thin">
          {/* Brand Header */}
          <div className="px-5 pb-4 flex items-center justify-between border-b border-white/5">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-[3px] bg-[#0d1611] border border-[#b7ff35]/60 flex items-center justify-center shadow-[0_0_10px_rgba(183,255,53,0.3)] shrink-0">
                <span className="font-barlow font-extrabold text-[15px] text-[#b7ff35]">SC</span>
              </div>
              {!collapsed && (
                <div className="flex flex-col leading-none">
                  <span className="font-barlow font-extrabold text-[18px] text-[#f3f6f3] tracking-wider uppercase">
                    SQUAD<span className="text-[#b7ff35]">CRAFT</span>
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 font-ibm text-[9px] text-[#8f9a91] tracking-widest uppercase">
                    <span>CAREER ENGINE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#65ff83] animate-pulse" />
                    <span className="text-[#65ff83] font-bold">ONLINE</span>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1 rounded hover:bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3] transition-colors"
              title={collapsed ? 'Genişlet' : 'Daralt'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Active Club Module */}
          <div className={`mx-3 my-3 p-3 bg-[#0d130f] border border-white/10 rounded-[6px] ${collapsed ? 'text-center' : ''}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} overflow-hidden`}>
              <div className="relative group shrink-0">
                <ClubBadge
                  code={userClub.code}
                  name={userClub.name}
                  clubId={userClub.id}
                  primaryColor={userClub.primaryColor}
                  secondaryColor={userClub.secondaryColor}
                  size="sm"
                />
              </div>

              {!collapsed && (
                <div className="truncate flex-1">
                  <div className="text-[13px] font-barlow font-bold uppercase text-[#f3f6f3] truncate leading-tight tracking-wide">
                    {userClub.name}
                  </div>
                  <div className="text-[11px] text-[#8f9a91] truncate font-inter flex items-center gap-1">
                    <span className="text-[#8f9a91]">Manager</span>
                    <span className="text-[#b7ff35] font-semibold">{userClub.managerName || 'Steve'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="mt-3 space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-0.5">
                {!collapsed && (
                  <div className="px-5 py-1 text-[10px] font-ibm font-bold tracking-widest text-[#8f9a91]/70 uppercase">
                    {group.groupTitle}
                  </div>
                )}

                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center justify-between px-5 py-2.5 text-[13px] font-barlow font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        active
                          ? 'border-l-2 border-[#b7ff35] bg-[#b7ff35]/10 text-[#f3f6f3]'
                          : 'border-l-2 border-transparent text-[#8f9a91] hover:text-[#f3f6f3] hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className={`flex items-center gap-3 ${collapsed ? 'mx-auto' : ''}`}>
                        <Icon
                          className={`w-[17px] h-[17px] transition-colors shrink-0 ${
                            active
                              ? 'text-[#b7ff35] drop-shadow-[0_0_8px_rgba(183,255,53,0.5)]'
                              : 'text-[#8f9a91] group-hover:text-[#f3f6f3]'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed && (
                        <div className="flex items-center gap-1.5">
                          {item.isMultiplayer && (
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-ibm font-bold uppercase rounded ${
                                active
                                  ? 'bg-[#17e5c2]/20 text-[#17e5c2] border border-[#17e5c2]/40'
                                  : 'bg-white/5 text-[#17e5c2]'
                              }`}
                            >
                              MP
                            </span>
                          )}
                          {item.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-ibm font-black bg-[#ff5365] text-white rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Status */}
        <div className="p-3 border-t border-white/10 bg-[#050706]">
          <div className="flex items-center justify-between font-ibm text-[10px] text-[#8f9a91]">
            {!collapsed ? (
              <>
                <span className="font-semibold">SQUADCRAFT 2026</span>
                <span className="text-[#b7ff35] font-bold">PRO LEAGUE</span>
              </>
            ) : (
              <span className="mx-auto text-[#b7ff35] font-bold">PRO</span>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
