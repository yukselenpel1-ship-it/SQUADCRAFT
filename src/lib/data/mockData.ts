import {
  Club,
  Player,
  Fixture,
  LeagueStanding,
  InboxMessage,
  FinanceSummary,
  TransferOffer,
  ClubTactics,
  PlayerPosition,
  Formation,
  PlayerAttributes,
  PitchPositionSlot,
} from '@/types/game';

// ============================================================================
// 1. FICTIONAL CLUBS (10 Completely Original Clubs)
// ============================================================================
export const MOCK_CLUBS: Club[] = [
  {
    id: 'kalyon-doruk',
    name: 'Kalyon Doruk SK',
    shortName: 'Kalyon Doruk',
    code: 'KDO',
    city: 'Dorukkale',
    stadium: 'Doruk Arena',
    stadiumCapacity: 38500,
    reputation: 82,
    balance: 28450000,
    transferBudget: 25000000,
    wageBudget: 380000,
    weeklyWageExpense: 315000,
    primaryColor: '#00F5A0',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    managerName: 'Oğuzhan Kaya',
    foundedYear: 1934,
  },
  {
    id: 'vadisehir',
    name: 'Vadişehir FK',
    shortName: 'Vadişehir',
    code: 'VAD',
    city: 'Demirvadi',
    stadium: 'Vadi Şehir Stadyumu',
    stadiumCapacity: 42000,
    reputation: 85,
    balance: 34200000,
    transferBudget: 31600000,
    wageBudget: 420000,
    weeklyWageExpense: 395000,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E293B',
    accentColor: '#93C5FD',
    managerName: 'Bora Yalçın',
    foundedYear: 1928,
  },
  {
    id: 'solvanya-gucu',
    name: 'Solvanya Gücü FK',
    shortName: 'Solvanya Gücü',
    code: 'SLV',
    city: 'Solvanya',
    stadium: 'Başkent Olimpik Parkı',
    stadiumCapacity: 50500,
    reputation: 88,
    balance: 41000000,
    transferBudget: 37000000,
    wageBudget: 480000,
    weeklyWageExpense: 445000,
    primaryColor: '#EF4444',
    secondaryColor: '#18181B',
    accentColor: '#FCA5A5',
    managerName: 'Levent Erdem',
    foundedYear: 1922,
  },
  {
    id: 'kuzey-firtinasi',
    name: 'Kuzey Fırtınası SK',
    shortName: 'Kuzey Fırtınası',
    code: 'KUZ',
    city: 'Kuzeytepe',
    stadium: 'Fırtına Park Stadyumu',
    stadiumCapacity: 35200,
    reputation: 79,
    balance: 22800000,
    transferBudget: 18400000,
    wageBudget: 320000,
    weeklyWageExpense: 285000,
    primaryColor: '#8B5CF6',
    secondaryColor: '#0F172A',
    accentColor: '#C4B5FD',
    managerName: 'Serdar Çakır',
    foundedYear: 1946,
  },
  {
    id: 'liman-birlik',
    name: 'Liman Birlik SK',
    shortName: 'Liman Birlik',
    code: 'LMN',
    city: 'Limankent',
    stadium: 'Liman Sahil Stadyumu',
    stadiumCapacity: 28400,
    reputation: 76,
    balance: 18600000,
    transferBudget: 14800000,
    wageBudget: 275000,
    weeklyWageExpense: 245000,
    primaryColor: '#06B6D4',
    secondaryColor: '#1E293B',
    accentColor: '#67E8F9',
    managerName: 'Emre Bayraktar',
    foundedYear: 1952,
  },
  {
    id: 'ayazkent',
    name: 'Ayazkent Yıldızları',
    shortName: 'Ayazkent',
    code: 'AYZ',
    city: 'Ayazbel',
    stadium: 'Ayaztepe Arena',
    stadiumCapacity: 31000,
    reputation: 78,
    balance: 21500000,
    transferBudget: 17200000,
    wageBudget: 310000,
    weeklyWageExpense: 270000,
    primaryColor: '#EAB308',
    secondaryColor: '#18181B',
    accentColor: '#FDE047',
    managerName: 'Taner Bulut',
    foundedYear: 1960,
  },
  {
    id: 'kanyon-atlas',
    name: 'Kanyon Atlas SK',
    shortName: 'Kanyon Atlas',
    code: 'KNY',
    city: 'Kanyoneli',
    stadium: 'Kanyon Vadisi Park',
    stadiumCapacity: 26200,
    reputation: 74,
    balance: 16200000,
    transferBudget: 12200000,
    wageBudget: 240000,
    weeklyWageExpense: 215000,
    primaryColor: '#F97316',
    secondaryColor: '#27272A',
    accentColor: '#FDBA74',
    managerName: 'Cemil Doğan',
    foundedYear: 1968,
  },
  {
    id: 'gokova-genclik',
    name: 'Gökkent Gençlik SK',
    shortName: 'Gökkent Gençlik',
    code: 'GOK',
    city: 'Gökhisar',
    stadium: 'Gökkent Arena',
    stadiumCapacity: 24800,
    reputation: 72,
    balance: 14800000,
    transferBudget: 10600000,
    wageBudget: 220000,
    weeklyWageExpense: 195000,
    primaryColor: '#10B981',
    secondaryColor: '#111827',
    accentColor: '#6EE7B7',
    managerName: 'Metin Sancak',
    foundedYear: 1974,
  },
  {
    id: 'kizilkaya-spor',
    name: 'Kızılkaya Spor Kulübü',
    shortName: 'Kızılkaya Spor',
    code: 'KZL',
    city: 'Kızılsırt',
    stadium: 'Kaya Stadyumu',
    stadiumCapacity: 22000,
    reputation: 70,
    balance: 13200000,
    transferBudget: 9600000,
    wageBudget: 200000,
    weeklyWageExpense: 178000,
    primaryColor: '#EC4899',
    secondaryColor: '#18181B',
    accentColor: '#F472B6',
    managerName: 'Kadir Aksoy',
    foundedYear: 1981,
  },
  {
    id: 'yelkenkoy-akademi',
    name: 'Yelkenköy Akademi',
    shortName: 'Yelkenköy',
    code: 'YLK',
    city: 'Yelkenköy',
    stadium: 'Akademi Park',
    stadiumCapacity: 19500,
    reputation: 68,
    balance: 11500000,
    transferBudget: 8200000,
    wageBudget: 180000,
    weeklyWageExpense: 160000,
    primaryColor: '#6366F1',
    secondaryColor: '#0F172A',
    accentColor: '#A5B4FC',
    managerName: 'Selim Uçar',
    foundedYear: 1995,
  },
  {
    id: 'bogazici-hisari',
    name: 'Boğaziçi Hisarı SK',
    shortName: 'Boğaziçi Hisarı',
    code: 'BGH',
    city: 'Hisarkent',
    stadium: 'Hisar Şehir Stadyumu',
    stadiumCapacity: 36000,
    reputation: 81,
    balance: 26500000,
    transferBudget: 22400000,
    wageBudget: 350000,
    weeklyWageExpense: 305000,
    primaryColor: '#0284C7',
    secondaryColor: '#0F172A',
    accentColor: '#BAE6FD',
    managerName: 'Hakan Yılmaz',
    foundedYear: 1938,
  },
  {
    id: 'toros-kartallari',
    name: 'Toros Kartalları FK',
    shortName: 'Toros Kartalları',
    code: 'TRK',
    city: 'Torosbel',
    stadium: 'Toros Arena',
    stadiumCapacity: 33500,
    reputation: 77,
    balance: 20400000,
    transferBudget: 16200000,
    wageBudget: 295000,
    weeklyWageExpense: 260000,
    primaryColor: '#15803D',
    secondaryColor: '#18181B',
    accentColor: '#86EFAC',
    managerName: 'Sinan Kılıç',
    foundedYear: 1956,
  },
  {
    id: 'anadolu-atletik',
    name: 'Anadolu Atletik SK',
    shortName: 'Anadolu Atletik',
    code: 'AND',
    city: 'Bozkırkent',
    stadium: 'Bozkır Güneşi Stadı',
    stadiumCapacity: 29000,
    reputation: 75,
    balance: 17800000,
    transferBudget: 13800000,
    wageBudget: 260000,
    weeklyWageExpense: 230000,
    primaryColor: '#B45309',
    secondaryColor: '#1C1917',
    accentColor: '#FDE68A',
    managerName: 'Mehmet Polat',
    foundedYear: 1964,
  },
  {
    id: 'ege-dalga',
    name: 'Ege Dalga Spor',
    shortName: 'Ege Dalga',
    code: 'EGE',
    city: 'Kıyıada',
    stadium: 'Ege Kıyı Park',
    stadiumCapacity: 25500,
    reputation: 73,
    balance: 15400000,
    transferBudget: 11600000,
    wageBudget: 230000,
    weeklyWageExpense: 205000,
    primaryColor: '#0D9488',
    secondaryColor: '#111827',
    accentColor: '#99F6E4',
    managerName: 'Deniz Akdeniz',
    foundedYear: 1971,
  },
  {
    id: 'pamir-yildizi',
    name: 'Pamir Yıldızı FK',
    shortName: 'Pamir Yıldızı',
    code: 'PMR',
    city: 'Yüksekova',
    stadium: 'Pamir Zirve Stadyumu',
    stadiumCapacity: 23000,
    reputation: 71,
    balance: 14100000,
    transferBudget: 10200000,
    wageBudget: 210000,
    weeklyWageExpense: 185000,
    primaryColor: '#4338CA',
    secondaryColor: '#0F172A',
    accentColor: '#C7D2FE',
    managerName: 'Murat Çetin',
    foundedYear: 1978,
  },
  {
    id: 'sahil-marti',
    name: 'Sahil Martı SK',
    shortName: 'Sahil Martı',
    code: 'MRT',
    city: 'Martıköy',
    stadium: 'Martı Sahil Park',
    stadiumCapacity: 21000,
    reputation: 69,
    balance: 12400000,
    transferBudget: 8800000,
    wageBudget: 190000,
    weeklyWageExpense: 170000,
    primaryColor: '#0EA5E9',
    secondaryColor: '#18181B',
    accentColor: '#E0F2FE',
    managerName: 'Okan Şahin',
    foundedYear: 1988,
  },
  {
    id: 'volkan-atletik',
    name: 'Volkan Atletik SK',
    shortName: 'Volkan Atletik',
    code: 'VLK',
    city: 'Lavtepe',
    stadium: 'Volkan Krater Stadı',
    stadiumCapacity: 20000,
    reputation: 67,
    balance: 11000000,
    transferBudget: 7800000,
    wageBudget: 175000,
    weeklyWageExpense: 155000,
    primaryColor: '#DC2626',
    secondaryColor: '#450A0A',
    accentColor: '#FECACA',
    managerName: 'Tayfun Ateş',
    foundedYear: 1992,
  },
  {
    id: 'zirve-spor',
    name: 'Zirve Spor Kulübü',
    shortName: 'Zirve Spor',
    code: 'ZRV',
    city: 'Karlıbel',
    stadium: 'Karlıbel Zirve Stadı',
    stadiumCapacity: 18500,
    reputation: 66,
    balance: 10200000,
    transferBudget: 7000000,
    wageBudget: 165000,
    weeklyWageExpense: 145000,
    primaryColor: '#64748B',
    secondaryColor: '#020617',
    accentColor: '#F1F5F9',
    managerName: 'Burak Dağlı',
    foundedYear: 1998,
  },
];

