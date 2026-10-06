import React from 'react';

interface StatBadgeProps {
  value: number | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showBackground?: boolean;
}

export const StatBadge: React.FC<StatBadgeProps> = ({
  value,
  label,
  size = 'md',
  showBackground = true,
}) => {
  const getColorClass = (val: number | string) => {
    if (typeof val === 'string') {
      if (val === '?') return 'text-zinc-400 bg-zinc-800/60 border-zinc-700';
      // If it's a range like "65–78", take the average or min
      const parts = val.split(/[–-]/).map((p) => parseInt(p.trim(), 10)).filter((n) => !isNaN(n));
      if (parts.length > 0) {
        const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
        if (avg >= 85) return 'text-[#b7ff35] bg-[#b7ff35]/15 border-[#b7ff35]/40';
        if (avg >= 78) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
        if (avg >= 70) return 'text-sky-400 bg-sky-500/15 border-sky-500/30';
        if (avg >= 60) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
        return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
      }
      return 'text-zinc-300 bg-zinc-800 border-zinc-700';
    }

    if (val >= 85) return 'text-[#b7ff35] bg-[#b7ff35]/15 border-[#b7ff35]/40';
    if (val >= 78) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
    if (val >= 70) return 'text-sky-400 bg-sky-500/15 border-sky-500/30';
    if (val >= 60) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/15 border-rose-500/30';
  };

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[26px] h-6 font-semibold',
    md: 'text-sm px-2 py-0.5 min-w-[32px] h-7 font-bold',
    lg: 'text-base px-2.5 py-1 min-w-[40px] h-9 font-extrabold',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      {label && <span className="text-xs text-zinc-400 font-medium">{label}</span>}
      <span
        className={`inline-flex items-center justify-center rounded-md border text-center transition-all ${
          showBackground ? getColorClass(value) : 'text-zinc-200 border-transparent font-bold'
        } ${sizeClasses[size]}`}
      >
        {value}
      </span>
    </div>
  );
};
