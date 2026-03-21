import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyDeck } from '@/features/cards/hooks/useMyDeck';
import { useReviewCard } from '@/features/cards/hooks/useReviewCard';
import { SnapCard } from '@/features/cards/components/SnapCard';
import { RatingButtons } from '@/features/cards/components/RatingButtons';
import { SessionComplete } from '@/features/cards/components/SessionComplete';
import type { Card } from '@/shared/types/card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Subject key normalizer (mirrors web lib/subjects.ts) ─────────────────────

const ALIAS_MAP: Record<string, string> = {
  math: 'mathematics', maths: 'mathematics', mathematics: 'mathematics',
  sciences: 'sciences', science: 'sciences', biology: 'sciences', chemistry: 'sciences', physics: 'sciences',
  technology: 'technology', tech: 'technology', coding: 'technology', programming: 'technology',
  history: 'history', literature: 'literature', english: 'literature',
  economics: 'economics', economy: 'economics',
  languages: 'languages', language: 'languages', french: 'languages', spanish: 'languages',
  health: 'health', medicine: 'health', anatomy: 'health',
  psychology: 'psychology', psych: 'psychology',
  geography: 'geography', geo: 'geography',
  gospel: 'gospel', bible: 'gospel', theology: 'gospel', faith: 'gospel',
  business: 'business', marketing: 'business', finance: 'business',
  law: 'law', legal: 'law',
  arts: 'arts', art: 'arts', music: 'arts', design: 'arts',
  engineering: 'engineering',
};

function normalizeSubject(subject?: string | null): string {
  if (!subject) return 'other';
  const s = subject.trim().toLowerCase();
  return ALIAS_MAP[s] ?? s;
}

// Subject color mapping — matching web SUBJECT_CONFIG hex colors
const SUBJECT_HEX: Record<string, string> = {
  mathematics: '#38bdf8',
  sciences: '#34d399',
  technology: '#22d3ee',
  history: '#fbbf24',
  literature: '#fb7185',
  economics: '#4ade80',
  languages: '#fb923c',
  health: '#f87171',
  psychology: '#f472b6',
  geography: '#2dd4bf',
  gospel: '#818cf8',
  business: '#38bdf8',
  law: '#94a3b8',
  arts: '#e879f9',
  engineering: '#facc15',
  other: '#a78bfa',
};

function getSubjectColor(subject: string): string {
  return SUBJECT_HEX[normalizeSubject(subject)] ?? '#a78bfa';
}

