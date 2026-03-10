'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cardsAPI } from '@/lib/api';
import { useComments } from '@/lib/commentsContext';

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
  const [toast, setToast] = useState<string | null>(null);

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
        data = await cardsAPI.getMyDeck({ limit: 100 });
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
        className="relative flex-shrink-0 w-full"
        style={{ height: '100svh', scrollSnapAlign: 'start' }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black" />

        {/* Top info */}
        <div className="absolute top-0 left-0 right-0 z-10 px-4 pb-6 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" style={{ paddingTop: `${headerOffset + 16}px` }}>
          {card.subject && (
            <span className="inline-block px-3 py-1 bg-violet-300/15 border border-violet-300/40 text-violet-300 text-xs font-semibold rounded-full">
              {card.subject}
            </span>
          )}
          {card.topic && (
            <p className="text-zinc-400 text-xs mt-1">{card.topic}</p>
          )}
        </div>

        {/* Main card area — tap to flip */}
        <div
          className="absolute inset-0 flex items-center justify-center px-6 cursor-pointer"
          onClick={() => toggleExpanded(card.id)}
        >
          <div className="w-full max-w-sm">
            {!isExpanded ? (
              <div className="space-y-5 text-center">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-7 shadow-2xl">
                  <p className="text-white text-xl font-semibold leading-snug">
                    {card.question}
                  </p>
                </div>
                <p className="text-zinc-500 text-sm flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Tap to reveal answer
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-3xl p-5">
                  <p className="text-zinc-400 text-sm mb-3">{card.question}</p>
                  <div className="h-px bg-zinc-800 mb-3" />
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-violet-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white text-base font-medium leading-relaxed">{card.answer}</p>
                  </div>
                  {card.explanation && (
                    <div className="mt-4 pt-3 border-t border-zinc-800">
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5">Explanation</p>
                      <p className="text-zinc-300 text-sm leading-relaxed">{card.explanation}</p>
                    </div>
                  )}
                </div>
                <p className="text-zinc-600 text-xs text-center">Tap again to see question</p>
              </div>
            )}
          </div>
        </div>

        {/* Right action bar */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 z-10">
          {/* Like */}
          <button onClick={(e) => handleLike(card.id, e)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
              <svg
                className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-white'}`}
                fill={isLiked ? 'currentColor' : 'none'}
                stroke={isLiked ? 'none' : 'currentColor'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">{card.likes > 0 ? card.likes : ''}</span>
          </button>

          {/* Save */}
          <button onClick={(e) => handleSave(card.id, e)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
              <svg
                className={`w-5 h-5 ${isSaved ? 'text-violet-300' : 'text-white'}`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke={isSaved ? 'none' : 'currentColor'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">{card.saves > 0 ? card.saves : ''}</span>
          </button>

          {/* Share */}
          <button onClick={(e) => handleShare(card.id, e)} className="flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
            </div>
          </button>
        </div>

        {/* Bottom left info */}
        <div className="absolute left-4 bottom-24 z-10 pointer-events-none">
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 max-w-[220px]">
              {card.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-zinc-900/70 backdrop-blur-sm border border-zinc-700 text-zinc-400 text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
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
        className={`rounded-2xl overflow-hidden border transition-colors ${isExpanded ? 'bg-[#111113] border-violet-300/20' : 'bg-[#111113] border-zinc-800/60'}`}
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-300/10 flex items-center justify-center flex-shrink-0">
            <span className="text-violet-300 font-bold text-xs">
              {card.subject ? card.subject[0].toUpperCase() : 'A'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-300 text-sm leading-none">{card.subject || 'Study Card'}</p>
            {card.topic && <p className="text-xs text-zinc-600 mt-0.5">{card.topic}</p>}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800/60 mx-4" />

        {/* Content */}
        <div
          className="relative px-5 py-5 cursor-pointer min-h-[180px] flex items-center justify-center"
          onClick={() => toggleExpanded(card.id)}
        >
          {!isExpanded ? (
            <div className="text-center space-y-3 w-full">
              <p className="text-white text-base font-semibold leading-relaxed">{card.question}</p>
              <p className="text-zinc-600 text-xs flex items-center justify-center gap-1.5 mt-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                tap to reveal
              </p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <p className="text-zinc-500 text-sm leading-relaxed">{card.question}</p>
              <div className="h-px bg-zinc-800/60" />
              <div className="flex items-start gap-3">
                <div className="w-1 self-stretch rounded-full bg-violet-400 flex-shrink-0" />
                <p className="text-white text-base font-medium leading-relaxed">{card.answer}</p>
              </div>
              {card.explanation && (
                <div className="pt-3 border-t border-zinc-800/60">
                  <p className="text-zinc-600 text-[10px] font-semibold uppercase tracking-widest mb-1.5">Why</p>
                  <p className="text-zinc-400 text-sm leading-relaxed">{card.explanation}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-4">
          <button onClick={(e) => handleLike(card.id, e)} className="flex items-center gap-1.5 group">
            <svg
              className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-zinc-500 group-hover:text-white'}`}
              fill={isLiked ? 'currentColor' : 'none'}
              stroke={isLiked ? 'none' : 'currentColor'}
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
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
          {type === 'trending' && (
            <button onClick={(e) => handleSave(card.id, e)} className="ml-auto text-zinc-500 hover:text-white">
              <svg
                className={`w-5 h-5 ${isSaved ? 'text-violet-300' : ''}`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke={isSaved ? 'none' : 'currentColor'}
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>
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
          className="fixed inset-0 lg:left-[72px] overflow-y-scroll"
          style={{ scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {filteredCards.map((card) => renderSnapCard(card))}
        </div>
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
    </>
  );
}
