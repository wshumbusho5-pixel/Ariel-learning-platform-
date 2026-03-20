import { useEffect, useRef, useState, useCallback } from 'react';
import { BaseWebSocketManager } from '@/shared/api/websocket';
import { useAuthStore } from '@/shared/auth/authStore';

interface UseWebSocketOptions {
  enabled?: boolean;
}

interface UseWebSocketReturn<TIncoming, TOutgoing> {
  send: (data: TOutgoing) => void;
  isConnected: boolean;
  lastMessage: TIncoming | null;
}

export function useWebSocket<TIncoming = unknown, TOutgoing = unknown>(
  url: string | null,
  options: UseWebSocketOptions = {},
): UseWebSocketReturn<TIncoming, TOutgoing> {
  const { enabled = true } = options;
  const token = useAuthStore((s) => s.token);

  const managerRef = useRef<BaseWebSocketManager<TIncoming, TOutgoing> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<TIncoming | null>(null);

  useEffect(() => {
    if (!url || !enabled) return;

    const manager = new BaseWebSocketManager<TIncoming, TOutgoing>();
    managerRef.current = manager;

    // Subscribe to messages
    const cleanup = manager.onMessage((msg) => {
      setLastMessage(msg);
    });

    manager.connect(url, token ?? undefined);

    // Poll connected state
    const interval = setInterval(() => {
      setIsConnected(manager.isConnected);
    }, 500);

    return () => {
      cleanup();
      clearInterval(interval);
      manager.disconnect();
      managerRef.current = null;
      setIsConnected(false);
    };
  }, [url, enabled, token]);

  const send = useCallback((data: TOutgoing) => {
    managerRef.current?.send(data);
  }, []);

  return { send, isConnected, lastMessage };
}
