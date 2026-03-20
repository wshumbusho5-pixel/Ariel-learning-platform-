export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DECK_SHARE = 'deck_share',
  CARD_SHARE = 'card_share',
  REEL_SHARE = 'reel_share',
}

export interface Message {
  id: string | null;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: MessageType;
  content: string;
  image_url: string | null;
  shared_deck_id: string | null;
  shared_card_id: string | null;
  shared_reel_id: string | null;
  reply_to_message_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_username: string | null;
  reactions: Record<string, string>;
  is_read: boolean;
  read_at: string | null;
  is_deleted_by_sender: boolean;
  is_deleted_by_receiver: boolean;
  created_at: string;
}

export interface Conversation {
  id: string | null;
  participant_ids: string[];
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  unread_count: Record<string, number>;
  is_archived_by: string[];
  is_blocked_by: string[];
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  id: string;
  other_user_id: string;
  other_user_username: string | null;
  other_user_full_name: string | null;
  other_user_profile_picture: string | null;
  other_user_is_verified: boolean;
  other_user_last_seen: string | null;
  last_message_content: string | null;
  last_message_sender_id: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface MessageWithSender {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: MessageType;
  content: string;
  image_url: string | null;
  shared_deck_id: string | null;
  shared_card_id: string | null;
  shared_reel_id: string | null;
  is_read: boolean;
  read_at: string | null;
  reply_to_message_id: string | null;
  reply_to_content: string | null;
  reply_to_sender_username: string | null;
  reactions: Record<string, string>;
  sender_username: string | null;
  sender_full_name: string | null;
  sender_profile_picture: string | null;
  is_sent_by_current_user: boolean;
  created_at: string;
}

export interface MessageCreate {
  content: string;
  message_type?: MessageType;
  image_url?: string;
  shared_deck_id?: string;
  shared_card_id?: string;
  shared_reel_id?: string;
  reply_to_message_id?: string;
}
