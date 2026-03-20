import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { getReels } from '@/features/reels/api/reelsApi';
import type { ReelResponse } from '@/shared/types/reel';

const PAGE_SIZE = 10;

const REELS_QUERY_KEY = ['reels', 'feed'] as const;

export function useReels() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const query = useInfiniteQuery<ReelResponse[], Error>({
    queryKey: REELS_QUERY_KEY,
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0;
      return getReels(PAGE_SIZE, offset);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      // Next offset = total items fetched so far
      const totalFetched = allPages.reduce((acc, page) => acc + page.length, 0);
      return totalFetched;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Flatten pages into a single array
  const reels: ReelResponse[] = query.data?.pages.flat() ?? [];

  const handleViewableIndexChange = useCallback((index: number) => {
    setCurrentIndex(index);

    // Trigger next page load when within 3 items of the end
    if (
      reels.length > 0 &&
      index >= reels.length - 3 &&
      query.hasNextPage &&
      !query.isFetchingNextPage
    ) {
      query.fetchNextPage();
    }
  }, [reels.length, query]);

  return {
    reels,
    currentIndex,
    onViewableIndexChange: handleViewableIndexChange,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
