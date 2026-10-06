'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { VaultCountdownTimer } from './VaultCountdownTimer';

interface VaultHeroProps {
  onBookClick?: () => void;
  onViewRoomsClick?: () => void;
}

export const VaultHero: React.FC<VaultHeroProps> = ({
  onBookClick,
  onViewRoomsClick,
}) => {
  return (
    <section
      id="hero"
      className="relative min-h-screen w-full overflow-hidden bg-[#100e0c] flex flex-col justify-end"
      style={{ minHeight: '100vh' }}
    >
      {/* Background Photography — Heavy Victorian bank vault door ajar with warm golden light spilling through gap */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2084&auto=format&fit=crop"
          alt="Victorian vault door ajar with mysterious golden light in escape room"
          className="w-full h-full object-cover object-center filter brightness-[0.55] contrast-[1.15]"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        {/* Subtle smoky dust particles overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen bg-radial from-[#c9a55a]/10 via-transparent to-black"
        />
      </div>

      {/* Gradient overlay — composition independent (top AND bottom, not left-right) */}
      <div
        className="absolute inset-0 z-1 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(16,14,12,0.72) 0%, transparent 35%, transparent 60%, rgba(16,14,12,0.92) 100%)',
        }}
      />

      {/* Background text "VAULT" — bottom right */}
      <div
        className="font-bebas select-none"
        style={{
          fontSize: 'clamp(260px, 38vw, 560px)',
          color: '#2ad4b4',
          opacity: 0.025,
          position: 'absolute',
          right: '-3%',
          bottom: '10%',
          zIndex: 0,
          pointerEvents: 'none',
          lineHeight: 0.8,
        }}
        aria-hidden="true"
      >
        VAULT
      </div>

      {/* Content block — centered at bottom */}
      <div
        className="relative z-10 w-full text-center flex flex-col items-center pb-[8vh] pt-24"
        style={{
          paddingLeft: 'clamp(24px, 6vw, 96px)',
          paddingRight: 'clamp(24px, 6vw, 96px)',
        }}
      >
        {/* Kicker */}
        <p
          className="font-inter text-[12px] uppercase text-[#2ad4b4] tracking-[0.16em] mb-4 select-none"
          style={{ letterSpacing: '0.16em' }}
        >
          EDINBURGH OLD TOWN · RATED #1 ON TRIPADVISOR
        </p>

        {/* Main headline: "CAN YOU ESCAPE?" */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="font-bebas text-[#e8d4b0] tracking-[0.02em] select-none"
          style={{
            fontSize: 'clamp(72px, 11vw, 170px)',
            lineHeight: 0.9,
            letterSpacing: '0.02em',
            textShadow: '0 4px 30px rgba(0,0,0,0.8)',
          }}
        >
          CAN YOU ESCAPE?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          className="font-cormorant italic text-[19px] text-[#9a8a7a] mt-4 max-w-[560px] mx-auto leading-[1.65]"
        >
          Four immersive escape rooms in Edinburgh&apos;s Old Town. 60-90 minutes. 2-6 players. Rated #1 escape room in Edinburgh on TripAdvisor.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          className="flex flex-row flex-wrap items-center justify-center gap-3 mt-7"
        >
          {/* "Book Your Room" */}
          <button
            onClick={onBookClick}
            className="font-inter text-[15px] font-semibold text-[#100e0c] bg-[#2ad4b4] hover:bg-[#22b89e] px-8 py-4 rounded-[4px] transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(42,212,180,0.3)] hover:scale-[1.02]"
          >
            Book Your Room
          </button>

          {/* "View Rooms" */}
          <button
            onClick={onViewRoomsClick}
            className="font-inter text-[15px] text-[#c9a55a] bg-transparent border border-[#c9a55a]/50 hover:bg-[#c9a55a]/10 hover:border-[#c9a55a] px-8 py-4 rounded-[4px] transition-all duration-200 cursor-pointer"
          >
            View Rooms
          </button>
        </motion.div>

        {/* Live Countdown Timer Component */}
        <div className="mt-10">
          <VaultCountdownTimer />
        </div>
      </div>
    </section>
  );
};
