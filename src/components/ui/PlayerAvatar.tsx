import React from 'react';
import { PlayerPosition } from '@/types/game';
import { PlayerPortrait } from './PlayerPortrait';

export interface PlayerAvatarProps {
  id?: string;
  firstName: string;
  lastName: string;
  position: PlayerPosition;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPositionBadge?: boolean;
  className?: string;
  age?: number;
  nationality?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  id,
  firstName,
  lastName,
  position,
  size = 'md',
  showPositionBadge = false,
  className = '',
  age,
  nationality,
}) => {
  // If an ID is provided, seamlessly render the high-fidelity fictional portrait!
  if (id) {
    return (
      <PlayerPortrait
        player={{ id, firstName, lastName, position, age, nationality }}
        size={size}
        showPositionBadge={showPositionBadge}
        className={className}
      />
    );
  }

  // Fallback to stylized initials badge if no ID is present
  const getInitials = () => {
    const f = firstName ? firstName[0] : '';
    const l = lastName ? lastName[0] : '';
    return `${f}${l}`.toUpperCase();
  };

  const getPositionBg = (pos: PlayerPosition) => {
    if (pos === 'GK') return 'from-amber-600 to-amber-900 border-amber-500/40 text-amber-300';
    if (['DR', 'DC', 'DL'].includes(pos)) return 'from-blue-600 to-blue-950 border-blue-500/40 text-blue-300';
    if (['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(pos)) return 'from-emerald-600 to-emerald-950 border-emerald-500/40 text-emerald-300';
    return 'from-rose-600 to-rose-950 border-rose-500/40 text-rose-300';
  };

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs font-bold',
    lg: 'w-12 h-12 text-sm font-bold',
    xl: 'w-16 h-16 text-lg font-black',
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white border shadow-inner ${getPositionBg(
          position
        )} ${sizeClasses[size]}`}
      >
        <span>{getInitials()}</span>
      </div>

      {showPositionBadge && (
        <span
          className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0.2 rounded font-extrabold bg-zinc-900 border border-zinc-700 text-zinc-200 uppercase"
        >
          {position}
        </span>
      )}
    </div>
  );
};
