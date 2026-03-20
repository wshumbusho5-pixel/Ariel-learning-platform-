import React, { memo } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { timeAgo } from '@/shared/utils/time';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { Notification } from '@/shared/types/notification';
import { NotificationType } from '@/shared/types/notification';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface NotificationRowProps {
  notification: Notification;
  onPress: () => void;
}

// ─── Type config ──────────────────────────────────────────────────────────────

interface TypeConfig {
  emoji: string;
  bgColor: string;
}

const TYPE_CONFIG: Record<string, TypeConfig> = {
  [NotificationType.NEW_FOLLOWER]: {
    emoji: '👤',
    bgColor: '#4c1d95', // violet-900
  },
  [NotificationType.FOLLOW_BACK]: {
    emoji: '👤',
    bgColor: '#4c1d95',
  },
  [NotificationType.DECK_LIKE]: {
    emoji: '❤️',
    bgColor: '#881337', // rose-900
  },
  [NotificationType.DECK_SAVE]: {
    emoji: '🔖',
    bgColor: '#881337',
  },
  [NotificationType.DECK_COMMENT]: {
    emoji: '💬',
    bgColor: '#0c4a6e', // sky-900
  },
  [NotificationType.COMMENT_REPLY]: {
    emoji: '💬',
    bgColor: '#0c4a6e',
  },
  [NotificationType.ACHIEVEMENT_UNLOCKED]: {
    emoji: '🏆',
    bgColor: '#78350f', // amber-900
  },
  [NotificationType.FRIEND_ACHIEVEMENT]: {
    emoji: '🏆',
    bgColor: '#78350f',
  },
  [NotificationType.STREAK_MILESTONE]: {
    emoji: '🔥',
    bgColor: '#7c2d12', // orange-900
  },
  [NotificationType.STREAK_RISK]: {
    emoji: '⚠️',
    bgColor: '#7c2d12',
  },
  [NotificationType.STORY_VIEW]: {
    emoji: '👁️',
    bgColor: '#1e3a5f',
  },
  [NotificationType.STORY_MILESTONE]: {
    emoji: '⭐',
    bgColor: '#713f12', // yellow-900
  },
  [NotificationType.DAILY_GOAL_MET]: {
    emoji: '⭐',
    bgColor: '#713f12',
  },
  [NotificationType.STUDY_REMINDER]: {
    emoji: '📚',
    bgColor: '#1e293b',
  },
  [NotificationType.NEW_MESSAGE]: {
    emoji: '✉️',
    bgColor: '#0c4a6e',
  },
  [NotificationType.TRENDING_DECK]: {
    emoji: '📈',
    bgColor: '#14532d', // green-900
  },
  [NotificationType.LEADERBOARD_RANK]: {
    emoji: '🥇',
    bgColor: '#78350f',
  },
  [NotificationType.DUEL_CHALLENGE]: {
    emoji: '⚔️',
    bgColor: '#4c1d95',
  },
};

const FALLBACK_CONFIG: TypeConfig = {
  emoji: '🔔',
  bgColor: COLORS.surface2,
};

function getTypeConfig(type: string): TypeConfig {
  return TYPE_CONFIG[type] ?? FALLBACK_CONFIG;
}

// ─── Component ────────────────────────────────────────────────────────────────

function NotificationRowComponent({ notification, onPress }: NotificationRowProps): React.ReactElement {
  const config = getTypeConfig(notification.notification_type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.container}
    >
      {/* Icon circle */}
      <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>
        <Text style={styles.iconEmoji}>{config.emoji}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <NotificationText notification={notification} />
        <Text style={{ color: '#71717a', fontSize: 11, marginTop: 2 }}>
          {timeAgo(notification.created_at)}
        </Text>
      </View>

      {/* Unread dot */}
      {!notification.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Rich text renderer ───────────────────────────────────────────────────────

function NotificationText({ notification }: { notification: Notification }): React.ReactElement {
  const actor = notification.actor_username ?? notification.actor_full_name;

  // Build the display string: prefer actor + message structure for rich text
  if (actor) {
    return (
      <Text style={styles.messageText} numberOfLines={2}>
        <Text style={styles.boldText}>{actor}</Text>
        {' '}
        <Text>{notification.message}</Text>
      </Text>
    );
  }

  return (
    <Text style={styles.messageText} numberOfLines={2}>
      {notification.title || notification.message}
    </Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  messageText: {
    color: '#fafafa',
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
    color: COLORS.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet[500],
    flexShrink: 0,
    marginLeft: SPACING.xs,
  },
});

export const NotificationRow = memo(NotificationRowComponent);
