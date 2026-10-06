'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-[#050806] text-[#f2f5f2] flex items-center justify-center p-6 select-none relative overflow-hidden font-inter">
      {/* Stadium ambient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(183, 255, 53, 0.08), transparent 50%), radial-gradient(circle at 90% 80%, rgba(23, 229, 194, 0.05), transparent 40%), #050806',
        }}
      />

      <div className="relative z-10 w-full max-w-md bg-[#090d0a] border border-[#b7ff35]/25 rounded-2xl p-7 shadow-2xl space-y-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-[#b7ff35]/15 border border-[#b7ff35]/30 flex items-center justify-center text-[#b7ff35] mx-auto">
          <AlertCircle className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div>
          <span className="font-mono text-[10px] text-[#b7ff35] tracking-widest uppercase font-bold block mb-1">
            // 404 - SAYFA BULUNAMADI
          </span>
          <h1 className="font-barlow font-extrabold text-[32px] text-[#f2f5f2] uppercase tracking-wide">
            SAYFA MEVCUT DEĞİL
          </h1>
          <p className="font-mono text-xs text-[#8b958d] mt-2 leading-relaxed">
            Aradığınız taktik veya maç sayfası bulunamadı ya da henüz oluşturulmadı.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#b7ff35] hover:bg-[#9bea27] text-[#050806] font-barlow font-black text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(183,255,53,0.35)]"
          >
            <LayoutGrid className="w-4 h-4" />
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
