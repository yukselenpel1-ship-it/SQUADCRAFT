'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SquadCraftNavbar } from '@/components/layout/SquadCraftNavbar';
import { HeroSection } from '@/components/homepage/HeroSection';
import { ModeSelector } from '@/components/homepage/ModeSelector';
import { WorldStrip } from '@/components/homepage/WorldStrip';
import { FeatureShowcase } from '@/components/homepage/FeatureShowcase';
import { PlayerShowcase } from '@/components/homepage/PlayerShowcase';
import { CareerPreview } from '@/components/homepage/CareerPreview';
import { DraftPreview } from '@/components/homepage/DraftPreview';
import { LiveMatchPreview } from '@/components/homepage/LiveMatchPreview';
import { LeaguePreview } from '@/components/homepage/LeaguePreview';
import { ManagerPreview } from '@/components/homepage/ManagerPreview';
import { FinalCTA } from '@/components/homepage/FinalCTA';
import { SquadCraftFooter } from '@/components/layout/SquadCraftFooter';
import { GameSettingsModal } from '@/components/modals/GameSettingsModal';

export default function SquadCraftHomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Home');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleStartCareer = () => {
    // Navigate smoothly to career route or career new
    router.push('/career/new');
  };

  const handleEnterDraft = () => {
    // Navigate smoothly to draft league lobby
    router.push('/draft');
  };

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050806] text-[#f2f5f2] selection:bg-[#b7ff35] selection:text-[#050806] font-inter overflow-x-hidden">
      {/* 1. Global Sports Broadcast Navbar */}
      <SquadCraftNavbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenProfile={() => handleScrollTo('manager')}
      />

      {/* 2. Hero Section with 3D Stadium Environment & Floating Football */}
      <div id="hero">
        <HeroSection
          onStartCareer={handleStartCareer}
          onEnterDraft={handleEnterDraft}
        />
      </div>

      {/* 3. Game Mode Select: Career Mode & Draft League */}
      <div id="career-preview">
        <ModeSelector
          onSelectCareer={handleStartCareer}
          onSelectDraft={handleEnterDraft}
        />
      </div>

      {/* 4. SquadCraft World Strip & Infinite Marquee */}
      <WorldStrip />

      {/* 5. Gameplay Features: Transfers, 3D Tactical Pitch, Scouting, Youth */}
      <div id="tactics">
        <FeatureShowcase />
      </div>

      {/* 6. 3D Player Card Showcase */}
      <PlayerShowcase />

      {/* 7. Career Mode Command Suite Preview */}
      <CareerPreview />

      {/* 8. Live Draft Room Stage */}
      <div id="draft-preview">
        <DraftPreview />
      </div>

      {/* 9. Live Match Simulation & Tactical Radar */}
      <div id="transfers">
        <LiveMatchPreview />
      </div>

      {/* 10. League Table & Fixtures Timeline */}
      <div id="league">
        <LeaguePreview />
      </div>

      {/* 11. Manager Profile & Trophy Room */}
      <div id="manager">
        <ManagerPreview />
      </div>

      {/* 12. Final CTA: Your Season Starts Here */}
      <FinalCTA
        onStartCareer={handleStartCareer}
        onEnterDraft={handleEnterDraft}
      />

      {/* 13. Broadcast Minimal Footer */}
      <SquadCraftFooter />

      {/* System Settings & Accessibility Modal */}
      <GameSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
