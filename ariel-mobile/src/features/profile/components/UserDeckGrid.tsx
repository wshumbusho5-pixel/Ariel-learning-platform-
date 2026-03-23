import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { DeckPost } from '@/shared/types/deck';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 1.5;
const CELL = (SCREEN_WIDTH - GAP * 2) / 3;

// ─── Subject color map (no emojis) ────────────────────────────────────────────

const SUBJECT_COLORS: Record<string, string> = {
  mathematics:  '#38bdf8',
  sciences:     '#34d399',
  technology:   '#22d3ee',
  history:      '#fbbf24',
  literature:   '#fb7185',
  economics:    '#4ade80',
  languages:    '#fb923c',
  health:       '#f87171',
  psychology:   '#f472b6',
  geography:    '#2dd4bf',
  gospel:       '#818cf8',
  business:     '#60a5fa',
  law:          '#94a3b8',
  arts:         '#e879f9',
  engineering:  '#facc15',
  other:        '#a78bfa',
};

function subjectColor(subject?: string | null): string {
  if (!subject) return SUBJECT_COLORS.other;
  const key = normalizeSubjectKey(subject);
  return SUBJECT_META[key]?.color ?? SUBJECT_COLORS[key] ?? SUBJECT_COLORS.other;
}

function subjectShort(subject?: string | null): string {
  if (!subject) return 'Other';
  const key = normalizeSubjectKey(subject);
  return SUBJECT_META[key]?.short ?? subject.slice(0, 3).toUpperCase();
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

function DeckCell({ deck, onPress }: { deck: DeckPost; onPress?: (d: DeckPost) => void }) {
  const color = subjectColor(deck.subject);
  const short = subjectShort(deck.subject);

  return (
    <TouchableOpacity
      style={[s.cell, { backgroundColor: `${color}15` }]}
      onPress={() => onPress?.(deck)}
      activeOpacity={0.82}
    >
      {/* Top accent stripe */}
      <View style={[s.stripe, { backgroundColor: color }]} />

      {/* Subject label */}
      <View style={[s.subjectChip, { backgroundColor: `${color}22` }]}>
        <Text style={[s.subjectShort, { color }]}>{short}</Text>
      </View>

      {/* Deck title */}
      <Text style={s.title} numberOfLines={3}>{deck.title}</Text>

      {/* Footer */}
      <View style={s.footer}>
        <Ionicons name="layers-outline" size={10} color="#71717a" />
        <Text style={s.count}>{deck.card_count}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCell() {
  return (
    <View style={[s.cell, s.skeletonCell]}>
      <View style={[s.stripe, { backgroundColor: '#27272a' }]} />
      <View style={s.skeletonChip} />
      <View style={s.skeletonLine} />
      <View style={s.skeletonLineShort} />
    </View>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface UserDeckGridProps {
  decks: DeckPost[];
  isLoading?: boolean;
  onDeckPress?: (deck: DeckPost) => void;
  ListHeaderComponent?: React.ReactElement | null;
}

export function UserDeckGrid({
  decks,
  isLoading = false,
  onDeckPress,
  ListHeaderComponent,
}: UserDeckGridProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DeckPost>) => (
      <DeckCell deck={item} onPress={onDeckPress} />
    ),
    [onDeckPress],
  );

  const keyExtractor = useCallback(
    (item: DeckPost) => item.id ?? `deck_${Math.random()}`,
    [],
  );

  if (isLoading) {
    return (
      <View style={s.container}>
        {ListHeaderComponent}
        <View style={s.skeletonGrid}>
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCell key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={decks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      columnWrapperStyle={s.row}
      contentContainerStyle={s.list}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <View style={s.empty}>
          <Ionicons name="layers-outline" size={40} color="#3f3f46" />
          <Text style={s.emptyTitle}>No decks yet</Text>
          <Text style={s.emptySub}>Create your first deck to get started.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={9}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { paddingBottom: 100 },
  row: { gap: GAP, marginBottom: GAP },

  cell: {
    width: CELL,
    height: CELL,
    padding: 10,
    gap: 6,
    overflow: 'hidden',
  },
  stripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  subjectChip: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 6,
  },
  subjectShort: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    flex: 1,
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  count: {
    color: '#71717a',
    fontSize: 10,
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  skeletonCell: {
    backgroundColor: '#0d0d0d',
  },
  skeletonChip: {
    width: 32,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#1c1c1e',
    marginTop: 6,
  },
  skeletonLine: {
    width: '85%',
    height: 10,
    borderRadius: 3,
    backgroundColor: '#1c1c1e',
  },
  skeletonLineShort: {
    width: '55%',
    height: 10,
    borderRadius: 3,
    backgroundColor: '#1c1c1e',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    color: '#fafafa',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
