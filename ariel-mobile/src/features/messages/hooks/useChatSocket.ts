import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseWebSocketManager } from '@/shared/api/websocket';
import { useAuthStore } from '@/shared/auth/authStore';
import { WS_BASE_URL } from '@/shared/api/endpoints';
import { getMessages, sendMessage as apiSendMessage } from '@/features/messages/api/messagesApi';
import type { MessageWithSender } from '@/shared/types/message';

// ─── WS message shape ─────────────────────────────────────────────────────────

interface WsChatMessage {
  type: 'new_message' | 'message_read' | 'typing' | string;
  message?: MessageWithSender;
  conversation_id?: string;
}

interface WsChatOutgoing {
  type: 'ping' | string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseChatSocketOptions {
  conversationId: string;
  otherUserId: string;
}

export interface UseChatSocketReturn {
  messages: MessageWithSender[];
  loading: boolean;
  sendMessage: (content: string, replyToMessageId?: string) => Promise<void>;
  isConnected: boolean;
}

const POLL_INTERVAL_MS = 3_000;
const INITIAL_LIMIT = 50;

export function useChatSocket({
  conversationId,
  otherUserId,
}: UseChatSocketOptions): UseChatSocketReturn {
  const token = useAuthStore((s) => s.token);

  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<BaseWebSocketManager<WsChatMessage, WsChatOutgoing> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectedRef = useRef(false);
  const conversationIdRef = useRef(conversationId);
  const otherUserIdRef = useRef(otherUserId);

  // Keep refs in sync so callbacks stay stable
  useEffect(() => {
    conversationIdRef.current = conversationId;
    otherUserIdRef.current = otherUserId;
  }, [conversationId, otherUserId]);

  // ── Helper: append a message only if not already present ─────────────────

  const appendMessage = useCallback((msg: MessageWithSender) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      // FlatList is inverted — prepend to keep newest at index 0
      return [msg, ...prev];
    });
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // If we have a real conversationId (not a temp userId placeholder) fetch by convId
        const convId = conversationIdRef.current;
        const data = await getMessages(convId, INITIAL_LIMIT, 0);
        if (!cancelled) {
          // Sort newest first for inverted FlatList
          const sorted = [...data].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
          setMessages(sorted);
        }
      } catch {
        // Non-fatal: conversation may not exist yet
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [conversationId]);

  // ── WebSocket + polling fallback ──────────────────────────────────────────

  useEffect(() => {
    const wsUrl = `${WS_BASE_URL}/api/messages/conversation/${conversationId}/ws`;

    const ws = new BaseWebSocketManager<WsChatMessage, WsChatOutgoing>({ maxRetries: 3 });
    wsRef.current = ws;

    // Listen for incoming messages
    const removeHandler = ws.onMessage((msg) => {
      if (msg.type === 'new_message' && msg.message) {
        appendMessage(msg.message);
      }
    });

    ws.connect(wsUrl, token ?? undefined);

    // Poll connected state and manage polling fallback
    const connCheckInterval = setInterval(() => {
      const connected = ws.isConnected;
      if (connected !== isConnectedRef.current) {
        isConnectedRef.current = connected;
        setIsConnected(connected);

        if (connected) {
          // WS is up — stop polling
          if (pollRef.current !== null) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        } else {
          // WS down — start polling if not already
          if (pollRef.current === null) {
            pollRef.current = setInterval(async () => {
              try {
                const latest = await getMessages(conversationIdRef.current, 20, 0);
                const sorted = [...latest].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                );
                setMessages((prev) => {
                  const existingIds = new Set(prev.map((m) => m.id));
                  const newOnes = sorted.filter((m) => !existingIds.has(m.id));
                  if (newOnes.length === 0) return prev;
                  return [...newOnes, ...prev];
                });
              } catch {
                // Silently ignore poll errors
              }
            }, POLL_INTERVAL_MS);
          }
        }
      }
    }, 500);

    return () => {
      removeHandler();
      clearInterval(connCheckInterval);
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      ws.disconnect();
      wsRef.current = null;
      isConnectedRef.current = false;
      setIsConnected(false);
    };
  // Re-connect only when conversation or token changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, token]);

  // ── sendMessage ───────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (content: string, replyToMessageId?: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const sent = await apiSendMessage(
      conversationIdRef.current,
      trimmed,
      replyToMessageId ? { reply_to_message_id: replyToMessageId } : undefined,
    );
    appendMessage(sent);
  }, [appendMessage]);

  return { messages, loading, sendMessage, isConnected };
}
