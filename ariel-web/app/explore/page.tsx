'use client';

import { useState, useEffect, useRef } from 'react';
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
      // Fallback to trending if personalized fails
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
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-transparent bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-spin" style={{
            WebkitMaskImage: 'linear-gradient(transparent 50%, black 50%)',
            maskImage: 'linear-gradient(transparent 50%, black 50%)'
          }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full blur-xl opacity-50 animate-pulse-slow"></div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center">
        <div className="text-center animate-slideUp p-8">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl animate-float">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">No cards yet</h3>
          <p className="text-gray-600 text-lg max-w-md mx-auto">Be the first to create and share cards!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 animate-pulse-slow"></div>

      {/* Feed Mode Toggle - Top Left */}
      <div className="fixed top-6 left-6 z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-1 flex gap-1">
          <button
            onClick={() => setFeedMode('personalized')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              feedMode === 'personalized'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            ✨ For You
          </button>
          <button
            onClick={() => setFeedMode('trending')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              feedMode === 'trending'
                ? 'bg-white text-purple-900 shadow-lg'
                : 'text-white/70 hover:text-white'
            }`}
          >
            🔥 Trending
          </button>
        </div>
      </div>

      {/* Scrollable cards container - TikTok style */}
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
                className="w-full max-w-md h-[80vh] relative cursor-pointer group"
                onClick={() => toggleExpanded(card.id)}
              >
                {/* Main card surface */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50 to-pink-50 rounded-[3rem] shadow-2xl overflow-hidden transform transition-all duration-500 group-hover:scale-105">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse-slow"></div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {card.subject ? card.subject[0].toUpperCase() : '📚'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-base">
                            {card.subject || 'Study Card'}
                          </p>
                          {card.topic && (
                            <p className="text-sm text-gray-600">{card.topic}</p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg">
                        TRENDING
                      </div>
                    </div>

                    {/* Question */}
                    <div className="flex-1 flex items-center justify-center">
                      {!isExpanded ? (
                        <div className="text-center space-y-6 animate-scaleIn">
                          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl animate-float">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-relaxed px-4">
                            {card.question}
                          </h2>
                          <div className="flex items-center justify-center gap-2 text-gray-500">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Tap to reveal answer</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full space-y-6 animate-scaleIn">
                          {/* Answer card */}
                          <div className="glass rounded-3xl p-6 shadow-2xl border-2 border-purple-200">
                            <div className="flex items-start gap-4 mb-4">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-green-900 mb-2 uppercase tracking-wide">Answer</p>
                                <p className="text-gray-900 text-lg leading-relaxed font-semibold">
                                  {card.answer}
                                </p>
                              </div>
                            </div>
                            {card.explanation && (
                              <div className="mt-6 pt-6 border-t-2 border-purple-100">
                                <p className="text-sm font-bold text-purple-900 mb-3 uppercase tracking-wide">Why?</p>
                                <p className="text-gray-700 text-base leading-relaxed">
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
                            className="px-4 py-2 glass rounded-full text-purple-900 text-xs font-bold shadow-lg"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons - Right side like TikTok */}
                <div className="absolute right-4 bottom-32 flex flex-col gap-6">
                  {/* Like */}
                  <button
                    onClick={(e) => handleLike(card.id, e)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                      isLiked
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 scale-110'
                        : 'glass group-hover:scale-110'
                    }`}>
                      <svg
                        className={`w-7 h-7 ${isLiked ? 'text-white fill-current' : 'text-gray-700'}`}
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{card.likes}</span>
                  </button>

                  {/* Save */}
                  <button
                    onClick={(e) => handleSave(card.id, e)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                      isSaved
                        ? 'bg-gradient-to-br from-yellow-500 to-orange-500 scale-110'
                        : 'glass group-hover:scale-110'
                    }`}>
                      <svg
                        className={`w-7 h-7 ${isSaved ? 'text-white fill-current' : 'text-gray-700'}`}
                        fill={isSaved ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <span className="text-white text-xs font-bold drop-shadow-lg">{card.saves}</span>
                  </button>

                  {/* Share */}
                  <button className="flex flex-col items-center gap-1 group">
                    <div className="w-14 h-14 glass rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-all">
                      <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </div>
                  </button>
                </div>

                {/* Scroll indicator */}
                {index === 0 && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                    <span className="text-white text-sm font-semibold drop-shadow-lg">Swipe up</span>
                    <svg className="w-6 h-6 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNav />
      </div>
    </div>
  );
}
