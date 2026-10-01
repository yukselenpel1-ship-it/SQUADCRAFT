'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { MOCK_CLUBS, MOCK_PLAYERS } from '@/lib/data/mockData';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { CareerDifficulty, CareerSetupConfig } from '@/lib/career/types';
import { APP_VERSION } from '@/lib/version';
import { FeedbackModal } from '@/components/draft/FeedbackModal';
import {
  Trophy,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Settings,
  MessageSquare,
  Radio,
  Check,
  Zap,
  AlertTriangle,
} from 'lucide-react';

const FICTIONAL_NATIONALITIES = [
  'Alveria',
  'Nordia',
  'Solaria',
  'Valoria',
  'Marinia',
  'Kalyon',
  'Demirvadi',
  'Ayazbel',
];

const TACTICAL_STYLES = [
  { id: 'Gegenpress', name: 'Gegenpress', desc: 'Yoğun ön alan baskısı ve topu kaybeder kaybetmez hızlı geri kazanma.' },
  { id: 'Tiki-Taka', name: 'Tiki-Taka', desc: 'Kısa paslarla oyuna hükmetme, sabırlı hücum ve alan kontrolü.' },
  { id: 'Kontratak', name: 'Hızlı Kontratak', desc: 'Kati savunma disiplini ve savunma arkasına hızlı geçiş hücumları.' },
  { id: 'Dengeli', name: 'Dengeli & Esnek', desc: 'Rakibe ve maçın durumuna göre taktiksel uyum sağlayan esnek anlayış.' },
  { id: 'Kanat Hücumu', name: 'Kanat Hücumu', desc: 'Geniş alan kullanımı, kanat bindirmeleri ve ceza sahasına kilit ortalar.' },
];

const BOARD_EXPECTATIONS: Record<string, { target: string; desc: string }> = {
  'solvanya-gucu': { target: 'Şampiyonluk', desc: 'Ligi 1. sırada tamamlayarak Kıtasal Şampiyona kupasına doğrudan katılmak.' },
  'vadisehir': { target: 'Zirve Yarışı (İlk 2)', desc: 'Şampiyonluk yarışında son haftaya kadar mücadele etmek ve Kıtasal vize almak.' },
  'kalyon-doruk': { target: 'İlk 3 & Kupa', desc: 'İlk 3 sıra içerisinde yer alarak Kıtasal Eleme kontenjanı kazanmak.' },
  'kuzey-firtinasi': { target: 'İlk 4 Hedefi', desc: 'Ligi üst sıralarda bitirmek ve istikrarlı bir oyun kimliği oturtmak.' },
  'ayazkent': { target: 'Üst Sıralar (İlk 5)', desc: 'İlk 5 içerisinde yer alıp genç oyuncuları vitrine çıkarmak.' },
  'liman-birlik': { target: 'Orta Sıralar', desc: 'Güvenli bölgede kalıp sürpriz puanlarla üst sıraları zorlamak.' },
  'kanyon-atlas': { target: 'Ligde Kalma & Orta Sıra', desc: 'Düşme hattından uzak durarak mali disiplini korumak.' },
  'gokova-genclik': { target: 'Genç Gelişimi & Güvenli Bölge', desc: 'Altyapı oyuncularını geliştirirken ligde istikrar sağlamak.' },
  'kizilkaya-spor': { target: 'Ligde Tutunma', desc: 'Mütevazı bütçeyle ligde kalıcı olmak ve savaşçı bir takım yaratmak.' },
  'yelkenkoy-akademi': { target: 'Gelişim & Savaşçı Kimlik', desc: 'Genç akademi oyuncularını parlatmak ve ligde tutunmak.' },
  'bogazici-hisari': { target: 'İlk 5 & Kıtasal Hedef', desc: 'Ligde üst sıraları zorlamak ve Boğaz futbolunu temsil etmek.' },
  'toros-kartallari': { target: 'Orta Sıralar & Dinamizm', desc: 'Güçlü iç saha performansıyla ligde güvenli bölgede kalmak.' },
  'anadolu-atletik': { target: 'Ligde Kalma & Disiplin', desc: 'Kati savunma disipliniyle ligde tutunmak.' },
  'ege-dalga': { target: 'Genç Gelişimi & Güvenli Bölge', desc: 'Hızlı hücum futboluyla genç yetenekleri vitrine çıkarmak.' },
  'pamir-yildizi': { target: 'Ligde Kalma & Mücadele', desc: 'Mütevazı bütçeyle ligde kalıcı olmak.' },
  'sahil-marti': { target: 'Orta Sıralar & İstikrar', desc: 'Liman kenti enerjisiyle orta sıralarda yer bulmak.' },
  'volkan-atletik': { target: 'Savaşçı Kimlik & Tutunma', desc: 'Yüksek pres ve mücadeleci kimlikle ligde kalmak.' },
  'zirve-spor': { target: 'Sürpriz Üst Sıra', desc: 'Dağ havası ve tempolu oyunla üst sıralara tırmanmak.' },
};

