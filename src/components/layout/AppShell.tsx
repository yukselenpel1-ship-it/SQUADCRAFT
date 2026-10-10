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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
          <div
            className={`relative min-h-screen w-full bg-[#05080E] text-[#F2F6FA] flex flex-col font-sans selection:bg-[#B7FF3C] selection:text-[#05080E] antialiased overflow-x-hidden ${
              isStandalonePage ? '' : 'sc-career-theme'
            }`}
          >
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
                      'radial-gradient(ellipse at 50% -20%, rgba(183, 255, 60, 0.05), transparent 45%), radial-gradient(ellipse at 90% 20%, rgba(56, 216, 255, 0.03), transparent 35%), #05080E',
                  }}
                />

                {/* Sidebar */}
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  collapsed={sidebarCollapsed}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />

                {/* Main Content Area (offset by dynamic sidebar width on desktop) */}
                <div
                  className={`sc-career-main relative flex flex-col min-h-screen pb-20 lg:pb-0 transition-all duration-200 ${
                    sidebarCollapsed ? 'lg:pl-[70px]' : 'lg:pl-[240px]'
                  }`}
                >
                  {/* Topbar */}
                  <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                  {/* Page Body */}
                  <main className="sc-career-content flex-1 p-4 pb-28 sm:p-5 sm:pb-28 lg:p-6 lg:pb-8 w-full mx-auto">
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
