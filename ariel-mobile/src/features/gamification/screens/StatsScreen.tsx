import React from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/shared/constants/theme';
import { getStats } from '@/features/gamification/api/gamificationApi';
import { useGamification } from '@/features/gamification/hooks/useGamification';
import { DailyGoalRing } from '@/features/gamification/components/DailyGoalRing';
import { XPBar } from '@/features/gamification/components/XPBar';
import { StreakCounter } from '@/features/gamification/components/StreakCounter';

interface StatTileProps {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
}

function StatTile({ label, value, icon, accent }: StatTileProps) {
  return (
    <View style={[styles.tile, SHADOWS.sm]}>
      <Text style={styles.tileIcon}>{icon}</Text>
      <Text style={[styles.tileValue, accent ? { color: accent } : undefined]}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function StatsScreen() {
  const {
    level,
    xp,
    xpToNext,
    xpPercent,
    totalXp,
    streak,
    longestStreak,
    dailyGoal,
    isLoading,
    isError,
    refetch,
  } = useGamification();

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.GAMIFICATION.stats(),
    queryFn: getStats,
    staleTime: 1000 * 60 * 5,
  });

  const rawStats = statsQuery.data;
  // Extract total cards reviewed from achievements array (streak_bonus_today is a proxy)
  const totalCardsReviewed = rawStats?.achievements?.length
    ? rawStats.achievements.reduce((sum, a) => sum + (a.points ?? 0), 0)
    : 0;

  if (isLoading || statsQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.violet[400]} size="large" />
      </View>
    );
  }

  if (isError || statsQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load stats</Text>
        <TouchableOpacity
          onPress={() => {
            refetch();
            statsQuery.refetch();
          }}
          style={styles.retryBtn}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Stats</Text>
      </View>

      {/* Daily Goal Ring (centered) */}
      <View style={styles.ringSection}>
        <DailyGoalRing
          completed={dailyGoal.completed}
          target={dailyGoal.target}
        />
        <Text style={styles.ringLabel}>Daily Goal</Text>
        <Text style={styles.ringSubLabel}>
          {dailyGoal.isComplete
            ? 'Goal complete! Great work.'
            : `${dailyGoal.target - dailyGoal.completed} cards to go`}
        </Text>
      </View>

      {/* XP Bar */}
      <View style={styles.section}>
        <XPBar
          level={level}
          xp={xp}
          xpToNext={xpToNext}
          xpPercent={xpPercent}
        />
      </View>

      {/* Streak Counter (centered) */}
      <View style={styles.streakSection}>
        <StreakCounter streak={streak} />
      </View>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <StatTile
          icon="🃏"
          label="Cards Reviewed"
          value={dailyGoal.completed}
          accent={COLORS.violet[400]}
        />
        <StatTile
          icon="⚡"
          label="Total XP"
          value={totalXp}
          accent={COLORS.warning}
        />
        <StatTile
          icon="🔥"
          label="Best Streak"
          value={`${longestStreak}d`}
          accent={COLORS.subject.sciences}
        />
        <StatTile
          icon="🏆"
          label="Achievements"
          value={rawStats?.achievements?.length ?? 0}
          accent={COLORS.subject.history}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingBottom: SPACING['5xl'],
  },

  header: {
    paddingTop: SPACING['4xl'],
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },

  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  // Daily goal ring
  ringSection: {
    alignItems: 'center',
    paddingVertical: SPACING['3xl'],
    gap: SPACING.md,
  },

  ringLabel: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  ringSubLabel: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // XP bar section
  section: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Streak section
  streakSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginBottom: SPACING.xl,
  },

  // Stats grid (2-column)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },

  tile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.xs,
  },

  tileIcon: {
    fontSize: 28,
    lineHeight: 36,
  },

  tileValue: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as any,
  },

  tileLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    textAlign: 'center',
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING['3xl'],
    gap: SPACING.md,
  },

  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },

  retryBtn: {
    backgroundColor: COLORS.surface2,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },

  retryText: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as any,
  },
});
