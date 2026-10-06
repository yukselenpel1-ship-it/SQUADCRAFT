import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface BudgetCardProps {
  title: string;
  amount: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  highlight?: boolean;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  trend,
  highlight = false,
}) => {
  const formattedAmount =
    typeof amount === 'number'
      ? `€${amount.toLocaleString('tr-TR')}`
      : amount;

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl transition-all ${
        highlight
          ? 'bg-[#090d0a] border-2 border-[#b7ff35] shadow-[0_0_25px_rgba(183, 255, 53,0.15)]'
          : 'sc-panel hover:border-[#1E2E4A]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-ibm font-bold uppercase tracking-widest text-zinc-400">
          {title}
        </span>
        {Icon && (
          <div className="p-2 rounded-xl bg-[#0d120f] text-[#b7ff35] border border-white/10">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-ibm font-black tracking-tight text-white mb-1">
        {formattedAmount}
      </div>

      <div className="flex items-center justify-between text-xs font-ibm">
        {subtitle && <span className="text-[11px] text-zinc-500">{subtitle}</span>}

        {trend && (
          <div
            className={`flex items-center gap-1 font-bold ml-auto text-[11px] ${
              trend.isPositive ? 'text-[#b7ff35]' : 'text-rose-400'
            }`}
          >
            {trend.isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};
