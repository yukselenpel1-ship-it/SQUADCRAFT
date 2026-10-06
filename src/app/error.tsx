'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, LayoutGrid, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for diagnostics
    console.error('SquadCraft Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full bg-[#050806] text-[#f2f5f2] flex items-center justify-center p-6 select-none relative overflow-hidden font-inter">
      {/* Stadium ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(183, 255, 53, 0.08), transparent 50%), radial-gradient(circle at 10% 90%, rgba(255, 83, 101, 0.06), transparent 40%), #050806',
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-[#090d0a] border border-[#ff5365]/30 rounded-2xl p-7 shadow-2xl space-y-6">
        {/* Header Capsule */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff5365]/15 border border-[#ff5365]/30 flex items-center justify-center text-[#ff5365]">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#ff5365] tracking-widest uppercase font-bold block">
                // SİSTEM KURTARMA KATMANI
              </span>
              <span className="font-barlow font-extrabold text-[18px] text-[#f2f5f2] uppercase tracking-wide">
                SQUADCRAFT RECOVERY
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#ff5365]/20 text-[#ff5365]">
            HATA
          </span>
        </div>

        {/* Description */}
        <div className="space-y-2 font-mono text-xs text-[#8b958d]">
          <p className="text-[#f2f5f2] font-semibold text-sm">
            Sayfa yüklenirken beklenmeyen bir durum oluştu.
          </p>
          <p className="text-[11px] leading-relaxed">
            Kariyer kayıtlarınız ve verileriniz tarayıcı hafızasında güvendedir. Sayfayı yeniden deneyebilir veya yönetim merkezine dönebilirsiniz.
          </p>
          {error?.digest && (
            <p className="text-[9px] text-[#8b958d]/60 font-mono pt-1">
              Hata Kimliği: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(183,255,53,0.35)] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Yeniden Dene</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0d130f] hover:bg-white/5 border border-white/10 text-[#f2f5f2] font-barlow font-bold text-xs uppercase tracking-wider transition-all"
          >
            <LayoutGrid className="w-4 h-4 text-[#b7ff35]" />
            <span>Yönetim Merkezine Dön</span>
          </Link>

          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[#8b958d] hover:text-white font-mono text-[11px] uppercase tracking-wider transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Ana Sayfa</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