// ============================================================================
// 2. FICTIONAL PLAYERS GENERATOR (25 per club = 250 Total)
// ============================================================================
const FIRST_NAMES = [
  'Aras', 'Kerem', 'Doruk', 'Mertkan', 'Caner', 'Sarp', 'Alperen', 'Batuhan',
  'Kaan', 'Deniz', 'Emirhan', 'Burak', 'Ozan', 'Umut', 'Tugay', 'Görkem',
  'Yasin', 'Volkan', 'Cihan', 'Barış', 'Semih', 'Tolga', 'Ege', 'Yiğit',
  'Soren', 'Lukas', 'Mateo', 'Dario', 'Jan', 'Marek', 'Elias', 'Tariq',
  'Stefan', 'Maxim', 'Henrik', 'Oliver', 'Damian', 'Hugo', 'Arthur', 'Leo'
];

const LAST_NAMES = [
  'Bozdağ', 'Varlık', 'Solak', 'Aladağ', 'Keskin', 'Demirdağ', 'Gök', 'Karahan',
  'Yıldırım', 'Taşçı', 'Özturan', 'Akıncı', 'Çelik', 'Poyraz', 'Erkin', 'Sancaktar',
  'Korkmaz', 'Erdoğan', 'Kılıç', 'Avcı', 'Vance', 'Lindqvist', 'Navarro', 'Novak',
  'Moretti', 'Kovacs', 'Bauer', 'Silva', 'Dumont', 'Nilsson', 'Petrov', 'Vargas'
];

