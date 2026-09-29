import { Club } from '@/types/game';
import { YouthAcademyFacility } from './types';

/**
 * Initializes default youth academy facility settings for a club.
 */
export function initializeClubAcademy(club: Club, seasonYear: string = '2026/27'): YouthAcademyFacility {
  const rep = club.reputation || 75;
  const academyLevel = Math.min(10, Math.max(2, Math.round(rep / 10)));
  const youthCoachingQuality = Math.min(95, Math.max(30, Math.round(rep * 0.95)));
  const youthRecruitmentNetwork = Math.min(95, Math.max(25, Math.round(rep * 0.90)));
  const academyBudgetAnnual = Math.round(club.balance * 0.05);

  const currYear = parseInt(seasonYear.split(/[-/]/)[0], 10) || 2026;
  const nextIntakeDate = `${currYear + 1}-03-15`; // Next March 15th

  return {
    clubId: club.id,
    academyLevel,
    youthCoachingQuality,
    youthRecruitmentNetwork,
    academyBudgetAnnual,
    nextIntakeDate,
    intakeHistory: [],
  };
}

/**
 * Calculates academy upgrade costs.
 */
export function getAcademyUpgradeCost(currentLevel: number): number {
  return currentLevel * 1500000;
}

export const getFacilityUpgradeCost = getAcademyUpgradeCost;

/**
 * Upgrades a specific academy facility metric.
 */
export function upgradeAcademyFacility(
  facility: YouthAcademyFacility,
  clubBalance: number,
  facilityType: 'academyLevel' | 'youthCoachingQuality' | 'youthRecruitmentNetwork'
): { success: boolean; message: string; cost: number; updatedFacility: YouthAcademyFacility } {
  let cost = 0;
  const updated = { ...facility };

  if (facilityType === 'academyLevel') {
    if (facility.academyLevel >= 10) {
      return { success: false, message: 'Akademi tesis seviyesi zaten maksimum düzeyde (10).', cost: 0, updatedFacility: facility };
    }
    cost = getFacilityUpgradeCost(facility.academyLevel);
    if (clubBalance < cost) {
      return { success: false, message: 'Akademi tesisini yükseltmek için kulüp kasasında yeterli bütçe yok.', cost, updatedFacility: facility };
    }
    updated.academyLevel += 1;
    return {
      success: true,
      message: `Akademi tesisleri Seviye ${updated.academyLevel}'e yükseltildi. Genç oyuncuların gelişim hızı arttı.`,
      cost,
      updatedFacility: updated,
    };
  }

  if (facilityType === 'youthCoachingQuality') {
    if (facility.youthCoachingQuality >= 100) {
      return { success: false, message: 'Altyapı antrenör kalitesi zaten zirvede (%100).', cost: 0, updatedFacility: facility };
    }
    cost = Math.round(facility.youthCoachingQuality * 15_000);
    if (clubBalance < cost) {
      return { success: false, message: 'Antrenör eğitimi için kulüp kasasında yeterli bütçe yok.', cost, updatedFacility: facility };
    }
    updated.youthCoachingQuality = Math.min(100, updated.youthCoachingQuality + 5);
    return {
      success: true,
      message: `Altyapı antrenör kadrosu seminer ve eğitimlerle geliştirildi (%${updated.youthCoachingQuality}).`,
      cost,
      updatedFacility: updated,
    };
  }

  if (facilityType === 'youthRecruitmentNetwork') {
    if (facility.youthRecruitmentNetwork >= 100) {
      return { success: false, message: 'Yetenek tarama ağı zaten maksimum kapsamda (%100).', cost: 0, updatedFacility: facility };
    }
    cost = Math.round(facility.youthRecruitmentNetwork * 12_000);
    if (clubBalance < cost) {
      return { success: false, message: 'Tarama ağını genişletmek için yeterli bütçe yok.', cost, updatedFacility: facility };
    }
    updated.youthRecruitmentNetwork = Math.min(100, updated.youthRecruitmentNetwork + 5);
    return {
      success: true,
      message: `Yetenek tarama ağı yeni bölgeleri kapsayacak şekilde genişletildi (%${updated.youthRecruitmentNetwork}).`,
      cost,
      updatedFacility: updated,
    };
  }

  return { success: false, message: 'Geçersiz tesis geliştirme türü.', cost: 0, updatedFacility: facility };
}
