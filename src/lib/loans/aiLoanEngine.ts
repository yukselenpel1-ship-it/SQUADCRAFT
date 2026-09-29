import { Player, Club, FinanceSummary } from '@/types/game';
import { LoanAgreement, LoanOfferPackage } from './types';
import { executeLoanAgreement } from './loanEngine';

/**
 * Evaluates whether an AI club should loan out a specific player.
 */
export function shouldAiLoanOutPlayer(player: Player, club: Club, allClubPlayers: Player[]): boolean {
  // Young player with potential but not high enough overall to start
  const samePosPlayers = allClubPlayers.filter(
    (p) => p.clubId === club.id && p.position === player.position
  );

  const isBetterStarterAvailable = samePosPlayers.some((p) => p.overall > player.overall + 3);

  if (player.age <= 22 && player.potential >= 75 && isBetterStarterAvailable) {
    return true; // Send out on loan for development
  }

  // Fringe surplus player
  if (player.overall <= 68 && samePosPlayers.length >= 3) {
    return true;
  }

  return false;
}

/**
 * Identifies reasonable loan targets for an AI club based on depth needs.
 */
export function findAiLoanTargets(
  aiClub: Club,
  allPlayers: Player[],
  allClubs: Club[]
): Player[] {
  const clubPlayers = allPlayers.filter((p) => p.clubId === aiClub.id);
  const loanableProspects = allPlayers.filter((p) => {
    if (p.clubId === aiClub.id || p.clubId === 'FREE_AGENT' || p.clubId === 'free-agent') {
      return false;
    }
    const parentClub = allClubs.find((c) => c.id === p.clubId);
    if (!parentClub) return false;
    return shouldAiLoanOutPlayer(p, parentClub, allPlayers);
  });

  // Filter to players matching club reputation and affordable wage
  return loanableProspects.filter(
    (p) => p.overall >= aiClub.reputation - 15 && p.overall <= aiClub.reputation + 2 && p.wage <= (aiClub.wageBudget || 200000) * 0.15
  ).slice(0, 5);
}

/**
 * Convenience helper to find AI loan candidates across a club or player pool.
 */
export function findAiLoanCandidates(
  allPlayers: Player[],
  clubId?: string
): Player[] {
  return allPlayers.filter((p) => {
    if (clubId && p.clubId !== clubId) return false;
    if (p.clubId === 'FREE_AGENT' || p.clubId === 'free-agent') return false;
    return p.age <= 24 && p.overall <= 75;
  });
}