function generateAttributes(pos: PlayerPosition, overall: number): PlayerAttributes {
  const isGK = pos === 'GK';
  const isDef = ['DR', 'DC', 'DL', 'DMC'].includes(pos);
  const isMid = ['MC', 'MR', 'ML', 'AMC'].includes(pos);
  const isAtt = ['AMR', 'AML', 'ST'].includes(pos);

  // Helper with slight variance around target
  const val = (target: number, variance = 8) => {
    const min = Math.max(15, target - variance);
    const max = Math.min(99, target + variance);
    return Math.floor(min + Math.random() * (max - min + 1));
  };

  return {
    // Fiziksel
    pace: val(isAtt ? overall + 4 : isDef ? overall - 4 : overall),
    acceleration: val(isAtt ? overall + 3 : overall),
    strength: val(pos === 'DC' || pos === 'ST' ? overall + 6 : overall - 3),
    stamina: val(isMid || isDef ? overall + 5 : overall),

    // Hücum & Teknik
    finishing: val(pos === 'ST' ? overall + 7 : isAtt ? overall + 2 : overall - 20),
    longShots: val(isMid || isAtt ? overall + 2 : overall - 15),
    passing: val(isMid ? overall + 8 : isDef ? overall - 5 : overall),
    vision: val(pos === 'AMC' || pos === 'MC' ? overall + 9 : overall - 8),
    crossing: val(pos === 'DR' || pos === 'DL' || pos === 'MR' || pos === 'ML' || pos === 'AMR' || pos === 'AML' ? overall + 7 : overall - 18),
    dribbling: val(isAtt || pos === 'AMC' ? overall + 6 : overall - 12),
    technique: val(isMid || isAtt ? overall + 5 : overall - 8),
    heading: val(pos === 'DC' || pos === 'ST' ? overall + 7 : overall - 14),

    // Savunma
    tackling: val(isDef ? overall + 8 : pos === 'DMC' ? overall + 6 : overall - 25),
    marking: val(isDef ? overall + 7 : overall - 22),
    positioning: val(isDef || pos === 'MC' ? overall + 5 : overall - 10),

    // Zihinsel
    aggression: val(isDef ? overall + 4 : overall - 6),
    composure: val(overall),
    decisions: val(overall + 1),
    teamwork: val(overall + 3),
    leadership: val(overall - 2),

    // Kalecilik
    handling: isGK ? val(overall + 2) : val(18, 5),
    reflexes: isGK ? val(overall + 5) : val(15, 5),
    positioningGK: isGK ? val(overall + 1) : val(14, 4),
    kicking: isGK ? val(overall - 2) : val(20, 6),
  };
}

// Fixed 25 squad distribution templates per team:
// 3 GKs, 8 DEFs, 8 MIDs, 6 ATTs
const SQUAD_ROLES_TEMPLATE: { pos: PlayerPosition; secondaries: PlayerPosition[]; baseAge: number; baseOverall: number }[] = [
  // KALECİLER (3)
  { pos: 'GK', secondaries: [], baseAge: 28, baseOverall: 81 },
  { pos: 'GK', secondaries: [], baseAge: 23, baseOverall: 74 },
  { pos: 'GK', secondaries: [], baseAge: 19, baseOverall: 68 },
  // SAVUNMACILAR (8)
  { pos: 'DR', secondaries: ['MR'], baseAge: 26, baseOverall: 79 },
  { pos: 'DR', secondaries: ['DL'], baseAge: 21, baseOverall: 72 },
  { pos: 'DC', secondaries: ['DMC'], baseAge: 29, baseOverall: 83 },
  { pos: 'DC', secondaries: [], baseAge: 27, baseOverall: 80 },
  { pos: 'DC', secondaries: [], baseAge: 24, baseOverall: 75 },
  { pos: 'DC', secondaries: [], baseAge: 20, baseOverall: 69 },
  { pos: 'DL', secondaries: ['ML'], baseAge: 27, baseOverall: 80 },
  { pos: 'DL', secondaries: ['DR'], baseAge: 22, baseOverall: 73 },
  // ORTA SAHALAR (8)
  { pos: 'DMC', secondaries: ['MC', 'DC'], baseAge: 28, baseOverall: 82 },
  { pos: 'DMC', secondaries: ['MC'], baseAge: 22, baseOverall: 74 },
  { pos: 'MC', secondaries: ['DMC', 'AMC'], baseAge: 26, baseOverall: 84 },
  { pos: 'MC', secondaries: ['AMC'], baseAge: 25, baseOverall: 78 },
  { pos: 'MC', secondaries: ['MR'], baseAge: 21, baseOverall: 71 },
  { pos: 'MR', secondaries: ['AMR'], baseAge: 24, baseOverall: 76 },
  { pos: 'ML', secondaries: ['AML'], baseAge: 25, baseOverall: 77 },
  { pos: 'AMC', secondaries: ['MC', 'ST'], baseAge: 27, baseOverall: 85 },
  // FORVETLER & KANATLAR (6)
  { pos: 'AMR', secondaries: ['MR', 'ST'], baseAge: 24, baseOverall: 82 },
  { pos: 'AMR', secondaries: ['AML'], baseAge: 20, baseOverall: 73 },
  { pos: 'AML', secondaries: ['ML', 'ST'], baseAge: 26, baseOverall: 83 },
  { pos: 'AML', secondaries: ['AMR'], baseAge: 21, baseOverall: 72 },
  { pos: 'ST', secondaries: ['AMC'], baseAge: 28, baseOverall: 86 },
  { pos: 'ST', secondaries: [], baseAge: 22, baseOverall: 76 },
];

