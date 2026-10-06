'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'tr' | 'en';

export interface Translations {
  // Navbar
  navHome: string;
  navCareer: string;
  navDraft: string;
  navClub: string;
  navTransfers: string;
  navCompetition: string;
  navNotifications: string;
  navSettings: string;
  navManagerTitle: string;

  // Hero Section
  heroKicker: string;
  heroLine1: string;
  heroLine2: string;
  heroLine3: string;
  heroDescription: string;
  heroStartCareer: string;
  heroEnterDraft: string;
  heroLiveSystem: string;
  heroSeason: string;
  heroPossession: string;
  heroXG: string;
  heroPress: string;
  heroHigh: string;
  heroTeamForm: string;
  tickerMatchday: string;
  tickerLiveSim: string;

  // Mode Selector
  modeCareerTitle: string;
  modeCareerBadge: string;
  modeCareerDesc: string;
  modeCareerBtn: string;
  modeCareerNewBtn: string;
  modeDraftTitle: string;
  modeDraftBadge: string;
  modeDraftDesc: string;
  modeDraftBtn: string;

  // Features Showcase
  featuresBadge: string;
  featuresTitle: string;
  featTransferTitle: string;
  featTransferDesc: string;
  featTacticsTitle: string;
  featTacticsDesc: string;
  featScoutingTitle: string;
  featScoutingDesc: string;
  featAcademyTitle: string;
  featAcademyDesc: string;

  // Settings Modal
  settingsTitle: string;
  languageSection: string;
  languageDesc: string;
  langTR: string;
  langEN: string;
  graphicsSection: string;
  quality3D: string;
  particles: string;
  stadiumBg: string;
  accessibilitySection: string;
  reduceMotion: string;
  reduceMotionDesc: string;
  applySettings: string;
  enabled: string;
  disabled: string;
  active: string;
  off: string;

  // Career Preview
  careerSuiteBadge: string;
  careerSuiteTitle: string;
  careerSuiteDesc: string;
  careerNextFixture: string;
  careerEnterMatchday: string;
  careerBoardConfidence: string;
  careerSquadCondition: string;
  careerInbox: string;
  careerFormTrend: string;
  careerSeason: string;
  careerMatchday: string;
  careerPosition: string;
  careerTransferBudget: string;
  careerGameSaved: string;

  // Draft Preview
  draftStageBadge: string;
  draftStageTitle: string;
  draftStageDesc: string;
  draftOnTheClock: string;
  draftSelectPlayer: string;
  draftSelected: string;

  // Live Match Preview
  liveSimBadge: string;
  liveSimTitle: string;
  liveSimDesc: string;
  liveSimGoal: string;

  // League Preview
  leagueBadge: string;
  leagueTitle: string;
  leagueDesc: string;
  leagueClub: string;
  leaguePts: string;
  leagueChampionshipZone: string;

  // Player Showcase
  playerShowcaseBadge: string;
  playerShowcaseTitle: string;
  playerShowcaseDesc: string;

  // Footer
  footerSlogan: string;
  footerRights: string;
  footerSub: string;
  footerCareer: string;
  footerDraft: string;
  footerFeatures: string;
  footerLeague: string;
  footerCommunity: string;
}

