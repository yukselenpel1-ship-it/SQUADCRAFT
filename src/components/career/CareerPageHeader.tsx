import React, { ReactNode } from 'react';

interface MetricItem {
  label: string;
  value: string | number;
  highlight?: boolean;
  accent?: 'lime' | 'cyan' | 'gold' | 'rose' | 'default';
  subtext?: string;
}

interface CareerPageHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  metrics?: MetricItem[];
  actions?: ReactNode;
  children?: ReactNode;
}

export const CareerPageHeader: React.FC<CareerPageHeaderProps> = ({
  badge = 'SQUADCRAFT CAREER',
  title,
  subtitle,
  metrics,
  actions,
  children,
}) => {
  const getAccentClass = (accent?: MetricItem['accent']) => {
    switch (accent) {
      case 'lime':
        return 'text-[#B7FF3C]';
      case 'cyan':
        return 'text-[#38D8FF]';
      case 'gold':
        return 'text-[#FFC84A]';
      case 'rose':
        return 'text-[#FF4D5F]';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="relative mb-6 sm:mb-8 rounded-2xl bg-gradient-to-br from-[#0B131E]/90 to-[#070D14]/90 border border-white/10 p-5 sm:p-7 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden">
      {/* Subtle top tactical highlight border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#B7FF3C]/40 to-transparent pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        {/* Left: Titles & Eyebrow */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF3C] shadow-[0_0_6px_#B7FF3C]" />
            <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-zinc-300">
              {badge}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-barlow font-black uppercase tracking-tight text-white drop-shadow-sm">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-400 font-barlow font-medium max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Metrics & Actions */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {metrics && metrics.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#05080E]/70 p-2 sm:p-2.5 rounded-xl border border-white/5">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 min-w-[80px]"
                >
                  <div className="text-[10px] font-barlow font-bold uppercase tracking-wider text-zinc-400">
                    {m.label}
                  </div>
                  <div className={`text-base sm:text-lg font-barlow font-black tracking-tight ${getAccentClass(m.accent)}`}>
                    {m.value}
                  </div>
                  {m.subtext && (
                    <div className="text-[9px] font-mono text-zinc-500">
                      {m.subtext}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="relative z-10 mt-5 pt-4 border-t border-white/5">
          {children}
        </div>
      )}
    </div>
  );
};
