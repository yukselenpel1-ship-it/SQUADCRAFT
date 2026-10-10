'use client';

import React from 'react';

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: string | string[];
  className?: string;
  children?: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 16,
  borderWidth = 1.5,
  duration = 10,
  color = ['#b7ff35', '#00f5d4', '#ffd166'],
  className = '',
  children,
}: ShineBorderProps) {
  const colorString = Array.isArray(color) ? color.join(', ') : color;

  return (
    <div
      style={
        {
          '--border-radius': `${borderRadius}px`,
        } as React.CSSProperties
      }
      className={`relative rounded-[var(--border-radius)] ${className}`}
    >
      <div
        style={
          {
            '--border-width': `${borderWidth}px`,
            '--border-radius': `${borderRadius}px`,
            '--duration': `${duration}s`,
            '--mask-linear-gradient': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '--background-radial-gradient': `radial-gradient(transparent,transparent, ${colorString},transparent,transparent)`,
          } as React.CSSProperties
        }
        className="pointer-events-none before:bg-radial-gradient absolute inset-0 size-full rounded-[var(--border-radius)] p-[--border-width] will-change-[background-position] content-[''] before:absolute before:inset-0 before:size-full before:animate-[shine-pulse_var(--duration)_infinite_linear] before:[background-image:var(--background-radial-gradient)] before:[background-size:300%_300%] before:[mask:var(--mask-linear-gradient)] before:[mask-composite:exclude]"
      >
        <style jsx global>{`
          @keyframes shine-pulse {
            0% {
              background-position: 0% 0%;
            }
            50% {
              background-position: 100% 100%;
            }
            100% {
              background-position: 0% 0%;
            }
          }
        `}</style>
      </div>
      {children}
    </div>
  );
}
