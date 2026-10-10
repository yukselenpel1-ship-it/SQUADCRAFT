'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ModeExperienceCard } from './ModeExperienceCard';
import { loadCareerMetadata, CareerSaveMeta } from '@/lib/career/careerStorage';
import { useLanguage } from '@/lib/context/LanguageContext';

export function GameModeSelector() {
  const router = useRouter();
  const { language } = useLanguage();
  const isTr = language === 'tr';

  const [careerMeta, setCareerMeta] = useState<CareerSaveMeta | null>(null);
  const [activeHoverMode, setActiveHoverMode] = useState<'career' | 'draft' | 'match'>('career');

  useEffect(() => {
    // Fast synchronous read (<1ms) from metadata cache
    const meta = loadCareerMetadata();
    setCareerMeta(meta);
  }, []);

  const handleContinueCareer = () => {
    router.push('/dashboard');
  };

  const handleNewCareer = () => {
    router.push('/career/new');
  };

  const handleEnterDraft = () => {
    router.push('/draft');
  };

  const handleOpenMatchCenter = () => {
    // If an active career exists, direct to fixtures/match, else standalone match simulation
    if (careerMeta?.exists) {
      router.push('/fixtures');
    } else {
      router.push('/match');
    }
  };

  return (
    <section id="game-modes" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 z-20">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#B7FF3C]">
              {isTr ? 'OYUN MODU SEÇİMİ' : 'GAME MODE SELECTION'}
            </span>
          </div>
          <h2 className="font-condensed text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-[#F2F6FA]">
            {isTr ? 'BİR DÜNYA SEÇ // YÖNET' : 'CHOOSE YOUR WORLD // COMMAND'}
          </h2>
        </div>
        <p className="font-sans text-sm sm:text-base text-[#91A2B4] max-w-md">
          {isTr
            ? 'Stratejik kariyer hanedanlığı, canlı çok oyunculu draft ligi veya analitik 2D taktik radar maç motoru.'
            : 'Strategic career dynasty, live multiplayer draft league, or analytical 2D tactical radar match engine.'}
        </p>
      </div>

      {/* THREE SIGNATURE GAME MODES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* 1. CAREER MODE CARD */}
        <ModeExperienceCard
          mode="career"
          themeColor="lime"
          kicker={isTr ? 'Kariyer Hanedanı' : 'Career Dynasty'}
          title={isTr ? 'Kariyer Modu' : 'Career Mode'}
          badge={careerMeta?.exists ? (isTr ? 'KAYIT BULUNDU' : 'SAVE FOUND') : (isTr ? 'HAZIR' : 'READY')}
          description={
            isTr
              ? 'Kulübünü sıfırdan zirveye taşı. Scouting havuzu, taktik formasyonlar, transfer pazarı ve tam finans yönetimi.'
              : 'Lead your club to glory. Scouting network, tactical formations, dynamic transfer market, and full board finance.'
          }
          imageSrc="/media/homepage/career-mode.webp"
          primaryAction={{
            label: careerMeta?.exists
              ? isTr
                ? 'Kariyere Devam Et'
                : 'Continue Career'
              : isTr
              ? 'Yeni Kariyer Başlat'
              : 'Start New Career',
            onClick: careerMeta?.exists ? handleContinueCareer : handleNewCareer,
          }}
          secondaryAction={
            careerMeta?.exists
              ? {
                  label: isTr ? 'Yeni Kariyer' : 'New Career',
                  onClick: handleNewCareer,
                }
              : undefined
          }
          telemetryStats={[
            {
              label: isTr ? 'Aktif Kulüp' : 'Active Club',
              value: careerMeta?.clubName || (isTr ? 'Veritabanı Hazır' : 'Universe Ready'),
              highlight: !!careerMeta?.exists,
            },
            {
              label: isTr ? 'Sezon / Yıl' : 'Season Year',
              value: careerMeta?.seasonYear || '2026/27',
            },
            {
              label: isTr ? 'Menajer' : 'Manager',
              value: careerMeta?.managerName || (isTr ? 'Profil Bekleniyor' : 'Awaiting Profile'),
            },
            {
              label: isTr ? 'Kayıt Motoru' : 'Save Engine',
              value: 'IndexedDB V3',
            },
          ]}
          isActive={activeHoverMode === 'career'}
          onHover={() => setActiveHoverMode('career')}
        />

        {/* 2. DRAFT LEAGUE CARD */}
        <ModeExperienceCard
          mode="draft"
          themeColor="cyan"
          kicker={isTr ? 'Canlı Çok Oyunculu' : 'Live Multiplayer'}
          title={isTr ? 'Draft Ligi' : 'Draft League'}
          badge={isTr ? 'CANLI LOBİ' : 'LIVE LOBBY'}
          description={
            isTr
              ? 'Arkadaşlarınla veya küresel rakiplerle gerçek zamanlı draft odası kur. Sırayla yıldızları seç, kadronu kur ve şampiyon ol.'
              : 'Create live draft rooms with friends or global rivals. Pick stars turn-by-turn, build your dream squad and conquer.'
          }
          imageSrc="/media/homepage/draft-league.webp"
          primaryAction={{
            label: isTr ? 'Draft Arenasına Gir' : 'Enter Draft Arena',
            onClick: handleEnterDraft,
          }}
          telemetryStats={[
            {
              label: isTr ? 'Ağ Protokolü' : 'Network',
              value: 'Supabase Realtime',
              highlight: true,
            },
            {
              label: isTr ? 'Seçim Formatı' : 'Format',
              value: 'Snake Draft (11 Tur)',
            },
            {
              label: isTr ? 'Zaman Sınırı' : 'Clock Limit',
              value: '30s / Tur Başına',
            },
            {
              label: isTr ? 'Maç Motoru' : 'Match Engine',
              value: 'Canlı Simülasyon',
            },
          ]}
          isActive={activeHoverMode === 'draft'}
          onHover={() => setActiveHoverMode('draft')}
        />

        {/* 3. MATCH CENTER CARD */}
        <ModeExperienceCard
          mode="match"
          themeColor="gold"
          kicker={isTr ? 'Analitik Taktik Radar' : 'Tactical Radar'}
          title={isTr ? 'Maç Merkezi' : 'Match Center'}
          badge="60 FPS SIM"
          description={
            isTr
              ? '22-oyuncu deterministik 2D taktik radar, anlık formasyon müdahaleleri, pas ağları ve gerçek zamanlı xG istatistikleri.'
              : '22-player deterministic 2D tactical radar, real-time formation tweaks, passing matrices, and instant telemetry.'
          }
          imageSrc="/media/homepage/matchday.webp"
          primaryAction={{
            label: isTr ? 'Maç Merkezine Git' : 'Open Match Center',
            onClick: handleOpenMatchCenter,
          }}
          telemetryStats={[
            {
              label: isTr ? 'Simülasyon' : 'Simulation',
              value: '22-Oyuncu 2D Radar',
              highlight: true,
            },
            {
              label: isTr ? 'Gecikme' : 'Engine Latency',
              value: '0ms Deterministik',
            },
            {
              label: isTr ? 'Analiz Modeli' : 'Telemetry Model',
              value: 'xG + Pas Matrisi',
            },
            {
              label: isTr ? 'Hız Modu' : 'Tick Rate',
              value: '60 FPS / 1x-4x',
            },
          ]}
          isActive={activeHoverMode === 'match'}
          onHover={() => setActiveHoverMode('match')}
        />
      </div>
    </section>
  );
}
