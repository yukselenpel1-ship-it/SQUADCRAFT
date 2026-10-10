import React from 'react';

interface CareerLoadingStateProps {
  title?: string;
  message?: string;
  minHeight?: string;
}

export const CareerLoadingState: React.FC<CareerLoadingStateProps> = ({
  title = 'VERİLER YÜKLENİYOR',
  message = 'Kariyer veritabanı senkronize ediliyor...',
  minHeight = 'min-h-[400px]',
}) => {
  return (
    <div
      className={`relative w-full ${minHeight} flex flex-col items-center justify-center p-8 rounded-2xl bg-[#080E17]/80 border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden text-center`}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#B7FF3C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Modern Sports Pulse Spinner */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-[#B7FF3C] animate-spin" />
        <div className="absolute w-8 h-8 rounded-full border border-[#38D8FF]/40 animate-ping opacity-30" />
        <div className="absolute w-3 h-3 rounded-full bg-[#B7FF3C] shadow-[0_0_12px_#B7FF3C]" />
      </div>

      <div className="relative z-10 space-y-1.5 max-w-sm">
        <div className="text-[10px] font-barlow font-bold uppercase tracking-widest text-[#B7FF3C]">
          SQUADCRAFT CORE
        </div>
        <h3 className="text-lg font-barlow font-black uppercase tracking-wider text-white">
          {title}
        </h3>
        <p className="text-xs text-zinc-400 font-barlow font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};
