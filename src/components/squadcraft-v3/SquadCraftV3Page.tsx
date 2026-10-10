'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ScrollStoryProvider, useScrollStory } from './useScrollStory';
import { StoryDOMOverlay } from './StoryDOMOverlay';
import { TacticalHUD } from '../squadcraft-experience/TacticalHUD';
import { GameSettingsModal } from '@/components/modals/GameSettingsModal';
import AuthModal from '@/components/auth/AuthModal';

// Dynamic client-only import for WorldCanvas (WebGL)
const WorldCanvas = dynamic(
  () => import('./WorldCanvas').then((mod) => mod.WorldCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-0 bg-[#05080D] pointer-events-none" />
    ),
  }
);

function V3Inner() {
  const { containerRef } = useScrollStory();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#05080D] text-[#F2F6FA] font-sans selection:bg-[#B7FF3C] selection:text-[#05080D]"
    >
      {/* 1. TOP GLOBAL BROADCAST NAVBAR & MOBILE DRAWER */}
      <TacticalHUD
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 2. PERSISTENT 3D WEBGL WORLD CANVAS (Fixed Background) */}
      <WorldCanvas />

      {/* 3. SEMANTIC 5-ACT SCROLL DOM OVERLAY */}
      <StoryDOMOverlay />

      {/* 4. MODALS INTEGRATION */}
      <AuthModal
        open={authModalOpen}
        initialMode="signin"
        onClose={() => setAuthModalOpen(false)}
      />

      <GameSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export function SquadCraftV3Page() {
  return (
    <ScrollStoryProvider>
      <V3Inner />
    </ScrollStoryProvider>
  );
}
