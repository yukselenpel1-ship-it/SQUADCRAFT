import { Player, PlayerAttributes } from '@/types/game';
import {
  KnowledgeLevel,
  MaskedAttributeRange,
  MaskedPlayerView,
  ScoutingKnowledgeRecord,
  ScoutingReport,
  PlayerHiddenProfile,
} from './types';
import { getPlayerKnowledge } from './scoutingKnowledge';
import {
  getConsistencyDescription,
  getInjuryTendencyDescription,
} from './playerPersonality';

/**
 * Deterministically generates a range for a single attribute based on knowledge level and player ID.
 */
export function maskAttribute(
  exactValue: number,
  knowledgeLevel: KnowledgeLevel,
  playerId: string,
  attrName: string,
  isPotential: boolean = false
): MaskedAttributeRange {
  // 1. Full Knowledge (Level 5) -> Exact integer
  if (knowledgeLevel >= 5) {
    return {
      min: exactValue,
      max: exactValue,
      exact: exactValue,
      isUnknown: false,
      displayString: `${exactValue}`,
    };
  }

  // 2. No Knowledge (Level 0) -> Question mark
  if (knowledgeLevel <= 0) {
    return {
      min: 1,
      max: 99,
      isUnknown: true,
      displayString: '?',
    };
  }

  // 3. Deterministic offset seed
  let hash = 0;
  const seed = `${playerId}-${attrName}-${knowledgeLevel}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Range half-width by knowledge level
  let halfWidth = 2;
  if (knowledgeLevel === 1) halfWidth = 14;
  else if (knowledgeLevel === 2) halfWidth = 8;
  else if (knowledgeLevel === 3) halfWidth = 4;
  else if (knowledgeLevel === 4) halfWidth = 2;

  if (isPotential) {
    halfWidth = Math.max(3, Math.round(halfWidth * 1.5));
  }

  // Offset center slightly to prevent range midpoint from always exposing exact value
  const offset = (absHash % (halfWidth + 1)) - Math.round(halfWidth / 2);
  const center = Math.min(99, Math.max(1, exactValue + offset));

  let min = Math.max(1, center - halfWidth);
  let max = Math.min(99, center + halfWidth);

  // Guarantee exactValue is contained in [min, max]
  if (exactValue < min) min = exactValue;
  if (exactValue > max) max = exactValue;

  return {
    min,
    max,
    isUnknown: false,
    displayString: `${min}–${max}`,
  };
}

/**
 * Creates the complete Masked Player View for the UI and Transfer/Scouting pages.
 */
export function getMaskedPlayerView(
  player: Player,
  userClubId: string,
  knowledgeMapOrLevel: Record<string, ScoutingKnowledgeRecord> | KnowledgeLevel = {},
  percentageOrHidden?: number | PlayerHiddenProfile,
  latestReportOrReport?: ScoutingReport,
  explicitHiddenProfile?: PlayerHiddenProfile
): MaskedPlayerView {
  const isOwnPlayer = player.clubId === userClubId;
  let lvl: KnowledgeLevel = 0;
  let pct: number = 0;
  let hiddenProfile: PlayerHiddenProfile | undefined;
  let latestReport: ScoutingReport | undefined;

  if (typeof knowledgeMapOrLevel === 'number') {
    lvl = isOwnPlayer ? 5 : knowledgeMapOrLevel;
    pct = isOwnPlayer ? 100 : typeof percentageOrHidden === 'number' ? percentageOrHidden : lvl * 20;
    latestReport = latestReportOrReport;
    hiddenProfile = explicitHiddenProfile || (typeof percentageOrHidden === 'object' ? percentageOrHidden : undefined);
  } else {
    const knowledge = isOwnPlayer
      ? { userClubId, playerId: player.id, knowledgeLevel: 5 as KnowledgeLevel, percentage: 100, lastObservedDate: 'Bugün', isDiscovered: true }
      : getPlayerKnowledge(knowledgeMapOrLevel, player, userClubId);
    lvl = knowledge.knowledgeLevel;
    pct = knowledge.percentage;
    hiddenProfile = typeof percentageOrHidden === 'object' ? percentageOrHidden : undefined;
    latestReport = latestReportOrReport;
  }

  // Mask Overall
  const maskedOverall = maskAttribute(player.overall, lvl, player.id, 'overall', false);
  const overallDisplay = lvl >= 5 ? `${player.overall}` : lvl === 0 ? '?' : `${maskedOverall.min}–${maskedOverall.max}`;

  // Mask Potential (always slightly wider uncertainty)
  const maskedPotential = maskAttribute(player.potential, lvl, player.id, 'potential', true);
  const potentialDisplay = lvl >= 5 ? `${player.potential}` : lvl === 0 ? '?' : `${maskedPotential.min}–${maskedPotential.max}`;

  // Mask Market Value
  let marketValueDisplay = `€${(player.marketValue / 1000000).toFixed(1)}M`;
  if (lvl === 0) {
    marketValueDisplay = 'Bilinmiyor';
  } else if (lvl <= 2) {
    const minVal = Math.max(0.1, (player.marketValue * 0.75) / 1000000).toFixed(1);
    const maxVal = ((player.marketValue * 1.35) / 1000000).toFixed(1);
    marketValueDisplay = `€${minVal}M – €${maxVal}M`;
  } else if (lvl <= 4) {
    const minVal = Math.max(0.1, (player.marketValue * 0.90) / 1000000).toFixed(1);
    const maxVal = ((player.marketValue * 1.15) / 1000000).toFixed(1);
    marketValueDisplay = `€${minVal}M – €${maxVal}M`;
  }

  // Mask Weekly Wage
  let wageDisplay = `€${player.wage.toLocaleString('tr-TR')}/hf`;
  if (lvl === 0) {
    wageDisplay = 'Bilinmiyor';
  } else if (lvl <= 2) {
    const minWage = Math.round((player.wage * 0.7) / 1000) * 1000;
    const maxWage = Math.round((player.wage * 1.3) / 1000) * 1000;
    wageDisplay = `€${minWage.toLocaleString('tr-TR')} – €${maxWage.toLocaleString('tr-TR')}/hf`;
  } else if (lvl <= 4) {
    const minWage = Math.round((player.wage * 0.9) / 500) * 500;
    const maxWage = Math.round((player.wage * 1.1) / 500) * 500;
    wageDisplay = `€${minWage.toLocaleString('tr-TR')} – €${maxWage.toLocaleString('tr-TR')}/hf`;
  }

  // Mask Individual Attributes
  const attributes: Record<keyof PlayerAttributes, MaskedAttributeRange> = {} as any;
  const rawAttrs = player.attributes || ({} as PlayerAttributes);

  for (const key of Object.keys(rawAttrs) as (keyof PlayerAttributes)[]) {
    attributes[key] = maskAttribute(rawAttrs[key] || 50, lvl, player.id, key, false);
  }

  // Personality hints reveal only with medium/high knowledge
  let personalityHint: string | undefined;
  let consistencyHint: string | undefined;
  let injuryHint: string | undefined;

  if (hiddenProfile && lvl >= 3) {
    personalityHint = hiddenProfile.personality;
    consistencyHint = getConsistencyDescription(hiddenProfile.consistency);
    injuryHint = getInjuryTendencyDescription(hiddenProfile.injuryTendency);
  }

  return {
    player,
    isOwnPlayer,
    knowledgeLevel: lvl,
    knowledgePercentage: pct,
    overallDisplay,
    potentialDisplay,
    marketValueDisplay,
    wageDisplay,
    attributes,
    personalityHint,
    consistencyHint,
    injuryHint,
    latestReport,
  };
}
