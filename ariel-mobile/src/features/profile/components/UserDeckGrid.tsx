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
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/shared/constants/theme';
import { SUBJECT_META, normalizeSubjectKey } from '@/shared/constants/subjects';
import type { DeckPost } from '@/shared/types/deck';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserDeckGridProps {
  decks: DeckPost[];
  isLoading?: boolean;
  onDeckPress?: (deck: DeckPost) => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

const CARD_WIDTH = (Dimensions.get('window').width - SPACING.lg * 2 - SPACING.md) / 2;

interface DeckCardProps {
  deck: DeckPost;
  onPress?: (deck: DeckPost) => void;
}

function DeckCard({ deck, onPress }: DeckCardProps) {
  const key = normalizeSubjectKey(deck.subject);
  const meta = SUBJECT_META[key];
  const accentColor = meta?.color ?? COLORS.textMuted;
  const icon = meta?.icon ?? '📖';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: accentColor }]}
      onPress={() => onPress?.(deck)}
      activeOpacity={0.8}
    >
      {/* Subject icon chip */}
      <View style={[styles.subjectChip, { backgroundColor: `${accentColor}22` }]}>
        <Text style={styles.subjectIcon}>{icon}</Text>
        <Text style={[styles.subjectLabel, { color: accentColor }]} numberOfLines={1}>
          {meta?.short ?? deck.subject}
        </Text>
      </View>

      {/* Deck title */}
      <Text style={styles.deckTitle} numberOfLines={2}>
        {deck.title}
      </Text>

      {/* Footer: card count */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardCount}>
          {deck.card_count} {deck.card_count === 1 ? 'card' : 'cards'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonDeckCard() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonChip} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonTitleShort} />
    </View>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function UserDeckGrid({
  decks,
  isLoading = false,
  onDeckPress,
  ListHeaderComponent,
  ListEmptyComponent,
}: UserDeckGridProps) {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DeckPost>) => (
      <DeckCard deck={item} onPress={onDeckPress} />
    ),
    [onDeckPress],
  );

  const keyExtractor = useCallback(
    (item: DeckPost) => item.id ?? `deck_${Math.random()}`,
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.grid}>
        {ListHeaderComponent}
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonDeckCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={decks}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        ListEmptyComponent ?? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No decks yet</Text>
          </View>
        )
      }
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      initialNumToRender={6}
    />
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  grid: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Grid wrapper
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['5xl'],
  },
  columnWrapper: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },

  // Deck card
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 3,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },

  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    gap: 4,
  },
  subjectIcon: {
    fontSize: 11,
  },
  subjectLabel: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    maxWidth: 60,
  },

  deckTitle: {
    color: COLORS.textPrimary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as '600',
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
    flexGrow: 1,
  },

  cardFooter: {
    marginTop: SPACING.xs,
  },
  cardCount: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },

  // Skeleton
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  skeletonCard: {
    borderLeftColor: COLORS.surface2,
    gap: SPACING.sm,
  },
  skeletonChip: {
    width: 70,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface2,
  },
  skeletonTitle: {
    width: '90%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface2,
  },
  skeletonTitleShort: {
    width: '60%',
    height: 14,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface2,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING['4xl'],
    gap: SPACING.sm,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
