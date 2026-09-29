import { Player, PlayerPosition, PreferredFoot, PlayerAttributes } from '@/types/game';

// Fictional name parts for rich variety
const FIRST_NAMES = [
  'Aras', 'Kaan', 'Mert', 'Deniz', 'Bora', 'Emir', 'Rüzgar', 'Alp', 'Cem', 'Taylan',
  'Baran', 'Kaya', 'Devrim', 'Efe', 'Koray', 'Doruk', 'Poyraz', 'Volkan', 'Görkem', 'Serkan',
  'Levent', 'Ulaş', 'Selim', 'Kerem', 'Tarkan', 'Batu', 'Çağlar', 'Yalçın', 'Sarp', 'Can',
  'Mateo', 'Luka', 'Julian', 'Dario', 'Milan', 'Elias', 'Soren', 'Felix', 'Nikola', 'Marko',
  'Adrian', 'Stefan', 'Karlo', 'Jonas', 'Valentin', 'Leon', 'Gabriel', 'Maxime', 'Lucas', 'Arno',
  'Tariq', 'Zaid', 'Malik', 'Idris', 'Sami', 'Hamza', 'Kareem', 'Rami', 'Faris', 'Nabil',
  'Kenji', 'Ren', 'Daiki', 'Hiroshi', 'Sora', 'Kaito', 'Riku', 'Taiga', 'Kazuki', 'Yuto',
  'Rafael', 'Tiago', 'Bruno', 'Hugo', 'Diogo', 'Matheus', 'Rodrigo', 'Caio', 'Enzo', 'Luciano'
];

const LAST_NAMES = [
  'Demirtaş', 'Karakaya', 'Özkan', 'Yıldırım', 'Akkaya', 'Bozkurt', 'Şahin', 'Çelik', 'Kayaalp', 'Taşdemir',
  'Erdoğan', 'Yılmazer', 'Gündoğdu', 'Albayrak', 'Karadağ', 'Sancaktar', 'Vardar', 'Kılıçarslan', 'Öztürk', 'Koçyiğit',
  'Vukovic', 'Novak', 'Horvat', 'Kovacic', 'Petrovic', 'Kolar', 'Lindner', 'Vogel', 'Schneider', 'Zimmermann',
  'Morozov', 'Sokolov', 'Popov', 'Kovalenko', 'Ilyin', 'Smirnov', 'Vasiliev', 'Gusev', 'Kuznetsov', 'Belov',
  'Moretti', 'Conti', 'De Luca', 'Esposito', 'Riva', 'Fontana', 'Marini', 'Costantini', 'Galli', 'Lombardi',
  'Al-Mansoor', 'Hakimi', 'Bennani', 'Kassir', 'Tawfiq', 'Najjar', 'Haddad', 'Zahran', 'Qasim', 'Fakhoury',
  'Takahashi', 'Watanabe', 'Nakamura', 'Kobayashi', 'Yamamoto', 'Kondo', 'Matsumoto', 'Inoue', 'Kimura', 'Shimizu',
  'Silveira', 'Fontes', 'Medeiros', 'Barros', 'Nascimento', 'Vasconcelos', 'Pinto', 'Carvalho', 'Figueiredo', 'Cardoso'
];

const NATIONALITIES = [
  'Alveria', 'Kalyon', 'Vadi', 'Marmaris', 'Poyraz', 'Zirve', 'Enderun', 'Atlantis',
  'Balkanica', 'Nordia', 'Iberia', 'Adriatika', 'Levant', 'Caledonia', 'Occitania', 'Helvetia'
];

interface PositionSpec {
  pos: PlayerPosition;
  secondaries: PlayerPosition[];
  countTarget: number;
}

