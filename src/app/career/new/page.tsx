'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { MOCK_CLUBS, MOCK_PLAYERS } from '@/lib/data/mockData';
import { ClubBadge } from '@/components/ui/ClubBadge';
import { CareerDifficulty, CareerSetupConfig } from '@/lib/career/types';
import { APP_VERSION } from '@/lib/version';
import {
  Trophy,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Settings,
  Check,
  Zap,
  AlertTriangle,
  User,
  Compass,
  Radio,
  Layers,
  Flame,
  Award,
  Wallet,
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
  { id: 'Gegenpress', name: 'Gegenpress', desc: 'Yoğun ön alan baskısı ve topu kaybeder kaybetmez şok geri kazanım.' },
  { id: 'Tiki-Taka', name: 'Tiki-Taka', desc: 'Kısa paslarla oyuna hükmetme, sabırlı hücum ve alan kontrolü.' },
  { id: 'Kontratak', name: 'Hızlı Kontratak', desc: 'Kati savunma disiplini ve savunma arkasına hızlı geçiş akınları.' },
  { id: 'Dengeli', name: 'Dengeli & Esnek', desc: 'Rakibe ve maçın gidişatına göre taktiksel uyum sağlayan esnek anlayış.' },
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

  // Step 1: Manager Profile
  const [managerName, setManagerName] = useState('Steve');
  const [nationality, setNationality] = useState('Alveria');
  const [age, setAge] = useState<number | string>(34);
  const [tacticalStyle, setTacticalStyle] = useState('Gegenpress');
  const [difficulty, setDifficulty] = useState<CareerDifficulty>('Standart');

  // Step 2: League & Size
  const [leagueSize, setLeagueSize] = useState<10 | 14 | 18>(10);
  const [selectedLeague] = useState('alveria-elit-ligi');

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeCareerCreation = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const finalAge = typeof age === 'number' ? age : Number(age) || 35;
      const setup: CareerSetupConfig = {
        managerProfile: {
          name: managerName.trim() || 'Steve',
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

      await startNewCareer(setup);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Career creation error:', err);
      alert('Kariyer başlatılamadı: ' + (err?.message || 'Bilinmeyen hata'));
    } finally {
      setIsSubmitting(false);
    }
  }, [managerName, nationality, age, tacticalStyle, difficulty, selectedClubId, leagueSize, startingDate, startNewCareer, router]);

  const handleStartCareer = useCallback(() => {
    if (hasCareerSave) {
      setIsConfirmModalOpen(true);
      return;
    }
    executeCareerCreation();
  }, [hasCareerSave, executeCareerCreation]);

  const stepLabels = [
    { num: 1, id: '01', title: 'PROFILE', desc: 'Menajer Kimliği' },
    { num: 2, id: '02', title: 'LEAGUE', desc: 'Format & Boyut' },
    { num: 3, id: '03', title: 'CLUB', desc: 'Kulüp Seçimi' },
    { num: 4, id: '04', title: 'SETTINGS', desc: 'Sezon Ayarları' },
    { num: 5, id: '05', title: 'CONFIRM', desc: 'Kariyeri Başlat' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-[#050706] text-[#f3f6f3] flex flex-col justify-between overflow-x-hidden select-none font-inter antialiased">
      {/* Dynamic Stadium Tunnel Lighting Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(ellipse at 50% 10%, rgba(184, 255, 61, ${0.04 * currentStep}), transparent 70%),
                         radial-gradient(ellipse at 15% 40%, rgba(33, 223, 189, ${0.03 * currentStep}), transparent 60%),
                         #050706`,
          }}
        />

        {/* Stadium Tunnel Floodlights Activation Bar (1 to 5 lights) */}
        <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 px-8 opacity-75">
          {[1, 2, 3, 4, 5].map((light) => (
            <div
              key={light}
              className={`flex-1 h-full transition-all duration-700 ${
                light <= currentStep
                  ? 'bg-[#b8ff3d] shadow-[0_0_12px_#b8ff3d]'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Top Terminal Header */}
      <header className="relative z-20 w-full border-b border-white/10 bg-[#090d0a]/90 backdrop-blur-md px-6 lg:px-12 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded-[4px] bg-[#0d130f] hover:bg-white/5 border border-white/10 text-[#8f9a91] hover:text-[#f3f6f3] text-xs font-ibm font-bold uppercase transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>ANA MENÜ</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[3px] bg-[#0d1611] border border-[#b8ff3d]/60 flex items-center justify-center shadow-[0_0_10px_rgba(184,255,61,0.3)]">
                <span className="font-barlow font-extrabold text-[15px] text-[#b8ff3d]">SC</span>
              </div>
              <div>
                <span className="font-barlow font-extrabold text-[18px] text-[#f3f6f3] tracking-wider uppercase leading-none block">
                  MANAGER CREATION TERMINAL
                </span>
                <span className="font-ibm text-[10px] text-[#8f9a91] tracking-widest uppercase">
                  CAREER ENGINE // STEP {currentStep} OF 5
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-ibm text-[11px] text-[#8f9a91]">
            <span className="text-[#8f9a91]">TUNNEL STATUS:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= currentStep ? 'bg-[#b8ff3d] shadow-[0_0_6px_#b8ff3d]' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-[#b8ff3d] font-bold">LIGHT {currentStep}/5 ON</span>
          </div>
        </div>
      </header>

      {/* Main 3-Column Terminal Layout */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (3 cols): Step Navigator */}
        <div className="lg:col-span-3 bg-[#090d0a]/95 border border-white/10 rounded-[8px] p-4 space-y-2 shadow-xl">
          <div className="px-3 py-2 font-ibm text-[10px] text-[#8f9a91] uppercase tracking-widest border-b border-white/5">
            TERMINAL SEQUENCE
          </div>

          {stepLabels.map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isCompleted || s.num <= currentStep) {
                    setCurrentStep(s.num as any);
                  }
                }}
                className={`w-full text-left p-3 rounded-[4px] border transition-all cursor-pointer flex items-center justify-between ${
                  isCurrent
                    ? 'bg-[#b8ff3d]/15 border-[#b8ff3d] text-[#f3f6f3] shadow-[0_0_15px_rgba(184,255,61,0.2)]'
                    : isCompleted
                    ? 'bg-white/[0.03] border-white/10 text-[#f3f6f3] hover:border-white/20'
                    : 'bg-transparent border-transparent text-[#8f9a91]/50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-ibm font-bold text-[11px] px-2 py-0.5 rounded ${
                      isCurrent
                        ? 'bg-[#b8ff3d] text-[#050706]'
                        : isCompleted
                        ? 'bg-[#21dfbd]/20 text-[#21dfbd]'
                        : 'bg-white/5 text-[#8f9a91]'
                    }`}
                  >
                    {s.id}
                  </span>
                  <div>
                    <div className="font-barlow font-extrabold text-[15px] uppercase tracking-wide leading-none">
                      {s.title}
                    </div>
                    <div className="font-ibm text-[10px] text-[#8f9a91] mt-1">{s.desc}</div>
                  </div>
                </div>

                {isCompleted && <Check size={16} className="text-[#21dfbd] stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Center Column (6 cols): Current Configuration Module */}
        <div className="lg:col-span-6 bg-[#090d0a]/95 border border-white/10 rounded-[8px] p-6 shadow-2xl min-h-[560px] flex flex-col justify-between">
          <div>
            {/* Step 1: Manager Identity */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <span className="font-ibm text-[11px] text-[#b8ff3d] tracking-widest uppercase font-semibold">
                    STEP 01 // MANAGER IDENTITY
                  </span>
                  <h2 className="font-barlow font-extrabold text-[32px] sm:text-[40px] text-[#f3f6f3] tracking-tight leading-none mt-1 uppercase">
                    CREATE YOUR MANAGER IDENTITY
                  </h2>
                  <p className="font-inter text-[13px] text-[#8f9a91] mt-2">
                    Menajer kimliğini, taktiksel vizyonunu ve kariyer mücadele seviyeni belirle.
                  </p>
                </div>

                <div className="space-y-4 font-ibm text-[12px]">
                  <div>
                    <label className="text-[#8f9a91] uppercase block mb-1.5 font-bold">MENAJER ADI</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="Örn: Steve"
                      className="w-full bg-[#0d130f] border border-white/10 focus:border-[#b8ff3d] px-4 py-2.5 rounded-[4px] text-[#f3f6f3] font-inter text-[14px] outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#8f9a91] uppercase block mb-1.5 font-bold">UYRUK</label>
                      <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full bg-[#0d130f] border border-white/10 focus:border-[#b8ff3d] px-3 py-2.5 rounded-[4px] text-[#f3f6f3] font-inter text-[13px] outline-none transition-all cursor-pointer"
                      >
                        {FICTIONAL_NATIONALITIES.map((n) => (
                          <option key={n} value={n} className="bg-[#090d0a]">
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[#8f9a91] uppercase block mb-1.5 font-bold">YAŞ</label>
                      <input
                        type="number"
                        min={21}
                        max={75}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="w-full bg-[#0d130f] border border-white/10 focus:border-[#b8ff3d] px-3 py-2.5 rounded-[4px] text-[#f3f6f3] font-inter text-[14px] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#8f9a91] uppercase block mb-1.5 font-bold">
                      TAKTIKSEL FELSEFE
                    </label>
                    <select
                      value={tacticalStyle}
                      onChange={(e) => setTacticalStyle(e.target.value)}
                      className="w-full bg-[#0d130f] border border-white/10 focus:border-[#b8ff3d] px-3 py-2.5 rounded-[4px] text-[#f3f6f3] font-inter text-[13px] outline-none transition-all cursor-pointer"
                    >
                      {TACTICAL_STYLES.map((t) => (
                        <option key={t.id} value={t.id} className="bg-[#090d0a]">
                          {t.name} — {t.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3 Large Selectable Difficulty Modules */}
                  <div className="pt-2">
                    <label className="text-[#8f9a91] uppercase block mb-2 font-bold">
                      KARİYER ZORLUĞU (DIFFICULTY MODULE)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'Rahat' as CareerDifficulty,
                          label: 'RELAXED',
                          sub: 'Rahat & Hızlı',
                          desc: 'Bonus bütçe +%25, sabırlı yönetim kurulu, hızlı oyuncu gelişimi.',
                          color: 'text-[#21dfbd]',
                          border: 'border-[#21dfbd]',
                          bg: 'bg-[#21dfbd]/15',
                        },
                        {
                          id: 'Standart' as CareerDifficulty,
                          label: 'STANDARD',
                          sub: 'Dengeli & Gerçekçi',
                          desc: 'Resmi Alveria lig standartları, dengeli transfer pazarı.',
                          color: 'text-[#b8ff3d]',
                          border: 'border-[#b8ff3d]',
                          bg: 'bg-[#b8ff3d]/15',
                        },
                        {
                          id: 'Zorlu' as CareerDifficulty,
                          label: 'HARDCORE',
                          sub: 'Kıran Kırana',
                          desc: 'Kısıtlı bütçe, katı yönetim beklentisi, agresif rakip yapay zeka.',
                          color: 'text-[#ff5365]',
                          border: 'border-[#ff5365]',
                          bg: 'bg-[#ff5365]/15',
                        },
                      ].map((item) => {
                        const isSelected = difficulty === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setDifficulty(item.id)}
                            className={`p-3.5 rounded-[6px] border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? `${item.border} ${item.bg} shadow-lg shadow-black/50`
                                : 'border-white/10 bg-[#0d130f] hover:border-white/20'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-barlow font-extrabold text-[17px] ${item.color}`}>
                                  {item.label}
                                </span>
                                {isSelected && <Check size={14} className={item.color} />}
                              </div>
                              <div className="font-ibm text-[10px] text-[#8f9a91] uppercase">
                                {item.sub}
                              </div>
                              <p className="font-inter text-[11px] text-[#8f9a91] mt-2 leading-tight">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: League & Size */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <span className="font-ibm text-[11px] text-[#21dfbd] tracking-widest uppercase font-semibold">
                    STEP 02 // LEAGUE CONFIGURATION
                  </span>
                  <h2 className="font-barlow font-extrabold text-[32px] sm:text-[40px] text-[#f3f6f3] tracking-tight leading-none mt-1 uppercase">
                    SELECT LEAGUE STRUCTURE
                  </h2>
                  <p className="font-inter text-[13px] text-[#8f9a91] mt-2">
                    SquadCraft evreninin lig boyutunu ve sezon maraton uzunluğunu belirleyin.
                  </p>
                </div>

                <div className="space-y-3 font-ibm text-[12px]">
                  {[
                    {
                      size: 10 as const,
                      name: 'ALVERIA ELİT LİGİ',
                      weeks: '18 Hafta',
                      clubsCount: '10 Kulüp',
                      desc: 'Yüksek tempolu lig maratonu ve ilk 3 sıra kıtasal kupa hakkı.',
                    },
                    {
                      size: 14 as const,
                      name: 'ALVERIA PREMIER LİGİ',
                      weeks: '26 Hafta',
                      clubsCount: '14 Kulüp',
                      desc: 'Dengeli klasik lig maratonu ve ilk 4 sıra kıtasal kontenjan.',
                      badge: 'POPÜLER',
                    },
                    {
                      size: 18 as const,
                      name: 'ALVERIA SÜPER LİGİ',
                      weeks: '34 Hafta',
                      clubsCount: '18 Kulüp',
                      desc: '34 haftalık büyük maraton ve ilk 5 sıra kıtasal kontenjan.',
                    },
                  ].map((l) => {
                    const isSelected = leagueSize === l.size;
                    return (
                      <div
                        key={l.size}
                        onClick={() => setLeagueSize(l.size)}
                        className={`p-4 rounded-[6px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#b8ff3d]/10 border-[#b8ff3d] shadow-[0_0_15px_rgba(184,255,61,0.2)]'
                            : 'bg-[#0d130f] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Trophy size={20} className={isSelected ? 'text-[#b8ff3d]' : 'text-[#8f9a91]'} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-barlow font-extrabold text-[18px] text-[#f3f6f3]">
                                {l.name}
                              </span>
                              {l.badge && (
                                <span className="px-1.5 py-0.2 rounded bg-[#21dfbd] text-[#050706] font-bold text-[9px]">
                                  {l.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8f9a91] font-inter block">{l.desc}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-[#f3f6f3] block">{l.clubsCount}</span>
                          <span className="text-[11px] text-[#8f9a91]">{l.weeks}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Club Selection */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <span className="font-ibm text-[11px] text-[#b8ff3d] tracking-widest uppercase font-semibold">
                    STEP 03 // CLUB SELECTION ({leagueSize} KULÜP)
                  </span>
                  <h2 className="font-barlow font-extrabold text-[32px] sm:text-[40px] text-[#f3f6f3] tracking-tight leading-none mt-1 uppercase">
                    CHOOSE YOUR CLUB
                  </h2>
                  <p className="font-inter text-[13px] text-[#8f9a91] mt-1">
                    Ligdeki kulüpleri incele ve yönetmek istediğin armayı seç.
                  </p>
                </div>

                {/* Club Grid Tiles */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {clubsInLeague.map((club) => {
                    const isSelected = selectedClubId === club.id;
                    const stats = clubStatsMap[club.id] || { avgOverall: 75, avgAge: 25 };

                    return (
                      <div
                        key={club.id}
                        onClick={() => setSelectedClubId(club.id)}
                        className={`p-3 rounded-[6px] border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#b8ff3d]/15 border-2 border-[#b8ff3d] shadow-[0_0_15px_rgba(184,255,61,0.25)]'
                            : 'bg-[#0d130f] border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <ClubBadge
                            code={club.code}
                            name={club.name}
                            clubId={club.id}
                            primaryColor={club.primaryColor}
                            secondaryColor={club.secondaryColor}
                            size="sm"
                          />
                          <div className="truncate">
                            <span className="font-barlow font-bold text-[14px] text-[#f3f6f3] uppercase block truncate leading-none">
                              {club.name}
                            </span>
                            <span className="font-ibm text-[10px] text-[#8f9a91]">{club.city}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between font-ibm text-[11px] pt-1.5 border-t border-white/5">
                          <span className="text-[#8f9a91]">{stats.avgOverall} OVR</span>
                          <span className="text-[#b8ff3d] font-semibold">
                            €{(club.transferBudget / 1_000_000).toFixed(1)}M
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Settings */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <span className="font-ibm text-[11px] text-[#21dfbd] tracking-widest uppercase font-semibold">
                    STEP 04 // SEASON SETTINGS
                  </span>
                  <h2 className="font-barlow font-extrabold text-[32px] sm:text-[40px] text-[#f3f6f3] tracking-tight leading-none mt-1 uppercase">
                    SIMULATION & CALENDAR
                  </h2>
                  <p className="font-inter text-[13px] text-[#8f9a91] mt-2">
                    Kariyer başlangıç tarihi ve transfer penceresi parametreleri.
                  </p>
                </div>

                <div className="space-y-3 font-ibm text-[12px]">
                  <div className="p-3.5 rounded-[4px] bg-[#0d130f] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#f3f6f3] block">BAŞLANGIÇ TARİHİ</span>
                      <span className="text-[11px] text-[#8f9a91]">Resmi sezon öncesi kampı</span>
                    </div>
                    <span className="font-bold text-[#b8ff3d]">1 AĞUSTOS 2026</span>
                  </div>

                  <div className="p-3.5 rounded-[4px] bg-[#0d130f] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#f3f6f3] block">YAZ TRANSFER DÖNEMİ</span>
                      <span className="text-[11px] text-[#8f9a91]">1 Ağustos — 1 Eylül arası açık</span>
                    </div>
                    <span className="text-[#21dfbd] font-bold">AKTİF & AÇIK</span>
                  </div>

                  <div className="p-3.5 rounded-[4px] bg-[#0d130f] border border-white/10 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#f3f6f3] block">MAÇ SİMÜLASYON MOTORU</span>
                      <span className="text-[11px] text-[#8f9a91]">3D radar & anlık taktik müdahale</span>
                    </div>
                    <span className="text-[#b8ff3d] font-bold">PRO V2.4</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Confirm & Start */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <span className="font-ibm text-[11px] text-[#b8ff3d] tracking-widest uppercase font-semibold">
                    STEP 05 // FINAL CONFIRMATION
                  </span>
                  <h2 className="font-barlow font-extrabold text-[32px] sm:text-[40px] text-[#f3f6f3] tracking-tight leading-none mt-1 uppercase">
                    READY FOR LAUNCH
                  </h2>
                  <p className="font-inter text-[13px] text-[#8f9a91] mt-2">
                    Kariyer dosyasını gözden geçir ve resmi menajerlik sözleşmeni imzala.
                  </p>
                </div>

                <div className="p-4 rounded-[6px] bg-[#0d130f] border border-white/10 space-y-3 font-ibm text-[12px]">
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-[#8f9a91]">KULÜP:</span>
                    <span className="font-bold text-[#f3f6f3]">{highlightedClub.name}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-[#8f9a91]">MENAJER:</span>
                    <span className="font-bold text-[#b8ff3d]">{managerName} ({nationality}, {age})</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-[#8f9a91]">LİG FORMATI:</span>
                    <span className="font-bold text-[#f3f6f3]">{leagueSize} KULÜPLÜ FORMAT</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-white/5">
                    <span className="text-[#8f9a91]">ZORLUK DÜZEYİ:</span>
                    <span className="font-bold text-[#21dfbd]">{difficulty.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8f9a91]">TRANSFER BÜTÇESİ:</span>
                    <span className="font-bold text-[#b8ff3d]">
                      €{(highlightedClub.transferBudget / 1_000_000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) setCurrentStep((prev) => (prev - 1) as any);
                else router.push('/');
              }}
              className="px-4 py-2 rounded-[3px] bg-white/5 hover:bg-white/10 border border-white/10 font-barlow font-bold text-[14px] uppercase tracking-wider text-[#8f9a91] hover:text-[#f3f6f3] transition-colors cursor-pointer"
            >
              {currentStep === 1 ? 'İPTAL' : '← GERİ'}
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as any)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-[3px] bg-[#b8ff3d] hover:bg-[#9bea27] text-[#050706] font-barlow font-extrabold text-[16px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(184,255,61,0.3)] hover:translate-y-[-1px]"
              >
                <span>DEVAM ET</span>
                <ArrowRight size={16} className="stroke-[3]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartCareer}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-2.5 rounded-[3px] bg-[#b8ff3d] hover:bg-[#9bea27] text-[#050806] font-barlow font-extrabold text-[16px] uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(184,255,61,0.4)] hover:translate-y-[-1px]"
              >
                {isSubmitting ? (
                  <span>KAYDEDİLİYOR...</span>
                ) : (
                  <>
                    <Sparkles size={16} fill="currentColor" />
                    <span>KARİYERİ BAŞLAT</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column (3 cols): Live 3D Manager / Career Dossier Environment */}
        <div className="lg:col-span-3 bg-[#090d0a]/95 border border-white/10 rounded-[8px] p-5 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="font-ibm text-[10px] text-[#8f9a91] tracking-widest uppercase">
              CAREER DOSSIER
            </span>
            <span className="w-2 h-2 rounded-full bg-[#b8ff3d] animate-pulse" />
          </div>

          {/* Club Crest 3D Depth Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-[#0d130f] rounded-[6px] border border-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-radial from-[#b8ff3d]/10 via-transparent to-transparent pointer-events-none" />
            <div className="transform transition-transform duration-300 group-hover:scale-105">
              <ClubBadge
                code={highlightedClub.code}
                name={highlightedClub.name}
                clubId={highlightedClub.id}
                primaryColor={highlightedClub.primaryColor}
                secondaryColor={highlightedClub.secondaryColor}
                size="xl"
              />
            </div>
            <span className="font-barlow font-extrabold text-[22px] text-[#f3f6f3] uppercase tracking-wider mt-3 text-center leading-tight">
              {highlightedClub.name}
            </span>
            <span className="font-ibm text-[11px] text-[#8f9a91] mt-1">{highlightedClub.city}</span>
          </div>

          {/* Key Metrics */}
          <div className="space-y-2.5 font-ibm text-[11px]">
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-[#8f9a91]">YÖNETİM HEDEFİ:</span>
              <span className="font-bold text-[#b8ff3d]">{highlightedExpectation.target}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-[#8f9a91]">ORTALAMA GÜÇ:</span>
              <span className="font-bold text-[#f3f6f3]">{highlightedStats.avgOverall} OVR</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-[#8f9a91]">TRANSFER BÜTÇESİ:</span>
              <span className="font-bold text-[#21dfbd]">
                €{(highlightedClub.transferBudget / 1_000_000).toFixed(1)}M
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-white/5">
              <span className="text-[#8f9a91]">KULÜP İTİBARI:</span>
              <span className="font-bold text-[#ffd34f]">%{highlightedClub.reputation}</span>
            </div>
          </div>

          {/* Board Quote */}
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-[4px] font-inter text-[11px] text-[#8f9a91] italic">
            &ldquo;{highlightedExpectation.desc}&rdquo;
          </div>
        </div>
      </main>

      {/* Confirmation Overwrite Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#090d0a] border border-[#ff5365]/50 rounded-[8px] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-[#ff5365]" size={24} />
              <h3 className="font-barlow font-extrabold text-[20px] text-[#f3f6f3] uppercase">
                MEVCUT KAYITIN ÜZERİNE YAZILSIN MI?
              </h3>
            </div>
            <p className="font-inter text-[13px] text-[#8f9a91] mb-6">
              Mevcut kariyer kaydınız sıfırlanacak ve yeni kariyer başlatılacak. Devam etmek istiyor musunuz?
            </p>
            <div className="flex items-center justify-end gap-3 font-barlow font-bold text-[14px]">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-[#8f9a91] uppercase cursor-pointer"
              >
                İPTAL
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  executeCareerCreation();
                }}
                className="px-5 py-2 rounded bg-[#ff5365] hover:bg-[#ff3d52] text-white uppercase cursor-pointer"
              >
                YENİ KARİYERİ BAŞLAT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Status Bar */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-[#090d0a] px-6 py-2.5 font-ibm text-[11px] text-[#8f9a91]">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#f3f6f3] font-bold">SQUADCRAFT 2026</span>
            <span>·</span>
            <span>PRO CAREER TERMINAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#65ff83] animate-pulse" />
            <span className="text-[#65ff83] font-bold">ENGINE READY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
