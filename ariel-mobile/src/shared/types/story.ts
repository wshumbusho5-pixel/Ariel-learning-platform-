export enum StoryType {
  TEXT = 'text',
  ACHIEVEMENT = 'achievement',
  STREAK = 'streak',
  DECK_POST = 'deck_post',
  STUDY_SESSION = 'study_session',
}

export enum StoryVisibility {
  FOLLOWERS = 'followers',
  FRIENDS = 'friends',
  PUBLIC = 'public',
}

export interface Story {
  id: string | null;
  user_id: string;
  story_type: StoryType;
  content: string;
  background_color: string | null;
  image_url: string | null;
  achievement_id: string | null;
  achievement_title: string | null;
  achievement_icon: string | null;
  streak_count: number | null;
  deck_id: string | null;
  deck_title: string | null;
  deck_subject: string | null;
  cards_reviewed: number | null;
  time_spent_minutes: number | null;
  visibility: StoryVisibility;
  views: number;
  viewers: string[];
  created_at: string;
  expires_at: string;
  is_expired: boolean;
}

export interface StoryResponse {
  id: string;
  user_id: string;
  story_type: StoryType;
  content: string;
  background_color: string;
  image_url: string | null;
  achievement_id: string | null;
  achievement_title: string | null;
  achievement_icon: string | null;
  streak_count: number | null;
  deck_id: string | null;
  deck_title: string | null;
  deck_subject: string | null;
  cards_reviewed: number | null;
  time_spent_minutes: number | null;
  visibility: StoryVisibility;
  views: number;
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
  author_is_verified: boolean;
  has_viewed: boolean;
  created_at: string;
  expires_at: string;
  time_remaining_hours: number;
}

export interface StoryView {
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export interface StoryGroup {
  user_id: string;
  username: string | null;
  full_name: string | null;
  profile_picture: string | null;
  is_verified: boolean;
  stories: StoryResponse[];
  total_stories: number;
  unviewed_count: number;
  latest_story_time: string;
}
