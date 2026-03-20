import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseWebSocketManager } from '@/shared/api/websocket';
import { useAuthStore } from '@/shared/auth/authStore';
import { LIVESTREAM } from '@/shared/api/endpoints';
import type {
  LiveWsMessage,
  LiveWsChatMessage,
  LiveWsReaction,
} from '@/shared/types/livestream';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  profile_picture: string | null;
  content: string;
  created_at: string;
}

export interface Reaction {
  /** Unique key for this reaction animation instance */
  key: string;
  type: 'heart' | 'fire' | 'clap';
  username: string;
}

export interface UseLiveSocketOptions {
  streamId: string;
  onStreamEnded?: () => void;
}

export interface UseLiveSocketReturn {
  messages: ChatMessage[];
  viewerCount: number;
  reactions: Reaction[];
  sendChat: (content: string) => void;
  isConnected: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type OutgoingChatMessage = {
  type: 'chat_message';
  content: string;
};

function reactionTypeFrom(raw: string): 'heart' | 'fire' | 'clap' {
  if (raw === 'fire') return 'fire';
  if (raw === 'clap') return 'clap';
  return 'heart';
}

const MAX_MESSAGES = 50;
const REACTION_TTL_MS = 3000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLiveSocket({
  streamId,
  onStreamEnded,
}: UseLiveSocketOptions): UseLiveSocketReturn {
  const token = useAuthStore((s) => s.token);

  const wsRef = useRef(
    new BaseWebSocketManager<LiveWsMessage, OutgoingChatMessage>({ maxRetries: 3 }),
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Stable ref so the message handler closure sees the latest callback
  const onStreamEndedRef = useRef(onStreamEnded);
  useEffect(() => {
    onStreamEndedRef.current = onStreamEnded;
  }, [onStreamEnded]);

  // ── Message handler ────────────────────────────────────────────────────────

  useEffect(() => {
    const ws = wsRef.current;

    const removeHandler = ws.onMessage((msg: LiveWsMessage) => {
      switch (msg.type) {
        case 'viewer_joined': {
          // viewer_count may come in a separate event; bump optimistically
          setIsConnected(true);
          break;
        }

        case 'viewer_count_update':
        case 'viewer_count': {
          setViewerCount(msg.count);
          break;
        }

        case 'chat_message':
        case 'comment': {
          const chatMsg = msg as LiveWsChatMessage;
          const newEntry: ChatMessage = {
            id: `${chatMsg.user_id}_${chatMsg.timestamp}_${Math.random()}`,
            user_id: chatMsg.user_id,
            username: chatMsg.username,
            profile_picture: chatMsg.profile_picture,
            content: chatMsg.message,
            created_at: chatMsg.timestamp,
          };
          setMessages((prev) => {
            const updated = [...prev, newEntry];
            // Keep at most MAX_MESSAGES — drop oldest
            return updated.length > MAX_MESSAGES
              ? updated.slice(updated.length - MAX_MESSAGES)
              : updated;
          });
          break;
        }

        case 'reaction': {
          const rxMsg = msg as LiveWsReaction;
          const newReaction: Reaction = {
            key: `${rxMsg.user_id}_${Date.now()}_${Math.random()}`,
            type: reactionTypeFrom(rxMsg.reaction_type),
            username: rxMsg.user_id, // server gives user_id; username not in type
          };
          setReactions((prev) => [...prev, newReaction]);

          // Auto-remove after TTL
          setTimeout(() => {
            setReactions((prev) =>
              prev.filter((r) => r.key !== newReaction.key),
            );
          }, REACTION_TTL_MS);
          break;
        }

        case 'stream_ended': {
          onStreamEndedRef.current?.();
          break;
        }
      }
    });

    return removeHandler;
  }, []);

  // ── Connect / disconnect on mount ──────────────────────────────────────────

  useEffect(() => {
    const ws = wsRef.current;
    ws.connect(LIVESTREAM.WS(streamId), token ?? undefined);
    setIsConnected(ws.isConnected);

    return () => {
      ws.disconnect();
      setIsConnected(false);
    };
    // streamId is stable for the lifetime of a viewer/host screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  // ── sendChat ───────────────────────────────────────────────────────────────

  const sendChat = useCallback((content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    wsRef.current.send({ type: 'chat_message', content: trimmed });
  }, []);

  return {
    messages,
    viewerCount,
    reactions,
    sendChat,
    isConnected,
  };
}
