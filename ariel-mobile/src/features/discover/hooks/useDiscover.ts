import { useState, useEffect, useCallback } from 'react';
import { getSuggestedUsers, getTrendingCards } from '@/features/discover/api/discoverApi';
import type { TrendingCard, SearchUserResult } from '@/features/discover/api/discoverApi';

interface UseDiscoverResult {
  suggestedUsers: SearchUserResult[];
  trendingCards: TrendingCard[];
  loading: boolean;
  refetch: () => void;
}

export function useDiscover(): UseDiscoverResult {
  const [suggestedUsers, setSuggestedUsers] = useState<SearchUserResult[]>([]);
  const [trendingCards, setTrendingCards] = useState<TrendingCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [users, cards] = await Promise.all([
        getSuggestedUsers(10),
        getTrendingCards(20),
      ]);
      setSuggestedUsers(users);
      setTrendingCards(cards);
    } catch {
      // Leave as empty arrays on error — UI handles empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    suggestedUsers,
    trendingCards,
    loading,
    refetch: fetchData,
  };
}