export function generateAllPlayers(): Player[] {
  const allPlayers: Player[] = [];
  let playerIdCounter = 1000;

  MOCK_CLUBS.forEach((club, clubIndex) => {
    // Club strength factor offset
    const clubReputationBonus = Math.round((club.reputation - 75) * 0.4);

    SQUAD_ROLES_TEMPLATE.forEach((template, idx) => {
      playerIdCounter++;
      const firstName = FIRST_NAMES[(clubIndex * 5 + idx * 3) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(clubIndex * 7 + idx * 2) % LAST_NAMES.length];
      
      const overall = Math.min(92, Math.max(62, template.baseOverall + clubReputationBonus + (idx % 3 === 0 ? 1 : idx % 2 === 0 ? -1 : 0)));
      const potential = Math.min(96, Math.max(overall, overall + (30 - template.baseAge) * 1.5 + Math.floor(Math.random() * 4)));
      const attributes = generateAttributes(template.pos, overall);

      const baseValue = Math.round(Math.pow(overall / 10, 3.8) * 12000);
      const marketValue = Math.round(baseValue / 50000) * 50000;
      const weeklyWage = Math.round((marketValue * 0.0035) / 1000) * 1000 + 4000;

      const birthYear = 2026 - template.baseAge;
      const month = String((idx % 12) + 1).padStart(2, '0');
      const day = String(((idx * 7) % 27) + 1).padStart(2, '0');

      const isInjured = club.id === 'kalyon-doruk' && idx === 7; // One injury demo for player
      const isSuspended = club.id === 'kalyon-doruk' && idx === 12; // One suspension demo for player

      allPlayers.push({
        id: `pl-${playerIdCounter}`,
        clubId: club.id,
        firstName,
        lastName,
        nationality: idx % 6 === 0 ? 'Nordia' : idx % 8 === 0 ? 'Solaria' : 'Alveria',
        age: template.baseAge,
        birthDate: `${birthYear}-${month}-${day}`,
        position: template.pos,
        secondaryPositions: template.secondaries,
        preferredFoot: idx % 4 === 0 ? 'Sol' : idx % 9 === 0 ? 'Her İkisi' : 'Sağ',
        height: template.pos === 'GK' ? 193 : template.pos === 'DC' ? 189 : template.pos === 'ST' ? 186 : 178 + (idx % 8),
        weight: template.pos === 'GK' ? 88 : template.pos === 'DC' ? 84 : 74 + (idx % 9),
        attributes,
        overall,
        potential: Math.round(potential),
        morale: idx === 7 ? 68 : 82 + (idx % 15),
        fitness: idx === 7 ? 42 : idx % 5 === 0 ? 92 : 98,
        form: Number((6.8 + ((idx * 3) % 25) / 10).toFixed(1)),
        marketValue,
        wage: weeklyWage,
        contractStart: '2024-07-01',
        contractEnd: `202${7 + (idx % 3)}-06-30`,
        isInjured,
        injuryDetails: isInjured ? { type: 'Ayak Bileği Burkulması', daysRemaining: 12 } : undefined,
        isSuspended,
        suspensionDetails: isSuspended ? { reason: 'Sarı Kart Cezası (4. Sarı)', matchesRemaining: 1 } : undefined,
        seasonStats: {
          appearances: 5,
          goals: template.pos === 'ST' ? 4 : template.pos === 'AML' || template.pos === 'AMR' ? 2 : template.pos === 'AMC' ? 1 : 0,
          assists: template.pos === 'AMC' ? 3 : template.pos === 'MR' || template.pos === 'ML' ? 2 : 1,
          yellowCards: template.pos === 'DC' || template.pos === 'DMC' ? 2 : 0,
          redCards: 0,
          cleanSheets: template.pos === 'GK' ? 2 : 0,
          averageRating: Number((7.1 + ((idx * 2) % 15) / 10).toFixed(2)),
        }
      });
    });
  });

  return allPlayers;
}

export const MOCK_PLAYERS: Player[] = generateAllPlayers();

// ============================================================================
// 3. FORMATION PRESETS & TACTICAL COORDINATES
// ============================================================================

