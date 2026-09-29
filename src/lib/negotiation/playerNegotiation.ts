import { Player, Club } from '@/types/game';
import {
  ContractOfferPackage,
  PlayerNegotiationResponse,
  PlayerNegotiationStatus,
} from './types';
import { calculatePlayerInterest } from './transferValuation';
import { calculatePlayerContractDemands } from './contractValuation';
import { getPlayerAgent } from './agentLogic';
import { getSquadRoleInfo } from './squadRole';
import { isReleaseClauseAcceptable } from './releaseClauses';

/**
 * Evaluates contract package offered by user to player and agent.
 */
export function evaluatePlayerContractOffer(
  player: Player,
  buyerClub: Club,
  offer: ContractOfferPackage,
  currentPatience: number,
  currentDate: string,
  isRenewal: boolean = false
): PlayerNegotiationResponse {
  const agent = getPlayerAgent(player);
  const interest = calculatePlayerInterest(
    player,
    isRenewal ? buyerClub : undefined,
    buyerClub,
    currentDate
  );

  // 1. Check Interest (only if not contract renewal)
  if (!isRenewal && interest.level === 'İlgilenmiyor') {
    return {
      status: 'TERMINATED',
      feedbackMessage: `${player.firstName} ${player.lastName} ve temsilcisi ${agent.name}: "${buyerClub.name} kulübüne transfer olmak oyuncunun kariyer planlamasında yer almıyor."`,
      patienceRemaining: 0,
      cooldownDays: 21,
    };
  }

  // 2. Check Release Clause
  const clauseCheck = isReleaseClauseAcceptable(player, offer.releaseClause);
  if (!clauseCheck.isAcceptable) {
    return {
      status: 'REJECTED',
      feedbackMessage: `Temsilci ${agent.name}: "${clauseCheck.reason}"`,
      patienceRemaining: Math.max(1, currentPatience - 1),
    };
  }

  const demands = calculatePlayerContractDemands(player, buyerClub, offer.squadRole, isRenewal);
  const roleInfo = getSquadRoleInfo(offer.squadRole);

  // 3. Score the offer based on weights
  // Wage score (50% weight)
  const wageRatio = offer.wage / Math.max(1, demands.wage);
  
  // Signing bonus score (15% weight)
  const bonusRatio = (offer.signingBonus || 0) / Math.max(1, demands.signingBonus);

  // Role compatibility (20% weight)
  let roleScore = 1.0;
  if (player.overall >= 78 && ['Rotasyon', 'Yedek', 'Genç Oyuncu'].includes(offer.squadRole)) {
    roleScore = 0.50; // Insulted by bench role
  } else if (player.overall >= 74 && ['Yedek', 'Genç Oyuncu'].includes(offer.squadRole)) {
    roleScore = 0.60;
  }

  // Duration score (15% weight)
  const durationDiff = Math.abs(offer.durationYears - demands.durationYears);
  const durationScore = Math.max(0.6, 1.0 - durationDiff * 0.15);

  // Composite satisfaction score (0.0 to 1.5+)
  let satisfaction = (wageRatio * 0.50) + (bonusRatio * 0.15) + (roleScore * 0.20) + (durationScore * 0.15);

  // Agent Style Adjustments
  if (agent.style === 'Kolaycı') satisfaction += 0.10;
  else if (agent.style === 'Sert') satisfaction -= 0.10;
  else if (agent.style === 'Maksimum Kazanç Odaklı' && wageRatio < 1.0) satisfaction -= 0.15;

  // 4. Acceptance Check
  if (satisfaction >= 0.90 && wageRatio >= 0.85 && roleScore >= 0.8) {
    return {
      status: 'ACCEPTED',
      feedbackMessage: `${player.firstName} ${player.lastName} ve menajeri ${agent.name} sunulan sözleşme şartlarını memnuniyetle kabul etti.`,
      patienceRemaining: currentPatience,
    };
  }

  // 5. Counter-Offer Check (if offer is in realistic negotiation range)
  if (satisfaction >= 0.60 && currentPatience > 1) {
    // Generate counter-offer meeting in the middle
    const counterWage = Math.round(
      (Math.max(offer.wage, demands.wage * 0.85) + demands.wage) / 2 / 250
    ) * 250;

    const counterSigningBonus = Math.round(
      (Math.max(offer.signingBonus, demands.signingBonus * 0.7) + demands.signingBonus) / 2 / 1000
    ) * 1000;

    const counterOffer: ContractOfferPackage = {
      wage: counterWage,
      durationYears: demands.durationYears,
      squadRole: roleScore < 0.8 ? 'İlk 11' : offer.squadRole,
      signingBonus: counterSigningBonus,
      appearanceBonus: demands.appearanceBonus,
      goalBonus: demands.goalBonus,
      cleanSheetBonus: demands.cleanSheetBonus,
      releaseClause: demands.releaseClause,
    };

    let counterReason = `Maaş beklentimiz haftalık €${counterWage.toLocaleString('tr-TR')} seviyesindedir.`;
    if (roleScore < 0.8) {
      counterReason = `Oyuncu takımda daha kritik bir rol (${counterOffer.squadRole}) beklemektedir.`;
    }

    return {
      status: 'COUNTER_OFFER',
      feedbackMessage: `Temsilci ${agent.name}: "${counterReason} Şartlarımızı güncelleyerek karşı teklifimizi iletiyoruz."`,
      counterOffer,
      patienceRemaining: currentPatience - 1,
    };
  }

  // 6. Rejection / Termination Check
  const newPatience = currentPatience - 1;

  if (newPatience <= 0) {
    return {
      status: 'TERMINATED',
      feedbackMessage: `Temsilci ${agent.name}: "Sunduğunuz teklifler oyuncumun kalitesine ve piyasa değerine hakaret niteliğindedir. Görüşmeleri sonlandırıyoruz."`,
      patienceRemaining: 0,
      cooldownDays: 14,
    };
  }

  return {
    status: 'REJECTED',
    feedbackMessage: `Temsilci ${agent.name} teklifinizi reddetti. Haftalık en az €${demands.wage.toLocaleString('tr-TR')} maaş ve uygun bir imza parası talep ediyorlar.`,
    patienceRemaining: newPatience,
  };
}
