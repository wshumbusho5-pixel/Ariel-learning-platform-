'use client';

import { useState, useRef } from 'react';
import { cardsAPI, aiChatAPI } from '@/lib/api';

interface Card {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  likes: number;
  saves: number;
}

export interface RatingRecord {
  cardIndex: number;
  cardId: string;
  question: string;
  quality: number;
}

export interface SessionStats {
  total: number;
  ratings: RatingRecord[];
  durationMs: number;
}

interface SwipeCardReviewProps {
  initialCards: Card[];
  onComplete?: (stats: SessionStats) => void;
  onExit?: () => void;
}

const QUALITY_LABELS: Record<number, string> = { 0: 'Again', 2: 'Hard', 4: 'Good', 5: 'Easy' };

function getDueText(quality: number): string {
  if (quality === 0) return 'See again soon';
  if (quality === 2) return 'Due tomorrow';
  if (quality === 4) return 'Due in ~4 days';
  return 'Due in ~1 week';
}

function qualityBg(q: number): string {
  if (q === 0) return 'bg-red-500 active:bg-red-600';
  if (q === 2) return 'bg-orange-500 active:bg-orange-600';
  if (q === 4) return 'bg-emerald-500 active:bg-emerald-600';
  return 'bg-sky-500 active:bg-sky-600';
}

