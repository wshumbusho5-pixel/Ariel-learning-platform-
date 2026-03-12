'use client';

import { useState, useEffect, useRef } from 'react';
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
  // SRS fields
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
    // Within 'due': most overdue first
    if (sa === 'due' && a.next_review && b.next_review) {
      return new Date(a.next_review).getTime() - new Date(b.next_review).getTime();
    }
    return 0;
  });
}

// Optimistic local SM-2 simulation so badges + sort update instantly
function applyRatingLocally(card: Card, quality: number): Partial<Card> {
  const currentInterval = card.interval ?? 0;
  const reviewCount = (card.review_count ?? 0) + 1;

  let newInterval: number;
  if (quality <= 2) {
    newInterval = 1;                                              // Hard → back to 1 day
  } else if (quality === 4) {
    newInterval = currentInterval < 1 ? 4 : Math.round(currentInterval * 2);   // Easy
  } else {
    newInterval = currentInterval < 1 ? 6 : Math.round(currentInterval * 2.5); // Nailed
  }

  const next = new Date();
  next.setDate(next.getDate() + newInterval);

  return { interval: newInterval, next_review: next.toISOString(), review_count: reviewCount };
}

interface CardFeedProps {
  type: 'trending' | 'my-deck';
  onCardClick?: (card: Card) => void;
  subjectFilter?: string | null;
  groupBySubject?: boolean;
  snapScroll?: boolean;
  headerOffset?: number; // px — pushes the subject label below a fixed header
}

