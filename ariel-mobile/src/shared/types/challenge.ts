export enum ChallengeType {
  CARDS_REVIEWED = 'cards_reviewed',
  STREAK_DAYS = 'streak_days',
  STUDY_TIME = 'study_time',
  DECKS_CREATED = 'decks_created',
  SOCIAL_ENGAGEMENT = 'social_engagement',
}

export enum ChallengeStatus {
  UPCOMING = 'upcoming',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Challenge {
  id: string | null;
  title: string;
  description: string;
  icon: string;
  challenge_type: ChallengeType;
  target_value: number;
  points_reward: number;
  badge_reward: string | null;
  status: ChallengeStatus;
  start_date: string;
  end_date: string;
  participant_count: number;
  completion_count: number;
  created_at: string;
}

export interface UserChallengeProgress {
  id: string | null;
  user_id: string;
  challenge_id: string;
  current_value: number;
  target_value: number;
  percentage: number;
  is_joined: boolean;
  is_completed: boolean;
  completed_at: string | null;
  points_earned: number;
  joined_at: string;
}

export interface ChallengeWithProgress {
  id: string;
  title: string;
  description: string;
  icon: string;
  challenge_type: ChallengeType;
  target_value: number;
  points_reward: number;
  badge_reward: string | null;
  status: ChallengeStatus;
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

export interface ChallengeLeaderboardEntry {
  rank: number;
  user_id: string;
  username: string | null;
  full_name: string | null;
  profile_picture: string | null;
  is_verified: boolean;
  current_value: number;
  target_value: number;
  percentage: number;
  is_completed: boolean;
  is_current_user: boolean;
}
