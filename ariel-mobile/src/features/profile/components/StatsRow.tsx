import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '@/shared/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatItemProps {
  value: number | string;
  label: string;
  onPress?: () => void;
}

interface StatsRowProps {
  followersCount: number;
  followingCount: number;
  streak: number;
  level: number;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
}

// ─── Stat Item ────────────────────────────────────────────────────────────────

function StatItem({ value, label, onPress }: StatItemProps) {
  const content = (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function StatDivider() {
  return <View style={styles.divider} />;
}

// ─── Stats Row ────────────────────────────────────────────────────────────────

export function StatsRow({
  followersCount,
  followingCount,
  streak,
  level,
  onFollowersPress,
  onFollowingPress,
}: StatsRowProps) {
  return (
    <View style={styles.container}>
      <StatItem
        value={followersCount}
        label="Followers"
        onPress={onFollowersPress}
      />
      <StatDivider />
      <StatItem
        value={followingCount}
        label="Following"
        onPress={onFollowingPress}
      />
      <StatDivider />
      <StatItem value={`🔥 ${streak}`} label="Streak" />
      <StatDivider />
      <StatItem value={`⭐ ${level}`} label="Level" />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
});
