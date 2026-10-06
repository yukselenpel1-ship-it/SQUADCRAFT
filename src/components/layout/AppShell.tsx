'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileNav } from './MobileNav';
import { GameProvider } from '@/lib/context/GameContext';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { LanguageProvider } from '@/lib/context/LanguageContext';
import '@/styles/squadcraft-career-theme.css';

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Standalone full-screen routes that manage their own topbar / background
  const isStandalonePage =
    pathname === '/' ||
    pathname === '/career/new' ||
    pathname.startsWith('/draft') ||
    pathname.startsWith('/vault');

  return (
    <AuthProvider>
    <GameProvider>
    <LanguageProvider>
      <div className={`relative min-h-screen w-full bg-[#050806] text-[#f2f5f2] flex flex-col font-inter selection:bg-[#b7ff35] selection:text-[#050806] antialiased overflow-x-hidden ${isStandalonePage ? '' : 'sc-career-theme'}`}>
        {isStandalonePage ? (
          <main className="flex-1 w-full min-h-screen">
            {children}
          </main>
        ) : (
          <>
            {/* Stadium floodlight ambience in SQUADCRAFT Lime identity */}
            <div
              className="sc-career-stadium fixed inset-0 pointer-events-none z-0"
              style={{
                background:
                  'radial-gradient(circle at 50% -20%, rgba(183, 255, 53, 0.06), transparent 45%), radial-gradient(circle at 0% 100%, rgba(23, 229, 194, 0.04), transparent 35%), #050806',
              }}
            />

            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area (offset by sidebar on desktop) */}
            <div className="sc-career-main relative flex flex-col min-h-screen pb-16 lg:pb-0">
              {/* Topbar */}
              <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

              {/* Page Body */}
              <main className="sc-career-content flex-1 p-4 pb-24 sm:p-5 sm:pb-24 lg:p-6 lg:pb-8 w-full mx-auto">
                {children}
              </main>

              {/* Mobile Bottom Navigation */}
              <MobileNav />
            </div>
          </>
        )}
      </div>
    </LanguageProvider>
    </GameProvider>
    </AuthProvider>
  );
};
