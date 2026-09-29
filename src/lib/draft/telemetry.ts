import { MultiplayerTelemetryEvent } from './types';

const TELEMETRY_STORAGE_KEY = 'squadcraft_draft_telemetry';

export interface AggregateBalanceMetrics {
  totalMatches: number;
  averageGoalsPerMatch: number;
  homeWinRate: number; // percentage
  drawRate: number; // percentage
  awayWinRate: number; // percentage
  averageShotsPerMatch: number;
  averageXgPerMatch: number;
  totalPicks: number;
  autoPickRate: number; // percentage
  averagePickDurationSeconds: number;
  averageFirstPickOvr: number;
  topDraftedPositions: { position: string; count: number }[];
  mostUsedFormations: { formation: string; count: number; winRate: number }[];
}

const memoryEvents: MultiplayerTelemetryEvent[] = [];

export function recordTelemetryEvent(
  eventType: MultiplayerTelemetryEvent['eventType'],
  data: Record<string, unknown>,
  roomId?: string
): void {
  const event: MultiplayerTelemetryEvent = {
    id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    roomId,
    eventType,
    data,
    timestamp: new Date().toISOString(),
  };

  memoryEvents.push(event);

  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredTelemetry();
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify([event, ...existing].slice(0, 100)));
    } catch {
      // Ignore storage errors
    }
  }
}

export function getStoredTelemetry(): MultiplayerTelemetryEvent[] {
  if (typeof window === 'undefined') return memoryEvents;
  try {
    const raw = localStorage.getItem(TELEMETRY_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return [...memoryEvents, ...parsed];
  } catch {
    return memoryEvents;
  }
}

/**
 * Computes aggregate balance statistics for the dev balance dashboard.
 */
export function computeBalanceMetrics(): AggregateBalanceMetrics {
  const events = getStoredTelemetry();

  let totalMatches = 0;
  let totalGoals = 0;
  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  let totalShots = 0;
  let totalXg = 0;

  let totalPicks = 0;
  let autoPicks = 0;
  let totalPickDuration = 0;
  let firstPickOvrSum = 0;
  let firstPickCount = 0;

  const posCounts: Record<string, number> = {};
  const formationStats: Record<string, { count: number; wins: number }> = {};

  events.forEach((ev) => {
    if (ev.eventType === 'MATCH_SIMULATED') {
      totalMatches++;
      const hScore = Number(ev.data.homeScore || 0);
      const aScore = Number(ev.data.awayScore || 0);
      totalGoals += hScore + aScore;

      if (hScore > aScore) homeWins++;
      else if (hScore === aScore) draws++;
      else awayWins++;

      totalShots += Number(ev.data.totalShots || 22);
      totalXg += Number(ev.data.totalXg || 2.4);

      const hForm = String(ev.data.homeFormation || '4-3-3');
      const aForm = String(ev.data.awayFormation || '4-3-3');

      if (!formationStats[hForm]) formationStats[hForm] = { count: 0, wins: 0 };
      if (!formationStats[aForm]) formationStats[aForm] = { count: 0, wins: 0 };

      formationStats[hForm].count++;
      formationStats[aForm].count++;
      if (hScore > aScore) formationStats[hForm].wins++;
      if (aScore > hScore) formationStats[aForm].wins++;
    } else if (ev.eventType === 'DRAFT_PICK' || ev.eventType === 'AUTO_PICK') {
      totalPicks++;
      if (ev.data.isAutoPick) autoPicks++;
      totalPickDuration += Number(ev.data.timeTakenSeconds || 15);

      if (ev.data.round === 1) {
        firstPickOvrSum += Number(ev.data.playerOverall || 80);
        firstPickCount++;
      }

      const pos = String(ev.data.playerPosition || 'CM');
      posCounts[pos] = (posCounts[pos] || 0) + 1;
    }
  });

  // Defaults if low data
  const sampleMatches = Math.max(1, totalMatches);
  const samplePicks = Math.max(1, totalPicks);

  return {
    totalMatches,
    averageGoalsPerMatch: Number((totalGoals / sampleMatches).toFixed(2)),
    homeWinRate: Number(((homeWins / sampleMatches) * 100).toFixed(1)),
    drawRate: Number(((draws / sampleMatches) * 100).toFixed(1)),
    awayWinRate: Number(((awayWins / sampleMatches) * 100).toFixed(1)),
    averageShotsPerMatch: Number((totalShots / sampleMatches).toFixed(1)),
    averageXgPerMatch: Number((totalXg / sampleMatches).toFixed(2)),
    totalPicks,
    autoPickRate: Number(((autoPicks / samplePicks) * 100).toFixed(1)),
    averagePickDurationSeconds: Number((totalPickDuration / samplePicks).toFixed(1)),
    averageFirstPickOvr: Number((firstPickCount > 0 ? firstPickOvrSum / firstPickCount : 83.5).toFixed(1)),
    topDraftedPositions: Object.entries(posCounts)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    mostUsedFormations: Object.entries(formationStats)
      .map(([formation, d]) => ({
        formation,
        count: d.count,
        winRate: d.count > 0 ? Number(((d.wins / d.count) * 100).toFixed(1)) : 50,
      }))
      .sort((a, b) => b.count - a.count),
  };
}
