'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, User, Menu, X, Shield, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';

interface SquadCraftNavbarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

export function SquadCraftNavbar({
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenProfile,
  onOpenAuth,
}: SquadCraftNavbarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { key: 'home', label: t.navHome, href: '#hero' },
    { key: 'career', label: t.navCareer, href: '#career-preview' },
    { key: 'draft', label: t.navDraft, href: '#draft-preview' },
    { key: 'club', label: t.navClub, href: '#tactics' },
    { key: 'transfers', label: t.navTransfers, href: '#transfers' },
    { key: 'competition', label: t.navCompetition, href: '#league' },
  ];

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 lg:px-12 select-none"
        style={{
          backgroundColor: 'rgba(5, 8, 6, 0.85)',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        {/* Left: SQUADCRAFT Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[4px] bg-[#0d1611] border border-[#b7ff35]/60 flex items-center justify-center shadow-[0_0_12px_rgba(183,255,53,0.3)]">
            <span className="font-barlow font-extrabold text-[17px] text-[#b7ff35] tracking-tight">
              SC
            </span>
          </div>
          <span className="font-barlow font-extrabold text-[24px] text-[#f2f5f2] tracking-wider uppercase">
            SQUAD<span className="text-[#b7ff35]">CRAFT</span>
          </span>
        </div>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = activeTab === link.label || activeTab === link.key;
            return (
              <a
                key={link.key}
                href={link.href}
                onClick={() => onTabChange?.(link.label)}
                className={`relative font-inter text-[13px] tracking-wide py-2 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#f2f5f2] font-semibold'
                    : 'text-[#8b958d] hover:text-[#f2f5f2]'
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavLine"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#b7ff35] shadow-[0_0_8px_#b7ff35]"
                  />
                )}
              </a>
            );
          })}
        </div>

        {/* Right: Notifications, Manager Profile, Settings */}
        <div className="hidden md:flex items-center gap-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 rounded-[4px] text-[#8b958d] hover:text-[#f2f5f2] hover:bg-white/5 transition-colors cursor-pointer"
            title={t.navNotifications}
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#b7ff35] shadow-[0_0_6px_#b7ff35]" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-[4px] text-[#8b958d] hover:text-[#f2f5f2] hover:bg-white/5 transition-colors cursor-pointer"
            title={t.navSettings}
          >
            <Settings size={18} />
          </button>

          {/* Auth Giriş / Profile Button */}
          <button
            type="button"
            onClick={onOpenAuth || onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-[4px] bg-[#0c1410] border border-white/10 hover:border-[#b7ff35]/60 hover:bg-[#b7ff35]/10 text-[#f2f5f2] hover:text-[#b7ff35] transition-all cursor-pointer shadow-sm active:scale-95"
            title={user ? `Menajer: ${user.username}` : 'Giriş Yap / Kayıt Ol'}
          >
            <div className="w-6 h-6 rounded-full bg-[#b7ff35]/20 text-[#b7ff35] flex items-center justify-center font-ibm text-[11px] font-bold">
              {user ? (
                user.username.slice(0, 2).toUpperCase()
              ) : (
                <LogIn size={13} className="text-[#b7ff35]" />
              )}
            </div>
            <span className="font-barlow font-bold text-[15px] tracking-wide uppercase">
              {user ? user.username : 'GİRİŞ'}
            </span>
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#f2f5f2] p-1.5 focus:outline-none"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed top-[72px] left-0 right-0 z-40 px-6 py-6 border-b border-white/10 flex flex-col gap-3"
          style={{
            backgroundColor: 'rgba(5, 8, 6, 0.98)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              onClick={() => {
                setMobileMenuOpen(false);
                onTabChange?.(link.label);
              }}
              className="font-barlow font-bold text-[18px] text-[#f2f5f2] py-2 border-b border-white/5 tracking-wider uppercase"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-4 pt-3">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSettings?.();
              }}
              className="flex-1 py-2.5 rounded bg-white/5 border border-white/10 text-center font-ibm text-[12px] text-[#f2f5f2]"
            >
              {t.settingsTitle}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAuth) onOpenAuth();
                else onOpenProfile?.();
              }}
              className="flex-1 py-2.5 rounded bg-[#b7ff35] text-[#050806] font-barlow font-bold text-[16px] tracking-wider text-center cursor-pointer shadow-md"
            >
              {user ? user.username.toUpperCase() : 'GİRİŞ YAP'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
