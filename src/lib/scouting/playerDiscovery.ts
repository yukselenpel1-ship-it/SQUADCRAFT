import { Player, Club } from '@/types/game';
import { ScoutingKnowledgeRecord, ScoutingRegionId, Scout } from './types';

/**
 * Determines whether a player is initially discovered by the user club.
 * High reputation clubs and same league players are always discovered.
 * Obscure lower-reputation free agents in remote areas might start undiscovered.
 */
export function isPlayerDiscovered(
  player: Player,
  clubs: Club[],
  knowledgeMap: Record<string, ScoutingKnowledgeRecord>,
  userClubId: string
): boolean {
  // 1. User's own players are always discovered
  if (player.clubId === userClubId) return true;

  // 2. Existing knowledge record
  const knowledge = knowledgeMap[player.id];
  if (knowledge && knowledge.isDiscovered) return true;

  // 3. Players in the top league (Alveria Elit Ligi) are naturally visible
  const club = clubs.find((c) => c.id === player.clubId);
  if (club) return true;

  // 4. Free agents with market value > €500K are visible
  if (player.marketValue >= 500000) return true;

  return false;
}

/**
 * Discovers unrevealed players in a region when a regional scouting assignment is conducted.
 */
export function discoverRegionalPlayers(
  scout: Scout,
  regionId: ScoutingRegionId,
  allPlayers: Player[],
  knowledgeMap: Record<string, ScoutingKnowledgeRecord>,
  userClubId: string
): { discoveredPlayers: Player[]; updatedKnowledgeMap: Record<string, ScoutingKnowledgeRecord> } {
  const updatedKnowledgeMap = { ...knowledgeMap };
  const discoveredPlayers: Player[] = [];

  for (const p of allPlayers) {
    if (p.clubId === userClubId) continue;

    if (!updatedKnowledgeMap[p.id] || !updatedKnowledgeMap[p.id].isDiscovered) {
      updatedKnowledgeMap[p.id] = {
        userClubId,
        playerId: p.id,
        knowledgeLevel: 1,
        percentage: 20,
        lastObservedDate: 'Bölgesel Tarama',
        isDiscovered: true,
      };
      discoveredPlayers.push(p);
    }
  }

  return { discoveredPlayers, updatedKnowledgeMap };
}
