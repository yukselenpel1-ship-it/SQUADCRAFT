import {
  Player,
  PlayerPosition,
  PreferredFoot,
  PlayerArchetype,
  DevelopmentCurve,
  HiddenPlayerAttributes,
} from '@/types/game';
import {
  REGIONAL_NAME_SETS,
  REAL_LIFE_STAR_BLACKLIST,
  calculatePlayerDraftValue,
  generateArchetypeAttributes,
} from './playerPool';

export interface ProgressionOptions {
  appearances?: number;
  averageRating?: number;
  facilityLevel?: number; // 1 (Poor) to 5 (World Class)
  isInjuredLongTerm?: boolean;
}

export interface SeasonProgressionResult {
  updatedPlayer: Player;
  deltaOverall: number;
  isRetired: boolean;
  previousOverall: number;
  previousValue: number;
  progressionNote: string;
}

/**
 * Simulates a single season of progression/regression for a player.
 * Implements SquadCraft Player Database 2.0 Development Mechanics:
 * - Age-bracketed curves (16-20, 21-24, 25-28, 29-31, 32+)
 * - Performance / playtime / facility impact
 * - Hidden attributes (workEthic, developmentCurve, injuryProneness)
 * - Strict Potential ceiling (max 94 OVR)
 * - Dynamic Draft Value re-calculation
 * - "YÜKSELEN YETENEK" badge dynamic updates
 */
