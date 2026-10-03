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
      <div className="min-h-screen bg-[#040814] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#00F5A0] border-t-transparent rounded-full animate-spin" />
        <span>Kariyer yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#14233A]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#00F5A0] text-[#040814] text-[10px] font-black uppercase tracking-widest rounded-lg">
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
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 sc-panel rounded-xl border border-[#14233A] text-xs font-mono font-bold text-zinc-300 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
          <span>KAYIT: AKTİF (SAVE V1.0)</span>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-3.5 bg-emerald-950/80 border border-[#00F5A0] text-emerald-200 text-xs font-mono font-bold rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#00F5A0]" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="space-y-5">
        {/* Manager Contract & Career Status Card */}
        <div className="p-6 sc-panel rounded-2xl border border-[#14233A] shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#14233A]">
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00F5A0]" />
              Teknik Direktör Sözleşmesi & Kariyer Özeti
            </h2>
            <span className="px-2.5 py-1 bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#00F5A0] text-[10px] font-mono font-bold uppercase rounded-lg">
              SEZON #{seasonNumber} • {seasonYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Kalan Sözleşme Süresi</span>
              <span className="text-lg font-black text-white">{managerContract.yearsLeft} Yıl</span>
              <span className="text-[10px] font-mono text-[#00F5A0] block mt-0.5">
                {managerContract.status === 'OFFERED' ? 'Yeni Teklif Bekliyor' : 'Aktif Sözleşme'}
              </span>
            </div>
            <div className="p-4 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Haftalık Menajer Maaşı</span>
              <span className="text-lg font-black text-[#00F5A0]">€{(managerContract.weeklySalary).toLocaleString('tr-TR')}</span>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Yıllık: €{(managerContract.weeklySalary * 52).toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="p-4 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-[10px] font-mono uppercase text-zinc-400 block font-bold">Ekonomi Standartı</span>
              <span className="text-lg font-black text-white">v2 (+100% Bütçe)</span>
              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                Modern Transfer Piyasası
              </span>
            </div>
          </div>
        </div>

        {/* 1. General Preferences Card */}
        <div className="p-6 sc-panel rounded-2xl border border-[#14233A] shadow-2xl space-y-5">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2 pb-3 border-b border-[#14233A]">
            <Sliders className="w-4 h-4 text-[#00F5A0]" />
            Oynanış ve Simülasyon Tercihleri
          </h2>

          {/* Auto Save Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-[#14233A] text-xs">
            <div>
              <span className="font-black italic uppercase text-white text-sm block">Otomatik Kayıt (Auto-Save)</span>
              <span className="text-zinc-400 text-xs">
                Günü ilerlettiğinizde ve maç sonuçlarında kariyerinizi tarayıcı hafızasına otomatik kaydeder.
              </span>
            </div>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider transition-all rounded-xl border ${
                autoSaveEnabled
                  ? 'bg-[#00F5A0] text-[#040814] font-black border-[#00F5A0] shadow-[0_0_15px_rgba(0,245,160,0.3)]'
                  : 'bg-[#07101C] text-zinc-400 border-[#14233A]'
              }`}
            >
              {autoSaveEnabled ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>

          {/* Default Match Speed */}
          <div className="flex items-center justify-between py-2 border-b border-[#14233A] text-xs">
            <div>
              <span className="font-black italic uppercase text-white text-sm block">Varsayılan Maç Simülasyon Hızı</span>
              <span className="text-zinc-400 text-xs">
                Maç merkezine girdiğinizde geçerli olacak başlangıç hızı.
              </span>
            </div>
            <div className="flex items-center gap-1 bg-[#07101C] p-1 rounded-xl border border-[#14233A]">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setDefaultSpeed(spd)}
                  className={`px-3 py-1 font-mono font-bold text-xs rounded-lg transition-all ${
                    defaultSpeed === spd
                      ? 'bg-[#00F5A0] text-[#040814] font-black shadow-[0_0_10px_rgba(0,245,160,0.2)]'
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
              className={`px-4 py-2 font-mono font-bold text-xs uppercase tracking-wider transition-all rounded-xl border ${
                debugMode
                  ? 'bg-amber-400 text-[#040814] font-black border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                  : 'bg-[#07101C] text-zinc-400 border-[#14233A]'
              }`}
            >
              {debugMode ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>
        </div>

        {/* 2. Career Information Card */}
        <div className="p-6 sc-panel rounded-2xl border border-[#14233A] shadow-2xl space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-zinc-200 pb-3 border-b border-[#14233A]">
            Aktif Kariyer Bilgileri
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Kulüp</span>
              <span className="font-black italic uppercase text-white text-sm">{userClub.name}</span>
            </div>
            <div className="p-3.5 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Sezon</span>
              <span className="font-black text-[#00F5A0] text-sm">{seasonYear}</span>
            </div>
            <div className="p-3.5 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Oyun Tarihi</span>
              <span className="font-black text-white text-sm">{formatDateTurkish(currentDate, false)}</span>
            </div>
            <div className="p-3.5 bg-[#07101C] rounded-xl border border-[#14233A]">
              <span className="text-zinc-500 block text-[10px] font-mono uppercase font-bold">Kayıt Sürümü</span>
              <span className="font-mono font-bold text-zinc-300">SAVE V1.0</span>
            </div>
          </div>
        </div>

        {/* 3. Danger Zone (New Career / Reset) */}
        <div className="p-6 bg-[#16080A]/90 border border-red-500/40 rounded-2xl shadow-2xl space-y-4">
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
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition-all rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>YENİ KARİYER BAŞLAT // KAYDI SIFIRLA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#07101C]/95 border border-red-500/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] space-y-5 text-zinc-200 relative overflow-hidden">
            {/* Top red glow strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">UYARI // VERİ KAYBI</span>
                <h3 className="text-base font-black uppercase text-white">Kariyeri Silmek Üzeresiniz</h3>
              </div>
            </div>

            <div className="p-3.5 bg-red-950/60 rounded-xl border border-red-700/60 text-xs text-red-200 font-mono font-bold">
              BU KARİYER KALICI OLARAK SİLİNECEKTİR.
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Tüm maç sonuçları, taktikler, transferler ve kadro geçmişi silinecektir. Bu işlem geri alınamaz.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#14233A]">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-zinc-400 hover:text-white bg-[#07101C] border border-[#14233A]"
              >
                Vazgeç
              </button>
              <button
                onClick={() => {
                  handleConfirmReset();
                  window.location.href = '/';
                }}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] uppercase tracking-wider"
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
