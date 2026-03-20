export enum NotificationType {
  // Social
  NEW_FOLLOWER = 'new_follower',
  FOLLOW_BACK = 'follow_back',

  // Deck Interactions
  DECK_LIKE = 'deck_like',
  DECK_SAVE = 'deck_save',
  DECK_COMMENT = 'deck_comment',
  COMMENT_REPLY = 'comment_reply',

  // Achievements & Streaks
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  FRIEND_ACHIEVEMENT = 'friend_achievement',
  STREAK_MILESTONE = 'streak_milestone',
  STREAK_RISK = 'streak_risk',

  // Stories
  STORY_VIEW = 'story_view',
  STORY_MILESTONE = 'story_milestone',

  // Study & Learning
  DAILY_GOAL_MET = 'daily_goal_met',
  STUDY_REMINDER = 'study_reminder',

  // Messages
  NEW_MESSAGE = 'new_message',

  // Community
  TRENDING_DECK = 'trending_deck',
  LEADERBOARD_RANK = 'leaderboard_rank',

  // Duels
  DUEL_CHALLENGE = 'duel_challenge',
}

export interface Notification {
  id: string | null;
  user_id: string;

  // Notification details
  notification_type: NotificationType;
  title: string;
  message: string;
  icon: string | null;

  // Actor
  actor_id: string | null;
  actor_username: string | null;
  actor_full_name: string | null;
  actor_profile_picture: string | null;

  // Related entities
  related_deck_id: string | null;
  related_comment_id: string | null;
  related_achievement_id: string | null;
  related_story_id: string | null;

  // Additional data
  metadata: Record<string, unknown>;

  // Action URL
  action_url: string | null;

  // Status
  is_read: boolean;
  is_archived: boolean;

  // Timestamps
  created_at: string;
  read_at: string | null;
}

export interface NotificationPreferences {
  id: string | null;
  user_id: string;
  enable_push: boolean;
  social_notifications: boolean;
  achievement_notifications: boolean;
  streak_notifications: boolean;
  study_notifications: boolean;
  message_notifications: boolean;
  notify_new_follower: boolean;
  notify_deck_like: boolean;
  notify_deck_save: boolean;
  notify_deck_comment: boolean;
  notify_achievement_unlock: boolean;
  notify_friend_achievement: boolean;
  notify_streak_risk: boolean;
  notify_daily_goal_met: boolean;
  notify_new_message: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  updated_at: string;
}

export interface NotificationSummary {
  total_count: number;
  unread_count: number;
  unread_by_type: Record<string, number>;
  latest_notifications: Notification[];
}
