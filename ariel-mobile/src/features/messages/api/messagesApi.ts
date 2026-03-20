import apiClient from '@/shared/api/client';
import { MESSAGES } from '@/shared/api/endpoints';
import type {
  ConversationSummary,
  MessageWithSender,
  MessageCreate,
} from '@/shared/types/message';

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface UnreadCountResponse {
  unread_count: number;
}

export interface MarkReadResponse {
  success: boolean;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/messages/conversations
 * Returns the current user's conversation list with the other participant summary.
 */
export async function getConversations(): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<ConversationSummary[]>(MESSAGES.CONVERSATIONS);
  return data;
}

/**
 * GET /api/messages/conversation/{convId}/messages?limit=&offset=
 * Returns paginated messages for a conversation.
 */
export async function getMessages(
  convId: string,
  limit = 30,
  offset = 0,
): Promise<MessageWithSender[]> {
  const { data } = await apiClient.get<MessageWithSender[]>(
    MESSAGES.CONVERSATION_MESSAGES(convId),
    { params: { limit, offset } },
  );
  return data;
}

/**
 * POST /api/messages/conversation/{convId}/send
 * Sends a new message in a conversation.
 */
export async function sendMessage(
  convId: string,
  content: string,
  extra?: Omit<MessageCreate, 'content'>,
): Promise<MessageWithSender> {
  const payload: MessageCreate = { content, ...extra };
  const { data } = await apiClient.post<MessageWithSender>(MESSAGES.SEND(convId), payload);
  return data;
}

/**
 * GET /api/messages/conversation/{userId}
 * Gets (or creates) the conversation with a specific user.
 * Returns the ConversationSummary for that conversation.
 */
export async function getConversation(userId: string): Promise<ConversationSummary> {
  const { data } = await apiClient.get<ConversationSummary>(MESSAGES.CONVERSATION(userId));
  return data;
}

/**
 * Marks a conversation as read.
 * Implemented as a GET on the conversation endpoint which triggers read on the backend,
 * or as an explicit messages fetch (which marks read server-side).
 * We do a lightweight GET /api/messages/conversation/{convId}/messages?limit=1 to trigger it.
 */
export async function markRead(convId: string): Promise<void> {
  await apiClient.get(MESSAGES.CONVERSATION_MESSAGES(convId), { params: { limit: 1, offset: 0 } });
}

/**
 * GET /api/messages/unread-count
 * Returns the total unread message count across all conversations.
 */
export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(MESSAGES.UNREAD_COUNT);
  return data.unread_count;
}

export const messagesApi = {
  getConversations,
  getMessages,
  sendMessage,
  getConversation,
  markRead,
  getUnreadCount,
};
