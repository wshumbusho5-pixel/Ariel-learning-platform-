import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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

// Subject config — hex colors + SVG icon paths matching web SubjectIcon.tsx
interface SubjectConf { hex: string; paths: string[]; }

const SUBJECT_CONFIG: Record<string, SubjectConf> = {
  mathematics: { hex: '#38bdf8', paths: ['M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.255 3A23.933 23.933 0 0121 12c0 3.183-.62 6.22-1.745 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.104.401l1.445-.889m-8.25.75l.213.09a1.687 1.687 0 002.062-.617l4.45-6.676a1.688 1.688 0 012.062-.618l.213.09'] },
  sciences:    { hex: '#34d399', paths: ['M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42'] },
  technology:  { hex: '#22d3ee', paths: ['M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z'] },
  history:     { hex: '#fbbf24', paths: ['M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'] },
  literature:  { hex: '#fb7185', paths: ['M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'] },
  economics:   { hex: '#4ade80', paths: ['M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941'] },
  languages:   { hex: '#fb923c', paths: ['M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802'] },
  health:      { hex: '#f87171', paths: ['M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'] },
  psychology:  { hex: '#f472b6', paths: ['M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'] },
  geography:   { hex: '#2dd4bf', paths: ['M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'] },
  gospel:      { hex: '#818cf8', paths: ['M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25'] },
  business:    { hex: '#38bdf8', paths: ['M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z'] },
  law:         { hex: '#94a3b8', paths: ['M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z'] },
  arts:        { hex: '#e879f9', paths: ['M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42'] },
  engineering: { hex: '#facc15', paths: ['M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z'] },
  other:       { hex: '#a78bfa', paths: ['M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5'] },
};

function getSubjectConf(subject: string): SubjectConf {
  return SUBJECT_CONFIG[normalizeSubject(subject)] ?? SUBJECT_CONFIG.other;
}

function SubjectSvgIcon({ subject, size = 11 }: { subject: string; size?: number }) {
  const conf = getSubjectConf(subject);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={conf.hex} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {conf.paths.map((d, i) => <Path key={i} d={d} />)}
    </Svg>
  );
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
          const conf = getSubjectConf(s);
          return (
            <TouchableOpacity
              key={s}
              onPress={() => onSelect(s)}
              activeOpacity={0.7}
              style={[
                ss.chip,
                isActive
                  ? { backgroundColor: `${conf.hex}22`, borderColor: `${conf.hex}66` }
                  : ss.chipInactive,
              ]}
            >
              <SubjectSvgIcon subject={s} size={11} />
              <Text style={[ss.chipText, { color: isActive ? conf.hex : '#71717a' }]}>
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

  // Header height measured via onLayout (accurate across devices)
  const [headerHeight, setHeaderHeight] = useState(0);
  // Card area height measured via onLayout — passed explicitly to SnapCard
  // so flex:1 works inside horizontal ScrollView
  const [cardAreaHeight, setCardAreaHeight] = useState(0);

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
      <View
        style={[ss.floatingHeader, { paddingTop: insets.top }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
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

      {/* ── Content below header ──────────────────────── */}
      {/* paddingTop pushes content below the floating header */}
      <View style={[styles.content, { paddingTop: headerHeight }]}>
        {!sessionDone && queue.length > 0 ? (
          <>
            {/* Card snap area — flex:1 fills between header and rating buttons */}
            <View
              style={{ flex: 1 }}
              onLayout={(e) => setCardAreaHeight(e.nativeEvent.layout.height)}
            >
              {/* Only render scroll once we know the height */}
              {cardAreaHeight > 0 && (
                <ScrollView
                  ref={scrollRef}
                  horizontal
                  pagingEnabled
                  scrollEnabled={false}
                  showsHorizontalScrollIndicator={false}
                  style={{ flex: 1 }}
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
              )}
            </View>

            {/* Rating buttons — normal flow, never overlaps card */}
            <View style={[ss.ratingPanel, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
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

  // Rating panel — normal flow, sits below the card area
  ratingPanel: {
    paddingHorizontal: 32,
    paddingTop: 12,
  },
  flipHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
