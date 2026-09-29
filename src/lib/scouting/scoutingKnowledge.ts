import { Player } from '@/types/game';
import { KnowledgeLevel, ScoutingKnowledgeRecord, Scout } from './types';

/**
 * Gets or initializes a player's scouting knowledge level for the user's club.
 */
export function getPlayerKnowledge(
  knowledgeMap: Record<string, ScoutingKnowledgeRecord>,
  player: Player,
  userClubId: string
): ScoutingKnowledgeRecord {
  // 1. User's own players ALWAYS have 100% full knowledge (Level 5)
  if (player.clubId === userClubId) {
    return {
      userClubId,
      playerId: player.id,
      knowledgeLevel: 5,
      percentage: 100,
      lastObservedDate: 'Bugün',
      isDiscovered: true,
    };
  }

  // 2. Existing record in knowledge map
  const existing = knowledgeMap[player.id];
  if (existing) {
    return existing;
  }

  // 3. Default baseline knowledge for other players in the same league
  // Players in same league start with Basic Knowledge (Level 2, 40%)
  const isSameLeague = player.clubId !== 'FREE_AGENT' && player.clubId !== 'free-agent';
  const initialLevel: KnowledgeLevel = isSameLeague ? 2 : 1;
  const initialPercentage = isSameLeague ? 40 : 20;

  return {
    userClubId,
    playerId: player.id,
    knowledgeLevel: initialLevel,
    percentage: initialPercentage,
    lastObservedDate: 'Sezon Başı',
    isDiscovered: true,
  };
}

/**
 * Increases knowledge level after completing a scouting assignment.
 */
export function applyScoutReportKnowledge(
  currentRecord: ScoutingKnowledgeRecord,
  scout: Scout,
  durationDays: number,
  currentDate: string
): ScoutingKnowledgeRecord {
  let targetLevel: KnowledgeLevel = 3;
  let targetPercentage = 60;

  if (durationDays >= 30 && scout.judgingAbility >= 75) {
    targetLevel = 5;
    targetPercentage = 100;
  } else if (durationDays >= 14 || scout.judgingAbility >= 70) {
    targetLevel = 4;
    targetPercentage = 85;
  } else if (durationDays >= 7) {
    targetLevel = 3;
    targetPercentage = 65;
  } else {
    targetLevel = Math.max(currentRecord.knowledgeLevel, 2) as KnowledgeLevel;
    targetPercentage = Math.max(currentRecord.percentage, 45);
  }

  return {
    ...currentRecord,
    knowledgeLevel: Math.max(currentRecord.knowledgeLevel, targetLevel) as KnowledgeLevel,
    percentage: Math.max(currentRecord.percentage, targetPercentage),
    lastObservedDate: currentDate,
    scoutedByScoutId: scout.id,
    isDiscovered: true,
  };
}

/**
 * Increases knowledge level slightly when playing a match against an opponent player.
 */
export function applyMatchObservationKnowledge(
  currentRecord: ScoutingKnowledgeRecord,
  currentDate: string
): ScoutingKnowledgeRecord {
  const newPercentage = Math.min(100, currentRecord.percentage + 15);
  let newLevel: KnowledgeLevel = currentRecord.knowledgeLevel;

  if (newPercentage >= 80) newLevel = 4;
  else if (newPercentage >= 60) newLevel = 3;
  else if (newPercentage >= 40) newLevel = 2;
  else newLevel = 1;

  return {
    ...currentRecord,
    percentage: newPercentage,
    knowledgeLevel: Math.max(currentRecord.knowledgeLevel, newLevel) as KnowledgeLevel,
    lastObservedDate: currentDate,
    isDiscovered: true,
  };
}

export const getScoutingKnowledge = getPlayerKnowledge;

