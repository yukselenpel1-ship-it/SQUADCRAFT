import { PlayerPosition, PlayerAttributes } from '@/types/game';
import { YouthPlayer } from './types';

const YOUTH_FIRST_NAMES = [
  'Arda', 'Kerem', 'Emir', 'Yusuf', 'Can', 'Ege', 'Doruk', 'Baran',
  'Mert', 'Kaan', 'Deniz', 'Bora', 'Alp', 'Cem', 'Onur', 'Burak',
  'Sarp', 'Umut', 'Taha', 'Enes', 'Berke', 'Eren', 'Batuhan', 'Koray'
];

const YOUTH_LAST_NAMES = [
  'Demir', 'Yıldırım', 'Kaya', 'Şahin', 'Çelik', 'Koç', 'Kurt', 'Öztürk',
  'Aslan', 'Doğan', 'Güneş', 'Yavuz', 'Polat', 'Acar', 'Soydan', 'Bayram',
  'Taş', 'Erdoğan', 'Kılıç', 'Sancak', 'Bulut', 'Yılmaz', 'Aksoy', 'Karaca'
];

const POSITIONS: PlayerPosition[] = [
  'GK', 'DR', 'DC', 'DL', 'DMC', 'MC', 'MR', 'ML', 'AMC', 'AMR', 'AML', 'ST'
];

/**
 * Generates default base attributes for a youth player based on overall rating and position.
 */
function generateYouthAttributes(overall: number, position: PlayerPosition): PlayerAttributes {
  const base = Math.max(35, Math.min(75, overall - 5));

  const attrs: PlayerAttributes = {
    pace: Math.min(90, base + (['AMR', 'AML', 'ST', 'DR', 'DL'].includes(position) ? 10 : 0)),
    acceleration: Math.min(90, base + (['AMR', 'AML', 'ST', 'DR', 'DL'].includes(position) ? 8 : 0)),
    strength: Math.min(85, base + (['DC', 'ST', 'GK'].includes(position) ? 8 : -4)),
    stamina: Math.min(85, base + 2),
    finishing: Math.min(85, base + (['ST', 'AML', 'AMR'].includes(position) ? 12 : -10)),
    longShots: Math.min(80, base + (['MC', 'AMC', 'AML', 'AMR'].includes(position) ? 6 : -8)),
    passing: Math.min(85, base + (['MC', 'AMC', 'DMC'].includes(position) ? 10 : -4)),
    vision: Math.min(85, base + (['MC', 'AMC'].includes(position) ? 10 : -6)),
    crossing: Math.min(85, base + (['DR', 'DL', 'MR', 'ML', 'AMR', 'AML'].includes(position) ? 10 : -10)),
    dribbling: Math.min(85, base + (['AMR', 'AML', 'AMC', 'ST'].includes(position) ? 10 : -6)),
    technique: Math.min(85, base + (['MC', 'AMC', 'AMR', 'AML'].includes(position) ? 8 : -4)),
    heading: Math.min(85, base + (['DC', 'ST'].includes(position) ? 10 : -8)),
    tackling: Math.min(85, base + (['DC', 'DR', 'DL', 'DMC'].includes(position) ? 12 : -15)),
    marking: Math.min(85, base + (['DC', 'DR', 'DL'].includes(position) ? 10 : -15)),
    positioning: Math.min(85, base + (['DC', 'DR', 'DL', 'DMC'].includes(position) ? 8 : -8)),
    aggression: Math.min(80, base + (['DC', 'DMC'].includes(position) ? 8 : 0)),
    composure: Math.min(80, base - 5), // Youth has lower composure
    decisions: Math.min(80, base - 4),
    teamwork: Math.min(85, base + 4),
    leadership: Math.min(75, base - 8),
    handling: position === 'GK' ? base + 10 : 15,
    reflexes: position === 'GK' ? base + 12 : 15,
    positioningGK: position === 'GK' ? base + 8 : 15,
    kicking: position === 'GK' ? base + 6 : 15,
  };

  return attrs;
}