const POSITION_DISTRIBUTION: PositionSpec[] = [
  { pos: 'GK', secondaries: [], countTarget: 55 },
  { pos: 'DC', secondaries: ['DR', 'DL', 'DMC'], countTarget: 80 },
  { pos: 'DL', secondaries: ['ML', 'DC'], countTarget: 40 },
  { pos: 'DR', secondaries: ['MR', 'DC'], countTarget: 40 },
  { pos: 'DMC', secondaries: ['MC', 'DC'], countTarget: 50 },
  { pos: 'MC', secondaries: ['DMC', 'AMC', 'MR', 'ML'], countTarget: 70 },
  { pos: 'AMC', secondaries: ['MC', 'AML', 'AMR', 'ST'], countTarget: 45 },
  { pos: 'AML', secondaries: ['ML', 'AMR', 'AMC', 'ST'], countTarget: 45 },
  { pos: 'AMR', secondaries: ['MR', 'AML', 'AMC', 'ST'], countTarget: 45 },
  { pos: 'ST', secondaries: ['AMC', 'AML', 'AMR'], countTarget: 70 },
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function generateAttributes(
  pos: PlayerPosition,
  overall: number,
  seed: number
): PlayerAttributes {
  const rand = (offset: number) => pseudoRandom(seed + offset);
  const clamp = (val: number) => Math.max(35, Math.min(99, Math.round(val)));
  const jitter = (range: number, offset: number) => Math.round((rand(offset) - 0.5) * range);

  const isGK = pos === 'GK';
  const isDEF = pos === 'DC' || pos === 'DL' || pos === 'DR';
  const isMID = pos === 'DMC' || pos === 'MC' || pos === 'AMC' || pos === 'ML' || pos === 'MR';
  const isATT = pos === 'AML' || pos === 'AMR' || pos === 'ST';

  if (isGK) {
    return {
      pace: clamp(overall * 0.55 + jitter(10, 1)),
      acceleration: clamp(overall * 0.55 + jitter(10, 2)),
      strength: clamp(overall * 0.85 + jitter(10, 3)),
      stamina: clamp(overall * 0.80 + jitter(10, 4)),
      finishing: clamp(overall * 0.20 + jitter(8, 5)),
      longShots: clamp(overall * 0.20 + jitter(8, 6)),
      passing: clamp(overall * 0.65 + jitter(12, 7)),
      vision: clamp(overall * 0.65 + jitter(12, 8)),
      crossing: clamp(overall * 0.30 + jitter(10, 9)),
      dribbling: clamp(overall * 0.40 + jitter(10, 10)),
      technique: clamp(overall * 0.50 + jitter(10, 11)),
      heading: clamp(overall * 0.45 + jitter(10, 12)),
      tackling: clamp(overall * 0.40 + jitter(10, 13)),
      marking: clamp(overall * 0.40 + jitter(10, 14)),
      positioning: clamp(overall * 0.85 + jitter(8, 15)),
      aggression: clamp(overall * 0.70 + jitter(10, 16)),
      composure: clamp(overall * 0.80 + jitter(10, 17)),
      decisions: clamp(overall * 0.80 + jitter(8, 18)),
      teamwork: clamp(overall * 0.80 + jitter(10, 19)),
      leadership: clamp(overall * 0.75 + jitter(12, 20)),
      handling: clamp(overall + jitter(6, 21)),
      reflexes: clamp(overall + jitter(6, 22)),
      positioningGK: clamp(overall + jitter(6, 23)),
      kicking: clamp(overall * 0.90 + jitter(8, 24)),
    };
  }

  let paceBias = 0;
  let shootingBias = 0;
  let passingBias = 0;
  let defendingBias = 0;
  let physicalBias = 0;

  if (isDEF) {
    defendingBias = 4;
    physicalBias = 3;
    passingBias = -2;
    shootingBias = -12;
    paceBias = pos === 'DC' ? -2 : 4;
  } else if (isMID) {
    passingBias = 4;
    physicalBias = 1;
    shootingBias = pos === 'AMC' ? 3 : -2;
    defendingBias = pos === 'DMC' ? 4 : -2;
  } else if (isATT) {
    shootingBias = 5;
    paceBias = 4;
    defendingBias = -18;
    physicalBias = 1;
  }

  return {
    pace: clamp(overall + paceBias + jitter(10, 25)),
    acceleration: clamp(overall + paceBias + jitter(10, 26)),
    strength: clamp(overall + physicalBias + jitter(10, 27)),
    stamina: clamp(overall + jitter(12, 28)),
    finishing: clamp(overall + shootingBias + jitter(10, 29)),
    longShots: clamp(overall + shootingBias + jitter(10, 30)),
    passing: clamp(overall + passingBias + jitter(10, 31)),
    vision: clamp(overall + passingBias + jitter(10, 32)),
    crossing: clamp(overall + (pos === 'DL' || pos === 'DR' || pos === 'AML' || pos === 'AMR' ? 4 : -4) + jitter(10, 33)),
    dribbling: clamp(overall + jitter(10, 34)),
    technique: clamp(overall + jitter(10, 35)),
    heading: clamp(overall + (pos === 'DC' || pos === 'ST' ? 4 : -4) + jitter(10, 36)),
    tackling: clamp(overall + defendingBias + jitter(10, 37)),
    marking: clamp(overall + defendingBias + jitter(10, 38)),
    positioning: clamp(overall + jitter(10, 39)),
    aggression: clamp(overall + jitter(12, 40)),
    composure: clamp(overall + jitter(10, 41)),
    decisions: clamp(overall + jitter(10, 42)),
    teamwork: clamp(overall + jitter(10, 43)),
    leadership: clamp(overall + jitter(12, 44)),
    handling: 15,
    reflexes: 15,
    positioningGK: 15,
    kicking: 20,
  };
}

/**
 * Generates the official SquadCraft Draft League Player Pool (500-550 balanced players).
 */
export function generateDraftPlayerPool(): Player[] {
  const pool: Player[] = [];
  let seedCounter = 1001;

  for (const posSpec of POSITION_DISTRIBUTION) {
    for (let i = 0; i < posSpec.countTarget; i++) {
      seedCounter++;
      const rTier = pseudoRandom(seedCounter * 3.14);
      let overall: number;

      if (rTier < 0.06) {
        overall = 82 + Math.floor(pseudoRandom(seedCounter * 5.7) * 7); // 82-88
      } else if (rTier < 0.24) {
        overall = 78 + Math.floor(pseudoRandom(seedCounter * 5.7) * 4); // 78-81
      } else if (rTier < 0.62) {
        overall = 73 + Math.floor(pseudoRandom(seedCounter * 5.7) * 5); // 73-77
      } else if (rTier < 0.88) {
        overall = 67 + Math.floor(pseudoRandom(seedCounter * 5.7) * 6); // 67-72
      } else {
        overall = 60 + Math.floor(pseudoRandom(seedCounter * 5.7) * 7); // 60-66
      }

      const fIdx = Math.floor(pseudoRandom(seedCounter * 11) * FIRST_NAMES.length);
      const lIdx = Math.floor(pseudoRandom(seedCounter * 17) * LAST_NAMES.length);
      const nIdx = Math.floor(pseudoRandom(seedCounter * 23) * NATIONALITIES.length);

      const firstName = FIRST_NAMES[fIdx];
      const lastName = LAST_NAMES[lIdx];
      const nationality = NATIONALITIES[nIdx];

      const age = 18 + Math.floor(pseudoRandom(seedCounter * 29) * 16); // 18-33
      const potential = Math.min(99, overall + (age <= 22 ? Math.floor(pseudoRandom(seedCounter * 31) * 10) + 3 : Math.floor(pseudoRandom(seedCounter * 31) * 3)));
      
      const footRand = pseudoRandom(seedCounter * 37);
      const preferredFoot: PreferredFoot = footRand < 0.65 ? 'Sağ' : footRand < 0.90 ? 'Sol' : 'Her İkisi';

      const height = posSpec.pos === 'GK' ? 188 + Math.floor(pseudoRandom(seedCounter * 41) * 10) : posSpec.pos === 'DC' ? 184 + Math.floor(pseudoRandom(seedCounter * 41) * 12) : 172 + Math.floor(pseudoRandom(seedCounter * 41) * 18);
      const weight = Math.round(height * 0.42 + pseudoRandom(seedCounter * 43) * 8);

      const attributes = generateAttributes(posSpec.pos, overall, seedCounter * 100);

      const player: Player = {
        id: `draft-p-${posSpec.pos.toLowerCase()}-${i + 1}-${seedCounter}`,
        clubId: 'DRAFT_POOL',
        firstName,
        lastName,
        nationality,
        age,
        birthDate: `200${Math.max(0, 8 - (age - 18))}-05-15`,
        position: posSpec.pos,
        secondaryPositions: posSpec.secondaries,
        preferredFoot,
        height,
        weight,
        attributes,
        overall,
        potential,
        morale: 80,
        fitness: 100,
        matchSharpness: 90,
        form: 7.0,
        marketValue: overall * 350000,
        wage: Math.round(overall * 400),
        contractStart: '2026-08-01',
        contractEnd: '2028-06-30',
        squadRole: overall >= 80 ? 'Yıldız Oyuncu' : overall >= 74 ? 'İlk 11' : 'Rotasyon',
      };

      pool.push(player);
    }
  }

  return pool;
}

// Singleton pool instance for consistent fast access in memory
let cachedDraftPool: Player[] | null = null;

export function getCachedDraftPlayerPool(): Player[] {
  if (!cachedDraftPool) {
    cachedDraftPool = generateDraftPlayerPool();
  }
  return cachedDraftPool;
}
