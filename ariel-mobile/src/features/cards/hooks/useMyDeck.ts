import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { Card } from '@/shared/types/card';

type CardStatus = 'due' | 'new' | 'learning' | 'mastered';

function getCardStatus(card: Card): CardStatus {
  if (card.review_count === 0) return 'new';
  if (card.interval >= 21) return 'mastered';
  if (card.next_review && new Date(card.next_review) <= new Date()) return 'due';
  return 'learning';
}

const STATUS_ORDER: Record<CardStatus, number> = {
  due: 0,
  new: 1,
  learning: 2,
  mastered: 3,
};

export type DeckFilter = 'all' | 'due' | 'new' | 'mastered';

interface UseMyDeckOptions {
  filter?: DeckFilter;
}

export function useMyDeck({ filter = 'all' }: UseMyDeckOptions = {}) {
  const query = useQuery<Card[]>({
    queryKey: QUERY_KEYS.CARDS.myDeck({ filter }),
    queryFn: async () => {
      const res = await apiClient.get<Card[]>(CARDS.MY_DECK);
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const raw = query.data ?? [];

  // Sort: due first, then new, then learning, then mastered
  const sorted = [...raw].sort((a, b) => {
    return STATUS_ORDER[getCardStatus(a)] - STATUS_ORDER[getCardStatus(b)];
  });

  // Apply filter
  const filtered =
    filter === 'all'
      ? sorted
      : sorted.filter((c) => {
          const s = getCardStatus(c);
          if (filter === 'due') return s === 'due';
          if (filter === 'new') return s === 'new';
          if (filter === 'mastered') return s === 'mastered';
          return true;
        });

  return {
    cards: filtered,
    allCards: sorted,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    getCardStatus,
  };
}
