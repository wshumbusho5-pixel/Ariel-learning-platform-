import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoriesFeed } from '@/features/stories/api/storiesApi';
import type { StoryGroup } from '@/shared/types/story';

const SEEN_STORIES_KEY = 'ariel_seen_stories';
const STORIES_QUERY_KEY = ['stories', 'feed'] as const;

async function loadSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_STORIES_KEY);
    if (!raw) return new Set();
    const arr: string[] = JSON.parse(raw);
    return new Set(arr);
  } catch {
    return new Set();
  }
}

async function persistSeenIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(SEEN_STORIES_KEY, JSON.stringify([...ids]));
  } catch {
    // Silently ignore storage errors
  }
}

export function useStories() {
  const queryClient = useQueryClient();
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Load persisted seen IDs on mount
  useEffect(() => {
    loadSeenIds().then(setSeenIds);
  }, []);

  const query = useQuery<StoryGroup[], Error>({
    queryKey: STORIES_QUERY_KEY,
    queryFn: getStoriesFeed,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const storyGroups: StoryGroup[] = query.data ?? [];

  /**
   * Mark one or more story IDs as seen — persists to AsyncStorage.
   */
  const markSeen = useCallback(async (ids: string | string[]) => {
    const toMark = Array.isArray(ids) ? ids : [ids];
    setSeenIds((prev) => {
      const next = new Set(prev);
      toMark.forEach((id) => next.add(id));
      persistSeenIds(next);
      return next;
    });
  }, []);

  /**
   * Returns true when every story in the group has been seen.
   */
  const isGroupSeen = useCallback(
    (group: StoryGroup): boolean => {
      if (group.stories.length === 0) return true;
      return group.stories.every((s) => s.id !== null && seenIds.has(s.id));
    },
    [seenIds],
  );

  return {
    storyGroups,
    seenIds,
    markSeen,
    isGroupSeen,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    queryClient,
  };
}
