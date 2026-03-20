export enum CardVisibility {
  PRIVATE = 'private',
  CLASS = 'class',
  PUBLIC = 'public',
}

export interface Card {
  id: string | null;
  user_id: string;
  question: string;
  answer: string;
  explanation: string | null;

  // Organization
  subject: string | null;
  topic: string | null;
  tags: string[];

  // Caption
  caption: string | null;

  // Social
  visibility: CardVisibility;
  class_id: string | null;
  likes: number;
  saves: number;

  // Spaced repetition
  review_count: number;
  ease_factor: number;
  interval: number;
  next_review: string | null;
  last_review: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface CardCreate {
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags?: string[];
  visibility?: CardVisibility;
  class_id?: string;
}

export interface CardUpdate {
  question?: string;
  answer?: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags?: string[];
  visibility?: CardVisibility;
}

export interface CardReview {
  card_id: string;
  quality: number;
  points_earned: number;
  next_review: string;
}

export interface DeckStats {
  total_cards: number;
  new_cards: number;
  due_today: number;
  mastered: number;
  by_subject: Record<string, number>;
  by_topic: Record<string, number>;
}

export interface BulkCardCreate {
  cards: CardCreate[];
  subject?: string;
  topic?: string;
  tags?: string[];
  visibility?: CardVisibility;
  caption?: string;
}
