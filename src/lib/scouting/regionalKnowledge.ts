import { ScoutingRegion, ScoutingRegionId, Scout } from './types';

export const FICTIONAL_SCOUTING_REGIONS: ScoutingRegion[] = [
  {
    id: 'valeria-north',
    name: 'Valeria Kuzeyi',
    description: 'Kuzeyin sert iklimine sahip, fiziksel dayanıklılığı ve savunma disiplini yüksek oyuncular yetiştiren bölge.',
    descriptionTurkish: 'Fiziksel güç, kafa vuruşu, dayanıklılık ve markaj özellikleriyle öne çıkan savunmacılar.',
    talentDensity: 82,
    prominentAttributes: ['strength', 'stamina', 'heading', 'marking', 'tackling'],
  },
  {
    id: 'sorven-basin',
    name: 'Sorven Havzası',
    description: 'Teknik pas oyununun ve oyun zekasının gelişmiş olduğu köklü futbol havzası.',
    descriptionTurkish: 'Oyun görüşü (vizyon), pas kalitesi, soğukkanlılık ve karar verme becerileri gelişmiş orta sahalar.',
    talentDensity: 88,
    prominentAttributes: ['passing', 'vision', 'technique', 'decisions', 'composure'],
  },
  {
    id: 'eldoria-west',
    name: 'Eldoria Batısı',
    description: 'Hızlı tempolu, dinamik ve kanat akınlarına dayalı modern futbol kültürüyle bilinen bölge.',
    descriptionTurkish: 'Sürat, ivmelenme, top sürme (dribbling) ve orta açma yeteneği yüksek kanat oyuncuları.',
    talentDensity: 85,
    prominentAttributes: ['pace', 'acceleration', 'dribbling', 'crossing'],
  },
  {
    id: 'merovin-belt',
    name: 'Merovin Kuşağı',
    description: 'Bitiricilik ve ceza sahası etkinliği yüksek forvetlerin ve taktiksel disipline sahip oyuncuların coğrafyası.',
    descriptionTurkish: 'Bitiricilik, uzaktan şut, pozisyon alma ve soğukkanlı hücum oyuncuları.',
    talentDensity: 80,
    prominentAttributes: ['finishing', 'longShots', 'positioning', 'composure'],
  },
  {
    id: 'tarsen-isles',
    name: 'Tarsen Adaları',
    description: 'Yaratıcı yeteneklerin, akrobatik reflekslere sahip kalecilerin ve beklenmedik oyun kurucuların adası.',
    descriptionTurkish: 'Kaleci refleksleri, çeviklik, agresiflik ve teknik yetenekler.',
    talentDensity: 76,
    prominentAttributes: ['reflexes', 'handling', 'positioningGK', 'technique', 'aggression'],
  },
  {
    id: 'alveria-central',
    name: 'Alveria Merkez',
    description: 'Ligin ana metropol merkezi; dengeli, çok yönlü ve taktiksel olarak olgun futbolcu profili.',
    descriptionTurkish: 'Dengeli fiziksel, teknik ve zihinsel altyapıya sahip genel futbolcular.',
    talentDensity: 90,
    prominentAttributes: ['teamwork', 'leadership', 'passing', 'stamina'],
  },
];

export function getRegionById(regionId: ScoutingRegionId): ScoutingRegion {
  return (
    FICTIONAL_SCOUTING_REGIONS.find((r) => r.id === regionId) ||
    FICTIONAL_SCOUTING_REGIONS[0]
  );
}

export const SCOUTING_REGIONS = FICTIONAL_SCOUTING_REGIONS;

/**
 * Calculates a scout's effective quality in a specific region taking adaptability into account.
 */
export function getScoutEffectiveRegionalFamiliarity(
  scout: Scout,
  regionId: ScoutingRegionId
): number {
  const baseFamiliarity = scout.regionKnowledge[regionId] || 15;
  const adaptabilityBonus = Math.round(scout.adaptability * 0.35);
  return Math.min(100, Math.max(10, baseFamiliarity + adaptabilityBonus));
}
