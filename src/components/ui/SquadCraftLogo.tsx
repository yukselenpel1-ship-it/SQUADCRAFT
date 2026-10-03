import React from 'react';
import Image from 'next/image';

interface SquadCraftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const SquadCraftLogo: React.FC<SquadCraftLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
}) => {
  const iconDimensions = {
    sm: { width: 32, height: 22 },
    md: { width: 44, height: 31 },
    lg: { width: 56, height: 39 },
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl',
  };

  const dim = iconDimensions[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official HD SC 3D Emblem */}
      <div className="relative flex items-center justify-center shrink-0">
        <Image
          src="/images/sc-emblem-official-hd.png"
          alt="SquadCraft SC"
          width={dim.width}
          height={dim.height}
          className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col tracking-tight justify-center leading-none">
          <div className={`font-black uppercase italic tracking-tighter flex items-center gap-1 ${textSizes[size]}`}>
            <span className="text-white">SQUADCRAFT</span>
            <span className="text-[#00F5A0]">26</span>
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
            PRO SIMULATION
          </span>
        </div>
      )}
    </div>
  );
};
