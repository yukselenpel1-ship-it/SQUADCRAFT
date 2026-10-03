'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Play, ArrowLeftRight, Menu } from 'lucide-react';

const items = [
  { label: 'Ana Sayfa', href: '/dashboard', icon: Home },
  { label: 'Kadro', href: '/squad', icon: Users },
  { label: 'Oyna', href: '/fixtures', icon: Play, primary: true },
  { label: 'Pazar', href: '/transfers', icon: ArrowLeftRight },
  { label: 'Diğer', href: '/settings', icon: Menu },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Mobil oyun menüsü" className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-[#0B1018]/95 border-t border-[#253244] px-2 pt-2 safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-end justify-between">
        {items.map(({ label, href, icon: Icon, primary }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-[54px] w-[20%] flex-col items-center justify-center gap-1 text-[10px] font-bold ${primary ? '-mt-7' : ''} ${active ? 'text-[#C7FF38]' : 'text-[#9AA7B8]'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-transform ${primary ? 'bg-[#C7FF38] border-[#D9FF73] text-[#070A0F] shadow-[0_8px_24px_rgba(199,255,56,.25)]' : active ? 'bg-[#192536] border-[#C7FF38]/40' : 'border-transparent'}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