export function simulateSeasonProgression(
  player: Player,
  options: ProgressionOptions = {}
): SeasonProgressionResult {
  const {
    appearances = 22,
    averageRating = 7.0,
    facilityLevel = 3,
    isInjuredLongTerm = false,
  } = options;

  const previousOverall = player.overall;
  const previousValue = player.draftValue ?? calculatePlayerDraftValue(player);
  const age = player.age;
  const pot = player.potential;
  const hidden = player.hiddenAttributes;
  const devCurve: DevelopmentCurve = hidden?.developmentCurve || 'BALANCED';
  const workEthic = hidden?.workEthic ?? 65;

  let deltaOvr = 0;
  let note = '';

  // Calculate playtime & performance factor (-1.0 to +1.0)
  const playtimeFactor = appearances >= 25 ? 1.0 : appearances >= 15 ? 0.6 : appearances >= 5 ? 0.2 : -0.5;
  const ratingFactor = averageRating >= 7.5 ? 1.0 : averageRating >= 7.0 ? 0.5 : averageRating >= 6.5 ? 0.0 : -0.8;
  const facilityBonus = (facilityLevel - 3) * 0.3; // -0.6 to +0.6
  const workBonus = (workEthic - 60) / 40; // ~ -0.25 to +1.0

  if (age <= 20) {
    // Bracket 1: 16-20 (Rapid Development)
    let baseGrowth = 2 + Math.random() * 2; // 2.0 to 4.0
    if (devCurve === 'EARLY_PEAK') baseGrowth += 1.2;
    if (playtimeFactor > 0.5 && ratingFactor > 0.3) baseGrowth += 1.0;
    if (isInjuredLongTerm) baseGrowth -= 2.0;

    baseGrowth += facilityBonus + workBonus * 0.5;
    deltaOvr = Math.max(0, Math.round(baseGrowth));

    // Cap at potential
    if (player.overall + deltaOvr > pot) {
      deltaOvr = Math.max(0, pot - player.overall);
    }
    note = deltaOvr >= 4 ? 'Olağanüstü sıçrama yaptı!' : deltaOvr >= 2 ? 'Hızlı gelişim gösterdi.' : 'İstikrarlı gelişim.';
  } else if (age <= 24) {
    // Bracket 2: 21-24 (Maturing Development)
    let baseGrowth = 1 + Math.random() * 1.8; // 1.0 to 2.8
    if (devCurve === 'LATE_BLOOMER') baseGrowth += 0.8;
    if (playtimeFactor > 0.5 && ratingFactor > 0.3) baseGrowth += 0.7;
    if (isInjuredLongTerm) baseGrowth -= 1.5;

    baseGrowth += facilityBonus * 0.7 + workBonus * 0.4;
    deltaOvr = Math.max(0, Math.round(baseGrowth));

    if (player.overall + deltaOvr > pot) {
      // Small chance of late bloomer breakthrough (+1 beyond pot)
      if (devCurve === 'LATE_BLOOMER' && workEthic >= 80 && player.overall < 94) {
        deltaOvr = Math.max(0, pot - player.overall + 1);
        note = 'Potansiyel tavanını aşan tarihi bir gelişim sergiledi!';
      } else {
        deltaOvr = Math.max(0, pot - player.overall);
        note = deltaOvr > 0 ? 'Potansiyel zirvesine yaklaştı.' : 'Potansiyel tavanına ulaştı.';
      }
    } else {
      note = deltaOvr > 1 ? 'Olgunlaşarak seviye atladı.' : 'Düzenli katkı verdi.';
    }
  } else if (age <= 28) {
    // Bracket 3: 25-28 (Prime Peak Years)
    // Stable (-1 to +1)
    if (player.overall < pot && playtimeFactor >= 0.6 && ratingFactor >= 0.5) {
      deltaOvr = Math.random() < 0.4 ? 1 : 0;
      note = deltaOvr > 0 ? 'Kariyer zirvesine ulaştı.' : 'En verimli çağında dengeli performans.';
    } else if (isInjuredLongTerm || playtimeFactor < 0) {
      deltaOvr = -1;
      note = 'Sakatlık ve forma hasreti sebebiyle hafif geriledi.';
    } else {
      deltaOvr = 0;
      note = 'Kariyerinin en olgun ve istikrarlı döneminde.';
    }
  } else if (age <= 31) {
    // Bracket 4: 29-31 (Early Decline)
    // Physical drop (-1 to -2), mental attributes endure
    let decline = 1;
    if (workEthic >= 80 && !isInjuredLongTerm) {
      decline = Math.random() < 0.6 ? 0 : 1; // High work ethic delays decline
    } else if (isInjuredLongTerm || hidden?.injuryProneness! >= 70) {
      decline = 2;
    }
    deltaOvr = -decline;
    note = decline > 0 ? 'Fiziksel hızında hafif düşüş gözlendi.' : 'Tecrübesiyle formunu mükemmel korudu.';
  } else {
    // Bracket 5: 32+ (Rapid Physical Regression)
    let decline = 2 + Math.floor(Math.random() * 2); // 2 to 3
    if (workEthic >= 85) decline = Math.max(1, decline - 1);
    if (age >= 35) decline += 1;
    deltaOvr = -decline;
    note = 'Yaşın getirdiği fiziksel yıpranma kaçınılmaz oldu.';
  }

  // Calculate new overall strictly clamped between 50 and 94
  const newOverall = Math.max(50, Math.min(94, player.overall + deltaOvr));
  const newAge = player.age + 1;

  // Retirement evaluation
  let isRetired = false;
  if (newAge >= 35) {
    const retireChance = newAge >= 38 ? 0.85 : newAge >= 36 ? 0.50 : 0.25;
    if (Math.random() < retireChance || newOverall < 62) {
      isRetired = true;
      note = 'Kramponlarını asarak profesyonel kariyerini noktaladı.';
    }
  }

  // Update attributes according to archetype and delta
  const updatedAttributes = { ...player.attributes };
  if (deltaOvr !== 0) {
    const ratio = newOverall / Math.max(1, player.overall);
    for (const [key, val] of Object.entries(updatedAttributes)) {
      const k = key as keyof typeof updatedAttributes;
      // Mental attributes decay slower in older players, physicals decay faster
      let attrMultiplier = ratio;
      if (age >= 29) {
        if (['pace', 'acceleration', 'stamina'].includes(key)) {
          attrMultiplier = ratio * 0.96;
        } else if (['composure', 'decisions', 'positioning', 'leadership'].includes(key)) {
          attrMultiplier = Math.max(1.0, ratio * 1.02);
        }
      }
      updatedAttributes[k] = Math.max(35, Math.min(99, Math.round(val * attrMultiplier)));
    }
  }

  // "YÜKSELEN YETENEK" Badge criteria: Age <= 21, POT >= 87, growth >= 6
  const isRisingTalent = newAge <= 21 && pot >= 87 && (pot - newOverall) >= 6;

  // Re-calculate draft & market value dynamically
  const updatedDraftValue = calculatePlayerDraftValue({
    overall: newOverall,
    potential: pot,
    age: newAge,
    position: player.position,
    archetype: player.archetype,
    form: averageRating,
  });

  const updatedPlayer: Player = {
    ...player,
    age: newAge,
    overall: newOverall,
    attributes: updatedAttributes,
    isRisingTalent,
    draftValue: updatedDraftValue,
    marketValue: updatedDraftValue,
    wage: Math.round(newOverall * 450),
    matchSharpness: Math.min(100, Math.round((player.matchSharpness ?? 85) * 0.9 + appearances * 0.5)),
  };

  return {
    updatedPlayer,
    deltaOverall: newOverall - previousOverall,
    isRetired,
    previousOverall,
    previousValue,
    progressionNote: note,
  };
}

/**
 * Generates fresh fictional youth regen players (age 16-19) to replenish retired footballers.
 * Guaranteed no collisions with real-life stars or existing names.
 */
