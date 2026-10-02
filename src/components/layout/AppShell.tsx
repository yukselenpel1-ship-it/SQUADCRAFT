'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
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
      <div className="arena-shell relative min-h-[100dvh] w-full text-[#F5F7FA] flex flex-col font-sans selection:bg-[#C7FF38] selection:text-black antialiased overflow-x-hidden">
        {isStandalonePage ? (
          <main className="flex-1 w-full min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Fixed SquadCraft Stadium Arena Background - Zero Blur, Crisp Atmosphere */}
            <div
              className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
            >
              {/* High-contrast crisp sports vignette: dark top, bottom and sides, zero blur */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#070A0F]/90 via-[#070A0F]/80 to-[#070A0F]/95" />
              <div className="absolute inset-0 bg-radial from-transparent via-[#070A0F]/50 to-[#070A0F]/90" />
            </div>

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area (offset by sidebar on desktop) */}
            <div className="relative lg:pl-64 flex flex-col min-h-[100dvh]">
              {/* Topbar */}
              <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Page Body */}
              <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-8 max-w-[1600px] w-full mx-auto">
                {children}
              </main>
            </div>
            <MobileBottomNav />
          </>
        )}
      </div>
    </GameProvider>
  );
};
