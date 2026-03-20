import apiClient from '@/shared/api/client';
import { GAMIFICATION, ACHIEVEMENTS, CHALLENGES } from '@/shared/api/endpoints';
import type {
  LevelInfo,
  AchievementDefinition,
  AchievementProgress,
  DailyGoal,
  UserStats,
  LeaderboardEntry,
  ChallengeWithProgress,
} from '@/shared/types/gamification';

// ─── Level ────────────────────────────────────────────────────────────────────

export interface LevelResponse {
  level: number;
  xp: number;
  xp_to_next: number;
  total_xp: number;
}

export async function getLevelInfo(): Promise<LevelResponse> {
  const res = await apiClient.get<LevelResponse>(GAMIFICATION.LEVEL);
  return res.data;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface AchievementsResponse {
  all: AchievementDefinition[];
  unlocked: AchievementProgress[];
}

export async function getAchievements(): Promise<AchievementsResponse> {
  const [allRes, unlockedRes] = await Promise.all([
    apiClient.get<AchievementDefinition[]>(ACHIEVEMENTS.LIST),
    apiClient.get<AchievementProgress[]>(ACHIEVEMENTS.UNLOCKED),
  ]);
  return {
    all: allRes.data,
    unlocked: unlockedRes.data,
  };
}

// ─── Daily Goal ───────────────────────────────────────────────────────────────

export async function getDailyGoal(): Promise<DailyGoal> {
  const res = await apiClient.get<DailyGoal>(GAMIFICATION.DAILY_GOAL);
  return res.data;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<UserStats> {
  const res = await apiClient.get<UserStats>(GAMIFICATION.STATS);
  return res.data;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_bonus_today: number;
}

export async function getStreakInfo(): Promise<StreakResponse> {
  const res = await apiClient.get<StreakResponse>(ACHIEVEMENTS.STREAK);
  return res.data;
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await apiClient.get<LeaderboardEntry[]>(ACHIEVEMENTS.LEADERBOARD_STREAKS);
  return res.data;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function getChallenges(): Promise<ChallengeWithProgress[]> {
  const res = await apiClient.get<ChallengeWithProgress[]>(CHALLENGES.ACTIVE);
  return res.data;
}

export async function joinChallenge(id: string): Promise<void> {
  await apiClient.post(CHALLENGES.join(id));
}
