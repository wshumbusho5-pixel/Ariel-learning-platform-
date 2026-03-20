import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyDeck } from '@/features/cards/hooks/useMyDeck';
import { useReviewCard } from '@/features/cards/hooks/useReviewCard';
import { SnapCard } from '@/features/cards/components/SnapCard';
import { RatingButtons } from '@/features/cards/components/RatingButtons';
import { SessionComplete } from '@/features/cards/components/SessionComplete';
import type { Card } from '@/shared/types/card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Subject filter (derived from cards) ──────────────────────────────────────

function SubjectFilter({
  subjects,
  active,
  onSelect,
}: {
  subjects: string[];
  active: string;
  onSelect: (s: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {['All', ...subjects].map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.filterChip, active === s && styles.filterChipActive]}
          onPress={() => onSelect(s)}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, active === s && styles.filterChipTextActive]}>
            {s}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDeck({ label }: { label: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>No {label.toLowerCase()} cards</Text>
      <Text style={styles.emptySubtitle}>
        {label === 'All'
          ? "You don't have any cards yet."
          : `No cards in "${label}" right now.`}
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MyDeckScreen() {
  const insets = useSafeAreaInsets();
  const { cards, allCards, isLoading } = useMyDeck({ filter: 'all' });
  const { reviewCard } = useReviewCard();

  const scrollRef = useRef<ScrollView>(null);

  // Cards/Clips toggle
  const [view, setView] = useState<'Cards' | 'Clips'>('Cards');

  // Subject filter
  const subjects = React.useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => {
      if (c.subject) set.add(c.subject);
    });
    return [...set];
  }, [allCards]);

  const [activeSubject, setActiveSubject] = useState('All');

  // Queue
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueInitialized, setQueueInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [hardCount, setHardCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [nailedCount, setNailedCount] = useState(0);

  // Filtered cards by subject
  const filteredCards = React.useMemo(() => {
    if (activeSubject === 'All') return cards;
    return cards.filter((c) => c.subject === activeSubject);
  }, [cards, activeSubject]);

  React.useEffect(() => {
    if (!isLoading && filteredCards.length > 0 && !queueInitialized) {
      setQueue([...filteredCards]);
      setQueueInitialized(true);
    }
  }, [isLoading, filteredCards, queueInitialized]);

  React.useEffect(() => {
    setQueue([]);
    setQueueInitialized(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setHardCount(0);
    setEasyCount(0);
    setNailedCount(0);
  }, [activeSubject]);

  // Due count
  const dueCount = allCards.filter((c) => {
    if (c.review_count === 0) return false;
    if (c.interval >= 21) return false;
    return c.next_review && new Date(c.next_review) <= new Date();
  }).length;

  const handleRate = useCallback(
    (quality: 1 | 3 | 5) => {
      const card = queue[currentIndex];
      if (!card || !card.id) return;
      reviewCard(card.id, quality);
      if (quality === 1) setHardCount((n) => n + 1);
      else if (quality === 3) setEasyCount((n) => n + 1);
      else if (quality === 5) setNailedCount((n) => n + 1);
      let nextQueue = queue;
      if (quality === 1) {
        const insertAt = Math.min(currentIndex + 4, queue.length);
        nextQueue = [...queue];
        nextQueue.splice(insertAt, 0, card);
        setQueue(nextQueue);
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= nextQueue.length) {
        setSessionDone(true);
        return;
      }
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    },
    [currentIndex, queue, reviewCard],
  );

  const handleRestart = useCallback(() => {
    setQueue([...filteredCards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setHardCount(0);
    setEasyCount(0);
    setNailedCount(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [filteredCards]);

  if (isLoading) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <LoadingSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deck</Text>
        <View style={styles.headerPills}>
          {dueCount > 0 && (
            <View style={styles.duePill}>
              <View style={styles.dueDot} />
              <Text style={styles.duePillText}>{dueCount} due</Text>
            </View>
          )}
          <TouchableOpacity style={styles.cramPill} activeOpacity={0.8}>
            <Text style={styles.cramPillText}>⚡ Cram</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Cards / Clips toggle ── */}
      <View style={styles.toggleRow}>
        <View style={styles.toggle}>
          {(['Cards', 'Clips'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.toggleItem, view === v && styles.toggleItemActive]}
              onPress={() => setView(v)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, view === v && styles.toggleTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Subject filter ── */}
      {subjects.length > 0 && (
        <SubjectFilter subjects={subjects} active={activeSubject} onSelect={(s) => {
          setActiveSubject(s);
        }} />
      )}

      {/* ── Content ── */}
      {queue.length === 0 ? (
        <EmptyDeck label={activeSubject} />
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
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={styles.snapScroll}
          >
            {queue.map((card, idx) => (
              <SnapCard
                key={`${card.id}_${idx}`}
                card={card}
                onFlipped={idx === currentIndex ? setIsFlipped : undefined}
              />
            ))}
          </ScrollView>

          {/* Rating buttons */}
          <View style={[styles.ratingContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <RatingButtons onRate={handleRate} disabled={!isFlipped} />
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
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fafafa',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerPills: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(180,83,9,0.25)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb923c',
  },
  duePillText: {
    color: '#fb923c',
    fontSize: 13,
    fontWeight: '600',
  },
  cramPill: {
    backgroundColor: '#2d1f6e',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
  },
  cramPillText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '700',
  },

  // Toggle
  toggleRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 999,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleItem: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000',
  },

  // Subject filter
  filterRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterChipText: {
    color: '#71717a',
    fontSize: 13,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  // Snap scroll
  snapScroll: {
    flex: 1,
  },

  // Rating
  ratingContainer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
  },
  flipHint: {
    color: '#3f3f46',
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
    width: SCREEN_WIDTH - 40,
    height: 300,
    backgroundColor: '#111',
    borderRadius: 24,
    opacity: 0.5,
  },
  loadingText: { color: '#3f3f46', fontSize: 14 },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#fafafa', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptySubtitle: { color: '#52525b', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
