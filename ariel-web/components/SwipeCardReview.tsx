'use client';

import { useState, useRef, useEffect } from 'react';
import { cardsAPI } from '@/lib/api';

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
  const cardRef = useRef<HTMLDivElement>(null);

  const currentCard = cards[currentIndex];

  useEffect(() => {
    // Reset answer visibility when card changes
    setShowAnswer(false);
    setSwipeDirection(null);
    setTouchOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const deltaX = e.touches[0].clientX - touchStart.x;
    const deltaY = e.touches[0].clientY - touchStart.y;

    setTouchOffset({ x: deltaX, y: deltaY });

    // Determine swipe direction based on offset
    if (Math.abs(deltaX) > 50) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleTouchEnd = async () => {
    if (!touchStart) return;

    const swipeThreshold = 100;

    if (Math.abs(touchOffset.x) > swipeThreshold) {
      // Swipe detected
      const quality = touchOffset.x > 0 ? 5 : 2; // Right = Easy (5), Left = Hard (2)

      try {
        // Submit review to backend
        await cardsAPI.reviewCard(currentCard.id, quality);
      } catch (error) {
        console.error('Failed to submit review:', error);
      }

      // Move to next card
      if (currentIndex < cards.length - 1) {
        setTimeout(() => {
          setCurrentIndex(currentIndex + 1);
        }, 300);
      } else {
        // All cards reviewed
        if (onComplete) onComplete();
      }
    }

    // Reset touch state
    setTouchStart(null);
    setTouchOffset({ x: 0, y: 0 });
    setSwipeDirection(null);
  };

  const handleRating = async (quality: number) => {
    try {
      await cardsAPI.reviewCard(currentCard.id, quality);

      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    }
  };

  const handleLike = async () => {
    try {
      await cardsAPI.likeCard(currentCard.id);
      // Update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex].likes += 1;
      setCards(updatedCards);
    } catch (error) {
      console.error('Failed to like card:', error);
    }
  };

  const handleSave = async () => {
    try {
      await cardsAPI.saveCardToDeck(currentCard.id);
      // Update local state
      const updatedCards = [...cards];
      updatedCards[currentIndex].saves += 1;
      setCards(updatedCards);
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  if (!currentCard) {
    return null;
  }

  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={onExit}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-medium">
            {currentIndex + 1}/{cards.length}
          </span>
        </div>
      </div>

      {/* Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-32">
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
          {/* Swipe Indicators */}
          {swipeDirection === 'left' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg z-20">
              HARD 😅
            </div>
          )}
          {swipeDirection === 'right' && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg z-20">
              EASY ✨
            </div>
          )}

          {/* Card */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Card Header */}
            <div className="p-6 pb-0">
              {currentCard.subject && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {currentCard.subject}
                  </span>
                  {currentCard.topic && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {currentCard.topic}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Card Content */}
            <div
              className="flex-1 flex flex-col justify-center p-8 cursor-pointer"
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <div className="text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {currentCard.question}
                </h2>

                {showAnswer && (
                  <div className="mt-8 animate-fadeIn">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                      <p className="text-lg text-white/90 mb-4">
                        {currentCard.answer}
                      </p>
                      {currentCard.explanation && (
                        <p className="text-sm text-white/70 leading-relaxed">
                          {currentCard.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!showAnswer && (
                  <p className="text-white/60 text-sm">Tap to reveal answer</p>
                )}
              </div>
            </div>

            {/* Card Footer - Social Actions */}
            <div className="p-6 pt-0">
              <div className="flex items-center justify-around text-white">
                <button
                  onClick={handleLike}
                  className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">{currentCard.likes}</span>
                </button>

                <button
                  onClick={handleSave}
                  className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                >
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">{currentCard.saves}</span>
                </button>

                <button className="flex flex-col items-center gap-1 hover:scale-110 transition-transform">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium">Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      {showAnswer && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-md mx-auto">
            <p className="text-white/80 text-center text-sm mb-4">How well did you know this?</p>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleRating(0)}
                className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Again
              </button>
              <button
                onClick={() => handleRating(2)}
                className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Hard
              </button>
              <button
                onClick={() => handleRating(4)}
                className="bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Good
              </button>
              <button
                onClick={() => handleRating(5)}
                className="bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Easy
              </button>
            </div>
            <p className="text-white/50 text-center text-xs mt-3">
              Or swipe left (hard) / right (easy)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
