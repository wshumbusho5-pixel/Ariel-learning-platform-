import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDiscover } from '@/features/discover/hooks/useDiscover';
import { useSearch } from '@/features/discover/hooks/useSearch';
import { CANONICAL_SUBJECT_KEYS } from '@/shared/constants/subjects';
import type { SubjectKey } from '@/shared/constants/subjects';
import type { TrendingCard } from '@/features/discover/api/discoverApi';

import { SubjectTile } from '@/features/discover/components/SubjectTile';
import { CardViewerModal } from '@/features/discover/components/CardViewerModal';
import { TrendingRow } from '@/features/discover/components/TrendingRow';
import { PeopleCard } from '@/features/discover/components/PeopleCard';
import { UserRow } from '@/features/discover/components/UserRow';
import { CardRow } from '@/features/discover/components/CardRow';

// ─── Navigation prop ──────────────────────────────────────────────────────────

interface NavigationProp {
  navigate: (screen: string, params?: Record<string, unknown>) => void;
  goBack: () => void;
}

interface DiscoverScreenProps {
  navigation: NavigationProp;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DiscoverScreen({ navigation }: DiscoverScreenProps) {
  const insets = useSafeAreaInsets();
  const { suggestedUsers, trendingCards, loading } = useDiscover();
  const { query, setQuery, cardResults, userResults, activeTab, setActiveTab, isSearching } = useSearch();
  const [focused, setFocused] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TrendingCard | null>(null);
  const inputRef = useRef<TextInput>(null);
  const isSearchMode = focused || query.length > 0;

  const handleSubjectPress = useCallback(
    (key: SubjectKey) => navigation.navigate('SubjectDetail', { subjectKey: key }),
    [navigation],
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setFocused(false);
    inputRef.current?.blur();
  }, [setQuery]);

  // ── Discover content ────────────────────────────────────────────────────────

  if (!isSearchMode) {
    return (
      <View style={[s.screen, { paddingTop: insets.top }]}>
        <CardViewerModal card={selectedCard} onClose={() => setSelectedCard(null)} />
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Explore</Text>
          <TouchableOpacity
            style={s.searchPill}
            onPress={() => { setFocused(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={15} color="#52525b" />
            <Text style={s.searchPillText}>Cards, subjects, people…</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator color="#7c3aed" size="large" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          >
            {/* Subject grid */}
            <View style={s.section}>
              <Text style={s.sectionLabel}>Browse Subjects</Text>
              <View style={s.grid}>
                {(CANONICAL_SUBJECT_KEYS as unknown as SubjectKey[]).map((key) => (
                  <SubjectTile key={key} subjectKey={key} onPress={() => handleSubjectPress(key)} />
                ))}
              </View>
            </View>

            {/* People to follow */}
            {suggestedUsers.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>People to Follow</Text>
                <FlatList
                  data={suggestedUsers}
                  horizontal
                  keyExtractor={(u) => u.id}
                  renderItem={({ item }) => <PeopleCard user={item} />}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                />
              </View>
            )}

            {/* Trending cards */}
            {trendingCards.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>Trending Cards</Text>
                {trendingCards.slice(0, 15).map((card, i) => (
                  <TrendingRow key={card.id ?? i} card={card} rank={i} onPress={() => setSelectedCard(card)} />
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }

  // ── Search mode ─────────────────────────────────────────────────────────────

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <CardViewerModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      {/* Search header */}
      <View style={s.searchHeader}>
        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color="#52525b" style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            autoFocus
            placeholder="Cards, subjects, people…"
            placeholderTextColor="#52525b"
            style={s.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#52525b" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={clearSearch} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {(['cards', 'people'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[s.tab, activeTab === tab && s.tabActive]}
          >
            <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
              {tab === 'cards' ? 'Cards' : 'People'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {isSearching ? (
        <View style={s.loader}>
          <ActivityIndicator color="#7c3aed" />
        </View>
      ) : query.trim().length < 2 ? (
        <View style={s.emptyHint}>
          <Ionicons name="search-outline" size={40} color="#27272a" />
          <Text style={s.emptyHintText}>Type at least 2 characters to search</Text>
        </View>
      ) : activeTab === 'cards' ? (
        <FlatList
          data={cardResults}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={({ item }) => <CardRow card={item} onPress={() => setSelectedCard(item)} />}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.emptyHint}>
              <Text style={s.emptyHintText}>No cards found for "{query}"</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={userResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserRow user={item} />}
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={s.emptyHint}>
              <Text style={s.emptyHintText}>No people found for "{query}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },

  // Discover mode header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    height: 44,
  },
  searchPillText: {
    color: '#52525b',
    fontSize: 15,
    flex: 1,
  },

  // Search mode header
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#e4e4e7',
    fontSize: 15,
    paddingVertical: 0,
  },
  cancelBtn: { paddingVertical: 8 },
  cancelText: { color: '#a78bfa', fontSize: 15, fontWeight: '600' },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#7c3aed' },
  tabText: { color: '#71717a', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#a78bfa' },

  // Sections
  section: { marginTop: 24, gap: 12 },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
    letterSpacing: -0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },

  // States
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyHintText: {
    color: '#52525b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
