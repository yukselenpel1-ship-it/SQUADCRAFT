'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Play, Shield, Users, Radio, Zap } from 'lucide-react';

export interface TelemetryStat {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface ModeExperienceCardProps {
  mode: 'career' | 'draft' | 'match';
  title: string;
  kicker: string;
  description: string;
  badge: string;
  imageSrc: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  telemetryStats: TelemetryStat[];
  themeColor: 'lime' | 'cyan' | 'gold';
  isActive?: boolean;
  onHover?: () => void;
}

export function ModeExperienceCard({
  mode,
  title,
  kicker,
  description,
  badge,
  imageSrc,
  primaryAction,
  secondaryAction,
  telemetryStats,
  themeColor,
  isActive = false,
  onHover,
}: ModeExperienceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrained rotation: max 5 deg X, 6 deg Y
    const rotateY = ((x - centerX) / centerX) * 5.5;
    const rotateX = -((y - centerY) / centerY) * 4.5;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTransformStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`,
      glareX,
      glareY,
      glareOpacity: 0.16,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTransformStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)',
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    });
  }, []);

  // Theme accents
  const accentBorder =
    themeColor === 'lime'
      ? 'hover:border-[#B7FF3C]/50 border-white/10'
      : themeColor === 'cyan'
      ? 'hover:border-[#38D8FF]/50 border-white/10'
      : 'hover:border-[#FFC857]/50 border-white/10';

  const badgeColor =
    themeColor === 'lime'
      ? 'text-[#B7FF3C] bg-[#B7FF3C]/10 border-[#B7FF3C]/30'
      : themeColor === 'cyan'
      ? 'text-[#38D8FF] bg-[#38D8FF]/10 border-[#38D8FF]/30'
      : 'text-[#FFC857] bg-[#FFC857]/10 border-[#FFC857]/30';

  const primaryBtnClass =
    themeColor === 'lime'
      ? 'bg-[#B7FF3C] text-[#05080D] hover:bg-[#c9ff6a] shadow-[0_0_24px_rgba(183,255,60,0.35)]'
      : themeColor === 'cyan'
      ? 'bg-[#38D8FF] text-[#05080D] hover:bg-[#63e1ff] shadow-[0_0_24px_rgba(56,216,255,0.35)]'
      : 'bg-[#FFC857] text-[#05080D] hover:bg-[#ffd680] shadow-[0_0_24px_rgba(255,200,87,0.35)]';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={onHover}
      style={{
        transform: transformStyle.transform,
        transition: 'transform 0.12s ease-out, border-color 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative flex flex-col justify-between overflow-hidden rounded-[8px] bg-[#0c1522]/90 backdrop-blur-md border ${accentBorder} p-6 sm:p-7 min-h-[460px] group cursor-default`}
    >
      {/* Dynamic Specular Sheen Glare */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-[8px] transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 320px at ${transformStyle.glareX}% ${transformStyle.glareY}%, rgba(255,255,255,${transformStyle.glareOpacity}), transparent 70%)`,
        }}
      />

      {/* Background Graphic Asset with Dark Cinematic Gradient */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-35 group-hover:opacity-50 transition-opacity duration-500">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover object-center scale-100 group-hover:scale-105 transition-transform duration-700 ease-out"
          priority={mode === 'career'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05080D] via-[#080F18]/85 to-transparent" />
      </div>

      {/* TOP HEADER: Kicker, Title & Mode Badge */}
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#91A2B4]">
            {kicker}
          </span>
          <span
            className={`font-mono text-[10px] tracking-widest uppercase font-semibold px-2.5 py-1 rounded-[4px] border ${badgeColor}`}
          >
            {badge}
          </span>
        </div>

        <h3 className="font-condensed text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-[#F2F6FA] leading-none mb-3 group-hover:translate-x-0.5 transition-transform">
          {title}
        </h3>

        <p className="text-sm text-[#91A2B4] leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>

      {/* MIDDLE: Live Telemetry Metadata Block */}
      <div className="relative z-10 my-6 bg-[#080F18]/75 border border-white/5 rounded-[6px] p-3.5 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-2.5">
          {telemetryStats.map((stat, idx) => (
            <div key={idx} className="flex flex-col">
              <span className="text-[10px] font-mono tracking-wider text-[#91A2B4]/80 uppercase">
                {stat.label}
              </span>
              <span
                className={`font-mono text-xs font-bold truncate mt-0.5 ${
                  stat.highlight ? 'text-[#B7FF3C]' : 'text-[#F2F6FA]'
                }`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM ACTIONS: Primary Launch Button + Secondary Action */}
      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={primaryAction.onClick}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-[6px] font-condensed font-bold text-base uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-[0.98] ${primaryBtnClass}`}
        >
          <span>{primaryAction.label}</span>
          <ArrowUpRight size={18} />
        </button>

        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="flex items-center justify-center px-4 py-3 rounded-[6px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] font-condensed font-bold text-sm uppercase tracking-wider transition-colors duration-200 cursor-pointer"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
