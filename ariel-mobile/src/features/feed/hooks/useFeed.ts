import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/api/client';
import { CARDS } from '@/shared/api/endpoints';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { Card } from '@/shared/types/card';

export interface FeedCard extends Card {
  author_username: string | null;
  author_full_name: string | null;
  author_profile_picture: string | null;
  author_is_verified: boolean;
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
  comment_count: number;
}

export function useFeed(tab: 'forYou' | 'following' = 'forYou') {
  const query = useQuery<FeedCard[]>({
    queryKey: [...QUERY_KEYS.FEED.personalized(), tab],
    queryFn: async () => {
      const endpoint =
        tab === 'following'
          ? `${CARDS.FOLLOWING_FEED}?limit=50`
          : `${CARDS.PERSONALIZED_FEED}?limit=50`;
      const res = await apiClient.get<FeedCard[]>(endpoint);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
