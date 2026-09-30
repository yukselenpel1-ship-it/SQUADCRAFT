import { Club, Player, PlayerPosition } from '@/types/game';
import { getCachedDraftPlayerPool } from '../draft/playerPool';
import { daysBetween } from './calendar';

// ============================================================================
// CAREER MODE REALISTIC MARKET VALUE CALCULATION
// ============================================================================

export interface CareerMarketValueOptions {
  contractEndDate?: string;
  currentDate?: string;
  sellerClub?: Club;
  isTransferListed?: boolean;
}

/**
 * Calculates a realistic transfer market value for Career Mode.
 * Distinct from snake draft pick price (€250M budget).
 * Designed for authentic Career Mode finances (typical budgets €3M–€20M).
 */
export function calculateCareerMarketValue(
  player: Partial<Player>,
  options?: CareerMarketValueOptions
): number {
  const ovr = player.overall || 70;
  const pot = player.potential || ovr;
  const age = player.age || 24;
  const form = player.form ?? 7.0;
  const morale = player.morale ?? 80;

  // 1. Base market value tiered strictly for Career Mode economy
  let base = 1_000_000;
  if (ovr >= 89) {
    base = 32_000_000 + (ovr - 89) * 8_000_000;
  } else if (ovr >= 85) {
    base = 18_000_000 + (ovr - 85) * 3_500_000;
  } else if (ovr >= 80) {
    base = 9_000_000 + (ovr - 80) * 1_800_000;
  } else if (ovr >= 75) {
    base = 4_200_000 + (ovr - 75) * 960_000;
  } else if (ovr >= 70) {
    base = 1_800_000 + (ovr - 70) * 480_000;
  } else if (ovr >= 65) {
    base = 700_000 + (ovr - 65) * 220_000;
  } else if (ovr >= 60) {
    base = 250_000 + (ovr - 60) * 90_000;
  } else {
    base = Math.max(80_000, 100_000 + (ovr - 50) * 15_000);
  }

  let multiplier = 1.0;

  // 2. Potential & Age Multiplier (Wonderkid premium vs aging decline)
  const growthGap = Math.max(0, pot - ovr);
  if (age <= 20) {
    multiplier += 0.20 + (growthGap * 0.05); // High potential young wonderkid premium
  } else if (age <= 23) {
    multiplier += 0.10 + (growthGap * 0.03);
  } else if (age >= 34) {
    multiplier -= 0.50;
  } else if (age >= 32) {
    multiplier -= 0.35;
  } else if (age >= 30) {
    multiplier -= 0.15;
  }

  // 3. Contract Duration Multiplier (Expiring contract discount)
  const currentDate = options?.currentDate || '2026-08-01';
  const contractEndDate = options?.contractEndDate || player.contractEnd || '2028-06-30';
  const isFreeAgent = player.clubId === 'FREE_AGENT' || player.clubId === 'free-agent';

  if (!isFreeAgent && contractEndDate) {
    const daysLeft = daysBetween(currentDate, contractEndDate);
    if (daysLeft <= 180) {
      multiplier -= 0.40; // Final 6 months: huge discount
    } else if (daysLeft <= 365) {
      multiplier -= 0.22; // Final 12 months
    } else if (daysLeft >= 365 * 3) {
      multiplier += 0.12; // Long-term security
    }
  }

  // 4. Form & Unhappiness / Transfer Request
  if (form >= 7.8) multiplier += 0.12;
  else if (form <= 6.0) multiplier -= 0.10;

  if (player.isTransferListedByRequest || options?.isTransferListed || morale < 50) {
    multiplier -= 0.25; // Unhappy player is more accessible
  }

  // 5. Position Premium
  if (['ST', 'CF', 'AML', 'AMR'].includes(player.position || '')) {
    multiplier += 0.08; // Goalscorers premium
  } else if (player.position === 'GK') {
    multiplier -= 0.08;
  }

  const finalValue = Math.round((base * Math.max(0.25, multiplier)) / 25_000) * 25_000;
  return Math.max(50_000, finalValue);
}

// ============================================================================
// FICTIONAL NON-LEAGUE & REGIONAL CLUBS FOR EXTERNAL PLAYERS
// ============================================================================

