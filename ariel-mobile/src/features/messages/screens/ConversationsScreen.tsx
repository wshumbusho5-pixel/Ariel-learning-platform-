import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { useConversations } from '@/features/messages/hooks/useConversations';
import { ConversationRow } from '@/features/messages/components/ConversationRow';
import type { ConversationSummary } from '@/shared/types/message';
import type { MessagesStackParamList } from '@/features/messages/MessagesNavigator';

// ─── Buddy persistence (AsyncStorage-backed) ─────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const BUDDIES_KEY = 'ariel_buddies';

async function loadBuddies(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(BUDDIES_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

async function saveBuddies(set: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(BUDDIES_KEY, JSON.stringify([...set]));
  } catch {}
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'buddies';

type Props = NativeStackScreenProps<MessagesStackParamList, 'Conversations'>;

// ─── Component ────────────────────────────────────────────────────────────────

export function ConversationsScreen({ navigation }: Props): React.ReactElement {
  const { conversations, isLoading, unreadTotal } = useConversations();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [buddies, setBuddies] = useState<Set<string>>(new Set());

  // Load buddies on mount
  React.useEffect(() => {
    loadBuddies().then(setBuddies).catch(() => {});
  }, []);

  const toggleBuddy = useCallback((convId: string) => {
    setBuddies((prev) => {
      const next = new Set(prev);
      next.has(convId) ? next.delete(convId) : next.add(convId);
      void saveBuddies(next);
      return next;
    });
  }, []);

  const filtered = useMemo<ConversationSummary[]>(() => {
    let list = conversations;
    if (tab === 'unread') list = list.filter((c) => c.unread_count > 0);
    if (tab === 'buddies') list = list.filter((c) => buddies.has(c.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.other_user_full_name ?? '').toLowerCase().includes(q) ||
          (c.other_user_username ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [conversations, tab, search, buddies]);

  const unreadConvCount = useMemo(
    () => conversations.filter((c) => c.unread_count > 0).length,
    [conversations],
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'buddies', label: 'Buddies ⭐' },
  ];

  const renderItem = useCallback(
    ({ item }: { item: ConversationSummary }) => (
      <ConversationRow
        conversation={item}
        isBuddy={buddies.has(item.id)}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item.id,
            otherUserId: item.other_user_id,
            otherUsername: item.other_user_username ?? item.other_user_full_name ?? 'User',
            otherProfilePicture: item.other_user_profile_picture ?? undefined,
          })
        }
        onBuddyToggle={() => toggleBuddy(item.id)}
      />
    ),
    [buddies, navigation, toggleBuddy],
  );

  const keyExtractor = useCallback((item: ConversationSummary) => item.id, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => navigation.navigate('NewMessage')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {/* Paper-plane / compose icon */}
          <Text style={styles.composeIcon}>✉</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search messages..."
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
            {t.key === 'unread' && unreadConvCount > 0 && (
              <View style={[styles.tabBadge, tab === 'unread' && styles.tabBadgeDark]}>
                <Text style={styles.tabBadgeText}>{unreadConvCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.violet[500]} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {tab === 'buddies'
              ? 'No buddies yet'
              : tab === 'unread'
              ? 'All caught up!'
              : search
              ? `No results for "${search}"`
              : 'No messages yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'buddies'
              ? 'Star a conversation to add them as a buddy'
              : tab === 'unread'
              ? "You've read everything"
              : 'Start a conversation!'}
          </Text>
          {tab === 'all' && !search && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => navigation.navigate('NewMessage')}
            >
              <Text style={styles.startButtonText}>Start a conversation</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  composeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.full,
  },
  composeIcon: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: COLORS.textMuted,
    padding: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.bold as '700',
  },
  tabTextActive: {
    color: '#18181b',
  },
  tabBadge: {
    marginLeft: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.violet[600],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeDark: {
    backgroundColor: '#18181b',
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: TYPOGRAPHY.fontWeight.extrabold as '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: SPACING['4xl'],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['3xl'],
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
  },
  startButton: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet[500],
  },
  startButtonText: {
    color: '#ffffff',
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
  },
});
