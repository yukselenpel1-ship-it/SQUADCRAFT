import { RoomMember } from './types';

const MULTIPLAYER_SESSION_KEY = 'squadcraft_mp_session_id';
const MULTIPLAYER_USERNAME_KEY = 'squadcraft_mp_username';

/**
 * Retrieves or initializes a persistent unique multiplayer session UUID for the browser.
 */
export function getMultiplayerSessionId(): string {
  if (typeof window === 'undefined') {
    return 'srv-session-' + Math.random().toString(36).substring(2, 9);
  }

  let sessionId = localStorage.getItem(MULTIPLAYER_SESSION_KEY);
  if (!sessionId) {
    sessionId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(MULTIPLAYER_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Retrieves stored user display name or fallback.
 */
export function getStoredMultiplayerUsername(): string {
  if (typeof window === 'undefined') return 'Menajer';
  return localStorage.getItem(MULTIPLAYER_USERNAME_KEY) || 'Menajer';
}

/**
 * Saves preferred user display name.
 */
export function setStoredMultiplayerUsername(name: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MULTIPLAYER_USERNAME_KEY, name.trim());
}

/**
 * Resolves room reconnect for a member.
 * If a member with this sessionId already exists in the room, reuses their slot.
 */
export function resolveMemberConnection(
  members: RoomMember[],
  sessionId: string,
  username: string,
  roomId: string,
  isHost: boolean = false,
  isSpectator: boolean = false
): { updatedMembers: RoomMember[]; currentMember: RoomMember } {
  const existingIndex = members.findIndex((m) => m.sessionId === sessionId);

  if (existingIndex >= 0) {
    // Reconnect existing member
    const existing = members[existingIndex];
    const updated: RoomMember = {
      ...existing,
      username: username || existing.username,
      isConnected: true,
      lastSeenAt: new Date().toISOString(),
    };
    const list = [...members];
    list[existingIndex] = updated;
    return { updatedMembers: list, currentMember: updated };
  }

  // New member joining
  const newMember: RoomMember = {
    id: `mem-${roomId}-${Math.random().toString(36).substring(2, 8)}`,
    roomId,
    sessionId,
    username: username || `Menajer ${members.length + 1}`,
    isHost: isHost || members.length === 0, // First member becomes host if no host
    isSpectator,
    isReady: false,
    isConnected: true,
    lastSeenAt: new Date().toISOString(),
    joinedAt: new Date().toISOString(),
  };

  return {
    updatedMembers: [...members, newMember],
    currentMember: newMember,
  };
}

/**
 * Migrates host authority to the next active manager if the current host disconnects.
 */
export function evaluateHostMigration(
  members: RoomMember[],
  hostGracePeriodSeconds: number = 15
): { members: RoomMember[]; hostMigrated: boolean; newHostId?: string } {
  const currentHost = members.find((m) => m.isHost);
  if (!currentHost) {
    // Find first non-spectator member to promote
    const nextCandidate = members.find((m) => !m.isSpectator && m.isConnected);
    if (nextCandidate) {
      const updated = members.map((m) => ({
        ...m,
        isHost: m.id === nextCandidate.id,
      }));
      return { members: updated, hostMigrated: true, newHostId: nextCandidate.id };
    }
    return { members, hostMigrated: false };
  }

  // If host is connected, no migration needed
  if (currentHost.isConnected) {
    return { members, hostMigrated: false };
  }

  // Check if host has been offline beyond grace period
  const lastSeenTime = new Date(currentHost.lastSeenAt).getTime();
  const now = Date.now();
  const isExpired = now - lastSeenTime > hostGracePeriodSeconds * 1000;

  if (isExpired) {
    const activeCandidates = members.filter((m) => !m.isSpectator && m.isConnected && m.id !== currentHost.id);
    if (activeCandidates.length > 0) {
      const newHost = activeCandidates[0];
      const updated = members.map((m) => ({
        ...m,
        isHost: m.id === newHost.id,
      }));
      return { members: updated, hostMigrated: true, newHostId: newHost.id };
    }
  }

  return { members, hostMigrated: false };
}
