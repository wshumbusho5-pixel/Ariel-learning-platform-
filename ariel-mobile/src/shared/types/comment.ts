export interface Comment {
  id: string | null;
  deck_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  likes: number;
  liked_by: string[];
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
}

export interface CommentWithAuthor {
  id: string;
  deck_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
  author_is_verified: boolean;
  likes: number;
  is_liked_by_current_user: boolean;
  reply_count: number;
  is_edited: boolean;
  edited_at: string | null;
  is_author: boolean;
  created_at: string;
}

export interface CommentCreate {
  content: string;
  parent_comment_id?: string;
}

export interface CommentUpdate {
  content: string;
}
