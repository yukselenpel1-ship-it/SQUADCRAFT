import { Player, PlayerAttributes } from '@/types/game';
import {
  Scout,
  ScoutingReport,
  ScoutRecommendation,
  PlayerHiddenProfile,
  KnowledgeLevel,
} from './types';
import { calculateScoutErrorMargin, calculateScoutConfidence } from './scoutQuality';
import {
  getConsistencyDescription,
  getInjuryTendencyDescription,
  getBigMatchDescription,
} from './playerPersonality';

const ATTRIBUTE_LABELS: Record<keyof PlayerAttributes, string> = {
  pace: 'Hız',
  acceleration: 'Hızlanma',
  strength: 'Fiziksel Güç',
  stamina: 'Dayanıklılık',
  finishing: 'Bitiricilik',
  longShots: 'Uzaktan Şut',
  passing: 'Pas Kalitesi',
  vision: 'Oyun Görüşü',
  crossing: 'Orta Açma',
  dribbling: 'Top Sürme',
  technique: 'Teknik Kapasite',
  heading: 'Kafa Vuruşu',
  tackling: 'Top Çalma',
  marking: 'Markaj',
  positioning: 'Pozisyon Alma',
  aggression: 'Agresiflik',
  composure: 'Soğukkanlılık',
  decisions: 'Karar Verme',
  teamwork: 'Takım Oyunu',
  leadership: 'Liderlik',
  handling: 'Top Kontrolü (GK)',
  reflexes: 'Refleksler (GK)',
  positioningGK: 'Kaleci Pozisyonu',
  kicking: 'Degaj (GK)',
};

