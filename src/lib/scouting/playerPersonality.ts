import { Player } from '@/types/game';
import { PlayerHiddenProfile, PlayerPersonalityType } from './types';

const PERSONALITIES: PlayerPersonalityType[] = [
  'Profesyonel',
  'Hırslı',
  'Sadık',
  'Uyumlu',
  'Rekabetçi',
  'Rahat',
  'Dengesiz',
  'Takım Odaklı',
];

/**
 * Deterministically generates a hidden profile for a player based on id and attributes.
 */
export function generatePlayerHiddenProfile(player: Player): PlayerHiddenProfile {
  // Deterministic seed from player id
  let hash = 0;
  for (let i = 0; i < player.id.length; i++) {
    hash = (hash << 5) - hash + player.id.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Personality influenced slightly by composure, leadership, decisions
  const composure = player.attributes?.composure || 60;
  const leadership = player.attributes?.leadership || 50;
  const teamwork = player.attributes?.teamwork || 60;

  let personality: PlayerPersonalityType;
  if (composure >= 80 && teamwork >= 75) personality = 'Profesyonel';
  else if (leadership >= 75 && player.potential >= player.overall + 5) personality = 'Hırslı';
  else if (teamwork >= 80) personality = 'Takım Odaklı';
  else {
    personality = PERSONALITIES[absHash % PERSONALITIES.length];
  }

  // Consistency (1-100)
  const baseConsistency = 45 + (absHash % 45);
  const consistency = Math.min(99, Math.max(25, baseConsistency + Math.round((composure - 60) * 0.2)));

  // Big Match Temperament (1-100)
  const baseBigMatch = 40 + ((absHash >> 3) % 55);
  const bigMatchTemperament = Math.min(99, Math.max(25, baseBigMatch + Math.round((leadership - 50) * 0.3)));

  // Injury Tendency (1-100)
  const injuryTendency = 15 + ((absHash >> 5) % 65);

  return {
    playerId: player.id,
    personality,
    consistency,
    bigMatchTemperament,
    injuryTendency,
  };
}

/**
 * Generates qualitative scout description for consistency (does not reveal exact number).
 */
export function getConsistencyDescription(consistency: number): string {
  if (consistency >= 82) return 'Çok İstikrarlı (Haftadan haftaya formunu korur)';
  if (consistency >= 65) return 'İstikrarlı (Güvenilir performans grafiği)';
  if (consistency >= 45) return 'Dalgalı (Dönemsel form iniş çıkışları yaşayabilir)';
  return 'Çok Değişken (Performansı maçtan maça ciddi farklılık gösterir)';
}

/**
 * Generates qualitative scout description for big match temperament.
 */
export function getBigMatchDescription(bigMatch: number): string {
  if (bigMatch >= 80) return 'Büyük Maç Oyuncusu (Derbi ve finallerde ekstra motivasyon gösterir)';
  if (bigMatch >= 60) return 'Baskıya Dayanıklı (Kritik anlarda soğukkanlılığını korur)';
  if (bigMatch >= 40) return 'Standart (Büyük maçlarda olağan seviyesinde kalır)';
  return 'Baskı Altında Zorlanan (Yüksek stresli maçlarda tutuk kalabilir)';
}

/**
 * Generates qualitative scout description for injury tendency.
 */
export function getInjuryTendencyDescription(injuryTendency: number): string {
  if (injuryTendency <= 30) return 'Çok Dayanıklı (Sakatlık geçmişi temiz ve sağlam)';
  if (injuryTendency <= 55) return 'Normal (Ortalama sakatlık riski taşır)';
  if (injuryTendency <= 75) return 'Hassas (Kas sakatlıklarına yatkınlık görülebilir)';
  return 'Sakatlığa Yatkın (Yoğun fikstürde sık sık dinlendirilmesi gerekir)';
}
