import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SectionListRenderItemInfo,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';
import { parseUTC } from '@/shared/utils/time';
import type { Notification } from '@/shared/types/notification';
import { NotificationType } from '@/shared/types/notification';
import type { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { NotificationGroupHeader } from '@/features/notifications/components/NotificationGroupHeader';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationSection {
  title: string;
  data: Notification[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function groupNotifications(notifications: Notification[]): NotificationSection[] {
  const now = Date.now();
  const today: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of notifications) {
    const age = now - parseUTC(n.created_at).getTime();
    if (age <= TWENTY_FOUR_HOURS_MS) {
      today.push(n);
    } else {
      earlier.push(n);
    }
  }

  const sections: NotificationSection[] = [];
  if (today.length > 0) {
    sections.push({ title: 'Today', data: today });
  }
  if (earlier.length > 0) {
    sections.push({ title: 'Earlier', data: earlier });
  }
  return sections;
}

/**
 * Determine where to navigate when a notification row is tapped.
 * Returns an action object that NotificationsScreen can dispatch.
 */
function resolveNavigation(
  notification: Notification,
  navigation: NavigationProp,
): () => void {
  const type = notification.notification_type;

  switch (type) {
    case NotificationType.NEW_FOLLOWER:
    case NotificationType.FOLLOW_BACK:
      // Navigate to actor's profile (not yet a param in RootStack, use action_url fallback)
      return () => {
        // Profile navigation — wire up when ProfileStack is registered
        // navigation.navigate('Profile', { userId: notification.actor_id ?? '' });
      };

    case NotificationType.DECK_LIKE:
    case NotificationType.DECK_SAVE:
    case NotificationType.DECK_COMMENT:
    case NotificationType.COMMENT_REPLY:
      return () => {
        if (notification.related_deck_id) {
          // navigation.navigate('DeckDetail', { id: notification.related_deck_id });
        }
      };

    case NotificationType.DUEL_CHALLENGE:
      return () => {
        if (notification.metadata?.room_id) {
          // TODO: navigate('Duels') then into room — for now go to Duels tab
          navigation.navigate('Main' as any);
        }
      };

    case NotificationType.ACHIEVEMENT_UNLOCKED:
    case NotificationType.FRIEND_ACHIEVEMENT:
    case NotificationType.STREAK_MILESTONE:
    case NotificationType.STREAK_RISK:
    case NotificationType.DAILY_GOAL_MET:
    case NotificationType.LEADERBOARD_RANK:
      return () => {
        // navigation.navigate('Achievements');
      };

    case NotificationType.NEW_MESSAGE:
      return () => {
        // navigation.navigate('Messages');
      };

    case NotificationType.STORY_VIEW:
    case NotificationType.STORY_MILESTONE:
      return () => {
        if (notification.related_story_id) {
          // navigation.navigate('StoryDetail', { id: notification.related_story_id });
        }
      };

    default:
      return () => undefined;
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState(): React.ReactElement {
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  return (
    <View style={[styles.emptyContainer, isShort && { paddingTop: SPACING['3xl'] }]}>
      <Text style={[styles.emptyEmoji, isShort && { fontSize: 36, marginBottom: SPACING.sm }]}>🎉</Text>
      <Text style={styles.emptyTitle}>You're all caught up</Text>
      <Text style={styles.emptySubtitle}>No new notifications right now.</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function NotificationsScreen(): React.ReactElement {
  const { height: H } = useWindowDimensions();
  const isShort = H < 720;
  const navigation = useNavigation<NavigationProp>();
  const {
    notifications,
    isLoading,
    isError,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markRead,
    markAllRead,
    isMarkingAllRead,
  } = useNotifications();

  // Mark all as read when the screen is visited
  useEffect(() => {
    const hasUnread = notifications.some((n) => !n.is_read);
    if (hasUnread) {
      markAllRead();
    }
  // Only run on mount; notifications list excluded intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = useMemo(
    () => groupNotifications(notifications),
    [notifications],
  );

  const handleRowPress = useCallback(
    (notification: Notification) => {
      // Mark individual notification read (optimistic)
      if (!notification.is_read && notification.id) {
        markRead(notification.id);
      }
      // Navigate
      resolveNavigation(notification, navigation)();
    },
    [markRead, navigation],
  );

  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<Notification>) => (
      <NotificationRow
        notification={item}
        onPress={() => handleRowPress(item)}
      />
    ),
    [handleRowPress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: NotificationSection }) => (
      <NotificationGroupHeader title={section.title} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: Notification, index: number) => item.id ?? String(index),
    [],
  );

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const ListFooter = isFetchingNextPage ? (
    <ActivityIndicator
      size="small"
      color={COLORS.violet[500]}
      style={styles.footerLoader}
    />
  ) : null;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.violet[500]} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load notifications.</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, isShort && { paddingTop: SPACING.xl, paddingBottom: SPACING.sm }]}>
        <Text style={[styles.headerTitle, isShort && { fontSize: TYPOGRAPHY.fontSize.xl }]}>Notifications</Text>
        <TouchableOpacity
          onPress={markAllRead}
          disabled={isMarkingAllRead}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.markAllReadText,
              isMarkingAllRead && styles.markAllReadDisabled,
            ]}
          >
            Mark all read
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <SectionList<Notification, NotificationSection>
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={<EmptyState />}
        ListFooterComponent={ListFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.violet[400]}
            colors={[COLORS.violet[500]]}
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={
          sections.length === 0 ? styles.emptyListContent : undefined
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING['3xl'],
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    color: COLORS.textPrimary,
  },
  markAllReadText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
    color: COLORS.violet[400],
  },
  markAllReadDisabled: {
    opacity: 0.4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderSubtle,
    marginLeft: SPACING.lg + 44 + SPACING.md, // align to text, after icon circle
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
  },
  retryText: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
    paddingTop: SPACING['5xl'],
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
