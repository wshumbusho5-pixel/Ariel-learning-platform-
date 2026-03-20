import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '@/shared/components/Avatar';
import { SubjectTag } from '@/shared/components/SubjectTag';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '@/shared/constants/theme';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import { SearchBar } from '@/features/discover/components/SearchBar';
import { SubjectGrid } from '@/features/discover/components/SubjectGrid';
import { UserSearchResult } from '@/features/discover/components/UserSearchResult';
import { useDiscover } from '@/features/discover/hooks/useDiscover';
import { useSearch } from '@/features/discover/hooks/useSearch';
import type { TrendingCard, SearchUserResult } from '@/features/discover/api/discoverApi';
import apiClient from '@/shared/api/client';
import { SOCIAL } from '@/shared/api/endpoints';

// ─── Navigation prop shape (React Navigation) ────────────────────────────────
// Keep loosely typed so this file compiles without importing the nav library.
interface NavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
}

interface DiscoverScreenProps {
  navigation: NavigationProp;
}

// ─── Trending card row ────────────────────────────────────────────────────────

function TrendingCardRow({ card }: { card: TrendingCard }) {
  const subjectKey = normalizeSubjectKey(card.subject);
  const meta = SUBJECT_META[subjectKey];

  return (
    <View style={cardRowStyles.container}>
      <View style={[cardRowStyles.strip, { backgroundColor: meta.color }]} />
      <View style={cardRowStyles.content}>
        <Text style={cardRowStyles.question} numberOfLines={2}>
          {card.question}
        </Text>
        <View style={cardRowStyles.footer}>
          <SubjectTag subject={card.subject ?? 'other'} size="sm" />
          <View style={cardRowStyles.likes}>
            <Text style={cardRowStyles.heart}>♥</Text>
            <Text style={cardRowStyles.likeCount}>{card.likes}</Text>
          </View>
          {card.author_username ? (
            <Text style={cardRowStyles.author} numberOfLines={1}>
              @{card.author_username}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Suggested user card (vertical, 80px wide, for horizontal scroll) ────────

function UserCard({
  user,
  onFollowToggle,
}: {
  user: SearchUserResult;
  onFollowToggle: (userId: string, isFollowing: boolean) => void;
}) {
  const [isFollowing, setIsFollowing] = useState(user.is_following);
  const [isPending, setIsPending] = useState(false);

  const handleFollow = async () => {
    if (isPending) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setIsPending(true);
    try {
      await apiClient.post(SOCIAL.FOLLOW(user.id));
      onFollowToggle(user.id, !prev);
    } catch {
      setIsFollowing(prev);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={userCardStyles.container}>
      <Avatar
        uri={user.profile_picture}
        username={user.username}
        size={56}
      />
      <Text style={userCardStyles.name} numberOfLines={1}>
        {user.full_name ?? user.username}
      </Text>
      <Text style={userCardStyles.username} numberOfLines={1}>
        @{user.username}
      </Text>
      <TouchableOpacity
        onPress={handleFollow}
        activeOpacity={0.7}
        style={[userCardStyles.btn, isFollowing && userCardStyles.followingBtn]}
        disabled={isPending}
      >
        <Text style={[userCardStyles.btnText, isFollowing && userCardStyles.followingBtnText]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const insets = useSafeAreaInsets();
  const { suggestedUsers, trendingCards, loading } = useDiscover();
  const {
    query,
    setQuery,
    cardResults,
    userResults,
    activeTab,
    setActiveTab,
    isSearching,
  } = useSearch();

  const [searchFocused, setSearchFocused] = useState(false);
  const isSearchMode = searchFocused || query.length > 0;

  const handleSubjectPress = useCallback(
    (subjectKey: SubjectKey) => {
      navigation.navigate('SubjectDetail', { subjectKey });
    },
    [navigation],
  );

  const handleSearchFocus = useCallback(() => setSearchFocused(true), []);
  const handleSearchBlur = useCallback(() => {
    if (query.length === 0) setSearchFocused(false);
  }, [query]);

  const handleClear = useCallback(() => {
    setQuery('');
    setSearchFocused(false);
  }, [setQuery]);

  const handleFollowToggle = useCallback(
    (_userId: string, _isFollowing: boolean) => {
      // Parent could refresh suggested users if needed
    },
    [],
  );

  // ─── Render search results ───────────────────────────────────────────────

  function renderSearchResults() {
    return (
      <View style={styles.searchResults}>
        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('cards')}
            style={[styles.tab, activeTab === 'cards' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'cards' && styles.tabTextActive]}>
              Cards
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('people')}
            style={[styles.tab, activeTab === 'people' && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
              People
            </Text>
          </TouchableOpacity>
        </View>

        {isSearching ? (
          <View style={styles.searchLoader}>
            <ActivityIndicator color={COLORS.violet[400]} />
          </View>
        ) : activeTab === 'cards' ? (
          <FlatList
            data={cardResults}
            keyExtractor={(item) => item.id ?? Math.random().toString()}
            renderItem={({ item }) => <TrendingCardRow card={item} />}
            ListEmptyComponent={
              query.trim().length >= 2 ? (
                <EmptySearchState message={`No cards found for "${query}"`} />
              ) : null
            }
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <FlatList
            data={userResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <UserSearchResult
                user={item}
                onPress={() => {}}
              />
            )}
            ListEmptyComponent={
              query.trim().length >= 2 ? (
                <EmptySearchState message={`No people found for "${query}"`} />
              ) : null
            }
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    );
  }

  // ─── Render discover content ─────────────────────────────────────────────

  function renderDiscoverContent() {
    if (loading) {
      return (
        <View style={styles.loader}>
          <ActivityIndicator color={COLORS.violet[400]} size="large" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
      >
        {/* Subjects section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Subjects</Text>
          <SubjectGrid onSubjectPress={handleSubjectPress} />
        </View>

        {/* Suggested people section */}
        {suggestedUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>People to Follow</Text>
            <FlatList
              data={suggestedUsers}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <UserCard user={item} onFollowToggle={handleFollowToggle} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.peopleList}
            />
          </View>
        )}

        {/* Trending cards section */}
        {trendingCards.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Cards</Text>
            {trendingCards.slice(0, 10).map((card) => (
              <TrendingCardRow key={card.id ?? Math.random()} card={card} />
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Search bar header */}
      <View style={styles.header}>
        {isSearchMode && (
          <TouchableOpacity onPress={handleClear} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.searchBarWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={handleClear}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            autoFocus={false}
            placeholder="Cards, subjects, topics…"
          />
        </View>
      </View>

      {/* Content: search results vs discover sections */}
      {isSearchMode ? renderSearchResults() : renderDiscoverContent()}
    </View>
  );
}

// ─── Empty search state ───────────────────────────────────────────────────────

function EmptySearchState({ message }: { message: string }) {
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>🔍</Text>
      <Text style={emptyStyles.message}>{message}</Text>
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACING.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  backArrow: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  searchBarWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: SPACING['2xl'],
    gap: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '700',
    paddingHorizontal: SPACING.lg,
  },
  peopleList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Search mode
  searchResults: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    gap: SPACING.xl,
  },
  tab: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.violet[500],
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.violet[400],
  },
  resultsList: {
    paddingTop: SPACING.sm,
  },
  searchLoader: {
    paddingTop: 40,
    alignItems: 'center',
  },
});

// People card styles
const userCardStyles = StyleSheet.create({
  container: {
    width: 88,
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  username: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    width: '100%',
  },
  btn: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.violet[500],
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  followingBtnText: {
    color: COLORS.textMuted,
  },
});

// Trending card row styles
const cardRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  strip: {
    width: 3,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
    gap: 6,
  },
  question: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '500',
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  likes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heart: {
    color: '#f87171',
    fontSize: 11,
  },
  likeCount: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  author: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
    flexShrink: 1,
  },
});

// Empty state styles
const emptyStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  icon: {
    fontSize: 40,
  },
  message: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
