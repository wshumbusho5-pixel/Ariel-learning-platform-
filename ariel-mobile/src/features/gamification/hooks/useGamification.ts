import { useQuery } from '@tanstack/react-query';
import { getLevelInfo, getDailyGoal, getStreakInfo } from '@/features/gamification/api/gamificationApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

const FIVE_MINUTES = 1000 * 60 * 5;

export interface GamificationData {
  // Level & XP
  level: number;
  xp: number;
  xpToNext: number;
  totalXp: number;
  xpPercent: number;

  // Streak
  streak: number;
  longestStreak: number;

  // Daily goal
  dailyGoal: {
    target: number;
    completed: number;
    percentage: number;
    isComplete: boolean;
  };

  // Loading state
  isLoading: boolean;
  isError: boolean;

  refetch: () => void;
}

export function useGamification(): GamificationData {
  const levelQuery = useQuery({
    queryKey: QUERY_KEYS.GAMIFICATION.level(),
    queryFn: getLevelInfo,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });

  const dailyGoalQuery = useQuery({
    queryKey: QUERY_KEYS.GAMIFICATION.dailyGoal(),
    queryFn: getDailyGoal,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });

  const streakQuery = useQuery({
    queryKey: QUERY_KEYS.ACHIEVEMENTS.streak(),
    queryFn: getStreakInfo,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
  });

  const isLoading =
    levelQuery.isLoading || dailyGoalQuery.isLoading || streakQuery.isLoading;
  const isError =
    levelQuery.isError || dailyGoalQuery.isError || streakQuery.isError;

  const levelData = levelQuery.data;
  const dailyGoalData = dailyGoalQuery.data;
  const streakData = streakQuery.data;

  // Compute XP percentage for current level (0–100)
  const xpPercent =
    levelData && levelData.xp_to_next > 0
      ? Math.min(100, Math.round((levelData.xp / levelData.xp_to_next) * 100))
      : 0;

  function refetch() {
    levelQuery.refetch();
    dailyGoalQuery.refetch();
    streakQuery.refetch();
  }

  return {
    level: levelData?.level ?? 1,
    xp: levelData?.xp ?? 0,
    xpToNext: levelData?.xp_to_next ?? 100,
    totalXp: levelData?.total_xp ?? 0,
    xpPercent,

    streak: streakData?.current_streak ?? 0,
    longestStreak: streakData?.longest_streak ?? 0,

    dailyGoal: {
      target: dailyGoalData?.daily_goal ?? 10,
      completed: dailyGoalData?.cards_reviewed ?? 0,
      percentage: dailyGoalData?.percentage ?? 0,
      isComplete: dailyGoalData?.completed ?? false,
    },

    isLoading,
    isError,
    refetch,
  };
}
