'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
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
      <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col font-sans selection:bg-[#00F5A0] selection:text-black antialiased overflow-x-hidden">
        {isStandalonePage ? (
          <main className="flex-1 w-full min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Fixed EA FC Stadium Arena Background - Zero Blur, Crisp Atmosphere */}
            <div
              className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
            >
              {/* High-contrast crisp sports vignette: dark top, bottom and sides, zero blur */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/90 via-[#04060A]/80 to-[#04060A]/95" />
              <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/50 to-[#04060A]/90" />
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area (offset by sidebar on desktop) */}
            <div className="relative z-10 lg:pl-64 flex flex-col min-h-screen">
              {/* Topbar */}
              <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Page Body */}
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
          </>
        )}
      </div>
    </GameProvider>
  );
};
