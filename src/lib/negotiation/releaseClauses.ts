import { Player } from '@/types/game';

/**
 * Calculates a reasonable release / buyout clause for a player based on ability and market value.
 */
export function calculateRecommendedReleaseClause(player: Player): number {
  const baseValue = player.marketValue;
  if (player.age <= 21 && player.potential >= 80) {
    // High potential young player -> 2.5x - 3.5x buyout clause
    return Math.round((baseValue * 2.8) / 500000) * 500000;
  }
  if (player.overall >= 78) {
    return Math.round((baseValue * 2.2) / 500000) * 500000;
  }
  return Math.round((baseValue * 1.7) / 250000) * 250000;
}

/**
 * Evaluates whether an offered release clause is acceptable to the player and representative.
 */
export function isReleaseClauseAcceptable(
  player: Player,
  offeredReleaseClause?: number
): { isAcceptable: boolean; reason?: string } {
  if (!offeredReleaseClause || offeredReleaseClause <= 0) {
    // No release clause is completely acceptable (standard contract)
    return { isAcceptable: true };
  }

  const minAcceptableClause = player.marketValue * 1.15;
  const maxAcceptableClause = player.marketValue * 4.0;

  if (offeredReleaseClause < minAcceptableClause) {
    return {
      isAcceptable: false,
      reason: 'Serbest kalma maddesi piyasa değerine göre fazla düşük belirlendi.',
    };
  }

  if (offeredReleaseClause > maxAcceptableClause && player.overall >= 75) {
    return {
      isAcceptable: false,
      reason: 'Temsilci, oyuncunun önünü tıkayacak aşırı yüksek bir serbest kalma maddesini kabul etmiyor.',
    };
  }

  return { isAcceptable: true };
}
