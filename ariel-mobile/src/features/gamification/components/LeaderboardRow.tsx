import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { LeaderboardEntry } from '@/shared/types/gamification';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
}

const RANK_TINT: Record<number, string> = {
  1: 'rgba(250,204,21,0.12)',  // gold
  2: 'rgba(148,163,184,0.12)', // silver
  3: 'rgba(251,146,60,0.12)',  // bronze
};

const RANK_COLOR: Record<number, string> = {
  1: '#facc15',
  2: '#94a3b8',
  3: '#fb923c',
};

export function LeaderboardRow({ entry }: LeaderboardRowProps) {
  const { rank, username, full_name, profile_picture, current_streak, is_current_user } = entry;

  const rowTint = is_current_user
    ? `${COLORS.violet[500]}22`
    : RANK_TINT[rank] ?? 'transparent';

  const rankColor = RANK_COLOR[rank] ?? COLORS.textMuted;
  const displayName = full_name ?? username ?? 'Anonymous';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: rowTint },
        is_current_user && styles.currentUserRow,
      ]}
      accessibilityLabel={`Rank ${rank}: ${displayName}, ${current_streak} day streak`}
    >
      {/* Rank */}
      <View style={styles.rankContainer}>
        <Text style={[styles.rank, rank <= 3 && { color: rankColor }]}>
          {rank}
        </Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {profile_picture ? (
          <Image
            source={{ uri: profile_picture }}
            style={styles.avatar}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initials}</Text>
          </View>
        )}
      </View>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text style={[styles.name, is_current_user && styles.nameCurrentUser]} numberOfLines={1}>
          {displayName}
        </Text>
        {username && full_name && (
          <Text style={styles.username} numberOfLines={1}>
            @{username}
          </Text>
        )}
      </View>

      {/* Streak */}
      <View style={styles.streakContainer}>
        <Text style={styles.streakEmoji}>🔥</Text>
        <Text style={[styles.streakCount, is_current_user && { color: COLORS.violet[400] }]}>
          {current_streak}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
    gap: SPACING.md,
  },

  currentUserRow: {
    borderWidth: 1,
    borderColor: `${COLORS.violet[500]}55`,
  },

  rankContainer: {
    width: 28,
    alignItems: 'center',
  },

  rank: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  avatarContainer: {
    // just wraps for clarity
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  avatarFallback: {
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitial: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  nameContainer: {
    flex: 1,
    gap: 2,
  },

  name: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  nameCurrentUser: {
    color: COLORS.violet[300],
  },

  username: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },

  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  streakEmoji: {
    fontSize: 16,
  },

  streakCount: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },
});
