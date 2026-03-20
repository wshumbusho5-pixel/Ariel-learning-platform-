import apiClient from '@/shared/api/client';
import { CARDS, SOCIAL } from '@/shared/api/endpoints';
import type { Card } from '@/shared/types/card';
import type { DeckPost } from '@/shared/types/deck';
import type { User } from '@/shared/types/user';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface SearchUserResult {
  id: string;
  username: string;
  full_name: string | null;
  profile_picture: string | null;
  bio: string | null;
  is_following: boolean;
  is_verified: boolean;
  followers_count: number;
}

export interface TrendingCard extends Card {
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
  author_is_verified: boolean;
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
}

// ─── API functions ─────────────────────────────────────────────────────────────

/** Search cards by query string. GET /api/cards/search?q={q}&limit={limit} */
export async function searchCards(q: string, limit = 20): Promise<TrendingCard[]> {
  const res = await apiClient.get<TrendingCard[]>(
    `${CARDS.SEARCH}?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
  return res.data;
}

/** Search users by query string. GET /api/social/search-users?q={q} */
export async function searchUsers(q: string, limit = 20): Promise<SearchUserResult[]> {
  const res = await apiClient.get<SearchUserResult[]>(
    `${SOCIAL.SEARCH_USERS}?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
  return res.data;
}

/** Get suggested users to follow. GET /api/social/suggested-users?limit={limit} */
export async function getSuggestedUsers(limit = 10): Promise<SearchUserResult[]> {
  const res = await apiClient.get<SearchUserResult[]>(
    `${SOCIAL.SUGGESTED_USERS}?limit=${limit}`,
  );
  return res.data;
}

/** Get trending cards. GET /api/cards/trending?limit={limit} */
export async function getTrendingCards(limit = 20): Promise<TrendingCard[]> {
  const res = await apiClient.get<TrendingCard[]>(
    `${CARDS.TRENDING}?limit=${limit}`,
  );
  return res.data;
}

/** Get cards for a specific subject. GET /api/social/feed/explore/{subject}?limit={limit} */
export async function getSubjectCards(subject: string, limit = 30): Promise<TrendingCard[]> {
  const res = await apiClient.get<TrendingCard[]>(
    `${SOCIAL.EXPLORE_SUBJECT(subject)}?limit=${limit}`,
  );
  return res.data;
}
