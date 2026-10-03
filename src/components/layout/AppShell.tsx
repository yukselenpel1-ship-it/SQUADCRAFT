'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GameProvider } from '@/lib/context/GameContext';

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Standalone full-screen routes that manage their own topbar / background
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/career/new' ||
    pathname.startsWith('/draft');

  return (
    <GameProvider>
      <div className="relative min-h-screen w-full bg-[#040711] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#00F5A0] selection:text-black antialiased overflow-x-hidden">
        {isStandalonePage ? (
          <main className="flex-1 w-full min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Dark glassmorphic background layer */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-radial from-[#070D1A] via-[#040711] to-[#020409]" />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area (offset by sidebar on desktop) */}
            <div className="relative lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
              {/* Topbar */}
              <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Page Body */}
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>

              {/* Mobile Bottom Navigation */}
              <MobileNav />
            </div>
          </>
        )}
      </div>
    </GameProvider>
  );
};
