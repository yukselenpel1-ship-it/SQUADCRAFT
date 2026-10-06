'use client';

import React, { useState } from 'react';
import { useGame } from '@/lib/context/GameContext';
import { formatDateTurkish, daysBetween } from '@/lib/career';
import {
  Settings,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Sliders,
  Shield,
  Cpu,
  Monitor,
  Volume2,
  VolumeX,
  Globe,
  Eye,
  Sparkles,
  Zap,
  Flame,
  Award,
  Layers,
  Check,
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

  // Settings State
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [defaultSpeed, setDefaultSpeed] = useState<number>(2);
  const [debugMode, setDebugMode] = useState(false);
  const [graphicsQuality, setGraphicsQuality] = useState<'HIGH' | 'MED' | 'LOW' | 'OFF'>('HIGH');
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [fpsCap, setFpsCap] = useState<'30' | '60' | 'UNCAPPED'>('60');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<'TR' | 'EN'>('TR');
  const [highContrastTactics, setHighContrastTactics] = useState(false);
  const [injuryRate, setInjuryRate] = useState<'NORMAL' | 'LOW' | 'REALISTIC'>('NORMAL');

  // Confirmation modal
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const handleConfirmReset = async () => {
    await resetEntireCareer();
    setConfirmResetOpen(false);
    setResetSuccessMessage('Kariyer başarıyla sıfırlandı. Yeni kariyer oluşturucuya yönlendiriliyorsunuz...');
    setTimeout(() => {
      window.location.href = '/career/new';
    }, 1500);
  };

  if (!isCareerHydrated || !isInitialized) {
    return (
      <div className="min-h-screen bg-[#050806] flex flex-col items-center justify-center gap-3 text-zinc-400 font-mono text-xs">
        <div className="w-6 h-6 border-2 border-[#b8ff3d] border-t-transparent rounded-full animate-spin" />
        <span>Sistem ayarları yükleniyor...</span>
      </div>
    );
  }

  const daysElapsed = daysBetween('2026-08-01', currentDate);

  return (
    <div className="space-y-6 max-w-5xl pb-20 animate-in fade-in duration-300">
      {/* 1. BROADCAST SYSTEM CONFIG HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#090d0a] via-[#0d130f] to-[#090d0a] border border-white/10 p-5 md:p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#b8ff3d]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-[#21dfbd]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-[#b8ff3d]/15 text-[#b8ff3d] border border-[#b8ff3d]/30">
                // SYSTEM ENGINE CONFIGURATION
              </span>
              <span className="text-xs text-zinc-400 font-mono">SQUADCRAFT 26 • PRO SUITE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#b8ff3d]/10 border border-[#b8ff3d]/20 flex items-center justify-center text-[#b8ff3d]">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase font-sport">
                  SİSTEM VE OYUN AYARLARI
                </h1>
                <p className="text-xs text-zinc-400 font-mono">
                  GRAFİK PERFORMANSI, SİMÜLASYON HIZI, DİL SEÇİMİ VE KAYIT YÖNETİMİ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#050706] border border-white/10 text-xs font-mono font-bold text-zinc-300 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b8ff3d] animate-pulse" />
            <span>KAYIT AKTİF: SAVE V1.0</span>
          </div>
        </div>
      </div>

      {resetSuccessMessage && (
        <div className="p-4 bg-[#b8ff3d]/10 border border-[#b8ff3d] text-[#b8ff3d] text-xs font-mono font-bold rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#b8ff3d] shrink-0" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {/* 2. SETTINGS SECTIONS */}
      <div className="space-y-5">
        {/* SECTION 1: DİL VE ERİŞİLEBİLİRLİK */}
        <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#21dfbd]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white font-sport">
                DİL VE YERELLEŞTİRME (LANGUAGE & LOCALIZATION)
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Arayüz Dili</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Arayüz Dili / UI Language</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                SQUADCRAFT 26 menüleri, terimleri ve futbol istatistiklerinin dili.
              </span>
            </div>

            {/* Language Pill Selector */}
            <div className="flex items-center gap-1.5 bg-[#050706] p-1.5 rounded-xl border border-white/10">
              <button
                onClick={() => setSelectedLanguage('TR')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  selectedLanguage === 'TR'
                    ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_12px_rgba(184,255,61,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>TR</span>
                <span className="text-[11px] font-normal">Türkçe</span>
                {selectedLanguage === 'TR' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setSelectedLanguage('EN')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  selectedLanguage === 'EN'
                    ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_12px_rgba(184,255,61,0.3)]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>EN</span>
                <span className="text-[11px] font-normal">English</span>
                {selectedLanguage === 'EN' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: OYNANIŞ VE SİMÜLASYON */}
        <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#b8ff3d]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white font-sport">
                OYNANIŞ VE SİMÜLASYON SEÇENEKLERİ
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Maç Motoru & İlerleme</span>
          </div>

          {/* Auto Save Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-white/5 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Otomatik Kayıt (Auto-Save)</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Her gün atlamasında ve maç sonrasında kariyeri otomatik tarayıcı hafızasına yazar.
              </span>
            </div>
            <button
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
              className={`px-4 py-2 rounded-xl font-bold uppercase transition-all border ${
                autoSaveEnabled
                  ? 'bg-[#b8ff3d] text-[#050806] font-black border-[#b8ff3d] shadow-[0_0_15px_rgba(184,255,61,0.3)]'
                  : 'bg-[#050706] text-zinc-400 border-white/10'
              }`}
            >
              {autoSaveEnabled ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>

          {/* Default Match Speed */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-white/5 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Varsayılan Simülasyon Hızı</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Maç merkezinde canlı karşılaşma oynatılırken kullanılacak varsayılan akış hızı.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050706] p-1.5 rounded-xl border border-white/10">
              {[1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setDefaultSpeed(spd)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    defaultSpeed === spd
                      ? 'bg-[#b8ff3d] text-[#050806] font-black shadow-[0_0_10px_rgba(184,255,61,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Injury Frequency */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-white/5 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Sakatlık Sıklığı Algoritması</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Antrenman ve maç içi fiziki darbelerde sakatlık oluşma oranı.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050706] p-1.5 rounded-xl border border-white/10">
              {[
                { id: 'LOW', label: 'DÜŞÜK' },
                { id: 'NORMAL', label: 'STANDART' },
                { id: 'REALISTIC', label: 'GERÇEKÇİ' },
              ].map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => setInjuryRate(lvl.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    injuryRate === lvl.id
                      ? 'bg-[#21dfbd] text-[#050806] font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Debug Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Geliştirici Konsol Çıktısı (Debug Mode)</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Maç motoru taktik ağırlıkları, pas haritası ve xG simülasyonunu tarayıcı konsoluna döker.
              </span>
            </div>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-4 py-2 rounded-xl font-bold uppercase transition-all border ${
                debugMode
                  ? 'bg-[#ffd34f] text-[#050806] font-black border-[#ffd34f] shadow-[0_0_15px_rgba(255,211,79,0.3)]'
                  : 'bg-[#050706] text-zinc-400 border-white/10'
              }`}
            >
              {debugMode ? '[ AKTİF ]' : '[ DEVRE DIŞI ]'}
            </button>
          </div>
        </div>

        {/* SECTION 3: 3D & GRAFİK PERFORMANSI */}
        <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#4FE4FF]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white font-sport">
                3D GRAFİK VE EKRAN PERFORMANSI
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">WebGL & Three.js</span>
          </div>

          {/* 3D Stadium Quality */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-white/5 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">3D Stadyum ve Küre Kalitesi</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Ana sayfa stadyumu ve maç öncesi 3D parçacıklarının detay seviyesi.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050706] p-1.5 rounded-xl border border-white/10">
              {[
                { id: 'HIGH', label: 'YÜKSEK' },
                { id: 'MED', label: 'ORTA' },
                { id: 'LOW', label: 'DÜŞÜK' },
                { id: 'OFF', label: 'KAPALI' },
              ].map((q) => (
                <button
                  key={q.id}
                  onClick={() => setGraphicsQuality(q.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    graphicsQuality === q.id
                      ? 'bg-[#4FE4FF] text-[#050806] font-black shadow-[0_0_10px_rgba(79,228,255,0.3)]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Particles & Ambient Lighting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-white/5 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Hacimsel Işık ve Parçacıklar</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Stadyum projektör hüzmeleri ve atmosferik toz parçacıkları.
              </span>
            </div>
            <button
              onClick={() => setParticlesEnabled(!particlesEnabled)}
              className={`px-4 py-2 rounded-xl font-bold uppercase transition-all border ${
                particlesEnabled
                  ? 'bg-[#4FE4FF] text-[#050806] font-black border-[#4FE4FF] shadow-[0_0_15px_rgba(79,228,255,0.3)]'
                  : 'bg-[#050706] text-zinc-400 border-white/10'
              }`}
            >
              {particlesEnabled ? '[ AÇIK ]' : '[ KAPALI ]'}
            </button>
          </div>

          {/* FPS Target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 font-mono text-xs">
            <div>
              <span className="font-bold text-white text-sm block">Kare Hızı Sınırı (FPS Cap)</span>
              <span className="text-zinc-400 text-xs mt-0.5 block">
                Cihaz ısınmasını ve pil tüketimini optimize eder.
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#050706] p-1.5 rounded-xl border border-white/10">
              {[
                { id: '30', label: '30 FPS' },
                { id: '60', label: '60 FPS' },
                { id: 'UNCAPPED', label: 'SINIRSIZ' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFpsCap(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    fpsCap === f.id
                      ? 'bg-[#b8ff3d] text-[#050806] font-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: AKTİF KARİYER BİLGİ DOSYASI */}
        <div className="bg-[#090d0a] rounded-2xl border border-white/10 p-5 sm:p-6 space-y-4 shadow-xl font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-sport flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#b8ff3d]" />
              AKTİF KARİYER DOSYASI VE MENAJER KONTRATI
            </h2>
            <span className="text-[10px] font-bold text-[#b8ff3d] px-2 py-0.5 bg-[#b8ff3d]/10 border border-[#b8ff3d]/30 rounded">
              SEZON #{seasonNumber} • {seasonYear}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#050706] rounded-xl border border-white/5 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">KULÜP</span>
              <span className="font-bold text-white text-sm block">{userClub.name}</span>
            </div>
            <div className="p-3.5 bg-[#050706] rounded-xl border border-white/5 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">MENAJER</span>
              <span className="font-bold text-[#b8ff3d] text-sm block">{userClub.managerName || 'Steve'}</span>
            </div>
            <div className="p-3.5 bg-[#050706] rounded-xl border border-white/5 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">OYUN TARİHİ</span>
              <span className="font-bold text-white text-sm block">{formatDateTurkish(currentDate, false)}</span>
            </div>
            <div className="p-3.5 bg-[#050706] rounded-xl border border-white/5 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase block">GEÇEN GÜN</span>
              <span className="font-bold text-[#4FE4FF] text-sm block">{daysElapsed} GÜN</span>
            </div>
          </div>
        </div>

        {/* SECTION 5: TEHLİKELİ BÖLGE (RESET & NEW CAREER) */}
        <div className="bg-[#140608]/90 border border-[#ff5365]/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 font-mono">
          <div className="flex items-center gap-2 text-[#ff5365]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white font-sport">
              TEHLİKELİ BÖLGE // KAYIT SIFIRLAMA VE YENİ KARİYER
            </h2>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Mevcut kariyer verilerinizi tamamen silebilir ve temiz bir başlangıç için <strong>YENİ KARİYER OLUŞTURUCU</strong> ekranına dönebilirsiniz. Bu işlem geri alınamaz.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setConfirmResetOpen(true)}
              className="px-6 py-3 bg-[#ff5365] hover:bg-[#e04355] text-white font-black text-xs uppercase tracking-wider transition-all rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(255,83,101,0.4)]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>YENİ KARİYER BAŞLAT // TÜM KAYDI SIFIRLA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090d0a] border border-[#ff5365]/50 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] space-y-5 text-zinc-200 relative overflow-hidden font-mono">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff5365] via-rose-500 to-[#ffd34f]" />

            <div className="flex items-center gap-3 text-[#ff5365]">
              <div className="w-10 h-10 rounded-2xl bg-[#ff5365]/10 border border-[#ff5365]/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-[#ff5365]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff5365] block">
                  KRİTİK UYARI // VERİ KAYBI
                </span>
                <h3 className="text-base font-black uppercase text-white font-sport">
                  Kariyeri Sıfırlamak İstiyor Musunuz?
                </h3>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/40 rounded-xl border border-[#ff5365]/40 text-xs text-rose-300 font-bold">
              BU İŞLEM KALICI OLARAK TÜM MAÇ, TAKTİK VE TRANSFER VERİLERİNİZİ SİLER.
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Kayıt sıfırlandıktan sonra doğrudan <strong>/career/new</strong> terminaline aktarılacaksınız.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-zinc-400 hover:text-white bg-[#050706] border border-white/10"
              >
                Vazgeç
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#ff5365] hover:bg-[#e04355] text-white shadow-[0_0_15px_rgba(255,83,101,0.4)] uppercase tracking-wider"
              >
                ONAYLA VE SIFIRLA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
