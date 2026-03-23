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
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { DeckPost } from '@/shared/types/deck';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 2;
const CELL = (SCREEN_WIDTH - GAP * 2) / 3; // 3-column Instagram grid

// ─── Cell ─────────────────────────────────────────────────────────────────────

function DeckCell({ deck, onPress }: { deck: DeckPost; onPress?: (d: DeckPost) => void }) {
  const key = normalizeSubjectKey(deck.subject);
  const meta = SUBJECT_META[key];
  const accent = meta?.color ?? '#7c3aed';

  return (
    <TouchableOpacity
      style={[s.cell, { backgroundColor: `${accent}22` }]}
      onPress={() => onPress?.(deck)}
      activeOpacity={0.85}
    >
      {/* Subject icon centered */}
      <Text style={s.cellIcon}>{meta?.icon ?? '📖'}</Text>
      {/* Deck title at bottom */}
      <View style={s.cellOverlay}>
        <Text style={s.cellTitle} numberOfLines={2}>{deck.title}</Text>
        <Text style={s.cellCount}>{deck.card_count} cards</Text>
      </View>
      {/* Accent corner bar */}
      <View style={[s.cellAccent, { backgroundColor: accent }]} />
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCell() {
  return <View style={[s.cell, s.skeleton]} />;
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
          <Text style={s.emptyIcon}>📚</Text>
          <Text style={s.emptyText}>No decks yet</Text>
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
  list: { paddingBottom: 80 },
  row: { gap: GAP, marginBottom: GAP },

  cell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  cellIcon: {
    fontSize: 32,
  },
  cellOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cellTitle: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
  },
  cellCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    marginTop: 1,
  },
  cellAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 3,
    height: '100%',
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  skeleton: {
    backgroundColor: '#1c1c1e',
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: '#71717a', fontSize: 14 },
});
