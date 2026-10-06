'use client';

import React from 'react';

export const STATS_ITEMS = [
  { value: '12,000+', label: 'Adventurers' },
  { value: '4 Rooms', label: 'Each unique' },
  { value: '1', label: 'Games Master' },
  { value: 'TripAdvisor #1', label: 'Edinburgh Escape Rooms' },
];

export const VaultStatsStrip: React.FC = () => {
  return (
    <section
      className="w-full bg-[#1a1816] border-t border-b border-[#2ad4b4]/12"
      style={{
        borderTop: '1px solid rgba(42,212,180,0.12)',
        borderBottom: '1px solid rgba(42,212,180,0.12)',
        paddingTop: '40px',
        paddingBottom: '40px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      <div className="flex flex-wrap justify-around items-center gap-x-12 sm:gap-x-16 gap-y-8 max-w-6xl mx-auto">
        {STATS_ITEMS.map((stat) => (
          <div
            key={stat.value}
            className="flex flex-col items-center text-center select-none min-w-[140px]"
          >
            {/* Value: Bebas Neue, 60px, #2ad4b4, line-height 1 */}
            <span
              className="font-bebas text-[48px] sm:text-[60px] text-[#2ad4b4] leading-none tracking-wide"
              style={{
                textShadow: '0 0 16px rgba(42,212,180,0.25)',
              }}
            >
              {stat.value}
            </span>

            {/* Label: Cormorant Garamond 300 italic, 14px, #9a8a7a */}
            <span className="font-cormorant italic text-[14px] text-[#9a8a7a] mt-1">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
