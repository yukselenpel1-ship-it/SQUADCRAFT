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
      className={`p-4 sm:p-5 border transition-all ${
        highlight
          ? 'bg-[#0A1020] border-2 border-[#C7FF38] shadow-xl'
          : 'bg-[#080D1A] border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
          {title}
        </span>
        {Icon && (
          <div className="p-1.5 bg-[#040711] text-[#C7FF38] border border-zinc-800">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-mono font-black tracking-tight text-white mb-1">
        {formattedAmount}
      </div>

      <div className="flex items-center justify-between text-xs font-mono">
        {subtitle && <span className="text-[11px] text-zinc-500">{subtitle}</span>}

        {trend && (
          <div
            className={`flex items-center gap-1 font-bold ml-auto text-[11px] ${
              trend.isPositive ? 'text-[#C7FF38]' : 'text-rose-400'
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
