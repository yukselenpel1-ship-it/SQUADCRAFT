'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface VaultNavbarProps {
  onBookClick?: () => void;
}

export const VaultNavbar: React.FC<VaultNavbarProps> = ({ onBookClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Our Rooms', href: '#rooms' },
    { label: 'Book Now', href: '#calendar' },
    { label: 'Team Building', href: '#team-building' },
    { label: 'Gift Cards', href: '#pricing' },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="sticky top-0 z-50 w-full h-16 flex items-center justify-between px-6 lg:px-16"
        style={{
          backgroundColor: 'rgba(16,14,12,0.96)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(42,212,180,0.12)',
        }}
      >
        {/* Left: Brand "The Vault" + thin teal dot */}
        <a href="#hero" className="flex items-center group cursor-pointer select-none">
          <span
            className="font-bebas text-[20px] text-[#e8d4b0] tracking-[0.06em] group-hover:text-white transition-colors"
            style={{ letterSpacing: '0.06em' }}
          >
            The Vault
          </span>
          <span
            className="w-[6px] h-[6px] bg-[#2ad4b4] rounded-full ml-2 inline-block shadow-[0_0_6px_#2ad4b4]"
          />
        </a>

        {/* Center: Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-inter text-[13px] text-[#9a8a7a] tracking-[0.02em] hover:text-[#e8d4b0] transition-colors duration-150"
              style={{ letterSpacing: '0.02em' }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right: "Book Now" CTA Button */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onBookClick}
            className="font-inter text-[14px] font-semibold text-[#100e0c] bg-[#2ad4b4] hover:bg-[#22b89e] px-5 py-2.5 rounded-[4px] transition-colors duration-200 cursor-pointer shadow-[0_2px_12px_rgba(42,212,180,0.25)]"
          >
            Book Now
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-[#e8d4b0] hover:text-[#2ad4b4] p-1.5 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed top-16 left-0 right-0 z-40 px-6 py-6 border-b border-[#2ad4b4]/20 flex flex-col gap-4"
          style={{
            backgroundColor: 'rgba(16,14,12,0.98)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="font-inter text-[15px] text-[#9a8a7a] hover:text-[#2ad4b4] py-2 transition-colors border-b border-[#2a2420]/50"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onBookClick?.();
            }}
            className="mt-2 w-full font-inter text-[14px] font-semibold text-[#100e0c] bg-[#2ad4b4] hover:bg-[#22b89e] py-3 rounded-[4px] transition-colors text-center cursor-pointer"
          >
            Book Now
          </button>
        </div>
      )}
    </>
  );
};
