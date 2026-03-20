import { useEffect, useCallback } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { Notification } from '@/shared/types/notification';
import {
  getNotifications,
  markRead as apiMarkRead,
  markAllRead as apiMarkAllRead,
  getSummary,
  type NotificationsListResponse,
} from '@/features/notifications/api/notificationsApi';
import { useNotificationStore } from '@/features/notifications/notificationStore';

const PAGE_SIZE = 20;
// Auto-refresh interval: 30 seconds
const REFETCH_INTERVAL = 30_000;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const queryClient = useQueryClient();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const decrementUnread = useNotificationStore((s) => s.decrementUnread);
  const clearUnread = useNotificationStore((s) => s.clearUnread);

  // ── Fetch summary on mount and keep badge count in sync ──────────────────
  useEffect(() => {
    let cancelled = false;
    getSummary()
      .then((summary) => {
        if (!cancelled) {
          setUnreadCount(summary.unread_count);
        }
      })
      .catch(() => {
        // Non-critical — badge stays at last known value
      });
    return () => {
      cancelled = true;
    };
  }, [setUnreadCount]);

  // ── Infinite query (paginated) ────────────────────────────────────────────
  const infiniteQuery = useInfiniteQuery<
    NotificationsListResponse,
    Error,
    { pages: NotificationsListResponse[]; pageParams: number[] },
    ReturnType<typeof QUERY_KEYS.NOTIFICATIONS.all>,
    number
  >({
    queryKey: QUERY_KEYS.NOTIFICATIONS.all(),
    queryFn: ({ pageParam }) => getNotifications(PAGE_SIZE, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.has_more) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 1000 * 15, // 15 seconds
  });

  // Flatten all pages into a single list
  const notifications: Notification[] =
    infiniteQuery.data?.pages.flatMap((page) => page.notifications) ?? [];

  // ── Mark single notification as read ─────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiMarkRead(id),
    onMutate: async (id: string) => {
      // Snapshot for rollback
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.all() });
      const snapshot = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS.all());

      // Optimistically mark as read in cache
      queryClient.setQueryData(
        QUERY_KEYS.NOTIFICATIONS.all(),
        (old: { pages: NotificationsListResponse[]; pageParams: number[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) =>
                n.id === id ? { ...n, is_read: true } : n,
              ),
            })),
          };
        },
      );

      // Decrement badge
      decrementUnread();

      return { snapshot };
    },
    onError: (_err, _id, context) => {
      // Rollback cache
      if (context?.snapshot) {
        queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS.all(), context.snapshot);
      }
      // Re-fetch accurate count
      getSummary()
        .then((s) => setUnreadCount(s.unread_count))
        .catch(() => undefined);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.summary() });
    },
  });

  // ── Mark all notifications as read ───────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: apiMarkAllRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.all() });
      const snapshot = queryClient.getQueryData(QUERY_KEYS.NOTIFICATIONS.all());

      // Optimistically mark all read in cache
      queryClient.setQueryData(
        QUERY_KEYS.NOTIFICATIONS.all(),
        (old: { pages: NotificationsListResponse[]; pageParams: number[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              notifications: page.notifications.map((n) => ({ ...n, is_read: true })),
            })),
          };
        },
      );

      clearUnread();

      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(QUERY_KEYS.NOTIFICATIONS.all(), context.snapshot);
      }
      getSummary()
        .then((s) => setUnreadCount(s.unread_count))
        .catch(() => undefined);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.all() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS.summary() });
    },
  });

  // ── Stable callbacks ──────────────────────────────────────────────────────
  const markRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation],
  );

  const markAllRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation],
  );

  return {
    notifications,
    isLoading: infiniteQuery.isLoading,
    isError: infiniteQuery.isError,
    isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    hasNextPage: infiniteQuery.hasNextPage,
    fetchNextPage: infiniteQuery.fetchNextPage,
    refetch: infiniteQuery.refetch,
    isRefetching: infiniteQuery.isRefetching,
    markRead,
    markAllRead,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