/**
 * Generates a single youth player prospect.
 */
export function generateSingleYouthProspect(
  index: number,
  clubId: string,
  academyLevel: number = 5,
  recruitmentQuality: number = 50,
  seasonYear: string = '2026/27'
): YouthPlayer {
  const position = POSITIONS[index % POSITIONS.length];
  const fn = YOUTH_FIRST_NAMES[(index * 5 + 3) % YOUTH_FIRST_NAMES.length];
  const ln = YOUTH_LAST_NAMES[(index * 7 + 1) % YOUTH_LAST_NAMES.length];
  const age = 15 + (index % 4); // 15 to 18

  // Base overall: 45 to 64
  const baseOverall = 45 + Math.round(academyLevel * 1.5) + (index % 8);
  const overall = Math.min(65, Math.max(42, baseOverall));

  // Realistic potential distribution:
  // Random roll (0 to 100)
  const roll = (index * 23 + academyLevel * 7 + recruitmentQuality * 3) % 100;
  let potential = overall + 8;

  if (roll >= 94) {
    // Rare Wonderkid (5%)
    potential = Math.min(92, overall + 22 + Math.round(recruitmentQuality * 0.1));
  } else if (roll >= 70) {
    // Good Prospect (25%)
    potential = Math.min(82, overall + 14 + Math.round(academyLevel * 0.8));
  } else {
    // Average Prospect (70%)
    potential = Math.min(74, overall + 6 + (index % 6));
  }

  const attributes = generateYouthAttributes(overall, position);

  // Estimated potential range shown by academy staff
  const estMin = Math.max(overall + 2, potential - 5);
  const estMax = Math.min(99, potential + 6);

  let scoutOpinion = 'Ortalama bir altyapı oyuncusu; temel becerilerini geliştirmesi gerekiyor.';
  if (potential >= 84) {
    scoutOpinion = 'Kulüp akademisinin en parlak mücevherlerinden biri; A Takım seviyesine hızla yükselebilir!';
  } else if (potential >= 76) {
    scoutOpinion = 'Gelişime açık, disiplinli ve rotasyonda yer bulabilecek umut vadeden bir yetenek.';
  }

  const currYearNum = parseInt(seasonYear.split(/[-/]/)[0], 10) || 2026;
  const birthYear = currYearNum - age;

  return {
    id: `youth-${Date.now()}-${index}-${clubId}`,
    clubId,
    firstName: fn,
    lastName: ln,
    nationality: 'Alveria',
    age,
    birthDate: `${birthYear}-03-${String(10 + (index % 18)).padStart(2, '0')}`,
    position,
    secondaryPositions: [],
    preferredFoot: index % 3 === 0 ? 'Sol' : 'Sağ',
    height: 172 + (index % 18),
    weight: 64 + (index % 16),
    attributes,
    overall,
    potential,
    morale: 85,
    fitness: 100,
    matchSharpness: 75,
    form: 6.5,
    marketValue: Math.round((overall * overall * 120) / 10000) * 10000,
    wage: 250, // Youth stipend
    contractStart: `${currYearNum}-07-01`,
    contractEnd: `${currYearNum + 2}-06-30`,
    contractStatus: 'AKADEMI',
    isAcademyGraduate: true,
    academyGraduationYear: seasonYear,
    estimatedPotentialRange: [estMin, estMax],
    scoutOpinion,
  };
}

export function generateYouthProspect(
  clubOrClubId: any,
  academyLevel: number = 5,
  coachingQuality: number = 50,
  recruitmentQuality: number = 50,
  seasonYear: string = '2026/27',
  index: number = 0
): YouthPlayer {
  const clubId = typeof clubOrClubId === 'string' ? clubOrClubId : clubOrClubId.id;
  return generateSingleYouthProspect(index, clubId, academyLevel, recruitmentQuality, seasonYear);
}

