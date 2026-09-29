import { Scout, ScoutingRegionId } from './types';

const SCOUT_FIRST_NAMES = [
  'Haluk', 'Nedim', 'Cem', 'Sami', 'Erhan', 'Yılmaz', 'Ferit', 'Rüştü',
  'Levent', 'Bülent', 'Recep', 'Fahri', 'Sadık', 'Turgay', 'Gürkan', 'Altan',
  'Kaan', 'Mert', 'Deniz', 'Hasan', 'Oktay', 'Sinan', 'Zafer', 'Uğur'
];

const SCOUT_LAST_NAMES = [
  'Gözcü', 'İzleyen', 'Arayan', 'Kılavuz', 'Rehber', 'Yıldızbul', 'Doruker', 'Pusula',
  'Karakartal', 'Demirbağ', 'Işıkçı', 'Keşfeden', 'Seçkin', 'Erbaşaran', 'Gözalan', 'Derin'
];

/**
 * Generates initial default scouts for a user's club.
 */
export function generateClubScouts(clubId: string, clubReputation: number = 75): Scout[] {
  // Generate 3 club scouts with varying strengths (Chief Scout, Youth Scout, Regional Scout)
  const repFactor = Math.round(clubReputation * 0.7);

  const chiefScout: Scout = {
    id: `scout-${clubId}-chief`,
    firstName: 'Haluk',
    lastName: 'Gözcü',
    age: 54,
    nationality: 'Alveria',
    clubId,
    judgingAbility: Math.min(95, Math.max(55, repFactor + 12)),
    judgingPotential: Math.min(95, Math.max(55, repFactor + 10)),
    tacticalKnowledge: Math.min(95, Math.max(50, repFactor + 8)),
    adaptability: Math.min(90, Math.max(45, repFactor + 5)),
    regionKnowledge: {
      'alveria-central': 95,
      'valeria-north': 75,
      'sorven-basin': 80,
      'eldoria-west': 65,
      'merovin-belt': 70,
      'tarsen-isles': 50,
    },
    wage: Math.round((repFactor * 70) / 100) * 100,
    reputation: Math.min(90, clubReputation + 2),
  };

  const youthScout: Scout = {
    id: `scout-${clubId}-youth`,
    firstName: 'Sami',
    lastName: 'Yıldızbul',
    age: 42,
    nationality: 'Alveria',
    clubId,
    judgingAbility: Math.min(90, Math.max(50, repFactor + 4)),
    judgingPotential: Math.min(95, Math.max(60, repFactor + 15)), // High potential judge
    tacticalKnowledge: Math.min(85, Math.max(45, repFactor + 2)),
    adaptability: Math.min(92, Math.max(55, repFactor + 10)),
    regionKnowledge: {
      'alveria-central': 80,
      'valeria-north': 85,
      'sorven-basin': 90,
      'eldoria-west': 75,
      'merovin-belt': 60,
      'tarsen-isles': 70,
    },
    wage: Math.round((repFactor * 55) / 100) * 100,
    reputation: Math.min(85, clubReputation - 2),
  };

  const regionalScout: Scout = {
    id: `scout-${clubId}-regional`,
    firstName: 'Ferit',
    lastName: 'Kılavuz',
    age: 48,
    nationality: 'Alveria',
    clubId,
    judgingAbility: Math.min(88, Math.max(48, repFactor + 6)),
    judgingPotential: Math.min(88, Math.max(48, repFactor + 5)),
    tacticalKnowledge: Math.min(90, Math.max(50, repFactor + 12)),
    adaptability: Math.min(85, Math.max(40, repFactor)),
    regionKnowledge: {
      'alveria-central': 85,
      'valeria-north': 60,
      'sorven-basin': 65,
      'eldoria-west': 85,
      'merovin-belt': 80,
      'tarsen-isles': 55,
    },
    wage: Math.round((repFactor * 50) / 100) * 100,
    reputation: Math.min(80, clubReputation - 5),
  };

  return [chiefScout, youthScout, regionalScout];
}

/**
 * Generates a pool of free agent scouts available for hire.
 */
export function generateFreeAgentScouts(count: number = 6): Scout[] {
  const freeAgents: Scout[] = [];

  for (let i = 0; i < count; i++) {
    const fn = SCOUT_FIRST_NAMES[(i * 3 + 2) % SCOUT_FIRST_NAMES.length];
    const ln = SCOUT_LAST_NAMES[(i * 2 + 1) % SCOUT_LAST_NAMES.length];
    const ability = 45 + (i * 7) % 45;
    const potential = 48 + (i * 9) % 43;

    freeAgents.push({
      id: `scout-free-${i + 1}`,
      firstName: fn,
      lastName: ln,
      age: 38 + (i * 4) % 25,
      nationality: 'Alveria',
      clubId: 'FREE_AGENT',
      judgingAbility: ability,
      judgingPotential: potential,
      tacticalKnowledge: 40 + (i * 6) % 45,
      adaptability: 50 + (i * 5) % 40,
      regionKnowledge: {
        'alveria-central': 60 + (i * 5) % 35,
        'valeria-north': 40 + (i * 7) % 50,
        'sorven-basin': 45 + (i * 8) % 45,
        'eldoria-west': 40 + (i * 6) % 50,
        'merovin-belt': 35 + (i * 9) % 55,
        'tarsen-isles': 30 + (i * 11) % 60,
      },
      wage: Math.round((ability + potential) * 20),
      reputation: Math.round((ability + potential) / 2),
    });
  }

  return freeAgents;
}
