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
import { ArrowRight, Shield, Zap, Sparkles, Crosshair } from 'lucide-react';

function HeroTacticalContent({
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
    <div className="relative min-h-[92vh] sm:min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-20 pb-16 pointer-events-none z-10">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* KICKER BADGE */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#B7FF3C]/30 backdrop-blur-md mb-6 pointer-events-auto transition-all duration-700 ${
            phase === 'blackout' ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B7FF3C]">
            {isTr ? 'YENİ NESİL TAKTİK KOMUTA MERKEZİ' : 'NEXT-GEN TACTICAL COMMAND'}
          </span>
        </div>

        {/* BROADCAST HEADLINE */}
        <h1
          className={`font-condensed text-5xl sm:text-7xl lg:text-9xl font-black uppercase tracking-tight text-[#F2F6FA] leading-[0.9] max-w-5xl transition-all duration-700 ${
            phase === 'blackout' || phase === 'stadium' || phase === 'field'
              ? 'opacity-0 scale-95'
              : 'opacity-100 scale-100'
          }`}
          style={{
            textShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 40px rgba(56,216,255,0.12)',
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

        {/* EDITORIAL SUBHEADING */}
        <p
          className={`font-sans text-base sm:text-lg lg:text-xl text-[#91A2B4] max-w-2xl mt-6 font-normal leading-relaxed pointer-events-auto transition-all duration-700 ${
            phase === 'blackout' || phase === 'stadium' || phase === 'field' || phase === 'nodes'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {isTr
            ? '60 FPS deterministik maç motoru, 22-oyuncu canlı taktik radar, 2000+ oyuncu veritabanı ve gerçek zamanlı çok oyunculu draft ligi.'
            : '60 FPS deterministic match engine, 22-player live tactical radar, 2000+ player database, and real-time multiplayer draft league.'}
        </p>

        {/* PRIMARY ACTION BUTTONS */}
        <div
          className={`flex flex-col sm:flex-row items-center gap-3.5 mt-8 pointer-events-auto transition-all duration-700 ${
            phase === 'interactive' || phase === 'complete'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          {/* Main Launch Button */}
          <button
            type="button"
            onClick={() => {
              if (careerMeta?.exists) {
                router.push('/dashboard');
              } else {
                router.push('/career/new');
              }
            }}
            className="flex items-center justify-center gap-2.5 px-8 py-4 rounded-[6px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-black text-lg uppercase tracking-wider transition-all duration-200 shadow-[0_0_30px_rgba(183,255,60,0.45)] cursor-pointer active:scale-95"
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
            <ArrowRight size={20} />
          </button>

          {/* Secondary Draft Button */}
          <button
            type="button"
            onClick={() => router.push('/draft')}
            className="flex items-center justify-center gap-2 px-7 py-4 rounded-[6px] bg-[#111B27]/90 hover:bg-[#192535] border border-white/15 hover:border-[#38D8FF]/40 text-[#F2F6FA] font-condensed font-black text-lg uppercase tracking-wider backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(56,216,255,0.15)]"
          >
            <Zap size={18} className="text-[#38D8FF]" />
            <span>{isTr ? 'Draft Ligine Gir' : 'Enter Draft Arena'}</span>
          </button>
        </div>

        {/* SELECTED PLAYER INSPECTION HUD OVERLAY (When on-pitch node is clicked) */}
        {selectedPlayer && (
          <div className="mt-8 pointer-events-auto bg-[#080F18]/95 border border-[#38D8FF]/50 rounded-[6px] p-3.5 px-6 backdrop-blur-md shadow-[0_0_30px_rgba(56,216,255,0.3)] flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-9 h-9 rounded-full bg-[#38D8FF] text-[#05080D] flex items-center justify-center font-mono font-black text-base">
              {selectedPlayer.number}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="font-condensed font-black text-lg uppercase text-[#F2F6FA]">
                  {selectedPlayer.name}
                </span>
                <span className="font-mono text-xs font-bold text-[#B7FF3C] px-1.5 py-0.5 bg-[#B7FF3C]/10 rounded border border-[#B7FF3C]/30">
                  {selectedPlayer.role}
                </span>
                {selectedPlayer.isKeyPlaymaker && (
                  <span className="font-mono text-[10px] text-[#38D8FF] uppercase tracking-wider font-semibold">
                    KEY PLAYMAKER
                  </span>
                )}
              </div>
              <span className="text-xs text-[#91A2B4]">
                {isTr ? 'Taktik Düğüm Seçildi • Formasyon Pozisyonu' : 'Tactical Node Selected • Formation Coordinate'}
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
    </div>
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
        {/* 1. GLOBAL SPORTS BROADCAST HUD */}
        <TacticalHUD
          currentFormation={formation}
          onFormationChange={(f) => setFormation(f)}
          onOpenAuth={() => setAuthModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* 2. 3D WEBGL HERO STAGE (Floating Pitch, Stadium & Dynamic Formations) */}
        <div className="relative w-full h-[92vh] sm:h-screen">
          <TacticalScene
            formation={formation}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={(id) => setSelectedPlayerId(id)}
            accentColor="#B7FF3C"
            cyanColor="#38D8FF"
            className="absolute inset-0 z-0"
          />

          {/* Hero Foreground Text & Controls */}
          <HeroTacticalContent
            formation={formation}
            onFormationChange={setFormation}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
          />
        </div>

        {/* 3. BROADCAST TELEMETRY RUNNER STRIP */}
        <div className="relative z-20 w-full bg-[#080F18] border-y border-white/10 py-3.5 px-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-4 text-xs font-mono tracking-widest uppercase text-[#91A2B4]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF3C]" />
              <span>STORAGE: <strong className="text-[#F2F6FA]">INDEXEDDB V3 CANONICAL</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38D8FF]" />
              <span>RADAR TICK: <strong className="text-[#F2F6FA]">60 FPS DETERMINISTIC</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC857]" />
              <span>DRAFT NETWORK: <strong className="text-[#F2F6FA]">SUPABASE REALTIME</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF3C]" />
              <span>XG MODEL: <strong className="text-[#F2F6FA]">POISSON + SHOT ANGLE</strong></span>
            </div>
          </div>
        </div>

        {/* 4. THREE SIGNATURE GAME WORLDS (Career Mode, Draft League, Match Center) */}
        <GameModeSelector />

        {/* 5. MINIMAL SOVEREIGN FOOTER */}
        <footer className="relative z-20 w-full bg-[#05080D] border-t border-white/10 py-10 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#91A2B4]">
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

        {/* 6. MODALS INTEGRATION */}
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
