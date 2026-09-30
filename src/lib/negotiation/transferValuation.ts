import { Player, Club } from '@/types/game';
import { PlayerTransferValuation, PlayerInterestDetails, PlayerInterestLevel } from './types';
import { getPlayerAgent } from './agentLogic';
import { daysBetween, getTransferWindowStatus } from '../career/calendar';
import { calculateCareerMarketValue } from '../career/careerUniverse';

/**
 * Calculates a player's genuine interest in joining a specific buyer club.
 */
export function calculatePlayerInterest(
  player: Player,
  sellerClub?: Club,
  buyerClub?: Club,
  currentDate: string = '2026-08-01'
): PlayerInterestDetails {
  // If player is a free agent or listed by transfer request
  const reasons: string[] = [];
  let score = 50; // Neutral baseline

  // 1. Club Reputation Comparison
  const sellerRep = sellerClub?.reputation || 50;
  const buyerRep = buyerClub?.reputation || 70;
  const repDiff = buyerRep - sellerRep;

  if (repDiff >= 15) {
    score += 25;
    reasons.push(`${buyerClub?.name || 'Kulübün'} yüksek itibarı ve şampiyonluk hedefleri oyuncuyu cezbediyor.`);
  } else if (repDiff >= 5) {
    score += 12;
    reasons.push('Daha üst sıralara oynayan bir kulüpte forma giymek istiyor.');
  } else if (repDiff <= -15) {
    score -= 30;
    reasons.push('Daha düşük profilli bir kulübe gitmek kariyer hedefleriyle uyuşmuyor.');
  } else if (repDiff <= -5) {
    score -= 12;
    reasons.push('Mevcut kulübünden ayrılmak için güçlü bir sportif neden görmüyor.');
  }

  // 2. Player Morale & Transfer Request
  if (player.isTransferListedByRequest) {
    score += 35;
    reasons.push('Oyuncu kulübünden ayrılmak için resmi transfer talebinde bulunmuş durumda.');
  } else if (player.morale <= 50) {
    score += 15;
    reasons.push('Mevcut takımındaki huzursuzluk nedeniyle yeni bir başlangıca sıcak bakıyor.');
  }

  // 3. Contract Situation
  const contractEndDate = player.contractEnd || ((player as any).contractUntil ? `${(player as any).contractUntil}-06-30` : '2028-06-30');
  const daysLeft = daysBetween(currentDate, contractEndDate);
  if (daysLeft <= 180) {
    score += 20;
    reasons.push('Sözleşmesinin sonuna yaklaştığı için yeni teklifleri değerlendirmek istiyor.');
  }

  // 4. Age & Career Ambition
  if (player.age >= 32) {
    score += 10;
    reasons.push('Kariyerinin son döneminde iyi bir sözleşme ve yeni bir macera arayışında.');
  } else if (player.age <= 22 && player.potential >= 82 && buyerRep >= 78) {
    score += 15;
    reasons.push('Büyük kulüplerde gelişimini sürdürme hedefinde.');
  }

  // Clamp score
  score = Math.min(100, Math.max(0, score));

  let level: PlayerInterestLevel;
  if (score >= 80) level = 'Çok İlgili';
  else if (score >= 60) level = 'İlgili';
  else if (score >= 40) level = 'Kararsız';
  else if (score >= 20) level = 'İsteksiz';
  else level = 'İlgilenmiyor';

  if (reasons.length === 0) {
    reasons.push('Oyuncu teklifi profesyonel şartlar çerçevesinde değerlendirmeye açık.');
  }

  return {
    level,
    score,
    reasons,
  };
}

/**
 * Calculates selling club's valuation and minimum acceptable price.
 */
