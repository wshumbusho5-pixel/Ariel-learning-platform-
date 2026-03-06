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

interface SwipeCardReviewProps {
  initialCards: Card[];
  onComplete?: () => void;
  onExit?: () => void;
}

export default function SwipeCardReview({ initialCards, onComplete, onExit }: SwipeCardReviewProps) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 });
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentIndex];

  const resetCard = () => {
    setShowAnswer(false);
    setSwipeDirection(null);
    setTouchOffset({ x: 0, y: 0 });
    setExplanation(null);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;
    setTouchOffset({ x: deltaX, y: deltaY });
    setSwipeDirection(Math.abs(deltaX) > 50 ? (deltaX > 0 ? 'right' : 'left') : null);
  };

  const handleTouchEnd = async () => {
    if (!touchStart) return;
    if (Math.abs(touchOffset.x) > 100) {
      const quality = touchOffset.x > 0 ? 5 : 2;
      try { await cardsAPI.reviewCard(currentCard.id, quality); } catch {}
      if (currentIndex < cards.length - 1) {
        setTimeout(() => { setCurrentIndex(i => i + 1); resetCard(); }, 300);
      } else {
        onComplete?.();
      }
    }
    setTouchStart(null);
    setTouchOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const handleRating = async (quality: number) => {
    try { await cardsAPI.reviewCard(currentCard.id, quality); } catch {}
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      resetCard();
    } else {
      onComplete?.();
    }
  };

  const handleExplainMistake = async () => {
    if (loadingExplanation) return;
    setLoadingExplanation(true);
    try {
      const prompt = `A student got this flashcard wrong. Explain clearly and concisely why the correct answer is right, using a simple analogy or example if helpful. Keep it under 3 sentences.

Question: ${currentCard.question}
Correct answer: ${currentCard.answer}`;
      const res = await aiChatAPI.sendMessage(prompt);
      const text = typeof res?.reply === 'string' ? res.reply : JSON.stringify(res?.reply ?? '');
      setExplanation(text);
    } catch {
      setExplanation('Could not load explanation. Check your AI provider settings.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleLike = async () => {
    try {
      await cardsAPI.likeCard(currentCard.id);
      const updated = [...cards];
      updated[currentIndex].likes += 1;
      setCards(updated);
    } catch {}
  };

  const handleSave = async () => {
    try {
      await cardsAPI.saveCardToDeck(currentCard.id);
      const updated = [...cards];
      updated[currentIndex].saves += 1;
      setCards(updated);
    } catch {}
  };

  if (!currentCard) return null;

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between text-white">
          <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="text-sm font-medium">{currentIndex + 1}/{cards.length}</span>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-36">
        <div
          ref={cardRef}
          className="relative w-full max-w-md h-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateX(${touchOffset.x}px) translateY(${touchOffset.y}px) rotate(${touchOffset.x * 0.05}deg)`,
            transition: touchStart ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {swipeDirection === 'left' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg z-20">
              HARD
            </div>
          )}
          {swipeDirection === 'right' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg z-20">
              EASY
            </div>
          )}

          <div className="bg-zinc-900 rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="p-6 pb-0">
              {currentCard.subject && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                    {currentCard.subject}
                  </span>
                  {currentCard.topic && (
                    <span className="px-3 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                      {currentCard.topic}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div
              className="flex-1 flex flex-col justify-center p-8 cursor-pointer overflow-y-auto"
              onClick={() => !explanation && setShowAnswer(s => !s)}
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {currentCard.question}
                </h2>

                {showAnswer && (
                  <div className="mt-4 space-y-3 text-left">
                    <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
                      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-2">Answer</p>
                      <p className="text-lg text-white leading-relaxed">{currentCard.answer}</p>
                      {currentCard.explanation && (
                        <p className="text-sm text-white/60 mt-3 leading-relaxed">{currentCard.explanation}</p>
                      )}
                    </div>

                    {/* Explain My Mistake */}
                    {explanation ? (
                      <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-5">
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">Why you got this wrong</p>
                        <p className="text-sm text-emerald-100 leading-relaxed">{explanation}</p>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleExplainMistake(); }}
                        disabled={loadingExplanation}
                        className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-sm font-semibold text-zinc-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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
                  </div>
                )}

                {!showAnswer && (
                  <p className="text-white/50 text-sm">Tap to reveal answer</p>
                )}
              </div>
            </div>

            {/* Social */}
            <div className="p-6 pt-0">
              <div className="flex items-center justify-around text-white">
                <button onClick={handleLike} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </div>
                  <span className="text-xs">{currentCard.likes}</span>
                </button>
                <button onClick={handleSave} className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-xs">{currentCard.saves}</span>
                </button>
                <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-xs">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      {showAnswer && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
          <div className="max-w-md mx-auto">
            <p className="text-white/60 text-center text-xs mb-3">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => handleRating(0)} className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors">Again</button>
              <button onClick={() => handleRating(2)} className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors">Hard</button>
              <button onClick={() => handleRating(4)} className="bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors">Good</button>
              <button onClick={() => handleRating(5)} className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors">Easy</button>
            </div>
            <p className="text-white/30 text-center text-xs mt-3">or swipe left · right</p>
          </div>
        </div>
      )}
    </div>
  );
}
