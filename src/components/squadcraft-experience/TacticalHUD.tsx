'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Settings, User, Globe, X, Volume2, Shield, Activity } from 'lucide-react';
import { FormationType } from './FormationVisualization';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';

interface TacticalHUDProps {
  currentFormation: FormationType;
  onFormationChange: (formation: FormationType) => void;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export function TacticalHUD({
  currentFormation,
  onFormationChange,
  onOpenAuth,
  onOpenSettings,
}: TacticalHUDProps) {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const isTr = language === 'tr';

  const [trailerOpen, setTrailerOpen] = useState(false);

  return (
    <>
      {/* 1. TOP GLOBAL BROADCAST HUD */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#05080D]/85 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* LEFT: SQUADCRAFT BRAND IDENTITY */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-[4px] bg-[#B7FF3C] text-[#05080D] flex items-center justify-center font-condensed font-black text-xl tracking-tighter group-hover:scale-105 transition-transform shadow-[0_0_16px_rgba(183,255,60,0.4)]">
                SC
              </div>
              <div className="flex flex-col">
                <span className="font-condensed font-black text-xl sm:text-2xl tracking-wider uppercase text-[#F2F6FA] leading-none">
                  SQUADCRAFT
                </span>
                <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#B7FF3C] leading-none mt-0.5">
                  COMMAND THE GAME
                </span>
              </div>
            </Link>

            {/* LIVE ENGINE TELEMETRY PILL (Hidden on small mobile) */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-ping" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#91A2B4]">
                ENGINE: <strong className="text-[#F2F6FA] font-bold">DETERMINISTIC V2</strong>
              </span>
            </div>
          </div>

          {/* RIGHT ACTIONS: TRAILER, LANGUAGE, SETTINGS, AUTH */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* TRAILER TEASER BUTTON */}
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] font-condensed font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Play size={13} className="text-[#38D8FF] fill-[#38D8FF]" />
              <span>{isTr ? 'FRAGMAN' : 'TRAILER'}</span>
            </button>

            {/* TR / EN LANGUAGE TOGGLE */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title={isTr ? 'Dili Değiştir (EN)' : 'Change Language (TR)'}
            >
              <Globe size={13} />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* GAME SETTINGS BUTTON */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
              title={isTr ? 'Oyun Ayarları' : 'Game Settings'}
            >
              <Settings size={16} />
            </button>

            {/* AUTH / PROFILE BUTTON */}
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[4px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_18px_rgba(183,255,60,0.35)] cursor-pointer active:scale-95"
            >
              <User size={14} />
              <span>{user ? (isTr ? 'HESABIM' : 'MY ACCOUNT') : (isTr ? 'GİRİŞ YAP' : 'SIGN IN')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BOTTOM TACTICAL CONTROL BAR (Interactive 3D Formation Switcher) */}
      <nav aria-label="Tactical Controls" className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-2xl w-[92%] sm:w-auto bg-[#080F18]/90 backdrop-blur-md border border-white/10 rounded-[8px] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.85)] flex items-center justify-between sm:justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 px-2 border-r border-white/10">
          <Activity size={14} className="text-[#B7FF3C]" />
          <span className="font-mono text-[10px] tracking-widest uppercase text-[#91A2B4] hidden sm:inline">
            {isTr ? 'FORMASYON:' : 'FORMATION:'}
          </span>
        </div>

        {/* Formation Switches: 4-3-3 | 4-2-3-1 | 3-4-3 */}
        {(['4-3-3', '4-2-3-1', '3-4-3'] as FormationType[]).map((f) => {
          const isActive = currentFormation === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onFormationChange(f)}
              className={`px-3 sm:px-4 py-1.5 rounded-[4px] font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#B7FF3C] text-[#05080D] shadow-[0_0_14px_rgba(183,255,60,0.4)] scale-105'
                  : 'text-[#91A2B4] hover:text-[#F2F6FA] hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          );
        })}

        {/* Telemetry Indicator */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#38D8FF]" />
          <span className="font-mono text-[9px] tracking-wider text-[#91A2B4] uppercase">
            3D HUD SYNC
          </span>
        </div>
      </nav>

      {/* 3. TEASER VIDEO MODAL (SquadCraft Cinematic Video) */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#080F18] border border-[#B7FF3C]/40 rounded-[8px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.9)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#05080D] border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
                <span className="font-condensed font-black text-lg uppercase tracking-wider text-[#F2F6FA]">
                  SQUADCRAFT // OFFICIAL TRAILER
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                className="p-1 rounded text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-video w-full bg-black">
              <video
                src="/media/homepage/squadcraft-teaser.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
