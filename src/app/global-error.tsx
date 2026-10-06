'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#050806] text-[#f2f5f2] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#090d0a] border border-[#ff5365]/40 rounded-2xl p-8 text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-[#ff5365]/20 border border-[#ff5365]/40 text-[#ff5365] mx-auto flex items-center justify-center text-xl font-bold">
            !
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase text-white tracking-wide">
              SİSTEM HİKAYESİ YENİLENİYOR
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              Uygulama genelinde bir aksama oluştu. Yeniden başlatarak devam edebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => reset()}
            className="w-full py-3 px-4 rounded-xl bg-[#b7ff35] text-[#050806] font-bold text-sm uppercase tracking-wider cursor-pointer"
          >
            Yeniden Başlat
          </button>
        </div>
      </body>
    </html>
  );
}
