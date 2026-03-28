import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/shared/constants/theme';
import type { MessageWithSender } from '@/shared/types/message';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  return `${API_BASE}${uri}`;
}

interface MessageBubbleProps {
  message: MessageWithSender;
  showTimestamp: boolean;
  showAvatar?: boolean; // show sender face for received messages
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = SCREEN_WIDTH * 0.75;
const AVATAR_SIZE = 28;

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return '';
  }
}

function formatDateHeader(dateStr: string): string {
  try {
    const d = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined });
  } catch {
    return '';
  }
}

// ─── Read receipt indicator ──────────────────────────────────────────────────
// 3 states:
//   • read       → small violet dot (seen)
//   • delivered  → double grey ticks (received but not opened)
//   • sent       → single grey tick (on server, not yet received)
//
// Backend only tracks is_read. We treat "delivered" as: message exists
// on server (it was POSTed successfully) so we show double grey by default.
// Single tick only shows briefly while sending (optimistic), but since we
// append after the API resolves, all messages here are at least "delivered".
// We use the `delivered` prop so the parent can pass false for optimistic msgs.

function ReadReceipt({ isRead, delivered = true }: { isRead: boolean; delivered?: boolean }) {
  if (isRead) {
    // Violet dot — seen
    return (
      <View style={rs.container}>
        <View style={rs.readDot} />
      </View>
    );
  }
  if (delivered) {
    // Double grey ticks — delivered
    return (
      <View style={rs.container}>
        <Ionicons name="checkmark-done" size={14} color="#71767b" />
      </View>
    );
  }
  // Single grey tick — sent but not delivered
  return (
    <View style={rs.container}>
      <Ionicons name="checkmark" size={14} color="#52525b" />
    </View>
  );
}

const rs = StyleSheet.create({
  container: { marginLeft: 4, alignSelf: 'flex-end' },
  readDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#7c3aed',
    marginBottom: 1,
  },
});

// ─── Sender avatar ──────────────────────────────────────────────────────────

function SenderAvatar({ uri, username }: { uri?: string | null; username?: string | null }) {
  const resolved = resolveUri(uri);
  const letter = (username ?? '?').charAt(0).toUpperCase();

  if (resolved) {
    return (
      <Image
        source={{ uri: resolved }}
        style={avatarStyles.img}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View style={[avatarStyles.img, avatarStyles.fallback]}>
      <Text style={avatarStyles.letter}>{letter}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  img: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  fallback: {
    backgroundColor: '#1d1f23',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    color: '#71767b',
    fontSize: 11,
    fontWeight: '700',
  },
});

// ─── Main component ─────────────────────────────────────────────────────────

export function MessageBubble({
  message,
  showTimestamp,
  showAvatar = true,
}: MessageBubbleProps): React.ReactElement {
  const isSent = message.is_sent_by_current_user;
  const time = formatTime(message.created_at);

  return (
    <View style={styles.outer}>
      {/* Date header (shown every 30 min) */}
      {showTimestamp && (
        <View style={styles.dateHeaderRow}>
          <View style={styles.dateHeaderLine} />
          <Text style={styles.dateHeaderText}>{formatDateHeader(message.created_at)}</Text>
          <View style={styles.dateHeaderLine} />
        </View>
      )}

      {/* Message row */}
      <View style={[styles.row, isSent ? styles.rowSent : styles.rowReceived]}>
        {/* Sender avatar — only for received messages */}
        {!isSent && showAvatar ? (
          <View style={styles.avatarCol}>
            <SenderAvatar uri={message.sender_profile_picture} username={message.sender_username} />
          </View>
        ) : !isSent ? (
          <View style={styles.avatarSpacer} />
        ) : null}

        {/* Bubble */}
        <View style={[
          styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleReceived,
          { maxWidth: MAX_BUBBLE_WIDTH },
        ]}>
          {/* Reply preview */}
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

          {/* Message text */}
          <Text style={styles.messageText}>{message.content}</Text>

          {/* Time + read receipt row */}
          <View style={styles.metaRow}>
            <Text style={[styles.timeText, isSent && styles.timeTextSent]}>{time}</Text>
            {isSent && <ReadReceipt isRead={message.is_read} />}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outer: {
    marginVertical: 1,
  },

  // Date header
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    marginHorizontal: SPACING.lg,
    gap: 10,
  },
  dateHeaderLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#2f3336',
  },
  dateHeaderText: {
    color: '#71767b',
    fontSize: 11,
    fontWeight: '600',
  },

  // Message row
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: SPACING.md,
    marginVertical: 1,
  },
  rowSent: {
    justifyContent: 'flex-end',
  },
  rowReceived: {
    justifyContent: 'flex-start',
  },

  // Avatar
  avatarCol: {
    marginRight: 6,
    marginBottom: 2,
  },
  avatarSpacer: {
    width: AVATAR_SIZE + 6,
  },

  // Bubble
  bubble: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  bubbleSent: {
    backgroundColor: COLORS.violet[600],
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: '#1d1f23',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
  },

  messageText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 21,
  },

  // Time + read receipt
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  timeText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
  },
  timeTextSent: {
    color: 'rgba(255,255,255,0.55)',
  },

  // Reply preview
  replyPreview: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  replyPreviewSent: {
    borderLeftColor: 'rgba(255,255,255,0.4)',
  },
  replyPreviewReceived: {
    borderLeftColor: '#7c3aed',
  },
  replyAuthor: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 1,
  },
  replyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
});
