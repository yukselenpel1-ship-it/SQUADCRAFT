'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ArrowRight, Volume2, VolumeX, Play, Pause, Tv } from 'lucide-react';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  DecryptedText,
  SplitText,
  MagneticButton,
  SpotlightCard,
  AnimatedCounter,
} from '@/components/ui/react-bits';

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
  const { language, t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleSound = () => {
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#050806] flex flex-col justify-between pt-24 pb-8 select-none">
      {/* 1. CINEMATIC VIDEO & POSTER BACKDROP LAYER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* High-res stadium fallback background */}
        <img
          src="/media/homepage/hero-background.webp"
          alt="SquadCraft Stadium"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.38] contrast-[1.2]"
        />

        {/* Cinematic MP4 Teaser Loop */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          poster="/media/homepage/hero-poster.webp"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.48] contrast-[1.22] transition-opacity duration-1000"
        >
          <source src="/media/homepage/squadcraft-teaser.mp4" type="video/mp4" />
        </video>

        {/* Stadium Floodlight & Vignette Gradient Overlays for High Legibility */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,8,6,0.78) 0%, rgba(5,8,6,0.45) 30%, rgba(5,8,6,0.72) 70%, #050806 100%)',
          }}
        />

        {/* Broadcast Vignette Radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, transparent 35%, rgba(5,8,6,0.85) 90%)',
          }}
        />

        {/* Subtle Pitch Grid Geometry */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #b7ff35 1px, transparent 0)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* 2. 3D Stadium Environment Canvas Floating Football */}
      <SquadCraftEnvironment showFootball={true} particleCount={160} />

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

      {/* 3. Hero Content Container */}
      <div className="relative z-10 w-full max-w-[1500px] mx-auto px-6 sm:px-12 lg:px-16 my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Hero Typography & CTAs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Athletic Kicker with Decrypted Text & Video Live Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-3 mb-4"
          >
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-[3px] bg-[#b7ff35]/10 border border-[#b7ff35]/30">
              <span className="w-2 h-2 rounded-full bg-[#b7ff35] shadow-[0_0_8px_#b7ff35] animate-pulse" />
              <span className="font-ibm text-[11px] text-[#b7ff35] uppercase font-semibold tracking-[0.2em]">
                <DecryptedText
                  text={t.heroKicker}
                  speed={30}
                  maxIterations={12}
                  animateOn="view"
                />
              </span>
            </div>

            {/* Broadcast Live Feed Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/5 border border-white/10 text-[#8b958d] font-ibm text-[10px] uppercase">
              <Tv size={11} className="text-[#17e5c2]" />
              <span>4K BROADCAST TEASER</span>
            </div>
          </motion.div>

          {/* Main Hero Title (Split Athletic Typography) */}
          <div className="overflow-hidden mb-6 space-y-1">
            <SplitText
              text={t.heroLine1}
              className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.82] tracking-normal uppercase text-[clamp(64px,9.2vw,144px)] block drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              delay={0.04}
            />

            <SplitText
              text={t.heroLine2}
              className="font-barlow font-extrabold text-outline leading-[0.82] tracking-normal uppercase text-[clamp(64px,9.2vw,144px)] block"
              delay={0.06}
            />

            <SplitText
              text={t.heroLine3}
              className="font-barlow font-extrabold text-[#f2f5f2] leading-[0.82] tracking-normal uppercase text-[clamp(64px,9.2vw,144px)] block drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
              delay={0.08}
            />
          </div>

          {/* Hero Description */}
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.36, ease: 'easeOut' }}
            className="font-inter text-[16px] sm:text-[18px] text-[#c0cac2] max-w-[560px] leading-[1.7] mb-8 drop-shadow-md"
          >
            {t.heroDescription}
          </motion.p>

          {/* Hero CTAs with Magnetic Buttons */}
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.44, ease: 'easeOut' }}
            className="flex flex-row flex-wrap items-center gap-4"
          >
            {/* Primary: START YOUR CAREER */}
            <MagneticButton strength={0.22}>
              <button
                type="button"
                onClick={onStartCareer}
                className="group font-barlow font-bold text-[18px] tracking-wider text-[#050806] bg-[#b7ff35] hover:bg-[#a6f028] h-[54px] px-8 rounded-[3px] flex items-center gap-2.5 transition-colors cursor-pointer shadow-[0_4px_28px_rgba(183,255,53,0.35)] uppercase"
              >
                {t.heroStartCareer}
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </MagneticButton>

            {/* Secondary: ENTER DRAFT LEAGUE */}
            <MagneticButton strength={0.16}>
              <button
                type="button"
                onClick={onEnterDraft}
                className="font-barlow font-bold text-[18px] tracking-wider text-[#f2f5f2] bg-black/40 backdrop-blur-md border border-white/20 hover:border-[#b7ff35] hover:text-[#b7ff35] h-[54px] px-8 rounded-[3px] flex items-center transition-all cursor-pointer hover:bg-white/10 uppercase shadow-lg"
              >
                {t.heroEnterDraft}
              </button>
            </MagneticButton>

            {/* Ambient Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="h-[54px] px-4 rounded-[3px] bg-black/40 backdrop-blur-md border border-white/15 hover:border-white/40 text-[#8b958d] hover:text-[#f2f5f2] flex items-center gap-2 transition-all cursor-pointer font-ibm text-[11px] uppercase tracking-wider"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? (
                <>
                  <VolumeX size={16} className="text-[#8b958d]" />
                  <span className="hidden sm:inline">{language === 'tr' ? 'SES: KAPALI' : 'AUDIO: OFF'}</span>
                </>
              ) : (
                <>
                  <Volume2 size={16} className="text-[#b7ff35] animate-pulse" />
                  <span className="text-[#b7ff35] hidden sm:inline">{language === 'tr' ? 'SES: AÇIK' : 'AUDIO: ON'}</span>
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Right Column: Hero Tactical HUD with Spotlight Surface */}
        <div className="lg:col-span-5 flex justify-end">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <SpotlightCard
              spotlightColor="rgba(183, 255, 53, 0.16)"
              className="w-full rounded-[6px] p-6 backdrop-blur-2xl border border-white/15 shadow-2xl bg-[#070c08]/90"
              style={{
                borderLeft: '3px solid #b7ff35',
                transform: 'perspective(900px) rotateY(-4deg) rotateX(2deg)',
                boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(183,255,53,0.12)',
              }}
            >
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#b7ff35] animate-ping" />
                  <span className="font-ibm text-[11px] text-[#b7ff35] tracking-widest font-semibold uppercase">
                    {t.heroLiveSystem}
                  </span>
                </div>
                <span className="font-ibm text-[11px] text-[#8b958d] uppercase">
                  {t.heroSeason}
                </span>
              </div>

              {/* Tactical Metrics */}
              <div className="space-y-3 font-ibm text-[12px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#8b958d] uppercase">{t.heroPossession}</span>
                  <span className="text-[#b7ff35] font-bold">
                    <AnimatedCounter value={58} suffix="%" duration={1.2} />
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '58%' }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[#b7ff35]"
                  />
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#8b958d] uppercase">{t.heroXG}</span>
                  <span className="text-[#f2f5f2] font-bold">
                    <AnimatedCounter value={2.41} decimals={2} duration={1.3} />
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[#8b958d] uppercase">{t.heroPress}</span>
                  <span className="text-[#17e5c2] font-bold">
                    <AnimatedCounter value={74} duration={1.1} /> {'//'} {t.heroHigh}
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '74%' }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                    className="h-full bg-[#17e5c2]"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-[#8b958d] uppercase">{t.heroTeamForm}</span>
                  <div className="flex gap-1.5 font-bold">
                    <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">
                      {language === 'tr' ? 'G' : 'W'}
                    </span>
                    <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">
                      {language === 'tr' ? 'G' : 'W'}
                    </span>
                    <span className="w-5 h-5 rounded-[2px] bg-[#ffc84a]/20 text-[#ffc84a] flex items-center justify-center text-[10px]">
                      {language === 'tr' ? 'B' : 'D'}
                    </span>
                    <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">
                      {language === 'tr' ? 'G' : 'W'}
                    </span>
                    <span className="w-5 h-5 rounded-[2px] bg-[#65ff83]/20 text-[#65ff83] flex items-center justify-center text-[10px]">
                      {language === 'tr' ? 'G' : 'W'}
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>

      {/* Hero Bottom Match Ticker with Video Control */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.65, ease: 'easeOut' }}
        className="relative z-10 w-full border-t border-white/10 bg-[#050806]/90 backdrop-blur-md px-6 py-2.5 flex items-center justify-between"
      >
        <div className="max-w-[1500px] w-full mx-auto flex items-center justify-between font-ibm text-[12px]">
          <div className="flex items-center gap-3">
            <span className="text-[#8b958d] uppercase">{t.tickerMatchday}</span>
            <span className="text-white/20">|</span>
            <span className="font-barlow text-[16px] font-bold text-[#f2f5f2] tracking-wider uppercase">
              KALYON DORUK <span className="text-[#b7ff35]">2 — 1</span> IRONVALE
            </span>
            <span className="font-ibm text-[11px] text-[#8b958d]">84&apos;</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={togglePlayback}
              className="text-[#8b958d] hover:text-[#b7ff35] transition-colors flex items-center gap-1.5 cursor-pointer font-ibm text-[11px] uppercase"
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span className="hidden md:inline">{isPlaying ? 'DURAKLAT' : 'OYNAT'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ff4d5f] animate-ping" />
              <span className="font-ibm text-[11px] text-[#ff4d5f] font-bold tracking-wider uppercase">
                {t.tickerLiveSim}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
