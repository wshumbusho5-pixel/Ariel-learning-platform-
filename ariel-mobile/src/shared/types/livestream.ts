export enum StreamStatus {
  SCHEDULED = 'scheduled',
  LIVE = 'live',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum StreamCategory {
  STUDY_SESSION = 'study_session',
  LECTURE = 'lecture',
  Q_AND_A = 'q_and_a',
  TUTORIAL = 'tutorial',
  EXAM_PREP = 'exam_prep',
  DISCUSSION = 'discussion',
  OTHER = 'other',
}

export interface LiveStream {
  id: string | null;
  streamer_id: string;
  title: string;
  description: string | null;
  category: StreamCategory;
  subject: string | null;
  topic: string | null;
  status: StreamStatus;
  stream_key: string | null;
  stream_url: string | null;
  playback_url: string | null;
  thumbnail_url: string | null;
  scheduled_start: string | null;
  actual_start: string | null;
  actual_end: string | null;
  duration_minutes: number;
  viewers_count: number;
  peak_viewers: number;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  allow_comments: boolean;
  allow_reactions: boolean;
  save_recording: boolean;
  recording_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LiveStreamWithStreamer {
  id: string;
  streamer_id: string;
  streamer_username: string;
  streamer_profile_picture: string | null;
  streamer_verified: boolean;
  title: string;
  description: string | null;
  category: StreamCategory;
  subject: string | null;
  topic: string | null;
  status: StreamStatus;
  playback_url: string | null;
  thumbnail_url: string | null;
  scheduled_start: string | null;
  actual_start: string | null;
  duration_minutes: number;
  viewers_count: number;
  peak_viewers: number;
  likes_count: number;
  comments_count: number;
  is_public: boolean;
  allow_comments: boolean;
  allow_reactions: boolean;
  created_at: string;
  is_liked_by_current_user: boolean;
  is_following_streamer: boolean;
}

export interface StreamComment {
  id: string | null;
  stream_id: string;
  user_id: string;
  username: string;
  profile_picture: string | null;
  message: string;
  timestamp: string;
  likes: number;
  is_pinned: boolean;
  is_deleted: boolean;
}

export interface StreamViewer {
  user_id: string;
  username: string;
  profile_picture: string | null;
  joined_at: string;
}

// WebSocket message types for live streams
export type LiveWsMessageType =
  | 'viewer_joined'
  | 'chat_message'
  | 'reaction'
  | 'stream_ended'
  | 'viewer_count_update'
  | 'comment'
  | 'viewer_count';

export interface LiveWsViewerJoined {
  type: 'viewer_joined';
  user_id: string;
  username: string;
}

export interface LiveWsChatMessage {
  type: 'chat_message' | 'comment';
  stream_id: string;
  user_id: string;
  username: string;
  profile_picture: string | null;
  message: string;
  timestamp: string;
}

export interface LiveWsReaction {
  type: 'reaction';
  reaction_type: string;
  user_id: string;
}

export interface LiveWsStreamEnded {
  type: 'stream_ended';
}

export interface LiveWsViewerCountUpdate {
  type: 'viewer_count_update' | 'viewer_count';
  count: number;
}

export type LiveWsMessage =
  | LiveWsViewerJoined
  | LiveWsChatMessage
  | LiveWsReaction
  | LiveWsStreamEnded
  | LiveWsViewerCountUpdate;
