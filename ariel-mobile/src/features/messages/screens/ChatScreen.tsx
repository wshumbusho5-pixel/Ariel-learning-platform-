import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { parseUTC } from '@/shared/utils/time';
import { useChatSocket } from '@/features/messages/hooks/useChatSocket';
import { markRead } from '@/features/messages/api/messagesApi';
import { MessageBubble } from '@/features/messages/components/MessageBubble';
import { MessageInput } from '@/features/messages/components/MessageInput';
import type { MessageWithSender } from '@/shared/types/message';
import type { MessagesStackParamList } from '@/features/messages/MessagesNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<MessagesStackParamList, 'Chat'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - parseUTC(lastSeen).getTime() < 2 * 60 * 1000;
}

/**
 * Determine whether a timestamp separator should appear above this message.
 * Since FlatList is inverted, `index 0` is the newest message.
 * We show a timestamp when the gap between this message and the NEXT one
 * (which is at index + 1) exceeds 30 minutes, or when this is the oldest message.
 */
function shouldShowTimestamp(
  messages: MessageWithSender[],
  index: number,
): boolean {
  // Last item (oldest) always shows timestamp
  if (index === messages.length - 1) return true;
  const current = parseUTC(messages[index].created_at).getTime();
  const next = parseUTC(messages[index + 1].created_at).getTime();
  return current - next >= THIRTY_MINUTES_MS;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChatScreen({ route, navigation }: Props): React.ReactElement {
  const {
    conversationId,
    otherUserId,
    otherUsername,
    otherProfilePicture,
  } = route.params;

  // conversationId may be undefined on first open (create on send)
  const resolvedConvId = conversationId ?? otherUserId;

  const { messages, loading, sendMessage, isConnected } = useChatSocket({
    conversationId: resolvedConvId,
    otherUserId,
  });

  const flatListRef = useRef<FlatList<MessageWithSender>>(null);

  // Mark conversation as read on mount
  useEffect(() => {
    if (conversationId) {
      markRead(conversationId).catch(() => {});
    }
  }, [conversationId]);

  const renderItem = useCallback(
    ({ item, index }: { item: MessageWithSender; index: number }) => (
      <MessageBubble
        message={item}
        showTimestamp={shouldShowTimestamp(messages, index)}
      />
    ),
    [messages],
  );

  const keyExtractor = useCallback(
    (item: MessageWithSender) => item.id,
    [],
  );

  const initial = otherUsername[0]?.toUpperCase() ?? '?';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Avatar + name */}
        <View style={styles.headerInfo}>
          {otherProfilePicture ? (
            <Image
              source={{ uri: otherProfilePicture }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUsername}
            </Text>
            <Text style={[styles.headerStatus, isConnected && styles.headerStatusOnline]}>
              {isConnected ? '● Online' : 'Tap to chat'}
            </Text>
          </View>
        </View>

        {/* Spacer to balance the back button */}
        <View style={styles.headerRight} />
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={COLORS.violet[500]} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Say hi to {otherUsername}!
                </Text>
              </View>
            }
          />
        )}

        <MessageInput onSend={sendMessage} disabled={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 36;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  backArrow: {
    color: COLORS.textSecondary,
    fontSize: 28,
    lineHeight: 32,
    marginTop: -2,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.sm,
  },
  headerAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  headerAvatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerAvatarInitial: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerName: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
  headerStatus: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    marginTop: 1,
  },
  headerStatusOnline: {
    color: COLORS.success,
  },
  headerRight: {
    width: 36,
  },
  listContent: {
    paddingVertical: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    // inverted list — this renders at the "top" visually
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['4xl'],
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
