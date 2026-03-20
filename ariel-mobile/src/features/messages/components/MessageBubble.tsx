import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';
import { timeAgo } from '@/shared/utils/time';
import type { MessageWithSender } from '@/shared/types/message';

interface MessageBubbleProps {
  message: MessageWithSender;
  showTimestamp: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;

export function MessageBubble({
  message,
  showTimestamp,
}: MessageBubbleProps): React.ReactElement {
  const isSent = message.is_sent_by_current_user;

  return (
    <View style={[styles.wrapper, isSent ? styles.wrapperSent : styles.wrapperReceived]}>
      {/* Timestamp (shown every 30 min) */}
      {showTimestamp && (
        <Text style={styles.timestamp}>{timeAgo(message.created_at)}</Text>
      )}

      {/* Reply-to preview */}
      {message.reply_to_content != null && (
        <View style={[styles.replyPreview, isSent ? styles.replyPreviewSent : styles.replyPreviewReceived]}>
          <Text style={styles.replyAuthor} numberOfLines={1}>
            {message.reply_to_sender_username ?? 'Unknown'}
          </Text>
          <Text style={styles.replyText} numberOfLines={2}>
            {message.reply_to_content}
          </Text>
        </View>
      )}

      {/* Bubble */}
      <View style={[
        styles.bubble,
        isSent ? styles.bubbleSent : styles.bubbleReceived,
        { maxWidth: MAX_BUBBLE_WIDTH },
      ]}>
        <Text style={styles.messageText}>{message.content}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 2,
    marginHorizontal: SPACING.lg,
  },
  wrapperSent: {
    alignItems: 'flex-end',
  },
  wrapperReceived: {
    alignItems: 'flex-start',
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginBottom: SPACING.xs,
    alignSelf: 'center',
    marginVertical: SPACING.sm,
  },
  // Sent bubble: violet, round except bottom-right
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleSent: {
    backgroundColor: COLORS.violet[600], // #7c3aed
    alignSelf: 'flex-end',
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  // Received bubble: dark zinc, round except bottom-left
  bubbleReceived: {
    backgroundColor: COLORS.surface2, // #27272a
    alignSelf: 'flex-start',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.5,
  },
  // Reply preview
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    marginBottom: 4,
    maxWidth: MAX_BUBBLE_WIDTH,
    opacity: 0.75,
  },
  replyPreviewSent: {
    borderLeftColor: COLORS.violet[300],
  },
  replyPreviewReceived: {
    borderLeftColor: COLORS.border,
  },
  replyAuthor: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    marginBottom: 2,
  },
  replyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
});
