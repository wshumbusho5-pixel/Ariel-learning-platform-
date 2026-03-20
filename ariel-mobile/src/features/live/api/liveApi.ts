import apiClient from '@/shared/api/client';
import { LIVESTREAM } from '@/shared/api/endpoints';
import type { LiveStream, LiveStreamWithStreamer } from '@/shared/types/livestream';

// ─── Request shapes ───────────────────────────────────────────────────────────

export interface CreateStreamPayload {
  title: string;
  description?: string | null;
  category?: string;
  subject?: string | null;
  topic?: string | null;
  is_public?: boolean;
  allow_comments?: boolean;
  allow_reactions?: boolean;
  save_recording?: boolean;
  scheduled_start?: string | null;
}

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface DiscoverResponse {
  streams: LiveStreamWithStreamer[];
  total: number;
}

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/**
 * Fetch all currently active/live streams.
 * GET /api/livestream/discover → { streams, total }
 */
export async function getActiveStreams(): Promise<LiveStreamWithStreamer[]> {
  const res = await apiClient.get<DiscoverResponse>(LIVESTREAM.DISCOVER);
  return res.data.streams ?? (res.data as unknown as LiveStreamWithStreamer[]);
}

/**
 * Fetch a single stream by ID.
 * GET /api/livestream/{id} → LiveStreamWithStreamer
 */
export async function getStreamById(id: string): Promise<LiveStreamWithStreamer> {
  const res = await apiClient.get<LiveStreamWithStreamer>(LIVESTREAM.byId(id));
  return res.data;
}

/**
 * Create a new livestream session.
 * POST /api/livestream/create → LiveStream
 */
export async function createStream(payload: CreateStreamPayload): Promise<LiveStream> {
  const res = await apiClient.post<LiveStream>(LIVESTREAM.CREATE, payload);
  return res.data;
}

/**
 * Mark a stream as started (live).
 * POST /api/livestream/{id}/start → LiveStream
 */
export async function startStream(id: string): Promise<LiveStream> {
  const res = await apiClient.post<LiveStream>(LIVESTREAM.start(id));
  return res.data;
}

/**
 * End an active stream.
 * POST /api/livestream/{id}/end → LiveStream
 */
export async function endStream(id: string): Promise<LiveStream> {
  const res = await apiClient.post<LiveStream>(LIVESTREAM.end(id));
  return res.data;
}

/**
 * Like or unlike a stream.
 * POST /api/livestream/{id}/like → { liked, likes_count }
 */
export async function likeStream(id: string): Promise<LikeResponse> {
  const res = await apiClient.post<LikeResponse>(LIVESTREAM.like(id));
  return res.data;
}

/**
 * Fetch streams created by the current user.
 * GET /api/livestream/my-streams → LiveStream[]
 */
export async function getMyStreams(): Promise<LiveStream[]> {
  const res = await apiClient.get<LiveStream[]>(LIVESTREAM.MY_STREAMS);
  return res.data;
}
