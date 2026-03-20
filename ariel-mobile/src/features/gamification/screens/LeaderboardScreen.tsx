import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { getLeaderboard } from '@/features/gamification/api/gamificationApi';
import { LeaderboardRow } from '@/features/gamification/components/LeaderboardRow';
import type { LeaderboardEntry } from '@/shared/types/gamification';

type Tab = 'streaks' | 'xp';

export function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('streaks');

  const { data: entries = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.ACHIEVEMENTS.leaderboard(),
    queryFn: getLeaderboard,
    staleTime: 1000 * 60 * 5,
  });

  // Find current user entry for sticky footer
  const currentUserEntry = entries.find((e) => e.is_current_user);
  const currentUserInTop = entries
    .slice(0, 20)
    .some((e) => e.is_current_user);

  // Sort for display
  const displayEntries: LeaderboardEntry[] = [...entries].sort((a, b) => {
    if (activeTab === 'streaks') {
      return b.current_streak - a.current_streak;
    }
    return b.total_points - a.total_points;
  });

  const renderItem: ListRenderItem<LeaderboardEntry> = ({ item }) => (
    <LeaderboardRow entry={item} />
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard 🔥</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'streaks' && styles.tabActive]}
          onPress={() => setActiveTab('streaks')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'streaks' }}
        >
          <Text style={[styles.tabText, activeTab === 'streaks' && styles.tabTextActive]}>
            Streaks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'xp' && styles.tabActive]}
          onPress={() => setActiveTab('xp')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'xp' }}
        >
          <Text style={[styles.tabText, activeTab === 'xp' && styles.tabTextActive]}>
            XP
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.violet[400]} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Failed to load leaderboard</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayEntries}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No data yet — be the first!</Text>
            </View>
          }
        />
      )}

      {/* Sticky current user row (if not in visible top) */}
      {!isLoading && !isError && currentUserEntry && !currentUserInTop && (
        <View style={styles.stickyCurrentUser}>
          <Text style={styles.stickyLabel}>Your rank</Text>
          <LeaderboardRow entry={currentUserEntry} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
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

  tabs: {
    flexDirection: 'row',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xs / 2,
    gap: SPACING.xs / 2,
  },

  tab: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },

  tabActive: {
    backgroundColor: COLORS.violet[600],
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
  },

  tabTextActive: {
    color: COLORS.textPrimary,
  },

  listContent: {
    paddingBottom: SPACING['4xl'],
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },

  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING.md,
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

  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.base,
    textAlign: 'center',
  },

  stickyCurrentUser: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },

  stickyLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as any,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xs,
  },
});
