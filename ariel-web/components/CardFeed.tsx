'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { cardsAPI } from '@/lib/api';
import { useComments } from '@/lib/commentsContext';
import ShareSheet from '@/components/ShareSheet';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  tags: string[];
  likes: number;
  saves: number;
  visibility: string;
  created_at?: string;
  review_count?: number;
  interval?: number;
  next_review?: string | null;
}

type CardStatus = 'due' | 'new' | 'learning' | 'mastered';

function getCardStatus(card: Card): CardStatus {
  const count = card.review_count ?? 0;
  if (count === 0) return 'new';
  const interval = card.interval ?? 0;
  if (interval >= 21) return 'mastered';
  if (card.next_review && new Date(card.next_review) <= new Date()) return 'due';
  return 'learning';
}

const STATUS_META: Record<CardStatus, { label: string; pill: string }> = {
  due:      { label: 'Review',   pill: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
  new:      { label: 'New',      pill: 'bg-sky-500/15 text-sky-400 border-sky-500/25' },
  learning: { label: 'Learning', pill: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  mastered: { label: 'Mastered', pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
};

const STATUS_ORDER: Record<CardStatus, number> = { due: 0, new: 1, learning: 2, mastered: 3 };

function sortByStatus(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    const sa = getCardStatus(a);
    const sb = getCardStatus(b);
    if (STATUS_ORDER[sa] !== STATUS_ORDER[sb]) return STATUS_ORDER[sa] - STATUS_ORDER[sb];
    if (sa === 'due' && a.next_review && b.next_review) {
      return new Date(a.next_review).getTime() - new Date(b.next_review).getTime();
    }
    return 0;
  });
}

function applyRatingLocally(card: Card, quality: number): Partial<Card> {
  const currentInterval = card.interval ?? 0;
  const reviewCount = (card.review_count ?? 0) + 1;
  let newInterval: number;
  if (quality <= 2) {
    newInterval = 1;
  } else if (quality === 4) {
    newInterval = currentInterval < 1 ? 4 : Math.round(currentInterval * 2);
  } else {
    newInterval = currentInterval < 1 ? 6 : Math.round(currentInterval * 2.5);
  }
  const next = new Date();
  next.setDate(next.getDate() + newInterval);
  return { interval: newInterval, next_review: next.toISOString(), review_count: reviewCount };
}

// Rating color system
const RATING_META = {
  hard:   { solidBg: 'bg-rose-500',    activeBorder: 'border-rose-500',    text: 'text-rose-400',    label: 'Hard' },
  easy:   { solidBg: 'bg-amber-400',   activeBorder: 'border-amber-400',   text: 'text-amber-400',   label: 'Easy' },
  nailed: { solidBg: 'bg-emerald-500', activeBorder: 'border-emerald-500', text: 'text-emerald-400', label: 'Nailed it' },
} as const;

type RatingKey = keyof typeof RATING_META;

// Queue entry — cardId can appear multiple times with unique keys
interface QueueEntry { cardId: string; key: string; }

interface CardFeedProps {
  type: 'trending' | 'my-deck';
  onCardClick?: (card: Card) => void;
  subjectFilter?: string | null;
  groupBySubject?: boolean;
  snapScroll?: boolean;
  headerOffset?: number;
}

export default function CardFeed({
  type,
  onCardClick,
  subjectFilter,
  groupBySubject = false,
  snapScroll = false,
  headerOffset = 0,
}: CardFeedProps) {
  const router = useRouter();
  const { openComments } = useComments();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [reviewCounts, setReviewCounts] = useState<Record<string, { hard: number; easy: number; nailed: number }>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<{ id: string; title: string; subtitle?: string } | null>(null);
  const snapContainerRef = useRef<HTMLDivElement>(null);

  // ── Session queue (snap + my-deck) ──────────────────────────────────────────
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [activeSnapIdx, setActiveSnapIdx] = useState(0);
  const activeSnapIdxRef = useRef(0);
  // Cards that were nailed this session — persist their "end" position on restart
  const [nailedInSession, setNailedInSession] = useState<Set<string>>(new Set());
  const [sessionRestarted, setSessionRestarted] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  useEffect(() => {
    loadCards();
  }, [type]);

  const loadCards = async () => {
    setLoading(true);
    try {
      let data;
      if (type === 'trending') {
        data = await cardsAPI.getTrendingCards(50);
      } else {
        data = await cardsAPI.getMyDeck({ limit: 500 });
        data = sortByStatus(data);
      }
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
    } finally {
      setLoading(false);
    }
  };

  // Derived filtered cards
  const filteredCards = useMemo(() => {
    const filtered = subjectFilter && subjectFilter !== 'all'
      ? cards.filter(c => (c.subject || '').toLowerCase() === subjectFilter.toLowerCase())
      : cards;
    return filtered;
  }, [cards, subjectFilter]);

  // Build card lookup map
  const cardsById = useMemo(() => {
    const map: Record<string, Card> = {};
    cards.forEach(c => { map[c.id] = c; });
    return map;
  }, [cards]);

  // Initialize session queue when cards/filter changes
  useEffect(() => {
    if (!snapScroll || type !== 'my-deck') return;
    if (filteredCards.length === 0) return;
    const initial: QueueEntry[] = filteredCards.map(c => ({ cardId: c.id, key: `${c.id}-init` }));
    setQueueEntries(initial);
    setActiveSnapIdx(0);
    activeSnapIdxRef.current = 0;
    setNailedInSession(new Set());
    setReviewCounts({});
    setSessionRestarted(false);
  }, [filteredCards.length, subjectFilter, snapScroll, type]);

  // Track active snap index via scroll
  const handleSnapScroll = useCallback(() => {
    const c = snapContainerRef.current;
    if (!c) return;
    const idx = Math.round(c.scrollTop / c.clientHeight);
    setActiveSnapIdx(idx);
    activeSnapIdxRef.current = idx;
  }, []);

  const handleLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedCards.has(cardId);
    const next = new Set(likedCards);
    if (isCurrentlyLiked) next.delete(cardId); else next.add(cardId);
    setLikedCards(next);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: isCurrentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c));
    try {
      await cardsAPI.likeCard(cardId);
    } catch {
      const rev = new Set(likedCards);
      setLikedCards(rev);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: isCurrentlyLiked ? c.likes + 1 : Math.max(0, c.likes - 1) } : c));
      showToast('Failed to like');
    }
  };

  const handleSave = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySaved = savedCards.has(cardId);
    const next = new Set(savedCards);
    if (isCurrentlySaved) next.delete(cardId); else next.add(cardId);
    setSavedCards(next);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, saves: isCurrentlySaved ? Math.max(0, c.saves - 1) : c.saves + 1 } : c));
    try {
      await cardsAPI.saveCardToDeck(cardId);
      showToast(isCurrentlySaved ? 'Removed from deck' : 'Saved to deck');
    } catch {
      const rev = new Set(savedCards);
      setSavedCards(rev);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, saves: isCurrentlySaved ? c.saves + 1 : Math.max(0, c.saves - 1) } : c));
      showToast('Failed to save');
    }
  };

  const toggleExpanded = (cardId: string) => {
    const n = new Set(expandedCards);
    n.has(cardId) ? n.delete(cardId) : n.add(cardId);
    setExpandedCards(n);
  };

  const handleDiscuss = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    openComments(cardId);
  };

  const handleShare = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/cards/${cardId}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Check out this card on Ariel', url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); showToast('Link copied'); }
    } catch {
      try { await navigator.clipboard.writeText(shareUrl); showToast('Link copied'); } catch { showToast('Could not share'); }
    }
  };

  const handleDMShare = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareTarget({ id: card.id, title: card.question, subtitle: card.subject });
  };

  // ── Core rating + queue management ─────────────────────────────────────────
  const handleRate = async (card: Card, rating: RatingKey, e: React.MouseEvent) => {
    e.stopPropagation();
    const quality = rating === 'hard' ? 2 : rating === 'easy' ? 4 : 5;

    // Increment display count
    const prevCounts = reviewCounts[card.id] ?? { hard: 0, easy: 0, nailed: 0 };
    const newCounts = { ...prevCounts, [rating]: prevCounts[rating] + 1 };
    setReviewCounts(prev => ({ ...prev, [card.id]: newCounts }));

    // SRS update
    const updates = applyRatingLocally(card, quality);
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, ...updates } : c));

    // Queue management
    if (snapScroll && type === 'my-deck') {
      const currentIdx = activeSnapIdxRef.current;

      setQueueEntries(prev => {
        // Find this card's entry at or near the current position
        let entryIdx = -1;
        for (let i = currentIdx; i >= 0 && i >= currentIdx - 1; i--) {
          if (prev[i]?.cardId === card.id) { entryIdx = i; break; }
        }
        if (entryIdx === -1) {
          // fallback: find first occurrence from current position onward
          entryIdx = prev.findIndex((e, i) => i >= currentIdx && e.cardId === card.id);
        }
        if (entryIdx === -1) return prev;

        // Split: everything up to and including current, then future
        const before = prev.slice(0, entryIdx + 1);
        const after = prev.slice(entryIdx + 1);

        if (rating === 'hard') {
          // Re-insert 4 slides ahead in the future portion
          const insertAt = Math.min(4, after.length);
          const newEntry: QueueEntry = { cardId: card.id, key: `${card.id}-h${Date.now()}` };
          return [
            ...before,
            ...after.slice(0, insertAt),
            newEntry,
            ...after.slice(insertAt),
          ];
        }

        if (rating === 'easy') {
          // Track easy count from newCounts (already incremented)
          if (newCounts.easy >= 2) {
            // Second easy — remove all future occurrences
            return [...before, ...after.filter(e => e.cardId !== card.id)];
          } else {
            // First easy — remove existing future occurrences, insert near end
            const cleanAfter = after.filter(e => e.cardId !== card.id);
            const insertAt = Math.max(0, Math.floor(cleanAfter.length * 0.82));
            const newEntry: QueueEntry = { cardId: card.id, key: `${card.id}-e${Date.now()}` };
            return [
              ...before,
              ...cleanAfter.slice(0, insertAt),
              newEntry,
              ...cleanAfter.slice(insertAt),
            ];
          }
        }

        // Nailed it — remove all future occurrences
        return [...before, ...after.filter(e => e.cardId !== card.id)];
      });

      if (rating === 'nailed') {
        setNailedInSession(prev => new Set([...prev, card.id]));
      }
    }

    try {
      await cardsAPI.reviewCard(card.id, quality);
    } catch {}
  };

  // Session restart — nailed cards go to end
  const handleRestartSession = useCallback(() => {
    const nonNailed = filteredCards.filter(c => !nailedInSession.has(c.id));
    const nailed = filteredCards.filter(c => nailedInSession.has(c.id));
    const ts = Date.now();
    const newQueue: QueueEntry[] = [
      ...nonNailed.map(c => ({ cardId: c.id, key: `${c.id}-rst${ts}` })),
      ...nailed.map(c => ({ cardId: c.id, key: `${c.id}-rstn${ts}` })),
    ];
    setQueueEntries(newQueue);
    setActiveSnapIdx(0);
    activeSnapIdxRef.current = 0;
    setReviewCounts({});
    setSessionRestarted(true);
    setTimeout(() => {
      if (snapContainerRef.current) snapContainerRef.current.scrollTop = 0;
    }, 50);
  }, [filteredCards, nailedInSession]);

  // ── Rating buttons (reusable) ───────────────────────────────────────────────
  const renderRatingButtons = (card: Card, snap = false) => {
    const counts = reviewCounts[card.id] ?? { hard: 0, easy: 0, nailed: 0 };
    return (
      <div className={`flex items-stretch ${snap ? 'gap-3 justify-around' : 'gap-2'}`}>
        {(Object.keys(RATING_META) as RatingKey[]).map(key => {
          const count = counts[key];
          const active = count > 0;
          const m = RATING_META[key];
          return (
            <button
              key={key}
              onClick={e => handleRate(card, key, e)}
              className={`flex flex-col items-center gap-1 active:scale-90 transition-transform ${snap ? 'flex-none px-3 py-2' : 'flex-1 py-2.5'}`}
            >
              {/* Solid-fill checkbox */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${
                active
                  ? `${m.solidBg} border-transparent shadow-lg`
                  : 'border-white/20 bg-white/5'
              }`}>
                {active && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              {/* Label */}
              <span className={`text-[11px] font-semibold leading-none transition-colors ${active ? m.text : 'text-white/40'}`}>
                {m.label}
              </span>
              {/* Count — always reserve space so layout stable */}
              <span className={`text-[10px] font-black tabular-nums leading-none transition-all ${active ? m.text : 'text-transparent'}`}>
                {count > 0 ? count : '0'}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-800 border-t-violet-300" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-300/10 border border-violet-300/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl font-black text-violet-300">A</span>
        </div>
        <h3 className="text-lg font-bold text-white mb-2">
          {type === 'trending' ? 'Nothing here yet' : 'Your deck is empty'}
        </h3>
        <p className="text-zinc-500 text-sm max-w-[220px] mx-auto leading-relaxed">
          {type === 'trending' ? 'Be the first to create and share a card.' : 'Ask Ariel to generate cards or create your own.'}
        </p>
      </div>
    );
  }

  const grouped =
    groupBySubject && !snapScroll && (!subjectFilter || subjectFilter === 'all')
      ? filteredCards.reduce<Record<string, Card[]>>((acc, card) => {
          const key = card.subject || 'General';
          acc[key] = acc[key] || [];
          acc[key].push(card);
          return acc;
        }, {})
      : null;

  // ── Snap card renderer ───────────────────────────────────────────────────────
  const renderSnapCard = (card: Card, queueIdx: number, entryKey: string) => {
    const isExpanded = expandedCards.has(card.id);
    const totalInQueue = queueEntries.length;
    const remaining = Math.max(0, totalInQueue - queueIdx);
    const statusMeta = STATUS_META[getCardStatus(card)];

    return (
      <div
        key={entryKey}
        data-snap-idx={queueIdx}
        className="relative flex-shrink-0 w-full"
        style={{ height: '100svh', scrollSnapAlign: 'start' }}
      >
        <div className="absolute inset-0 bg-black" />

        {/* Progress + meta strip */}
        <div
          className="absolute left-0 right-0 z-10 px-5 flex items-center justify-between"
          style={{ top: `${headerOffset + 12}px` }}
        >
          {/* Subject + status */}
          <div className="flex items-center gap-2 min-w-0">
            {card.subject && (
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest truncate">{card.subject}</span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${statusMeta.pill}`}>
              {statusMeta.label}
            </span>
          </div>
          {/* Remaining count */}
          {remaining > 0 && (
            <span className="text-[11px] font-bold text-zinc-600 tabular-nums flex-shrink-0">{remaining} left</span>
          )}
        </div>

        {/* Progress bar */}
        <div className="absolute left-0 right-0 z-10 px-5" style={{ top: `${headerOffset + 34}px` }}>
          <div className="h-[2px] w-full bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/25 rounded-full transition-all duration-500"
              style={{ width: totalInQueue > 0 ? `${(queueIdx / totalInQueue) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Floating white card — tap to flip */}
        <div
          className="absolute inset-0 flex items-center justify-center px-5 cursor-pointer"
          style={{ paddingTop: `${headerOffset + 52}px`, paddingBottom: '160px' }}
          onClick={() => toggleExpanded(card.id)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl shadow-2xl shadow-black/70 transition-colors flex flex-col items-center justify-center px-7 py-10 overflow-y-auto ${
              isExpanded ? 'bg-amber-50' : 'bg-white'
            }`}
            style={{ maxHeight: `calc(100svh - ${headerOffset + 220}px)` }}
          >
            {!isExpanded ? (
              <div className="space-y-5 text-center w-full">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question</p>
                <h2 className="text-zinc-900 text-3xl leading-snug" style={{ fontFamily: "var(--font-caveat), cursive" }}>
                  {card.question}
                </h2>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
                  <p className="text-zinc-400 text-sm">Tap to reveal answer</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <p className="text-zinc-400 text-lg leading-relaxed text-center" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.question}</p>
                <div className="h-px bg-zinc-200" />
                <div className="text-center space-y-3">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Answer</p>
                  <p className="text-zinc-900 text-3xl leading-snug" style={{ fontFamily: "var(--font-caveat), cursive" }}>
                    {card.answer}
                  </p>
                </div>
                {card.explanation && (
                  <div className="mt-2 p-4 rounded-2xl bg-zinc-100 border border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Why</p>
                    <p className="text-zinc-600 text-base leading-relaxed" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.explanation}</p>
                  </div>
                )}
                <p className="text-zinc-300 text-xs text-center">Tap again to see question</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating buttons */}
        {type === 'my-deck' && (
          <div className="absolute bottom-24 left-0 right-0 px-6 z-10">
            <div className="bg-black/50 backdrop-blur-md rounded-2xl px-2 py-3 border border-white/8">
              {renderRatingButtons(card, true)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Completion slide ─────────────────────────────────────────────────────────
  const renderCompletionSlide = () => {
    const totalCards = filteredCards.length;
    const sessionHard = Object.values(reviewCounts).reduce((s, c) => s + c.hard, 0);
    const sessionEasy = Object.values(reviewCounts).reduce((s, c) => s + c.easy, 0);
    const sessionNailed = nailedInSession.size;

    return (
      <div
        key="__completion__"
        className="relative flex-shrink-0 w-full flex items-center justify-center bg-black"
        style={{ height: '100svh', scrollSnapAlign: 'start' }}
      >
        <div className="flex flex-col items-center gap-5 px-8 text-center max-w-xs">
          {/* Trophy */}
          <div className="w-20 h-20 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-9 h-9 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>

          <div>
            <p className="text-white font-bold text-2xl leading-snug">Session complete</p>
            <p className="text-zinc-500 text-sm mt-1">{totalCards} cards reviewed</p>
          </div>

          {/* Session stats — the new checkboxes */}
          <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl px-4 py-5 flex justify-around">
            {([
              { key: 'hard' as RatingKey, count: sessionHard },
              { key: 'easy' as RatingKey, count: sessionEasy },
              { key: 'nailed' as RatingKey, count: sessionNailed },
            ]).map(({ key, count }) => {
              const m = RATING_META[key];
              const active = count > 0;
              return (
                <div key={key} className="flex flex-col items-center gap-1.5">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center border-2 ${
                    active ? `${m.solidBg} border-transparent` : 'border-zinc-700 bg-transparent'
                  }`}>
                    {active ? (
                      <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-zinc-600 text-lg font-black">—</span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold ${active ? m.text : 'text-zinc-600'}`}>{m.label}</span>
                  <span className={`text-base font-black tabular-nums ${active ? m.text : 'text-zinc-700'}`}>{count}</span>
                </div>
              );
            })}
          </div>

          {sessionNailed > 0 && (
            <p className="text-zinc-500 text-xs leading-relaxed">
              {sessionNailed} nailed card{sessionNailed !== 1 ? 's' : ''} will appear last on restart.
            </p>
          )}

          <button
            onClick={handleRestartSession}
            className="w-full py-3.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold rounded-2xl active:scale-95 transition-all"
          >
            Restart session
          </button>
        </div>
      </div>
    );
  };

  // ── Snap-scroll container ───────────────────────────────────────────────────
  if (snapScroll) {
    const entriesToRender = type === 'my-deck' ? queueEntries : filteredCards.map(c => ({ cardId: c.id, key: c.id }));

    return (
      <>
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 bg-zinc-800/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
        <div
          ref={snapContainerRef}
          className="fixed inset-0 lg:left-[72px] overflow-y-scroll"
          style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' as any }}
          onScroll={handleSnapScroll}
        >
          {entriesToRender.map((entry, idx) => {
            const card = cardsById[entry.cardId];
            if (!card) return null;
            return renderSnapCard(card, idx, entry.key);
          })}
          {type === 'my-deck' && renderCompletionSlide()}
        </div>
        {shareTarget && (
          <ShareSheet
            target={{ type: 'card', id: shareTarget.id, title: shareTarget.title, subtitle: shareTarget.subtitle }}
            onClose={() => setShareTarget(null)}
          />
        )}
      </>
    );
  }

  // ── Regular list card ─────────────────────────────────────────────────────
  const renderCard = (card: Card, index: number) => {
    const isExpanded = expandedCards.has(card.id);
    const isLiked = likedCards.has(card.id);
    const isSaved = savedCards.has(card.id);

    return (
      <div key={card.id} className="rounded-2xl overflow-hidden shadow-xl shadow-black/60" style={{ animationDelay: `${index * 0.05}s` }}>
        <div
          className={`relative cursor-pointer min-h-[200px] flex flex-col transition-colors ${isExpanded ? 'bg-amber-50' : 'bg-white'}`}
          onClick={() => toggleExpanded(card.id)}
        >
          <div className="px-4 pt-4 pb-0 flex items-center justify-between gap-2">
            <div>
              {card.subject && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{card.subject}</span>}
              {card.topic && <span className="text-[10px] text-zinc-400 ml-2">· {card.topic}</span>}
            </div>
            {type === 'my-deck' && (() => {
              const st = getCardStatus(card);
              const m = STATUS_META[st];
              return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${m.pill}`}>{m.label}</span>;
            })()}
          </div>
          <div className="flex-1 flex items-center justify-center px-5 py-6">
            {!isExpanded ? (
              <div className="text-center space-y-4 w-full">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question</p>
                <p className="text-zinc-900 text-2xl leading-snug" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.question}</p>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <div className="w-1 h-1 rounded-full bg-zinc-300 animate-pulse" />
                  <p className="text-zinc-400 text-xs">tap to reveal</p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <p className="text-zinc-400 text-lg leading-relaxed text-center" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.question}</p>
                <div className="h-px bg-zinc-200" />
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Answer</p>
                  <p className="text-zinc-900 text-2xl leading-snug" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.answer}</p>
                </div>
                {card.explanation && (
                  <div className="pt-3 border-t border-zinc-200">
                    <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Why</p>
                    <p className="text-zinc-600 text-base leading-relaxed" style={{ fontFamily: "var(--font-caveat), cursive" }}>{card.explanation}</p>
                  </div>
                )}
                <p className="text-zinc-300 text-xs text-center">Tap again to see question</p>
              </div>
            )}
          </div>
        </div>

        {type === 'my-deck' ? (
          <div className="px-3 py-2.5 bg-zinc-900">
            {renderRatingButtons(card, false)}
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-zinc-900 flex items-center gap-4">
            <button onClick={e => handleLike(card.id, e)} className="flex items-center gap-1.5 group">
              <svg className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-zinc-500 group-hover:text-white'}`} fill={isLiked ? 'currentColor' : 'none'} stroke={isLiked ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {card.likes > 0 && <span className="text-xs text-zinc-500">{card.likes}</span>}
            </button>
            <button onClick={e => handleDiscuss(card.id, e)} className="text-zinc-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button onClick={e => handleShare(card.id, e)} className="text-zinc-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
            <button onClick={e => handleDMShare(card, e)} className="text-zinc-500 hover:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
            <button onClick={e => handleSave(card.id, e)} className="ml-auto text-zinc-500 hover:text-white">
              <svg className={`w-5 h-5 ${isSaved ? 'text-violet-300' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (grouped) {
    return (
      <>
        {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 bg-zinc-800/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
            {toast}
          </div>
        )}
        <div className="space-y-8 pb-24">
          {Object.entries(grouped).map(([subject, subjectCards]) => (
            <div key={subject} className="space-y-3">
              <div className="px-2">
                <h3 className="text-sm font-semibold text-zinc-500">{subject} · {subjectCards.length} cards</h3>
              </div>
              <div className="space-y-4">
                {subjectCards.map((card, idx) => renderCard(card, idx))}
              </div>
            </div>
          ))}
        </div>
        {shareTarget && (
          <ShareSheet
            target={{ type: 'card', id: shareTarget.id, title: shareTarget.title, subtitle: shareTarget.subtitle }}
            onClose={() => setShareTarget(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-4 py-2 bg-zinc-800/90 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
      <div className="space-y-4 pb-24">
        {filteredCards.map((card, index) => renderCard(card, index))}
      </div>
      {shareTarget && (
        <ShareSheet
          target={{ type: 'card', id: shareTarget.id, title: shareTarget.title, subtitle: shareTarget.subtitle }}
          onClose={() => setShareTarget(null)}
        />
      )}
    </>
  );
}
