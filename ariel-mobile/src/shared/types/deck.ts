export enum DeckVisibility {
  PRIVATE = 'private',
  FRIENDS_ONLY = 'friends_only',
  CLASSMATES_ONLY = 'classmates_only',
  SUBJECT_COMMUNITY = 'subject_community',
  PUBLIC = 'public',
}

export interface Deck {
  id: string | null;
  user_id: string;

  // Basic Info
  title: string;
  description: string | null;
  cover_image: string | null;

  // Organization
  subject: string;
  topic: string | null;
  education_level: string | null;
  course_code: string | null;
  tags: string[];

  // Content
  card_ids: string[];
  card_count: number;

  // Social
  visibility: DeckVisibility;
  is_featured: boolean;
  caption: string | null;

  // Engagement
  likes: number;
  saves: number;
  views: number;
  comments_count: number;

  // Metadata
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface DeckCreate {
  title: string;
  description?: string;
  subject: string;
  topic?: string;
  education_level?: string;
  course_code?: string;
  tags?: string[];
  visibility?: DeckVisibility;
  card_ids?: string[];
  caption?: string;
}

export interface DeckUpdate {
  title?: string;
  description?: string;
  subject?: string;
  topic?: string;
  education_level?: string;
  course_code?: string;
  tags?: string[];
  visibility?: DeckVisibility;
  card_ids?: string[];
  caption?: string;
}

export interface DeckPost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  subject: string;
  topic: string | null;
  education_level: string | null;
  course_code: string | null;
  tags: string[];
  card_count: number;
  visibility: DeckVisibility;
  is_featured: boolean;

  // Engagement
  likes: number;
  saves: number;
  views: number;
  comments_count: number;

  // Author info (embedded)
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
  author_is_teacher: boolean;
  author_is_verified: boolean;

  // Social context
  is_liked: boolean;
  is_saved: boolean;
  caption: string | null;

  created_at: string;
  published_at: string | null;
}

export interface DeckComment {
  id: string | null;
  deck_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
}
