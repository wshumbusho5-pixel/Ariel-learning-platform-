import { useInfiniteQuery, QueryKey } from '@tanstack/react-query';
import { useMemo } from 'react';

interface UseInfiniteListOptions<T> {
  queryKey: QueryKey;
  fetchFn: (params: { pageParam: number; pageSize: number }) => Promise<T[]>;
  pageSize?: number;
}

interface UseInfiniteListReturn<T> {
  data: T[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export function useInfiniteList<T>({
  queryKey,
  fetchFn,
  pageSize = 20,
}: UseInfiniteListOptions<T>): UseInfiniteListReturn<T> {
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchFn({ pageParam: pageParam as number, pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
  });

  const data = useMemo(
    () => (query.data?.pages.flat() ?? []),
    [query.data],
  );

  return {
    data,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
