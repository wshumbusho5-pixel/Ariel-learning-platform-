import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getConversations } from '@/features/messages/api/messagesApi';
import type { ConversationSummary } from '@/shared/types/message';

const REFETCH_INTERVAL_MS = 15_000;

export interface UseConversationsReturn {
  conversations: ConversationSummary[];
  isLoading: boolean;
  unreadTotal: number;
  refetch: () => void;
}

export function useConversations(): UseConversationsReturn {
  const query = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: getConversations,
    refetchInterval: REFETCH_INTERVAL_MS,
    staleTime: 10_000,
  });

  const conversations = query.data ?? [];

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0),
    [conversations],
  );

  return {
    conversations,
    isLoading: query.isLoading,
    unreadTotal,
    refetch: query.refetch,
  };
}
