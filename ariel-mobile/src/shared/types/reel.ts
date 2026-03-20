export enum ReelKind {
  STUDY_TIP = 'study_tip',
  CONCEPT_EXPLAINER = 'concept_explainer',
  QUIZ = 'quiz',
  MOTIVATION = 'motivation',
  OTHER = 'other',
}

export interface ReelCreate {
  title: string;
  description?: string;
  category?: string;
  hashtags?: string[];
}

export interface ReelResponse {
  id: string;
  video_url: string | null;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  creator_id: string;
  creator_username: string;
  creator_profile_picture: string | null;
  creator_verified: boolean;
  creator_badge_type: string | null;
  likes: number;
  comments_count: number;
  shares_count: number;
  views: number;
  created_at: string;
  liked_by_current_user: boolean;
  following_creator: boolean;
  category: string | null;
  hashtags: string[] | null;
}
