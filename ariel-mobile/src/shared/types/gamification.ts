export enum AchievementCategory {
  STREAK = 'streak',
  CARDS = 'cards',
  SOCIAL = 'social',
  LEARNING = 'learning',
  SPECIAL = 'special',
}

export enum AchievementRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface LevelInfo {
  current_level: number;
  total_points: number;
  points_to_next_level: number;
  progress_percentage: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  share_to_story_template: string | null;
  is_hidden: boolean;
  is_repeatable: boolean;
}

export interface AchievementProgress {
  achievement_id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  current_value: number;
  target_value: number;
  percentage: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  points_reward: number;
}

export interface DailyGoal {
  cards_reviewed: number;
  daily_goal: number;
  percentage: number;
  completed: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  full_name: string | null;
  profile_picture: string | null;
  is_verified: boolean;
  current_streak: number;
  total_points: number;
  achievements_count: number;
  is_current_user: boolean;
}

export interface UserStats {
  level_info: LevelInfo;
  achievements: Achievement[];
  daily_goal: DailyGoal;
  streak_bonus_today: number;
}

export interface Challenge {
  id: string | null;
  title: string;
  description: string;
  icon: string;
  challenge_type: string;
  target_value: number;
  points_reward: number;
  badge_reward: string | null;
  status: string;
  start_date: string;
  end_date: string;
  participant_count: number;
  completion_count: number;
  created_at: string;
}

export interface ChallengeWithProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: string;
  target_value: number;
  points_reward: number;
  badge_reward: string | null;
  status: string;
  start_date: string;
  end_date: string;
  days_remaining: number;
  participant_count: number;
  completion_count: number;
  completion_rate: number;
  current_value: number;
  percentage: number;
  is_joined: boolean;
  is_completed: boolean;
}
