'use client';

import React from 'react';
import { Heart, Users, Sparkles, Briefcase } from 'lucide-react';

export const PERFECT_FOR_ITEMS = [
  {
    icon: Heart,
    title: 'DATE NIGHT',
    desc: '2 players. Low pressure. High stakes. We recommend The Study for first-timers.',
  },
  {
    icon: Users,
    title: 'FRIENDS GROUP',
    desc: '3-5 players. The Vault and The Heist are built for argument and glory in equal measure.',
  },
  {
    icon: Sparkles,
    title: 'FAMILY',
    desc: '4-6 players. Isolation is our most accessible room. Ages 10+ recommended.',
  },
  {
    icon: Briefcase,
    title: 'TEAM BUILDING',
    desc: '6+ players. Private hire with a dedicated Games Master and optional bar package.',
  },
];

export const VaultPerfectFor: React.FC = () => {
  return (
    <section
      id="perfect-for"
      className="bg-[#1a1816] w-full"
      style={{
        paddingTop: '64px',
        paddingBottom: '64px',
        paddingLeft: 'clamp(24px, 6vw, 96px)',
        paddingRight: 'clamp(24px, 6vw, 96px)',
      }}
    >
      {/* Section Headline */}
      <h2
        className="font-bebas text-[#e8d4b0] tracking-[0.02em] mb-6"
        style={{
          fontSize: 'clamp(28px, 4vw, 56px)',
          letterSpacing: '0.02em',
        }}
      >
        PERFECT FOR
      </h2>

      {/* 2x2 grid (1-col on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PERFECT_FOR_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="bg-[#221e1c] border border-[#2a2420] rounded-[6px] p-6 hover:border-[#c9a55a] transition-colors duration-200 group"
            >
              {/* Gold Lucide icon */}
              <div className="mb-3 text-[#c9a55a] group-hover:scale-110 transition-transform">
                <Icon size={22} strokeWidth={1.75} />
              </div>

              {/* Title */}
              <h3 className="font-bebas text-[20px] text-[#e8d4b0] tracking-wide">
                {item.title}
              </h3>

              {/* Description */}
              <p className="font-cormorant italic text-[14px] text-[#9a8a7a] mt-2 leading-[1.6]">
                {item.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
