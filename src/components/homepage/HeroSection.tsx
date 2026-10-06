'use client';

import React from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowRight, Activity, ShieldAlert, Award } from 'lucide-react';

// Dynamic import with SSR: false for 3D R3F Canvas
const SquadCraftEnvironment = dynamic(
  () => import('@/components/three/SquadCraftEnvironment'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-radial from-[#b7ff35]/5 via-[#07120b]/80 to-[#050806]" />
    ),
  }
);

interface HeroSectionProps {
  onStartCareer: () => void;
  onEnterDraft: () => void;
}

export function HeroSection({ onStartCareer, onEnterDraft }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#050806] flex flex-col justify-between pt-24 pb-8 select-none">
      {/* 3D Stadium Environment Canvas behind UI */}
      <SquadCraftEnvironment showFootball={true} particleCount={400} />

      {/* Huge Background Word: SQUADCRAFT */}
      <div
        className="font-barlow font-extrabold pointer-events-none select-none z-0 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center"
        style={{
          fontSize: 'clamp(140px, 22vw, 400px)',
          color: '#f2f5f2',
          opacity: 0.022,
          letterSpacing: '-0.04em',
          lineHeight: 0.8,
        }}
        aria-hidden="true"
      >
        SQUADCRAFT
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 w-full max-w-[1500px] mx-auto px-6 sm:px-12 lg:px-16 my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Hero Typography & CTAs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Kicker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-[#b7ff35] shadow-[0_0_8px_#b7ff35]" />
            <span
              className="font-ibm text-[11px] text-[#b7ff35] uppercase font-medium tracking-[0.22em]"
              style={{ letterSpacing: '0.22em' }}
            >
              BUILD. MANAGE. DOMINATE.
            </span>
          </motion.div>

          {/* Main Hero Title (Split Lines) */}
          <div className="overflow-hidden mb-5">
            {/* Line 1 */}
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.82] tracking-normal"
              style={{ fontSize: 'clamp(68px, 9.5vw, 150px)' }}
            >
              YOUR CLUB.
            </motion.div>

            {/* Line 2 (Outlined Typography) */}
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.17, ease: [0.16, 1, 0.3, 1] }}
              className="font-barlow font-extrabold text-outline leading-[0.82] tracking-normal"
              style={{ fontSize: 'clamp(68px, 9.5vw, 150px)' }}
            >
              YOUR SYSTEM.
            </motion.div>

            {/* Line 3 */}
            <motion.div
              initial={{ y: 70, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.75, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.82] tracking-normal"
              style={{ fontSize: 'clamp(68px, 9.5vw, 150px)' }}
            >
              YOUR LEGACY.
            </motion.div>
          </div>

          {/* Hero Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.36, ease: 'easeOut' }}
            className="font-inter text-[16px] sm:text-[18px] text-[#99a39c] max-w-[560px] leading-[1.7] mb-8"
          >
            Build your squad. Shape your tactics. Control every decision from the transfer market to the final whistle.
          </motion.p>

          {/* Hero CTAs */}
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.44, ease: 'easeOut' }}
            className="flex flex-row flex-wrap items-center gap-4"
          >
            {/* Primary: START YOUR CAREER */}
            <button
              type="button"
              onClick={onStartCareer}
              className="group font-barlow font-bold text-[18px] tracking-wider text-[#050806] bg-[#b7ff35] hover:bg-[#9bea27] h-[54px] px-8 rounded-[3px] flex items-center gap-2.5 transition-all duration-200 cursor-pointer shadow-[0_4px_24px_rgba(183,255,53,0.35)] hover:translate-y-[-2px]"
            >
              START YOUR CAREER
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            {/* Secondary: ENTER DRAFT LEAGUE */}
            <button
              type="button"
              onClick={onEnterDraft}
              className="font-barlow font-bold text-[18px] tracking-wider text-[#f2f5f2] bg-transparent border border-white/25 hover:border-[#b7ff35] hover:text-[#b7ff35] h-[54px] px-8 rounded-[3px] flex items-center transition-all duration-200 cursor-pointer hover:bg-white/5"
            >
              ENTER DRAFT LEAGUE
            </button>
          </motion.div>
        </div>

        {/* Right Column: Hero Tactical HUD (5 cols) */}
        <div className="lg:col-span-5 flex justify-end">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-[6px] p-6 backdrop-blur-xl border border-white/10 shadow-2xl"
            style={{
              backgroundColor: 'rgba(7, 12, 8, 0.65)',
              borderLeft: '3px solid #b7ff35',
              transform: 'perspective(800px) rotateY(-4deg) rotateX(2deg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 25px rgba(183,255,53,0.08)',
            }}
          >
            {/* HUD Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest font-semibold">
                SC // LIVE SYSTEM
              </span>
              <span className="font-ibm text-[11px] text-[#8b958d]">
                SEASON 26/27
              </span>
            </div>

            {/* Tactical Metrics */}
            <div className="space-y-3 font-ibm text-[12px]">
              <div className="flex justify-between items-center">
                <span className="text-[#8b958d]">POSSESSION</span>
                <span className="text-[#b7ff35] font-bold">58%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[58%] h-full bg-[#b7ff35]" />
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[#8b958d]">EXPECTED GOALS (xG)</span>
                <span className="text-[#f2f5f2] font-bold">2.41</span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[#8b958d]">PRESS INTENSITY</span>
                <span className="text-[#17e5c2] font-bold">74 // HIGH</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[74%] h-full bg-[#17e5c2]" />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-[#8b958d]">TEAM FORM</span>
                <div className="flex gap-1.5 font-bold">
                  <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">W</span>
                  <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">W</span>
                  <span className="w-5 h-5 rounded-[2px] bg-[#ffc84a]/20 text-[#ffc84a] flex items-center justify-center text-[10px]">D</span>
                  <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">W</span>
                  <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">W</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom Match Ticker (Sports Broadcast ticker entering from bottom) */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.65, ease: 'easeOut' }}
        className="relative z-10 w-full border-t border-white/10 bg-[#050806]/85 backdrop-blur-md px-6 py-2.5 flex items-center justify-between"
      >
        <div className="max-w-[1500px] w-full mx-auto flex items-center justify-between font-ibm text-[12px]">
          <div className="flex items-center gap-3">
            <span className="text-[#8b958d]">MATCHDAY 08</span>
            <span className="text-white/20">|</span>
            <span className="font-barlow text-[16px] font-bold text-[#f2f5f2] tracking-wider">
              NORTHSTAR <span className="text-[#b7ff35]">2 — 1</span> IRONVALE
            </span>
            <span className="font-ibm text-[11px] text-[#8b958d]">84&apos;</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff4d5f] animate-ping" />
            <span className="font-ibm text-[11px] text-[#ff4d5f] font-bold tracking-wider">
              LIVE SIMULATION
            </span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
