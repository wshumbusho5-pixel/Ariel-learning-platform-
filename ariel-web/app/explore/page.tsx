'use client';

import { useState, useEffect } from 'react';
import { cardsAPI } from '@/lib/api';
import BottomNav from '@/components/BottomNav';

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
}

export default function ExplorePage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [savedCards, setSavedCards] = useState<Set<string>>(new Set());
  const [feedMode, setFeedMode] = useState<'personalized' | 'trending'>('personalized');

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
      if (feedMode === 'personalized') {
        try {
          const fallback = await cardsAPI.getTrendingCards(50);
          setCards(fallback);
        } catch (e) {
          console.error('Fallback also failed:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleSave = async (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const toggleExpanded = (cardId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId);
    } else {
      newExpanded.add(cardId);
    }
    setExpandedCards(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-spin" style={{ clipPath: 'inset(0 50% 0 0)' }}></div>
            <div className="absolute inset-2 rounded-full bg-white"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700 animate-pulse">Loading cards...</p>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="text-center animate-reveal">
          <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl animate-float">
            <span className="text-6xl">📚</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">No cards yet</h3>
          <p className="text-gray-600 text-lg">Be the first to create and share cards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        </div>
      </div>

      {/* Feed Mode Toggle */}
      <div className="fixed top-6 left-6 z-50 animate-reveal">
        <div className="glass-card rounded-2xl p-1.5 flex gap-1.5">
          <button
            onClick={() => setFeedMode('personalized')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all magnetic-btn ${
              feedMode === 'personalized'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            ✨ For You
          </button>
          <button
            onClick={() => setFeedMode('trending')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all magnetic-btn ${
              feedMode === 'trending'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🔥 Trending
          </button>
        </div>
      </div>

      {/* TikTok-style Vertical Feed */}
      <div className="relative snap-y snap-mandatory h-screen overflow-y-scroll">
        {cards.map((card, index) => {
          const isExpanded = expandedCards.has(card.id);
          const isLiked = likedCards.has(card.id);
          const isSaved = savedCards.has(card.id);

          return (
            <div
              key={card.id}
              className="snap-center h-screen w-full relative flex items-center justify-center p-6"
            >
              {/* Card */}
              <div
                className="w-full max-w-md h-[85vh] relative cursor-pointer group"
                onClick={() => toggleExpanded(card.id)}
              >
                {/* Main card with glassmorphism */}
                <div className="absolute inset-0 glass-card rounded-[3rem] overflow-hidden transition-all duration-500 group-hover:scale-[1.02] animate-reveal">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-purple-500/10 to-pink-500/10"></div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-xl">
                          <span className="text-white font-bold text-xl">
                            {card.subject ? card.subject[0].toUpperCase() : '📚'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg drop-shadow-lg">
                            {card.subject || 'Study Card'}
                          </p>
                          {card.topic && (
                            <p className="text-sm text-white/80 drop-shadow-lg">{card.topic}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                        HOT
                      </div>
                    </div>

                    {/* Question/Answer */}
                    <div className="flex-1 flex items-center justify-center">
                      {!isExpanded ? (
                        <div className="text-center space-y-6 animate-scaleIn">
                          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl animate-float">
                            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h2 className="text-3xl md:text-4xl font-bold text-white leading-relaxed px-4 drop-shadow-2xl">
                            {card.question}
                          </h2>
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-sm font-semibold text-white/90 drop-shadow-lg">Tap to reveal answer</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-6 animate-scaleIn">
                          {/* Answer card */}
                          <div className="glass-card rounded-3xl p-8 shadow-2xl">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-xl flex-shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-green-600 mb-3 uppercase tracking-wide">Answer</p>
                                <p className="text-white text-xl leading-relaxed font-semibold drop-shadow-lg">
                                  {card.answer}
                                </p>
                              </div>
                            </div>
                            {card.explanation && (
                              <div className="mt-6 pt-6 border-t-2 border-white/20">
                                <p className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wide">Why?</p>
                                <p className="text-white/90 text-base leading-relaxed drop-shadow-lg">
                                  {card.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {card.tags && card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-6">
                        {card.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-4 py-2 glass-card rounded-full text-white text-xs font-bold shadow-lg"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons - Right side TikTok style */}
                <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-10">
                  {/* Like */}
                  <button
                    onClick={(e) => handleLike(card.id, e)}
                    className="flex flex-col items-center gap-2 group magnetic-btn"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                      isLiked
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110'
                        : 'glass-card group-hover:scale-110'
                    }`}>
                      <svg
                        className={`w-8 h-8 ${isLiked ? 'text-white fill-current' : 'text-white'}`}
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-bold drop-shadow-lg">{card.likes}</span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={(e) => handleSave(card.id, e)}
                    className="flex flex-col items-center gap-2 group magnetic-btn"
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all ${
                      isSaved
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-110'
                        : 'glass-card group-hover:scale-110'
                    }`}>
                      <svg
                        className={`w-8 h-8 ${isSaved ? 'text-white fill-current' : 'text-white'}`}
                        fill={isSaved ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <span className="text-white text-sm font-bold drop-shadow-lg">{card.saves}</span>
                  </button>

                  {/* Share */}
                  <button className="flex flex-col items-center gap-2 group magnetic-btn">
                    <div className="w-16 h-16 glass-card rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-all">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Scroll indicator */}
                {index === 0 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-bounce">
                    <span className="text-white text-sm font-bold drop-shadow-lg">Swipe up for more</span>
                    <svg className="w-7 h-7 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
