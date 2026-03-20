import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  type PublicProfile,
} from '@/features/profile/api/profileApi';

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProfile(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.PROFILE.user(userId);

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery<PublicProfile>({
    queryKey,
    queryFn: () => getUserProfile(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  const isFollowing = profile?.is_following ?? false;
  const followCount = profile?.followers_count ?? 0;

  // ─── Follow / Unfollow Mutation ─────────────────────────────────────────────

  const { mutate: toggleFollow, isPending: isTogglingFollow } = useMutation({
    mutationFn: () => (isFollowing ? unfollowUser(userId) : followUser(userId)),

    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PublicProfile>(queryKey);

      if (previous) {
        queryClient.setQueryData<PublicProfile>(queryKey, {
          ...previous,
          is_following: !isFollowing,
          followers_count: isFollowing
            ? Math.max(0, previous.followers_count - 1)
            : previous.followers_count + 1,
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData<PublicProfile>(queryKey, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    profile,
    isFollowing,
    followCount,
    toggleFollow,
    isLoading,
    isError,
    isTogglingFollow,
    refetch,
  };
}
