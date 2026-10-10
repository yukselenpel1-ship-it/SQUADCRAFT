'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Trophy,
  Zap,
  Radio,
  SlidersHorizontal,
  ArrowRight,
  Globe,
  Settings,
  User,
  Play,
  Share2,
} from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { loadCareerMetadata } from '@/lib/career/careerStorage';

interface TacticalHUDProps {
  onOpenAuth: () => void;
  onOpenSettings: () => void;
}

export function TacticalHUD({ onOpenAuth, onOpenSettings }: TacticalHUDProps) {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const isTr = language === 'tr';

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasSave, setHasSave] = useState(false);

  useEffect(() => {
    const meta = loadCareerMetadata();
    setHasSave(!!meta?.exists);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    {
      label: isTr ? 'Kariyer' : 'Career',
      href: hasSave ? '/dashboard' : '/career/new',
      icon: Trophy,
      badge: hasSave ? (isTr ? 'KAYIT' : 'SAVE') : undefined,
    },
    {
      label: isTr ? 'Draft Ligi' : 'Draft League',
      href: '/draft',
      icon: Zap,
    },
    {
      label: isTr ? 'Maç Merkezi' : 'Match Center',
      href: '/match',
      icon: Radio,
    },
    {
      label: isTr ? 'Taktik' : 'Tactics',
      href: '/tactics',
      icon: SlidersHorizontal,
    },
  ];

  return (
    <>
      {/* 1. TOP GLOBAL BROADCAST NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#05080D]/90 backdrop-blur-md border-b border-white/10 safe-area-top transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* BRAND LOCKUP */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-8 h-8 rounded-[4px] bg-[#B7FF3C] text-[#05080D] flex items-center justify-center font-condensed font-black text-xl tracking-tighter group-hover:scale-105 transition-transform shadow-[0_0_16px_rgba(183,255,60,0.35)]">
              SC
            </div>
            <div className="flex flex-col">
              <span className="font-condensed font-black text-xl sm:text-2xl tracking-wider uppercase text-[#F2F6FA] leading-none">
                SQUADCRAFT
              </span>
              <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.22em] uppercase text-[#B7FF3C] leading-none mt-0.5">
                COMMAND THE GAME
              </span>
            </div>
          </Link>

          {/* DESKTOP PRIMARY GAME NAVIGATION */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-[4px] font-condensed font-bold text-sm lg:text-base uppercase tracking-wider text-[#91A2B4] hover:text-[#F2F6FA] hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <Icon size={15} className="group-hover:text-[#B7FF3C] transition-colors" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#B7FF3C]/15 text-[#B7FF3C] border border-[#B7FF3C]/30 rounded">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS (Desktop & Mobile) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* TRAILER TEASER (Desktop only) */}
            <button
              type="button"
              onClick={() => setTrailerOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] font-condensed font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Play size={13} className="text-[#38D8FF] fill-[#38D8FF]" />
              <span>{isTr ? 'FRAGMAN' : 'TRAILER'}</span>
            </button>

            {/* TR / EN LANGUAGE TOGGLE (Desktop) */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'tr' ? 'en' : 'tr')}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              title={isTr ? 'Dili Değiştir (EN)' : 'Change Language (TR)'}
            >
              <Globe size={13} />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* GAME SETTINGS (Desktop) */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="hidden lg:flex p-2 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
              title={isTr ? 'Oyun Ayarları' : 'Game Settings'}
            >
              <Settings size={15} />
            </button>

            {/* AUTH / PROFILE BUTTON */}
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_0_18px_rgba(183,255,60,0.35)] cursor-pointer active:scale-95 shrink-0"
            >
              <User size={14} />
              <span>{user ? (isTr ? 'HESABIM' : 'ACCOUNT') : (isTr ? 'GİRİŞ YAP' : 'SIGN IN')}</span>
            </button>

            {/* MOBILE / TABLET MENU TOGGLE (Hamburger / Close) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Menüyü Kapat' : 'Menüyü Aç'}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-[4px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. ACCESSIBLE MOBILE / TABLET NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative ml-auto w-full max-w-sm h-full bg-[#080F18] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto safe-area-top safe-area-bottom z-10 shadow-2xl">
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[3px] bg-[#B7FF3C] text-[#05080D] flex items-center justify-center font-condensed font-black text-lg">
                    SC
                  </div>
                  <span className="font-condensed font-black text-xl uppercase tracking-wider text-[#F2F6FA]">
                    SQUADCRAFT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded text-[#91A2B4] hover:text-[#F2F6FA] cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Game Mode Links */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono tracking-[0.2em] text-[#91A2B4] uppercase mb-1">
                  {isTr ? 'OYUN MODLARI' : 'GAME MODES'}
                </span>

                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-[6px] bg-[#111B27]/70 hover:bg-[#111B27] border border-white/5 active:border-[#B7FF3C]/40 text-[#F2F6FA] font-condensed font-bold text-lg uppercase tracking-wider transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={18} className="text-[#B7FF3C]" />
                        <span>{link.label}</span>
                      </div>
                      {link.badge ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-[#B7FF3C]/20 text-[#B7FF3C] border border-[#B7FF3C]/40 rounded">
                          {link.badge}
                        </span>
                      ) : (
                        <ArrowRight size={16} className="text-[#91A2B4]" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              {/* Trailer Video Trigger */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTrailerOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[6px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] font-condensed font-bold text-sm uppercase tracking-wider cursor-pointer"
              >
                <Play size={14} className="text-[#38D8FF] fill-[#38D8FF]" />
                <span>{isTr ? 'RESMİ FRAGMANI İZLE' : 'WATCH OFFICIAL TRAILER'}</span>
              </button>

              {/* Settings & Language row */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage(language === 'tr' ? 'en' : 'tr');
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#111B27] border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  <Globe size={14} />
                  <span>DİL: {language.toUpperCase()}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-[6px] bg-[#111B27] border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] font-mono text-xs uppercase font-bold cursor-pointer"
                >
                  <Settings size={14} />
                  <span>{isTr ? 'AYARLAR' : 'SETTINGS'}</span>
                </button>
              </div>

              {/* Auth Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[6px] bg-[#B7FF3C] text-[#05080D] font-condensed font-black text-base uppercase tracking-wider cursor-pointer active:scale-98"
              >
                <User size={16} />
                <span>{user ? (isTr ? 'HESABIMI YÖNET' : 'MANAGE ACCOUNT') : (isTr ? 'GİRİŞ YAP / KAYIT OL' : 'SIGN IN / REGISTER')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. TEASER VIDEO MODAL */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-[#080F18] border border-[#B7FF3C]/40 rounded-[8px] overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,0.9)]">
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
