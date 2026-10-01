'use client';

import React, { useState, useMemo } from 'react';
import { PlayerPosition } from '@/types/game';
import { getPlayerPortraitDataUri } from '@/lib/player/portrait';

export interface PlayerPortraitProps {
  player: {
    id: string;
    firstName?: string;
    lastName?: string;
    position?: PlayerPosition | string;
    age?: number;
    nationality?: string;
    portraitSeed?: string;
    portraitUrl?: string;
  };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'card' | 'custom';
  className?: string;
  showPositionBadge?: boolean;
  shape?: 'circle' | 'square' | 'card';
  priority?: boolean;
}

export const PlayerPortrait: React.FC<PlayerPortraitProps> = ({
  player,
  size = 'md',
  className = '',
  showPositionBadge = false,
  shape = 'circle',
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);

  const portraitSrc = useMemo(() => {
    if (player.portraitUrl) return player.portraitUrl;
    return getPlayerPortraitDataUri(player);
  }, [player.id, player.portraitUrl, player.portraitSeed, player.age, player.nationality]);

  const initials = useMemo(() => {
    const f = player.firstName ? player.firstName[0] : '';
    const l = player.lastName ? player.lastName[0] : '';
    return `${f}${l}`.toUpperCase() || 'SC';
  }, [player.firstName, player.lastName]);

  const sizeClasses: Record<string, string> = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-base',
    card: 'w-28 h-28 sm:w-32 sm:h-32 text-lg',
    custom: '',
  };

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-xl',
    card: 'rounded-2xl',
  };

  const getPositionBadgeBg = (pos?: string) => {
    if (pos === 'GK') return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    if (['DR', 'DC', 'DL', 'CB', 'LB', 'RB'].includes(pos || '')) {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
    if (['DMC', 'MC', 'MR', 'ML', 'AMC', 'DM', 'CM', 'CAM'].includes(pos || '')) {
      return 'bg-[#00F5A0]/20 text-[#00F5A0] border-[#00F5A0]/40';
    }
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        sizeClasses[size]
      } ${className}`}
    >
      <div
        className={`w-full h-full overflow-hidden border border-zinc-700/60 shadow-md bg-zinc-950 flex items-center justify-center relative ${
          shapeClasses[shape]
        }`}
      >
        {!hasError ? (
          <img
            src={portraitSrc}
            alt={`${player.firstName || ''} ${player.lastName || ''} Portrait`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setHasError(true)}
          />
        ) : (
          /* High-aesthetic initials avatar fallback */
          <div className="w-full h-full bg-gradient-to-br from-[#0D1829] to-[#060A14] flex items-center justify-center font-mono font-black text-zinc-300 border border-zinc-800">
            <span>{initials}</span>
          </div>
        )}

        {/* Subtle studio inner gloss border */}
        <div
          className={`absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 ${
            shapeClasses[shape]
          }`}
        />
      </div>

      {/* Position Badge overlay if requested */}
      {showPositionBadge && player.position && (
        <span
          className={`absolute -bottom-1 -right-1 text-[9px] px-1 font-mono font-black border uppercase shadow-sm ${getPositionBadgeBg(
            player.position
          )} rounded`}
        >
          {player.position}
        </span>
      )}
    </div>
  );
};
