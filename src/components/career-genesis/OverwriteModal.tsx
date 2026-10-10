'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OverwriteModal({ isOpen, onClose, onConfirm }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mevcut Kayıt Uyarısı"
        className="w-full max-w-md bg-[#080E17] border border-[#FF4D5F]/40 rounded-[4px] p-6 shadow-2xl relative"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-[3px] bg-[#FF4D5F]/15 text-[#FF4D5F]">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-condensed font-black text-xl text-[#F2F6FA] uppercase tracking-wide">
              MEVCUT KAYIT ÜZERİNE YAZILSIN MI?
            </h3>
            <span className="font-mono text-[10px] text-[#7A8B9E] tracking-wider uppercase">
              INDEXEDDB VERİ PROTOKOLÜ
            </span>
          </div>
        </div>

        <p className="font-sans text-xs sm:text-sm text-[#91A2B4] mb-6 leading-relaxed">
          Cihazınızda daha önceden kaydedilmiş aktif bir kariyer bulundu. Yeni bir kariyere başlamak mevcut lig tablosunu, transferleri ve kadronuzu sıfırlayacaktır.
        </p>

        <div className="flex items-center justify-end gap-3 font-condensed font-bold text-sm uppercase tracking-wider">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
          >
            İPTAL
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-5 py-2.5 rounded-[2px] bg-[#FF4D5F] hover:bg-[#ff384c] text-white transition-all cursor-pointer shadow-[0_2px_14px_rgba(255,77,95,0.3)] active:translate-y-0.5"
          >
            YENİ KAYIT İLE BAŞLAT
          </button>
        </div>
      </div>
    </div>
  );
}
