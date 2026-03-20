import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import type { ChatMessage } from '@/features/live/hooks/useLiveSocket';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LiveChatProps {
  messages: ChatMessage[];
}

// ─── Message row ──────────────────────────────────────────────────────────────

function MessageRow({ item }: { item: ChatMessage }): React.ReactElement {
  return (
    <View style={styles.messageRow}>
      <Text style={styles.username}>{item.username}</Text>
      <Text style={styles.messageText}> {item.content}</Text>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveChat({ messages }: LiveChatProps): React.ReactElement {
  const listRef = useRef<FlatList<ChatMessage>>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  const renderItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
    <MessageRow item={item} />
  );

  const keyExtractor = (item: ChatMessage) => item.id;

  return (
    <View style={styles.container}>
      {/* Semi-transparent gradient overlay (simulated with a subtle bg) */}
      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        // Keep scroll position at bottom
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Transparent top → dark bottom gradient effect using a background color
    backgroundColor: 'transparent',
  },

  list: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    justifyContent: 'flex-end',
    flexGrow: 1,
  },

  messageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginVertical: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
    maxWidth: '95%',
  },

  username: {
    color: COLORS.violet[400],
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },

  messageText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.normal as '400',
    flexShrink: 1,
  },
});
