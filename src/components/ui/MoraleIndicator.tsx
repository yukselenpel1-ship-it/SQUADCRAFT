import React from 'react';
import { Smile, Meh, Frown, Sparkles } from 'lucide-react';

interface MoraleIndicatorProps {
  value: number; // 1-100
  showText?: boolean;
}

export const MoraleIndicator: React.FC<MoraleIndicatorProps> = ({
  value,
  showText = false,
}) => {
  let label = 'Mükemmel';
  let color = 'text-[#C7FF38] bg-[#C7FF38]/10 border-[#C7FF38]/30';
  let Icon = Sparkles;

  if (value >= 88) {
    label = 'Çok Yüksek';
    color = 'text-[#C7FF38] bg-[#C7FF38]/10 border-[#C7FF38]/30';
    Icon = Sparkles;
  } else if (value >= 75) {
    label = 'İyi';
    color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    Icon = Smile;
  } else if (value >= 60) {
    label = 'Normal';
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    Icon = Meh;
  } else {
    label = 'Düşük';
    color = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    Icon = Frown;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${color}`}
      title={`Moral: ${label} (%${value})`}
    >
      <Icon className="w-3.5 h-3.5" />
      {showText && <span>{label}</span>}
    </div>
  );
};
