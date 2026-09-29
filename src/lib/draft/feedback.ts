import { MultiplayerFeedback, FeedbackCategory } from './types';

const FEEDBACK_STORAGE_KEY = 'squadcraft_draft_feedback';

export function submitMultiplayerFeedback(
  category: FeedbackCategory,
  comment: string,
  sessionId: string,
  roomId?: string,
  route: string = '/draft'
): { success: boolean; feedback: MultiplayerFeedback } {
  const newFeedback: MultiplayerFeedback = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    roomId,
    sessionId,
    route,
    category,
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredFeedbackList();
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify([newFeedback, ...existing].slice(0, 50)));
    } catch (e) {
      console.warn('Feedback save warning:', e);
    }
  }

  return { success: true, feedback: newFeedback };
}

export function getStoredFeedbackList(): MultiplayerFeedback[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
