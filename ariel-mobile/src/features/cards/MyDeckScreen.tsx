import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyDeck } from '@/features/cards/hooks/useMyDeck';
import { useReviewCard } from '@/features/cards/hooks/useReviewCard';
import { SnapCard } from '@/features/cards/components/SnapCard';
import { RatingButtons } from '@/features/cards/components/RatingButtons';
import { SessionComplete } from '@/features/cards/components/SessionComplete';
import { DeckHeader } from '@/features/cards/components/DeckHeader';
import { EmptyDeck } from '@/features/cards/components/EmptyDeck';
import { SavedClipsGrid } from '@/features/cards/components/SavedClipsGrid';
import type { Card } from '@/shared/types/card';

// Screen dimensions via hook so they update on rotation

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MyDeckScreen() {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const SCREEN_WIDTH = W;
  const SCREEN_HEIGHT = H;
  const isShort = H < 720;
  const { cards, allCards, isLoading } = useMyDeck({ filter: 'all' });
  const { reviewCard } = useReviewCard();
  const scrollRef = useRef<ScrollView>(null);

  const [view, setView] = useState<'Cards' | 'Clips'>('Cards');
  const [activeSubject, setActiveSubject] = useState('All');
  const [queue, setQueue] = useState<Card[]>([]);
  const [queueInitialized, setQueueInitialized] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [hardCount, setHardCount] = useState(0);
  const [easyCount, setEasyCount] = useState(0);
  const [nailedCount, setNailedCount] = useState(0);
  const [easyCountsPerCard, setEasyCountsPerCard] = useState<Record<string, number>>({});

  const subjects = React.useMemo(() => {
    const set = new Set<string>();
    allCards.forEach((c) => { if (c.subject) set.add(c.subject); });
    return [...set];
  }, [allCards]);

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
    setEasyCountsPerCard({});
  }, [activeSubject]);

  const dueCount = allCards.filter((c) => {
    if (c.review_count === 0) return false;
    if (c.interval >= 21) return false;
    return c.next_review && new Date(c.next_review) <= new Date();
  }).length;

  const [headerHeight, setHeaderHeight] = useState(isShort ? 130 : 160);
  // Measured from the ScrollView's onLayout — the true visible card area
  const [cardAreaHeight, setCardAreaHeight] = useState(SCREEN_HEIGHT * 0.5);

  const handleRate = useCallback(
    (quality: 2 | 4 | 5) => {
      const card = queue[currentIndex];
      if (!card || !card.id) return;
      reviewCard(card.id, quality);

      if (quality === 2) setHardCount((n) => n + 1);
      else if (quality === 4) setEasyCount((n) => n + 1);
      else if (quality === 5) setNailedCount((n) => n + 1);

      const after = queue.slice(currentIndex + 1);
      let nextQueue: Card[];

      if (quality === 2) {
        const insertAt = Math.min(4, after.length);
        nextQueue = [
          ...queue.slice(0, currentIndex + 1),
          ...after.slice(0, insertAt),
          card,
          ...after.slice(insertAt),
        ];
      } else if (quality === 4) {
        const prevEasy = easyCountsPerCard[card.id] ?? 0;
        const newEasy = prevEasy + 1;
        setEasyCountsPerCard((prev) => ({ ...prev, [card.id as string]: newEasy }));
        if (newEasy >= 2) {
          nextQueue = [
            ...queue.slice(0, currentIndex + 1),
            ...after.filter((c) => c.id !== card.id),
          ];
        } else {
          const cleanAfter = after.filter((c) => c.id !== card.id);
          const insertAt = Math.max(0, Math.floor(cleanAfter.length * 0.82));
          nextQueue = [
            ...queue.slice(0, currentIndex + 1),
            ...cleanAfter.slice(0, insertAt),
            card,
            ...cleanAfter.slice(insertAt),
          ];
        }
      } else {
        nextQueue = [
          ...queue.slice(0, currentIndex + 1),
          ...after.filter((c) => c.id !== card.id),
        ];
      }

      setQueue(nextQueue);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= nextQueue.length) {
        setSessionDone(true);
        return;
      }
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      scrollRef.current?.scrollTo({ y: nextIndex * cardAreaHeight, animated: true });
    },
    [currentIndex, queue, reviewCard, easyCountsPerCard],
  );

  const handleRestart = useCallback(() => {
    setQueue([...filteredCards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionDone(false);
    setHardCount(0);
    setEasyCount(0);
    setNailedCount(0);
    setEasyCountsPerCard({});
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [filteredCards]);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Loading deck...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>

      {/* ── Floating header — measured so card area knows where to start ── */}
      <DeckHeader
        insets={insets}
        isShort={isShort}
        dueCount={dueCount}
        view={view}
        onViewChange={setView}
        subjects={subjects}
        activeSubject={activeSubject}
        onSubjectSelect={setActiveSubject}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      />

      {/* ── Content below header ──────────────────────── */}
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        {view === 'Clips' ? (
          <SavedClipsGrid />
        ) : !sessionDone && queue.length > 0 ? (
          <>
            {/* Card snap area — vertical paging */}
            <ScrollView
              ref={scrollRef}
              pagingEnabled
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              onLayout={(e) => setCardAreaHeight(e.nativeEvent.layout.height)}
            >
              {queue.map((card, idx) => (
                <SnapCard
                  key={`${card.id}_${idx}`}
                  card={card}
                  width={SCREEN_WIDTH}
                  height={cardAreaHeight}
                  onFlipped={idx === currentIndex ? setIsFlipped : undefined}
                />
              ))}
            </ScrollView>

            {/* Rating buttons — normal flow, never overlaps card */}
            <View style={[ss.ratingPanel, { paddingTop: isShort ? 8 : 16, paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
              <RatingButtons onRate={handleRate} disabled={!isFlipped} />
              {!isFlipped && (
                <Text style={ss.flipHint}>Flip the card to rate it</Text>
              )}
            </View>
          </>
        ) : sessionDone ? (
          <View style={styles.emptyContainer}>
            <SessionComplete
              totalReviewed={hardCount + easyCount + nailedCount}
              hardCount={hardCount}
              easyCount={easyCount}
              nailedCount={nailedCount}
              onRestart={handleRestart}
            />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyDeck label={activeSubject} />
          </View>
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Takes up full remaining space below the floating header
  content: {
    flex: 1,
  },
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

// ss = separate stylesheet for the deck-specific overlay components
const ss = StyleSheet.create({
  // Rating panel — normal flow, sits below the card area
  ratingPanel: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  flipHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