export function generateRegenPlayers(
  count: number,
  existingNamesSet: Set<string> = new Set()
): Player[] {
  const regens: Player[] = [];
  const positions: PlayerPosition[] = ['GK', 'DC', 'DL', 'DR', 'DMC', 'MC', 'AMC', 'AML', 'AMR', 'ST'];
  const archetypesMap: Record<string, PlayerArchetype[]> = {
    GK: ['Süpürücü Kaleci', 'Çizgi Kalecisi'],
    DC: ['Pasör Stoper', 'Fiziksel Stoper'],
    DL: ['Hücumcu Bek', 'Savunmacı Bek'],
    DR: ['Hücumcu Bek', 'Savunmacı Bek'],
    DMC: ['Defansif Orta Saha', 'Box-to-Box'],
    MC: ['Oyun Kurucu', 'Box-to-Box'],
    AMC: ['Oyun Kurucu', 'Hızlı Kanat'],
    AML: ['Hızlı Kanat', 'Oyun Kurucu Kanat'],
    AMR: ['Hızlı Kanat', 'Oyun Kurucu Kanat'],
    ST: ['Bitirici Forvet', 'Pres Forvet', 'Hedef Santrfor'],
  };

  for (let i = 0; i < count; i++) {
    const regSet = REGIONAL_NAME_SETS[Math.floor(Math.random() * REGIONAL_NAME_SETS.length)];
    let firstName = '';
    let lastName = '';
    let combo = '';
    let tries = 0;

    while (tries < 50) {
      tries++;
      firstName = regSet.firstNames[Math.floor(Math.random() * regSet.firstNames.length)];
      lastName = regSet.lastNames[Math.floor(Math.random() * regSet.lastNames.length)];
      combo = `${firstName} ${lastName}`;
      if (!existingNamesSet.has(combo) && !REAL_LIFE_STAR_BLACKLIST.has(combo.toLowerCase())) {
        existingNamesSet.add(combo);
        break;
      }
    }

    const pos = positions[Math.floor(Math.random() * positions.length)];
    const archList = archetypesMap[pos] || ['Oyun Kurucu'];
    const archetype = archList[Math.floor(Math.random() * archList.length)];
    const age = 16 + Math.floor(Math.random() * 4); // 16-19
    const overall = 58 + Math.floor(Math.random() * 16); // 58-73
    const potGrowth = 10 + Math.floor(Math.random() * 15); // +10 to +24
    const potential = Math.min(93, overall + potGrowth); // max 93

    const nationality = regSet.nationalities[Math.floor(Math.random() * regSet.nationalities.length)];
    const preferredFoot: PreferredFoot = Math.random() < 0.65 ? 'Sağ' : Math.random() < 0.9 ? 'Sol' : 'Her İkisi';
    const height = pos === 'GK' ? 188 + Math.floor(Math.random() * 10) : 174 + Math.floor(Math.random() * 16);
    const weight = Math.round(height * 0.42 + Math.random() * 8);

    const isRisingTalent = age <= 21 && potential >= 84 && (potential - overall) >= 6;
    const draftValue = calculatePlayerDraftValue({
      overall,
      potential,
      age,
      position: pos,
      archetype,
      form: 7.0,
    });

    const attributes = generateArchetypeAttributes(pos, archetype, overall, Math.floor(Math.random() * 100000));

    const hiddenAttributes: HiddenPlayerAttributes = {
      consistency: 50 + Math.floor(Math.random() * 45),
      bigMatchPerformance: 50 + Math.floor(Math.random() * 45),
      injuryProneness: 15 + Math.floor(Math.random() * 45),
      professionalism: 50 + Math.floor(Math.random() * 45),
      workEthic: 55 + Math.floor(Math.random() * 40),
      developmentCurve: Math.random() < 0.25 ? 'EARLY_PEAK' : Math.random() < 0.75 ? 'BALANCED' : 'LATE_BLOOMER',
    };

    regens.push({
      id: `sc-regen-${Date.now().toString(36)}-${i}`,
      clubId: 'DRAFT_POOL',
      firstName,
      lastName,
      nationality,
      age,
      birthDate: `201${Math.max(0, 0 - (age - 16))}-03-12`,
      position: pos,
      secondaryPositions: [],
      preferredFoot,
      height,
      weight,
      attributes,
      overall,
      potential,
      morale: 85,
      fitness: 100,
      matchSharpness: 85,
      form: 7.0,
      marketValue: draftValue,
      draftValue,
      wage: Math.round(overall * 300),
      contractStart: '2026-08-01',
      contractEnd: '2029-06-30',
      squadRole: 'Gelecek Vadeden',
      archetype,
      isRisingTalent,
      hiddenAttributes,
      scoutingReport: {
        isFullyScouted: false,
        scoutedLevel: 40,
        estimatedOvrMin: Math.max(50, overall - 4),
        estimatedOvrMax: Math.min(94, overall + 4),
        estimatedPotMin: Math.max(50, potential - 5),
        estimatedPotMax: Math.min(94, potential + 5),
      },
    });
  }

  return regens;
}
