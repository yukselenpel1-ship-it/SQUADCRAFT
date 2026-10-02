'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { formatDateTurkish } from '@/lib/career/calendar';
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  Shield,
  Cpu,
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

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [defaultSpeed, setDefaultSpeed] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
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
      <div className="min-h-screen bg-[#04060A] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
              SYSTEM CONFIG
            </span>
            <span className="text-xs text-zinc-400 font-mono">SQUADCRAFT 26 // PRO SETTINGS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white mt-1 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#00F5A0]" />
            AYARLAR VE KAYIT YÖNETİMİ
          </h1>
        </div>

        {/* Save Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
          <span>KAYIT: AKTİF (SAVE V1.0)</span>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-3.5 bg-emerald-950 border border-[#00F5A0] text-emerald-200 text-xs font-mono font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#00F5A0]" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-5">
        {/* Manager Contract & Career Status Card */}
        <div className="p-6 bg-[#070B12] border border-[#00F5A0]/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00F5A0]" />
              Teknik Direktör Sözleşmesi & Kariyer Özeti
            </h2>
            <span className="px-2 py-0.5 bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] text-[10px] font-mono font-bold uppercase">
              SEZON #{seasonNumber} • {seasonYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Kalan Sözleşme Süresi</span>
              <span className="text-lg font-black text-white">{managerContract.yearsLeft} Yıl</span>
              <span className="text-[10px] font-mono text-[#00F5A0] block mt-0.5">
                {managerContract.status === 'OFFERED' ? 'Yeni Teklif Bekliyor' : 'Aktif Sözleşme'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Haftalık Menajer Maaşı</span>
              <span className="text-lg font-black text-[#00F5A0]">€{(managerContract.weeklySalary).toLocaleString('tr-TR')}</span>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Yıllık: €{(managerContract.weeklySalary * 52).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 border border-zinc-850">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Ekonomi Standartı</span>
              <span className="text-lg font-black text-white">v2 (+100% Bütçe)</span>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Modern Transfer Piyasası
              </span>
            </div>
          </div>
        </div>

        {/* 1. General Preferences Card */}
        <div className="p-6 bg-[#070B12] border border-zinc-800 shadow-xl space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2 pb-2.5 border-b border-zinc-800">
            <Sliders className="w-4 h-4 text-[#00F5A0]" />
            Oynanış ve Simülasyon Tercihleri
          </h2>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/80 text-xs">
            <div>
              <span className="font-black italic uppercase text-white text-sm block">Otomatik Kayıt (Auto-Save)</span>
              <span className="text-zinc-400 text-xs">
                Günü ilerlettiğinizde ve maç sonuçlarında kariyerinizi tarayıcı hafızasına otomatik kaydeder.
              </span>
            </div>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider transition-all border ${
                autoSaveEnabled
                  ? 'bg-[#00F5A0] text-black border-[#00F5A0] shadow-md'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              {autoSaveEnabled ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>

          {/* Default Match Speed */}
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/80 text-xs">
            <div>
              <span className="font-black italic uppercase text-white text-sm block">Varsayılan Maç Simülasyon Hızı</span>
              <span className="text-zinc-400 text-xs">
                Maç merkezine girdiğinizde geçerli olacak başlangıç hızı.
              </span>
            </div>
            <div className="flex items-center gap-1 bg-zinc-950 p-1 border border-zinc-800">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setDefaultSpeed(spd)}
                  className={`px-3 py-1 font-mono font-bold text-xs transition-all ${
                    defaultSpeed === spd
                      ? 'bg-[#00F5A0] text-black font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Debug Mode */}
          <div className="flex items-center justify-between py-2 text-xs">
            <div>
              <span className="font-black italic uppercase text-white text-sm block">Geliştirici Hata Ayıklama (Debug Mode)</span>
              <span className="text-zinc-400 text-xs">
                Maç motoru takım güçlerini ve taktiksel ağırlıkları ayrıntılı olarak konsola yazdırır.
              </span>
            </div>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider transition-all border ${
                debugMode
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              {debugMode ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>
        </div>

        {/* 2. Career Information Card */}
        <div className="p-6 bg-[#070B12] border border-zinc-800 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200 pb-2 border-b border-zinc-800">
            Aktif Kariyer Bilgileri
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#040810] border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Kulüp</span>
              <span className="font-black italic uppercase text-white text-sm">{userClub.name}</span>
            </div>
            <div className="p-3 bg-[#040810] border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Sezon</span>
              <span className="font-black text-[#00F5A0] text-sm">{seasonYear}</span>
            </div>
            <div className="p-3 bg-[#040810] border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Oyun Tarihi</span>
              <span className="font-black text-white text-sm">{formatDateTurkish(currentDate, false)}</span>
            </div>
            <div className="p-3 bg-[#040810] border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Kayıt Sürümü</span>
              <span className="font-mono font-bold text-zinc-300">SAVE V1.0</span>
            </div>
          </div>
        </div>

        {/* 3. Danger Zone (New Career / Reset) */}
        <div className="p-6 bg-[#140608] border-2 border-red-600/70 shadow-xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-red-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Kayıt Sıfırlama ve Yeni Kariyer
          </h2>
          <p className="text-xs text-zinc-300">
            Mevcut kariyer kaydınızı tamamen sıfırlayabilir veya 1 Ağustos 2026 tarihine dönerek tertemiz yeni bir kariyer başlatabilirsiniz.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setConfirmResetOpen(true)}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>YENİ KARİYER BAŞLAT // KAYDI SIFIRLA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal (Zero Blur) */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85">
          <div className="w-full max-w-md bg-[#0D080A] border-2 border-red-600 p-6 shadow-2xl space-y-5 text-zinc-200">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black uppercase text-white">Kariyeri Silmek Üzeresiniz</h3>
            </div>

            <div className="p-3 bg-red-950 border border-red-700 text-xs text-red-200 font-mono font-bold">
              BU KARİYER KALICI OLARAK SİLİNECEKTİR.
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Tüm maç sonuçları, taktikler, transferler ve kadro geçmişi silinecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:text-white"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  handleConfirmReset();
                  window.location.href = '/';
                }}
                className="px-6 py-2.5 text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-lg uppercase tracking-wider"
              >
                KARİYERİ SİL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
