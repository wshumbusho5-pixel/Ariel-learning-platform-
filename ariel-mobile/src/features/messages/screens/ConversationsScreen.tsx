import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/shared/constants/theme';
import { useConversations } from '@/features/messages/hooks/useConversations';
import { ConversationRow } from '@/features/messages/components/ConversationRow';
import { getSuggestedUsers, getFollowing } from '@/features/profile/api/profileApi';
import { useAuthStore } from '@/shared/auth/authStore';
import type { ConversationSummary } from '@/shared/types/message';
import type { FollowerUser } from '@/features/profile/api/profileApi';
import type { MessagesStackParamList } from '@/features/messages/MessagesNavigator';

// ─── Buddy persistence ───────────────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

const BUDDIES_KEY = 'ariel_buddies';
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

function resolveUri(uri?: string | null): string | null {
  if (!uri) return null;
  if (uri.startsWith('http')) return uri;
  return `${API_BASE}${uri}`;
}

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

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'buddies';
type Props = NativeStackScreenProps<MessagesStackParamList, 'Conversations'>;

// ─── Suggested user pill ─────────────────────────────────────────────────────

function SuggestedUserPill({
  user,
  onPress,
}: {
  user: FollowerUser;
  onPress: () => void;
}) {
  const resolved = resolveUri(user.profile_picture);
  const letter = (user.username ?? user.full_name ?? '?').charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={s.suggestedPill} onPress={onPress} activeOpacity={0.7}>
      {resolved ? (
        <Image source={{ uri: resolved }} style={s.suggestedAvatar} contentFit="cover" cachePolicy="memory-disk" />
      ) : (
        <View style={[s.suggestedAvatar, s.suggestedAvatarFallback]}>
          <Text style={s.suggestedAvatarLetter}>{letter}</Text>
        </View>
      )}
      <Text style={s.suggestedName} numberOfLines={1}>
        {user.username ?? user.full_name ?? 'User'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ConversationsScreen({ navigation }: Props): React.ReactElement {
  const { conversations, isLoading, unreadTotal } = useConversations();
  const currentUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [buddies, setBuddies] = useState<Set<string>>(new Set());

  // Suggested users for empty state
  const { data: suggested = [] } = useQuery({
    queryKey: ['social', 'suggested'],
    queryFn: getSuggestedUsers,
    staleTime: 60_000,
  });

  // Following for "people you haven't messaged"
  const { data: following = [] } = useQuery({
    queryKey: ['social', 'following', currentUser?.id],
    queryFn: () => getFollowing(currentUser!.id!),
    enabled: !!currentUser?.id,
    staleTime: 60_000,
  });

  // People you follow but haven't messaged yet
  const unmessaged = useMemo(() => {
    const messaged = new Set(conversations.map((c) => c.other_user_id));
    return following.filter((f) => !messaged.has(f.id));
  }, [following, conversations]);

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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: 'chatbubbles-outline' },
    { key: 'unread', label: 'Unread', icon: 'mail-unread-outline' },
    { key: 'buddies', label: 'Buddies', icon: 'star-outline' },
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
            otherLastSeen: item.other_user_last_seen ?? null,
          })
        }
        onBuddyToggle={() => toggleBuddy(item.id)}
      />
    ),
    [buddies, navigation, toggleBuddy],
  );

  const keyExtractor = useCallback((item: ConversationSummary) => item.id, []);

  // Footer with suggestions — shown below conversations or as empty state content
  const SuggestionsSection = useCallback(() => {
    const people = unmessaged.length > 0 ? unmessaged : suggested;
    if (people.length === 0) return null;

    return (
      <View style={s.suggestionsSection}>
        <Text style={s.suggestionsTitle}>
          {unmessaged.length > 0 ? 'People you follow' : 'Suggested study buddies'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.suggestionsScroll}>
          {people.slice(0, 12).map((user) => (
            <SuggestedUserPill
              key={user.id}
              user={user}
              onPress={() =>
                navigation.navigate('Chat', {
                  otherUserId: user.id,
                  otherUsername: user.username ?? user.full_name ?? 'User',
                  otherProfilePicture: user.profile_picture ?? undefined,
                })
              }
            />
          ))}
        </ScrollView>
      </View>
    );
  }, [unmessaged, suggested, navigation]);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#e7e9ea" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Rooms</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('NewMessage')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="create-outline" size={22} color="#e7e9ea" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <View style={s.searchRow}>
          <Ionicons name="search" size={16} color="#536471" style={{ marginRight: 8 }} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search rooms..."
            placeholderTextColor="#536471"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#536471" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.7}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}
            </Text>
            {t.key === 'unread' && unreadConvCount > 0 && (
              <View style={[s.tabBadge, tab === 'unread' && s.tabBadgeDark]}>
                <Text style={s.tabBadgeText}>{unreadConvCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : filtered.length === 0 ? (
        <ScrollView contentContainerStyle={s.emptyScroll}>
          <View style={s.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#2f3336" />
            <Text style={s.emptyTitle}>
              {tab === 'buddies'
                ? 'No buddies yet'
                : tab === 'unread'
                ? 'All caught up!'
                : search
                ? `No results for "${search}"`
                : 'No rooms yet'}
            </Text>
            <Text style={s.emptySubtitle}>
              {tab === 'buddies'
                ? 'Star a conversation to add them as a buddy'
                : tab === 'unread'
                ? "You've read everything"
                : 'Start chatting with someone below'}
            </Text>
            {tab === 'all' && !search && (
              <TouchableOpacity
                style={s.startButton}
                onPress={() => navigation.navigate('NewMessage')}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.startButtonText}>New conversation</Text>
              </TouchableOpacity>
            )}
          </View>
          <SuggestionsSection />
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<SuggestionsSection />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#2f3336',
  },
  headerTitle: {
    color: '#e7e9ea',
    fontSize: 18,
    fontWeight: '700',
  },

  // Search
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16181c',
    borderWidth: 1,
    borderColor: '#2f3336',
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: '#e7e9ea',
    fontSize: 14,
    paddingVertical: 0,
  },

  // Tabs
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
    backgroundColor: '#16181c',
    borderWidth: 1,
    borderColor: '#2f3336',
  },
  tabActive: {
    backgroundColor: '#e7e9ea',
    borderColor: '#e7e9ea',
  },
  tabText: {
    color: '#71767b',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000',
  },
  tabBadge: {
    marginLeft: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeDark: {
    backgroundColor: '#000',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },

  // List
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: SPACING['4xl'],
  },

  // Empty state
  emptyScroll: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 24,
    gap: 8,
  },
  emptyTitle: {
    color: '#e7e9ea',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#536471',
    fontSize: 13,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#7c3aed',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Suggestions section
  suggestionsSection: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#2f3336',
    marginTop: 8,
  },
  suggestionsTitle: {
    color: '#e7e9ea',
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: SPACING.lg,
    marginBottom: 12,
  },
  suggestionsScroll: {
    paddingHorizontal: SPACING.lg,
    gap: 16,
    paddingBottom: 20,
  },
  suggestedPill: {
    alignItems: 'center',
    width: 64,
    gap: 6,
  },
  suggestedAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  suggestedAvatarFallback: {
    backgroundColor: '#16181c',
    borderWidth: 1,
    borderColor: '#2f3336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedAvatarLetter: {
    color: '#71767b',
    fontSize: 18,
    fontWeight: '700',
  },
  suggestedName: {
    color: '#e7e9ea',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
});
