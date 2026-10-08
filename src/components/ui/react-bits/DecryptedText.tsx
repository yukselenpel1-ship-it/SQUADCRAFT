'use client';

import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  characters?: string;
  animateOn?: 'view' | 'hover';
}

const GLYPHS = '01#@!$*&_+=/{}[]%^~';

export function DecryptedText({
  text,
  speed = 40,
  maxIterations = 10,
  className = '',
  characters = GLYPHS,
  animateOn = 'view',
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      iteration += 1 / (maxIterations / text.length);
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              setHasAnimated(true);
              startAnimation();
            }
          });
        },
        { threshold: 0.2 }
      );

      if (elementRef.current) observer.observe(elementRef.current);
      return () => observer.disconnect();
    }
  }, [animateOn, hasAnimated, text]);

  const handleMouseEnter = () => {
    if (animateOn === 'hover') {
      setIsHovered(true);
      startAnimation();
    }
  };

  return (
    <span
      ref={elementRef}
      onMouseEnter={handleMouseEnter}
      className={`inline-block font-mono select-none ${className}`}
    >
      {displayText}
    </span>
  );
}
