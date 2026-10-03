import React from 'react';
import { HeartPulse, BatteryCharging, AlertCircle } from 'lucide-react';

interface FitnessIndicatorProps {
  value: number; // 1-100
  isInjured?: boolean;
  showText?: boolean;
  compact?: boolean;
}

export const FitnessIndicator: React.FC<FitnessIndicatorProps> = ({
  value,
  isInjured = false,
  showText = true,
  compact = false,
}) => {
  if (isInjured) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        {showText && <span>Sakat</span>}
      </div>
    );
  }

  const getColor = (v: number) => {
    if (v >= 90) return 'text-[#00F5A0] bg-[#00F5A0]';
    if (v >= 75) return 'text-sky-400 bg-sky-400';
    if (v >= 60) return 'text-amber-400 bg-amber-400';
    return 'text-rose-400 bg-rose-400';
  };

  const getTextColor = (v: number) => {
    if (v >= 90) return 'text-[#00F5A0]';
    if (v >= 75) return 'text-sky-400';
    if (v >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="inline-flex items-center gap-2" title={`Kondisyon: %${value}`}>
      {compact ? (
        <div className="flex items-center gap-1">
          <HeartPulse className={`w-3.5 h-3.5 ${getTextColor(value)}`} />
          <span className={`text-xs font-bold ${getTextColor(value)}`}>%{value}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-14 h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60">
            <div
              className={`h-full rounded-full transition-all duration-300 ${getColor(value)}`}
              style={{ width: `${Math.min(100, Math.max(5, value))}%` }}
            />
          </div>
          {showText && (
            <span className={`text-xs font-bold ${getTextColor(value)}`}>
              %{value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
