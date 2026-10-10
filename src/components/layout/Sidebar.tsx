'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();
  const { unreadMessageCount, userClub } = useGame();
  const { language } = useLanguage();

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
          className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sc-career-sidebar fixed top-0 bottom-0 left-0 z-40 ${
          collapsed ? 'lg:w-[70px]' : 'lg:w-[240px]'
        } w-[240px] h-screen max-h-screen bg-[#070D14]/98 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between transition-all duration-200 select-none overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Main Body */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden py-1">
          <div>
            {/* Brand Header */}
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/[0.08]">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                {/* Precision Architectural Crest */}
                <div className="relative flex items-center justify-center w-6 h-6 rounded-[2px] bg-[#050910] border border-white/15 overflow-hidden shrink-0 shadow-sm">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-[#B7FF3C] [clip-path:polygon(0_0,100%_0,100%_100%)]" />
                  <span className="font-condensed font-black text-xs text-[#F2F6FA]">SC</span>
                </div>

                {!collapsed && (
                  <div className="flex flex-col leading-none">
                    <span className="font-condensed font-black text-base text-[#F2F6FA] tracking-[0.06em] uppercase">
                      SQUADCRAFT
                    </span>
                    <div className="flex items-center gap-1 mt-0.5 font-mono text-[8px] text-[#91A2B4] tracking-widest uppercase">
                      <span>CAREER PRO</span>
                      <span className="w-1 h-1 rounded-full bg-[#B7FF3C] animate-pulse" />
                    </div>
                  </div>
                )}
              </Link>

              {/* Desktop Collapse Toggle */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1 rounded hover:bg-white/5 text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
                  title={collapsed ? (isTR ? 'Genişlet' : 'Expand') : (isTR ? 'Daralt' : 'Collapse')}
                >
                  {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
              )}
            </div>

            {/* Active Club Mini Module */}
            <div className={`mx-2.5 my-1.5 p-1.5 bg-[#050910] border border-white/10 rounded-[3px] ${collapsed ? 'text-center' : ''}`}>
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
                    <div className="text-xs font-condensed font-black uppercase text-[#F2F6FA] truncate leading-tight tracking-wide">
                      {userClub.name}
                    </div>
                    <div className="text-[9px] text-[#91A2B4] truncate font-mono flex items-center gap-1">
                      <span>{isTR ? 'Menajer' : 'Manager'}</span>
                      <span className="text-[#B7FF3C] font-semibold">{userClub.managerName || 'Steve'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Groups */}
            <nav className="mt-0.5 space-y-0.5">
              {navGroups.map((group) => (
                <div key={group.groupTitle} className="space-y-0">
                  {!collapsed && (
                    <div className="px-3 pt-1 pb-0.5 text-[8px] font-mono font-bold tracking-[0.16em] text-[#7A8B9E] uppercase">
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
                        className={`group relative flex items-center justify-between px-3 py-1.5 text-xs font-condensed font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          active
                            ? 'border-l-2 border-[#B7FF3C] bg-[#B7FF3C]/12 text-[#F2F6FA]'
                            : 'border-l-2 border-transparent text-[#91A2B4] hover:text-[#F2F6FA] hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className={`flex items-center gap-2.5 ${collapsed ? 'mx-auto' : ''}`}>
                          <Icon
                            className={`w-3.5 h-3.5 transition-colors shrink-0 ${
                              active
                                ? 'text-[#B7FF3C] drop-shadow-[0_0_8px_rgba(183,255,60,0.4)]'
                                : 'text-[#91A2B4] group-hover:text-[#F2F6FA]'
                            }`}
                          />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                        </div>

                        {!collapsed && (
                          <div className="flex items-center gap-1.5">
                            {item.isMultiplayer && (
                              <span
                                className={`px-1 py-0.2 text-[8px] font-mono font-bold uppercase rounded-[2px] ${
                                  active
                                    ? 'bg-[#38D8FF]/20 text-[#38D8FF] border border-[#38D8FF]/40'
                                    : 'bg-white/5 text-[#38D8FF]'
                                }`}
                              >
                                MP
                              </span>
                            )}
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[8px] font-mono font-black bg-[#FF4D5F] text-white rounded-[2px]">
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
          <div className="p-2.5 px-3 border-t border-white/[0.08] bg-[#050910]">
            <div className="flex items-center justify-between font-mono text-[9px] text-[#7A8B9E]">
              {!collapsed ? (
                <>
                  <span className="font-semibold text-[#91A2B4]">SQUADCRAFT 26</span>
                  <span className="text-[#B7FF3C] font-bold">PRO SUITE</span>
                </>
              ) : (
                <span className="mx-auto text-[#B7FF3C] font-bold">PRO</span>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
