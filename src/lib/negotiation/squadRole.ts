import { SquadRole } from './types';
import { Player, Club } from '@/types/game';

export interface SquadRoleInfo {
  role: SquadRole;
  label: string;
  description: string;
  expectedPlayingTime: string;
  wageMultiplier: number; // multiplier on base wage demand
  minOverallRecommended: number;
}

export const SQUAD_ROLES_INFO: Record<SquadRole, SquadRoleInfo> = {
  'Yıldız Oyuncu': {
    role: 'Yıldız Oyuncu',
    label: 'Yıldız Oyuncu',
    description: 'Takımın lideri ve vazgeçilmez kilit oyuncusu. Hemen her maçta sahada olması beklenir.',
    expectedPlayingTime: 'Tüm lig ve kupa maçlarında ilk 11',
    wageMultiplier: 1.30,
    minOverallRecommended: 78,
  },
  'Önemli Oyuncu': {
    role: 'Önemli Oyuncu',
    label: 'Önemli Oyuncu',
    description: 'İlk 11’in omurgasını oluşturan anahtar futbolcu. Taktiksel dinlenmeler dışında sahada yer alır.',
    expectedPlayingTime: 'Maçların en az %80’inde ilk 11',
    wageMultiplier: 1.15,
    minOverallRecommended: 74,
  },
  'İlk 11': {
    role: 'İlk 11',
    label: 'İlk 11 Oyuncusu',
    description: 'Düzenli olarak sahaya çıkan standart ilk 11 futbolcusu.',
    expectedPlayingTime: 'Maçların en az %65’inde ilk 11',
    wageMultiplier: 1.00,
    minOverallRecommended: 70,
  },
  'Rotasyon': {
    role: 'Rotasyon',
    label: 'Rotasyon Oyuncusu',
    description: 'Gerektiğinde ilk 11 başlayan, sıkça oyuna sonradan giren güvenilir kadro parçası.',
    expectedPlayingTime: 'İlk 11 veya sonradan oyuna giriş',
    wageMultiplier: 0.85,
    minOverallRecommended: 65,
  },
  'Yedek': {
    role: 'Yedek',
    label: 'Yedek Oyuncu',
    description: 'Sakatlık, ceza ve yoğun fikstür dönemlerinde göreve hazır yedek kulübesi futbolcusu.',
    expectedPlayingTime: 'Kupa maçları veya acil durumlar',
    wageMultiplier: 0.70,
    minOverallRecommended: 60,
  },
  'Gelecek Vadeden': {
    role: 'Gelecek Vadeden',
    label: 'Gelecek Vadeden Genç',
    description: 'Yüksek potansiyele sahip, gelişim sürecindeki genç yetenek.',
    expectedPlayingTime: 'Fırsat buldukça süre alma & kupa maçları',
    wageMultiplier: 0.75,
    minOverallRecommended: 55,
  },
  'Genç Oyuncu': {
    role: 'Genç Oyuncu',
    label: 'Genç Kadro Oyuncusu',
    description: 'Altyapı veya rezerv takımdan yeni yükselen, tecrübe kazanan genç oyuncu.',
    expectedPlayingTime: 'Antrenman odağı & seyrek süre',
    wageMultiplier: 0.55,
    minOverallRecommended: 50,
  },
};

export function getSquadRoleInfo(role: SquadRole): SquadRoleInfo {
  return SQUAD_ROLES_INFO[role] || SQUAD_ROLES_INFO['İlk 11'];
}

export function getDefaultSquadRole(player: Player, club?: Club): SquadRole {
  if (player.squadRole) return player.squadRole as SquadRole;
  
  if (player.age <= 19 && player.potential >= player.overall + 8) {
    return 'Gelecek Vadeden';
  }
  if (player.age <= 20) {
    return 'Genç Oyuncu';
  }
  if (player.overall >= 80) {
    return 'Yıldız Oyuncu';
  }
  if (player.overall >= 75) {
    return 'Önemli Oyuncu';
  }
  if (player.overall >= 70) {
    return 'İlk 11';
  }
  if (player.overall >= 64) {
    return 'Rotasyon';
  }
  return 'Yedek';
}