const translations: Record<Language, Translations> = {
  tr: {
    // Navbar
    navHome: 'Ana Sayfa',
    navCareer: 'Kariyer Modu',
    navDraft: 'Draft Ligi',
    navClub: 'Kulüp',
    navTransfers: 'Transferler',
    navCompetition: 'Sıralama & Lig',
    navNotifications: 'Bildirimler',
    navSettings: 'Grafik & Sistem Ayarları',
    navManagerTitle: 'STEVE (MENAJER)',

    // Hero Section
    heroKicker: 'KUR. YÖNET. HÜKMET.',
    heroLine1: 'SENİN KULÜBÜN.',
    heroLine2: 'SENİN SİSTEMİN.',
    heroLine3: 'SENİN EFSANEN.',
    heroDescription:
      'Kadronu kur. Saha taktiğini belirle. Transfer pazarından son düdüğe kadar her kritik kararı sen yönet.',
    heroStartCareer: 'KARİYERİNE BAŞLA',
    heroEnterDraft: 'DRAFT LİGİNE GİR',
    heroLiveSystem: 'SC // CANLI SİSTEM',
    heroSeason: 'SEZON 26/27',
    heroPossession: 'TOPA SAHİP OLMA',
    heroXG: 'GOL BEKLENTİSİ (xG)',
    heroPress: 'PRES YOĞUNLUĞU',
    heroHigh: 'YÜKSEK',
    heroTeamForm: 'TAKIM FORMU',
    tickerMatchday: 'HAFTA 08',
    tickerLiveSim: 'CANLI SİMÜLASYON',

    // Mode Selector
    modeCareerTitle: 'KARİYER MODU',
    modeCareerBadge: 'TEK OYUNCULU DERİNLİK',
    modeCareerDesc:
      'Sıfırdan bir kulüp yarat veya devleri zirveye taşı. Altyapıdan transfer pazarına dünya devine uzanan efsaneni yaz.',
    modeCareerBtn: 'KARİYERE DEVAM ET',
    modeCareerNewBtn: 'YENİ KARİYER KUR',
    modeDraftTitle: 'DRAFT LİGİ',
    modeDraftBadge: 'ÇOK OYUNCULU REKABET',
    modeDraftDesc:
      'Arkadaşlarınla gerçek zamanlı canlı draft odasında buluş, efsanevi 11 kur ve haftalık maç simülasyonunda yarış.',
    modeDraftBtn: 'DRAFT ODASINA GİR',

    // Features Showcase
    featuresBadge: 'YENİ NESİL ÖZELLİKLER',
    featuresTitle: 'KAPSAMLI FUTBOL MENAJERLİK MOTORU',
    featTransferTitle: 'CANLI TRANSFER MASASI',
    featTransferDesc:
      'Kulüp başkanları ve temsilcilerle doğrudan pazarlığa otur. Serbest kalma maddeleri, kiralık opsiyonları ve bonus paketleri.',
    featTacticsTitle: '3D TAKTİK TAHTASI',
    featTacticsDesc:
      'Gegenpress, Tiki-Taka ve geçiş oyunları. Blok boyu, savunma çizgisi ve dinamik oyuncu rolleriyle sahaya hükmet.',
    featScoutingTitle: 'KÜRESEL GÖZLEM AĞI',
    featScoutingDesc:
      'Dünyanın dört bir yanına scout görevlendir. Gizli cevherleri, sözleşmesi bitecek yıldızları erkenden keşfet.',
    featAcademyTitle: 'ALTYAPI AKADEMİSİ',
    featAcademyDesc:
      'Tesislerini modernize et, koçluk kadronu güçlendir ve akademiden çıkan genç yıldızları dünya futboluna armağan et.',

    // Settings Modal
    settingsTitle: 'SİSTEM AYARLARI',
    languageSection: 'DİL SEÇENEĞİ / LANGUAGE',
    languageDesc: 'Arayüz dilini belirleyin (Türkçe / English)',
    langTR: 'TR - Türkçe',
    langEN: 'EN - English',
    graphicsSection: 'GRAFİK & 3D MOTORU',
    quality3D: '3D Sahne Kalitesi',
    particles: 'Atmosferik Parçacıklar',
    stadiumBg: '3D Stadyum Arka Planı',
    accessibilitySection: 'ERİŞİLEBİLİRLİK & HAREKET',
    reduceMotion: 'Hareketi Azalt Modu',
    reduceMotionDesc: 'Kamera imleç takibini ve süzülen paralaks hareketlerini durdurur',
    applySettings: 'AYARLARI KAYDET & UYGULA',
    enabled: 'AÇIK',
    disabled: 'KAPALI',
    active: 'AKTİF',
    off: 'KAPALI',

    // Career Preview
    careerSuiteBadge: 'YÖNETİM MERKEZİ',
    careerSuiteTitle: 'KARİYER MODU KOMUTASI',
    careerSuiteDesc: 'Sıradan paneller yok. Özgün AAA futbol menajerlik deneyimi.',
    careerNextFixture: 'SIRADAKİ KARŞILAŞMA // LİG 12. HAFTA',
    careerEnterMatchday: 'MAÇA BAŞLA',
    careerBoardConfidence: 'YÖNETİM GÜVENİ',
    careerSquadCondition: 'TAKIM KONDİSYONU',
    careerInbox: 'GELEN KUTUSU',
    careerFormTrend: 'FORM GRAFİĞİ',
    careerSeason: 'SEZON',
    careerMatchday: 'HAFTA',
    careerPosition: 'SIRALAMA',
    careerTransferBudget: 'TRANSFER BÜTÇESİ',
    careerGameSaved: 'KAYDEDİLDİ',

    // Draft Preview
    draftStageBadge: 'ESPORTS DRAFT ARENASI',
    draftStageTitle: 'CANLI DRAFT ODASI',
    draftStageDesc: 'Rakiplerine ve yapay zekaya karşı tur tur rüya kadronu kur.',
    draftOnTheClock: 'SÜRE İŞLİYOR',
    draftSelectPlayer: 'OYUNCUYU SEÇ',
    draftSelected: 'SEÇİLDİ',

    // Live Match Preview
    liveSimBadge: 'CANLI MAÇ SİMÜLASYONU',
    liveSimTitle: 'MAÇ GÜNÜ KOMUTASI',
    liveSimDesc: 'Dinamik taktik radar, anlık momentum grafiği ve canlı taktiksel müdahale.',
    liveSimGoal: 'GOL!',

    // League Preview
    leagueBadge: 'YAYIN VERİLERİ',
    leagueTitle: 'LİG TABLOSU & FİKSTÜR',
    leagueDesc: 'Şampiyonluk yarışını, kıta kupaları potasını ve haftalık maçları takip et.',
    leagueClub: 'KULÜP',
    leaguePts: 'PUAN',
    leagueChampionshipZone: 'ŞAMPİYONLUK POTASI (1–2)',

    // Player Showcase
    playerShowcaseBadge: 'KART ANALİZİ',
    playerShowcaseTitle: '3D OYUNCU KARTI MİMARİSİ',
    playerShowcaseDesc: 'İmlecinizi karbon kompozit kart üzerinde gezdirerek nitelikleri, kimyayı ve piyasa değerini inceleyin.',

    // Footer
    footerSlogan: 'FUTBOL DÜŞÜNÜRLERİ İÇİN TASARLANDI.',
    footerRights: '© 2026 SQUADCRAFT. TÜM KURMACA KULÜP VE OYUNCU MATERYALLERİ SAKLIDIR.',
    footerSub: 'YENİ NESİL 3D WEB SPOR SİMÜLASYON PLATFORMU',
    footerCareer: 'KARİYER',
    footerDraft: 'DRAFT',
    footerFeatures: 'ÖZELLİKLER',
    footerLeague: 'LİG',
    footerCommunity: 'TOPLULUK',
  },
  en: {
    // Navbar
    navHome: 'Home',
    navCareer: 'Career',
    navDraft: 'Draft League',
    navClub: 'Club',
    navTransfers: 'Transfers',
    navCompetition: 'Competition',
    navNotifications: 'Notifications',
    navSettings: 'Graphics & Settings',
    navManagerTitle: 'STEVE (MANAGER)',

    // Hero Section
    heroKicker: 'BUILD. MANAGE. DOMINATE.',
    heroLine1: 'YOUR CLUB.',
    heroLine2: 'YOUR SYSTEM.',
    heroLine3: 'YOUR LEGACY.',
    heroDescription:
      'Build your squad. Shape your tactics. Control every decision from the transfer market to the final whistle.',
    heroStartCareer: 'START YOUR CAREER',
    heroEnterDraft: 'ENTER DRAFT LEAGUE',
    heroLiveSystem: 'SC // LIVE SYSTEM',
    heroSeason: 'SEASON 26/27',
    heroPossession: 'POSSESSION',
    heroXG: 'EXPECTED GOALS (xG)',
    heroPress: 'PRESS INTENSITY',
    heroHigh: 'HIGH',
    heroTeamForm: 'TEAM FORM',
    tickerMatchday: 'MATCHDAY 08',
    tickerLiveSim: 'LIVE SIMULATION',

    // Mode Selector
    modeCareerTitle: 'CAREER MODE',
    modeCareerBadge: 'SINGLE PLAYER DEPTH',
    modeCareerDesc:
      'Build a club from scratch or lead giants to glory. Write your legacy from youth academy to world dominance.',
    modeCareerBtn: 'CONTINUE CAREER',
    modeCareerNewBtn: 'NEW CAREER',
    modeDraftTitle: 'DRAFT LEAGUE',
    modeDraftBadge: 'MULTIPLAYER COMPETITION',
    modeDraftDesc:
      'Join real-time live draft rooms with friends, build an elite squad, and compete in weekly simulated fixtures.',
    modeDraftBtn: 'ENTER DRAFT ROOM',

    // Features Showcase
    featuresBadge: 'NEXT-GEN FEATURES',
    featuresTitle: 'DEEP FOOTBALL MANAGEMENT ENGINE',
    featTransferTitle: 'LIVE TRANSFER HUB',
    featTransferDesc:
      'Negotiate in real-time with club boards and agents. Release clauses, loan buy-options, and incentive structures.',
    featTacticsTitle: '3D TACTICAL BOARD',
    featTacticsDesc:
      'Gegenpress, Tiki-Taka, and rapid transitions. Control pitch width, defensive line depth, and tactical roles.',
    featScoutingTitle: 'GLOBAL SCOUTING NETWORK',
    featScoutingDesc:
      'Deploy scouts worldwide to discover hidden gems and uncover the next generation of superstars.',
    featAcademyTitle: 'YOUTH ACADEMY',
    featAcademyDesc:
      'Upgrade facilities, enhance coaching standards, and promote elite homegrown prodigies to the first team.',

    // Settings Modal
    settingsTitle: 'SYSTEM SETTINGS',
    languageSection: 'LANGUAGE & REGION',
    languageDesc: 'Choose interface language (Turkish / English)',
    langTR: 'TR - Türkçe',
    langEN: 'EN - English',
    graphicsSection: 'GRAPHICS & 3D ENGINE',
    quality3D: '3D Scene Quality',
    particles: 'Atmospheric Particles',
    stadiumBg: 'Stadium Background 3D',
    accessibilitySection: 'ACCESSIBILITY & MOTION',
    reduceMotion: 'Reduce Motion Mode',
    reduceMotionDesc: 'Disables camera cursor tracking and floating parallax',
    applySettings: 'APPLY CONFIGURATION',
    enabled: 'ENABLED',
    disabled: 'DISABLED',
    active: 'ACTIVE',
    off: 'OFF',

    // Career Preview
    careerSuiteBadge: 'MANAGEMENT SUITE',
    careerSuiteTitle: 'CAREER MODE COMMAND',
    careerSuiteDesc: 'No SaaS dashboard templates. An authentic AAA football management command center.',
    careerNextFixture: 'NEXT FIXTURE // LEAGUE MATCHDAY 12',
    careerEnterMatchday: 'ENTER MATCHDAY',
    careerBoardConfidence: 'BOARD CONFIDENCE',
    careerSquadCondition: 'SQUAD CONDITION',
    careerInbox: 'MANAGER INBOX',
    careerFormTrend: 'FORM TREND',
    careerSeason: 'SEASON',
    careerMatchday: 'MATCHDAY',
    careerPosition: 'POSITION',
    careerTransferBudget: 'TRANSFER BUDGET',
    careerGameSaved: 'GAME SAVED',

    // Draft Preview
    draftStageBadge: 'ESPORTS DRAFT STAGE',
    draftStageTitle: 'LIVE DRAFT ROOM',
    draftStageDesc: 'Build your team round-by-round against live rivals and adaptive bots.',
    draftOnTheClock: 'ON THE CLOCK',
    draftSelectPlayer: 'SELECT PLAYER',
    draftSelected: 'SELECTED',

    // Live Match Preview
    liveSimBadge: 'LIVE SIMULATION ENGINE',
    liveSimTitle: 'MATCHDAY COMMAND',
    liveSimDesc: 'Dynamic tactical radar, real-time momentum graphing, and instant tactical intervention.',
    liveSimGoal: 'GOAL!',

    // League Preview
    leagueBadge: 'BROADCAST DATA',
    leagueTitle: 'LEAGUE TABLE & FIXTURES',
    leagueDesc: 'Track championship races, continental qualification zones, and weekly fixtures.',
    leagueClub: 'CLUB',
    leaguePts: 'PTS',
    leagueChampionshipZone: 'CHAMPIONSHIP ZONE (1–2)',

    // Player Showcase
    playerShowcaseBadge: 'ASSET INSPECTION',
    playerShowcaseTitle: '3D PLAYER CARD ARCHITECTURE',
    playerShowcaseDesc: 'Hover and tilt the cursor across the holographic carbon composite card to inspect attributes, chemistry, and market valuation.',

    // Footer
    footerSlogan: 'BUILT FOR FOOTBALL THINKERS.',
    footerRights: '© 2026 SQUADCRAFT. ALL FICTIONAL CLUB & PLAYER ASSETS RESERVED.',
    footerSub: 'NEXT-GEN 3D WEB SPORTS SIMULATION PLATFORM',
    footerCareer: 'CAREER',
    footerDraft: 'DRAFT',
    footerFeatures: 'FEATURES',
    footerLeague: 'LEAGUE',
    footerCommunity: 'COMMUNITY',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
  t: translations.tr,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('squadcraft_language');
      if (stored === 'en' || stored === 'tr') {
        setLanguageState(stored);
      } else {
        localStorage.setItem('squadcraft_language', 'tr');
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('squadcraft_language', lang);
    } catch {
      // LocalStorage error
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
