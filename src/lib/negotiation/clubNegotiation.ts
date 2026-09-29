import { Player, Club } from '@/types/game';
import {
  TransferOfferPackage,
  ClubNegotiationResponse,
  ClubNegotiationStatus,
} from './types';
import { calculatePlayerValuation } from './transferValuation';
import { calculateExpectedBonusValue } from './bonuses';

/**
 * Calculates the total effective valuation of an offer package from the selling club's perspective.
 */
export function calculateEffectivePackageValue(
  offer: TransferOfferPackage,
  buyerReputation: number = 75
): number {
  let effective = offer.upfrontFee;

  // Installments discounted slightly for time value (e.g. 90-95%)
  if (offer.installmentsFee > 0) {
    const discount = offer.installmentsMonths <= 12 ? 0.95 : 0.88;
    effective += offer.installmentsFee * discount;
  }

  // Bonuses discounted by expected achievement probability
  if (offer.bonuses && offer.bonuses.length > 0) {
    effective += calculateExpectedBonusValue(offer.bonuses, buyerReputation);
  }

  // Sell-on clause estimated value contribution
  if (offer.sellOnClause && offer.sellOnClause.percentage > 0) {
    const estimatedResale = Math.max(offer.upfrontFee * 1.3, 2000000);
    const clauseVal = (estimatedResale * (offer.sellOnClause.percentage / 100)) * 0.40;
    effective += Math.min(clauseVal, offer.upfrontFee * 0.25);
  }

  return Math.round(effective);
}

/**
 * Evaluates a transfer offer package submitted by the buyer club to the selling club.
 */
export function evaluateClubTransferOffer(
  player: Player,
  sellerClub: Club | undefined,
  buyerClub: Club,
  offer: TransferOfferPackage,
  currentPatience: number,
  currentDate: string
): ClubNegotiationResponse {
  // Free agent -> instantly accepted for 0 transfer fee
  if (!sellerClub || player.clubId === 'free-agent' || player.clubId === 'FREE_AGENT') {
    return {
      status: 'ACCEPTED',
      feedbackMessage: 'Oyuncu serbest statüde olduğu için kulüp bonservis pazarlığı gerekmemektedir.',
      patienceRemaining: currentPatience,
    };
  }

  const valuation = calculatePlayerValuation(player, sellerClub, buyerClub, currentDate);

  // 1. Not For Sale Check
  if (valuation.isNotForSale) {
    return {
      status: 'NOT_FOR_SALE',
      feedbackMessage: `${sellerClub.name} yönetimi: "${player.firstName} ${player.lastName} takımımızın omurgasını oluşturuyor ve hiçbir şartta satılık değildir."`,
      patienceRemaining: 0,
      cooldownDays: 21,
    };
  }

  const totalGuaranteed = offer.upfrontFee + (offer.installmentsFee || 0);
  const effectiveValue = calculateEffectivePackageValue(offer, buyerClub.reputation);
  const minAcceptable = valuation.estimatedMinFee;
  const initialAsking = valuation.estimatedMaxFee;

  // 2. Immediate Acceptance Condition
  // If effective value meets or exceeds minimum acceptable AND guaranteed fee is reasonable
  if (effectiveValue >= minAcceptable && totalGuaranteed >= minAcceptable * 0.85) {
    return {
      status: 'ACCEPTED',
      feedbackMessage: `${sellerClub.name} kulübü sunduğunuz €${totalGuaranteed.toLocaleString('tr-TR')} toplam değerli transfer teklifini resmi olarak kabul etti.`,
      patienceRemaining: currentPatience,
    };
  }

  // 3. Counter-Offer Condition (Offer is in realistic range, e.g. >= 65% of minimum acceptable)
  const isWithinNegotiationRange = effectiveValue >= minAcceptable * 0.65;

  if (isWithinNegotiationRange && currentPatience > 1) {
    // Generate counter-offer closing the gap by ~50%
    const counterGuaranteed = Math.round(
      (Math.max(offer.upfrontFee + offer.installmentsFee, minAcceptable * 0.8) + initialAsking) / 2 / 50000
    ) * 50000;

    const counterUpfront = Math.round((counterGuaranteed * 0.70) / 50000) * 50000;
    const counterInstallments = counterGuaranteed - counterUpfront;

    const counterOffer: TransferOfferPackage = {
      upfrontFee: counterUpfront,
      installmentsFee: counterInstallments,
      installmentsMonths: 12,
      bonuses: offer.bonuses || [],
      sellOnClause: offer.sellOnClause || { percentage: 10, isProfitOnly: true },
    };

    return {
      status: 'COUNTER_OFFER',
      feedbackMessage: `${sellerClub.name} yönetimi teklifinizi yetersiz buldu ancak pazarlığa devam etmek istiyor. Karşı teklif: Toplam €${counterGuaranteed.toLocaleString('tr-TR')}`,
      counterOffer,
      patienceRemaining: currentPatience - 1,
    };
  }

  // 4. Lowball / Rejected / Terminated Condition
  const newPatience = currentPatience - 1;

  if (newPatience <= 0) {
    return {
      status: 'TERMINATED',
      feedbackMessage: `${sellerClub.name} yönetimi: "Teklifleriniz piyasa gerçeklerinden ve beklentilerimizden çok uzak. Görüşmeleri sonlandırıyoruz."`,
      patienceRemaining: 0,
      cooldownDays: 14,
    };
  }

  return {
    status: 'REJECTED',
    feedbackMessage: `${sellerClub.name} kulübü teklifinizi kesin bir dille reddetti. Beklentileri en az €${minAcceptable.toLocaleString('tr-TR')} seviyesindedir.`,
    patienceRemaining: newPatience,
  };
}
