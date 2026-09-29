import { SeasonStage, TransferWindowStatus } from './types';

const TURKISH_MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const TURKISH_DAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'
];

export function formatDateTurkish(dateString: string, includeDayName: boolean = true): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const month = TURKISH_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const dayName = TURKISH_DAYS[d.getDay()];

    return includeDayName ? `${day} ${month} ${year}, ${dayName}` : `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.getDate()} ${TURKISH_MONTHS[d.getMonth()].slice(0, 3)}`;
  } catch {
    return dateString;
  }
}

export function addDaysToDate(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function daysBetween(startDateStr: string, endDateStr: string): number {
  const d1 = new Date(startDateStr);
  const d2 = new Date(endDateStr);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getTransferWindowStatus(dateString: string): TransferWindowStatus {
  const d = new Date(dateString);
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  // Summer Window: June 15 to September 1
  if ((month === 6 && day >= 15) || month === 7 || month === 8 || (month === 9 && day === 1)) {
    return 'OPEN';
  }

  // Winter Window: January 1 to January 31
  if (month === 1) {
    return 'OPEN';
  }

  return 'CLOSED';
}

export function getSeasonStage(dateString: string, currentRound: number, totalRounds: number = 18): SeasonStage {
  if (currentRound >= totalRounds) {
    return 'SEASON_END';
  }

  const d = new Date(dateString);
  const month = d.getMonth() + 1;
  const day = d.getDate();

  // July to Aug 14: Pre-season
  if (month === 7 || (month === 8 && day < 15)) {
    return 'PRE_SEASON';
  }

  // Regular season
  return 'REGULAR_SEASON';
}
