'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface VaultTealCTAProps {
  onBookClick?: () => void;
}

export const VaultTealCTA: React.FC<VaultTealCTAProps> = ({ onBookClick }) => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-[#2ad4b4] w-full text-center select-none"
      style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center">
        {/* Headline */}
        <h2
          className="font-bebas text-[#100e0c] tracking-[0.02em] leading-none"
          style={{
            fontSize: 'clamp(40px, 6vw, 100px)',
            letterSpacing: '0.02em',
          }}
        >
          THINK YOU CAN ESCAPE?
        </h2>

        {/* Sub */}
        <p
          className="font-cormorant italic text-[18px] mt-4 max-w-[540px] mx-auto"
          style={{ color: 'rgba(16, 14, 12, 0.72)' }}
        >
          Over 12,000 adventurers have tried. Fewer than half have escaped.
        </p>

        {/* Button */}
        <button
          onClick={onBookClick}
          className="font-inter text-[15px] font-semibold text-[#e8d4b0] bg-[#100e0c] hover:bg-[#c9a55a] hover:text-[#100e0c] px-10 py-5 rounded-[4px] mt-9 transition-colors duration-200 cursor-pointer shadow-xl hover:scale-[1.02]"
        >
          Book Your Room
        </button>

        {/* Context subtext */}
        <p
          className="font-inter text-[13px] mt-3"
          style={{ color: 'rgba(16, 14, 12, 0.6)' }}
        >
          3 slots available today · Instant booking confirmation
        </p>
      </div>
    </motion.section>
  );
};
