'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const REVIEWS = [
  {
    quote:
      "The Vault genuinely got my heart racing. The 23% escape rate is very real. We didn't make it — but we'll be back.",
    author: 'Tom & Sarah',
  },
  {
    quote:
      "Took our whole team for a work day. Best team building we've ever done. The debrief is surprisingly insightful.",
    author: 'Charlotte P., Marketing Director',
  },
  {
    quote:
      "Second time doing The Study and still didn't escape. Third time next month.",
    author: '@edinburghescapes',
  },
];

export const VaultReviews: React.FC = () => {
  return (
    <section
      id="reviews"
      className="bg-[#1a1816] w-full"
      style={{
        paddingTop: '64px',
        paddingBottom: '64px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      {/* Section Headline */}
      <h2
        className="font-bebas text-[#e8d4b0] tracking-[0.02em] mb-12"
        style={{
          fontSize: 'clamp(26px, 3.5vw, 56px)',
          letterSpacing: '0.02em',
        }}
      >
        WHAT ADVENTURERS SAY
      </h2>

      {/* 3 Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((rev, idx) => (
          <motion.div
            key={rev.author}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.15, ease: 'easeOut' }}
            className="bg-[#221e1c] border border-[#2a2420] rounded-[6px] p-7 flex flex-col justify-between hover:border-[#c9a55a]/40 transition-colors"
          >
            <div>
              {/* Stars: "★★★★★" gold (#c9a55a) */}
              <div
                className="text-[#c9a55a] text-[16px] mb-4 tracking-wider select-none"
              >
                ★★★★★
              </div>

              {/* Quote */}
              <p className="font-cormorant italic text-[17px] text-[#e8d4b0] leading-[1.65]">
                &ldquo;{rev.quote}&rdquo;
              </p>
            </div>

            {/* Attribution */}
            <p className="font-inter text-[13px] text-[#6a5a4a] mt-4 pt-4 border-t border-[#2a2420]/40">
              — {rev.author}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
