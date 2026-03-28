import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoriesFeed, getMyStories } from '@/features/stories/api/storiesApi';
import { useAuthStore } from '@/shared/auth/authStore';
import type { StoryGroup, StoryResponse } from '@/shared/types/story';

const SEEN_STORIES_KEY = 'ariel_seen_stories';
const STORIES_QUERY_KEY = ['stories', 'feed'] as const;
const MY_STORIES_QUERY_KEY = ['stories', 'mine'] as const;

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
  } catch {}
}

export function useStories() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSeenIds().then(setSeenIds);
  }, []);

  // Feed stories (from people you follow)
  const feedQuery = useQuery<StoryGroup[], Error>({
    queryKey: STORIES_QUERY_KEY,
    queryFn: getStoriesFeed,
    staleTime: 1000 * 60 * 2,
  });

  // Your own stories
  const myQuery = useQuery<StoryResponse[], Error>({
    queryKey: MY_STORIES_QUERY_KEY,
    queryFn: getMyStories,
    staleTime: 1000 * 60 * 2,
  });

  // Build your own story group from your stories
  const myStoryGroup = useMemo<StoryGroup | null>(() => {
    const myStories = myQuery.data;
    if (!myStories || myStories.length === 0 || !user) return null;

    return {
      user_id: user.id ?? '',
      username: user.username ?? null,
      full_name: user.full_name ?? null,
      profile_picture: user.profile_picture ?? null,
      is_verified: false,
      stories: myStories,
      total_stories: myStories.length,
      unviewed_count: 0, // own stories are always "viewed"
      latest_story_time: myStories[0]?.created_at ?? '',
    };
  }, [myQuery.data, user]);

  // Merge: your story group first, then feed groups
  const storyGroups = useMemo<StoryGroup[]>(() => {
    const feed = feedQuery.data ?? [];
    if (!myStoryGroup) return feed;
    // Remove self from feed if backend somehow includes it
    const filtered = feed.filter((g) => g.user_id !== myStoryGroup.user_id);
    return [myStoryGroup, ...filtered];
  }, [feedQuery.data, myStoryGroup]);

  const markSeen = useCallback(async (ids: string | string[]) => {
    const toMark = Array.isArray(ids) ? ids : [ids];
    setSeenIds((prev) => {
      const next = new Set(prev);
      toMark.forEach((id) => next.add(id));
      persistSeenIds(next);
      return next;
    });
  }, []);

  const isGroupSeen = useCallback(
    (group: StoryGroup): boolean => {
      if (group.stories.length === 0) return true;
      // Own stories are always considered "seen"
      if (group.user_id === user?.id) return true;
      return group.stories.every((s) => s.id !== null && seenIds.has(s.id));
    },
    [seenIds, user?.id],
  );

  return {
    storyGroups,
    myStoryGroup,
    seenIds,
    markSeen,
    isGroupSeen,
    isLoading: feedQuery.isLoading,
    isError: feedQuery.isError,
    refetch: async () => {
      await Promise.all([feedQuery.refetch(), myQuery.refetch()]);
    },
    queryClient,
  };
}
