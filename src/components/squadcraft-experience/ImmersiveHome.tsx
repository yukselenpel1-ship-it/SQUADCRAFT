'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TacticalScene } from './TacticalScene';
import { FormationType, TACTICAL_NODES } from './FormationVisualization';
import { GameModeSelector } from './GameModeSelector';
import { TacticalHUD } from './TacticalHUD';
import { CinematicIntroProvider, useCinematicIntro } from './CinematicIntro';
import { GameSettingsModal } from '@/components/modals/GameSettingsModal';
import AuthModal from '@/components/auth/AuthModal';
import { loadCareerMetadata, CareerSaveMeta } from '@/lib/career/careerStorage';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ArrowRight, Zap, SlidersHorizontal } from 'lucide-react';

function HeroSection({
  formation,
  onFormationChange,
  selectedPlayerId,
  onSelectPlayer,
}: {
  formation: FormationType;
  onFormationChange: (f: FormationType) => void;
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string | null) => void;
}) {
  const router = useRouter();
  const { language } = useLanguage();
  const isTr = language === 'tr';
  const { phase } = useCinematicIntro();

  const [careerMeta, setCareerMeta] = useState<CareerSaveMeta | null>(null);

  useEffect(() => {
    setCareerMeta(loadCareerMetadata());
  }, []);

  const selectedPlayer = TACTICAL_NODES.find((p) => p.id === selectedPlayerId);

  return (
    <section className="relative w-full min-h-[100svh] flex flex-col justify-between pt-24 pb-8 sm:pb-12 overflow-hidden z-10">
      {/* 3D WEBGL BACKGROUND CANVAS */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 sm:opacity-85">
        <TacticalScene
          formation={formation}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={(id) => onSelectPlayer(id)}
          accentColor="#B7FF3C"
          cyanColor="#38D8FF"
          className="w-full h-full"
        />
        {/* Soft Vignette Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080D]/80 via-transparent to-[#05080D] pointer-events-none" />
      </div>

      {/* FOREGROUND HERO CONTENT */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 my-auto flex flex-col items-center text-center">
        {/* KICKER */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#B7FF3C]/30 backdrop-blur-md mb-4 sm:mb-6">
          <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] text-[#B7FF3C]">
            {isTr ? 'YENİ NESİL FUTBOL MENAJERLİĞİ' : 'NEXT-GEN FOOTBALL MANAGEMENT'}
          </span>
        </div>

        {/* BROADCAST HEADLINE */}
        <h1
          className="font-condensed text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-[#F2F6FA] leading-[0.95] max-w-4xl"
          style={{
            textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 0 35px rgba(56,216,255,0.15)',
          }}
        >
          {isTr ? (
            <>
              FUTBOLU <span className="text-[#B7FF3C]">YÖNET</span>
              <br />
              ZAFERİ İNŞA ET
            </>
          ) : (
            <>
              COMMAND <span className="text-[#B7FF3C]">THE GAME</span>
              <br />
              BUILD A DYNASTY
            </>
          )}
        </h1>

        {/* SUBTITLE */}
        <p className="font-sans text-xs sm:text-base md:text-lg text-[#91A2B4] max-w-xl sm:max-w-2xl mt-4 sm:mt-6 leading-relaxed">
          {isTr
            ? '60 FPS deterministik maç motoru, 22-oyunculu canlı taktik radar, 2000+ kurgusal oyuncu veritabanı ve gerçek zamanlı draft ligi.'
            : '60 FPS deterministic match engine, 22-player live tactical radar, 2000+ player fictional database, and real-time multiplayer draft league.'}
        </p>

        {/* PRIMARY CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 sm:mt-8 w-full sm:w-auto max-w-sm sm:max-w-none">
          <button
            type="button"
            onClick={() => {
              if (careerMeta?.exists) {
                router.push('/dashboard');
              } else {
                router.push('/career/new');
              }
            }}
            className="h-12 sm:h-14 px-7 sm:px-8 rounded-[6px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_0_24px_rgba(183,255,60,0.35)] cursor-pointer active:scale-95"
          >
            <span>
              {careerMeta?.exists
                ? isTr
                  ? 'Kariyere Devam Et'
                  : 'Continue Career'
                : isTr
                ? 'Kariyer Başlat'
                : 'Start Career'}
            </span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => router.push('/draft')}
            className="h-12 sm:h-14 px-6 sm:px-7 rounded-[6px] bg-[#111B27]/90 hover:bg-[#192535] border border-white/15 hover:border-[#38D8FF]/40 text-[#F2F6FA] font-condensed font-black text-base sm:text-lg uppercase tracking-wider backdrop-blur-md flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Zap size={17} className="text-[#38D8FF]" />
            <span>{isTr ? 'Draft Ligine Gir' : 'Enter Draft Arena'}</span>
          </button>
        </div>

        {/* ON-PITCH SELECTED PLAYER INSPECTION */}
        {selectedPlayer && (
          <div className="mt-6 bg-[#080F18]/95 border border-[#38D8FF]/50 rounded-[6px] p-3 px-5 backdrop-blur-md shadow-xl flex items-center gap-3.5 animate-in fade-in duration-150">
            <div className="w-8 h-8 rounded-full bg-[#38D8FF] text-[#05080D] flex items-center justify-center font-mono font-black text-sm">
              {selectedPlayer.number}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-base uppercase text-[#F2F6FA]">
                  {selectedPlayer.name}
                </span>
                <span className="font-mono text-[10px] font-bold text-[#B7FF3C] px-1.5 py-0.2 bg-[#B7FF3C]/10 rounded border border-[#B7FF3C]/30">
                  {selectedPlayer.role}
                </span>
              </div>
              <span className="text-[11px] text-[#91A2B4]">
                {isTr ? 'Taktik Formasyon Pozisyonu' : 'Tactical Formation Coordinate'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectPlayer(null)}
              className="text-[#91A2B4] hover:text-[#F2F6FA] ml-2 text-xs uppercase font-mono cursor-pointer"
            >
              [X]
            </button>
          </div>
        )}
      </div>

      {/* FORMATION SWITCHER SEGMENTED CONTROL */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-4 mt-6 sm:mt-10">
        <div className="flex items-center justify-center gap-1 sm:gap-2 p-1.5 rounded-[6px] bg-[#080F18]/90 border border-white/10 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-1.5 px-2 text-[#91A2B4]">
            <SlidersHorizontal size={13} className="text-[#B7FF3C]" />
            <span className="font-mono text-[10px] tracking-widest uppercase hidden xs:inline">
              {isTr ? 'FORMASYON:' : 'FORMATION:'}
            </span>
          </div>
          {(['4-3-3', '4-2-3-1', '3-4-3'] as FormationType[]).map((f) => {
            const isActive = formation === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onFormationChange(f)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-[4px] font-mono text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B7FF3C] text-[#05080D] shadow-[0_0_12px_rgba(183,255,60,0.35)] scale-102'
                    : 'text-[#91A2B4] hover:text-[#F2F6FA] hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ImmersiveHome() {
  const [formation, setFormation] = useState<FormationType>('4-3-3');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <CinematicIntroProvider>
      <div className="relative min-h-screen w-full bg-[#05080D] text-[#F2F6FA] font-sans selection:bg-[#B7FF3C] selection:text-[#05080D] overflow-x-hidden">
        {/* 1. TOP GLOBAL BROADCAST NAVBAR */}
        <TacticalHUD
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* 2. RESPONSIVE HERO STAGE WITH 3D WEBGL BACKGROUND */}
        <HeroSection
          formation={formation}
          onFormationChange={setFormation}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={setSelectedPlayerId}
        />

        {/* 3. THREE SIGNATURE GAME WORLDS (Career Mode, Draft League, Match Center) */}
        <GameModeSelector />

        {/* 4. CLEAN FOOTER */}
        <footer className="relative z-20 w-full bg-[#05080D] border-t border-white/10 py-10 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#91A2B4] text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-condensed font-black text-base text-[#F2F6FA]">SQUADCRAFT</span>
              <span>// COMMAND THE GAME</span>
            </div>
            <div>
              ALL TEAMS, PLAYERS, AND COMPETITIONS ARE 100% FICTIONAL LORE.
            </div>
            <div>
              &copy; {new Date().getFullYear()} SQUADCRAFT. ALL RIGHTS RESERVED.
            </div>
          </div>
        </footer>

        {/* 5. MODALS INTEGRATION */}
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
    </CinematicIntroProvider>
  );
}
