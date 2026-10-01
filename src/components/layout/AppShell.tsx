'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GameProvider } from '@/lib/context/GameContext';

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Standalone pages (Homepage, New Career setup, and Draft Multiplayer routes) manage their own full-bleed layout
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/career/new' ||
    pathname.startsWith('/draft');

  return (
    <GameProvider>
      <div className="relative min-h-screen w-full bg-[#050B10] text-[#F3F7F8] flex flex-col font-sans selection:bg-[#65F56B] selection:text-black antialiased overflow-x-hidden">
        {/* Fixed SquadCraft Stadium Arena Background - High Contrast, Theme V2 */}
        <div
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
        >
          {/* Subtle cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050B10]/92 via-[#050B10]/85 to-[#050B10]/95" />
          <div className="absolute inset-0 bg-radial from-transparent via-[#050B10]/50 to-[#050B10]/90" />
        </div>

        {isStandalonePage ? (
          <main className="relative z-10 flex-1 w-full min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area (offset by sidebar on desktop) */}
            <div className="relative lg:pl-64 flex flex-col min-h-screen z-10">
              {/* Topbar */}
              <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Page Body */}
              <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-[1700px] w-full mx-auto">
                {children}
              </main>
            </div>
          </>
        )}
      </div>
    </GameProvider>
  );
};
