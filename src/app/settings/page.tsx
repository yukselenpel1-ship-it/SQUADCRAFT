'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { CareerClubHero } from '@/components/ui/CareerClubHero';
import { formatDateTurkish } from '@/lib/career/calendar';
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  Shield,
  Cpu,
  Trash2,
} from 'lucide-react';

export default function SettingsPage() {
  const {
    currentDate,
    seasonYear,
    seasonNumber,
    managerContract,
    resetEntireCareer,
    userClub,
    isCareerHydrated,
    isInitialized,
  } = useGame();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmReset = async () => {
    await resetEntireCareer();
    setConfirmResetOpen(false);
    setResetSuccessMessage('Kariyer başarıyla sıfırlandı ve 1 Ağustos 2026 tarihine dönüldü.');
    setTimeout(() => setResetSuccessMessage(null), 4000);
  };

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#65F56B] border-t-transparent rounded-full animate-spin" />
        <span className="text-[#65F56B] font-bold">Ayarlar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO CLUB BANNER */}
      <CareerClubHero
        clubName={userClub.name}
        clubCode={userClub.code}
        primaryColor={userClub.primaryColor}
        secondaryColor={userClub.secondaryColor}
        tagline="Sistem Ayarları, Veri Kayıt Yönetimi ve Kariyer Parametreleri"
        leagueName="Süper Lig"
        seasonLabel={`Sezon ${seasonYear || '2026/27'}`}
        foundedYear="2024"
        location={`${userClub.city}, Türkiye`}
        stadiumName={userClub.stadium || 'Kartepe Stadyumu'}
        capacity={userClub.stadiumCapacity || '32.000'}
        reputation={userClub.reputation || 82}
      />

      {resetSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-[#65F56B] text-emerald-200 text-xs font-mono font-bold flex items-center gap-3 shadow-[0_0_15px_rgba(101,245,107,0.2)]">
          <CheckCircle2 className="w-5 h-5 text-[#65F56B]" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* 2. SETTINGS PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* CONTRACT & CAREER STATUS */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#65F56B]" />
              Teknik Direktör Sözleşmesi
            </span>
            <span className="px-2 py-0.5 rounded bg-[#65F56B]/15 text-[#65F56B] border border-[#65F56B]/30 text-[10px] font-mono font-bold uppercase">
              SEZON #{seasonNumber} • {seasonYear}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#0D1C26]/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-bold uppercase">Sözleşme Süresi</span>
              <span className="text-lg font-black text-white">{managerContract.yearsLeft} Yıl</span>
            </div>

            <div className="p-3 rounded-xl bg-[#0D1C26]/80 border border-zinc-800">
              <span className="text-[10px] text-zinc-400 block font-bold uppercase">Haftalık Maaş</span>
              <span className="text-lg font-black text-[#65F56B]">
                €{(managerContract.weeklySalary || 45000).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="rounded-2xl bg-[#09141B]/95 border border-[rgba(125,160,175,0.18)] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(125,160,175,0.14)]">
            <span className="text-xs font-black uppercase text-white font-sans flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#30D8CE]" />
              Kayıt & Depolama Durumu
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2.5 rounded-lg bg-[#0D1C26]/60">
              <span className="text-zinc-400">Kayıt Motoru</span>
              <span className="text-[#65F56B] font-bold">IndexedDB V3 + Metadata</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#0D1C26]/60">
              <span className="text-zinc-400">Oyun Tarihi</span>
              <span className="text-white font-bold">{formatDateTurkish(currentDate)}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-[#0D1C26]/60">
              <span className="text-zinc-400">Ekonomi Sürümü</span>
              <span className="text-white font-bold">v3.1 (Stabil)</span>
            </div>
          </div>
        </div>
      </div>

      {/* DANGER ZONE: RESET CAREER */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-950/20 to-[#09141B] border border-rose-900/40 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase text-rose-400 font-sans flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Kariyeri Sıfırla & Baştan Başla
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            Mevcut kariyerinizin tüm verilerini siler ve 1. Sezon başlangıç durumuna döndürür.
          </p>
        </div>

        <button
          onClick={() => setConfirmResetOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/50 text-xs font-black uppercase tracking-wider transition active:scale-95 shrink-0"
        >
          Kariyeri Sıfırla
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#09141B] border border-rose-600/40 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black uppercase text-white font-sans">
                Kariyeri Sıfırlamak İstiyor Musunuz?
              </h3>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Bu işlem geri alınamaz. Kulüp ilerlemeniz, transferleriniz ve puan durumunuz sıfırlanacaktır.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider text-zinc-300 border border-zinc-700 transition"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition shadow-lg shadow-rose-900/40"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