export function calculatePlayerValuation(
  player: Player,
  sellerClub?: Club,
  buyerClubOrDate?: Club | string,
  maybeDate?: string
): PlayerTransferValuation {
  let buyerClub: Club | undefined = undefined;
  let currentDate = '2026-08-01';

  if (typeof buyerClubOrDate === 'string') {
    currentDate = buyerClubOrDate;
  } else if (buyerClubOrDate) {
    buyerClub = buyerClubOrDate;
    if (maybeDate) {
      currentDate = maybeDate;
    }
  }

  const baseValue = player.marketValue || calculateCareerMarketValue(player, { contractEndDate: player.contractEnd, currentDate, sellerClub });
  let multiplier = 1.0;
  const reasons: string[] = [];

  // Free agent case
  if (!sellerClub || player.clubId === 'free-agent' || player.clubId === 'FREE_AGENT') {
    const agent = getPlayerAgent(player);
    const interest = calculatePlayerInterest(player, undefined, buyerClub, currentDate);
    return {
      marketValue: baseValue,
      fairValue: 0,
      estimatedMinFee: 0,
      estimatedMaxFee: 0,
      isNotForSale: false,
      clubStance: 'Serbest Oyuncu',
      stanceReason: 'Oyuncunun herhangi bir kulüple sözleşmesi bulunmamaktadır. Bonservis ödenmeyecektir.',
      agent,
      interest,
    };
  }

  // 1. Age & Potential Premium
  if (player.age <= 21 && player.potential >= player.overall + 6) {
    multiplier += 0.35;
    reasons.push('Genç yaşta yüksek potansiyeli nedeniyle kulüp oyuncuya yüksek değer biçiyor.');
  } else if (player.age <= 24 && player.overall >= 75) {
    multiplier += 0.20;
    reasons.push('Gelişim çağındaki ilk 11 oyuncusu için kulüp prim talep ediyor.');
  } else if (player.age >= 33) {
    multiplier -= 0.25;
    reasons.push('İlerleyen yaşı nedeniyle kulüp makul tekliflere açık.');
  }

  // 2. Contract Length Remaining
  const contractEndDate = player.contractEnd || ((player as any).contractUntil ? `${(player as any).contractUntil}-06-30` : '2028-06-30');
  const daysRemaining = daysBetween(currentDate, contractEndDate);
  if (daysRemaining <= 180) {
    multiplier -= 0.35;
    reasons.push('Sözleşmesinin bitmesine 6 aydan az kaldığı için kulüp bedelsiz kaybetmekten çekiniyor.');
  } else if (daysRemaining <= 365) {
    multiplier -= 0.15;
    reasons.push('Sözleşme süresi 1 yılın altına indiği için kulüp satışa daha ılımlı yaklaşıyor.');
  } else if (daysRemaining >= 365 * 3) {
    multiplier += 0.15;
    reasons.push('Uzun süreli sözleşmesi kulübün pazarlık elini güçlendiriyor.');
  }

  // 3. Player Form & Morale
  if (player.form >= 7.8) {
    multiplier += 0.15;
    reasons.push('Son maçlardaki yüksek formu değerini artırıyor.');
  } else if (player.form <= 5.8) {
    multiplier -= 0.10;
    reasons.push('Form düşüklüğü nedeniyle kulüp alternatif arayışında.');
  }

  if (player.isTransferListedByRequest) {
    multiplier -= 0.30;
    reasons.push('Oyuncunun takımdan ayrılma isteği kulübün direncini düşürmüş durumda.');
  }

  // 4. Seller Club Financial Health & Reputation
  if (sellerClub.balance < 5000000) {
    multiplier -= 0.15;
    reasons.push('Satıcı kulübün nakit ihtiyacı transferi kolaylaştırabilir.');
  } else if (sellerClub.balance > 30000000 && sellerClub.reputation >= 82) {
    multiplier += 0.20;
    reasons.push('Mali açıdan son derece güçlü olan kulüp ucuza oyuncu bırakmak istemiyor.');
  }

  // 5. Transfer Window Urgency (Deadline Day)
  const windowStatus = getTransferWindowStatus(currentDate);
  const isDeadlinePeriod = currentDate.endsWith('-09-01') || currentDate.endsWith('-01-31');
  if (isDeadlinePeriod) {
    multiplier += 0.15;
    reasons.push('Transferin son gününde oyuncunun yerini doldurmanın zorluğu nedeniyle ek prim isteniyor.');
  }

  // Floor and ceiling
  multiplier = Math.max(0.40, multiplier);

  const fairValue = Math.round((baseValue * multiplier) / 50000) * 50000;
  const minAcceptableFee = Math.round((fairValue * 0.88) / 50000) * 50000;
  const initialAskingFee = Math.round((fairValue * 1.25) / 50000) * 50000;

  // Indispensable / Not For Sale Check
  const isStarPlayer = player.overall >= 80 && sellerClub.reputation >= 80 && daysRemaining > 365;
  const isNotForSale = isStarPlayer && !player.isTransferListedByRequest && sellerClub.balance > 15000000;

  let clubStance: PlayerTransferValuation['clubStance'] = 'Dengeli';
  if (isNotForSale) {
    clubStance = 'Pazarlığa Kapalı';
  } else if (daysRemaining <= 180) {
    clubStance = 'Sözleşme Bitiyor';
  } else if (multiplier <= 0.80 || player.isTransferListedByRequest) {
    clubStance = 'Satışa Açık';
  } else if (multiplier >= 1.30) {
    clubStance = 'Zorlu';
  }

  const stanceReason = reasons[0] || 'Kulüp oyuncusu için piyasa koşullarına uygun bir bedel bekliyor.';
  const agent = getPlayerAgent(player);
  const interest = calculatePlayerInterest(player, sellerClub, buyerClub, currentDate);

  return {
    marketValue: baseValue,
    fairValue,
    estimatedMinFee: minAcceptableFee,
    estimatedMaxFee: initialAskingFee,
    isNotForSale,
    clubStance,
    stanceReason,
    agent,
    interest,
  };
}
