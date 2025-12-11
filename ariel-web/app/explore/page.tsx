'use client';

import { useState, useEffect, useRef } from 'react';
import { cardsAPI } from '@/lib/api';
import ArielAssistant from '@/components/ArielAssistant';

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
  created_by?: {
    username: string;
    profile_picture?: string;
  };
}

export default function ExplorePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<'personalized' | 'trending'>('personalized');
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    loadCards();
  }, [feedMode]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = feedMode === 'personalized'
        ? await cardsAPI.getPersonalizedFeed(50)
        : await cardsAPI.getTrendingCards(50);
      setCards(data);
    } catch (error) {
      console.error('Failed to load cards:', error);
      try {
        const fallback = await cardsAPI.getTrendingCards(50);
        setCards(fallback);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (cardId: string) => {
    try {
      await cardsAPI.likeCard(cardId);
      setLikedCards(prev => new Set([...prev, cardId]));
      setCards(cards.map(card =>
        card.id === cardId ? { ...card, likes: card.likes + 1 } : card
      ));
    } catch (error) {
      console.error('Failed to like card:', error);
    }
  };

  const handleSave = async (cardId: string) => {
    try {
      await cardsAPI.saveCardToDeck(cardId);
      setSavedCards(prev => new Set([...prev, cardId]));
      setCards(cards.map(card =>
        card.id === cardId ? { ...card, saves: card.saves + 1 } : card
      ));
    } catch (error) {
      console.error('Failed to save card:', error);
    }
  };

  // Swipe detection for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 150) {
      // Swiped up - next card
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      }
    }

    if (touchStart - touchEnd < -150) {
      // Swiped down - previous card
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setShowAnswer(false);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setShowAnswer(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setShowAnswer(!showAnswer);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, cards.length, showAnswer]);

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="text-white text-sm font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-5xl">📚</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No cards yet</h3>
          <p className="text-gray-400">Check back soon for new content!</p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isLiked = likedCards.has(currentCard.id);
  const isSaved = savedCards.has(currentCard.id);

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full bg-black overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar - TikTok Style */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/50 to-transparent pt-safe">
        <div className="flex items-center justify-center gap-6 px-4 py-4">
          <button
            onClick={() => setFeedMode('personalized')}
            className={`text-lg font-semibold transition-all ${
              feedMode === 'personalized'
                ? 'text-white scale-110'
                : 'text-gray-400 scale-100'
            }`}
          >
            For You
          </button>
          <div className="w-px h-4 bg-gray-600"></div>
          <button
            onClick={() => setFeedMode('trending')}
            className={`text-lg font-semibold transition-all ${
              feedMode === 'trending'
                ? 'text-white scale-110'
                : 'text-gray-400 scale-100'
            }`}
          >
            Trending 🔥
          </button>
        </div>
      </div>

      {/* Main Card Display */}
      <div className="relative h-full w-full flex items-center justify-center p-4">
        {/* Card Container */}
        <div
          className="relative w-full max-w-md h-[85vh] cursor-pointer"
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {/* Background gradient based on subject */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black to-blue-900/40 rounded-3xl"></div>

          {/* Content */}
          <div className="relative h-full flex flex-col p-8">
            {/* Subject Badge */}
            <div className="flex items-center justify-between mb-6">
              {currentCard.subject && (
                <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20">
                  <p className="text-white text-sm font-semibold">{currentCard.subject}</p>
                </div>
              )}
              <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                <p className="text-white text-xs font-bold">LEARN</p>
              </div>
            </div>

            {/* Question/Answer Display */}
            <div className="flex-1 flex items-center justify-center">
              {!showAnswer ? (
                <div className="text-center space-y-6 animate-fadeIn">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight px-4">
                    {currentCard.question}
                  </h2>
                  <div className="flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm font-semibold text-white/90">Tap to reveal answer</span>
                  </div>
                </div>
              ) : (
                <div className="w-full space-y-4 animate-fadeIn">
                  {/* Answer Card */}
                  <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wide">Answer</p>
                        <p className="text-white text-lg leading-relaxed font-semibold">
                          {currentCard.answer}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  {currentCard.explanation && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                      <p className="text-xs font-bold text-purple-400 mb-2 uppercase tracking-wide">Why?</p>
                      <p className="text-white/90 text-base leading-relaxed">
                        {currentCard.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {currentCard.tags && currentCard.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {currentCard.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/10 backdrop-blur-xl rounded-full text-white text-xs font-semibold border border-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Creator Info - Bottom */}
            {currentCard.created_by && (
              <div className="flex items-center gap-3 mt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  {currentCard.created_by.profile_picture ? (
                    <img
                      src={currentCard.created_by.profile_picture}
                      alt={currentCard.created_by.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">
                      {currentCard.created_by.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">@{currentCard.created_by.username}</p>
                  {currentCard.topic && (
                    <p className="text-gray-400 text-xs">{currentCard.topic}</p>
                  )}
                </div>
                <button className="ml-auto px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full">
                  Follow
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Actions - TikTok Style */}
      <div className="absolute right-4 bottom-32 flex flex-col gap-5 z-40">
        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike(currentCard.id);
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isLiked
              ? 'bg-red-500 scale-110'
              : 'bg-white/10 backdrop-blur-xl border border-white/20'
          }`}>
            <svg
              className={`w-7 h-7 ${isLiked ? 'text-white fill-current' : 'text-white'}`}
              fill={isLiked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold">{currentCard.likes}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSave(currentCard.id);
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
            isSaved
              ? 'bg-yellow-500 scale-110'
              : 'bg-white/10 backdrop-blur-xl border border-white/20'
          }`}>
            <svg
              className={`w-7 h-7 ${isSaved ? 'text-white fill-current' : 'text-white'}`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold">{currentCard.saves}</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowComments(true);
          }}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-white text-xs font-bold">234</span>
        </button>

        {/* Share Button */}
        <button
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="absolute top-20 left-4 z-40">
        <div className="text-white text-xs font-semibold bg-black/50 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/20">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Swipe Hint - First Time */}
      {currentIndex === 0 && (
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce z-30">
          <span className="text-white text-sm font-semibold">Swipe up for next</span>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      )}

      <ArielAssistant />
    </div>
  );
}
