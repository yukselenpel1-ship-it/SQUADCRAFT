'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, Settings, User, X, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { loadCareerMetadata } from '@/lib/career/careerStorage';

interface SignatureNavProps {
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export function SignatureNav({ onOpenAuth, onOpenSettings }: SignatureNavProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const isTr = language === 'tr';

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  // Load career metadata for smart career route
  useEffect(() => {
    try {
      const meta = loadCareerMetadata();
      setHasSave(!!meta?.exists);
    } catch {
      setHasSave(false);
    }
  }, []);

  // Native passive scroll listener (zero conflict with GSAP ScrollTrigger)
  useEffect(() => {
    const handleScroll = () => {
      const isPastThreshold = window.scrollY > 30;
      setScrolled((prev) => (prev !== isPastThreshold ? isPastThreshold : prev));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Handle escape key to close drawer or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (trailerOpen) setTrailerOpen(false);
        else if (mobileOpen) setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [trailerOpen, mobileOpen]);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  // Core navigation destinations (clean, editorial, no micro-icons)
  const navItems = [
    {
      label: isTr ? 'KARİYER' : 'CAREER',
      href: hasSave ? '/dashboard' : '/career/new',
      description: isTr ? 'Kendi hanedanını kur' : 'Build your legacy',
      badge: hasSave ? (isTr ? 'DEVAM ET' : 'ACTIVE') : undefined,
    },
    {
      label: isTr ? 'DRAFT LİGİ' : 'DRAFT LEAGUE',
      href: '/draft',
      description: isTr ? 'Canlı taktiksel PvP' : 'Live tactical PvP',
    },
    {
      label: isTr ? 'MAÇ MERKEZİ' : 'MATCH CENTER',
      href: '/match',
      description: isTr ? '2D simülasyon ve analiz' : '2D simulation & radar',
    },
  ];

  return (
    <>
      {/* =========================================================================
          GLOBAL SIGNATURE NAVIGATION BAR
          ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 safe-area-top transition-all duration-300 ${
          scrolled
            ? 'bg-[#070D14]/95 backdrop-blur-md border-b border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-[#05080D]/90 via-[#05080D]/40 to-transparent border-b border-white/[0.03]'
        }`}
      >
        <div className="max-w-[1480px] mx-auto px-6 lg:px-12 h-[72px] lg:h-[76px] flex items-center justify-between gap-6">
          {/* -------------------------------------------------------------------
              ZONE 1: SQUADCRAFT CREST & WORDMARK (Left)
              ------------------------------------------------------------------- */}
          <Link
            href="/"
            className="flex items-center gap-3.5 group cursor-pointer select-none focus:outline-none"
            aria-label="SquadCraft Home"
          >
            {/* Precision Architectural Crest */}
            <div className="relative flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 bg-[#070D14] border border-white/15 rounded-[3px] group-hover:border-[#B7FF3C]/60 group-hover:bg-[#0B131E] transition-all duration-200 overflow-hidden shadow-sm">
              {/* Tactical Lime Chamfer Corner */}
              <div className="absolute top-0 right-0 w-3 h-3 bg-[#B7FF3C] [clip-path:polygon(0_0,100%_0,100%_100%)] opacity-90 group-hover:opacity-100 transition-opacity" />
              {/* Monogram */}
              <span className="font-condensed font-black text-lg lg:text-xl tracking-tight text-[#F2F6FA] group-hover:text-white transition-colors">
                SC
              </span>
            </div>

            {/* Confident Athletic Wordmark */}
            <div className="flex flex-col">
              <span className="font-condensed font-black text-xl lg:text-2xl tracking-[0.06em] uppercase text-[#F2F6FA] group-hover:text-white transition-colors leading-none">
                SQUADCRAFT
              </span>
              <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#91A2B4] group-hover:text-[#B7FF3C] transition-colors leading-none mt-1">
                FOOTBALL SUITE
              </span>
            </div>
          </Link>

          {/* -------------------------------------------------------------------
              ZONE 2: CORE GAME MODES (Center Editorial Navigation)
              ------------------------------------------------------------------- */}
          <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative py-2 flex items-center gap-2 group cursor-pointer focus:outline-none"
                >
                  <span
                    className={`font-condensed font-bold text-[15px] xl:text-base tracking-[0.08em] uppercase transition-colors duration-150 ${
                      isActive
                        ? 'text-[#B7FF3C]'
                        : 'text-[#91A2B4] group-hover:text-[#F2F6FA]'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Saved Career Subtle Indicator */}
                  {item.badge && (
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] bg-[#B7FF3C]/12 text-[#B7FF3C] border border-[#B7FF3C]/30 tracking-wider">
                      {item.badge}
                    </span>
                  )}

                  {/* Restrained Hairline Underline on Hover/Active */}
                  <span
                    className={`absolute bottom-0 left-0 h-[2px] bg-[#B7FF3C] transition-all duration-200 ease-out ${
                      isActive ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* -------------------------------------------------------------------
              ZONE 3: UTILITIES & PRIMARY ACTION (Right)
              ------------------------------------------------------------------- */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 1. Official Trailer Trigger (Desktop) */}
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3.5 py-2 rounded-[2px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#C1CEDC] hover:text-white font-condensed font-bold text-xs uppercase tracking-[0.08em] transition-all cursor-pointer"
            >
              <Play size={11} className="fill-[#B7FF3C] text-[#B7FF3C]" />
              <span>{isTr ? 'FRAGMAN' : 'TRAILER'}</span>
            </button>

            {/* 2. Language Switcher (TR / EN Minimal Editorial Toggle) */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="hidden lg:flex items-center px-2.5 py-1.5 rounded-[2px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 font-mono text-xs tracking-wider transition-all cursor-pointer select-none"
              title={isTr ? 'Switch to English' : 'Türkçe Dilini Seç'}
            >
              <span className={language === 'tr' ? 'text-[#B7FF3C] font-semibold' : 'text-[#7A8B9E]'}>
                TR
              </span>
              <span className="text-white/20 mx-1 font-light">/</span>
              <span className={language === 'en' ? 'text-[#B7FF3C] font-semibold' : 'text-[#7A8B9E]'}>
                EN
              </span>
            </button>

            {/* 3. Settings Trigger (Desktop) */}
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label={isTr ? 'Oyun Ayarları' : 'Game Settings'}
              className="hidden lg:flex items-center justify-center w-9 h-9 rounded-[2px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-[#91A2B4] hover:text-white transition-all cursor-pointer"
            >
              <Settings size={15} />
            </button>

            {/* 4. PRIMARY ACTION CTA (Tactical Lime, Sharp Corners, Dominant Anchor) */}
            <button
              type="button"
              onClick={onOpenAuth}
              className="h-10 sm:h-10.5 px-4 sm:px-5 rounded-[2px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#070D14] font-condensed font-black text-xs sm:text-sm tracking-[0.08em] uppercase transition-all duration-150 shadow-[0_2px_14px_rgba(183,255,60,0.28)] active:translate-y-0.5 flex items-center gap-2 cursor-pointer select-none shrink-0"
            >
              {user ? (
                <>
                  <User size={14} className="stroke-[2.5]" />
                  <span>
                    {user.email ? user.email.split('@')[0].toUpperCase() : (isTr ? 'HESABIM' : 'ACCOUNT')}
                  </span>
                </>
              ) : (
                <>
                  <span>{isTr ? 'GİRİŞ YAP' : 'SIGN IN'}</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </>
              )}
            </button>

            {/* 5. MOBILE MENU TRIGGER (2-bar Architectural Sports Toggle) */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? (isTr ? 'Menüyü Kapat' : 'Close Menu') : (isTr ? 'Menüyü Aç' : 'Open Menu')}
              className="lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-[2px] bg-white/[0.04] border border-white/10 hover:border-white/20 text-[#F2F6FA] cursor-pointer transition-colors"
            >
              <span
                className={`block w-5 h-[2px] bg-current transition-transform duration-200 ${
                  mobileOpen ? 'rotate-45 translate-y-[3px]' : '-translate-y-1'
                }`}
              />
              <span
                className={`block w-5 h-[2px] bg-current transition-transform duration-200 ${
                  mobileOpen ? '-rotate-45 -translate-y-[1px]' : 'translate-y-1'
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          ACCESSIBLE MOBILE & TABLET SLIDE-OVER DRAWER
          ========================================================================= */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={closeMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isTr ? 'Navigasyon Menüsü' : 'Navigation Menu'}
            className="relative ml-auto w-full max-w-sm sm:max-w-md h-full bg-[#070D14] border-l border-white/10 p-6 pb-8 sm:pb-8 flex flex-col justify-between overflow-y-auto safe-area-top safe-area-bottom z-10 shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-250"
          >
            {/* Drawer Top Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-8">
                {/* Brand Identity */}
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-8 h-8 bg-[#070D14] border border-white/15 rounded-[3px] overflow-hidden">
                    <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#B7FF3C] [clip-path:polygon(0_0,100%_0,100%_100%)]" />
                    <span className="font-condensed font-black text-base text-[#F2F6FA]">
                      SC
                    </span>
                  </div>
                  <span className="font-condensed font-black text-xl tracking-[0.06em] uppercase text-[#F2F6FA]">
                    SQUADCRAFT
                  </span>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeMobile}
                  aria-label={isTr ? 'Kapat' : 'Close'}
                  className="flex items-center justify-center w-9 h-9 rounded-[2px] bg-white/[0.04] border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Group Header */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#7A8B9E] font-medium">
                  {isTr ? 'OYUN MODLARI' : 'GAME MODES'}
                </span>
                <span className="text-[10px] font-mono text-[#B7FF3C]">
                  v3.0 PRO
                </span>
              </div>

              {/* Core Game Modes List */}
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className="p-4 rounded-[3px] bg-[#0B131E] hover:bg-[#101B2B] border border-white/[0.06] hover:border-white/20 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-condensed font-black text-lg sm:text-xl uppercase tracking-[0.06em] text-[#F2F6FA] group-hover:text-white transition-colors">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] bg-[#B7FF3C]/15 text-[#B7FF3C] border border-[#B7FF3C]/30 tracking-wider">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-xs text-[#7A8B9E] mt-0.5">
                        {item.description}
                      </span>
                    </div>

                    <ArrowUpRight
                      size={18}
                      className="text-[#7A8B9E] group-hover:text-[#B7FF3C] transition-colors shrink-0 ml-3"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Drawer Bottom Actions & Utilities */}
            <div className="pt-6 pb-4 border-t border-white/10 flex flex-col gap-3 mt-8">
              {/* Teaser Video Action */}
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  setTrailerOpen(true);
                }}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-[2px] bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 text-[#F2F6FA] font-condensed font-bold text-sm uppercase tracking-[0.08em] transition-colors cursor-pointer"
              >
                <Play size={13} className="fill-[#B7FF3C] text-[#B7FF3C]" />
                <span>{isTr ? 'RESMİ FRAGMANI İZLE' : 'WATCH OFFICIAL TRAILER'}</span>
              </button>

              {/* Language & Settings Dual Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
                  className="h-11 flex items-center justify-center gap-2 rounded-[2px] bg-[#0B131E] border border-white/10 text-xs font-mono font-semibold text-[#91A2B4] hover:text-[#F2F6FA] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <span>DİL:</span>
                  <span className="text-[#B7FF3C]">{language.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    onOpenSettings();
                  }}
                  className="h-11 flex items-center justify-center gap-2 rounded-[2px] bg-[#0B131E] border border-white/10 text-xs font-condensed font-bold text-[#91A2B4] hover:text-[#F2F6FA] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <Settings size={14} />
                  <span>{isTr ? 'AYARLAR' : 'SETTINGS'}</span>
                </button>
              </div>

              {/* Account / Primary CTA */}
              <button
                type="button"
                onClick={() => {
                  closeMobile();
                  onOpenAuth();
                }}
                className="w-full h-12 flex items-center justify-center gap-2 rounded-[2px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#070D14] font-condensed font-black text-sm uppercase tracking-[0.08em] transition-all cursor-pointer shadow-[0_2px_14px_rgba(183,255,60,0.25)] active:translate-y-0.5 mt-1"
              >
                <User size={15} className="stroke-[2.5]" />
                <span>
                  {user
                    ? (isTr ? 'HESABIMI YÖNET' : 'MANAGE ACCOUNT')
                    : (isTr ? 'GİRİŞ YAP / KAYIT OL' : 'SIGN IN / REGISTER')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OFFICIAL TRAILER MODAL
          ========================================================================= */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Official Trailer"
            className="relative w-full max-w-4xl bg-[#070D14] border border-white/15 rounded-[4px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.95)]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#05080D] border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#B7FF3C]" />
                <span className="font-condensed font-black text-base sm:text-lg uppercase tracking-[0.08em] text-[#F2F6FA]">
                  SQUADCRAFT // OFFICIAL GAMEPLAY TRAILER
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrailerOpen(false)}
                aria-label={isTr ? 'Kapat' : 'Close'}
                className="p-1.5 rounded-[2px] text-[#91A2B4] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={18} />
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
