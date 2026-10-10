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
  badge = 'SQUADCRAFT / CAREER', title, subtitle, metrics, actions, children,
}) => (
  <header className="mb-8 border-b-2 border-[#292622] pb-6 text-[#292622]">
    <div className="font-ibm text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#9b2529] font-bold">{badge}</div>
    <div className="mt-4 flex flex-wrap lg:items-end justify-between gap-5">
      <div className="max-w-4xl min-w-0">
        <h1 className="font-barlow font-black uppercase text-[clamp(2.9rem,7vw,7rem)] leading-[0.9] tracking-[-0.045em] break-words">{title}<span className="text-[#9b2529]">.</span></h1>
        {subtitle && <p className="mt-4 text-base sm:text-lg font-serif italic text-[#746a61] max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
    {metrics && metrics.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 border-t border-[#292622]/25 mt-6 pt-5">
      {metrics.map((m,i) => <div key={i} className="min-w-0">
        <div className="font-ibm text-[10px] uppercase tracking-[0.12em] text-[#796f66]">{m.label}</div>
        <div className={`font-barlow font-black text-2xl sm:text-3xl leading-tight truncate ${m.highlight || m.accent === 'rose' ? 'text-[#9b2529]' : 'text-[#292622]'}`}>{m.value}</div>
        {m.subtext && <div className="font-serif italic text-xs text-[#746a61]">{m.subtext}</div>}
      </div>)}
    </div>}
    {children && <div className="mt-6 border-t border-[#292622]/25 pt-5">{children}</div>}
  </header>
);
