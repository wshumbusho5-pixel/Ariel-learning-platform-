import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from '@/shared/components/Avatar';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';
import apiClient from '@/shared/api/client';
import { SOCIAL } from '@/shared/api/endpoints';
import type { SearchUserResult } from '@/features/discover/api/discoverApi';

interface UserSearchResultProps {
  user: SearchUserResult;
  onPress?: (user: SearchUserResult) => void;
}

export function UserSearchResult({ user, onPress }: UserSearchResultProps): React.ReactElement {
  // Optimistic follow state initialised from server data
  const [isFollowing, setIsFollowing] = useState(user.is_following);
  const [isPending, setIsPending] = useState(false);

  const handleFollow = async () => {
    if (isPending) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setIsPending(true);
    try {
      await apiClient.post(SOCIAL.FOLLOW(user.id));
    } catch {
      // Revert on failure
      setIsFollowing(prev);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={() => onPress?.(user)}
      activeOpacity={0.7}
      style={styles.container}
    >
      {/* Avatar */}
      <Avatar
        uri={user.profile_picture}
        username={user.username}
        size={40}
      />

      {/* Name + username + bio */}
      <View style={styles.textGroup}>
        <Text style={styles.fullName} numberOfLines={1}>
          {user.full_name ?? user.username}
        </Text>
        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>
        {user.bio ? (
          <Text style={styles.bio} numberOfLines={1}>
            {user.bio}
          </Text>
        ) : null}
      </View>

      {/* Follow / Following button */}
      <TouchableOpacity
        onPress={handleFollow}
        activeOpacity={0.7}
        style={[styles.followButton, isFollowing && styles.followingButton]}
        disabled={isPending}
      >
        <Text style={[styles.followText, isFollowing && styles.followingText]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  textGroup: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  fullName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
  },
  username: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  bio: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.violet[500],
    backgroundColor: COLORS.violet[500],
    flexShrink: 0,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  followText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '700',
  },
  followingText: {
    color: COLORS.textSecondary,
  },
});