export default function NewCareerPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  // Step 1: Manager Profile
  const [managerName, setManagerName] = useState('Oğuzhan Kaya');
  const [nationality, setNationality] = useState('Alveria');
  const [age, setAge] = useState<number | string>(34);
  const [tacticalStyle, setTacticalStyle] = useState('Gegenpress');
  const [difficulty, setDifficulty] = useState<CareerDifficulty>('Standart');

  // Step 2: League & Size
  const [leagueSize, setLeagueSize] = useState<10 | 14 | 18>(10);
  const [selectedLeague, setSelectedLeague] = useState('alveria-elit-ligi');

  // Step 3: Club Selection
  const [selectedClubId, setSelectedClubId] = useState<string>('kalyon-doruk');

  // Available clubs in selected league size
  const clubsInLeague = useMemo(() => {
    return MOCK_CLUBS.slice(0, leagueSize);
  }, [leagueSize]);

  // Ensure selected club belongs to chosen league
  useEffect(() => {
    if (!clubsInLeague.some((c) => c.id === selectedClubId)) {
      setSelectedClubId(clubsInLeague[0]?.id || 'solvanya-gucu');
    }
  }, [clubsInLeague, selectedClubId]);

  // Step 4: Settings
  const [startingDate] = useState('2026-08-01');
  const [transferWindowOpen] = useState(true);

  // Compute club statistics helper
  const clubStatsMap = useMemo(() => {
    const stats: Record<string, { avgOverall: number; avgAge: number; starPlayer: any }> = {};
    for (const club of MOCK_CLUBS) {
      const players = MOCK_PLAYERS.filter((p) => p.clubId === club.id);
      const totalOvr = players.reduce((a, b) => a + b.overall, 0);
      const totalAge = players.reduce((a, b) => a + b.age, 0);
      const sorted = [...players].sort((a, b) => b.overall - a.overall);
      stats[club.id] = {
        avgOverall: Math.round(totalOvr / (players.length || 1)),
        avgAge: Number((totalAge / (players.length || 1)).toFixed(1)),
        starPlayer: sorted[0],
      };
    }
    return stats;
  }, []);

  const highlightedClub = clubsInLeague.find((c) => c.id === selectedClubId) || clubsInLeague[0] || MOCK_CLUBS[0];
  const highlightedStats = clubStatsMap[highlightedClub.id] || { avgOverall: 75, avgAge: 25, starPlayer: null };
  const highlightedExpectation = BOARD_EXPECTATIONS[highlightedClub.id] || { target: 'İlk 4', desc: 'Üst sıralarda yer almak.' };

  const { startNewCareer, hasCareerSave } = useGame();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const executeCareerCreation = useCallback(() => {
    const finalAge = typeof age === 'number' ? age : Number(age) || 35;
    const setup: CareerSetupConfig = {
      managerProfile: {
        name: managerName.trim() || 'Menajer',
        nationality,
        age: Math.min(75, Math.max(21, finalAge)),
        tacticalStyle,
        difficulty,
      },
      selectedClubId,
      leagueSize,
      startingDate,
      seasonYear: '2026/27',
    };

    startNewCareer(setup);
    router.push('/dashboard');
  }, [managerName, nationality, age, tacticalStyle, difficulty, selectedClubId, leagueSize, startingDate, startNewCareer, router]);

  const handleStartCareer = useCallback(() => {
    if (hasCareerSave) {
      setIsConfirmModalOpen(true);
      return;
    }
    executeCareerCreation();
  }, [hasCareerSave, executeCareerCreation]);

  // Keyboard navigation for step progression
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFeedbackOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === 'Enter') {
        if (currentStep < 5) {
          setCurrentStep((prev) => (prev + 1) as any);
        } else if (currentStep === 5) {
          handleStartCareer();
        }
      } else if (e.key === 'Escape') {
        if (currentStep > 1) {
          setCurrentStep((prev) => (prev - 1) as any);
        } else {
          router.push('/');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, isFeedbackOpen, handleStartCareer, router]);

  const stepLabels = [
    { num: 1, label: 'PROFİL' },
    { num: 2, label: 'LİG' },
    { num: 3, label: 'KULÜP SEÇİMİ' },
    { num: 4, label: 'AYARLAR' },
    { num: 5, label: 'ONAY & BAŞLAT' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#04060A] text-[#F3F4F6] flex flex-col justify-between overflow-x-hidden select-none font-sans antialiased">
      {/* ==================================================================== */}
      {/* 1. SHARP STADIUM ARENA BACKGROUND (NO BLUR, CRISP GRAPHITE & LIGHTS) */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/images/bg-fc-arena.jpg')` }}
      >
        {/* High-contrast crisp sports vignette: zero blur */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04060A]/85 via-transparent to-[#04060A]/95" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#04060A]/40 to-[#04060A]/90" />
      </div>

      {/* ==================================================================== */}
      {/* 2. SQUADCRAFT BROADCAST TOP NAVIGATION BAR                           */}
      {/* ==================================================================== */}
      <header className="relative z-20 w-full border-b border-zinc-800 bg-[#070A0F] px-4 sm:px-8 py-2.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Plate & Back Button */}
          <div className="flex items-center gap-3.5">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ANA MENÜ</span>
            </Link>

            <div className="h-6 w-px bg-zinc-800 hidden sm:block" />

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 sm:h-9 w-11 sm:w-13 flex items-center justify-center">
                <Image
                  src="/images/sc-emblem-official-hd.png"
                  alt="SquadCraft SC"
                  width={52}
                  height={36}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 font-black uppercase italic tracking-tighter text-lg sm:text-xl leading-none">
                  <span className="text-white group-hover:text-zinc-100 transition-colors">SQUADCRAFT</span>
                  <span className="text-[#00F5A0]">26</span>
                </div>
                <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-400 uppercase mt-0.5">
                  CAREER CREATOR
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Tactical Category Switcher Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-600 hover:text-white transition-all"
            >
              [ ANA MERKEZ ]
            </Link>
            <button
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-[#00F5A0] text-black border border-[#00F5A0]"
            >
              [ KARİYER MODU ]
            </button>
            <Link
              href="/draft"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-[#00D4FF] hover:text-[#00D4FF] transition-all"
            >
              [ DRAFT LEAGUE ]
            </Link>
            <Link
              href="/settings"
              className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-zinc-900/90 text-zinc-300 border border-zinc-800 hover:border-zinc-500 hover:text-white transition-all"
            >
              [ AYARLAR ]
            </Link>
          </nav>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 text-[10px] font-mono font-bold text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-[#00F5A0]" />
              <span>SİSTEM: ÇEVRİMİÇİ</span>
            </div>

            <button
              onClick={() => setIsFeedbackOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span className="hidden sm:inline">Geri Bildirim</span>
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#101520] hover:bg-[#151D2C] border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white text-xs font-bold uppercase tracking-wider transition-all active:scale-95"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Ayarlar</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 3. SQUADCRAFT CAREER SETUP STEPPER (ATHLETIC HORIZONTAL BAR)         */}
      {/* ==================================================================== */}
      <div className="relative z-20 w-full bg-[#05080E] border-b border-zinc-800 px-4 sm:px-8 py-2">
        <div className="max-w-[1520px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
            {stepLabels.map((s) => {
              const isActive = currentStep === s.num;
              const isPassed = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  onClick={() => setCurrentStep(s.num as any)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[#00F5A0] text-black border border-[#00F5A0]'
                      : isPassed
                      ? 'bg-zinc-900 text-[#00F5A0] border border-zinc-700 hover:border-zinc-500'
                      : 'bg-zinc-950/80 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  <span>{s.num < 10 ? `0${s.num}` : s.num}</span>
                  <span className="hidden sm:inline">//</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-zinc-400">
            <span>SEZON:</span>
            <span className="text-[#00F5A0] font-bold">2026/27</span>
            <span className="text-zinc-600">•</span>
            <span>MOD:</span>
            <span className="text-white font-bold">TEK OYUNCULU</span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MAIN STEP CONTENT CONTAINER                                      */}
      {/* ==================================================================== */}
      <main className="relative z-20 max-w-[1520px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-6 my-auto flex flex-col items-center">
        {/* =================================================================== */}
        {/* STEP 1: MENAJER PROFİLİ                                             */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
                STEP 01 // MANAGER CREATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">
                MENAJER PROFİLİNİ OLUŞTUR
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xl mx-auto">
                Teknik direktör kimliğini, taktiksel felsefeni ve kariyer zorluk seviyeni belirle.
              </p>
            </div>

            <div className="bg-[#07110C] border-2 border-[#00F5A0] p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Menajer Adı & Soyadı <span className="text-[#00F5A0]">*</span>
                  </label>
                  <input
                    type="text"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="Örn: Oğuzhan Kaya"
                    maxLength={30}
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#00F5A0] px-4 py-3 text-sm text-white font-medium focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Milliyet <span className="text-[#00F5A0]">*</span>
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#00F5A0] px-4 py-3 text-sm text-white font-medium focus:outline-none transition-colors cursor-pointer"
                  >
                    {FICTIONAL_NATIONALITIES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Menajer Yaşı <span className="text-[#00F5A0]">*</span>
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    onBlur={() => {
                      const num = Number(age);
                      if (!num || isNaN(num) || num < 21) setAge(21);
                      else if (num > 75) setAge(75);
                      else setAge(num);
                    }}
                    min={21}
                    max={75}
                    placeholder="34"
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#00F5A0] px-4 py-3 text-sm text-white font-medium focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Taktiksel Felsefe <span className="text-[#00F5A0]">*</span>
                  </label>
                  <select
                    value={tacticalStyle}
                    onChange={(e) => setTacticalStyle(e.target.value)}
                    className="w-full bg-[#040C08] border border-zinc-700 focus:border-[#00F5A0] px-4 py-3 text-sm text-white font-medium focus:outline-none transition-colors cursor-pointer"
                  >
                    {TACTICAL_STYLES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Difficulty Options */}
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Kariyer Zorluk Seviyesi
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'Rahat',
                      title: 'RAHAT',
                      desc: '+%25 Transfer bütçesi, hoşgörülü yönetim ve hızlı gözlemleme.',
                      badge: 'bg-cyan-950 text-[#00D4FF] border border-cyan-700',
                    },
                    {
                      id: 'Standart',
                      title: 'STANDART',
                      desc: 'Dengeli gerçekçi simülasyon deneyimi ve standart bütçe dengesi.',
                      badge: 'bg-emerald-950 text-[#00F5A0] border border-emerald-700',
                    },
                    {
                      id: 'Zorlu',
                      title: 'ZORLU',
                      desc: '-%15 Transfer bütçesi, yüksek yönetim baskısı ve katı gözlem.',
                      badge: 'bg-red-950 text-red-400 border border-red-700',
                    },
                  ].map((diff) => {
                    const isSelected = difficulty === diff.id;
                    return (
                      <div
                        key={diff.id}
                        onClick={() => setDifficulty(diff.id as CareerDifficulty)}
                        className={`p-4 border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#041208] border-2 border-[#00F5A0]'
                            : 'bg-[#05090F] border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-black italic uppercase text-white">{diff.title}</h4>
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${diff.badge}`}>
                            {diff.id}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{diff.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <Link
                  href="/"
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all"
                >
                  ← İptal Et
                </Link>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                >
                  <span>LİG SEÇİMİNE GEÇ</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 2: LİG SEÇİMİ (10, 14 & 18 KULÜP SEÇENEKLERİ)                  */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
                STEP 02 // LEAGUE SELECTION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">
                LİG VE FORMAT SEÇİNİZ
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xl mx-auto">
                SquadCraft evreninin resmi lig formatını ve kulüp sayısını belirleyin.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  size: 10 as const,
                  name: 'ALVERIA ELİT LİGİ',
                  tier: 'KADEME 1 // KOMPAKT FORMAT',
                  desc: '10 seçkin kulüp, 18 haftalık yüksek tempolu lig maratonu ve ilk 3 sıra kıtasal kupa hakkı.',
                  weeks: '18 Hafta',
                  clubsCount: '10 Kulüp',
                  continental: 'İlk 3 Sıra',
                  recommended: false,
                },
                {
                  size: 14 as const,
                  name: 'ALVERIA PREMIER LİGİ',
                  tier: 'KADEME 1 // KLASİK FORMAT',
                  desc: '14 iddialı kulüp, 26 haftalık dengeli lig maratonu ve ilk 4 sıra kıtasal kupa kontenjanı.',
                  weeks: '26 Hafta',
                  clubsCount: '14 Kulüp',
                  continental: 'İlk 4 Sıra',
                  recommended: true,
                },
                {
                  size: 18 as const,
                  name: 'ALVERIA SÜPER LİGİ',
                  tier: 'KADEME 1 // BÜYÜK MARATON',
                  desc: '18 profesyonel kulüp, 34 haftalık tam sezonluk dev maraton ve ilk 5 sıra kıtasal kupa kontenjanı.',
                  weeks: '34 Hafta',
                  clubsCount: '18 Kulüp',
                  continental: 'İlk 5 Sıra',
                  recommended: false,
                },
              ].map((league) => {
                const isSelected = leagueSize === league.size;
                return (
                  <div
                    key={league.size}
                    onClick={() => setLeagueSize(league.size)}
                    className={`p-5 border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#07110C] border-[#00F5A0] shadow-2xl'
                        : 'bg-[#05090F] border-zinc-800 hover:border-zinc-700 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 flex items-center justify-center border font-black text-sm ${
                            isSelected
                              ? 'bg-[#032416] border-[#00F5A0] text-[#00F5A0]'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          <Trophy className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black italic uppercase text-white">{league.name}</h3>
                            <span
                              className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase ${
                                isSelected ? 'bg-[#00F5A0] text-black font-black' : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {league.size} KULÜP
                            </span>
                            {league.recommended && (
                              <span className="px-2 py-0.5 bg-[#00D4FF] text-black text-[9px] font-black uppercase">
                                POPÜLER
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">{league.desc}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-[#040C08] border border-zinc-800">
                            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Fikstür</span>
                            <span className="font-bold text-white">{league.weeks}</span>
                          </div>
                          <div className="p-2 bg-[#040C08] border border-zinc-800">
                            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Kıtasal</span>
                            <span className="font-bold text-[#00F5A0]">{league.continental}</span>
                          </div>
                          <div className="p-2 bg-[#040C08] border border-zinc-800">
                            <span className="block text-[9px] font-mono text-zinc-500 uppercase">Kulüpler</span>
                            <span className="font-bold text-white">{league.clubsCount}</span>
                          </div>
                        </div>

                        <span
                          className={`px-3 py-2 text-xs font-black uppercase tracking-wider ${
                            isSelected ? 'bg-[#00F5A0] text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {isSelected ? '✓ SEÇİLDİ' : 'SEÇ'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all"
                >
                  ← Geri
                </button>

                <button
                  onClick={() => setCurrentStep(3)}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                >
                  <span>KULÜP SEÇİMİNE GEÇ ({leagueSize} KULÜP)</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 3: KULÜP SEÇİMİ (ATHLETIC SELECTOR)                            */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="w-full max-w-6xl space-y-5">
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
                STEP 03 // CLUB SELECTION ({leagueSize} KULÜP)
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">
                YÖNETECEĞİNİZ KULÜBÜ SEÇİN
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xl mx-auto">
                Seçtiğiniz {leagueSize} kulüplü lig içerisinden takımınızı belirleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Club Selection List (7 Cols) */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {clubsInLeague.map((club) => {
                  const isSelected = selectedClubId === club.id;
                  const stats = clubStatsMap[club.id] || { avgOverall: 75, avgAge: 25 };
                  const exp = BOARD_EXPECTATIONS[club.id] || { target: 'İlk 4' };

                  return (
                    <div
                      key={club.id}
                      onClick={() => setSelectedClubId(club.id)}
                      className={`p-4 border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#06140D] border-2 border-[#00F5A0] shadow-xl'
                          : 'bg-[#080C14] border-zinc-800 hover:border-zinc-700 hover:bg-[#0B101A]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <ClubBadge
                            code={club.code}
                            name={club.name}
                            clubId={club.id}
                            primaryColor={club.primaryColor}
                            secondaryColor={club.secondaryColor}
                            size="md"
                          />
                          <div className="truncate">
                            <h4 className="text-sm font-black italic uppercase text-white truncate">{club.name}</h4>
                            <span className="text-xs text-zinc-400 font-mono">{club.city}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 py-2 border-t border-b border-zinc-800 text-center text-xs">
                          <div>
                            <span className="block text-[10px] font-mono text-zinc-500 uppercase">Kadro</span>
                            <span className="font-black text-white">{stats.avgOverall} OVR</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono text-zinc-500 uppercase">Bütçe</span>
                            <span className="font-black text-[#00F5A0]">€{(club.transferBudget / 1000000).toFixed(1)}M</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-mono text-zinc-500 uppercase">İtibar</span>
                            <span className="font-black text-amber-400">%{club.reputation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400 truncate">Hedef: <strong className="text-zinc-200">{exp.target}</strong></span>
                        <span
                          className={`px-2.5 py-0.5 text-[9px] font-black uppercase ${
                            isSelected ? 'bg-[#00F5A0] text-black' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isSelected ? 'SEÇİLDİ' : 'SEÇ'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Large Featured SquadCraft Club Card (5 Cols, ZERO BLUR) */}
              <div className="lg:col-span-5 bg-[#06140D] border-2 border-[#00F5A0] p-6 flex flex-col justify-between shadow-2xl">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <ClubBadge
                      code={highlightedClub.code}
                      name={highlightedClub.name}
                      clubId={highlightedClub.id}
                      primaryColor={highlightedClub.primaryColor}
                      secondaryColor={highlightedClub.secondaryColor}
                      size="xl"
                    />
                    <div>
                      <span className="px-2 py-0.5 bg-[#00F5A0] text-black text-[9px] font-black uppercase">
                        {highlightedClub.foundedYear} KURULUŞ
                      </span>
                      <h3 className="text-2xl font-black italic uppercase text-white mt-1 leading-tight">
                        {highlightedClub.name}
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        {highlightedClub.city} • Stadyum: {highlightedClub.stadium} ({highlightedClub.stadiumCapacity.toLocaleString('tr-TR')} Kişilik)
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 bg-[#040C08] p-3.5 border border-zinc-800">
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Transfer Bütçesi</span>
                      <span className="text-xl font-black italic text-[#00F5A0]">
                        €{(highlightedClub.transferBudget / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Haftalık Maaş</span>
                      <span className="text-xl font-black italic text-white">
                        €{(highlightedClub.wageBudget / 1000).toFixed(0)}k/hf
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Kadro Gücü</span>
                      <span className="text-xl font-black italic text-[#00D4FF]">
                        {highlightedStats.avgOverall} OVR
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 block">Kulüp İtibarı</span>
                      <span className="text-xl font-black italic text-amber-400">
                        %{highlightedClub.reputation}
                      </span>
                    </div>
                  </div>

                  {/* Board Expectation */}
                  <div className="p-3.5 bg-[#121006] border border-amber-500/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span>YÖNETİM BEKLENTİSİ</span>
                    </div>
                    <div className="text-sm font-black text-white">{highlightedExpectation.target}</div>
                    <p className="text-xs text-amber-200/80">{highlightedExpectation.desc}</p>
                  </div>

                  {/* Star Player */}
                  {highlightedStats.starPlayer && (
                    <div className="p-3 bg-[#040C08] border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#032416] border border-[#00F5A0] flex items-center justify-center font-black text-xs text-[#00F5A0]">
                          {highlightedStats.starPlayer.position}
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block">Yıldız Oyuncu</span>
                          <span className="text-xs font-black text-white">
                            {highlightedStats.starPlayer.firstName} {highlightedStats.starPlayer.lastName}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-black italic text-[#00F5A0]">
                        {highlightedStats.starPlayer.overall} OVR
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-center">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase transition-all"
                  >
                    ← Geri
                  </button>

                  <button
                    onClick={() => setCurrentStep(4)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                  >
                    <span>KULÜBÜ SEÇ & İLERLE</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 4: KARİYER AYARLARI                                            */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
                STEP 04 // SEASON CONFIGURATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">
                KARİYER AYARLARI
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xl mx-auto">
                Başlangıç takvimini, transfer penceresi durumunu ve kayıt tercihlerini doğrula.
              </p>
            </div>

            <div className="bg-[#07110C] border-2 border-[#00F5A0] p-6 sm:p-8 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between p-4 bg-[#040C08] border border-zinc-800">
                <div>
                  <h4 className="text-sm font-black italic uppercase text-white">Başlangıç Tarihi</h4>
                  <p className="text-xs text-zinc-400 font-mono">Sezon Öncesi Hazırlık Kampı (Transfer dönemi aktif)</p>
                </div>
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 text-xs font-mono font-bold text-[#00F5A0]">
                  1 Ağustos 2026
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#040C08] border border-zinc-800">
                <div>
                  <h4 className="text-sm font-black italic uppercase text-white">Yaz Transfer Dönemi</h4>
                  <p className="text-xs text-zinc-400 font-mono">1 Temmuz – 31 Ağustos arası serbest transfer ve kiralama açık</p>
                </div>
                <span className="px-3 py-1 bg-[#032416] border border-[#00F5A0]/60 text-xs font-mono font-bold text-[#00F5A0]">
                  AÇIK
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#040C08] border border-zinc-800">
                <div>
                  <h4 className="text-sm font-black italic uppercase text-white">Otomatik Kayıt (Auto-Save)</h4>
                  <p className="text-xs text-zinc-400 font-mono">Her maç ve takvim günü ilerlemesinde tarayıcıya kaydedilir</p>
                </div>
                <span className="px-3 py-1 bg-[#032416] border border-[#00F5A0]/60 text-xs font-mono font-bold text-[#00F5A0]">
                  AKTİF
                </span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all"
                >
                  ← Geri
                </button>

                <button
                  onClick={() => setCurrentStep(5)}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all active:scale-95 shadow-lg"
                >
                  <span>ÖZET & ONAY AŞAMASINA GEÇ</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* STEP 5: KARİYERİ BAŞLAT (OFFICIAL CONTRACT & LAUNCH)                */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="w-full max-w-4xl space-y-6">
            <div className="text-center space-y-1.5">
              <span className="px-2.5 py-0.5 bg-[#00F5A0] text-black text-[10px] font-black uppercase tracking-widest">
                STEP 05 // OFFICIAL CONFIRMATION
              </span>
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight text-white">
                KARİYERİ BAŞLATMAYA HAZIRSINIZ!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-xl mx-auto">
                Aşağıdaki detayları kontrol et ve Alveria Elit Ligi maceranı resmen başlat.
              </p>
            </div>

            <div className="bg-[#07110C] border-2 border-[#00F5A0] p-6 sm:p-8 space-y-6 shadow-2xl">
              {/* Selected Club & Manager Card */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#040C08] border border-zinc-800">
                <div className="flex items-center gap-4">
                  <ClubBadge
                    code={highlightedClub.code}
                    primaryColor={highlightedClub.primaryColor}
                    secondaryColor={highlightedClub.secondaryColor}
                    size="xl"
                  />
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-400">Seçilen Kulüp</span>
                    <h3 className="text-2xl font-black italic uppercase text-white">{highlightedClub.name}</h3>
                    <p className="text-xs text-zinc-400 font-mono">
                      {leagueSize === 18 ? 'Alveria Süper Ligi (18 Kulüp)' : leagueSize === 14 ? 'Alveria Premier Ligi (14 Kulüp)' : 'Alveria Elit Ligi (10 Kulüp)'} • {highlightedClub.city}
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-6 w-full sm:w-auto">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Teknik Direktör</span>
                  <div className="text-lg font-black italic text-[#00F5A0]">{managerName}</div>
                  <div className="text-xs text-zinc-400 font-mono">{nationality} • {age} Yaşında</div>
                </div>
              </div>

              {/* Summary Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3.5 bg-[#040C08] border border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Zorluk</span>
                  <span className="text-base font-black italic text-white">{difficulty}</span>
                </div>
                <div className="p-3.5 bg-[#040C08] border border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Taktik</span>
                  <span className="text-base font-black italic text-[#00D4FF]">{tacticalStyle}</span>
                </div>
                <div className="p-3.5 bg-[#040C08] border border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Transfer Bütçesi</span>
                  <span className="text-base font-black italic text-[#00F5A0]">
                    €{(highlightedClub.transferBudget / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="p-3.5 bg-[#040C08] border border-zinc-800">
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">Hedef</span>
                  <span className="text-base font-black italic text-amber-400">{highlightedExpectation.target}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold uppercase text-zinc-300 hover:text-white transition-all"
                >
                  ← Geri
                </button>

                <button
                  onClick={handleStartCareer}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#00F5A0] hover:bg-[#00D68B] text-black font-black text-sm uppercase tracking-wider transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
                >
                  <Sparkles className="w-4 h-4 fill-black" />
                  <span>KARİYERİ RESMEN BAŞLAT</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* 5. SQUADCRAFT BROADCAST TICKER & CONTROLLER PROMPT FOOTER             */}
      {/* ==================================================================== */}
      <footer className="relative z-20 w-full border-t border-zinc-800 bg-[#05070B] text-xs">
        {/* Broadcast Live News Ticker Strip */}
        <div className="w-full bg-[#080C14] border-b border-zinc-800/80 px-4 py-1.5 flex items-center overflow-hidden">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-zinc-800 text-[10px] font-black uppercase text-[#00F5A0]">
            <Radio className="w-3 h-3 text-[#00F5A0] animate-pulse" />
            <span>CANLI BÜLTEN</span>
          </div>
          <div className="overflow-hidden whitespace-nowrap text-[11px] font-mono text-zinc-400 pl-4">
            <span className="text-zinc-200 font-bold">// YENİ KARİYER KURULUMU AKTİF</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>ALVERIA ELİT LİGİ 2026/27 SEZONU</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00F5A0]">10 ÖZGÜN KULÜP SEÇİMİ AÇIK</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span>RESMİ TAKTİK SİMÜLASYON MOTORU</span>
            <span className="mx-3 text-zinc-600">•</span>
            <span className="text-[#00D4FF]">{APP_VERSION}</span>
          </div>
        </div>

        {/* Shortcuts & Status HUD */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="hidden md:flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">↵ ENTER</kbd>
              <span>İLERLE / BAŞLAT</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">ESC</kbd>
              <span>GERİ / ANA MENÜ</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-bold">SQUADCRAFT CAREER ENGINE</span>
            <span className="text-zinc-600">•</span>
            <span className="text-[#00F5A0] font-bold">{APP_VERSION}</span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SİSTEM HAZIR</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Existing Save Overwrite Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#070A12] border-2 border-amber-500/80 p-5 sm:p-6 shadow-2xl text-zinc-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  DİKKAT // MEVCUT KAYIT
                </div>
                <h3 className="text-base font-black text-white uppercase">
                  Yeni Kariyer Başlatılsın mı?
                </h3>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-300 leading-relaxed mb-6">
              Mevcut kariyer kaydınız silinecek. Yeni kariyer başlatmak istiyor musunuz?
            </p>

            <div className="flex items-center justify-end gap-3 font-mono">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-bold uppercase transition-colors"
              >
                İPTAL
              </button>
              <button
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  executeCareerCreation();
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 text-xs font-black uppercase transition-colors shadow-lg"
              >
                YENİ KARİYER BAŞLAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        route="/career/new"
        gamePhase="Kariyer Kurulumu"
      />
    </div>
  );
}
