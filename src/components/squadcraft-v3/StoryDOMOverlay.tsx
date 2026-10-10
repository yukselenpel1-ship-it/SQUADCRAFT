'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Zap,
  SlidersHorizontal,
  Trophy,
  Radio,
  ChevronDown,
  Shield,
  Users,
} from 'lucide-react';
import { useScrollStory } from './useScrollStory';
import { loadCareerMetadata, CareerSaveMeta } from '@/lib/career/careerStorage';
import { useLanguage } from '@/lib/context/LanguageContext';
import { FormationType } from '../squadcraft-experience/FormationVisualization';

export function StoryDOMOverlay() {
  const router = useRouter();
  const { language } = useLanguage();
  const isTr = language === 'tr';
  const { formation, setFormation, progress } = useScrollStory();

  const [careerMeta, setCareerMeta] = useState<CareerSaveMeta | null>(null);

  useEffect(() => {
    setCareerMeta(loadCareerMetadata());
  }, []);

  return (
    <div className="relative z-10 w-full overflow-x-hidden">
      {/* ========================================================
          ACT I: STADIUM AWAKENING (0.00 – 0.18)
      ======================================================== */}
      <section
        id="act-intro"
        className="relative w-full min-h-[110svh] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 pt-28 pb-12 text-center"
      >
        <div className="my-auto max-w-4xl mx-auto flex flex-col items-center">
          {/* Kicker */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#B7FF3C]/35 backdrop-blur-md mb-5">
            <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B7FF3C]">
              {isTr ? 'PERDE I // STADYUM UYANIŞI' : 'ACT I // STADIUM AWAKENING'}
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className="font-condensed text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-[#F2F6FA] leading-[0.92]"
            style={{
              textShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 45px rgba(56,216,255,0.2)',
            }}
          >
            {isTr ? (
              <>
                FUTBOLU <span className="text-[#B7FF3C]">YÖNET</span>
                <br />
                ZAFERİ İNŞA ET
              </>
            ) : (
              <>
                COMMAND <span className="text-[#B7FF3C]">THE GAME</span>
                <br />
                BUILD A DYNASTY
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="font-sans text-sm sm:text-base md:text-xl text-[#9BAAB9] max-w-2xl mt-6 leading-relaxed">
            {isTr
              ? 'Anıtsal bir stadyum evreninde geçen, 3D kaydırma güdümlü yeni nesil taktik futbol menajerliği.'
              : 'A continuous 3D scroll cinematic set in a colossal stadium command center. Real tactics, zero generic templates.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mt-8 w-full sm:w-auto max-w-sm sm:max-w-none">
            <button
              type="button"
              onClick={() => {
                if (careerMeta?.exists) {
                  router.push('/dashboard');
                } else {
                  router.push('/career/new');
                }
              }}
              className="h-13 px-8 rounded-[6px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(183,255,60,0.4)] cursor-pointer active:scale-95"
            >
              <span>
                {careerMeta?.exists
                  ? isTr
                    ? 'Kariyere Devam Et'
                    : 'Continue Career'
                  : isTr
                  ? 'Kariyer Başlat'
                  : 'Start Career'}
              </span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => router.push('/draft')}
              className="h-13 px-7 rounded-[6px] bg-[#111B27]/90 hover:bg-[#192535] border border-white/15 hover:border-[#38D8FF]/40 text-[#F2F6FA] font-condensed font-black text-base sm:text-lg uppercase tracking-wider backdrop-blur-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Zap size={17} className="text-[#38D8FF]" />
              <span>{isTr ? 'Draft Ligine Gir' : 'Enter Draft Arena'}</span>
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="flex flex-col items-center gap-1.5 opacity-70 animate-bounce">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] uppercase text-[#9BAAB9]">
            {isTr ? 'AŞAĞI KAYDIR // KEŞFET' : 'SCROLL TO COMMAND'}
          </span>
          <ChevronDown size={16} className="text-[#B7FF3C]" />
        </div>
      </section>

      {/* ========================================================
          ACT II: TACTICAL UNIVERSE (0.18 – 0.38)
      ======================================================== */}
      <section
        id="act-tactics"
        className="relative w-full min-h-[110svh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 text-center"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#38D8FF]/35 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-[#38D8FF] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#38D8FF]">
              {isTr ? 'PERDE II // HOLOGRAFİK SAHA' : 'ACT II // TACTICAL UNIVERSE'}
            </span>
          </div>

          <h2 className="font-condensed text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F2F6FA] leading-tight">
            {isTr ? (
              <>
                11 TAKTİK DÜĞÜM <span className="text-[#38D8FF]">// PAS AĞI</span>
              </>
            ) : (
              <>
                11 TACTICAL NODES <span className="text-[#38D8FF]">// PASS MATRIX</span>
              </>
            )}
          </h2>

          <p className="font-sans text-xs sm:text-base md:text-lg text-[#9BAAB9] max-w-2xl mt-4 leading-relaxed">
            {isTr
              ? 'Yüzen holografik saha üzerinde dinamik mevkiler, anlık formasyon adaptasyonu ve gerçek zamanlı pas kanalları.'
              : 'Interactive 3D tactical coordinates, curved passing channels, and instant formation adjustments in real time.'}
          </p>

          {/* Interactive Formation Switcher */}
          <div className="mt-8 p-2 rounded-[8px] bg-[#08111D]/90 border border-white/10 backdrop-blur-md shadow-xl flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 text-[#9BAAB9]">
              <SlidersHorizontal size={14} className="text-[#B7FF3C]" />
              <span className="font-mono text-[10px] tracking-widest uppercase hidden xs:inline">
                {isTr ? 'FORMASYON:' : 'FORMATION:'}
              </span>
            </div>
            {(['4-3-3', '4-2-3-1', '3-4-3'] as FormationType[]).map((f) => {
              const isActive = formation === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormation(f)}
                  className={`px-4 py-2 rounded-[5px] font-mono text-xs sm:text-sm font-bold uppercase transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#B7FF3C] text-[#05080D] shadow-[0_0_14px_rgba(183,255,60,0.4)] scale-105'
                      : 'text-[#9BAAB9] hover:text-[#F2F6FA] hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#9BAAB9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38D8FF]" />
            <span>
              {isTr
                ? '#10 KIMURA • OYUN KURUCU DÜĞÜMÜ AKTİF'
                : '#10 KIMURA • KEY PLAYMAKER NODE ACTIVE'}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          ACT III: BUILD YOUR DYNASTY (0.38 – 0.58)
      ======================================================== */}
      <section
        id="act-career"
        className="relative w-full min-h-[110svh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 text-center"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#FFC857]/35 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-[#FFC857] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#FFC857]">
              {isTr ? 'PERDE III // KARİYER HANEDANI' : 'ACT III // BUILD YOUR DYNASTY'}
            </span>
          </div>

          <h2 className="font-condensed text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F2F6FA] leading-tight">
            {isTr ? (
              <>
                KULÜBÜNÜ <span className="text-[#FFC857]">ZİRVEYE</span> TAŞI
              </>
            ) : (
              <>
                FORGE YOUR <span className="text-[#FFC857]">LEGACY</span>
              </>
            )}
          </h2>

          <p className="font-sans text-xs sm:text-base md:text-lg text-[#9BAAB9] max-w-2xl mt-4 leading-relaxed">
            {isTr
              ? 'IndexedDB yerel kayıt güvencesiyle 2000+ kurgusal oyuncu havuzu, dinamik bütçe, scouting ve akademi yönetimi.'
              : 'Multi-season universe backed by local IndexedDB. 2000+ fictional players, dynamic market, scouting network.'}
          </p>

          {/* Real Save State Card */}
          <div className="mt-8 w-full max-w-md bg-[#08111D]/85 border border-white/10 rounded-[8px] p-5 backdrop-blur-md text-left shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#9BAAB9]">
                {isTr ? 'KAYIT DURUMU' : 'SAVE STATE'}
              </span>
              <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#FFC857]/15 text-[#FFC857] border border-[#FFC857]/30">
                {careerMeta?.exists
                  ? isTr
                    ? 'KAYIT BULUNDU'
                    : 'SAVE ACTIVE'
                  : isTr
                  ? 'YENİ SEZON'
                  : 'READY'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-[#9BAAB9] uppercase">
                  {isTr ? 'Aktif Kulüp' : 'Club'}
                </span>
                <p className="font-condensed font-bold text-lg text-[#F2F6FA] truncate">
                  {careerMeta?.clubName || (isTr ? 'Veritabanı Hazır' : 'Universe Ready')}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#9BAAB9] uppercase">
                  {isTr ? 'Sezon' : 'Season'}
                </span>
                <p className="font-mono font-bold text-base text-[#F2F6FA]">
                  {careerMeta?.seasonYear || '2026/27'}
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (careerMeta?.exists) {
                    router.push('/dashboard');
                  } else {
                    router.push('/career/new');
                  }
                }}
                className="flex-1 h-12 rounded-[5px] bg-[#FFC857] hover:bg-[#ffd780] text-[#05080D] font-condensed font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>
                  {careerMeta?.exists
                    ? isTr
                      ? 'Kariyere Devam Et'
                      : 'Continue Career'
                    : isTr
                    ? 'Yeni Kariyer Başlat'
                    : 'Start Career'}
                </span>
                <ArrowRight size={16} />
              </button>

              {careerMeta?.exists && (
                <button
                  type="button"
                  onClick={() => router.push('/career/new')}
                  className="h-12 px-4 rounded-[5px] bg-white/5 hover:bg-white/10 border border-white/10 text-[#F2F6FA] font-condensed font-bold text-xs uppercase cursor-pointer"
                >
                  {isTr ? 'Yeni' : 'New'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          ACT IV: DRAFT LEAGUE (0.58 – 0.78)
      ======================================================== */}
      <section
        id="act-draft"
        className="relative w-full min-h-[110svh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-20 text-center"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#477BFF]/35 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-[#477BFF] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#38D8FF]">
              {isTr ? 'PERDE IV // ÇOK OYUNCULU DRAFT' : 'ACT IV // LIVE MULTIPLAYER DRAFT'}
            </span>
          </div>

          <h2 className="font-condensed text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight text-[#F2F6FA] leading-tight">
            {isTr ? (
              <>
                DRAFT ARENASI <span className="text-[#38D8FF]">// CANLI LOBİ</span>
              </>
            ) : (
              <>
                DRAFT ARENA <span className="text-[#38D8FF]">// LIVE LOBBY</span>
              </>
            )}
          </h2>

          <p className="font-sans text-xs sm:text-base md:text-lg text-[#9BAAB9] max-w-2xl mt-4 leading-relaxed">
            {isTr
              ? 'Arkadaşlarınızla veya küresel rakiplerle gerçek zamanlı draft odası kurun. Sırayla yıldızları seçin, kadronuzu kurun ve şampiyon olun.'
              : 'Real-time turn-based snake draft rooms powered by Supabase. Draft your 11-star squad and battle in live tournaments.'}
          </p>

          {/* Draft Highlights */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
            <div className="bg-[#08111D]/80 border border-white/10 rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-mono text-[#9BAAB9] uppercase">FORMAT</span>
              <p className="font-condensed font-bold text-base text-[#F2F6FA]">SNAKE DRAFT</p>
            </div>
            <div className="bg-[#08111D]/80 border border-white/10 rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-mono text-[#9BAAB9] uppercase">TUR SÜRESİ</span>
              <p className="font-condensed font-bold text-base text-[#38D8FF]">30 SANİYE</p>
            </div>
            <div className="bg-[#08111D]/80 border border-white/10 rounded-[6px] p-3 text-center">
              <span className="text-[10px] font-mono text-[#9BAAB9] uppercase">MAÇ MOTORU</span>
              <p className="font-condensed font-bold text-base text-[#B7FF3C]">60 FPS CANLI</p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/draft')}
              className="h-13 px-8 rounded-[6px] bg-[#38D8FF] hover:bg-[#68e2ff] text-[#05080D] font-condensed font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(56,216,255,0.4)] cursor-pointer active:scale-95"
            >
              <Zap size={18} />
              <span>{isTr ? 'Draft Odasına Gir' : 'Enter Draft Room'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          ACT V: COMMAND THE GAME (0.78 – 1.00)
      ======================================================== */}
      <section
        id="act-finale"
        className="relative w-full min-h-[110svh] flex flex-col justify-between items-center px-4 sm:px-6 lg:px-8 pt-20 pb-12 text-center"
      >
        <div className="max-w-6xl mx-auto flex flex-col items-center my-auto w-full">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111B27]/85 border border-[#B7FF3C]/35 backdrop-blur-md mb-4">
            <span className="w-2 h-2 rounded-full bg-[#B7FF3C] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-[#B7FF3C]">
              {isTr ? 'PERDE V // BÜYÜK FİNAL' : 'ACT V // THE MASTER FINALE'}
            </span>
          </div>

          <h2 className="font-condensed text-4xl sm:text-6xl md:text-8xl font-black uppercase tracking-tight text-[#F2F6FA] leading-[0.95]">
            {isTr ? (
              <>
                KULÜBÜN. TAKTİĞİN. <span className="text-[#B7FF3C]">MİRASIN.</span>
              </>
            ) : (
              <>
                YOUR CLUB. YOUR TACTICS. <span className="text-[#B7FF3C]">YOUR LEGACY.</span>
              </>
            )}
          </h2>

          <p className="font-sans text-xs sm:text-base md:text-xl text-[#9BAAB9] max-w-2xl mt-4 leading-relaxed">
            {isTr
              ? 'Tüm yollar sahaya çıkar. Bir oyun modu seçin ve futbol evrenine hükmedin.'
              : 'All roads lead to the pitch. Choose your path and command the game.'}
          </p>

          {/* Three Signature World Entry Portals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full mt-10">
            {/* 1. Career Mode Portal */}
            <div className="bg-[#08111D]/90 border border-[#B7FF3C]/30 hover:border-[#B7FF3C] rounded-[8px] p-6 text-left flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center gap-2 text-[#B7FF3C] mb-2">
                  <Trophy size={18} />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {isTr ? 'STRATEJİK' : 'STRATEGIC'}
                  </span>
                </div>
                <h3 className="font-condensed font-black text-2xl uppercase text-[#F2F6FA] mb-2">
                  {isTr ? 'Kariyer Modu' : 'Career Mode'}
                </h3>
                <p className="text-xs text-[#9BAAB9] leading-relaxed mb-4">
                  {isTr
                    ? 'Kulübünü sıfırdan zirveye taşı. Scouting, altyapı ve kupa hanedanlığı.'
                    : 'Lead your club to glory. Deep management, youth academy, and championships.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (careerMeta?.exists) {
                    router.push('/dashboard');
                  } else {
                    router.push('/career/new');
                  }
                }}
                className="w-full h-11 rounded-[5px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#05080D] font-condensed font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>
                  {careerMeta?.exists
                    ? isTr
                      ? 'Kariyere Devam Et'
                      : 'Continue Career'
                    : isTr
                    ? 'Kariyer Başlat'
                    : 'Start Career'}
                </span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 2. Draft League Portal */}
            <div className="bg-[#08111D]/90 border border-[#38D8FF]/30 hover:border-[#38D8FF] rounded-[8px] p-6 text-left flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center gap-2 text-[#38D8FF] mb-2">
                  <Zap size={18} />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {isTr ? 'CANLI REKABET' : 'MULTIPLAYER'}
                  </span>
                </div>
                <h3 className="font-condensed font-black text-2xl uppercase text-[#F2F6FA] mb-2">
                  {isTr ? 'Draft Ligi' : 'Draft League'}
                </h3>
                <p className="text-xs text-[#9BAAB9] leading-relaxed mb-4">
                  {isTr
                    ? 'Gerçek zamanlı snake draft odaları, 11 turluk seçim süresi ve canlı maçlar.'
                    : 'Real-time turn-based draft lobbies with friends and global managers.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/draft')}
                className="w-full h-11 rounded-[5px] bg-[#38D8FF] hover:bg-[#68e2ff] text-[#05080D] font-condensed font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{isTr ? 'Draft Arenasına Gir' : 'Enter Draft'}</span>
                <ArrowRight size={15} />
              </button>
            </div>

            {/* 3. Match Center Portal */}
            <div className="bg-[#08111D]/90 border border-[#FFC857]/30 hover:border-[#FFC857] rounded-[8px] p-6 text-left flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center gap-2 text-[#FFC857] mb-2">
                  <Radio size={18} />
                  <span className="font-mono text-[10px] tracking-widest uppercase">
                    {isTr ? 'ANALİTİK RADAR' : 'TACTICAL SIM'}
                  </span>
                </div>
                <h3 className="font-condensed font-black text-2xl uppercase text-[#F2F6FA] mb-2">
                  {isTr ? 'Maç Merkezi' : 'Match Center'}
                </h3>
                <p className="text-xs text-[#9BAAB9] leading-relaxed mb-4">
                  {isTr
                    ? '22-oyunculu 60 FPS 2D taktik radar, anlık formasyon müdahaleleri ve xG analizi.'
                    : '60 FPS 2D radar deterministic match simulation engine.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (careerMeta?.exists) {
                    router.push('/fixtures');
                  } else {
                    router.push('/match');
                  }
                }}
                className="w-full h-11 rounded-[5px] bg-[#FFC857] hover:bg-[#ffd780] text-[#05080D] font-condensed font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>{isTr ? 'Maç Merkezine Git' : 'Open Match Center'}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Sovereign Sports Footer */}
        <footer className="w-full pt-16 border-t border-white/10 mt-12">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#9BAAB9] text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="font-condensed font-black text-base text-[#F2F6FA]">SQUADCRAFT</span>
              <span>// COMMAND THE GAME V3</span>
            </div>
            <div>
              ALL TEAMS, PLAYERS, AND COMPETITIONS ARE 100% FICTIONAL LORE.
            </div>
            <div>
              &copy; {new Date().getFullYear()} SQUADCRAFT. ALL RIGHTS RESERVED.
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
