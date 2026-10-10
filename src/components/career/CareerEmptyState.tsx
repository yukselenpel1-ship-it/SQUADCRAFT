import React, { ReactNode } from 'react';
import { LucideIcon, FolderSearch } from 'lucide-react';

interface CareerEmptyStateProps {
  icon?: LucideIcon;
  badge?: string;
  title: string;
  description: string;
  action?: ReactNode;
  minHeight?: string;
}

export const CareerEmptyState: React.FC<CareerEmptyStateProps> = ({
  icon: Icon = FolderSearch,
  badge = 'BİLGİ',
  title,
  description,
  action,
  minHeight = 'min-h-[320px]',
}) => {
  return (
    <div
      className={`relative w-full ${minHeight} flex flex-col items-center justify-center p-8 rounded-2xl bg-[#080E17]/60 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl text-center`}
    >
      <div className="relative mb-4 p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-[#B7FF3C] shadow-inner">
        <Icon className="w-8 h-8 drop-shadow-[0_0_12px_rgba(183,255,60,0.3)]" />
      </div>

      <div className="space-y-1.5 max-w-md mb-5">
        <span className="text-[10px] font-barlow font-bold uppercase tracking-widest text-zinc-400">
          {badge}
        </span>
        <h4 className="text-lg font-barlow font-black uppercase tracking-tight text-white">
          {title}
        </h4>
        <p className="text-xs sm:text-sm text-zinc-400 font-barlow font-medium leading-relaxed">
          {description}
        </p>
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
