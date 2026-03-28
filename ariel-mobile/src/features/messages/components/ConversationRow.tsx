import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { timeAgo, parseUTC } from '@/shared/utils/time';
import type { ConversationSummary } from '@/shared/types/message';
import { UnreadBadge } from '@/features/messages/components/UnreadBadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - parseUTC(lastSeen).getTime() < 2 * 60 * 1000;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConversationRowProps {
  conversation: ConversationSummary;
  isBuddy: boolean;
  onPress: () => void;
  onBuddyToggle: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversationRow({
  conversation,
  isBuddy,
  onPress,
  onBuddyToggle,
}: ConversationRowProps): React.ReactElement {
  const {
    other_user_username,
    other_user_full_name,
    other_user_profile_picture,
    other_user_last_seen,
    last_message_content,
    last_message_at,
    unread_count,
  } = conversation;

  const name = other_user_username ?? other_user_full_name ?? '?';
  const initial = name[0]?.toUpperCase() ?? '?';
  const online = isOnline(other_user_last_seen);
  const hasUnread = unread_count > 0;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {other_user_profile_picture ? (
          <Image
            source={{ uri: other_user_profile_picture }}
            style={styles.avatar}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}

        {/* Online dot — show only when no unread badge occupying same corner */}
        {online && !hasUnread && (
          <View style={styles.onlineDot} />
        )}

        {/* Unread badge — top-right of avatar */}
        {hasUnread && <UnreadBadge count={unread_count} />}
      </View>

      {/* Text block */}
      <View style={styles.textBlock}>
        <View style={styles.topRow}>
          <Text
            style={[styles.name, hasUnread && styles.nameBold]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={styles.time}>{timeAgo(last_message_at)}</Text>
        </View>
        <Text
          style={[styles.preview, hasUnread && styles.previewUnread]}
          numberOfLines={1}
        >
          {online && !last_message_content ? (
            <Text style={styles.onlineText}>● Online</Text>
          ) : (
            last_message_content ?? 'Start a conversation'
          )}
        </Text>
      </View>

      {/* Buddy star */}
      <TouchableOpacity
        style={styles.starButton}
        onPress={onBuddyToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={isBuddy ? 'star' : 'star-outline'}
          size={18}
          color={isBuddy ? '#fbbf24' : '#2f3336'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 44;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  avatarContainer: {
    position: 'relative',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginRight: SPACING.md,
    flexShrink: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: SPACING.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  name: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  nameBold: {
    color: COLORS.textPrimary,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 11,
    flexShrink: 0,
  },
  preview: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 2,
  },
  previewUnread: {
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeight.medium as '500',
  },
  onlineText: {
    color: COLORS.success,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  starButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    flexShrink: 0,
  },
});
