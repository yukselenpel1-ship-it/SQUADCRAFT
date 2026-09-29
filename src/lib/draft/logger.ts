import { APP_VERSION } from '../version';
import {
  MultiplayerActionLog,
  MultiplayerActionType,
  MultiplayerErrorCode,
  ERROR_MESSAGES,
  AlphaBugReport,
} from './types';

const LOGS_STORAGE_KEY = 'squadcraft_draft_action_logs';
const BUG_REPORTS_STORAGE_KEY = 'squadcraft_alpha_bug_reports';
const MAX_STORED_LOGS = 100;

const memoryLogs: MultiplayerActionLog[] = [];
const memoryBugReports: AlphaBugReport[] = [];

/**
 * Formats a user-friendly error with human-readable Turkish message and structured error ID.
 */
export function formatMultiplayerError(
  code: MultiplayerErrorCode,
  customDetails?: string
): { code: MultiplayerErrorCode; message: string } {
  const baseMessage = ERROR_MESSAGES[code] || 'Bilinmeyen bir çok oyunculu hatası oluştu.';
  const message = customDetails ? `[${code}] ${baseMessage} (${customDetails})` : `[${code}] ${baseMessage}`;
  return { code, message };
}

/**
 * Records a structured multiplayer action in memory and persistent storage.
 */
export function logMultiplayerAction(
  action: MultiplayerActionType,
  roomId: string,
  sessionId: string,
  previousStateVersion: number,
  resultingStateVersion: number,
  success: boolean,
  errorCode?: MultiplayerErrorCode,
  details?: Record<string, unknown>
): MultiplayerActionLog {
  const log: MultiplayerActionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    roomId,
    sessionId,
    action,
    previousStateVersion,
    resultingStateVersion,
    success,
    errorCode,
    errorMessage: errorCode ? ERROR_MESSAGES[errorCode] : undefined,
    details,
  };

  memoryLogs.unshift(log);
  if (memoryLogs.length > MAX_STORED_LOGS) {
    memoryLogs.pop();
  }

  if (typeof window !== 'undefined') {
    try {
      const existing = getRecentActionLogs(50);
      const updated = [log, ...existing.filter((l) => l.id !== log.id)].slice(0, MAX_STORED_LOGS);
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota warnings
    }
  }

  return log;
}

/**
 * Retrieves the most recent multiplayer action logs.
 */
export function getRecentActionLogs(count: number = 20): MultiplayerActionLog[] {
  if (typeof window === 'undefined') return memoryLogs.slice(0, count);
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    const parsed: MultiplayerActionLog[] = raw ? JSON.parse(raw) : [];
    // Merge memory and parsed uniquely
    const map = new Map<string, MultiplayerActionLog>();
    memoryLogs.forEach((l) => map.set(l.id, l));
    parsed.forEach((l) => map.set(l.id, l));
    return Array.from(map.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  } catch {
    return memoryLogs.slice(0, count);
  }
}

/**
 * Submits a quick, screenshot-free bug report with auto-attached diagnostics.
 */
export function submitBugReport(
  errorType: string,
  description: string,
  currentRoute: string,
  gamePhase: string,
  roomCode?: string,
  stateVersion?: number
): AlphaBugReport {
  const browserType =
    typeof window !== 'undefined' && typeof navigator !== 'undefined'
      ? `${navigator.userAgent.slice(0, 80)} (${window.innerWidth}x${window.innerHeight})`
      : 'Server / Node Environment';

  const report: AlphaBugReport = {
    id: `bug-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    errorType,
    description: description.trim(),
    currentRoute,
    roomCode,
    gamePhase,
    appVersion: APP_VERSION,
    browserType,
    stateVersion,
    recentLogs: getRecentActionLogs(20),
    createdAt: new Date().toISOString(),
  };

  memoryBugReports.unshift(report);

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(BUG_REPORTS_STORAGE_KEY);
      const existing: AlphaBugReport[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(BUG_REPORTS_STORAGE_KEY, JSON.stringify([report, ...existing].slice(0, 50)));
    } catch {
      // Ignore storage errors
    }
  }

  return report;
}

/**
 * Retrieves all stored bug reports.
 */
export function getStoredBugReports(): AlphaBugReport[] {
  if (typeof window === 'undefined') return memoryBugReports;
  try {
    const raw = localStorage.getItem(BUG_REPORTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : memoryBugReports;
  } catch {
    return memoryBugReports;
  }
}
