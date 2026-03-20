import apiClient from '@/shared/api/client';
import { AUTH, SOCIAL } from '@/shared/api/endpoints';
import type { User, UserProfileUpdate } from '@/shared/types/user';
import type { DeckPost } from '@/shared/types/deck';

// ─── Response Types ───────────────────────────────────────────────────────────

export interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  profile_picture: string | null;
  bio: string | null;
  subjects: string[];
  level: number;
  current_streak: number;
  followers_count: number;
  following_count: number;
  total_points: number;
  is_verified: boolean;
  is_teacher: boolean;
  is_profile_public: boolean;
  school: string | null;
  education_level: string | null;
  last_seen: string | null;
  is_following?: boolean;
}

export interface FollowerUser {
  id: string;
  username: string | null;
  full_name: string | null;
  profile_picture: string | null;
  bio: string | null;
  is_verified: boolean;
  is_following: boolean;
  followers_count: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<PublicProfile> {
  const { data } = await apiClient.get<PublicProfile>(SOCIAL.PROFILE(userId));
  return data;
}

export async function followUser(userId: string): Promise<void> {
  await apiClient.post(SOCIAL.FOLLOW(userId));
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(SOCIAL.FOLLOW(userId));
}

export async function getFollowers(userId: string): Promise<FollowerUser[]> {
  const { data } = await apiClient.get<FollowerUser[]>(SOCIAL.FOLLOWERS(userId));
  return data;
}

export async function getFollowing(userId: string): Promise<FollowerUser[]> {
  const { data } = await apiClient.get<FollowerUser[]>(SOCIAL.FOLLOWING(userId));
  return data;
}

export async function getMyDecks(): Promise<DeckPost[]> {
  const { data } = await apiClient.get<DeckPost[]>(SOCIAL.DECKS);
  return data;
}

export async function getSuggestedUsers(): Promise<FollowerUser[]> {
  const { data } = await apiClient.get<FollowerUser[]>(SOCIAL.SUGGESTED_USERS);
  return data;
}

export async function updateProfile(payload: UserProfileUpdate): Promise<User> {
  const { data } = await apiClient.patch<User>(AUTH.PROFILE, payload);
  return data;
}
