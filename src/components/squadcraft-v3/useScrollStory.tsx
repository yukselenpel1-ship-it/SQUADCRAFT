'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StoryAct, STORY_CONFIG } from './storyConfig';
import { FormationType } from '../squadcraft-experience/FormationVisualization';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollStoryState {
  progress: number;
  currentAct: StoryAct;
  formation: FormationType;
  setFormation: (f: FormationType) => void;
  isReducedMotion: boolean;
  isMobile: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const ScrollStoryContext = createContext<ScrollStoryState>({
  progress: 0,
  currentAct: 'intro',
  formation: '4-3-3',
  setFormation: () => {},
  isReducedMotion: false,
  isMobile: false,
  containerRef: { current: null },
});

export function useScrollStory() {
  return useContext(ScrollStoryContext);
}

export function ScrollStoryProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [currentAct, setCurrentAct] = useState<StoryAct>('intro');
  const [formation, setFormation] = useState<FormationType>('4-3-3');
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check media queries
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Setup master ScrollTrigger
    let st: ScrollTrigger | null = null;
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        st = ScrollTrigger.create({
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            // ScrollTrigger may fire more frequently than the display can show a
            // perceptible camera change. This avoids cascading React work across
            // the cinematic DOM and WebGL tree on tiny sub-pixel deltas.
            setProgress((previous) =>
              Math.abs(previous - p) >= 0.001 ? p : previous
            );

            // Determine current Act
            const { acts } = STORY_CONFIG;
            const nextAct: StoryAct = p < acts.intro[1]
              ? 'intro'
              : p < acts.tactics[1]
                ? 'tactics'
                : p < acts.career[1]
                  ? 'career'
                  : p < acts.draft[1]
                    ? 'draft'
                    : 'finale';
            setCurrentAct((previous) => previous === nextAct ? previous : nextAct);
          },
        });
      }
    });

    return () => {
      ctx.revert();
      st?.kill();
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return (
    <ScrollStoryContext.Provider
      value={{
        progress,
        currentAct,
        formation,
        setFormation,
        isReducedMotion,
        isMobile,
        containerRef,
      }}
    >
      {children}
    </ScrollStoryContext.Provider>
  );
}
