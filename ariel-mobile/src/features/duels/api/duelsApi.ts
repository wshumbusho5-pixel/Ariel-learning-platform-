import apiClient from '@/shared/api/client';
import { DUELS } from '@/shared/api/endpoints';
import type { DuelRoom } from '@/shared/types/duel';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface QuickMatchResponse {
  room_id: string;
}

export interface ChallengeResponse {
  room_id: string;
}

export interface JoinRoomResponse {
  room_id: string;
  status: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Find or create a quick-match duel room.
 * POST /api/duels/quick-match → { room_id }
 */
export async function quickMatch(rounds?: number): Promise<QuickMatchResponse> {
  const res = await apiClient.post<QuickMatchResponse>(DUELS.QUICK_MATCH, rounds ? { round_count: rounds } : undefined);
  return res.data;
}

/**
 * Send a duel challenge to a specific user.
 * POST /api/duels/challenge/{username} → { room_id }
 */
export async function challengeUser(username: string, rounds?: number): Promise<ChallengeResponse> {
  const res = await apiClient.post<ChallengeResponse>(DUELS.CHALLENGE(username), rounds ? { round_count: rounds } : undefined);
  return res.data;
}

/**
 * Join an existing duel room by ID.
 * POST /api/duels/{roomId}/join → { room_id, status }
 */
export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  const res = await apiClient.post<JoinRoomResponse>(DUELS.JOIN(roomId));
  return res.data;
}

/**
 * Fetch duel room state (for initial render before WS connects).
 * GET /api/duels/{roomId} → DuelRoom
 */
export async function getRoom(roomId: string): Promise<DuelRoom> {
  const res = await apiClient.get<DuelRoom>(DUELS.ROOM(roomId));
  return res.data;
}
