'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface CinematicIntroState {
  isDone: boolean;
  phase: 'blackout' | 'stadium' | 'field' | 'nodes' | 'headline' | 'interactive' | 'complete';
  skipIntro: () => void;
}

const CinematicIntroContext = createContext<CinematicIntroState>({
  isDone: true,
  phase: 'complete',
  skipIntro: () => {},
});

export function useCinematicIntro() {
  return useContext(CinematicIntroContext);
}

interface CinematicIntroProviderProps {
  children: React.ReactNode;
}

export function CinematicIntroProvider({ children }: CinematicIntroProviderProps) {
  const [phase, setPhase] = useState<CinematicIntroState['phase']>('complete');
  const [isDone, setIsDone] = useState(true);

  useEffect(() => {
    // 1. Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 2. Check session storage so we don't replay lengthy intro on every back-and-forth navigation
    const alreadyShown = sessionStorage.getItem('sc_intro_v2_viewed');

    if (prefersReducedMotion || alreadyShown) {
      setIsDone(true);
      setPhase('complete');
      return;
    }

    // Fresh session: initialize intro timeline (0–1900ms)
    setIsDone(false);
    setPhase('blackout');

    const t1 = setTimeout(() => setPhase('stadium'), 300);
    const t2 = setTimeout(() => setPhase('field'), 600);
    const t3 = setTimeout(() => setPhase('nodes'), 900);
    const t4 = setTimeout(() => setPhase('headline'), 1100);
    const t5 = setTimeout(() => setPhase('interactive'), 1400);
    const t6 = setTimeout(() => {
      setPhase('complete');
      setIsDone(true);
      try {
        sessionStorage.setItem('sc_intro_v2_viewed', '1');
      } catch {}
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, []);

  const skipIntro = () => {
    setPhase('complete');
    setIsDone(true);
    try {
      sessionStorage.setItem('sc_intro_v2_viewed', '1');
    } catch {}
  };

  return (
    <CinematicIntroContext.Provider value={{ isDone, phase, skipIntro }}>
      {/* Subtle opening cinematic vignette overlay that dissolves out (non-blocking pointer-events-none) */}
      {!isDone && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 pointer-events-none transition-opacity duration-700 ease-out"
          style={{
            backgroundColor: '#05080D',
            opacity: phase === 'blackout' ? 0.95 : phase === 'stadium' ? 0.6 : phase === 'field' ? 0.3 : 0,
          }}
        />
      )}
      {children}
    </CinematicIntroContext.Provider>
  );
}
