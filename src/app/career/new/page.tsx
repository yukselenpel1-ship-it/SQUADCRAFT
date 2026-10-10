'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/context/GameContext';
import { MOCK_CLUBS, MOCK_PLAYERS } from '@/lib/data/mockData';
import { CareerDifficulty, CareerSetupConfig } from '@/lib/career/types';
import { ArrowRight, ArrowLeft, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

import { CareerGenesisHeader } from '@/components/career-genesis/CareerGenesisHeader';
import { CareerProgressRail } from '@/components/career-genesis/CareerProgressRail';
import { CareerDossier } from '@/components/career-genesis/CareerDossier';
import { CinematicStadiumBackdrop } from '@/components/career-genesis/CinematicStadiumBackdrop';
import { StepManagerProfile } from '@/components/career-genesis/StepManagerProfile';
import { StepLeagueSelection } from '@/components/career-genesis/StepLeagueSelection';
import { StepClubSelection } from '@/components/career-genesis/StepClubSelection';
import { StepSeasonSetup } from '@/components/career-genesis/StepSeasonSetup';
import { StepConfirmation } from '@/components/career-genesis/StepConfirmation';
import { OverwriteModal } from '@/components/career-genesis/OverwriteModal';

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
  { id: 'Gegenpress', name: 'Gegenpress', desc: 'Yoğun ön alan presi ve top kaybında şok geri kazanım.' },
  { id: 'Tiki-Taka', name: 'Tiki-Taka', desc: 'Kısa paslarla oyuna hükmetme, sabırlı hücum ve alan kontrolü.' },
  { id: 'Kontratak', name: 'Hızlı Kontratak', desc: 'Kati savunma disiplini ve derin savunma arkasına hızlı geçiş akınları.' },
  { id: 'Dengeli', name: 'Dengeli & Esnek', desc: 'Rakibe ve maçın gidişatına göre taktiksel uyum sağlayan esnek anlayış.' },
  { id: 'Kanat Hücumu', name: 'Kanat Hücumu', desc: 'Geniş saha kullanımı, kanat bindirmeleri ve ceza sahasına kilit ortalar.' },
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
  const [mobileDossierOpen, setMobileDossierOpen] = useState(false);

  // Step 1: Manager Profile State
  const [managerName, setManagerName] = useState('Steve');
  const [nationality, setNationality] = useState('Alveria');
  const [age, setAge] = useState<number | string>(34);
  const [tacticalStyle, setTacticalStyle] = useState('Gegenpress');
  const [difficulty, setDifficulty] = useState<CareerDifficulty>('Standart');

  // Step 2: League & Size State
  const [leagueSize, setLeagueSize] = useState<10 | 14 | 18>(10);
  const [selectedLeague] = useState('alveria-elit-ligi');

  // Step 3: Club Selection State
  const [selectedClubId, setSelectedClubId] = useState<string>('kalyon-doruk');

  // Available clubs in chosen league size
  const clubsInLeague = useMemo(() => {
    return MOCK_CLUBS.slice(0, leagueSize);
  }, [leagueSize]);

  // Ensure selected club belongs to chosen league size
  useEffect(() => {
    if (!clubsInLeague.some((c) => c.id === selectedClubId)) {
      setSelectedClubId(clubsInLeague[0]?.id || 'solvanya-gucu');
    }
  }, [clubsInLeague, selectedClubId]);

  // Step 4: Season Settings State
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

  // Real Career Initialization Logic (100% Preserved)
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

  const handleNextStep = useCallback(() => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push('/');
    }
  }, [currentStep, router]);

  return (
    <div className="relative min-h-screen w-full bg-[#05080E] text-[#F2F6FA] flex flex-col justify-between overflow-x-hidden font-sans antialiased selection:bg-[#B7FF3C] selection:text-[#05080E]">
      {/* 1. SHARED CINEMATIC STADIUM ENVIRONMENT */}
      <CinematicStadiumBackdrop
        currentStep={currentStep}
        clubPrimaryColor={highlightedClub.primaryColor}
      />

      {/* 2. GAME PAGE HEADER */}
      <CareerGenesisHeader currentStep={currentStep} />

      {/* 3. MAIN CINEMATIC SCREEN ARCHITECTURE */}
      <main className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-5 sm:py-8">
        {/* Mobile / Tablet Horizontal Progress Rail */}
        <CareerProgressRail
          currentStep={currentStep}
          onSelectStep={setCurrentStep}
          variant="mobile"
        />

        {/* Mobile Mini Dossier Bar */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileDossierOpen(!mobileDossierOpen)}
            className="w-full flex items-center justify-between p-3 rounded-[3px] bg-[#080E17]/95 border border-white/10 text-xs font-mono backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#B7FF3C]" />
              <span className="text-[#91A2B4]">SEÇİLİ KULÜP:</span>
              <span className="font-condensed font-bold text-sm text-[#F2F6FA] uppercase">
                {highlightedClub.name}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[#38D8FF]">
              <span>€{(highlightedClub.transferBudget / 1_000_000).toFixed(1)}M</span>
              {mobileDossierOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {/* Expandable Mobile Dossier Panel */}
          {mobileDossierOpen && (
            <div className="mt-2 animate-in fade-in duration-200">
              <CareerDossier
                club={highlightedClub}
                clubStats={highlightedStats}
                boardExpectation={highlightedExpectation}
                managerProfile={{
                  name: managerName,
                  nationality,
                  age,
                  tacticalStyle,
                  difficulty,
                }}
                leagueSize={leagueSize}
              />
            </div>
          )}
        </div>

        {/* 3-Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (3 cols): Career Progress Rail */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <CareerProgressRail
              currentStep={currentStep}
              onSelectStep={setCurrentStep}
              variant="desktop"
            />
          </div>

          {/* Center Column (6 cols): Active Step Experience */}
          <div className="lg:col-span-6 bg-[#080E17]/95 border border-white/10 rounded-[4px] p-5 sm:p-7 shadow-2xl backdrop-blur-md min-h-[580px] flex flex-col justify-between">
            {/* Step Content */}
            <div>
              {currentStep === 1 && (
                <StepManagerProfile
                  managerName={managerName}
                  setManagerName={setManagerName}
                  nationality={nationality}
                  setNationality={setNationality}
                  age={age}
                  setAge={setAge}
                  tacticalStyle={tacticalStyle}
                  setTacticalStyle={setTacticalStyle}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  nationalities={FICTIONAL_NATIONALITIES}
                  tacticalStyles={TACTICAL_STYLES}
                />
              )}

              {currentStep === 2 && (
                <StepLeagueSelection
                  leagueSize={leagueSize}
                  setLeagueSize={setLeagueSize}
                />
              )}

              {currentStep === 3 && (
                <StepClubSelection
                  clubs={clubsInLeague}
                  selectedClubId={selectedClubId}
                  setSelectedClubId={setSelectedClubId}
                  clubStatsMap={clubStatsMap}
                />
              )}

              {currentStep === 4 && (
                <StepSeasonSetup />
              )}

              {currentStep === 5 && (
                <StepConfirmation
                  club={highlightedClub}
                  managerProfile={{
                    name: managerName,
                    nationality,
                    age,
                    tacticalStyle,
                    difficulty,
                  }}
                  leagueSize={leagueSize}
                  boardExpectation={highlightedExpectation}
                />
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
              {/* Back / Cancel Button */}
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-4 py-2.5 rounded-[2px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 font-condensed font-bold text-sm uppercase tracking-wider text-[#91A2B4] hover:text-[#F2F6FA] transition-colors cursor-pointer"
              >
                {currentStep === 1 ? 'İPTAL' : '← GERİ'}
              </button>

              {/* Next Step or Launch Career */}
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-[2px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#070D14] font-condensed font-black text-sm uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_2px_14px_rgba(183,255,60,0.25)] active:translate-y-0.5"
                >
                  <span>DEVAM ET</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartCareer}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-7 py-3 rounded-[2px] bg-[#B7FF3C] hover:bg-[#c9ff6a] text-[#070D14] font-condensed font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-150 cursor-pointer shadow-[0_4px_24px_rgba(183,255,60,0.35)] active:translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>KAYDEDİLİYOR & BAŞLATILIYOR...</span>
                  ) : (
                    <>
                      <Sparkles size={16} fill="currentColor" />
                      <span>SÖZLEŞMEYİ İMZALA & BAŞLAT</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Right Column (3 cols): Living Career Dossier */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20">
            <CareerDossier
              club={highlightedClub}
              clubStats={highlightedStats}
              boardExpectation={highlightedExpectation}
              managerProfile={{
                name: managerName,
                nationality,
                age,
                tacticalStyle,
                difficulty,
              }}
              leagueSize={leagueSize}
            />
          </div>
        </div>
      </main>

      {/* 4. OVERWRITE CONFIRMATION MODAL */}
      <OverwriteModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeCareerCreation}
      />

      {/* 5. EDITORIAL FOOTER STATUS BAR */}
      <footer className="relative z-20 w-full border-t border-white/[0.08] bg-[#070D14]/90 px-4 sm:px-6 lg:px-12 py-3 font-mono text-xs text-[#7A8B9E] safe-area-bottom">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-[#F2F6FA] font-bold">SQUADCRAFT // CAREER GENESIS</span>
            <span className="text-white/20">·</span>
            <span className="hidden sm:inline">OFFICIAL PROTOCOL 2026/27</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF3C] animate-pulse" />
            <span className="text-[#B7FF3C] font-semibold">MOTOR HAZIR</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
