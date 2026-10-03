'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Compass,
  Swords,
  Gamepad2,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Ana Sayfa', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Takım', href: '/squad', icon: Users },
    { label: 'Maçlar', href: '/fixtures', icon: Calendar },
    { label: 'Keşif', href: '/scouting', icon: Compass },
    { label: 'Taktik', href: '/tactics', icon: Swords },
    { label: 'Draft', href: '/draft', icon: Gamepad2 },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#07101C]/95 backdrop-blur-md border-t border-[#14233A] px-2 py-1.5 flex items-center justify-around lg:hidden safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[56px] ${
              active
                ? 'text-[#00F5A0]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {active && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00F5A0] shadow-[0_0_6px_#00F5A0]" />
              )}
            </div>
            <span className="text-[10px] font-bold tracking-tight mt-1 font-mono">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
