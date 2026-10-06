'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimeLeft {
  minutes: number;
  seconds: number;
}

export const VaultCountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ minutes: 47, seconds: 23 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const minStr = String(timeLeft.minutes).padStart(2, '0');
  const secStr = String(timeLeft.seconds).padStart(2, '0');

  const m1 = minStr[0];
  const m2 = minStr[1];
  const s1 = secStr[0];
  const s2 = secStr[1];

  return (
    <div
      className="inline-flex flex-col items-center bg-[#1a1816]/85 border border-[#2ad4b4]/20 rounded-lg px-6 py-4 sm:px-8 sm:py-5 backdrop-blur-md shadow-2xl transition-all"
      style={{
        boxShadow: '0 12px 32px rgba(0,0,0,0.6), 0 0 24px rgba(42,212,180,0.08)',
      }}
    >
      {/* Label above */}
      <span
        className="font-cormorant italic text-[15px] text-[#9a8a7a] tracking-[0.04em] uppercase"
        style={{ letterSpacing: '0.04em' }}
      >
        NEXT SLOT IN
      </span>

      {/* Timer display: Bebas Neue, 80px (scaled for responsive), color #2ad4b4 */}
      <div
        className="font-bebas text-[54px] sm:text-[76px] md:text-[80px] text-[#2ad4b4] leading-none flex items-center select-none my-1 tracking-wider"
        style={{ textShadow: '0 0 20px rgba(42,212,180,0.3)' }}
      >
        {/* Minute tens digit */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`m1-${m1}`}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="inline-block tabular-nums"
          >
            {m1}
          </motion.span>
        </AnimatePresence>

        {/* Minute units digit */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`m2-${m2}`}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="inline-block tabular-nums"
          >
            {m2}
          </motion.span>
        </AnimatePresence>

        {/* Colon separator */}
        <span className="inline-block px-1 opacity-80 text-[#2ad4b4]">:</span>

        {/* Second tens digit */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`s1-${s1}`}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="inline-block tabular-nums"
          >
            {s1}
          </motion.span>
        </AnimatePresence>

        {/* Second units digit */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={`s2-${s2}`}
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            className="inline-block tabular-nums"
          >
            {s2}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Context below with pulsing teal dot */}
      <div className="flex items-center gap-2 mt-1">
        <motion.span
          className="inline-block w-2 h-2 rounded-full bg-[#2ad4b4] shadow-[0_0_8px_#2ad4b4]"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="font-inter text-[13px] text-[#6a5a4a] tracking-normal">
          Tuesday at 7:30pm · 2 spots remaining
        </span>
      </div>
    </div>
  );
};