export const EXTERNAL_CLUBS: { id: string; name: string; code: string; region: string; reputation: number }[] = [
  { id: 'ext-doruk-idman', name: 'Dorukkale İdman Yurdu', code: 'DIY', region: 'Alveria', reputation: 68 },
  { id: 'ext-kuzey-marmara', name: 'Kuzey Marmara SK', code: 'KMS', region: 'Alveria', reputation: 70 },
  { id: 'ext-toros-atletik', name: 'Toros Atletik', code: 'TAT', region: 'Alveria', reputation: 66 },
  { id: 'ext-enderun-genc', name: 'Enderun Gençlik', code: 'EGN', region: 'Alveria', reputation: 67 },
  { id: 'ext-balkan-yildiz', name: 'Balkan Yıldızı FK', code: 'BYF', region: 'Balkan', reputation: 74 },
  { id: 'ext-dinamo-zagreb', name: 'Dinamo Posavina SK', code: 'DPS', region: 'Balkan', reputation: 76 },
  { id: 'ext-adria-split', name: 'Adria Atletik', code: 'AAT', region: 'Balkan', reputation: 72 },
  { id: 'ext-rapid-vienna', name: 'Rapid Alveria SC', code: 'RAS', region: 'Western Europe', reputation: 75 },
  { id: 'ext-marseille-ath', name: 'Marseille Littoral FC', code: 'MLF', region: 'Western Europe', reputation: 79 },
  { id: 'ext-cologne-sport', name: 'Köln Rheinland SV', code: 'KRS', region: 'Western Europe', reputation: 78 },
  { id: 'ext-rotterdam-sp', name: 'Rotterdam Maas FK', code: 'RMF', region: 'Western Europe', reputation: 77 },
  { id: 'ext-iberia-real', name: 'Real Iberia CF', code: 'RIC', region: 'Southern Europe', reputation: 81 },
  { id: 'ext-porto-costa', name: 'Costa Porto FC', code: 'CPF', region: 'Southern Europe', reputation: 78 },
  { id: 'ext-milano-inter', name: 'Lombardia Dinamo', code: 'LDI', region: 'Southern Europe', reputation: 83 },
  { id: 'ext-nordic-glimt', name: 'Nordic Fjord FK', code: 'NFF', region: 'Northern Europe', reputation: 73 },
  { id: 'ext-stockholm-ik', name: 'Stockholm Idrott', code: 'SIK', region: 'Northern Europe', reputation: 72 },
  { id: 'ext-copenhagen-bk', name: 'Kobenhavn Boldklub', code: 'KBK', region: 'Northern Europe', reputation: 74 },
  { id: 'ext-warsaw-polonia', name: 'Polonia Mazovia', code: 'PMZ', region: 'Eastern Europe', reputation: 71 },
  { id: 'ext-prague-slavia', name: 'Bohemia Praha FK', code: 'BPF', region: 'Eastern Europe', reputation: 73 },
  { id: 'ext-athens-olymp', name: 'Olympias Aegea', code: 'OAE', region: 'Southern Europe', reputation: 72 },
];

/**
 * Builds the comprehensive 2,000-player Career Mode Universe.
 * - Distributes 25 players to each active league club
 * - Allocates ~200 players as authentic Free Agents (clubId: 'FREE_AGENT')
 * - Allocates remaining players to external/regional clubs
 * - Rebalances market values and contract lengths for realistic career management
 */
