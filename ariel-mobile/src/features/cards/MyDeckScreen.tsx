import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyDeck, type DeckFilter } from '@/features/cards/hooks/useMyDeck';
import { useReviewCard } from '@/features/cards/hooks/useReviewCard';
import { SnapCard } from '@/features/cards/components/SnapCard';
import { RatingButtons } from '@/features/cards/components/RatingButtons';
import { SessionComplete } from '@/features/cards/components/SessionComplete';
import type { Card } from '@/shared/types/card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ allCards }: { allCards: Card[] }) {
  const due = allCards.filter((c) => {
    if (c.review_count === 0) return false;
    if (c.interval >= 21) return false;
    return c.next_review && new Date(c.next_review) <= new Date();
  }).length;
  const newCards = allCards.filter((c) => c.review_count === 0).length;
  const mastered = allCards.filter((c) => c.interval >= 21).length;

  const items = [
    { label: 'Total', value: allCards.length, color: '#a1a1aa' },
    { label: 'Due', value: due, color: '#fb923c' },
    { label: 'New', value: newCards, color: '#38bdf8' },
    { label: 'Mastered', value: mastered, color: '#4ade80' },
  ];

  return (
    <View style={styles.statsBar}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
          {i < items.length - 1 && <View style={styles.statDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: DeckFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'due', label: 'Due' },
  { key: 'new', label: 'New' },
  { key: 'mastered', label: 'Mastered' },
];

// ─── Progress bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  current: number;
  total: number;
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = total > 0 ? current / total : 0;
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.progressText}>
        {current} of {total} cards
      </Text>
    </View>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingCard} />
      <Text style={styles.loadingText}>Loading your deck...</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDeck({ filter }: { filter: DeckFilter }) {
  const message =
    filter === 'all'
      ? "You don't have any cards yet. Create your first flashcard!"
      : `No ${filter} cards right now. Great work!`;
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{filter === 'mastered' ? '🎓' : '📭'}</Text>
      <Text style={styles.emptyTitle}>
        {filter === 'all' ? 'No cards yet' : `No ${filter} cards`}
      </Text>
      <Text style={styles.emptySubtitle}>{message}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MyDeckScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DeckFilter>('all');
  const { cards, allCards, isLoading } = useMyDeck({ filter });
  const { reviewCard } = useReviewCard();

  const scrollRef = useRef<ScrollView>(null);

  // Queue of cards to review — mutable during session
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueInitialized, setQueueInitialized] = useState(false);

  // Session stats
  const [hardCount, setHardCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [nailedCount, setNailedCount] = useState(0);

  // Current page index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Whether the current card has been flipped (to enable rating buttons)
  const [isFlipped, setIsFlipped] = useState(false);

  // Whether session is complete
  const [sessionDone, setSessionDone] = useState(false);

  // Initialize queue when cards load
  React.useEffect(() => {
    if (!isLoading && cards.length > 0 && !queueInitialized) {
      setQueue([...cards]);
      setQueueInitialized(true);
    }
  }, [isLoading, cards, queueInitialized]);

  // Reset session when filter changes
  React.useEffect(() => {
    setQueue([]);
    setQueueInitialized(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setHardCount(0);
    setEasyCount(0);
    setNailedCount(0);
  }, [filter]);

  const handleRate = useCallback(
    (quality: 1 | 3 | 5) => {
      const card = queue[currentIndex];
      if (!card || !card.id) return;

      // Fire API call (non-blocking)
      reviewCard(card.id, quality);

      // Update session stats
      if (quality === 1) setHardCount((n) => n + 1);
      else if (quality === 3) setEasyCount((n) => n + 1);
      else if (quality === 5) setNailedCount((n) => n + 1);

      // Build the next queue state (hard cards get re-inserted 4 slots ahead)
      let nextQueue = queue;
      if (quality === 1) {
        const insertAt = Math.min(currentIndex + 4, queue.length);
        nextQueue = [...queue];
        nextQueue.splice(insertAt, 0, card);
        setQueue(nextQueue);
      }

      const nextIndex = currentIndex + 1;

      // Check if session is complete
      if (nextIndex >= nextQueue.length) {
        setSessionDone(true);
        return;
      }

      // Advance to next card
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      scrollRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    },
    [currentIndex, queue, reviewCard],
  );

  const handleRestart = useCallback(() => {
    setQueue([...cards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setHardCount(0);
    setEasyCount(0);
    setNailedCount(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [cards]);

  // ── Render ──

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <LoadingSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deck</Text>

        {/* Stats bar */}
        {!isLoading && allCards.length > 0 && <StatsBar allCards={allCards} />}

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterChip,
                filter === opt.key && styles.filterChipActive,
              ]}
              onPress={() => setFilter(opt.key)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${opt.label}`}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filter === opt.key && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {queue.length === 0 ? (
        <EmptyDeck filter={filter} />
      ) : sessionDone ? (
        <SessionComplete
          totalReviewed={hardCount + easyCount + nailedCount}
          hardCount={hardCount}
          easyCount={easyCount}
          nailedCount={nailedCount}
          onRestart={handleRestart}
        />
      ) : (
        <>
          {/* Progress bar */}
          <ProgressBar
            current={Math.min(currentIndex, queue.length)}
            total={queue.length}
          />

          {/* Snap scroll of cards */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false} // We control scrolling programmatically
            showsHorizontalScrollIndicator={false}
            style={styles.snapScroll}
            contentContainerStyle={styles.snapScrollContent}
          >
            {queue.map((card, idx) => (
              <SnapCard
                key={`${card.id}_${idx}`}
                card={card}
                onFlipped={idx === currentIndex ? setIsFlipped : undefined}
              />
            ))}
          </ScrollView>

          {/* Rating buttons (floating above bottom nav) */}
          <View
            style={[
              styles.ratingContainer,
              { paddingBottom: Math.max(insets.bottom, 12) },
            ]}
          >
            <RatingButtons
              onRate={handleRate}
              disabled={!isFlipped}
            />
            {!isFlipped && (
              <Text style={styles.flipHint}>Flip the card to rate it</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#52525b', fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: '#27272a' },

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitle: {
    color: '#fafafa',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  filterChipActive: {
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderColor: 'rgba(139,92,246,0.4)',
  },
  filterChipText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#a78bfa',
    fontWeight: '600',
  },

  // Progress bar
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#27272a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
  progressText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },

  // Snap scroll
  snapScroll: {
    flex: 1,
  },
  snapScrollContent: {
    // No special styles needed — each SnapCard fills SCREEN_WIDTH
  },

  // Rating buttons
  ratingContainer: {
    position: 'absolute',
    bottom: 60, // above bottom tab bar (height 60)
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(9,9,11,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  flipHint: {
    color: '#52525b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingCard: {
    width: 280,
    height: 200,
    backgroundColor: '#18181b',
    borderRadius: 20,
    opacity: 0.5,
  },
  loadingText: {
    color: '#52525b',
    fontSize: 14,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    color: '#fafafa',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
});