export default function CardFeed({ type, onCardClick, subjectFilter, groupBySubject = false, snapScroll = false, headerOffset = 0 }: CardFeedProps) {
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

  const handleLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlyLiked = likedCards.has(cardId);
    // Optimistic
    const next = new Set(likedCards);
    if (isCurrentlyLiked) next.delete(cardId); else next.add(cardId);
    setLikedCards(next);
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: isCurrentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c));
    try {
      await cardsAPI.likeCard(cardId);
    } catch {
      // Revert
      const rev = new Set(likedCards);
      setLikedCards(rev);
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, likes: isCurrentlyLiked ? c.likes + 1 : Math.max(0, c.likes - 1) } : c));
      showToast('Failed to like');
    }
  };

  const handleSave = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentlySaved = savedCards.has(cardId);
    // Optimistic
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
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  const handleDiscuss = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    openComments(cardId);
  };

  const handleShare = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/cards/${cardId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Check out this card on Ariel', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied');
      } catch {
        showToast('Could not share');
      }
    }
  };

  const handleDMShare = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    setShareTarget({ id: card.id, title: card.question, subtitle: card.subject });
  };

  const handleRate = async (card: Card, rating: 'hard' | 'easy' | 'nailed', e: React.MouseEvent) => {
    e.stopPropagation();
    const quality = rating === 'hard' ? 2 : rating === 'easy' ? 4 : 5;

    // Increment the visual tally
    setReviewCounts(prev => {
      const current = prev[card.id] ?? { hard: 0, easy: 0, nailed: 0 };
      return { ...prev, [card.id]: { ...current, [rating]: current[rating] + 1 } };
    });

    // Update card status + interval locally, then re-sort
    const updates = applyRatingLocally(card, quality);
    setCards(prev => sortByStatus(prev.map(c => c.id === card.id ? { ...c, ...updates } : c)));

    try {
      await cardsAPI.reviewCard(card.id, quality);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-zinc-800 border-t-violet-300"></div>
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
          {type === 'trending'
            ? 'Be the first to create and share a card.'
            : 'Ask Ariel to generate cards or create your own.'}
        </p>
      </div>
    );
  }

  const filteredCards =
    subjectFilter && subjectFilter !== 'all'
      ? cards.filter((c) => (c.subject || '').toLowerCase() === subjectFilter.toLowerCase())
      : cards;

  const grouped =
    groupBySubject && !snapScroll && (!subjectFilter || subjectFilter === 'all')
      ? filteredCards.reduce<Record<string, Card[]>>((acc, card) => {
          const key = card.subject || 'General';
          acc[key] = acc[key] || [];
          acc[key].push(card);
          return acc;
        }, {})
      : null;

  // ── Snap-scroll (Instagram / TikTok style) ─────────────────────────────────
  const renderSnapCard = (card: Card) => {
    const isExpanded = expandedCards.has(card.id);
    const isLiked = likedCards.has(card.id);
    const isSaved = savedCards.has(card.id);

    return (
      <div
        key={card.id}
        data-snap-card
        data-card-id={card.id}
        className="relative flex-shrink-0 w-full"
        style={{ height: '100svh', scrollSnapAlign: 'start' }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black" />

        {/* Subject label + status badge above card */}
        <div className="absolute left-0 right-0 z-10 flex justify-center pointer-events-none" style={{ top: `${headerOffset + 16}px` }}>
          <div className="flex items-center gap-2">
            {card.subject && (
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">{card.subject}</span>
            )}
            {card.topic && <span className="text-[11px] text-zinc-600">· {card.topic}</span>}
            {type === 'my-deck' && (() => {
              const st = getCardStatus(card);
              const m = STATUS_META[st];
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.pill}`}>
                  {m.label}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Floating white card — tap to flip */}
        <div
          className="absolute inset-0 flex items-center justify-center px-5 cursor-pointer"
          style={{ paddingTop: `${headerOffset + 48}px`, paddingBottom: '148px' }}
          onClick={() => toggleExpanded(card.id)}
        >
          <div
            className={`w-full max-w-sm rounded-3xl shadow-2xl shadow-black/70 transition-colors flex flex-col items-center justify-center px-7 py-10 overflow-y-auto ${
              isExpanded ? 'bg-amber-50' : 'bg-white'
            }`}
            style={{ maxHeight: `calc(100svh - ${headerOffset + 200}px)` }}
          >
            {!isExpanded ? (
              <div className="space-y-5 text-center w-full">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question</p>
                <h2 className="text-zinc-900 text-2xl font-black leading-snug">
                  {card.question}
                </h2>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 animate-pulse" />
                  <p className="text-zinc-400 text-sm">Tap to reveal answer</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                <p className="text-zinc-400 text-sm leading-relaxed text-center">{card.question}</p>
                <div className="h-px bg-zinc-200" />
                <div className="text-center space-y-3">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Answer</p>
                  <p className="text-zinc-900 text-2xl font-black leading-snug">
                    {card.answer}
                  </p>
                </div>
                {card.explanation && (
                  <div className="mt-2 p-4 rounded-2xl bg-zinc-100 border border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Why</p>
                    <p className="text-zinc-600 text-sm leading-relaxed">{card.explanation}</p>
                  </div>
                )}
                <p className="text-zinc-300 text-xs text-center pt-1">Tap again to see question</p>
              </div>
            )}
          </div>
        </div>

        {/* Rating buttons (my-deck) or social actions (trending) */}
        {type === 'my-deck' ? (
          <div className="absolute bottom-24 left-0 right-0 px-5 z-10">
            {(() => {
              const counts = reviewCounts[card.id] ?? { hard: 0, easy: 0, nailed: 0 };
              const total = counts.hard + counts.easy + counts.nailed;
              const dominant = total > 0
                ? (['hard', 'easy', 'nailed'] as const).reduce((a, b) => counts[a] >= counts[b] ? a : b)
                : null;
              return (
                <div className="flex gap-2">
                  {([
                    { key: 'hard', label: 'Hard' },
                    { key: 'easy', label: 'Easy' },
                    { key: 'nailed', label: 'Nailed it' },
                  ] as const).map(({ key, label }) => {
                    const count = counts[key];
                    const isDominant = dominant === key && total > 0;
                    return (
                      <button
                        key={key}
                        onClick={(e) => handleRate(card, key, e)}
                        className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-0.5 active:scale-95 transition-all border ${
                          isDominant
                            ? 'bg-zinc-700 border-zinc-500'
                            : 'bg-zinc-900 border-zinc-700'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isDominant ? 'text-white' : 'text-zinc-400'}`}>
                          {label}
                        </span>
                        {count > 0 && (
                          <span className={`text-[10px] font-black tabular-nums ${
                            isDominant ? 'text-zinc-200' : 'text-zinc-500'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
            <button onClick={(e) => handleLike(card.id, e)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
                <svg className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-white'}`} fill={isLiked ? 'currentColor' : 'none'} stroke={isLiked ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className="text-white text-xs font-medium">{card.likes > 0 ? card.likes : ''}</span>
            </button>
            <button onClick={(e) => handleSave(card.id, e)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
                <svg className={`w-5 h-5 ${isSaved ? 'text-violet-300' : 'text-white'}`} fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <span className="text-white text-xs font-medium">{card.saves > 0 ? card.saves : ''}</span>
            </button>
            <button onClick={(e) => handleShare(card.id, e)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
              </div>
            </button>
            <button onClick={(e) => handleDMShare(card, e)} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
            </button>
          </div>
        )}

      </div>
    );
  };

  // ── Regular list card ───────────────────────────────────────────────────────
  const renderCard = (card: Card, index: number) => {
    const isExpanded = expandedCards.has(card.id);
    const isLiked = likedCards.has(card.id);
    const isSaved = savedCards.has(card.id);

    return (
      <div
        key={card.id}
        className="rounded-2xl overflow-hidden shadow-xl shadow-black/60"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Card face */}
        <div
          className={`relative cursor-pointer min-h-[200px] flex flex-col transition-colors ${
            isExpanded ? 'bg-amber-50' : 'bg-white'
          }`}
          onClick={() => toggleExpanded(card.id)}
        >
          {/* Subject + status badge top row */}
          <div className="px-4 pt-4 pb-0 flex items-center justify-between gap-2">
            <div>
              {card.subject && (
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{card.subject}</span>
              )}
              {card.topic && <span className="text-[10px] text-zinc-400 ml-2">· {card.topic}</span>}
            </div>
            {type === 'my-deck' && (() => {
              const st = getCardStatus(card);
              const m = STATUS_META[st];
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${m.pill}`}>
                  {m.label}
                </span>
              );
            })()}
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center px-5 py-6">
            {!isExpanded ? (
              <div className="text-center space-y-4 w-full">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question</p>
                <p className="text-zinc-900 text-xl font-black leading-snug">{card.question}</p>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <div className="w-1 h-1 rounded-full bg-zinc-300 animate-pulse" />
                  <p className="text-zinc-400 text-xs">tap to reveal</p>
                </div>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <p className="text-zinc-400 text-sm leading-relaxed text-center">{card.question}</p>
                <div className="h-px bg-zinc-200" />
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Answer</p>
                  <p className="text-zinc-900 text-xl font-black leading-snug">{card.answer}</p>
                </div>
                {card.explanation && (
                  <div className="pt-3 border-t border-zinc-200">
                    <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Why</p>
                    <p className="text-zinc-600 text-sm leading-relaxed">{card.explanation}</p>
                  </div>
                )}
                <p className="text-zinc-300 text-xs text-center">Tap again to see question</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions strip — dark, sits below the white card */}
        {type === 'my-deck' ? (
          <div className="px-3 py-2.5 bg-zinc-900 flex gap-2">
            {(() => {
              const counts = reviewCounts[card.id] ?? { hard: 0, easy: 0, nailed: 0 };
              const total = counts.hard + counts.easy + counts.nailed;
              const dominant = total > 0
                ? (['hard', 'easy', 'nailed'] as const).reduce((a, b) => counts[a] >= counts[b] ? a : b)
                : null;
              return (
                <>
                  {([
                    { key: 'hard', label: 'Hard' },
                    { key: 'easy', label: 'Easy' },
                    { key: 'nailed', label: 'Nailed it' },
                  ] as const).map(({ key, label }) => {
                    const count = counts[key];
                    const isDominant = dominant === key && total > 0;
                    return (
                      <button
                        key={key}
                        onClick={(e) => handleRate(card, key, e)}
                        className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                          isDominant ? 'bg-zinc-700 border-zinc-600' : 'bg-zinc-800 border-zinc-700'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isDominant ? 'text-white' : 'text-zinc-500'}`}>
                          {label}
                        </span>
                        {count > 0 && (
                          <span className={`text-[10px] font-black tabular-nums ${isDominant ? 'text-zinc-200' : 'text-zinc-600'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>
        ) : (
          <div className="px-4 py-2.5 bg-zinc-900 flex items-center gap-4">
            <button onClick={(e) => handleLike(card.id, e)} className="flex items-center gap-1.5 group">
              <svg className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-zinc-500 group-hover:text-white'}`} fill={isLiked ? 'currentColor' : 'none'} stroke={isLiked ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {card.likes > 0 && <span className="text-xs text-zinc-500">{card.likes}</span>}
            </button>
            <button onClick={(e) => handleDiscuss(card.id, e)} className="text-zinc-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button onClick={(e) => handleShare(card.id, e)} className="text-zinc-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </button>
            <button onClick={(e) => handleDMShare(card, e)} className="text-zinc-500 hover:text-violet-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
            <button onClick={(e) => handleSave(card.id, e)} className="ml-auto text-zinc-500 hover:text-white">
              <svg className={`w-5 h-5 ${isSaved ? 'text-violet-300' : ''}`} fill={isSaved ? 'currentColor' : 'none'} stroke={isSaved ? 'none' : 'currentColor'} strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── Snap-scroll container ───────────────────────────────────────────────────
  if (snapScroll) {
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
          style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {filteredCards.map((card) => renderSnapCard(card))}
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
