'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtext?: string;
  progressPercent?: number;
  progressBarColor?: string;
  customBadge?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  change,
  changeType = 'positive',
  subtext,
  progressPercent,
  progressBarColor = '#65F56B',
  customBadge,
  className = '',
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#09141B]/90 border border-[rgba(125,160,175,0.16)] p-3.5 sm:p-4 shadow-lg hover:border-[rgba(125,160,175,0.3)] transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-[#65F56B]/10 border border-[#65F56B]/25 flex items-center justify-center text-[#65F56B] shrink-0 mt-0.5">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Label */}
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 truncate">
            {label}
          </div>

          {/* Value & Change */}
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <span className="text-xl sm:text-2xl font-black italic tracking-tight text-white font-sans">
              {value}
            </span>

            {change && (
              <span
                className={`inline-flex items-center text-[10px] font-mono font-bold ${
                  changeType === 'positive'
                    ? 'text-[#65F56B]'
                    : changeType === 'negative'
                    ? 'text-rose-400'
                    : 'text-zinc-400'
                }`}
              >
                {changeType === 'positive' ? (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                ) : changeType === 'negative' ? (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                ) : null}
                {change}
              </span>
            )}
          </div>

          {/* Progress bar or Subtext or Custom Badge */}
          {customBadge && <div className="mt-2">{customBadge}</div>}

          {progressPercent !== undefined && (
            <div className="mt-2 space-y-1">
              <div className="w-full bg-[#050B10] h-1.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(101,245,107,0.4)]"
                  style={{
                    width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                    backgroundColor: progressBarColor,
                  }}
                />
              </div>
              {subtext && (
                <div className="text-[9px] font-mono text-zinc-400 truncate">
                  {subtext}
                </div>
              )}
            </div>
          )}

          {progressPercent === undefined && subtext && !customBadge && (
            <div className="text-[10px] font-mono text-zinc-400 truncate mt-1">
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
