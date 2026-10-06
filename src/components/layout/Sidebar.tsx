'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquadCraftLogo } from '@/components/ui/SquadCraftLogo';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { useGame } from '@/lib/context/GameContext';
import { useLanguage } from '@/lib/context/LanguageContext';
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
  const { language } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const isTR = language === 'tr';

  const navGroups: NavGroup[] = [
    {
      groupTitle: isTR ? 'KULÜP' : 'CLUB',
      items: [
        { label: isTR ? 'Genel Bakış' : 'Dashboard', href: '/dashboard', icon: LayoutGrid },
        { label: isTR ? 'Kadro' : 'Squad', href: '/squad', icon: Users },
        { label: isTR ? 'Taktikler' : 'Tactics', href: '/tactics', icon: Swords },
      ],
    },
    {
      groupTitle: isTR ? 'SEZON' : 'SEASON',
      items: [
        { label: isTR ? 'Fikstür & Maçlar' : 'Fixtures', href: '/fixtures', icon: Calendar },
        { label: isTR ? 'Lig Tablosu' : 'League', href: '/league', icon: Trophy },
      ],
    },
    {
      groupTitle: isTR ? 'TRANSFER & İZLEME' : 'RECRUITMENT',
      items: [
        { label: isTR ? 'Transfer Masası' : 'Transfers', href: '/transfers', icon: ArrowLeftRight },
        { label: isTR ? 'Gözlemcilik' : 'Scouting', href: '/scouting', icon: Compass },
        { label: isTR ? 'Gençlik Akademisi' : 'Academy', href: '/academy', icon: GraduationCap },
      ],
    },
    {
      groupTitle: isTR ? 'YÖNETİM' : 'MANAGEMENT',
      items: [
        { label: isTR ? 'Finans & Bütçe' : 'Finances', href: '/finances', icon: Landmark },
        {
          label: isTR ? 'Gelen Kutusu' : 'Inbox',
          href: '/inbox',
          icon: Inbox,
          badge: unreadMessageCount > 0 ? unreadMessageCount : null,
        },
      ],
    },
    {
      groupTitle: isTR ? 'SİSTEM' : 'SYSTEM',
      items: [
        { label: isTR ? 'Draft Ligi' : 'Draft League', href: '/draft', icon: Gamepad2, isMultiplayer: true },
        { label: isTR ? 'Ayarlar' : 'Settings', href: '/settings', icon: Settings },
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

      {/* Sidebar Container: Fixed 100vh height, completely static, zero scrolling */}
      <aside
        className={`sc-career-sidebar fixed top-0 bottom-0 left-0 z-40 ${
          collapsed ? 'lg:w-[70px]' : 'lg:w-[235px]'
        } w-[240px] h-screen max-h-screen bg-[#090d0a]/98 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-all duration-200 select-none overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Main Body - Locked to viewport height, absolutely zero vertical scrolling */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
          <div>
            {/* Brand Header */}
            <div className="px-3.5 py-1.5 flex items-center justify-between border-b border-white/5">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <div className="w-5 h-5 rounded-[3px] bg-[#0d1611] border border-[#b7ff35]/60 flex items-center justify-center shadow-[0_0_8px_rgba(183,255,53,0.3)] shrink-0">
                  <span className="font-barlow font-extrabold text-[12px] text-[#b7ff35]">SC</span>
                </div>
                {!collapsed && (
                  <div className="flex flex-col leading-none">
                    <span className="font-barlow font-extrabold text-[15px] text-[#f3f6f3] tracking-wider uppercase">
                      SQUAD<span className="text-[#b7ff35]">CRAFT</span>
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 font-mono text-[7.5px] text-[#8f9a91] tracking-widest uppercase">
                      <span>{isTR ? 'MOTOR' : 'ENGINE'}</span>
                      <span className="w-1 h-1 rounded-full bg-[#65ff83] animate-pulse" />
                      <span className="text-[#65ff83] font-bold">{isTR ? 'AKTİF' : 'ONLINE'}</span>
                    </div>
                  </div>
                )}
              </Link>

              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1 rounded hover:bg-white/5 text-[#8f9a91] hover:text-[#f3f6f3] transition-colors"
                title={collapsed ? (isTR ? 'Genişlet' : 'Expand') : (isTR ? 'Daralt' : 'Collapse')}
              >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
              </button>
            </div>

            {/* Active Club Mini Module */}
            <div className={`mx-2.5 my-1 p-1.5 bg-[#0d130f] border border-white/10 rounded-md ${collapsed ? 'text-center' : ''}`}>
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'} overflow-hidden`}>
                <div className="relative group shrink-0">
                  <ClubBadge
                    code={userClub.code}
                    name={userClub.name}
                    clubId={userClub.id}
                    primaryColor={userClub.primaryColor}
                    secondaryColor={userClub.secondaryColor}
                    size="xs"
                  />
                </div>

                {!collapsed && (
                  <div className="truncate flex-1">
                    <div className="text-[11.5px] font-barlow font-extrabold uppercase text-[#f3f6f3] truncate leading-tight tracking-wide">
                      {userClub.name}
                    </div>
                    <div className="text-[9.5px] text-[#8f9a91] truncate font-mono flex items-center gap-1">
                      <span>{isTR ? 'Menajer' : 'Manager'}</span>
                      <span className="text-[#b7ff35] font-semibold">{userClub.managerName || 'Steve'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Groups - Compact Spacing to Fit on Screen without scroll */}
            <nav className="mt-0.5 space-y-0.5">
              {navGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-0">
                  {!collapsed && (
                    <div className="px-3 pt-0.5 pb-0 text-[7.5px] font-mono font-bold tracking-widest text-[#8f9a91]/70 uppercase">
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
                        className={`group relative flex items-center justify-between px-3 py-1 text-[11.5px] font-barlow font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          active
                            ? 'border-l-2 border-[#b7ff35] bg-[#b7ff35]/15 text-[#f3f6f3]'
                            : 'border-l-2 border-transparent text-[#8f9a91] hover:text-[#f3f6f3] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`flex items-center gap-2.5 ${collapsed ? 'mx-auto' : ''}`}>
                          <Icon
                            className={`w-3.5 h-3.5 transition-colors shrink-0 ${
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
                                className={`px-1 py-0.2 text-[7.5px] font-mono font-bold uppercase rounded ${
                                  active
                                    ? 'bg-[#17e5c2]/20 text-[#17e5c2] border border-[#17e5c2]/40'
                                    : 'bg-white/5 text-[#17e5c2]'
                                }`}
                              >
                                MP
                              </span>
                            )}
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[8px] font-mono font-black bg-[#ff5365] text-white rounded-full">
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

          {/* Bottom Status Footnote */}
          <div className="p-2 px-3 border-t border-white/10 bg-[#050706]">
            <div className="flex items-center justify-between font-mono text-[9px] text-[#8f9a91]">
              {!collapsed ? (
                <>
                  <span className="font-semibold">SQUADCRAFT 26</span>
                  <span className="text-[#b7ff35] font-bold">PRO LEAGUE</span>
                </>
              ) : (
                <span className="mx-auto text-[#b7ff35] font-bold">PRO</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
