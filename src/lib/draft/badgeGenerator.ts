import { BadgeConfig, BadgeShape, BadgePattern, BadgeEmblem } from './types';

export const BADGE_SHAPES: { id: BadgeShape; label: string }[] = [
  { id: 'shield', label: 'Kalkan' },
  { id: 'circle', label: 'Daire' },
  { id: 'diamond', label: 'Baklava' },
  { id: 'hexagon', label: 'Altıgen' },
  { id: 'banner', label: 'Flama' },
];

export const BADGE_PATTERNS: { id: BadgePattern; label: string }[] = [
  { id: 'solid', label: 'Düz Renk' },
  { id: 'stripes_vertical', label: 'Dikey Çubuklu' },
  { id: 'stripes_horizontal', label: 'Yatay Çizgili' },
  { id: 'diagonal_half', label: 'Çapraz Bölmeli' },
  { id: 'cross', label: 'Haç / Artı' },
  { id: 'quartered', label: 'Dört Parçalı' },
];

export const BADGE_EMBLEMS: { id: BadgeEmblem; label: string }[] = [
  { id: 'star', label: 'Yıldız' },
  { id: 'crown', label: 'Taç' },
  { id: 'eagle_crest', label: 'Kartal Başı' },
  { id: 'lion_crest', label: 'Aslan Silueti' },
  { id: 'anchor', label: 'Çapa' },
  { id: 'torch', label: 'Meşale' },
  { id: 'lightning', label: 'Şimşek' },
  { id: 'initials', label: 'Harf Baş Harfleri' },
];

export const DEFAULT_COLORS = [
  '#dc2626', '#ea580c', '#d97706', '#ca8a04',
  '#16a34a', '#059669', '#0d9488', '#0284c7',
  '#2563eb', '#4f46e5', '#7c3aed', '#9333ea',
  '#c026d3', '#db2777', '#475569', '#0f172a',
  '#ffffff', '#f8fafc', '#fef08a', '#fed7aa'
];

/**
 * Creates a default badge config for a club.
 */
export function createDefaultBadgeConfig(
  primaryColor: string = '#1e3a8a',
  secondaryColor: string = '#38bdf8',
  shape: BadgeShape = 'shield',
  pattern: BadgePattern = 'stripes_vertical',
  emblem: BadgeEmblem = 'star'
): BadgeConfig {
  return {
    shape,
    pattern,
    emblem,
    primaryColor,
    secondaryColor,
    accentColor: '#ffffff',
  };
}

/**
 * Generates a randomized original badge configuration.
 */
export function generateRandomBadgeConfig(): BadgeConfig {
  const shape = BADGE_SHAPES[Math.floor(Math.random() * BADGE_SHAPES.length)].id;
  const pattern = BADGE_PATTERNS[Math.floor(Math.random() * BADGE_PATTERNS.length)].id;
  const emblem = BADGE_EMBLEMS[Math.floor(Math.random() * BADGE_EMBLEMS.length)].id;
  const pIdx = Math.floor(Math.random() * 16);
  const primaryColor = DEFAULT_COLORS[pIdx];
  const sIdx = (pIdx + 4 + Math.floor(Math.random() * 8)) % DEFAULT_COLORS.length;
  const secondaryColor = DEFAULT_COLORS[sIdx];

  return {
    shape,
    pattern,
    emblem,
    primaryColor,
    secondaryColor,
    accentColor: '#ffffff',
  };
}