export function generateScoutingReport(
  arg1: Player | Scout,
  arg2: Scout | Player,
  arg3: number | string | PlayerHiddenProfile,
  arg4?: string | number,
  arg5?: PlayerHiddenProfile | number
): ScoutingReport {
  let player: Player;
  let scout: Scout;
  let durationDays: number = 7;
  let currentDate: string = '2026-08-01';
  let hiddenProfile: PlayerHiddenProfile | undefined;

  if ('judgingAbility' in arg1) {
    scout = arg1 as Scout;
    player = arg2 as Player;
    if (typeof arg3 === 'object' && 'personality' in arg3) {
      hiddenProfile = arg3 as PlayerHiddenProfile;
      currentDate = typeof arg4 === 'string' ? arg4 : '2026-08-01';
      durationDays = typeof arg5 === 'number' ? arg5 : 7;
    } else if (typeof arg3 === 'number') {
      durationDays = arg3;
      currentDate = typeof arg4 === 'string' ? arg4 : '2026-08-01';
      hiddenProfile = typeof arg5 === 'object' ? arg5 : undefined;
    }
  } else {
    player = arg1 as Player;
    scout = arg2 as Scout;
    durationDays = typeof arg3 === 'number' ? arg3 : 7;
    currentDate = typeof arg4 === 'string' ? arg4 : '2026-08-01';
    hiddenProfile = typeof arg5 === 'object' ? arg5 : undefined;
  }

  const confidence = calculateScoutConfidence(scout, durationDays);
  
  // Calculate Ability Range
  const abilityMargin = calculateScoutErrorMargin(scout.judgingAbility, durationDays, false);
  const estOvrMin = Math.max(1, player.overall - abilityMargin);
  const estOvrMax = Math.min(99, player.overall + abilityMargin);

  // Calculate Potential Range (always wider error margin)
  const potentialMargin = calculateScoutErrorMargin(scout.judgingPotential, durationDays, true);
  const estPotMin = Math.max(estOvrMin, player.potential - potentialMargin);
  const estPotMax = Math.min(99, player.potential + potentialMargin);

  // Find Top Strengths & Weaknesses
  const attrs = player.attributes || ({} as PlayerAttributes);
  const sortedAttrs = (Object.keys(attrs) as (keyof PlayerAttributes)[])
    .filter((k) => player.position === 'GK' ? true : !['handling', 'reflexes', 'positioningGK', 'kicking'].includes(k))
    .sort((a, b) => (attrs[b] || 0) - (attrs[a] || 0));

  const strengths = sortedAttrs.slice(0, 3).map((k) => `${ATTRIBUTE_LABELS[k]} (${attrs[k]})`);
  const weaknesses = sortedAttrs.slice(-3).reverse().map((k) => `${ATTRIBUTE_LABELS[k]} (${attrs[k]})`);

  // Tactical Fit
  let tacticalFit = 'Takımın mevcut oyun sistemine uyum sağlayabilecek standart bir profil.';
  if (player.overall >= 78) {
    tacticalFit = 'Doğrudan ilk 11 seviyesinde; hücum ve geçiş organizasyonlarında fark yaratabilir.';
  } else if (player.age <= 21 && player.potential >= 80) {
    tacticalFit = 'Gelişime çok açık; düzenli maç dakikalarıyla takımın vazgeçilmezine dönüşebilir.';
  }

  // Recommendation logic (descriptive, not omniscient)
  const perceivedPotential = (estPotMin + estPotMax) / 2;
  const perceivedOverall = (estOvrMin + estOvrMax) / 2;
  let recommendation: ScoutRecommendation = 'Takip Edilmeli';

  if (perceivedPotential >= 84 && perceivedOverall >= 74) {
    recommendation = 'Kesinlikle Önerilir';
  } else if (perceivedOverall >= 74 || (player.age <= 22 && perceivedPotential >= 79)) {
    recommendation = 'Önerilir';
  } else if (player.age <= 23 && perceivedPotential >= 74) {
    recommendation = 'Takip Edilmeli';
  } else if (perceivedOverall <= 66 && perceivedPotential <= 72) {
    recommendation = 'Önerilmez';
  } else {
    recommendation = 'Kararsız';
  }

  // Transfer Fee & Wage Estimates
  const baseFee = player.marketValue;
  const feeMargin = Math.round(baseFee * (0.15 + (100 - scout.judgingAbility) * 0.002));
  const estFeeMin = Math.max(100000, baseFee - feeMargin);
  const estFeeMax = baseFee + feeMargin;

  const baseWage = player.wage;
  const wageMargin = Math.round(baseWage * 0.15);
  const estWageMin = Math.max(1000, baseWage - wageMargin);
  const estWageMax = baseWage + wageMargin;

  // Knowledge Level based on assignment duration
  const knowledgeLevel: KnowledgeLevel = durationDays >= 30 ? 4 : durationDays >= 14 ? 3 : 2;

  // Summary Notes
  const summaryNotes = `${scout.firstName} ${scout.lastName} gözlem notu: ${player.firstName} ${player.lastName} (${player.position}) için ${durationDays} günlük inceleme tamamlandı. Rapor güven seviyesi %${confidence}. ${
    recommendation === 'Kesinlikle Önerilir'
      ? 'Takım kalitesini anında yukarı çekecek birinci sınıf bir hedef.'
      : recommendation === 'Önerilir'
      ? 'Kadro derinliği ve pozisyon kalitesi için güçlü bir takviye.'
      : recommendation === 'Takip Edilmeli'
      ? 'Gelişimi periyodik olarak izlenmeli, piyasa şartlarına göre hamle yapılmalı.'
      : 'Mevcut şartlarda öncelikli transfer hedefleri arasında yer almamalıdır.'
  }`;

  return {
    id: `rep-${Date.now()}-${player.id}`,
    scoutId: scout.id,
    scoutName: `${scout.firstName} ${scout.lastName}`,
    playerId: player.id,
    playerName: `${player.firstName} ${player.lastName}`,
    date: currentDate,
    knowledgeLevel,
    confidence,
    estimatedOverallMin: estOvrMin,
    estimatedOverallMax: estOvrMax,
    estimatedPotentialMin: estPotMin,
    estimatedPotentialMax: estPotMax,
    bestPosition: player.position,
    strengths,
    weaknesses,
    tacticalFit,
    personalityHint: hiddenProfile ? hiddenProfile.personality : 'Gözlem aşamasında',
    consistencyHint: hiddenProfile ? getConsistencyDescription(hiddenProfile.consistency) : 'Gözlem aşamasında',
    injuryTendencyHint: hiddenProfile ? getInjuryTendencyDescription(hiddenProfile.injuryTendency) : 'Ortalama',
    estimatedTransferFeeMin: estFeeMin,
    estimatedTransferFeeMax: estFeeMax,
    estimatedWageMin: estWageMin,
    estimatedWageMax: estWageMax,
    recommendation,
    summaryNotes,
  };
}