// Formation pitch coordinates presets
export const FORMATION_COORDINATES: Record<Formation, { role: PlayerPosition; x: number; y: number }[]> = {
  '4-2-3-1': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'DMC', x: 60, y: 53 },
    { role: 'DMC', x: 40, y: 53 },
    { role: 'AMR', x: 82, y: 33 },
    { role: 'AMC', x: 50, y: 34 },
    { role: 'AML', x: 18, y: 33 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '4-3-3': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'DMC', x: 50, y: 55 },
    { role: 'MC', x: 66, y: 44 },
    { role: 'MC', x: 34, y: 44 },
    { role: 'AMR', x: 82, y: 22 },
    { role: 'AML', x: 18, y: 22 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '4-4-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'MR', x: 84, y: 46 },
    { role: 'MC', x: 62, y: 48 },
    { role: 'MC', x: 38, y: 48 },
    { role: 'ML', x: 16, y: 46 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '3-5-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DC', x: 72, y: 72 },
    { role: 'DC', x: 50, y: 74 },
    { role: 'DC', x: 28, y: 72 },
    { role: 'MR', x: 88, y: 48 },
    { role: 'MC', x: 65, y: 50 },
    { role: 'DMC', x: 50, y: 58 },
    { role: 'MC', x: 35, y: 50 },
    { role: 'ML', x: 12, y: 48 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '3-4-3': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DC', x: 74, y: 72 },
    { role: 'DC', x: 50, y: 74 },
    { role: 'DC', x: 26, y: 72 },
    { role: 'MR', x: 86, y: 48 },
    { role: 'MC', x: 62, y: 50 },
    { role: 'MC', x: 38, y: 50 },
    { role: 'ML', x: 14, y: 48 },
    { role: 'AMR', x: 80, y: 20 },
    { role: 'AML', x: 20, y: 20 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '5-3-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 88, y: 68 },
    { role: 'DC', x: 68, y: 73 },
    { role: 'DC', x: 50, y: 75 },
    { role: 'DC', x: 32, y: 73 },
    { role: 'DL', x: 12, y: 68 },
    { role: 'MC', x: 66, y: 46 },
    { role: 'DMC', x: 50, y: 54 },
    { role: 'MC', x: 34, y: 46 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '4-1-2-1-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'DMC', x: 50, y: 56 },
    { role: 'MR', x: 78, y: 44 },
    { role: 'ML', x: 22, y: 44 },
    { role: 'AMC', x: 50, y: 32 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '4-3-1-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'MC', x: 70, y: 52 },
    { role: 'DMC', x: 50, y: 56 },
    { role: 'MC', x: 30, y: 52 },
    { role: 'AMC', x: 50, y: 34 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '4-3-2-1': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'MC', x: 72, y: 52 },
    { role: 'DMC', x: 50, y: 55 },
    { role: 'MC', x: 28, y: 52 },
    { role: 'AMC', x: 65, y: 32 },
    { role: 'AMC', x: 35, y: 32 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '4-2-2-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'DMC', x: 62, y: 54 },
    { role: 'DMC', x: 38, y: 54 },
    { role: 'AMR', x: 78, y: 34 },
    { role: 'AML', x: 22, y: 34 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '4-1-4-1': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'DMC', x: 50, y: 58 },
    { role: 'MR', x: 84, y: 42 },
    { role: 'MC', x: 62, y: 44 },
    { role: 'MC', x: 38, y: 44 },
    { role: 'ML', x: 16, y: 42 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '4-2-4': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 84, y: 70 },
    { role: 'DC', x: 62, y: 72 },
    { role: 'DC', x: 38, y: 72 },
    { role: 'DL', x: 16, y: 70 },
    { role: 'MC', x: 62, y: 50 },
    { role: 'MC', x: 38, y: 50 },
    { role: 'AMR', x: 84, y: 22 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
    { role: 'AML', x: 16, y: 22 },
  ],
  '3-4-2-1': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DC', x: 74, y: 72 },
    { role: 'DC', x: 50, y: 74 },
    { role: 'DC', x: 26, y: 72 },
    { role: 'MR', x: 86, y: 48 },
    { role: 'MC', x: 62, y: 52 },
    { role: 'MC', x: 38, y: 52 },
    { role: 'ML', x: 14, y: 48 },
    { role: 'AMC', x: 64, y: 32 },
    { role: 'AMC', x: 36, y: 32 },
    { role: 'ST', x: 50, y: 15 },
  ],
  '3-4-1-2': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DC', x: 74, y: 72 },
    { role: 'DC', x: 50, y: 74 },
    { role: 'DC', x: 26, y: 72 },
    { role: 'MR', x: 86, y: 48 },
    { role: 'MC', x: 62, y: 52 },
    { role: 'MC', x: 38, y: 52 },
    { role: 'ML', x: 14, y: 48 },
    { role: 'AMC', x: 50, y: 33 },
    { role: 'ST', x: 62, y: 16 },
    { role: 'ST', x: 38, y: 16 },
  ],
  '5-2-3': [
    { role: 'GK', x: 50, y: 88 },
    { role: 'DR', x: 88, y: 68 },
    { role: 'DC', x: 68, y: 73 },
    { role: 'DC', x: 50, y: 75 },
    { role: 'DC', x: 32, y: 73 },
    { role: 'DL', x: 12, y: 68 },
    { role: 'MC', x: 62, y: 48 },
    { role: 'MC', x: 38, y: 48 },
    { role: 'AMR', x: 82, y: 22 },
    { role: 'AML', x: 18, y: 22 },
    { role: 'ST', x: 50, y: 15 },
  ],
};

// ============================================================================
// 4. CAREER SQUAD TACTICS GENERATOR (Deterministic Lineup & Subs Allocation)
// ============================================================================
export function generateCareerTactics(
  clubId: string = 'kalyon-doruk',
  squad?: Player[],
  formation: Formation = '4-2-3-1'
): ClubTactics {
  let clubPlayers = squad && squad.length > 0
    ? squad.filter((p) => p.clubId === clubId || !p.clubId)
    : [];

  if (clubPlayers.length === 0) {
    clubPlayers = MOCK_PLAYERS.filter((p) => p.clubId === clubId);
  }

  if (clubPlayers.length === 0) {
    clubPlayers = squad && squad.length > 0 ? squad : MOCK_PLAYERS.slice(0, 25);
  }

  const defaultSlots = FORMATION_COORDINATES[formation] || FORMATION_COORDINATES['4-2-3-1'];

  const assignedIds: string[] = [];
  const startingLineup: PitchPositionSlot[] = defaultSlots.map((slot, index) => {
    // 1. Exact role match & healthy
    let candidate = clubPlayers.find(
      (p) => !assignedIds.includes(p.id) && p.position === slot.role && !p.isInjured && !p.isSuspended
    );
    // 2. Secondary role match & healthy
    if (!candidate) {
      candidate = clubPlayers.find(
        (p) => !assignedIds.includes(p.id) && p.secondaryPositions?.includes(slot.role) && !p.isInjured && !p.isSuspended
      );
    }
    // 3. Category match & healthy, sorted by overall
    if (!candidate) {
      const isDef = ['DR', 'DC', 'DL'].includes(slot.role);
      const isMid = ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(slot.role);
      const isAtt = ['ST', 'AML', 'AMR'].includes(slot.role);
      const isGK = slot.role === 'GK';

      candidate = clubPlayers
        .filter((p) => !assignedIds.includes(p.id) && !p.isInjured && !p.isSuspended)
        .sort((a, b) => b.overall - a.overall)
        .find((p) => {
          if (isGK) return p.position === 'GK';
          if (isDef) return ['DR', 'DC', 'DL', 'DMC'].includes(p.position);
          if (isMid) return ['DMC', 'MC', 'MR', 'ML', 'AMC'].includes(p.position);
          if (isAtt) return ['ST', 'AML', 'AMR', 'AMC'].includes(p.position);
          return true;
        });
    }
    // 4. Any healthy player sorted by overall
    if (!candidate) {
      candidate = clubPlayers
        .filter((p) => !assignedIds.includes(p.id) && !p.isInjured && !p.isSuspended)
        .sort((a, b) => b.overall - a.overall)[0];
    }
    // 5. Any remaining player
    if (!candidate) {
      candidate = clubPlayers.find((p) => !assignedIds.includes(p.id)) || clubPlayers[index % clubPlayers.length];
    }
    if (candidate) {
      assignedIds.push(candidate.id);
    }
    return {
      slotId: index,
      role: slot.role,
      x: slot.x,
      y: slot.y,
      playerId: candidate ? candidate.id : null,
    };
  });

  const startingPlayerIds = startingLineup.map((s) => s.playerId).filter(Boolean) as string[];
  const remaining = clubPlayers
    .filter((p) => !startingPlayerIds.includes(p.id))
    .sort((a, b) => b.overall - a.overall);

  return {
    clubId,
    formation,
    settings: {
      mentality: 'Dengeli',
      tempo: 'Standart',
      pressing: 'Yoğun',
      passingStyle: 'Kısa',
      defensiveLine: 'Standart',
      width: 'Dengeli',
    },
    lineup: startingLineup,
    substitutes: remaining.slice(0, 7).map((p) => p.id),
    reserves: remaining.slice(7).map((p) => p.id),
  };
}

export function getInitialTactics(clubId: string = 'kalyon-doruk', squad?: Player[]): ClubTactics {
  return generateCareerTactics(clubId, squad, '4-2-3-1');
}

// ============================================================================
// 5. LEAGUE STANDINGS (Alveria Süper Ligi - Current Round 5 Finished)
// ============================================================================
export const MOCK_STANDINGS: LeagueStanding[] = [
  {
    rank: 1,
    clubId: 'solvanya-gucu',
    played: 5,
    won: 4,
    drawn: 1,
    lost: 0,
    goalsFor: 12,
    goalsAgainst: 3,
    goalDifference: 9,
    points: 13,
    form: ['W', 'W', 'D', 'W', 'W'],
  },
  {
    rank: 2,
    clubId: 'kalyon-doruk', // User's club
    played: 5,
    won: 3,
    drawn: 2,
    lost: 0,
    goalsFor: 10,
    goalsAgainst: 4,
    goalDifference: 6,
    points: 11,
    form: ['W', 'D', 'W', 'W', 'D'],
  },
  {
    rank: 3,
    clubId: 'vadisehir',
    played: 5,
    won: 3,
    drawn: 1,
    lost: 1,
    goalsFor: 9,
    goalsAgainst: 5,
    goalDifference: 4,
    points: 10,
    form: ['W', 'L', 'W', 'W', 'D'],
  },
  {
    rank: 4,
    clubId: 'kuzey-firtinasi',
    played: 5,
    won: 3,
    drawn: 0,
    lost: 2,
    goalsFor: 8,
    goalsAgainst: 6,
    goalDifference: 2,
    points: 9,
    form: ['L', 'W', 'W', 'L', 'W'],
  },
  {
    rank: 5,
    clubId: 'ayazkent',
    played: 5,
    won: 2,
    drawn: 2,
    lost: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    goalDifference: 1,
    points: 8,
    form: ['D', 'W', 'D', 'W', 'L'],
  },
  {
    rank: 6,
    clubId: 'liman-birlik',
    played: 5,
    won: 2,
    drawn: 1,
    lost: 2,
    goalsFor: 6,
    goalsAgainst: 7,
    goalDifference: -1,
    points: 7,
    form: ['W', 'L', 'D', 'L', 'W'],
  },
  {
    rank: 7,
    clubId: 'kanyon-atlas',
    played: 5,
    won: 1,
    drawn: 2,
    lost: 2,
    goalsFor: 5,
    goalsAgainst: 8,
    goalDifference: -3,
    points: 5,
    form: ['L', 'D', 'W', 'L', 'D'],
  },
  {
    rank: 8,
    clubId: 'gokova-genclik',
    played: 5,
    won: 1,
    drawn: 1,
    lost: 3,
    goalsFor: 4,
    goalsAgainst: 8,
    goalDifference: -4,
    points: 4,
    form: ['L', 'W', 'L', 'D', 'L'],
  },
  {
    rank: 9,
    clubId: 'kizilkaya-spor',
    played: 5,
    won: 0,
    drawn: 2,
    lost: 3,
    goalsFor: 3,
    goalsAgainst: 9,
    goalDifference: -6,
    points: 2,
    form: ['L', 'D', 'L', 'L', 'D'],
  },
  {
    rank: 10,
    clubId: 'yelkenkoy-akademi',
    played: 5,
    won: 0,
    drawn: 1,
    lost: 4,
    goalsFor: 2,
    goalsAgainst: 10,
    goalDifference: -8,
    points: 1,
    form: ['L', 'L', 'D', 'L', 'L'],
  },
];

// ============================================================================
// 5. FIXTURES (Rounds 1-9 Demo Schedule)
// ============================================================================
export const MOCK_FIXTURES: Fixture[] = [
  // Round 1 (Finished)
  {
    id: 'fix-r1-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 1,
    date: '2026-08-15',
    time: '20:00',
    homeClubId: 'kalyon-doruk',
    awayClubId: 'liman-birlik',
    homeScore: 2,
    awayScore: 0,
    status: 'FINISHED',
  },
  {
    id: 'fix-r1-2',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 1,
    date: '2026-08-15',
    time: '18:00',
    homeClubId: 'solvanya-gucu',
    awayClubId: 'yelkenkoy-akademi',
    homeScore: 3,
    awayScore: 0,
    status: 'FINISHED',
  },
  // Round 5 (Previous Match for User Club)
  {
    id: 'fix-r5-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 5,
    date: '2026-09-22',
    time: '19:00',
    homeClubId: 'kuzey-firtinasi',
    awayClubId: 'kalyon-doruk',
    homeScore: 1,
    awayScore: 1,
    status: 'FINISHED',
    events: [
      {
        id: 'ev-1',
        minute: 24,
        type: 'GOAL',
        teamId: 'kuzey-firtinasi',
        playerId: 'pl-1080',
        playerName: 'Caner Varlık',
        description: 'Ceza sahası dışından sert vuruşla gol attı.',
      },
      {
        id: 'ev-2',
        minute: 68,
        type: 'GOAL',
        teamId: 'kalyon-doruk',
        playerId: 'pl-1024',
        playerName: 'Batuhan Keskin',
        description: 'Köşe vuruşunda kafa vuruşu ile beraberlik golü.',
      },
      {
        id: 'ev-3',
        minute: 77,
        type: 'YELLOW_CARD',
        teamId: 'kalyon-doruk',
        playerId: 'pl-1012',
        playerName: 'Tolga Çelik',
        description: 'Kontratak kesme faulü.',
      },
    ],
    stats: {
      possession: [48, 52],
      shots: [9, 14],
      shotsOnTarget: [4, 6],
      corners: [3, 7],
      fouls: [11, 8],
      yellowCards: [1, 2],
      redCards: [0, 0],
      passAccuracy: [79, 84],
      xg: [0.92, 1.45],
    },
    stadium: 'Fırtına Park Stadyumu',
    attendance: 29400,
  },
  // Round 6 (NEXT MATCH: Kalyon Doruk vs Vadişehir FK)
  {
    id: 'fix-r6-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 6,
    date: '2026-10-02',
    time: '20:00',
    homeClubId: 'kalyon-doruk',
    awayClubId: 'vadisehir',
    status: 'SCHEDULED',
    stadium: 'Doruk Arena',
    referee: 'Kemal Korkut (Ulusal Hakem)',
  },
  {
    id: 'fix-r6-2',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 6,
    date: '2026-10-02',
    time: '17:30',
    homeClubId: 'solvanya-gucu',
    awayClubId: 'ayazkent',
    status: 'SCHEDULED',
    stadium: 'Başkent Olimpik Parkı',
  },
  {
    id: 'fix-r6-3',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 6,
    date: '2026-10-03',
    time: '16:00',
    homeClubId: 'liman-birlik',
    awayClubId: 'kanyon-atlas',
    status: 'SCHEDULED',
    stadium: 'Liman Sahil Stadyumu',
  },
  {
    id: 'fix-r6-4',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 6,
    date: '2026-10-03',
    time: '19:00',
    homeClubId: 'gokova-genclik',
    awayClubId: 'kuzey-firtinasi',
    status: 'SCHEDULED',
    stadium: 'Körfez Arena',
  },
  {
    id: 'fix-r6-5',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 6,
    date: '2026-10-04',
    time: '15:00',
    homeClubId: 'kizilkaya-spor',
    awayClubId: 'yelkenkoy-akademi',
    status: 'SCHEDULED',
    stadium: 'Kaya Stadyumu',
  },
  // Round 7
  {
    id: 'fix-r7-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 7,
    date: '2026-10-16',
    time: '19:30',
    homeClubId: 'ayazkent',
    awayClubId: 'kalyon-doruk',
    status: 'SCHEDULED',
    stadium: 'Ayaztepe Arena',
  },
  // Round 8
  {
    id: 'fix-r8-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 8,
    date: '2026-10-23',
    time: '20:00',
    homeClubId: 'kalyon-doruk',
    awayClubId: 'solvanya-gucu',
    status: 'SCHEDULED',
    stadium: 'Doruk Arena',
  },
  // Round 9
  {
    id: 'fix-r9-1',
    seasonYear: '2026/27',
    competition: 'Alveria Elit Ligi',
    round: 9,
    date: '2026-10-30',
    time: '18:00',
    homeClubId: 'kanyon-atlas',
    awayClubId: 'kalyon-doruk',
    status: 'SCHEDULED',
    stadium: 'Kanyon Vadisi Park',
  },
];

// ============================================================================
// 6. INBOX MESSAGES
// ============================================================================
export const MOCK_INBOX_MESSAGES: InboxMessage[] = [
  {
    id: 'msg-1',
    clubId: 'kalyon-doruk',
    senderName: 'Hikmet Dorukoğlu',
    senderRole: 'Yönetim Kurulu Başkanı',
    subject: 'Sezon Hedefleri ve Yönetim Kurulu Değerlendirmesi',
    preview: 'Ligdeki ilk 5 hafta performansınızdan son derece memnunuz...',
    body: `Sayın Menajer,\n\nLigin ilk 5 haftasında topladığınız 11 puan ve namağlup serimiz yönetim kurulumuz tarafından büyük bir takdirle karşılandı. Bu sezon ana hedefimiz ligi ilk 3 sıra içerisinde tamamlayarak kıtasal turnuvalara katılma hakkı elde etmektir.\n\nÖnümüzdeki Vadişehir FK derbisi lig tablosundaki yerimiz açısından kritik öneme sahiptir. Tüm yönetim olarak arkanızdayız.\n\nSaygılarımızla,\nHikmet Dorukoğlu\nKalyon Doruk SK Yönetim Kurulu Başkanı`,
    date: '2026-09-28',
    category: 'BOARD',
    isRead: false,
    priority: 'HIGH',
    actionable: false,
  },
  {
    id: 'msg-2',
    clubId: 'kalyon-doruk',
    senderName: 'Dr. Selçuk Tan',
    senderRole: 'Baş Fizyoterapist',
    subject: 'Sakatlık Raporu: Aras Keskin',
    preview: 'Son antrenmanda sağ ayak bileğinde burkulma tespit edildi...',
    body: `Hocam Merhaba,\n\nBugünkü sabah antrenmanında ikili mücadele sonrasında sol kanat oyuncumuz Aras Keskin'in sağ ayak bileğinde 2. derece burkulma ve ödem tespit edilmiştir.\n\nOyuncumuzun rehabilitasyon sürecine derhal başlanmış olup yaklaşık 12-14 gün sahalardan uzak kalması öngörülmektedir. Kondisyoner ekibimizle özel güçlendirme programı uygulanacaktır.\n\nDr. Selçuk Tan\nSağlık Heyeti Sorumlusu`,
    date: '2026-09-27',
    category: 'INJURY',
    isRead: false,
    priority: 'HIGH',
    actionable: true,
    actionType: 'VIEW_SQUAD',
  },
  {
    id: 'msg-3',
    clubId: 'kalyon-doruk',
    senderName: 'Solvanya Gücü Transfer Komitesi',
    senderRole: 'Solvanya Gücü FK',
    subject: 'Resmi Transfer Teklifi: Mertkan Bozdağ',
    preview: 'Kulübümüz oyuncunuz Mertkan Bozdağ için €4.200.000 teklif etmektedir...',
    body: `Kalyon Doruk SK Kulüp Yönetimi'ne,\n\nKulübümüz, A Takım oyuncularınızdan orta saha mevkiinde görev yapan Mertkan Bozdağ için net €4.200.000 peşin transfer bedeli teklif etmektedir.\n\nTeklifimizin kabul edilmesi halinde sonraki satıştan %15 pay maddesi eklenmeye açıktır. Yanıtınızı 3 iş günü içerisinde beklemekteyiz.`,
    date: '2026-09-26',
    category: 'TRANSFER',
    isRead: true,
    priority: 'HIGH',
    actionable: true,
    actionType: 'REPLY_TRANSFER',
  },
  {
    id: 'msg-4',
    clubId: 'kalyon-doruk',
    senderName: 'Görkem Vadi',
    senderRole: 'Baş Gözlemci (Scout)',
    subject: 'Gözlemci Raporu: Dario Moretti (Kanyon Atlas)',
    preview: '22 yaşındaki İtalyan asıllı kanat oyuncusu için kapsamlı analiz hazırlandı...',
    body: `Sayın Menajer,\n\nScout ekibimizin Kanyon Atlas maçlarında yerinde takip ettiği 22 yaşındaki kanat oyuncusu Dario Moretti hakkında tam rapor eklenmiştir.\n\n+ Hızı ve dribbling kabiliyeti üst düzeyde (Hız: 84, Dribbling: 82)\n+ Potansiyeli 88 seviyesinde değerlendiriliyor\n- Sözleşmesinde €2.800.000 serbest kalma maddesi bulunuyor\n\nTakımımıza doğrudan güç katabilecek potansiyelde bir transfer adayıdır.`,
    date: '2026-09-25',
    category: 'SCOUT',
    isRead: true,
    priority: 'NORMAL',
    actionable: true,
  },
  {
    id: 'msg-5',
    clubId: 'kalyon-doruk',
    senderName: 'Erol Demir',
    senderRole: 'Yardımcı Antrenör',
    subject: 'Maç Önü Taktik Analizi: Vadişehir FK',
    preview: 'Rakip 4-3-3 geniş kanat hücumları ile etkili olmaya çalışıyor...',
    body: `Hocam,\n\nVadişehir FK'nın son 4 maçlık video analizlerini tamamladık. 4-3-3 dizilişinde kanat beklerini çok ileri çıkarıyorlar ve beklerin arkasında ciddi boşluklar oluşuyor.\n\nTavsiyemiz: Hızlı kanat oyuncularımızla geriden hızlı çıkışlar (Doğrudan pas veya Hızlı tempo) uygulamamız halinde savunma arkasında net pozisyonlar üretebiliriz.`,
    date: '2026-09-25',
    category: 'MATCH',
    isRead: true,
    priority: 'NORMAL',
    actionable: true,
    actionType: 'VIEW_TACTICS',
  },
  {
    id: 'msg-6',
    clubId: 'kalyon-doruk',
    senderName: 'Caner Varlık Menajeri',
    senderRole: 'Oyuncu Temsilcisi',
    subject: 'Sözleşme Yenileme Talebi: Caner Varlık',
    preview: 'Oyuncumun mevcut sözleşmesinin 2027 yazında sona erecek olması nedeniyle...',
    body: `Sayın Menajer,\n\nMüvekkilim Caner Varlık'ın kulübünüzdeki başarılı performansı ve takıma olan bağlılığı ortadadır. Sözleşmesinin son 1 yılına girecek olması sebebiyle 3 yıllık yeni bir sözleşme ve haftalık €24.000 maaş talep etmekteyiz.`,
    date: '2026-09-24',
    category: 'CONTRACT',
    isRead: true,
    priority: 'NORMAL',
    actionable: true,
    actionType: 'RENEW_CONTRACT',
  },
];

// ============================================================================
// 7. TRANSFERS DATA (Market, Incoming Offers, Outgoing, Shortlist)
// ============================================================================
export const MOCK_TRANSFER_OFFERS: TransferOffer[] = [
  {
    id: 'tr-off-1',
    playerId: 'pl-1018', // Mertkan Bozdağ (Kalyon Doruk)
    fromClubId: 'solvanya-gucu',
    toClubId: 'kalyon-doruk',
    fee: 4200000,
    wageOffer: 28000,
    status: 'PENDING',
    date: '2026-09-26',
    expiresInDays: 3,
  },
  {
    id: 'tr-off-2',
    playerId: 'pl-1004', // Sarp Demirdağ (Kalyon Doruk)
    fromClubId: 'ayazkent',
    toClubId: 'kalyon-doruk',
    fee: 2100000,
    wageOffer: 16000,
    status: 'PENDING',
    date: '2026-09-25',
    expiresInDays: 2,
  },
];

export const MOCK_SHORTLIST_IDS = ['pl-1168', 'pl-1120', 'pl-1095', 'pl-1225'];

// ============================================================================
// 8. FINANCES SUMMARY
// ============================================================================
export const MOCK_FINANCES: FinanceSummary = {
  clubBalance: 28450000,
  transferBudget: 12500000,
  wageBudget: 380000,
  weeklyWages: 315000,
  incomeCategories: {
    matchdayTickets: 3200000,
    sponsorships: 9500000,
    broadcasting: 14200000,
    merchandising: 2100000,
    playerSales: 5400000,
  },
  expenseCategories: {
    playerWages: 16380000,
    staffWages: 1850000,
    scoutingNetwork: 650000,
    stadiumMaintenance: 1200000,
    academyYouth: 1450000,
    playerSignings: 4800000,
  },
  monthlyHistory: [
    { month: 'Mayıs 2026', income: 4200000, expense: 2800000, net: 1400000 },
    { month: 'Haziran 2026', income: 7100000, expense: 5900000, net: 1200000 },
    { month: 'Temmuz 2026', income: 5800000, expense: 4100000, net: 1700000 },
    { month: 'Ağustos 2026', income: 8900000, expense: 3600000, net: 5300000 },
    { month: 'Eylül 2026', income: 6400000, expense: 3800000, net: 2600000 },
  ],
};
