import apiClient from '@/shared/api/client';
import { REELS } from '@/shared/api/endpoints';
import type { ReelResponse } from '@/shared/types/reel';

export interface ReelsFeedParams {
  limit?: number;
  offset?: number;
}

export interface ReelsFeedResponse {
  reels: ReelResponse[];
  total: number;
}

/**
 * Fetch the paginated reels feed.
 * GET /api/reels/feed?limit=&offset=
 */
export async function getReels(limit = 10, offset = 0): Promise<ReelResponse[]> {
  const res = await apiClient.get<ReelResponse[]>(REELS.FEED, {
    params: { limit, offset },
  });
  return res.data;
}

/**
 * Fetch the current user's own reels.
 * GET /api/reels/my-reels
 */
export async function getMyReels(): Promise<ReelResponse[]> {
  const res = await apiClient.get<ReelResponse[]>(REELS.MY_REELS);
  return res.data;
}

/**
 * Fetch the current user's saved reels.
 * GET /api/reels/saved
 */
export async function getSavedReels(): Promise<ReelResponse[]> {
  const res = await apiClient.get<ReelResponse[]>(REELS.SAVED);
  return res.data;
}

/**
 * Like or unlike a reel.
 * Follows the same pattern as CARDS.like(id).
 * POST /api/reels/:id/like
 */
export async function likeReel(id: string): Promise<{ liked: boolean; likes: number }> {
  const res = await apiClient.post<{ liked: boolean; likes: number }>(
    `${REELS.byId(id)}/like`,
  );
  return res.data;
}

/**
 * Save a reel's cards to the user's deck.
 * POST /api/reels/:id/save
 */
export async function saveToDeck(id: string): Promise<{ saved: boolean }> {
  const res = await apiClient.post<{ saved: boolean }>(`${REELS.byId(id)}/save`);
  return res.data;
}

/**
 * Share a reel — increments share count server-side.
 * POST /api/reels/:id/share
 */
export async function shareReel(id: string): Promise<void> {
  await apiClient.post(`${REELS.byId(id)}/share`);
}

/**
 * Post a comment on a reel.
 * POST /api/reels/:id/comments
 */
export async function postReelComment(
  id: string,
  content: string,
): Promise<{ id: string; content: string; author_username: string }> {
  const res = await apiClient.post(`${REELS.byId(id)}/comments`, { content });
  return res.data;
}

/**
 * Fetch comments for a reel.
 * GET /api/reels/:id/comments
 */
export async function getReelComments(id: string): Promise<
  Array<{
    id: string;
    content: string;
    author_username: string;
    author_profile_picture: string | null;
    created_at: string;
  }>
> {
  const res = await apiClient.get(`${REELS.byId(id)}/comments`);
  return res.data;
}
