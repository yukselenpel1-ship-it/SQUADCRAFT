'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { computeBalanceMetrics, AggregateBalanceMetrics } from '@/lib/draft/telemetry';

export default function DraftBalanceReportPage() {
  const [metrics, setMetrics] = useState<AggregateBalanceMetrics | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);

  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (isDev || isAdminUnlocked) {
      setMetrics(computeBalanceMetrics());
    }
  }, [isDev, isAdminUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'squadcraft-alpha-admin') {
      setIsAdminUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  // Production Access Guard
  if (!isDev && !isAdminUnlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full text-center space-y-4 shadow-2xl">
          <div className="text-3xl">🔒</div>
          <h2 className="text-lg font-bold text-white">Geliştirici Paneli Kilitli</h2>
          <p className="text-xs text-slate-400">
            Bu panel üretim ortamında genel erişime kapalıdır.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              placeholder="Yönetici Erişim Anahtarı"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 text-center"
            />
            {error && <p className="text-[10px] text-rose-400">Geçersiz erişim anahtarı.</p>}
            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Kilidi Aç
            </button>
          </form>
          <Link
            href="/draft"
            className="inline-block text-xs text-slate-500 hover:text-slate-300 transition pt-2"
          >
            ← Draft Moduna Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            [DEV ONLY] GELİŞTİRİCİ DENGE & METRİK PANELİ
          </div>
          <h1 className="text-2xl font-extrabold text-white">SquadCraft Draft Denge Raporu</h1>
        </div>
        <Link
          href="/draft"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300 font-semibold"
        >
          ← Draft Moduna Dön
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Maç Başına Ortalama Gol</div>
          <div className="text-2xl font-extrabold text-emerald-400">{metrics.averageGoalsPerMatch}</div>
          <div className="text-[10px] text-slate-500">Hedef: 2.20 - 3.10</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Ev Sahibi Galibiyet Oranı</div>
          <div className="text-2xl font-extrabold text-blue-400">%{metrics.homeWinRate}</div>
          <div className="text-[10px] text-slate-500">Beraberlik: %{metrics.drawRate} • Dep: %{metrics.awayWinRate}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">Oto-Seçim (Auto-Pick) Oranı</div>
          <div className="text-2xl font-extrabold text-purple-400">%{metrics.autoPickRate}</div>
          <div className="text-[10px] text-slate-500">Ort. Süre: {metrics.averagePickDurationSeconds}sn</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="text-xs text-slate-400">1. Tur Ortalama Seçim OVR</div>
          <div className="text-2xl font-extrabold text-amber-400">{metrics.averageFirstPickOvr}</div>
          <div className="text-[10px] text-slate-500">Toplam Seçim: {metrics.totalPicks}</div>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formations Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Diziliş Kullanımı & Galibiyet Oranları</h2>
          <div className="space-y-2">
            {metrics.mostUsedFormations.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">Yeterli maç verisi bulunmuyor.</div>
            ) : (
              metrics.mostUsedFormations.map((f) => (
                <div
                  key={f.formation}
                  className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">{f.formation}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{f.count} Kullanım</span>
                    <span className="font-mono font-bold text-emerald-400">%{f.winRate} Galibiyet</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Drafted Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">En Çok Seçilen Mevkiler</h2>
          <div className="space-y-2">
            {metrics.topDraftedPositions.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">Yeterli draft verisi bulunmuyor.</div>
            ) : (
              metrics.topDraftedPositions.map((pos) => (
                <div
                  key={pos.position}
                  className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-white">{pos.position}</span>
                  <span className="font-mono font-bold text-purple-400">{pos.count} Kez Seçildi</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