export function generateCareerPlayerUniverse(clubs: Club[]): Player[] {
  const masterPool = getCachedDraftPlayerPool();
  const result: Player[] = [];
  let poolIndex = 0;

  const positionsByOrder: PlayerPosition[] = [
    'GK', 'GK',
    'DC', 'DC', 'DC', 'DR', 'DL',
    'DMC', 'MC', 'MC', 'AMC', 'MR', 'ML',
    'ST', 'ST', 'AML', 'AMR',
    'GK', 'DC', 'DR', 'MC', 'ST', 'MC', 'DL', 'AML'
  ];

  // 1. Fill League Clubs (25 players each)
  for (const club of clubs) {
    for (let slot = 0; slot < 25; slot++) {
      if (poolIndex >= masterPool.length) break;
      const basePlayer = masterPool[poolIndex++];
      const targetPos = positionsByOrder[slot % positionsByOrder.length];

      // Contract duration: 1 to 4 years
      const contractYears = (poolIndex % 4) + 1;
      const contractEnd = `202${6 + contractYears}-06-30`;
      const isFinalYear = contractYears === 1;

      const realisticMarketValue = calculateCareerMarketValue(
        { ...basePlayer, position: targetPos },
        { contractEndDate: contractEnd, sellerClub: club, isTransferListed: isFinalYear && basePlayer.age > 29 }
      );

      const realisticWage = Math.round(
        (basePlayer.overall >= 82 ? 35000 + (basePlayer.overall - 82) * 5000 :
         basePlayer.overall >= 75 ? 18000 + (basePlayer.overall - 75) * 2200 :
         basePlayer.overall >= 68 ? 8000 + (basePlayer.overall - 68) * 1200 :
         3000 + (basePlayer.overall - 55) * 350) / 250
      ) * 250;

      result.push({
        ...basePlayer,
        clubId: club.id,
        position: targetPos,
        marketValue: realisticMarketValue,
        wage: realisticWage,
        contractStart: '2025-07-01',
        contractEnd,
        contractYearsLeft: contractYears,
        isTransferListedByRequest: isFinalYear && basePlayer.morale < 65,
        scoutingReport: {
          isFullyScouted: true,
          scoutedLevel: 100,
          estimatedOvrMin: basePlayer.overall,
          estimatedOvrMax: basePlayer.overall,
          estimatedPotMin: basePlayer.potential,
          estimatedPotMax: basePlayer.potential,
        },
      });
    }
  }

  // 2. Allocate ~200 Real Free Agents
  const freeAgentCount = 200;
  for (let f = 0; f < freeAgentCount && poolIndex < masterPool.length; f++) {
    const basePlayer = masterPool[poolIndex++];
    const prevClub = EXTERNAL_CLUBS[f % EXTERNAL_CLUBS.length];

    const realisticMarketValue = calculateCareerMarketValue(basePlayer, {
      contractEndDate: '2026-06-30',
    });

    const realisticWage = Math.round(
      (basePlayer.overall >= 80 ? 25000 + (basePlayer.overall - 80) * 3000 :
       basePlayer.overall >= 74 ? 12000 + (basePlayer.overall - 74) * 1500 :
       basePlayer.overall >= 67 ? 5000 + (basePlayer.overall - 67) * 900 :
       2200 + (basePlayer.overall - 55) * 200) / 250
    ) * 250;

    result.push({
      ...basePlayer,
      clubId: 'FREE_AGENT',
      marketValue: realisticMarketValue,
      wage: realisticWage,
      contractStart: '2024-07-01',
      contractEnd: '2026-06-30',
      contractYearsLeft: 0,
      previousClubName: prevClub.name,
      isTransferListedByRequest: false,
      scoutingReport: {
        isFullyScouted: false,
        scoutedLevel: 55,
        estimatedOvrMin: Math.max(50, basePlayer.overall - 3),
        estimatedOvrMax: Math.min(94, basePlayer.overall + 3),
        estimatedPotMin: Math.max(50, basePlayer.potential - 4),
        estimatedPotMax: Math.min(94, basePlayer.potential + 4),
      },
    });
  }

  // 3. Allocate Remaining Players to External Regional Clubs
  let extClubIndex = 0;
  while (poolIndex < masterPool.length) {
    const basePlayer = masterPool[poolIndex++];
    const extClub = EXTERNAL_CLUBS[extClubIndex % EXTERNAL_CLUBS.length];
    extClubIndex++;

    const contractYears = (poolIndex % 4) + 1;
    const contractEnd = `202${6 + contractYears}-06-30`;
    const isFinalYear = contractYears === 1;

    const realisticMarketValue = calculateCareerMarketValue(basePlayer, {
      contractEndDate: contractEnd,
      isTransferListed: isFinalYear && Math.random() < 0.35,
    });

    const realisticWage = Math.round(
      (basePlayer.overall >= 80 ? 28000 + (basePlayer.overall - 80) * 3500 :
       basePlayer.overall >= 74 ? 14000 + (basePlayer.overall - 74) * 1800 :
       basePlayer.overall >= 68 ? 6500 + (basePlayer.overall - 68) * 1000 :
       2500 + (basePlayer.overall - 55) * 250) / 250
    ) * 250;

    result.push({
      ...basePlayer,
      clubId: extClub.id,
      marketValue: realisticMarketValue,
      wage: realisticWage,
      contractStart: '2025-07-01',
      contractEnd,
      contractYearsLeft: contractYears,
      isTransferListedByRequest: isFinalYear && Math.random() < 0.25,
      scoutingReport: {
        isFullyScouted: false,
        scoutedLevel: 35,
        estimatedOvrMin: Math.max(50, basePlayer.overall - 4),
        estimatedOvrMax: Math.min(94, basePlayer.overall + 4),
        estimatedPotMin: Math.max(50, basePlayer.potential - 5),
        estimatedPotMax: Math.min(94, basePlayer.potential + 5),
      },
    });
  }

  return result;
}
