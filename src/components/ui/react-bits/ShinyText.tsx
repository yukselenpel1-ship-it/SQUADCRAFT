'use client';

import React from 'react';

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  shimmerColor?: string;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 5,
  className = '',
  shimmerColor = '#ffffff',
}: ShinyTextProps) {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(255, 255, 255, 0) 30%, ${shimmerColor} 50%, rgba(255, 255, 255, 0) 70%)`,
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration,
      }}
    >
      {text}
      <style jsx global>{`
        @keyframes shine {
          0% {
            background-position: 100%;
          }
          100% {
            background-position: -100%;
          }
        }
        .animate-shine {
          animation: shine var(--shine-duration, 4s) linear infinite;
        }
      `}</style>
    </span>
  );
}