// ─── Subject filter ────────────────────────────────────────────────────────────

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
    // Fixed height wrapper prevents the horizontal ScrollView from expanding
    <View style={ss.filterWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={ss.filterRow}
      >
        {/* All chip */}
        <TouchableOpacity
          style={[ss.chip, active === 'All' && ss.chipAllActive]}
          onPress={() => onSelect('All')}
          activeOpacity={0.7}
        >
          <Text style={[ss.chipText, active === 'All' && ss.chipAllActiveText]}>All</Text>
        </TouchableOpacity>

        {subjects.map((s) => {
          const isActive = active === s;
          const color = getSubjectColor(s);
          return (
            <TouchableOpacity
              key={s}
              onPress={() => onSelect(s)}
              activeOpacity={0.7}
              style={[
                ss.chip,
                isActive
                  ? { backgroundColor: `${color}22`, borderColor: `${color}66` }
                  : ss.chipInactive,
              ]}
            >
              <Text
                style={[
                  ss.chipText,
                  { color: isActive ? color : '#71717a' },
                ]}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyDeck({ label }: { label: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {label === 'All' ? 'Your deck is empty' : `No ${label.toLowerCase()} cards`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {label === 'All'
          ? 'Ask Ariel to generate cards or create your own.'
          : `No cards in "${label}" right now.`}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MyDeckScreen() {
  const insets = useSafeAreaInsets();
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
        setEasyCountsPerCard((prev) => ({ ...prev, [card.id]: newEasy }));
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
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
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
    scrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [filteredCards]);

  // Header height: safeTop + title row + toggle row + (subject row if exists)
  const headerHeight = insets.top + 12 + 44 + 12 + 36 + 8 + (subjects.length > 0 ? 44 : 0);
  // Rating panel height: buttons + label + bottom safe area
  const ratingPanelBottom = Math.max(insets.bottom, 0) + 64 + 8; // above tab bar

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

      {/* ── Content area ─────────────────────────────── */}
      {!sessionDone && queue.length > 0 ? (
        <>
          {/* Full-screen snap scroll — sits behind the floating header */}
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            style={StyleSheet.absoluteFill}
            contentContainerStyle={{ height: '100%' }}
          >
            {queue.map((card, idx) => (
              <SnapCard
                key={`${card.id}_${idx}`}
                card={card}
                width={SCREEN_WIDTH}
                headerHeight={headerHeight}
                onFlipped={idx === currentIndex ? setIsFlipped : undefined}
              />
            ))}
          </ScrollView>

          {/* Floating rating buttons */}
          <View style={[ss.ratingPanel, { bottom: ratingPanelBottom }]}>
            <RatingButtons onRate={handleRate} disabled={!isFlipped} />
            {!isFlipped && (
              <Text style={ss.flipHint}>Flip the card to rate it</Text>
            )}
          </View>
        </>
      ) : sessionDone ? (
        <View style={[styles.emptyContainer, { paddingTop: headerHeight }]}>
          <SessionComplete
            totalReviewed={hardCount + easyCount + nailedCount}
            hardCount={hardCount}
            easyCount={easyCount}
            nailedCount={nailedCount}
            onRestart={handleRestart}
          />
        </View>
      ) : (
        <View style={[styles.emptyContainer, { paddingTop: headerHeight }]}>
          <EmptyDeck label={activeSubject} />
        </View>
      )}

      {/* ── Floating header — always on top ─────────── */}
      <View
        style={[ss.floatingHeader, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        {/* Title row */}
        <View style={ss.titleRow}>
          <Text style={ss.titleText}>My Deck</Text>
          <View style={ss.titlePills}>
            {dueCount > 0 && (
              <View style={ss.duePill}>
                <View style={ss.dueDot} />
                <Text style={ss.duePillText}>{dueCount} due</Text>
              </View>
            )}
            <TouchableOpacity style={ss.cramPill} activeOpacity={0.8}>
              <Text style={ss.cramPillText}>⚡ Cram</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cards / Clips toggle */}
        <View style={ss.toggleRow}>
          <View style={ss.toggle}>
            {(['Cards', 'Clips'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[ss.toggleItem, view === v && ss.toggleItemActive]}
                onPress={() => setView(v)}
                activeOpacity={0.8}
              >
                <Text style={[ss.toggleText, view === v && ss.toggleTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject filter chips */}
        {subjects.length > 0 && (
          <SubjectFilter
            subjects={subjects}
            active={activeSubject}
            onSelect={setActiveSubject}
          />
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
  // Floating header
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    // Gradient-like: dark at top, fades to transparent — achieved with layered bg
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingBottom: 8,
    // Subtle bottom fade (only visible on dark content)
  },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleText: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titlePills: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(249,115,22,0.10)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.25)',
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
  },
  duePillText: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
  },
  cramPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  cramPillText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards / Clips toggle
  toggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(39,39,42,0.8)',
    borderRadius: 999,
    padding: 2,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(63,63,70,0.6)',
  },
  toggleItem: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleItemActive: {
    backgroundColor: '#fff',
  },
  toggleText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#000',
  },

  // Subject filter — fixed height wrapper is critical
  filterWrapper: {
    height: 40,
    marginBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
    height: 40,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 30,
  },
  chipAllActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipInactive: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
  },
  chipAllActiveText: {
    color: '#fff',
  },

  // Floating rating panel
  ratingPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 32,
    zIndex: 50,
  },
  flipHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