export default function SwipeCardReview({ initialCards, onComplete, onExit }: SwipeCardReviewProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Session tracking
  const startTimeRef = useRef(Date.now());
  const [ratingHistory, setRatingHistory] = useState<RatingRecord[]>([]);
  const [undoStack, setUndoStack] = useState<number[]>([]);

  // Streak
  const [streak, setStreak] = useState(0);
  const [streakBadge, setStreakBadge] = useState<string | null>(null);

  // Due-in toast
  const [dueText, setDueText] = useState<string | null>(null);

  const currentCard = cards[currentIndex];

  const resetCard = () => {
    setIsFlipped(false);
    setSwipeDirection(null);
    setTouchOffset({ x: 0, y: 0 });
    setExplanation(null);
  };

  const showDueToast = (quality: number) => {
    setDueText(getDueText(quality));
    setTimeout(() => setDueText(null), 2000);
  };

  const advanceStreak = (quality: number, current: number): number => {
    if (quality >= 4) {
      const next = current + 1;
      if (next === 3 || next === 5 || next === 10) {
        setStreakBadge(`${next} in a row!`);
        setTimeout(() => setStreakBadge(null), 2200);
      }
      setStreak(next);
      return next;
    }
    setStreak(0);
    return 0;
  };

  const handleRating = async (quality: number) => {
    const record: RatingRecord = {
      cardIndex: currentIndex,
      cardId: currentCard.id,
      question: currentCard.question,
      quality,
    };
    const nextHistory = [...ratingHistory, record];
    setRatingHistory(nextHistory);
    setUndoStack(prev => [...prev, currentIndex]);

    try { await cardsAPI.reviewCard(currentCard.id, quality); } catch {}

    showDueToast(quality);
    advanceStreak(quality, streak);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      resetCard();
    } else {
      onComplete?.({
        total: cards.length,
        ratings: nextHistory,
        durationMs: Date.now() - startTimeRef.current,
      });
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevIndex = undoStack[undoStack.length - 1];
    const prevHistory = ratingHistory.slice(0, -1);
    setUndoStack(prev => prev.slice(0, -1));
    setRatingHistory(prevHistory);
    setCurrentIndex(prevIndex);
    resetCard();
    // Recalculate streak from remaining history
    let s = 0;
    for (let i = prevHistory.length - 1; i >= 0; i--) {
      if (prevHistory[i].quality >= 4) s++;
      else break;
    }
    setStreak(s);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isFlipped) return;
    const dx = e.touches[0].clientX - touchStart.x;
    const dy = e.touches[0].clientY - touchStart.y;
    setTouchOffset({ x: dx, y: dy });
    setSwipeDirection(Math.abs(dx) > 50 ? (dx > 0 ? 'right' : 'left') : null);
  };

  const handleTouchEnd = async () => {
    if (!touchStart) return;
    if (isFlipped && Math.abs(touchOffset.x) > 100) {
      await handleRating(touchOffset.x > 0 ? 4 : 2);
    }
    setTouchStart(null);
    setTouchOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const handleLike = async () => {
    try {
      await cardsAPI.likeCard(currentCard.id);
      setCards(prev => prev.map((c, i) => i === currentIndex ? { ...c, likes: c.likes + 1 } : c));
    } catch {}
  };

  const handleSave = async () => {
    try {
      await cardsAPI.saveCardToDeck(currentCard.id);
      setCards(prev => prev.map((c, i) => i === currentIndex ? { ...c, saves: c.saves + 1 } : c));
    } catch {}
  };

  const handleExplainMistake = async () => {
    if (loadingExplanation) return;
    setLoadingExplanation(true);
    try {
      const prompt = `A student got this flashcard wrong. Explain clearly and concisely why the correct answer is right, using a simple analogy or example if helpful. Keep it under 3 sentences.\n\nQuestion: ${currentCard.question}\nCorrect answer: ${currentCard.answer}`;
      const res = await aiChatAPI.complete(prompt);
      let text = typeof res?.reply === 'string' ? res.reply : '';
      try {
        const parsed = JSON.parse(text);
        text = parsed.answer || parsed.explanation || parsed.reply || parsed.message || text;
      } catch {}
      setExplanation(text);
    } catch {
      setExplanation('Could not load explanation. Check your AI provider settings.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  if (!currentCard) return null;

  const progress = (currentIndex / cards.length) * 100;
  const swipeLabelColor = swipeDirection === 'right' ? 'bg-emerald-500' : 'bg-orange-500';
  const swipeLabelText = swipeDirection === 'right' ? 'Good' : 'Hard';

  return (
    <div className="fixed inset-0 bg-[#09090b] z-50 flex flex-col">
      <style>{`
        .rv-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rv-back { transform: rotateY(180deg); }
        @keyframes streak-pop {
          0%   { opacity: 0; transform: translateX(-50%) scale(0.7) translateY(4px); }
          25%  { opacity: 1; transform: translateX(-50%) scale(1.1) translateY(-6px); }
          75%  { opacity: 1; transform: translateX(-50%) scale(1) translateY(-8px); }
          100% { opacity: 0; transform: translateX(-50%) scale(0.95) translateY(-12px); }
        }
        @keyframes due-slide {
          0%   { opacity: 0; transform: translateX(-50%) translateY(6px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-safe-top pt-4">
        <div className="flex items-center gap-3 text-white">
          <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="h-1 bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium text-white/60 tabular-nums flex-shrink-0">
            {currentIndex + 1}/{cards.length}
          </span>
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              title="Undo last rating"
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 text-white/40 hover:text-white/80"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Streak badge */}
      {streakBadge && (
        <div
          className="absolute top-16 left-1/2 z-20 pointer-events-none px-4 py-2 bg-amber-400 text-black rounded-full font-black text-sm shadow-lg"
          style={{ animation: 'streak-pop 2.2s ease forwards' }}
        >
          🔥 {streakBadge}
        </div>
      )}

      {/* Due-in toast */}
      {dueText && (
        <div
          className="absolute bottom-32 left-1/2 z-20 pointer-events-none px-4 py-1.5 bg-zinc-800/90 backdrop-blur text-white/60 rounded-full text-xs font-semibold shadow"
          style={{ animation: 'due-slide 2s ease forwards' }}
        >
          {dueText}
        </div>
      )}

      {/* Card area */}
      <div
        className="flex-1 flex items-center justify-center p-4 pt-20 pb-36"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full max-w-md h-full"
          style={{
            transform: `translateX(${touchOffset.x}px) translateY(${touchOffset.y * 0.12}px) rotate(${touchOffset.x * 0.04}deg)`,
            transition: touchStart ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Swipe hint */}
          {swipeDirection && (
            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${swipeLabelColor} text-white px-5 py-1.5 rounded-full font-bold text-sm shadow-lg z-20`}>
              {swipeLabelText}
            </div>
          )}

          {/* 3D flip wrapper */}
          <div style={{ perspective: '1200px', width: '100%', height: '100%' }}>
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              {/* ── FRONT — Question ── */}
              <div
                className="rv-face absolute inset-0 bg-zinc-900 rounded-2xl flex flex-col overflow-hidden cursor-pointer"
                onClick={() => setIsFlipped(true)}
              >
                <div className="p-5 pb-0">
                  {(currentCard.subject || currentCard.topic) && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {currentCard.subject && (
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                          {currentCard.subject}
                        </span>
                      )}
                      {currentCard.topic && (
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                          {currentCard.topic}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-8 py-4 text-center">
                  <h2 className="text-2xl font-bold text-white leading-snug mb-6">
                    {currentCard.question}
                  </h2>
                  <div className="flex items-center gap-2 text-white/30">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                    </svg>
                    <span className="text-sm">Tap to reveal</span>
                  </div>
                </div>

                {/* Social row */}
                <div className="px-6 pb-5 flex items-center justify-around border-t border-white/[0.05] pt-4">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLike(); }}
                    className="flex items-center gap-1.5 text-white/40 hover:text-rose-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span className="text-xs">{currentCard.likes}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSave(); }}
                    className="flex items-center gap-1.5 text-white/40 hover:text-violet-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                    <span className="text-xs">{currentCard.saves}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-xs">Share</span>
                  </button>
                </div>
              </div>

              {/* ── BACK — Answer ── */}
              <div className="rv-face rv-back absolute inset-0 bg-zinc-900 rounded-2xl flex flex-col overflow-hidden">
                <div className="p-5 pb-0">
                  {(currentCard.subject || currentCard.topic) && (
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {currentCard.subject && (
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                          {currentCard.subject}
                        </span>
                      )}
                      {currentCard.topic && (
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                          {currentCard.topic}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 pb-4 overflow-y-auto space-y-3">
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Answer</p>
                    <p className="text-lg text-white leading-relaxed">{currentCard.answer}</p>
                    {currentCard.explanation && (
                      <p className="text-sm text-white/55 mt-3 leading-relaxed">{currentCard.explanation}</p>
                    )}
                  </div>

                  {explanation ? (
                    <div className="bg-violet-900/30 border border-violet-700/40 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-2">Why you got this wrong</p>
                      <p className="text-sm text-violet-100 leading-relaxed">{explanation}</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleExplainMistake}
                      disabled={loadingExplanation}
                      className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/60 rounded-xl text-sm font-semibold text-zinc-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loadingExplanation ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          Explain my mistake
                        </>
                      )}
                    </button>
                  )}

                  <p className="text-white/25 text-center text-xs pt-1">swipe ← hard · easy →</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {isFlipped && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
          <div className="max-w-md mx-auto">
            <div className="grid grid-cols-4 gap-2">
              {([0, 2, 4, 5] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleRating(q)}
                  className={`${qualityBg(q)} text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm`}
                >
                  {QUALITY_LABELS[q]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
