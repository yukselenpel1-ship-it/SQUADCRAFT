'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Flame } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  AnimatedCounter,
  MagneticButton,
} from '@/components/ui/react-bits';

export function LiveMatchPreview() {
  const { t } = useLanguage();
  const [matchMinute, setMatchMinute] = useState(67);
  const [matchSecond, setMatchSecond] = useState(24);
  const [isPlaying, setIsPlaying] = useState(true);
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore] = useState(1);
  const [goalFlash, setGoalFlash] = useState(false);

  // Live match clock simulation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setMatchSecond((prevSec) => {
        if (prevSec >= 59) {
          setMatchMinute((prevMin) => (prevMin >= 90 ? 1 : prevMin + 1));
          return 0;
        }
        return prevSec + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const triggerGoal = () => {
    setGoalFlash(true);
    setHomeScore((s) => s + 1);
    setTimeout(() => setGoalFlash(false), 1400);
  };

  return (
    <section className="relative w-full bg-[#050806] py-24 px-6 sm:px-12 lg:px-16 border-t border-white/5 select-none overflow-hidden">
      <div className="max-w-[1500px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <span className="font-ibm text-[11px] text-[#ff4d5f] tracking-[0.2em] uppercase font-semibold">
            <DecryptedText
              text={t.liveSimBadge}
              speed={28}
              maxIterations={10}
              animateOn="view"
            />
          </span>
          <h2
            className="font-barlow font-extrabold text-[#f2f5f2] leading-none tracking-tight mt-1"
            style={{ fontSize: 'clamp(44px, 6vw, 92px)' }}
          >
            {t.liveSimTitle}
          </h2>
          <p className="font-inter text-[16px] text-[#8b958d] mt-2">
            {t.liveSimDesc}
          </p>
        </div>

        {/* Live Match Engine Console with Matchday Media Backdrop */}
        <div className="rounded-[10px] border border-white/15 bg-[#090d0a] shadow-2xl p-6 sm:p-8 overflow-hidden relative">
          {/* Matchday Stadium Media Atmosphere Layer */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
            <img
              src="/media/homepage/matchday.webp"
              alt="Matchday Stadium Crowd Atmosphere"
              className="w-full h-full object-cover object-center filter brightness-[0.45] contrast-[1.25]"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 25%, rgba(5,8,6,0.2) 0%, rgba(9,13,10,0.88) 60%, #090d0a 100%)',
              }}
            />
          </div>

          {/* Goal Flash Overlay */}
          <AnimatePresence>
            {goalFlash && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#b7ff35]/20 backdrop-blur-sm z-30 flex items-center justify-center pointer-events-none"
              >
                <motion.span
                  initial={{ scale: 0.8, y: 30 }}
                  animate={{ scale: 1.2, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="font-barlow font-extrabold text-[120px] text-[#b7ff35] tracking-widest drop-shadow-[0_0_40px_#b7ff35]"
                >
                  {t.liveSimGoal}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Match Scoreboard Header */}
          <div className="relative z-10 bg-[#0e1611]/90 backdrop-blur-md border border-white/15 rounded-[8px] p-6 mb-8 flex flex-col items-center justify-center shadow-2xl">
            <div className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4d5f] animate-ping" />
              <span>MATCHDAY LIVE // POLAR STADIUM // 44,280 ATTENDANCE</span>
            </div>

            {/* Score & Teams */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-3xl">
              {/* Home Team */}
              <div className="flex-1 text-right">
                <span className="font-barlow font-extrabold text-[28px] sm:text-[44px] text-[#f2f5f2] uppercase tracking-wider block">
                  NORTHSTAR
                </span>
                <span className="font-ibm text-[11px] text-[#b7ff35]">HOME TACTICS: 4-3-3 HIGH PRESS</span>
              </div>

              {/* Big Score Typography */}
              <div className="flex flex-col items-center">
                <div className="font-barlow font-extrabold text-[54px] sm:text-[72px] text-[#f2f5f2] leading-none tracking-tight flex items-center gap-3">
                  <motion.span
                    key={`home-${homeScore}`}
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ duration: 0.4 }}
                    className="text-[#b7ff35]"
                  >
                    {homeScore}
                  </motion.span>
                  <span className="text-[#8b958d] text-[40px] font-normal">—</span>
                  <span className="text-[#f2f5f2]">{awayScore}</span>
                </div>

                {/* Match Clock */}
                <span className="font-ibm font-bold text-[16px] text-[#17e5c2] tracking-wider mt-1">
                  {String(matchMinute).padStart(2, '0')}:{String(matchSecond).padStart(2, '0')}
                </span>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-left">
                <span className="font-barlow font-extrabold text-[28px] sm:text-[44px] text-[#f2f5f2] uppercase tracking-wider block">
                  IRONVALE
                </span>
                <span className="font-ibm text-[11px] text-[#8b958d]">AWAY TACTICS: 5-3-2 LOW BLOCK</span>
              </div>
            </div>

            {/* Match Controls */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-[3px] bg-white/10 hover:bg-white/20 font-ibm text-[11px] text-[#f2f5f2] flex items-center gap-1.5 cursor-pointer"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
                {isPlaying ? 'PAUSE CLOCK' : 'RESUME CLOCK'}
              </button>

              <MagneticButton strength={0.16}>
                <button
                  type="button"
                  onClick={triggerGoal}
                  className="px-3.5 py-1.5 rounded-[3px] bg-[#b7ff35] hover:bg-[#a6f028] font-ibm text-[11px] text-[#050806] font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(183,255,53,0.3)]"
                >
                  <Flame size={12} />
                  SIMULATE HOME GOAL
                </button>
              </MagneticButton>
            </div>
          </div>

          {/* Match Momentum Bar Under Scoreboard */}
          <div className="mb-8 p-4 bg-[#0c120e] border border-white/10 rounded-[6px]">
            <div className="flex justify-between items-center font-ibm text-[11px] text-[#8b958d] mb-2">
              <span>MATCH MOMENTUM // HOME PRESSURE (+) VS AWAY (-)</span>
              <span className="text-[#b7ff35] font-semibold">NORTHSTAR DOMINATING (68%)</span>
            </div>
            {/* Momentum Bar Graph */}
            <div className="h-10 w-full flex items-center gap-1">
              {[12, 18, 25, 40, -15, 30, 45, 60, -20, 70, 85, 40, 20, 55, 75].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col justify-center items-center h-full">
                  <div
                    className={`w-full rounded-[1px] ${
                      val >= 0 ? 'bg-[#b7ff35]' : 'bg-[#17e5c2]'
                    }`}
                    style={{
                      height: `${Math.abs(val)}%`,
                      opacity: 0.4 + (idx / 15) * 0.6,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between font-ibm text-[10px] text-[#8b958d] mt-1.5 border-t border-white/5 pt-1">
              <span>0&apos;</span>
              <span>15&apos;</span>
              <span>30&apos;</span>
              <span>45&apos; (HT)</span>
              <span>60&apos;</span>
              <span className="text-[#b7ff35] font-bold">67&apos; (NOW)</span>
              <span>90&apos;</span>
            </div>
          </div>

          {/* 3 Columns: Event Feed | Tactical Pitch | Match Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 1. EVENT FEED (3 cols) */}
            <div className="lg:col-span-3 bg-[#0d1410] border border-white/10 rounded-[8px] p-5">
              <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest uppercase block mb-4 font-semibold">
                TIMELINE EVENTS
              </span>
              <div className="space-y-3 font-ibm text-[11px]">
                <div className="p-2.5 rounded bg-[#b7ff35]/15 border-l-2 border-[#b7ff35]">
                  <span className="text-[#b7ff35] font-bold block">67&apos; GOAL!</span>
                  <span className="text-[#f2f5f2] block">HUGO POPOV</span>
                  <span className="text-[#8b958d] text-[10px]">Assist: Aras Kimura</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 border-l-2 border-[#ffc84a]">
                  <span className="text-[#ffc84a] font-bold block">61&apos; YELLOW CARD</span>
                  <span className="text-[#f2f5f2]">Mikael Costa (Tactical foul)</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 border-l-2 border-[#17e5c2]">
                  <span className="text-[#17e5c2] font-bold block">54&apos; BIG CHANCE</span>
                  <span className="text-[#8b958d]">Kimura shot blocked (xG 0.28)</span>
                </div>
                <div className="p-2.5 rounded bg-[#b7ff35]/15 border-l-2 border-[#b7ff35]">
                  <span className="text-[#b7ff35] font-bold block">38&apos; GOAL!</span>
                  <span className="text-[#f2f5f2]">DENIZ LAURENT (Corner)</span>
                </div>
                <div className="p-2.5 rounded bg-white/5 border-l-2 border-[#ff4d5f]">
                  <span className="text-[#ff4d5f] font-bold block">19&apos; AWAY GOAL</span>
                  <span className="text-[#8b958d]">Ironvale counter-attack (Vance)</span>
                </div>
              </div>
            </div>

            {/* 2. LIVE PITCH RADAR (5 cols) */}
            <div className="lg:col-span-5 bg-[#090f0b] border border-white/10 rounded-[8px] p-5 flex flex-col items-center">
              <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider mb-3">
                TACTICAL RADAR // BALL IN FINAL THIRD
              </span>

              {/* Pitch Canvas Graphic */}
              <div className="relative w-full aspect-[4/3] rounded-[6px] border border-[#b7ff35]/30 bg-[#061009] p-3 shadow-inner overflow-hidden">
                {/* Grass lines */}
                <div className="absolute inset-0 border-2 border-white/10 m-2 pointer-events-none" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/10" />
                <div className="absolute left-0 top-1/4 bottom-1/4 w-12 border-r border-y border-white/10" />
                <div className="absolute right-0 top-1/4 bottom-1/4 w-12 border-l border-y border-white/10" />

                {/* Live Animated Players & Ball */}
                {/* Home Attackers (Lime) */}
                <motion.div
                  animate={{ x: [0, 8, -4, 0], y: [0, -6, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="absolute left-[70%] top-[45%] w-4 h-4 rounded-full bg-[#b7ff35] border-2 border-[#050806] shadow-[0_0_10px_#b7ff35] flex items-center justify-center font-ibm text-[8px] text-[#050806] font-bold"
                >
                  9
                </motion.div>
                <motion.div
                  animate={{ x: [0, -5, 6, 0], y: [0, 8, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                  className="absolute left-[58%] top-[30%] w-4 h-4 rounded-full bg-[#b7ff35] border-2 border-[#050806] shadow-[0_0_8px_#b7ff35] flex items-center justify-center font-ibm text-[8px] text-[#050806] font-bold"
                >
                  10
                </motion.div>
                <motion.div
                  animate={{ x: [0, 4, -6, 0], y: [0, -4, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                  className="absolute left-[62%] top-[65%] w-4 h-4 rounded-full bg-[#b7ff35] border-2 border-[#050806] shadow-[0_0_8px_#b7ff35] flex items-center justify-center font-ibm text-[8px] text-[#050806] font-bold"
                >
                  7
                </motion.div>

                {/* Away Defenders (Teal) */}
                <motion.div
                  animate={{ x: [0, -6, 3, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute left-[76%] top-[42%] w-4 h-4 rounded-full bg-[#17e5c2] border-2 border-[#050806] flex items-center justify-center font-ibm text-[8px] text-[#050806] font-bold"
                >
                  4
                </motion.div>
                <motion.div
                  animate={{ x: [0, 4, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="absolute left-[78%] top-[55%] w-4 h-4 rounded-full bg-[#17e5c2] border-2 border-[#050806] flex items-center justify-center font-ibm text-[8px] text-[#050806] font-bold"
                >
                  5
                </motion.div>

                {/* Moving Match Ball */}
                <motion.div
                  animate={{
                    x: [0, 16, -10, 0],
                    y: [0, -12, 8, 0],
                    scale: [1, 1.25, 0.95, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  className="absolute left-[66%] top-[40%] w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_#ffffff]"
                />
              </div>

              {/* Pitch status bar */}
              <div className="w-full flex justify-between font-ibm text-[11px] text-[#8b958d] mt-3 pt-2 border-t border-white/5">
                <span>TACTICAL PHASE: FINAL THIRD OVERLOAD</span>
                <span className="text-[#b7ff35]">ZONE 14 ACTIVE</span>
              </div>
            </div>

            {/* 3. MATCH STATS & RATINGS (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Detailed Metrics */}
              <div className="bg-[#0d1410] border border-white/10 rounded-[8px] p-5">
                <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider block mb-3">
                  MATCH STATS
                </span>
                <div className="space-y-3 font-ibm text-[12px]">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[#b7ff35] font-bold">58%</span>
                      <span className="text-[#8b958d]">POSSESSION</span>
                      <span className="text-[#17e5c2] font-bold">42%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full flex overflow-hidden">
                      <div className="w-[58%] h-full bg-[#b7ff35]" />
                      <div className="w-[42%] h-full bg-[#17e5c2]" />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#b7ff35] font-bold">
                      <AnimatedCounter value={13} duration={1.2} />
                    </span>
                    <span className="text-[#8b958d]">TOTAL SHOTS</span>
                    <span className="text-[#17e5c2] font-bold">
                      <AnimatedCounter value={8} duration={1.2} />
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#b7ff35] font-bold">
                      <AnimatedCounter value={6} duration={1.2} />
                    </span>
                    <span className="text-[#8b958d]">ON TARGET</span>
                    <span className="text-[#17e5c2] font-bold">
                      <AnimatedCounter value={3} duration={1.2} />
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-[#b7ff35] font-bold">
                      <AnimatedCounter value={2.18} decimals={2} duration={1.3} />
                    </span>
                    <span className="text-[#8b958d]">EXPECTED GOALS (xG)</span>
                    <span className="text-[#17e5c2] font-bold">
                      <AnimatedCounter value={1.07} decimals={2} duration={1.3} />
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-[#b7ff35] font-bold">
                      <AnimatedCounter value={5} duration={1.2} />
                    </span>
                    <span className="text-[#8b958d]">CORNERS</span>
                    <span className="text-[#17e5c2] font-bold">
                      <AnimatedCounter value={2} duration={1.2} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Ratings Module */}
              <div className="bg-[#0d1410] border border-white/10 rounded-[8px] p-5">
                <span className="font-ibm text-[11px] text-[#8b958d] uppercase tracking-wider block mb-3">
                  TOP PERFORMERS
                </span>
                <div className="space-y-2 font-ibm text-[11px]">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#f2f5f2]">HUGO POPOV (ST)</span>
                    <span className="text-[#b7ff35] font-bold text-[13px] bg-[#b7ff35]/10 px-2 py-0.5 rounded">
                      8.7
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#f2f5f2]">ARAS KIMURA (CM)</span>
                    <span className="text-[#b7ff35] font-bold text-[13px] bg-[#b7ff35]/10 px-2 py-0.5 rounded">
                      8.4
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#f2f5f2]">LUCA MORENO (LB)</span>
                    <span className="text-[#17e5c2] font-bold text-[13px] bg-[#17e5c2]/10 px-2 py-0.5 rounded">
                      7.8
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
